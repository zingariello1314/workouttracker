/**
 * Passerelle IndexedDB QuietQuestDB / store `xpSystem` — hors hooks React.
 *
 * @module services/xp/xpDbGateway
 */

import { ensureQuietQuestHookStores } from './quietQuestHookStores.js';

export const XP_DB_NAME = 'QuietQuestDB';
export const XP_STORE_NAME = 'xpSystem';

const createXPStore = (db) => {
  if (!db.objectStoreNames.contains(XP_STORE_NAME)) {
    const store = db.createObjectStore(XP_STORE_NAME, { keyPath: 'userId' });
    store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
  }
};

/**
 * Tout upgrade QuietQuestDB : XP + stores hooks (muscleGroups, performanceHistory).
 * @param {IDBVersionChangeEvent} event
 */
export function applyQuietQuestMetaDbUpgrade(event) {
  const db = event.target.result;
  createXPStore(db);
  ensureQuietQuestHookStores(db);
}

const upgradeXPDB = (nextVersion) =>
  new Promise((resolve) => {
    const upgradeRequest = indexedDB.open(XP_DB_NAME, nextVersion);
    upgradeRequest.onupgradeneeded = (event) => {
      applyQuietQuestMetaDbUpgrade(event);
    };
    upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
    upgradeRequest.onerror = () => {
      console.warn('[xpDbGateway] Erreur IndexedDB (upgrade), utilisation localStorage');
      resolve(null);
    };
  });

/**
 * Ouvre la base et garantit l’existence du store XP.
 * @returns {Promise<IDBDatabase | null>}
 */
export const openXpSystemDb = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[xpDbGateway] IndexedDB non disponible');
      resolve(null);
      return;
    }

    const request = indexedDB.open(XP_DB_NAME);

    request.onupgradeneeded = (event) => {
      applyQuietQuestMetaDbUpgrade(event);
    };

    request.onsuccess = async () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(XP_STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1;
        db.close();
        const upgraded = await upgradeXPDB(nextVersion);
        resolve(upgraded);
        return;
      }
      resolve(db);
    };
    request.onerror = () => {
      console.warn('[xpDbGateway] Erreur IndexedDB');
      resolve(null);
    };
  });

/**
 * @param {string} userId
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getXpRow(userId) {
  const db = await openXpSystemDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction([XP_STORE_NAME], 'readonly');
    const req = tx.objectStore(XP_STORE_NAME).get(userId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {Record<string, unknown>} xpData — doit contenir `userId`
 */
export async function putXpRow(xpData) {
  const db = await openXpSystemDb();
  if (!db) throw new Error('XP_DB_UNAVAILABLE');
  const payload = {
    ...xpData,
    lastUpdated: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction([XP_STORE_NAME], 'readwrite');
    const req = tx.objectStore(XP_STORE_NAME).put(payload);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
