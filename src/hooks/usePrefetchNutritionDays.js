/**
 * usePrefetchNutritionDays.js
 * 
 * ✅ OPTIMISATION : Hook pour précharger les données nutrition des jours adjacents (J±1)
 * 
 * Utilise `requestIdleCallback` pour charger les données du jour précédent et suivant
 * de manière non-bloquante, améliorant la fluidité de navigation.
 * 
 * Impact attendu : Navigation instantanée jour suivant/précédent
 * 
 * @module hooks/usePrefetchNutritionDays
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 1.2
 */

import { useEffect, useRef, useCallback } from 'react';
import { DateHelper } from '../utils/dateHelper';
import { getNutritionRepository } from '../services/nutrition/repository';
import logger from '../utils/logger';

const log = logger.module('usePrefetchNutritionDays');

// ✅ OPTIMISATION : Utiliser configuration centralisée
import { NutritionConfig } from '../config/nutrition.config';

/**
 * Configuration par défaut
 * 
 * ✅ OPTIMISATION : Utiliser valeurs depuis configuration centralisée
 */
const DEFAULT_CONFIG = {
  // Délai avant de commencer le prefetch (ms) - Attendre que la page soit stable
  initialDelay: NutritionConfig.performance.prefetchInitialDelay,
  
  // Timeout pour requestIdleCallback (ms) - Forcer après timeout même si navigateur occupé
  idleTimeout: NutritionConfig.performance.prefetchIdleTimeout,
  
  // Nombre de jours à précharger de chaque côté (J±1 par défaut)
  daysRange: NutritionConfig.performance.prefetchDaysRange,
  
  // Seuil minimum de temps libre requis (ms) - Ne précharger que si navigateur vraiment idle
  minIdleTime: NutritionConfig.performance.prefetchMinIdleTime,
  
  // Si true, précharger aussi le programme actif (changent rarement, utile pour conformité)
  prefetchActiveProgram: false, // Désactivé par défaut (déjà en cache avec TTL 300s)
  
  // Si true, log les opérations (défaut: false pour réduire spam)
  verbose: false
};

/**
 * Calcule la date adjacente (précédente ou suivante)
 * 
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {number} offset - Offset en jours (-1 pour précédent, +1 pour suivant)
 * @returns {string|null} Date au format YYYY-MM-DD ou null si erreur
 */
function getAdjacentDate(dateStr, offset) {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return null;
    }

    date.setDate(date.getDate() + offset);
    return DateHelper.toYYYYMMDD(date);
  } catch (error) {
    if (DEFAULT_CONFIG.verbose) {
      log.warn('[usePrefetchNutritionDays] Erreur calcul date adjacente', { dateStr, offset, error });
    }
    return null;
  }
}

/**
 * Génère la liste des dates adjacentes à précharger
 * 
 * @param {string} selectedDate - Date actuellement sélectionnée (YYYY-MM-DD)
 * @param {number} daysRange - Nombre de jours de chaque côté
 * @returns {Array<string>} Liste des dates à précharger
 */
function getAdjacentDates(selectedDate, daysRange = 1) {
  if (!selectedDate) {
    return [];
  }

  const dates = [];
  
  // Dates précédentes (J-1, J-2, ...)
  for (let i = daysRange; i >= 1; i--) {
    const date = getAdjacentDate(selectedDate, -i);
    if (date) {
      dates.push(date);
    }
  }
  
  // Dates suivantes (J+1, J+2, ...)
  for (let i = 1; i <= daysRange; i++) {
    const date = getAdjacentDate(selectedDate, i);
    if (date) {
      dates.push(date);
    }
  }
  
  return dates;
}

/**
 * Hook pour précharger les données nutrition des jours adjacents
 * 
 * ✅ OPTIMISATION : Prefetching intelligent avec requestIdleCallback
 * 
 * Précharge en arrière-plan :
 * - dailyMeal pour chaque jour adjacent
 * - meals pour chaque jour adjacent
 * - activeProgram (optionnel, si configuré)
 * 
 * Utilise le cache existant pour éviter requêtes inutiles.
 * 
 * @param {Object} params
 * @param {string|Date} params.selectedDate - Date actuellement sélectionnée
 * @param {Object} params.config - Configuration (initialDelay, idleTimeout, daysRange, minIdleTime, prefetchActiveProgram, verbose)
 * @returns {Object} État du prefetch (isPrefetching, prefetchedDates, prefetchDate)
 * 
 * @example
 * const { isPrefetching, prefetchedDates } = usePrefetchNutritionDays({
 *   selectedDate: '2025-01-16',
 *   config: { daysRange: 1, verbose: true }
 * });
 */
