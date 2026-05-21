/**
 * ✅ PHASE 1.1 : Utilitaires généraux pour la gestion des données Garmin
 * ✅ PHASE 1.5 : Amélioration gestion erreurs avec retry automatique
 * 
 * Ce module contient les fonctions et constantes de base partagées par tous les modules Garmin :
 * - Configuration IndexedDB (constantes, ouverture DB)
 * - Helpers localStorage (fallback)
 * - Queue de sauvegarde (évite race conditions)
 * - Retry automatique pour erreurs transitoires
 * 
 * @module garminDataUtils
 */

import { retryWithBackoff } from './garminRetryUtils';
import { logIndexedDBError, isTransientError } from './garminErrorHandler';
import logger from '../utils/logger';
import {
  DB_NAME,
  DB_VERSION,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  STORE_DEVICE_META,
  STORE_FORCED_RANGES,
  STORE_TELEMETRY_HISTORY,
  STORE_AUTO_SYNC_HISTORY,
  applyGarminSchemaUpgrade,
} from '../services/garmin/garminDbGateway.js';

const log = logger.module('garminDataUtils');

export {
  DB_NAME,
  DB_VERSION,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  STORE_DEVICE_META,
  STORE_FORCED_RANGES,
  STORE_TELEMETRY_HISTORY,
  STORE_AUTO_SYNC_HISTORY,
};

// ==================== ÉTAT GLOBAL ====================

/**
 * Instance de la base de données IndexedDB (singleton)
 * @type {IDBDatabase|null}
 */
let dbInstance = null;

/**
 * Flag indiquant si on utilise le fallback localStorage
 * @type {boolean}
 */
let useFallback = false;
let garminScope = 'main';

/**
 * Récupère l'état du fallback
 * @returns {boolean} True si fallback localStorage activé
 */
export const getUseFallback = () => useFallback;

/**
 * Définit l'état du fallback
 * @param {boolean} value - Nouvel état du fallback
 */
export const setUseFallback = (value) => {
  useFallback = value;
};

export const getGarminScope = () => garminScope;

export const setGarminScope = (scope) => {
  garminScope = scope || 'main';
};

export const isLegacyMainRecord = (record) => {
  const uid = record?.userId;
  return uid == null || uid === '' || uid === 'main';
};

export const recordBelongsToCurrentScope = (record) => {
  const scope = getGarminScope();
  if (scope === 'main') {
    return record?.userId === 'main' || isLegacyMainRecord(record);
  }
  return record?.userId === scope;
};

/**
 * Récupère l'instance de la base de données
 * @returns {IDBDatabase|null} Instance de la DB ou null si fallback
 */
export const getDbInstance = () => dbInstance;

/**
 * Définit l'instance de la base de données
 * @param {IDBDatabase|null} instance - Instance de la DB
 */
export const setDbInstance = (instance) => {
  dbInstance = instance;
};

// ==================== QUEUE DE SAUVEGARDE ====================

/**
 * Queue de sauvegarde pour éviter les race conditions
 * Les opérations de sauvegarde sont traitées séquentiellement
 * @type {Array<{fn: Function}>}
 */
const saveQueue = [];

/**
 * Flag indiquant si une sauvegarde est en cours
 * @type {boolean}
 */
let isSaving = false;

/**
 * Traite la queue de sauvegarde de manière séquentielle
 * Évite les race conditions lors de sauvegardes simultanées
 * 
 * @returns {Promise<void>} Promise résolue quand la queue est vide
 */
export const processSaveQueue = async () => {
  if (isSaving || saveQueue.length === 0) return;
  
  isSaving = true;
  try {
    const item = saveQueue.shift();
    if (item && item.fn) {
      await item.fn();
    }
  } catch (err) {
    console.error('[GarminDataUtils] Error in save queue:', err);
  } finally {
    isSaving = false;
    // Traiter le prochain item si la queue n'est pas vide
    if (saveQueue.length > 0) {
      // Utiliser setTimeout pour permettre au thread principal de respirer
      setTimeout(() => processSaveQueue(), 0);
    }
  }
};

/**
 * Ajoute une fonction à la queue de sauvegarde
 * 
 * @param {Function} fn - Fonction de sauvegarde à exécuter
 * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
 */
export const enqueueSave = (fn) => {
  return new Promise((resolve, reject) => {
    saveQueue.push({
      fn: async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }
    });
    processSaveQueue();
  });
};

/**
 * Attend la fin de la file de sauvegarde Garmin (backfill / sync).
 * @param {number} [timeoutMs=15000]
 */
export const flushGarminSaveQueue = (timeoutMs = 15000) =>
  new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (!isSaving && saveQueue.length === 0) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        console.warn('[GarminDataUtils] flushGarminSaveQueue timeout');
        resolve();
        return;
      }
      void processSaveQueue();
      setTimeout(tick, 40);
    };
    tick();
  });

// ==================== HELPERS LOCALSTORAGE (FALLBACK) ====================

/**
 * Génère une clé de stockage localStorage pour un store et une clé donnés
 * 
 * @param {string} store - Nom du store (STORE_ACTIVITIES, STORE_DAILY_METRICS, etc.)
 * @param {string} key - Clé de l'élément
 * @returns {string} Clé complète pour localStorage
 * 
 * @example
 * getStorageKey(STORE_ACTIVITIES, '12345') // 'garmin_activities_12345'
 */
export const getStorageKey = (store, key) => `garmin_${getGarminScope()}_${store}_${key}`;

/**
 * Récupère toutes les clés d'un store depuis localStorage
 * 
 * @param {string} store - Nom du store
 * @returns {Array<string>} Liste des clés (sans le préfixe 'garmin_${store}_')
 * 
 * @example
 * getAllStorageKeys(STORE_ACTIVITIES) // ['12345', '67890', ...]
 */
