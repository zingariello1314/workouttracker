/**
 * Système d'événements uniformisé pour la télémétrie Garmin.
 * 
 * Centralise la création et la dispatch d'événements pour garantir
 * une structure cohérente et faciliter le debugging.
 * 
 * @module telemetryEvents
 */

import logger from '../../../../utils/logger';
import { isBrowser, hasDispatchEvent, hasCustomEvent } from '../../../../utils/isBrowser';

const log = logger.module('telemetryEvents');

/**
 * Types d'événements supportés
 */
export const EVENT_TYPES = {
  UI_METRICS_UPDATE: 'garmin-ui-metrics-update',
  NETWORK_UPDATE: 'garmin-network-update',
  CACHE_UPDATE: 'garmin-cache-update',
  TELEMETRY_UPDATE: 'garmin-telemetry-update',
  SYNC_START: 'garmin-sync-start',
  SYNC_COMPLETE: 'garmin-sync-complete',
  SYNC_ERROR: 'garmin-sync-error',
  CACHE_HIT: 'garmin-cache-hit',
  CACHE_MISS: 'garmin-cache-miss'
};

/**
 * Structure standardisée d'un événement télémétrie
 * 
 * @typedef {Object} TelemetryEvent
 * @property {string} type - Type d'événement (EVENT_TYPES)
 * @property {Object} detail - Données de l'événement
 * @property {number} timestamp - Timestamp de création (ms)
 * @property {string} source - Source de l'événement (optionnel)
 */

/**
 * Crée un événement télémétrie standardisé
 * 
 * @param {string} type - Type d'événement (EVENT_TYPES)
 * @param {Object} detail - Données de l'événement
 * @param {Object} options - Options supplémentaires
 * @param {string} options.source - Source de l'événement
 * @returns {CustomEvent} Événement CustomEvent
 */
export const createTelemetryEvent = (type, detail = {}, options = {}) => {
  const { source } = options;
  
  const eventDetail = {
    ...detail,
    timestamp: Date.now(),
    ...(source ? { source } : {})
  };
  
  return new CustomEvent(type, {
    detail: eventDetail,
    bubbles: false,
    cancelable: false
  });
};

/**
 * Dispatch un événement télémétrie de manière sécurisée
 * 
 * @param {string} type - Type d'événement (EVENT_TYPES)
 * @param {Object} detail - Données de l'événement
 * @param {Object} options - Options supplémentaires
 * @returns {boolean} True si l'événement a été dispatché
 */
export const dispatchTelemetryEvent = (type, detail = {}, options = {}) => {
  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  if (!isBrowser() || !hasDispatchEvent()) {
    log.debug('[telemetryEvents] Window non disponible, événement ignoré', { type });
    return false;
  }
  
  if (!hasCustomEvent()) {
    log.warn('[telemetryEvents] CustomEvent non supporté, événement ignoré', { type });
    return false;
  }
  
  try {
    const event = createTelemetryEvent(type, detail, options);
    window.dispatchEvent(event);
    log.debug('[telemetryEvents] Événement dispatché', { type, hasDetail: !!detail });
    return true;
  } catch (error) {
    log.error('[telemetryEvents] Erreur lors du dispatch', { type, error });
    return false;
  }
};

/**
 * Helpers pour chaque type d'événement
 */
export const telemetryEvents = {
  /**
   * Dispatch un événement de mise à jour des métriques UI
   */
  uiMetricsUpdate: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.UI_METRICS_UPDATE, detail, options);
  },
  
  /**
   * Dispatch un événement de mise à jour réseau
   */
  networkUpdate: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.NETWORK_UPDATE, detail, options);
  },
  
  /**
   * Dispatch un événement de mise à jour du cache
   */
  cacheUpdate: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.CACHE_UPDATE, detail, options);
  },
  
  /**
   * Dispatch un événement de mise à jour télémétrie
   */
  telemetryUpdate: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.TELEMETRY_UPDATE, detail, options);
  },
  
  /**
   * Dispatch un événement de début de synchronisation
   */
  syncStart: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.SYNC_START, detail, options);
  },
  
  /**
   * Dispatch un événement de fin de synchronisation
   */
  syncComplete: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.SYNC_COMPLETE, detail, options);
  },
  
  /**
   * Dispatch un événement d'erreur de synchronisation
   */
  syncError: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.SYNC_ERROR, detail, options);
  },
  
  /**
   * Dispatch un événement de cache hit
   */
  cacheHit: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.CACHE_HIT, detail, options);
  },
  
  /**
   * Dispatch un événement de cache miss
   */
  cacheMiss: (detail, options) => {
    return dispatchTelemetryEvent(EVENT_TYPES.CACHE_MISS, detail, options);
  }
};

export default telemetryEvents;


