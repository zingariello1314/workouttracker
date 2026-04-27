/**
 * ✅ PHASE 1.1 : Module de purge des données Garmin
 * 
 * Ce module contient toutes les fonctions de purge :
 * - `autoPurge` : Purge automatique données > 90 jours
 * - `purgeOldTimeSeries` : Purge time series > 90 jours (garde métriques agrégées)
 * - `deleteMockActivities` : Supprime données mock (activités + métriques)
 * 
 * Optimisations :
 * - Purge sélective (garde métriques, supprime seulement time series volumineuses)
 * - Détection intelligente données mock (patterns, dates futures)
 * - Support IndexedDB + localStorage fallback
 * 
 * @module garminDataPurge
 */

import {
  openDB,
  getStorageKey,
  getAllStorageKeys,
  getUseFallback,
  setUseFallback,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  recordBelongsToCurrentScope
} from './garminDataUtils';

// ==================== CONSTANTES PURGE ====================

/**
 * Nombre de jours avant purge automatique
 * @constant {number}
 */
const DEFAULT_PURGE_DAYS = 90;

/**
 * Calcule la date de coupure pour la purge (PURGE_DAYS jours avant aujourd'hui)
 * 
 * @returns {string} Date de coupure au format YYYY-MM-DD
 */
const getCutoffDate = (purgeDays = DEFAULT_PURGE_DAYS) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - purgeDays);
  return cutoff.toISOString().split('T')[0];
};

/**
 * Obtient la date locale d'aujourd'hui (pour filtrer dates futures)
 * 
 * @returns {string} Date d'aujourd'hui au format YYYY-MM-DD
 */
const getTodayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// ==================== DÉTECTION DONNÉES MOCK ====================

/**
 * Vérifie si une activité est une donnée mock (test)
 * 
 * Caractéristiques des activités mock :
 * - Swimming: exactement 60 laps, distance 1.5, duration 3600, avgHR 145, maxHR 172, calories 450
 * - JumpRope: exactement 1200 jumps, duration 1200, avgHR 132, maxHR 158, calories 180
 * 
 * @param {Object} activity - Activité à vérifier
 * @returns {boolean} True si activité mock
 */
const isMockActivity = (activity) => {
  if (!activity || !activity.type) return false;
  
  if (activity.type === 'swimming') {
    return activity.laps === 60 && 
           activity.distance === 1.5 && 
           activity.duration === 3600 &&
           activity.avgHR === 145 &&
           activity.maxHR === 172 &&
           activity.calories === 450;
  }
  
  if (activity.type === 'jumpRope') {
    return activity.jumps === 1200 && 
           activity.duration === 1200 &&
           activity.avgHR === 132 &&
           activity.maxHR === 158 &&
           activity.calories === 180;
  }
  
  return false;
};

/**
 * Vérifie si une métrique quotidienne est une donnée mock (test)
 * 
 * Détecte 3 patterns :
 * 1. Pattern exact : Valeurs exactes du mock original (8543 pas, 2340 calories, etc.)
 * 2. Pattern suspect : Valeurs "trop rondes" (multiples de 100)
 * 3. Pattern similaire : Valeurs dans plages suspectes similaires au mock
 * 
 * @param {Object} metric - Métrique à vérifier (sans la clé 'date')
 * @returns {boolean} True si métrique mock
 */
