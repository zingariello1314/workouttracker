/**
 * Récap Analyse / Tendances : stats calendrier (9 tuiles) sur la plage Récap + séries mensuelles.
 */

import { getDateStr } from '../dateUtils';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import {
  computeEnduranceDayMetricsForCalendar
} from '../calendarUtils';
import { computeCalendarMonthSportStats } from '../calendarMonthSportStats';
import {
  computeYearSportRecordHolders,
  formatCalendarSportDuration
} from '../calendarSportStatsFormat';
import { calculateLongestTrainingStreakInRange } from '../trainingStreakUtils';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import { buildRecapStrengthCompareModel } from './recapStrengthPeriodStats';
import {
  buildRunningSessionRows,
  computeRunningKindDistribution,
  computeRunningVolumeHighlights
} from './runningCardioStatsAnalytics';
import {
  buildGarminCardioById,
  filterRunningSessionsBase,
  mergeRunningSessionsWithGarmin
} from './runningVolumeTruth';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

export const RECAP_CALENDAR_SPORT_METRIC_KEYS = [
  'totalReps',
  'runningKm',
  'runningMinutes',
  'otherExerciseMinutes',
  'totalMinutes',
  'totalKg',
  'longestStreak',
  'activeKcal',
  'trainingDays'
];

function sumCheckedRepsForDate(workoutData, dateStr) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  let total = 0;
  grouped.forEach(({ reps: r }, gkey) => {
    if (!gkey.startsWith(`${dateStr}::`)) return;
    total += Math.max(0, Math.floor(Number(r) || 0));
  });
  return total;
}

function dayIntensityReps(workoutData, dateStr) {
  const checked = sumCheckedRepsForDate(workoutData, dateStr);
  const endurance = Math.floor(
    Number(computeEnduranceDayMetricsForCalendar(workoutData, dateStr)?.reps) || 0
  );
  return checked + endurance;
}

function buildSportDaysForRange(startYmd, endYmd, workoutData) {
  return enumerateDatesInclusive(startYmd, endYmd).map((ymd) => ({
    isCurrentMonth: true,
    date: new Date(`${ymd}T12:00:00`),
    intensity: { reps: dayIntensityReps(workoutData, ymd) }
  }));
}

