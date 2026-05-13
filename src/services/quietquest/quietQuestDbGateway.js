/**
 * Passerelle WorkoutTrackerDB — stores QuietQuest (quêtes, validations, etc.).
 * Hors hooks ; logique inchangée par rapport à l’historique `quietQuestIndexedDB.js`.
 *
 * @module services/quietquest/quietQuestDbGateway
 */

export const QUIET_QUEST_TRACKER_DB_NAME = 'WorkoutTrackerDB';

export const STORE_QUIETQUEST_QUESTS = 'quietquest_quests';
export const STORE_QUIETQUEST_VALIDATIONS = 'quietquest_validations';
export const STORE_QUIETQUEST_USER_DATA = 'quietquest_user_data';
export const STORE_QUIETQUEST_DAILY_PERFORMANCES = 'quietquest_daily_performances';
export const STORE_QUIETQUEST_APP_STATE = 'quietquest_app_state';

const DB_NAME = QUIET_QUEST_TRACKER_DB_NAME;
const STORE_QUESTS = STORE_QUIETQUEST_QUESTS;
const STORE_VALIDATIONS = STORE_QUIETQUEST_VALIDATIONS;
const STORE_USER_DATA = STORE_QUIETQUEST_USER_DATA;
const STORE_DAILY_PERFORMANCES = STORE_QUIETQUEST_DAILY_PERFORMANCES;
const STORE_APP_STATE = STORE_QUIETQUEST_APP_STATE;

/**
 * Ouvre la base et garantit les stores QuietQuest.
 * @returns {Promise<IDBDatabase | null>}
 */
export const openQuietQuestDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_QUESTS)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_quests"');
        const store = db.createObjectStore(STORE_QUESTS, { keyPath: 'id' });
        try {
          store.createIndex('categorie', 'categorie', { unique: false });
          store.createIndex('active', 'active', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        } catch (e) {
          // Index non critique
        }
      } else {
        const store = event.target.transaction.objectStore(STORE_QUESTS);
        const indexNames = Array.from(store.indexNames);
        if (!indexNames.includes('userId')) {
          try {
            store.createIndex('userId', 'userId', { unique: false });
            console.log('[quietQuestIndexedDB] Index userId créé pour quests');
          } catch {
            // Index optionnel
          }
        }
      }

      if (!db.objectStoreNames.contains(STORE_VALIDATIONS)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_validations"');
        const store = db.createObjectStore(STORE_VALIDATIONS, {
          keyPath: ['queteId', 'date'],
          autoIncrement: false,
        });
        try {
          store.createIndex('queteId', 'queteId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        } catch (e) {
          // Index non critique
        }
      } else {
        const store = event.target.transaction.objectStore(STORE_VALIDATIONS);
        const indexNames = Array.from(store.indexNames);
        if (!indexNames.includes('userId')) {
          try {
            store.createIndex('userId', 'userId', { unique: false });
            console.log('[quietQuestIndexedDB] Index userId créé pour validations');
          } catch {
            // Index optionnel
          }
        }
      }

      if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_user_data"');
        db.createObjectStore(STORE_USER_DATA, { keyPath: 'userId' });
      }

      if (!db.objectStoreNames.contains(STORE_DAILY_PERFORMANCES)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_daily_performances"');
        const store = db.createObjectStore(STORE_DAILY_PERFORMANCES, {
          keyPath: ['userId', 'date'],
        });
        try {
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        } catch (e) {
          // Index non critique
        }
      } else {
        const store = event.target.transaction.objectStore(STORE_DAILY_PERFORMANCES);
        const indexNames = Array.from(store.indexNames);
        if (!indexNames.includes('userId')) {
          try {
            store.createIndex('userId', 'userId', { unique: false });
            console.log('[quietQuestIndexedDB] Index userId créé pour daily_performances');
          } catch {
            // Index optionnel
          }
        }
      }

      if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_app_state"');
        db.createObjectStore(STORE_APP_STATE, { keyPath: 'userId' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const requiredStores = [
        STORE_QUESTS,
        STORE_VALIDATIONS,
        STORE_USER_DATA,
        STORE_DAILY_PERFORMANCES,
        STORE_APP_STATE,
      ];
      const missingStores = requiredStores.filter((name) => !db.objectStoreNames.contains(name));

      if (missingStores.length > 0) {
        console.warn(
          `[quietQuestIndexedDB] ⚠️ Stores manquants: ${missingStores.join(', ')}. Forcer upgrade...`
        );
        const currentVersion = db.version;
        db.close();
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          missingStores.forEach((storeName) => {
            if (!upgradeDb.objectStoreNames.contains(storeName)) {
              if (storeName === STORE_QUESTS) {
                const store = upgradeDb.createObjectStore(STORE_QUESTS, { keyPath: 'id' });
                try {
                  store.createIndex('categorie', 'categorie', { unique: false });
                  store.createIndex('active', 'active', { unique: false });
                  store.createIndex('type', 'type', { unique: false });
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              } else if (storeName === STORE_VALIDATIONS) {
                const store = upgradeDb.createObjectStore(STORE_VALIDATIONS, {
                  keyPath: ['queteId', 'date'],
                });
                try {
                  store.createIndex('queteId', 'queteId', { unique: false });
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              } else if (storeName === STORE_USER_DATA) {
                upgradeDb.createObjectStore(STORE_USER_DATA, { keyPath: 'userId' });
              } else if (storeName === STORE_DAILY_PERFORMANCES) {
                const store = upgradeDb.createObjectStore(STORE_DAILY_PERFORMANCES, {
                  keyPath: ['userId', 'date'],
                });
                try {
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              } else if (storeName === STORE_APP_STATE) {
                upgradeDb.createObjectStore(STORE_APP_STATE, { keyPath: 'userId' });
              }
            }
          });
        };
        upgradeRequest.onsuccess = (e) => {
          console.log('[quietQuestIndexedDB] ✅ Base mise à jour avec tous les stores');
          resolve(e.target.result);
        };
        upgradeRequest.onerror = () => resolve(null);
        return;
      }
      resolve(db);
    };

    request.onerror = (event) => {
      const error = event.target.error;
      if (error && error.name === 'VersionError') {
        try {
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
          deleteRequest.onsuccess = () => {
            const newRequest = indexedDB.open(DB_NAME, 1);
            newRequest.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains(STORE_QUESTS)) {
                const store = db.createObjectStore(STORE_QUESTS, { keyPath: 'id' });
                try {
                  store.createIndex('categorie', 'categorie', { unique: false });
                  store.createIndex('active', 'active', { unique: false });
                  store.createIndex('type', 'type', { unique: false });
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              }
              if (!db.objectStoreNames.contains(STORE_VALIDATIONS)) {
                const store = db.createObjectStore(STORE_VALIDATIONS, {
                  keyPath: ['queteId', 'date'],
                });
                try {
                  store.createIndex('queteId', 'queteId', { unique: false });
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              }
              if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
                db.createObjectStore(STORE_USER_DATA, { keyPath: 'userId' });
              }
              if (!db.objectStoreNames.contains(STORE_DAILY_PERFORMANCES)) {
                const store = db.createObjectStore(STORE_DAILY_PERFORMANCES, {
                  keyPath: ['userId', 'date'],
                });
                try {
                  store.createIndex('date', 'date', { unique: false });
                  store.createIndex('userId', 'userId', { unique: false });
                } catch {}
              }
              if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
                db.createObjectStore(STORE_APP_STATE, { keyPath: 'userId' });
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
