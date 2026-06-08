/**
 * ✅ PHASE 3.4 : Service Cache Persistant IndexedDB pour Pagination Photos
 * 
 * Système de cache persistant qui survit aux rechargements de page
 * - Sauvegarde cache LRU dans IndexedDB
 * - Chargement automatique au démarrage
 * - Éviction LRU gérée dans IndexedDB
 * - Invalidation intelligente
 * 
 * Performance:
 * - Cache persiste entre sessions
 * - Navigation instantanée pages déjà visitées
 * - Réduction charge serveur/mémoire
 * 
 * Architecture:
 * - ObjectStore dédié dans WorkoutTrackerDB
 * - Clé composite: `${page}_${filterBy}`
 * - Métadonnées: timestamp, accessTime, size
 */

import logger from '../../../utils/logger';
import {
  PHOTO_PAGINATION_CACHE_DB_NAME,
  PHOTO_PAGINATION_CACHE_STORE,
  applyPhotoPaginationCacheStoreUpgrade,
} from '../../../services/workout/photoPaginationCacheDbGateway.js';

const log = logger.module('photoPaginationCache');

/**
 * Configuration du cache
 */
const CACHE_CONFIG = {
  DB_NAME: PHOTO_PAGINATION_CACHE_DB_NAME,
  STORE_NAME: PHOTO_PAGINATION_CACHE_STORE,
  // ✅ Ne pas spécifier de version pour utiliser version existante
  // Le store sera créé lors de l'upgrade si nécessaire
  MAX_CACHE_SIZE: 20, // Nombre max de pages en cache (IndexedDB)
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
  BATCH_SAVE_DELAY: 500 // Délai debounce pour sauvegarde batch (ms)
};

/**
 * Instance singleton pour connexion DB
 */
let dbInstance = null;
let dbOpenPromise = null;

/**
 * ✅ Ouvrir connexion IndexedDB avec gestion robuste
 */
const openDB = () => {
  // Retourner promise existante si déjà en cours
  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  // Retourner instance si déjà ouverte
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      log.warn('IndexedDB non supporté, cache désactivé');
      resolve(null);
      return;
    }

    // ✅ Ouvrir DB existante sans spécifier version (utilise version actuelle)
    // Si le store n'existe pas, on le créera via upgrade
    const request = indexedDB.open(CACHE_CONFIG.DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion || 0;

      log.debug(`Upgrade IndexedDB v${oldVersion} → v${db.version}`);

      applyPhotoPaginationCacheStoreUpgrade(db, event, log);
    };

    request.onsuccess = async (event) => {
      const db = event.target.result;
      
      // ✅ Vérifier si le store existe, sinon forcer upgrade
      if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_NAME)) {
        log.debug(`Store "${CACHE_CONFIG.STORE_NAME}" manquant, forcer upgrade...`);
        db.close();
        
        // Forcer upgrade en incrémentant version
        const newVersion = db.version + 1;
        const upgradeRequest = indexedDB.open(CACHE_CONFIG.DB_NAME, newVersion);
        
        upgradeRequest.onupgradeneeded = (upgradeEvent) => {
          const upgradeDb = upgradeEvent.target.result;
          applyPhotoPaginationCacheStoreUpgrade(upgradeDb, upgradeEvent, log);
        };
        
        upgradeRequest.onsuccess = (upgradeEvent) => {
          const upgradeDb = upgradeEvent.target.result;
          dbInstance = upgradeDb;
          dbOpenPromise = null;
          log.debug(`✅ IndexedDB ouverte avec upgrade: ${upgradeDb.name} v${upgradeDb.version}`);
          resolve(upgradeDb);
        };
        
        upgradeRequest.onerror = (upgradeEvent) => {
          log.error('Erreur upgrade IndexedDB', upgradeEvent.target.error);
          dbOpenPromise = null;
          resolve(null);
        };
        
        return;
      }

      dbInstance = db;
      dbOpenPromise = null;
      log.debug(`✅ IndexedDB ouverte: ${db.name} v${db.version}`);
      resolve(db);
    };

    request.onerror = (event) => {
      log.error('Erreur ouverture IndexedDB', event.target.error);
      dbOpenPromise = null;
      resolve(null); // Résoudre avec null pour fallback gracieux
    };

    request.onblocked = () => {
      log.warn('IndexedDB bloquée, attente...');
    };
  });

  return dbOpenPromise;
};

