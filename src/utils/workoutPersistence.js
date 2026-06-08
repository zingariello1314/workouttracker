/**
 * Utilitaires de persistance sport (localStorage synchrone + clés legacy).
 * Le backup localStorage survit au F5 même si IndexedDB est lent ou indisponible.
 */

import { SESSION_MAP_FIELDS } from './workoutSessionPersistence.js';

export const getWorkoutStorageKey = (currentUser, isAdmin) => {
  if (isAdmin) return 'main';
  if (currentUser?.id) return `user-${currentUser.id}`;
  return 'anonymous';
};

export const getWorkoutBackupKey = (storageKey) => `workoutData_backup_${storageKey}`;

const LEGACY_BACKUP_KEYS = [
  'workoutData_backup',
  'workoutData_backup_main',
  'workoutData_backup_anonymous',
];

/** Timers de backup différé par storageKey (évite JSON.stringify synchrone sur gros blobs). */
const pendingBackupByKey = new Map();

/** Écriture synchrone — flush immédiat (fermeture onglet, après IndexedDB). */
export const backupWorkoutToLocalStorage = (storageKey, data) => {
  if (!storageKey || storageKey === 'anonymous' || !data) return;
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(getWorkoutBackupKey(storageKey), payload);
    localStorage.setItem('workoutData_backup', payload);
    localStorage.setItem(`workoutData_lastSaved_${storageKey}`, new Date().toISOString());
  } catch (e) {
    console.warn('[workoutPersistence] Backup localStorage échoué:', e);
  }
};

/**
 * Backup localStorage hors chemin critique UI (setTimeout 0).
 * Coalesce les appels rapprochés pour une même clé.
 */
export const scheduleBackupWorkoutToLocalStorage = (storageKey, data) => {
  if (!storageKey || storageKey === 'anonymous' || !data) return;
  const prev = pendingBackupByKey.get(storageKey);
  if (prev?.timerId != null) clearTimeout(prev.timerId);
  const timerId = setTimeout(() => {
    pendingBackupByKey.delete(storageKey);
    backupWorkoutToLocalStorage(storageKey, data);
  }, 0);
  pendingBackupByKey.set(storageKey, { data, timerId });
};

/** Backup léger d’un seul jour de séance (Phase 2). */
export const backupSessionDayToLocalStorage = (storageKey, dateStr, slice) => {
  if (!storageKey || storageKey === 'anonymous' || !dateStr || !slice) return;
  try {
    const key = `workoutSession_backup_${storageKey}_${dateStr}`;
    localStorage.setItem(key, JSON.stringify({ ...slice, lastSaved: new Date().toISOString() }));
    localStorage.setItem(`workoutData_lastSaved_${storageKey}`, new Date().toISOString());
  } catch (e) {
    console.warn('[workoutPersistence] Backup session jour échoué:', e);
  }
};

/** Force l’écriture des backups différés (pagehide / avant saveToDB critique). */
export const flushPendingWorkoutBackup = (storageKey) => {
  const pending = pendingBackupByKey.get(storageKey);
  if (!pending) return;
  if (pending.timerId != null) clearTimeout(pending.timerId);
  pendingBackupByKey.delete(storageKey);
  backupWorkoutToLocalStorage(storageKey, pending.data);
};

const SESSION_BACKUP_PREFIX = 'workoutSession_backup_';

/** Toutes les sauvegardes journalières en localStorage pour un utilisateur. */
export const loadSessionDayBackupsFromLocalStorage = (storageKey) => {
  if (!storageKey || storageKey === 'anonymous' || typeof localStorage === 'undefined') {
    return [];
  }
  const prefix = `${SESSION_BACKUP_PREFIX}${storageKey}_`;
  const rows = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') continue;
      rows.push({
        dateStr: key.slice(prefix.length),
        mapFields: parsed.mapFields || {},
        dailyVariations: parsed.dailyVariations || null,
        circuitProgress: parsed.circuitProgress || null,
        lastSaved: parsed.lastSaved || null,
      });
    } catch {
      // ignorer entrée corrompue
    }
  }
  return rows;
};

