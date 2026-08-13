/**
 * Vérité « séance enregistrée » pour le panneau jour du calendrier :
 * ne pas confondre programme prévu, Garmin passif (pas / minutes intensité) et activité volontaire.
 */

import { dayHasGarminRecordedActivity } from './dayJustificationUtils';

/**
 * Activité Garmin enregistrée (course, natation, corde…) avec durée significative — pas le passif quotidien.
 * @param {object} garminData
 * @param {string} dateStr
 * @param {(value: unknown, ctx?: string) => number} parseDurationToMinutes
 * @param {(minutes: number, thresholds: object) => number} calculateTimeIntensityLevel
 * @param {{ thresholds: object }} dynamicTimeThresholds
 */
export function getRecordedGarminWorkoutForDate(
  garminData,
  dateStr,
  { parseDurationToMinutes, calculateTimeIntensityLevel, dynamicTimeThresholds }
) {
  if (!garminData || !dateStr) {
    return { hasActivity: false, intensity: 0, duration: 0, source: null };
  }

  const swimming = (garminData.activities?.swimming || []).filter((a) => a.date === dateStr);
  const jumpRope = (garminData.activities?.jumpRope || []).filter((a) => a.date === dateStr);
  const cardio = (garminData.activities?.cardio || []).filter((a) => a.date === dateStr);

  let totalActivityDuration = 0;
  [...swimming, ...jumpRope, ...cardio].forEach((act) => {
    const duration = parseDurationToMinutes(act.duration || act.totalTime || 0, 'recordedGarminWorkout');
    if (duration > 0) totalActivityDuration += duration;
  });

  if (totalActivityDuration >= 10) {
    const { thresholds: timeThresholds } = dynamicTimeThresholds;
    return {
      hasActivity: true,
      intensity: calculateTimeIntensityLevel(totalActivityDuration, timeThresholds),
      duration: Math.round(totalActivityDuration),
      source: 'recordedActivities'
    };
  }

  return { hasActivity: false, intensity: 0, duration: 0, source: null };
}

/**
 * @param {object} params
 * @param {number} params.completedExercises
 * @param {number} params.enduranceSessionCount
 * @param {boolean} params.isComplementaryChecked
 * @param {number} [params.adHocCompletedCount]
 */
export function dayHasLoggedVoluntaryWorkout({
  completedExercises,
  enduranceSessionCount,
  isComplementaryChecked,
  adHocCompletedCount = 0
}) {
  return (
    completedExercises > 0 ||
    adHocCompletedCount > 0 ||
    isComplementaryChecked === true ||
    (enduranceSessionCount ?? 0) > 0
  );
}

/**
 * Ajuste durée / niveau affichés dans « Statistiques d'entraînement » quand rien n'a été enregistré volontairement.
 */
export function applyCalendarWorkoutStatsTruth(intensity, { hasLoggedWorkout, recordedGarminWorkout }) {
  if (!intensity || hasLoggedWorkout) return intensity;
  const garmin = recordedGarminWorkout?.hasActivity ? recordedGarminWorkout : null;
  return {
    ...intensity,
    duration: garmin?.duration ?? 0,
    level: garmin?.intensity ?? 0
  };
}

/** Jour où l'utilisateur peut justifier une absence (hors activité volontaire enregistrée). */
export function canJustifyCalendarDayAbsence(data, dateStr, garminData = null) {
  if (!data || !dateStr) return false;
  if (dayHasGarminRecordedActivity(garminData, dateStr, data)) return false;
  const prefix = `${String(dateStr).slice(0, 10)}_`;
  const checked = data.checkedExercises || {};
  if (Object.keys(checked).some((k) => k.startsWith(prefix) && checked[k] === true)) return false;

  const sessions = data.enduranceData?.sessions || {};
  for (const activitySessions of Object.values(sessions)) {
    if (!Array.isArray(activitySessions)) continue;
    for (const session of activitySessions) {
      if (session?.date === dateStr && session?.isMock !== true) return false;
    }
  }
  return true;
}
