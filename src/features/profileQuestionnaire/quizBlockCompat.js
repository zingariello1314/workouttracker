/**
 * Compatibilité blocs v6 — scores continus, hard block rare.
 * ~8 familles de stress (pas matrice 15×15).
 */

import { BLOCK_LABELS_FR } from './quizWeekPlacement';
import { applyWeekReplanSwaps } from './quizWeekReplan';
import { getProfileConstraintEffects } from './quizProfileConstraints';

/** @typedef {'same_day'|'adjacent'} CompatScope */

const STRESS_KEYS = [
  'run_easy',
  'run_tempo',
  'run_interval',
  'run_long',
  'legs_heavy',
  'upper_heavy',
  'core_light',
  'skill_street',
  'metabolic_circuit'
];

/** @type {Record<string, Record<string, number>>} */
const BASE_COMPAT = {
  run_easy: {
    run_easy: 1,
    run_interval: 0.6,
    run_long: 0.2,
    legs_heavy: 0.85,
    upper_heavy: 0.9,
    core_light: 0.95
  },
  run_interval: {
    run_easy: 0.6,
    run_interval: 1,
    run_long: 0.1,
    legs_heavy: 0.35,
    upper_heavy: 0.55,
    core_light: 0.9
  },
  run_long: {
    run_easy: 0.2,
    run_interval: 0.1,
    run_long: 1,
    legs_heavy: 0.25,
    upper_heavy: 0.8,
    core_light: 0.85
  },
  legs_heavy: {
    run_easy: 0.85,
    run_interval: 0.35,
    run_long: 0.25,
    legs_heavy: 1,
    upper_heavy: 0.75,
    core_light: 0.92
  },
  upper_heavy: {
    run_easy: 0.9,
    run_interval: 0.55,
    run_long: 0.8,
    legs_heavy: 0.75,
    upper_heavy: 1,
    core_light: 0.93
  },
  core_light: {
    run_easy: 0.95,
    run_interval: 0.9,
    run_long: 0.9,
    legs_heavy: 0.92,
    upper_heavy: 0.93,
    core_light: 1
  },
  run_tempo: {
    run_easy: 0.78,
    run_tempo: 1,
    run_interval: 0.52,
    run_long: 0.28,
    legs_heavy: 0.8,
    upper_heavy: 0.88,
    core_light: 0.94,
    skill_street: 0.72,
    metabolic_circuit: 0.7
  },
  skill_street: {
    run_easy: 0.88,
    run_tempo: 0.72,
    run_interval: 0.58,
    run_long: 0.75,
    legs_heavy: 0.72,
    upper_heavy: 0.82,
    core_light: 0.9,
    skill_street: 1,
    metabolic_circuit: 0.65
  },
  metabolic_circuit: {
    run_easy: 0.82,
    run_tempo: 0.7,
    run_interval: 0.38,
    run_long: 0.48,
    legs_heavy: 0.42,
    upper_heavy: 0.58,
    core_light: 0.88,
    skill_street: 0.65,
    metabolic_circuit: 1
  }
};

const PENALTY_UI_WARN = 0.45;

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {string} blockId
 * @returns {string}
 */
export function blockStressFamily(blockId) {
  if (!blockId) return 'upper_heavy';
  if (blockId === 'run_easy' || blockId === 'cardio_general') return 'run_easy';
  if (blockId === 'run_tempo') return 'run_tempo';
  if (blockId === 'run_interval') return 'run_interval';
  if (blockId === 'run_long') return 'run_long';
  if (blockId === 'skill_street') return 'skill_street';
  if (blockId === 'circuit_metabolic') return 'metabolic_circuit';
  if (blockId === 'force_legs' || blockId === 'force_lower') return 'legs_heavy';
  if (blockId === 'force_core') return 'core_light';
  if (blockId === 'force_pull' || blockId === 'force_push' || blockId === 'force_upper') return 'upper_heavy';
  return 'upper_heavy';
}

function baseCompatForFamilies(fa, fb) {
  if (fa === fb) return 1;
  const row = BASE_COMPAT[fa];
  if (row && row[fb] != null) return row[fb];
  const rowB = BASE_COMPAT[fb];
  if (rowB && rowB[fa] != null) return rowB[fa];
  return 0.7;
}

function applyModulators(compat, blockA, blockB, ctx) {
  let c = compat;
  const { answers, recoveryBudget } = ctx;
  const fa = blockStressFamily(blockA);
  const fb = blockStressFamily(blockB);

  const intervalLegsPair =
    (fa === 'run_interval' && fb === 'legs_heavy') || (fb === 'run_interval' && fa === 'legs_heavy');

  if (intervalLegsPair && answers?.neuralFatigueTolerance === 'high') {
    c = Math.max(c, 0.55);
  }

  if (recoveryBudget < 0.85) {
    c = clamp01(c - (1 - c) * 0.25);
  }

  if (answers?.volumeTolerance === 'low') {
    c = clamp01(c - (1 - c) * 0.15);
  }

  if (
    getProfileConstraintEffects(answers).avoidIntervalAfterLegs &&
    intervalLegsPair &&
    ctx.scope === 'adjacent'
  ) {
    c = clamp01(c - 0.35);
  }

  return c;
}

