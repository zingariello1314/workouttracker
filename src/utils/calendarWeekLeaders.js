/**
 * Meilleures semaines du calendrier (lun–dim, bornées au mois).
 * Si le mois commence un jeudi, S1 = jeudi→dimanche ; puis des semaines lun–dim.
 * Un badge « meilleure semaine » s’affiche sur chaque jour de cette semaine (≤ 7).
 * Pas : moyenne des jours avec des pas. Reps : total coché + séances d'endurance.
 * La meilleure semaine de l'année est aussi celle de son mois.
 * La meilleure de tous les temps est aussi celle de son année et de son mois.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from './trainingLoadUtils';
import { mergedStepsFromDaily, normalizeManualDailyWalkByDate } from './sport/manualDailyWalkUtils';

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Lundi = 0 … Dimanche = 6 */
function mondayBasedDow(year, monthIndex, day) {
  return (new Date(year, monthIndex, day).getDay() + 6) % 7;
}

/**
 * Semaines lun–dim clipées au mois : S1 peut être partielle
 * (ex. mois qui démarre jeudi → S1 = jeudi–dimanche).
 */
export function calendarWeekIdFromDate(dateStr) {
  const match = YMD.exec(String(dateStr || ''));
  if (!match) return null;
  const day = Number(match[3]);
  if (!Number.isFinite(day) || day < 1) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  if (day > lastDay) return null;

  const firstDow = mondayBasedDow(year, monthIndex, 1);
  const firstWeekLen = 7 - firstDow;
  const bucket = day <= firstWeekLen ? 0 : 1 + Math.floor((day - firstWeekLen - 1) / 7);

  return {
    year,
    monthIndex,
    bucket,
    id: `${match[1]}-${match[2]}-${bucket}`
  };
}

export function calendarWeekBucketCount(year, monthIndex) {
  const y = Number(year);
  const m = Number(monthIndex);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 0 || m > 11) return 0;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const ymd = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const last = calendarWeekIdFromDate(ymd);
  return (last?.bucket ?? 0) + 1;
}

export function emptyWeekBucketArray(year, monthIndex) {
  const n = calendarWeekBucketCount(year, monthIndex);
  return Array.from({ length: Math.max(0, n) }, () => 0);
}

export function calendarRepsByDate(workoutData) {
  const map = new Map();
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  grouped.forEach(({ reps }, gkey) => {
    const date = String(gkey).slice(0, 10);
    const n = Math.max(0, Math.floor(Number(reps) || 0));
    if (n > 0) map.set(date, (map.get(date) || 0) + n);
  });

  const sessions = workoutData?.enduranceData?.sessions || {};
  Object.values(sessions).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((session) => {
      if (!session || session.isMock === true) return;
      const date = String(session.date || '').slice(0, 10);
      if (!YMD.test(date)) return;
      const reps = Math.floor(Number(session.count ?? session.reps) || 0);
      if (reps > 0) map.set(date, (map.get(date) || 0) + reps);
    });
  });
  return map;
}

function stepsForDate(garminData, manualMap, dateStr) {
  const manualSteps = manualMap?.[dateStr]?.steps ?? 0;
  const dm = garminData?.dailyMetrics?.[dateStr];
  return mergedStepsFromDaily(dm, manualSteps);
}

function emptyMetric() {
  return { allTime: null, byYear: {}, byMonth: {} };
}

function better(candidate, current) {
  if (!candidate || candidate.value <= 0) return current;
  if (!current) return candidate;
  if (candidate.value > current.value) return candidate;
  if (candidate.value < current.value) return current;
  return candidate.id < current.id ? candidate : current;
}

function monthKey(year, monthIndex) {
  return `${year}-${monthIndex}`;
}

function rankMetric(rows, field) {
  const metric = emptyMetric();
  rows.forEach((row) => {
    const candidate = {
      id: row.id,
      value: row[field],
      year: row.year,
      monthIndex: row.monthIndex,
      bucket: row.bucket
    };
    metric.allTime = better(candidate, metric.allTime);
    metric.byYear[row.year] = better(candidate, metric.byYear[row.year] || null);
    const key = monthKey(row.year, row.monthIndex);
    metric.byMonth[key] = better(candidate, metric.byMonth[key] || null);
  });

  Object.keys(metric.byYear).forEach((year) => {
    const winner = metric.byYear[year];
    if (!winner) return;
    metric.byMonth[monthKey(winner.year, winner.monthIndex)] = winner;
  });
  if (metric.allTime) {
    metric.byYear[metric.allTime.year] = metric.allTime;
    metric.byMonth[monthKey(metric.allTime.year, metric.allTime.monthIndex)] = metric.allTime;
  }
  return metric;
}

