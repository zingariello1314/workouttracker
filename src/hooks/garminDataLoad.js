/**
 * ✅ PHASE 1.1 : Module de chargement des données Garmin
 * ✅ PHASE 1.5 : Amélioration gestion erreurs avec retry automatique
 * 
 * Ce module contient toutes les fonctions de chargement :
 * - `loadAllData` : Charge toutes les données (fallback si optimisations échouent)
 * - `loadDataByRange` : Charge par plage de dates (optimisé avec range queries IndexedDB)
 * - `loadDataForTab` : Charge selon l'onglet actif (optimisé pour performance)
 * - `calculateDateRange` : Calcule plage de dates selon periodFilter
 * 
 * Optimisations :
 * - Range queries avec index IndexedDB (évite charger toutes les données)
 * - Chargement seulement données nécessaires selon onglet
 * - Fallback localStorage automatique
 * - Retry automatique pour erreurs transitoires IndexedDB
 * 
 * @module garminDataLoad
 */

import {
  openDB,
  getStorageKey,
  getAllStorageKeys,
  getUseFallback,
  setUseFallback,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  STORE_DEVICE_META,
  readStorageBucket
} from './garminDataUtils';
import { multiStoreLoader } from './garmin/storage/MultiStoreLoader';

import { DATE_RANGE } from '../components/tabs/GarminTab/constants';

import { retryWithBackoff } from './garminRetryUtils';
import { logIndexedDBError } from './garminErrorHandler';
import logger from '../utils/logger';

const log = logger.module('garminDataLoad');

// ==================== HELPERS INDEXEDDB AVEC RETRY ====================

/**
 * ✅ PHASE 1.5 : Helper pour opération IndexedDB getAll avec retry
 * 
 * @param {IDBObjectStore|IDBIndex} storeOrIndex - Object store ou index IndexedDB
 * @param {IDBKeyRange|null} keyRange - Range de clés (optionnel)
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<Array>} Données récupérées
 */
const getAllFromStoreWithRetry = async (storeOrIndex, keyRange = null, context = {}) => {
  return retryWithBackoff(
    () => new Promise((resolve, reject) => {
      const req = keyRange 
        ? storeOrIndex.getAll(keyRange)
        : storeOrIndex.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => {
        const error = req.error;
        logIndexedDBError(error, { ...context, operation: 'getAll' }, 'error');
        reject(error); // Reject pour permettre retry
      };
    }),
    {
      maxRetries: 2, // Moins de retries pour getAll (opération read)
      initialDelay: 50,
      maxDelay: 500,
      context: { ...context, operation: 'getAll' }
    }
  );
};

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
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        const error = req.error;
        // Pour get, on peut retourner null si erreur (données non trouvées)
        // Mais on log quand même pour diagnostic
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

// ==================== CALCUL PLAGE DE DATES ====================

/**
 * Calcule la plage de dates selon le periodFilter
 * 
 * Utilisé pour optimiser le chargement des données en ne chargeant que la plage nécessaire
 * 
 * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
 * @param {string|null} customStartDate - Date de début personnalisée (YYYY-MM-DD) pour 'custom'
 * @param {string|null} customEndDate - Date de fin personnalisée (YYYY-MM-DD) pour 'custom'
 * @returns {Object|null} { start, end } - Plage de dates calculée ou null pour 'all'
 * @returns {string} returns.start - Date de début (YYYY-MM-DD)
 * @returns {string} returns.end - Date de fin (YYYY-MM-DD)
 * 
 * @example
 * calculateDateRange('week') // { start: '2025-01-08', end: '2025-01-15' }
 * calculateDateRange('custom', '2025-01-01', '2025-01-31') // { start: '2025-01-01', end: '2025-01-31' }
 */
export const calculateDateRange = (periodFilter, customStartDate, customEndDate) => {
  if (periodFilter === 'custom' && customStartDate && customEndDate) {
    return {
      start: customStartDate,
      end: customEndDate
    };
  }
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (periodFilter) {
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      return {
        start: weekStart.toISOString().split('T')[0],
        end: today
      };
    case 'month':
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      return {
        start: monthStart.toISOString().split('T')[0],
        end: today
      };
    case 'year':
      const yearStart = new Date(now);
      yearStart.setDate(yearStart.getDate() - 365);
      return {
        start: yearStart.toISOString().split('T')[0],
        end: today
      };
    default:
      return null; // 'all' - charger tout
  }
};

// ==================== CHARGEMENT LOCALSTORAGE (FALLBACK) ====================

