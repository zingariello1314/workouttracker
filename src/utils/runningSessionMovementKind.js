/**
 * Détection marche vs course pour les sessions enregistrées sous « running ».
 * Combine type Garmin, allure, vitesse moyenne et cadence quand disponible.
 * @module runningSessionMovementKind
 */

import { parseDurationToMinutes } from './calendarUtils';
import {
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity,
  shouldExcludeStoredGarminRunningSession
} from './garminRunningLaps';
import { deriveCadenceSpmFromGarmin } from './runningGarminMetrics';

function toNum(v, fb = 0) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fb;
}

function sessionDurationMinutes(session) {
  return parseDurationToMinutes(session?.duration, 'runningSessionMovementKind');
}

function paceMinPerKmFromSessionLocal(session) {
  const dist = toNum(session?.distance, 0);
  const durMin = sessionDurationMinutes(session);
  if (dist < 0.15 || durMin <= 0.25) return null;
  return durMin / dist;
}

/**
 * Vitesse moyenne km/h à partir distance km et durée min.
 */
function avgSpeedKmh(session) {
  const dist = toNum(session?.distance, 0);
  const durMin = sessionDurationMinutes(session);
  if (dist <= 0 || durMin <= 0.2) return null;
  return dist / (durMin / 60);
}

/**
 * @param {object} session Session endurance running
 * @param {object|null} garmin Activité Garmin complète si disponible (IndexedDB)
 * @returns {boolean}
 */
export function isWalkingLikeRunningSession(session, garmin = null) {
  if (garmin && isGarminWalkingLikeActivity(garmin)) return true;
  // Aligné sur GarminRunningStatsCard : une activité classée « course » côté Garmin
  // ne doit pas être reléguée en marche uniquement à cause d'une allure lente (tapis, EF…).
  if (garmin && isGarminRunningLikeActivity(garmin) && !isGarminWalkingLikeActivity(garmin)) {
    return false;
  }
  // Session importée Garmin : ne pas exclure sur l'allure seule tant que l'activité n'est pas résolue.
  if ((session?.source === 'garmin' || session?.__fromGarminBridge) && !garmin) {
    const typeStr = `${session?.type || ''}`.toLowerCase();
    if (typeStr === 'walk' || typeStr === 'walking') return true;
    return false;
  }

  const typeStr = `${session?.type || ''} ${session?.notes || ''} ${session?.title || ''}`.toLowerCase();
  if (/\b(walk|walking|marche|rando|hike|hiking)\b/i.test(typeStr)) return true;

  const pace = paceMinPerKmFromSessionLocal(session);
  const speed = avgSpeedKmh(session);
  const cad = garmin ? deriveCadenceSpmFromGarmin(garmin) : null;
  const cadSpm = cad?.spm ?? null;

  if (pace != null && pace >= 11) return true;
  if (pace != null && pace >= 9.5 && speed != null && speed < 6.2) return true;
  if (pace != null && pace >= 8.75 && speed != null && speed < 6.8) return true;
  if (pace != null && pace >= 7.8 && cadSpm != null && cadSpm > 0 && cadSpm < 118 && speed != null && speed < 7.2) {
    if (String(session?.type || '').toLowerCase() === 'interval') return false;
    return true;
  }

  return false;
}

/**
 * Sessions comptées pour records / trophées course (exclut marche).
 */
export function filterRunningSessionsExcludingWalk(sessions, garminById = null) {
  if (!Array.isArray(sessions)) return [];
  const get = garminById && typeof garminById.get === 'function' ? garminById.get.bind(garminById) : () => null;
  return sessions.filter((s) => {
    if (shouldExcludeStoredGarminRunningSession(s)) return false;
    const key = s?.garminId != null ? String(s.garminId) : String(s?.id ?? '');
    const g = key && key !== 'undefined' ? get(key) : null;
    return !isWalkingLikeRunningSession(s, g);
  });
}

/**
 * Agrégats simples pour les séances classées marche.
 * @returns {{ count: number, totalKm: number, longestKm: number, longestSession: object|null }}
 */
export function summarizeWalkingRunningSessions(sessions, garminById = null) {
  if (!Array.isArray(sessions)) {
    return { count: 0, totalKm: 0, longestKm: 0, longestSession: null };
  }
  const get = garminById && typeof garminById.get === 'function' ? garminById.get.bind(garminById) : () => null;
  let count = 0;
  let totalKm = 0;
  let longestKm = 0;
  let longestSession = null;
  sessions.forEach((s) => {
    const key = s?.garminId != null ? String(s.garminId) : String(s?.id ?? '');
    const g = key && key !== 'undefined' ? get(key) : null;
    if (!isWalkingLikeRunningSession(s, g)) return;
    count += 1;
    const km = toNum(s?.distance, 0);
    totalKm += km;
    if (km >= longestKm) {
      longestKm = km;
      longestSession = s;
    }
  });
  return { count, totalKm, longestKm, longestSession };
}
