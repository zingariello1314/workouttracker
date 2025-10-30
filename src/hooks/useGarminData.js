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
      const date_type_idx = store.index('date_type');

      // Déduplication par id (activityId Garmin) ou par hash
      for (const type of ['swimming', 'jumpRope', 'cardio']) {
        const items = activities[type] || [];
        for (const item of items) {
          try {
            const existing = await new Promise((resolve, reject) => {
              const req = date_type_idx.get([item.date, type]);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => resolve(null);
            });
            if (!existing || existing.id !== item.id) {
              await new Promise((resolve, reject) => {
                const req = store.put({ ...item, type });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
              });
            }
          } catch (e) {
            // Ignorer doublons
          }
        }
      }
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
        await new Promise((resolve, reject) => {
          const req = store.put({ date, ...metrics });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
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