/**
 * Charge les activités depuis localStorage
 * 
 * @param {string|null} startDate - Date de début (YYYY-MM-DD) ou null pour toutes
 * @param {string|null} endDate - Date de fin (YYYY-MM-DD) ou null pour toutes
 * @returns {Object} Activités par type { swimming, jumpRope, cardio }
 */
const loadActivitiesFromLocalStorage = (startDate = null, endDate = null) => {
  const activities = { swimming: [], jumpRope: [], cardio: [] };
  const processedIds = new Set();
  
  const isInRange = (date) => {
    if (!startDate || !endDate || !date) return true;
    return !(date < startDate || date > endDate);
  };
  
  const pushActivity = (item) => {
    if (!item || !item.type) return;
    if (!isInRange(item.date)) return;
    if (item.type === 'swimming') {
      activities.swimming.push(item);
    } else if (item.type === 'jumpRope') {
      activities.jumpRope.push(item);
    } else if (item.type === 'cardio') {
      activities.cardio.push(item);
    }
  };
  
  try {
    const bucket = readStorageBucket(STORE_ACTIVITIES);
    Object.entries(bucket).forEach(([id, item]) => {
      processedIds.add(id);
      pushActivity(item);
    });
  } catch (bucketErr) {
    log.warn('[loadActivitiesFromLocalStorage] Bucket read error:', bucketErr);
  }
  
  try {
    const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
    for (const key of activityKeys) {
      if (processedIds.has(key)) continue;
      try {
        const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          
          pushActivity(item);
        }
      } catch (e) {
        log.warn('[loadActivitiesFromLocalStorage] Error loading activity from localStorage:', key, e);
      }
    }
  } catch (err) {
    log.error('[loadActivitiesFromLocalStorage] Error loading activities from localStorage:', err);
  }
  
  return activities;
};

/**
 * Charge les métriques quotidiennes depuis localStorage
 * 
 * @param {string|null} startDate - Date de début (YYYY-MM-DD) ou null pour toutes
 * @param {string|null} endDate - Date de fin (YYYY-MM-DD) ou null pour toutes
 * @returns {Object} Métriques par date (YYYY-MM-DD)
 */
const loadDailyMetricsFromLocalStorage = (startDate = null, endDate = null) => {
  const dailyMetrics = {};
  const processedDates = new Set();
  const isInRange = (date) => {
    if (!startDate || !endDate || !date) return true;
    return !(date < startDate || date > endDate);
  };
  
  try {
    const bucket = readStorageBucket(STORE_DAILY_METRICS);
    Object.entries(bucket).forEach(([date, metric]) => {
      processedDates.add(date);
      if (!isInRange(date)) return;
      if (metric) {
        dailyMetrics[date] = metric;
      }
    });
  } catch (bucketErr) {
    log.warn('[loadDailyMetricsFromLocalStorage] Bucket read error:', bucketErr);
  }
  
  try {
    const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
    for (const key of metricsKeys) {
      if (processedDates.has(key)) continue;
      try {
        const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          
          if (!isInRange(item.date)) {
            continue;
          }
          
          const { date, ...rest } = item;
          if (date && !dailyMetrics[date]) {
            dailyMetrics[date] = rest;
          }
        }
      } catch (e) {
        log.warn('[loadDailyMetricsFromLocalStorage] Error loading metric from localStorage:', key, e);
      }
    }
  } catch (err) {
    log.error('[loadDailyMetricsFromLocalStorage] Error loading daily metrics from localStorage:', err);
  }
  
  return dailyMetrics;
};

// ==================== CHARGEMENT INDEXEDDB ====================

/**
 * Charge les activités depuis IndexedDB avec range query optimisée
 * 
 * @param {IDBDatabase} db - Instance de la base de données
 * @param {string|null} startDate - Date de début (YYYY-MM-DD) ou null pour toutes
 * @param {string|null} endDate - Date de fin (YYYY-MM-DD) ou null pour toutes
 * @returns {Promise<Object>} Activités par type { swimming, jumpRope, cardio }
 */
