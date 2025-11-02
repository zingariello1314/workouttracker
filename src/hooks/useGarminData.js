import { useState, useEffect, useCallback } from 'react';
import { DATE_RANGE } from '../components/tabs/GarminTab/constants';

const DB_NAME = 'GarminDataDB';
const DB_VERSION = 1;
const STORE_ACTIVITIES = 'activities';
const STORE_DAILY_METRICS = 'dailyMetrics';
const STORE_DEVICE_META = 'deviceMeta';

let dbInstance = null;
let useFallback = false;

// 🔴 FIX #3: Queue de sauvegarde pour éviter race conditions
const saveQueue = [];
let isSaving = false;

const processSaveQueue = async () => {
  if (isSaving || saveQueue.length === 0) return;
  isSaving = true;
  try {
    const item = saveQueue.shift();
    if (item && item.fn) {
      await item.fn();
    }
  } catch (err) {
    console.error('[GarminData] Error in save queue:', err);
  } finally {
    isSaving = false;
    if (saveQueue.length > 0) {
      // Processer le prochain item
      setTimeout(() => processSaveQueue(), 0);
    }
  }
};

// Fallback localStorage helpers
const getStorageKey = (store, key) => `garmin_${store}_${key}`;
const getAllStorageKeys = (store) => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`garmin_${store}_`)) {
      keys.push(key.replace(`garmin_${store}_`, ''));
    }
  }
  return keys;
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    // 🔴 FIX #1: Vérifier support IndexedDB
    if (!window.indexedDB) {
      console.warn('[GarminData] IndexedDB non supporté, utilisation du fallback localStorage');
      useFallback = true;
      resolve(null); // Retourner null pour indiquer fallback
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        const error = event.target.error;
        console.error('[GarminData] IndexedDB open error:', error);
        // Fallback vers localStorage en cas d'erreur
        console.warn('[GarminData] Basculement vers localStorage fallback');
        useFallback = true;
        resolve(null);
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        
        // Vérifier que la DB est vraiment prête
        if (!dbInstance) {
          console.warn('[GarminData] DB instance invalide, fallback localStorage');
          useFallback = true;
          resolve(null);
          return;
        }
        
        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;

          // Store: activities (index: date, type)
          if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
            const activityStore = db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id', autoIncrement: false });
            activityStore.createIndex('date', 'date', { unique: false });
            activityStore.createIndex('type', 'type', { unique: false });
            activityStore.createIndex('date_type', ['date', 'type'], { unique: false });
          }

          // Store: dailyMetrics (index: date)
          if (!db.objectStoreNames.contains(STORE_DAILY_METRICS)) {
            const metricsStore = db.createObjectStore(STORE_DAILY_METRICS, { keyPath: 'date', autoIncrement: false });
            metricsStore.createIndex('date', 'date', { unique: true });
          }

          // Store: deviceMeta
          if (!db.objectStoreNames.contains(STORE_DEVICE_META)) {
            db.createObjectStore(STORE_DEVICE_META, { keyPath: 'key', autoIncrement: false });
          }
        } catch (upgradeError) {
          console.error('[GarminData] Upgrade error:', upgradeError);
          useFallback = true;
          resolve(null);
        }
      };

      request.onblocked = () => {
        console.warn('[GarminData] IndexedDB bloqué, fallback localStorage');
        useFallback = true;
        resolve(null);
      };
    } catch (err) {
      console.error('[GarminData] Error opening DB:', err);
      useFallback = true;
      resolve(null);
    }
  });
};

/**
 * Hook principal pour la gestion des données Garmin dans IndexedDB
 * Gère la sauvegarde, le chargement, et l'optimisation des données
 * 🔴 FIX #51-60: Documentation JSDoc complète
 * 
 * @returns {Object} Interface du hook
 * @returns {boolean} returns.dbReady - Si la base de données est prête
 * @returns {Function} returns.saveActivities - Fonction pour sauvegarder les activités
 * @returns {Function} returns.saveDailyMetrics - Fonction pour sauvegarder les métriques
 * @returns {Function} returns.loadAllData - Fonction pour charger toutes les données
 * @returns {Function} returns.loadDataByRange - Fonction pour charger par plage de dates
 * @returns {Function} returns.loadDataForTab - Fonction pour charger selon l'onglet
 * @returns {Function} returns.calculateDateRange - Fonction pour calculer plages de dates
 * @returns {Function} returns.exportAll - Fonction pour exporter toutes les données
 * @returns {Function} returns.importAll - Fonction pour importer des données
 * @returns {Function} returns.purgeOldTimeSeries - Fonction pour purger les vieilles time series
 * @returns {Function} returns.autoPurge - Fonction pour purge automatique
 * 
 * @example
 * const { saveActivities, loadAllData } = useGarminData();
 * await saveActivities({ swimming: [...], cardio: [...] });
 * const data = await loadAllData();
 */
