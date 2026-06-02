/**
 * Prescription tractions : reps plafonnées au max quiz, complément pronation / australiennes.
 */

import { parseSetsCount, parseRepsMid } from './quizSessionLimits';

const PULL_KEY = /traction|pull-up|pullup/i;
const AUSTRALIAN_KEY = /australien/i;
const PRONATION_KEY = /pronation|pull-up/i;

export function inferAustralianPullMax(answers) {
  const b = answers?.strengthBaselineMaxes;
  const explicit = Number(b?.australianPullupsMax);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const pullMax = Number(b?.pullupsMax) || 0;
  if (pullMax <= 0) return null;
  if (pullMax <= 3) return 10;
  if (pullMax <= 7) return Math.min(18, pullMax + 6);
  return Math.min(22, Math.round(pullMax * 1.5));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function isPullExercise(ex) {
  const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
  return PULL_KEY.test(blob) && !/rowing|row\b|tirage halt/i.test(blob);
}

function isAustralian(ex) {
  return AUSTRALIAN_KEY.test(`${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase());
}

function isStrictPull(ex) {
  return isPullExercise(ex) && !isAustralian(ex);
}

/**
 * Reps cibles pour un mouvement tirage selon le repère quiz.
 */
export function targetRepsForPullExercise(ex, answers) {
  const pullMax = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;
  if (pullMax <= 0) return null;

  if (isAustralian(ex)) {
    const ausMax = inferAustralianPullMax(answers);
    if (!ausMax) return null;
    const tier = pullMax <= 5 ? 0.5 : pullMax <= 10 ? 0.55 : 0.6;
    return clamp(ausMax * tier, 6, 12);
  }

  if (isStrictPull(ex)) {
    if (pullMax <= 3) return clamp(pullMax, 2, 3);
    if (pullMax <= 7) return clamp(Math.floor(pullMax * 0.75), 3, 5);
    return clamp(Math.floor(pullMax * 0.65), 4, 8);
  }

  return null;
}

function formatSeries(sets, repsLo, repsHi = null) {
  const s = clamp(sets, 2, 5);
  if (repsHi != null && repsHi > repsLo) return `${s}×${repsLo}-${repsHi}`;
  return `${s}×${repsLo}`;
}

function capSeriesString(series, maxReps, maxSets = 5) {
  const m = String(series || '').match(/^(\d+)×(.+)$/);
  if (!m) return series;
  let sets = Math.min(maxSets, parseInt(m[1], 10));
  const part = m[2].trim();
  const range = part.match(/^(\d+)-(\d+)$/);
  if (range) {
    const lo = Math.min(maxReps, parseInt(range[1], 10));
    const hi = Math.min(maxReps + 1, parseInt(range[2], 10));
    return formatSeries(sets, lo, Math.max(lo, hi));
  }
  if (/^\d+$/.test(part)) {
    return formatSeries(sets, Math.min(maxReps, parseInt(part, 10)));
  }
  if (/sec/i.test(part)) return series;
  return formatSeries(sets, maxReps);
}

/**
 * Ajuste séries/reps des tirages sur une séance (après allocation volume).
 */
export function balancePullExercisesOnDay(exercises, answers) {
  if (!Array.isArray(exercises) || !exercises.length) return exercises;
  const pullMax = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;
  if (pullMax <= 0) return exercises;

  const strict = exercises.filter(isStrictPull);
  const australian = exercises.filter(isAustralian);
  const hasBoth = strict.length > 0 && australian.length > 0;

  return exercises.map((ex) => {
    if (!isPullExercise(ex)) return ex;
    const maxReps = targetRepsForPullExercise(ex, answers);
    if (maxReps == null) return ex;

    let maxSets = pullMax <= 5 ? 4 : 5;
    if (hasBoth && isStrictPull(ex)) maxSets = pullMax <= 5 ? 3 : 4;
    if (hasBoth && isAustralian(ex)) maxSets = 4;

    return { ...ex, series: capSeriesString(ex.series, maxReps, maxSets) };
  });
}

export function applyPullRepPrescriptionToSchedule(schedule, activeDayKeys, answers) {
  if (!schedule || !activeDayKeys?.length) return;
  activeDayKeys.forEach((dayKey) => {
    const day = schedule[dayKey];
    if (!day?.active || !Array.isArray(day.exercises)) return;
    day.exercises = balancePullExercisesOnDay(day.exercises, answers);
  });
}

/** Garde-fou : aucune série de tractions strictes au-dessus du max déclaré + marge 1. */
export function assertPullRepsWithinBaseline(exercises, answers) {
  const pullMax = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;
  if (!pullMax) return true;
  return (exercises || []).every((ex) => {
    if (!isStrictPull(ex)) return true;
    return parseRepsMid(ex.series) <= pullMax + 1;
  });
}
