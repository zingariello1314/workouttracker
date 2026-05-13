import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { XP_DB_NAME } from '../../xp/xpDbGateway.js';
import { STORE_SIDEBAR_PREFERENCES, applySidebarPreferencesSchemaUpgrade } from '../sidebarDbGateway.js';

describe('sidebarDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(XP_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée sidebarPreferences sur QuietQuestDB', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(XP_DB_NAME, 1);
      req.onupgradeneeded = (e) => applySidebarPreferencesSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_SIDEBAR_PREFERENCES)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
