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
  weightAdjustExponentForExercise,
  demographicExerciseUsesLoaded1Rm,
  loadedOneRmAdjustExponentForExercise
} from '../../data/performanceBenchmarks/demographicGradeLadders';
import { adjustBodyweightPeakReps, PULLUP_REFERENCE_WEIGHT_KG } from './pullupPerformanceAdjust';
import { adjustLoadedOneRmToRef, LOADED_1RM_REFERENCE_KG } from './loadedOneRmAdjust';
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
 * Pic utilisé pour le grade : reps (ajustées poids si traction / pompe déclinée)
 * ou 1RM haltère équivalent 75 kg pour les curls chargés.
 */
export function demographicPeakRepsForMetrics(metrics, demographic, vitals = {}) {
  if (demographicExerciseUsesLoaded1Rm(demographic?.exerciseId)) {
    const raw = Math.max(
      0,
      Number(metrics.estimatedOneRmKg) || 0,
      Number(metrics.maxWeightKg) || 0
    );
    const exponent = loadedOneRmAdjustExponentForExercise(demographic.exerciseId);
    return adjustLoadedOneRmToRef(raw, vitals.weightKg, {
      refKg: demographic.weightRefKg || LOADED_1RM_REFERENCE_KG,
      exponent
    });
  }
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

export function demographicVolumeForMetrics(metrics, demographic) {
  if (demographicExerciseUsesLoaded1Rm(demographic?.exerciseId)) {
    return Math.max(0, Number(metrics.maxDailyVolumeKg) || 0);
  }
  return Math.max(0, Number(metrics.maxDailyTotalReps) || 0);
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
    weightRefKg: demographicExerciseUsesLoaded1Rm(exerciseId)
      ? LOADED_1RM_REFERENCE_KG
      : PULLUP_REFERENCE_WEIGHT_KG,
    weightAdjustExponent: weightAdjustExponentForExercise(exerciseId),
    loadedOneRmAdjustExponent: loadedOneRmAdjustExponentForExercise(exerciseId),
    weightAdjustsPeak: demographicExerciseUsesWeightAdjustedPeak(exerciseId),
    usesLoaded1Rm: demographicExerciseUsesLoaded1Rm(exerciseId)
  };
}

export function resolveDemographicGradeFromMetrics(metrics, demographic, vitals = {}) {
  if (!demographic?.ladder) return null;
  const peakReps = demographicPeakRepsForMetrics(metrics, demographic, vitals);
  const volume = demographicVolumeForMetrics(metrics, demographic);
  const indices = resolveDemographicGradeIndices(peakReps, volume, demographic.ladder);
  return {
    ...indices,
    rawPeakReps: demographicExerciseUsesLoaded1Rm(demographic.exerciseId)
      ? Math.max(0, Number(metrics.estimatedOneRmKg) || 0, Number(metrics.maxWeightKg) || 0)
      : Math.max(0, Number(metrics.maxSetReps) || 0),
    adjustedPeakReps: peakReps
  };
}
