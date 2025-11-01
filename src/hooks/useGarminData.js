import { useState, useEffect, useCallback } from 'react';

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
            
            // Si elle n'existe pas, ou si elle existe mais avec un type différent, sauvegarder
            if (!existing) {
              // Nouvelle activité, sauvegarder directement
              await new Promise((resolve, reject) => {
                const req = store.put({ ...item, type, source: item.source || 'garmin', lastSynced: new Date().toISOString() });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
              });
            } else if (existing.id === item.id) {
              // Activité existante : fusionner les données (mettre à jour avec les nouvelles valeurs)
              // IMPORTANT: Forcer le type selon la catégorie du JSON Python (type vient de la boucle)
              // Si l'activité est dans "swimming", elle DOIT être de type "swimming", pas "cardio"
              const merged = {
                ...existing,
                ...item,
                type: type, // FORCER le type selon la catégorie du JSON (corrige natation -> cardio)
                source: item.source || existing.source || 'garmin',
                lastSynced: new Date().toISOString(),
                // Fusionner les objets imbriqués (calories, intensityMinutes, etc.)
                calories: item.calories || existing.calories,
                intensityMinutes: item.intensityMinutes || existing.intensityMinutes,
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

  // OPTIMISATION PHASE 2.2 : Charger les données avec pagination/rangées queries
  const loadDataByRange = useCallback(async (startDate, endDate) => {
    if (!dbReady) return { activities: {}, dailyMetrics: {} };
    try {
      const db = await openDB();
      const activities = {};
      const dailyMetrics = {};

      // OPTIMISATION : Range query pour dailyMetrics (index sur 'date')
      const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readonly');
      const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
      const dateIndex = metricsStore.index('date');
      
      // Utiliser IDBKeyRange pour les plages de dates
      const dateRange = IDBKeyRange.bound(startDate, endDate);
      const metricsRequest = dateIndex.getAll(dateRange);
      
      const metricsResults = await new Promise((resolve, reject) => {
        metricsRequest.onsuccess = () => resolve(metricsRequest.result || []);
        metricsRequest.onerror = () => reject(metricsRequest.error);
      });

      // Convertir en objet { date: metrics }
      metricsResults.forEach(metric => {
        if (metric && metric.date) {
          dailyMetrics[metric.date] = metric;
        }
      });

      // OPTIMISATION : Range query pour activities par date
      const activitiesTx = db.transaction([STORE_ACTIVITIES], 'readonly');
      const activitiesStore = activitiesTx.objectStore(STORE_ACTIVITIES);
      const dateIdx = activitiesStore.index('date');
      
      const activitiesRange = IDBKeyRange.bound(startDate, endDate);
      const activitiesRequest = dateIdx.getAll(activitiesRange);
      
      const activitiesResults = await new Promise((resolve, reject) => {
        activitiesRequest.onsuccess = () => resolve(activitiesRequest.result || []);
        activitiesRequest.onerror = () => reject(activitiesRequest.error);
      });

      // Organiser par type
      activities.swimming = [];
      activities.jumpRope = [];
      activities.cardio = [];

      activitiesResults.forEach(activity => {
        if (!activity || !activity.type) return;
        if (activity.type === 'swimming') {
          activities.swimming.push(activity);
        } else if (activity.type === 'jumpRope') {
          activities.jumpRope.push(activity);
        } else {
          activities.cardio.push(activity);
        }
      });

      return { activities, dailyMetrics };
    } catch (err) {
      console.error('[GarminData] Load by range error:', err);
      return { activities: {}, dailyMetrics: {} };
    }
  }, [dbReady]);

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
        return loadAllData();
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
      return loadAllData(); // Retry avec fallback
    }
  }, [dbReady]);

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

  const exportAll = useCallback(async () => {
    return await loadAllData();
  }, [loadAllData]);

  const importAll = useCallback(async (data) => {
    if (data.activities) await saveActivities(data.activities);
    if (data.dailyMetrics) await saveDailyMetrics(data.dailyMetrics);
  }, [saveActivities, saveDailyMetrics]);

  // Purge time-series > 90 jours (garder pour compatibilité)
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
    exportAll,
    importAll,
    purgeOldTimeSeries,
    autoPurge,  // 🟢 FIX #31: Purge automatique des données obsolètes
  };
};