const loadActivitiesFromIndexedDB = async (db, startDate = null, endDate = null) => {
  const activities = { swimming: [], jumpRope: [], cardio: [] };
  
  try {
    const activitiesTx = db.transaction([STORE_ACTIVITIES], 'readonly');
    const activitiesStore = activitiesTx.objectStore(STORE_ACTIVITIES);
    
    let dateIdx;
    try {
      dateIdx = activitiesStore.index('date');
    } catch (idxErr) {
      // Index n'existe pas, charger tout et filtrer
      log.warn('[loadActivitiesFromIndexedDB] Index "date" not found for activities, loading all and filtering');
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const allActivities = await getAllFromStoreWithRetry(activitiesStore, null, {
        store: STORE_ACTIVITIES,
        operation: 'loadActivitiesAll'
      });
      
      allActivities.forEach(activity => {
        if (!activity || !activity.type) return;
        
        // Filtrer par plage si spécifiée
        if (startDate && endDate && activity.date) {
          if (activity.date < startDate || activity.date > endDate) {
            return;
          }
        }
        
        // Classer par type
        if (activity.type === 'swimming') {
          activities.swimming.push(activity);
        } else if (activity.type === 'jumpRope') {
          activities.jumpRope.push(activity);
        } else if (activity.type === 'cardio') {
          activities.cardio.push(activity);
        }
      });
      
      return activities;
    }
    
    // Utiliser range query si plage spécifiée
    if (startDate && endDate && dateIdx) {
      const activitiesRange = IDBKeyRange.bound(startDate, endDate);
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const activitiesResults = await getAllFromStoreWithRetry(dateIdx, activitiesRange, {
        store: STORE_ACTIVITIES,
        operation: 'loadActivitiesByRange',
        startDate,
        endDate
      });
      
      activitiesResults.forEach(activity => {
        if (!activity || !activity.type) return;
        if (activity.type === 'swimming') {
          activities.swimming.push(activity);
        } else if (activity.type === 'jumpRope') {
          activities.jumpRope.push(activity);
        } else if (activity.type === 'cardio') {
          activities.cardio.push(activity);
        }
      });
    } else {
      // Charger toutes les activités
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const allActivities = await getAllFromStoreWithRetry(activitiesStore, null, {
        store: STORE_ACTIVITIES,
        operation: 'loadActivitiesAll'
      });
      
      allActivities.forEach(activity => {
        if (!activity || !activity.type) return;
        if (activity.type === 'swimming') {
          activities.swimming.push(activity);
        } else if (activity.type === 'jumpRope') {
          activities.jumpRope.push(activity);
        } else if (activity.type === 'cardio') {
          activities.cardio.push(activity);
        }
      });
    }
  } catch (activitiesErr) {
    // Erreur après retry : log détaillé
    logIndexedDBError(activitiesErr, {
      store: STORE_ACTIVITIES,
      operation: 'loadActivitiesFromIndexedDB',
      startDate,
      endDate
    }, 'error');
    log.error('[loadActivitiesFromIndexedDB] Error loading activities, returning empty result');
  }
  
  return activities;
};

/**
 * Charge les métriques quotidiennes depuis IndexedDB avec range query optimisée
 * 
 * @param {IDBDatabase} db - Instance de la base de données
 * @param {string|null} startDate - Date de début (YYYY-MM-DD) ou null pour toutes
 * @param {string|null} endDate - Date de fin (YYYY-MM-DD) ou null pour toutes
 * @returns {Promise<Object>} Métriques par date (YYYY-MM-DD)
 */
const loadDailyMetricsFromIndexedDB = async (db, startDate = null, endDate = null) => {
  const dailyMetrics = {};
  
  try {
    const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readonly');
    const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
    
    let dateIndex;
    try {
      dateIndex = metricsStore.index('date');
    } catch (idxErr) {
      // Index n'existe pas, charger tout et filtrer
      log.warn('[loadDailyMetricsFromIndexedDB] Index "date" not found, loading all and filtering');
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const allMetrics = await getAllFromStoreWithRetry(metricsStore, null, {
        store: STORE_DAILY_METRICS,
        operation: 'loadDailyMetricsAll'
      });
      
      allMetrics.forEach(metric => {
        if (!metric || !metric.date) return;
        
        // Filtrer par plage si spécifiée
        if (startDate && endDate) {
          if (metric.date < startDate || metric.date > endDate) {
            return;
          }
        }
        
        const { date, ...rest } = metric;
        dailyMetrics[date] = rest;
      });
      
      return dailyMetrics;
    }
    
    // Utiliser range query si plage spécifiée
    if (startDate && endDate && dateIndex) {
      const dateRange = IDBKeyRange.bound(startDate, endDate);
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const metricsResults = await getAllFromStoreWithRetry(dateIndex, dateRange, {
        store: STORE_DAILY_METRICS,
        operation: 'loadDailyMetricsByRange',
        startDate,
        endDate
      });
      
      // Convertir en objet { date: metrics } (sans la clé date dans la valeur)
      metricsResults.forEach(metric => {
        if (metric && metric.date) {
          const { date, ...rest } = metric;
          dailyMetrics[date] = rest;
        }
      });
    } else {
      // Charger toutes les métriques
      // ✅ PHASE 1.5 : Utiliser helper avec retry
      const allMetrics = await getAllFromStoreWithRetry(metricsStore, null, {
        store: STORE_DAILY_METRICS,
        operation: 'loadDailyMetricsAll'
      });
      
      allMetrics.forEach(metric => {
        if (metric && metric.date) {
          const { date, ...rest } = metric;
          dailyMetrics[date] = rest;
        }
      });
    }
  } catch (metricsErr) {
    // Erreur après retry : log détaillé
    logIndexedDBError(metricsErr, {
      store: STORE_DAILY_METRICS,
      operation: 'loadDailyMetricsFromIndexedDB',
      startDate,
      endDate
    }, 'error');
    log.error('[loadDailyMetricsFromIndexedDB] Error loading metrics, returning empty result');
  }
  
  return dailyMetrics;
};

