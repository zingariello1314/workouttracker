/**
 * Images muscles (sélecteur dashboard / migration).
 *
 * @module services/bodyTracking/muscleImagesDbGateway
 */

export const MUSCLE_IMAGES_DB_NAME = 'MuscleImagesDB';
export const MUSCLE_IMAGES_DB_VERSION = 1;
export const STORE_MUSCLE_IMAGES = 'muscleImages';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyMuscleImagesSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_MUSCLE_IMAGES)) {
    db.createObjectStore(STORE_MUSCLE_IMAGES, { keyPath: 'muscleId' });
  }
}

/**
 * Ouvre la base images muscles (évite `indexedDB.open` dans les composants).
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openMuscleImagesDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB indisponible'));
      return;
    }
    const request = indexedDB.open(MUSCLE_IMAGES_DB_NAME, MUSCLE_IMAGES_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => applyMuscleImagesSchemaUpgrade(event);
    request.onsuccess = () => resolve(request.result);
  });
}
