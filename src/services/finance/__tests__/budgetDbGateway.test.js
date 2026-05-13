import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BUDGET_DB_NAME,
  BUDGET_DB_VERSION,
  BUDGET_STORES,
  applyBudgetSchemaUpgrade,
} from '../budgetDbGateway.js';
import logger from '../../../utils/logger.js';

describe('budgetDbGateway', () => {
  const log = logger.module('budgetDbGateway.test');

  beforeEach(async () => {
    indexedDB.deleteDatabase(BUDGET_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyBudgetSchemaUpgrade crée les stores attendus', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(BUDGET_DB_NAME, BUDGET_DB_VERSION);
      req.onupgradeneeded = (e) => {
        applyBudgetSchemaUpgrade(e.target.result, e.oldVersion, e.newVersion, log);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(BUDGET_STORES.BUDGET)).toBe(true);
        expect(db.objectStoreNames.contains(BUDGET_STORES.CATEGORIES)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
