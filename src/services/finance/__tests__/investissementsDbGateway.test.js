import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  INVESTISSEMENTS_DB_NAME,
  INVESTISSEMENTS_DB_VERSION,
  INVESTISSEMENTS_STORES,
  applyInvestissementsSchemaUpgrade,
} from '../investissementsDbGateway.js';
import logger from '../../../utils/logger.js';

describe('investissementsDbGateway', () => {
  const log = logger.module('investissementsDbGateway.test');

  beforeEach(async () => {
    indexedDB.deleteDatabase(INVESTISSEMENTS_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyInvestissementsSchemaUpgrade crée les stores attendus', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(INVESTISSEMENTS_DB_NAME, INVESTISSEMENTS_DB_VERSION);
      req.onupgradeneeded = (e) => {
        applyInvestissementsSchemaUpgrade(e.target.result, e.oldVersion, e.newVersion, log);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(INVESTISSEMENTS_STORES.OR)).toBe(true);
        expect(db.objectStoreNames.contains(INVESTISSEMENTS_STORES.LIQUIDITES)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
