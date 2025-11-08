/**
 * ✅ PHASE 1.2 : Hook pour gérer la synchronisation Garmin
 * 
 * Ce hook délègue toutes les opérations aux modules spécialisés :
 * - `garminSyncFetch` : Fetch avec retry et timeout
 * - `garminSyncValidation` : Validation des données
 * - `garminSyncProcessor` : Traitement des réponses
 * - `garminSyncCore` : Logique principale de synchronisation
 * 
 * Le hook gère uniquement :
 * - L'état `loading` et `baseUrl`
 * - Le cache frontend (partagé entre fonctions)
 * - L'orchestration des fonctions extraites
 * 
 * @module useGarminSync
 */

import { useState, useCallback, useMemo } from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { CACHE_TTL_MS } from '../constants';
import logger from '../../../../utils/logger';
import { tryFetch } from './garminSyncFetch';
import { isDataEmptyForDate } from './garminSyncValidation';
import { processSyncResponse } from './garminSyncProcessor';
import { getTodayDateStr, getDateFromStr } from './garminDateUtils';
import {
  calculateSyncDateRange,
  applySyncDelay,
  getLastSyncTimestampForToday,
  checkExistingData,
  checkFrontendCache,
  performSyncRequest,
  handleAutomaticRetry
} from './garminSyncCore';

const log = logger.hook('useGarminSync');

// Cache frontend avec TTL - partagé entre fonctions
const frontendCache = {
  data: null,
  timestamp: 0,
  ttl: CACHE_TTL_MS,
  cacheKey: null
};

/**
 * Fonction pour vider le cache frontend
 * Utile après suppression des données mock ou pour forcer une nouvelle sync
 */
export const clearFrontendCache = () => {
  frontendCache.data = null;
  frontendCache.timestamp = 0;
  frontendCache.cacheKey = null;
  log.debug('Frontend cache cleared');
};

