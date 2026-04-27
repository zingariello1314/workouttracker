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

const log = logger.module('garminDataUtils');

// ==================== CONSTANTES INDEXEDDB ====================

/**
 * Nom de la base de données IndexedDB pour Garmin
 * @constant {string}
 */
export const DB_NAME = 'GarminDataDB';

/**
 * Version de la base de données IndexedDB
 * @constant {number}
 * 
 * Version 4 : Ajout d'indexes supplémentaires pour optimiser les requêtes
 * - Index `lastSyncTimestamp` sur activities pour requêtes par date de sync
 * - Index `timestamp` sur activities pour requêtes temporelles
 * - Index `lastSync` sur dailyMetrics pour requêtes par date de sync
 * Version 5 : Ajout du store autoSyncHistory pour l'historique des déclenchements AutoSync
 */
export const DB_VERSION = 5;

/**
 * Nom de l'object store pour les activités
 * @constant {string}
 */
export const STORE_ACTIVITIES = 'activities';

/**
 * Nom de l'object store pour les métriques quotidiennes
 * @constant {string}
 */
export const STORE_DAILY_METRICS = 'dailyMetrics';

/**
 * Nom de l'object store pour les métadonnées du device
 * @constant {string}
 */
export const STORE_DEVICE_META = 'deviceMeta';

/**
 * Nom de l'object store pour l'historique des plages forcées
 * @constant {string}
 */
export const STORE_FORCED_RANGES = 'forcedRangesHistory';

/**
 * Nom de l'object store pour l'historique télémétrie
 * @constant {string}
 */
export const STORE_TELEMETRY_HISTORY = 'telemetryHistory';

/**
 * Nom de l'object store pour l'historique AutoSync
 * @constant {string}
 */
export const STORE_AUTO_SYNC_HISTORY = 'autoSyncHistory';

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
          const db = event.target.result;

          // Store: activities (index: date, type, date_type, lastSyncTimestamp, timestamp)
          let activityStore;
          if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
            activityStore = db.createObjectStore(STORE_ACTIVITIES, { 
              keyPath: 'id', 
              autoIncrement: false 
            });
            // Index sur date pour requêtes par plage
            activityStore.createIndex('date', 'date', { unique: false });
            // Index sur type pour filtrage
            activityStore.createIndex('type', 'type', { unique: false });
            // Index composite pour requêtes combinées
            activityStore.createIndex('date_type', ['date', 'type'], { unique: false });
          } else {
            activityStore = event.target.transaction.objectStore(STORE_ACTIVITIES);
          }
          
          // ✅ Version 4 : Ajouter indexes supplémentaires si absents
          const activityIndexNames = Array.from(activityStore.indexNames);
          if (!activityIndexNames.includes('lastSyncTimestamp')) {
            try {
              activityStore.createIndex('lastSyncTimestamp', 'lastSyncTimestamp', { unique: false });
              log.debug('[openDB] Index lastSyncTimestamp créé sur activities');
            } catch (err) {
              log.warn('[openDB] Erreur création index lastSyncTimestamp:', err);
            }
          }
          if (!activityIndexNames.includes('timestamp')) {
            try {
              activityStore.createIndex('timestamp', 'timestamp', { unique: false });
              log.debug('[openDB] Index timestamp créé sur activities');
            } catch (err) {
              log.warn('[openDB] Erreur création index timestamp:', err);
            }
          }

          // Store: dailyMetrics (index: date unique, lastSync)
          let metricsStore;
          if (!db.objectStoreNames.contains(STORE_DAILY_METRICS)) {
            metricsStore = db.createObjectStore(STORE_DAILY_METRICS, { 
              keyPath: 'date', 
              autoIncrement: false 
            });
            // Index unique sur date pour accès rapide
            metricsStore.createIndex('date', 'date', { unique: true });
          } else {
            metricsStore = event.target.transaction.objectStore(STORE_DAILY_METRICS);
          }
          
          // ✅ Version 4 : Ajouter index lastSync si absent
          const metricsIndexNames = Array.from(metricsStore.indexNames);
          if (!metricsIndexNames.includes('lastSync')) {
            try {
              metricsStore.createIndex('lastSync', 'lastSync', { unique: false });
              log.debug('[openDB] Index lastSync créé sur dailyMetrics');
            } catch (err) {
              log.warn('[openDB] Erreur création index lastSync:', err);
            }
          }

          // Store: deviceMeta (métadonnées)
          if (!db.objectStoreNames.contains(STORE_DEVICE_META)) {
            db.createObjectStore(STORE_DEVICE_META, { 
              keyPath: 'key', 
              autoIncrement: false 
            });
          }

          // Store: forcedRangesHistory (historique synchronisations forcées)
          if (!db.objectStoreNames.contains(STORE_FORCED_RANGES)) {
            const forcedStore = db.createObjectStore(STORE_FORCED_RANGES, {
              keyPath: 'id',
              autoIncrement: true
            });
            forcedStore.createIndex('triggeredAt', 'triggeredAt', { unique: false });
            forcedStore.createIndex('mode', 'mode', { unique: false });
            forcedStore.createIndex('start', 'start', { unique: false });
            forcedStore.createIndex('end', 'end', { unique: false });
          }

          // Store: telemetryHistory (persist snapshots)
          if (!db.objectStoreNames.contains(STORE_TELEMETRY_HISTORY)) {
            const telemetryStore = db.createObjectStore(STORE_TELEMETRY_HISTORY, {
              keyPath: 'timestamp',
              autoIncrement: false
            });
            telemetryStore.createIndex('timestamp', 'timestamp', { unique: true });
          }

          // ✅ Tâche 13 : Store pour l'historique AutoSync
          if (!db.objectStoreNames.contains(STORE_AUTO_SYNC_HISTORY)) {
            const autoSyncStore = db.createObjectStore(STORE_AUTO_SYNC_HISTORY, {
              keyPath: 'id',
              autoIncrement: false
            });
            autoSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
            autoSyncStore.createIndex('triggerType', 'triggerType', { unique: false });
            autoSyncStore.createIndex('result', 'result', { unique: false });
          }
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

