import { EXERCISE_GRADE_LADDER, exerciseGradeFromSortIndex } from './exerciseGradeLadder';
import { LADDER_PROGRESS_GATES } from './exerciseGradeDiscovery';
import {
  metricTripletForGates,
  voieEProgressForNextGrade,
  progressTowardSortIndex,
  voieEMinPctForTargetSortIndex,
  minParallelLevelForSortIndex,
  qualifiesViaVoieEAtTarget,
  pathsRequiredForTargetSortIndex
} from './exerciseGradePaths';
import { demographicPeakRepsForMetrics } from './demographicGradeResolver';

function pathsFullFromProgress(p) {
  return [p.peakPct >= 100, p.lifePct >= 100, p.checksPct >= 100].filter(Boolean).length;
}

function gateForSortIndex(targetIndex, demographic = null) {
  if (demographic?.gates?.length) {
    const i = Math.max(0, Math.min(demographic.gates.length - 1, targetIndex));
    return demographic.gates[i];
  }
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
export function computeExerciseGradeProgressBars(
  metrics,
  def,
  vitals,
  currentSortIndex,
  gradeExtra = null,
  demographic = null
) {
  const metric = def?.metric || 'max_set_reps';
  const vals = metricTripletForGates(metrics, metric, vitals?.weightKg, demographic);
  const peakRepsAdj = demographic?.ladder
    ? demographicPeakRepsForMetrics(metrics, demographic, vitals)
    : vals.peak;
  const sortIdx = Math.max(0, Math.floor(Number(currentSortIndex) || 0));
  const ladderMax = EXERCISE_GRADE_LADDER.length - 1;
  const atLadderMax = sortIdx >= ladderMax;
  const nextSortIndex = Math.min(ladderMax, sortIdx + 1);
  const targetGateIndex = atLadderMax
    ? Math.min(
        (demographic?.gates?.length || LADDER_PROGRESS_GATES.length) - 1,
        sortIdx + 1
      )
    : nextSortIndex;
  const nextGrade = exerciseGradeFromSortIndex(nextSortIndex);
  const gate = gateForSortIndex(targetGateIndex, demographic);

  const peakLabel =
    metric === 'hold_seconds'
      ? 'Maintien max (s)'
      : demographic?.usesLoaded1Rm
        ? '1RM haltère (kg eq.)'
        : metric === 'max_weight_kg'
          ? 'Charge / pic'
          : demographic?.weightAdjustsPeak
            ? 'Max série (reps eq. poids)'
            : demographic?.ladder
              ? 'Max série (reps)'
              : 'Pic jour (reps)';
  const lifeLabel =
    metric === 'hold_seconds'
      ? 'Temps cumulé (s)'
      : demographic?.usesLoaded1Rm
        ? 'Volume jour (kg×reps)'
        : metric === 'max_weight_kg'
          ? 'Volume cumulé (kg×reps)'
          : demographic?.ladder
            ? 'Volume jour (reps)'
            : 'Reps totales';

  const bars = [
    bar(
      demographic?.ladder ? peakRepsAdj : vals.peak,
      gate.peak,
      'sport.exerciseGrade.progressPeak',
      peakLabel
    ),
    bar(vals.life, gate.life, 'sport.exerciseGrade.progressLife', lifeLabel),
    bar(vals.checks, gate.checks, 'sport.exerciseGrade.progressChecks', 'Séances cochées')
  ].filter(Boolean);

  const parallelLevel = gradeExtra?.parallelLevel;
  const weightedLife = Math.max(0, Number(gradeExtra?.weightedLifetimeValue) || 0);

  if (gradeExtra?.parallelLevelProgress?.nextAt != null) {
    const parallelBar = bar(
      weightedLife,
      gradeExtra.parallelLevelProgress.nextAt,
      'recap.exerciseGrades.parallelRepEq',
      'Rep eq. (niveau)'
    );
    if (parallelBar) bars.unshift(parallelBar);
  }

  if (parallelLevel != null && !atLadderMax) {
    const minLevel = minParallelLevelForSortIndex(nextSortIndex);
    if (parallelLevel < minLevel) {
      const levelBar = bar(
        parallelLevel,
        minLevel,
        'recap.exerciseGrades.levelGate',
        'Niveau requis (grade)'
      );
      if (levelBar) bars.push(levelBar);
    }
  }

  let voieE;
  const voieTarget = atLadderMax ? targetGateIndex : nextSortIndex;
  const voieEMinPct = voieEMinPctForTargetSortIndex(voieTarget);
  if (atLadderMax) {
    const p = progressTowardSortIndex(metrics, metric, vitals, targetGateIndex, demographic);
    const minPct = Math.min(p.peakPct, p.lifePct, p.checksPct);
    voieE = {
      ...p,
      minPct,
      met: qualifiesViaVoieEAtTarget(metrics, metric, vitals, targetGateIndex, demographic),
      voieEMinPct,
      pathsFull: pathsFullFromProgress(p),
      pathsRequired: pathsRequiredForTargetSortIndex(targetGateIndex),
      targetSortIndex: targetGateIndex,
      nextGradeLabel: null
    };
  } else {
    voieE = voieEProgressForNextGrade(metrics, metric, vitals, sortIdx, demographic);
  }
  let nextGradeLabel = nextGrade.label;
  if (atLadderMax && parallelLevel != null) {
    nextGradeLabel = `Niv. ${parallelLevel + 1}`;
  }

  return {
    nextGradeLabel,
    nextSortIndex: atLadderMax ? null : nextSortIndex,
    bars,
    voieE,
    voieEMinPct: voieE?.voieEMinPct ?? voieEMinPct,
    pathsRequired: voieE?.pathsRequired ?? 0,
    pathsFull: voieE?.pathsFull ?? 0,
    parallelLevel,
    weightedLifetime: weightedLife,
    ladderMaxed: atLadderMax,
    maxed: false
  };
}