export function computeCalendarWeekLeaders(workoutData, garminData) {
  const repsMap = calendarRepsByDate(workoutData);
  const manualMap = normalizeManualDailyWalkByDate(
    workoutData?.enduranceData?.manualDailyWalkByDate
  );
  const dates = new Set([
    ...repsMap.keys(),
    ...Object.keys(garminData?.dailyMetrics || {}),
    ...Object.keys(manualMap || {})
  ]);

  const weeks = new Map();
  dates.forEach((dateStr) => {
    if (!YMD.test(dateStr)) return;
    const week = calendarWeekIdFromDate(dateStr);
    if (!week) return;
    let row = weeks.get(week.id);
    if (!row) {
      row = { ...week, stepsSum: 0, stepsDays: 0, reps: 0, steps: 0 };
      weeks.set(week.id, row);
    }
    const steps = stepsForDate(garminData, manualMap, dateStr);
    if (steps > 0) {
      row.stepsSum += steps;
      row.stepsDays += 1;
      row.steps = Math.round(row.stepsSum / row.stepsDays);
    }
    const reps = repsMap.get(dateStr) || 0;
    if (reps > 0) row.reps += reps;
  });

  const rows = [...weeks.values()];
  return {
    steps: rankMetric(rows, 'steps'),
    reps: rankMetric(rows, 'reps'),
    rows
  };
}

export function weekRepTotalsForWindow(workoutData, window) {
  if (!window?.start || !window?.end) return [];
  const start = calendarWeekIdFromDate(window.start);
  if (!start) return [];
  const sums = emptyWeekBucketArray(start.year, start.monthIndex);
  const repsMap = calendarRepsByDate(workoutData);
  repsMap.forEach((reps, dateStr) => {
    if (dateStr < window.start || dateStr > window.end || reps <= 0) return;
    const week = calendarWeekIdFromDate(dateStr);
    if (!week || week.bucket < 0 || week.bucket >= sums.length) return;
    sums[week.bucket] += reps;
  });
  return sums;
}

const LEVELS = ['allTime', 'year', 'month'];

export function weekHonorLevels(metric, year, monthIndex, bucket) {
  if (!metric) return [];
  const id = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${bucket}`;
  const levels = [];
  if (metric.allTime?.id === id) levels.push('allTime');
  if (metric.byYear?.[year]?.id === id) levels.push('year');
  if (metric.byMonth?.[monthKey(year, monthIndex)]?.id === id) levels.push('month');
  return LEVELS.filter((level) => levels.includes(level));
}

export function weekHonorsForMonth(leaders, year, monthIndex) {
  const buckets = Array.from({ length: calendarWeekBucketCount(year, monthIndex) }, (_, i) => i);
  return {
    steps: buckets.map((bucket) => weekHonorLevels(leaders?.steps, year, monthIndex, bucket)),
    reps: buckets.map((bucket) => weekHonorLevels(leaders?.reps, year, monthIndex, bucket))
  };
}

/** Un seul emoji par palmarès. Les cumuls ont leur signe, distinct des records du jour. */
export const CALENDAR_WEEK_HONOR_EMOJI = {
  steps: {
    month: '👟',
    year: '🥾',
    allTime: '🗻',
    monthYear: '🧭',
    yearAllTime: '🌐',
    monthAllTime: '🌉',
    allThree: '🌠'
  },
  reps: {
    month: '🥊',
    year: '🦾',
    allTime: '🦁',
    monthYear: '🐯',
    yearAllTime: '🐲',
    monthAllTime: '🐺',
    allThree: '💎'
  }
};

export function weekHonorEmoji(metric, levels) {
  const pack = CALENDAR_WEEK_HONOR_EMOJI[metric];
  if (!pack) return null;
  const set = new Set(levels || []);
  const hasMonth = set.has('month');
  const hasYear = set.has('year');
  const hasAllTime = set.has('allTime');
  if (hasMonth && hasYear && hasAllTime) return pack.allThree;
  if (hasMonth && hasYear) return pack.monthYear;
  if (hasYear && hasAllTime) return pack.yearAllTime;
  if (hasMonth && hasAllTime) return pack.monthAllTime;
  if (hasAllTime) return pack.allTime;
  if (hasYear) return pack.year;
  if (hasMonth) return pack.month;
  return null;
}

export const CALENDAR_WEEK_HONOR_TITLES = {
  steps: {
    allTime: 'Meilleure semaine de tous les temps · pas',
    year: "Meilleure semaine de l'année · pas",
    month: 'Meilleure semaine du mois · pas'
  },
  reps: {
    allTime: 'Meilleure semaine de tous les temps · reps',
    year: "Meilleure semaine de l'année · reps",
    month: 'Meilleure semaine du mois · reps'
  }
};

export function weekHonorWinner(metric, level, year, monthIndex) {
  if (!metric) return null;
  if (level === 'allTime') return metric.allTime;
  if (level === 'year') return metric.byYear?.[year] || null;
  return metric.byMonth?.[monthKey(year, monthIndex)] || null;
}
