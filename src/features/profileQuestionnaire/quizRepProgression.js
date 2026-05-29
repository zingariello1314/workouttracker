/**
 * Progression reps/séries : +1 rep puis +1 série si haut de fourchette atteint (SPEC §6.6).
 */

import { parseSetsCount, parseRepsMid } from './quizSessionLimits';

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

/** @returns {{ lo: number, hi: number }|null} */
export function parseRepRangeFromSeries(series) {
  const s = String(series || '').trim();
  if (!s || /min|sec|course/i.test(s)) return null;
  const m = s.match(/^(\d+)×(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const lo = parseInt(m[2], 10);
  const hi = m[3] ? parseInt(m[3], 10) : lo;
  return { lo, hi };
}

/**
 * Compare reps loguées vs fourchette prévue.
 * @returns {'below'|'mid'|'high'|'unknown'}
 */
export function classifyRepPerformance(plannedSeries, loggedReps) {
  const range = parseRepRangeFromSeries(plannedSeries);
  const reps = Number(loggedReps);
  if (!range || !Number.isFinite(reps) || reps <= 0) return 'unknown';
  if (reps >= range.hi) return 'high';
  if (reps <= range.lo - 1) return 'below';
  return 'mid';
}

/**
 * Cherche la dernière perf sur le même jour de semaine (ex. dernier mardi).
 */
export function findLastWeekdayPerformance(snapshot, weekdayIndex, exerciseIds, beforeYmd) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  let best = null;

  Object.keys(checked).forEach((key) => {
    if (!checked[key]) return;
    const ymd = key.slice(0, 10);
    if (beforeYmd && ymd >= beforeYmd) return;
    const exId = key.slice(11);
    if (!exerciseIds.has(exId) && !exerciseIds.has(String(exId))) return;
    const d = new Date(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(5, 7)) - 1,
      Number(ymd.slice(8, 10))
    );
    if (d.getDay() !== weekdayIndex) return;
    const r = Number(reps[key]);
    if (!Number.isFinite(r) || r <= 0) return;
    if (!best || ymd > best.ymd) best = { ymd, exId, reps: r };
  });

  return best;
}

/**
 * +1 rep dans la fourchette, ou +1 série si déjà au plafond haut (cap 5 séries, 22 reps).
 */
export function bumpSeriesForHighPerformance(series, baselineSeries = null) {
  const s = String(series || '').trim();
  if (!s || /min|sec|course/i.test(s)) return { series: s, bumped: false };

  const m = s.match(/^(\d+)×(\d+)(?:-(\d+))?$/);
  if (!m) return { series: s, bumped: false };

  let sets = parseInt(m[1], 10);
  const lo = parseInt(m[2], 10);
  const hi = m[3] ? parseInt(m[3], 10) : lo;

  const baseRange = baselineSeries ? parseRepRangeFromSeries(baselineSeries) : null;
  const capHi = baseRange ? Math.min(22, baseRange.hi + 3) : 22;
  const capSets = 5;

  if (hi < capHi) {
    const newHi = hi + 1;
    const newLo = Math.max(lo, newHi - 2);
    const out = newLo === newHi ? `${sets}×${newHi}` : `${sets}×${newLo}-${newHi}`;
    return { series: out, bumped: true, kind: 'rep' };
  }

  if (sets < capSets) {
    sets += 1;
    const out = hi !== lo ? `${sets}×${lo}-${hi}` : `${sets}×${lo}`;
    return { series: out, bumped: true, kind: 'set' };
  }

  return { series: s, bumped: false };
}

/**
 * @param {object[]} exercises
 * @param {object} snapshot
 * @param {string} sessionYmd
 * @param {string} [scheduleKeyPrefix] — originalId ou id string
 */
export function applyRepProgressionFromHistory(exercises, snapshot, sessionYmd, scheduleKeyPrefix = '') {
  if (!Array.isArray(exercises) || !snapshot) return exercises;

  const d = new Date(
    Number(sessionYmd.slice(0, 4)),
    Number(sessionYmd.slice(5, 7)) - 1,
    Number(sessionYmd.slice(8, 10))
  );
  const dow = d.getDay();

  return exercises.map((ex) => {
    const ids = new Set();
    if (ex.originalId != null) ids.add(String(ex.originalId));
    if (ex.id != null) ids.add(String(ex.id));
    if (scheduleKeyPrefix) ids.add(`${scheduleKeyPrefix}_${ex.id}`);

    const last = findLastWeekdayPerformance(snapshot, dow, ids, sessionYmd);
    if (!last) return ex;

    const perf = classifyRepPerformance(ex.series, last.reps);
    if (perf !== 'high') return ex;

    const { series, bumped, kind } = bumpSeriesForHighPerformance(ex.series, ex.series);
    if (!bumped) return ex;

    const note =
      kind === 'set'
        ? `+1 série (haut de fourchette atteint le ${last.ymd}).`
        : `+1 rep (haut de fourchette atteint le ${last.ymd}).`;
    return {
      ...ex,
      series,
      notes: [ex.notes, note].filter(Boolean).join(' ')
    };
  });
}