const isMockMetric = (metric) => {
  if (!metric) return false;
  
  // Pattern 1 : Valeurs exactes du mock original
  const isExactMock = metric.steps === 8543 &&
         metric.distance === 6.2 &&
         metric.floors === 12 &&
         metric.calories?.total === 2340 &&
         metric.calories?.active === 540 &&
         metric.calories?.resting === 1800 &&
         metric.heartRate?.resting === 58 &&
         metric.heartRate?.max === 172 &&
         metric.heartRate?.avg === 78 &&
         metric.sleep?.duration === 7.5 &&
         metric.sleep?.quality === 82 &&
         metric.stress?.average === 32 &&
         metric.stress?.max === 65 &&
         metric.bodyBattery?.current === 67 &&
         metric.bodyBattery?.max === 95 &&
         metric.bodyBattery?.min === 12 &&
         metric.respiration?.average === 14 &&
         metric.respiration?.max === 22 &&
         metric.respiration?.min === 11 &&
         metric.spo2?.average === 97 &&
         metric.spo2?.min === 94;
  
  // Pattern 2 : Détecter des valeurs "trop rondes" ou suspectes
  const hasSuspiciousPattern = (
    metric.steps && metric.steps > 0 && metric.steps % 100 === 0 && // Nombre rond (ex: 7200, 7300)
    metric.distance && metric.distance > 0 && metric.distance % 0.1 === 0 && // Distance ronde
    metric.calories?.total && metric.calories.total > 0 && metric.calories.total % 100 === 0 // Calories rondes
  );
  
  // Pattern 3 : Vérifier si les valeurs correspondent à un autre pattern mock connu
  const isSimilarToMock = (
    metric.steps >= 7000 && metric.steps <= 9000 && // Dans une plage suspecte
    metric.distance >= 6.0 && metric.distance <= 6.5 && // Distance similaire
    metric.calories?.total >= 2300 && metric.calories.total <= 2800 // Calories similaires
  ) && (
    // Vérifier que les autres métriques sont aussi dans des plages suspectes
    (!metric.heartRate?.resting || (metric.heartRate.resting >= 50 && metric.heartRate.resting <= 65)) &&
    (!metric.sleep?.duration || (metric.sleep.duration >= 6.0 && metric.sleep.duration <= 8.0))
  );
  
  return isExactMock || (hasSuspiciousPattern && isSimilarToMock);
};

// ==================== PURGE AUTOMATIQUE ====================

/**
 * Purge les données > 90 jours depuis localStorage
 * 
 * @param {string} cutoffStr - Date de coupure (YYYY-MM-DD)
 * @returns {number} Nombre d'éléments purgés
 */
const purgeFromLocalStorage = (cutoffStr) => {
  let purgedActivities = 0;
  let purgedMetrics = 0;
  
  try {
    // Purger activités
    const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
    for (const key of activityKeys) {
      try {
        const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (recordBelongsToCurrentScope(item) && item.date && item.date < cutoffStr) {
            localStorage.removeItem(getStorageKey(STORE_ACTIVITIES, key));
            purgedActivities++;
          }
        }
      } catch (e) {
        console.warn('[GarminDataPurge] Error purging activity from localStorage:', key, e);
      }
    }
    
    // Purger métriques
    const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
    for (const key of metricsKeys) {
      try {
        if (key < cutoffStr) {
          localStorage.removeItem(getStorageKey(STORE_DAILY_METRICS, key));
          purgedMetrics++;
        }
      } catch (e) {
        console.warn('[GarminDataPurge] Error purging metric from localStorage:', key, e);
      }
    }
  } catch (err) {
    console.error('[GarminDataPurge] Error purging from localStorage:', err);
  }
  
  return { activities: purgedActivities, metrics: purgedMetrics };
};

/**
 * Purge les données > 90 jours depuis IndexedDB
 * 
 * @param {IDBDatabase} db - Instance de la base de données
 * @param {string} cutoffStr - Date de coupure (YYYY-MM-DD)
 * @returns {Promise<number>} Nombre d'éléments purgés
 */
