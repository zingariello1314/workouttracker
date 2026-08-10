import { EXERCISE_GRADE_LADDER, exerciseGradeFromSortIndex } from './exerciseGradeLadder';
import { LADDER_PROGRESS_GATES } from './exerciseGradeDiscovery';

function gateForSortIndex(targetIndex) {
  const i = Math.max(0, Math.min(LADDER_PROGRESS_GATES.length - 1, targetIndex));
  return LADDER_PROGRESS_GATES[i];
}

function metricValues(metrics, metric, bodyWeightKg) {
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
      life: metrics.totalVolumeKg || 0,
      checks: metrics.checkCount || 0
    };
  }
  return {
    peak: metrics.maxDailyTotalReps || metrics.maxSetReps || 0,
    life: metrics.totalReps || 0,
    checks: metrics.checkCount || 0
  };
}

function bar(current, target, labelKey, labelFallback) {
  const t = Math.max(0, Number(target) || 0);
  const c = Math.max(0, Number(current) || 0);
  if (t <= 0 && c <= 0) return null;
  const effectiveTarget = t <= 0 ? 1 : t;
  const pct = Math.min(100, Math.round((c / effectiveTarget) * 1000) / 10);
  return {
    labelKey,
    labelFallback,
    current: c,
    target: effectiveTarget,
    pct,
    met: c >= effectiveTarget
  };
}

/**
 * Barres vers le prochain palier (Bois I → Bois II …).
 */
export function computeExerciseGradeProgressBars(metrics, def, vitals, currentSortIndex) {
  const metric = def?.metric || 'max_set_reps';
  const vals = metricValues(metrics, metric, vitals?.weightKg);
  const nextIndex = Math.min(EXERCISE_GRADE_LADDER.length - 1, (currentSortIndex ?? 0) + 1);
  const nextGrade = exerciseGradeFromSortIndex(nextIndex);
  const gate = gateForSortIndex(nextIndex);

  if (currentSortIndex >= EXERCISE_GRADE_LADDER.length - 1) {
    return { nextGradeLabel: null, bars: [], maxed: true };
  }

  const peakLabel =
    metric === 'hold_seconds'
      ? 'Maintien max (s)'
      : metric === 'max_weight_kg'
        ? 'Charge / pic'
        : 'Pic jour (reps)';
  const lifeLabel =
    metric === 'hold_seconds'
      ? 'Temps cumulé (s)'
      : metric === 'max_weight_kg'
        ? 'Volume cumulé (kg×reps)'
        : 'Reps totales';

  const bars = [
    bar(vals.peak, gate.peak, 'sport.exerciseGrade.progressPeak', peakLabel),
    bar(vals.life, gate.life, 'sport.exerciseGrade.progressLife', lifeLabel),
    bar(vals.checks, gate.checks, 'sport.exerciseGrade.progressChecks', 'Séances cochées')
  ].filter(Boolean);

  return {
    nextGradeLabel: nextGrade.label,
    nextSortIndex: nextIndex,
    bars,
    maxed: false
  };
}
