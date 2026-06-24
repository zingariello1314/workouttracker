/**
 * Persistance incrémentale des séances par jour (Phase 2).
 * Les maps `YYYY-MM-DD_*` sont stockées dans le store `workoutSessions` ;
 * le store `workouts` conserve le métadonnées lourd (photos, endurance, etc.).
 */

/** Champs dont les clés sont préfixées par la date du jour. */
export const SESSION_MAP_FIELDS = [
  'checkedExercises',
  'reps',
  'exerciseWeights',
  'exerciseWeightPerArm',
  'exerciseSetWeights',
  'exerciseSetLogs',
  'checkedStretches',
  'exerciseSessionEffortStars',
  'exerciseSessionPleasureStars',
  'exerciseSessionPerceived',
  'stretchSessionEffortStars',
];

const DATE_KEY_RE = /^(\d{4}-\d{2}-\d{2})_/;

/** @param {string} key */
export function dateStrFromSessionKey(key) {
  const m = String(key || '').match(DATE_KEY_RE);
  return m ? m[1] : null;
}

/**
 * Extrait les entrées d’un jour depuis l’agrégat en mémoire.
 * @param {Record<string, unknown>} data
 * @param {string} dateStr
 */
export function extractDaySliceFromAggregate(data, dateStr) {
  if (!data || typeof data !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { mapFields: {}, dailyVariations: null, circuitProgress: null };
  }
  const prefix = `${dateStr}_`;

  const mapFields = {};
  for (const field of SESSION_MAP_FIELDS) {
    const src = data[field];
    if (!src || typeof src !== 'object' || Array.isArray(src)) continue;
    const dayMap = {};
    for (const [k, v] of Object.entries(src)) {
      if (k.startsWith(prefix)) {
        dayMap[k] = v;
      }
    }
    if (Object.keys(dayMap).length > 0) {
      mapFields[field] = dayMap;
    }
  }

  const dailyVariations =
    data.dailyVariations?.[dateStr] != null
      ? { [dateStr]: data.dailyVariations[dateStr] }
      : null;

  const circuitProgress =
    data.circuitProgress?.[dateStr] != null
      ? { [dateStr]: data.circuitProgress[dateStr] }
      : null;

  return { mapFields, dailyVariations, circuitProgress };
}

/**
 * Fusionne les lignes `workoutSessions` dans l’état agrégat (chargement).
 * @param {Record<string, unknown>} base
 * @param {Array<Record<string, unknown>>} sessionRows
 */
export function mergeSessionDaysIntoAggregate(base, sessionRows) {
  const out = { ...(base || {}) };

  for (const field of SESSION_MAP_FIELDS) {
    if (!out[field] || typeof out[field] !== 'object') {
      out[field] = {};
    }
  }
  if (!out.dailyVariations || typeof out.dailyVariations !== 'object') {
    out.dailyVariations = {};
  }
  if (!out.circuitProgress || typeof out.circuitProgress !== 'object') {
    out.circuitProgress = {};
  }

  const sorted = [...(sessionRows || [])].sort((a, b) => {
    const ta = String(a.lastSaved || '');
    const tb = String(b.lastSaved || '');
    return ta.localeCompare(tb);
  });

  for (const row of sorted) {
    const maps = row.mapFields && typeof row.mapFields === 'object' ? row.mapFields : {};
    for (const [field, map] of Object.entries(maps)) {
      if (!SESSION_MAP_FIELDS.includes(field) || !map || typeof map !== 'object') continue;
      out[field] = { ...(out[field] || {}), ...map };
    }
    if (row.dailyVariations && typeof row.dailyVariations === 'object') {
      out.dailyVariations = { ...out.dailyVariations, ...row.dailyVariations };
    }
    if (row.circuitProgress && typeof row.circuitProgress === 'object') {
      out.circuitProgress = { ...out.circuitProgress, ...row.circuitProgress };
    }
  }

  return out;
}

/**
 * Retire les maps de séance de l’agrégat (ligne `workouts` allégée).
 * @param {Record<string, unknown>} data
 */
export function stripSessionMapsFromAggregate(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  for (const field of SESSION_MAP_FIELDS) {
    out[field] = {};
  }
  out.sessionStorageVersion = 1;
  return out;
}

