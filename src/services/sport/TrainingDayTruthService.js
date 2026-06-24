/**
 * Vérité « jour d'entraînement » — date logique des séances.
 */

import {
  resolveSessionCalendarDate,
  resolveGarminActivityCalendarDate,
  readGarminActivityDateOverrides
} from '../../utils/sessionCalendarDate';

export { resolveSessionCalendarDate, resolveGarminActivityCalendarDate, readGarminActivityDateOverrides };

/**
 * Filtre les sessions dont la date calendrier logique correspond au jour.
 * @param {object[]} sessions
 * @param {string} dateStr — YYYY-MM-DD
 * @param {Record<string, { logicalDate?: string }>} [overrides]
 */
export function filterSessionsOnCalendarDate(sessions, dateStr, overrides = {}) {
  if (!Array.isArray(sessions) || !dateStr) return [];
  return sessions.filter((session) => resolveSessionCalendarDate(session, overrides) === dateStr);
}

/**
 * @param {object | null | undefined} aggregate — workout / endurance agrégat
 * @param {object} session
 * @returns {string | null}
 */
export function resolveSessionDateFromAggregate(aggregate, session) {
  const overrides = readGarminActivityDateOverrides(aggregate);
  return resolveSessionCalendarDate(session, overrides);
}

/**
 * Date YYYY-MM-DD calendrier pour une session endurance (logique si réaffectée).
 * @param {object} session
 * @param {object|null|undefined} aggregate
 * @returns {string|null}
 */
export function enduranceSessionCalendarYmd(session, aggregate = null) {
  const logical = resolveSessionDateFromAggregate(aggregate, session);
  if (logical) return logical;
  const raw = session?.date;
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Aplatit les sessions endurance avec `calendarDate` (date logique).
 * @param {Record<string, object[]>} sessionsMap
 * @param {object|null|undefined} aggregate
 */
export function flattenEnduranceSessionsWithCalendarDate(sessionsMap, aggregate = null) {
  if (!sessionsMap || typeof sessionsMap !== 'object') return [];
  return Object.entries(sessionsMap).flatMap(([activityType, list]) => {
    if (!Array.isArray(list)) return [];
    return list.map((session) => ({
      ...session,
      activityType,
      calendarDate: enduranceSessionCalendarYmd(session, aggregate)
    }));
  });
}
