/**
 * Service responsable de la résolution des caches (IndexedDB + mémoire).
 */

import logger from '../../../../../utils/logger';
import { checkExistingData } from '../../hooks/garminSyncCore';
import { MemoryCacheAdapter } from '../cache/MemoryCacheAdapter';
import { CacheCoordinator } from '../cache/CacheCoordinator';
import { IndexedDbCacheAdapter } from '../cache/IndexedDbCacheAdapter';
import { ServerCacheAdapter } from '../cache/ServerCacheAdapter';
import { SWRCacheAdapter } from '../cache/SWRCacheAdapter';
import { SyncRequestService } from './SyncRequestService';
import { USE_SWR_CACHE } from '../../constants';

const log = logger.module('SyncCacheService');

export class SyncCacheService {
  constructor() {
    this.requestService = new SyncRequestService();
    this.swrAdapters = new WeakMap(); // Map des adapters SWR par frontendCache (WeakMap pour GC automatique)
  }

  /**
   * Crée une fonction de revalidation pour SWR
   * @param {Object} context - Contexte de synchronisation
   * @returns {Function} Fonction de revalidation
   */
  createRevalidateFn(context) {
    return async (rangeInfo, revalidateContext) => {
      // Revalidation simplifiée : fetch réseau sans toute la logique de sync
      try {
        log.debug('[createRevalidateFn] Starting SWR revalidation', {
          startDate: rangeInfo.startDate,
          endDate: rangeInfo.endDate
        });

        // Utiliser SyncRequestService pour construire et exécuter la requête
        const networkResult = await this.requestService.fetch(rangeInfo, {
          ...context,
          ...revalidateContext,
          forceRefresh: false, // Ne pas forcer le refresh lors de la revalidation SWR
          skipCache: false // Permettre le cache serveur si disponible
        });

        if (!networkResult || !networkResult.json) {
          log.warn('[createRevalidateFn] Invalid network result', networkResult);
          return null;
        }

        // Mettre à jour le cache via serverResponseHandler si disponible
        if (typeof context.serverResponseHandler === 'function') {
          const serverPayload = {
            data: networkResult.json,
            cached: networkResult.json?.cached === true
          };
          await context.serverResponseHandler(rangeInfo, serverPayload);
        }

        log.debug('[createRevalidateFn] SWR revalidation successful');
        return {
          data: networkResult.json,
          timestamp: Date.now()
        };
      } catch (error) {
        log.warn('[createRevalidateFn] SWR revalidation failed', error);
        throw error;
      }
    };
  }

  /**
   * Nettoie les ressources SWR (listeners, timers)
   * @param {Object} frontendCache - Cache frontend optionnel pour nettoyer un adapter spécifique
   */
  cleanup(frontendCache = null) {
    if (frontendCache && this.swrAdapters.has(frontendCache)) {
      const adapter = this.swrAdapters.get(frontendCache);
      if (adapter) {
        adapter.cleanup();
        this.swrAdapters.delete(frontendCache);
      }
    } else {
      // Nettoyer tous les adapters (si WeakMap n'est pas utilisé partout)
      // Note: WeakMap ne permet pas d'itérer, donc on ne peut pas nettoyer tous les adapters
      // C'est acceptable car WeakMap permet le GC automatique
      log.debug('[cleanup] SWR adapters cleanup requested (WeakMap handles GC automatically)');
    }
  }

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

    // Créer l'adapter mémoire de base
    const baseMemoryAdapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: cacheSchemaVersion });

    // Wrapper avec SWR si activé
    let memoryAdapter = baseMemoryAdapter;
    if (USE_SWR_CACHE && !forceRefresh && !skipCache && frontendCache) {
      // Créer ou réutiliser l'adapter SWR (un par frontendCache pour éviter les fuites)
      let swrAdapter = this.swrAdapters.get(frontendCache);
      if (!swrAdapter) {
        const revalidateFn = this.createRevalidateFn(context);
        swrAdapter = new SWRCacheAdapter({
          baseAdapter: baseMemoryAdapter,
          revalidateFn,
          config: {
            staleThresholdMs: 30000, // 30 secondes pour considérer comme stale
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            revalidateInterval: null, // Pas de revalidation périodique automatique
            revalidateDebounceMs: 2000, // 2 secondes entre deux revalidations
            revalidateTimeoutMs: 30000 // 30 secondes timeout
          }
        });
        this.swrAdapters.set(frontendCache, swrAdapter);
        log.debug('[resolve] SWR cache adapter created for frontendCache');
      }
      memoryAdapter = swrAdapter;
    }

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
      // Vérifier si c'est un hit SWR (données stale)
      if (cacheResult.payload?.stale && cacheResult.payload?.swr) {
        log.debug('[resolve] Hit cache mémoire SWR (stale, revalidation en cours)');
      } else {
        log.debug('[resolve] Hit cache mémoire (frontendCache)');
      }
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
