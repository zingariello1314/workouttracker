/**
 * Persistance du verrouillage d'application par compte (IndexedDB).
 * Stocke hash + sel (jamais le code en clair) et optionnellement un fond en data URL.
 */

import {
  DB_NAME,
  DB_VERSION,
  STORE_APP_LOCK_BY_USER,
  applyAppLockSchemaUpgrade,
} from './appLockDbGateway.js';

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      applyAppLockSchemaUpgrade(event);
    };
    request.onblocked = () => reject(new Error('Database blocked'));
  });

/**
 * @typedef {Object} AppLockRecord
 * @property {string} userId
 * @property {'disabled'|'pin4'|'pin6'|'alphanumeric'} mode
 * @property {number|null} idleMinutes — null = jamais par inactivité
 * @property {boolean} lockOnBackground
 * @property {string|null} salt
 * @property {string|null} codeHash
 * @property {string|null} lockBackgroundDataUrl — @deprecated premier fond (compat)
 * @property {string[]} lockBackgroundDataUrls — fonds réservés au verrou (hors bibliothèque)
 * @property {number} failedAttempts
 * @property {string|null} lockoutUntil — ISO
 * @property {string} updatedAt
 */

/** @returns {AppLockRecord} */
export const getDefaultAppLockRecord = (userId) => ({
  userId,
  mode: 'disabled',
  idleMinutes: null,
  lockOnBackground: true,
  salt: null,
  codeHash: null,
  lockBackgroundDataUrl: null,
  lockBackgroundDataUrls: [],
  failedAttempts: 0,
  lockoutUntil: null,
  updatedAt: new Date().toISOString(),
});

/**
 * @param {string} userId
 * @returns {Promise<AppLockRecord>}
 */
export const getAppLockRecord = async (userId) => {
  if (!userId) return getDefaultAppLockRecord('');
  const db = await openDB();
  try {
    const tx = db.transaction(STORE_APP_LOCK_BY_USER, 'readonly');
    const store = tx.objectStore(STORE_APP_LOCK_BY_USER);
    const row = await new Promise((resolve, reject) => {
      const r = store.get(userId);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
    db.close();
    if (!row) return getDefaultAppLockRecord(userId);
    const merged = { ...getDefaultAppLockRecord(userId), ...row, userId };
    if (
      merged.lockBackgroundDataUrl &&
      (!Array.isArray(merged.lockBackgroundDataUrls) || merged.lockBackgroundDataUrls.length === 0)
    ) {
      merged.lockBackgroundDataUrls = [merged.lockBackgroundDataUrl];
    }
    if (!Array.isArray(merged.lockBackgroundDataUrls)) {
      merged.lockBackgroundDataUrls = [];
    }
    return merged;
  } catch {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    return getDefaultAppLockRecord(userId);
  }
};

/**
 * @param {Partial<AppLockRecord> & { userId: string }} partial
 * @returns {Promise<AppLockRecord>}
 */
export const saveAppLockRecord = async (partial) => {
  const userId = partial.userId;
  if (!userId) throw new Error('userId requis');
  const prev = await getAppLockRecord(userId);
  const next = {
    ...prev,
    ...partial,
    userId,
    updatedAt: new Date().toISOString(),
  };
  const db = await openDB();
  try {
    const tx = db.transaction(STORE_APP_LOCK_BY_USER, 'readwrite');
    const store = tx.objectStore(STORE_APP_LOCK_BY_USER);
    await new Promise((resolve, reject) => {
      const r = store.put(next);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
    db.close();
    return next;
  } catch (e) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
};
