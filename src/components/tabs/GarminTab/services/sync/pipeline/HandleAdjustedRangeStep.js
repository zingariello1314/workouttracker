/**
 * Step 7: Gestion des cas spéciaux (adjusted range)
 * 
 * Gère le cas où la plage a été ajustée par le serveur.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('HandleAdjustedRangeStep');

export class HandleAdjustedRangeStep extends SyncStep {
  getName() {
    return 'handleAdjustedRange';
  }

  getRequiredDependencies() {
    return [
      'setLoading',
      'setStatus',
      'fetcher',
      'processSyncResponse',
      'dbReady',
      'saveActivities',
      'saveDailyMetrics',
      'setGarminData',
      'setLastSyncDate',
      'loadAllData',
      'importToEndurance',
      'todayStr',
      'forceMode'
    ];
  }

  async execute(context, state) {
    const {
      setLoading,
      setStatus,
      fetcher,
      processSyncResponse,
      dbReady,
      saveActivities,
      saveDailyMetrics,
      setGarminData,
      setLastSyncDate,
      loadAllData,
      importToEndurance,
      todayStr,
      forceMode
    } = context;

    const {
      rangeInfo,
      forceMode: stateForceMode
    } = state;

    if (!rangeInfo) {
      log.debug('[execute] No rangeInfo, skipping adjusted range handling');
      return {
        state,
        shouldContinue: true
      };
    }

    const {
      startDate,
      endDate,
      usingForcedRange,
      rangeMeta
    } = rangeInfo;

    const effectiveForceMode = stateForceMode || forceMode;

    // Vérifier si on doit gérer le cas adjusted range
    if (usingForcedRange || effectiveForceMode || !rangeMeta?.wasAdjusted || !rangeMeta?.startDate || !rangeMeta?.endDate) {
      log.debug('[execute] Adjusted range handling not needed', {
        usingForcedRange,
        forceMode: effectiveForceMode,
        wasAdjusted: rangeMeta?.wasAdjusted
      });
      return {
        state,
        shouldContinue: true
      };
    }

    const { startDate: adjustedStart, endDate: adjustedEnd } = rangeMeta;

    log.info('[execute] Handling adjusted range', {
      original: { startDate, endDate },
      adjusted: { adjustedStart, adjustedEnd }
    });

    try {
      log.info('[execute] setLoading(true) – adjusted range fallback');
      setLoading(true);

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

      log.info('[execute] Adjusted range handled successfully');

      return {
        state: {
          ...state,
          adjustedRangeHandled: true,
          adjustedRangeResult: json
        },
        shouldContinue: false,
        earlyReturn: {
          success: true,
          source: 'adjustedRange',
          result: json
        }
      };
    } catch (error) {
      log.error('[execute] Adjusted range handling failed:', error);
      setStatus({ ok: false, message: 'Erreur sync', error: error.message });
      throw error;
    } finally {
      log.info('[execute] setLoading(false) – adjusted range fallback');
      setLoading(false);
    }
  }
}

