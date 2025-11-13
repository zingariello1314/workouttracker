/**
 * Version de syncNow utilisant le SyncPipelineRunner
 * 
 * Cette fonction remplace progressivement la version originale de syncNow()
 * pour utiliser le pipeline modulaire.
 */

import logger from '../../../../utils/logger';
import { buildSyncPipeline } from '../services/sync/buildSyncPipeline';
import { buildSyncContext } from '../services/sync/buildSyncContext';

const log = logger.module('syncNowWithPipeline');

/**
 * Exécute la synchronisation via le pipeline
 * 
 * @param {Object} params
 * @param {Object} params.state - État du hook
 * @param {Object} params.data - Données et fonctions de données
 * @param {Object} params.services - Services (rangeService, cacheService, etc.)
 * @param {Object} params.callbacks - Callbacks (setStatus, setLoading, etc.)
 * @param {Object} params.options - Options de synchronisation
 * @param {string} params.todayStr - Date du jour
 * @param {Function} params.buildNetworkMeta - Fonction pour construire les métadonnées réseau
 * @param {Function} params.recordUIMetric - Fonction pour enregistrer les métriques UI
 * @param {Object} params.degradedModePolicy - Instance de DegradedModePolicy
 * @param {Object} params.memoryCacheAdapter - Instance de MemoryCacheAdapter
 * @param {Object} params.historyRecorder - Instance de SyncHistoryRecorder
 * @param {Object} params.rawOptions - Options brutes de synchronisation
 * @returns {Promise<void>}
 */
export async function syncNowWithPipeline({
  state,
  data,
  services,
  callbacks,
  options,
  todayStr,
  buildNetworkMeta,
  recordUIMetric,
  degradedModePolicy,
  memoryCacheAdapter,
  historyRecorder,
  rawOptions = {}
}) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  log.debug('[syncNowWithPipeline] Starting sync with pipeline', {
    hasOptions: !!rawOptions,
    optionsKeys: Object.keys(rawOptions)
  });

  try {
    // Construire le contexte complet
    const context = buildSyncContext({
      state,
      data,
      services,
      callbacks,
      options,
      todayStr,
      buildNetworkMeta,
      recordUIMetric,
      degradedModePolicy,
      memoryCacheAdapter,
      historyRecorder
    });

    // Construire le pipeline
    const pipeline = buildSyncPipeline({
      enableInstrumentation: true,
      onStepStart: (stepName, index, currentState) => {
        log.debug(`[syncNowWithPipeline] Step ${index + 1}/${pipeline.getStepCount()}: ${stepName} started`);
      },
      onStepEnd: (stepName, index, duration, success, result) => {
        log.debug(`[syncNowWithPipeline] Step ${index + 1}/${pipeline.getStepCount()}: ${stepName} completed`, {
          duration: `${duration}ms`,
          success,
          hasEarlyReturn: !!result?.earlyReturn
        });
      },
      onStepError: (stepName, index, error, duration) => {
        log.error(`[syncNowWithPipeline] Step ${index + 1}/${pipeline.getStepCount()}: ${stepName} failed`, {
          duration: `${duration}ms`,
          error: error.message
        });
      }
    });

    // État initial du pipeline
    const initialState = {
      rawOptions,
      startTime
    };

    // Exécuter le pipeline
    const result = await pipeline.execute(context, initialState);

    // Gérer le résultat
    if (result.error) {
      log.error('[syncNowWithPipeline] Pipeline execution failed:', result.error);
      throw result.error;
    }

    if (result.result) {
      // Early return (cache hit, adjusted range, etc.)
      log.debug('[syncNowWithPipeline] Pipeline completed with early return', {
        resultType: typeof result.result,
        hasSource: !!result.result.source
      });
      return;
    }

    // Pipeline terminé normalement
    log.debug('[syncNowWithPipeline] Pipeline completed successfully', {
      totalDuration: result.instrumentation?.totalDuration,
      stepCount: result.instrumentation?.steps?.length
    });

    // Les métriques sont mises à jour par UpdateMetricsStep
    // L'historique est enregistré par RecordHistoryStep
  } catch (error) {
    log.error('[syncNowWithPipeline] Unexpected error:', error);
    
    // Mettre à jour le status en cas d'erreur non gérée
    callbacks.setStatus({
      ok: false,
      message: 'Erreur de synchronisation',
      error: error.message
    });
    
    // Enregistrer la métrique d'erreur
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    recordUIMetric({
      lastSyncDuration: Math.round(endTime - startTime),
      lastSyncTimestamp: Date.now(),
      lastStatusMessage: `Erreur: ${error.message}`
    });
    
    throw error;
  }
}

