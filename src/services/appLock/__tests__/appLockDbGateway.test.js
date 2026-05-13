import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  STORE_APP_LOCK_BY_USER,
  applyAppLockSchemaUpgrade,
} from '../appLockDbGateway.js';

describe('appLockDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyAppLockSchemaUpgrade crée appLockByUser', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        try {
          applyAppLockSchemaUpgrade(e);
        } catch (err) {
          reject(err);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_APP_LOCK_BY_USER)).toBe(true);
        const s = db
          .transaction([STORE_APP_LOCK_BY_USER], 'readonly')
          .objectStore(STORE_APP_LOCK_BY_USER);
        expect(s.keyPath).toBe('userId');
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
