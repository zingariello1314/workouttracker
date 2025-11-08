/**
 * ✅ PHASE 1.1 : Module de sauvegarde des données Garmin
 * ✅ PHASE 1.5 : Amélioration gestion erreurs avec retry automatique
 * 
 * Ce module contient toutes les fonctions de sauvegarde :
 * - `saveActivities` : Sauvegarde activités (swimming, jumpRope, cardio)
 * - `saveDailyMetrics` : Sauvegarde métriques quotidiennes
 * 
 * Les deux fonctions :
 * - Utilisent la queue de sauvegarde pour éviter race conditions
 * - Supportent IndexedDB avec fallback localStorage automatique
 * - Fusionnent intelligemment avec données existantes
 * - Préservent les métadonnées importantes (lastSynced, source, etc.)
 * - Retry automatique pour erreurs transitoires IndexedDB
 * 
 * @module garminDataSave
 */

import {
  openDB,
  getStorageKey,
  getAllStorageKeys,
  enqueueSave,
  getUseFallback,
  setUseFallback,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS
} from './garminDataUtils';

import {
  mergeDailyMetrics,
  deduplicateTimeSeries
} from './garminDataFusion';

import { retryWithBackoff } from './garminRetryUtils';
import { logIndexedDBError } from './garminErrorHandler';
import logger from '../utils/logger';

const log = logger.module('garminDataSave');

// ==================== HELPERS INDEXEDDB AVEC RETRY ====================

/**
 * ✅ PHASE 1.5 : Helper pour opération IndexedDB get avec retry
 * 
 * @param {IDBObjectStore} store - Object store IndexedDB
 * @param {string|number} key - Clé à récupérer
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<any>} Données récupérées ou null
 */
const getFromStoreWithRetry = async (store, key, context = {}) => {
  return retryWithBackoff(
    () => new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        // Pour get, on peut retourner null si erreur (données non trouvées)
        // Mais on log quand même pour diagnostic
        const error = req.error;
        if (error && error.name !== 'NotFoundError') {
          logIndexedDBError(error, { ...context, operation: 'get', key }, 'warn');
        }
        resolve(null); // Ne pas reject pour get (données peuvent ne pas exister)
      };
    }),
    {
      maxRetries: 2, // Moins de retries pour get (opération read)
      initialDelay: 50,
      maxDelay: 500,
      context: { ...context, operation: 'get', key }
    }
  );
};

/**
 * ✅ PHASE 1.5 : Helper pour opération IndexedDB put avec retry
 * 
 * @param {IDBObjectStore} store - Object store IndexedDB
 * @param {Object} data - Données à sauvegarder
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
const putToStoreWithRetry = async (store, data, context = {}) => {
  return retryWithBackoff(
    () => new Promise((resolve, reject) => {
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        const error = req.error;
        logIndexedDBError(error, { ...context, operation: 'put' }, 'error');
        reject(error); // Reject pour permettre retry
      };
    }),
    {
      maxRetries: 3, // Plus de retries pour put (opération write critique)
      initialDelay: 100,
      maxDelay: 1000,
      context: { ...context, operation: 'put' }
    }
  );
};

// ==================== SAUVEGARDE ACTIVITÉS ====================

/**
 * Fusionne une activité existante avec une nouvelle activité
 * 
 * Logique de fusion :
 * - Si nouvelle version plus récente OU type changé → Fusionner
 * - Sinon → Garder existante
 * - Préserve métriques importantes (heartRateZones, trainingEffect, etc.)
 * 
 * @param {Object} existing - Activité existante
 * @param {Object} newItem - Nouvelle activité
 * @param {string} type - Type forcé (swimming, jumpRope, cardio)
 * @returns {Object} Activité fusionnée
 */