/** Lecture avec repli sur anciennes clés. */
export const loadWorkoutFromLocalStorage = (storageKey) => {
  const keys = [
    getWorkoutBackupKey(storageKey),
    ...LEGACY_BACKUP_KEYS,
    storageKey !== 'main' ? getWorkoutBackupKey('main') : null,
  ].filter(Boolean);

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const hasContent =
          Object.keys(parsed.checkedExercises || {}).length > 0 ||
          Object.keys(parsed.reps || {}).length > 0 ||
          Object.keys(parsed.checkedStretches || {}).length > 0;
        if (hasContent || key === getWorkoutBackupKey(storageKey)) {
          return parsed;
        }
      }
    } catch {
      // essayer clé suivante
    }
  }
  return null;
};

/** Horodatage du dernier backup localStorage pour un utilisateur. */
export const getWorkoutLastSavedFromLocalStorage = (storageKey) => {
  if (!storageKey || storageKey === 'anonymous' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(`workoutData_lastSaved_${storageKey}`) || null;
  } catch {
    return null;
  }
};

/**
 * Fusionne les maps de séance du backup localStorage par-dessus l’état IDB/cloud.
 * Garantit que reps, kg et étirements saisis survivent au F5 même si IndexedDB a échoué.
 *
 * @param {Record<string, unknown> | null} idbState
 * @param {Record<string, unknown> | null} lsState
 * @param {string} [storageKey]
 */
export function mergeLocalBackupSessionMaps(idbState, lsState, storageKey = null) {
  if (!lsState || typeof lsState !== 'object') return idbState;
  if (!idbState || typeof idbState !== 'object') return { ...lsState };

  const out = { ...idbState };
  for (const field of SESSION_MAP_FIELDS) {
    const idbMap = idbState[field] && typeof idbState[field] === 'object' ? idbState[field] : {};
    const lsMap = lsState[field] && typeof lsState[field] === 'object' ? lsState[field] : {};
    out[field] = { ...idbMap, ...lsMap };
  }
  if (lsState.dailyVariations && typeof lsState.dailyVariations === 'object') {
    out.dailyVariations = {
      ...(idbState.dailyVariations && typeof idbState.dailyVariations === 'object'
        ? idbState.dailyVariations
        : {}),
      ...lsState.dailyVariations,
    };
  }
  if (lsState.circuitProgress && typeof lsState.circuitProgress === 'object') {
    out.circuitProgress = {
      ...(idbState.circuitProgress && typeof idbState.circuitProgress === 'object'
        ? idbState.circuitProgress
        : {}),
      ...lsState.circuitProgress,
    };
  }
  const lsLast =
    lsState.lastSaved || (storageKey ? getWorkoutLastSavedFromLocalStorage(storageKey) : null) || '';
  const idbLast = String(idbState.lastSaved || '');
  if (lsLast && lsLast >= idbLast) {
    out.lastSaved = lsLast;
  }
  return out;
}

/** Sessions / défis / pas manuels Garmin (backfill Défis) comptent comme données sport persistées. */
export const hasEnduranceContent = (enduranceData) => {
  if (!enduranceData || typeof enduranceData !== 'object') return false;
  const sessions = enduranceData.sessions;
  if (sessions && typeof sessions === 'object') {
    for (const arr of Object.values(sessions)) {
      if (Array.isArray(arr) && arr.length > 0) return true;
    }
  }
  if (Array.isArray(enduranceData.challenges) && enduranceData.challenges.length > 0) {
    return true;
  }
  const manual = enduranceData.manualDailyWalkByDate;
  if (manual && typeof manual === 'object' && Object.keys(manual).length > 0) {
    return true;
  }
  return false;
};

export const hasWorkoutContent = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (
    Object.keys(data.checkedExercises || {}).length > 0 ||
    Object.keys(data.reps || {}).length > 0 ||
    Object.keys(data.checkedStretches || {}).length > 0
  ) {
    return true;
  }
  if (hasEnduranceContent(data.enduranceData)) return true;
  if (data.circuitProgress && typeof data.circuitProgress === 'object') {
    if (Object.keys(data.circuitProgress).length > 0) return true;
  }
  if (data.circuitDefinitions && typeof data.circuitDefinitions === 'object') {
    if (Object.keys(data.circuitDefinitions).length > 0) return true;
  }
  if (Array.isArray(data.exerciseMaxRecords) && data.exerciseMaxRecords.length > 0) return true;
  if (Array.isArray(data.exerciseMaxHistory) && data.exerciseMaxHistory.length > 0) return true;
  if (Array.isArray(data.pyramidSessionLog) && data.pyramidSessionLog.length > 0) return true;
  return false;
};