/**
 * ✅ Charger cache depuis IndexedDB
 * @returns {Promise<Map<string, object>>} Map des pages en cache
 */
export const loadCacheFromDB = async () => {
  try {
    const db = await openDB();
    if (!db) {
      log.debug('IndexedDB non disponible, cache vide');
      return new Map();
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readonly');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cache = new Map();
        const now = Date.now();

        // Filtrer entrées expirées et construire Map
        request.result.forEach((entry) => {
          // Vérifier expiration
          const age = now - entry.timestamp;
          if (age > CACHE_CONFIG.MAX_CACHE_AGE) {
            log.debug(`Cache expiré supprimé: ${entry.key} (âge: ${Math.round(age / 1000 / 60)} min)`);
            return; // Ignorer entrée expirée
          }

          // Valider structure
          if (entry.key && entry.data && entry.data.photos) {
            cache.set(entry.key, {
              photos: entry.data.photos,
              totalPhotos: entry.data.totalPhotos,
              timestamp: entry.timestamp,
              accessTime: entry.accessTime || entry.timestamp
            });
          } else {
            log.warn(`Entrée cache invalide ignorée: ${entry.key}`);
          }
        });

        log.debug(`✅ Cache chargé: ${cache.size} pages depuis IndexedDB`);
        resolve(cache);
      };

      request.onerror = () => {
        log.error('Erreur chargement cache IndexedDB', request.error);
        resolve(new Map()); // Retourner cache vide en cas d'erreur
      };
    });
  } catch (error) {
    log.error('Exception chargement cache IndexedDB', error);
    return new Map(); // Fallback gracieux
  }
};

/**
 * ✅ Sauvegarder page dans cache IndexedDB
 * @param {string} key - Clé cache (format: `${page}_${filterBy}`)
 * @param {object} data - Données page { photos, totalPhotos }
 */
export const savePageToCache = async (key, data) => {
  try {
    const db = await openDB();
    if (!db) {
      log.debug('IndexedDB non disponible, cache non sauvegardé');
      return;
    }

    const now = Date.now();
    const entry = {
      key,
      data: {
        photos: data.photos,
        totalPhotos: data.totalPhotos
      },
      timestamp: now,
      accessTime: now
    };

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const request = store.put(entry);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        log.debug(`✅ Page sauvegardée dans cache: ${key}`);
        resolve();
      };

      request.onerror = () => {
        log.error(`Erreur sauvegarde cache: ${key}`, request.error);
        resolve(); // Ne pas rejeter pour éviter crash
      };
    });
  } catch (error) {
    log.error('Exception sauvegarde cache IndexedDB', error);
    // Ne pas rejeter pour éviter crash
  }
};

/**
 * ✅ Mettre à jour accessTime d'une page (LRU)
 * @param {string} key - Clé cache
 */
export const updateAccessTime = async (key) => {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const getRequest = store.get(key);

    return new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (!entry) {
          resolve();
          return;
        }

        // Mettre à jour accessTime
        entry.accessTime = Date.now();
        const putRequest = store.put(entry);

        putRequest.onsuccess = () => {
          log.debug(`✅ AccessTime mis à jour: ${key}`);
          resolve();
        };

        putRequest.onerror = () => {
          log.error(`Erreur mise à jour accessTime: ${key}`, putRequest.error);
          resolve();
        };
      };

      getRequest.onerror = () => {
        resolve();
      };
    });
  } catch (error) {
    log.error('Exception mise à jour accessTime', error);
  }
};

/**
 * ✅ Éviction LRU dans IndexedDB (supprimer pages les moins récemment utilisées)
 * @param {number} maxSize - Taille max cache
 */
