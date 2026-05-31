/**
 * Placement hebdomadaire v6 — blocs (force / run) avant choix des exercices.
 */

import { formatSessionDurationLabel, getSessionBudget } from './quizSessionDurationBudget';
import {
  SITE_LABELS,
  isGymSite,
  isHomeSite,
  isStreetSite,
  pickCardioSite,
  pickStrengthSiteForDay,
  resolveStrengthFamilyForDay
} from './quizSitePolicy';
import { resolveSameDayCardioFromDeformers } from './quizArchetype';
import { orderedMuscleGroups } from './quizSessionPlanner';
import { isStreetOrientedProfile } from './quizStreetSkillGoal';
import {
  applySpecializedSportPlacement,
  isSpecializedSportMission
} from './quizSpecializedSportPlacement';
import { hasProgramConstraint } from './quizProfileConstraints';

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

export const BLOCK_LABELS_FR = {
  force_pull: 'Tirage / dos',
  force_push: 'Poussée (pecs, épaules, triceps)',
  force_legs: 'Jambes',
  force_upper: 'Haut du corps',
  force_lower: 'Bas du corps',
  force_core: 'Core / gainage',
  run_easy: 'Course facile (endurance)',
  run_tempo: 'Tempo / seuil',
  run_interval: 'Fractionné / qualité',
  run_long: 'Sortie longue',
  cardio_general: 'Cardio général',
  skill_street: 'Skills street (tractions, dips, figures)',
  circuit_metabolic: 'Circuit métabolique / conditioning'
};

/** @typedef {'force_pull'|'force_push'|'force_legs'|'force_upper'|'force_lower'|'force_core'|'run_easy'|'run_tempo'|'run_interval'|'run_long'|'cardio_general'} BlockId */

function blockToGroups(blocks) {
  const groups = new Set();
  blocks.forEach((b) => {
    if (b.startsWith('run_') || b === 'cardio_general') groups.add('cardio');
    else if (b === 'force_legs' || b === 'force_lower') groups.add('lower');
    else if (b === 'force_core') groups.add('core');
    else groups.add('upper');
  });
  return [...groups];
}

function resolveStructure(answers, budgets) {
  const explicit = answers?.preferredWeeklyStructure;
  const allowed = new Set([
    'full_body',
    'upper_lower',
    'push_pull_legs',
    'running_focus',
    'hybrid_alternating',
    'bro_split'
  ]);
  if (explicit && allowed.has(explicit)) return explicit;
  return budgets?.defaultStructure || 'upper_lower';
}

function dedicatedCardioSlotCount(n, budgets, answers, deformers) {
  if (n <= 0) return 0;

  if (isSpecializedSportMission(budgets?.missionId)) {
    const cap = budgets?.cardioCapSessionsPerWeek ?? 3;
    const minStrength = Math.max(2, Math.min(n, budgets?.maxStrengthDays ?? 3));
    const maxCardio = Math.max(1, n - minStrength);
    return Math.min(cap, maxCardio, Math.max(0, n - 1));
  }

  const hasRunMission = Boolean(budgets?.run?.kmTarget);
  if (hasRunMission) {
    let slots = Math.min(
      Math.max(1, budgets.cardioCapSessionsPerWeek || 2),
      Math.max(1, n - 1)
    );
    if (n <= 3) slots = Math.min(slots, 1);
    if (deformers?.maxDedicatedCardioDays != null) {
      slots = Math.min(slots, deformers.maxDedicatedCardioDays);
    }
    return Math.max(1, Math.min(slots, n - 1));
  }

  const cardioDesire = answers?.cardioTrainingDesire || 'moderate';
  const desireMap = { minimal: 1, light: 2, moderate: 3, high: 4, priority_hiit: 5 };
  let target = desireMap[cardioDesire] ?? 3;
  if (deformers?.maxDedicatedCardioDays != null) {
    target = Math.min(target, deformers.maxDedicatedCardioDays);
  }
  if (HYPERTROPHY_GOALS.has(answers?.goalPhysique) && n >= 2) {
    target = Math.min(target, Math.max(1, Math.floor(n / 2)));
    target = Math.min(target, n - 1);
    if (n <= 3) target = Math.min(target, 1);
  }
  return Math.min(n, Math.max(0, target));
}

function pickCardioDayIndices(n, budgets, answers, deformers) {
  const count = dedicatedCardioSlotCount(n, budgets, answers, deformers);
  const indices = new Set();
  if (count <= 0 || n <= 0) return indices;
  for (let i = 0; i < count; i += 1) {
    const idx =
      count === 1
        ? Math.floor((n - 1) / 2)
        : Math.round((i * (n - 1)) / Math.max(1, count - 1));
    indices.add(Math.min(n - 1, Math.max(0, idx)));
  }
  return indices;
}

