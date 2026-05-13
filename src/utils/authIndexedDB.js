// IndexedDB pour l'authentification (comptes utilisateurs, avatars légers, état de session)
// Inspiré de src/utils/booksIndexedDB.js et aligné avec la philosophie globale du projet :
// - Toujours silencieux côté appelant en cas d'échec (retourne null/false plutôt que throw)
// - Logging centralisé via logger.module('AuthIndexedDB')

import logger from './logger';
import {
  AUTH_DB_NAME,
  AUTH_DB_VERSION,
  STORE_AUTH_USERS,
  STORE_AUTH_USER_AVATARS,
  STORE_AUTH_STATE,
  applyAuthSchemaUpgrade,
} from './authDbGateway.js';

const log = logger.module('AuthIndexedDB');

/**
 * Ouvre la base d'auth et garantit l'existence des stores nécessaires.
 * Retourne null si IndexedDB n'est pas disponible ou en cas d'échec non récupérable.
 */
export const openAuthDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(AUTH_DB_NAME, AUTH_DB_VERSION);

    request.onupgradeneeded = (event) => {
      applyAuthSchemaUpgrade(event);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      log.debug('✅ Auth DB ouverte avec succès', { stores: Array.from(db.objectStoreNames) });
      resolve(db);
    };

    request.onerror = () => {
      log.error('❌ Erreur lors de l’ouverture de la base Auth', request.error);
      resolve(null);
    };
  });
};

// ---------- Utilisateurs ----------

export const createUser = async (user) => {
  const db = await openAuthDB();
  if (!db) return { success: false, error: 'NO_DB' };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USERS], 'readwrite');
      const store = tx.objectStore(STORE_AUTH_USERS);

      const request = store.add(user);

      request.onsuccess = () => {
        log.debug('✅ Utilisateur créé', { id: user.id, username: user.username });
        resolve({ success: true });
      };

      request.onerror = (event) => {
        log.warn('⚠️ Échec création utilisateur', event.target.error);
        resolve({ success: false, error: event.target.error });
      };
    } catch (error) {
      log.error('❌ Exception createUser', error);
      resolve({ success: false, error });
    }
  });
};

export const getUserByUsername = async (username) => {
  const db = await openAuthDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USERS], 'readonly');
      const store = tx.objectStore(STORE_AUTH_USERS);
      const index = store.index('username');
      const request = index.get(username);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => resolve(null);
    } catch (error) {
      log.error('❌ Exception getUserByUsername', error);
      resolve(null);
    }
  });
};

export const getUserById = async (id) => {
  const db = await openAuthDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USERS], 'readonly');
      const store = tx.objectStore(STORE_AUTH_USERS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch (error) {
      log.error('❌ Exception getUserById', error);
      resolve(null);
    }
  });
};

export const updateUser = async (user) => {
  const db = await openAuthDB();
  if (!db || !user || !user.id) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USERS], 'readwrite');
      const store = tx.objectStore(STORE_AUTH_USERS);
      const request = store.put(user);

      request.onsuccess = () => {
        log.debug('✅ Utilisateur mis à jour', { id: user.id });
        resolve(true);
      };
      request.onerror = (event) => {
        log.error('❌ Erreur updateUser', event.target.error);
        resolve(false);
      };
    } catch (error) {
      log.error('❌ Exception updateUser', error);
      resolve(false);
    }
  });
};

// ---------- Avatars ----------

export const saveAvatar = async ({ id, userId, blob, mimeType }) => {
  const db = await openAuthDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USER_AVATARS], 'readwrite');
      const store = tx.objectStore(STORE_AUTH_USER_AVATARS);
      const record = { id, userId, blob, mimeType };
      const request = store.put(record);

      request.onsuccess = () => {
        log.debug('✅ Avatar sauvegardé', { id, userId });
        resolve(true);
      };
      request.onerror = (event) => {
        log.error('❌ Erreur saveAvatar', event.target.error);
        resolve(false);
      };
    } catch (error) {
      log.error('❌ Exception saveAvatar', error);
      resolve(false);
    }
  });
};

export const getAvatarByUserId = async (userId) => {
  const db = await openAuthDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_USER_AVATARS], 'readonly');
      const store = tx.objectStore(STORE_AUTH_USER_AVATARS);
      const index = store.index('userId');
      const request = index.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch (error) {
      log.error('❌ Exception getAvatarByUserId', error);
      resolve(null);
    }
  });
};

// ---------- État d'auth (session) ----------

export const saveAuthState = async (state) => {
  const db = await openAuthDB();
  if (!db) return false;

  const record = { id: 'current', ...state };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_STATE], 'readwrite');
      const store = tx.objectStore(STORE_AUTH_STATE);
      const request = store.put(record);

      request.onsuccess = () => {
        log.debug('✅ État d’auth sauvegardé', record);
        resolve(true);
      };
      request.onerror = (event) => {
        log.error('❌ Erreur saveAuthState', event.target.error);
        resolve(false);
      };
    } catch (error) {
      log.error('❌ Exception saveAuthState', error);
      resolve(false);
    }
  });
};

export const getAuthState = async () => {
  const db = await openAuthDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_STATE], 'readonly');
      const store = tx.objectStore(STORE_AUTH_STATE);
      const request = store.get('current');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch (error) {
      log.error('❌ Exception getAuthState', error);
      resolve(null);
    }
  });
};

export const clearAuthState = async () => {
  const db = await openAuthDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_AUTH_STATE], 'readwrite');
      const store = tx.objectStore(STORE_AUTH_STATE);
      const request = store.delete('current');

      request.onsuccess = () => {
        log.debug('✅ État d’auth supprimé');
        resolve(true);
      };
      request.onerror = (event) => {
        log.error('❌ Erreur clearAuthState', event.target.error);
        resolve(false);
      };
    } catch (error) {
      log.error('❌ Exception clearAuthState', error);
      resolve(false);
    }
  });
};


