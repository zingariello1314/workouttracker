/**
 * Pont Garmin cardio → sessions endurance (course / marche).
 * Partagé entre import sync et affichage Défis (historique aligné sur les stats Garmin).
 */

import {
  inferRunningSessionTypeFromGarminActivity,
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity,
  garminMeetsEnduranceRunWalkImportThresholds
} from './garminRunningLaps';
import { parseRunningSessionDurationMinutes } from './runningPersonalRecords';

function parseGarminActivityDateTime(gAct) {
  const raw = gAct?.date;
  if (!raw || typeof raw !== 'string') {
    const d = new Date();
    return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 8) };
  }
  if (raw.includes(' ')) {
    const [dPart, tPart] = raw.split(/\s+/);
    const date = dPart.length >= 10 ? dPart.slice(0, 10) : raw;
    const time = (tPart || '00:00:00').slice(0, 8);
    return { date, time };
  }
  if (raw.length >= 10) {
    return {
      date: raw.slice(0, 10),
      time: String(gAct.time || '00:00:00').slice(0, 8)
    };
  }
  const d = new Date();
  return { date: d.toISOString().slice(0, 10), time: '00:00:00' };
}

function formatDurationHhMmSs(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function paceMinPerKm(distanceKm, totalSeconds) {
  if (!distanceKm || distanceKm <= 0 || !totalSeconds || totalSeconds <= 0) return '';
  const paceMin = totalSeconds / 60 / distanceKm;
  const mi = Math.floor(paceMin);
  const se = Math.round((paceMin - mi) * 60);
  return `${mi}:${String(se).padStart(2, '0')}`;
}

export function distanceKmFromGarminActivity(gAct) {
  const raw = gAct?.distance?.total ?? gAct?.distance?.value ?? gAct?.distance;
  const d = Number(raw);
  if (Number.isFinite(d) && d > 0) {
    if (d > 400 && d < 200000) return d / 1000;
    return d;
  }
  const m = Number(gAct?.distanceMeters ?? gAct?.running?.distanceMeters ?? gAct?.summaryDTO?.distanceMeters);
  if (Number.isFinite(m) && m > 0) return m / 1000;
  return 0;
}

function getActivityKey(activity) {
  if (activity?.garminId != null) return `garmin_${activity.garminId}`;
  if (activity?.id != null) return `id_${activity.id}`;
  return `${activity?.date}_${activity?.time || '00:00:00'}`;
}

/**
 * Construit une session endurance à partir d'une activité cardio Garmin.
 * @returns {object|null}
 */
export function buildEnduranceSessionFromGarminCardio(gAct) {
  if (!gAct || (gAct.jumps && gAct.jumps > 0)) return null;
  if (!isGarminRunningLikeActivity(gAct) && !isGarminWalkingLikeActivity(gAct)) return null;

  const durationSec = Number(gAct.duration) || 0;
  const durationMinutes = durationSec / 60;
  const distanceKm = distanceKmFromGarminActivity(gAct);
  const isWalk = isGarminWalkingLikeActivity(gAct);

  if (!garminMeetsEnduranceRunWalkImportThresholds(gAct, isWalk)) return null;
  if (durationMinutes >= 1440 || durationMinutes === 3600) return null;
  if (distanceKm <= 0 || durationSec <= 0) return null;

  const runType = isWalk ? 'walk' : inferRunningSessionTypeFromGarminActivity(gAct);
  const { date, time } = parseGarminActivityDateTime(gAct);
  const pace = paceMinPerKm(distanceKm, durationSec);
  const speed = (distanceKm / (durationSec / 3600)).toFixed(2);
  const elevGain = gAct.elevation?.gain;
  const name = gAct.activityName || (isWalk ? 'Marche' : 'Course');

  return {
    id: gAct.id || gAct.garminId,
    garminId: gAct.garminId || gAct.id,
    date,
    time,
    distance: Math.round(distanceKm * 1000) / 1000,
    duration: formatDurationHhMmSs(durationSec),
    type: runType,
    pace,
    speed,
    elevation: elevGain != null && elevGain !== '' ? Math.round(elevGain) : '',
    avgHR: gAct.avgHR || 0,
    maxHR: gAct.maxHR || 0,
    calories: typeof gAct.calories === 'object' ? (gAct.calories?.total || 0) : (gAct.calories || 0),
    source: 'garmin',
    notes: `Garmin — ${name}`,
    __fromGarminBridge: true
  };
}

/**
 * Fusionne les activités Garmin course/marche absentes de l'historique endurance.
 * Les stats Garmin et l'historique Défis partagent ainsi le même périmètre.
 */
export function mergeGarminCardioIntoRunningSessions(sessions, garminActivities) {
  const existing = Array.isArray(sessions) ? sessions : [];
  const keys = new Set(
    existing.map((s) => {
      const gid = s?.garminId ?? s?.id;
      return gid != null ? String(gid) : getActivityKey(s);
    })
  );
  const merged = [...existing];

  for (const gAct of garminActivities || []) {
    const gid = gAct?.garminId ?? gAct?.id;
    if (gid == null) continue;
    const key = String(gid);
    if (keys.has(key)) continue;

    const session = buildEnduranceSessionFromGarminCardio(gAct);
    if (!session) continue;
    merged.push(session);
    keys.add(key);
  }

  return merged;
}

function momentumSessionDistanceKm(session) {
  const km = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  return km > 400 ? km / 1000 : km;
}

function garminActivityDurationMin(gAct) {
  const sec = Number(gAct?.duration) || 0;
  return sec > 0 ? Math.round(sec / 60) : 0;
}

/** Même sortie saisie à la main et importée Garmin (même jour). */
export function momentumRunLikelyMatchesGarminActivity(session, gAct) {
  if (!session || !gAct) return false;

  const kmS = momentumSessionDistanceKm(session);
  const kmG = distanceKmFromGarminActivity(gAct);
  if (kmS > 0.05 && kmG > 0.05) {
    const diff = Math.abs(kmS - kmG);
    if (diff <= 0.25 || diff / Math.max(kmS, kmG, 0.01) <= 0.06) return true;
  }

  const durS = parseRunningSessionDurationMinutes(session?.duration);
  const durG = garminActivityDurationMin(gAct);
  if (durS >= 5 && durG >= 5) {
    const diff = Math.abs(durS - durG);
    if (diff <= 4 || diff / Math.max(durS, durG) <= 0.06) return true;
  }

  return false;
}

/**
 * Apparie les séances course du jour (Momentum + Garmin) sans compter deux fois la même sortie.
 * Les activités Garmin sans équivalent manuel restent importées.
 */
export function pairMomentumRunsWithGarminForDate(momentumRuns, garminRuns) {
  const pairedGarminIds = new Set();
  const pairs = [];

  for (const mSession of momentumRuns || []) {
    let garminAct = null;
    const existingGid = mSession?.garminId ?? null;

    if (existingGid != null) {
      garminAct =
        (garminRuns || []).find((g) => String(g.garminId ?? g.id) === String(existingGid)) || null;
      if (garminAct) pairedGarminIds.add(String(existingGid));
    } else {
      for (const gAct of garminRuns || []) {
        const gid = String(gAct.garminId ?? gAct.id);
        if (pairedGarminIds.has(gid)) continue;
        if (momentumRunLikelyMatchesGarminActivity(mSession, gAct)) {
          garminAct = gAct;
          pairedGarminIds.add(gid);
          break;
        }
      }
    }

    const session =
      garminAct && existingGid == null
        ? { ...mSession, garminId: garminAct.garminId ?? garminAct.id }
        : mSession;
    pairs.push({ session, garmin: garminAct });
  }

  for (const gAct of garminRuns || []) {
    const gid = String(gAct.garminId ?? gAct.id);
    if (pairedGarminIds.has(gid)) continue;
    const session = buildEnduranceSessionFromGarminCardio(gAct);
    if (!session) continue;
    pairs.push({ session, garmin: gAct });
  }

  return pairs;
}
