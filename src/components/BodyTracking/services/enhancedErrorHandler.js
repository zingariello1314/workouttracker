/**
 * ✅ PHASE 4.3 : Service de Gestion d'Erreurs Enrichie
 * 
 * Système avancé de gestion d'erreurs avec :
 * - Retry automatique avec backoff exponentiel
 * - Tracking d'erreurs avec contexte enrichi
 * - Récupération automatique
 * - Classification intelligente des erreurs
 * - Notifications d'erreurs critiques
 * 
 * Référence: ANALYSE_PROFONDE_ONGLET_PHOTOS.md - Phase 4.3
 */

import logger from '../../../utils/logger';
import { getErrorFeedbackService, ERROR_TYPES } from './errorFeedbackService';

const log = logger.module('EnhancedErrorHandler');

/**
 * Types d'erreurs récupérables (avec retry)
 */
const RECOVERABLE_ERRORS = {
  [ERROR_TYPES.NETWORK]: ['TIMEOUT', 'OFFLINE'],
  [ERROR_TYPES.UPLOAD]: ['UPLOAD_FAILED'],
  [ERROR_TYPES.SAVE]: ['SAVE_FAILED', 'INDEXEDDB_ERROR'],
  [ERROR_TYPES.ANALYSIS]: ['TIMEOUT'],
  [ERROR_TYPES.WEBCAM]: ['ALREADY_IN_USE']
};

/**
 * Types d'erreurs critiques (notification immédiate)
 */
const CRITICAL_ERRORS = {
  [ERROR_TYPES.SAVE]: ['INDEXEDDB_ERROR'],
  [ERROR_TYPES.NETWORK]: ['OFFLINE'],
  [ERROR_TYPES.WEBCAM]: ['NOT_AVAILABLE', 'PERMISSION_DENIED']
};

/**
 * Configuration retry par type d'erreur
 */
