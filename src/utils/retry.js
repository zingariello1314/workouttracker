/**
 * Utilitaires pour retry automatique avec exponential backoff
 * 
 * ✅ PHASE 3 : Retry automatique pour opérations critiques
 * 
 * @module utils/retry
 */

/**
 * Retry une fonction avec exponential backoff
 * 
 * @param {Function} fn - Fonction à exécuter (peut être async)
 * @param {Object} options - Options de retry
 * @param {number} options.maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @param {number} options.initialDelay - Délai initial en ms (défaut: 1000)
 * @param {number} options.maxDelay - Délai maximum en ms (défaut: 30000)
 * @param {number} options.multiplier - Multiplicateur pour exponential backoff (défaut: 2)
 * @param {Function} options.shouldRetry - Fonction pour déterminer si on doit retry (error) => boolean
 * @param {Function} options.onRetry - Callback appelé à chaque retry (attempt, error)
 * @returns {Promise} Promise qui se résout avec le résultat ou rejette après tous les retries
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.resolve(fn());
      return result;
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative, rejeter
      if (attempt === maxRetries) {
        throw error;
      }

      // Vérifier si on doit retry
      if (!shouldRetry(error)) {
        throw error;
      }

      // Callback onRetry
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Attendre avant le prochain retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Calculer le prochain délai (exponential backoff)
      delay = Math.min(delay * multiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Retry avec stratégie personnalisée
 * 
 * @param {Function} fn - Fonction à exécuter
 * @param {Array<number>} delays - Tableau de délais en ms pour chaque tentative
 * @param {Function} shouldRetry - Fonction pour déterminer si on doit retry
 * @returns {Promise} Promise qui se résout avec le résultat
 */
export const retryWithCustomDelays = async (fn, delays = [1000, 2000, 5000], shouldRetry = () => true) => {
  let lastError;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    try {
      const result = await Promise.resolve(fn());
      return result;
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative, rejeter
      if (attempt === delays.length - 1) {
        throw error;
      }

      // Vérifier si on doit retry
      if (!shouldRetry(error)) {
        throw error;
      }

      // Attendre avant le prochain retry
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }

  throw lastError;
};

/**
 * Wrapper pour opérations IndexedDB avec retry
 * 
 * @param {Function} operation - Opération IndexedDB
 * @param {Object} options - Options de retry
 * @returns {Promise} Promise avec retry automatique
 */
export const withIDBRetry = (operation, options = {}) => {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    shouldRetry: (error) => {
      // Retry seulement pour certaines erreurs IndexedDB
      const errorName = error?.name || '';
      return (
        errorName.includes('QuotaExceeded') ||
        errorName.includes('TransactionInactive') ||
        errorName.includes('DatabaseClosed') ||
        error?.message?.includes('locked')
      );
    },
    ...options,
  });
};

/**
 * Wrapper pour opérations réseau avec retry
 * 
 * @param {Function} operation - Opération réseau (fetch, etc.)
 * @param {Object} options - Options de retry
 * @returns {Promise} Promise avec retry automatique
 */
export const withNetworkRetry = (operation, options = {}) => {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    shouldRetry: (error) => {
      // Retry seulement pour erreurs réseau
      return (
        !error.response || // Pas de réponse (timeout, network error)
        error.response?.status >= 500 || // Erreur serveur
        error.response?.status === 429 // Rate limit
      );
    },
    ...options,
  });
};

export default {
  retryWithBackoff,
  retryWithCustomDelays,
  withIDBRetry,
  withNetworkRetry,
};
