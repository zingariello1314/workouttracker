import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  openQuietQuestDB,
  QUIET_QUEST_TRACKER_DB_NAME,
  STORE_QUIETQUEST_QUESTS,
  STORE_QUIETQUEST_VALIDATIONS,
  STORE_QUIETQUEST_USER_DATA,
  STORE_QUIETQUEST_DAILY_PERFORMANCES,
  STORE_QUIETQUEST_APP_STATE,
} from '../quietQuestDbGateway.js';

describe('quietQuestDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(QUIET_QUEST_TRACKER_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée les 5 stores QuietQuest sur WorkoutTrackerDB', async () => {
    const db = await openQuietQuestDB();
    expect(db).toBeTruthy();
    expect(db.objectStoreNames.contains(STORE_QUIETQUEST_QUESTS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_QUIETQUEST_VALIDATIONS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_QUIETQUEST_USER_DATA)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_QUIETQUEST_DAILY_PERFORMANCES)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_QUIETQUEST_APP_STATE)).toBe(true);
    db.close();
  });
});
