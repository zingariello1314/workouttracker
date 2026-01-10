/**
 * Utilitaires pour debounce optimisé
 * 
 * ✅ PHASE 3 : Optimiser les debounces
 * 
 * @module utils/debounce
 */

/**
 * Debounce simple
 * 
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} Fonction debouncée
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * Debounce avec leading edge (exécute immédiatement au premier appel)
 * 
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes
 * @param {boolean} leading - Si true, exécute immédiatement au premier appel
 * @returns {Function} Fonction debouncée
 */
export const debounceLeading = (fn, delay = 300, leading = true) => {
  let timeoutId;
  let lastCallTime = 0;
  
  return function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (leading && timeSinceLastCall > delay) {
      // Exécuter immédiatement si assez de temps s'est écoulé
      lastCallTime = now;
      fn.apply(this, args);
    } else {
      // Sinon, debounce normal
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn.apply(this, args);
      }, delay);
    }
  };
};

/**
 * Debounce adaptatif (délai variable selon la longueur de l'input)
 * 
 * @param {Function} fn - Fonction à debouncer
 * @param {Function} getDelay - Fonction qui retourne le délai selon les arguments
 * @returns {Function} Fonction debouncée
 */
export const adaptiveDebounce = (fn, getDelay = (args) => {
  // Délai plus court si input court (< 3 caractères)
  const input = args[0]?.toString() || '';
  return input.length < 3 ? 200 : 500;
}) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    const delay = getDelay(args);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * Throttle (limite l'exécution à une fois par période)
 * 
 * @param {Function} fn - Fonction à throttler
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} Fonction throttlée
 */
export const throttle = (fn, delay = 300) => {
  let lastCallTime = 0;
  let timeoutId;
  
  return function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall >= delay) {
      // Exécuter immédiatement
      lastCallTime = now;
      fn.apply(this, args);
    } else {
      // Programmer l'exécution pour la fin de la période
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
};

/**
 * Hook React pour debounce
 * 
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes
 * @param {Array} deps - Dépendances (comme useCallback)
 * @returns {Function} Fonction debouncée
 */
export const useDebounce = (fn, delay = 300, deps = []) => {
  const React = require('react');
  const debouncedFn = React.useRef(null);
  
  React.useEffect(() => {
    debouncedFn.current = debounce(fn, delay);
    
    return () => {
      // Cleanup
      if (debouncedFn.current) {
        debouncedFn.current = null;
      }
    };
  }, [delay, ...deps]);
  
  return React.useCallback((...args) => {
    if (debouncedFn.current) {
      debouncedFn.current(...args);
    }
  }, []);
};

export default {
  debounce,
  debounceLeading,
  adaptiveDebounce,
  throttle,
  useDebounce,
};