const purgeFromIndexedDB = async (db, cutoffStr) => {
  let purgedActivities = 0;
  let purgedMetrics = 0;
  
  try {
    // Purger activités
    const actTx = db.transaction([STORE_ACTIVITIES], 'readwrite');
    const actStore = actTx.objectStore(STORE_ACTIVITIES);
    const actReq = actStore.getAll();
    
    await new Promise((resolve, reject) => {
      actReq.onsuccess = async () => {
        for (const item of actReq.result) {
          if (recordBelongsToCurrentScope(item) && item.date && item.date < cutoffStr) {
            try {
              await new Promise((res, rej) => {
                const delReq = actStore.delete(item.id || item.date);
                delReq.onsuccess = () => res();
                delReq.onerror = () => rej(delReq.error);
              });
              purgedActivities++;
            } catch (e) {
              console.warn('[GarminDataPurge] Error deleting old activity:', item.id, e);
            }
          }
        }
        resolve();
      };
      actReq.onerror = () => reject(actReq.error);
    });
    
    // Purger métriques
    const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
    const metricsReq = metricsStore.getAll();
    
    await new Promise((resolve, reject) => {
      metricsReq.onsuccess = async () => {
        for (const item of metricsReq.result) {
          if (item.date && item.date < cutoffStr) {
            try {
              await new Promise((res, rej) => {
                const delReq = metricsStore.delete(item.date);
                delReq.onsuccess = () => res();
                delReq.onerror = () => rej(delReq.error);
              });
              purgedMetrics++;
            } catch (e) {
              console.warn('[GarminDataPurge] Error deleting old metric:', item.date, e);
            }
          }
        }
        resolve();
      };
      metricsReq.onerror = () => reject(metricsReq.error);
    });
  } catch (err) {
    console.error('[GarminDataPurge] Error purging from IndexedDB:', err);
  }
  
  return { activities: purgedActivities, metrics: purgedMetrics };
};

const autoPurgeInternal = async (dbReady, { purgeDays = DEFAULT_PURGE_DAYS } = {}) => {
  const summary = {
    activitiesPurged: 0,
    metricsPurged: 0,
    cutoff: null,
    fallbackUsed: false
  };

  if (!dbReady) return summary;

  const cutoffStr = getCutoffDate(purgeDays);
  summary.cutoff = cutoffStr;
  const useFallback = getUseFallback();

  try {
    if (useFallback || !window.indexedDB) {
      const result = purgeFromLocalStorage(cutoffStr);
      summary.activitiesPurged = result.activities;
      summary.metricsPurged = result.metrics;
      summary.fallbackUsed = true;
      try {
        localStorage.setItem('garmin_lastPurgeSummary', JSON.stringify(summary));
      } catch (storageError) {
        console.warn('[GarminDataPurge] Unable to persist purge summary:', storageError);
      }
      if (summary.activitiesPurged + summary.metricsPurged > 0) {
        console.log(`[GarminDataPurge] Purged ${summary.activitiesPurged + summary.metricsPurged} old items from localStorage (older than ${cutoffStr})`);
      }
      return summary;
    }

    const db = await openDB();
    if (!db) {
      setUseFallback(true);
      const fallbackResult = purgeFromLocalStorage(cutoffStr);
      summary.activitiesPurged = fallbackResult.activities;
      summary.metricsPurged = fallbackResult.metrics;
      summary.fallbackUsed = true;
      try {
        localStorage.setItem('garmin_lastPurgeSummary', JSON.stringify(summary));
      } catch (storageError) {
        console.warn('[GarminDataPurge] Unable to persist purge summary:', storageError);
      }
      if (summary.activitiesPurged + summary.metricsPurged > 0) {
        console.log(`[GarminDataPurge] Purged ${summary.activitiesPurged + summary.metricsPurged} old items from localStorage (fallback, older than ${cutoffStr})`);
      }
      return summary;
    }

    const result = await purgeFromIndexedDB(db, cutoffStr);
    summary.activitiesPurged = result.activities;
    summary.metricsPurged = result.metrics;
    try {
      localStorage.setItem('garmin_lastPurgeSummary', JSON.stringify(summary));
    } catch (storageError) {
      console.warn('[GarminDataPurge] Unable to persist purge summary:', storageError);
    }
    if (summary.activitiesPurged + summary.metricsPurged > 0) {
      console.log(`[GarminDataPurge] Purged ${summary.activitiesPurged + summary.metricsPurged} old items from IndexedDB (older than ${cutoffStr})`);
    }
    return summary;
  } catch (err) {
    console.error('[GarminDataPurge] Auto-purge error:', err);
    try {
      localStorage.setItem('garmin_lastPurgeSummary', JSON.stringify(summary));
    } catch (storageError) {
      console.warn('[GarminDataPurge] Unable to persist purge summary after error:', storageError);
    }
    return summary;
  }
};

