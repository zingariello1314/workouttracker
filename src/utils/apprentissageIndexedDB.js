/**
 * Stockage avancé Apprentissage dans IndexedDB (WorkoutTrackerDB)
 * Implémentation alignée sur quietQuestIndexedDB.js et useWorkoutData.openDB
 * Fallback automatique vers localStorage si IndexedDB indisponible
 * Avec retry automatique et transactions atomiques
 * Ouverture / schéma : `services/apprentissage/apprentissageDbGateway.js`
 */

import { retryIndexedDB } from './apprentissageRetry';
import {
  openApprentissageDB,
  STORE_APPRENTISSAGE_SUBJECTS as STORE_SUBJECTS,
  STORE_APPRENTISSAGE_PROGRESSION as STORE_PROGRESSION,
  STORE_APPRENTISSAGE_SESSIONS_HISTORY as STORE_SESSIONS_HISTORY,
  STORE_APPRENTISSAGE_PLANNER as STORE_PLANNER,
  STORE_APPRENTISSAGE_TIMER as STORE_TIMER,
} from '../services/apprentissage/apprentissageDbGateway.js';

export { openApprentissageDB };

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
