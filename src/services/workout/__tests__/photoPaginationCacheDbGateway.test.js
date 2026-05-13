import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { WORKOUT_TRACKER_DB_NAME, applyWorkoutTrackerWorkoutsStoreUpgrade } from '../workoutDbGateway.js';
import {
  PHOTO_PAGINATION_CACHE_STORE,
  applyPhotoPaginationCacheStoreUpgrade,
} from '../photoPaginationCacheDbGateway.js';

describe('photoPaginationCacheDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(WORKOUT_TRACKER_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée le store photoPaginationCache avec index', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(WORKOUT_TRACKER_DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        applyWorkoutTrackerWorkoutsStoreUpgrade(db);
        applyPhotoPaginationCacheStoreUpgrade(db, e);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(PHOTO_PAGINATION_CACHE_STORE)).toBe(true);
        const tx = db.transaction([PHOTO_PAGINATION_CACHE_STORE], 'readonly');
        const store = tx.objectStore(PHOTO_PAGINATION_CACHE_STORE);
        expect(store.indexNames.contains('accessTime')).toBe(true);
        expect(store.indexNames.contains('timestamp')).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
