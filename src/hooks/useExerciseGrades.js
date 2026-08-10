import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  buildExerciseGradeCatalog,
  sortExerciseGradeRows
} from '../services/xp/exerciseGradeEngine';
import { resolveExerciseGradeVitals } from '../services/xp/exerciseGradeVitals';

export function useExerciseGrades({ sortMode = 'grade', vitalsRefreshKey = 0 } = {}) {
  const { currentUser } = useAuth();
  const {
    getCurrentData,
    getExerciseNameById,
    data,
    tempData,
    hasUnsavedExercises,
    hasUnsavedStretches
  } = useWorkout();
  const workoutData = useMemo(
    () => getCurrentData(),
    [getCurrentData, data, tempData, hasUnsavedExercises, hasUnsavedStretches]
  );

  return useMemo(() => {
    const vitals = resolveExerciseGradeVitals({
      progressEntries: workoutData?.progressEntries,
      profileQuestionnaireRaw: currentUser?.profileQuestionnaire
    });

    const catalog = buildExerciseGradeCatalog(workoutData, getExerciseNameById, vitals);
    const rows = sortExerciseGradeRows(catalog, sortMode);

    return {
      vitals,
      rows,
      totalGradedExercises: rows.length
    };
  }, [workoutData, getExerciseNameById, currentUser?.profileQuestionnaire, sortMode, vitalsRefreshKey]);
}

export default useExerciseGrades;
