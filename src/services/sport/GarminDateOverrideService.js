/**
 * Réaffectation date logique des séances Garmin / endurance importées.
 */

import { normalizeDateString } from '../../utils/calendarUtils';
import { readGarminActivityDateOverrides } from '../../utils/sessionCalendarDate';

/**
 * @param {object} currentData
 * @param {{ garminId: string|number, logicalDate: string, reason?: string }} params
 * @returns {object} next aggregate
 */
export function buildAggregateWithGarminDateOverride(currentData, { garminId, logicalDate, reason }) {
  const logical = normalizeDateString(logicalDate);
  if (!logical || garminId == null) {
    throw new Error('[GarminDateOverrideService] garminId et logicalDate requis');
  }

  const prev = readGarminActivityDateOverrides(currentData);
  const key = String(garminId);

  return {
    ...currentData,
    garminActivityDateOverrides: {
      ...prev,
      [key]: {
        logicalDate: logical,
        updatedAt: new Date().toISOString(),
        ...(reason ? { reason: String(reason).slice(0, 200) } : {})
      }
    }
  };
}

function sessionMatchesId(session, sid) {
  return String(session?.id) === sid || String(session?.garminId) === sid;
}

/**
 * Réaffecte une session endurance (course, etc.) via logicalDate sur la session.
 * Cherche d'abord `activityType`, puis les autres familles : une activité Garmin
 * cardio peut n'exister que dans `sessions.running`, ou nulle part (cardio indoor).
 * @param {object} currentData
 * @param {{ sessionId: string|number, activityType?: string, logicalDate: string, required?: boolean }} params
 */
export function buildAggregateWithSessionLogicalDate(
  currentData,
  { sessionId, activityType, logicalDate, required = true }
) {
  const logical = normalizeDateString(logicalDate);
  if (!logical || sessionId == null || (required && !activityType)) {
    throw new Error('[GarminDateOverrideService] sessionId, activityType et logicalDate requis');
  }

  const endurance = currentData?.enduranceData || {};
  const sessions = { ...(endurance.sessions || {}) };
  const sid = String(sessionId);
  const types = [];
  if (activityType && sessions[activityType]) types.push(activityType);
  else if (activityType) types.push(activityType);
  Object.keys(sessions).forEach((key) => {
    if (!types.includes(key)) types.push(key);
  });

  let found = false;
  const nextSessions = { ...sessions };
  types.forEach((type) => {
    const list = Array.isArray(nextSessions[type]) ? nextSessions[type] : [];
    let typeFound = false;
    const nextList = list.map((session) => {
      if (!sessionMatchesId(session, sid)) return session;
      typeFound = true;
      found = true;
      return { ...session, logicalDate: logical };
    });
    if (typeFound) nextSessions[type] = nextList;
  });

  if (!found) {
    if (!required) return currentData;
    throw new Error('[GarminDateOverrideService] session introuvable');
  }

  return {
    ...currentData,
    enduranceData: {
      ...endurance,
      sessions: nextSessions
    }
  };
}

/**
 * @param {object} currentData
 * @param {string|number} garminId
 */
export function buildAggregateWithoutGarminDateOverride(currentData, garminId) {
  if (garminId == null) return currentData;
  const prev = readGarminActivityDateOverrides(currentData);
  const key = String(garminId);
  if (!prev[key]) return currentData;
  const next = { ...prev };
  delete next[key];
  return { ...currentData, garminActivityDateOverrides: next };
}

/**
 * Réinitialise logicalDate sur une session endurance.
 */
export function buildAggregateClearSessionLogicalDate(currentData, { sessionId, activityType }) {
  const endurance = currentData?.enduranceData || {};
  const sessions = { ...(endurance.sessions || {}) };
  const sid = String(sessionId);
  const types = [];
  if (activityType) types.push(activityType);
  Object.keys(sessions).forEach((key) => {
    if (!types.includes(key)) types.push(key);
  });

  const nextSessions = { ...sessions };
  types.forEach((type) => {
    const list = Array.isArray(nextSessions[type]) ? nextSessions[type] : [];
    let typeFound = false;
    const nextList = list.map((session) => {
      if (!sessionMatchesId(session, sid)) return session;
      typeFound = true;
      const { logicalDate: _removed, ...rest } = session;
      return rest;
    });
    if (typeFound) nextSessions[type] = nextList;
  });

  return {
    ...currentData,
    enduranceData: {
      ...endurance,
      sessions: nextSessions
    }
  };
}

/**
 * @param {object} session
 * @param {object} aggregate
 * @returns {{ recordedDate: string|null, logicalDate: string|null, isReassigned: boolean }}
 */
export function describeSessionCalendarDates(session, aggregate) {
  const overrides = readGarminActivityDateOverrides(aggregate);
  const recorded = normalizeDateString(session?.date);
  const logical =
    normalizeDateString(session?.logicalDate) ||
    (session?.garminId != null ? normalizeDateString(overrides[String(session.garminId)]?.logicalDate) : null) ||
    recorded;
  return {
    recordedDate: recorded,
    logicalDate: logical,
    isReassigned: Boolean(logical && recorded && logical !== recorded)
  };
}
