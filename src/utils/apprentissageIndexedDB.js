/**
 * Stockage avancé Apprentissage dans IndexedDB (WorkoutTrackerDB)
 * Implémentation alignée sur quietQuestIndexedDB.js et useWorkoutData.openDB
 * Fallback automatique vers localStorage si IndexedDB indisponible
 * Avec retry automatique et transactions atomiques
 */

import { retryIndexedDB } from './apprentissageRetry';

const DB_NAME = 'WorkoutTrackerDB';

// Noms des object stores
const STORE_SUBJECTS = 'apprentissage_subjects';
const STORE_PROGRESSION = 'apprentissage_progression';
const STORE_SESSIONS_HISTORY = 'apprentissage_sessions_history';
const STORE_PLANNER = 'apprentissage_planner';
const STORE_TIMER = 'apprentissage_timer';

/**
 * Ouvre la base WorkoutTrackerDB et garantit l'existence des stores Apprentissage.
 * Retourne null si IndexedDB n'est pas disponible ou en cas d'échec non récupérable.
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

      // Store subjects
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

      // Store progression
      if (!db.objectStoreNames.contains(STORE_PROGRESSION)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_progression"');
        db.createObjectStore(STORE_PROGRESSION, { keyPath: 'userId' });
      }

      // Store sessions history
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

      // Store planner
      if (!db.objectStoreNames.contains(STORE_PLANNER)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_planner"');
        db.createObjectStore(STORE_PLANNER, { keyPath: 'userId' });
      }

      // Store timer
      if (!db.objectStoreNames.contains(STORE_TIMER)) {
        console.log('[apprentissageIndexedDB] Création du store "apprentissage_timer"');
        db.createObjectStore(STORE_TIMER, { keyPath: 'userId' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Vérifier que tous les stores existent
      const requiredStores = [
        STORE_SUBJECTS,
        STORE_PROGRESSION,
        STORE_SESSIONS_HISTORY,
        STORE_PLANNER,
        STORE_TIMER,
      ];
      const missingStores = requiredStores.filter(
        (name) => !db.objectStoreNames.contains(name)
      );

      if (missingStores.length > 0) {
        console.warn(
          `[apprentissageIndexedDB] ⚠️ Stores manquants: ${missingStores.join(', ')}. Forcer upgrade...`
        );
        const currentVersion = db.version;
        db.close();
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);
        
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          // Recréer les stores manquants
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
                const store = upgradeDb.createObjectStore(STORE_SESSIONS_HISTORY, { keyPath: 'id', autoIncrement: true });
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

/**
 * Charge les matières depuis IndexedDB
 */
export const loadSubjectsFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return [];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SUBJECTS], 'readonly');
    const store = transaction.objectStore(STORE_SUBJECTS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(new Error('Erreur lors du chargement des matières'));
    };
  });
};

/**
 * Sauvegarde les matières dans IndexedDB (avec retry et transaction atomique)
 */
export const saveSubjectsToIndexedDB = async (db, subjects, userId = 'main') => {
  if (!db) return;

  return retryIndexedDB(async () => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SUBJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_SUBJECTS);

      // Gérer les erreurs de transaction
      transaction.onerror = () => {
        reject(new Error('Erreur transaction IndexedDB'));
      };

      transaction.oncomplete = () => {
        resolve();
      };

      // Vider le store puis ajouter toutes les matières
      store.clear().onsuccess = () => {
        let completed = 0;
        const total = subjects.length;

        if (total === 0) {
          resolve();
          return;
        }

        subjects.forEach((subject) => {
          const request = store.add(subject);
          request.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
          request.onerror = () => {
            reject(new Error(`Erreur lors de la sauvegarde de la matière ${subject.id}`));
          };
        });
      };

      store.clear().onerror = () => {
        reject(new Error('Erreur lors du vidage du store'));
      };
    });
  });
};

/**
 * Charge la progression depuis IndexedDB
 */
export const loadProgressionFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROGRESSION], 'readonly');
    const store = transaction.objectStore(STORE_PROGRESSION);
    const request = store.get(userId);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      reject(new Error('Erreur lors du chargement de la progression'));
    };
  });
};

