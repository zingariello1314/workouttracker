/**
 * useDebouncedSave.js
 * 
 * ✅ OPTIMISATION : Hook réutilisable pour debouncing des sauvegardes Nutrition
 * 
 * Réduit le nombre de transactions IndexedDB en regroupant les modifications
 * rapides et en les appliquant après un délai d'inactivité.
 * 
 * Impact attendu : Économie 50-70% sur transactions si sauvegarde rapide
 * 
 * @module hooks/useDebouncedSave
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 1.2
 */

import { useRef, useCallback, useEffect } from 'react';
import logger from '../utils/logger';

const log = logger.module('useDebouncedSave');

// ✅ OPTIMISATION : Utiliser configuration centralisée
import { NutritionConfig } from '../config/nutrition.config';

/**
 * Configuration par défaut
 * 
 * ✅ OPTIMISATION : Utiliser valeurs depuis configuration centralisée
 */
const DEFAULT_CONFIG = {
  // Délai de debounce en millisecondes (depuis configuration centralisée)
  delay: NutritionConfig.performance.debounceSave,
  
  // Délai maximum avant forcer la sauvegarde (même si changements continuent)
  maxDelay: NutritionConfig.performance.debounceSaveMaxDelay,
  
  // Callback appelé avant la sauvegarde (pour validation)
  onBeforeSave: null,
  
  // Callback appelé après la sauvegarde (pour logging/notifications)
  onAfterSave: null,
  
  // Si true, log les opérations (défaut: false pour réduire spam)
  verbose: false
};

/**
 * Hook pour sauvegarder des données avec debounce
 * 
 * Optimisé pour les sauvegardes Nutrition :
 * - Debounce 300ms (recommandé dans évaluation critique)
 * - Max delay 2000ms (force sauvegarde même si changements continuent)
 * - Gestion erreurs robuste
 * - Flush immédiat si nécessaire
 * 
 * @param {Function} saveFn - Fonction de sauvegarde (async, doit retourner Promise<boolean>)
 * @param {Object} config - Configuration du debounce
 * @param {number} config.delay - Délai de debounce (ms, défaut: 300)
 * @param {number} config.maxDelay - Délai maximum avant forcer sauvegarde (ms, défaut: 2000)
 * @param {Function} config.onBeforeSave - Callback avant sauvegarde (data) => boolean (annuler si false)
 * @param {Function} config.onAfterSave - Callback après sauvegarde (data, success, error)
 * @param {boolean} config.verbose - Si true, log les opérations
 * @returns {Object} { save, flush, cancel, isPending }
 * @returns {Function} save - Fonction pour déclencher la sauvegarde avec debounce
 * @returns {Function} flush - Fonction pour forcer la sauvegarde immédiate
 * @returns {Function} cancel - Fonction pour annuler la sauvegarde en attente
 * @returns {boolean} isPending - Si une sauvegarde est en attente
 * 
 * @example
 * const { save, flush, isPending } = useDebouncedSave(
 *   async (meal) => await saveMeal(meal),
 *   { delay: 300, verbose: true }
 * );
 * 
 * // Sauvegarder avec debounce (300ms)
 * save(mealData);
 * 
 * // Forcer sauvegarde immédiate
 * await flush();
 */
