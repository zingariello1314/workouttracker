/**
 * Décompte des séances physiques pour les barres orange du calendrier.
 * Évite les doublons Garmin ↔ saisie Momentum (ex. « Pessac Cardio » + exercices cochés,
 * « Pessac Course à pied » + course Endurance).
 */

import { collectEnduranceSessionsForCalendarDay, garminActivityMatchesCalendarDate } from './calendarUtils';
import {
  hasMomentumWorkoutForDate,
  mergedRunningSessionsForCalendar,
  runningSessionMatchesCalendarDate
} from './calendarDayMomentumStripes';
import { isGarminRunningLikeActivity, isGarminWalkingLikeActivity } from './garminRunningLaps';
import { CALENDAR_PHYSICAL_ACTIVITY_COLOR } from './calendarPhysicalActivityStripes';

function isGarminWalkActivity(act) {
  if (isGarminWalkingLikeActivity(act)) return true;
  const n = `${act?.activityName || act?.name || ''}`.toLowerCase();
  return /\b(marche|walk|randonnée|hike)\b/i.test(n);
}

/** Cardio Garmin hors course et hors marche (street, muscu, elliptique…). */
export function isGarminStreetCardioActivity(act) {
  if (!act) return false;
  if (isGarminWalkActivity(act)) return false;
  if (isGarminRunningLikeActivity(act)) return false;
  return true;
}

export function getGarminStreetCardioActivitiesForDate(garminData, dateStr) {
  return (garminData?.activities?.cardio || []).filter(
    (act) => garminActivityMatchesCalendarDate(act, dateStr) && isGarminStreetCardioActivity(act)
  );
}

export function getGarminRunActivitiesForDate(garminData, dateStr) {
  return (garminData?.activities?.cardio || []).filter((act) => {
    if (!garminActivityMatchesCalendarDate(act, dateStr)) return false;
    if (isGarminWalkActivity(act)) return false;
    return isGarminRunningLikeActivity(act);
  });
}

function getMomentumRunsForDate(workoutData, dateStr) {
  return (collectEnduranceSessionsForCalendarDay(workoutData, dateStr).rows || [])
    .filter((r) => r.activityType === 'running')
    .map((r) => r.session);
}

/**
 * Séances street / muscu : 1 trait si exos cochés + 1 « Pessac Cardio » le même jour.
 * Plusieurs « Pessac Cardio » distincts → plusieurs traits.
 */
export function countStreetWorkoutSessionsForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return 0;
  const streetGarmin = getGarminStreetCardioActivitiesForDate(garminData, dateStr);
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  if (hasWorkout) return Math.max(1, streetGarmin.length);
  return streetGarmin.length;
}

/**
 * Sorties course : fusionne saisie Endurance et activités Garmin du même jour.
 */
export function countRunSessionsForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return 0;

  const momentumRuns = getMomentumRunsForDate(workoutData, dateStr);
  const garminRuns = getGarminRunActivitiesForDate(garminData, dateStr);

  if (momentumRuns.length === 0) return garminRuns.length;
  if (garminRuns.length === 0) {
    const merged = mergedRunningSessionsForCalendar(workoutData, garminData).filter((s) =>
      runningSessionMatchesCalendarDate(s, dateStr)
    );
    return merged.length > 0 ? merged.length : momentumRuns.length;
  }

  const consumedGarmin = new Set();
  let sessionCount = 0;

  for (const session of momentumRuns) {
    const gid = session?.garminId ?? session?.id;
    const garminMatch =
      gid != null
        ? garminRuns.find((g) => String(g.garminId ?? g.id) === String(gid))
        : null;

    if (garminMatch) {
      consumedGarmin.add(String(garminMatch.garminId ?? garminMatch.id));
      sessionCount += 1;
      continue;
    }

    const orphan = garminRuns.find((g) => !consumedGarmin.has(String(g.garminId ?? g.id)));
    if (orphan) {
      consumedGarmin.add(String(orphan.garminId ?? orphan.id));
    }
    sessionCount += 1;
  }

  sessionCount += garminRuns.filter((g) => !consumedGarmin.has(String(g.garminId ?? g.id))).length;
  return sessionCount;
}

/** Barres orange dédoublonnées (street + course). */
export function buildDedupedPhysicalActivityStripes(workoutData, garminData, dateStr) {
  if (!dateStr) return [];

  const stripes = [];
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  const streetCount = countStreetWorkoutSessionsForDate(workoutData, garminData, dateStr);
  const runCount = countRunSessionsForDate(workoutData, garminData, dateStr);

  for (let i = 0; i < streetCount; i++) {
    stripes.push({
      kind: hasWorkout ? 'workout' : 'activity',
      color: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      key: `physical-street-${i}`
    });
  }

  for (let i = 0; i < runCount; i++) {
    stripes.push({
      kind: 'momentumRun',
      color: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      key: `physical-run-${i}`
    });
  }

  return stripes;
}
