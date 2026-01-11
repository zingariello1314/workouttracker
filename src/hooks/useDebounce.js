import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook pour créer une fonction debounced
 * 
 * ✅ PHASE 1 - Étape 1.2 : Hook useDebounce optimisé
 * 
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes (défaut: 300ms)
 * @returns {Function} Fonction debounced
 * 
 * @example
 * const debouncedRefresh = useDebounce(refreshYahooData, 500);
 * 
 * // Utilisation
 * debouncedRefresh(); // S'exécutera après 500ms d'inactivité
 */
export const useDebounce = (fn, delay = 300) => {
  const timeoutRef = useRef(null);
  const fnRef = useRef(fn);

  // Mettre à jour la référence de la fonction à chaque changement
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const debouncedFn = useCallback(
    (...args) => {
      // Annuler le timeout précédent si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Créer un nouveau timeout
      timeoutRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
};

export default useDebounce;