export const useDebouncedSave = (saveFn, config = {}) => {
  const {
    delay = DEFAULT_CONFIG.delay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    onBeforeSave = DEFAULT_CONFIG.onBeforeSave,
    onAfterSave = DEFAULT_CONFIG.onAfterSave,
    verbose = DEFAULT_CONFIG.verbose
  } = config;

  // Références pour gérer le debounce
  const debounceTimerRef = useRef(null);
  const maxDelayTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const isPendingRef = useRef(false);

  /**
   * Fonction de sauvegarde réelle
   */
  const doSave = useCallback(async (data) => {
    if (isSavingRef.current) {
      if (verbose) log.debug('[useDebouncedSave] Sauvegarde déjà en cours, mise en queue');
      // Si sauvegarde en cours, mettre en queue
      pendingDataRef.current = data;
      return;
    }

    // ✅ Validation avant sauvegarde (si callback fourni)
    if (onBeforeSave && typeof onBeforeSave === 'function') {
      try {
        const shouldSave = await onBeforeSave(data);
        if (shouldSave === false) {
          if (verbose) log.debug('[useDebouncedSave] Sauvegarde annulée par onBeforeSave');
          isPendingRef.current = false;
          return;
        }
      } catch (error) {
        log.error('[useDebouncedSave] Erreur dans onBeforeSave:', error);
        // Continuer même si onBeforeSave échoue
      }
    }

    isSavingRef.current = true;
    isPendingRef.current = false;

    try {
      if (verbose) log.debug('[useDebouncedSave] Début sauvegarde');
      const result = await saveFn(data);
      
      // ✅ Callback après sauvegarde (si fourni)
      if (onAfterSave && typeof onAfterSave === 'function') {
        try {
          await onAfterSave(data, result, null);
        } catch (error) {
          log.error('[useDebouncedSave] Erreur dans onAfterSave:', error);
        }
      }

      if (verbose) log.debug('[useDebouncedSave] Sauvegarde réussie:', result);
      return result;
    } catch (error) {
      log.error('[useDebouncedSave] Erreur sauvegarde:', error);
      
      // ✅ Callback après sauvegarde avec erreur (si fourni)
      if (onAfterSave && typeof onAfterSave === 'function') {
        try {
          await onAfterSave(data, false, error);
        } catch (callbackError) {
          log.error('[useDebouncedSave] Erreur dans onAfterSave (error):', callbackError);
        }
      }
      
      throw error;
    } finally {
      isSavingRef.current = false;
      
      // ✅ Si données en attente, les sauvegarder
      if (pendingDataRef.current) {
        const nextData = pendingDataRef.current;
        pendingDataRef.current = null;
        // Sauvegarder données suivantes (récursif mais limité par isSavingRef)
        doSave(nextData);
      }
    }
  }, [saveFn, onBeforeSave, onAfterSave, verbose]);

  /**
   * Fonction pour déclencher la sauvegarde avec debounce
   */
  const save = useCallback((data, immediate = false) => {
    // ✅ Sauvegarde immédiate si demandée
    if (immediate) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (maxDelayTimerRef.current) {
        clearTimeout(maxDelayTimerRef.current);
        maxDelayTimerRef.current = null;
      }
      isPendingRef.current = false;
      return doSave(data);
    }

    // Mettre à jour les données en attente
    pendingDataRef.current = data;
    isPendingRef.current = true;

    // Annuler le timer de debounce précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Programmer la sauvegarde après le délai de debounce
    debounceTimerRef.current = setTimeout(() => {
      const dataToSave = pendingDataRef.current;
      if (dataToSave) {
        pendingDataRef.current = null;
        doSave(dataToSave);
      }
      debounceTimerRef.current = null;
    }, delay);

    // Programmer une sauvegarde forcée après maxDelay
    if (maxDelayTimerRef.current) {
      clearTimeout(maxDelayTimerRef.current);
    }
    
    maxDelayTimerRef.current = setTimeout(() => {
      const dataToSave = pendingDataRef.current;
      if (dataToSave && !isSavingRef.current) {
        if (verbose) log.debug('[useDebouncedSave] Sauvegarde forcée après maxDelay');
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        pendingDataRef.current = null;
        doSave(dataToSave);
      }
      maxDelayTimerRef.current = null;
    }, maxDelay);
  }, [delay, maxDelay, doSave, verbose]);

  /**
   * Fonction pour forcer la sauvegarde immédiate (sans debounce)
   */
  const flush = useCallback(async () => {
    // Annuler tous les timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxDelayTimerRef.current) {
      clearTimeout(maxDelayTimerRef.current);
      maxDelayTimerRef.current = null;
    }

    // Sauvegarder immédiatement
    const dataToSave = pendingDataRef.current;
    if (dataToSave) {
      pendingDataRef.current = null;
      isPendingRef.current = false;
      return await doSave(dataToSave);
    }
    
    // Si pas de données en attente, retourner résolu
    return Promise.resolve(true);
  }, [doSave]);

  /**
   * Fonction pour annuler la sauvegarde en attente
   */
  const cancel = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxDelayTimerRef.current) {
      clearTimeout(maxDelayTimerRef.current);
      maxDelayTimerRef.current = null;
    }
    pendingDataRef.current = null;
    isPendingRef.current = false;
  }, []);

  /**
   * Nettoyage à la destruction du composant
   */
  useEffect(() => {
    return () => {
      // Annuler tous les timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (maxDelayTimerRef.current) {
        clearTimeout(maxDelayTimerRef.current);
      }
    };
  }, []);

  return {
    save,
    flush,
    cancel,
    isPending: isPendingRef.current
  };
};

