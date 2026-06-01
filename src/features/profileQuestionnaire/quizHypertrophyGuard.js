/**
 * Garde-fous placement hypertrophie (push / pull / legs).
 */

import { BLOCK_LABELS_FR } from './quizWeekPlacement';
import { isHypertrophyGoal } from './quizStrengthBaselines';
import { feasibilityCheck } from './quizWeeklySeriesAllocator';

function clonePlacement(placement) {
  const days = {};
  Object.entries(placement?.days || {}).forEach(([k, d]) => {
    days[k] = { ...d, blocks: [...(d.blocks || [])] };
  });
  return { ...placement, days };
}

function dayHasBlock(day, blockId) {
  return (day?.blocks || []).includes(blockId);
}

/**
 * Garantit au moins un jour force_push si objectif pecs.
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} [weeklyObjectives]
 */
export function ensureHypertrophyPlacementCoverage(
  placement,
  activeDayKeys,
  weeklyObjectives = null,
  answers = null
) {
  if (!placement?.days || !activeDayKeys?.length) return placement;
  const chestTarget = weeklyObjectives?.muscleVolumeTargets?.chest || 0;
  if (chestTarget <= 0 && !isHypertrophyGoal(answers)) return placement;

  const needsPush = chestTarget > 0 || isHypertrophyGoal(answers);
  const needsPull = (weeklyObjectives?.muscleVolumeTargets?.back || 0) > 0;
  const needsLegs =
    (weeklyObjectives?.muscleVolumeTargets?.quads || 0) +
      (weeklyObjectives?.muscleVolumeTargets?.hamstringsGlutes || 0) >
    0;

  let next = clonePlacement(placement);
  let changed = false;

  const hasPush = activeDayKeys.some((k) => dayHasBlock(next.days[k], 'force_push'));
  const hasPull = activeDayKeys.some((k) => {
    const b = next.days[k]?.blocks || [];
    return b.includes('force_pull') || b.includes('force_upper');
  });
  const hasLegs = activeDayKeys.some((k) => dayHasBlock(next.days[k], 'force_legs'));

  const injectBlock = (dayKey, blockId) => {
    if (!next.days[dayKey]) return;
    const blocks = [...(next.days[dayKey].blocks || [])];
    if (blocks.includes(blockId)) return;
    blocks.unshift(blockId);
    changed = true;
    next.days[dayKey] = {
      ...next.days[dayKey],
      blocks,
      primaryBlock: blockId,
      modality: blockId.startsWith('run_') ? next.days[dayKey].modality : 'strength'
    };
  };

  if (needsPush && !hasPush) {
    const target =
      activeDayKeys.find((k) => placement.days[k]?.modality === 'strength') ||
      activeDayKeys[Math.floor(activeDayKeys.length / 2)] ||
      activeDayKeys[0];
    injectBlock(target, 'force_push');
  }

  if (needsPull && !hasPull) {
    const target = activeDayKeys.find((k) => placement.days[k]?.modality !== 'cardio') || activeDayKeys[0];
    injectBlock(target, 'force_pull');
  }

  if (needsLegs && !hasLegs) {
    const target =
      activeDayKeys.find((k) => !dayHasBlock(placement.days[k], 'force_push')) ||
      activeDayKeys[activeDayKeys.length - 1];
    injectBlock(target, 'force_legs');
  }

  if (!changed) return placement;

  const summary = [
    placement.placementSummaryFr,
    'Ajustement : couverture push/pull/jambes imposée par objectifs hypertrophie.'
  ]
    .filter(Boolean)
    .join(' · ');
  return { ...next, placementSummaryFr: summary, hypertrophyGuardApplied: true };
}

/**
 * @param {object} placement
 * @param {string[]} activeDayKeys
 */
/**
 * Replan structurel si faisabilité échoue (ex. pecs sans jour push).
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} budgets
 * @param {object} answers
 * @param {object} [weeklyObjectives]
 */
export function replanStructureForFeasibility(
  placement,
  activeDayKeys,
  budgets,
  answers,
  weeklyObjectives = null
) {
  if (!placement?.days || !budgets?.strengthFamilies) {
    return { placement, applied: false, replanSummaryFr: null, feasible: true, decisions: [] };
  }

  const opts = { weeklyObjectives };
  let next = placement;
  let feas = feasibilityCheck(budgets, next, answers, opts);
  if (feas.feasible) {
    return { placement: next, applied: false, replanSummaryFr: null, feasible: true, decisions: [] };
  }

  const missingPush = feas.decisions.some((d) => d.action === 'missing_push_day');
  if (!missingPush) {
    return {
      placement: next,
      applied: false,
      replanSummaryFr: null,
      feasible: feas.feasible,
      decisions: feas.decisions
    };
  }

  let applied = false;
  const decisions = [];

  next = ensureHypertrophyPlacementCoverage(next, activeDayKeys, weeklyObjectives, answers);
  if (next.hypertrophyGuardApplied) {
    applied = true;
    decisions.push({
      action: 'replan_hypertrophy_guard',
      reasonFr: 'Garde-fou hypertrophie : jour poussée / tirage / jambes imposé par objectifs.'
    });
  }

  feas = feasibilityCheck(budgets, next, answers, opts);
  if (!feas.decisions.some((d) => d.action === 'missing_push_day')) {
    return {
      placement: next,
      applied,
      replanSummaryFr:
        decisions[0]?.reasonFr ||
        'Replan structure : couverture poussée rétablie pour les objectifs pecs.',
      feasible: feas.feasible,
      decisions: feas.decisions
    };
  }

  const cloned = clonePlacement(next);
  for (const dayKey of activeDayKeys) {
    const day = cloned.days[dayKey];
    if (!day) continue;
    const blocks = [...(day.blocks || [])];
    if (blocks.includes('force_push')) continue;
    const isCardioOnly = blocks.length > 0 && blocks.every((b) => b.startsWith('run_') || b === 'cardio_general');
    if (isCardioOnly) continue;
    if (blocks.includes('force_pull') || blocks.includes('force_upper')) {
      const newBlocks = ['force_push', ...blocks.filter((b) => b !== 'force_push')];
      cloned.days[dayKey] = {
        ...day,
        blocks: newBlocks,
        primaryBlock: 'force_push',
        modality: 'strength'
      };
      applied = true;
      decisions.push({
        action: 'replan_force_push_on_pull_day',
        dayKey,
        reasonFr: `Replan : ${dayKey} inclut désormais un bloc poussée (objectif pecs).`
      });
      break;
    }
  }

  if (applied) {
    next = cloned;
    feas = feasibilityCheck(budgets, next, answers, opts);
  }

  return {
    placement: next,
    applied,
    replanSummaryFr: applied
      ? decisions.find((d) => d.reasonFr)?.reasonFr ||
        'Replan structure : faisabilité pecs / poussée rétablie.'
      : null,
    feasible: feas.feasible,
    decisions: feas.decisions
  };
}

export function formatWeekAllocationFr(placement, activeDayKeys) {
  if (!placement?.days) return null;
  const lines = activeDayKeys
    .map((dayKey) => {
      const plan = placement.days[dayKey];
      if (!plan?.blocks?.length) return null;
      const labels = plan.blocks.map((b) => BLOCK_LABELS_FR[b] || b).join(' + ');
      return `${dayKey} : ${labels}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join(' · ') : null;
}
