/**
 * Niveau parallèle (rep équivalentes pondérées) + voies de grade (A/B/C/E).
 */

import { EXERCISE_GRADE_LADDER, exerciseGradeFromSortIndex } from './exerciseGradeLadder';
import { LADDER_PROGRESS_GATES } from './exerciseGradeDiscovery';

export const VOIE_E_MIN_PCT = 70;
export const VOIE_E_MIN_PCT_PENULTIMATE = 80;
export const VOIE_E_MIN_PCT_FINAL = 90;

export const EXERCISE_PENULTIMATE_SORT_INDEX = EXERCISE_GRADE_LADDER.length - 2;
export const EXERCISE_FINAL_SORT_INDEX = EXERCISE_GRADE_LADDER.length - 1;

export function voieEMinPctForTargetSortIndex(targetSortIndex) {
  const t = Math.floor(Number(targetSortIndex) || 0);
  if (t >= EXERCISE_FINAL_SORT_INDEX) return VOIE_E_MIN_PCT_FINAL;
  if (t >= EXERCISE_PENULTIMATE_SORT_INDEX) return VOIE_E_MIN_PCT_PENULTIMATE;
  return VOIE_E_MIN_PCT;
}

export function pathsRequiredForTargetSortIndex(targetSortIndex) {
  const t = Math.floor(Number(targetSortIndex) || 0);
  if (t >= EXERCISE_FINAL_SORT_INDEX) return 3;
  if (t >= EXERCISE_PENULTIMATE_SORT_INDEX) return 2;
  return 1;
}

/** Seuils cumulés en rep-équivalent pompes pour monter de niveau. */
const PARALLEL_LEVEL_THRESHOLDS = [
  0, 35, 90, 180, 320, 520, 780, 1100, 1500, 2000, 2600, 3400, 4400, 5700, 7300, 9200, 11500, 14200,
  17500, 21500
];

