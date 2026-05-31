/**
 * Estimation km hebdo planifiés + validation cible v6 (phase 6).
 */

import { BLOCK_LABELS_FR } from './quizWeekPlacement';

/** km typiques par bloc (ordre de grandeur métier). */
const BLOCK_KM_DEFAULT = {
  run_easy: 7,
  run_tempo: 8,
  run_interval: 6,
  run_long: 14,
  cardio_general: 4
};

const PACE_MIN_PER_KM = {
  run_easy: 6.2,
  run_tempo: 5.4,
  run_interval: 5,
  run_long: 6,
  cardio_general: 7
};

function parseMinutesFromSeries(series) {
  const s = String(series || '');
  const range = s.match(/(\d+)\s*[–-]\s*(\d+)\s*min/i);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const single = s.match(/(\d+)\s*min/i);
  if (single) return Number(single[1]);
  const intervals = s.match(/(\d+)\s*×/);
  if (intervals && /fractionné|intervalle/i.test(s)) return Number(intervals[1]) * 3;
  return null;
}

function minutesToKm(minutes, blockId) {
  if (minutes == null || minutes <= 0) return null;
  const pace = PACE_MIN_PER_KM[blockId] || 6;
  return Math.round((minutes / pace) * 10) / 10;
}

function inferBlockFromExercise(dbKey, name) {
  const blob = `${dbKey} ${name}`.toLowerCase();
  if (/fractionné|fractionne|intervalle|vma/.test(blob)) return 'run_interval';
  if (/course|endurance|fondamental|footing/.test(blob)) return 'run_easy';
  return 'cardio_general';
}

/**
 * @param {object} exercise
 * @param {string} [blockId]
 */
export function estimateExerciseKm(exercise, blockId = null) {
  const block = blockId || inferBlockFromExercise(exercise?.exerciseBankKey, exercise?.name);
  const mins = parseMinutesFromSeries(exercise?.series);
  if (mins != null) return minutesToKm(mins, block) ?? BLOCK_KM_DEFAULT[block] ?? 3;
  return BLOCK_KM_DEFAULT[block] ?? 3;
}

/**
 * @param {object} profile
 * @param {object} [daySlot]
 */
export function estimateDayPlannedKm(profile, daySlot = null) {
  const blocks = profile?.blocks || [];
  const runBlocks = blocks.filter((b) => b.startsWith('run_') || b === 'cardio_general');

  if (runBlocks.length) {
    return runBlocks.reduce((sum, b) => sum + (BLOCK_KM_DEFAULT[b] ?? 4), 0);
  }

  const exercises = daySlot?.exercises || [];
  let km = 0;
  exercises.forEach((ex) => {
    const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
    if (!/course|fractionné|fractionne|corde|burpee|cardio|endurance/.test(blob)) return;
    km += estimateExerciseKm(ex, profile?.primaryBlock);
  });
  return Math.round(km * 10) / 10;
}

/**
 * @param {object} schedule
 * @param {string[]} activeDayKeys
 * @param {Record<string, object>} weekProfiles
 */
export function estimateWeeklyPlannedKm(schedule, activeDayKeys, weekProfiles) {
  const byDay = {};
  let total = 0;
  activeDayKeys.forEach((dayKey) => {
    const profile = weekProfiles?.[dayKey];
    const day = schedule?.[dayKey];
    const km = estimateDayPlannedKm(profile, day);
    if (km > 0) {
      byDay[dayKey] = km;
      total += km;
    }
  });
  return { totalKm: Math.round(total * 10) / 10, byDay };
}

/**
 * @param {number|null} targetKm
 * @param {number} plannedKm
 * @param {object} [opts]
 */
