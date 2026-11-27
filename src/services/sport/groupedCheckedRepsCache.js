import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { fingerprintWorkoutAnalytics } from './workoutAnalyticsRevision';

/** @type {{ fp: string|null, grouped: Map|null }} */
let cache = { fp: null, grouped: null };

export function getGroupedCheckedRepsCached(data) {
  const fp = fingerprintWorkoutAnalytics(data);
  if (cache.fp === fp && cache.grouped) return cache.grouped;
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    data?.reps,
    data?.checkedExercises
  );
  cache = { fp, grouped };
  return grouped;
}

export function invalidateGroupedCheckedRepsCache() {
  cache = { fp: null, grouped: null };
}
