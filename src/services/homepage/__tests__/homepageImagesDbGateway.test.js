import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  HOMEPAGE_IMAGES_DB_NAME,
  HOMEPAGE_IMAGES_DB_VERSION,
  STORE_HOMEPAGE_IMAGES,
  applyHomepageImagesSchemaUpgrade,
} from '../homepageImagesDbGateway.js';

describe('homepageImagesDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(HOMEPAGE_IMAGES_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée store images + index type/timestamp', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(HOMEPAGE_IMAGES_DB_NAME, HOMEPAGE_IMAGES_DB_VERSION);
      req.onupgradeneeded = (e) => applyHomepageImagesSchemaUpgrade(e, { debug: () => {}, warn: () => {} });
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_HOMEPAGE_IMAGES)).toBe(true);
        const s = db.transaction([STORE_HOMEPAGE_IMAGES], 'readonly').objectStore(STORE_HOMEPAGE_IMAGES);
        expect(Array.from(s.indexNames).sort()).toEqual(['timestamp', 'type'].sort());
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
