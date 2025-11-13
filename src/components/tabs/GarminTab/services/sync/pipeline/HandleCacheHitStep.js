/**
 * Step 8: Gestion des cache hits
 * 
 * Gère tous les types de cache hits (existingData, indexeddb, server).
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';
import { handleCacheHit as handleCacheHitHelper } from '../CacheHitHandler';

const log = logger.module('HandleCacheHitStep');

export class HandleCacheHitStep extends SyncStep {
  getName() {
    return 'handleCacheHit';
  }

  getRequiredDependencies() {
    return [
      'buildNetworkMeta',
      'dbReady',
      'saveActivities',
      'saveDailyMetrics',
      'setGarminData',
      'setLastSyncDate',
      'loadAllData',
      'importToEndurance',
      'setStatus',
      'setLastSourceMeta',
      'processSyncResponse',
      'recordUIMetric',
      'todayStr'
    ];
  }

  async execute(context, state) {
    const {
      buildNetworkMeta,
      dbReady,
      saveActivities,
      saveDailyMetrics,
      setGarminData,
      setLastSyncDate,
      loadAllData,
      importToEndurance,
      setStatus,
      setLastSourceMeta,
      processSyncResponse,
      recordUIMetric,
      todayStr
    } = context;

    const {
      cacheResult,
      degradedCache, // Cache dégradé depuis HandleErrorStep
      rangeInfo,
      forceMode,
      forceRefresh,
      includeToday,
      resolvedRange,
      startTime
    } = state;

    // Utiliser degradedCache si disponible (depuis HandleErrorStep)
    const effectiveCacheResult = degradedCache || cacheResult;

    if (!effectiveCacheResult) {
      log.debug('[execute] No cache result, skipping cache hit handling');
      return {
        state,
        shouldContinue: true
      };
    }

    const { source, payload, meta } = effectiveCacheResult;

    if (!rangeInfo) {
      log.debug('[execute] No rangeInfo, skipping cache hit handling');
      return {
        state,
        shouldContinue: true
      };
    }

    let { startDate, endDate, lastSyncTimestamp } = rangeInfo;

    // Normaliser les dates si manquantes
    if (!startDate) {
      startDate = todayStr;
    }
    if (!endDate) {
      endDate = todayStr;
    }

    log.debug('[execute] Handling cache hit', {
      source,
      hasPayload: !!payload,
      hasMeta: !!meta,
      range: { startDate, endDate }
    });

    // Utiliser le helper centralisé pour la plupart des cas
    const setStatusWithDegrade = (message, extra = {}) => {
      setStatus({
        ...extra,
        ok: true,
        message
      });
      recordUIMetric({ lastStatusMessage: message });
    };

    const cacheHitHandled = await handleCacheHitHelper({
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
      degraded: false
    });

    if (cacheHitHandled) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = startTime ? Math.round(endTime - startTime) : 0;

      recordUIMetric({
        lastSyncDuration: duration,
        lastSyncTimestamp: Date.now(),
        lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
      });

      log.debug('[execute] Cache hit handled successfully', {
        source,
        duration
      });

      return {
        state: {
          ...state,
          cacheHitHandled: true,
          cacheHitSource: source
        },
        shouldContinue: false,
        earlyReturn: {
          success: true,
          source: 'cache',
          cacheSource: source
        }
      };
    }

    // Cas spéciaux pour indexeddb et server (gérés séparément dans le code original)
    if (source === 'indexeddb') {
      const idbPayload = payload;
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

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = startTime ? Math.round(endTime - startTime) : 0;

      recordUIMetric({
        lastSyncDuration: duration,
        lastSyncTimestamp: Date.now(),
        lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
      });

      return {
        state: {
          ...state,
          cacheHitHandled: true,
          cacheHitSource: 'indexeddb'
        },
        shouldContinue: false,
        earlyReturn: {
          success: true,
          source: 'cache',
          cacheSource: 'indexeddb'
        }
      };
    }

    if (source === 'server') {
      const serverPayload = payload?.data;
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

        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = startTime ? Math.round(endTime - startTime) : 0;

        recordUIMetric({
          lastSyncDuration: duration,
          lastSyncTimestamp: Date.now(),
          lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
        });

        return {
          state: {
            ...state,
            cacheHitHandled: true,
            cacheHitSource: 'server'
          },
          shouldContinue: false,
          earlyReturn: {
            success: true,
            source: 'cache',
            cacheSource: 'server'
          }
        };
      }
    }

    log.debug('[execute] Cache hit not handled, continuing pipeline');
    return {
      state,
      shouldContinue: true
    };
  }
}

