/**
 * Sync des reps sessions endurance (pompes…) → `reps` / `checkedExercises` journaliers.
 * @module services/endurance/enduranceRepsWorkoutSync
 */

import { loadEnduranceData } from './enduranceDataService';
import { resolvePushupSessionTotalReps } from './pushupSessionUtils';
import { resolveSessionCalendarDate, readGarminActivityDateOverrides } from '../../utils/sessionCalendarDate';

/** Activités dont les reps comptent comme reps programme + clé d’exercice. */
export const ENDURANCE_REP_ACTIVITY_WORKOUT_ID = {
  pushups: 104
};

export const ENDURANCE_REP_ACTIVITIES = Object.keys(ENDURANCE_REP_ACTIVITY_WORKOUT_ID);

export function resolveEnduranceRepWorkoutStorageKey(dateStr, activityType) {
  const d = String(dateStr || '').slice(0, 10);
  const exId = ENDURANCE_REP_ACTIVITY_WORKOUT_ID[activityType];
  if (exId == null) return null;
  return `${d}_${exId}`;
}

function sessionRepsCount(session) {
  if (!session || typeof session !== 'object') return 0;
  if (session.activityType === 'pushups' || session.count !== undefined || session.setCount !== undefined) {
    return resolvePushupSessionTotalReps(session);
  }
  const raw =
    session.count !== undefined && session.count !== null
      ? session.count
      : session.reps !== undefined && session.reps !== null
        ? session.reps
        : 0;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sessionCalendarYmd(session, workoutAggregate) {
  const overrides = readGarminActivityDateOverrides(workoutAggregate);
  return resolveSessionCalendarDate(session, overrides) || String(session?.date || '').slice(0, 10);
}

/**
 * Somme des reps endurance mappées pour une activité un jour donné.
 */
export function sumEnduranceRepSessionsOnDay(enduranceData, dateStr, activityType, workoutAggregate = null) {
  const normalized = loadEnduranceData(enduranceData || {});
  const list = normalized.sessions?.[activityType];
  if (!Array.isArray(list)) return 0;
  return list.reduce((sum, session) => {
    const ymd = sessionCalendarYmd(session, workoutAggregate);
    if (ymd !== dateStr) return sum;
    return sum + sessionRepsCount(session);
  }, 0);
}

/** Dates distinctes ayant au moins une session reps mappable. */
export function collectEnduranceRepSessionDates(enduranceData, workoutAggregate = null) {
  const normalized = loadEnduranceData(enduranceData || {});
  const dates = new Set();
  ENDURANCE_REP_ACTIVITIES.forEach((activityType) => {
    const list = normalized.sessions?.[activityType];
    if (!Array.isArray(list)) return;
    list.forEach((session) => {
      const ymd = sessionCalendarYmd(session, workoutAggregate);
      if (ymd) dates.add(ymd);
    });
  });
  return [...dates].sort();
}

/**
 * Met à jour reps/checked pour la part endurance (préserve programme + GTG).
 */
export function syncEnduranceRepsDayToWorkoutData(workoutData, enduranceData, dateStr, workoutAggregate = null) {
  const d = String(dateStr || '').slice(0, 10);
  if (!d) return workoutData;

  const ed = { ...(workoutData?.enduranceData || {}), ...(enduranceData || {}) };
  const syncRoot =
    ed.repWorkoutSync && typeof ed.repWorkoutSync === 'object' ? { ...ed.repWorkoutSync } : {};
  const dayLedger =
    syncRoot[d] && typeof syncRoot[d] === 'object' ? { ...syncRoot[d] } : {};

  const nextReps = { ...(workoutData?.reps || {}) };
  const nextChecked = { ...(workoutData?.checkedExercises || {}) };

  ENDURANCE_REP_ACTIVITIES.forEach((activityType) => {
    const key = resolveEnduranceRepWorkoutStorageKey(d, activityType);
    if (!key) return;
    const enduranceReps = sumEnduranceRepSessionsOnDay(ed, d, activityType, workoutAggregate ?? workoutData);
    const prevEndurance = Number(dayLedger[activityType]) || 0;
    const currentTotal = Math.max(0, parseInt(nextReps[key], 10) || 0);
    const baseWithout = Math.max(0, currentTotal - prevEndurance);
    const newTotal = baseWithout + enduranceReps;

    if (newTotal > 0) {
      nextReps[key] = String(newTotal);
      nextChecked[key] = true;
    } else if (baseWithout > 0) {
      nextReps[key] = String(baseWithout);
      nextChecked[key] = true;
    } else {
      delete nextReps[key];
      nextChecked[key] = false;
    }
    dayLedger[activityType] = enduranceReps;
  });

  syncRoot[d] = dayLedger;

  return {
    ...workoutData,
    reps: nextReps,
    checkedExercises: nextChecked,
    enduranceData: {
      ...ed,
      repWorkoutSync: syncRoot,
      lastUpdated: ed.lastUpdated || new Date().toISOString()
    }
  };
}

export function syncAllEnduranceRepsToWorkoutData(workoutData, workoutAggregate = null) {
  let next = workoutData || {};
  const dates = collectEnduranceRepSessionDates(next.enduranceData, workoutAggregate ?? next);
  dates.forEach((dateStr) => {
    next = syncEnduranceRepsDayToWorkoutData(next, next.enduranceData, dateStr, workoutAggregate ?? next);
  });
  return next;
}
