import { EXERCISE_GRADE_LADDER, exerciseGradeFromSortIndex } from './exerciseGradeLadder';
import { LADDER_PROGRESS_GATES } from './exerciseGradeDiscovery';
import {
  metricTripletForGates,
  voieEProgressForNextGrade,
  progressTowardSortIndex,
  VOIE_E_MIN_PCT
} from './exerciseGradePaths';

function gateForSortIndex(targetIndex) {
  const i = Math.max(0, Math.min(LADDER_PROGRESS_GATES.length - 1, targetIndex));
  return LADDER_PROGRESS_GATES[i];
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
 * Barres vers le prochain palier (Bois I → Bois II …) + voie E.
 */
export function computeExerciseGradeProgressBars(metrics, def, vitals, currentSortIndex, gradeExtra = null) {
  const metric = def?.metric || 'max_set_reps';
  const vals = metricTripletForGates(metrics, metric, vitals?.weightKg);
  const sortIdx = Math.max(0, Math.floor(Number(currentSortIndex) || 0));
  const ladderMax = EXERCISE_GRADE_LADDER.length - 1;
  const atLadderMax = sortIdx >= ladderMax;
  const nextSortIndex = Math.min(ladderMax, sortIdx + 1);
  const targetGateIndex = atLadderMax
    ? Math.min(LADDER_PROGRESS_GATES.length - 1, sortIdx + 1)
    : nextSortIndex;
  const nextGrade = exerciseGradeFromSortIndex(nextSortIndex);
  const gate = gateForSortIndex(targetGateIndex);

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

  if (atLadderMax && gradeExtra?.parallelLevelProgress?.nextAt != null) {
    const w = Math.max(0, Number(gradeExtra.weightedLifetimeValue) || 0);
    const parallelBar = bar(
      w,
      gradeExtra.parallelLevelProgress.nextAt,
      'recap.exerciseGrades.parallelRepEq',
      'Rep eq. (niveau)'
    );
    if (parallelBar) bars.unshift(parallelBar);
  }

  let voieE;
  if (atLadderMax) {
    const p = progressTowardSortIndex(metrics, metric, vitals, targetGateIndex);
    const minPct = Math.min(p.peakPct, p.lifePct, p.checksPct);
    voieE = {
      ...p,
      minPct,
      met: minPct >= VOIE_E_MIN_PCT,
      targetSortIndex: targetGateIndex,
      nextGradeLabel: null
    };
  } else {
    voieE = voieEProgressForNextGrade(metrics, metric, vitals, sortIdx);
  }

  const parallelLevel = gradeExtra?.parallelLevel;
  let nextGradeLabel = nextGrade.label;
  if (atLadderMax && parallelLevel != null) {
    nextGradeLabel = `Niv. ${parallelLevel + 1}`;
  }

  return {
    nextGradeLabel,
    nextSortIndex: atLadderMax ? null : nextSortIndex,
    bars,
    voieE,
    voieEMinPct: VOIE_E_MIN_PCT,
    parallelLevel,
    weightedLifetime: gradeExtra?.weightedLifetimeValue,
    ladderMaxed: atLadderMax,
    maxed: false
  };
}
