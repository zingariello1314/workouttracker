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
