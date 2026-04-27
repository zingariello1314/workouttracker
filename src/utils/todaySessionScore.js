/**
 * Score de charge / complexité pour la séance « Aujourd'hui » (exos cochés).
 * @module todaySessionScore
 */

import {
  collectExerciseKeysForWorkoutExercise,
  resolveBestRepsStorageKey
} from './exerciseKeyGenerator';
import {
  resolveExerciseIntensityCoeff,
  computeStrengthCalendarContribution,
  computeMedianWeightKgForExercise,
  computeExternalLoadMultiplier
} from './trainingLoadUtils';
import { detectExerciseUnit, calculateAutoReps } from './exerciseCalculations';
import { exerciseUsesExternalLoad } from './programUtils';
import { computeVolumeKgReps } from './exerciseLoadVolume';

/**
 * @param {Date} date
 * @param {object} workout — { exercices, isGymMode? }
 * @param {object} currentData — getCurrentData()
 * @param {boolean} isGymMode
 * @returns {{ completedLoad: number, plannedLoadEstimate: number, score0to100: number | null, completedCount: number, plannedCount: number }}
 */
export function computeTodaySessionComplexity(date, workout, currentData, isGymMode) {
  const exercises = workout?.exercices || workout?.exercises || [];
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return {
      completedLoad: 0,
      plannedLoadEstimate: 0,
      score0to100: null,
      completedCount: 0,
      plannedCount: 0
    };
  }

  let completedLoad = 0;
  let plannedLoadEstimate = 0;
  let completedCount = 0;
  const coeffs = currentData?.exerciseIntensityCoeffs ?? {};
  const weightsStore = currentData?.exerciseWeights || {};

  exercises.forEach((exercise) => {
    const keys = collectExerciseKeysForWorkoutExercise(date, exercise, {
      isGymMode,
      workoutIsGymMode: workout?.isGymMode
    });
    const readKey = resolveBestRepsStorageKey(currentData, keys) || keys[0];
    const isChecked = keys.some((k) => currentData?.checkedExercises?.[k] === true);
    const repsRaw = currentData?.reps?.[readKey];
    const reps = repsRaw !== undefined && repsRaw !== null && String(repsRaw).trim() !== ''
      ? String(repsRaw).trim()
      : '';

    const coeff = resolveExerciseIntensityCoeff(exercise, coeffs);
    const unit = detectExerciseUnit(exercise);
    const autoFromSeries =
      exercise.series && !unit?.isTimeBased ? calculateAutoReps(exercise.series, { round: true }) : null;
    const autoReps = autoFromSeries != null && autoFromSeries > 0 ? autoFromSeries : unit?.isTimeBased ? 60 : 15;
    const usesLoad = exerciseUsesExternalLoad(exercise);
    const medianKg = computeMedianWeightKgForExercise(weightsStore, exercise.id);
    const pickWeightStrForKeys = () => {
      for (const k of keys) {
        const v = weightsStore[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
      return '';
    };
    const pickPerArmForKeys = () => keys.some((k) => currentData?.exerciseWeightPerArm?.[k] === true);
    const pickSetWeightsForKeys = () => {
      for (const k of keys) {
        const a = currentData?.exerciseSetWeights?.[k];
        if (Array.isArray(a) && a.some((x) => String(x ?? '').trim() !== '')) return a;
      }
      return null;
    };
    const wStrPlan = pickWeightStrForKeys();
    const wKgPlan = parseFloat(String(wStrPlan ?? '').replace(',', '.'));
    const planMult = computeExternalLoadMultiplier(usesLoad, wKgPlan, medianKg);
    const plannedGuess = computeStrengthCalendarContribution(exercise, autoReps, coeff, planMult);
    plannedLoadEstimate += plannedGuess;

    if (isChecked && reps !== '') {
      completedCount += 1;
      const perArm = pickPerArmForKeys();
      const setArr = pickSetWeightsForKeys();
      const volumeKg = computeVolumeKgReps({
        exercise,
        totalReps: reps,
        singleWeightStr: pickWeightStrForKeys(),
        perArm,
        setWeightStrs: Array.isArray(setArr) ? setArr : null
      });
      const rNum = parseInt(String(reps), 10) || 0;
      const wKg = rNum > 0 && volumeKg > 0 ? volumeKg / rNum : 0;
      const wMult = computeExternalLoadMultiplier(usesLoad, wKg, medianKg);
      const contrib = computeStrengthCalendarContribution(exercise, reps, coeff, wMult);
      completedLoad += contrib;
    }
  });

  const plannedCount = exercises.length;
  const score0to100 =
    plannedLoadEstimate > 0 ? Math.min(100, Math.round((completedLoad / plannedLoadEstimate) * 100)) : null;

  return {
    completedLoad: Math.round(completedLoad * 10) / 10,
    plannedLoadEstimate: Math.round(plannedLoadEstimate * 10) / 10,
    score0to100,
    completedCount,
    plannedCount
  };
}
