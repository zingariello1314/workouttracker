/**
 * Jour « champion » du calendrier — score d'intensité composite et comparaison aux moyennes.
 */

import { getDateStr } from './dateUtils';
import { isMockEnduranceSession, parseDurationToMinutes } from './calendarUtils';
import { computeVolumeKgForWorkoutKey } from './exerciseLoadVolume';
import { inferRunningSessionKindFromSession } from './runningSessionClassification';
import { distanceKmFromGarminActivity } from './garminEnduranceSessionBridge';
import { enumerateDedupedRunSessionsForDate } from './calendarPhysicalSessionStripes';
import { parseRunningSessionDurationMinutes } from './runningPersonalRecords';

const RUN_KIND_WEIGHT = {
  speed: 2.4,
  interval: 2.0,
  endurance: 0.55
};

function toNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function normalizeYmd(raw) {
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : getDateStr(new Date(raw));
}

function activeKcalFromDaily(daily) {
  if (!daily) return 0;
  if (daily.calories && typeof daily.calories === 'object') {
    return toNum(daily.calories.active, 0);
  }
  return toNum(daily.activeKilocalories ?? daily.activeKcal, 0);
}

function intervalEffortCount(gAct) {
  const laps = gAct?.running?.laps;
  if (!Array.isArray(laps)) return 0;
  let effort = 0;
  for (const lap of laps) {
    const t = String(lap?.intervalTypeKey || lap?.lapType || lap?.type || '').toUpperCase();
    if (/REST|RECOVERY|COOLDOWN|WARMUP|WARM/.test(t)) continue;
    if (/ACTIVE|INTERVAL|WORK|SPEED|RACE|REP|LAP/.test(t) || !t) effort += 1;
  }
  return effort;
}

function garminRunMetrics(act) {
  let km = distanceKmFromGarminActivity(act);
  if (km <= 0) {
    let dKm = toNum(act?.distance, 0);
    if (dKm > 400) dKm /= 1000;
    km = dKm;
  }
  const sec = toNum(act?.duration, 0);
  const durMin = sec > 30 ? sec / 60 : 0;
  return { km, durMin };
}

function sessionDurationMin(session) {
  const parsed = parseRunningSessionDurationMinutes(session?.duration);
  if (parsed > 0) return parsed;
  return parseDurationToMinutes(session?.duration, 'champion.endurance');
}

/** Séances course fusionnées (Endurance + Garmin), sans doublon saisie / import. */
function collectDayRunningUnits(dateStr, workoutData, garminCardio, ctx) {
  const garminDataShim = { activities: { cardio: garminCardio || [] } };
  const pairs = enumerateDedupedRunSessionsForDate(workoutData, garminDataShim, dateStr);
  const units = [];

  for (const { session, garmin: garminAct } of pairs) {
    if (isMockEnduranceSession(session)) continue;

    const gMet = garminAct ? garminRunMetrics(garminAct) : { km: 0, durMin: 0 };
    const km = toNum(session.distance, 0) || gMet.km;
    const durMin = sessionDurationMin(session) || gMet.durMin;
    const kind = inferRunningSessionKindFromSession(session, garminAct, ctx);
    units.push({ km, durMin, kind, garminAct });
  }

  return units;
}

/**
 * @param {string} dateStr
 * @param {{ workoutData: object, garminDaily?: object, garminCardio?: object[], classificationCtx?: object }} input
 */