export const useGarminData = () => {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    openDB()
      .then((db) => {
        // 🔴 FIX #1: dbReady = true même si fallback localStorage
        setDbReady(true);
        if (useFallback) {
          console.warn('[GarminData] Mode fallback localStorage activé');
        }
      })
      .catch((err) => {
        console.error('[GarminData] DB error:', err);
        useFallback = true;
        setDbReady(true); // Permettre fonctionnement en fallback
      });
  }, []);

  /**
   * Sauvegarde les activités dans IndexedDB avec gestion de queue
   * 🔴 FIX #3: Utilise une queue pour éviter les race conditions
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @param {Object} activities - Objet contenant les activités par type
   * @param {Array} activities.swimming - Liste des activités de natation
   * @param {Array} activities.jumpRope - Liste des activités de corde à sauter
   * @param {Array} activities.cardio - Liste des activités cardio
   * @returns {Promise<void>} Promise résolue quand la sauvegarde est terminée
   * @throws {Error} Si la sauvegarde échoue
   */
  const saveActivities = useCallback(async (activities) => {
    if (!dbReady) return;
    
    // 🔴 FIX #3: Utiliser queue pour éviter race conditions
    return new Promise((resolve, reject) => {
      saveQueue.push({
        fn: async () => {
          try {
            await saveActivitiesInternal(activities);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
      processSaveQueue();
    });
  }, [dbReady]);

  // Fonction interne pour la sauvegarde réelle
  const saveActivitiesInternal = async (activities) => {
    // 🔴 FIX #1: Fallback localStorage si IndexedDB indisponible
    if (useFallback || !window.indexedDB) {
      try {
        for (const type of ['swimming', 'jumpRope', 'cardio']) {
          const items = activities[type] || [];
          for (const item of items) {
            const key = getStorageKey(STORE_ACTIVITIES, item.id);
            const existing = localStorage.getItem(key);
            
            if (!existing) {
              localStorage.setItem(key, JSON.stringify({ ...item, type, source: item.source || 'garmin', lastSynced: new Date().toISOString() }));
            } else {
              const existingData = JSON.parse(existing);
              const merged = {
                ...existingData,
                ...item,
                type: type,
                source: item.source || existingData.source || 'garmin',
                lastSynced: new Date().toISOString(),
                calories: item.calories || existingData.calories,
                intensityMinutes: item.intensityMinutes || existingData.intensityMinutes,
                connectIQ: item.connectIQ || existingData.connectIQ,
                swimmingMetrics: item.swimmingMetrics || existingData.swimmingMetrics,
                timeMetrics: item.timeMetrics || existingData.timeMetrics,
              };
              localStorage.setItem(key, JSON.stringify(merged));
            }
          }
        }
        console.log('[GarminData] Activities saved to localStorage');
        return;
      } catch (err) {
        console.error('[GarminData] Save activities to localStorage error:', err);
        return;
      }
    }

    try {
      const db = await openDB();
      if (!db) {
        // Si openDB retourne null, utiliser fallback
        useFallback = true;
        return saveActivities(activities); // Récursion avec fallback
      }
      
      const tx = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const store = tx.objectStore(STORE_ACTIVITIES);

      // Déduplication robuste par ID Garmin (activityId)
      // L'ID Garmin est unique et persiste entre les sync
      for (const type of ['swimming', 'jumpRope', 'cardio']) {
        const items = activities[type] || [];
        for (const item of items) {
          try {
            // Vérifier si l'activité existe déjà par son ID
            const existing = await new Promise((resolve, reject) => {
              const req = store.get(item.id);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => resolve(null);
            });
            
            // 🔴 FIX #7: Comparer timestamps pour garder la version la plus récente
            const existingSync = existing ? new Date(existing.lastSynced || 0) : null;
            const newSync = new Date(item.lastSynced || new Date().toISOString());
            
            if (!existing) {
              // Nouvelle activité, sauvegarder directement
              await new Promise((resolve, reject) => {
                const req = store.put({ ...item, type, source: item.source || 'garmin', lastSynced: newSync.toISOString() });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
              });
            } else if (existing.id === item.id) {
              // Activité existante : comparer lastSynced pour garder la version la plus récente
              // 🔴 FIX #7: Ne fusionner que si nouvelle version plus récente OU si type a changé
              const shouldUpdate = newSync > existingSync || existing.type !== type;
              
              if (shouldUpdate) {
                // Nouvelle version plus récente ou type changé, fusionner intelligemment
                // IMPORTANT: Forcer le type selon la catégorie du JSON Python (type vient de la boucle)
                // Si l'activité est dans "swimming", elle DOIT être de type "swimming", pas "cardio"
                const merged = {
                  ...existing,
                  ...item,
                  type: type, // FORCER le type selon la catégorie du JSON (corrige natation -> cardio)
                  source: item.source || existing.source || 'garmin',
                  lastSynced: newSync.toISOString(),
                  // Fusionner les objets imbriqués (calories, intensityMinutes, etc.)
                  // Préférer nouvelles valeurs si plus récentes, sinon garder existantes
                  calories: (newSync > existingSync ? item.calories : existing.calories) || item.calories || existing.calories,
                  intensityMinutes: (newSync > existingSync ? item.intensityMinutes : existing.intensityMinutes) || item.intensityMinutes || existing.intensityMinutes,
                  connectIQ: item.connectIQ || existing.connectIQ,
                  swimmingMetrics: item.swimmingMetrics || existing.swimmingMetrics,
                  timeMetrics: item.timeMetrics || existing.timeMetrics,
                };
                await new Promise((resolve, reject) => {
                  const req = store.put(merged);
                  req.onsuccess = () => resolve();
                  req.onerror = () => reject(req.error);
                });
              }
              // Sinon, garder la version existante (plus récente)
            }
          } catch (e) {
            console.warn('[GarminData] Error saving activity:', item.id, e);
            // Continuer même en cas d'erreur pour une activité spécifique
          }
        }
      }
      
      console.log('[GarminData] Activities saved successfully');
    } catch (err) {
      console.error('[GarminData] Save activities error:', err);
      // En cas d'erreur, basculer en fallback
      useFallback = true;
      throw err; // La queue gérera le retry si nécessaire
    }
  };

  const saveDailyMetrics = useCallback(async (dailyMetrics) => {
    if (!dbReady) return;
    
    // 🔴 FIX #3: Utiliser queue pour éviter race conditions
    return new Promise((resolve, reject) => {
      saveQueue.push({
        fn: async () => {
          try {
            await saveDailyMetricsInternal(dailyMetrics);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
      processSaveQueue();
    });
  }, [dbReady]);

  // Fonction interne pour la sauvegarde réelle
  const saveDailyMetricsInternal = async (dailyMetrics) => {
    // 🔴 FIX #1: Fallback localStorage si IndexedDB indisponible
    if (useFallback || !window.indexedDB) {
      try {
        for (const [date, metrics] of Object.entries(dailyMetrics)) {
          const key = getStorageKey(STORE_DAILY_METRICS, date);
          const existingStr = localStorage.getItem(key);
          const existing = existingStr ? JSON.parse(existingStr) : null;
          
          // 🔴 FIX #12: Dédupliquer timeSeries AVANT fusion
          const deduplicateTimeSeries = (series) => {
            if (!Array.isArray(series) || series.length === 0) return [];
            const seen = new Map();
            return series
              .filter(ts => {
                if (!ts || !ts.timestamp) return false;
                const key = ts.timestamp;
                if (seen.has(key)) return false;
                seen.set(key, true);
                return true;
              })
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          };
          
          const merged = existing 
            ? {
                ...existing,
                ...metrics,
                calories: { ...existing.calories, ...(metrics.calories || {}) },
                heartRate: { 
                  ...existing.heartRate, 
                  ...(metrics.heartRate || {}),
                  timeSeries: deduplicateTimeSeries([
                    ...(existing.heartRate?.timeSeries || []),
                    ...(metrics.heartRate?.timeSeries || [])
                  ]),
                },
                respiration: metrics.respiration || existing.respiration,
                sleep: { ...existing.sleep, ...(metrics.sleep || {}) },
                intensityMinutes: metrics.intensityMinutes || existing.intensityMinutes,
                lastSynced: new Date().toISOString(),
              }
            : { 
                date, 
                ...metrics, 
                lastSynced: new Date().toISOString() 
              };
          
          localStorage.setItem(key, JSON.stringify(merged));
        }
        console.log('[GarminData] Daily metrics saved to localStorage');
        return;
      } catch (err) {
        console.error('[GarminData] Save daily metrics to localStorage error:', err);
        return;
      }
    }

    try {
      const db = await openDB();
      if (!db) {
        useFallback = true;
        return saveDailyMetrics(dailyMetrics);
      }
      
      const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
      const store = tx.objectStore(STORE_DAILY_METRICS);

      // 🔴 FIX #12: Fonction de déduplication pour timeSeries
      const deduplicateTimeSeries = (series) => {
        if (!Array.isArray(series) || series.length === 0) return [];
        const seen = new Map();
        return series
          .filter(ts => {
            if (!ts || !ts.timestamp) return false;
            const key = ts.timestamp;
            if (seen.has(key)) return false;
            seen.set(key, true);
            return true;
          })
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      };

      for (const [date, metrics] of Object.entries(dailyMetrics)) {
        try {
          // Récupérer les métriques existantes pour cette date
          const existing = await new Promise((resolve, reject) => {
            const req = store.get(date);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
          });
          
          // Fusionner les métriques : nouvelles valeurs remplacent les anciennes, mais préserver ce qui n'existe pas
          const merged = existing 
            ? {
                ...existing,
                ...metrics,
                // Fusionner les objets imbriqués
                calories: { ...existing.calories, ...(metrics.calories || {}) },
                heartRate: { 
                  ...existing.heartRate, 
                  ...(metrics.heartRate || {}),
                  // 🔴 FIX #12: Dédupliquer AVANT de fusionner timeSeries
                  timeSeries: deduplicateTimeSeries([
                    ...(existing.heartRate?.timeSeries || []),
                    ...(metrics.heartRate?.timeSeries || [])
                  ]),
                },
                respiration: metrics.respiration || existing.respiration,
                sleep: { ...existing.sleep, ...(metrics.sleep || {}) },
                intensityMinutes: metrics.intensityMinutes || existing.intensityMinutes,
                lastSynced: new Date().toISOString(),
              }
            : { 
                date, 
                ...metrics, 
                lastSynced: new Date().toISOString() 
              };
          
          await new Promise((resolve, reject) => {
            const req = store.put(merged);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        } catch (e) {
          console.warn('[GarminData] Error saving daily metrics for', date, e);
          // Continuer même en cas d'erreur pour une date spécifique
        }
      }
      
      console.log('[GarminData] Daily metrics saved successfully');
    } catch (err) {
      console.error('[GarminData] Save daily metrics error:', err);
      useFallback = true;
      throw err; // La queue gérera le retry si nécessaire
    }
  };

  /**
   * Calcule la plage de dates selon le periodFilter
   * 🔴 FIX #5: Utilisé pour optimiser le chargement des données
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
   * @param {string|null} customStartDate - Date de début personnalisée (YYYY-MM-DD) pour 'custom'
   * @param {string|null} customEndDate - Date de fin personnalisée (YYYY-MM-DD) pour 'custom'
   * @returns {Object} { start, end } - Plage de dates calculée
   * @returns {string} returns.start - Date de début (YYYY-MM-DD)
   * @returns {string} returns.end - Date de fin (YYYY-MM-DD)
   */
  const calculateDateRange = useCallback((periodFilter, customStartDate, customEndDate) => {
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
  }, []);

  // OPTIMISATION PHASE 2.2 : Charger les données avec pagination/rangées queries
  const loadDataByRange = useCallback(async (startDate, endDate) => {
    if (!dbReady) return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    
    // Initialiser avec la structure correcte
    const activities = { swimming: [], jumpRope: [], cardio: [] };
    const dailyMetrics = {};
    
    // Fallback localStorage si IndexedDB indisponible
    if (useFallback || !window.indexedDB) {
      try {
        // Charger activités depuis localStorage dans la plage
        const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
        for (const key of activityKeys) {
          try {
            const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
            if (itemStr) {
              const item = JSON.parse(itemStr);
              if (item.date && item.date >= startDate && item.date <= endDate) {
                if (item.type === 'swimming') activities.swimming.push(item);
                else if (item.type === 'jumpRope') activities.jumpRope.push(item);
                else if (item.type === 'cardio') activities.cardio.push(item);
              }
            }
          } catch (e) {
            console.warn('[GarminData] Error loading activity from localStorage:', key, e);
          }
        }
        
        // Charger métriques depuis localStorage dans la plage
        const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
        for (const key of metricsKeys) {
          try {
            const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, key));
            if (itemStr) {
              const item = JSON.parse(itemStr);
              if (item.date && item.date >= startDate && item.date <= endDate) {
                const { date, ...rest } = item;
                dailyMetrics[date] = rest;
              }
            }
          } catch (e) {
            console.warn('[GarminData] Error loading metric from localStorage:', key, e);
          }
        }
        
        return { activities, dailyMetrics };
      } catch (err) {
        console.error('[GarminData] Load by range from localStorage error:', err);
        return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
      }
    }
    
    try {
      const db = await openDB();
      if (!db) {
        useFallback = true;
        // Ne pas faire de récursion, charger depuis localStorage directement
        try {
          const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
          for (const key of metricsKeys) {
            try {
              const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, key));
              if (itemStr) {
                const item = JSON.parse(itemStr);
                if (item.date && item.date >= startDate && item.date <= endDate) {
                  const { date, ...rest } = item;
                  dailyMetrics[date] = rest;
                }
              }
            } catch (e) {
              console.warn('[GarminData] Error loading metric from localStorage:', key, e);
            }
          }
        } catch (err) {
          console.error('[GarminData] Fallback localStorage error:', err);
        }
        return { activities, dailyMetrics };
      }

      // OPTIMISATION : Range query pour dailyMetrics (index sur 'date')
      try {
        const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readonly');
        const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
        
        // Vérifier si l'index existe
        let dateIndex;
        try {
          dateIndex = metricsStore.index('date');
        } catch (idxErr) {
          // Index n'existe pas, charger tout et filtrer
          console.warn('[GarminData] Index "date" not found, loading all and filtering');
          const allMetrics = await new Promise((resolve, reject) => {
            const req = metricsStore.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          });
          
          allMetrics.forEach(metric => {
            if (metric && metric.date && metric.date >= startDate && metric.date <= endDate) {
              const { date, ...rest } = metric;
              dailyMetrics[date] = rest;
            }
          });
        }
        
        if (dateIndex) {
          // Utiliser IDBKeyRange pour les plages de dates
          const dateRange = IDBKeyRange.bound(startDate, endDate);
          const metricsRequest = dateIndex.getAll(dateRange);
          
          const metricsResults = await new Promise((resolve, reject) => {
            metricsRequest.onsuccess = () => resolve(metricsRequest.result || []);
            metricsRequest.onerror = () => reject(metricsRequest.error);
          });

          // Convertir en objet { date: metrics } (sans la clé date dans la valeur)
          metricsResults.forEach(metric => {
            if (metric && metric.date) {
              const { date, ...rest } = metric;
              dailyMetrics[date] = rest;
            }
          });
        }
      } catch (metricsErr) {
        console.error('[GarminData] Error loading metrics by range:', metricsErr);
      }

      // OPTIMISATION : Range query pour activities par date
      try {
        const activitiesTx = db.transaction([STORE_ACTIVITIES], 'readonly');
        const activitiesStore = activitiesTx.objectStore(STORE_ACTIVITIES);
        
        let dateIdx;
        try {
          dateIdx = activitiesStore.index('date');
        } catch (idxErr) {
          // Index n'existe pas, charger tout et filtrer
          console.warn('[GarminData] Index "date" not found for activities, loading all and filtering');
          const allActivities = await new Promise((resolve, reject) => {
            const req = activitiesStore.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          });
          
          allActivities.forEach(activity => {
            if (activity && activity.date && activity.date >= startDate && activity.date <= endDate) {
              if (activity.type === 'swimming') activities.swimming.push(activity);
              else if (activity.type === 'jumpRope') activities.jumpRope.push(activity);
              else if (activity.type === 'cardio') activities.cardio.push(activity);
            }
          });
        }
        
        if (dateIdx) {
          const activitiesRange = IDBKeyRange.bound(startDate, endDate);
          const activitiesRequest = dateIdx.getAll(activitiesRange);
          
          const activitiesResults = await new Promise((resolve, reject) => {
            activitiesRequest.onsuccess = () => resolve(activitiesRequest.result || []);
            activitiesRequest.onerror = () => reject(activitiesRequest.error);
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
        }
      } catch (activitiesErr) {
        console.error('[GarminData] Error loading activities by range:', activitiesErr);
      }

      return { activities, dailyMetrics };
    } catch (err) {
      console.error('[GarminData] Load by range error:', err);
      useFallback = true;
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    }
  }, [dbReady]);

  /**
   * 🔴 FIX #5: Charge toutes les données (utilisé comme fallback par loadDataForTab)
   * Optimise la mémoire en ne chargeant que ce qui est affiché
   */
  const loadAllData = useCallback(async () => {
    if (!dbReady) return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    
    // 🔴 FIX #1: Fallback localStorage si IndexedDB indisponible
    if (useFallback || !window.indexedDB) {
      try {
        const activities = { swimming: [], jumpRope: [], cardio: [] };
        const dailyMetrics = {};
        
        // Charger activités depuis localStorage
        const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
        for (const key of activityKeys) {
          try {
            const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
            if (itemStr) {
              const item = JSON.parse(itemStr);
              if (item.type === 'swimming') activities.swimming.push(item);
              else if (item.type === 'jumpRope') activities.jumpRope.push(item);
              else if (item.type === 'cardio') activities.cardio.push(item);
            }
          } catch (e) {
            console.warn('[GarminData] Error loading activity from localStorage:', key, e);
          }
        }
        
        // Charger métriques depuis localStorage
        const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
        for (const key of metricsKeys) {
          try {
            const itemStr = localStorage.getItem(getStorageKey(STORE_DAILY_METRICS, key));
            if (itemStr) {
              const item = JSON.parse(itemStr);
              const { date, ...rest } = item;
              if (date) dailyMetrics[date] = rest;
            }
          } catch (e) {
            console.warn('[GarminData] Error loading metric from localStorage:', key, e);
          }
        }
        
        console.log('[GarminData] Data loaded from localStorage');
        return { activities, dailyMetrics };
      } catch (err) {
        console.error('[GarminData] Load from localStorage error:', err);
        return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
      }
    }

    try {
      const db = await openDB();
      if (!db) {
        useFallback = true;
        // Retourner données vides plutôt que récursion infinie
        return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
      }
      
      const activities = { swimming: [], jumpRope: [], cardio: [] };
      const dailyMetrics = {};

      // Load activities
      const actTx = db.transaction([STORE_ACTIVITIES], 'readonly');
      const actStore = actTx.objectStore(STORE_ACTIVITIES);
      const actReq = actStore.getAll();
      await new Promise((resolve, reject) => {
        actReq.onsuccess = () => {
          actReq.result.forEach((item) => {
            if (item.type === 'swimming') activities.swimming.push(item);
            else if (item.type === 'jumpRope') activities.jumpRope.push(item);
            else if (item.type === 'cardio') activities.cardio.push(item);
          });
          resolve();
        };
        actReq.onerror = () => reject(actReq.error);
      });

      // Load daily metrics
      const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readonly');
      const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
      const metricsReq = metricsStore.getAll();
      await new Promise((resolve, reject) => {
        metricsReq.onsuccess = () => {
          metricsReq.result.forEach((item) => {
            const { date, ...rest } = item;
            dailyMetrics[date] = rest;
          });
          resolve();
        };
        metricsReq.onerror = () => reject(metricsReq.error);
      });

      return { activities, dailyMetrics };
    } catch (err) {
      console.error('[GarminData] Load error:', err);
      useFallback = true;
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} }; // Retourner vide plutôt que récursion infinie
    }
  }, [dbReady]);

  /**
   * Charge seulement les données nécessaires selon l'onglet actif
   * 🔴 FIX #5: Optimise la mémoire en ne chargeant que ce qui est affiché
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @param {string} tab - Onglet actif ('activities', 'metrics', 'charts', 'dashboard')
   * @param {string|null} selectedDate - Date sélectionnée (YYYY-MM-DD) ou null
   * @param {string} periodFilter - Filtre de période ('all', 'week', 'month', 'year', 'custom')
   * @param {string|null} customStartDate - Date de début personnalisée pour 'custom'
   * @param {string|null} customEndDate - Date de fin personnalisée pour 'custom'
   * @returns {Promise<Object>} { activities, dailyMetrics }
   * @returns {Object} returns.activities - Activités par type { swimming, jumpRope, cardio }
   * @returns {Object} returns.dailyMetrics - Métriques quotidiennes par date (YYYY-MM-DD)
   */
  const loadDataForTab = useCallback(async (tab, selectedDate, periodFilter, customStartDate, customEndDate) => {
    if (!dbReady) {
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    }

    // Onglet "activities" : charger les 90 derniers jours pour avoir toutes les activités disponibles
    // (nécessaire car l'utilisateur peut vouloir voir toutes ses activités, pas seulement celles d'un jour)
    // 🔴 FIX #51-60: Utiliser constantes pour les plages de dates
    if (tab === 'activities') {
      if (selectedDate) {
        // Si une date est sélectionnée, charger cette date + jours avant/après pour contexte
        const date = new Date(selectedDate);
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - DATE_RANGE.ACTIVITIES_DAYS);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + DATE_RANGE.ACTIVITIES_DAYS);
        return await loadDataByRange(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
      } else {
        // Sinon, charger les derniers jours pour métriques
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const daysAgo = new Date(now);
        daysAgo.setDate(daysAgo.getDate() - DATE_RANGE.METRICS_DAYS);
        const startDate = daysAgo.toISOString().split('T')[0];
        return await loadDataByRange(startDate, today);
      }
    }

    // Onglet "charts" avec filtre temporel : charger seulement la plage
    if (tab === 'charts' && periodFilter && periodFilter !== 'all') {
      const range = calculateDateRange(periodFilter, customStartDate, customEndDate);
      if (range) {
        return await loadDataByRange(range.start, range.end);
      }
    }

    // 🔴 FIX #51-60: Utiliser constante pour métriques
    // Onglet "metrics" : charger les derniers jours pour avoir les données complètes
    // (nécessaire car les composants peuvent afficher des comparaisons/statistiques)
    if (tab === 'metrics') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const daysAgo = new Date(now);
      daysAgo.setDate(daysAgo.getDate() - DATE_RANGE.METRICS_DAYS);
      const startDate = daysAgo.toISOString().split('T')[0];
      return await loadDataByRange(startDate, today);
    }

    // Dashboard ou autres cas : charger tout
    return await loadAllData();
  }, [dbReady, loadDataByRange, loadAllData, calculateDateRange]);

  // 🟡 FIX #31: Nettoyer automatiquement les données > 90 jours
  const autoPurge = useCallback(async () => {
    if (!dbReady) return;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    
    try {
      const db = await openDB();
      if (!db || useFallback) {
        // Fallback localStorage
        const activityKeys = getAllStorageKeys(STORE_ACTIVITIES);
        let purgedCount = 0;
        for (const key of activityKeys) {
          try {
            const itemStr = localStorage.getItem(getStorageKey(STORE_ACTIVITIES, key));
            if (itemStr) {
              const item = JSON.parse(itemStr);
              if (item.date && item.date < cutoffStr) {
                localStorage.removeItem(getStorageKey(STORE_ACTIVITIES, key));
                purgedCount++;
              }
            }
          } catch (e) {
            console.warn('[GarminData] Error purging activity from localStorage:', key, e);
          }
        }
        
        const metricsKeys = getAllStorageKeys(STORE_DAILY_METRICS);
        for (const key of metricsKeys) {
          try {
            if (key < cutoffStr) {
              localStorage.removeItem(getStorageKey(STORE_DAILY_METRICS, key));
              purgedCount++;
            }
          } catch (e) {
            console.warn('[GarminData] Error purging metric from localStorage:', key, e);
          }
        }
        
        if (purgedCount > 0) {
          console.log(`[GarminData] Purged ${purgedCount} old items from localStorage (older than ${cutoffStr})`);
        }
        return;
      }
      
      // IndexedDB purge
      const actTx = db.transaction([STORE_ACTIVITIES], 'readwrite');
      const actStore = actTx.objectStore(STORE_ACTIVITIES);
      const actReq = actStore.getAll();
      
      let purgedCount = 0;
      await new Promise((resolve, reject) => {
        actReq.onsuccess = async () => {
          for (const item of actReq.result) {
            if (item.date && item.date < cutoffStr) {
              try {
                await new Promise((res, rej) => {
                  const delReq = actStore.delete(item.id || item.date);
                  delReq.onsuccess = () => res();
                  delReq.onerror = () => rej(delReq.error);
                });
                purgedCount++;
              } catch (e) {
                console.warn('[GarminData] Error deleting old activity:', item.id, e);
              }
            }
          }
          resolve();
        };
        actReq.onerror = () => reject(actReq.error);
      });
      
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
                purgedCount++;
              } catch (e) {
                console.warn('[GarminData] Error deleting old metric:', item.date, e);
              }
            }
          }
          resolve();
        };
        metricsReq.onerror = () => reject(metricsReq.error);
      });
      
      if (purgedCount > 0) {
        console.log(`[GarminData] Purged ${purgedCount} old items from IndexedDB (older than ${cutoffStr})`);
      }
    } catch (err) {
      console.error('[GarminData] Auto-purge error:', err);
    }
  }, [dbReady]);
  
  // 🟡 FIX #31: Exécuter auto-purge une fois par jour
  useEffect(() => {
    if (!dbReady) return;
    
    const lastPurge = localStorage.getItem('lastGarminPurge');
    const now = new Date().toISOString().split('T')[0];
    
    if (lastPurge !== now) {
      autoPurge();
      localStorage.setItem('lastGarminPurge', now);
    }
  }, [dbReady, autoPurge]);

  /**
   * Exporte toutes les données depuis IndexedDB
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @returns {Promise<Object>} Toutes les données (activities, dailyMetrics)
   */
  const exportAll = useCallback(async () => {
    return await loadAllData();
  }, [loadAllData]);

  /**
   * Importe des données dans IndexedDB
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @param {Object} data - Données à importer
   * @param {Object} data.activities - Activités par type (optionnel)
   * @param {Object} data.dailyMetrics - Métriques quotidiennes par date (optionnel)
   * @returns {Promise<void>} Promise résolue quand l'import est terminé
   */
  const importAll = useCallback(async (data) => {
    if (data.activities) await saveActivities(data.activities);
    if (data.dailyMetrics) await saveDailyMetrics(data.dailyMetrics);
  }, [saveActivities, saveDailyMetrics]);

  /**
   * Purge les time series > 90 jours pour libérer de l'espace
   * 🔴 FIX #51-60: Documentation JSDoc
   * 
   * @returns {Promise<void>} Promise résolue quand la purge est terminée
   */
  const purgeOldTimeSeries = useCallback(async () => {
    if (!dbReady) return;
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
      const store = tx.objectStore(STORE_DAILY_METRICS);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const req = store.openCursor();
      await new Promise((resolve, reject) => {
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (cursor.value.date < cutoffStr && cursor.value.heartRate?.timeSeries) {
              cursor.value.heartRate.timeSeries = [];
              cursor.update(cursor.value);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('[GarminData] Purge error:', err);
    }
  }, [dbReady]);

  return {
    dbReady,
    saveActivities,
    saveDailyMetrics,
    loadAllData,
    loadDataByRange,  // OPTIMISATION PHASE 2.2 : Export pour utilisation avec filtres
    loadDataForTab,  // 🔴 FIX #5: Charger seulement les données nécessaires selon l'onglet
    calculateDateRange,  // 🔴 FIX #5: Utilitaire pour calculer plages de dates
    exportAll,
    importAll,
    purgeOldTimeSeries,
    autoPurge,  // 🟢 FIX #31: Purge automatique des données obsolètes
  };
};

