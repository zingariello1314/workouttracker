/**
 * Statistiques mensuelles sport pour la vue année du calendrier.
 */

import { aggregateLiftVolumeKgByDate } from './exerciseLoadVolume';
import { calculateLongestTrainingStreakInMonth } from './trainingStreakUtils';
import { roundSportMinutes } from './calendarSportStatsFormat';
import { buildRunningSessionRows } from './sport/runningCardioStatsAnalytics';
import {
  buildGarminCardioById,
  filterRunningSessionsBase,
  mergeRunningSessionsWithGarmin
} from './sport/runningVolumeTruth';
import { computeNonRunningExerciseMinutesForDate } from './calendarPhysicalSessionStripes';
import { dayCountsAsCalendarTrainingDay } from './sport/recapTrainingDayTruth';
import { mergedDailySteps, normalizeManualDailyWalkByDate } from './sport/manualDailyWalkUtils';

function stepsForDate(garminData, workoutData, dateStr) {
  const manualMap = normalizeManualDailyWalkByDate(
    workoutData?.enduranceData?.manualDailyWalkByDate
  );
  const manualSteps = manualMap?.[dateStr]?.steps ?? 0;
  const dm = garminData?.dailyMetrics?.[dateStr];
  return mergedDailySteps(dm?.steps, manualSteps);
}

function activeKcalFromGarminDaily(garminData, dateStr) {
  const daily = garminData?.dailyMetrics?.[dateStr];
  if (!daily) return 0;
  if (daily.calories && typeof daily.calories === 'object') {
    const n = Number(daily.calories.active);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  const n = Number(daily.activeKilocalories ?? daily.activeKcal);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** Km et minutes course par jour (source unique : runningVolumeTruth + rows enrichis). */
function buildCalendarRunningByDate(workoutData, garminData) {
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = workoutData?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const filtered = filterRunningSessionsBase(merged, garminById);
  const rows = buildRunningSessionRows(filtered, garminById);

  const kmByDate = new Map();
  const minByDate = new Map();
  for (const row of rows) {
    if (!row?.date) continue;
    if (row.dist > 0) {
      kmByDate.set(row.date, (kmByDate.get(row.date) || 0) + row.dist);
    }
    if (row.durMin > 0) {
      minByDate.set(row.date, (minByDate.get(row.date) || 0) + row.durMin);
    }
  }
  return { kmByDate, minByDate };
}

function runningStatsForDate(kmByDate, minByDate, dateStr) {
  return {
    km: kmByDate.get(dateStr) || 0,
    min: roundSportMinutes(minByDate.get(dateStr) || 0)
  };
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
  let activeKcal = 0;
  let trainingDays = 0;
  let totalSteps = 0;

  const currentMonthDays = (monthDays || []).filter((d) => d.isCurrentMonth);
  let year = new Date().getFullYear();
  let monthIndex = 0;
  if (currentMonthDays[0]?.date) {
    year = currentMonthDays[0].date.getFullYear();
    monthIndex = currentMonthDays[0].date.getMonth();
  }

  const { kmByDate, minByDate } = buildCalendarRunningByDate(workoutData, garminData);

  currentMonthDays.forEach((day) => {
    const dateStr = getDateStrFn(day.date);
    const intensity = day.intensity || {};
    totalReps += Number(intensity.reps) || 0;
    totalKg += liftMap.get(dateStr) || 0;

    const runStats = runningStatsForDate(kmByDate, minByDate, dateStr);
    runningKm += runStats.km;
    runningMinutes += runStats.min;
    otherExerciseMinutes += computeNonRunningExerciseMinutesForDate(workoutData, garminData, dateStr);
    activeKcal += activeKcalFromGarminDaily(garminData, dateStr);
    totalSteps += stepsForDate(garminData, workoutData, dateStr);
    if (dayCountsAsCalendarTrainingDay(workoutData, dateStr, garminData)) {
      trainingDays += 1;
    }
  });

  const runningSessionCount = (() => {
    const garminById = buildGarminCardioById(garminData?.activities?.cardio);
    const stored = workoutData?.enduranceData?.sessions?.running || [];
    const merged = mergeRunningSessionsWithGarmin(stored, garminById);
    const filtered = filterRunningSessionsBase(merged, garminById);
    const rows = buildRunningSessionRows(filtered, garminById);
    const monthDates = new Set(
      currentMonthDays.map((day) => getDateStrFn(day.date)).filter(Boolean)
    );
    return rows.filter((row) => row?.date && monthDates.has(row.date)).length;
  })();

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
    activeKcal,
    longestStreak: calculateLongestTrainingStreakInMonth(workoutData, year, monthIndex),
    trainingDays,
    runningSessionCount,
    totalSteps
  };
}
