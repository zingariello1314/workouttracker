/**
 * ✅ PHASE 4.1 : Service de Timeouts Adaptatifs
 * 
 * Calcule des timeouts intelligents basés sur :
 * - Taille de l'analyse (nombre muscles, complexité)
 * - Nombre de photos
 * - Performance navigateur
 * - Type d'opération
 * 
 * Référence: ANALYSE_PROFONDE_ONGLET_PHOTOS.md - Phase 4.1
 */

import logger from '../../../utils/logger';

const log = logger.module('AdaptiveTimeouts');

/**
 * Configuration des timeouts de base
 */
const BASE_TIMEOUTS = {
  // Navigation après analyse
  NAVIGATION_AFTER_ANALYSIS: {
    min: 500,      // Minimum 500ms
    base: 1000,    // Base 1s
    perMuscle: 50, // +50ms par muscle analysé
    max: 3000      // Maximum 3s
  },
  
  // Reset flag justCaptured
  RESET_JUST_CAPTURED: {
    min: 3000,     // Minimum 3s
    base: 5000,    // Base 5s
    perPhoto: 100, // +100ms par photo dans la collection
    max: 10000     // Maximum 10s
  },
  
  // Feedback utilisateur
  USER_FEEDBACK: {
    min: 2000,     // Minimum 2s
    base: 3000,    // Base 3s
    perAction: 500, // +500ms par action complexe
    max: 8000      // Maximum 8s
  },
  
  // Retry après erreur
  RETRY_AFTER_ERROR: {
    min: 1000,     // Minimum 1s
    base: 2000,    // Base 2s
    perRetry: 1000, // +1s par tentative
    max: 10000     // Maximum 10s
  }
};

/**
 * ✅ Détecte performance navigateur (FPS, mémoire, etc.)
 */
let performanceMetrics = {
  fps: 60,           // FPS moyen (défaut optimiste)
  memoryUsage: 0,    // Mémoire utilisée (MB)
  lastUpdate: Date.now()
};

/**
 * Met à jour les métriques de performance
 */