/**
 * Sauvegarde la progression dans IndexedDB
 */
export const saveProgressionToIndexedDB = async (db, progressionData, userId = 'main') => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROGRESSION], 'readwrite');
    const store = transaction.objectStore(STORE_PROGRESSION);
    const request = store.put({ userId, data: progressionData, updatedAt: Date.now() });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Erreur lors de la sauvegarde de la progression'));
    };
  });
};

/**
 * Charge l'historique des sessions depuis IndexedDB
 */
export const loadSessionsHistoryFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_SESSIONS_HISTORY);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const sessions = request.result || [];
      // Trier par date décroissante
      sessions.sort((a, b) => b.startTime - a.startTime);
      resolve(sessions);
    };

    request.onerror = () => {
      reject(new Error('Erreur lors du chargement de l\'historique'));
    };
  });
};

/**
 * Sauvegarde l'historique des sessions dans IndexedDB
 */
export const saveSessionsHistoryToIndexedDB = async (db, sessions, userId = 'main') => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_SESSIONS_HISTORY);

    // Vider le store puis ajouter toutes les sessions
    store.clear().onsuccess = () => {
      let completed = 0;
      const total = sessions.length;

      if (total === 0) {
        resolve();
        return;
      }

      sessions.forEach((session) => {
        const sessionWithUserId = { ...session, userId };
        const request = store.add(sessionWithUserId);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(new Error(`Erreur lors de la sauvegarde de la session ${session.id}`));
        };
      });
    };
  });
};

/**
 * Charge le planificateur depuis IndexedDB
 */
export const loadPlannerFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PLANNER], 'readonly');
    const store = transaction.objectStore(STORE_PLANNER);
    const request = store.get(userId);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      reject(new Error('Erreur lors du chargement du planificateur'));
    };
  });
};

/**
 * Sauvegarde le planificateur dans IndexedDB
 */
export const savePlannerToIndexedDB = async (db, plannerData, userId = 'main') => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PLANNER], 'readwrite');
    const store = transaction.objectStore(STORE_PLANNER);
    const request = store.put({ userId, data: plannerData, updatedAt: Date.now() });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Erreur lors de la sauvegarde du planificateur'));
    };
  });
};

/**
 * Charge l'état du timer depuis IndexedDB
 */
export const loadTimerFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TIMER], 'readonly');
    const store = transaction.objectStore(STORE_TIMER);
    const request = store.get(userId);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      reject(new Error('Erreur lors du chargement du timer'));
    };
  });
};

/**
 * Sauvegarde l'état du timer dans IndexedDB
 */
export const saveTimerToIndexedDB = async (db, timerData, userId = 'main') => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TIMER], 'readwrite');
    const store = transaction.objectStore(STORE_TIMER);
    const request = store.put({ userId, data: timerData, updatedAt: Date.now() });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Erreur lors de la sauvegarde du timer'));
    };
  });
};

/**
 * Vide tous les stores Apprentissage
 */
export const clearApprentissageStores = async (db, userId = 'main') => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_SUBJECTS, STORE_PROGRESSION, STORE_SESSIONS_HISTORY, STORE_PLANNER, STORE_TIMER],
      'readwrite'
    );

    let completed = 0;
    const total = 5;

    const checkComplete = () => {
      completed++;
      if (completed === total) {
        resolve();
      }
    };

    transaction.objectStore(STORE_SUBJECTS).clear().onsuccess = checkComplete;
    transaction.objectStore(STORE_PROGRESSION).delete(userId).onsuccess = checkComplete;
    transaction.objectStore(STORE_SESSIONS_HISTORY).openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.userId === userId) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        checkComplete();
      }
    };
    transaction.objectStore(STORE_PLANNER).delete(userId).onsuccess = checkComplete;
    transaction.objectStore(STORE_TIMER).delete(userId).onsuccess = checkComplete;

    transaction.onerror = () => {
      reject(new Error('Erreur lors du vidage des stores'));
    };
  });
};
