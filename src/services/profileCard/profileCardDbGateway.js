/**
 * Schéma IndexedDB cartes profil (ProfileCardDB).
 *
 * @module services/profileCard/profileCardDbGateway
 */

export const PROFILE_CARD_DB_NAME = 'ProfileCardDB';
export const PROFILE_CARD_DB_VERSION = 1;
export const STORE_PROFILE_CARDS = 'profileCards';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyProfileCardSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_PROFILE_CARDS)) {
    const objectStore = db.createObjectStore(STORE_PROFILE_CARDS, { keyPath: 'username' });
    objectStore.createIndex('username', 'username', { unique: true });
    objectStore.createIndex('lastModified', 'lastModified', { unique: false });
  }
}