function canLongRun(answers) {
  const c = answers?.runningLongRunPossible;
  if (c === 'no') return false;
  return c === 'yes_flexible' || c === 'yes_weekend' || c === 'yes_weekday';
}

/** Préférence jour pour la sortie longue (null = placement automatique). */
function longRunDayPreference(answers) {
  const c = answers?.runningLongRunPossible;
  if (c === 'yes_weekend') return 'weekend';
  if (c === 'yes_weekday') return 'weekday';
  return null;
}

const WEEKEND_DAY_KEYS = new Set(['samedi', 'dimanche']);

function dayIndexMatchesPreference(dayKey, activeDayKeys, preference) {
  if (!preference || !dayKey) return true;
  const isWeekend = WEEKEND_DAY_KEYS.has(String(dayKey).toLowerCase());
  if (preference === 'weekend') return isWeekend;
  if (preference === 'weekday') return !isWeekend;
  return true;
}

/** Place `run_long` en priorité sur un jour cardio qui respecte la préférence. */
function assignLongRunToPreferredDay(days, activeDayKeys, answers) {
  const preference = longRunDayPreference(answers);
  if (!preference) return;

  let longDayKey = null;
  let longDayIndex = -1;
  activeDayKeys.forEach((dayKey, dayIndex) => {
    const plan = days[dayKey];
    if (!plan?.blocks?.includes('run_long')) return;
    longDayKey = dayKey;
    longDayIndex = dayIndex;
  });
  if (longDayKey == null || dayIndexMatchesPreference(longDayKey, activeDayKeys, preference)) return;

  const swapKey = activeDayKeys.find(
    (dayKey, dayIndex) =>
      dayIndex !== longDayIndex &&
      days[dayKey]?.modality === 'cardio' &&
      days[dayKey]?.blocks?.some((b) => b.startsWith('run_')) &&
      !days[dayKey]?.blocks?.includes('run_long') &&
      dayIndexMatchesPreference(dayKey, activeDayKeys, preference)
  );
  if (!swapKey) return;

  const longPlan = days[longDayKey];
  const swapPlan = days[swapKey];
  const swapBlock = swapPlan.blocks.find((b) => b.startsWith('run_')) || 'run_easy';
  days[longDayKey] = {
    ...longPlan,
    blocks: longPlan.blocks.map((b) => (b === 'run_long' ? swapBlock : b)),
    primaryBlock: longPlan.blocks.map((b) => (b === 'run_long' ? swapBlock : b))[0]
  };
  days[swapKey] = {
    ...swapPlan,
    blocks: swapPlan.blocks.map((b) => (b === swapBlock ? 'run_long' : b)),
    primaryBlock: 'run_long'
  };
}

/** Règle dure : pas de fractionné le lendemain d’un jour jambes lourdes. */
function enforceNoIntervalAfterLegs(days, activeDayKeys, answers) {
  if (!hasProgramConstraint(answers, 'no_interval_after_legs')) return;

  for (let i = 0; i < activeDayKeys.length - 1; i += 1) {
    const dayKey = activeDayKeys[i];
    const nextKey = activeDayKeys[i + 1];
    const plan = days[dayKey];
    const nextPlan = days[nextKey];
    if (!plan || !nextPlan) continue;

    const legsHeavy =
      plan.blocks?.includes('force_legs') || plan.blocks?.includes('force_lower');
    if (!legsHeavy || !nextPlan.blocks?.includes('run_interval')) continue;

    days[nextKey] = {
      ...nextPlan,
      blocks: nextPlan.blocks.map((b) => (b === 'run_interval' ? 'run_tempo' : b)),
      primaryBlock: nextPlan.primaryBlock === 'run_interval' ? 'run_tempo' : nextPlan.primaryBlock
    };
  }
}

function buildRunBlockQueue(budgets, answers, runDayCount) {
  const queue = [];
  const split = budgets?.run?.intensitySplit;
  const easyW = split?.easy ?? 0.7;
  const tempoW = split?.tempo ?? 0.2;
  const intW = split?.intervals ?? 0.1;

  const nEasy = Math.max(1, Math.round(runDayCount * easyW));
  const nQuality = Math.max(1, Math.round(runDayCount * (tempoW + intW)));
  const nLong = canLongRun(answers) && runDayCount >= 2 ? 1 : 0;

  for (let i = 0; i < nEasy; i += 1) queue.push('run_easy');
  for (let i = 0; i < nQuality; i += 1) {
    queue.push(i % 2 === 0 ? 'run_interval' : 'run_tempo');
  }
  if (nLong) queue.push('run_long');

  while (queue.length < runDayCount && runDayCount > 0) {
    queue.push('run_easy');
  }
  let out = queue.slice(0, runDayCount);
  if (nLong && !out.includes('run_long')) {
    out = out.length > 0 ? [...out.slice(0, -1), 'run_long'] : ['run_long'];
  }
  return out;
}

