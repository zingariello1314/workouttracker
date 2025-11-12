/**
 * Configuration centralisée pour la télémétrie Garmin.
 * 
 * Permet de paramétrer dynamiquement les limites d'historique
 * avec support d'un mode "critical" pour diagnostics approfondis.
 * 
 * @module telemetryConfig
 */

import { TELEMETRY_DEFAULTS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('telemetryConfig');

/**
 * État de la configuration
 */
let config = {
  historyMaxEntries: TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.DEFAULT,
  critical: false,
  customLimit: null
};

/**
 * Obtient la limite d'historique actuelle selon le mode (normal/critical)
 * 
 * @param {boolean} forceCritical - Forcer le mode critical (ignorer config)
 * @returns {number} Limite d'historique
 */
export const getHistoryMaxEntries = (forceCritical = false) => {
  if (forceCritical || config.critical) {
    return TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.CRITICAL;
  }
  
  if (config.customLimit !== null) {
    const clamped = Math.max(
      TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.MIN,
      Math.min(
        TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.MAX,
        config.customLimit
      )
    );
    return clamped;
  }
  
  return config.historyMaxEntries;
};

/**
 * Configure la limite d'historique
 * 
 * @param {Object} options - Options de configuration
 * @param {number} options.maxEntries - Nombre maximum d'entrées (optionnel)
 * @param {boolean} options.critical - Activer le mode critical (optionnel)
 * @returns {void}
 */
export const configureHistoryLimit = ({ maxEntries, critical = false } = {}) => {
  if (maxEntries !== undefined) {
    const clamped = Math.max(
      TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.MIN,
      Math.min(
        TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.MAX,
        maxEntries
      )
    );
    
    if (clamped !== maxEntries) {
      log.warn('[telemetryConfig] Limite d\'historique ajustée', {
        requested: maxEntries,
        clamped
      });
    }
    
    config.historyMaxEntries = clamped;
    config.customLimit = clamped;
  }
  
  if (critical !== undefined) {
    config.critical = Boolean(critical);
    log.debug('[telemetryConfig] Mode critical', { enabled: config.critical });
  }
};

/**
 * Réinitialise la configuration aux valeurs par défaut
 * 
 * @returns {void}
 */
export const resetConfig = () => {
  config = {
    historyMaxEntries: TELEMETRY_DEFAULTS.HISTORY_MAX_ENTRIES.DEFAULT,
    critical: false,
    customLimit: null
  };
  log.debug('[telemetryConfig] Configuration réinitialisée');
};

/**
 * Obtient la configuration actuelle (lecture seule)
 * 
 * @returns {Object} Configuration actuelle
 */
export const getConfig = () => {
  return {
    historyMaxEntries: config.historyMaxEntries,
    critical: config.critical,
    customLimit: config.customLimit,
    effectiveLimit: getHistoryMaxEntries()
  };
};

export default {
  getHistoryMaxEntries,
  configureHistoryLimit,
  resetConfig,
  getConfig
};


