/**
 * Hook actions pour orchestrer la synchronisation Garmin.
 */

import { useMemo, useCallback } from 'react';
import { CACHE_SCHEMA_VERSION, FORCE_SYNC_DEGRADE_THRESHOLD_MS } from '../constants';
import logger from '../../../../utils/logger';
import { tryFetch, circuitBreaker } from './garminSyncFetch';
import { isDataEmptyForDate } from './garminSyncValidation';
import { processSyncResponse } from './garminSyncProcessor';
import {
  getTodayDateStr,
  getDateFromStr,
  subtractDaysFromDateStr,
  isDateValid,
  isDateBeforeOrEqual
} from './garminDateUtils';
import { SyncRangeService } from '../services/sync/SyncRangeService';
import { SyncCacheService } from '../services/sync/SyncCacheService';
import { SyncOrchestrator } from '../services/sync/SyncOrchestrator';
import { SyncRequestService } from '../services/sync/SyncRequestService';
import { SyncRetryService } from '../services/sync/SyncRetryService';
import { SyncHistoryRecorder } from '../services/sync/SyncHistoryRecorder';
import { MemoryCacheAdapter } from '../services/cache/MemoryCacheAdapter';
import { updateUIMetricsStore, getUIMetricsSnapshot as getUIMetricsStoreSnapshot } from '../utils/uiMetricsStore';

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
  const orchestrator = useMemo(() => new SyncOrchestrator({ rangeService, cacheService, requestService, retryService }), [rangeService, cacheService, requestService, retryService]);
  const historyRecorder = useMemo(() => new SyncHistoryRecorder({ saveForcedRangeEntry, onForcedRangeRecorded }), [saveForcedRangeEntry, onForcedRangeRecorded]);
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const buildNetworkMeta = useCallback(() => ({
    circuit: circuitBreaker.getState(),
    cooldownMs: circuitBreaker.getCooldownRemaining(),
    failureCount: circuitBreaker.getFailureCount()
  }), []);

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
      const status = { ok: false, message: 'Base de données non prête', error: 'IndexedDB non initialisé' };
      setStatus(status);
      recordUIMetric({ lastStatusMessage: status.message });
      return;
    }

    if (forceRefresh) {
      clearFrontendCache();
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

    const resolvedRange = forceMode ? resolveForcedRange() : null;

    const fetcher = (path, fetchOptions) => tryFetch(path, fetchOptions, undefined, setBaseUrl);

    const serverResponseHandler = async (range, payload) => {
      if (!payload?.cached) {
        return;
      }
      const memoryAdapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: CACHE_SCHEMA_VERSION });
      memoryAdapter.set(range, payload.data, { forceMode, includeToday });
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
      const metaWithFlags = {
        ...(meta || {}),
        source,
        degraded,
        ...buildNetworkMeta()
      };

      const setStatusWithDegrade = (message, extra = {}) => {
        const prefix = degraded ? 'Mode dégradé – ' : '';
        setStatus({
          ...extra,
          ok: true,
          message: `${prefix}${message}`
        });
        recordUIMetric({ lastStatusMessage: `${prefix}${message}` });
      };

      switch (source) {
        case 'existingData': {
          const existingDataResult = payload;
          const cacheMessage = `Sync OK (données existantes, ${existingDataResult.ageSeconds ?? '?'}s)`;
          setStatusWithDegrade(cacheMessage, {
            lastSync: existingDataResult.mockResponse?.lastSync,
            source
          });
          setLastSourceMeta(metaWithFlags);
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
          recordUIMetric({
            lastSyncTimestamp: Date.now(),
            lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
          });
          return true;
        }
        case 'memory': {
          if (!payload?.data) {
            return false;
          }
          setStatusWithDegrade('Sync OK (cache mémoire)', {
            lastSync: payload.data.lastSync,
            source,
            ttlMs: metaWithFlags.ttlMs ?? null
          });
          setLastSourceMeta({
            ...metaWithFlags,
            ttlMs: payload.remainingMs ?? null
          });
          await processSyncResponse(
            payload.data,
            { startDate, endDate },
            dbReady,
            saveActivities,
            saveDailyMetrics,
            setGarminData,
            setLastSyncDate,
            loadAllData,
            importToEndurance
          );
          recordUIMetric({
            lastSyncTimestamp: Date.now(),
            lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
          });
          return true;
        }
        case 'indexeddb': {
          if (!payload?.data) {
            return false;
          }
          const mockResponse = {
            ok: true,
            cached: true,
            lastSync: payload.lastSyncTimestamp || lastSyncTimestamp,
            data: payload.data
          };
          setStatusWithDegrade('Sync OK (cache IndexedDB)', {
            lastSync: mockResponse.lastSync,
            source
          });
          setLastSourceMeta(metaWithFlags);
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
          recordUIMetric({
            lastSyncTimestamp: Date.now(),
            lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
          });
          return true;
        }
        case 'server': {
          if (!payload?.data) {
            return false;
          }
          setStatusWithDegrade('Sync OK (cache serveur)', {
            lastSync: payload.data.lastSync,
            source,
            ttlMs: payload.ttl ?? null
          });
          setLastSourceMeta(metaWithFlags);
          await processSyncResponse(
            payload.data,
            { startDate, endDate },
            dbReady,
            saveActivities,
            saveDailyMetrics,
            setGarminData,
            setLastSyncDate,
            loadAllData,
            importToEndurance
          );
          recordUIMetric({
            lastSyncTimestamp: Date.now(),
            lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
          });
          return true;
        }
        default:
          return false;
      }
    };

    const handleForcedDegrade = (meta = {}) => {
      const triggeredAt = meta.triggeredAt || new Date().toISOString();
      const lastSyncFromCache = frontendCache?.data?.lastSync || null;

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
          endDate: meta.endDate ?? null
        };
      }

      setLastSourceMeta({
        source: 'degraded',
        degraded: true,
        timestamp: triggeredAt,
        startDate: meta.startDate ?? null,
        endDate: meta.endDate ?? null,
        thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
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
    const { rangeInfo, cacheResult, result: orchestratorResult } = await orchestrator.execute(orchestratorContext);

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

      const json = orchestratorResult?.json;
      if (!json) {
        throw new Error('Réponse réseau invalide (json manquant)');
      }

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
        const memoryAdapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: CACHE_SCHEMA_VERSION });
        memoryAdapter.set({
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
    recordUIMetric
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
    if (typeof window === 'undefined' || !window.__GARMIN_NETWORK_STATS__) {
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
