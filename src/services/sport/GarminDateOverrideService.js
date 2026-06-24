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

/**
 * Réaffecte une session endurance (course, etc.) via logicalDate sur la session.
 * @param {object} currentData
 * @param {{ sessionId: string|number, activityType: string, logicalDate: string }} params
 */
export function buildAggregateWithSessionLogicalDate(currentData, { sessionId, activityType, logicalDate }) {
  const logical = normalizeDateString(logicalDate);
  if (!logical || sessionId == null || !activityType) {
    throw new Error('[GarminDateOverrideService] sessionId, activityType et logicalDate requis');
  }

  const endurance = currentData?.enduranceData || {};
  const sessions = { ...(endurance.sessions || {}) };
  const list = Array.isArray(sessions[activityType]) ? [...sessions[activityType]] : [];
  const sid = String(sessionId);
  let found = false;

  const nextList = list.map((session) => {
    if (String(session?.id) !== sid && String(session?.garminId) !== sid) return session;
    found = true;
    return { ...session, logicalDate: logical };
  });

  if (!found) {
    throw new Error('[GarminDateOverrideService] session introuvable');
  }

  return {
    ...currentData,
    enduranceData: {
      ...endurance,
      sessions: {
        ...sessions,
        [activityType]: nextList
      }
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
  const list = Array.isArray(sessions[activityType]) ? [...sessions[activityType]] : [];
  const sid = String(sessionId);

  const nextList = list.map((session) => {
    if (String(session?.id) !== sid && String(session?.garminId) !== sid) return session;
    const { logicalDate: _removed, ...rest } = session;
    return rest;
  });

  return {
    ...currentData,
    enduranceData: {
      ...endurance,
      sessions: {
        ...sessions,
        [activityType]: nextList
      }
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
