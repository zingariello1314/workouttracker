/**
 * 🏋️ HOOK USE EXERCISE TRACKING
 *
 * Gère check/reps avec clés stables ; lit aussi les variantes de clés (salle A/B, id original)
 * pour ne pas « perdre » les reps après changement de mode ou de mapping d’id programme.
 */

import { useCallback } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTodayWorkout } from './useTodayWorkout';
import {
  generateSmartExerciseKey,
  collectExerciseKeysForWorkoutExercise
} from '../../../../utils/exerciseKeyGenerator';
import { calculateAutoReps } from '../../../../utils/exerciseCalculations';

function pickStoredState(currentData, keys) {
  for (const key of keys) {
    const r = currentData.reps?.[key];
    const c = currentData.checkedExercises?.[key];
    const hasR = r !== undefined && r !== null && String(r).trim() !== '';
    if (hasR || c) {
      return { key, reps: hasR ? String(r) : '', isChecked: !!c };
    }
  }
  return { key: keys[0] || '', reps: '', isChecked: false };
}

/**
 * @returns {{ toggleExercise: Function, updateReps: Function, getExerciseStatus: Function }}
 */
export const useExerciseTracking = (options = {}) => {
  const {
    currentDate,
    isGymMode: contextIsGymMode,
    getCurrentData,
    updateTempExerciseData
  } = useWorkout();

  const { workout, weekVariant } = useTodayWorkout({
    date: options.date || currentDate,
    isGymMode: options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode
  });

  const date = options.date || currentDate;
  const isGymMode = options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode;

  const keyOptions = useCallback(
    () => ({
      isGymMode,
      workoutIsGymMode: workout.isGymMode,
      weekVariant
    }),
    [isGymMode, workout.isGymMode, weekVariant]
  );

  const allKeysForExercise = useCallback(
    (exercise) => collectExerciseKeysForWorkoutExercise(date, exercise, keyOptions()),
    [date, keyOptions]
  );

  const primaryKeyForExercise = useCallback(
    (exercise) => generateSmartExerciseKey(date, exercise.id, keyOptions()),
    [date, keyOptions]
  );

  /**
   * @param {Object} exercise — au minimum { id, series?, originalId? }
   */
  const toggleExercise = useCallback(
    (exercise) => {
      const currentData = getCurrentData();
      const keys = allKeysForExercise(exercise);
      const primaryKey = primaryKeyForExercise(exercise);
      const isCurrentlyChecked = keys.some((k) => currentData.checkedExercises?.[k]);

      if (!isCurrentlyChecked) {
        const exInWorkout = workout.exercices?.find((ex) => ex.id === exercise.id);
        const seriesSource = exInWorkout?.series || exercise?.series;

        const nextReps = { ...(currentData.reps || {}) };
        const nextChk = { ...(currentData.checkedExercises || {}) };

        keys.forEach((k) => {
          delete nextReps[k];
          delete nextChk[k];
        });

        let repsVal = '';
        if (seriesSource) {
          const autoReps = calculateAutoReps(seriesSource, { round: true });
          if (autoReps !== null) repsVal = autoReps.toString();
        }
        if (!repsVal) {
          const prev = pickStoredState(currentData, keys);
          repsVal = prev.reps || '';
        }

        nextChk[primaryKey] = true;
        nextReps[primaryKey] = repsVal;

        updateTempExerciseData({
          ...currentData,
          checkedExercises: nextChk,
          reps: nextReps
        });
        return;
      }

      const nextReps = { ...(currentData.reps || {}) };
      const nextChk = { ...(currentData.checkedExercises || {}) };
      keys.forEach((k) => {
        delete nextReps[k];
        delete nextChk[k];
      });

      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChk,
        reps: nextReps
      });
    },
    [date, getCurrentData, updateTempExerciseData, workout.exercices, allKeysForExercise, primaryKeyForExercise]
  );

  /**
   * @param {Object} exercise
   * @param {string} reps
   */
  const updateReps = useCallback(
    (exercise, reps) => {
      const currentData = getCurrentData();
      const primaryKey = primaryKeyForExercise(exercise);
      const keys = allKeysForExercise(exercise);
      const nextReps = { ...(currentData.reps || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) delete nextReps[k];
      });
      nextReps[primaryKey] = reps;

      updateTempExerciseData({
        ...currentData,
        reps: nextReps
      });
    },
    [getCurrentData, updateTempExerciseData, primaryKeyForExercise, allKeysForExercise]
  );

  /**
   * @param {Object} exercise
   * @returns {{ isChecked: boolean, reps: string }}
   */
  const getExerciseStatus = useCallback(
    (exercise) => {
      const currentData = getCurrentData();
      const keys = allKeysForExercise(exercise);
      const picked = pickStoredState(currentData, keys);
      return {
        isChecked: picked.isChecked,
        reps: picked.reps
      };
    },
    [getCurrentData, allKeysForExercise]
  );

  return {
    toggleExercise,
    updateReps,
    getExerciseStatus
  };
};

export default useExerciseTracking;
