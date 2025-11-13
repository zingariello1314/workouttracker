/**
 * Hook actions pour orchestrer la synchronisation Garmin.
 */

import { useMemo, useCallback } from 'react';
import { CACHE_SCHEMA_VERSION, FORCE_SYNC_DEGRADE_THRESHOLD_MS, USE_SYNC_PIPELINE } from '../constants';
import logger from '../../../../utils/logger';
import { tryFetch, circuitBreaker } from './garminSyncFetch';
import { isDataEmptyForDate } from './garminSyncValidation';
import { processSyncResponse } from './garminSyncProcessor';
import {
  getTodayDateStr,
  isDateValid
} from './garminDateUtils';
import { SyncRangeService } from '../services/sync/SyncRangeService';
import { SyncCacheService } from '../services/sync/SyncCacheService';
import { SyncOrchestrator } from '../services/sync/SyncOrchestrator';
import { SyncRequestService } from '../services/sync/SyncRequestService';
import { SyncRetryService } from '../services/sync/SyncRetryService';
import { SyncHistoryRecorder } from '../services/sync/SyncHistoryRecorder';
import { MemoryCacheAdapter } from '../services/cache/MemoryCacheAdapter';
import { DegradedModePolicy } from '../services/sync/DegradedModePolicy';
import { handleCacheHit as handleCacheHitHelper } from '../services/sync/CacheHitHandler';
import { updateUIMetricsStore, getUIMetricsSnapshot as getUIMetricsStoreSnapshot } from '../utils/uiMetricsStore';
import { syncNowWithPipeline } from './syncNowWithPipeline';
import { isBrowser } from '../../../../utils/isBrowser';

const IS_DEV = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

const log = logger.module('useGarminSyncActions');

