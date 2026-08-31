/**
 * Identité d'entraînement : ce qui est habituel pour CET athlète.
 *
 * Fenêtres 7 / 28 / 90 = comparaisons. Ici : moyenne, variance, intervalles
 * par qualité, avec confiance. Sans assez d'historique → silence (ready=false).
 * Aucun texte UI.
 */

import DateHelper from '../dateHelper';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { classifyMovement } from './recapMovementClassification';
import { daysBetweenYmd, isCardioLikeName } from './recapTrainingTimeline';

export const IDENTITY_LOOKBACK_DAYS = 126;
const MIN_WEEKS = 6;
const MIN_WEEKS_FOR_UNUSUAL = 9;
const MIN_QUALITY_SESSIONS = 6;
const MIN_QUALITY_INTERVALS = 5;

export function round1(n) {
  if (n == null || !Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function formatRateFr(n) {
  return String(round1(n)).replace('.', ',');
}

export function meanStd(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return { mean: 0, std: 0 };
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  if (v.length < 2) return { mean, std: 0 };
  const variance = v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1);
  return { mean, std: Math.sqrt(Math.max(0, variance)) };
}

export function percentile(nums, p) {
  const v = (nums || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return 0;
  const idx = (v.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return v[lo];
  return v[lo] + (v[hi] - v[lo]) * (idx - lo);
}

function inRange(ymd, start, end) {
  return ymd && start && end && ymd >= start && ymd <= end;
}

function sessionDate(session) {
  const raw = session?.date || session?.dateStr || session?.ymd || '';
  const s = String(raw).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export function collectTrainingDays(snapshot, start, end) {
  const days = new Set();
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const keys = new Set([...Object.keys(checked), ...Object.keys(reps)]);
  keys.forEach((k) => {
    const d = extractDateStrFromWorkoutKey(k);
    if (!inRange(d, start, end)) return;
    const done = checked[k] === true || (parseInt(String(reps[k]), 10) || 0) > 0;
    if (done) days.add(d);
  });
  const sessions = snapshot?.enduranceData?.sessions || {};
  Object.values(sessions).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => {
      const d = sessionDate(s);
      if (inRange(d, start, end)) days.add(d);
    });
  });
  return [...days].sort();
}

function collectExerciseRows(snapshot, start, end) {
  const byId = new Map();
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const keys = new Set([...Object.keys(checked), ...Object.keys(reps)]);
  keys.forEach((k) => {
    const d = extractDateStrFromWorkoutKey(k);
    const id = extractExerciseIdFromWorkoutKey(k);
    if (!id || !inRange(d, start, end)) return;
    const r = parseInt(String(reps[k]), 10) || 0;
    const done = checked[k] === true || r > 0;
    if (!done) return;
    const list = byId.get(String(id)) || [];
    list.push({ date: d, reps: r });
    byId.set(String(id), list);
  });
  byId.forEach((list, id) => {
    list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const merged = [];
    list.forEach((row) => {
      const last = merged[merged.length - 1];
      if (last && last.date === row.date) last.reps += row.reps;
      else merged.push({ ...row });
    });
    byId.set(id, merged);
  });
  return byId;
}

function qualityKeyFor(id, name, getExerciseNameById) {
  const cls = classifyMovement({ id, name }, getExerciseNameById);
  if (cls.isPullup) return 'pullup';
  if (cls.isPushup) return 'pushup';
  if (/dip|dips|barres parall/i.test(String(name || ''))) return 'dip';
  if (isCardioLikeName(name)) return 'run';
  return null;
}

const QUALITY_LABELS = {
  pullup: 'tractions',
  pushup: 'pompes',
  dip: 'dips',
  run: 'course'
};

function closedIntervals(dates) {
  const gaps = [];
  for (let i = 1; i < dates.length; i += 1) {
    const g = daysBetweenYmd(dates[i - 1], dates[i]);
    if (g != null && g >= 1) gaps.push(g);
  }
  return gaps;
}

function weeklyCountsEndingAt(trainingDays, endYmd, weekCount) {
  const set = new Set(trainingDays);
  const weeks = [];
  for (let w = 0; w < weekCount; w += 1) {
    const weekEnd = DateHelper.addDays(endYmd, -7 * w);
    const weekStart = DateHelper.addDays(weekEnd, -6);
    let n = 0;
    set.forEach((d) => {
      if (d >= weekStart && d <= weekEnd) n += 1;
    });
    weeks.push({ start: weekStart, end: weekEnd, sessions: n });
  }
  weeks.reverse();
  const firstActive = weeks.findIndex((w) => w.sessions > 0);
  return firstActive < 0 ? [] : weeks.slice(firstActive);
}

function confidenceFromWeeks(weeksUsed, std) {
  if (weeksUsed < MIN_WEEKS) return { score: 0, label: 'insuffisante', ready: false };
  if (weeksUsed < MIN_WEEKS_FOR_UNUSUAL) {
    return { score: 0.58, label: 'modérée', ready: true };
  }
  if (weeksUsed >= 13 && std > 0.05) {
    return { score: 0.86, label: 'élevée', ready: true };
  }
  return { score: 0.74, label: 'modérée à élevée', ready: true };
}

function classifyFrequencyStatus(current, mean, std, bandLow, bandHigh, canClaimUnusual) {
  if (!Number.isFinite(current) || !Number.isFinite(mean)) return 'unknown';
  const denom = Math.max(std, 0.35);
  const z = (current - mean) / denom;
  if (current >= bandLow - 0.2 && current <= bandHigh + 0.2) return 'inside';
  if (canClaimUnusual && z <= -1.15 && current < bandLow - 0.2) return 'low';
  if (canClaimUnusual && z >= 1.15 && current > bandHigh + 0.2) return 'high';
  return 'inside';
}

function emptyIdentity(reason) {
  return {
    ready: false,
    reason,
    confidence: 0,
    confidenceLabel: 'insuffisante',
    lookbackDays: IDENTITY_LOOKBACK_DAYS,
    weeksUsed: 0,
    frequency: {
      meanPerWeek: 0,
      stdPerWeek: 0,
      medianPerWeek: 0,
      bandLow: 0,
      bandHigh: 0,
      currentPerWeek: 0,
      current7PerWeek: 0,
      zScore: 0,
      status: 'unknown'
    },
    density: { mean: 0, std: 0, current: 0 },
    qualities: [],
    unusualQualities: []
  };
}

/**
 * @param {{ snapshot?: object, window?: { start?: string, end: string }, getExerciseNameById?: Function }} opts
 */
export function buildAthleteTrainingIdentity(opts = {}) {
  const { snapshot = {}, window = null, getExerciseNameById = null } = opts;
  const end = window?.end;
  if (!end) return emptyIdentity('no_window');

  const start = DateHelper.addDays(end, -(IDENTITY_LOOKBACK_DAYS - 1));
  const trainingDays = collectTrainingDays(snapshot, start, end);
  if (trainingDays.length < 8) return emptyIdentity('too_few_days');

  const rawWeeks = weeklyCountsEndingAt(trainingDays, end, 18);
  if (rawWeeks.length < MIN_WEEKS) return emptyIdentity('too_few_weeks');

  const weekVals = rawWeeks.map((w) => w.sessions);
  const { mean, std } = meanStd(weekVals);
  const median = percentile(weekVals, 0.5);
  const bandLow = Math.max(0, round1(mean - Math.max(std, 0.35)));
  const bandHigh = round1(mean + Math.max(std, 0.35));
  const conf = confidenceFromWeeks(rawWeeks.length, std);
  const canUnusual = conf.ready && conf.score >= 0.7 && rawWeeks.length >= MIN_WEEKS_FOR_UNUSUAL;

  const last7start = DateHelper.addDays(end, -6);
  const last28start = DateHelper.addDays(end, -27);
  const days7 = trainingDays.filter((d) => d >= last7start).length;
  const days28 = trainingDays.filter((d) => d >= last28start).length;
  const currentPerWeek = round1(days28 / 4);
  const current7PerWeek = days7;
  const zScore = round1((currentPerWeek - mean) / Math.max(std, 0.35));
  const status = classifyFrequencyStatus(
    currentPerWeek,
    mean,
    std,
    bandLow,
    bandHigh,
    canUnusual
  );

  const byId = collectExerciseRows(snapshot, start, end);
  const buckets = new Map();
  byId.forEach((rows, id) => {
    const n = parseInt(id, 10);
    const name = Number.isFinite(n) && typeof getExerciseNameById === 'function'
      ? getExerciseNameById(n)
      : `Exercice ${id}`;
    const key = qualityKeyFor(id, name, getExerciseNameById);
    if (!key) return;
    const bucket = buckets.get(key) || { dates: new Set(), reps: [] };
    rows.forEach((r) => {
      bucket.dates.add(r.date);
      if (r.reps > 0) bucket.reps.push({ date: r.date, reps: r.reps });
    });
    buckets.set(key, bucket);
  });

  const runSessions = snapshot?.enduranceData?.sessions?.running;
  if (Array.isArray(runSessions)) {
    const bucket = buckets.get('run') || { dates: new Set(), reps: [] };
    runSessions.forEach((s) => {
      const d = sessionDate(s);
      if (inRange(d, start, end)) bucket.dates.add(d);
    });
    buckets.set('run', bucket);
  }

  const qualities = [];
  buckets.forEach((bucket, key) => {
    const dates = [...bucket.dates].sort();
    if (dates.length < MIN_QUALITY_SESSIONS) return;
    const intervals = closedIntervals(dates);
    if (intervals.length < MIN_QUALITY_INTERVALS) return;
    const { mean: meanGap, std: stdGap } = meanStd(intervals);
    const medianGap = percentile(intervals, 0.5);
    const p80Gap = percentile(intervals, 0.8);
    const maxClosed = Math.max(...intervals);
    const lastDate = dates[dates.length - 1];
    const currentGap = daysBetweenYmd(lastDate, end) ?? 0;
    const habitPerWeek = round1(7 / Math.max(medianGap, 1));
    const qConf = dates.length >= 10 && intervals.length >= 7 ? 0.82 : 0.68;
    const unusualGap =
      qConf >= 0.68 &&
      currentGap >= 5 &&
      currentGap >= Math.max(medianGap * 1.8, p80Gap + 2, medianGap + 3);

    const sortedReps = [...bucket.reps].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const priorReps = sortedReps.slice(0, -1).map((r) => r.reps);
    const lastReps = sortedReps.length ? sortedReps[sortedReps.length - 1].reps : null;
    const band = meanStd(priorReps.length >= 4 ? priorReps.slice(-10) : priorReps);
    const unusualPerf =
      lastReps != null &&
      band.mean >= 6 &&
      priorReps.length >= 5 &&
      lastReps <= band.mean - Math.max(1.5 * Math.max(band.std, 0.8), 2);

    qualities.push({
      key,
      name: QUALITY_LABELS[key] || key,
      sessions: dates.length,
      lastDate,
      medianIntervalDays: round1(medianGap),
      meanIntervalDays: round1(meanGap),
      p80IntervalDays: round1(p80Gap),
      maxClosedGapDays: maxClosed,
      currentGapDays: currentGap,
      sessionsPerWeekHabit: habitPerWeek,
      lastReps,
      habitRepsMean: round1(band.mean),
      habitRepsStd: round1(band.std),
      unusualGap,
      unusualPerf,
      confidence: qConf,
      intervalStd: round1(stdGap)
    });
  });

  qualities.sort((a, b) => b.sessions - a.sessions);
  const unusualQualities = qualities.filter((q) => q.unusualGap || q.unusualPerf);

  return {
    ready: conf.ready,
    reason: conf.ready ? null : 'low_confidence',
    confidence: conf.score,
    confidenceLabel: conf.label,
    lookbackDays: IDENTITY_LOOKBACK_DAYS,
    weeksUsed: rawWeeks.length,
    frequency: {
      meanPerWeek: round1(mean),
      stdPerWeek: round1(std),
      medianPerWeek: round1(median),
      bandLow,
      bandHigh,
      currentPerWeek,
      current7PerWeek,
      zScore,
      status
    },
    density: { mean: 0, std: 0, current: 0 },
    qualities,
    unusualQualities
  };
}

export function identityCanClaimUnusual(identity) {
  return Boolean(identity?.ready && identity.confidence >= 0.7);
}

export function identityFrequencyStatus(identity) {
  return identity?.ready ? identity.frequency?.status || 'unknown' : 'unknown';
}