const updatePerformanceMetrics = () => {
  try {
    // Détecter FPS approximatif (si possible)
    if (window.performance && window.performance.now) {
      const now = window.performance.now();
      const timeSinceLastUpdate = now - (performanceMetrics.lastUpdate || now);
      
      if (timeSinceLastUpdate > 0) {
        // Estimation FPS basée sur timing (approximatif)
        const estimatedFps = Math.min(60, Math.max(30, 1000 / timeSinceLastUpdate));
        performanceMetrics.fps = estimatedFps;
      }
      
      performanceMetrics.lastUpdate = now;
    }

    // Détecter mémoire (si disponible)
    if (performance.memory) {
      performanceMetrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
  } catch (error) {
    // Ignorer erreurs de détection performance
    log.debug('Impossible de détecter métriques performance', error);
  }
};

/**
 * ✅ Calcule facteur de performance (0.5 = lent, 1.0 = normal, 1.5 = rapide)
 */
const getPerformanceFactor = () => {
  updatePerformanceMetrics();
  
  let factor = 1.0;
  
  // Ajuster selon FPS
  if (performanceMetrics.fps < 30) {
    factor *= 1.5; // Navigateur lent → timeouts plus longs
  } else if (performanceMetrics.fps > 55) {
    factor *= 0.8; // Navigateur rapide → timeouts plus courts
  }
  
  // Ajuster selon mémoire
  if (performanceMetrics.memoryUsage > 500) {
    factor *= 1.3; // Beaucoup de mémoire utilisée → timeouts plus longs
  }
  
  return Math.max(0.5, Math.min(2.0, factor)); // Limiter entre 0.5 et 2.0
};

/**
 * ✅ Calcule timeout adaptatif pour navigation après analyse
 * @param {Object} options - Options de calcul
 * @param {number} options.musclesAnalyzed - Nombre de muscles analysés
 * @param {number} options.photosCount - Nombre total de photos
 * @param {boolean} options.complexAnalysis - Si analyse complexe (multi-angles, etc.)
 * @returns {number} Timeout en millisecondes
 */
export const calculateNavigationTimeout = (options = {}) => {
  const { musclesAnalyzed = 0, photosCount = 0, complexAnalysis = false } = options;
  const config = BASE_TIMEOUTS.NAVIGATION_AFTER_ANALYSIS;
  
  // Calcul base
  let timeout = config.base;
  
  // Ajuster selon nombre de muscles
  timeout += musclesAnalyzed * config.perMuscle;
  
  // Ajuster selon complexité
  if (complexAnalysis) {
    timeout += 500; // +500ms pour analyses complexes
  }
  
  // Ajuster selon performance navigateur
  const perfFactor = getPerformanceFactor();
  timeout = Math.round(timeout * perfFactor);
  
  // Limiter entre min et max
  timeout = Math.max(config.min, Math.min(config.max, timeout));
  
  log.debug(`Timeout navigation calculé: ${timeout}ms`, {
    musclesAnalyzed,
    photosCount,
    complexAnalysis,
    perfFactor: perfFactor.toFixed(2)
  });
  
  return timeout;
};

/**
 * ✅ Calcule timeout adaptatif pour reset flag justCaptured
 * @param {Object} options - Options de calcul
 * @param {number} options.photosCount - Nombre total de photos
 * @param {boolean} options.hasAnalysis - Si photo a une analyse
 * @returns {number} Timeout en millisecondes
 */
export const calculateResetJustCapturedTimeout = (options = {}) => {
  const { photosCount = 0, hasAnalysis = false } = options;
  const config = BASE_TIMEOUTS.RESET_JUST_CAPTURED;
  
  // Calcul base
  let timeout = config.base;
  
  // Ajuster selon nombre de photos (plus de photos = plus de temps pour voir)
  timeout += Math.min(photosCount * config.perPhoto, 3000); // Max +3s
  
  // Ajuster selon présence analyse (plus de temps si analyse présente)
  if (hasAnalysis) {
    timeout += 2000; // +2s si analyse présente
  }
  
  // Ajuster selon performance navigateur
  const perfFactor = getPerformanceFactor();
  timeout = Math.round(timeout * perfFactor);
  
  // Limiter entre min et max
  timeout = Math.max(config.min, Math.min(config.max, timeout));
  
  log.debug(`Timeout reset justCaptured calculé: ${timeout}ms`, {
    photosCount,
    hasAnalysis,
    perfFactor: perfFactor.toFixed(2)
  });
  
  return timeout;
};

/**
 * ✅ Calcule timeout adaptatif pour feedback utilisateur
 * @param {Object} options - Options de calcul
 * @param {number} options.actionComplexity - Complexité action (1-5)
 * @param {number} options.photosCount - Nombre de photos affectées
 * @returns {number} Timeout en millisecondes
 */
export const calculateUserFeedbackTimeout = (options = {}) => {
  const { actionComplexity = 1, photosCount = 0 } = options;
  const config = BASE_TIMEOUTS.USER_FEEDBACK;
  
  // Calcul base
  let timeout = config.base;
  
  // Ajuster selon complexité
  timeout += (actionComplexity - 1) * config.perAction;
  
  // Ajuster selon nombre de photos
  if (photosCount > 1) {
    timeout += Math.min(photosCount * 200, 2000); // Max +2s
  }
  
  // Ajuster selon performance navigateur
  const perfFactor = getPerformanceFactor();
  timeout = Math.round(timeout * perfFactor);
  
  // Limiter entre min et max
  timeout = Math.max(config.min, Math.min(config.max, timeout));
  
  log.debug(`Timeout feedback utilisateur calculé: ${timeout}ms`, {
    actionComplexity,
    photosCount,
    perfFactor: perfFactor.toFixed(2)
  });
  
  return timeout;
};

/**
 * ✅ Calcule timeout adaptatif pour retry après erreur
 * @param {Object} options - Options de calcul
 * @param {number} options.retryCount - Nombre de tentatives
 * @param {string} options.errorType - Type d'erreur
 * @returns {number} Timeout en millisecondes
 */
export const calculateRetryTimeout = (options = {}) => {
  const { retryCount = 0, errorType = 'unknown' } = options;
  const config = BASE_TIMEOUTS.RETRY_AFTER_ERROR;
  
  // Calcul base
  let timeout = config.base;
  
  // Ajuster selon nombre de tentatives (backoff exponentiel)
  timeout += retryCount * config.perRetry;
  
  // Ajuster selon type d'erreur
  if (errorType === 'network' || errorType === 'timeout') {
    timeout += 1000; // +1s pour erreurs réseau
  }
  
  // Ajuster selon performance navigateur
  const perfFactor = getPerformanceFactor();
  timeout = Math.round(timeout * perfFactor);
  
  // Limiter entre min et max
  timeout = Math.max(config.min, Math.min(config.max, timeout));
  
  log.debug(`Timeout retry calculé: ${timeout}ms`, {
    retryCount,
    errorType,
    perfFactor: perfFactor.toFixed(2)
  });
  
  return timeout;
};

/**
 * ✅ Wrapper pour setTimeout avec timeout adaptatif
 * @param {Function} callback - Fonction à exécuter
 * @param {string} timeoutType - Type de timeout ('navigation', 'reset', 'feedback', 'retry')
 * @param {Object} options - Options pour calcul timeout
 * @returns {number} ID du timeout (pour clearTimeout)
 */
export const adaptiveSetTimeout = (callback, timeoutType, options = {}) => {
  let timeout;
  
  switch (timeoutType) {
    case 'navigation':
      timeout = calculateNavigationTimeout(options);
      break;
    case 'reset':
      timeout = calculateResetJustCapturedTimeout(options);
      break;
    case 'feedback':
      timeout = calculateUserFeedbackTimeout(options);
      break;
    case 'retry':
      timeout = calculateRetryTimeout(options);
      break;
    default:
      log.warn(`Type de timeout inconnu: ${timeoutType}, utilisation timeout par défaut 1000ms`);
      timeout = 1000;
  }
  
  return setTimeout(callback, timeout);
};

/**
 * ✅ Obtient métriques de performance actuelles
 * @returns {Object} Métriques de performance
 */
export const getPerformanceMetrics = () => {
  updatePerformanceMetrics();
  return { ...performanceMetrics };
};

