/**
 * Utilitaire pour les appels fetch avec AbortController
 * 
 * ✅ PHASE 1 : Gestion propre des fetch avec cleanup
 * 
 * Features:
 * - AbortController automatique
 * - Retry avec exponential backoff
 * - Timeout configurable
 * - Gestion d'erreurs robuste
 * 
 * @module utils/fetchWithAbort
 */

/**
 * Effectue un fetch avec AbortController et timeout
 * @param {string} url - URL à appeler
 * @param {RequestInit} options - Options fetch
 * @param {Object} config - Configuration
 * @param {number} config.timeout - Timeout en ms (défaut: 30000)
 * @param {number} config.retries - Nombre de tentatives (défaut: 0)
 * @param {number} config.retryDelay - Délai initial pour retry (défaut: 1000)
 * @returns {Promise<Response>} Réponse fetch
 */
export const fetchWithAbort = async (url, options = {}, config = {}) => {
  const {
    timeout = 30000,
    retries = 0,
    retryDelay = 1000
  } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Si c'est une erreur d'abort et qu'on a des retries, réessayer
    if (error.name === 'AbortError' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithAbort(url, options, {
        ...config,
        retries: retries - 1,
        retryDelay: retryDelay * 2 // Exponential backoff
      });
    }

    throw error;
  }
};

/**
 * Hook pour utiliser fetch avec AbortController dans useEffect
 * @param {string} url - URL à appeler
 * @param {RequestInit} options - Options fetch
 * @param {Object} config - Configuration
 * @returns {Function} Fonction fetch qui retourne un cleanup
 */
export const useFetchWithAbort = (url, options = {}, config = {}) => {
  return () => {
    const controller = new AbortController();
    const timeoutId = config.timeout 
      ? setTimeout(() => controller.abort(), config.timeout)
      : null;

    const fetchPromise = fetch(url, {
      ...options,
      signal: controller.signal
    }).then(response => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }).catch(error => {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    });

    // Cleanup function
    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  };
};

/**
 * Wrapper pour fetch avec gestion automatique d'AbortController dans useEffect
 * @param {string} url - URL à appeler
 * @param {RequestInit} options - Options fetch
 * @param {Object} config - Configuration
 * @returns {Promise<{data: any, cleanup: Function}>}
 */
export const createFetchEffect = (url, options = {}, config = {}) => {
  const controller = new AbortController();
  const timeoutId = config.timeout 
    ? setTimeout(() => controller.abort(), config.timeout)
    : null;

  const fetchPromise = fetch(url, {
    ...options,
    signal: controller.signal
  }).then(async response => {
    if (timeoutId) clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }).catch(error => {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  });

  const cleanup = () => {
    controller.abort();
    if (timeoutId) clearTimeout(timeoutId);
  };

  return { promise: fetchPromise, cleanup };
};

export default {
  fetchWithAbort,
  useFetchWithAbort,
  createFetchEffect
};
