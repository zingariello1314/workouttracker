import { normalizeGarminDate } from '../../components/tabs/GarminTab/utils/garminFormatters';
import { isGarminRunningLikeActivity } from '../garminRunningLaps';

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {string} iso YYYY-MM-DD @param {number} delta jours (calendrier local) */
export function addCalendarDays(iso, delta) {
  const [y, m, da] = String(iso).split('-').map(Number);
  const d = new Date(y, m - 1, da);
  d.setDate(d.getDate() + delta);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function extractKmFromActivity(a) {
  if (!a || !isGarminRunningLikeActivity(a)) return 0;
  let d = a.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const m = a.running?.distanceMeters ?? a.distanceMeters;
  if (m != null && Number(m) > 0) return Number(m) / 1000;
  return 0;
}

/** @param {{ swimming?: any[], jumpRope?: any[], cardio?: any[] }} activities */
export function sumRunningKmByDate(activities) {
  const cardio = activities?.cardio || [];
  const map = new Map();
  for (const a of cardio) {
    const km = extractKmFromActivity(a);
    if (km <= 0) continue;
    const dk = normalizeGarminDate(a.date || a.startTimeLocal || a.startTimeGmt);
    if (!dk) continue;
    map.set(dk, (map.get(dk) || 0) + km);
  }
  return map;
}

/**
 * Histogramme course : fenêtre courante vs fenêtre précédente (même nombre de jours).
 * @param {Map<string, number>} kmByDate
 * @param {string} endStr dernier jour (inclus) YYYY-MM-DD
 * @param {number} windowDays ex. 7, 14, 30
 * @param {number} numBars nombre de barres (tronçons)
 */
/** Nombre de jours calendaires inclus entre deux dates ISO (≥ 1). */
export function inclusiveCalendarSpanDays(startIso, endIso) {
  const [ys, ms, ds] = String(startIso).split('-').map(Number);
  const [ye, me, de] = String(endIso).split('-').map(Number);
  const s = new Date(ys, ms - 1, ds);
  const e = new Date(ye, me - 1, de);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1);
}

/** Plus petite date ≤ endIso présente dans la carte km/jour (pour période « tout »). */
export function earliestDateInKmByDate(kmByDate, endIso) {
  let min = null;
  if (!kmByDate || typeof kmByDate.keys !== 'function') return null;
  for (const d of kmByDate.keys()) {
    if (d <= endIso && (!min || d < min)) min = d;
  }
  return min;
}

/**
 * Histogramme course sur une fenêtre [currStart, currEnd] (inclusif).
 * @param {{ omitPreviousComparison?: boolean }} opts — si true : pas de série « période précédente » (ex. « tout »).
 */
export function buildRunningCompareChartForWindow(kmByDate, currStart, currEnd, numBars, opts = {}) {
  const { omitPreviousComparison = false } = opts;
  const windowDays = inclusiveCalendarSpanDays(currStart, currEnd);
  const chunks = Math.min(Math.max(numBars, 4), 14);
  const daysPerChunk = Math.max(1, Math.ceil(windowDays / chunks));

  const prevEnd = omitPreviousComparison ? null : addCalendarDays(currStart, -1);
  const prevStart = omitPreviousComparison || !prevEnd ? null : addCalendarDays(prevEnd, -(windowDays - 1));

  const chartData = [];
  for (let c = 0; c < chunks; c++) {
    let currentValue = 0;
    let previousValue = 0;
    for (let k = 0; k < daysPerChunk; k++) {
      const idx = c * daysPerChunk + k;
      if (idx >= windowDays) break;
      const cd = addCalendarDays(currStart, idx);
      currentValue += kmByDate.get(cd) || 0;
      if (prevStart) {
        const pd = addCalendarDays(prevStart, idx);
        previousValue += kmByDate.get(pd) || 0;
      }
    }
    const firstDay = addCalendarDays(currStart, c * daysPerChunk);
    const label = firstDay.slice(5).replace('-', '/');
    chartData.push({
      label,
      currentValue,
      previousValue,
      currentPct: 0,
      previousPct: 0,
    });
  }

  let maxH = 0.0001;
  for (const p of chartData) {
    maxH = Math.max(maxH, p.currentValue, p.previousValue);
  }
  for (const p of chartData) {
    p.currentPct = (p.currentValue / maxH) * 100;
    p.previousPct = (p.previousValue / maxH) * 100;
  }

  const totalCurr = chartData.reduce((s, p) => s + p.currentValue, 0);
  const totalPrev = chartData.reduce((s, p) => s + p.previousValue, 0);
  const changeValue =
    omitPreviousComparison || totalPrev <= 1e-6
      ? omitPreviousComparison
        ? 0
        : totalCurr > 0
          ? 100
          : 0
      : ((totalCurr - totalPrev) / totalPrev) * 100;

  return {
    chartData,
    totalCurrKm: totalCurr,
    totalPrevKm: totalPrev,
    changeValue,
    currStart,
    prevStart,
    prevEnd,
  };
}

export function buildRunningCompareChart(kmByDate, endStr, windowDays, numBars) {
  const chunks = Math.min(Math.max(numBars, 4), 14);
  const daysPerChunk = Math.max(1, Math.ceil(windowDays / chunks));

  const currStart = addCalendarDays(endStr, -(windowDays - 1));
  const prevEnd = addCalendarDays(currStart, -1);
  const prevStart = addCalendarDays(prevEnd, -(windowDays - 1));

  const chartData = [];
  for (let c = 0; c < chunks; c++) {
    let currentValue = 0;
    let previousValue = 0;
    for (let k = 0; k < daysPerChunk; k++) {
      const idx = c * daysPerChunk + k;
      if (idx >= windowDays) break;
      const cd = addCalendarDays(currStart, idx);
      const pd = addCalendarDays(prevStart, idx);
      currentValue += kmByDate.get(cd) || 0;
      previousValue += kmByDate.get(pd) || 0;
    }
    const firstDay = addCalendarDays(currStart, c * daysPerChunk);
    const label = firstDay.slice(5).replace('-', '/');
    chartData.push({
      label,
      currentValue,
      previousValue,
      currentPct: 0,
      previousPct: 0,
    });
  }

  let maxH = 0.0001;
  for (const p of chartData) {
    maxH = Math.max(maxH, p.currentValue, p.previousValue);
  }
  for (const p of chartData) {
    p.currentPct = (p.currentValue / maxH) * 100;
    p.previousPct = (p.previousValue / maxH) * 100;
  }

  const totalCurr = chartData.reduce((s, p) => s + p.currentValue, 0);
  const totalPrev = chartData.reduce((s, p) => s + p.previousValue, 0);
  const changeValue =
    totalPrev > 1e-6 ? ((totalCurr - totalPrev) / totalPrev) * 100 : totalCurr > 0 ? 100 : 0;

  return {
    chartData,
    totalCurrKm: totalCurr,
    totalPrevKm: totalPrev,
    changeValue,
    currStart,
    prevStart,
    prevEnd,
  };
}

export function todayIsoLocal() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
