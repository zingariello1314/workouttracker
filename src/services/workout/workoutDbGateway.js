/**
 * Passerelle IndexedDB WorkoutTrackerDB / store `workouts` — hors hooks React.
 * Aligné sur l’ouverture minimale de `useWorkoutData` (lecture/écriture brute par `id` = scopeKey).
 *
 * @module services/workout/workoutDbGateway
 */

export const WORKOUT_TRACKER_DB_NAME = 'WorkoutTrackerDB';
export const WORKOUT_STORE_NAME = 'workouts';

/**
 * Store principal `workouts` (scope utilisateur / admin).
 * @param {IDBDatabase} db
 */
export function applyWorkoutTrackerWorkoutsStoreUpgrade(db) {
  if (!db.objectStoreNames.contains(WORKOUT_STORE_NAME)) {
    const workoutStore = db.createObjectStore(WORKOUT_STORE_NAME, { keyPath: 'id' });
    try {
      workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
    } catch {
      // ignore
    }
  }
}

export const openWorkoutTrackerDb = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(WORKOUT_TRACKER_DB_NAME);
    request.onupgradeneeded = (event) => {
      applyWorkoutTrackerWorkoutsStoreUpgrade(event.target.result);
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (event) => {
      if (event.target.error?.name === 'VersionError') {
        const del = indexedDB.deleteDatabase(WORKOUT_TRACKER_DB_NAME);
        del.onsuccess = () => {
          const nr = indexedDB.open(WORKOUT_TRACKER_DB_NAME, 1);
          nr.onsuccess = (ev) => resolve(ev.target.result);
          nr.onerror = () => resolve(null);
          nr.onupgradeneeded = (ev) => {
            applyWorkoutTrackerWorkoutsStoreUpgrade(ev.target.result);
          };
        };
        del.onerror = () => resolve(null);
      } else {
        resolve(null);
      }
    };
  });

/**
 * @param {string} scopeKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getWorkoutRow(scopeKey) {
  const db = await openWorkoutTrackerDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction([WORKOUT_STORE_NAME], 'readonly');
    const req = tx.objectStore(WORKOUT_STORE_NAME).get(scopeKey);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remplace l’enregistrement workouts pour cette clé (merge métier à faire en amont).
 *
 * @param {string} scopeKey
 * @param {Record<string, unknown>} row — doit contenir les champs attendus par l’app ; `id` sera forcé.
 */
export async function putWorkoutRow(scopeKey, row) {
  const db = await openWorkoutTrackerDb();
  if (!db) {
    throw new Error('WORKOUT_DB_UNAVAILABLE');
  }
  const payload = { ...row, id: scopeKey };
  return new Promise((resolve, reject) => {
    const tx = db.transaction([WORKOUT_STORE_NAME], 'readwrite');
    const req = tx.objectStore(WORKOUT_STORE_NAME).put(payload);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
