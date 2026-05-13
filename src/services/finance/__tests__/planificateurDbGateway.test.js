import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PLANIFICATEUR_DB_NAME,
  PLANIFICATEUR_DB_VERSION,
  PLANIFICATEUR_STORES,
  applyPlanificateurSchemaUpgrade,
} from '../planificateurDbGateway.js';
import logger from '../../../utils/logger.js';

describe('planificateurDbGateway', () => {
  const log = logger.module('planificateurDbGateway.test');

  beforeEach(async () => {
    indexedDB.deleteDatabase(PLANIFICATEUR_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyPlanificateurSchemaUpgrade crée les stores attendus', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(PLANIFICATEUR_DB_NAME, PLANIFICATEUR_DB_VERSION);
      req.onupgradeneeded = (e) => {
        applyPlanificateurSchemaUpgrade(e.target.result, e.oldVersion, e.newVersion, log);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(PLANIFICATEUR_STORES.SALAIRE)).toBe(true);
        expect(db.objectStoreNames.contains(PLANIFICATEUR_STORES.OBJECTIFS)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
