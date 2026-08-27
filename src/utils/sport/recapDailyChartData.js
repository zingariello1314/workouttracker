/**
 * Données pour courbes Récap / Dashboard (reps, volume kg×reps, pas).
 */
import { aggregateCheckedRepsByDateAndExerciseId, enduranceRepsForSession } from '../trainingLoadUtils';
import { collectPushupEnduranceSessions } from './recapMuscleLoadEngine';
import { normalizeDateString, isMockEnduranceSession } from '../calendarUtils';
import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import { normalizeManualDailyWalkByDate, mergedDailySteps } from './manualDailyWalkUtils';
import { getDateStr } from '../dateUtils';
import { endurancePushupsAlreadyInWorkoutTotals } from '../../services/endurance/pushupEnduranceWorkoutKeys';

export function buildProgramCheckedRepsByDate(allData) {
  const map = new Map();
  const grouped = aggregateCheckedRepsByDateAndExerciseId(allData?.reps, allData?.checkedExercises);
  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const n = Math.floor(Number(r) || 0);
    if (n <= 0) return;
    map.set(dateStr, (map.get(dateStr) || 0) + n);
  });
  return map;
}

export function buildEndurancePushupRepsByDate(allData) {
  const map = new Map();
  collectPushupEnduranceSessions(allData).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds) return;
    if (endurancePushupsAlreadyInWorkoutTotals(allData, ds)) return;
    const n = enduranceRepsForSession('pushups', session);
    if (n <= 0) return;
    map.set(ds, (map.get(ds) || 0) + n);
  });
  return map;
}

export function mergeNumericDateMaps(a, b) {
  const out = new Map(a);
  (b instanceof Map ? b : new Map()).forEach((v, k) => {
    out.set(k, (out.get(k) || 0) + v);
  });
  return out;
}

/** Total reps (programme coché + pompes onglet Endurance) par jour */
export function buildTotalStrengthRepsByDate(allData) {
  return mergeNumericDateMaps(buildProgramCheckedRepsByDate(allData), buildEndurancePushupRepsByDate(allData));
}

/**
 * Premier jour avec volume soulevé (kg×reps) > 0.
 * @param {object} workoutData
 * @returns {string|null} YYYY-MM-DD
 */
export function firstLiftVolumeDate(workoutData) {
  const m = aggregateLiftVolumeKgByDate(workoutData);
  let min = null;
  m.forEach((v, k) => {
    if (!(v > 0)) return;
    if (!min || k < min) min = k;
  });
  return min;
}

export function firstPositiveDateInMap(map) {
  if (!map || map.size === 0) return null;
  let min = null;
  map.forEach((v, k) => {
    if (!(v > 0)) return;
    if (!min || k < min) min = k;
  });
  return min;
}

/**
 * Pas du jour comptabilisés : Garmin prioritaire, manuel en fallback (aligné XP).
 */
export function buildMergedStepsByDate(dailyMetrics, manualRaw) {
  const manual = normalizeManualDailyWalkByDate(manualRaw || {});
  const gm = dailyMetrics && typeof dailyMetrics === 'object' ? dailyMetrics : {};
  const keys = new Set([...Object.keys(gm), ...Object.keys(manual)]);
  const map = new Map();
  keys.forEach((dateKey) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) return;
    const row = gm[dateKey];
    const gSteps =
      row?.steps != null && Number.isFinite(Number(row.steps)) ? Math.max(0, Math.round(Number(row.steps))) : 0;
    const mSteps = manual[dateKey]?.steps || 0;
    const steps = mergedDailySteps(gSteps, mSteps);
    if (steps > 0) map.set(dateKey, steps);
  });
  return map;
}

export function todayYmd() {
  return getDateStr(new Date());
}