export const useGarminSyncActions = (deps) => {
  const {
    state,
    setStatus,
    importToEndurance,
    options = {}
  } = deps;

  const {
    loading,
    setLoading,
    baseUrl,
    setBaseUrl,
    frontendCache,
    clearFrontendCache,
    setLastSourceMeta
  } = state;

  const {
    onForcedRangeRecorded = null
  } = options;

  const {
    saveActivities,
    saveDailyMetrics,
    loadAllData,
    loadDataByRange,
    dbReady,
    getLastSyncDate,
    setLastSyncDate,
    getSyncStartDate,
    getLastSyncTimestampForDate,
    loadDataForTab,
    saveForcedRangeEntry,
    setGarminData
  } = deps.data;

  const rangeService = useMemo(() => new SyncRangeService(), []);
  const cacheService = useMemo(() => new SyncCacheService(), []);
  const requestService = useMemo(() => new SyncRequestService(), []);
  const retryService = useMemo(() => new SyncRetryService(), []);
  const degradedModePolicy = useMemo(() => new DegradedModePolicy({
    degradeThresholdMs: FORCE_SYNC_DEGRADE_THRESHOLD_MS,
    circuitBreaker
  }), []);
  const orchestrator = useMemo(() => new SyncOrchestrator({ rangeService, cacheService, requestService, retryService }), [rangeService, cacheService, requestService, retryService]);
  const historyRecorder = useMemo(() => new SyncHistoryRecorder({ saveForcedRangeEntry, onForcedRangeRecorded }), [saveForcedRangeEntry, onForcedRangeRecorded]);
  const todayStr = useMemo(() => getTodayDateStr(), []);
  
  // Mémoïser MemoryCacheAdapter pour éviter les réinstanciations
  const memoryCacheAdapter = useMemo(() => {
    return new MemoryCacheAdapter(frontendCache, { schemaVersion: CACHE_SCHEMA_VERSION });
  }, [frontendCache]);
  const buildNetworkMeta = useCallback(() => {
    const circuitState = circuitBreaker.getState();
    const snapshot = degradedModePolicy.getSnapshot({
      currentDurationMs: null,
      forceRefresh: false
    });
    return {
      circuit: circuitState,
      cooldownMs: snapshot.currentCooldown,
      failureCount: circuitBreaker.getFailureCount(),
      degraded: snapshot.isDegraded,
      degradedReason: snapshot.degradedReason,
      nextRetry: snapshot.nextRetry,
      nextRetryTimestamp: snapshot.nextRetryTimestamp
    };
  }, [degradedModePolicy]);

  const recordUIMetric = useCallback((partial) => {
    updateUIMetricsStore((store) => {
      const timestamp = Date.now();
      const updates = { ...partial, timestamp };

      if (partial?.lastStatusMessage) {
        const historyEntry = {
          timestamp,
          message: partial.lastStatusMessage,
          ok: partial.lastStatusOk ?? null,
          error: partial.lastStatusError ?? null
        };
        const history = Array.isArray(store.history) ? [historyEntry, ...store.history] : [historyEntry];
        store.history = history.slice(0, 5);
      }

      return updates;
    });
  }, []);

  const syncNow = useCallback(async (options = {}) => {
    // Utiliser le pipeline si activé
    if (USE_SYNC_PIPELINE) {
      try {
        await syncNowWithPipeline({
          state: {
            baseUrl,
            setBaseUrl,
            frontendCache,
            clearFrontendCache,
            setLastSourceMeta
          },
          data: {
            dbReady,
            saveActivities,
            saveDailyMetrics,
            loadAllData,
            loadDataByRange,
            getLastSyncDate,
            setLastSyncDate,
            getSyncStartDate,
            getLastSyncTimestampForDate,
            loadDataForTab,
            saveForcedRangeEntry,
            setGarminData,
            importToEndurance,
            isDataEmptyForDate
          },
          services: {
            rangeService,
            cacheService,
            orchestrator
          },
          callbacks: {
            setStatus,
            setLoading
          },
          options: {
            onForcedRangeRecorded
          },
          todayStr,
          buildNetworkMeta,
          recordUIMetric,
          degradedModePolicy,
          memoryCacheAdapter,
          historyRecorder,
          rawOptions: options
        });
        return;
      } catch (error) {
        log.error('[syncNow] Pipeline execution failed, falling back to legacy:', error);
        // Fallback sur l'ancienne version en cas d'erreur
        // (on continue avec le code original ci-dessous)
      }
    }

    // Version originale (legacy) - sera remplacée progressivement
    // Utiliser SyncRangeService pour normaliser les options
    const normalizedOptions = rangeService.buildSyncOptions(options, todayStr);
    const {
      forceRefresh,
      skipDelay,
      forceMode,
      includeToday,
      forceRange,
      extraPayload,
      requestSource
    } = normalizedOptions;

    if (!dbReady) {
      const status = { ok: false, message: 'Base de données non prête', error: 'IndexedDB non initialisé' };
      setStatus(status);
      recordUIMetric({ lastStatusMessage: status.message });
      return;
    }

    if (forceRefresh) {
      clearFrontendCache();
    }

    // Utiliser SyncRangeService pour résoudre la plage forcée
    const resolvedRange = rangeService.resolveForcedRange({
      forceMode,
      forceRange,
      includeToday,
      todayStr
    });

    const fetcher = (path, fetchOptions) => tryFetch(path, fetchOptions, undefined, setBaseUrl);

    const serverResponseHandler = async (range, payload) => {
      if (!payload?.cached) {
        return;
      }
      // Utiliser l'adapter mémoïsé
      memoryCacheAdapter.set(range, payload.data, { forceMode, includeToday });
    };

    const processResponseForRetry = async (data, syncRange) => {
      await processSyncResponse(
        data,
        syncRange,
        dbReady,
        saveActivities,
        saveDailyMetrics,
        setGarminData,
        setLastSyncDate,
        loadAllData,
        importToEndurance
      );
    };

    const handleCacheHit = async (cacheResult, { degraded = false } = {}) => {
      if (!cacheResult) return false;
      const { source, payload, meta } = cacheResult;

      const setStatusWithDegrade = (message, extra = {}) => {
        const prefix = degraded ? 'Mode dégradé – ' : '';
        setStatus({
          ...extra,
          ok: true,
          message: `${prefix}${message}`
        });
        recordUIMetric({ lastStatusMessage: `${prefix}${message}` });
      };

      // Utiliser le helper centralisé pour réduire la duplication
      return await handleCacheHitHelper({
        source,
        payload,
        meta,
        context: {
          buildNetworkMeta,
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance
        },
        setStatusWithDegrade,
        setLastSourceMeta,
        processSyncResponse,
        recordUIMetric,
        rangeInfo: { startDate, endDate, lastSyncTimestamp },
        syncOptions: { forceMode, forceRefresh, includeToday, resolvedRange },
        degraded
      });
    };

    const handleForcedDegrade = (meta = {}) => {
      const triggeredAt = meta.triggeredAt || new Date().toISOString();
      const lastSyncFromCache = frontendCache?.data?.lastSync || null;

      // Générer un ID de session unique pour cette dégradation
      const sessionId = `degraded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Enregistrer la session dans DegradedModePolicy
      degradedModePolicy.recordDegradedSession({
        sessionId,
        metadata: {
          triggeredAt,
          thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
          startDate: meta.startDate ?? null,
          endDate: meta.endDate ?? null,
          reason: 'duration_threshold_exceeded'
        }
      });

      const degradedMessage = 'Mode dégradé – données locales conservées (forçage prolongé)';
      setStatus({
        lastSync: lastSyncFromCache,
        ok: true,
        message: degradedMessage,
        source: 'degraded'
      });

      if (frontendCache) {
        frontendCache.degradedMeta = {
          triggeredAt,
          thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
          startDate: meta.startDate ?? null,
          endDate: meta.endDate ?? null,
          sessionId
        };
      }

      // Obtenir le snapshot complet avec toutes les métriques
      const degradedSnapshot = degradedModePolicy.getSnapshot({
        sessionId,
        currentDurationMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
        forceRefresh: true
      });

      setLastSourceMeta({
        source: 'degraded',
        degraded: true,
        timestamp: triggeredAt,
        startDate: meta.startDate ?? null,
        endDate: meta.endDate ?? null,
        thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
        sessionId,
        currentCooldown: degradedSnapshot.currentCooldown,
        nextRetry: degradedSnapshot.nextRetry,
        nextRetryTimestamp: degradedSnapshot.nextRetryTimestamp,
        degradedReason: degradedSnapshot.degradedReason,
        ...buildNetworkMeta()
      });
    };

    const orchestratorContext = {
      forceRefresh,
      skipDelay,
      setStatus,
      getSyncStartDate,
      todayStr,
      getLastSyncTimestampForDate,
      resolvedRange,
      forceMode,
      includeToday,
      forceRange,
      extraPayload,
      loadAllData,
      loadDataByRange,
      frontendCache,
      isDataEmptyForDate,
      fetcher,
      processResponse: processResponseForRetry,
      cacheSchemaVersion: CACHE_SCHEMA_VERSION,
      serverResponseHandler,
      onForcedDegrade: handleForcedDegrade,
      forceDegradeThresholdMs: FORCE_SYNC_DEGRADE_THRESHOLD_MS
    };

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    log.debug('[syncNow] Exécution orchestrateur...');
    const { rangeInfo, cacheResult, result: orchestratorResult } = await orchestrator.execute(orchestratorContext);
    log.debug('[syncNow] Orchestrateur terminé', { 
      hasCacheResult: !!cacheResult, 
      hasOrchestratorResult: !!orchestratorResult,
      orchestratorResultType: typeof orchestratorResult,
      hasJson: !!orchestratorResult?.json
    });

    if (!orchestratorResult) {
      log.error('[syncNow] Orchestrateur a retourné un résultat null/undefined');
      throw new Error('Résultat orchestrateur invalide');
    }

    let {
      startDate,
      endDate,
      lastSyncTimestamp,
      usingForcedRange,
      rangeMeta
    } = rangeInfo;

    if (!usingForcedRange && !forceMode && rangeMeta?.wasAdjusted && rangeMeta?.startDate && rangeMeta?.endDate) {
      const { startDate: adjustedStart, endDate: adjustedEnd } = rangeMeta;
      try {
        log.info('[syncNow] setLoading(true) – adjusted range fallback');
        setLoading(true);
        if (IS_DEV) {
          // eslint-disable-next-line no-console
          console.info('[useGarminSyncActions] loading ← true (adjusted range fallback)');
        }
        const queryParts = [];
        if (adjustedStart) queryParts.push(`start=${encodeURIComponent(adjustedStart)}`);
        if (adjustedEnd) queryParts.push(`end=${encodeURIComponent(adjustedEnd)}`);
        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const json = await fetcher(`/api/garmin/sync${query}`, { method: 'POST' });

        setStatus({
          lastSync: json.lastSync,
          ok: json.ok,
          message: json.ok ? 'Sync OK' : 'Erreur sync',
          error: json.error
        });

        await processSyncResponse(
          json,
          { startDate: adjustedStart, endDate: adjustedEnd },
          dbReady,
          saveActivities,
          saveDailyMetrics,
          setGarminData,
          setLastSyncDate,
          loadAllData,
          importToEndurance
        );
      } catch (error) {
        setStatus({ ok: false, message: 'Erreur sync', error: error.message });
      } finally {
        log.info('[syncNow] setLoading(false) – adjusted range fallback');
        setLoading(false);
        if (IS_DEV) {
          // eslint-disable-next-line no-console
          console.info('[useGarminSyncActions] loading ← false (adjusted range fallback)');
        }
      }
      return;
    }

    if (!startDate) {
      startDate = todayStr;
    }
    if (!endDate) {
      endDate = todayStr;
    }

    if (await handleCacheHit(cacheResult)) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      recordUIMetric({
        lastSyncDuration: Math.round(endTime - startTime),
        lastSyncTimestamp: Date.now(),
        lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
      });
      return;
    }

    if (cacheResult?.source === 'indexeddb') {
      const idbPayload = cacheResult.payload;
      const mockResponse = {
        ok: true,
        cached: true,
        lastSync: idbPayload.lastSyncTimestamp || lastSyncTimestamp,
        data: idbPayload.data
      };

      setStatus({
        lastSync: mockResponse.lastSync,
        ok: true,
        message: 'Sync OK (cache IndexedDB)'
      });

      await processSyncResponse(
        mockResponse,
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

    if (cacheResult?.source === 'server') {
      const serverPayload = cacheResult.payload?.data;
      if (serverPayload) {
        setStatus({
          lastSync: serverPayload.lastSync,
          ok: true,
          message: 'Sync OK (cache serveur)'
        });

        await processSyncResponse(
          serverPayload,
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

    const syncStartTime = new Date().toISOString();
    const syncStartTimestamp = Date.now();
    log.info(`[Sync] Début synchronisation - Timestamp: ${syncStartTime}, ForceRefresh: ${forceRefresh}, Mode forcé: ${forceMode || 'none'}`);
    log.info(`[Sync] Plage de dates: ${startDate} → ${endDate}`);

    try {
      log.info('[syncNow] setLoading(true) – main network branch');
      setLoading(true);
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.info('[useGarminSyncActions] loading ← true (main network branch)');
      }

      log.debug('[syncNow] Extraction JSON du résultat orchestrateur...');
      const json = orchestratorResult?.json;
      if (!json) {
        log.error('[syncNow] JSON manquant dans orchestratorResult', orchestratorResult);
        throw new Error('Réponse réseau invalide (json manquant)');
      }
      log.debug('[syncNow] JSON extrait', { ok: json.ok, lastSync: json.lastSync, hasData: !!json.data });

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
      log.info(`[Sync] Synchronisation terminée - Durée traitement: ${processDuration}ms, Durée totale: ${totalDuration}ms`);

      historyRecorder.record(json, {
        forceMode,
        includeToday,
        requestedRange: forceRange,
        requestStart: startDate,
        requestEnd: endDate,
        effectiveStart,
        effectiveEnd,
        forceRefresh,
        source: requestSource
      }).catch((err) => {
        log.warn('[Sync] historyRecorder.record a échoué', err);
      });

      setLastSourceMeta({
        source: 'live',
        baseUrl,
        timestamp: new Date().toISOString(),
        ...buildNetworkMeta()
      });

    } catch (error) {
      if (error.code === 'GARMIN_CIRCUIT_OPEN') {
        const degradedCache = await cacheService.resolve(rangeInfo, {
          ...orchestratorContext,
          forceRefresh: false,
          allowStale: true,
          skipCache: false
        });

        if (await handleCacheHit(degradedCache, { degraded: true })) {
          return;
        }

        setStatus({
          ok: false,
          message: 'Mode dégradé indisponible (aucun cache exploitable)',
          error: error.message,
          source: 'offline'
        });
        setLastSourceMeta({
          source: 'offline',
          degraded: true,
          ...buildNetworkMeta()
        });
        return;
      }

      const requestBodyPayload = error?.__garminRequestPayload || null;
      try {
        const queryParts = [];
        if (startDate) queryParts.push(`start=${encodeURIComponent(startDate)}`);
        if (endDate) queryParts.push(`end=${encodeURIComponent(endDate)}`);
        const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const fallbackOptions = requestBodyPayload
          ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBodyPayload) }
          : { method: 'POST' };

        const json = await fetcher(`/api/garmin/sync${query}`, fallbackOptions);
        // Utiliser l'adapter mémoïsé
        memoryCacheAdapter.set({
          startDate,
          endDate,
          lastSyncTimestamp: rangeInfo.lastSyncTimestamp
        }, json, orchestratorContext);

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

        historyRecorder.record(json, {
          forceMode,
          includeToday,
          requestedRange: forceRange,
          requestStart: startDate,
          requestEnd: endDate,
          effectiveStart,
          effectiveEnd,
          forceRefresh,
          source: requestSource
        }).catch((err) => {
          log.warn('[Sync] historyRecorder.record (fallback) a échoué', err);
        });

        setLastSourceMeta({
          source: 'fallback',
          baseUrl,
          timestamp: new Date().toISOString(),
          ...buildNetworkMeta()
        });
      } catch (fallbackError) {
        setStatus({
          ok: false,
          message: 'Erreur de connexion au serveur Garmin. Consulte le diagnostic (/api/garmin/debug).',
          error: fallbackError.message
        });
        recordUIMetric({ lastStatusMessage: 'Erreur de connexion au serveur Garmin. Consulte le diagnostic (/api/garmin/debug).' });
      }
    } finally {
      log.info('[syncNow] setLoading(false) – main network branch');
      setLoading(false);
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.info('[useGarminSyncActions] loading ← false (main network branch)');
      }
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      recordUIMetric({
        lastSyncDuration: Math.round(endTime - startTime),
        lastSyncTimestamp: Date.now(),
        lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
      });
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
    historyRecorder,
    orchestrator,
    setBaseUrl,
    frontendCache,
    setLastSourceMeta,
    cacheService,
    buildNetworkMeta,
    recordUIMetric,
    rangeService,
    memoryCacheAdapter,
    todayStr
  ]);

  const fetchStatus = useCallback(async () => {
    try {
      const json = await tryFetch('/api/garmin/status');
      const status = {
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? 'Status OK' : 'Status erreur',
        error: json.error,
        diagnostic: json
      };
      setStatus(status);
      recordUIMetric({ lastStatusMessage: status.message });
      return json;
    } catch (error) {
      setStatus({ ok: false, message: 'Erreur status', error: error.message });
      recordUIMetric({ lastStatusMessage: 'Erreur status' });
      throw error;
    }
  }, [setStatus, recordUIMetric]);

  const backfill = useCallback(async (startDate, endDate, setSelectedDate) => {
    if (!startDate || !endDate) return;

    try {
      log.info('[backfill] setLoading(true)');
      setLoading(true);
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.info('[useGarminSyncActions] loading ← true (backfill)');
      }
      const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' }, undefined, setBaseUrl);

      setStatus({
        lastSync: json.lastSync,
        ok: json.ok,
        message: json.ok ? `Backfill OK (${startDate} → ${endDate})` : 'Backfill erreur',
        error: json.error
      });

      if (json.data && json.ok) {
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
          true
        );
      }

      if (typeof setSelectedDate === 'function') {
        setSelectedDate(endDate);
      }
    } catch (error) {
      setStatus({ ok: false, message: 'Backfill erreur', error: error.message });
      recordUIMetric({ lastStatusMessage: 'Backfill erreur' });
    } finally {
      log.info('[backfill] setLoading(false)');
      setLoading(false);
      if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.info('[useGarminSyncActions] loading ← false (backfill)');
      }
    }
  }, [
    dbReady,
    setBaseUrl,
    setStatus,
    setLoading,
    processSyncResponse,
    saveActivities,
    saveDailyMetrics,
    setGarminData,
    setLastSyncDate,
    loadAllData,
    importToEndurance,
    recordUIMetric
  ]);

  const resetCircuit = useCallback(() => {
    circuitBreaker.reset();
    setLastSourceMeta((prev) => ({
      ...(prev || {}),
      ...buildNetworkMeta(),
      timestamp: new Date().toISOString(),
      source: prev?.source ?? 'manual'
    }));
  }, [setLastSourceMeta, buildNetworkMeta]);

  const getNetworkStatsSnapshot = useCallback(() => {
    // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
    if (!isBrowser() || !window.__GARMIN_NETWORK_STATS__) {
      return null;
    }
    return { ...window.__GARMIN_NETWORK_STATS__ };
  }, []);

  const getUIMetricsSnapshot = useCallback(() => {
    const snapshot = getUIMetricsStoreSnapshot();
    return snapshot ? snapshot : null;
  }, []);

  const refreshDiagnostics = useCallback(async () => {
    const json = await tryFetch('/api/garmin/debug');
    return json;
  }, []);

  return {
    loading,
    baseUrl,
    syncNow,
    backfill,
    fetchStatus,
    clearFrontendCache,
    resetCircuit,
    getNetworkStatsSnapshot,
    getUIMetricsSnapshot,
    refreshDiagnostics
  };
};