/**
 * @param {object} answers
 * @param {object} budgets
 * @param {object} [deformers]
 */
export function buildCompatContext(answers, budgets, deformers = null) {
  return {
    answers: answers || {},
    recoveryBudget: budgets?.recoveryBudget ?? 1,
    deformers,
    scope: 'same_day'
  };
}

/**
 * @param {string} blockA
 * @param {string} blockB
 * @param {object} ctx
 * @param {CompatScope} [scope]
 */
export function compatBlocks(blockA, blockB, ctx, scope = 'same_day') {
  const fa = blockStressFamily(blockA);
  const fb = blockStressFamily(blockB);
  if (fa === fb && fa !== 'run_interval') {
    return {
      compat: 1,
      hardBlock: false,
      penalty: 0,
      reasonFr: 'Blocs de même famille — pas d’interférence.'
    };
  }

  const scopedCtx = { ...ctx, scope };
  let compat = baseCompatForFamilies(fa, fb);
  compat = applyModulators(compat, blockA, blockB, scopedCtx);

  const w = scope === 'same_day' ? 1 : 0.65;
  const penalty = (1 - compat) * w;
  const recoveryBudget = ctx.recoveryBudget ?? 1;
  const hardBlock = compat < 0.2 && recoveryBudget < 0.8;

  const labelA = BLOCK_LABELS_FR[blockA] || blockA;
  const labelB = BLOCK_LABELS_FR[blockB] || blockB;
  const scopeFr = scope === 'same_day' ? 'même jour' : 'jour suivant';
  let reasonFr = `${labelA} + ${labelB} (${scopeFr}) : compat ${Math.round(compat * 100)} %`;
  if (hardBlock) {
    reasonFr += ' — combinaison déconseillée (récupération limitée).';
  } else if (penalty >= PENALTY_UI_WARN) {
    reasonFr += ' — charge nerveuse élevée, ajustement recommandé.';
  } else if (penalty > 0.1) {
    reasonFr += ' — acceptable avec marge de récupération.';
  } else {
    reasonFr += ' — combinaison favorable.';
  }

  if (ctx.answers?.neuralFatigueTolerance === 'high' && fa === 'run_interval' && fb === 'legs_heavy') {
    reasonFr += ' Tolérance fatigue nerveuse élevée.';
  }

  return {
    compat: clamp01(compat),
    hardBlock,
    penalty: clamp01(penalty),
    reasonFr
  };
}

/**
 * Profils v5 sans blocs : inférence minimale pour compat adjacent.
 */
export function inferBlocksFromProfile(profile, deformers = null) {
  if (!profile) return ['force_upper'];
  if (Array.isArray(profile.blocks) && profile.blocks.length) return profile.blocks;
  if (profile.modality === 'cardio') {
    return deformers?.allowFractionné === false ? ['run_easy'] : ['run_interval'];
  }
  if (Array.isArray(profile.groups) && profile.groups.includes('lower')) return ['force_legs'];
  if (Array.isArray(profile.groups) && profile.groups.includes('core')) return ['force_core'];
  return ['force_pull'];
}

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

/**
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} ctx
 */
export function scanPlacementConflicts(placement, activeDayKeys, ctx) {
  const conflicts = [];
  if (!placement?.days) return conflicts;

  activeDayKeys.forEach((dayKey, i) => {
    const day = placement.days[dayKey];
    if (!day?.blocks?.length) return;

    for (let a = 0; a < day.blocks.length; a += 1) {
      for (let b = a + 1; b < day.blocks.length; b += 1) {
        const result = compatBlocks(day.blocks[a], day.blocks[b], ctx, 'same_day');
        if (result.penalty > 0.08) {
          conflicts.push({
            kind: 'same_day',
            dayKey,
            blockA: day.blocks[a],
            blockB: day.blocks[b],
            result
          });
        }
      }
    }

    if (i > 0) {
      const prevKey = activeDayKeys[i - 1];
      const prev = placement.days[prevKey];
      if (!prev?.blocks?.length) return;
      prev.blocks.forEach((ba) => {
        day.blocks.forEach((bb) => {
          const result = compatBlocks(ba, bb, ctx, 'adjacent');
          if (result.penalty > 0.08) {
            conflicts.push({
              kind: 'adjacent',
              dayKey,
              prevDayKey: prevKey,
              blockA: ba,
              blockB: bb,
              result
            });
          }
        });
      });
    }
  });

  return conflicts.sort((x, y) => y.result.penalty - x.result.penalty);
}

