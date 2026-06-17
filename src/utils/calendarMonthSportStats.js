/**
 * Statistiques mensuelles sport pour la vue année du calendrier.
 */

import { aggregateLiftVolumeKgByDate } from './exerciseLoadVolume';
import {
  collectEnduranceSessionsForCalendarDay,
  garminActivityMatchesCalendarDate,
  isMockEnduranceSession,
  normalizeDateString,
  parseDurationToMinutes,
  validateDate
} from './calendarUtils';
import { hasMomentumWorkoutForDate } from './calendarDayMomentumStripes';
import {
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity,
  shouldExcludeStoredGarminRunningSession
} from './garminRunningLaps';
import { mergeGarminCardioIntoRunningSessions } from './garminEnduranceSessionBridge';
import { parseRunningSessionDurationMinutes } from './runningPersonalRecords';
import { calculateLongestTrainingStreakInMonth } from './trainingStreakUtils';
import { roundSportMinutes } from './calendarSportStatsFormat';

function mergedRunningSessionsForCalendar(workoutData, garminData) {
  const stored = workoutData?.enduranceData?.sessions?.running || [];
  const garminActs = (garminData?.activities?.cardio || []).filter((a) =>
    isGarminRunningLikeActivity(a)
  );
  return mergeGarminCardioIntoRunningSessions(stored, garminActs);
}

function runningSessionMatchesCalendarDate(session, dateStr) {
  if (!session || !dateStr) return false;
  if (isMockEnduranceSession(session)) return false;
  if (shouldExcludeStoredGarminRunningSession(session)) return false;
  const normalized = normalizeDateString(session.date);
  if (normalized === dateStr) return true;
  const dv = validateDate(session.date, 'monthStats.running');
  return dv.normalizedDate === dateStr;
}

function garminActivityDurationMin(act) {
  if (act.duration != null) {
    const n = Number(act.duration);
    if (Number.isFinite(n) && n > 0) {
      return n > 200 ? Math.round(n / 60) : Math.round(n);
    }
    return parseDurationToMinutes(act.duration, 'monthStats.duration');
  }
  if (act.durationSec != null) return parseDurationToMinutes(act.durationSec, 'monthStats.durationSec');
  if (act.totalTime != null) {
    const n = Number(act.totalTime);
    return Number.isFinite(n) ? (n > 200 ? Math.round(n / 60) : n) : 0;
  }
  if (act.elapsedTime != null) {
    const n = Number(act.elapsedTime);
    return Number.isFinite(n) ? Math.round(n / 60) : 0;
  }
  return 0;
}

function garminActivityDistanceKm(act) {
  const raw = act.distance?.total ?? act.distance?.value ?? act.distance ?? act.totalDistance ?? act.distanceKm;
  if (raw == null) return 0;
  const n = parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 500) return Math.round((n / 1000) * 10) / 10;
  return Math.round(n * 10) / 10;
}

function isWalkLikeGarminActivity(act) {
  if (isGarminWalkingLikeActivity(act)) return true;
  const n = `${act.activityName || act.name || ''}`.toLowerCase();
  return /\b(marche|walk|randonnée|hike)\b/i.test(n);
}

function enduranceSessionDurationMin(session, activityType) {
  if (activityType === 'running') {
    return roundSportMinutes(parseRunningSessionDurationMinutes(session?.duration));
  }
  if (session?.duration) {
    return roundSportMinutes(
      parseDurationToMinutes(session.duration, `monthStats.endurance.${activityType}`)
    );
  }
  return 0;
}

