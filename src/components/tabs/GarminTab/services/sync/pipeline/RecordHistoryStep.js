/**
 * Step 10: Enregistrement de l'historique
 * 
 * Enregistre l'historique de la synchronisation.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('RecordHistoryStep');

export class RecordHistoryStep extends SyncStep {
  getName() {
    return 'recordHistory';
  }

  getRequiredDependencies() {
    return ['historyRecorder'];
  }

  async execute(context, state) {
    const { historyRecorder } = context;
    const {
      networkResponse,
      fallbackResponse, // Réponse du fallback depuis HandleErrorStep
      rangeInfo,
      forceMode,
      includeToday,
      forceRange,
      forceRefresh,
      requestSource,
      effectiveStart,
      effectiveEnd
    } = state;

    // Utiliser fallbackResponse si disponible (depuis HandleErrorStep), sinon networkResponse
    const responseToRecord = fallbackResponse || networkResponse;

    if (!responseToRecord) {
      log.debug('[execute] No response to record, skipping history recording');
      return {
        state,
        shouldContinue: true
      };
    }

    if (!rangeInfo) {
      log.debug('[execute] No rangeInfo, skipping history recording');
      return {
        state,
        shouldContinue: true
      };
    }

    const { startDate, endDate } = rangeInfo;

    log.debug('[execute] Recording sync history', {
      hasResponse: !!responseToRecord,
      isFallback: !!fallbackResponse,
      range: { startDate, endDate, effectiveStart, effectiveEnd }
    });

    try {
      await historyRecorder.record(responseToRecord, {
        forceMode,
        includeToday,
        requestedRange: forceRange,
        requestStart: startDate,
        requestEnd: endDate,
        effectiveStart: effectiveStart || startDate,
        effectiveEnd: effectiveEnd || endDate,
        forceRefresh,
        source: requestSource
      });

      log.debug('[execute] History recorded successfully');

      return {
        state: {
          ...state,
          historyRecorded: true
        },
        shouldContinue: true
      };
    } catch (error) {
      log.warn('[execute] History recording failed (non-blocking):', error);
      // Non-blocking : on continue même si l'enregistrement échoue
      return {
        state: {
          ...state,
          historyRecorded: false,
          historyRecordError: error.message
        },
        shouldContinue: true
      };
    }
  }
}