export function parallelLevelFromWeightedLifetime(weightedLife) {
  const w = Math.max(0, Number(weightedLife) || 0);
  let level = 1;
  for (let i = 1; i < PARALLEL_LEVEL_THRESHOLDS.length; i += 1) {
    if (w >= PARALLEL_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(99, level);
}

export function parallelLevelProgress(weightedLife, level) {
  const cur = PARALLEL_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = PARALLEL_LEVEL_THRESHOLDS[level] ?? cur + 1000;
  if (next <= cur) return { pct: 100, nextAt: next };
  const pct = Math.min(100, Math.round(((weightedLife - cur) / (next - cur)) * 1000) / 10);
  return { pct: Math.max(0, pct), nextAt: next, currentFloor: cur };
}

/** Index échelle Bois→Platine dérivé du niveau parallèle. */
export function gradeSortIndexFromParallelLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  const idx = Math.floor((L - 1) / 7);
  return Math.min(EXERCISE_GRADE_LADDER.length - 1, idx);
}

function pctToward(current, target) {
  const t = Math.max(0, Number(target) || 0);
  const c = Math.max(0, Number(current) || 0);
  if (t <= 0) return c > 0 ? 100 : 0;
  return Math.min(100, Math.round((c / t) * 1000) / 10);
}

export function metricTripletForGates(metrics, metric, bodyWeightKg) {
  if (metric === 'hold_seconds') {
    return {
      peak: metrics.maxHoldSeconds || 0,
      life: metrics.lifetimeHoldSeconds || metrics.maxHoldSeconds || 0,
      checks: metrics.checkCount || 0
    };
  }
  if (metric === 'max_weight_kg') {
    const peak =
      bodyWeightKg > 0 && metrics.maxWeightKg > 0
        ? metrics.maxWeightKg / bodyWeightKg
        : metrics.maxWeightKg || 0;
    return {
      peak,
      life: metrics.totalVolumeKg || metrics.lifetimeVolumeKg || 0,
      checks: metrics.checkCount || 0
    };
  }
  return {
    peak: metrics.maxDailyTotalReps || metrics.maxSetReps || 0,
    life: metrics.totalReps || 0,
    checks: metrics.checkCount || 0
  };
}

function gateForSortIndex(targetIndex) {
  const i = Math.max(0, Math.min(LADDER_PROGRESS_GATES.length - 1, targetIndex));
  return LADDER_PROGRESS_GATES[i];
}

export function progressTowardSortIndex(metrics, metric, vitals, targetSortIndex) {
  const gate = gateForSortIndex(targetSortIndex);
  const vals = metricTripletForGates(metrics, metric, vitals?.weightKg);
  return {
    peakPct: pctToward(vals.peak, gate.peak),
    lifePct: pctToward(vals.life, gate.life),
    checksPct: pctToward(vals.checks, gate.checks),
    vals,
    gate
  };
}

function pathsFullCountFromProgress(p) {
  return [p.peakPct >= 100, p.lifePct >= 100, p.checksPct >= 100].filter(Boolean).length;
}

/** Voie E / multi-voies : règles selon le palier visé. */
export function qualifiesViaVoieEAtTarget(metrics, metric, vitals, targetSortIndex) {
  const target = Math.floor(Number(targetSortIndex) || 0);
  const p = progressTowardSortIndex(metrics, metric, vitals, target);
  const minPct = Math.min(p.peakPct, p.lifePct, p.checksPct);
  const pathsFull = pathsFullCountFromProgress(p);

  if (target >= EXERCISE_FINAL_SORT_INDEX) {
    return pathsFull >= 3 || minPct >= VOIE_E_MIN_PCT_FINAL;
  }
  if (target >= EXERCISE_PENULTIMATE_SORT_INDEX) {
    return pathsFull >= 2 || minPct >= VOIE_E_MIN_PCT_PENULTIMATE;
  }
  return minPct >= VOIE_E_MIN_PCT;
}

/** Voie E : palier le plus élevé où les conditions cumulées sont remplies. */
export function highestSortIndexViaVoieE(metrics, metric, vitals) {
  let best = -1;
  for (let target = 1; target < EXERCISE_GRADE_LADDER.length; target += 1) {
    if (qualifiesViaVoieEAtTarget(metrics, metric, vitals, target)) {
      best = target;
    }
  }
  return best;
}

export function voieEProgressForNextGrade(metrics, metric, vitals, currentSortIndex) {
  const next = Math.min(EXERCISE_GRADE_LADDER.length - 1, (currentSortIndex ?? 0) + 1);
  const p = progressTowardSortIndex(metrics, metric, vitals, next);
  const minPct = Math.min(p.peakPct, p.lifePct, p.checksPct);
  const pathsFull = pathsFullCountFromProgress(p);
  const voieEMinPct = voieEMinPctForTargetSortIndex(next);
  const pathsRequired = pathsRequiredForTargetSortIndex(next);
  const met = qualifiesViaVoieEAtTarget(metrics, metric, vitals, next);

  return {
    ...p,
    minPct,
    met,
    voieEMinPct,
    pathsFull,
    pathsRequired,
    targetSortIndex: next,
    nextGradeLabel: exerciseGradeFromSortIndex(next).label
  };
}

/** Niveau parallèle minimal pour un palier d’échelle (condition voie N). */
export function minParallelLevelForSortIndex(targetSortIndex) {
  const t = Math.max(0, Math.floor(Number(targetSortIndex) || 0));
  return t * 7 + 1;
}

/** Cappe le grade si les règles strictes Platine II / III ne sont pas remplies. */
export function capSortIndexByHighTierRules(rawSortIndex, ctx) {
  let idx = Math.max(0, Math.floor(Number(rawSortIndex) || 0));
  while (idx >= EXERCISE_PENULTIMATE_SORT_INDEX) {
    if (qualifiesForExerciseGradeSortIndex(idx, ctx)) break;
    idx -= 1;
  }
  return idx;
}

export function qualifiesForExerciseGradeSortIndex(targetSortIndex, ctx) {
  const target = Math.floor(Number(targetSortIndex) || 0);
  const { metrics, metric, vitals, peakIdx, lifeIdx, checkIdx, voieEIdx, levelIdx } = ctx || {};

  if (target < EXERCISE_PENULTIMATE_SORT_INDEX) {
    return (
      peakIdx >= target ||
      lifeIdx >= target ||
      checkIdx >= target ||
      levelIdx >= target ||
      (voieEIdx >= 0 && voieEIdx >= target)
    );
  }

  if (qualifiesViaVoieEAtTarget(metrics, metric, vitals, target)) return true;

  const p = progressTowardSortIndex(metrics, metric, vitals, target);
  const pathsFull = pathsFullCountFromProgress(p);
  const required = pathsRequiredForTargetSortIndex(target);
  return pathsFull >= required;
}

/**
 * @param {object} args indices déjà calculés (0–14)
 */
export function mergeGradeSortIndex({
  peakIdx,
  lifeIdx,
  checkIdx,
  averageIdx,
  voieEIdx,
  levelIdx
}) {
  const candidates = [averageIdx, peakIdx, lifeIdx, checkIdx, levelIdx];
  if (voieEIdx >= 0) candidates.push(voieEIdx);
  const maxIdx = Math.max(...candidates.map((n) => Math.max(0, Math.floor(Number(n) || 0))));
  return Math.min(EXERCISE_GRADE_LADDER.length - 1, maxIdx);
}

export function describeGradePaths(paths) {
  const { sortIndex, peakIdx, lifeIdx, checkIdx, voieEIdx, levelIdx } = paths;
  const active = [];
  if (peakIdx >= sortIndex && sortIndex > 0) active.push('A');
  if (lifeIdx >= sortIndex && sortIndex > 0) active.push('B');
  if (checkIdx >= sortIndex && sortIndex > 0) active.push('C');
  if (voieEIdx >= 0 && voieEIdx >= sortIndex) active.push('E');
  if (levelIdx >= sortIndex && sortIndex > 0) active.push('N');
  return active.length ? active : ['—'];
}
