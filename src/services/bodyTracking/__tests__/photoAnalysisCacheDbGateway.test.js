import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PHOTO_ANALYSIS_CACHE_DB_NAME,
  PHOTO_ANALYSIS_CACHE_DB_VERSION,
  PHOTO_ANALYSIS_CACHE_STORE,
  applyPhotoAnalysisCacheSchemaUpgrade,
} from '../photoAnalysisCacheDbGateway.js';

describe('photoAnalysisCacheDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(PHOTO_ANALYSIS_CACHE_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée le store par défaut et index timestamp', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(PHOTO_ANALYSIS_CACHE_DB_NAME, PHOTO_ANALYSIS_CACHE_DB_VERSION);
      req.onupgradeneeded = (e) => {
        applyPhotoAnalysisCacheSchemaUpgrade(e.target.result);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(PHOTO_ANALYSIS_CACHE_STORE)).toBe(true);
        const tx = db.transaction([PHOTO_ANALYSIS_CACHE_STORE], 'readonly');
        expect(tx.objectStore(PHOTO_ANALYSIS_CACHE_STORE).indexNames.contains('timestamp')).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });

  it('accepte un nom de store personnalisé', async () => {
    const custom = 'results_alt';
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('photoAnalysisCacheCustomTest', 1);
      req.onupgradeneeded = (e) => {
        applyPhotoAnalysisCacheSchemaUpgrade(e.target.result, custom);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(custom)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
    indexedDB.deleteDatabase('photoAnalysisCacheCustomTest');
  });
});
