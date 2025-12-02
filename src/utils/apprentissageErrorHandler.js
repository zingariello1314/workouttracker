/**
 * Système de gestion d'erreurs centralisé pour le module Apprentissage
 * Gère les erreurs de manière cohérente avec logging, notifications et fallbacks
 */

/**
 * Types d'erreurs
 */
export const ERROR_TYPES = {
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  CALCULATION: 'CALCULATION',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Niveaux de sévérité
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW', // Erreur mineure, peut être ignorée
  MEDIUM: 'MEDIUM', // Erreur notable, nécessite attention
  HIGH: 'HIGH', // Erreur critique, peut affecter les fonctionnalités
  CRITICAL: 'CRITICAL', // Erreur bloquante
};

/**
 * Gestionnaire d'erreurs centralisé
 */
class ApprentissageErrorHandler {
  constructor() {
    this.errorCallbacks = [];
    this.logErrors = true;
  }

  /**
   * Enregistrer un callback pour les erreurs
   */
  onError(callback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Désenregistrer un callback
   */
  offError(callback) {
    this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Activer/désactiver le logging
   */
  setLogging(enabled) {
    this.logErrors = enabled;
  }

  /**
   * Gérer une erreur
   */
  handle(error, context = {}, options = {}) {
    const {
      type = ERROR_TYPES.UNKNOWN,
      severity = ERROR_SEVERITY.MEDIUM,
      silent = false,
      fallback = null,
      userMessage = null,
    } = options;

    const errorInfo = {
      error,
      type,
      severity,
      context,
      timestamp: Date.now(),
      message: error?.message || 'Erreur inconnue',
      stack: error?.stack,
      userMessage: userMessage || this.getDefaultUserMessage(type, severity),
    };

    // Logging
    if (this.logErrors) {
      const logLevel = this.getLogLevel(severity);
      console[logLevel](`[ApprentissageError] ${type} - ${errorInfo.message}`, {
        context,
        error,
      });
    }

    // Notifier les callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(errorInfo);
      } catch (callbackError) {
        console.error('[ApprentissageError] Erreur dans callback:', callbackError);
      }
    });

    // Exécuter fallback si fourni
    if (fallback && typeof fallback === 'function') {
      try {
        fallback(errorInfo);
      } catch (fallbackError) {
        console.error('[ApprentissageError] Erreur dans fallback:', fallbackError);
      }
    }

    return errorInfo;
  }

  /**
   * Obtenir le niveau de log approprié
   */
  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'warn';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Obtenir un message utilisateur par défaut
   */
  getDefaultUserMessage(type, severity) {
    if (severity === ERROR_SEVERITY.CRITICAL) {
      return 'Une erreur critique est survenue. Veuillez recharger la page.';
    }

    switch (type) {
      case ERROR_TYPES.STORAGE:
        return 'Erreur de sauvegarde. Les données sont sauvegardées localement.';
      case ERROR_TYPES.VALIDATION:
        return 'Données invalides. Veuillez vérifier vos saisies.';
      case ERROR_TYPES.CALCULATION:
        return 'Erreur de calcul. Les résultats peuvent être incorrects.';
      case ERROR_TYPES.NETWORK:
        return 'Erreur réseau. Vérifiez votre connexion.';
      default:
        return 'Une erreur est survenue.';
    }
  }

  /**
   * Wrapper pour exécuter une fonction avec gestion d'erreur
   */
  async execute(fn, context = {}, options = {}) {
    try {
      return await fn();
    } catch (error) {
      return this.handle(error, context, options);
    }
  }

  /**
   * Wrapper synchrone
   */
  executeSync(fn, context = {}, options = {}) {
    try {
      return fn();
    } catch (error) {
      return this.handle(error, context, options);
    }
  }
}

// Instance singleton
export const apprentissageErrorHandler = new ApprentissageErrorHandler();

/**
 * Helpers pour types d'erreurs courants
 */
export const handleStorageError = (error, context = {}) => {
  return apprentissageErrorHandler.handle(error, context, {
    type: ERROR_TYPES.STORAGE,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'Erreur de sauvegarde. Les données sont sauvegardées localement.',
  });
};

export const handleValidationError = (error, context = {}) => {
  return apprentissageErrorHandler.handle(error, context, {
    type: ERROR_TYPES.VALIDATION,
    severity: ERROR_SEVERITY.LOW,
    userMessage: 'Données invalides. Veuillez vérifier vos saisies.',
  });
};

export const handleCalculationError = (error, context = {}) => {
  return apprentissageErrorHandler.handle(error, context, {
    type: ERROR_TYPES.CALCULATION,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'Erreur de calcul. Les résultats peuvent être incorrects.',
  });
};

export default apprentissageErrorHandler;