export const evictLRUFromDB = async (maxSize = CACHE_CONFIG.MAX_CACHE_SIZE) => {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const index = store.index('accessTime');
    const request = index.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entries = request.result;
        
        if (entries.length <= maxSize) {
          resolve();
          return;
        }

        // Trier par accessTime (plus ancien en premier)
        entries.sort((a, b) => (a.accessTime || 0) - (b.accessTime || 0));

        // Supprimer entrées excédentaires
        const toDelete = entries.slice(0, entries.length - maxSize);
        let deletedCount = 0;

        toDelete.forEach((entry) => {
          const deleteRequest = store.delete(entry.key);
          deleteRequest.onsuccess = () => {
            deletedCount++;
            if (deletedCount === toDelete.length) {
              log.debug(`✅ Éviction LRU: ${deletedCount} pages supprimées`);
              resolve();
            }
          };
          deleteRequest.onerror = () => {
            deletedCount++;
            if (deletedCount === toDelete.length) {
              resolve();
            }
          };
        });

        if (toDelete.length === 0) {
          resolve();
        }
      };

      request.onerror = () => {
        log.error('Erreur éviction LRU IndexedDB', request.error);
        resolve();
      };
    });
  } catch (error) {
    log.error('Exception éviction LRU IndexedDB', error);
  }
};

/**
 * ✅ Nettoyer cache expiré dans IndexedDB
 */
export const cleanExpiredCache = async () => {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const index = store.index('timestamp');
    const now = Date.now();
    const maxAge = CACHE_CONFIG.MAX_CACHE_AGE;

    // Récupérer toutes les entrées
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entries = request.result;
        let deletedCount = 0;
        let totalToDelete = 0;

        entries.forEach((entry) => {
          const age = now - entry.timestamp;
          if (age > maxAge) {
            totalToDelete++;
            const deleteRequest = store.delete(entry.key);
            deleteRequest.onsuccess = () => {
              deletedCount++;
              if (deletedCount === totalToDelete) {
                if (deletedCount > 0) {
                  log.debug(`✅ Cache expiré nettoyé: ${deletedCount} pages`);
                }
                resolve();
              }
            };
            deleteRequest.onerror = () => {
              deletedCount++;
              if (deletedCount === totalToDelete) {
                resolve();
              }
            };
          }
        });

        if (totalToDelete === 0) {
          resolve();
        }
      };

      request.onerror = () => {
        log.error('Erreur nettoyage cache expiré', request.error);
        resolve();
      };
    });
  } catch (error) {
    log.error('Exception nettoyage cache expiré', error);
  }
};

/**
 * ✅ Invalider cache (supprimer toutes les entrées)
 */
export const invalidateCache = async () => {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const request = store.clear();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        log.debug('✅ Cache invalidé (toutes entrées supprimées)');
        resolve();
      };

      request.onerror = () => {
        log.error('Erreur invalidation cache', request.error);
        resolve();
      };
    });
  } catch (error) {
    log.error('Exception invalidation cache', error);
  }
};

/**
 * ✅ Obtenir statistiques cache
 * @returns {Promise<object>} Stats { size, oldestAccess, newestAccess }
 */
export const getCacheStats = async () => {
  try {
    const db = await openDB();
    if (!db) {
      return { size: 0, oldestAccess: null, newestAccess: null };
    }

    const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readonly');
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entries = request.result;
        let oldestAccess = Infinity;
        let newestAccess = 0;

        entries.forEach((entry) => {
          const accessTime = entry.accessTime || entry.timestamp || 0;
          if (accessTime < oldestAccess) oldestAccess = accessTime;
          if (accessTime > newestAccess) newestAccess = accessTime;
        });

        resolve({
          size: entries.length,
          oldestAccess: oldestAccess === Infinity ? null : new Date(oldestAccess),
          newestAccess: newestAccess === 0 ? null : new Date(newestAccess)
        });
      };

      request.onerror = () => {
        resolve({ size: 0, oldestAccess: null, newestAccess: null });
      };
    });
  } catch (error) {
    log.error('Exception stats cache', error);
    return { size: 0, oldestAccess: null, newestAccess: null };
  }
};

/** Ferme la connexion longue durée sur WorkoutTrackerDB (libère les transactions sport). */
export const closePhotoPaginationCacheDb = () => {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
  dbOpenPromise = null;
};

