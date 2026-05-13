/**
 * Store cache pagination photos (dans WorkoutTrackerDB).
 *
 * @module services/workout/photoPaginationCacheDbGateway
 */

import { WORKOUT_TRACKER_DB_NAME } from './workoutDbGateway.js';

export { WORKOUT_TRACKER_DB_NAME as PHOTO_PAGINATION_CACHE_DB_NAME };

export const PHOTO_PAGINATION_CACHE_STORE = 'photoPaginationCache';

/**
 * @param {IDBDatabase} db
 * @param {IDBVersionChangeEvent} [event] — pour ajouter index sur store existant
 * @param {{ debug?: (...args: unknown[]) => void, error?: (...args: unknown[]) => void }} [log]
 */
export function applyPhotoPaginationCacheStoreUpgrade(db, event, log) {
  const dbg = log?.debug ?? (() => {});
  const err = log?.error ?? (() => {});

  if (!db.objectStoreNames.contains(PHOTO_PAGINATION_CACHE_STORE)) {
    dbg(`Création objectStore "${PHOTO_PAGINATION_CACHE_STORE}"`);
    const store = db.createObjectStore(PHOTO_PAGINATION_CACHE_STORE, { keyPath: 'key' });
    store.createIndex('accessTime', 'accessTime', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    dbg(`✅ ObjectStore "${PHOTO_PAGINATION_CACHE_STORE}" créé avec index`);
    return;
  }

  if (event?.target?.transaction) {
    try {
      const store = event.target.transaction.objectStore(PHOTO_PAGINATION_CACHE_STORE);
      const indexNames = store.indexNames;
      if (!indexNames.contains('accessTime')) {
        dbg('Création index "accessTime" manquant');
        store.createIndex('accessTime', 'accessTime', { unique: false });
      }
      if (!indexNames.contains('timestamp')) {
        dbg('Création index "timestamp" manquant');
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    } catch (e) {
      err('Erreur vérification index', e);
    }
  }
}