function strengthBlocksForSlot(slot, structure, ordered) {
  const group = ordered[slot % ordered.length];
  if (structure === 'push_pull_legs') {
    if (group === 'lower') return ['force_legs'];
    if (group === 'core') return ['force_core'];
    return slot % 2 === 0 ? ['force_pull'] : ['force_push'];
  }
  if (structure === 'full_body') {
    return ['force_upper', 'force_legs'];
  }
  if (group === 'lower') return ['force_legs'];
  if (group === 'core') return ['force_core'];
  return slot % 2 === 0 ? ['force_pull'] : ['force_push'];
}

/**
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @param {object} budgets — sortie buildWeeklyBudgets
 * @param {object} [deformers]
 */
export function buildWeekPlacement(activeDayKeys, answers, budgets, deformers = null) {
  const n = activeDayKeys.length;
  const structure = resolveStructure(answers, budgets);
  const cardioIndices = pickCardioDayIndices(n, budgets, answers, deformers);
  const ordered = orderedMuscleGroups(answers);
  const hasRun = Boolean(budgets?.run?.kmTarget);

  const strengthIndices = [];
  for (let i = 0; i < n; i += 1) {
    if (!cardioIndices.has(i)) strengthIndices.push(i);
  }

  const runQueue = hasRun
    ? buildRunBlockQueue(budgets, answers, Math.max(2, cardioIndices.size + (structure === 'running_focus' ? 1 : 0)))
    : [];
  let runQueueIdx = 0;

  const days = {};
  activeDayKeys.forEach((dayKey, dayIndex) => {
    if (cardioIndices.has(dayIndex)) {
      const block = runQueue[runQueueIdx] || (hasRun ? 'run_easy' : 'cardio_general');
      if (hasRun) runQueueIdx += 1;
      days[dayKey] = {
        dayIndex,
        blocks: [block],
        primaryBlock: block,
        modality: 'cardio',
        groups: ['cardio'],
        structure
      };
      return;
    }

    const slot = strengthIndices.indexOf(dayIndex);
    let blocks = strengthBlocksForSlot(slot >= 0 ? slot : dayIndex, structure, ordered);

    if (
      isStreetOrientedProfile(answers) &&
      slot === 0 &&
      blocks.some((b) => ['force_pull', 'force_push', 'force_upper'].includes(b))
    ) {
      blocks = ['skill_street', ...blocks.filter((b) => b !== 'skill_street')];
    }

    if (hasRun && structure === 'hybrid_alternating' && slot === strengthIndices.length - 1 && runQueueIdx < runQueue.length) {
      blocks = [...blocks, runQueue[runQueueIdx]];
      runQueueIdx += 1;
    }

    if (structure === 'running_focus' && hasRun && slot === 0 && runQueueIdx < runQueue.length) {
      blocks = [runQueue[runQueueIdx], ...blocks.slice(0, 1)];
      runQueueIdx += 1;
    }

    days[dayKey] = {
      dayIndex,
      blocks,
      primaryBlock: blocks[0],
      modality: 'strength',
      groups: blockToGroups(blocks),
      structure
    };
  });

  const runBlocksPlaced = Object.values(days).reduce(
    (acc, d) => acc + d.blocks.filter((b) => b.startsWith('run_')).length,
    0
  );

  const parts = [
    `Structure : ${structure}`,
    `${strengthIndices.length} j force, ${cardioIndices.size} j cardio`,
    hasRun ? `${runBlocksPlaced} blocs course` : null
  ].filter(Boolean);

  assignLongRunToPreferredDay(days, activeDayKeys, answers);
  enforceNoIntervalAfterLegs(days, activeDayKeys, answers);

  let result = {
    structure,
    cardioDayCount: cardioIndices.size,
    strengthDayCount: strengthIndices.length,
    runBlocksPlaced,
    days,
    placementSummaryFr: parts.join(' · ')
  };

  const missionId = budgets?.missionId;
  if (isSpecializedSportMission(missionId)) {
    result = applySpecializedSportPlacement(result, missionId, answers);
  }

  return result;
}