export const getAllStorageKeys = (store) => {
  const keys = [];
  const prefix = `garmin_${getGarminScope()}_${store}_`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      // Retirer le préfixe pour obtenir la clé originale
      keys.push(key.replace(prefix, ''));
    }
  }
  
  return keys;
};

/**
 * Clé bucket pour stockage groupé localStorage
 * @param {string} store
 * @returns {string}
 */
const getStorageBucketKey = (store) => `garmin_${store}_bucket`;
const getScopedStorageBucketKey = (store) => `garmin_${getGarminScope()}_${store}_bucket`;

/**
 * Lit le bucket localStorage (stockage groupé) pour un store donné
 * @param {string} store
 * @returns {Object} Objet clé/valeur ou {} si vide
 */
export const readStorageBucket = (store) => {
  try {
    const raw = localStorage.getItem(getScopedStorageBucketKey(store));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {};
  } catch (err) {
    log.warn('[garminDataUtils] readStorageBucket parse error:', { store, err });
    return {};
  }
};

/**
 * Écrit le bucket localStorage pour un store donné
 * @param {string} store
 * @param {Object} data
 */
export const writeStorageBucket = (store, data) => {
  try {
    localStorage.setItem(getScopedStorageBucketKey(store), JSON.stringify(data));
  } catch (err) {
    log.error('[garminDataUtils] writeStorageBucket error:', { store, err });
    throw err;
  }
};

/**
 * Supprime le bucket localStorage pour un store donné
 * @param {string} store
 */
export const deleteStorageBucket = (store) => {
  localStorage.removeItem(getScopedStorageBucketKey(store));
};

// ==================== OUVERTURE INDEXEDDB ====================

/**
 * Fonction interne pour ouvrir IndexedDB (sans retry)
 * Utilisée par openDB() avec retry automatique
 * 
 * ✅ PHASE 1.5 : Extrait la logique d'ouverture pour permettre retry
 * 
 * @returns {Promise<IDBDatabase>} Instance de la DB
 * @throws {DOMException} Si erreur ouverture
 */
const openDBInternal = () => {
  return new Promise((resolve, reject) => {
    // Si instance déjà ouverte, la retourner directement
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Gestion erreur ouverture
      request.onerror = (event) => {
        const error = event.target.error;
        reject(error); // Reject pour permettre retry
      };

      // Succès ouverture
      request.onsuccess = () => {
        dbInstance = request.result;
        
        // Vérifier que la DB est vraiment prête
        if (!dbInstance) {
          reject(new Error('DB instance invalide après ouverture'));
          return;
        }
        
        log.debug('[openDB] IndexedDB opened successfully');
        resolve(dbInstance);
      };

      // Création/mise à jour de la structure (onupgradeneeded)
      request.onupgradeneeded = (event) => {
        try {
          applyGarminSchemaUpgrade(event, log);
        } catch (upgradeError) {
          log.error('[openDB] Upgrade error:', upgradeError);
          reject(upgradeError);
        }
      };

      // Gestion blocage (autre onglet avec version plus ancienne)
      request.onblocked = () => {
        log.warn('[openDB] IndexedDB blocked by another tab');
        // Ne pas reject, attendre que l'autre onglet ferme
        // Le retry gérera cela
      };
    } catch (err) {
      log.error('[openDB] Error in openDBInternal:', err);
      reject(err);
    }
  });
};

/**
 * Ouvre la base de données IndexedDB avec retry automatique et fallback
 * 
 * ✅ PHASE 1.5 : Retry automatique pour erreurs transitoires
 * 
 * Cette fonction :
 * - Vérifie le support IndexedDB
 * - Ouvre la DB avec retry automatique pour erreurs transitoires
 * - Gère les erreurs avec fallback automatique vers localStorage
 * - Utilise un singleton pour éviter multiples ouvertures
 * 
 * @returns {Promise<IDBDatabase|null>} Instance de la DB ou null si fallback
 * 
 * @example
 * const db = await openDB();
 * if (db) {
 *   // Utiliser IndexedDB
 * } else {
 *   // Utiliser localStorage fallback
 * }
 */
export const openDB = async () => {
  // Vérifier support IndexedDB
  if (!window.indexedDB) {
    log.warn('[openDB] IndexedDB non supporté, utilisation du fallback localStorage');
    useFallback = true;
    return null; // Retourner null pour indiquer fallback
  }

  // Si instance déjà ouverte, la retourner directement
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // ✅ PHASE 1.5 : Retry automatique pour erreurs transitoires
    const db = await retryWithBackoff(
      () => openDBInternal(),
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 2000,
        context: {
          operation: 'openDB',
          dbName: DB_NAME,
          dbVersion: DB_VERSION
        }
      }
    );
    
    return db;
    
  } catch (error) {
    // Erreur après retry : log détaillé et fallback
    logIndexedDBError(error, {
      operation: 'openDB',
      dbName: DB_NAME,
      dbVersion: DB_VERSION
    }, 'error');
    
    log.warn('[openDB] Basculement vers localStorage fallback après retry');
    useFallback = true;
    return null; // Fallback plutôt que throw
  }
};

/**
 * Ferme la connexion à la base de données
 * Utile pour nettoyage ou tests
 * 
 * @returns {Promise<void>} Promise résolue quand la DB est fermée
 */
export const closeDB = () => {
  return new Promise((resolve) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    resolve();
  });
};

/**
 * Réinitialise l'état global (utile pour tests)
 * 
 * @returns {void}
 */
export const resetGlobalState = () => {
  dbInstance = null;
  useFallback = false;
  saveQueue.length = 0;
  isSaving = false;
};

