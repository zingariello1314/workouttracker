/**
 * Résolution de grade à partir d'un référentiel démographique Momentum V1.
 */

import {
  getDemographicLadderForExercise,
  demographicLadderToProgressGates,
  normalizeDemographicSex,
  resolveDemographicAgeBand,
  resolveDemographicExerciseId,
  demographicExerciseUsesWeightAdjustedPeak,
  weightAdjustExponentForExercise
} from '../../data/performanceBenchmarks/demographicGradeLadders';
import { adjustBodyweightPeakReps, PULLUP_REFERENCE_WEIGHT_KG } from './pullupPerformanceAdjust';
import { EXERCISE_GRADE_LADDER } from './exerciseGradeLadder';

/**
 * @param {number} peakReps — perf série (brut ou déjà ajusté)
 * @param {number} maxDailyVolume — volume journalier cumulé
 * @param {import('../../data/performanceBenchmarks/demographicGradeLadders').DemographicLadderRow[]} ladder
 */
export function resolveDemographicGradeIndices(peakReps, maxDailyVolume, ladder) {
  const peak = Math.max(0, Number(peakReps) || 0);
  const volume = Math.max(0, Number(maxDailyVolume) || 0);

  if (!ladder?.length) {
    return {
      performanceIdx: 0,
      volumeIdx: 0,
      combinedIdx: 0,
      nextTier: ladder?.[1] || null
    };
  }

  let performanceIdx = -1;
  let volumeIdx = -1;
  let combinedIdx = -1;

  ladder.forEach((row, i) => {
    if (peak >= row.performanceRequired) performanceIdx = i;
    if (volume >= row.volumePerDay) volumeIdx = i;
    if (peak >= row.performanceRequired && volume >= row.volumePerDay) combinedIdx = i;
  });

  const clamp = (idx) => Math.max(0, Math.min(EXERCISE_GRADE_LADDER.length - 1, idx));
  const perf = performanceIdx < 0 ? 0 : clamp(performanceIdx);
  const vol = volumeIdx < 0 ? 0 : clamp(volumeIdx);
  const combined = combinedIdx < 0 ? 0 : clamp(combinedIdx);
  const nextSortIndex = Math.min(EXERCISE_GRADE_LADDER.length - 1, combined + 1);

  return {
    performanceIdx: perf,
    volumeIdx: vol,
    combinedIdx: combined,
    nextTier: ladder[nextSortIndex] || null,
    currentTier: ladder[combined] || ladder[0]
  };
}

/**
 * Perf série utilisée pour le grade (ajustée poids si tractions / pompes déclinées).
 */
export function demographicPeakRepsForMetrics(metrics, demographic, vitals = {}) {
  const raw = Math.max(0, Number(metrics.maxSetReps) || 0);
  if (!demographic?.exerciseId) return raw;
  if (demographicExerciseUsesWeightAdjustedPeak(demographic.exerciseId)) {
    const exponent = weightAdjustExponentForExercise(demographic.exerciseId);
    return adjustBodyweightPeakReps(raw, vitals.weightKg, {
      refKg: demographic.weightRefKg,
      exponent
    });
  }
  return raw;
}

export function resolveDemographicGradeContext(catalogKey, def, vitals) {
  const exerciseId = resolveDemographicExerciseId(catalogKey, def?.registryKey ?? null);
  const ladder = getDemographicLadderForExercise(catalogKey, def?.registryKey ?? null, vitals);
  if (!ladder || !exerciseId) return null;

  const gates = demographicLadderToProgressGates(ladder);
  return {
    ladder,
    gates,
    version: 'momentum_v1',
    exerciseId,
    sex: normalizeDemographicSex(vitals.sex),
    ageBand: resolveDemographicAgeBand(vitals.age),
    weightRefKg: PULLUP_REFERENCE_WEIGHT_KG,
    weightAdjustExponent: weightAdjustExponentForExercise(exerciseId),
    weightAdjustsPeak: demographicExerciseUsesWeightAdjustedPeak(exerciseId)
  };
}

export function resolveDemographicGradeFromMetrics(metrics, demographic, vitals = {}) {
  if (!demographic?.ladder) return null;
  const peakReps = demographicPeakRepsForMetrics(metrics, demographic, vitals);
  const indices = resolveDemographicGradeIndices(
    peakReps,
    metrics.maxDailyTotalReps || 0,
    demographic.ladder
  );
  return {
    ...indices,
    rawPeakReps: Math.max(0, Number(metrics.maxSetReps) || 0),
    adjustedPeakReps: peakReps
  };
}
