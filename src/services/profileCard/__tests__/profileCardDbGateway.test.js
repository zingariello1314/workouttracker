import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROFILE_CARD_DB_NAME,
  PROFILE_CARD_DB_VERSION,
  STORE_PROFILE_CARDS,
  applyProfileCardSchemaUpgrade,
} from '../profileCardDbGateway.js';

describe('profileCardDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(PROFILE_CARD_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée profileCards avec index', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(PROFILE_CARD_DB_NAME, PROFILE_CARD_DB_VERSION);
      req.onupgradeneeded = (e) => applyProfileCardSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        const s = db.transaction([STORE_PROFILE_CARDS], 'readonly').objectStore(STORE_PROFILE_CARDS);
        expect(s.keyPath).toBe('username');
        expect(Array.from(s.indexNames).sort()).toEqual(['lastModified', 'username'].sort());
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
