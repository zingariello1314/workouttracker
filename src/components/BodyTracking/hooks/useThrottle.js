/**
 * Hook useThrottle - Throttle valeur/function
 * 
 * Limite l'exécution d'une fonction à une fois maximum par période.
 * Contrairement au debounce, exécute immédiatement puis bloque pendant période.
 * Utile pour scroll, resize, mousemove events.
 * 
 * @param {any} value - Valeur à throttler
 * @param {number} limit - Limite en ms (défaut: 300ms)
 * @returns {any} Valeur throttlée
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Hook useThrottledCallback - Throttle callback function
 * 
 * Limite l'exécution d'une fonction callback à une fois maximum par période.
 * 
 * @param {Function} callback - Fonction à throttler
 * @param {number} limit - Limite en ms (défaut: 300ms)
 * @param {Array} deps - Dépendances (optionnel)
 * @returns {Function} Fonction throttlée
 */
export const useThrottledCallback = (callback, limit = 300, deps = []) => {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // ✅ Mettre à jour callback ref quand callback change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    // Cleanup au unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ✅ Utiliser useCallback pour mémoriser fonction throttlée
  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRan.current;

    if (timeSinceLastRun >= limit) {
      // Exécuter immédiatement si période écoulée
      callbackRef.current(...args);
      lastRan.current = now;
    } else {
      // Sinon, programmer exécution après période restante
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        lastRan.current = Date.now();
      }, limit - timeSinceLastRun);
    }
  }, [limit]);

  return throttledCallback;
};

export default useThrottle;

