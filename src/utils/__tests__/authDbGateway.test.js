import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AUTH_DB_NAME,
  AUTH_DB_VERSION,
  STORE_AUTH_USERS,
  STORE_AUTH_USER_AVATARS,
  STORE_AUTH_STATE,
  applyAuthSchemaUpgrade,
} from '../authDbGateway.js';

describe('authDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(AUTH_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée users, userAvatars, authState', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(AUTH_DB_NAME, AUTH_DB_VERSION);
      req.onupgradeneeded = (e) => applyAuthSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_AUTH_USERS)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_AUTH_USER_AVATARS)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_AUTH_STATE)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
