import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  openApprentissageDB,
  APPRENTISSAGE_TRACKER_DB_NAME,
  STORE_APPRENTISSAGE_SUBJECTS,
  STORE_APPRENTISSAGE_PROGRESSION,
  STORE_APPRENTISSAGE_SESSIONS_HISTORY,
  STORE_APPRENTISSAGE_PLANNER,
  STORE_APPRENTISSAGE_TIMER,
} from '../apprentissageDbGateway.js';

describe('apprentissageDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(APPRENTISSAGE_TRACKER_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée les 5 stores Apprentissage sur WorkoutTrackerDB', async () => {
    const db = await openApprentissageDB();
    expect(db).toBeTruthy();
    expect(db.objectStoreNames.contains(STORE_APPRENTISSAGE_SUBJECTS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_APPRENTISSAGE_PROGRESSION)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_APPRENTISSAGE_SESSIONS_HISTORY)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_APPRENTISSAGE_PLANNER)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_APPRENTISSAGE_TIMER)).toBe(true);
    db.close();
  });
});