const mergeActivity = (existing, newItem, type) => {
  const existingSync = existing ? new Date(existing.lastSynced || 0) : null;
  const newSync = new Date(newItem.lastSynced || new Date().toISOString());
  
  // Fusionner seulement si nouvelle version plus récente OU type changé
  const shouldUpdate = !existing || newSync > existingSync || existing.type !== type;
  
  if (!shouldUpdate) {
    return existing; // Garder existante
  }
  
  // Fusionner intelligemment
  return {
    ...existing,
    ...newItem,
    type: type, // FORCER le type selon la catégorie (corrige natation -> cardio)
    source: newItem.source || existing?.source || 'garmin',
    lastSynced: newSync.toISOString(),
    // Fusionner objets imbriqués (préférer nouvelles si plus récentes)
    calories: (newSync > existingSync ? newItem.calories : existing?.calories) || newItem.calories || existing?.calories,
    intensityMinutes: (newSync > existingSync ? newItem.intensityMinutes : existing?.intensityMinutes) || newItem.intensityMinutes || existing?.intensityMinutes,
    connectIQ: newItem.connectIQ || existing?.connectIQ,
    swimmingMetrics: newItem.swimmingMetrics || existing?.swimmingMetrics,
    timeMetrics: newItem.timeMetrics || existing?.timeMetrics,
    // Préserver zones de FC (garder la plus récente)
    heartRateZones: (newSync > existingSync ? newItem.heartRateZones : existing?.heartRateZones) || newItem.heartRateZones || existing?.heartRateZones,
    // Préserver métriques de performance (garder la plus récente)
    trainingEffect: (newSync > existingSync ? newItem.trainingEffect : existing?.trainingEffect) || newItem.trainingEffect || existing?.trainingEffect,
    recoveryTime: (newSync > existingSync ? newItem.recoveryTime : existing?.recoveryTime) ?? newItem.recoveryTime ?? existing?.recoveryTime,
    vo2Max: (newSync > existingSync ? newItem.vo2Max : existing?.vo2Max) ?? newItem.vo2Max ?? existing?.vo2Max,
    trainingStatus: (newSync > existingSync ? newItem.trainingStatus : existing?.trainingStatus) || newItem.trainingStatus || existing?.trainingStatus,
    trainingLoad: (newSync > existingSync ? newItem.trainingLoad : existing?.trainingLoad) ?? newItem.trainingLoad ?? existing?.trainingLoad,
    performanceCondition: (newSync > existingSync ? newItem.performanceCondition : existing?.performanceCondition) || newItem.performanceCondition || existing?.performanceCondition
  };
};

