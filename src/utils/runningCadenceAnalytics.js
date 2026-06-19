/**
 * Cadence moyenne par type de séance (endurance fondamentale vs vitesse).
 */

import { deriveCadenceSpmFromGarmin } from './runningGarminMetrics';
import { inferRunningSessionKindFromGarminActivity } from './runningSessionClassification';

function toNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function activityAvgHr(act) {
  const raw =
    act?.averageHeartRate ??
    act?.avgHR ??
    act?.meanHeartRate ??
    act?.heartRate?.avg ??
    act?.running?.avgHeartRate;
  const n = toNum(raw, 0);
  return n > 35 ? n : 0;
}

function activityDistanceKm(act) {
  let d = act?.distance;
  if (d != null && typeof d === 'object') d = d.total ?? d.value ?? 0;
  const n = toNum(d, 0);
  if (n > 400 && n < 200000) return n / 1000;
  if (n > 0) return n;
  return toNum(act?.running?.distanceMeters, 0) / 1000;
}

function activityDurationMin(act) {
  const sec = toNum(act?.duration ?? act?.running?.durationSeconds, 0);
  return sec > 0 ? sec / 60 : 0;
}

function isEfEligible(act, fcRef) {
  const km = activityDistanceKm(act);
  const dur = activityDurationMin(act);
  const hr = activityAvgHr(act);
  if (km < 2.5 || dur < 18 || hr <= 0) return false;
  return hr >= fcRef * 0.6 && hr <= fcRef * 0.75;
}

/**
 * @param {object[]} activities
 * @param {{ age?: number|null, habitualEfPaceMinPerKm?: number|null, maxObservedHr?: number }} ctx
 */
export function computeCadenceByRunKind(activities, ctx = {}) {
  const efSpm = [];
  const speedSpm = [];

  let maxHr = ctx.maxObservedHr || 0;
  for (const act of activities || []) {
    maxHr = Math.max(maxHr, toNum(act?.maxHeartRate ?? act?.maxHR, 0));
  }

  const kindCtx = { ...ctx, maxObservedHr: maxHr };

  for (const act of activities || []) {
    const cad = deriveCadenceSpmFromGarmin(act);
    if (!cad?.spm) continue;

    const kind = inferRunningSessionKindFromGarminActivity(act, kindCtx);
    if (kind === 'interval') continue;

    if (kind === 'speed') {
      speedSpm.push(cad.spm);
    } else if (kind === 'endurance' && isEfEligible(act, kindCtx.maxObservedHr || 190)) {
      efSpm.push(cad.spm);
    }
  }

  const avg = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  return {
    enduranceFundamental: { spm: avg(efSpm), sampleSize: efSpm.length },
    speed: { spm: avg(speedSpm), sampleSize: speedSpm.length }
  };
}