// ==================== FONCTIONS PUBLIQUES ====================

/**
 * Charge toutes les données depuis IndexedDB ou localStorage
 * 
 * ⚠️ ATTENTION : Cette fonction charge TOUTES les données, ce qui peut être coûteux.
 * Préférer `loadDataByRange` ou `loadDataForTab` pour optimiser la performance.
 * 
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<Object>} { activities, dailyMetrics }
 * @returns {Object} returns.activities - Activités par type { swimming, jumpRope, cardio }
 * @returns {Object} returns.dailyMetrics - Métriques quotidiennes par date (YYYY-MM-DD)
 * 
 * @example
 * const data = await loadAllData(true);
 * console.log(data.activities.swimming.length); // Nombre d'activités natation
 */
export const loadAllData = async (dbReady) => {
  if (!dbReady) {
    return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
  }
  
  const useFallback = getUseFallback();
  
  // Fallback localStorage
  if (useFallback || !window.indexedDB) {
    try {
      const activities = loadActivitiesFromLocalStorage();
      const dailyMetrics = loadDailyMetricsFromLocalStorage();
      log.debug('[loadAllData] Data loaded from localStorage');
      return { activities, dailyMetrics };
    } catch (err) {
      log.error('[loadAllData] Load from localStorage error:', err);
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    }
  }
  
  // IndexedDB
  try {
    const db = await openDB();
    if (!db) {
      setUseFallback(true);
      // Retourner données vides plutôt que récursion infinie
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    }
    
    const activities = await loadActivitiesFromIndexedDB(db);
    const dailyMetrics = await loadDailyMetricsFromIndexedDB(db);
    
    return { activities, dailyMetrics };
  } catch (err) {
    logIndexedDBError(err, {
      operation: 'loadAllData'
    }, 'error');
    log.error('[loadAllData] Load error:', err);
    setUseFallback(true);
    return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
  }
};

/**
 * Charge les données par plage de dates (optimisé avec range queries IndexedDB)
 * 
 * Cette fonction utilise les index IndexedDB pour charger seulement les données dans la plage,
 * ce qui est beaucoup plus performant que charger toutes les données puis filtrer.
 * 
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<Object>} { activities, dailyMetrics }
 * @returns {Object} returns.activities - Activités par type dans la plage
 * @returns {Object} returns.dailyMetrics - Métriques quotidiennes dans la plage
 * 
 * @example
 * const data = await loadDataByRange('2025-01-01', '2025-01-31', true);
 * // Charge seulement les données de janvier 2025
 */
