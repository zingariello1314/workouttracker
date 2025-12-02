/**
 * Système de retry avec exponential backoff pour IndexedDB
 * Gère les erreurs temporaires de manière intelligente
 */

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffMultiplier: 2,
};

/**
 * Retry avec exponential backoff
 * @param {Function} fn - Fonction async à exécuter
 * @param {Object} config - Configuration du retry
 * @returns {Promise} Résultat de la fonction ou dernière erreur
 */
export const retryWithBackoff = async (fn, config = {}) => {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    initialDelay = DEFAULT_CONFIG.initialDelay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    backoffMultiplier = DEFAULT_CONFIG.backoffMultiplier,
  } = config;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry sur certaines erreurs (ex: validation)
      if (error.name === 'ValidationError' || error.name === 'SecurityError') {
        throw error;
      }

      // Dernière tentative échouée
      if (attempt === maxRetries) {
        break;
      }

      // Attendre avant de retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Augmenter le délai pour la prochaine tentative (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Wrapper pour opérations IndexedDB avec retry
 */
export const withRetry = (fn, config) => {
  return retryWithBackoff(fn, config);
};

/**
 * Retry spécifique pour IndexedDB
 */
export const retryIndexedDB = async (operation, config = {}) => {
  return retryWithBackoff(
    async () => {
      try {
        return await operation();
      } catch (error) {
        // Erreurs IndexedDB communes
        if (
          error.name === 'QuotaExceededError' ||
          error.name === 'InvalidStateError' ||
          error.name === 'TransactionInactiveError'
        ) {
          // Ces erreurs peuvent être retry
          throw error;
        }
        // Autres erreurs : ne pas retry
        throw error;
      }
    },
    {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      ...config,
    }
  );
};

export default {
  retryWithBackoff,
  withRetry,
  retryIndexedDB,
};

