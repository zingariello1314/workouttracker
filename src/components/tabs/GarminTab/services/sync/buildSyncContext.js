/**
 * Helper pour construire le contexte complet du pipeline de synchronisation
 * 
 * Centralise la construction du contexte avec toutes les dépendances nécessaires.
 */

import { CACHE_SCHEMA_VERSION, FORCE_SYNC_DEGRADE_THRESHOLD_MS } from '../../constants';
import { tryFetch } from '../../hooks/garminSyncFetch';
import { processSyncResponse } from '../../hooks/garminSyncProcessor';

/**
 * Construit le contexte complet pour le pipeline de synchronisation
 * 
 * @param {Object} params
 * @param {Object} params.state - État du hook (loading, baseUrl, frontendCache, etc.)
 * @param {Object} params.data - Données et fonctions de données (dbReady, saveActivities, etc.)
 * @param {Object} params.services - Services (rangeService, cacheService, orchestrator, etc.)
 * @param {Object} params.callbacks - Callbacks (setStatus, setLoading, etc.)
 * @param {Object} params.options - Options (onForcedRangeRecorded, etc.)
 * @param {string} params.todayStr - Date du jour (YYYY-MM-DD)
 * @param {Function} params.buildNetworkMeta - Fonction pour construire les métadonnées réseau
 * @param {Function} params.recordUIMetric - Fonction pour enregistrer les métriques UI
 * @param {Object} params.degradedModePolicy - Instance de DegradedModePolicy
 * @param {Object} params.memoryCacheAdapter - Instance de MemoryCacheAdapter
 * @param {Object} params.historyRecorder - Instance de SyncHistoryRecorder
 * @returns {Object} Contexte complet pour le pipeline
 */
export function buildSyncContext({
  state,
  data,
  services,
  callbacks,
  options = {},
  todayStr,
  buildNetworkMeta,
  recordUIMetric,
  degradedModePolicy,
  memoryCacheAdapter,
  historyRecorder
}) {
  const {
    baseUrl,
    setBaseUrl,
    frontendCache,
    clearFrontendCache,
    setLastSourceMeta
  } = state;

  const {
    dbReady,
    saveActivities,
    saveDailyMetrics,
    loadAllData,
    loadDataByRange,
    getLastSyncDate,
    setLastSyncDate,
    getSyncStartDate,
    getLastSyncTimestampForDate,
    loadDataForTab,
    setGarminData,
    importToEndurance,
    isDataEmptyForDate
  } = data;

  const {
    rangeService,
    cacheService,
    orchestrator
  } = services;

  const {
    setStatus,
    setLoading
  } = callbacks;

  // Construire les fonctions nécessaires pour le contexte

  // Fetcher avec gestion de baseUrl
  const fetcher = (path, fetchOptions) => {
    return tryFetch(path, fetchOptions, undefined, setBaseUrl);
  };

  // Handler pour les réponses serveur (mise en cache)
  // Note: forceMode et includeToday seront fournis par le state du pipeline
  const serverResponseHandler = async (range, payload, state = {}) => {
    if (!payload?.cached) {
      return;
    }
    // Utiliser l'adapter mémoïsé
    // Les valeurs forceMode et includeToday seront passées via le state
    memoryCacheAdapter.set(range, payload.data, {
      forceMode: state.forceMode || null,
      includeToday: state.includeToday || null
    });
  };

  // Processeur de réponse pour retry
  const processResponseForRetry = async (data, syncRange) => {
    await processSyncResponse(
      data,
      syncRange,
      dbReady,
      saveActivities,
      saveDailyMetrics,
      setGarminData,
      setLastSyncDate,
      loadAllData,
      importToEndurance
    );
  };

  // Handler pour le mode dégradé forcé
  const handleForcedDegrade = (meta = {}) => {
    const triggeredAt = meta.triggeredAt || new Date().toISOString();
    const lastSyncFromCache = frontendCache?.data?.lastSync || null;

    // Générer un ID de session unique pour cette dégradation
    const sessionId = `degraded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Enregistrer la session dans DegradedModePolicy
    degradedModePolicy.recordDegradedSession({
      sessionId,
      metadata: {
        triggeredAt,
        thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
        startDate: meta.startDate ?? null,
        endDate: meta.endDate ?? null,
        reason: 'duration_threshold_exceeded'
      }
    });

    const degradedMessage = 'Mode dégradé – données locales conservées (forçage prolongé)';
    setStatus({
      lastSync: lastSyncFromCache,
      ok: true,
      message: degradedMessage,
      source: 'degraded'
    });

    if (frontendCache) {
      frontendCache.degradedMeta = {
        triggeredAt,
        thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
        startDate: meta.startDate ?? null,
        endDate: meta.endDate ?? null,
        sessionId
      };
    }

    // Obtenir le snapshot complet avec toutes les métriques
    const degradedSnapshot = degradedModePolicy.getSnapshot({
      sessionId,
      currentDurationMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
      forceRefresh: true
    });

    setLastSourceMeta({
      source: 'degraded',
      degraded: true,
      timestamp: triggeredAt,
      startDate: meta.startDate ?? null,
      endDate: meta.endDate ?? null,
      thresholdMs: meta.thresholdMs ?? FORCE_SYNC_DEGRADE_THRESHOLD_MS,
      sessionId,
      currentCooldown: degradedSnapshot.currentCooldown,
      nextRetry: degradedSnapshot.nextRetry,
      nextRetryTimestamp: degradedSnapshot.nextRetryTimestamp,
      degradedReason: degradedSnapshot.degradedReason,
      ...buildNetworkMeta()
    });
  };

  // Construire le contexte complet
  const context = {
    // Services
    rangeService,
    cacheService,
    orchestrator,
    historyRecorder,

    // État et données
    dbReady,
    todayStr,
    baseUrl,
    frontendCache,
    clearFrontendCache,
    setLastSourceMeta,

    // Fonctions de données
    saveActivities,
    saveDailyMetrics,
    loadAllData,
    loadDataByRange,
    getSyncStartDate,
    getLastSyncTimestampForDate,
    isDataEmptyForDate,
    setGarminData,
    setLastSyncDate,
    importToEndurance,

    // Callbacks
    setStatus,
    setLoading,
    recordUIMetric,
    buildNetworkMeta,

    // Fonctions construites
    fetcher,
    processResponse: processResponseForRetry,
    serverResponseHandler,
    onForcedDegrade: handleForcedDegrade,

    // Constantes
    cacheSchemaVersion: CACHE_SCHEMA_VERSION,
    forceDegradeThresholdMs: FORCE_SYNC_DEGRADE_THRESHOLD_MS,

    // Adapters et services additionnels
    memoryCacheAdapter
  };

  return context;
}

