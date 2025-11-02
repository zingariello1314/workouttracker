/**
 * Hook useDebounce - Débounce valeur/function
 * 
 * Retarde l'exécution d'une fonction jusqu'à ce qu'un délai se soit écoulé
 * depuis le dernier appel. Utile pour inputs, recherches, API calls.
 * 
 * @param {any} value - Valeur à débouncer
 * @param {number} delay - Délai en ms (défaut: 300ms)
 * @returns {any} Valeur débouncée
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer timer pour retarder mise à jour
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: annuler timer si value change avant delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook useDebouncedCallback - Débounce callback function
 * 
 * Retarde l'exécution d'une fonction callback jusqu'à ce qu'un délai
 * se soit écoulé depuis le dernier appel.
 * 
 * @param {Function} callback - Fonction à débouncer
 * @param {number} delay - Délai en ms (défaut: 300ms)
 * @param {Array} deps - Dépendances (optionnel)
 * @returns {Function} Fonction débouncée
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Cleanup timeout au unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const debouncedCallback = (...args) => {
    // Annuler timeout précédent
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Créer nouveau timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  return debouncedCallback;
};

export default useDebounce;

