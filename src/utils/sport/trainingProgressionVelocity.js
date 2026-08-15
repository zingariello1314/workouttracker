/**
 * Vitesse et accélération de progression (reps/semaine) sur la fenêtre récap.
 */

import DateHelper from '../dateHelper';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';

function weekKey(endYmd, weekOffset) {
  const end = DateHelper.addDays(endYmd, -weekOffset * 7);
  const start = DateHelper.addDays(end, -6);
  return { start, end, key: `${start}_${end}` };
}

function sumRepsInRange(snapshot, startYmd, endYmd) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  let sum = 0;
  Object.keys(reps).forEach((k) => {
    if (checked[k] !== true) return;
    const d = k.slice(0, 10);
    if (d < startYmd || d > endYmd) return;
    const v = parseInt(String(reps[k]), 10);
    if (Number.isFinite(v) && v > 0) sum += v;
  });
  return sum;
}

/**
 * @param {object} snapshot
 * @param {{ start?: string|null, end: string }|null} window
 * @param {number} [weekCount=4]
 * @returns {{ velocityPerWeek: number|null, acceleration: number|null, confidence: number, weeklyTotals: number[] }}
 */
export function computeRepsWeeklyVelocity(snapshot, window, weekCount = 4) {
  if (!window?.end || !snapshot) {
    return { velocityPerWeek: null, acceleration: null, confidence: 0, weeklyTotals: [] };
  }

  const weeklyTotals = [];
  for (let w = weekCount - 1; w >= 0; w -= 1) {
    const { start, end } = weekKey(window.end, w);
    if (window.start && end < window.start) {
      weeklyTotals.push(0);
      continue;
    }
    const clampStart = window.start && start < window.start ? window.start : start;
    weeklyTotals.push(sumRepsInRange(snapshot, clampStart, end));
  }

  const activeWeeks = weeklyTotals.filter((v) => v > 0);
  if (activeWeeks.length < 2) {
    return { velocityPerWeek: null, acceleration: null, confidence: 0.25, weeklyTotals };
  }

  const n = weeklyTotals.length;
  const xs = weeklyTotals.map((_, i) => i);
  const ys = weeklyTotals;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den > 0 ? num / den : 0;
  const velocityPerWeek = Math.round(slope * 10) / 10;

  let acceleration = null;
  if (n >= 3) {
    const mid = Math.floor(n / 2);
    const firstHalf = ys.slice(0, mid);
    const secondHalf = ys.slice(mid);
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const v1 = avg(firstHalf.slice(1)) - avg(firstHalf.slice(0, -1));
    const v2 = avg(secondHalf.slice(1)) - avg(secondHalf.slice(0, -1));
    if (Number.isFinite(v1) && Number.isFinite(v2)) {
      acceleration = Math.round((v2 - v1) * 10) / 10;
    }
  }

  const confidence = Math.min(0.88, 0.35 + activeWeeks.length * 0.12);

  return { velocityPerWeek, acceleration, confidence, weeklyTotals };
}

/**
 * @param {object} snapshot
 * @param {{ start?: string|null, end: string }|null} window
 * @returns {{ start: string, end: string }|null}
 */
export function priorWindowForComparison(window) {
  if (!window?.start || !window?.end) return null;
  const dates = DateHelper.getDateRange(window.start, window.end);
  if (dates.length < 7) return null;
  const priorEnd = DateHelper.addDays(window.start, -1);
  const priorStart = DateHelper.addDays(priorEnd, -(dates.length - 1));
  return { start: priorStart, end: priorEnd };
}

export function windowContainsDate(window, dateStr) {
  return dateStr && isDateInRecapWindow(dateStr, window);
}