/**
 * Sauvegarde les activités dans localStorage (fallback)
 * 
 * @param {Object} activities - Activités par type
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
const saveActivitiesToLocalStorage = async (activities) => {
  try {
    for (const type of ['swimming', 'jumpRope', 'cardio']) {
      const items = activities[type] || [];
      for (const item of items) {
        if (!item || !item.id) {
          console.warn('[GarminDataSave] Activity missing id, skipping:', item);
          continue;
        }
        
        const key = getStorageKey(STORE_ACTIVITIES, item.id);
        const existingStr = localStorage.getItem(key);
        const existing = existingStr ? JSON.parse(existingStr) : null;
        
        // Fusionner avec existante ou créer nouvelle
        const merged = mergeActivity(existing, item, type);
        
        // Ajouter métadonnées si nouvelle
        if (!existing) {
          merged.lastSynced = new Date().toISOString();
          merged.source = item.source || 'garmin';
        }
        
        localStorage.setItem(key, JSON.stringify(merged));
      }
    }
    console.log('[GarminDataSave] Activities saved to localStorage');
  } catch (err) {
    console.error('[GarminDataSave] Save activities to localStorage error:', err);
    throw err;
  }
};

/**
 * Sauvegarde les activités dans IndexedDB
 * 
 * @param {Object} activities - Activités par type
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
const saveActivitiesToIndexedDB = async (activities) => {
  try {
    const db = await openDB();
    if (!db) {
      // Si openDB retourne null, utiliser fallback
      setUseFallback(true);
      return saveActivitiesToLocalStorage(activities);
    }
    
    const tx = db.transaction([STORE_ACTIVITIES], 'readwrite');
    const store = tx.objectStore(STORE_ACTIVITIES);
    
    // Déduplication robuste par ID Garmin (activityId)
    // L'ID Garmin est unique et persiste entre les sync
    for (const type of ['swimming', 'jumpRope', 'cardio']) {
      const items = activities[type] || [];
      for (const item of items) {
        if (!item || !item.id) {
          console.warn('[GarminDataSave] Activity missing id, skipping:', item);
          continue;
        }
        
        try {
          // ✅ PHASE 1.5 : Vérifier si l'activité existe déjà avec retry
          const existing = await getFromStoreWithRetry(store, item.id, {
            store: STORE_ACTIVITIES,
            activityId: item.id,
            type
          });
          
          // Fusionner avec existante ou créer nouvelle
          const merged = mergeActivity(existing, item, type);
          
          // ✅ PHASE 1.5 : Sauvegarder avec retry
          await putToStoreWithRetry(store, merged, {
            store: STORE_ACTIVITIES,
            activityId: item.id,
            type
          });
        } catch (e) {
          // Erreur après retry : log détaillé mais continuer pour autres activités
          logIndexedDBError(e, {
            store: STORE_ACTIVITIES,
            activityId: item.id,
            type,
            operation: 'saveActivity'
          }, 'warn');
          log.warn(`[saveActivitiesToIndexedDB] Error saving activity ${item.id}, continuing with other activities`);
          // Continuer même en cas d'erreur pour une activité spécifique
        }
      }
    }
    
    log.info('[saveActivitiesToIndexedDB] Activities saved successfully to IndexedDB');
  } catch (err) {
    // Erreur globale : log détaillé et fallback
    logIndexedDBError(err, {
      store: STORE_ACTIVITIES,
      operation: 'saveActivitiesToIndexedDB'
    }, 'error');
    log.warn('[saveActivitiesToIndexedDB] Falling back to localStorage');
    setUseFallback(true);
    throw err; // La queue gérera le retry si nécessaire
  }
};

/**
 * Sauvegarde les activités dans IndexedDB ou localStorage (selon disponibilité)
 * 
 * Cette fonction :
 * - Utilise la queue de sauvegarde pour éviter race conditions
 * - Détecte automatiquement IndexedDB vs localStorage
 * - Fusionne intelligemment avec données existantes
 * - Préserve toutes les métadonnées importantes
 * 
 * @param {Object} activities - Activités par type
 * @param {Array} activities.swimming - Liste des activités de natation
 * @param {Array} activities.jumpRope - Liste des activités de corde à sauter
 * @param {Array} activities.cardio - Liste des activités cardio
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
 * @throws {Error} Si la sauvegarde échoue
 * 
 * @example
 * await saveActivities({
 *   swimming: [{ id: '123', date: '2025-01-15', ... }],
 *   jumpRope: [],
 *   cardio: []
 * }, true);
 */
export const saveActivities = async (activities, dbReady) => {
  if (!dbReady) {
    console.warn('[GarminDataSave] DB not ready, skipping save');
    return;
  }
  
  // Utiliser queue pour éviter race conditions
  return enqueueSave(async () => {
    const useFallback = getUseFallback();
    
    if (useFallback || !window.indexedDB) {
      await saveActivitiesToLocalStorage(activities);
    } else {
      await saveActivitiesToIndexedDB(activities);
    }
  });
};

// ==================== SAUVEGARDE MÉTRIQUES QUOTIDIENNES ====================

