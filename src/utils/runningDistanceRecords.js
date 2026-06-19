/**
 * Records de distance course (1 km, 5 km, 15 km…) à partir des activités Garmin.
 */

import { classifyLapPhase } from './garminRunningLaps';
import { formatPaceMinPerKm } from './runningPersonalRecords';

function toNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function activityDistanceKm(act) {
  let d = act?.distance;
  if (d != null && typeof d === 'object') d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  const n = toNum(d, 0);
  if (n > 400 && n < 200000) return n / 1000;
  if (n > 0) return n;
  const m = toNum(act?.running?.distanceMeters ?? act?.distanceMeters, 0);
  return m > 0 ? m / 1000 : 0;
}

function activityDurationSec(act) {
  return toNum(act?.duration ?? act?.running?.durationSeconds, 0);
}

function lapDistanceKm(lap) {
  const dk = toNum(lap?.distanceKm, 0);
  if (dk > 0) return dk;
  const m = toNum(lap?.distanceMeters, 0);
  return m > 0 ? m / 1000 : 0;
}

function lapDurationSec(lap) {
  return toNum(lap?.durationSeconds ?? lap?.duration, 0);
}

function normalizeDate(act) {
  const raw = String(act?.date || act?.startTimeLocal || act?.startTimeGmt || '');
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Segments continus (hors récup / retour calme / échauffement). */
export function buildContinuousLapSegments(act) {
  const laps = act?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return [];

  const segments = [];
  let cur = [];

  const flush = () => {
    if (cur.length) {
      segments.push(cur);
      cur = [];
    }
  };

  for (const lap of laps) {
    const phase = classifyLapPhase(lap);
    if (phase === 'recovery' || phase === 'cooldown' || phase === 'warmup') {
      flush();
      continue;
    }
    const km = lapDistanceKm(lap);
    const sec = lapDurationSec(lap);
    if (km > 0.02 && sec > 3) cur.push({ km, sec });
  }
  flush();

  if (segments.length > 0) return segments;

  const km = activityDistanceKm(act);
  const sec = activityDurationSec(act);
  if (km > 0.1 && sec > 30) return [[{ km, sec }]];
  return [];
}

/**
 * Temps minimal pour parcourir targetKm sur segments continus (fenêtre glissante sur tours).
 */
export function bestTimeForDistanceInSegment(points, targetKm) {
  if (!Array.isArray(points) || points.length === 0 || targetKm <= 0) return null;
  let bestSec = null;

  for (let i = 0; i < points.length; i++) {
    let dist = 0;
    let sec = 0;
    for (let j = i; j < points.length; j++) {
      dist += points[j].km;
      sec += points[j].sec;
      if (dist >= targetKm - 1e-6) {
        const overrun = dist - targetKm;
        const adjSec = sec - (overrun / points[j].km) * points[j].sec;
        if (adjSec > 0 && (bestSec == null || adjSec < bestSec)) bestSec = adjSec;
        break;
      }
    }
  }
  return bestSec;
}

const WHOLE_ACTIVITY_TOLERANCE = {
  1: [0.96, 1.04],
  5: [0.94, 1.06],
  10: [0.93, 1.07]
};

function wholeActivityTimeForDistance(act, targetKm) {
  const km = activityDistanceKm(act);
  const sec = activityDurationSec(act);
  if (km <= 0 || sec <= 0) return null;
  const band = WHOLE_ACTIVITY_TOLERANCE[targetKm] || [0.9, 1.1];
  if (km >= targetKm * band[0] && km <= targetKm * band[1]) {
    return (sec / km) * targetKm;
  }
  if (km >= targetKm && targetKm >= 10) {
    return (sec / km) * targetKm;
  }
  return null;
}

/** Jalons affichés selon la distance max enregistrée. */
export function getDistanceRecordMilestones(maxDistanceKm) {
  const max = toNum(maxDistanceKm, 0);
  const milestones = [1, 5];
  for (const d of [10, 15, 20, 25, 30, 35, 40, 42.195, 45, 50]) {
    if (max >= d - 0.45) milestones.push(d);
  }
  return milestones;
}

/**
 * @param {object[]} activities — activités Garmin course
 * @returns {{ maxDistanceKm: number, records: Array<{ distanceKm: number, timeSec: number, paceLabel: string, date: string|null, activityId: string|number|null }> }}
 */
export function computeRunningDistanceRecordsFromGarminActivities(activities) {
  const list = Array.isArray(activities) ? activities : [];
  let maxDistanceKm = 0;

  for (const act of list) {
    const km = activityDistanceKm(act);
    if (km > maxDistanceKm) maxDistanceKm = km;
  }

  const milestones = getDistanceRecordMilestones(maxDistanceKm);
  const records = milestones.map((distanceKm) => ({
    distanceKm,
    timeSec: null,
    paceLabel: '—',
    date: null,
    activityId: null
  }));

  for (const act of list) {
    const date = normalizeDate(act);
    const actId = act?.activityId ?? act?.id ?? null;
    const segments = buildContinuousLapSegments(act);

    for (const rec of records) {
      const target = rec.distanceKm;
      let candidate = wholeActivityTimeForDistance(act, target);

      if (candidate == null) {
        for (const seg of segments) {
          const t = bestTimeForDistanceInSegment(seg, target);
          if (t != null && (candidate == null || t < candidate)) candidate = t;
        }
      }

      if (candidate != null && (rec.timeSec == null || candidate < rec.timeSec)) {
        rec.timeSec = candidate;
        rec.date = date;
        rec.activityId = actId;
        rec.paceLabel = formatPaceMinPerKm(candidate / 60 / target);
      }
    }
  }

  return { maxDistanceKm, records };
}

export function formatDurationHms(totalSec) {
  if (totalSec == null || !Number.isFinite(totalSec) || totalSec <= 0) return '—';
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
