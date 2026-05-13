import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DB_NAME,
  DB_VERSION_NUTRITION,
  STORE_DAILY_MEALS,
  STORE_OFFLINE_QUEUE,
  handleNutritionUpgrade,
} from '../nutritionDbGateway.js';

describe('nutritionDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('handleNutritionUpgrade crée les stores nutrition', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION_NUTRITION);
      req.onupgradeneeded = (e) => {
        try {
          handleNutritionUpgrade(e);
        } catch (err) {
          reject(err);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_DAILY_MEALS)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
