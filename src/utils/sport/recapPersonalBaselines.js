/**
 * Baselines personnelles, séances comparables, couche physiologique.
 *
 * Distingue record ≠ niveau habituel ≠ moyenne récente.
 * Le sommeil est une association observée, jamais une cause.
 */

import { collectLifetimeRepHistory } from './athleteJourney';
import { extractRecentSleepNights, extractSleepNight } from './recapSleepNight';
import { addCalendarDays } from './garminRunningPeriodStats';
import { daysBetweenYmd } from './recapTrainingTimeline';
import { computeNonRunningExerciseMinutesForDate } from '../calendarPhysicalSessionStripes';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

export function percentile(nums, p) {
  const v = (nums || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const idx = (v.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return v[lo];
  return v[lo] + (v[hi] - v[lo]) * (idx - lo);
}

function mean(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function round1(n) {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

/**
 * Stats d'un mouvement à partir de son historique de séances.
 * `last` est la performance la plus récente (souvent la période Recap).
 */
export function buildExerciseBaseline(sessions) {
  const rows = (sessions || [])
    .filter((s) => s && Number.isFinite(s.reps) && s.reps > 0 && s.date)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (rows.length < 3) return null;

  const last = rows[rows.length - 1];
  const prior = rows.slice(0, -1);
  const habitRows = prior.length >= 3 ? prior : rows;
  const habitReps = habitRows.map((s) => s.reps);
  const allReps = rows.map((s) => s.reps);
  const first5 = rows.slice(0, Math.min(5, rows.length)).map((s) => s.reps);
  const last5 = rows.slice(-Math.min(5, rows.length)).map((s) => s.reps);
  const last5Prior = prior.slice(-Math.min(5, prior.length)).map((s) => s.reps);
  const medianHabit = percentile(habitReps, 0.5);
  const p25 = percentile(habitReps, 0.25);
  const p75 = percentile(habitReps, 0.75);
  const best = Math.max(...allReps);
  const worst = Math.min(...allReps);
  const bestSession = rows.find((s) => s.reps === best);
  const initial = mean(first5);
  const current = mean(last5);
  const vsHabit = medianHabit > 0 ? ((last.reps - medianHabit) / medianHabit) * 100 : null;
  const vsInitial = initial > 0 && current != null ? ((current - initial) / initial) * 100 : null;
  const established = prior.length >= 5;
  const consolidated =
    established &&
    last5Prior.length >= 4 &&
    last5Prior.filter((r) => medianHabit != null && r >= medianHabit - 1).length >= 3;
  const aboveOldMean =
    initial != null && last5Prior.length
      ? last5Prior.filter((r) => r > initial).length
      : 0;

  return {
    sessions: rows.length,
    last: { date: last.date, reps: last.reps },
    mean: round1(mean(habitReps)),
    median: round1(medianHabit),
    p25: round1(p25),
    p75: round1(p75),
    best,
    bestDate: bestSession?.date || null,
    worst,
    lastReps: last.reps,
    recentMean: round1(mean(last5Prior.length ? last5Prior : last5)),
    historicalMean: round1(initial),
    currentMean: round1(current),
    vsHabitPct: vsHabit != null ? round1(vsHabit) : null,
    vsInitialPct: vsInitial != null ? round1(vsInitial) : null,
    variability: round1(p75 != null && p25 != null ? p75 - p25 : null),
    established,
    consolidated,
    aboveOldMean,
    last5Count: last5Prior.length || last5.length
  };
}

export function buildExerciseBaselines({ snapshot, endYmd, getExerciseNameById } = {}) {
  const byEx = collectLifetimeRepHistory(snapshot, endYmd);
  const out = [];
  byEx.forEach((sessions, exId) => {
    const baseline = buildExerciseBaseline(sessions);
    if (!baseline) return;
    const n = parseInt(String(exId), 10);
    const name =
      typeof getExerciseNameById === 'function'
        ? String(getExerciseNameById(Number.isFinite(n) ? n : exId) || '').trim()
        : '';
    out.push({
      id: String(exId),
      name: name || `Exercice ${exId}`,
      ...baseline
    });
  });
  return out.sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
}

function rhrOn(garminData, ymd) {
  const day = garminData?.dailyMetrics?.[ymd];
  if (!day) return null;
  const n = Number(day.restingHeartRate ?? day.restingHR ?? day.heartRate?.resting);
  return Number.isFinite(n) && n > 30 && n < 140 ? n : null;
}

/**
 * Catalogue de jours entraînés (signature de séance).
 */
export function buildSessionCatalog({ snapshot, getExerciseNameById, garminData = null, endYmd = null } = {}) {
  const byEx = collectLifetimeRepHistory(snapshot, endYmd);
  const byDate = new Map();
  byEx.forEach((sessions, exId) => {
    const n = parseInt(String(exId), 10);
    const name =
      typeof getExerciseNameById === 'function'
        ? String(getExerciseNameById(Number.isFinite(n) ? n : exId) || '').trim()
        : `Exercice ${exId}`;
    const groups = inferMuscleGroupsForExercise({ name });
    sessions.forEach((s) => {
      if (!s?.date) return;
      const row = byDate.get(s.date) || {
        date: s.date,
        totalReps: 0,
        exercises: [],
        exerciseIds: new Set(),
        muscles: new Set(),
        minutes: 0,
        sleepHours: null,
        night: null,
        rhr: null
      };
      row.totalReps += s.reps;
      row.exerciseIds.add(String(exId));
      row.exercises.push({ id: String(exId), name, reps: s.reps });
      groups.forEach((g) => {
        if (g && g !== MuscleGroups.FULL_BODY) row.muscles.add(g);
      });
      byDate.set(s.date, row);
    });
  });

  const catalog = [];
  byDate.forEach((row) => {
    row.minutes = computeNonRunningExerciseMinutesForDate(snapshot, garminData, row.date) || 0;
    row.night = extractSleepNight(garminData, row.date);
    row.nightJ2 = extractSleepNight(garminData, addCalendarDays(row.date, -1));
    row.sleepHours = row.night?.hours ?? null;
    row.hoursJ2 = row.nightJ2?.hours ?? null;
    row.rhr = row.night?.rhr ?? rhrOn(garminData, row.date);
    row.exerciseIds = [...row.exerciseIds];
    row.muscles = [...row.muscles];
    row.exercises.sort((a, b) => b.reps - a.reps);
    catalog.push(row);
  });
  catalog.sort((a, b) => a.date.localeCompare(b.date));
  const catalogByDate = new Map(catalog.map((r) => [r.date, r]));
  catalog.forEach((row) => {
    const prev = addCalendarDays(row.date, -1);
    row.prevDayReps = catalogByDate.get(prev)?.totalReps || 0;
  });
  return catalog;
}

export function findComparableSessions(catalog, targetYmd, { minScore = 0.32, limit = 5 } = {}) {
  const list = catalog || [];
  const target = list.find((s) => s.date === targetYmd);
  if (!target || !target.exerciseIds?.length) return { target: target || null, peers: [] };
  const tIds = new Set(target.exerciseIds);
  const scored = [];
  list.forEach((s) => {
    if (s.date === targetYmd) return;
    const ids = new Set(s.exerciseIds || []);
    let overlap = 0;
    tIds.forEach((id) => {
      if (ids.has(id)) overlap += 1;
    });
    if (overlap < 1) return;
    const union = new Set([...tIds, ...ids]).size;
    const jaccard = union > 0 ? overlap / union : 0;
    const volA = target.totalReps || 0;
    const volB = s.totalReps || 0;
    const volSim = volA > 0 && volB > 0 ? 1 - Math.min(1, Math.abs(volA - volB) / Math.max(volA, volB)) : 0.4;
    const minA = target.minutes || 0;
    const minB = s.minutes || 0;
    const durSim =
      minA >= 15 && minB >= 15 ? 1 - Math.min(1, Math.abs(minA - minB) / Math.max(minA, minB)) : 0.5;
    const score = jaccard * 0.58 + volSim * 0.24 + durSim * 0.18;
    if (score < minScore) return;
    scored.push({ ...s, comparableScore: Math.round(score * 100) / 100, overlap });
  });
  scored.sort((a, b) => b.comparableScore - a.comparableScore || b.date.localeCompare(a.date));
  return { target, peers: scored.slice(0, limit) };
}

/**
 * Association sommeil → reps (pas une causalité).
 * Seuils : < 6h30 vs ≥ 7h30, ≥ 2 séances de chaque côté.
 */
export function computeSleepPerformanceAssociation(catalog, { minEach = 2 } = {}) {
  const byEx = new Map();
  (catalog || []).forEach((sess) => {
    if (sess.sleepHours == null) return;
    (sess.exercises || []).forEach((ex) => {
      const list = byEx.get(ex.id) || { name: ex.name, short: [], long: [] };
      if (sess.sleepHours < 6.5) list.short.push(ex.reps);
      else if (sess.sleepHours >= 7.5) list.long.push(ex.reps);
      byEx.set(ex.id, list);
    });
  });
  const rows = [];
  byEx.forEach((v, id) => {
    if (v.short.length < minEach || v.long.length < minEach) return;
    const shortAvg = mean(v.short);
    const longAvg = mean(v.long);
    if (!shortAvg || !longAvg) return;
    const deltaPct = ((longAvg - shortAvg) / shortAvg) * 100;
    if (Math.abs(deltaPct) < 10) return;
    rows.push({
      id,
      name: v.name,
      shortAvg: round1(shortAvg),
      longAvg: round1(longAvg),
      deltaPct: round1(deltaPct),
      shortN: v.short.length,
      longN: v.long.length
    });
  });
  return rows.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
}

/**
 * Association repos ≥ 48 h vs séance enchaînée le lendemain.
 */
export function computeRestPerformanceAssociation(catalog) {
  const days = (catalog || [])
    .filter((s) => (s.totalReps || 0) >= 20)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const rested = [];
  const dense = [];
  for (let i = 1; i < days.length; i += 1) {
    const gap = daysBetweenYmd(days[i - 1].date, days[i].date);
    if (gap == null) continue;
    if (gap >= 2) rested.push(days[i].totalReps);
    else if (gap === 1) dense.push(days[i].totalReps);
  }
  if (rested.length < 2 || dense.length < 2) return null;
  const restedAvg = mean(rested);
  const denseAvg = mean(dense);
  if (!restedAvg || !denseAvg) return null;
  return {
    restedAvg: round1(restedAvg),
    denseAvg: round1(denseAvg),
    deltaPct: round1(((restedAvg - denseAvg) / denseAvg) * 100),
    restedN: rested.length,
    denseN: dense.length
  };
}

export function sleepContextForDate(garminData, ymd, catalog) {
  const night = extractSleepNight(garminData, ymd);
  const hours = night?.hours ?? null;
  const rhr = night?.rhr ?? rhrOn(garminData, ymd);
  const recentNights = extractRecentSleepNights(garminData, ymd, 7);
  const recentHours = recentNights.map((n) => n.hours).filter((h) => h != null);
  const catalogHours = (catalog || []).map((s) => s.sleepHours).filter((h) => h != null);
  const habitSource = recentHours.length >= 4 ? recentHours : catalogHours;
  const habit = habitSource.length >= 4 ? mean(habitSource) : null;
  const recentRhr = recentNights.map((n) => n.rhr).filter((h) => h != null);
  const catalogRhr = (catalog || []).map((s) => s.rhr).filter((h) => h != null);
  const rhrSource = recentRhr.length >= 4 ? recentRhr : catalogRhr;
  const habitRhr = rhrSource.length >= 4 ? mean(rhrSource) : null;
  return {
    hours,
    rhr,
    night,
    recentNights,
    habitHours: habit != null ? round1(habit) : null,
    habitRhr: habitRhr != null ? round1(habitRhr) : null,
    vsHabitPct: hours != null && habit > 0 ? round1(((hours - habit) / habit) * 100) : null
  };
}

export function previousWindow(endYmd, spanDays) {
  const currStart = addCalendarDays(endYmd, -(spanDays - 1));
  const prevEnd = addCalendarDays(currStart, -1);
  return { start: addCalendarDays(prevEnd, -(spanDays - 1)), end: prevEnd };
}
