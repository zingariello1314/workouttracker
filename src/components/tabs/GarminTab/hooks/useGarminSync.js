import { useState, useCallback, useRef } from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { SYNC_TIMEOUT_MS, CACHE_TTL_MS, RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.hook('useGarminSync');

const BASES = ['http://localhost:3031', 'http://localhost:3001'];

// 🟡 FIX #26: Cache frontend avec TTL - utilise constante
// 🔴 FIX #51-60: Utiliser constante pour TTL
const frontendCache = {
  data: null,
  timestamp: 0,
  ttl: CACHE_TTL_MS
};

/**
 * Hook pour gérer la synchronisation Garmin
 */
export function useGarminSync(setGarminData, setStatus, importToEndurance) {
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState(null);
  const { saveActivities, saveDailyMetrics, loadAllData, dbReady } = useGarminData();

  /**
   * 🔴 FIX #6: tryFetch avec retry automatique, exponential backoff et timeout
   * Implémente une stratégie robuste de retry pour gérer les erreurs réseau
   */
  // 🔴 FIX #51-60: Utiliser constante pour retry max attempts
  const tryFetch = useCallback(async (path, options = {}, retries = RETRY_MAX_ATTEMPTS) => {
    let lastErr;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      for (const b of BASES) {
        try {
          // 🔴 FIX #6: Timeout avec AbortController - utilise constante
          // 🔴 FIX #51-60: Utiliser constante pour timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
          
          const res = await fetch(`${b}${path}`, { 
            ...options, 
            signal: controller.signal 
          });
          
          clearTimeout(timeout);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          setBaseUrl(b);
          const json = await res.json();
          return json;
        } catch (e) {
          // Si c'est une erreur d'abort (timeout), la garder comme dernière erreur
          if (e.name === 'AbortError') {
            lastErr = new Error(`Timeout après ${SYNC_TIMEOUT_MS / 1000}s pour ${b}${path}`);
          } else {
            lastErr = e;
          }
          
          // 🔴 FIX #6: Exponential backoff - utilise constante pour base delay
          // 🔴 FIX #51-60: Utiliser constante pour base delay
          if (attempt < retries - 1) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s...
            log.debug(`Tentative ${attempt + 1}/${retries} échouée pour ${b}${path}, retry dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          continue; // Essayer la prochaine base URL
        }
      }
    }
    
    // Toutes les tentatives ont échoué
    throw new Error(`Échec après ${retries} tentatives: ${lastErr?.message || 'Serveur inaccessible'}`);
  }, []);

  const processSyncResponse = useCallback(async (json) => {
    if (json.data && json.ok) {
      // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
      if (dbReady) {
        await saveActivities(json.data.activities || {});
        await saveDailyMetrics(json.data.dailyMetrics || {});
        // 🔴 FIX : Utiliser directement json.data après sauvegarde, pas besoin de reload
        // Les fonctions save* fusionnent déjà avec les données existantes
        // Recharger tout depuis IndexedDB est redondant et lent
        setGarminData(json.data);
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
  }, [dbReady, saveActivities, saveDailyMetrics, setGarminData, importToEndurance]);

  const syncNow = useCallback(async () => {
    // 🟡 FIX #26: Vérifier cache frontend avant sync
    const now = Date.now();
    if (frontendCache.data && (now - frontendCache.timestamp) < frontendCache.ttl) {
      log.debug(`Using cached data (cache valid for ${Math.round((frontendCache.ttl - (now - frontendCache.timestamp)) / 1000)} more seconds)`);
      setStatus({
        lastSync: frontendCache.data.lastSync,
        ok: true,
        message: 'Sync OK (cached)'
      });
      await processSyncResponse(frontendCache.data);
      return;
    }

    try {
      setLoading(true);
      const json = await tryFetch('/api/garmin/sync', { method: 'POST' });
      
      // 🟡 FIX #26: Mettre à jour le cache
      frontendCache.data = json;
      frontendCache.timestamp = Date.now();
      
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
        
        // 🟡 FIX #26: Mettre à jour le cache même en cas de fallback GET
        frontendCache.data = json;
        frontendCache.timestamp = Date.now();
        
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
          // 🔴 FIX : Utiliser directement json.data après sauvegarde
          // Les fonctions save* fusionnent déjà avec les données existantes dans IndexedDB
          setGarminData(json.data);
          const dates = Object.keys(json.data.dailyMetrics || {}).sort();
          if (dates.length > 0 && setSelectedDate) setSelectedDate(dates[dates.length - 1]);
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

