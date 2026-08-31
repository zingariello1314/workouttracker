/**
 * Mesures normalisées + baselines personnelles (7 / 28 / 90 j.).
 * Une métrique n'est pas une analyse — ce fichier ne produit aucun texte UI.
 *
 * « volume » ici = somme des reps cochées (repVolume / checkedRepCount), pas une dose mécanique
 * (séries × charge × RIR). Ne pas le lire comme une charge d'entraînement réelle.
 */

import DateHelper from '../dateHelper';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { dailyRepsMap } from './recapInsightHelpers';
import { countTrainingDaysInRange } from './recapTrainingDayTruth';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';

/**
 * @typedef {object} BaselineMetric
 * @property {number} current7d
 * @property {number} current28d
 * @property {number} current90d
 * @property {number} previous7d
 * @property {number} previous28d
 * @property {number} previous90d
 * @property {number|null} delta7Pct
 * @property {number|null} delta28Pct
 * @property {number|null} delta90Pct
 * @property {number|null} primaryDeltaPct
 * @property {'rising'|'stable'|'falling'|'unknown'} trend
 * @property {number} confidence
 */

function windowEndingAt(end, days) {
  return { start: DateHelper.addDays(end, -(days - 1)), end };
}

function previousWindow(end, days) {
  const currStart = DateHelper.addDays(end, -(days - 1));
  const prevEnd = DateHelper.addDays(currStart, -1);
  return windowEndingAt(prevEnd, days);
}

function sumMap(map) {
  let n = 0;
  map.forEach((v) => {
    n += v;
  });
  return n;
}