// ==================== PURGE TIME SERIES ====================

/**
 * Purge les time series > 90 jours depuis IndexedDB (garde métriques agrégées)
 * 
 * Cette fonction :
 * - Garde les métriques quotidiennes (steps, calories, heartRate.resting, etc.)
 * - Supprime seulement les time series volumineuses (heartRate.timeSeries, bodyBattery.timeSeries, etc.)
 * - Libère beaucoup d'espace sans perdre les métriques importantes
 * 
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<void>} Promise résolue quand la purge est terminée
 * 
 * @example
 * await purgeOldTimeSeries(true);
 */
const purgeOldTimeSeriesInternal = async (dbReady) => {
  if (!dbReady) return;
  
  try {
    const db = await openDB();
    if (!db) {
      console.warn('[GarminDataPurge] Cannot purge time series, DB not available');
      const summary = { entriesUpdated: 0, seriesCleared: 0, cutoff: getCutoffDate() };
      try {
        localStorage.setItem('garmin_lastTimeSeriesPurge', JSON.stringify(summary));
      } catch (storageError) {
        console.warn('[GarminDataPurge] Unable to persist time-series purge summary:', storageError);
      }
      return summary;
    }
    
    const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const store = tx.objectStore(STORE_DAILY_METRICS);
    const cutoffStr = getCutoffDate();
    let entriesUpdated = 0;
    let seriesCleared = 0;
    
    const req = store.openCursor();
    await new Promise((resolve, reject) => {
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.date < cutoffStr) {
            // Purger time series pour heartRate, bodyBattery, stress et respiration
            let updated = false;
            const metric = cursor.value;
            
            if (metric.heartRate?.timeSeries && metric.heartRate.timeSeries.length > 0) {
              metric.heartRate.timeSeries = [];
              updated = true;
              seriesCleared += 1;
            }
            if (metric.bodyBattery?.timeSeries && metric.bodyBattery.timeSeries.length > 0) {
              metric.bodyBattery.timeSeries = [];
              updated = true;
              seriesCleared += 1;
            }
            if (metric.stress?.timeSeries && metric.stress.timeSeries.length > 0) {
              metric.stress.timeSeries = [];
              updated = true;
              seriesCleared += 1;
            }
            if (metric.respiration?.timeSeries && metric.respiration.timeSeries.length > 0) {
              metric.respiration.timeSeries = [];
              updated = true;
              seriesCleared += 1;
            }
            
            if (updated) {
              cursor.update(metric);
              entriesUpdated += 1;
            }
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
    
    const summary = { entriesUpdated, seriesCleared, cutoff: cutoffStr };
    if (entriesUpdated > 0) {
      console.log(`[GarminDataPurge] Purged time series for ${entriesUpdated} metrics older than ${cutoffStr}`);
    }
    try {
      localStorage.setItem('garmin_lastTimeSeriesPurge', JSON.stringify(summary));
    } catch (storageError) {
      console.warn('[GarminDataPurge] Unable to persist time-series purge summary:', storageError);
    }
    return summary;
  } catch (err) {
    console.error('[GarminDataPurge] Purge time series error:', err);
    const summary = { entriesUpdated: 0, seriesCleared: 0, cutoff: getCutoffDate() };
    try {
      localStorage.setItem('garmin_lastTimeSeriesPurge', JSON.stringify(summary));
    } catch (storageError) {
      console.warn('[GarminDataPurge] Unable to persist time-series purge summary after error:', storageError);
    }
    return summary;
  }
};

/**
 * Supprime les données mock depuis localStorage
 * 
 * @returns {Object} { activities: number, metrics: number } - Nombre d'éléments supprimés
 */
const deleteMockFromLocalStorage = () => {
  let deletedActivities = 0;
  let deletedMetrics = 0;
  const todayLocal = getTodayLocal();
  
  try {
    // Supprimer activités mock
    const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
    for (const key of activityKeys) {
      try {
        const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (isMockActivity(item)) {
            localStorage.removeItem(getStorageKey(STORE_ACTIVITIES, key));
            deletedActivities++;
          }
        }
      } catch (e) {
        console.warn('[GarminDataPurge] Error checking mock activity in localStorage:', key, e);
      }
    }
    
    // Supprimer métriques mock
    const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
    for (const key of metricsKeys) {
      try {
        const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          const { date, ...metric } = item;
          
          // Supprimer si métrique mock par valeurs
          const isMock = isMockMetric(metric);
          
          // Supprimer aussi si date future (probablement données mock)
          let isFuture = false;
          if (date) {
            const dateObj = new Date(date + 'T00:00:00');
            const todayObj = new Date(todayLocal + 'T00:00:00');
            isFuture = dateObj > todayObj;
          }
          
          if (isMock || isFuture) {
            localStorage.removeItem(getStorageKey(STORE_DAILY_METRICS, key));
            deletedMetrics++;
          }
        }
      } catch (e) {
        console.warn('[GarminDataPurge] Error checking mock metric in localStorage:', key, e);
      }
    }
  } catch (err) {
    console.error('[GarminDataPurge] Error deleting mock from localStorage:', err);
  }
  
  return { activities: deletedActivities, metrics: deletedMetrics };
};