/**
 * Hook pour gérer la synchronisation Garmin
 * 
 * @param {Function} setGarminData - Fonction pour mettre à jour l'état des données
 * @param {Function} setStatus - Fonction pour mettre à jour le status
 * @param {Function|null} importToEndurance - Fonction pour importer vers Endurance (optionnel)
 * @returns {Object} Interface du hook
 * @returns {Function} returns.syncNow - Fonction pour synchroniser maintenant
 * @returns {Function} returns.backfill - Fonction pour backfill de données
 * @returns {Function} returns.fetchStatus - Fonction pour récupérer le status
 * @returns {boolean} returns.loading - Si une synchronisation est en cours
 * @returns {string|null} returns.baseUrl - Base URL utilisée pour la dernière requête
 * @returns {Function} returns.clearCache - Fonction pour vider le cache
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
    getLastSyncTimestampForDate,
    loadDataForTab
  } = useGarminData();

  // Calculer todayStr une seule fois pour éviter de recalculer
  const todayStr = useMemo(() => {
    return getTodayDateStr();
  }, []);

  /**
   * Synchronise les données Garmin maintenant
   * 
   * Cette fonction orchestre toute la logique de synchronisation :
   * 1. Vérifie que IndexedDB est prêt
   * 2. Applique délai optionnel si configuré (Phase 5.2)
   * 3. Calcule plage de dates (synchronisation incrémentale)
   * 4. Récupère timestamp de dernière sync pour aujourd'hui
   * 5. Vérifie données existantes (Phase 3.1) - optimisation
   * 6. Vérifie cache frontend - optimisation
   * 7. Effectue requête serveur si nécessaire
   * 8. Traite la réponse (sauvegarde, rechargement, import)
   * 9. Gère retry automatique si données vides (Phase 5.1)
   * 
   * @param {boolean} forceRefresh - Si true, bypass cache et optimisations
   * @returns {Promise<void>} Promise résolue quand la sync est terminée
   */
  const syncNow = useCallback(async (options = {}) => {
    let forceRefresh = false;
    let skipDelay = false;

    if (typeof options === 'boolean') {
      forceRefresh = options;
    } else if (options && typeof options === 'object') {
      forceRefresh = !!options.forceRefresh;
      skipDelay = !!options.skipDelay;
    }

    // Vérifier que IndexedDB est prêt
    if (!dbReady) {
      setStatus({ ok: false, message: 'Base de données non prête', error: 'IndexedDB non initialisé' });
      return;
    }

    // Vider le cache si forceRefresh
    if (forceRefresh) {
      clearFrontendCache();
    }

    // Appliquer délai optionnel (Phase 5.2)
    if (!skipDelay) {
      await applySyncDelay(forceRefresh, setStatus);
    }

    // Calculer plage de dates
    const dateRange = await calculateSyncDateRange(getSyncStartDate);
    const { startDate, endDate, isValid, wasAdjusted } = dateRange;
    
    // Si plage invalide et ajustée, faire sync avec plage ajustée
    if (!isValid && wasAdjusted) {
      try {
        setLoading(true);
        const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' }, undefined, setBaseUrl);
        
        setStatus({
          lastSync: json.lastSync,
          ok: json.ok,
          message: json.ok ? 'Sync OK' : 'Erreur sync',
          error: json.error
        });
        
        await processSyncResponse(
          json,
          { startDate, endDate },
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance
        );
      } catch (e) {
        setStatus({ ok: false, message: 'Erreur sync', error: e.message });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Logging détaillé pour diagnostic
    const syncStartTime = new Date().toISOString();
    const syncStartTimestamp = Date.now();
    log.info(`[🔍 DIAGNOSTIC] Début synchronisation - Timestamp: ${syncStartTime}, ForceRefresh: ${forceRefresh}`);
    log.info(`[🔍 DIAGNOSTIC] Plage de dates: ${startDate} → ${endDate}`);
    log.debug(`Synchronisation incrémentale depuis ${startDate} jusqu'à ${endDate}`);

    // Récupérer timestamp de dernière sync pour aujourd'hui
    const lastSyncTimestamp = await getLastSyncTimestampForToday(
      endDate,
      todayStr,
      getLastSyncTimestampForDate
    );

    // Vérifier données existantes (Phase 3.1) - optimisation
    const existingDataResult = await checkExistingData(
      forceRefresh,
      lastSyncTimestamp,
      endDate,
      todayStr,
      loadAllData
    );
    
    if (existingDataResult) {
      // Utiliser données existantes
      setStatus({
        lastSync: existingDataResult.mockResponse.lastSync,
        ok: true,
        message: `Sync OK (données existantes, ${existingDataResult.ageSeconds}s)`
      });
      
      await processSyncResponse(
        existingDataResult.mockResponse,
        { startDate, endDate },
        dbReady,
        saveActivities,
        saveDailyMetrics,
        setGarminData,
        setLastSyncDate,
        loadAllData,
        importToEndurance
      );
      return;
    }

    // Vérifier cache frontend
    const cachedData = checkFrontendCache(
      frontendCache,
      startDate,
      endDate,
      lastSyncTimestamp,
      todayStr,
      forceRefresh,
      isDataEmptyForDate
    );
    
    if (cachedData) {
      // Utiliser données du cache
      setStatus({
        lastSync: cachedData.data.lastSync,
        ok: true,
        message: 'Sync OK (cached)'
      });
      
      await processSyncResponse(
        cachedData.data,
        { startDate, endDate },
        dbReady,
        saveActivities,
        saveDailyMetrics,
        setGarminData,
        setLastSyncDate,
        loadAllData,
        importToEndurance
      );
      return;
    }

    // Effectuer requête serveur
    try {
      setLoading(true);
      
      const json = await performSyncRequest(
        startDate,
        endDate,
        lastSyncTimestamp,
        forceRefresh,
        (path, options) => tryFetch(path, options, undefined, setBaseUrl),
        frontendCache,
        todayStr,
        setStatus
      );
      
      const processStartTime = Date.now();
      await processSyncResponse(
        json,
        { startDate, endDate },
        dbReady,
        saveActivities,
        saveDailyMetrics,
        setGarminData,
        setLastSyncDate,
        loadAllData,
        importToEndurance
      );
      const processDuration = Date.now() - processStartTime;
      const totalDuration = Date.now() - syncStartTimestamp;
      log.info(`[🔍 DIAGNOSTIC] Synchronisation terminée - Durée traitement: ${processDuration}ms, Durée totale: ${totalDuration}ms`);
      
      // Gérer retry automatique si données vides (Phase 5.1)
      const cacheKey = `sync_${startDate}_${endDate}_${lastSyncTimestamp || 'none'}`;
      const isToday = endDate === todayStr;
      const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS;
      
      await handleAutomaticRetry(
        json,
        endDate,
        todayStr,
        startDate,
        forceRefresh,
        (path, options) => tryFetch(path, options, undefined, setBaseUrl),
        isDataEmptyForDate,
        (json, syncDateRange) => processSyncResponse(
          json,
          syncDateRange,
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance
        ),
        frontendCache,
        cacheKey,
        adaptiveTtl,
        setStatus
      );
      
    } catch (e) {
      // Fallback GET avec dates
      try {
        const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        const json = await tryFetch(`/api/garmin/sync${query}`, {}, undefined, setBaseUrl);
        
        // Mettre à jour le cache même en cas de fallback GET
        frontendCache.data = json;
        frontendCache.timestamp = Date.now();
        frontendCache.cacheKey = `sync_${startDate}_${endDate}_none`;
        
        setStatus({
          lastSync: json.lastSync,
          ok: json.ok !== false,
          message: `Sync (GET) OK (${startDate} → ${endDate})`
        });
        
        await processSyncResponse(
          json,
          { startDate, endDate },
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance
        );
      } catch (e2) {
        setStatus({ ok: false, message: 'Erreur sync', error: e2.message });
      }
    } finally {
      setLoading(false);
    }
  }, [
    dbReady,
    getSyncStartDate,
    getLastSyncTimestampForDate,
    todayStr,
    loadAllData,
    saveActivities,
    saveDailyMetrics,
    setGarminData,
    setLastSyncDate,
    importToEndurance,
    setStatus
  ]);

  /**
   * Backfill de données pour une plage de dates
   * 
   * Cette fonction récupère les données passées sans mettre à jour la date de dernière sync.
   * Elle utilise `processSyncResponse` pour la sauvegarde et le rechargement.
   * 
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   * @param {Function|null} setSelectedDate - Fonction pour mettre à jour la date sélectionnée (optionnel)
   * @returns {Promise<void>} Promise résolue quand le backfill est terminé
   */
  const backfill = useCallback(async (startDate, endDate, setSelectedDate) => {
    if (!startDate || !endDate) return;
    
    try {
      setLoading(true);
      const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' }, undefined, setBaseUrl);
      
      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? `Backfill OK (${startDate} → ${endDate})` : 'Backfill erreur',
        error: json.error
      });
      
      if (json.data && json.ok) {
        // Utiliser processSyncResponse pour sauvegarde et rechargement
        // ⚠️ IMPORTANT : Backfill ne met PAS à jour la date de dernière sync
        // (car c'est pour récupérer des données passées, pas pour la sync normale)
        await processSyncResponse(
          json,
          { startDate, endDate },
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance,
          true // skipLastSyncUpdate = true pour backfill
        );
        
        // Sélectionner automatiquement la date (privilégie aujourd'hui)
        if (setSelectedDate) {
          const allData = await loadAllData();
          const dates = Object.keys(allData.dailyMetrics || {}).sort((a, b) => a.localeCompare(b));
          
          if (dates.length > 0) {
            // Obtenir "aujourd'hui" en date locale
            const todayLocal = getTodayDateStr();
            
            // Filtrer les dates futures (probablement des données mock)
            const validDates = dates.filter(date => {
              const dateObj = getDateFromStr(date);
              const todayObj = getDateFromStr(todayLocal);
              if (!dateObj || !todayObj) return false;
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
      }
    } catch (e) {
      setStatus({ ok: false, message: 'Backfill erreur', error: e.message });
    } finally {
      setLoading(false);
    }
  }, [
    dbReady,
    saveActivities,
    saveDailyMetrics,
    loadAllData,
    setGarminData,
    setLastSyncDate,
    importToEndurance,
    setStatus
  ]);

  /**
   * Récupère le status du serveur Garmin
   * 
   * @returns {Promise<void>} Promise résolue quand le status est récupéré
   */
  const fetchStatus = useCallback(async () => {
    try {
      const json = await tryFetch('/api/garmin/status', {}, undefined, setBaseUrl);
      setStatus(json);
    } catch (e) {
      setStatus({ ok: false, message: "Serveur indisponible", error: e.message });
    }
  }, [setStatus]);

  return {
    syncNow,
    backfill,
    fetchStatus,
    loading,
    baseUrl,
    clearCache: clearFrontendCache
  };
}