function downgradeIntervalOnDay(placement, dayKey, result) {
  const day = placement.days[dayKey];
  if (!day?.blocks?.includes('run_interval')) return null;
  const blocks = day.blocks.map((b) => (b === 'run_interval' ? 'run_easy' : b));
  day.blocks = blocks;
  refreshDayPlan(day);
  return {
    action: 'downgrade_interval',
    dayKey,
    blocks,
    compat: result.compat,
    penalty: result.penalty,
    hardBlock: result.hardBlock,
    reasonFr: `Fractionné remplacé par course facile (${dayKey}) : ${result.reasonFr}`
  };
}

function trySwapLegsBlock(placement, activeDayKeys, legsDayKey) {
  const legsDay = placement.days[legsDayKey];
  if (!legsDay?.blocks?.includes('force_legs')) return null;

  const targetKey = activeDayKeys.find((k) => {
    if (k === legsDayKey) return false;
    const d = placement.days[k];
    return d?.modality === 'strength' && !d.blocks?.includes('force_legs');
  });
  if (!targetKey) return null;

  const target = placement.days[targetKey];
  const legsIdx = legsDay.blocks.indexOf('force_legs');
  const swapIdx = target.blocks.findIndex((b) =>
    ['force_pull', 'force_push', 'force_upper'].includes(b)
  );
  if (legsIdx < 0 || swapIdx < 0) return null;

  const legsBlock = legsDay.blocks[legsIdx];
  const otherBlock = target.blocks[swapIdx];
  legsDay.blocks = [...legsDay.blocks];
  target.blocks = [...target.blocks];
  legsDay.blocks[legsIdx] = otherBlock;
  target.blocks[swapIdx] = legsBlock;
  refreshDayPlan(legsDay);
  refreshDayPlan(target);

  return {
    action: 'swap_legs_day',
    dayKey: legsDayKey,
    targetDayKey: targetKey,
    reasonFr: `Jambes déplacées de ${legsDayKey} vers ${targetKey} pour limiter l’interférence avec la course qualité.`
  };
}

function tryMitigate(placement, activeDayKeys, conflict, ctx) {
  const { kind, dayKey, prevDayKey, blockA, blockB, result } = conflict;
  const needsAction = result.hardBlock || result.penalty >= 0.35;
  if (!needsAction) return null;

  const hasInterval = blockA === 'run_interval' || blockB === 'run_interval';
  const hasLegs =
    blockA === 'force_legs' ||
    blockB === 'force_legs' ||
    blockStressFamily(blockA) === 'legs_heavy' ||
    blockStressFamily(blockB) === 'legs_heavy';

  if (hasInterval && hasLegs && kind === 'same_day') {
    const swapped = trySwapLegsBlock(placement, activeDayKeys, dayKey);
    if (swapped) return { ...swapped, compat: result.compat, penalty: result.penalty, hardBlock: result.hardBlock };
    return downgradeIntervalOnDay(placement, dayKey, result);
  }

  if (hasInterval && kind === 'adjacent' && hasLegs) {
    return downgradeIntervalOnDay(placement, dayKey, result);
  }

  if (hasInterval && result.penalty >= 0.35) {
    return downgradeIntervalOnDay(placement, dayKey, result);
  }

  if (result.hardBlock && kind === 'adjacent') {
    return downgradeIntervalOnDay(placement, dayKey, result);
  }

  return null;
}

/**
 * @param {object} placement
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @param {object} budgets
 * @param {object} [deformers]
 */
export function resolvePlacementCompat(placement, activeDayKeys, answers, budgets, deformers = null) {
  const ctx = buildCompatContext(answers, budgets, deformers);
  let working = JSON.parse(JSON.stringify(placement));
  const compatDecisions = [];
  let conflicts = scanPlacementConflicts(working, activeDayKeys, ctx);

  for (let iter = 0; iter < 6 && conflicts.length; iter += 1) {
    const top = conflicts[0];
    const decision = tryMitigate(working, activeDayKeys, top, ctx);
    if (!decision) break;
    compatDecisions.push(decision);
    conflicts = scanPlacementConflicts(working, activeDayKeys, ctx);
  }

  let remaining = scanPlacementConflicts(working, activeDayKeys, ctx);

  let replanSummaryFr = null;
  if (remaining.some((c) => c.kind === 'adjacent' && (c.result?.penalty ?? 0) >= 0.38)) {
    const replan = applyWeekReplanSwaps(working, activeDayKeys, ctx);
    if (replan.applied) {
      working = replan.placement;
      compatDecisions.push(...replan.decisions);
      remaining = scanPlacementConflicts(working, activeDayKeys, ctx);
      replanSummaryFr = replan.replanSummaryFr;
    }
  }

  return {
    placement: working,
    compatDecisions,
    conflictsRemaining: remaining,
    mitigated: compatDecisions.length > 0,
    replanApplied: compatDecisions.some((d) => String(d.action || '').startsWith('replan')),
    replanSummaryFr
  };
}

export { PENALTY_UI_WARN };