export const loadDataByRange = async (startDate, endDate, dbReady) => {
  if (!dbReady) {
    return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
  }
  
  // Initialiser avec la structure correcte
  const activities = { swimming: [], jumpRope: [], cardio: [] };
  const dailyMetrics = {};
  
  const useFallback = getUseFallback();
  
  // Fallback localStorage
  if (useFallback || !window.indexedDB) {
    try {
      const loadedActivities = loadActivitiesFromLocalStorage(startDate, endDate);
      const loadedMetrics = loadDailyMetricsFromLocalStorage(startDate, endDate);
      return { activities: loadedActivities, dailyMetrics: loadedMetrics };
    } catch (err) {
      log.error('[loadDataByRange] Load by range from localStorage error:', err);
      return { activities, dailyMetrics };
    }
  }
  
  // IndexedDB avec transaction multi-store
  try {
    const { activities: loadedActivities, metrics: loadedMetrics } = await multiStoreLoader.loadDataByRange(startDate, endDate);
    return { activities: loadedActivities, dailyMetrics: loadedMetrics };
  } catch (err) {
    logIndexedDBError(err, {
      operation: 'loadDataByRange',
      startDate,
      endDate
    }, 'error');
    log.error('[loadDataByRange] Load by range error:', err);
    setUseFallback(true);
    try {
      const loadedActivities = loadActivitiesFromLocalStorage(startDate, endDate);
      const loadedMetrics = loadDailyMetricsFromLocalStorage(startDate, endDate);
      return { activities: loadedActivities, dailyMetrics: loadedMetrics };
    } catch (fallbackError) {
      log.error('[loadDataByRange] LocalStorage fallback error:', fallbackError);
      return { activities, dailyMetrics };
    }
  }
};

/**
 * Charge seulement les données nécessaires selon l'onglet actif
 * 
 * Cette fonction optimise la mémoire en ne chargeant que ce qui est affiché :
 * - **activities** : ±7 jours autour de la date sélectionnée (ou 90 jours si pas de date)
 * - **metrics** : 90 derniers jours
 * - **charts** : Plage selon periodFilter
 * - **dashboard** : Toutes les données
 * 
 * @param {string} tab - Onglet actif ('activities', 'metrics', 'charts', 'dashboard')
 * @param {string|null} selectedDate - Date sélectionnée (YYYY-MM-DD) ou null
 * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
 * @param {string|null} customStartDate - Date de début personnalisée pour 'custom'
 * @param {string|null} customEndDate - Date de fin personnalisée pour 'custom'
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<Object>} { activities, dailyMetrics }
 * @returns {Object} returns.activities - Activités par type { swimming, jumpRope, cardio }
 * @returns {Object} returns.dailyMetrics - Métriques quotidiennes par date (YYYY-MM-DD)
 * 
 * @example
 * // Charger données pour onglet "activities" avec date sélectionnée
 * const data = await loadDataForTab('activities', '2025-01-15', 'all', null, null, true);
 * 
 * // Charger données pour onglet "charts" avec filtre semaine
 * const data = await loadDataForTab('charts', null, 'week', null, null, true);
 */
export const loadDataForTab = async (
  tab,
  selectedDate,
  periodFilter,
  customStartDate,
  customEndDate,
  dbReady
) => {
  if (!dbReady) {
    return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
  }
  
  // Onglet "activities" : charger ±7 jours autour de la date sélectionnée
  if (tab === 'activities') {
    if (selectedDate) {
      // Si une date est sélectionnée, charger cette date + jours avant/après pour contexte
      const date = new Date(selectedDate);
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - DATE_RANGE.ACTIVITIES_DAYS);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + DATE_RANGE.ACTIVITIES_DAYS);
      return await loadDataByRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        dbReady
      );
    } else {
      // Sinon, charger les derniers jours pour métriques
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const daysAgo = new Date(now);
      daysAgo.setDate(daysAgo.getDate() - DATE_RANGE.METRICS_DAYS);
      const startDate = daysAgo.toISOString().split('T')[0];
      return await loadDataByRange(startDate, today, dbReady);
    }
  }
  
  // Onglet "charts" avec filtre temporel : charger seulement la plage
  if (tab === 'charts' && periodFilter && periodFilter !== 'all') {
    const range = calculateDateRange(periodFilter, customStartDate, customEndDate);
    if (range) {
      return await loadDataByRange(range.start, range.end, dbReady);
    }
  }
  
  // Onglet "metrics" : charger les derniers jours pour avoir les données complètes
  // (nécessaire car les composants peuvent afficher des comparaisons/statistiques)
  if (tab === 'metrics') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const daysAgo = new Date(now);
    daysAgo.setDate(daysAgo.getDate() - DATE_RANGE.METRICS_DAYS);
    const startDate = daysAgo.toISOString().split('T')[0];
    return await loadDataByRange(startDate, today, dbReady);
  }
  
  // Dashboard ou autres cas : charger tout
  return await loadAllData(dbReady);
};

// ==================== GESTION SYNCHRONISATION ====================

/**
 * Récupère la date de dernière synchronisation stockée.
 * @returns {Promise<string|null>} Date de dernière sync (YYYY-MM-DD) ou null
 */
