/**
 * Schéma IndexedDB assets livres (PDF / images).
 *
 * @module services/books/booksAssetsDbGateway
 */

export const BOOKS_ASSETS_DB_NAME = 'WorkoutTrackerBooksAssets';
export const BOOKS_ASSETS_DB_VERSION = 1;
export const STORE_BOOK_PDF_FILES = 'bookPdfFiles';
export const STORE_BOOK_IMAGES = 'bookImages';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyBooksAssetsSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_BOOK_PDF_FILES)) {
    db.createObjectStore(STORE_BOOK_PDF_FILES, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(STORE_BOOK_IMAGES)) {
    db.createObjectStore(STORE_BOOK_IMAGES, { keyPath: 'id' });
  }
}
