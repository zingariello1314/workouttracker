/**
 * Step 10 (alternatif): Gestion des erreurs avec fallback
 * 
 * Gère les erreurs de synchronisation avec fallback et mode dégradé.
 * Ce step s'exécute seulement si ProcessNetworkResponseStep a échoué.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';
import { isDateValid } from '../../../hooks/garminDateUtils';
import { processSyncResponse } from '../../../hooks/garminSyncProcessor';

const log = logger.module('HandleErrorStep');

export class HandleErrorStep extends SyncStep {
  getName() {
    return 'handleError';
  }

  getRequiredDependencies() {
    return [
      'cacheService',
      'setStatus',
      'setLastSourceMeta',
      'buildNetworkMeta',
      'fetcher',
      'processSyncResponse',
      'dbReady',
      'saveActivities',
      'saveDailyMetrics',
      'setGarminData',
      'setLastSyncDate',
      'loadAllData',
      'importToEndurance',
      'historyRecorder',
      'baseUrl',
      'todayStr',
      'memoryCacheAdapter'
    ];
  }

  async execute(context, state) {
    const {
      cacheService,
      setStatus,
      setLastSourceMeta,
      buildNetworkMeta,
      fetcher,
      processSyncResponse,
      dbReady,
      saveActivities,
      saveDailyMetrics,
      setGarminData,
      setLastSyncDate,
      loadAllData,
      importToEndurance,
      historyRecorder,
      baseUrl,
      todayStr,
      memoryCacheAdapter
    } = context;

    const {
      error,
      rangeInfo,
      orchestratorContext,
      forceMode,
      includeToday,
      forceRange,
      forceRefresh,
      requestSource
    } = state;

    // Si pas d'erreur, continuer normalement
    if (!error) {
      log.debug('[execute] No error to handle, continuing');
      return {
        state,
        shouldContinue: true
      };
    }

    log.warn('[execute] Handling sync error', {
      errorCode: error.code,
      errorMessage: error.message
    });

    // Gestion du circuit breaker ouvert
    if (error.code === 'GARMIN_CIRCUIT_OPEN') {
      log.info('[execute] Circuit breaker open, trying degraded cache');

      if (!rangeInfo || !orchestratorContext) {
        log.error('[execute] Missing rangeInfo or orchestratorContext for degraded cache');
        setStatus({
          ok: false,
          message: 'Mode dégradé indisponible (contexte manquant)',
          error: error.message,
          source: 'offline'
        });
        return {
          state: {
            ...state,
            errorHandled: true,
            errorHandlingResult: 'circuit_open_no_context'
          },
          shouldContinue: false,
          earlyReturn: {
            success: false,
            error: 'Circuit breaker open, no context for degraded cache'
          }
        };
      }

      try {
        const degradedCache = await cacheService.resolve(rangeInfo, {
          ...orchestratorContext,
          forceRefresh: false,
          allowStale: true,
          skipCache: false
        });

        if (degradedCache) {
          log.info('[execute] Degraded cache found, processing directly');
          
          // Gérer directement le degradedCache (similaire à HandleCacheHitStep mais en mode dégradé)
          const { source, payload, meta } = degradedCache;
          const { startDate, endDate, lastSyncTimestamp } = rangeInfo;

          // Utiliser handleCacheHitHelper avec degraded: true
          const { handleCacheHit: handleCacheHitHelper } = await import('../CacheHitHandler');
          
          const setStatusWithDegrade = (message, extra = {}) => {
            setStatus({
              ...extra,
              ok: true,
              message: `Mode dégradé – ${message}`
            });
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
            recordUIMetric: () => {}, // Sera fait dans UpdateMetricsStep
            rangeInfo: { startDate, endDate, lastSyncTimestamp },
            syncOptions: { forceMode, forceRefresh, includeToday, resolvedRange: null },
            degraded: true
          });

          if (cacheHitHandled) {
            log.info('[execute] Degraded cache handled successfully');
            return {
              state: {
                ...state,
                errorHandled: true,
                errorHandlingResult: 'circuit_open_degraded_cache_handled',
                degradedCacheHandled: true
              },
              shouldContinue: true // Continuer pour recordHistory et updateMetrics
            };
          }
        }

        log.warn('[execute] No degraded cache available');
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

        return {
          state: {
            ...state,
            errorHandled: true,
            errorHandlingResult: 'circuit_open_no_cache'
          },
          shouldContinue: false,
          earlyReturn: {
            success: false,
            error: 'Circuit breaker open, no degraded cache available'
          }
        };
      } catch (degradedError) {
        log.error('[execute] Error while trying degraded cache:', degradedError);
        setStatus({
          ok: false,
          message: 'Erreur lors de la tentative de mode dégradé',
          error: degradedError.message,
          source: 'offline'
        });
        return {
          state: {
            ...state,
            errorHandled: true,
            errorHandlingResult: 'circuit_open_degraded_error'
          },
          shouldContinue: false,
          earlyReturn: {
            success: false,
            error: degradedError.message
          }
        };
      }
    }

    // Fallback : requête réseau directe
    if (!rangeInfo) {
      log.error('[execute] No rangeInfo for fallback');
      setStatus({
        ok: false,
        message: 'Erreur de synchronisation (plage manquante)',
        error: error.message
      });
      return {
        state: {
          ...state,
          errorHandled: true,
          errorHandlingResult: 'fallback_no_range'
        },
        shouldContinue: false,
        earlyReturn: {
          success: false,
          error: 'No rangeInfo for fallback'
        }
      };
    }

    const { startDate, endDate, lastSyncTimestamp } = rangeInfo;
    const requestBodyPayload = error?.__garminRequestPayload || null;

    log.info('[execute] Attempting fallback network request', {
      startDate,
      endDate,
      hasPayload: !!requestBodyPayload
    });

    try {
      const queryParts = [];
      if (startDate) queryParts.push(`start=${encodeURIComponent(startDate)}`);
      if (endDate) queryParts.push(`end=${encodeURIComponent(endDate)}`);
      const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const fallbackOptions = requestBodyPayload
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBodyPayload) }
        : { method: 'POST' };

      const json = await fetcher(`/api/garmin/sync${query}`, fallbackOptions);

      // Mettre en cache
      if (orchestratorContext && memoryCacheAdapter) {
        memoryCacheAdapter.set({
          startDate,
          endDate,
          lastSyncTimestamp
        }, json, orchestratorContext);
      }

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

      // Enregistrer l'historique
      try {
        await historyRecorder.record(json, {
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
      } catch (historyError) {
        log.warn('[execute] History recording failed (non-blocking):', historyError);
      }

      setLastSourceMeta({
        source: 'fallback',
        baseUrl,
        timestamp: new Date().toISOString(),
        ...buildNetworkMeta()
      });

      log.info('[execute] Fallback successful');

      return {
        state: {
          ...state,
          errorHandled: true,
          errorHandlingResult: 'fallback_success',
          fallbackResponse: json,
          effectiveStart,
          effectiveEnd
        },
        shouldContinue: true // Continuer pour recordHistory et updateMetrics
      };
    } catch (fallbackError) {
      log.error('[execute] Fallback failed:', fallbackError);
      setStatus({
        ok: false,
        message: 'Erreur de connexion au serveur Garmin. Consulte le diagnostic (/api/garmin/debug).',
        error: fallbackError.message
      });
      // recordUIMetric sera fait dans UpdateMetricsStep

      return {
        state: {
          ...state,
          errorHandled: true,
          errorHandlingResult: 'fallback_failed',
          finalError: fallbackError
        },
        shouldContinue: true // Continuer pour updateMetrics même en cas d'erreur
      };
    }
  }
}

