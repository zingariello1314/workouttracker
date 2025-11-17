/**
 * Hook useDebouncedCallback - Débounce callback avec gestion annulation
 * 
 * ✅ OPTIMISATION Phase 11.3 : Hook debounce callback robuste avec gestion requêtes
 * 
 * Retarde l'exécution d'une fonction callback jusqu'à ce qu'un délai se soit écoulé
 * depuis le dernier appel. Gère automatiquement l'annulation des requêtes précédentes
 * pour éviter résultats désordonnés.
 * 
 * @param {Function} callback - Fonction à débouncer (peut être async)
 * @param {number} delay - Délai en ms (défaut: 300ms)
 * @param {Array} deps - Dépendances pour recréer callback (optionnel)
 * @returns {Object} { debouncedCallback, isPending, cancel }
 *   - debouncedCallback: Fonction débouncée
 *   - isPending: État indiquant si une exécution est en attente
 *   - cancel: Fonction pour annuler l'exécution en attente
 * 
 * @example
 * const { debouncedCallback, isPending, cancel } = useDebouncedCallback(
 *   async (query) => {
 *     const results = await searchAPI(query);
 *     setResults(results);
 *   },
 *   500,
 *   []
 * );
 * 
 * // Utilisation
 * <input onChange={(e) => debouncedCallback(e.target.value)} />
 * {isPending && <Spinner />}
 */
import { useRef, useCallback, useEffect, useState } from 'react';

export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const timeoutRef = useRef(null);
  const isCancelledRef = useRef(false);
  const callbackRef = useRef(callback);
  const [isPending, setIsPending] = useState(false);

  // Mettre à jour callback ref quand il change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // Fonction pour annuler l'exécution en attente
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isCancelledRef.current = true;
    setIsPending(false);
  }, []);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Fonction débouncée
  const debouncedCallback = useCallback(
    async (...args) => {
      // Annuler exécution précédente
      cancel();

      // Réinitialiser flag d'annulation
      isCancelledRef.current = false;

      // Marquer comme pending
      setIsPending(true);

      // Créer nouveau timeout
      timeoutRef.current = setTimeout(async () => {
        // Vérifier si annulé avant exécution
        if (isCancelledRef.current) {
          setIsPending(false);
          return;
        }

        try {
          // Exécuter callback
          const result = callbackRef.current(...args);

          // Si c'est une Promise, attendre avec gestion annulation
          if (result && typeof result.then === 'function') {
            await result;
          }

          // Vérifier si annulé après exécution
          if (isCancelledRef.current) {
            setIsPending(false);
            return;
          }

          setIsPending(false);
        } catch (error) {
          // Ignorer si annulé
          if (isCancelledRef.current) {
            setIsPending(false);
            return;
          }
          setIsPending(false);
          throw error;
        } finally {
          timeoutRef.current = null;
        }
      }, delay);
    },
    [delay, cancel]
  );

  return {
    debouncedCallback,
    isPending,
    cancel
  };
};

export default useDebouncedCallback;

