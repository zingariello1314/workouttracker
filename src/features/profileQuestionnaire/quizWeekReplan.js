/**
 * Replan calendrier léger v6.3a — permutations de jours si conflits adjacents persistants.
 */

import { buildCompatContext, scanPlacementConflicts } from './quizBlockCompat';

function refreshDayPlan(dayPlan) {
  if (!dayPlan?.blocks?.length) return;
  dayPlan.primaryBlock = dayPlan.blocks[0];
  const groups = new Set();
  dayPlan.blocks.forEach((b) => {
    if (b.startsWith('run_') || b === 'cardio_general') groups.add('cardio');
    else if (b === 'force_legs' || b === 'force_lower') groups.add('lower');
    else if (b === 'force_core') groups.add('core');
    else groups.add('upper');
  });
  dayPlan.groups = [...groups];
}

function swapDayPlans(placement, dayKeyA, dayKeyB) {
  const a = placement.days[dayKeyA];
  const b = placement.days[dayKeyB];
  if (!a || !b) return false;

  const tmp = {
    blocks: [...a.blocks],
    primaryBlock: a.primaryBlock,
    modality: a.modality,
    groups: [...(a.groups || [])]
  };
  a.blocks = [...b.blocks];
  a.primaryBlock = b.primaryBlock;
  a.modality = b.modality;
  a.groups = [...(b.groups || [])];
  b.blocks = tmp.blocks;
  b.primaryBlock = tmp.primaryBlock;
  b.modality = tmp.modality;
  b.groups = tmp.groups;
  refreshDayPlan(a);
  refreshDayPlan(b);
  return true;
}

function topAdjacentPenalty(conflicts) {
  const adj = conflicts.filter((c) => c.kind === 'adjacent');
  if (!adj.length) return 0;
  return Math.max(...adj.map((c) => c.result?.penalty ?? 0));
}

function totalConflictScore(placement, activeDayKeys, ctx) {
  const conflicts = scanPlacementConflicts(placement, activeDayKeys, ctx);
  if (!conflicts.length) return 0;
  return conflicts.reduce((s, c) => s + (c.result?.penalty ?? 0), 0);
}

/**
 * Recherche locale : permute des paires de jours pour minimiser les conflits (v6.3b).
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} ctx
 * @param {number} [maxIter]
 */
export function optimizeWeekPlacementByReplan(placement, activeDayKeys, ctx, maxIter = 6) {
  let working = JSON.parse(JSON.stringify(placement));
  let score = totalConflictScore(working, activeDayKeys, ctx);
  const decisions = [];

  for (let iter = 0; iter < maxIter; iter += 1) {
    let best = null;

    for (let i = 0; i < activeDayKeys.length; i += 1) {
      for (let j = i + 1; j < activeDayKeys.length; j += 1) {
        if (Math.abs(i - j) === 1) continue;
        const keyA = activeDayKeys[i];
        const keyB = activeDayKeys[j];
        const planA = working.days[keyA];
        const planB = working.days[keyB];
        if (!planA || !planB) continue;

        const trial = JSON.parse(JSON.stringify(working));
        if (!swapDayPlans(trial, keyA, keyB)) continue;
        const trialScore = totalConflictScore(trial, activeDayKeys, ctx);
        if (trialScore < score - 0.03) {
          best = { trial, keyA, keyB, trialScore };
        }
      }
    }

    if (!best) break;
    working = best.trial;
    score = best.trialScore;
    decisions.push({
      action: 'replan_optimize_swap',
      dayKeyA: best.keyA,
      dayKeyB: best.keyB,
      reasonFr: `Optimisation calendrier : ${best.keyA} ↔ ${best.keyB} (score conflits ${Math.round(score * 100) / 100}).`
    });
  }

  return {
    placement: working,
    decisions,
    applied: decisions.length > 0,
    conflictScore: score
  };
}

/**
 * @param {object[]} decisions
 */
export function buildReplanSummaryFr(decisions) {
  const lines = (decisions || [])
    .filter((d) => d?.reasonFr && String(d.action || '').startsWith('replan'))
    .map((d) => d.reasonFr);
  return lines.length ? lines.join(' ') : null;
}

/**
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} ctx
 */
export function applyWeekReplanSwaps(placement, activeDayKeys, ctx) {
  const decisions = [];
  let working = placement;
  let conflicts = scanPlacementConflicts(working, activeDayKeys, ctx);

  for (let attempt = 0; attempt < 3 && topAdjacentPenalty(conflicts) >= 0.38; attempt += 1) {
    const top = conflicts.find((c) => c.kind === 'adjacent' && (c.result?.penalty ?? 0) >= 0.38);
    if (!top?.prevDayKey || !top?.dayKey) break;

    const prevIdx = activeDayKeys.indexOf(top.prevDayKey);
    if (prevIdx < 0) break;

    let swapped = false;
    for (let j = 0; j < activeDayKeys.length; j += 1) {
      if (Math.abs(j - prevIdx) < 2) continue;
      const candidate = activeDayKeys[j];
      const planPrev = working.days[top.prevDayKey];
      const planCand = working.days[candidate];
      if (!planPrev || !planCand) continue;
      if (planPrev.modality === 'cardio' || planCand.modality === 'cardio') continue;

      if (!swapDayPlans(working, top.prevDayKey, candidate)) continue;

      const after = scanPlacementConflicts(working, activeDayKeys, ctx);
      const beforePenalty = top.result?.penalty ?? 0;
      const afterPenalty = topAdjacentPenalty(after);

      if (afterPenalty > beforePenalty + 0.05) {
        swapDayPlans(working, top.prevDayKey, candidate);
        continue;
      }

      decisions.push({
        action: 'replan_swap_days',
        dayKeyA: top.prevDayKey,
        dayKeyB: candidate,
        reasonFr: `Jours ${top.prevDayKey} et ${candidate} permutés pour réduire l’interférence entre séances (${Math.round(beforePenalty * 100)} % → ${Math.round(afterPenalty * 100)} %).`
      });
      conflicts = after;
      swapped = true;
      break;
    }

    if (!swapped) break;
  }

  let optimized = { applied: false, decisions: [] };
  if (topAdjacentPenalty(conflicts) >= 0.25 || totalConflictScore(working, activeDayKeys, ctx) >= 0.5) {
    optimized = optimizeWeekPlacementByReplan(working, activeDayKeys, ctx);
    if (optimized.applied) {
      working = optimized.placement;
      decisions.push(...optimized.decisions);
      conflicts = scanPlacementConflicts(working, activeDayKeys, ctx);
    }
  }

  return {
    placement: working,
    decisions,
    applied: decisions.length > 0,
    conflictsRemaining: conflicts,
    replanSummaryFr: buildReplanSummaryFr(decisions)
  };
}

/**
 * Score global des conflits (pour tests).
 */
export function placementConflictScore(placement, activeDayKeys, answers, budgets, deformers = null) {
  const ctx = buildCompatContext(answers, budgets, deformers);
  return totalConflictScore(placement, activeDayKeys, ctx);
}