function runningStatsForDate(workoutData, garminData, dateStr) {
  let km = 0;
  let min = 0;
  const seen = new Set();

  mergedRunningSessionsForCalendar(workoutData, garminData).forEach((session) => {
    if (!runningSessionMatchesCalendarDate(session, dateStr)) return;
    const key = String(session.garminId ?? session.id ?? `${session.date}_${session.time}`);
    if (seen.has(key)) return;
    seen.add(key);
    const dist = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
    if (dist > 0) km += dist;
    min += roundSportMinutes(parseRunningSessionDurationMinutes(session.duration));
  });

  (garminData?.activities?.cardio || [])
    .filter((a) => garminActivityMatchesCalendarDate(a, dateStr))
    .forEach((act) => {
      if (isWalkLikeGarminActivity(act) || !isGarminRunningLikeActivity(act)) return;
      const key = `g_${act.garminId ?? act.id ?? act.date}`;
      if (seen.has(key)) return;
      seen.add(key);
      km += garminActivityDistanceKm(act);
      min += garminActivityDurationMin(act);
    });

  return { km, min };
}

/**
 * @param {Array<{ isCurrentMonth?: boolean, date: Date, intensity?: object }>} monthDays
 * @param {object|null} workoutData
 * @param {object|null} garminData
 * @param {(date: Date) => string} getDateStrFn
 */
export function computeCalendarMonthSportStats(
  monthDays,
  workoutData,
  garminData,
  getDateStrFn
) {
  const liftMap = aggregateLiftVolumeKgByDate(workoutData);
  let totalReps = 0;
  let runningKm = 0;
  let runningMinutes = 0;
  let otherExerciseMinutes = 0;
  let totalKg = 0;

  const currentMonthDays = (monthDays || []).filter((d) => d.isCurrentMonth);
  let year = new Date().getFullYear();
  let monthIndex = 0;
  if (currentMonthDays[0]?.date) {
    year = currentMonthDays[0].date.getFullYear();
    monthIndex = currentMonthDays[0].date.getMonth();
  }

  currentMonthDays.forEach((day) => {
    const dateStr = getDateStrFn(day.date);
    const intensity = day.intensity || {};
    totalReps += Number(intensity.reps) || 0;
    totalKg += liftMap.get(dateStr) || 0;

    const runStats = runningStatsForDate(workoutData, garminData, dateStr);
    runningKm += runStats.km;
    runningMinutes += runStats.min;

    const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
    rows.forEach(({ activityType, session }) => {
      if (activityType === 'running') return;
      const dur = enduranceSessionDurationMin(session, activityType);
      if (dur > 0) otherExerciseMinutes += dur;
    });

    const garminActs = [
      ...(garminData?.activities?.swimming || []).filter((a) =>
        garminActivityMatchesCalendarDate(a, dateStr)
      ),
      ...(garminData?.activities?.jumpRope || []).filter((a) =>
        garminActivityMatchesCalendarDate(a, dateStr)
      ),
      ...(garminData?.activities?.cardio || []).filter((a) =>
        garminActivityMatchesCalendarDate(a, dateStr)
      )
    ];

    garminActs.forEach((act) => {
      if (isWalkLikeGarminActivity(act)) return;
      if (isGarminRunningLikeActivity(act)) return;
      const dur = roundSportMinutes(garminActivityDurationMin(act));
      if (dur > 0) otherExerciseMinutes += dur;
    });

    if (hasMomentumWorkoutForDate(workoutData, dateStr)) {
      const dayDur = roundSportMinutes(Number(intensity.duration) || 0);
      const strengthRemainder = Math.max(0, dayDur - runStats.min);
      if (strengthRemainder > 0) {
        otherExerciseMinutes += strengthRemainder;
      } else if (dayDur > 0 && runStats.min === 0) {
        otherExerciseMinutes += dayDur;
      }
    }
  });

  runningKm = Math.round(runningKm * 10) / 10;
  runningMinutes = roundSportMinutes(runningMinutes);
  otherExerciseMinutes = roundSportMinutes(otherExerciseMinutes);
  totalKg = Math.round(totalKg);

  return {
    totalReps,
    runningKm,
    runningMinutes,
    otherExerciseMinutes,
    totalMinutes: runningMinutes + otherExerciseMinutes,
    totalKg,
    longestStreak: calculateLongestTrainingStreakInMonth(workoutData, year, monthIndex)
  };
}
