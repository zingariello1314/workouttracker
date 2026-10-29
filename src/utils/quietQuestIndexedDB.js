// Stockage avancé QuietQuest dans IndexedDB (WorkoutTrackerDB)
// Implémentation alignée sur booksIndexedDB.js et useWorkoutData.openDB
// Fallback automatique vers localStorage si IndexedDB indisponible
// Ouverture / schéma : `services/quietquest/quietQuestDbGateway.js`

import {
  openQuietQuestDB,
  STORE_QUIETQUEST_QUESTS as STORE_QUESTS,
  STORE_QUIETQUEST_VALIDATIONS as STORE_VALIDATIONS,
  STORE_QUIETQUEST_USER_DATA as STORE_USER_DATA,
  STORE_QUIETQUEST_DAILY_PERFORMANCES as STORE_DAILY_PERFORMANCES,
  STORE_QUIETQUEST_APP_STATE as STORE_APP_STATE,
} from '../services/quietquest/quietQuestDbGateway.js';

export { openQuietQuestDB };

/** Enregistrements sans userId (legacy) : rattachés au profil unique `main`. */
const recordBelongsToUser = (record, userId) => {
  const uid = record?.userId;
  return uid === userId || uid == null || uid === '';
};

/** Connexion fermée / en fermeture (souvent après upgrade WorkoutTrackerDB). */
export const isQuietQuestIdbClosingError = (error) => {
  if (!error) return false;
  if (error.name === 'InvalidStateError') return true;
  return /connection is closing|database connection is closing/i.test(
    String(error.message || error)
  );
};

/**
 * Teste si une connexion IDB peut encore ouvrir une transaction.
 * Évite InvalidStateError au moment du save (visibility / beforeunload).
 */
export const isQuietQuestDbWritable = (db) => {
  if (!db || typeof db.transaction !== 'function') return false;
  try {
    const names = db.objectStoreNames;
    if (!names || names.length === 0) return false;
    const storeName = names.contains(STORE_QUESTS) ? STORE_QUESTS : names[0];
    const tx = db.transaction([storeName], 'readonly');
    try {
      tx.abort();
    } catch {
      // ignore
    }
    return true;
  } catch {
    return false;
  }
};

const softFailClosingSave = (label, error) => {
  if (isQuietQuestIdbClosingError(error)) {
    console.warn(`[quietQuestIndexedDB] ${label}: connexion fermée, reportée au prochain cycle`);
    return true;
  }
  return false;
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
  if (!isQuietQuestDbWritable(db)) {
    console.warn('[quietQuestIndexedDB] saveQuests ignorée: connexion non writable');
    return;
  }
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
    if (softFailClosingSave('saveQuests', error)) return;
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
  if (!isQuietQuestDbWritable(db)) {
    console.warn('[quietQuestIndexedDB] saveValidations ignorée: connexion non writable');
    return;
  }
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
    if (softFailClosingSave('saveValidations', error)) return;
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
  if (!isQuietQuestDbWritable(db)) {
    console.warn('[quietQuestIndexedDB] saveUserData ignorée: connexion non writable');
    return;
  }
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
    if (softFailClosingSave('saveUserData', error)) return;
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
  if (!isQuietQuestDbWritable(db)) {
    console.warn('[quietQuestIndexedDB] saveDailyPerformances ignorée: connexion non writable');
    return;
  }
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
    if (softFailClosingSave('saveDailyPerformances', error)) return;
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
  if (!isQuietQuestDbWritable(db)) {
    console.warn('[quietQuestIndexedDB] saveAppState ignorée: connexion non writable');
    return;
  }
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
    if (softFailClosingSave('saveAppState', error)) return;
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

