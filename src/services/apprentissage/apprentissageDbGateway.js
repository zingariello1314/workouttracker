/**
 * Passerelle WorkoutTrackerDB — stores Apprentissage.
 * Logique inchangée par rapport à l’historique `apprentissageIndexedDB.js`.
 *
 * @module services/apprentissage/apprentissageDbGateway
 */

export const APPRENTISSAGE_TRACKER_DB_NAME = 'WorkoutTrackerDB';

export const STORE_APPRENTISSAGE_SUBJECTS = 'apprentissage_subjects';
export const STORE_APPRENTISSAGE_PROGRESSION = 'apprentissage_progression';
export const STORE_APPRENTISSAGE_SESSIONS_HISTORY = 'apprentissage_sessions_history';
export const STORE_APPRENTISSAGE_PLANNER = 'apprentissage_planner';
export const STORE_APPRENTISSAGE_TIMER = 'apprentissage_timer';

const DB_NAME = APPRENTISSAGE_TRACKER_DB_NAME;
const STORE_SUBJECTS = STORE_APPRENTISSAGE_SUBJECTS;
const STORE_PROGRESSION = STORE_APPRENTISSAGE_PROGRESSION;
const STORE_SESSIONS_HISTORY = STORE_APPRENTISSAGE_SESSIONS_HISTORY;
const STORE_PLANNER = STORE_APPRENTISSAGE_PLANNER;
const STORE_TIMER = STORE_APPRENTISSAGE_TIMER;

/**
 * Ouvre la base et garantit les stores Apprentissage.
 * @returns {Promise<IDBDatabase | null>}
 */
export const openApprentissageDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_SUBJECTS)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_subjects"');
        const store = db.createObjectStore(STORE_SUBJECTS, { keyPath: 'id' });
        try {
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        } catch (e) {
          // Index non critique
        }
      }

      if (!db.objectStoreNames.contains(STORE_PROGRESSION)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_progression"');
        db.createObjectStore(STORE_PROGRESSION, { keyPath: 'userId' });
      }

      if (!db.objectStoreNames.contains(STORE_SESSIONS_HISTORY)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_sessions_history"');
        const store = db.createObjectStore(STORE_SESSIONS_HISTORY, { keyPath: 'id', autoIncrement: true });
        try {
          store.createIndex('subject', 'subject', { unique: false });
          store.createIndex('startTime', 'startTime', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        } catch (e) {
          // Index non critique
        }
      }

      if (!db.objectStoreNames.contains(STORE_PLANNER)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_planner"');
        db.createObjectStore(STORE_PLANNER, { keyPath: 'userId' });
      }

      if (!db.objectStoreNames.contains(STORE_TIMER)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_timer"');
        db.createObjectStore(STORE_TIMER, { keyPath: 'userId' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      const requiredStores = [
        STORE_SUBJECTS,
        STORE_PROGRESSION,
        STORE_SESSIONS_HISTORY,
        STORE_PLANNER,
        STORE_TIMER,
      ];
      const missingStores = requiredStores.filter((name) => !db.objectStoreNames.contains(name));

      if (missingStores.length > 0) {
        console.warn(
          `[apprentissageIndexedDB] ⚠️ Stores manquants: ${missingStores.join(', ')}. Forcer upgrade...`
        );
        const currentVersion = db.version;
        db.close();
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);

        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          missingStores.forEach((storeName) => {
            if (!upgradeDb.objectStoreNames.contains(storeName)) {
              if (storeName === STORE_SUBJECTS) {
                const store = upgradeDb.createObjectStore(STORE_SUBJECTS, { keyPath: 'id' });
                try {
                  store.createIndex('name', 'name', { unique: false });
                  store.createIndex('createdAt', 'createdAt', { unique: false });
                } catch {}
              } else if (storeName === STORE_PROGRESSION) {
                upgradeDb.createObjectStore(STORE_PROGRESSION, { keyPath: 'userId' });
              } else if (storeName === STORE_SESSIONS_HISTORY) {
                const store = upgradeDb.createObjectStore(STORE_SESSIONS_HISTORY, {
                  keyPath: 'id',
                  autoIncrement: true,
                });
                try {
                  store.createIndex('subject', 'subject', { unique: false });
                  store.createIndex('startTime', 'startTime', { unique: false });
                  store.createIndex('type', 'type', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              } else if (storeName === STORE_PLANNER) {
                upgradeDb.createObjectStore(STORE_PLANNER, { keyPath: 'userId' });
              } else if (storeName === STORE_TIMER) {
                upgradeDb.createObjectStore(STORE_TIMER, { keyPath: 'userId' });
              }
            }
          });
        };

        upgradeRequest.onsuccess = (e) => {
          resolve(e.target.result);
        };

        upgradeRequest.onerror = () => {
          console.warn('[apprentissageIndexedDB] Erreur lors de l\'upgrade, fallback localStorage');
          resolve(null);
        };
      } else {
        resolve(db);
      }
    };

    request.onerror = () => {
      console.warn('[apprentissageIndexedDB] IndexedDB indisponible, fallback localStorage');
      resolve(null);
    };
  });
};
