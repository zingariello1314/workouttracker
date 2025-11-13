/**
 * Step 9: Traitement de la réponse réseau
 * 
 * Traite la réponse réseau principale de la synchronisation.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';
import { isDateValid } from '../../../hooks/garminDateUtils';

const log = logger.module('ProcessNetworkResponseStep');

export class ProcessNetworkResponseStep extends SyncStep {
  getName() {
    return 'processNetworkResponse';
  }

  getRequiredDependencies() {
    return [
      'setLoading',
      'setStatus',
      'processSyncResponse',
      'dbReady',
      'saveActivities',
      'saveDailyMetrics',
      'setGarminData',
      'setLastSyncDate',
      'loadAllData',
      'importToEndurance',
      'setLastSourceMeta',
      'buildNetworkMeta',
      'baseUrl',
      'todayStr',
      'forceMode'
    ];
  }

  async execute(context, state) {
    const {
      setLoading,
      setStatus,
      processSyncResponse,
      dbReady,
      saveActivities,
      saveDailyMetrics,
      setGarminData,
      setLastSyncDate,
      loadAllData,
      importToEndurance,
      setLastSourceMeta,
      buildNetworkMeta,
      baseUrl,
      todayStr,
      forceMode
    } = context;

    const {
      orchestratorResult,
      rangeInfo,
      forceMode: stateForceMode,
      forceRefresh,
      includeToday,
      forceRange,
      requestSource
    } = state;

    if (!orchestratorResult) {
      log.debug('[execute] No orchestrator result, skipping network response processing');
      return {
        state,
        shouldContinue: true
      };
    }

    if (!rangeInfo) {
      log.debug('[execute] No rangeInfo, skipping network response processing');
      return {
        state,
        shouldContinue: true
      };
    }

    let { startDate, endDate } = rangeInfo;
    const effectiveForceMode = stateForceMode || forceMode;

    // Normaliser les dates
    if (!startDate) {
      startDate = todayStr;
    }
    if (!endDate) {
      endDate = todayStr;
    }

    const syncStartTime = new Date().toISOString();
    const syncStartTimestamp = Date.now();
    log.info(`[execute] Processing network response - Timestamp: ${syncStartTime}, ForceRefresh: ${forceRefresh}, Mode: ${effectiveForceMode || 'none'}`);
    log.info(`[execute] Date range: ${startDate} → ${endDate}`);

    try {
      log.info('[execute] setLoading(true) – main network branch');
      setLoading(true);

      log.debug('[execute] Extracting JSON from orchestrator result');
      const json = orchestratorResult?.json;
      if (!json) {
        log.error('[execute] Missing JSON in orchestratorResult', orchestratorResult);
        throw new Error('Réponse réseau invalide (json manquant)');
      }
      log.debug('[execute] JSON extracted', { ok: json.ok, lastSync: json.lastSync, hasData: !!json.data });

      const effectiveStart = json?.forcedRange?.start || startDate;
      const effectiveEnd = json?.forcedRange?.end || endDate;
      const shouldSkipLastSyncUpdate = Boolean(
        effectiveForceMode &&
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
      log.info(`[execute] Synchronization completed - Process duration: ${processDuration}ms, Total duration: ${totalDuration}ms`);

      setLastSourceMeta({
        source: 'live',
        baseUrl,
        timestamp: new Date().toISOString(),
        ...buildNetworkMeta()
      });

      return {
        state: {
          ...state,
          networkResponseProcessed: true,
          networkResponse: json,
          effectiveStart,
          effectiveEnd,
          processDuration,
          totalDuration,
          syncStartTimestamp
        },
        shouldContinue: true
      };
    } catch (error) {
      log.error('[execute] Network response processing failed:', error);
      // Mettre l'erreur dans le state pour que HandleErrorStep la gère
      return {
        state: {
          ...state,
          error,
          networkResponseProcessed: false
        },
        shouldContinue: true // Continuer pour que HandleErrorStep gère l'erreur
      };
    } finally {
      log.info('[execute] setLoading(false) – main network branch');
      setLoading(false);
    }
  }
}

