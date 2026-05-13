import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MUSCLE_IMAGES_DB_NAME,
  MUSCLE_IMAGES_DB_VERSION,
  STORE_MUSCLE_IMAGES,
  applyMuscleImagesSchemaUpgrade,
} from '../muscleImagesDbGateway.js';

describe('muscleImagesDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(MUSCLE_IMAGES_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('applyMuscleImagesSchemaUpgrade crée muscleImages', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(MUSCLE_IMAGES_DB_NAME, MUSCLE_IMAGES_DB_VERSION);
      req.onupgradeneeded = (e) => {
        applyMuscleImagesSchemaUpgrade(e);
      };
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_MUSCLE_IMAGES)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
