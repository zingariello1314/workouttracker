// Stockage avancé QuietQuest dans IndexedDB (WorkoutTrackerDB)
// Implémentation alignée sur booksIndexedDB.js et useWorkoutData.openDB
// Fallback automatique vers localStorage si IndexedDB indisponible

const DB_NAME = 'WorkoutTrackerDB';

// Noms des object stores
const STORE_QUESTS = 'quietquest_quests';
const STORE_VALIDATIONS = 'quietquest_validations';
const STORE_USER_DATA = 'quietquest_user_data';
const STORE_DAILY_PERFORMANCES = 'quietquest_daily_performances';
const STORE_APP_STATE = 'quietquest_app_state';

/** Enregistrements sans userId (legacy) : rattachés au profil unique `main`. */
const recordBelongsToUser = (record, userId) => {
  const uid = record?.userId;
  return uid === userId || uid == null || uid === '';
};

/**
 * Ouvre la base WorkoutTrackerDB et garantit l'existence des stores QuietQuest.
 * Retourne null si IndexedDB n'est pas disponible ou en cas d'échec non récupérable.
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

      // Store : quietquest_quests
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
        // Ajouter index userId si absent (migration)
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

      // Store : quietquest_validations
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

      // Store : quietquest_user_data
      if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_user_data"');
        db.createObjectStore(STORE_USER_DATA, { keyPath: 'userId' });
      }

      // Store : quietquest_daily_performances
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

      // Store : quietquest_app_state
      if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
        console.log('[quietQuestIndexedDB] Création du store "quietquest_app_state"');
        db.createObjectStore(STORE_APP_STATE, { keyPath: 'userId' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Vérifier que tous les stores existent
      const requiredStores = [
        STORE_QUESTS,
        STORE_VALIDATIONS,
        STORE_USER_DATA,
        STORE_DAILY_PERFORMANCES,
        STORE_APP_STATE,
      ];
      const missingStores = requiredStores.filter(
        (name) => !db.objectStoreNames.contains(name)
      );

      if (missingStores.length > 0) {
        console.warn(
          `[quietQuestIndexedDB] ⚠️ Stores manquants: ${missingStores.join(', ')}. Forcer upgrade...`
        );
        const currentVersion = db.version;
        db.close();
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = e.target.result;
          // Recréer les stores manquants
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
              // Recréer tous les stores
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

/**
 * Charge toutes les quêtes depuis IndexedDB
 */
export const loadQuestsFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return [];
  try {
    const transaction = db.transaction([STORE_QUESTS], 'readonly');
    const store = transaction.objectStore(STORE_QUESTS);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const filtered = all.filter((q) => recordBelongsToUser(q, userId));
        resolve(Array.isArray(filtered) ? filtered : []);
      };
      request.onerror = () => reject(new Error('Erreur chargement quêtes'));
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur loadQuests:', error);
    return [];
  }
};

/**
 * Sauvegarde toutes les quêtes dans IndexedDB (remplace tout)
 */
export const saveQuestsToIndexedDB = async (db, quests, userId = 'main') => {
  if (!db || !Array.isArray(quests)) return;
  try {
    const transaction = db.transaction([STORE_QUESTS], 'readwrite');
    const store = transaction.objectStore(STORE_QUESTS);

    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (recordBelongsToUser(cursor.value, userId)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    quests.forEach((quest) => {
      const questWithUserId = { ...quest, userId };
      store.put(questWithUserId);
    });

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur saveQuests:', error);
    throw error;
  }
};

/**
 * Charge toutes les validations depuis IndexedDB
 */
export const loadValidationsFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return [];
  try {
    const transaction = db.transaction([STORE_VALIDATIONS], 'readonly');
    const store = transaction.objectStore(STORE_VALIDATIONS);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const filtered = all.filter((v) => recordBelongsToUser(v, userId));
        resolve(Array.isArray(filtered) ? filtered : []);
      };
      request.onerror = () => reject(new Error('Erreur chargement validations'));
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur loadValidations:', error);
    return [];
  }
};

/**
 * Sauvegarde toutes les validations dans IndexedDB (remplace tout)
 */
