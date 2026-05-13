import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BOOKS_ASSETS_DB_NAME,
  BOOKS_ASSETS_DB_VERSION,
  STORE_BOOK_PDF_FILES,
  STORE_BOOK_IMAGES,
  applyBooksAssetsSchemaUpgrade,
} from '../booksAssetsDbGateway.js';

describe('booksAssetsDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(BOOKS_ASSETS_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée stores PDF et images', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(BOOKS_ASSETS_DB_NAME, BOOKS_ASSETS_DB_VERSION);
      req.onupgradeneeded = (e) => applyBooksAssetsSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_BOOK_PDF_FILES)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_BOOK_IMAGES)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
