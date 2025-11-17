/**
 * Hook useDebounce - Débounce valeur
 * 
 * ✅ OPTIMISATION Phase 11.3 : Hook debounce réutilisable et optimisé
 * 
 * Retarde la mise à jour d'une valeur jusqu'à ce qu'un délai se soit écoulé
 * depuis le dernier changement. Utile pour inputs, recherches, API calls.
 * 
 * @param {any} value - Valeur à débouncer
 * @param {number} delay - Délai en ms (défaut: 300ms)
 * @returns {any} Valeur débouncée
 * 
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 500);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     performSearch(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
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

export default useDebounce;


