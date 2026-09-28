import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  buildExerciseGradeCatalog,
  sortExerciseGradeRows
} from '../services/xp/exerciseGradeEngine';
import { resolveExerciseGradeVitals } from '../services/xp/exerciseGradeVitals';
import {
  backfillExerciseDisplayNames,
  buildExerciseNameIndexFromPrograms,
  resolveExerciseDisplayName
} from '../utils/workoutExerciseIdResolve';

function scheduleHeavyWork(fn) {
  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const clear = () => {
    if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
    if (timerId) window.clearTimeout(timerId);
    idleId = 0;
    timerId = 0;
  };

  const attempt = (deadline) => {
    if (cancelled) return;
    const inputPending = navigator.scheduling?.isInputPending?.({ includeContinuous: true });
    const sliceTooSmall = deadline && !deadline.didTimeout && deadline.timeRemaining() < 12;
    if (inputPending || sliceTooSmall) {
      clear();
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(attempt, { timeout: 8000 });
      } else {
        timerId = window.setTimeout(() => attempt(null), 250);
      }
      return;
    }
    fn();
  };

  if (typeof requestIdleCallback === 'function') {
    idleId = requestIdleCallback(attempt, { timeout: 8000 });
  } else {
    timerId = window.setTimeout(() => attempt(null), 48);
  }

  return () => {
    cancelled = true;
    clear();
  };
}

function cancelHeavyWork(cancel) {
  if (typeof cancel === 'function') cancel();
}

export function useExerciseGrades({ sortMode = 'grade', vitalsRefreshKey = 0, enabled = true } = {}) {
  const { currentUser } = useAuth();
  const {
    getCurrentData,
    getExerciseNameById,
    programs,
    data,
    hasUnsavedExercises,
    hasUnsavedStretches
  } = useWorkout();
  const workoutData = useMemo(
    () => getCurrentData(),
    [getCurrentData, data, hasUnsavedExercises, hasUnsavedStretches]
  );
  const programNameIndex = useMemo(
    () => buildExerciseNameIndexFromPrograms(programs),
    [programs]
  );
  const resolveExerciseName = useCallback(
    (exerciseId) =>
      resolveExerciseDisplayName(exerciseId, workoutData, programNameIndex, getExerciseNameById),
    [workoutData, programNameIndex, getExerciseNameById]
  );

  const [state, setState] = useState(() => ({
    vitals: null,
    rows: [],
    totalGradedExercises: 0,
    isComputing: Boolean(enabled)
  }));
  const genRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setState({ vitals: null, rows: [], totalGradedExercises: 0, isComputing: false });
      return undefined;
    }

    if (!workoutData) {
      setState({ vitals: null, rows: [], totalGradedExercises: 0, isComputing: false });
      return undefined;
    }

    const gen = ++genRef.current;
    setState((prev) => ({ ...prev, isComputing: true }));

    const run = () => {
      if (gen !== genRef.current) return;
      try {
        const vitals = resolveExerciseGradeVitals({
          progressEntries: workoutData?.progressEntries,
          profileQuestionnaireRaw: currentUser?.profileQuestionnaire
        });
        const displayNames = backfillExerciseDisplayNames(
          workoutData,
          programs,
          getExerciseNameById
        );
        const snapshotForGrades =
          displayNames !== workoutData?.exerciseDisplayNames
            ? { ...workoutData, exerciseDisplayNames: displayNames }
            : workoutData;
        const catalog = buildExerciseGradeCatalog(
          snapshotForGrades,
          resolveExerciseName,
          vitals
        );
        const rows = sortExerciseGradeRows(catalog, sortMode);
        if (gen !== genRef.current) return;
        setState({
          vitals,
          rows,
          totalGradedExercises: rows.length,
          isComputing: false
        });
      } catch (err) {
        if (gen !== genRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[useExerciseGrades]', err);
        }
        setState({ vitals: null, rows: [], totalGradedExercises: 0, isComputing: false });
      }
    };

    const id = scheduleHeavyWork(run);
    return () => {
      genRef.current += 1;
      cancelHeavyWork(id);
    };
  }, [
    enabled,
    workoutData,
    programs,
    getExerciseNameById,
    resolveExerciseName,
    currentUser?.profileQuestionnaire,
    sortMode,
    vitalsRefreshKey
  ]);

  return state;
}

export default useExerciseGrades;
