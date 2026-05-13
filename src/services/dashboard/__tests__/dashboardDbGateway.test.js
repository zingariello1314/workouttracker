import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DASHBOARD_DB_NAME,
  DASHBOARD_DB_VERSION,
  DASHBOARD_STORES,
  applyDashboardSchemaUpgrade,
} from '../dashboardDbGateway.js';

describe('dashboardDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DASHBOARD_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée tous les stores dashboard', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DASHBOARD_DB_NAME, DASHBOARD_DB_VERSION);
      req.onupgradeneeded = (e) => applyDashboardSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        Object.values(DASHBOARD_STORES).forEach((name) => {
          expect(db.objectStoreNames.contains(name)).toBe(true);
        });
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