function profileTitleForBlocks(blocks, site, withAddon, answers) {
  const siteLabel = SITE_LABELS[site] || site;
  const labels = blocks.map((b) => BLOCK_LABELS_FR[b] || b).join(' + ');
  let prefix = 'Force';
  if (isStreetSite(site)) prefix = 'Street workout';
  else if (isHomeSite(site)) prefix = 'Maison';
  else if (isGymSite(site)) prefix = 'Musculation';
  if (blocks.includes('circuit_metabolic') && !blocks.some((b) => b.startsWith('run_'))) {
    return `Conditioning — ${labels}`;
  }
  if (blocks.some((b) => b.startsWith('run_') || b === 'cardio_general')) {
    return `Course — ${labels}`;
  }
  if (withAddon) return `${prefix} + cardio — ${siteLabel}`;
  return `${prefix} — ${labels}`;
}

/**
 * Fusionne le placement v6 dans les profils v5 (exos inchangés).
 */
export function applyWeekPlacementToProfiles(profiles, placement, answers, deformers = null, seriesHints = null) {
  if (!placement?.days || !profiles) return profiles;
  const remainingByDay = seriesHints?.remainingSetsByDay || placement?.remainingSetsByDay || null;
  const out = { ...profiles };
  const addonAllowed =
    resolveSameDayCardioFromDeformers(answers, deformers) &&
    !(HYPERTROPHY_GOALS.has(answers?.goalPhysique) && placement.cardioDayCount >= 1);

  Object.keys(placement.days).forEach((dayKey) => {
    const plan = placement.days[dayKey];
    const prev = out[dayKey];
    if (!plan) return;
    if (!prev) {
      const siteNew = plan.blocks?.includes('skill_street')
        ? 'outdoor'
        : pickStrengthSiteForDay(plan.dayIndex, answers);
      out[dayKey] = {
        modality: plan.modality,
        groups: plan.groups,
        blocks: plan.blocks,
        primaryBlock: plan.primaryBlock,
        weeklyStructure: placement.structure,
        site: siteNew,
        siteFamily:
          plan.modality === 'cardio'
            ? 'cardio'
            : plan.blocks?.includes('skill_street')
              ? 'street'
              : resolveStrengthFamilyForDay(plan.dayIndex, answers),
        title: profileTitleForBlocks(plan.blocks, pickStrengthSiteForDay(plan.dayIndex, answers), false, answers),
        focus: plan.blocks.map((b) => BLOCK_LABELS_FR[b] || b).join(', '),
        remainingSets: remainingByDay?.[dayKey] || null
      };
      return;
    }

    let site = prev.site || pickStrengthSiteForDay(plan.dayIndex, answers);
    if (plan.blocks?.includes('skill_street')) {
      site = 'outdoor';
    }
    const withAddon =
      addonAllowed &&
      plan.modality === 'strength' &&
      !plan.blocks.some((b) => b.startsWith('run_'));

    const modality =
      plan.modality === 'cardio'
        ? 'cardio'
        : withAddon
          ? 'strength_plus_cardio'
          : 'strength';

    const focusLabels = plan.blocks.map((b) => BLOCK_LABELS_FR[b] || b).join(', ');

    out[dayKey] = {
      ...prev,
      modality,
      site,
      siteFamily: plan.modality === 'cardio' ? 'cardio' : resolveStrengthFamilyForDay(plan.dayIndex, answers),
      groups: plan.groups,
      blocks: plan.blocks,
      primaryBlock: plan.primaryBlock,
      weeklyStructure: placement.structure,
      cardioAddon: withAddon,
      title: profileTitleForBlocks(plan.blocks, site, withAddon, answers),
      focus:
        modality === 'cardio'
          ? `Bloc(s) : ${focusLabels}`
          : withAddon
            ? `${focusLabels} puis cardio (~${Math.max(10, Math.round(getSessionBudget(answers).targetMin / 2))} min)`
            : `Blocs : ${focusLabels} · ${formatSessionDurationLabel(answers)}`,
      remainingSets: remainingByDay?.[dayKey] || null
    };
  });
  return out;
}

/**
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @param {Record<string, object>} profiles
 * @param {object} weeklyPlan — coachContext.weeklyPlan
 * @param {object} [deformers]
 */
export function enrichWeekProfilesFromWeeklyPlan(activeDayKeys, answers, profiles, weeklyPlan, deformers = null) {
  const budgets = weeklyPlan?.budgets;
  if (!budgets) return profiles;
  const placement = buildWeekPlacement(activeDayKeys, answers, budgets, deformers);
  return applyWeekPlacementToProfiles(profiles, placement, answers, deformers);
}