const RETRY_CONFIG = {
  [ERROR_TYPES.NETWORK]: {
    maxRetries: 3,
    initialDelay: 1000, // 1s
    maxDelay: 10000, // 10s
    backoffMultiplier: 2
  },
  [ERROR_TYPES.UPLOAD]: {
    maxRetries: 2,
    initialDelay: 2000, // 2s
    maxDelay: 8000, // 8s
    backoffMultiplier: 2
  },
  [ERROR_TYPES.SAVE]: {
    maxRetries: 3,
    initialDelay: 500, // 0.5s
    maxDelay: 5000, // 5s
    backoffMultiplier: 1.5
  },
  [ERROR_TYPES.ANALYSIS]: {
    maxRetries: 1,
    initialDelay: 3000, // 3s
    maxDelay: 5000, // 5s
    backoffMultiplier: 1.5
  },
  default: {
    maxRetries: 2,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
};

/**
 * Service de gestion d'erreurs enrichie
 */
class EnhancedErrorHandler {
  constructor() {
    this.errorHistory = []; // Historique des erreurs (max 50)
    this.errorCounts = new Map(); // Compteur par type d'erreur
    this.recoveryStrategies = new Map(); // Stratégies de récupération
    this.errorFeedbackService = getErrorFeedbackService();
    
    // Initialiser stratégies de récupération
    this.initializeRecoveryStrategies();
  }

  /**
   * ✅ Initialise les stratégies de récupération
   */
  initializeRecoveryStrategies() {
    // Stratégie pour erreurs IndexedDB
    this.recoveryStrategies.set('INDEXEDDB_ERROR', async (context) => {
      try {
        // Vérifier si IndexedDB est disponible
        if (!window.indexedDB) {
          throw new Error('IndexedDB non disponible');
        }
        
        // Essayer de rouvrir la base de données
        return new Promise((resolve, reject) => {
          const request = indexedDB.open('WorkoutTrackerDB', 1);
          request.onsuccess = () => {
            log.info('IndexedDB rouverte avec succès');
            resolve(true);
          };
          request.onerror = () => {
            log.error('Impossible de rouvrir IndexedDB');
            reject(new Error('IndexedDB inaccessible'));
          };
        });
      } catch (error) {
        log.error('Stratégie récupération IndexedDB échouée', error);
        return false;
      }
    });

    // Stratégie pour erreurs réseau
    this.recoveryStrategies.set('NETWORK_OFFLINE', async (context) => {
      return navigator.onLine;
    });

    // Stratégie pour erreurs webcam
    this.recoveryStrategies.set('WEBCAM_UNAVAILABLE', async (context) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * ✅ Gère une erreur avec retry automatique et récupération
   * 
   * @param {Error|string|Object} error - L'erreur à gérer
   * @param {string} errorType - Type d'erreur (ERROR_TYPES)
   * @param {string} errorCode - Code d'erreur spécifique
   * @param {Object} context - Contexte supplémentaire
   * @param {Function} retryFn - Fonction à réessayer (optionnel)
   * @returns {Promise<Object>} Résultat avec feedback et succès
   */
  async handleError(error, errorType = ERROR_TYPES.UNKNOWN, errorCode = null, context = {}, retryFn = null) {
    try {
      // Normaliser l'erreur
      const normalizedError = this.normalizeError(error);
      
      // Détecter code d'erreur si non fourni
      if (!errorCode) {
        errorCode = this.errorFeedbackService.detectErrorCode(normalizedError, errorType, context);
      }

      // Obtenir feedback utilisateur
      const feedback = this.errorFeedbackService.analyzeError(normalizedError, errorType, errorCode, context);
      
      // Enregistrer l'erreur dans l'historique
      this.recordError({
        error: normalizedError,
        errorType,
        errorCode,
        context,
        timestamp: Date.now(),
        feedback
      });

      // Vérifier si erreur critique
      const isCritical = this.isCriticalError(errorType, errorCode);
      if (isCritical) {
        log.error('Erreur critique détectée', {
          errorType,
          errorCode,
          context,
          feedback: feedback.title
        });
      }

      // Vérifier si erreur récupérable avec retry
      const isRecoverable = this.isRecoverableError(errorType, errorCode);
      if (isRecoverable && retryFn) {
        const retryResult = await this.attemptRetry(retryFn, errorType, errorCode, context);
        if (retryResult.success) {
          log.info('Erreur récupérée avec succès après retry', {
            errorType,
            errorCode,
            retries: retryResult.retries
          });
          return {
            success: true,
            feedback: {
              ...feedback,
              recovered: true,
              retries: retryResult.retries
            },
            result: retryResult.result
          };
        }
      }

      // Essayer récupération automatique
      const recoveryResult = await this.attemptRecovery(errorType, errorCode, context);
      if (recoveryResult.success) {
        log.info('Erreur récupérée automatiquement', {
          errorType,
          errorCode,
          strategy: recoveryResult.strategy
        });
        return {
          success: true,
          feedback: {
            ...feedback,
            recovered: true,
            recoveryStrategy: recoveryResult.strategy
          }
        };
      }

      // Retourner feedback d'erreur
      return {
        success: false,
        feedback,
        isCritical,
        isRecoverable
      };

    } catch (handlerError) {
      log.error('Erreur dans handleError', handlerError);
      return {
        success: false,
        feedback: this.errorFeedbackService.analyzeError(handlerError, ERROR_TYPES.UNKNOWN, 'GENERIC', context)
      };
    }
  }

  /**
   * ✅ Tente un retry avec backoff exponentiel
   */
  async attemptRetry(retryFn, errorType, errorCode, context) {
    const config = RETRY_CONFIG[errorType] || RETRY_CONFIG.default;
    let delay = config.initialDelay;
    let lastError = null;

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        log.debug(`Tentative retry ${attempt + 1}/${config.maxRetries}`, {
          errorType,
          errorCode,
          delay: `${delay}ms`
        });

        // Attendre avant retry (sauf première tentative)
        if (attempt > 0) {
          await this.sleep(delay);
        }

        const result = await retryFn();
        
        return {
          success: true,
          result,
          retries: attempt + 1
        };
      } catch (error) {
        lastError = error;
        log.warn(`Retry ${attempt + 1} échoué`, {
          errorType,
          errorCode,
          error: error.message
        });

        // Calculer délai suivant (backoff exponentiel)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }

    return {
      success: false,
      error: lastError,
      retries: config.maxRetries
    };
  }

  /**
   * ✅ Tente une récupération automatique
   */
  async attemptRecovery(errorType, errorCode, context) {
    const strategyKey = `${errorType}_${errorCode}`;
    const strategy = this.recoveryStrategies.get(strategyKey) || 
                    this.recoveryStrategies.get(errorCode);

    if (!strategy) {
      return { success: false };
    }

    try {
      const result = await strategy(context);
      return {
        success: result === true,
        strategy: strategyKey,
        result
      };
    } catch (error) {
      log.error('Stratégie récupération échouée', {
        strategy: strategyKey,
        error: error.message
      });
      return { success: false, error };
    }
  }

  /**
   * ✅ Vérifie si erreur est récupérable
   */
  isRecoverableError(errorType, errorCode) {
    const recoverableCodes = RECOVERABLE_ERRORS[errorType];
    return recoverableCodes && recoverableCodes.includes(errorCode);
  }

  /**
   * ✅ Vérifie si erreur est critique
   */
  isCriticalError(errorType, errorCode) {
    const criticalCodes = CRITICAL_ERRORS[errorType];
    return criticalCodes && criticalCodes.includes(errorCode);
  }

  /**
   * ✅ Enregistre une erreur dans l'historique
   */
  recordError(errorData) {
    // Ajouter à l'historique
    this.errorHistory.push(errorData);
    
    // Limiter à 50 erreurs
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    // Incrémenter compteur
    const key = `${errorData.errorType}_${errorData.errorCode}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Logger en développement
    if (process.env.NODE_ENV === 'development') {
      log.debug('Erreur enregistrée', {
        errorType: errorData.errorType,
        errorCode: errorData.errorCode,
        count: this.errorCounts.get(key),
        totalErrors: this.errorHistory.length
      });
    }
  }

  /**
   * ✅ Normalise une erreur
   */
  normalizeError(error) {
    if (typeof error === 'string') {
      return { message: error };
    }
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    if (typeof error === 'object' && error !== null) {
      return {
        message: error.message || error.error || JSON.stringify(error),
        ...error
      };
    }
    return { message: 'Erreur inconnue' };
  }

  /**
   * ✅ Obtient statistiques d'erreurs
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errorHistory.slice(-10),
      criticalErrors: this.errorHistory.filter(e => 
        this.isCriticalError(e.errorType, e.errorCode)
      ).length
    };

    return stats;
  }

  /**
   * ✅ Réinitialise l'historique d'erreurs
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
    log.info('Historique d\'erreurs réinitialisé');
  }

  /**
   * ✅ Utilitaire : sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton
let instance = null;

/**
 * Obtenir l'instance singleton du service
 */
export const getEnhancedErrorHandler = () => {
  if (!instance) {
    instance = new EnhancedErrorHandler();
  }
  return instance;
};

/**
 * ✅ Wrapper pour fonction avec retry automatique
 * 
 * @param {Function} fn - Fonction à exécuter avec retry
 * @param {string} errorType - Type d'erreur attendu
 * @param {Object} options - Options (maxRetries, delay, etc.)
 * @returns {Promise} Résultat de la fonction
 */
export const withRetry = async (fn, errorType = ERROR_TYPES.UNKNOWN, options = {}) => {
  const handler = getEnhancedErrorHandler();
  const config = { ...RETRY_CONFIG[errorType] || RETRY_CONFIG.default, ...options };
  
  let delay = config.initialDelay;
  let lastError = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await handler.sleep(delay);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
};