export const usePrefetchNutritionDays = ({
  selectedDate,
  config = {}
}) => {
  const {
    initialDelay = DEFAULT_CONFIG.initialDelay,
    idleTimeout = DEFAULT_CONFIG.idleTimeout,
    daysRange = DEFAULT_CONFIG.daysRange,
    minIdleTime = DEFAULT_CONFIG.minIdleTime,
    prefetchActiveProgram = DEFAULT_CONFIG.prefetchActiveProgram,
    verbose = DEFAULT_CONFIG.verbose
  } = config;

  const prefetchedDatesRef = useRef(new Set());
  const isPrefetchingRef = useRef(false);
  const idleCallbackIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  /**
   * Précharge les données pour une date spécifique
   * 
   * ✅ OPTIMISATION : Le Repository utilise déjà le cache automatiquement
   * On précharge simplement les données, le cache gérera la mise en cache
   */
  const prefetchDate = useCallback(async (dateStr) => {
    if (!dateStr || prefetchedDatesRef.current.has(dateStr)) {
      return; // Déjà préchargé ou date invalide
    }

    try {
      const repository = await getNutritionRepository();

      // ✅ OPTIMISATION : Précharger en parallèle (Promise.all)
      // Le Repository utilise déjà le cache, donc si déjà en cache, ce sera rapide
      const promises = [
        // Précharger dailyMeal (le cache sera utilisé automatiquement par le Repository)
        repository.get('dailyMeals', dateStr, { 
          operationName: `prefetch:dailyMeal:${dateStr}`,
          quiet: true // ✅ Réduire logs pour prefetch
        }).catch(err => {
          if (verbose) log.warn('[usePrefetchNutritionDays] Erreur préchargement dailyMeal', { dateStr, err });
        }),
        // Précharger meals (via getAll puis filtrer, le cache gérera le reste)
        repository.getAll('meals', { 
          operationName: `prefetch:meals:${dateStr}`,
          quiet: true // ✅ Réduire logs pour prefetch
        }).then(allMeals => {
          // Filtrer par date (le cache gérera le reste)
          return (allMeals || []).filter(meal => meal.date === dateStr);
        }).catch(err => {
          if (verbose) log.warn('[usePrefetchNutritionDays] Erreur préchargement meals', { dateStr, err });
        })
      ];

      // ✅ Précharger en parallèle
      await Promise.all(promises);
      prefetchedDatesRef.current.add(dateStr);
      if (verbose) log.debug('[usePrefetchNutritionDays] Date préchargée', { dateStr });
    } catch (error) {
      if (verbose) log.warn('[usePrefetchNutritionDays] Erreur préchargement date', { dateStr, error });
    }
  }, [verbose]);

  /**
   * Précharge le programme actif (optionnel)
   * 
   * ✅ OPTIMISATION : Le Repository utilise déjà le cache automatiquement
   */
  const prefetchActiveProgramData = useCallback(async () => {
    if (!prefetchActiveProgram) {
      return; // Désactivé par défaut
    }

    try {
      const repository = await getNutritionRepository();

      // ✅ Précharger tous les programmes (le cache gérera le reste)
      await repository.getAll('programs', { 
        operationName: 'prefetch:activeProgram',
        quiet: true
      }).catch(err => {
        if (verbose) log.warn('[usePrefetchNutritionDays] Erreur préchargement activeProgram', { err });
      });
    } catch (error) {
      if (verbose) log.warn('[usePrefetchNutritionDays] Erreur préchargement activeProgram', { error });
    }
  }, [prefetchActiveProgram, verbose]);

  /**
   * Précharge toutes les dates adjacentes
   * 
   * ✅ OPTIMISATION : Respecte deadline de requestIdleCallback pour ne pas bloquer
   */
  const prefetchAdjacentDates = useCallback(async (deadline) => {
    if (isPrefetchingRef.current) {
      return; // Déjà en cours
    }

    // ✅ Convertir selectedDate en string si Date
    const dateStr = typeof selectedDate === 'string' 
      ? selectedDate 
      : DateHelper.toYYYYMMDD(selectedDate);

    if (!dateStr) {
      return;
    }

    const adjacentDates = getAdjacentDates(dateStr, daysRange);
    if (adjacentDates.length === 0) {
      return;
    }

    isPrefetchingRef.current = true;

    try {
      // ✅ Précharger programme actif en premier (si configuré, rapide)
      if (prefetchActiveProgram) {
        await prefetchActiveProgramData();
      }

      // ✅ Précharger dates adjacentes en respectant deadline
      for (const date of adjacentDates) {
        // ✅ Vérifier si on a encore du temps (requestIdleCallback)
        if (deadline && typeof deadline.timeRemaining === 'function') {
          const timeRemaining = deadline.timeRemaining();
          if (timeRemaining < minIdleTime) {
            // ✅ Pas assez de temps, arrêter et reprendre plus tard
            if (verbose) log.debug('[usePrefetchNutritionDays] Pas assez de temps, arrêt préchargement', { 
              timeRemaining,
              remainingDates: adjacentDates.length - adjacentDates.indexOf(date)
            });
            break;
          }
        }

        // ✅ Précharger cette date
        await prefetchDate(date);
      }

      if (verbose) log.debug('[usePrefetchNutritionDays] Préchargement terminé', { 
        dates: Array.from(prefetchedDatesRef.current) 
      });
    } catch (error) {
      log.error('[usePrefetchNutritionDays] Erreur préchargement dates adjacentes', { error });
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [selectedDate, daysRange, minIdleTime, prefetchDate, prefetchActiveProgramData, prefetchActiveProgram, verbose]);

  /**
   * Démarre le prefetch avec requestIdleCallback
   */
  const startPrefetch = useCallback(() => {
    // ✅ Convertir selectedDate en string si Date
    const dateStr = typeof selectedDate === 'string' 
      ? selectedDate 
      : DateHelper.toYYYYMMDD(selectedDate);

    if (!dateStr) {
      return;
    }

    // Annuler le prefetch précédent s'il existe
    if (idleCallbackIdRef.current) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleCallbackIdRef.current);
      } else if (typeof window !== 'undefined' && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleCallbackIdRef.current);
      }
      idleCallbackIdRef.current = null;
    }

    // Attendre le délai initial (laisser la page se stabiliser)
    timeoutIdRef.current = setTimeout(() => {
      // ✅ Utiliser requestIdleCallback si disponible, sinon fallback setTimeout
      if (typeof requestIdleCallback !== 'undefined') {
        idleCallbackIdRef.current = requestIdleCallback(
          (deadline) => {
            prefetchAdjacentDates(deadline);
          },
          { timeout: idleTimeout }
        );
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        idleCallbackIdRef.current = window.requestIdleCallback(
          (deadline) => {
            prefetchAdjacentDates(deadline);
          },
          { timeout: idleTimeout }
        );
      } else {
        // ✅ Fallback pour navigateurs sans requestIdleCallback
        setTimeout(() => {
          prefetchAdjacentDates({ timeRemaining: () => 50 }); // Simuler deadline
        }, 100);
      }
    }, initialDelay);
  }, [selectedDate, initialDelay, idleTimeout, prefetchAdjacentDates]);

  /**
   * Nettoie les dates préchargées qui ne sont plus adjacentes
   */
  const cleanupOldPrefetched = useCallback(() => {
    // ✅ Convertir selectedDate en string si Date
    const dateStr = typeof selectedDate === 'string' 
      ? selectedDate 
      : DateHelper.toYYYYMMDD(selectedDate);

    if (!dateStr) {
      prefetchedDatesRef.current.clear();
      return;
    }

    const currentAdjacentDates = new Set(getAdjacentDates(dateStr, daysRange));
    const toRemove = [];

    prefetchedDatesRef.current.forEach((date) => {
      if (!currentAdjacentDates.has(date)) {
        toRemove.push(date);
      }
    });

    toRemove.forEach((date) => {
      prefetchedDatesRef.current.delete(date);
    });

    if (toRemove.length > 0 && verbose) {
      log.debug('[usePrefetchNutritionDays] Dates nettoyées', { count: toRemove.length });
    }
  }, [selectedDate, daysRange, verbose]);

  // ✅ Effet principal : démarrer le prefetch quand la date change
  useEffect(() => {
    // ✅ Convertir selectedDate en string si Date
    const dateStr = typeof selectedDate === 'string' 
      ? selectedDate 
      : DateHelper.toYYYYMMDD(selectedDate);

    if (!dateStr) {
      return;
    }

    // Nettoyer les anciennes dates préchargées
    cleanupOldPrefetched();

    // Démarrer le prefetch
    startPrefetch();

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (idleCallbackIdRef.current) {
        if (typeof cancelIdleCallback !== 'undefined') {
          cancelIdleCallback(idleCallbackIdRef.current);
        } else if (typeof window !== 'undefined' && window.cancelIdleCallback) {
          window.cancelIdleCallback(idleCallbackIdRef.current);
        }
        idleCallbackIdRef.current = null;
      }
    };
  }, [selectedDate, startPrefetch, cleanupOldPrefetched]);

  return {
    isPrefetching: isPrefetchingRef.current,
    prefetchedDates: Array.from(prefetchedDatesRef.current),
    prefetchDate: (date) => prefetchDate(date)
  };
};

