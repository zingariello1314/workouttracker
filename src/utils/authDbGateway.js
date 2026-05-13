/**
 * Schéma IndexedDB authentification locale (WorkoutTrackerAuthDB).
 *
 * @module utils/authDbGateway
 */

export const AUTH_DB_NAME = 'WorkoutTrackerAuthDB';
export const AUTH_DB_VERSION = 1;

export const STORE_AUTH_USERS = 'users';
export const STORE_AUTH_USER_AVATARS = 'userAvatars';
export const STORE_AUTH_STATE = 'authState';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyAuthSchemaUpgrade(event) {
  const db = event.target.result;

  if (!db.objectStoreNames.contains(STORE_AUTH_USERS)) {
    const users = db.createObjectStore(STORE_AUTH_USERS, { keyPath: 'id' });
    try {
      users.createIndex('username', 'username', { unique: true });
    } catch {
      /* index non critique */
    }
  }

  if (!db.objectStoreNames.contains(STORE_AUTH_USER_AVATARS)) {
    const avatars = db.createObjectStore(STORE_AUTH_USER_AVATARS, { keyPath: 'id' });
    try {
      avatars.createIndex('userId', 'userId', { unique: true });
    } catch {
      /* index non critique */
    }
  }

  if (!db.objectStoreNames.contains(STORE_AUTH_STATE)) {
    db.createObjectStore(STORE_AUTH_STATE, { keyPath: 'id' });
  }
}
