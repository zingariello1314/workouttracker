/**
 * Hook useMemoizedCallback - Callback mémorisé avec dépendances intelligentes
 * 
 * Version optimisée de useCallback avec:
 * - Comparaison profonde optionnelle
 * - Cache intelligent
 * - Debounce/throttle intégré optionnel
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import { useCallback, useRef } from 'react';

/**
 * Compare profonde de deux valeurs
 */
const deepEqual = (a, b) => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

/**
 * Compare shallow (référence) de deux tableaux
 */
const shallowEqualArrays = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 * Hook useMemoizedCallback optimisé
 * 
 * @param {Function} callback - Fonction callback
 * @param {Array} deps - Dépendances
 * @param {Object} options - Options
 * @param {boolean} options.deepCompare - Comparaison profonde des dépendances (défaut: false)
 * @param {number} options.debounce - Délai debounce en ms (optionnel)
 * @param {number} options.throttle - Limite throttle en ms (optionnel)
 * @returns {Function} Callback mémorisé
 */
export const useMemoizedCallback = (callback, deps = [], options = {}) => {
  const {
    deepCompare = false,
    debounce: debounceMs = null,
    throttle: throttleMs = null
  } = options;

  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);
  const memoizedCallbackRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);

  // Mettre à jour callback ref
  callbackRef.current = callback;

  // Vérifier si dépendances ont changé
  const depsChanged = deepCompare
    ? !deepEqual(depsRef.current, deps)
    : !shallowEqualArrays(depsRef.current, deps);

  if (depsChanged) {
    depsRef.current = deps;
    memoizedCallbackRef.current = null; // Invalider cache
  }

  // Créer callback mémorisé
  const memoizedCallback = useCallback((...args) => {
    const execute = () => {
      callbackRef.current(...args);
    };

    // Debounce
    if (debounceMs) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(execute, debounceMs);
      return;
    }

    // Throttle
    if (throttleMs) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= throttleMs) {
        execute();
        lastCallTimeRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          execute();
          lastCallTimeRef.current = Date.now();
        }, throttleMs - timeSinceLastCall);
      }
      return;
    }

    // Exécution normale
    execute();
  }, [debounceMs, throttleMs, ...(deepCompare ? [] : deps)]);

  // Stocker callback mémorisé
  if (!memoizedCallbackRef.current || depsChanged) {
    memoizedCallbackRef.current = memoizedCallback;
  }

  return memoizedCallbackRef.current;
};

export default useMemoizedCallback;

