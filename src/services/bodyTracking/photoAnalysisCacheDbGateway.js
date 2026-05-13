/**
 * Cache IndexedDB analyses photo body tracking.
 *
 * @module services/bodyTracking/photoAnalysisCacheDbGateway
 */

export const PHOTO_ANALYSIS_CACHE_DB_NAME = 'photoAnalysisCache';
export const PHOTO_ANALYSIS_CACHE_DB_VERSION = 1;
export const PHOTO_ANALYSIS_CACHE_STORE = 'results';

/**
 * @param {IDBDatabase} db
 * @param {string} [storeName]
 */
export function applyPhotoAnalysisCacheSchemaUpgrade(db, storeName = PHOTO_ANALYSIS_CACHE_STORE) {
  if (!db.objectStoreNames.contains(storeName)) {
    const objectStore = db.createObjectStore(storeName, { keyPath: 'key' });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
  }
}
