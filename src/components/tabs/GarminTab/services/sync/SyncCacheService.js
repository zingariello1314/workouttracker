/**
 * Service responsable de la résolution des caches (IndexedDB + mémoire).
 */

import logger from '../../../../../utils/logger';
import { checkExistingData } from '../../hooks/garminSyncCore';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter';
import { CacheCoordinator } from '../cache/CacheCoordinator';
import { IndexedDbCacheAdapter } from '../cache/IndexedDbCacheAdapter';
import { ServerCacheAdapter } from '../cache/ServerCacheAdapter';

const log = logger.module('SyncCacheService');

export class SyncCacheService {
  async resolve(rangeInfo, context = {}) {
    if (!rangeInfo) {
      return null;
    }

    const {
      forceRefresh = false,
      todayStr,
      loadAllData,
      frontendCache,
      isDataEmptyForDate,
      skipCache = false,
      forceMode = null,
      includeToday = false,
      cacheSchemaVersion = 'v1'
    } = context;

    const memoryAdapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: cacheSchemaVersion });
    const indexedDbAdapter = new IndexedDbCacheAdapter({
      loadDataByRange: context.loadDataByRange,
      isDataEmptyForDate,
      getNow: () => Date.now()
    });
    const serverAdapter = new ServerCacheAdapter({ cacheSchemaVersion });

    const coordinator = new CacheCoordinator({
      memoryAdapter,
      indexedDbAdapter,
      serverAdapter,
      existingDataResolver: async () => {
        try {
          return await checkExistingData(
            forceRefresh,
            rangeInfo.lastSyncTimestamp,
            rangeInfo.endDate,
            todayStr,
            loadAllData
          );
        } catch (error) {
          log.warn('[resolve] Erreur checkExistingData, on poursuit le flux normal', error);
          return null;
        }
      }
    });

    const cacheContext = {
      skipCache,
      usingForcedRange: rangeInfo.usingForcedRange,
      forceRefresh,
      todayStr,
      isDataEmptyForDate,
      forceMode,
      includeToday,
      cacheSchemaVersion,
      serverResponse: context.frontendCache?.serverResponse || null
    };

    const cacheResult = await coordinator.resolve(rangeInfo, cacheContext);

    if (cacheResult?.source === 'existingData') {
      log.debug('[resolve] Hit données IndexedDB récentes (Phase 3.1)');
      return cacheResult;
    }

    if (cacheResult?.source === 'memory') {
      log.debug('[resolve] Hit cache mémoire (frontendCache)');
      return cacheResult;
    }

    if (cacheResult?.source === 'indexeddb') {
      log.debug('[resolve] Hit cache IndexedDB (Cascade Phase 3)');
      return cacheResult;
    }

    if (cacheResult?.source === 'server') {
      log.debug('[resolve] Hit cache serveur (réponse backend)');
      return cacheResult;
    }

    return null;
  }

  async recordServerHit(rangeInfo, response, context = {}) {
    const { serverResponseHandler, frontendCache } = context;
    const serverPayload = {
      data: response,
      cached: response?.cached === true
    };

    if (typeof serverResponseHandler === 'function') {
      try {
        await serverResponseHandler(rangeInfo, serverPayload);
      } catch (error) {
        log.warn('[recordServerHit] Unable to persist server response', error);
      }
    }

    if (frontendCache) {
      frontendCache.serverResponse = serverPayload;
    }
  }
}