/** Champs hors séance (restent dans `workouts`). */
export const WORKOUT_METADATA_FIELDS = [
  'startDate',
  'weekVariant',
  'progressPhotos',
  'progressEntries',
  'bodyTrackingReminders',
  'bodyTrackingLastUpdated',
  'sessionFeedbacks',
  'dailyVariationsVersion',
  'dayJustifications',
  'dayJustificationsVersion',
  'exerciseIntensityCoeffs',
  'exercisePerceivedRatings',
  'exercisePersonalNotes',
  'stretchPerceivedRatings',
  'stretchPersonalNotes',
  'exerciseMaxRecords',
  'exerciseMaxHistory',
  'performanceRetestPlans',
  'pyramidSessionLog',
  'addictionQuitData',
  'circuitDefinitions',
  'circuitDefinitionsVersion',
  'trainingPrefs',
  'restDaySwaps',
  'enduranceData',
  'dataVersion',
  'sessionStorageVersion',
];

/**
 * @param {Record<string, unknown>} data
 */
export function pickWorkoutMetadataFromAggregate(data) {
  if (!data || typeof data !== 'object') return {};
  const meta = {};
  for (const key of WORKOUT_METADATA_FIELDS) {
    if (data[key] !== undefined) {
      meta[key] = data[key];
    }
  }
  meta.lastSaved = new Date().toISOString();
  meta.dataVersion = data.dataVersion || '1.0';
  meta.sessionStorageVersion = 1;
  return meta;
}

/**
 * Empreinte métadonnées (hors maps de séance) pour éviter un put `workouts` inutile.
 * @param {Record<string, unknown>} data
 */
export function workoutMetadataFingerprint(data) {
  const meta = pickWorkoutMetadataFromAggregate(data || {});
  delete meta.lastSaved;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(Date.now());
  }
}

/**
 * Liste les dates distinctes présentes dans les maps legacy de l’agrégat.
 * @param {Record<string, unknown>} row
 * @returns {string[]}
 */
/**
 * Remplace dans `flat` toutes les clés d’un jour par celles de `fullData` (repli si store session absent).
 * @param {Record<string, unknown>} flat
 * @param {Record<string, unknown>} fullData
 * @param {string} sessionDay
 */
export function applyDayKeysToWorkoutRow(flat, fullData, sessionDay) {
  if (!flat || typeof flat !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDay)) {
    return flat;
  }
  const prefix = `${sessionDay}_`;
  const out = { ...flat };

  for (const field of SESSION_MAP_FIELDS) {
    const src = fullData?.[field];
    const next = { ...(out[field] && typeof out[field] === 'object' ? out[field] : {}) };
    for (const k of Object.keys(next)) {
      if (k.startsWith(prefix)) delete next[k];
    }
    if (src && typeof src === 'object') {
      for (const [k, v] of Object.entries(src)) {
        if (k.startsWith(prefix)) next[k] = v;
      }
    }
    out[field] = next;
  }

  const dv = { ...(out.dailyVariations && typeof out.dailyVariations === 'object' ? out.dailyVariations : {}) };
  if (fullData?.dailyVariations?.[sessionDay] != null) {
    dv[sessionDay] = fullData.dailyVariations[sessionDay];
  } else {
    delete dv[sessionDay];
  }
  out.dailyVariations = dv;

  const cp = { ...(out.circuitProgress && typeof out.circuitProgress === 'object' ? out.circuitProgress : {}) };
  if (fullData?.circuitProgress?.[sessionDay] != null) {
    cp[sessionDay] = fullData.circuitProgress[sessionDay];
  } else {
    delete cp[sessionDay];
  }
  out.circuitProgress = cp;

  out.lastSaved = new Date().toISOString();
  return out;
}

export function listLegacySessionDatesInAggregate(row) {
  const dates = new Set();
  if (!row || typeof row !== 'object') return [];
  for (const field of SESSION_MAP_FIELDS) {
    const map = row[field];
    if (!map || typeof map !== 'object') continue;
    for (const key of Object.keys(map)) {
      const d = dateStrFromSessionKey(key);
      if (d) dates.add(d);
    }
  }
  if (row.dailyVariations && typeof row.dailyVariations === 'object') {
    for (const d of Object.keys(row.dailyVariations)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    }
  }
  if (row.circuitProgress && typeof row.circuitProgress === 'object') {
    for (const d of Object.keys(row.circuitProgress)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d);
    }
  }
  return [...dates].sort();
}
