/**
 * Répartition des objectifs hebdomadaires sur les jours cochés au quiz.
 */

import { WEEK_DAYS as QUIZ_SCHEDULE_DAY_ORDER } from '../../utils/restDayUtils';
import { buildWeeklyRunBlockQueue } from './quizCardioSessionResolver';

const WEEKEND_DAYS = new Set(['samedi', 'dimanche']);

/**
 * @param {object} objectives
 * @param {string[]} checkedDayKeys — ordre calendaire recommandé
 * @param {object} answers
 */
export function allocateObjectivesToWeek(objectives, checkedDayKeys, answers = {}) {
  const keys = (checkedDayKeys || []).filter((k) => QUIZ_SCHEDULE_DAY_ORDER.includes(k));
  const byDay = {};
  keys.forEach((dayKey) => {
    byDay[dayKey] = { dayKey, active: true, obligations: [], hybridOrder: null };
  });

  if (!keys.length || !objectives) {
    return {
      days: byDay,
      activeDayKeys: keys,
      restDayKeys: [],
      underCovered: true,
      coverageWarningFr: 'Aucun jour coché au quiz.'
    };
  }

  const used = new Set();
  const runSessions = objectives.runPlan?.sessionsPerWeek || 0;
  const runBlocks = buildRunBlocksForWeek(objectives, runSessions, answers);

  if (runSessions > 0) {
    const runIndices = pickSpreadIndices(keys.length, runSessions);
    runIndices.forEach((idx, i) => {
      const dayKey = keys[idx];
      if (!dayKey) return;
      byDay[dayKey].obligations.push(runBlocks[i] || 'run_easy');
      used.add(dayKey);
    });
  }

  const needsPush = (objectives.muscleVolumeTargets?.chest || 0) > 0;
  const needsPull = (objectives.muscleVolumeTargets?.back || 0) > 0;
  const needsLegs =
    (objectives.muscleVolumeTargets?.quads || 0) + (objectives.muscleVolumeTargets?.hamstringsGlutes || 0) >
    0;
  const streetExposures = objectives.pullupPlan?.exposuresPerWeek || 0;

  if (needsPull) {
    const pullDay = pickDayForRole(keys, used, 'pull', answers);
    if (pullDay) {
      byDay[pullDay].obligations.push('force_pull');
      if (streetExposures > 0) {
        byDay[pullDay].obligations.unshift('skill_street');
      }
      used.add(pullDay);
      maybeAttachHybridRun(byDay, pullDay, answers, objectives);
    }
  }

  if (needsPush) {
    const pushDay = pickDayForRole(keys, used, 'push', answers);
    if (pushDay) {
      byDay[pushDay].obligations.push('force_push');
      used.add(pushDay);
    }
  }

  if (needsLegs) {
    const legsDay = pickDayForRole(keys, used, 'legs', answers);
    if (legsDay) {
      byDay[legsDay].obligations.push('force_legs');
      used.add(legsDay);
    }
  }

  if (streetExposures >= 2 && needsPull) {
    const extraStreet = pickDayForRole(keys, used, 'street', answers);
    if (extraStreet) {
      if (!byDay[extraStreet].obligations.includes('skill_street')) {
        byDay[extraStreet].obligations.push('skill_street');
      }
      if (!byDay[extraStreet].obligations.includes('force_pull')) {
        byDay[extraStreet].obligations.push('force_pull');
      }
      used.add(extraStreet);
    }
  }

  const minDays = objectives.minActiveDaysToCover || 2;
  const underCovered = keys.length < minDays;
  let coverageWarningFr = null;
  if (underCovered) {
    coverageWarningFr = `Seulement ${keys.length} jour(s) coché(s) pour couvrir ${minDays} créneaux recommandés (missions combinées).`;
  }

  return {
    days: byDay,
    activeDayKeys: keys,
    restDayKeys: [],
    underCovered,
    coverageWarningFr,
    allocationSummaryFr: summarizeAllocation(byDay, keys)
  };
}

function buildRunBlocksForWeek(objectives, sessionCount, answers) {
  const pseudoBudgets = {
    run: {
      intensitySplit: objectives.runPlan?.intensitySplit,
      maxQualitySessions: objectives.runPlan?.maxQualitySessions,
      runningSessionProfile: objectives.runPlan?.runningSessionProfile
    }
  };
  return buildWeeklyRunBlockQueue(pseudoBudgets, answers || {}, sessionCount);
}

