/**
 * Utilitaires pour vérifier l'environnement d'exécution (navigateur vs SSR).
 * 
 * Centralise toutes les vérifications d'environnement pour faciliter la maintenance
 * et garantir la compatibilité SSR/tests.
 * 
 * @module utils/isBrowser
 */

/**
 * Vérifie si le code s'exécute dans un environnement navigateur.
 * 
 * @returns {boolean} True si dans un navigateur, false sinon (SSR, tests, Node.js)
 */
export const isBrowser = () => {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
};

/**
 * Accès sécurisé à window avec fallback.
 * 
 * @returns {Window|{}}
 */
export const getWindow = () => {
  return typeof window !== 'undefined' ? window : {};
};

/**
 * Accès sécurisé à document avec fallback.
 * 
 * @returns {Document|{}}
 */
export const getDocument = () => {
  return typeof document !== 'undefined' ? document : {};
};

/**
 * Accès sécurisé à navigator avec fallback.
 * 
 * @returns {Navigator|{}}
 */
export const getNavigator = () => {
  return typeof navigator !== 'undefined' ? navigator : {};
};

/**
 * Vérifie si une fonction spécifique de window est disponible.
 * 
 * @param {string} functionName - Nom de la fonction à vérifier
 * @returns {boolean}
 */
export const hasWindowFunction = (functionName) => {
  if (!isBrowser()) {
    return false;
  }
  return typeof window[functionName] === 'function';
};

/**
 * Vérifie si une fonction spécifique de document est disponible.
 * 
 * @param {string} functionName - Nom de la fonction à vérifier
 * @returns {boolean}
 */
export const hasDocumentFunction = (functionName) => {
  if (!isBrowser()) {
    return false;
  }
  return typeof document[functionName] === 'function';
};

/**
 * Vérifie si CustomEvent est disponible.
 * 
 * @returns {boolean}
 */
export const hasCustomEvent = () => {
  return typeof CustomEvent !== 'undefined';
};

/**
 * Vérifie si dispatchEvent est disponible sur window.
 * 
 * @returns {boolean}
 */
export const hasDispatchEvent = () => {
  if (!isBrowser()) {
    return false;
  }
  return typeof window.dispatchEvent === 'function';
};

/**
 * Vérifie si requestIdleCallback est disponible.
 * 
 * @returns {boolean}
 */
export const hasRequestIdleCallback = () => {
  return hasWindowFunction('requestIdleCallback');
};

/**
 * Vérifie si IntersectionObserver est disponible.
 * 
 * @returns {boolean}
 */
export const hasIntersectionObserver = () => {
  return typeof IntersectionObserver !== 'undefined';
};

/**
 * Vérifie si IndexedDB est disponible.
 * 
 * @returns {boolean}
 */
export const hasIndexedDB = () => {
  if (!isBrowser()) {
    return false;
  }
  return typeof window.indexedDB !== 'undefined' || typeof indexedDB !== 'undefined';
};

/**
 * Vérifie si Service Worker est disponible.
 * 
 * @returns {boolean}
 */
export const hasServiceWorker = () => {
  if (!isBrowser()) {
    return false;
  }
  return 'serviceWorker' in navigator;
};

/**
 * Vérifie si Web Workers sont disponibles.
 * 
 * @returns {boolean}
 */
export const hasWebWorkers = () => {
  if (!isBrowser()) {
    return false;
  }
  return typeof Worker !== 'undefined';
};

