/**
 * Hook pour précharger les données des jours adjacents (J±1).
 * 
 * Utilise `requestIdleCallback` pour charger les données des jours précédent
 * et suivant de manière non-bloquante, améliorant la fluidité de navigation.
 * 
 * @module usePrefetchAdjacentDays
 */

import { useEffect, useRef, useCallback } from 'react';
import logger from '../../../../utils/logger';

const log = logger.module('usePrefetchAdjacentDays');

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  // Délai avant de commencer le prefetch (ms)
  initialDelay: 2000,
  
  // Timeout pour requestIdleCallback (ms)
  idleTimeout: 5000,
  
  // Nombre de jours à précharger de chaque côté
  daysRange: 1, // J±1 par défaut
  
  // Seuil minimum de temps libre requis (ms)
  minIdleTime: 10
};

/**
 * Calcule la date suivante/précédente
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    log.warn('[usePrefetchAdjacentDays] Erreur calcul date adjacente', { dateStr, offset, error });
    return null;
  }
}

/**
 * Génère la liste des dates adjacentes à précharger
 */
function getAdjacentDates(selectedDate, daysRange = 1) {
  if (!selectedDate) {
    return [];
  }

  const dates = [];
  
  // Jours précédents
  for (let i = daysRange; i >= 1; i--) {
    const date = getAdjacentDate(selectedDate, -i);
    if (date) {
      dates.push(date);
    }
  }
  
  // Jours suivants
  for (let i = 1; i <= daysRange; i++) {
    const date = getAdjacentDate(selectedDate, i);
    if (date) {
      dates.push(date);
    }
  }
  
  return dates;
}

/**
 * Hook pour précharger les données des jours adjacents
 * 
 * @param {Object} params
 * @param {string} params.selectedDate - Date actuellement sélectionnée
 * @param {Function} params.loadDataByRange - Fonction pour charger les données par plage
 * @param {Function} params.loadDataForDate - Fonction pour charger les données d'une date (optionnel)
 * @param {Object} params.config - Configuration (initialDelay, idleTimeout, daysRange, minIdleTime)
 * @returns {Object} État du prefetch (isPrefetching, prefetchedDates)
 */
export const usePrefetchAdjacentDays = ({
  selectedDate,
  loadDataByRange,
  loadDataForDate = null,
  config = {}
}) => {
  const {
    initialDelay = DEFAULT_CONFIG.initialDelay,
    idleTimeout = DEFAULT_CONFIG.idleTimeout,
    daysRange = DEFAULT_CONFIG.daysRange,
    minIdleTime = DEFAULT_CONFIG.minIdleTime
  } = config;

  const prefetchedDatesRef = useRef(new Set());
  const isPrefetchingRef = useRef(false);
  const idleCallbackIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  /**
   * Précharge les données pour une date spécifique
   */
  const prefetchDate = useCallback(async (date) => {
    if (prefetchedDatesRef.current.has(date)) {
      return; // Déjà préchargé
    }

    try {
      if (loadDataForDate && typeof loadDataForDate === 'function') {
        await loadDataForDate(date);
      } else if (loadDataByRange && typeof loadDataByRange === 'function') {
        // Charger la plage autour de la date
        await loadDataByRange(date, date);
      }
      
      prefetchedDatesRef.current.add(date);
      log.debug('[usePrefetchAdjacentDays] Date préchargée', { date });
    } catch (error) {
      log.warn('[usePrefetchAdjacentDays] Erreur préchargement date', { date, error });
    }
  }, [loadDataByRange, loadDataForDate]);

  /**
   * Précharge toutes les dates adjacentes
   */
  const prefetchAdjacentDates = useCallback(async (deadline) => {
    if (isPrefetchingRef.current) {
      return;
    }

    if (!selectedDate) {
      return;
    }

    const adjacentDates = getAdjacentDates(selectedDate, daysRange);
    if (adjacentDates.length === 0) {
      return;
    }

    isPrefetchingRef.current = true;

    try {
      // Précharger les dates tant qu'il reste du temps libre
      for (const date of adjacentDates) {
        // Vérifier si on a encore du temps
        if (deadline && deadline.timeRemaining() < minIdleTime) {
          log.debug('[usePrefetchAdjacentDays] Plus assez de temps libre, arrêt du prefetch');
          break;
        }

        // Ignorer si déjà préchargé
        if (prefetchedDatesRef.current.has(date)) {
          continue;
        }

        await prefetchDate(date);

        // Petite pause pour permettre au navigateur de respirer
        if (deadline && deadline.timeRemaining() > minIdleTime) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      log.error('[usePrefetchAdjacentDays] Erreur lors du prefetch', error);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [selectedDate, daysRange, minIdleTime, prefetchDate]);

  /**
   * Démarre le prefetch avec requestIdleCallback
   */
  const startPrefetch = useCallback(() => {
    if (!selectedDate || !loadDataByRange) {
      return;
    }

    // Annuler le prefetch précédent s'il existe
    if (idleCallbackIdRef.current && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackIdRef.current);
      idleCallbackIdRef.current = null;
    }

    // Attendre le délai initial
    timeoutIdRef.current = setTimeout(() => {
      if (typeof requestIdleCallback !== 'undefined') {
        idleCallbackIdRef.current = requestIdleCallback(
          (deadline) => {
            prefetchAdjacentDates(deadline);
          },
          { timeout: idleTimeout }
        );
      } else {
        // Fallback pour navigateurs sans requestIdleCallback
        setTimeout(() => {
          prefetchAdjacentDates({ timeRemaining: () => 50 });
        }, 100);
      }
    }, initialDelay);
  }, [selectedDate, loadDataByRange, initialDelay, idleTimeout, prefetchAdjacentDates]);

  /**
   * Nettoie les dates préchargées qui ne sont plus adjacentes
   */
  const cleanupOldPrefetched = useCallback(() => {
    if (!selectedDate) {
      prefetchedDatesRef.current.clear();
      return;
    }

    const currentAdjacentDates = new Set(getAdjacentDates(selectedDate, daysRange));
    const toRemove = [];

    prefetchedDatesRef.current.forEach((date) => {
      if (!currentAdjacentDates.has(date)) {
        toRemove.push(date);
      }
    });

    toRemove.forEach((date) => {
      prefetchedDatesRef.current.delete(date);
    });

    if (toRemove.length > 0) {
      log.debug('[usePrefetchAdjacentDays] Dates nettoyées', { count: toRemove.length });
    }
  }, [selectedDate, daysRange]);

  // Effet principal : démarrer le prefetch quand la date change
  useEffect(() => {
    if (!selectedDate || !loadDataByRange) {
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
      if (idleCallbackIdRef.current && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleCallbackIdRef.current);
        idleCallbackIdRef.current = null;
      }
    };
  }, [selectedDate, loadDataByRange, startPrefetch, cleanupOldPrefetched]);

  return {
    isPrefetching: isPrefetchingRef.current,
    prefetchedDates: Array.from(prefetchedDatesRef.current),
    prefetchDate: (date) => prefetchDate(date)
  };
};

export default usePrefetchAdjacentDays;