export function cardioConflictCheck(targetKm, plannedKm, opts = {}) {
  const tolerance = opts.tolerance ?? 0.28;
  if (targetKm == null || targetKm <= 0) {
    return {
      aligned: true,
      targetKm: null,
      plannedKm,
      deltaKm: 0,
      deltaPct: 0,
      reasonFr: 'Pas de cible km hebdo (mission non course).',
      warningFr: null
    };
  }

  const deltaKm = Math.round((plannedKm - targetKm) * 10) / 10;
  const deltaPct = targetKm > 0 ? Math.round((Math.abs(deltaKm) / targetKm) * 100) : 0;
  const aligned = Math.abs(deltaKm) / targetKm <= tolerance;

  let reasonFr = `Planifié ~${plannedKm} km vs cible ~${targetKm} km (écart ${deltaKm >= 0 ? '+' : ''}${deltaKm} km).`;
  let warningFr = null;

  if (!aligned) {
    if (plannedKm < targetKm * (1 - tolerance)) {
      warningFr = `Volume course planifié (~${plannedKm} km) inférieur à la cible (~${targetKm} km) — séances ou durées à renforcer.`;
    } else {
      warningFr = `Volume course planifié (~${plannedKm} km) au-dessus de la cible (~${targetKm} km) — risque surcharge vs récupération.`;
    }
  } else {
    reasonFr = `Volume course aligné : ~${plannedKm} km pour une cible ~${targetKm} km.`;
  }

  return {
    aligned,
    targetKm,
    plannedKm,
    deltaKm,
    deltaPct,
    reasonFr,
    warningFr
  };
}

/**
 * @param {object} profile
 * @param {number} [dayKm]
 */
export function formatDayCardioLabel(profile, dayKm = null) {
  const blocks = profile?.blocks || [];
  const runBlock = blocks.find((b) => b.startsWith('run_') || b === 'cardio_general');
  if (!runBlock) return null;

  const label = BLOCK_LABELS_FR[runBlock] || runBlock;
  const km = dayKm != null ? dayKm : BLOCK_KM_DEFAULT[runBlock];
  return `${label} · ~${km} km`;
}

/**
 * @param {object} budgets — weeklyPlan.budgets
 * @param {{ totalKm: number, byDay: Record<string, number> }} planned
 */
export function buildWeeklyRunSummaryFr(budgets, planned) {
  const target = budgets?.run?.kmTarget;
  if (target == null) return null;

  const parts = [`Course ~${planned.totalKm} km planifiés cette semaine`];
  if (target) parts[0] += ` (cible ~${target} km)`;
  const range = budgets?.run?.kmRange;
  if (range?.length === 2) parts.push(`fourchette ${range[0]}–${range[1]} km`);
  return parts.join(' · ');
}

/**
 * @param {object} budgets
 */
export function buildWeeklyStrengthSummaryFr(budgets) {
  const sf = budgets?.strengthFamilies;
  if (!sf) return null;
  const parts = [];
  if (sf.pull) parts.push(`dos ~${Math.round(sf.pull)} séries`);
  if (sf.push) parts.push(`poussée ~${Math.round(sf.push)} séries`);
  if (sf.legs) parts.push(`jambes ~${Math.round(sf.legs)} séries`);
  return parts.length ? `Force : ${parts.join(', ')} / sem` : null;
}

/**
 * @param {object} coachContext
 * @param {object} schedule
 * @param {string[]} activeDayKeys
 * @param {Record<string, object>} weekProfiles
 */
export function attachWeeklyCardioKmToCoachContext(
  coachContext,
  schedule,
  activeDayKeys,
  weekProfiles
) {
  const budgets = coachContext?.weeklyPlan?.budgets;
  const planned = estimateWeeklyPlannedKm(schedule, activeDayKeys, weekProfiles);
  const check = cardioConflictCheck(budgets?.run?.kmTarget ?? null, planned.totalKm);

  const runSummaryFr = buildWeeklyRunSummaryFr(budgets, planned);
  const strengthSummaryFr = buildWeeklyStrengthSummaryFr(budgets);

  coachContext.weeklyPlan = {
    ...coachContext.weeklyPlan,
    phase: 'v6_phase6_presentation',
    plannedKm: planned,
    cardioKmCheck: check,
    runSummaryFr,
    strengthSummaryFr
  };

  if (check.warningFr) {
    coachContext.warnings = [...(coachContext.warnings || []), check.warningFr];
  }

  return { planned, check, runSummaryFr, strengthSummaryFr };
}

/**
 * Enrichit focus des jours actifs avec libellé km/bloc.
 */
export function enrichScheduleDayFocusWithKm(schedule, weekProfiles, activeDayKeys) {
  activeDayKeys.forEach((dayKey) => {
    const slot = schedule?.[dayKey];
    const profile = weekProfiles?.[dayKey];
    if (!slot?.active || !profile) return;
    const dayKm = estimateDayPlannedKm(profile, slot);
    const cardioLabel = formatDayCardioLabel(profile, dayKm);
    if (!cardioLabel) return;
    const base = slot.focus || profile.focus || '';
    if (base.includes('~') && base.includes('km')) return;
    slot.focus = base ? `${base} · ${cardioLabel}` : cardioLabel;
  });
}
