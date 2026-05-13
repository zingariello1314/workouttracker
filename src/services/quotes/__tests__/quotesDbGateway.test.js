import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  STORE_QUOTES,
  STORE_SETTINGS,
  applyQuotesSchemaUpgrade,
} from '../quotesDbGateway.js';

describe('quotesDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyQuotesSchemaUpgrade crée quotes et settings', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        try {
          applyQuotesSchemaUpgrade(e, { info: () => {} });
        } catch (err) {
          reject(err);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_QUOTES)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_SETTINGS)).toBe(true);
        const q = db.transaction([STORE_QUOTES], 'readonly').objectStore(STORE_QUOTES);
        expect(Array.from(q.indexNames).sort()).toEqual(
          ['createdAt', 'isPinned', 'order'].sort()
        );
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
