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
import {
  getTodayDateStr,
  getDateFromStr,
  subtractDaysFromDateStr,
  isDateValid,
  isDateBeforeOrEqual
} from './garminDateUtils';
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
export function useGarminSync(setGarminData, setStatus, importToEndurance, options = {}) {
  const { onForcedRangeRecorded = null } = options;
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
    loadDataForTab,
    saveForcedRangeEntry
  } = useGarminData();

  // Calculer todayStr une seule fois pour éviter de recalculer
  const todayStr = useMemo(() => {
    return getTodayDateStr();
  }, []);

  const recordForcedSyncHistory = useCallback(async (response, context) => {
    if (!response || !context) {
      return null;
    }

    const forcedInfo = response.forcedRange || null;
    const isForced = Boolean(context.forceMode || (forcedInfo && (forcedInfo.mode || forcedInfo.forceRefresh)));
    if (!isForced) {
      return null;
    }

    const effectiveStart = forcedInfo?.start || context.effectiveStart || context.requestStart;
    const effectiveEnd = forcedInfo?.end || context.effectiveEnd || context.requestEnd;

    if (!effectiveStart || !effectiveEnd || !isDateValid(effectiveStart) || !isDateValid(effectiveEnd)) {
      return null;
    }

    const activitiesCount = Object.values(response.data?.activities || {}).reduce((sum, arr) => {
      if (!Array.isArray(arr)) return sum;
      return sum + arr.length;
    }, 0);
    const metricsCount = Object.keys(response.data?.dailyMetrics || {}).length;

    const entry = {
      mode: forcedInfo?.mode || context.forceMode || null,
      start: effectiveStart,
      end: effectiveEnd,
      includeToday: forcedInfo?.includeToday ?? context.includeToday ?? false,
      forceRefresh: true,
      lastSync: response.lastSync || null,
      triggeredAt: forcedInfo?.triggeredAt || response.diagnostic?.requestTimestamp || new Date().toISOString(),
      requestTimestamp: response.diagnostic?.requestTimestamp || null,
      ok: response.ok !== false,
      cached: !!response.cached,
      activitiesCount,
      metricsCount,
      pythonDuration: response.diagnostic?.pythonDuration ?? null,
      totalDuration: response.diagnostic?.totalDuration ?? null,
      cachePurge: forcedInfo?.cachePurge || response.diagnostic?.resolve?.cachePurge || null,
      diagnostic: response.diagnostic || null,
      source: context.source || 'syncNow'
    };

    try {
      const saved = await saveForcedRangeEntry(entry);
      if (saved && typeof onForcedRangeRecorded === 'function') {
        onForcedRangeRecorded(saved);
      }
      return saved;
    } catch (err) {
      log.warn('[useGarminSync] Impossible d\'enregistrer l\'historique de forçage', err);
      return null;
    }
  }, [onForcedRangeRecorded, saveForcedRangeEntry]);

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
    const optionsIsBoolean = typeof options === 'boolean';
    const optionObject = !optionsIsBoolean && typeof options === 'object' ? options : {};

    let forceRefresh = optionsIsBoolean ? options : !!optionObject.forceRefresh;
    let skipDelay = !!optionObject.skipDelay;
    const forceMode = optionObject.mode || null;
    const includeToday = optionObject.includeToday ?? optionObject.meta?.includeToday ?? false;
    const forceRange = optionObject.range || ((optionObject.start || optionObject.end) ? { start: optionObject.start, end: optionObject.end } : null);
    const extraPayload = optionObject.payload && typeof optionObject.payload === 'object' ? optionObject.payload : null;
    const requestSource = optionObject.source || (forceMode ? 'force-sync' : 'manual');

    if (forceMode) {
      if (optionObject.forceRefresh === undefined) {
        forceRefresh = true;
      }
      if (optionObject.skipDelay === undefined) {
        skipDelay = true;
      }
    }

    if (!dbReady) {
      setStatus({ ok: false, message: 'Base de données non prête', error: 'IndexedDB non initialisé' });
      return;
    }

    if (forceRefresh) {
      clearFrontendCache();
    }

    if (!skipDelay) {
      await applySyncDelay(forceRefresh, setStatus);
    }

    const resolveForcedRange = () => {
      if (!forceMode) {
        return null;
      }

      const sanitize = (value) => {
        if (!value || typeof value !== 'string') {
          return null;
        }
        return value;
      };

      const baseRange = forceRange || {};
      const rawStart = sanitize(baseRange.start);
      const rawEnd = sanitize(baseRange.end);

      if (rawStart && rawEnd) {
        let adjustedEnd = rawEnd;
        if (includeToday && isDateValid(adjustedEnd) && isDateBeforeOrEqual(adjustedEnd, todayStr)) {
          adjustedEnd = todayStr;
        }
        if (!isDateValid(rawStart) || !isDateValid(adjustedEnd) || !isDateBeforeOrEqual(rawStart, adjustedEnd)) {
          return null;
        }
        return { start: rawStart, end: adjustedEnd };
      }

      switch (forceMode) {
        case 'today':
          return { start: todayStr, end: todayStr };
        case 'yesterday': {
          const yesterday = subtractDaysFromDateStr(todayStr, 1);
          return { start: yesterday, end: yesterday };
        }
        case 'range': {
          if (!rawStart || !isDateValid(rawStart)) {
            return null;
          }
          let resolvedEnd = rawEnd && isDateValid(rawEnd) ? rawEnd : rawStart;
          if (includeToday && isDateBeforeOrEqual(resolvedEnd, todayStr)) {
            resolvedEnd = todayStr;
          }
          if (!isDateBeforeOrEqual(rawStart, resolvedEnd)) {
            return null;
          }
          return { start: rawStart, end: resolvedEnd };
        }
        default:
          return null;
      }
    };

    let startDate = null;
    let endDate = null;
    let usingForcedRange = false;
    let dateRangeMeta = null;

    if (forceMode) {
      const resolvedForcedRange = resolveForcedRange();
      if (resolvedForcedRange) {
        startDate = resolvedForcedRange.start;
        endDate = resolvedForcedRange.end;
        usingForcedRange = true;
      }
    }

    if (!usingForcedRange) {
      dateRangeMeta = await calculateSyncDateRange(getSyncStartDate);
      const { startDate: rangeStart, endDate: rangeEnd, isValid, wasAdjusted } = dateRangeMeta;
      startDate = rangeStart;
      endDate = rangeEnd;

      if (!forceMode && !isValid && wasAdjusted) {
        try {
          setLoading(true);
          const queryParts = [];
          if (rangeStart) queryParts.push(`start=${encodeURIComponent(rangeStart)}`);
          if (rangeEnd) queryParts.push(`end=${encodeURIComponent(rangeEnd)}`);
          const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
          const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' }, undefined, setBaseUrl);

          setStatus({
            lastSync: json.lastSync,
            ok: json.ok,
            message: json.ok ? 'Sync OK' : 'Erreur sync',
            error: json.error
          });

          await processSyncResponse(
            json,
            { startDate: rangeStart, endDate: rangeEnd },
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
    }

    if (!startDate) {
      startDate = todayStr;
    }
    if (!endDate) {
      endDate = todayStr;
    }

    const syncStartTime = new Date().toISOString();
    const syncStartTimestamp = Date.now();
    log.info(`[🔍 DIAGNOSTIC] Début synchronisation - Timestamp: ${syncStartTime}, ForceRefresh: ${forceRefresh}, Mode forcé: ${forceMode || 'none'}`);
    log.info(`[🔍 DIAGNOSTIC] Plage de dates: ${startDate} → ${endDate}`);
    log.debug(`Synchronisation incrémentale depuis ${startDate} jusqu'à ${endDate}`);

    const lastSyncTimestamp = endDate === todayStr
      ? await getLastSyncTimestampForToday(endDate, todayStr, getLastSyncTimestampForDate)
      : null;

    if (!usingForcedRange) {
      const existingDataResult = await checkExistingData(
        forceRefresh,
        lastSyncTimestamp,
        endDate,
        todayStr,
        loadAllData
      );

      if (existingDataResult) {
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
    }

    const requestBody = {};
    if (forceMode) {
      requestBody.mode = forceMode;
      requestBody.forceRefresh = true;
      requestBody.includeToday = includeToday;
      if (forceRange && (forceRange.start || forceRange.end)) {
        requestBody.range = { ...forceRange };
        if (forceRange.start) {
          requestBody.rangeStart = forceRange.start;
        }
        if (forceRange.end) {
          requestBody.rangeEnd = forceRange.end;
        }
      }
      if (startDate) {
        requestBody.start = startDate;
      }
      if (endDate) {
        requestBody.end = endDate;
      }
      if (extraPayload) {
        Object.assign(requestBody, extraPayload);
      }
    }
    if (lastSyncTimestamp) {
      requestBody.lastSyncTimestamp = lastSyncTimestamp;
    }

    const requestBodyPayload = Object.keys(requestBody).length > 0 ? requestBody : null;

    try {
      setLoading(true);

      const json = await performSyncRequest(
        {
          startDate,
          endDate,
          lastSyncTimestamp,
          forceRefresh,
          requestBody: requestBodyPayload
        },
        (path, fetchOptions) => tryFetch(path, fetchOptions, undefined, setBaseUrl),
        frontendCache,
        todayStr,
        setStatus
      );

      const effectiveStart = json?.forcedRange?.start || startDate;
      const effectiveEnd = json?.forcedRange?.end || endDate;
      const shouldSkipLastSyncUpdate = Boolean(
        forceMode &&
        effectiveEnd &&
        isDateValid(effectiveEnd) &&
        effectiveEnd < todayStr
      );

      const processStartTime = Date.now();
      await processSyncResponse(
        json,
        { startDate: effectiveStart, endDate: effectiveEnd },
        dbReady,
        saveActivities,
        saveDailyMetrics,
        setGarminData,
        setLastSyncDate,
        loadAllData,
        importToEndurance,
        shouldSkipLastSyncUpdate
      );
      const processDuration = Date.now() - processStartTime;
      const totalDuration = Date.now() - syncStartTimestamp;
      log.info(`[🔍 DIAGNOSTIC] Synchronisation terminée - Durée traitement: ${processDuration}ms, Durée totale: ${totalDuration}ms`);

      await recordForcedSyncHistory(json, {
        forceMode,
        includeToday,
        requestedRange: forceRange,
        requestStart: startDate,
        requestEnd: endDate,
        effectiveStart,
        effectiveEnd,
        forceRefresh,
        source: requestSource
      });

      const cacheKey = `sync_${startDate || 'none'}_${endDate || 'none'}_${lastSyncTimestamp || 'none'}`;
      const retryEnd = effectiveEnd || endDate;
      const retryStart = effectiveStart || startDate;
      const isToday = retryEnd === todayStr;
      const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS;

      await handleAutomaticRetry(
        json,
        retryEnd,
        todayStr,
        retryStart,
        forceRefresh,
        (path, fetchOptions) => tryFetch(path, fetchOptions, undefined, setBaseUrl),
        isDataEmptyForDate,
        (retryJson, syncDateRange) => processSyncResponse(
          retryJson,
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
    } catch (error) {
      try {
        const queryParts = [];
        if (startDate) queryParts.push(`start=${encodeURIComponent(startDate)}`);
        if (endDate) queryParts.push(`end=${encodeURIComponent(endDate)}`);
        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const fallbackOptions = requestBodyPayload
          ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBodyPayload) }
          : { method: 'POST' };

        const json = await tryFetch(`/api/garmin/sync${query}`, fallbackOptions, undefined, setBaseUrl);

        frontendCache.data = json;
        frontendCache.timestamp = Date.now();
        frontendCache.cacheKey = `sync_${startDate || 'none'}_${endDate || 'none'}_${lastSyncTimestamp || 'none'}`;

        const effectiveStart = json?.forcedRange?.start || startDate;
        const effectiveEnd = json?.forcedRange?.end || endDate;
        const shouldSkipLastSyncUpdate = Boolean(
          forceMode &&
          effectiveEnd &&
          isDateValid(effectiveEnd) &&
          effectiveEnd < todayStr
        );

        setStatus({
          lastSync: json.lastSync,
          ok: json.ok !== false,
          message: `Sync (fallback) OK (${startDate} → ${endDate})`
        });

        await processSyncResponse(
          json,
          { startDate: effectiveStart, endDate: effectiveEnd },
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance,
          shouldSkipLastSyncUpdate
        );

        await recordForcedSyncHistory(json, {
          forceMode,
          includeToday,
          requestedRange: forceRange,
          requestStart: startDate,
          requestEnd: endDate,
          effectiveStart,
          effectiveEnd,
          forceRefresh,
          source: requestSource
        });
      } catch (fallbackError) {
        setStatus({ ok: false, message: 'Erreur sync', error: fallbackError.message });
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
    setStatus,
    recordForcedSyncHistory
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
