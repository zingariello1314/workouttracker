/**
 * Date calendrier logique vs date enregistrée (capteur / import).
 * Toute fonctionnalité orientée utilisateur doit passer par ces résolveurs.
 */

import { normalizeDateString } from './calendarUtils';

/**
 * @param {Record<string, { logicalDate?: string }>} overrides
 * @param {string | number | null | undefined} garminId
 * @returns {string | null}
 */
function lookupOverrideLogicalDate(overrides, garminId) {
  if (garminId == null || !overrides || typeof overrides !== 'object') return null;
  const ov = overrides[String(garminId)];
  if (!ov?.logicalDate) return null;
  return normalizeDateString(ov.logicalDate);
}

/**
 * Date calendrier d'une session endurance importée / Garmin.
 * @param {object | null | undefined} session
 * @param {Record<string, { logicalDate?: string }>} [overrides] — garminActivityDateOverrides
 * @returns {string | null}
 */
export function resolveSessionCalendarDate(session, overrides = {}) {
  if (!session || typeof session !== 'object') return null;

  if (session.logicalDate) {
    const logical = normalizeDateString(session.logicalDate);
    if (logical) return logical;
  }

  const gid = session.garminId ?? session.id;
  const fromOverride = lookupOverrideLogicalDate(overrides, gid);
  if (fromOverride) return fromOverride;

  return normalizeDateString(session.date);
}

/**
 * Date calendrier d'une activité Garmin brute (IDB).
 * @param {object | null | undefined} activity
 * @param {Record<string, { logicalDate?: string }>} [overrides]
 * @returns {string | null}
 */
export function resolveGarminActivityCalendarDate(activity, overrides = {}) {
  if (!activity || typeof activity !== 'object') return null;

  const gid = activity.garminId ?? activity.id;
  const fromOverride = lookupOverrideLogicalDate(overrides, gid);
  if (fromOverride) return fromOverride;

  return normalizeDateString(activity.date || activity.startTimeLocal);
}

/**
 * Lit les overrides depuis l'agrégat workout / endurance.
 * @param {object | null | undefined} aggregate
 * @returns {Record<string, { logicalDate?: string }>}
 */
export function readGarminActivityDateOverrides(aggregate) {
  const raw =
    aggregate?.garminActivityDateOverrides ??
    aggregate?.enduranceData?.garminActivityDateOverrides ??
    {};
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

/**
 * Accepte un agrégat workout ou un objet overrides brut.
 * @param {object | null | undefined} source
 */
export function coerceGarminDateOverrides(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  if (
    Object.prototype.hasOwnProperty.call(source, 'garminActivityDateOverrides') ||
    Object.prototype.hasOwnProperty.call(source, 'enduranceData')
  ) {
    return readGarminActivityDateOverrides(source);
  }
  return source;
}