export const saveValidationsToIndexedDB = async (db, validations, userId = 'main') => {
  if (!db || !Array.isArray(validations)) return;
  try {
    const transaction = db.transaction([STORE_VALIDATIONS], 'readwrite');
    const store = transaction.objectStore(STORE_VALIDATIONS);

    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (recordBelongsToUser(cursor.value, userId)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    validations.forEach((validation) => {
      const validationWithUserId = { ...validation, userId };
      store.put(validationWithUserId);
    });

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur saveValidations:', error);
    throw error;
  }
};

/**
 * Charge les données utilisateur depuis IndexedDB
 */
export const loadUserDataFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return null;
  try {
    const transaction = db.transaction([STORE_USER_DATA], 'readonly');
    const store = transaction.objectStore(STORE_USER_DATA);
    const request = store.get(userId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Retirer userId du résultat
          const { userId: _, ...userData } = result;
          resolve(userData);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Erreur chargement userData'));
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur loadUserData:', error);
    return null;
  }
};

/**
 * Sauvegarde les données utilisateur dans IndexedDB
 */
export const saveUserDataToIndexedDB = async (db, userData, userId = 'main') => {
  if (!db || !userData) return;
  try {
    const transaction = db.transaction([STORE_USER_DATA], 'readwrite');
    const store = transaction.objectStore(STORE_USER_DATA);
    const dataWithUserId = { ...userData, userId };
    store.put(dataWithUserId);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur saveUserData:', error);
    throw error;
  }
};

/**
 * Charge toutes les performances quotidiennes depuis IndexedDB
 */
export const loadDailyPerformancesFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return [];
  try {
    const transaction = db.transaction([STORE_DAILY_PERFORMANCES], 'readonly');
    const store = transaction.objectStore(STORE_DAILY_PERFORMANCES);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const filtered = all.filter((d) => recordBelongsToUser(d, userId));
        const cleaned = filtered.map(({ userId: _, ...rest }) => rest);
        resolve(Array.isArray(cleaned) ? cleaned : []);
      };
      request.onerror = () => reject(new Error('Erreur chargement dailyPerformances'));
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur loadDailyPerformances:', error);
    return [];
  }
};

/**
 * Sauvegarde toutes les performances quotidiennes dans IndexedDB (remplace tout)
 */
export const saveDailyPerformancesToIndexedDB = async (
  db,
  performances,
  userId = 'main'
) => {
  if (!db || !Array.isArray(performances)) return;
  try {
    const transaction = db.transaction([STORE_DAILY_PERFORMANCES], 'readwrite');
    const store = transaction.objectStore(STORE_DAILY_PERFORMANCES);

    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (recordBelongsToUser(cursor.value, userId)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    performances.forEach((perf) => {
      const perfWithUserId = { ...perf, userId };
      store.put(perfWithUserId);
    });

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur saveDailyPerformances:', error);
    throw error;
  }
};

/**
 * Charge l'état de l'app depuis IndexedDB
 */
export const loadAppStateFromIndexedDB = async (db, userId = 'main') => {
  if (!db) return null;
  try {
    const transaction = db.transaction([STORE_APP_STATE], 'readonly');
    const store = transaction.objectStore(STORE_APP_STATE);
    const request = store.get(userId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { userId: _, ...appState } = result;
          resolve(appState);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Erreur chargement appState'));
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur loadAppState:', error);
    return null;
  }
};

/**
 * Sauvegarde l'état de l'app dans IndexedDB
 */
export const saveAppStateToIndexedDB = async (db, appState, userId = 'main') => {
  if (!db || !appState) return;
  try {
    const transaction = db.transaction([STORE_APP_STATE], 'readwrite');
    const store = transaction.objectStore(STORE_APP_STATE);
    const dataWithUserId = { ...appState, userId };
    store.put(dataWithUserId);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur saveAppState:', error);
    throw error;
  }
};

/**
 * Vide tous les stores QuietQuest (pour reset/import)
 */
const clearStoreByUserCursor = (store, userId) =>
  new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onerror = () => reject(request.error);
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (recordBelongsToUser(cursor.value, userId)) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
  });

export const clearQuietQuestStores = async (db, userId = 'main') => {
  if (!db) return;
  try {
    const stores = [
      STORE_QUESTS,
      STORE_VALIDATIONS,
      STORE_USER_DATA,
      STORE_DAILY_PERFORMANCES,
      STORE_APP_STATE,
    ];
    
    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      if (storeName === STORE_USER_DATA || storeName === STORE_APP_STATE) {
        // Stores avec keyPath userId : supprimer seulement l'entrée de l'utilisateur
        await new Promise((resolve, reject) => {
          const deleteReq = store.delete(userId);
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
        });
      } else {
        // Inclut les enregistrements sans userId (legacy) pour ce profil
        await clearStoreByUserCursor(store, userId);
      }
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  } catch (error) {
    console.error('[quietQuestIndexedDB] Erreur clearStores:', error);
    throw error;
  }
};

