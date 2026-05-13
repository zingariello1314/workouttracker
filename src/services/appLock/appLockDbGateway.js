/**
 * Schéma IndexedDB verrou app (MomentumAppLockDB).
 *
 * @module services/appLock/appLockDbGateway
 */

export const DB_NAME = 'MomentumAppLockDB';
export const DB_VERSION = 1;
export const STORE_APP_LOCK_BY_USER = 'appLockByUser';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyAppLockSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_APP_LOCK_BY_USER)) {
    db.createObjectStore(STORE_APP_LOCK_BY_USER, { keyPath: 'userId' });
  }
}
