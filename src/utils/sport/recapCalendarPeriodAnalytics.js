/**
 * Récap Analyse / Tendances : stats calendrier (9 tuiles) sur la plage Récap + séries mensuelles.
 */

import { getDateStr } from '../dateUtils';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import {
  computeEnduranceDayMetricsForCalendar
} from '../calendarUtils';
import {
  computeCalendarMonthSportStats,
  getCalendarSportStatsCache
} from '../calendarMonthSportStats';
import {
  computeYearSportRecordHolders,
  formatCalendarSportDuration
} from '../calendarSportStatsFormat';
import { calculateLongestTrainingStreakInRange } from '../trainingStreakUtils';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import { buildRecapStrengthCompareModel } from './recapStrengthPeriodStats';
import {
  computeRunningKindDistribution,
  computeRunningVolumeHighlights
} from './runningCardioStatsAnalytics';
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

function createDayRepsLookup(workoutData) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  const checkedByDate = new Map();
  const partsByDate = new Map();
  grouped.forEach(({ reps }, gkey) => {
    const sep = gkey.indexOf('::');
    if (sep < 0) return;
    const ymd = gkey.slice(0, sep);
    const repsN = Math.max(0, Math.floor(Number(reps) || 0));
    if (repsN <= 0) return;
    checkedByDate.set(ymd, (checkedByDate.get(ymd) || 0) + repsN);
    const list = partsByDate.get(ymd);
    const part = { id: gkey.slice(sep + 2), reps: repsN };
    if (list) list.push(part);
    else partsByDate.set(ymd, [part]);
  });
  const enduranceByDate = new Map();
  const repsFor = (ymd) => {
    let endurance = enduranceByDate.get(ymd);
    if (endurance == null) {
      endurance = Math.floor(
        Number(computeEnduranceDayMetricsForCalendar(workoutData, ymd)?.reps) || 0
      );
      enduranceByDate.set(ymd, endurance);
    }
    return (checkedByDate.get(ymd) || 0) + endurance;
  };
  return { partsByDate, repsFor };
}

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function buildRecapWeekStrip(startYmd, endYmd, getExerciseNameById, lookup) {
  const all = enumerateDatesInclusive(startYmd, endYmd);
  if (!all.length) return [];
  const today = getDateStr(new Date());
  return all.map((ymd) => {
    const parts = (lookup.partsByDate.get(ymd) || []).map((part) => {
      const rawName = typeof getExerciseNameById === 'function' ? getExerciseNameById(part.id) : '';
      const name = String(rawName || '')
        .replace(/^exercice\s+/i, '')
        .replace(/complementary_/gi, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { id: part.id, name, reps: part.reps };
    });
    parts.sort((a, b) => b.reps - a.reps);
    const reps = lookup.repsFor(ymd);
    const detail = parts
      .slice(0, 2)
      .map((part) => (part.name ? `${part.reps} ${part.name}` : `${part.reps} reps`))
      .join(', ');
    const date = new Date(`${ymd}T12:00:00`);
    return {
      ymd,
      label: WEEKDAY_LABELS[date.getDay()] || '',
      day: date.getDate(),
      reps,
      note: reps > 0 ? (detail ? `${reps} reps · ${detail}` : `${reps} reps`) : '—',
      items: parts,
      on: reps > 0,
      now: ymd === today
    };
  });
}

function buildSportDaysForRange(startYmd, endYmd, repsFor) {
  return enumerateDatesInclusive(startYmd, endYmd).map((ymd) => ({
    isCurrentMonth: true,
    date: new Date(`${ymd}T12:00:00`),
    intensity: { reps: repsFor(ymd) }
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

function buildMonthDaysClipped(year, monthIndex, startYmd, endYmd, repsFor) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = getDateStr(new Date(year, monthIndex, d));
    if (ymd < startYmd || ymd > endYmd) continue;
    days.push({
      isCurrentMonth: true,
      date: new Date(year, monthIndex, d),
      intensity: { reps: repsFor(ymd) }
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

let periodAnalyticsMemo = null;

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
/**
 * @param {object} params
 * @param {'header'|'full'} [params.phase] header = bandeau + KPI (rapide) ; full = stats + mois + course
 */
export function buildRecapPeriodCalendarAnalytics({
  workoutData,
  garminData,
  periodWindow,
  period,
  getExerciseNameById,
  recapState = null,
  phase = 'full'
}) {
  const startYmd = periodWindow?.start;
  const endYmd = periodWindow?.end;
  if (!workoutData || !startYmd || !endYmd) {
    return null;
  }

  const memo = periodAnalyticsMemo;
  if (
    memo &&
    memo.workoutData === workoutData &&
    memo.garminData === garminData &&
    memo.period === period &&
    memo.startYmd === startYmd &&
    memo.endYmd === endYmd &&
    memo.recapState === recapState &&
    memo.getExerciseNameById === getExerciseNameById &&
    memo.phase === phase
  ) {
    return memo.result;
  }
  if (
    phase === 'header' &&
    memo &&
    memo.phase === 'full' &&
    memo.workoutData === workoutData &&
    memo.garminData === garminData &&
    memo.period === period &&
    memo.startYmd === startYmd &&
    memo.endYmd === endYmd &&
    memo.recapState === recapState &&
    memo.getExerciseNameById === getExerciseNameById
  ) {
    return memo.result;
  }

  const sportCache = getCalendarSportStatsCache(workoutData, garminData);
  const lookup = createDayRepsLookup(workoutData);
  const periodDays = buildSportDaysForRange(startYmd, endYmd, lookup.repsFor);
  const periodStats = computeCalendarMonthSportStats(
    periodDays,
    workoutData,
    garminData,
    getDateStr,
    sportCache
  );
  const weekStrip = buildRecapWeekStrip(startYmd, endYmd, getExerciseNameById, lookup);

  if (phase === 'header') {
    const result = {
      periodStats,
      months: [],
      bestMonthsByMetric: {},
      topExercises: [],
      streakRange: null,
      topMuscleGroups: [],
      running: { hasData: false, highlights: null, kindDistribution: null, bestSessions: [] },
      window: { start: startYmd, end: endYmd },
      weekStrip,
      phase: 'header'
    };
    periodAnalyticsMemo = {
      workoutData,
      garminData,
      period,
      startYmd,
      endYmd,
      recapState,
      getExerciseNameById,
      phase,
      result
    };
    return result;
  }

  const monthMeta = listCalendarMonthsOverlapping(startYmd, endYmd);
  const months = monthMeta.map(({ year, monthIndex, ym, label }) => {
    const monthDays = buildMonthDaysClipped(year, monthIndex, startYmd, endYmd, lookup.repsFor);
    const sportStats = computeCalendarMonthSportStats(
      monthDays,
      workoutData,
      garminData,
      getDateStr,
      sportCache
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
    getExerciseNameById,
    periodWindow?.end ? new Date(`${periodWindow.end}T12:00:00`) : new Date(),
    8,
    periodWindow
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

  const runningRows = filterRunningRowsToWindow(sportCache.runRows, startYmd, endYmd);
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

  const result = {
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
    window: { start: startYmd, end: endYmd },
    weekStrip,
    phase: 'full'
  };
  periodAnalyticsMemo = {
    workoutData,
    garminData,
    period,
    startYmd,
    endYmd,
    recapState,
    getExerciseNameById,
    phase: 'full',
    result
  };
  return result;
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

function shortMonthAxisLabel(ym) {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'short' })
    .replace('.', '');
}

export function buildMonthlyMetricSeries(months, metricKey) {
  return (months || []).map((m) => ({
    date: `${m.ym}-01`,
    value: Number(m.sportStats?.[metricKey]) || 0,
    label: m.label,
    axisLabel: shortMonthAxisLabel(m.ym)
  }));
}