function pickSpreadIndices(n, count) {
  if (count <= 0 || n <= 0) return [];
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    const idx =
      count === 1
        ? Math.floor((n - 1) / 2)
        : Math.round((i * (n - 1)) / Math.max(1, count - 1));
    indices.push(Math.min(n - 1, Math.max(0, idx)));
  }
  return [...new Set(indices)];
}

function pickDayForRole(keys, used, role, answers) {
  const candidates = keys.filter((k) => !used.has(k));
  if (!candidates.length) return null;

  if (role === 'street') {
    const weekend = candidates.filter((k) => WEEKEND_DAYS.has(k));
    if (weekend.length) return weekend[weekend.length - 1];
    return candidates[candidates.length - 1];
  }

  if (role === 'pull') {
    return candidates[0];
  }

  if (role === 'push') {
    const mid = candidates[Math.floor(candidates.length / 2)] || candidates[0];
    return mid;
  }

  if (role === 'legs') {
    const late = candidates.filter((k) => WEEKEND_DAYS.has(k) || k === 'vendredi');
    return late[0] || candidates[candidates.length - 1];
  }

  return candidates[0];
}

function maybeAttachHybridRun(byDay, pullDay, answers, objectives) {
  const addon = answers?.sameDayCardioAddon;
  if (addon === 'never' || !objectives.runPlan) return;
  const hybrid =
    answers?.hybridLayoutPreference === 'strength_then_cardio' ||
    answers?.hybridLayoutPreference === 'cardio_then_strength';
  if (!hybrid && addon !== 'often' && addon !== 'sometimes') return;
  if (!byDay[pullDay].obligations.some((b) => b.startsWith('run_'))) {
    byDay[pullDay].obligations.push('run_easy');
    byDay[pullDay].hybridOrder = 'strength_then_cardio';
  }
}

function summarizeAllocation(byDay, keys) {
  const parts = keys
    .filter((k) => byDay[k]?.obligations?.length)
    .map((k) => `${k}: ${byDay[k].obligations.join('+')}`);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Score de priorité pour conserver un jour si cap < jours cochés.
 * @param {object} dayAlloc
 */
export function scoreDayAllocationPriority(dayAlloc) {
  if (!dayAlloc?.obligations?.length) return 0;
  let score = 0;
  dayAlloc.obligations.forEach((b) => {
    if (b === 'force_push') score += 30;
    else if (b.startsWith('run_')) score += 25;
    else if (b === 'force_pull') score += 20;
    else if (b === 'force_legs') score += 15;
    else if (b === 'skill_street') score += 12;
    else if (b === 'force_core') score += 8;
  });
  if (WEEKEND_DAYS.has(dayAlloc.dayKey)) score += 5;
  return score;
}

/**
 * Applique le cap sur le schedule en conservant les jours à plus forte obligation.
 * @param {Record<string, object>} schedule
 * @param {number} prescribedActiveDays
 * @param {object} allocationResult — sortie allocateObjectivesToWeek
 * @returns {string[]} jours actifs conservés
 */
export function selectActiveDaysForCap(schedule, prescribedActiveDays, allocationResult) {
  const checked = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);
  if (!prescribedActiveDays || checked.length <= prescribedActiveDays) {
    return checked;
  }

  const scored = checked
    .map((dayKey) => ({
      dayKey,
      score: scoreDayAllocationPriority(allocationResult?.days?.[dayKey])
    }))
    .sort((a, b) => b.score - a.score || QUIZ_SCHEDULE_DAY_ORDER.indexOf(a.dayKey) - QUIZ_SCHEDULE_DAY_ORDER.indexOf(b.dayKey));

  const keep = new Set(scored.slice(0, prescribedActiveDays).map((s) => s.dayKey));

  QUIZ_SCHEDULE_DAY_ORDER.forEach((day) => {
    if (!schedule[day]) return;
    if (schedule[day].active && !keep.has(day)) {
      schedule[day] = {
        ...schedule[day],
        active: false,
        name: 'Repos',
        focus: 'Jour retiré : priorité aux autres créneaux pour couvrir tes objectifs hebdo.',
        exercises: [],
        etirements: { matin: [], midi: [], soir: [] }
      };
    }
  });

  return [...keep].sort(
    (a, b) => QUIZ_SCHEDULE_DAY_ORDER.indexOf(a) - QUIZ_SCHEDULE_DAY_ORDER.indexOf(b)
  );
}
