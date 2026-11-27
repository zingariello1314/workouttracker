/**
 * Couche commune d’agrégats sportifs pour la sidebar (et réutilisable ailleurs).
 * - Une seule agrégation checked-reps par révision
 * - Cache borné des résultats muscle / muscu
 * - Même fonction métier (computeRecapMuscleState / buildRecapStrengthCompareModel)
 *
 * Ne crée pas une source de vérité concurrente : lit le snapshot workout fourni.
 */

import { computeRecapMuscleState } from '../../utils/sport/recapMuscleLoadEngine';
import { buildRecapStrengthCompareModel } from '../../utils/sport/recapStrengthPeriodStats';
import { fingerprintWorkoutAnalytics } from './workoutAnalyticsRevision';
import {
  getGroupedCheckedRepsCached,
  invalidateGroupedCheckedRepsCache
} from './groupedCheckedRepsCache';

const MAX_ENTRIES = 24;

/** @type {Map<string, any>} */
const muscleCache = new Map();
/** @type {Map<string, any>} */
const strengthCache = new Map();

function touch(map, key, value) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
  }
  return value;
}

export { getGroupedCheckedRepsCached };

/**
 * Variante cache de computeRecapMuscleState (règles inchangées).
 */
function muscleCacheKey(allData, period, referenceDate, windowOverride) {
  const fp = fingerprintWorkoutAnalytics(allData);
  const ymd =
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? referenceDate.toISOString().slice(0, 10)
      : String(referenceDate || '');
  const winKey = windowOverride?.end
    ? `${windowOverride.start || ''}:${windowOverride.end}`
    : 'default';
  return `muscle|${fp}|${period}|${ymd}|${winKey}`;
}

function strengthCacheKey(allData, period, refDate, numBars, windowOverride) {
  const fp = fingerprintWorkoutAnalytics(allData);
  const ymd =
    refDate instanceof Date && !Number.isNaN(refDate.getTime())
      ? refDate.toISOString().slice(0, 10)
      : String(refDate || '');
  const winKey = windowOverride?.end
    ? `${windowOverride.start || ''}:${windowOverride.end}`
    : 'default';
  return `strength|${fp}|${period}|${ymd}|${numBars}|${winKey}`;
}

export function peekCachedRecapMuscleState(
  allData,
  period,
  referenceDate = new Date(),
  windowOverride = null
) {
  const key = muscleCacheKey(allData, period, referenceDate, windowOverride);
  return muscleCache.has(key) ? muscleCache.get(key) : null;
}

export function seedCachedRecapMuscleState(
  allData,
  period,
  referenceDate,
  result,
  windowOverride = null
) {
  if (!result) return result;
  return touch(
    muscleCache,
    muscleCacheKey(allData, period, referenceDate, windowOverride),
    result
  );
}

export function getCachedRecapMuscleState(
  allData,
  period,
  getExerciseNameById,
  referenceDate = new Date(),
  windowOverride = null
) {
  const key = muscleCacheKey(allData, period, referenceDate, windowOverride);
  if (muscleCache.has(key)) return muscleCache.get(key);

  const result = computeRecapMuscleState(
    allData,
    period,
    getExerciseNameById,
    referenceDate,
    windowOverride
  );
  return touch(muscleCache, key, result);
}

/**
 * Variante cache de buildRecapStrengthCompareModel (règles inchangées).
 */
export function peekCachedRecapStrengthCompareModel(
  allData,
  period,
  refDate = new Date(),
  numBars = 8,
  windowOverride = null
) {
  const key = strengthCacheKey(allData, period, refDate, numBars, windowOverride);
  return strengthCache.has(key) ? strengthCache.get(key) : null;
}

export function seedCachedRecapStrengthCompareModel(
  allData,
  period,
  refDate,
  numBars,
  result,
  windowOverride = null
) {
  if (!result) return result;
  return touch(
    strengthCache,
    strengthCacheKey(allData, period, refDate, numBars, windowOverride),
    result
  );
}

export function getCachedRecapStrengthCompareModel(
  allData,
  period,
  getExerciseNameById,
  refDate = new Date(),
  numBars = 8,
  windowOverride = null
) {
  const key = strengthCacheKey(allData, period, refDate, numBars, windowOverride);
  if (strengthCache.has(key)) return strengthCache.get(key);

  const result = buildRecapStrengthCompareModel(
    allData,
    period,
    getExerciseNameById,
    refDate,
    numBars,
    windowOverride
  );
  return touch(strengthCache, key, result);
}

export function invalidateSportRecapAggregatesCache() {
  invalidateGroupedCheckedRepsCache();
  muscleCache.clear();
  strengthCache.clear();
}

export function peekSportRecapAggregatesCacheStats() {
  return {
    muscleEntries: muscleCache.size,
    strengthEntries: strengthCache.size
  };
}
