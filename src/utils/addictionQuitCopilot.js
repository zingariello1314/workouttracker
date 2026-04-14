/**
 * Copilote « décision » : motifs composés (hypothèses), stratégies quand tu tiens,
 * stats pour récit / récap — jamais posé comme diagnostic médical.
 */

import { getDateStr } from './dateUtils';
import { sortCravingsForDay } from './addictionQuitHelpers';

const MS_DAY = 24 * 60 * 60 * 1000;

/** Tranches horaires locales (HH:MM 24h) */
export function timeBucketFromHHMM(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 'unknown';
  const [hStr] = hhmm.split(':');
  const h = Number.parseInt(hStr, 10);
  if (Number.isNaN(h)) return 'unknown';
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 14) return 'midday';
  if (h >= 14 && h < 19) return 'afternoon';
  if (h >= 19 && h < 23) return 'evening';
  return 'night';
}

function dayOfWeekMon0(dayStr) {
  const d = new Date(`${dayStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return -1;
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

function isWeekendDay(dayStr) {
  const dow = dayOfWeekMon0(dayStr);
  return dow === 5 || dow === 6;
}

/** Toutes les envies sur les `daysBack` derniers jours (inclus aujourd’hui). */
export function flattenRecentCravings(cravingsByDay, daysBack, nowMs = Date.now()) {
  const end = getDateStr(new Date(nowMs));
  const startD = new Date(nowMs);
  startD.setDate(startD.getDate() - (daysBack - 1));
  const start = getDateStr(startD);
  const rows = [];
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (!Array.isArray(arr) || day < start || day > end) continue;
    for (const c of sortCravingsForDay(arr)) {
      rows.push({ ...c, day });
    }
  }
  return rows;
}

function scoreRowForRisk(c) {
  const int = Number(c.intensity) || 0;
  const slip = c.outcomeId === 'slipped' ? 2 : 0;
  const high = int >= 7 ? 1.5 : 1;
  return int * high + slip;
}

/**
 * Motifs composés : trigger + tranche horaire + présence lieu (0/1).
 * @returns {{ pattern: string, triggerId: string, bucket: string, hasPlace: boolean, count: number, weight: number }[]}
 */
export function buildRiskHypotheses(cravingsByDay, daysBack = 56, nowMs = Date.now()) {
  const rows = flattenRecentCravings(cravingsByDay, daysBack, nowMs);
  const map = new Map();
  for (const c of rows) {
    const bucket = timeBucketFromHHMM(c.timeHHMM);
    const hasPlace = !!(c.place && String(c.place).trim());
    const tid = c.triggerId || '_none';
    const key = `${tid}|${bucket}|${hasPlace ? 1 : 0}`;
    const prev = map.get(key) || { count: 0, weight: 0, triggerId: tid, bucket, hasPlace };
    prev.count += 1;
    prev.weight += scoreRowForRisk(c);
    map.set(key, prev);
  }
  return Array.from(map.entries())
    .map(([pattern, v]) => ({ pattern, ...v }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}

export function buildHeldStrategies(cravingsByDay, daysBack = 56, nowMs = Date.now()) {
  const rows = flattenRecentCravings(cravingsByDay, daysBack, nowMs).filter((c) => c.outcomeId === 'held');
  const map = new Map();
  for (const c of rows) {
    const bucket = timeBucketFromHHMM(c.timeHHMM);
    const tid = c.triggerId || '_none';
    const key = `${tid}|${bucket}`;
    const prev = map.get(key) || { count: 0, sumInt: 0, triggerId: tid, bucket };
    prev.count += 1;
    prev.sumInt += Number(c.intensity) || 0;
    map.set(key, prev);
  }
  return Array.from(map.entries())
    .map(([pattern, v]) => ({
      pattern,
      triggerId: v.triggerId,
      bucket: v.bucket,
      count: v.count,
      avgIntensity: v.count ? v.sumInt / v.count : 0,
    }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** Part des envies tombant un samedi ou dimanche (sur la fenêtre). */
export function weekendCravingShare(cravingsByDay, daysBack = 42, nowMs = Date.now()) {
  const rows = flattenRecentCravings(cravingsByDay, daysBack, nowMs);
  if (rows.length === 0) return null;
  let wk = 0;
  for (const r of rows) {
    if (isWeekendDay(r.day)) wk += 1;
  }
  return Math.round((wk / rows.length) * 1000) / 10;
}

/** Jours avec ≥2 envies THC : déclencheur le plus fréquent (hypothèse dans tes données). */
export function thcHeavyDayTriggerHint(cravingsByDay, daysBack = 90, nowMs = Date.now()) {
  const byDay = {};
  const rows = flattenRecentCravings(cravingsByDay, daysBack, nowMs).filter((c) => c.trackId === 'thc');
  for (const c of rows) {
    if (!byDay[c.day]) byDay[c.day] = [];
    byDay[c.day].push(c);
  }
  const heavyDays = Object.entries(byDay).filter(([, arr]) => arr.length >= 2);
  if (heavyDays.length < 3) return null;
  const trigCount = new Map();
  for (const [, arr] of heavyDays) {
    for (const c of arr) {
      const t = c.triggerId || '_none';
      trigCount.set(t, (trigCount.get(t) || 0) + 1);
    }
  }
  let best = null;
  let bestN = 0;
  for (const [tid, n] of trigCount) {
    if (n > bestN) {
      bestN = n;
      best = tid;
    }
  }
  if (!best || best === '_none') return null;
  return { triggerId: best, heavyDayCount: heavyDays.length, mentions: bestN };
}

/** Écarts en jours entre craquages successifs (même suivi), du plus récent au plus ancien. */
export function relapseGapDays(relapses, trackId = null) {
  const list = [...(relapses || [])]
    .filter((r) => (trackId ? r.trackId === trackId : true))
    .map((r) => new Date(r.atIso).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);
  const gaps = [];
  for (let i = 0; i < list.length - 1; i += 1) {
    gaps.push(Math.max(0, Math.round((list[i] - list[i + 1]) / MS_DAY)));
  }
  return gaps;
}

function countWeekendCravings(cravingsByDay, startStr, endStr) {
  let n = 0;
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (day < startStr || day > endStr) continue;
    if (!isWeekendDay(day)) continue;
    if (!Array.isArray(arr)) continue;
    n += arr.length;
  }
  return n;
}

function countAllCravings(cravingsByDay, startStr, endStr) {
  let n = 0;
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (day < startStr || day > endStr) continue;
    if (!Array.isArray(arr)) continue;
    n += arr.length;
  }
  return n;
}

function countHeld(cravingsByDay, startStr, endStr) {
  let n = 0;
  let withOutcome = 0;
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (day < startStr || day > endStr) continue;
    if (!Array.isArray(arr)) continue;
    for (const c of arr) {
      if (c.outcomeId === 'held' || c.outcomeId === 'slipped') withOutcome += 1;
      if (c.outcomeId === 'held') n += 1;
    }
  }
  return { held: n, withOutcome };
}

/**
 * Indices pour une phrase « comparatif à toi-même » (30 j vs 30 j précédents).
 * @returns {{ wkPctA: number, wkPctB: number, heldRateA: number|null, heldRateB: number|null }}
 */
export function buildPeriodCompareHints(cravingsByDay, nowMs = Date.now()) {
  const end = getDateStr(new Date(nowMs));
  const dA1 = new Date(nowMs);
  const dA0 = new Date(nowMs);
  dA0.setDate(dA0.getDate() - 29);
  const startA = getDateStr(dA0);
  const dB1 = new Date(dA0);
  dB1.setDate(dB1.getDate() - 1);
  const endB = getDateStr(dB1);
  const dB0 = new Date(dB1);
  dB0.setDate(dB0.getDate() - 29);
  const startB = getDateStr(dB0);

  const totalA = countAllCravings(cravingsByDay, startA, end);
  const totalB = countAllCravings(cravingsByDay, startB, endB);
  const wkA = countWeekendCravings(cravingsByDay, startA, end);
  const wkB = countWeekendCravings(cravingsByDay, startB, endB);
  const { held: hA, withOutcome: oA } = countHeld(cravingsByDay, startA, end);
  const { held: hB, withOutcome: oB } = countHeld(cravingsByDay, startB, endB);

  return {
    wkPctA: totalA ? (wkA / totalA) * 100 : 0,
    wkPctB: totalB ? (wkB / totalB) * 100 : 0,
    heldRateA: oA > 0 ? hA / oA : null,
    heldRateB: oB > 0 ? hB / oB : null,
    totalA,
    totalB,
  };
}

export const DEFAULT_CALMING_ACTION_KEYS = [
  'addictionQuit.copilotAct.water',
  'addictionQuit.copilotAct.air',
  'addictionQuit.copilotAct.message',
  'addictionQuit.copilotAct.room',
  'addictionQuit.copilotAct.walk',
];

/** Clé semaine ISO locale (ex. 2026-W15) pour la revue hebdo */
export function isoWeekKeyLocal(d = new Date()) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - dayNr + 3);
  const jan4 = new Date(t.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(((t.getTime() - jan4.getTime()) / MS_DAY - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${t.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
