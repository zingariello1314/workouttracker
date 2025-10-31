import { useState, useCallback } from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';

const BASES = ['http://localhost:3031', 'http://localhost:3001'];

/**
 * Hook pour gérer la synchronisation Garmin
 */
export function useGarminSync(setGarminData, setStatus, importToEndurance) {
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState(null);
  const { saveActivities, saveDailyMetrics, loadAllData, dbReady } = useGarminData();

  const tryFetch = useCallback(async (path, options) => {
    let lastErr;
    for (const b of BASES) {
      try {
        const res = await fetch(`${b}${path}`, options);
        if (!res.ok) throw new Error(`${res.status}`);
        setBaseUrl(b);
        return await res.json();
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    throw lastErr || new Error('fetch failed');
  }, []);

  const processSyncResponse = useCallback(async (json) => {
    if (json.data && json.ok) {
      // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
      if (dbReady) {
        await saveActivities(json.data.activities || {});
        await saveDailyMetrics(json.data.dailyMetrics || {});
        // Recharger depuis IndexedDB pour fusionner avec les données existantes
        const loaded = await loadAllData();
        if (loaded) {
          setGarminData({
            activities: {
              swimming: loaded.activities.swimming || [],
              jumpRope: loaded.activities.jumpRope || [],
              cardio: loaded.activities.cardio || []
            },
            dailyMetrics: loaded.dailyMetrics || {}
          });
        } else {
          setGarminData(json.data);
        }
      } else {
        setGarminData(json.data);
      }
      // Import automatique vers Endurance
      if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
        if (importToEndurance) {
          await importToEndurance(json.data);
        }
      }
    }
  }, [dbReady, saveActivities, saveDailyMetrics, loadAllData, setGarminData, importToEndurance]);

  const syncNow = useCallback(async () => {
    try {
      setLoading(true);
      const json = await tryFetch('/api/garmin/sync', { method: 'POST' });
      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? 'Sync OK' : 'Erreur sync',
        error: json.error
      });
      await processSyncResponse(json);
    } catch (e) {
      try {
        const json = await tryFetch('/api/garmin/sync');
        setStatus({
          lastSync: json.lastSync,
          ok: json.ok !== false,
          message: 'Sync (GET) OK'
        });
        await processSyncResponse(json);
      } catch (e2) {
        setStatus({ ok: false, message: 'Erreur sync', error: e2.message });
      }
    } finally {
      setLoading(false);
    }
  }, [tryFetch, setStatus, processSyncResponse]);

  const backfill = useCallback(async (startDate, endDate, setSelectedDate) => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' });
      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? 'Backfill OK' : 'Backfill erreur',
        error: json.error
      });
      if (json.data && json.ok) {
        // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
        if (dbReady) {
          await saveActivities(json.data.activities || {});
          await saveDailyMetrics(json.data.dailyMetrics || {});
          // Recharger depuis IndexedDB pour fusionner avec les données existantes
          const loaded = await loadAllData();
          if (loaded) {
            setGarminData({
              activities: {
                swimming: loaded.activities.swimming || [],
                jumpRope: loaded.activities.jumpRope || [],
                cardio: loaded.activities.cardio || []
              },
              dailyMetrics: loaded.dailyMetrics || {}
            });
            const dates = Object.keys(loaded.dailyMetrics || {}).sort();
            if (dates.length > 0 && setSelectedDate) setSelectedDate(dates[dates.length - 1]);
          } else {
            setGarminData(json.data);
            const dates = Object.keys(json.data.dailyMetrics || {}).sort();
            if (dates.length > 0 && setSelectedDate) setSelectedDate(dates[dates.length - 1]);
          }
        } else {
          setGarminData(json.data);
          const dates = Object.keys(json.data.dailyMetrics || {}).sort();
          if (dates.length > 0 && setSelectedDate) setSelectedDate(dates[dates.length - 1]);
        }
        // Import automatique vers Endurance
        if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
          if (importToEndurance) {
            await importToEndurance(json.data);
          }
        }
      }
    } catch (e) {
      setStatus({ ok: false, message: 'Backfill erreur', error: e.message });
    } finally {
      setLoading(false);
    }
  }, [tryFetch, setStatus, dbReady, saveActivities, saveDailyMetrics, loadAllData, setGarminData, importToEndurance]);

  const fetchStatus = useCallback(async () => {
    try {
      const json = await tryFetch('/api/garmin/status');
      setStatus(json);
    } catch (e) {
      setStatus({ ok: false, message: "Serveur indisponible", error: e.message });
    }
  }, [tryFetch, setStatus]);

  return {
    syncNow,
    backfill,
    fetchStatus,
    loading,
    baseUrl
  };
}