function pctDelta(curr, prev) {
  if (prev == null || !Number.isFinite(prev) || prev <= 0) return null;
  if (curr == null || !Number.isFinite(curr)) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function classifyTrend(deltaPct, up = 12, down = -12) {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return 'unknown';
  if (deltaPct >= up) return 'rising';
  if (deltaPct <= down) return 'falling';
  return 'stable';
}

function confidenceFromSamples(n, need = 8) {
  if (!n || n <= 0) return 0.28;
  return Math.min(0.92, 0.38 + (n / need) * 0.45);
}

/**
 * Reps cochées dans une fenêtre.
 * @param {object} snapshot
 * @param {{ start: string, end: string }} win
 */
export function sumCheckedRepsInWindow(snapshot, win) {
  if (!win?.start || !win?.end) return 0;
  return sumMap(dailyRepsMap(snapshot, win));
}

/**
 * Dernière vs avant-dernière séance par exo : nombre de baisses nettes.
 */
export function countRecentRepDrops(snapshot, window, minAbsDrop = 6) {
  const byEx = new Map();
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  Object.keys(reps).forEach((k) => {
    if (checked[k] !== true) return;
    const d = extractDateStrFromWorkoutKey(k);
    const exId = extractExerciseIdFromWorkoutKey(k);
    if (!d || !exId || !isDateInRecapWindow(d, window)) return;
    const v = parseInt(String(reps[k]), 10) || 0;
    if (v <= 0) return;
    const list = byEx.get(exId) || [];
    list.push({ date: d, reps: v });
    byEx.set(exId, list);
  });

  let drops = 0;
  byEx.forEach((list) => {
    if (list.length < 2) return;
    list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const last = list[list.length - 1];
    const prev = list[list.length - 2];
    if (prev.reps - last.reps >= minAbsDrop) drops += 1;
  });
  return drops;
}

/**
 * @param {object} opts
 * @returns {{ volume: BaselineMetric, frequency: object, adherence: object, decliningExerciseCount: number }|null}
 */
export function buildRecapTrainingFeatures(opts = {}) {
  const { snapshot = {}, window, enrichment = null, assessment = null, garminData = null } = opts;
  const end = window?.end;
  if (!end) return null;

  const slices = {
    d7: windowEndingAt(end, 7),
    d28: windowEndingAt(end, 28),
    d90: windowEndingAt(end, 90),
    prev7: previousWindow(end, 7),
    prev28: previousWindow(end, 28),
    prev90: previousWindow(end, 90)
  };

  const reps = {
    current7d: sumCheckedRepsInWindow(snapshot, slices.d7),
    current28d: sumCheckedRepsInWindow(snapshot, slices.d28),
    current90d: sumCheckedRepsInWindow(snapshot, slices.d90),
    previous7d: sumCheckedRepsInWindow(snapshot, slices.prev7),
    previous28d: sumCheckedRepsInWindow(snapshot, slices.prev28),
    previous90d: sumCheckedRepsInWindow(snapshot, slices.prev90)
  };

  const days = {
    current7d: countTrainingDaysInRange(snapshot, slices.d7.start, slices.d7.end, garminData),
    current28d: countTrainingDaysInRange(snapshot, slices.d28.start, slices.d28.end, garminData),
    current90d: countTrainingDaysInRange(snapshot, slices.d90.start, slices.d90.end, garminData),
    previous7d: countTrainingDaysInRange(snapshot, slices.prev7.start, slices.prev7.end, garminData),
    previous28d: countTrainingDaysInRange(snapshot, slices.prev28.start, slices.prev28.end, garminData),
    previous90d: countTrainingDaysInRange(snapshot, slices.prev90.start, slices.prev90.end, garminData)
  };

  const delta7Pct = pctDelta(reps.current7d, reps.previous7d);
  const delta28Pct = pctDelta(reps.current28d, reps.previous28d);
  const delta90Pct = pctDelta(reps.current90d, reps.previous90d);

  const use28 = days.current28d >= 3 && days.previous28d >= 2;
  const primaryDeltaPct = use28 ? delta28Pct : delta7Pct;
  const volumeTrend = classifyTrend(primaryDeltaPct);
  const volumeConfidence = confidenceFromSamples(
    days.current28d + days.previous28d,
    10
  );

  const freqDeltaPct = pctDelta(days.current28d, days.previous28d);
  const programRatio = assessment?.programCompletion28?.ratio;
  const sla = assessment?.sessionLoadAlignment28;
  const least = enrichment?.leastCheckedExercises?.[0] || null;

  return {
    volume: {
      current7d: reps.current7d,
      current28d: reps.current28d,
      current90d: reps.current90d,
      previous7d: reps.previous7d,
      previous28d: reps.previous28d,
      previous90d: reps.previous90d,
      delta7Pct,
      delta28Pct,
      delta90Pct,
      primaryDeltaPct,
      trend: volumeTrend,
      confidence: volumeConfidence
    },
    frequency: {
      sessions7d: days.current7d,
      sessions28d: days.current28d,
      sessions90d: days.current90d,
      prevSessions7d: days.previous7d,
      prevSessions28d: days.previous28d,
      prevSessions90d: days.previous90d,
      perWeek28d: Math.round((days.current28d / 4) * 10) / 10,
      perWeekPrev28d: Math.round((days.previous28d / 4) * 10) / 10,
      deltaPct: freqDeltaPct,
      trend: classifyTrend(freqDeltaPct, 15, -15),
      confidence: confidenceFromSamples(days.current28d + days.previous28d, 8)
    },
    adherence: {
      programPct: programRatio != null ? Math.round(programRatio * 100) : null,
      sessionAlignment: sla?.avgScore0to100 ?? null,
      sessionDaysScored: sla?.sessionDaysScored ?? null,
      justifiedDays: enrichment?.justifications?.total ?? 0,
      restJustified: enrichment?.justifications?.restDays ?? 0,
      leastCheckedName: least?.name || null,
      leastCheckedPct: least?.pct ?? null
    },
    decliningExerciseCount: countRecentRepDrops(snapshot, window, 6)
  };
}

export { pctDelta, classifyTrend, windowEndingAt, previousWindow };
