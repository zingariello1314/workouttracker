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
import { getDateStr } from '../../../../utils/dateUtils';
import { resolveExercisePyramidPattern } from '../../../../services/trainingPatterns/resolveExercisePyramidPattern';
import { appendPyramidSessionLogEntry } from '../../../../services/trainingPatterns/pyramidSessionLog';
import {
  collectRecentSessionTotalsForExercise,
  estimateSessionsPerWeek
} from '../../../../services/trainingPatterns/pyramidUserSignals';

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

function pickStoredSessionStars(map, keys, primaryKey) {
  for (const key of keys) {
    const s = map[key];
    const n = Number(s);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  }
  const p = map[primaryKey];
  const pn = Number(p);
  if (Number.isFinite(pn) && pn >= 1 && pn <= 5) return pn;
  return null;
}

function pickEffortSessionStars(currentData, keys, primaryKey) {
  return pickStoredSessionStars(currentData?.exerciseSessionEffortStars || {}, keys, primaryKey);
}

function pickStoredSessionPleasureStars(currentData, keys, primaryKey) {
  return pickStoredSessionStars(currentData?.exerciseSessionPleasureStars || {}, keys, primaryKey);
}

/**
 * @returns {{ toggleExercise: Function, updateReps: Function, updateSessionEffortStars: Function, updateSessionPleasureStars: Function, getExerciseStatus: Function }}
 */
export const useExerciseTracking = (options = {}) => {
  const {
    currentDate,
    isGymMode: contextIsGymMode,
    getCurrentData,
    updateTempExerciseData,
    activeProgram
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
        const nextStars = { ...(currentData.exerciseSessionEffortStars || {}) };
        const nextPleasure = { ...(currentData.exerciseSessionPleasureStars || {}) };

        keys.forEach((k) => {
          delete nextReps[k];
          delete nextChk[k];
          delete nextStars[k];
          delete nextPleasure[k];
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

        const dateStr = getDateStr(date);
        const recent = collectRecentSessionTotalsForExercise(currentData.reps || {}, exercise.id, {
          maxDays: 90
        });
        const sessionsPerWeek = estimateSessionsPerWeek(currentData.reps || {}, exercise.id, {
          windowDays: 42
        });
        const mergedExercise = {
          ...exercise,
          series: seriesSource || exercise.series
        };
        const pattern = resolveExercisePyramidPattern({
          dailyVariations: currentData.dailyVariations,
          dateStr,
          exercise: mergedExercise,
          records: currentData.exerciseMaxRecords || [],
          meanSessionTotal: recent.meanPerSession,
          sessionsPerWeek
        });
        let nextData = {
          ...currentData,
          checkedExercises: nextChk,
          reps: nextReps,
          exerciseSessionEffortStars: nextStars,
          exerciseSessionPleasureStars: nextPleasure
        };
        if (pattern) {
          const repsDone = Math.max(0, Math.round(Number(repsVal) || 0));
          nextData = appendPyramidSessionLogEntry(nextData, {
            dateStr,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            repsDone: repsDone || pattern.totalReps || 0,
            plannedTotalReps: pattern.totalReps || 0,
            patternType: pattern.patternType,
            programId: activeProgram?.id != null ? String(activeProgram.id) : null,
            source: 'today_check'
          });
        }

        updateTempExerciseData(nextData);
        return;
      }

      const nextReps = { ...(currentData.reps || {}) };
      const nextChk = { ...(currentData.checkedExercises || {}) };
      const nextStars = { ...(currentData.exerciseSessionEffortStars || {}) };
      const nextPleasure = { ...(currentData.exerciseSessionPleasureStars || {}) };
      keys.forEach((k) => {
        delete nextReps[k];
        delete nextChk[k];
        delete nextStars[k];
        delete nextPleasure[k];
      });

      updateTempExerciseData({
        ...currentData,
        checkedExercises: nextChk,
        reps: nextReps,
        exerciseSessionEffortStars: nextStars,
        exerciseSessionPleasureStars: nextPleasure
      });
    },
    [
      date,
      getCurrentData,
      updateTempExerciseData,
      workout.exercices,
      allKeysForExercise,
      primaryKeyForExercise,
      activeProgram?.id
    ]
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
   * @param {number} starCount — 1–5 (dernier clic gagne)
   */
  const updateSessionEffortStars = useCallback(
    (exercise, starCount) => {
      const currentData = getCurrentData();
      const primaryKey = primaryKeyForExercise(exercise);
      const keys = allKeysForExercise(exercise);
      const next = { ...(currentData.exerciseSessionEffortStars || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) delete next[k];
      });
      const n = Math.round(Number(starCount));
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        delete next[primaryKey];
      } else {
        next[primaryKey] = n;
      }
      updateTempExerciseData({
        ...currentData,
        exerciseSessionEffortStars: next
      });
    },
    [getCurrentData, updateTempExerciseData, primaryKeyForExercise, allKeysForExercise]
  );

  const updateSessionPleasureStars = useCallback(
    (exercise, starCount) => {
      const currentData = getCurrentData();
      const primaryKey = primaryKeyForExercise(exercise);
      const keys = allKeysForExercise(exercise);
      const next = { ...(currentData.exerciseSessionPleasureStars || {}) };
      keys.forEach((k) => {
        if (k !== primaryKey) delete next[k];
      });
      const n = Math.round(Number(starCount));
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        delete next[primaryKey];
      } else {
        next[primaryKey] = n;
      }
      updateTempExerciseData({
        ...currentData,
        exerciseSessionPleasureStars: next
      });
    },
    [getCurrentData, updateTempExerciseData, primaryKeyForExercise, allKeysForExercise]
  );

  /**
   * @param {Object} exercise
   * @returns {{ isChecked: boolean, reps: string, sessionEffortStars: number|null, sessionPleasureStars: number|null }}
   */
  const getExerciseStatus = useCallback(
    (exercise) => {
      const currentData = getCurrentData();
      const keys = allKeysForExercise(exercise);
      const primaryKey = primaryKeyForExercise(exercise);
      const picked = pickStoredState(currentData, keys);
      return {
        isChecked: picked.isChecked,
        reps: picked.reps,
        sessionEffortStars: pickEffortSessionStars(currentData, keys, primaryKey),
        sessionPleasureStars: pickStoredSessionPleasureStars(currentData, keys, primaryKey)
      };
    },
    [getCurrentData, allKeysForExercise, primaryKeyForExercise]
  );

  return {
    toggleExercise,
    updateReps,
    updateSessionEffortStars,
    updateSessionPleasureStars,
    getExerciseStatus
  };
};

export default useExerciseTracking;
