import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  STORE_ACTIVITIES,
  STORE_AUTO_SYNC_HISTORY,
  applyGarminSchemaUpgrade,
} from '../garminDbGateway.js';
import logger from '../../../utils/logger.js';

describe('garminDbGateway', () => {
  const log = logger.module('garminDbGateway.test');

  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyGarminSchemaUpgrade crée les stores attendus', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        try {
          applyGarminSchemaUpgrade(e, log);
        } catch (err) {
          reject(err);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_ACTIVITIES)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_AUTO_SYNC_HISTORY)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
