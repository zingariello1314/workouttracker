import { useState, useCallback, useRef } from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { SYNC_TIMEOUT_MS, CACHE_TTL_MS, RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.hook('useGarminSync');

const BASES = ['http://localhost:3031', 'http://localhost:3001'];

// 🟡 FIX #26: Cache frontend avec TTL - utilise constante
// 🔴 FIX #51-60: Utiliser constante pour TTL
// 🔴 FIX : Fonction pour vider le cache (utile après suppression des données mock)
const frontendCache = {
  data: null,
  timestamp: 0,
  ttl: CACHE_TTL_MS,
  cacheKey: null
};

// 🔴 FIX : Fonction pour vider le cache frontend
export const clearFrontendCache = () => {
  frontendCache.data = null;
  frontendCache.timestamp = 0;
  frontendCache.cacheKey = null;
  log.debug('Frontend cache cleared');
};

/**
 * Hook pour gérer la synchronisation Garmin
 */
export function useGarminSync(setGarminData, setStatus, importToEndurance) {
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState(null);
  const { 
    saveActivities, 
    saveDailyMetrics, 
    loadAllData, 
    dbReady,
    getLastSyncDate,
    setLastSyncDate,
    getSyncStartDate,
    getLastSyncTimestampForDate,  // ✅ PHASE 2.2 : Pour récupération incrémentale minute par minute
    loadDataForTab
  } = useGarminData();

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

  const processSyncResponse = useCallback(async (json, syncDateRange = null) => {
    // ✅ PHASE 1 : Logging détaillé du traitement de la réponse
    const processStartTime = Date.now();
    log.info(`[🔍 DIAGNOSTIC] Début traitement réponse - OK: ${json.ok}, Data présent: ${!!json.data}`);
    
    if (json.data && json.ok) {
      // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
      if (dbReady) {
        const saveStartTime = Date.now();
        const activitiesBeforeSave = Object.values(json.data.activities || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        const dailyMetricsBeforeSave = Object.keys(json.data.dailyMetrics || {}).length;
        log.info(`[🔍 DIAGNOSTIC] Sauvegarde IndexedDB - Activités: ${activitiesBeforeSave}, Métriques: ${dailyMetricsBeforeSave}`);
        
        await saveActivities(json.data.activities || {});
        await saveDailyMetrics(json.data.dailyMetrics || {});
        const saveDuration = Date.now() - saveStartTime;
        log.info(`[🔍 DIAGNOSTIC] Sauvegarde IndexedDB terminée - Durée: ${saveDuration}ms`);
        
        // 🟢 NOUVEAU : Mettre à jour la date de dernière sync
        const syncTimestamp = new Date().toISOString();
        if (syncDateRange && syncDateRange.endDate) {
          await setLastSyncDate(syncDateRange.endDate);
          log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync mis à jour: ${syncDateRange.endDate} (timestamp: ${syncTimestamp})`);
        } else {
          // Par défaut, utiliser aujourd'hui
          const today = new Date().toISOString().split('T')[0];
          await setLastSyncDate(today);
          log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync mis à jour: ${today} (timestamp: ${syncTimestamp})`);
        }
        
        // 🟢 NOUVEAU : Recharger les données depuis IndexedDB pour avoir les données complètes (fusionnées)
        // Cela garantit qu'on affiche toutes les données, pas seulement celles de la sync actuelle
        const loadStartTime = Date.now();
        const allData = await loadAllData();
        const loadDuration = Date.now() - loadStartTime;
        const activitiesAfterLoad = Object.values(allData.activities || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        const dailyMetricsAfterLoad = Object.keys(allData.dailyMetrics || {}).length;
        log.info(`[🔍 DIAGNOSTIC] Données rechargées depuis IndexedDB - Durée: ${loadDuration}ms, Activités: ${activitiesAfterLoad}, Métriques: ${dailyMetricsAfterLoad}`);
        setGarminData(allData);
      } else {
        setGarminData(json.data);
        // Sauvegarder aussi la date de sync en fallback
        if (syncDateRange && syncDateRange.endDate) {
          await setLastSyncDate(syncDateRange.endDate);
          log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync (fallback): ${syncDateRange.endDate}`);
        } else {
          const today = new Date().toISOString().split('T')[0];
          await setLastSyncDate(today);
          log.info(`[🔍 DIAGNOSTIC] Timestamp de dernière sync (fallback): ${today}`);
        }
      }
      // Import automatique vers Endurance
      if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
        if (importToEndurance) {
          await importToEndurance(json.data);
        }
      }
    }
  }, [dbReady, saveActivities, saveDailyMetrics, setGarminData, importToEndurance, setLastSyncDate, loadAllData]);

  const syncNow = useCallback(async (forceRefresh = false) => {
    if (!dbReady) {
      setStatus({ ok: false, message: 'Base de données non prête', error: 'IndexedDB non initialisé' });
      return;
    }

    // 🔴 FIX : Si forceRefresh, vider le cache frontend
    if (forceRefresh) {
      clearFrontendCache();
    }

    // 🟢 NOUVEAU : Synchronisation incrémentale - calculer la plage depuis la dernière sync
    const startDate = await getSyncStartDate();
    // 🔴 FIX : Utiliser date locale au lieu de UTC
    const nowDate = new Date();
    const endDate = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
    
    // 🟢 FIX : Validation robuste de la plage de dates (déjà gérée dans getSyncStartDate, mais double vérification)
    // getSyncStartDate devrait maintenant toujours retourner une date <= aujourd'hui, mais on garde cette vérification
    // pour sécurité absolue et cas limites (timezone, etc.)
    if (startDate > endDate) {
      // Ce cas ne devrait plus arriver grâce au fix dans getSyncStartDate, mais on le garde pour sécurité
      log.warn(`[useGarminSync] Start date (${startDate}) after end date (${endDate}), adjusting to today - 1 day`);
      const adjustedStart = new Date();
      adjustedStart.setDate(adjustedStart.getDate() - 1);
      const adjustedStartStr = `${adjustedStart.getFullYear()}-${String(adjustedStart.getMonth() + 1).padStart(2, '0')}-${String(adjustedStart.getDate()).padStart(2, '0')}`;
      
      try {
        setLoading(true);
        const query = `?start=${encodeURIComponent(adjustedStartStr)}&end=${encodeURIComponent(endDate)}`;
        const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' });
        
        setStatus({
          lastSync: json.lastSync,
          ok: json.ok,
          message: json.ok ? 'Sync OK' : 'Erreur sync',
          error: json.error
        });
        await processSyncResponse(json, { startDate: adjustedStartStr, endDate });
      } catch (e) {
        setStatus({ ok: false, message: 'Erreur sync', error: e.message });
      } finally {
        setLoading(false);
      }
      return;
    }

    // ✅ PHASE 1 : Logging détaillé pour diagnostic
    const syncStartTime = new Date().toISOString();
    const syncStartTimestamp = Date.now();
    log.info(`[🔍 DIAGNOSTIC] Début synchronisation - Timestamp: ${syncStartTime}, ForceRefresh: ${forceRefresh}`);
    log.info(`[🔍 DIAGNOSTIC] Plage de dates: ${startDate} → ${endDate}`);
    
    log.debug(`Synchronisation incrémentale depuis ${startDate} jusqu'à ${endDate}`);

    // ✅ PHASE 2.4 : Récupérer le timestamp de dernière sync pour le jour en cours
    // Pour permettre la récupération incrémentale minute par minute
    let lastSyncTimestamp = null;
    if (endDate === startDate || endDate >= startDate) {
      // Si on synchronise aujourd'hui (endDate = aujourd'hui), récupérer le timestamp exact
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      if (endDate === todayStr) {
        try {
          lastSyncTimestamp = await getLastSyncTimestampForDate(todayStr);
          if (lastSyncTimestamp) {
            log.info(`[🔍 DIAGNOSTIC] Last sync timestamp for today: ${lastSyncTimestamp}`);
            log.debug(`[useGarminSync] Last sync timestamp for today: ${lastSyncTimestamp}`);
          } else {
            log.info(`[🔍 DIAGNOSTIC] Aucun timestamp de dernière sync trouvé pour aujourd'hui (première sync du jour)`);
          }
        } catch (e) {
          log.warn('[useGarminSync] Error getting last sync timestamp:', e);
          log.warn(`[🔍 DIAGNOSTIC] Erreur lors de la récupération du timestamp: ${e.message}`);
          // Continuer sans timestamp (fallback sur récupération complète)
        }
      }
    }

    // 🟡 FIX #26: Vérifier cache frontend avant sync (mais seulement si la plage correspond)
    // ✅ PHASE 2.4 : Inclure lastSyncTimestamp dans la clé de cache pour éviter cache incorrect
    // ✅ PHASE 2.1 : Bypass du cache frontend si forceRefresh est activé
    // ✅ PHASE 2.2 : TTL adaptatif - réduction pour aujourd'hui
    const now = Date.now();
    const cacheKey = `sync_${startDate}_${endDate}_${lastSyncTimestamp || 'none'}`;
    
    // Calculer TTL adaptatif selon si c'est aujourd'hui ou une date passée
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = endDate === todayStr;
    // TTL réduit pour aujourd'hui (30 secondes) vs dates passées (60 secondes)
    const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS; // 30s pour aujourd'hui, 60s pour passé
    const effectiveTtl = forceRefresh ? 0 : adaptiveTtl; // TTL 0 si forceRefresh
    
    const cacheAge = frontendCache.data ? (now - frontendCache.timestamp) : null;
    const cacheValid = !forceRefresh && frontendCache.data && frontendCache.cacheKey === cacheKey && cacheAge < effectiveTtl;
    
    // ✅ PHASE 1 : Logging détaillé du cache frontend
    log.info(`[🔍 DIAGNOSTIC] Cache frontend - Clé: ${cacheKey}, Présent: ${!!frontendCache.data}, Clé correspond: ${frontendCache.cacheKey === cacheKey}, Âge: ${cacheAge ? Math.round(cacheAge / 1000) + 's' : 'N/A'}, TTL effectif: ${effectiveTtl / 1000}s (${isToday ? 'aujourd\'hui' : 'passé'}), ForceRefresh: ${forceRefresh}, Valide: ${cacheValid}`);
    
    if (cacheValid) {
      const remainingSeconds = Math.round((effectiveTtl - cacheAge) / 1000);
      log.info(`[🔍 DIAGNOSTIC] ⚠️ UTILISATION DU CACHE FRONTEND - Reste ${remainingSeconds}s avant expiration`);
      log.debug(`Using cached data (cache valid for ${remainingSeconds} more seconds)`);
      setStatus({
        lastSync: frontendCache.data.lastSync,
        ok: true,
        message: 'Sync OK (cached)'
      });
      await processSyncResponse(frontendCache.data, { startDate, endDate });
      return;
    } else if (frontendCache.data) {
      log.info(`[🔍 DIAGNOSTIC] Cache frontend présent mais invalide (clé différente ou expiré)`);
    }

    try {
      setLoading(true);
      // ✅ PHASE 2.4 : Passer les dates ET le timestamp de dernière sync pour récupération incrémentale
      let query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      if (lastSyncTimestamp) {
        query += `&lastSyncTimestamp=${encodeURIComponent(lastSyncTimestamp)}`;
        log.info(`[🔍 DIAGNOSTIC] Envoi lastSyncTimestamp au serveur: ${lastSyncTimestamp}`);
        log.debug(`[useGarminSync] Passing lastSyncTimestamp: ${lastSyncTimestamp}`);
      }
      if (forceRefresh) {
        query += `&forceRefresh=true`;
        log.info(`[🔍 DIAGNOSTIC] ForceRefresh activé - bypass du cache`);
      }
      
      const requestStartTime = Date.now();
      log.info(`[🔍 DIAGNOSTIC] Envoi requête au serveur: POST /api/garmin/sync${query}`);
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' });
      const requestDuration = Date.now() - requestStartTime;
      
      // ✅ PHASE 1 : Logging détaillé de la réponse serveur
      log.info(`[🔍 DIAGNOSTIC] Réponse serveur reçue - Durée: ${requestDuration}ms, OK: ${json.ok}, Cached: ${json.cached || false}, LastSync: ${json.lastSync}`);
      if (json.data) {
        const activitiesCount = Object.values(json.data.activities || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        const dailyMetricsCount = Object.keys(json.data.dailyMetrics || {}).length;
        log.info(`[🔍 DIAGNOSTIC] Données reçues - Activités: ${activitiesCount}, Métriques quotidiennes: ${dailyMetricsCount}`);
      }
      
      // 🟡 FIX #26: Mettre à jour le cache avec la clé de plage
      // ✅ PHASE 2.2 : Utiliser TTL adaptatif pour le cache
      frontendCache.data = json;
      frontendCache.timestamp = Date.now();
      frontendCache.cacheKey = cacheKey;
      frontendCache.ttl = adaptiveTtl; // Mettre à jour le TTL selon la date
      log.info(`[🔍 DIAGNOSTIC] Cache frontend mis à jour avec nouvelles données (TTL: ${adaptiveTtl / 1000}s pour ${isToday ? 'aujourd\'hui' : 'date passée'})`);
      
      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? `Sync OK (${startDate} → ${endDate})` : 'Erreur sync',
        error: json.error
      });
      
      const processStartTime = Date.now();
      await processSyncResponse(json, { startDate, endDate });
      const processDuration = Date.now() - processStartTime;
      const totalDuration = Date.now() - syncStartTimestamp;
      log.info(`[🔍 DIAGNOSTIC] Synchronisation terminée - Durée traitement: ${processDuration}ms, Durée totale: ${totalDuration}ms`);
    } catch (e) {
      try {
        // Fallback GET avec dates
        const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        const json = await tryFetch(`/api/garmin/sync${query}`);
        
        // 🟡 FIX #26: Mettre à jour le cache même en cas de fallback GET
        frontendCache.data = json;
        frontendCache.timestamp = Date.now();
        frontendCache.cacheKey = cacheKey;
        
        setStatus({
          lastSync: json.lastSync,
          ok: json.ok !== false,
          message: `Sync (GET) OK (${startDate} → ${endDate})`
        });
        await processSyncResponse(json, { startDate, endDate });
      } catch (e2) {
        setStatus({ ok: false, message: 'Erreur sync', error: e2.message });
      }
    } finally {
      setLoading(false);
    }
  }, [tryFetch, setStatus, processSyncResponse, dbReady, getSyncStartDate, setLastSyncDate]);

  const backfill = useCallback(async (startDate, endDate, setSelectedDate) => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' });
      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? `Backfill OK (${startDate} → ${endDate})` : 'Backfill erreur',
        error: json.error
      });
      if (json.data && json.ok) {
        // Sauvegarder dans IndexedDB AVANT de mettre à jour l'état
        if (dbReady) {
          await saveActivities(json.data.activities || {});
          await saveDailyMetrics(json.data.dailyMetrics || {});
          
          // 🟢 NOUVEAU : Backfill ne met PAS à jour la date de dernière sync
          // (car c'est pour récupérer des données passées, pas pour la sync normale)
          // Recharger les données complètes depuis IndexedDB pour afficher tout
          const allData = await loadAllData();
          setGarminData(allData);
          
          const dates = Object.keys(allData.dailyMetrics || {}).sort((a, b) => a.localeCompare(b));
          // 🔴 FIX : Privilégier aujourd'hui si disponible, sinon la date la plus récente valide (pas future)
          if (dates.length > 0 && setSelectedDate) {
            // Obtenir "aujourd'hui" en date locale (pas UTC)
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            // Filtrer les dates futures (probablement des données mock)
            const validDates = dates.filter(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const todayObj = new Date(todayLocal + 'T00:00:00');
              return dateObj <= todayObj;
            });
            
            const datesToUse = validDates.length > 0 ? validDates : dates;
            const todayIndex = datesToUse.indexOf(todayLocal);
            
            if (todayIndex !== -1) {
              setSelectedDate(todayLocal);
            } else if (datesToUse.length > 0) {
              setSelectedDate(datesToUse[datesToUse.length - 1]);
            } else if (dates.length > 0) {
              setSelectedDate(dates[0]);
            }
          }
        } else {
          setGarminData(json.data);
          const dates = Object.keys(json.data.dailyMetrics || {}).sort((a, b) => a.localeCompare(b));
          // 🔴 FIX : Privilégier aujourd'hui si disponible, sinon la date la plus récente valide (pas future)
          if (dates.length > 0 && setSelectedDate) {
            // Obtenir "aujourd'hui" en date locale (pas UTC)
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            // Filtrer les dates futures (probablement des données mock)
            const validDates = dates.filter(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const todayObj = new Date(todayLocal + 'T00:00:00');
              return dateObj <= todayObj;
            });
            
            const datesToUse = validDates.length > 0 ? validDates : dates;
            const todayIndex = datesToUse.indexOf(todayLocal);
            
            if (todayIndex !== -1) {
              setSelectedDate(todayLocal);
            } else if (datesToUse.length > 0) {
              setSelectedDate(datesToUse[datesToUse.length - 1]);
            } else if (dates.length > 0) {
              setSelectedDate(dates[0]);
            }
          }
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
    baseUrl,
    clearCache: clearFrontendCache // 🔴 NOUVEAU : Exposer la fonction pour vider le cache
  };
}

