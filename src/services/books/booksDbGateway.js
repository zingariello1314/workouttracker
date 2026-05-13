/**
 * Passerelle IndexedDB WorkoutTrackerDB / store `books`.
 *
 * @module services/books/booksDbGateway
 */

import logger from '../../utils/logger.js';

const booksIdxLog = logger.module('booksIndexedDB');

export const BOOKS_TRACKER_DB_NAME = 'WorkoutTrackerDB';
export const BOOKS_STORE_NAME = 'books';

/**
 * Ouvre la base et garantit le store `books`.
 * @returns {Promise<IDBDatabase | null>}
 */
export const openBooksDb = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(BOOKS_TRACKER_DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(BOOKS_STORE_NAME)) {
        booksIdxLog.debug('[booksDbGateway] Création du store "books"');
        const store = db.createObjectStore(BOOKS_STORE_NAME, { keyPath: 'id' });
        try {
          store.createIndex('status', 'status', { unique: false });
        } catch {
          // Index non critique
        }
        try {
          store.createIndex('userId', 'userId', { unique: false });
        } catch {
          // Index non critique
        }
      } else {
        const store = event.target.transaction.objectStore(BOOKS_STORE_NAME);
        const indexNames = Array.from(store.indexNames);
        if (!indexNames.includes('userId')) {
          try {
            store.createIndex('userId', 'userId', { unique: false });
            booksIdxLog.debug('[booksDbGateway] Index userId créé');
          } catch {
            // Index non critique
          }
        }
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE_NAME)) {
        console.warn('[booksDbGateway] ⚠️ Store "books" absent, upgrade forcé');
        const currentVersion = db.version;
        db.close();
        const upgradeRequest = indexedDB.open(BOOKS_TRACKER_DB_NAME, currentVersion + 1);
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          if (!upgradeDb.objectStoreNames.contains(BOOKS_STORE_NAME)) {
            booksIdxLog.debug('[booksDbGateway] Création du store "books" (upgrade forcé)');
            const store = upgradeDb.createObjectStore(BOOKS_STORE_NAME, { keyPath: 'id' });
            try {
              store.createIndex('status', 'status', { unique: false });
            } catch {
              // optionnel
            }
            try {
              store.createIndex('userId', 'userId', { unique: false });
            } catch {
              // optionnel
            }
          } else {
            const store = e.target.transaction.objectStore(BOOKS_STORE_NAME);
            const indexNames = Array.from(store.indexNames);
            if (!indexNames.includes('userId')) {
              try {
                store.createIndex('userId', 'userId', { unique: false });
                booksIdxLog.debug('[booksDbGateway] Index userId créé (upgrade)');
              } catch {
                // optionnel
              }
            }
          }
        };
        upgradeRequest.onsuccess = (e) => {
          booksIdxLog.debug('[booksDbGateway] ✅ Base mise à jour avec le store "books"');
          resolve(e.target.result);
        };
        upgradeRequest.onerror = (e) => {
          console.error('[booksDbGateway] ❌ Erreur upgrade forcé:', e.target.error);
          resolve(null);
        };
        return;
      }
      booksIdxLog.debug('[booksDbGateway] ✅ Base ouverte, store "books" présent');
      resolve(db);
    };

    request.onerror = (event) => {
      const error = event.target.error;

      if (error && error.name === 'VersionError') {
        try {
          const deleteRequest = indexedDB.deleteDatabase(BOOKS_TRACKER_DB_NAME);
          deleteRequest.onsuccess = () => {
            const newRequest = indexedDB.open(BOOKS_TRACKER_DB_NAME, 1);
            newRequest.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains(BOOKS_STORE_NAME)) {
                const store = db.createObjectStore(BOOKS_STORE_NAME, { keyPath: 'id' });
                try {
                  store.createIndex('status', 'status', { unique: false });
                } catch {
                  // optionnel
                }
                try {
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {
                  // optionnel
                }
              }
            };
            newRequest.onsuccess = (e) => resolve(e.target.result);
            newRequest.onerror = () => resolve(null);
          };
          deleteRequest.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
  });
};
