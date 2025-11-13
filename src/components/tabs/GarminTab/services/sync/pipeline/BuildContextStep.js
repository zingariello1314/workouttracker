/**
 * Step 5: Construction du contexte orchestrateur
 * 
 * Construit le contexte complet pour l'orchestrateur de synchronisation.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';
import { CACHE_SCHEMA_VERSION, FORCE_SYNC_DEGRADE_THRESHOLD_MS } from '../../../constants';

const log = logger.module('BuildContextStep');

export class BuildContextStep extends SyncStep {
  getName() {
    return 'buildContext';
  }

  getRequiredDependencies() {
    return [
      'setStatus',
      'getSyncStartDate',
      'todayStr',
      'getLastSyncTimestampForDate',
      'loadAllData',
      'loadDataByRange',
      'frontendCache',
      'isDataEmptyForDate',
      'fetcher',
      'processResponse',
      'serverResponseHandler',
      'onForcedDegrade',
      'memoryCacheAdapter'
    ];
  }

  async execute(context, state) {
    const {
      setStatus,
      getSyncStartDate,
      todayStr,
      getLastSyncTimestampForDate,
      loadAllData,
      loadDataByRange,
      frontendCache,
      isDataEmptyForDate,
      fetcher,
      processResponse,
      serverResponseHandler: baseServerResponseHandler,
      onForcedDegrade,
      memoryCacheAdapter
    } = context;

    const {
      normalizedOptions,
      resolvedRange: stateResolvedRange,
      forceRefresh,
      skipDelay,
      forceMode,
      includeToday,
      forceRange,
      extraPayload
    } = state;

    // Utiliser resolvedRange du state si disponible
    const effectiveResolvedRange = stateResolvedRange;

    log.debug('[execute] Building orchestrator context', {
      forceRefresh,
      skipDelay,
      hasResolvedRange: !!effectiveResolvedRange,
      forceMode,
      includeToday
    });

    // Wrapper pour serverResponseHandler qui capture forceMode et includeToday du state
    const serverResponseHandlerWithState = async (range, payload) => {
      if (baseServerResponseHandler) {
        // Passer forceMode et includeToday via un objet state
        await baseServerResponseHandler(range, payload, {
          forceMode,
          includeToday
        });
      } else if (memoryCacheAdapter && payload?.cached) {
        // Fallback direct si baseServerResponseHandler n'est pas disponible
        memoryCacheAdapter.set(range, payload.data, {
          forceMode,
          includeToday
        });
      }
    };

    const orchestratorContext = {
      forceRefresh,
      skipDelay,
      setStatus,
      getSyncStartDate,
      todayStr,
      getLastSyncTimestampForDate,
      resolvedRange: effectiveResolvedRange,
      forceMode,
      includeToday,
      forceRange,
      extraPayload,
      loadAllData,
      loadDataByRange,
      frontendCache,
      isDataEmptyForDate,
      fetcher,
      processResponse,
      cacheSchemaVersion: CACHE_SCHEMA_VERSION,
      serverResponseHandler: serverResponseHandlerWithState,
      onForcedDegrade,
      forceDegradeThresholdMs: FORCE_SYNC_DEGRADE_THRESHOLD_MS
    };

    log.debug('[execute] Orchestrator context built', {
      contextKeys: Object.keys(orchestratorContext).length
    });

    return {
      state: {
        ...state,
        orchestratorContext
      },
      shouldContinue: true
    };
  }
}