function listCalendarMonthsOverlapping(startYmd, endYmd) {
  if (!startYmd || !endYmd || startYmd > endYmd) return [];
  const out = [];
  const [sy, sm] = startYmd.split('-').map(Number);
  const [ey, em] = endYmd.split('-').map(Number);
  let y = sy;
  let m = sm - 1;
  const endKey = ey * 12 + (em - 1);
  while (y * 12 + m <= endKey) {
    const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = new Date(y, m, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
    out.push({ year: y, monthIndex: m, ym, label });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function buildMonthDaysClipped(year, monthIndex, startYmd, endYmd, workoutData) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = getDateStr(new Date(year, monthIndex, d));
    if (ymd < startYmd || ymd > endYmd) continue;
    days.push({
      isCurrentMonth: true,
      date: new Date(year, monthIndex, d),
      intensity: { reps: dayIntensityReps(workoutData, ymd) }
    });
  }
  return days;
}

function topMusclesFromRecapState(recapState, limit = 5) {
  const byGroup = recapState?.byGroup || {};
  const repShare = recapState?.repShareByGroup || {};
  return Object.keys(byGroup)
    .filter((g) => g !== MuscleGroups.FULL_BODY)
    .map((group) => ({
      group,
      displayScore: byGroup[group]?.displayScore ?? 0,
      repShare: Math.round(repShare[group] || 0)
    }))
    .sort((a, b) => b.displayScore - a.displayScore || b.repShare - a.repShare)
    .slice(0, limit);
}

function filterRunningRowsToWindow(rows, startYmd, endYmd) {
  return (rows || []).filter((r) => r?.date && r.date >= startYmd && r.date <= endYmd);
}

/**
 * @param {object} params
 * @param {object|null} params.workoutData
 * @param {object|null} params.garminData
 * @param {{ start: string, end: string }} params.periodWindow
 * @param {string} params.period — id plage récap
 * @param {(id: string|number) => string} [params.getExerciseNameById]
 * @param {object|null} [params.recapState]
 */
export function buildRecapPeriodCalendarAnalytics({
  workoutData,
  garminData,
  periodWindow,
  period,
  getExerciseNameById,
  recapState = null
}) {
  const startYmd = periodWindow?.start;
  const endYmd = periodWindow?.end;
  if (!workoutData || !startYmd || !endYmd) {
    return null;
  }

  const periodDays = buildSportDaysForRange(startYmd, endYmd, workoutData);
  const periodStats = computeCalendarMonthSportStats(
    periodDays,
    workoutData,
    garminData,
    getDateStr
  );

  const monthMeta = listCalendarMonthsOverlapping(startYmd, endYmd);
  const months = monthMeta.map(({ year, monthIndex, ym, label }) => {
    const monthDays = buildMonthDaysClipped(year, monthIndex, startYmd, endYmd, workoutData);
    const sportStats = computeCalendarMonthSportStats(
      monthDays,
      workoutData,
      garminData,
      getDateStr
    );
    return { ym, label, sportStats };
  });

  const recordHolders = computeYearSportRecordHolders(months);
  const bestMonthsByMetric = {};
  RECAP_CALENDAR_SPORT_METRIC_KEYS.forEach((metric) => {
    const idx = recordHolders[metric];
    if (idx == null || idx < 0) return;
    const row = months[idx];
    if (!row?.sportStats) return;
    const value = Number(row.sportStats[metric]) || 0;
    if (value <= 0) return;
    bestMonthsByMetric[metric] = {
      metric,
      value,
      ym: row.ym,
      monthLabel: row.label
    };
  });

  const strength = buildRecapStrengthCompareModel(
    workoutData,
    period,
    getExerciseNameById
  );
  const topExercises = (strength?.top3Exercises || []).slice(0, 5);
  const streakRange = calculateLongestTrainingStreakInRange(workoutData, startYmd, endYmd);

  const musclesFromRecap = topMusclesFromRecapState(recapState, 5);
  const topMuscleGroups =
    musclesFromRecap.length > 0
      ? musclesFromRecap
      : (strength?.top3MuscleGroups || []).map(({ group, reps }) => ({
          group,
          displayScore: reps,
          repShare: reps
        }));

  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = workoutData?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const filtered = filterRunningSessionsBase(merged, garminById);
  const allRows = buildRunningSessionRows(filtered, garminById);
  const runningRows = filterRunningRowsToWindow(allRows, startYmd, endYmd);
  const runningHighlights = computeRunningVolumeHighlights(runningRows);
  const kindDistribution = computeRunningKindDistribution(runningRows);

  const bestRunningSessions = [...runningRows]
    .filter((r) => r.dist > 0.2)
    .sort((a, b) => b.dist - a.dist)
    .slice(0, 3)
    .map((r) => ({
      date: r.date,
      km: Math.round(r.dist * 10) / 10,
      kind: r.kind,
      pace: r.paceLabel || null
    }));

  const hasRunning = runningRows.some((r) => r.dist > 0 || r.durMin > 0);

  return {
    periodStats,
    months,
    bestMonthsByMetric,
    topExercises,
    streakRange,
    topMuscleGroups,
    running: {
      hasData: hasRunning,
      highlights: runningHighlights,
      kindDistribution,
      bestSessions: bestRunningSessions
    },
    window: { start: startYmd, end: endYmd }
  };
}

export function formatRecapCalendarMetricValue(metricKey, value) {
  const v = Number(value) || 0;
  switch (metricKey) {
    case 'runningKm':
      return `${v} km`;
    case 'runningMinutes':
    case 'otherExerciseMinutes':
    case 'totalMinutes':
      return formatCalendarSportDuration(v);
    case 'totalKg':
      return `${Math.round(v)} kg`;
    case 'activeKcal':
      return `${Math.round(v).toLocaleString('fr-FR')} kcal`;
    case 'longestStreak':
    case 'trainingDays':
    case 'totalReps':
    default:
      return String(Math.round(v));
  }
}

export function buildMonthlyMetricSeries(months, metricKey) {
  return (months || []).map((m) => ({
    date: `${m.ym}-01`,
    value: Number(m.sportStats?.[metricKey]) || 0,
    label: m.label
  }));
}
