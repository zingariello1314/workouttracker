import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'GarminDataDB';
const DB_VERSION = 1;
const STORE_ACTIVITIES = 'activities';
const STORE_DAILY_METRICS = 'dailyMetrics';
const STORE_DEVICE_META = 'deviceMeta';

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
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
    };
  });
};

export const useGarminData = () => {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    openDB()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[GarminData] DB error:', err);
        setDbReady(false);
      });
  }, []);

  const saveActivities = useCallback(async (activities) => {
    if (!dbReady) return;
    try {
      const db = await openDB();
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
    }
  }, [dbReady]);

  const saveDailyMetrics = useCallback(async (dailyMetrics) => {
    if (!dbReady) return;
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
      const store = tx.objectStore(STORE_DAILY_METRICS);

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
                  // Fusionner timeSeries : concaténer et dédupliquer
                  timeSeries: [
                    ...(existing.heartRate?.timeSeries || []),
                    ...(metrics.heartRate?.timeSeries || [])
                  ].filter((ts, index, self) => 
                    index === self.findIndex(t => t.timestamp === ts.timestamp)
                  ),
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
    }
  }, [dbReady]);

  const loadAllData = useCallback(async () => {
    if (!dbReady) return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    try {
      const db = await openDB();
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
      return { activities: { swimming: [], jumpRope: [], cardio: [] }, dailyMetrics: {} };
    }
  }, [dbReady]);

  const exportAll = useCallback(async () => {
    return await loadAllData();
  }, [loadAllData]);

  const importAll = useCallback(async (data) => {
    if (data.activities) await saveActivities(data.activities);
    if (data.dailyMetrics) await saveDailyMetrics(data.dailyMetrics);
  }, [saveActivities, saveDailyMetrics]);

  // Purge time-series > 90 jours
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
    exportAll,
    importAll,
    purgeOldTimeSeries,
  };
};

