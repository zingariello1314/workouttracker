import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  SECURITY_DB_NAME,
  SECURITY_DB_VERSION,
  STORE_AUTH_AUDIT_TRAIL,
  applySecurityAuditSchemaUpgrade,
} from '../securityAuditDbGateway.js';

describe('securityAuditDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(SECURITY_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée authAuditTrail + index', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(SECURITY_DB_NAME, SECURITY_DB_VERSION);
      req.onupgradeneeded = (e) => applySecurityAuditSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        const s = db.transaction([STORE_AUTH_AUDIT_TRAIL], 'readonly').objectStore(STORE_AUTH_AUDIT_TRAIL);
        expect(Array.from(s.indexNames).sort()).toEqual(['eventType', 'timestamp'].sort());
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
