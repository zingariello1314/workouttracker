/**
 * Définition unique « jour d'entraînement » pour Récap / Vision Coach.
 *
 * Compte un jour si ≥1 de :
 * - exercices cochés (muscu)
 * - session endurance Momentum (hors marche)
 * - circuit enregistré
 * - activité Garmin (cardio, force, natation, corde…) — **hors marche / pas seuls**
 */

import DateHelper from '../dateHelper';
import { getDateStr } from '../dateUtils';
import { isMockEnduranceSession } from '../calendarUtils';
import { dayHasCheckedWorkout } from '../trainingStreakUtils';
import { isGarminWalkingLikeActivity } from '../garminRunningLaps';
import {
  resolveSessionCalendarDate,
  resolveGarminActivityCalendarDate,
  readGarminActivityDateOverrides
} from '../sessionCalendarDate';

const MIN_GARMIN_DURATION_SEC = 60;

function parseActivityDateYmd(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const d = s.length >= 10 ? s.slice(0, 10) : s;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function sessionDateYmd(session, snapshot) {
  const overrides = readGarminActivityDateOverrides(snapshot);
  const resolved = resolveSessionCalendarDate(session, overrides);
  if (resolved) return resolved;
  if (!session?.date) return null;
  try {
    return getDateStr(new Date(session.date));
  } catch {
    return parseActivityDateYmd(session.date);
  }
}

function looksLikeWalkSession(session) {
  const blob = `${session?.activityType || ''} ${session?.type || ''} ${session?.notes || ''} ${session?.activityName || ''}`.toLowerCase();
  if (/\b(walk|walking|marche|randonnée|hike|hiking|rando)\b/.test(blob)) {
    if (/\b(running|course|jog|trail run)\b/.test(blob)) return false;
    return true;
  }
  return false;
}

/** Session endurance saisie dans Momentum (hors marche). */
export function dayHasMomentumEnduranceSession(data, dateStr) {
  const sessions = data?.enduranceData?.sessions || {};
  for (const list of Object.values(sessions)) {
    if (!Array.isArray(list)) continue;
    for (const session of list) {
      if (isMockEnduranceSession(session)) continue;
      if (sessionDateYmd(session, data) !== dateStr) continue;
      if (looksLikeWalkSession(session)) continue;
      return true;
    }
  }
  return false;
}

export function dayHasCircuitProgress(data, dateStr) {
  const day = data?.circuitProgress?.[dateStr];
  return Boolean(day && typeof day === 'object' && Object.keys(day).length > 0);
}

/** Activité Garmin qui compte comme entraînement (pas marche / pas bruit). */
export function isGarminTrainingActivity(gAct) {
  if (!gAct || typeof gAct !== 'object') return false;
  if (isGarminWalkingLikeActivity(gAct)) return false;

  const dur = Number(gAct.duration) || 0;
  if (gAct.jumps && Number(gAct.jumps) > 0) return true;

  const gTk = String(gAct.garminTypeKey || gAct.activityType || '').toLowerCase();
  const dTk = String(gAct.displayActivityType || gAct.type || '').toLowerCase();
  const blob = `${gTk} ${dTk} ${gAct.activityName || gAct.name || ''}`.toLowerCase();

  if (/strength|hiit|swim|box|elliptic|cycl|bik|row|ski|stair|training|workout|cardio|run|trail|treadmill/.test(blob)) {
    return dur >= MIN_GARMIN_DURATION_SEC || Number(gAct.distance?.total ?? gAct.distance) > 0;
  }

  return dur >= MIN_GARMIN_DURATION_SEC;
}

function forEachGarminActivity(garminData, fn) {
  if (!garminData?.activities || typeof garminData.activities !== 'object') return;
  ['cardio', 'swimming', 'jumpRope'].forEach((bucket) => {
    const list = garminData.activities[bucket];
    if (!Array.isArray(list)) return;
    list.forEach((act) => fn(act, bucket));
  });
}

/** Dates YYYY-MM-DD avec ≥1 activité Garmin entraînement (date logique). */
export function collectGarminTrainingDates(garminData, snapshot = null) {
  const overrides = readGarminActivityDateOverrides(snapshot);
  const set = new Set();
  forEachGarminActivity(garminData, (act) => {
    if (!isGarminTrainingActivity(act)) return;
    const d = resolveGarminActivityCalendarDate(act, overrides);
    if (d) set.add(d);
  });
  return set;
}

/**
 * Jour d'entraînement au sens Récap (muscu + endurance + circuit + Garmin hors marche).
 */
export function dayHasTrainingActivity(snapshot, dateStr, garminData = null) {
  if (!dateStr) return false;
  if (dayHasCheckedWorkout(snapshot, dateStr)) return true;
  if (dayHasMomentumEnduranceSession(snapshot, dateStr)) return true;
  if (dayHasCircuitProgress(snapshot, dateStr)) return true;
  if (garminData) {
    const garminDates = collectGarminTrainingDates(garminData, snapshot);
    if (garminDates.has(dateStr)) return true;
  }
  return false;
}

/**
 * Nombre de jours d'entraînement sur [startYmd, endYmd] inclusive.
 */
export function countTrainingDaysInRange(snapshot, startYmd, endYmd, garminData = null) {
  if (!startYmd || !endYmd || startYmd > endYmd) return 0;
  const garminDates = garminData ? collectGarminTrainingDates(garminData, snapshot) : new Set();
  let count = 0;
  for (const d of DateHelper.getDateRange(startYmd, endYmd)) {
    if (dayHasCheckedWorkout(snapshot, d)) {
      count += 1;
      continue;
    }
    if (dayHasMomentumEnduranceSession(snapshot, d)) {
      count += 1;
      continue;
    }
    if (dayHasCircuitProgress(snapshot, d)) {
      count += 1;
      continue;
    }
    if (garminDates.has(d)) count += 1;
  }
  return count;
}

/** @deprecated alias interne — préférer countTrainingDaysInRange */
export function trainedDaysInRange(snapshot, startYmd, endYmd, garminData = null) {
  return countTrainingDaysInRange(snapshot, startYmd, endYmd, garminData);
}
