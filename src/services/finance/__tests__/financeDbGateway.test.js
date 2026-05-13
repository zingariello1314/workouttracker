import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FINANCE_DB_NAME,
  FINANCE_DB_VERSION,
  FINANCE_STORES,
  applyFinanceSchemaUpgrade,
} from '../financeDbGateway.js';

describe('financeDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(FINANCE_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyFinanceSchemaUpgrade crée tous les stores FinanceDB v2', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(FINANCE_DB_NAME, FINANCE_DB_VERSION);
      req.onupgradeneeded = (e) => {
        try {
          applyFinanceSchemaUpgrade(e.target.result, e.oldVersion, e.newVersion ?? FINANCE_DB_VERSION, {
            info: () => {},
          });
        } catch (err) {
          reject(err);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        Object.values(FINANCE_STORES).forEach((name) => {
          expect(db.objectStoreNames.contains(name)).toBe(true);
        });
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