export function scoreCalendarDayIntensity(dateStr, input) {
  const data = input?.workoutData || {};
  const ctx = input?.classificationCtx || {};

  let reps = 0;
  let volumeKg = 0;
  let checked = 0;

  if (data.checkedExercises && data.reps) {
    for (const key of Object.keys(data.checkedExercises)) {
      if (!key.startsWith(`${dateStr}_`) || !data.checkedExercises[key]) continue;
      checked += 1;
      reps += toNum(data.reps[key], 0);
      volumeKg += computeVolumeKgForWorkoutKey(key, data);
    }
  }

  let otherEnduranceMinutes = 0;
  const sessions = data?.enduranceData?.sessions || {};
  for (const [activityType, arr] of Object.entries(sessions)) {
    if (!Array.isArray(arr) || activityType === 'running') continue;
    for (const s of arr) {
      if (!s?.date || isMockEnduranceSession(s)) continue;
      if (normalizeYmd(s.date) !== dateStr) continue;
      otherEnduranceMinutes += sessionDurationMin(s);
    }
  }

  const runUnits = collectDayRunningUnits(dateStr, data, input?.garminCardio, ctx);
  let enduranceRunMinutes = 0;
  let runningKm = 0;
  let runningScore = 0;

  for (const u of runUnits) {
    runningKm += u.km;
    if (u.kind === 'endurance') enduranceRunMinutes += u.durMin;

    const w = RUN_KIND_WEIGHT[u.kind] || 1;
    const efforts = u.kind === 'interval' && u.garminAct ? intervalEffortCount(u.garminAct) : 0;
    const intervalBoost = efforts > 0 ? 1 + Math.min(0.5, efforts * 0.04) : 1;
    runningScore += u.km * 12 * w * intervalBoost + u.durMin * 0.15 * w;
  }

  const activeKcal = activeKcalFromDaily(input?.garminDaily);

  const score =
    reps * 0.35 +
    volumeKg * 0.08 +
    checked * 12 +
    otherEnduranceMinutes * 0.9 +
    enduranceRunMinutes * 0.9 +
    runningScore +
    Math.min(400, activeKcal) * 0.12;

  return {
    date: dateStr,
    score: Math.round(score * 10) / 10,
    breakdown: {
      reps: Math.round(reps),
      volumeKg: Math.round(volumeKg),
      exercises: checked,
      enduranceMinutes: Math.round(enduranceRunMinutes),
      runningKm: Math.round(runningKm * 100) / 100,
      activeKcal: Math.round(activeKcal)
    }
  };
}

/**
 * @returns {{ champion: object|null, averages: object, allScored: object[] }}
 */
export function computeCalendarChampionAnalysis({
  workoutData,
  garminData,
  getExerciseNameById,
  classificationCtx,
  lookbackDays = 365
}) {
  const dates = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= lookbackDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.add(getDateStr(d));
  }

  if (workoutData?.checkedExercises) {
    for (const key of Object.keys(workoutData.checkedExercises)) {
      const ds = key.split('_')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) dates.add(ds);
    }
  }

  const cardio = garminData?.activities?.cardio || [];
  const dailyMetrics = garminData?.dailyMetrics || {};

  const allScored = [];
  for (const dateStr of dates) {
    const day = scoreCalendarDayIntensity(dateStr, {
      workoutData,
      garminDaily: dailyMetrics[dateStr],
      garminCardio: cardio,
      getExerciseNameById,
      classificationCtx
    });
    if (day.score > 0) allScored.push(day);
  }

  if (allScored.length === 0) {
    return { champion: null, averages: null, allScored: [] };
  }

  let champion = allScored[0];
  for (const d of allScored) {
    if (d.score > champion.score) champion = d;
  }

  const others = allScored.filter((d) => d.date !== champion.date);
  const pool = others.length > 0 ? others : allScored;
  const n = pool.length;
  const sums = { reps: 0, volumeKg: 0, exercises: 0, enduranceMinutes: 0, runningKm: 0, activeKcal: 0 };
  for (const d of pool) {
    for (const k of Object.keys(sums)) sums[k] += d.breakdown[k] || 0;
  }
  const averages = Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, Math.round((v / n) * 10) / 10])
  );

  const vsAverage = {};
  for (const k of Object.keys(sums)) {
    const avg = averages[k] || 0;
    const val = champion.breakdown[k] || 0;
    vsAverage[k] = avg > 0 ? Math.round(((val - avg) / avg) * 100) : val > 0 ? 100 : 0;
  }

  return {
    champion: { ...champion, vsAverage },
    averages,
    allScored
  };
}

export function formatPctVsAverage(pct) {
  if (pct == null || !Number.isFinite(pct)) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct} %`;
}
