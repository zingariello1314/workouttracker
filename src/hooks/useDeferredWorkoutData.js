import { useDeferredValue, useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { fingerprintWorkoutAnalytics } from '../services/sport/workoutAnalyticsRevision';

/**
 * Données workout différées pour modules sidebar lourds.
 * Les interactions Aujourd’hui restent urgentes ; les agrégats suivent en transition.
 */
export function useDeferredWorkoutData() {
  const workout = useWorkout();
  const deferredData = useDeferredValue(workout.data);
  const revision = useMemo(
    () => fingerprintWorkoutAnalytics(deferredData),
    [deferredData]
  );
  const isStale = deferredData !== workout.data;

  return {
    ...workout,
    data: deferredData,
    liveData: workout.data,
    analyticsRevision: revision,
    isAnalyticsStale: isStale
  };
}
