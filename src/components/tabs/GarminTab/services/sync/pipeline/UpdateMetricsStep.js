/**
 * Step 11: Mise à jour des métriques
 * 
 * Met à jour les métriques UI de la synchronisation.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('UpdateMetricsStep');

export class UpdateMetricsStep extends SyncStep {
  getName() {
    return 'updateMetrics';
  }

  getRequiredDependencies() {
    return ['recordUIMetric', 'setStatus'];
  }

  async execute(context, state) {
    const { recordUIMetric, setStatus } = context;
    const {
      startTime,
      forceMode,
      forceRefresh,
      includeToday,
      resolvedRange,
      totalDuration,
      processDuration,
      error,
      finalError,
      errorHandled,
      errorHandlingResult
    } = state;

    log.debug('[execute] Updating UI metrics', {
      hasStartTime: !!startTime,
      hasDuration: !!totalDuration,
      hasError: !!error || !!finalError,
      errorHandled
    });

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = startTime ? Math.round(endTime - startTime) : (totalDuration || 0);

    // Construire le message de status si erreur finale
    let statusMessage = null;
    if (finalError && errorHandlingResult === 'fallback_failed') {
      statusMessage = 'Erreur de connexion au serveur Garmin. Consulte le diagnostic (/api/garmin/debug).';
    }

    recordUIMetric({
      lastSyncDuration: duration,
      lastSyncTimestamp: Date.now(),
      lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange },
      processDuration: processDuration || null,
      lastStatusMessage: statusMessage || undefined
    });

    // Mettre à jour le status si erreur finale non gérée
    if (finalError && errorHandlingResult === 'fallback_failed' && setStatus) {
      setStatus({
        ok: false,
        message: statusMessage,
        error: finalError.message
      });
    }

    log.debug('[execute] Metrics updated', {
      duration,
      timestamp: Date.now(),
      hasError: !!finalError
    });

    return {
      state: {
        ...state,
        metricsUpdated: true,
        finalDuration: duration
      },
      shouldContinue: true
    };
  }
}

