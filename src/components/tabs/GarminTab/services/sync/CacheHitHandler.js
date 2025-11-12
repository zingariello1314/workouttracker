/**
 * Service helper pour gérer les différents types de cache hits dans la synchronisation Garmin.
 * 
 * Centralise la logique répétitive de traitement des cache hits (existingData, memory, indexeddb, server)
 * pour réduire la duplication de code dans `syncNow()`.
 */

import logger from '../../../../../utils/logger';

const log = logger.module('CacheHitHandler');

/**
 * Valide les paramètres d'entrée de handleCacheHit.
 * 
 * @param {Object} params - Paramètres à valider
 * @throws {Error} Si les paramètres sont invalides
 */
function validateCacheHitParams(params) {
  const { source, payload, context, setStatusWithDegrade, setLastSourceMeta, processSyncResponse, recordUIMetric, rangeInfo, syncOptions } = params;
  
  if (!source || typeof source !== 'string') {
    throw new Error('handleCacheHit: source doit être une string non vide');
  }
  
  if (!payload || typeof payload !== 'object') {
    throw new Error('handleCacheHit: payload doit être un objet');
  }
  
  if (!context || typeof context !== 'object') {
    throw new Error('handleCacheHit: context doit être un objet');
  }
  
  if (typeof setStatusWithDegrade !== 'function') {
    throw new Error('handleCacheHit: setStatusWithDegrade doit être une fonction');
  }
  
  if (typeof setLastSourceMeta !== 'function') {
    throw new Error('handleCacheHit: setLastSourceMeta doit être une fonction');
  }
  
  if (typeof processSyncResponse !== 'function') {
    throw new Error('handleCacheHit: processSyncResponse doit être une fonction');
  }
  
  if (typeof recordUIMetric !== 'function') {
    throw new Error('handleCacheHit: recordUIMetric doit être une fonction');
  }
  
  if (!rangeInfo || typeof rangeInfo !== 'object') {
    throw new Error('handleCacheHit: rangeInfo doit être un objet');
  }
  
  if (!syncOptions || typeof syncOptions !== 'object') {
    throw new Error('handleCacheHit: syncOptions doit être un objet');
  }
}

/**
 * Traite un cache hit en appliquant le traitement standard :
 * - Mise à jour du status UI
 * - Mise à jour des métadonnées de source
 * - Traitement de la réponse via processSyncResponse
 * - Enregistrement des métriques UI
 * 
 * @param {Object} params
 * @param {string} params.source - Source du cache ('existingData', 'memory', 'indexeddb', 'server')
 * @param {Object} params.payload - Données du cache
 * @param {Object} params.meta - Métadonnées du cache
 * @param {Object} params.context - Contexte de synchronisation
 * @param {Function} params.setStatusWithDegrade - Callback pour mettre à jour le status
 * @param {Function} params.setLastSourceMeta - Callback pour mettre à jour les métadonnées
 * @param {Function} params.processSyncResponse - Fonction de traitement de la réponse
 * @param {Function} params.recordUIMetric - Callback pour enregistrer les métriques
 * @param {Object} params.rangeInfo - Informations sur la plage de dates
 * @param {Object} params.syncOptions - Options de synchronisation
 * @param {boolean} params.degraded - Si true, mode dégradé activé
 * @returns {Promise<boolean>} True si le cache hit a été traité avec succès
 * @throws {Error} Si les paramètres sont invalides ou si une erreur survient
 */
export async function handleCacheHit({
  source,
  payload,
  meta = {},
  context,
  setStatusWithDegrade,
  setLastSourceMeta,
  processSyncResponse,
  recordUIMetric,
  rangeInfo,
  syncOptions,
  degraded = false
}) {
  try {
    // Valider les paramètres d'entrée
    validateCacheHitParams({
      source,
      payload,
      context,
      setStatusWithDegrade,
      setLastSourceMeta,
      processSyncResponse,
      recordUIMetric,
      rangeInfo,
      syncOptions
    });
  } catch (validationError) {
    log.error('[handleCacheHit] Erreur de validation:', validationError);
    throw validationError;
  }

  const { startDate, endDate, lastSyncTimestamp } = rangeInfo;
  const { forceMode, forceRefresh, includeToday, resolvedRange } = syncOptions;

  // Construire les métadonnées avec flags réseau
  const metaWithFlags = {
    ...(meta || {}),
    source,
    degraded,
    ...(context.buildNetworkMeta ? context.buildNetworkMeta() : {})
  };

  // Préparer les données selon la source
  let responseData = null;
  let statusMessage = '';
  let lastSync = null;
  let ttlMs = null;

  switch (source) {
    case 'existingData': {
      if (!payload?.mockResponse) {
        return false;
      }
      const existingDataResult = payload;
      responseData = existingDataResult.mockResponse;
      statusMessage = `Sync OK (données existantes, ${existingDataResult.ageSeconds ?? '?'}s)`;
      lastSync = existingDataResult.mockResponse?.lastSync;
      break;
    }

    case 'memory': {
      if (!payload?.data) {
        return false;
      }
      responseData = payload.data;
      statusMessage = 'Sync OK (cache mémoire)';
      lastSync = payload.data.lastSync;
      ttlMs = payload.remainingMs ?? null;
      break;
    }

    case 'indexeddb': {
      if (!payload?.data) {
        return false;
      }
      responseData = {
        ok: true,
        cached: true,
        lastSync: payload.lastSyncTimestamp || lastSyncTimestamp,
        data: payload.data
      };
      statusMessage = 'Sync OK (cache IndexedDB)';
      lastSync = responseData.lastSync;
      break;
    }

    case 'server': {
      if (!payload?.data) {
        return false;
      }
      responseData = payload.data;
      statusMessage = 'Sync OK (cache serveur)';
      lastSync = payload.data.lastSync;
      ttlMs = payload.ttl ?? null;
      break;
    }

    default:
      log.warn(`[handleCacheHit] Source inconnue: ${source}`);
      return false;
  }

  try {
    // Mettre à jour le status UI
    const statusExtra = {
      lastSync,
      source,
      ...(ttlMs !== null ? { ttlMs } : {})
    };
    setStatusWithDegrade(statusMessage, statusExtra);

    // Mettre à jour les métadonnées de source
    const sourceMeta = {
      ...metaWithFlags,
      ...(ttlMs !== null ? { ttlMs } : {})
    };
    setLastSourceMeta(sourceMeta);

    // Traiter la réponse
    await processSyncResponse(
      responseData,
      { startDate, endDate },
      context.dbReady,
      context.saveActivities,
      context.saveDailyMetrics,
      context.setGarminData,
      context.setLastSyncDate,
      context.loadAllData,
      context.importToEndurance
    );

    // Enregistrer les métriques UI
    recordUIMetric({
      lastSyncTimestamp: Date.now(),
      lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
    });

    return true;
  } catch (error) {
    log.error(`[handleCacheHit] Erreur lors du traitement du cache hit (source: ${source}):`, error);
    
    // Enregistrer l'erreur dans les métriques UI
    try {
      recordUIMetric({
        lastSyncTimestamp: Date.now(),
        lastSyncError: error.message,
        lastSyncOptions: { forceMode, forceRefresh, includeToday, resolvedRange }
      });
    } catch (metricError) {
      log.warn('[handleCacheHit] Erreur lors de l\'enregistrement des métriques:', metricError);
    }
    
    // Ré-émettre l'erreur pour que l'appelant puisse la gérer
    throw error;
  }
}

