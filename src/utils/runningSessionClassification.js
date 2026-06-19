/**
 * Classification course Garmin : fractionné | vitesse (effort continu soutenu) | endurance.
 * Le fractionné existant (tours récup + efforts) est préservé en priorité.
 */

import {
  classifyLapPhase,
  inferRunningSessionTypeFromGarminActivity
} from './garminRunningLaps';

function toNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function activityDistanceKm(gAct) {
  let d = gAct?.distance;
  if (d != null && typeof d === 'object') d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  const n = toNum(d, 0);
  if (n > 400 && n < 200000) return n / 1000;
  if (n > 0) return n;
  const m = toNum(gAct?.running?.distanceMeters ?? gAct?.distanceMeters, 0);
  return m > 0 ? m / 1000 : 0;
}

function activityDurationSec(gAct) {
  const sec = toNum(gAct?.duration ?? gAct?.running?.durationSeconds, 0);
  return sec > 0 ? sec : 0;
}

function activityAvgHr(gAct) {
  const raw =
    gAct?.averageHeartRate ??
    gAct?.avgHR ??
    gAct?.meanHeartRate ??
    gAct?.heartRate?.avg ??
    gAct?.heartRate?.average ??
    gAct?.running?.avgHeartRate;
  const n = toNum(raw, 0);
  return n > 35 ? n : 0;
}

function activityMaxHr(gAct) {
  const n = toNum(
    gAct?.maxHeartRate ?? gAct?.maxHR ?? gAct?.heartRate?.max ?? gAct?.running?.maxHeartRate,
    0
  );
  return n > 35 ? n : 0;
}

function lapDistanceKm(lap) {
  const dk = toNum(lap?.distanceKm, 0);
  if (dk > 0) return dk;
  const m = toNum(lap?.distanceMeters ?? lap?.distanceMeter, 0);
  return m > 0 ? m / 1000 : 0;
}

function lapDurationSec(lap) {
  return toNum(lap?.durationSeconds ?? lap?.duration ?? lap?.elapsedDuration, 0);
}

import { estimateHrReferenceFromPeaks } from './runningHeartRateModel';