/**
 * Sauvegarde les métriques quotidiennes dans localStorage (fallback)
 * 
 * @param {Object} dailyMetrics - Métriques par date (YYYY-MM-DD)
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
const saveDailyMetricsToLocalStorage = async (dailyMetrics) => {
  try {
    for (const [date, metrics] of Object.entries(dailyMetrics)) {
      if (!date || !metrics) {
        console.warn('[GarminDataSave] Invalid date or metrics, skipping:', date);
        continue;
      }
      
      const key = getStorageKey(STORE_DAILY_METRICS, date);
      const existingStr = localStorage.getItem(key);
      const existing = existingStr ? JSON.parse(existingStr) : null;
      
      // Utiliser module de fusion pour fusionner intelligemment
      const merged = mergeDailyMetrics(metrics, existing, date);
      
      localStorage.setItem(key, JSON.stringify(merged));
    }
    console.log('[GarminDataSave] Daily metrics saved to localStorage');
  } catch (err) {
    console.error('[GarminDataSave] Save daily metrics to localStorage error:', err);
    throw err;
  }
};

/**
 * Sauvegarde les métriques quotidiennes dans IndexedDB
 * 
 * @param {Object} dailyMetrics - Métriques par date (YYYY-MM-DD)
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
const saveDailyMetricsToIndexedDB = async (dailyMetrics) => {
  try {
    const db = await openDB();
    if (!db) {
      setUseFallback(true);
      return saveDailyMetricsToLocalStorage(dailyMetrics);
    }
    
    const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const store = tx.objectStore(STORE_DAILY_METRICS);
    
    for (const [date, metrics] of Object.entries(dailyMetrics)) {
      if (!date || !metrics) {
        console.warn('[GarminDataSave] Invalid date or metrics, skipping:', date);
        continue;
      }
      
      try {
        // ✅ PHASE 1.5 : Récupérer les métriques existantes avec retry
        const existing = await getFromStoreWithRetry(store, date, {
          store: STORE_DAILY_METRICS,
          date
        });
        
        // Utiliser module de fusion pour fusionner intelligemment
        const merged = mergeDailyMetrics(metrics, existing, date);
        
        // ✅ PHASE 1.5 : Sauvegarder avec retry
        await putToStoreWithRetry(store, merged, {
          store: STORE_DAILY_METRICS,
          date
        });
      } catch (e) {
        // Erreur après retry : log détaillé mais continuer pour autres dates
        logIndexedDBError(e, {
          store: STORE_DAILY_METRICS,
          date,
          operation: 'saveDailyMetricsForDate'
        }, 'warn');
        log.warn(`[saveDailyMetricsToIndexedDB] Error saving daily metrics for ${date}, continuing with other dates`);
        // Continuer même en cas d'erreur pour une date spécifique
      }
    }
    
    log.info('[saveDailyMetricsToIndexedDB] Daily metrics saved successfully to IndexedDB');
  } catch (err) {
    // Erreur globale : log détaillé et fallback
    logIndexedDBError(err, {
      store: STORE_DAILY_METRICS,
      operation: 'saveDailyMetricsToIndexedDB'
    }, 'error');
    log.warn('[saveDailyMetricsToIndexedDB] Falling back to localStorage');
    setUseFallback(true);
    throw err; // La queue gérera le retry si nécessaire
  }
};

/**
 * Sauvegarde les métriques quotidiennes dans IndexedDB ou localStorage (selon disponibilité)
 * 
 * Cette fonction :
 * - Utilise la queue de sauvegarde pour éviter race conditions
 * - Détecte automatiquement IndexedDB vs localStorage
 * - Fusionne intelligemment avec données existantes (via `mergeDailyMetrics`)
 * - Préserve les time series existantes si nouvelles incomplètes
 * - Met à jour `lastSynced` automatiquement
 * 
 * @param {Object} dailyMetrics - Métriques par date (YYYY-MM-DD)
 * @param {Object} dailyMetrics[date] - Métriques pour une date spécifique
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
 * @throws {Error} Si la sauvegarde échoue
 * 
 * @example
 * await saveDailyMetrics({
 *   '2025-01-15': {
 *     steps: 5000,
 *     heartRate: { timeSeries: [...], resting: 60, avg: 75, max: 120 }
 *   }
 * }, true);
 */
export const saveDailyMetrics = async (dailyMetrics, dbReady) => {
  if (!dbReady) {
    console.warn('[GarminDataSave] DB not ready, skipping save');
    return;
  }
  
  // Utiliser queue pour éviter race conditions
  return enqueueSave(async () => {
    const useFallback = getUseFallback();
    
    if (useFallback || !window.indexedDB) {
      await saveDailyMetricsToLocalStorage(dailyMetrics);
    } else {
      await saveDailyMetricsToIndexedDB(dailyMetrics);
    }
  });
};

