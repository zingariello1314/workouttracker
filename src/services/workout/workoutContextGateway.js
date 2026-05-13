/**
 * Passerelle WorkoutTrackerContextDB / `contextData` (programmes, actif, etc.).
 *
 * @module services/workout/workoutContextGateway
 */

const DB_NAME = 'WorkoutTrackerContextDB';
const DB_VERSION = 1;
const STORE = 'contextData';

export const contextRecordId = (scopeKey) => `context:${scopeKey}`;

export const openWorkoutContextDb = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Base de données bloquée'));
  });

/**
 * @param {string} scopeKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getContextRow(scopeKey) {
  const db = await openWorkoutContextDb().catch(() => null);
  if (!db) return null;
  const id = contextRecordId(scopeKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Ligne historique sans scope (`id === 'context'`), avant `context:${scopeKey}`. */
export async function getLegacyUnscopedContext() {
  const db = await openWorkoutContextDb().catch(() => null);
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], 'readonly');
    const req = tx.objectStore(STORE).get('context');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {string} scopeKey
 * @param {Record<string, unknown>} snapshot — champs programmes / activeProgram / etc.
 */
export async function putContextRow(scopeKey, snapshot) {
  const db = await openWorkoutContextDb().catch(() => null);
  if (!db) throw new Error('WORKOUT_CONTEXT_DB_UNAVAILABLE');
  const id = contextRecordId(scopeKey);
  const payload = {
    ...snapshot,
    id,
    lastSaved: new Date().toISOString()
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], 'readwrite');
    const req = tx.objectStore(STORE).put(payload);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
