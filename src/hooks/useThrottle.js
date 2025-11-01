import { useRef, useCallback, useEffect } from 'react';

/**
 * 🟡 FIX #17 : Hook pour throttling de fonctions
 * Retourne une version throttled de la fonction qui ne s'exécute qu'une fois toutes les `delay` ms
 * Nettoie automatiquement les timeouts au démontage pour éviter les memory leaks
 */
export function useThrottle(fn, delay) {
  const lastRunRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // Exécuter immédiatement si assez de temps s'est écoulé
        lastRunRef.current = now;
        fn(...args);
      } else {
        // Planifier l'exécution pour après le délai restant
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        const remainingDelay = delay - timeSinceLastRun;
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          fn(...args);
        }, remainingDelay);
      }
    },
    [fn, delay]
  );
}
