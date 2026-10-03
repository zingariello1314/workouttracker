/**
 * Meilleures semaines du calendrier (S1–S4, comme sous les mois).
 * Pas : moyenne des jours avec des pas. Reps : total coché + séances d'endurance.
 * La meilleure semaine de l'année est aussi celle de son mois.
 * La meilleure de tous les temps est aussi celle de son année et de son mois.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from './trainingLoadUtils';
import { mergedStepsFromDaily, normalizeManualDailyWalkByDate } from './sport/manualDailyWalkUtils';

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calendarWeekIdFromDate(dateStr) {
  const match = YMD.exec(String(dateStr || ''));
  if (!match) return null;
  const day = Number(match[3]);
  if (!Number.isFinite(day) || day < 1) return null;
  const bucket = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return {
    year,
    monthIndex,
    bucket,
    id: `${match[1]}-${match[2]}-${bucket}`
  };
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
  const sums = [0, 0, 0, 0];
  if (!window?.start || !window?.end) return sums;
  const repsMap = calendarRepsByDate(workoutData);
  repsMap.forEach((reps, dateStr) => {
    if (dateStr < window.start || dateStr > window.end || reps <= 0) return;
    const week = calendarWeekIdFromDate(dateStr);
    if (!week) return;
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
  return {
    steps: [0, 1, 2, 3].map((bucket) => weekHonorLevels(leaders?.steps, year, monthIndex, bucket)),
    reps: [0, 1, 2, 3].map((bucket) => weekHonorLevels(leaders?.reps, year, monthIndex, bucket))
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
