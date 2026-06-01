/**
 * SPEC §6.5 — hybridLayoutPreference (jours séparés vs course+muscu même jour).
 */

import { isHybridRunAndStrength } from './quizQuestionVisibility';

/** @param {string|null|undefined} pref */
export function isStrengthThenRunHybridPref(pref) {
  return pref === 'same_day_strength_then_run' || pref === 'same_day_easy_run';
}

/** @param {string|null|undefined} pref */
export function isRunThenStrengthHybridPref(pref) {
  return pref === 'same_day_run_then_lift';
}

function primaryStrengthBlock(blocks) {
  return (
    blocks.find(
      (b) =>
        b.startsWith('force_') ||
        b === 'skill_street' ||
        b === 'circuit_metabolic'
    ) || blocks[0]
  );
}

/**
 * @param {object} placement
 * @param {object} answers
 */
export function applyHybridLayoutPreference(placement, answers) {
  if (!placement?.days || !isHybridRunAndStrength(answers)) return placement;

  const pref = answers?.hybridLayoutPreference || 'separate_days';
  if (pref === 'separate_days') return placement;

  const dayKeys = Object.keys(placement.days).sort(
    (a, b) => (placement.days[a].dayIndex ?? 0) - (placement.days[b].dayIndex ?? 0)
  );

  const strengthDays = dayKeys.filter((k) => placement.days[k]?.modality === 'strength');
  const cardioDays = dayKeys.filter((k) => placement.days[k]?.modality === 'cardio');
  if (!strengthDays.length || !cardioDays.length) return placement;

  const runBlock =
    isRunThenStrengthHybridPref(pref)
      ? cardioDays
          .map((k) => placement.days[k]?.primaryBlock)
          .find((b) => b?.startsWith('run_')) || 'run_easy'
      : 'run_easy';

  let merged = 0;
  const maxMerge = Math.min(strengthDays.length, Math.ceil(cardioDays.length / 2));

  strengthDays.slice(0, maxMerge).forEach((dayKey) => {
    const plan = placement.days[dayKey];
    if (!plan?.blocks?.length) return;
    if (plan.blocks.some((b) => b.startsWith('run_') || b.startsWith('swim_') || b.startsWith('bike_'))) {
      return;
    }

    const blocks = isRunThenStrengthHybridPref(pref)
      ? [runBlock, ...plan.blocks]
      : [...plan.blocks, runBlock];
    plan.blocks = blocks;
    plan.primaryBlock = isRunThenStrengthHybridPref(pref) ? runBlock : primaryStrengthBlock(blocks);
    plan.modality = 'hybrid';
    plan.hybridExerciseOrder = isRunThenStrengthHybridPref(pref) ? 'run_then_strength' : 'strength_then_run';
    plan.groups = ['upper', 'lower', 'core', 'cardio'].filter((g) => {
      if (g === 'cardio') return true;
      return plan.blocks.some((b) => {
        if (g === 'lower') return b === 'force_legs' || b === 'force_lower';
        if (g === 'core') return b === 'force_core';
        return b.startsWith('force_') || b === 'skill_street';
      });
    });
    merged += 1;
  });

  if (!merged) return placement;

  let cardioIdx = 0;
  cardioDays.forEach((dayKey) => {
    if (cardioIdx >= merged) return;
    const plan = placement.days[dayKey];
    if (!plan) return;
    placement.days[dayKey] = {
      ...plan,
      blocks: ['cardio_general'],
      primaryBlock: 'cardio_general',
      modality: 'cardio',
      groups: ['cardio'],
      deferredFromHybridMerge: true
    };
    cardioIdx += 1;
  });

  const labelByPref = {
    same_day_strength_then_run: 'muscu/street puis course en fin (même jour)',
    same_day_easy_run: 'course facile après muscu (même jour)',
    same_day_run_then_lift: 'course puis muscu (même jour)'
  };
  const label = labelByPref[pref] || 'hybride même jour';

  return {
    ...placement,
    hybridLayoutApplied: pref,
    placementSummaryFr: `${placement.placementSummaryFr || ''} · ${label} (${merged} j.)`.trim()
  };
}