/**
 * Supprime les données mock depuis IndexedDB
 * 
 * @param {IDBDatabase} db - Instance de la base de données
 * @returns {Promise<Object>} { activities: number, metrics: number } - Nombre d'éléments supprimés
 */
const deleteMockFromIndexedDB = async (db) => {
  let deletedActivities = 0;
  let deletedMetrics = 0;
  const todayLocal = getTodayLocal();
  
  try {
    // Supprimer activités mock
    const txActivities = db.transaction([STORE_ACTIVITIES], 'readwrite');
    const activityStore = txActivities.objectStore(STORE_ACTIVITIES);
    const activityRequest = activityStore.openCursor();
    
    await new Promise((resolve, reject) => {
      activityRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const activity = cursor.value;
          if (recordBelongsToCurrentScope(activity) && isMockActivity(activity)) {
            cursor.delete();
            deletedActivities++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      activityRequest.onerror = () => reject(activityRequest.error);
    });
    
    // Supprimer métriques mock
    const txMetrics = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const metricsStore = txMetrics.objectStore(STORE_DAILY_METRICS);
    const metricsRequest = metricsStore.openCursor();
    
    await new Promise((resolve, reject) => {
      metricsRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const metric = cursor.value;
          if (!recordBelongsToCurrentScope(metric)) {
            cursor.continue();
            return;
          }
          const { date, ...metricData } = metric;
          
          // Supprimer si métrique mock par valeurs
          const isMock = isMockMetric(metricData);
          
          // Supprimer aussi si date future (probablement données mock)
          let isFuture = false;
          if (date) {
            const dateObj = new Date(date + 'T00:00:00');
            const todayObj = new Date(todayLocal + 'T00:00:00');
            isFuture = dateObj > todayObj;
          }
          
          if (isMock || isFuture) {
            cursor.delete();
            deletedMetrics++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      metricsRequest.onerror = () => reject(metricsRequest.error);
    });
  } catch (err) {
    console.error('[GarminDataPurge] Error deleting mock from IndexedDB:', err);
  }
  
  return { activities: deletedActivities, metrics: deletedMetrics };
};

/**
 * Supprime toutes les données mock (activités + métriques quotidiennes)
 * 
 * Identifie les données mock par :
 * - Caractéristiques spécifiques (valeurs exactes, patterns suspects)
 * - Dates futures (probablement données mock)
 * 
 * ⚠️ ATTENTION : Cette fonction est destructive. Les données mock supprimées ne peuvent pas être récupérées.
 * 
 * @param {boolean} dbReady - Si la base de données est prête
 * @returns {Promise<Object>} { activities: number, metrics: number } - Nombre d'éléments supprimés
 * 
 * @example
 * const result = await deleteMockActivities(true);
 * console.log(`Supprimé ${result.activities} activités et ${result.metrics} métriques mock`);
 */
const deleteMockActivitiesInternal = async (dbReady) => {
  if (!dbReady) {
    return { activities: 0, metrics: 0, fallbackUsed: false };
  }
  
  const useFallback = getUseFallback();
  
  try {
    if (useFallback || !window.indexedDB) {
      // Fallback localStorage
      const result = deleteMockFromLocalStorage();
      console.log(`[GarminDataPurge] Supprimé ${result.activities} activités et ${result.metrics} métriques mock depuis localStorage`);
      const summary = { ...result, fallbackUsed: true };
      try {
        localStorage.setItem('garmin_lastMockCleanup', JSON.stringify(summary));
      } catch (storageError) {
        console.warn('[GarminDataPurge] Unable to persist mock cleanup summary:', storageError);
      }
      return summary;
    }
    
    // IndexedDB
    const db = await openDB();
    if (!db) {
      setUseFallback(true);
      const result = deleteMockFromLocalStorage();
      console.log(`[GarminDataPurge] Supprimé ${result.activities} activités et ${result.metrics} métriques mock depuis localStorage (fallback)`);
      const summary = { ...result, fallbackUsed: true };
      try {
        localStorage.setItem('garmin_lastMockCleanup', JSON.stringify(summary));
      } catch (storageError) {
        console.warn('[GarminDataPurge] Unable to persist mock cleanup summary:', storageError);
      }
      return summary;
    }
    
    const result = await deleteMockFromIndexedDB(db);
    console.log(`[GarminDataPurge] Supprimé ${result.activities} activités et ${result.metrics} métriques mock depuis IndexedDB`);
    const summary = { ...result, fallbackUsed: false };
    try {
      localStorage.setItem('garmin_lastMockCleanup', JSON.stringify(summary));
    } catch (storageError) {
      console.warn('[GarminDataPurge] Unable to persist mock cleanup summary:', storageError);
    }
    return summary;
  } catch (err) {
    console.error('[GarminDataPurge] Error deleting mock data:', err);
    return { activities: 0, metrics: 0, fallbackUsed: false };
  }
};

class PurgeManager {
  constructor(options = {}) {
    this.purgeDays = options.purgeDays ?? DEFAULT_PURGE_DAYS;
  }

  async autoPurge(dbReady, options = {}) {
    const finalOptions = {
      purgeDays: options.purgeDays ?? this.purgeDays
    };
    return autoPurgeInternal(dbReady, finalOptions);
  }

  async purgeOldTimeSeries(dbReady) {
    return purgeOldTimeSeriesInternal(dbReady);
  }

  async deleteMockActivities(dbReady) {
    return deleteMockActivitiesInternal(dbReady);
  }
}

export const purgeManager = new PurgeManager();

export const autoPurge = (dbReady, options) => purgeManager.autoPurge(dbReady, options);
export const purgeOldTimeSeries = (dbReady) => purgeManager.purgeOldTimeSeries(dbReady);
export const deleteMockActivities = (dbReady) => purgeManager.deleteMockActivities(dbReady);