export const getLastSyncDate = async () => {
  if (getUseFallback()) {
    return localStorage.getItem('garmin_lastSyncDate') || null;
  }

  const db = await openDB();
  if (!db) return null;

  const tx = db.transaction([STORE_DEVICE_META], 'readonly');
  const store = tx.objectStore(STORE_DEVICE_META);
  // ✅ PHASE 1.5 : Utiliser helper avec retry
  const meta = await getFromStoreWithRetry(store, 'lastSyncDate', {
    store: STORE_DEVICE_META,
    operation: 'getLastSyncDate'
  });
  return meta?.value || null;
};

/**
 * Stocke la date de dernière synchronisation.
 * @param {string} date - Date de sync (YYYY-MM-DD)
 * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
 */
export const setLastSyncDate = async (date) => {
  if (!date) return;
  
  try {
    if (getUseFallback()) {
      // Fallback localStorage
      localStorage.setItem('garmin_lastSyncDate', date);
      return;
    }

    const db = await openDB();
    if (!db) {
      setUseFallback(true);
      localStorage.setItem('garmin_lastSyncDate', date);
      return;
    }

    const tx = db.transaction([STORE_DEVICE_META], 'readwrite');
    const store = tx.objectStore(STORE_DEVICE_META);
    
    // ✅ PHASE 1.5 : Utiliser retry pour put
    await retryWithBackoff(
      () => new Promise((resolve, reject) => {
        const req = store.put({ key: 'lastSyncDate', value: date, updatedAt: new Date().toISOString() });
        req.onsuccess = () => {
          // Sauvegarder aussi dans localStorage en backup
          localStorage.setItem('garmin_lastSyncDate', date);
          resolve();
        };
        req.onerror = () => {
          const error = req.error;
          logIndexedDBError(error, { store: STORE_DEVICE_META, operation: 'setLastSyncDate', date }, 'error');
          reject(error);
        };
      }),
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        context: { store: STORE_DEVICE_META, operation: 'setLastSyncDate', date }
      }
    );
  } catch (err) {
    // Erreur après retry : log détaillé et fallback
    logIndexedDBError(err, {
      store: STORE_DEVICE_META,
      operation: 'setLastSyncDate',
      date
    }, 'error');
    log.warn('[setLastSyncDate] Falling back to localStorage');
    setUseFallback(true);
    localStorage.setItem('garmin_lastSyncDate', date);
  }
};

/**
 * Récupère le timestamp exact de dernière sync pour une date spécifique.
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<string|null>} Timestamp ISO de dernière sync ou null
 */
export const getLastSyncTimestampForDate = async (date) => {
  if (!date) return null;
  
  if (getUseFallback()) {
    const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, date));
    if (itemStr) {
      try {
        const item = JSON.parse(itemStr);
        return item.lastSynced || null;
      } catch (e) {
        log.warn('[getLastSyncTimestampForDate] Error parsing metric from localStorage:', date, e);
        return null;
      }
    }
    return null;
  }

  const db = await openDB();
  if (!db) return null;

  const tx = db.transaction([STORE_DAILY_METRICS], 'readonly');
  const store = tx.objectStore(STORE_DAILY_METRICS);
  // ✅ PHASE 1.5 : Utiliser helper avec retry
  const metric = await getFromStoreWithRetry(store, date, {
    store: STORE_DAILY_METRICS,
    operation: 'getLastSyncTimestampForDate',
    date
  });
  return metric?.lastSynced || null;
};

/**
 * Calcule la date de début pour la synchronisation incrémentale.
 * @returns {Promise<string>} Date de début (YYYY-MM-DD)
 */
export const getSyncStartDate = async () => {
  const lastSync = await getLastSyncDate();
  const today = new Date().toISOString().split('T')[0];

  if (!lastSync) {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  const lastSyncDate = new Date(lastSync + 'T00:00:00');
  const calculatedStart = new Date(lastSyncDate);
  calculatedStart.setDate(calculatedStart.getDate() + 1);
  const calculatedStartStr = calculatedStart.toISOString().split('T')[0];

  if (calculatedStartStr > today) {
    const adjustedDate = new Date();
    adjustedDate.setDate(adjustedDate.getDate() - 1);
    return adjustedDate.toISOString().split('T')[0];
  }

  if (lastSync > today) {
    log.warn(`[getSyncStartDate] lastSync date (${lastSync}) is in the future, using today - 1 day`);
    const adjustedDate = new Date();
    adjustedDate.setDate(adjustedDate.getDate() - 1);
    return adjustedDate.toISOString().split('T')[0];
  }

  return calculatedStartStr;
};