/** FC de référence : pics observés + formule âge (unifié avec stats course). */
export function estimateHrReference({ age = null, maxObservedHr = 0, hrPeaks = null } = {}) {
  const peaks =
    Array.isArray(hrPeaks) && hrPeaks.length > 0
      ? hrPeaks
      : maxObservedHr > 0
        ? [{ maxHR: maxObservedHr }]
        : [];
  return estimateHrReferenceFromPeaks(peaks, { age });
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

/** Coefficient de variation (écart-type / moyenne). */
export function paceCoefficientOfVariation(pacesMinPerKm) {
  const p = (pacesMinPerKm || []).filter((x) => x > 0 && x < 30);
  if (p.length < 2) return 0;
  const m = mean(p);
  if (m <= 0) return 0;
  return stdDev(p) / m;
}

/** Alternances rapide/lent sur séquence d’allures (détection fractionné implicite). */
export function countPaceAlternations(pacesMinPerKm, thresholdRatio = 0.14) {
  const p = (pacesMinPerKm || []).filter((x) => x > 0 && x < 30);
  if (p.length < 3) return 0;
  const m = mean(p);
  let alternations = 0;
  for (let i = 1; i < p.length; i++) {
    const prevFast = p[i - 1] < m * (1 - thresholdRatio / 2);
    const curFast = p[i] < m * (1 - thresholdRatio / 2);
    const prevSlow = p[i - 1] > m * (1 + thresholdRatio / 2);
    const curSlow = p[i] > m * (1 + thresholdRatio / 2);
    if ((prevFast && curSlow) || (prevSlow && curFast)) alternations += 1;
  }
  return alternations;
}

function lapPacesMinPerKm(gAct, { excludeWarmupCooldown = true, excludeRecovery = true } = {}) {
  const laps = gAct?.running?.laps;
  if (!Array.isArray(laps)) return [];
  const out = [];
  for (const lap of laps) {
    const phase = classifyLapPhase(lap);
    if (excludeRecovery && phase === 'recovery') continue;
    if (excludeWarmupCooldown && (phase === 'warmup' || phase === 'cooldown')) continue;
    const km = lapDistanceKm(lap);
    const sec = lapDurationSec(lap);
    if (km < 0.03 || sec < 5) continue;
    out.push(sec / 60 / km);
  }
  return out;
}

function hasRecoveryLaps(gAct) {
  const laps = gAct?.running?.laps;
  if (!Array.isArray(laps)) return false;
  return laps.some((l) => classifyLapPhase(l) === 'recovery');
}

function detectHiddenIntervalPattern(gAct) {
  const paces = lapPacesMinPerKm(gAct);
  if (paces.length < 4) return false;
  const cv = paceCoefficientOfVariation(paces);
  const alt = countPaceAlternations(paces);
  return cv >= 0.1 && alt >= 2;
}

/**
 * @typedef {'interval'|'speed'|'endurance'} RunningSessionKind
 */

/**
 * @param {object} gAct
 * @param {{ age?: number|null, habitualEfPaceMinPerKm?: number|null, maxObservedHr?: number }} [ctx]
 * @returns {RunningSessionKind}
 */
export function inferRunningSessionKindFromGarminActivity(gAct, ctx = {}) {
  if (!gAct) return 'endurance';

  const lapKind = inferRunningSessionTypeFromGarminActivity(gAct);
  if (lapKind === 'interval') return 'interval';

  if (detectHiddenIntervalPattern(gAct)) return 'interval';

  const km = activityDistanceKm(gAct);
  const sec = activityDurationSec(gAct);
  if (km < 0.03 || sec < 5) return 'endurance';

  const paceMinPerKm = sec / 60 / km;
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm < 2.8 || paceMinPerKm > 12) return 'endurance';

  const paces = lapPacesMinPerKm(gAct);
  const cv =
    paces.length >= 3
      ? paceCoefficientOfVariation(paces)
      : paceCoefficientOfVariation([paceMinPerKm]);
  const isStable = cv < 0.09;

  const avgHr = activityAvgHr(gAct);
  const maxHr = Math.max(activityMaxHr(gAct), avgHr, ctx.maxObservedHr || 0);
  const fcRef = estimateHrReference({ age: ctx.age, maxObservedHr: maxHr });
  const hrRatio = avgHr > 0 ? avgHr / fcRef : null;

  const habitual = ctx.habitualEfPaceMinPerKm;
  const fasterThanHabitual =
    habitual != null && habitual > 0 && paceMinPerKm < habitual / 1.1;

  const highIntensity = hrRatio != null && hrRatio >= 0.78;
  const veryHighIntensity = hrRatio != null && hrRatio >= 0.85;

  /** 1 km, 5 km… : effort continu rapide même sans FC ni allure EF de référence. */
  const FAST_PACE_MAX_MIN_PER_KM = 5.35;
  if (
    !hasRecoveryLaps(gAct) &&
    km >= 0.75 &&
    km <= 8 &&
    sec >= 90 &&
    paceMinPerKm <= FAST_PACE_MAX_MIN_PER_KM &&
    isStable
  ) {
    if (fasterThanHabitual) return 'speed';
    if (paceMinPerKm <= 5.15) return 'speed';
    if (highIntensity || veryHighIntensity) return 'speed';
  }

  if (isStable && (fasterThanHabitual || highIntensity) && paceMinPerKm <= 6.2) {
    if (veryHighIntensity || (fasterThanHabitual && paceMinPerKm <= (habitual || 7) * 0.9)) {
      return 'speed';
    }
    if (fasterThanHabitual && km >= 1) return 'speed';
  }

  return 'endurance';
}

/**
 * Classification à partir d'une séance endurance + activité Garmin optionnelle.
 */
export function inferRunningSessionKindFromSession(session, garminActivity, ctx = {}) {
  if (garminActivity) {
    return inferRunningSessionKindFromGarminActivity(garminActivity, ctx);
  }
  const km = toNum(String(session?.distance ?? '').replace(',', '.'), 0);
  const durMin = toNum(session?.duration, 0);
  let sec = 0;
  if (typeof session?.duration === 'string' && session.duration.includes(':')) {
    const parts = session.duration.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
  } else if (durMin > 0) {
    sec = durMin * 60;
  }
  if (km < 0.75 || sec < 90) return 'endurance';
  const paceMinPerKm = sec / 60 / km;
  const type = String(session?.type || '').toLowerCase();
  if (type === 'interval') return 'interval';
  if (type === 'speed') return 'speed';
  if (type === 'endurance' || type === 'easy' || type === 'fundamental' || type === 'recovery') {
    return 'endurance';
  }
  const habitual = ctx.habitualEfPaceMinPerKm;
  if (paceMinPerKm <= 5.15 && km <= 8) return 'speed';
  if (habitual != null && habitual > 0 && paceMinPerKm < habitual / 1.1 && km <= 8) {
    return 'speed';
  }
  return 'endurance';
}
