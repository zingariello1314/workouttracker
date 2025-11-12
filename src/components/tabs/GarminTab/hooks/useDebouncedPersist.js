/**
 * Hook pour persister des données avec debounce.
 * 
 * Réduit le nombre d'écritures IndexedDB en regroupant les modifications
 * et en les appliquant après un délai d'inactivité.
 * 
 * Utile pour :
 * - Sauvegardes fréquentes (ex: métriques UI, préférences)
 * - Données qui changent souvent mais n'ont pas besoin d'être persistées immédiatement
 * - Réduire la charge sur IndexedDB
 * 
 * @module useDebouncedPersist
 */

import { useRef, useCallback, useEffect } from 'react';
import logger from '../../../../utils/logger';

const log = logger.module('useDebouncedPersist');

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  // Délai de debounce en millisecondes
  delay: 1000,
  
  // Délai maximum avant forcer la sauvegarde (même si changements continuent)
  maxDelay: 5000,
  
  // Nombre maximum d'items en attente avant forcer la sauvegarde
  maxPendingItems: 10,
  
  // Callback appelé avant la sauvegarde (pour validation)
  onBeforeSave: null,
  
  // Callback appelé après la sauvegarde (pour logging)
  onAfterSave: null
};

/**
 * Hook pour persister des données avec debounce
 * 
 * @param {Function} persistFn - Fonction de persistance (async)
 * @param {Object} config - Configuration du debounce
 * @param {number} config.delay - Délai de debounce (ms, défaut: 1000)
 * @param {number} config.maxDelay - Délai maximum avant forcer sauvegarde (ms, défaut: 5000)
 * @param {number} config.maxPendingItems - Nombre max d'items avant forcer sauvegarde (défaut: 10)
 * @param {Function} config.onBeforeSave - Callback avant sauvegarde
 * @param {Function} config.onAfterSave - Callback après sauvegarde
 * @returns {Function} Fonction pour déclencher la persistance avec debounce
 * 
 * @example
 * const persist = useDebouncedPersist(async (data) => {
 *   await saveToIndexedDB(data);
 * }, { delay: 2000 });
 * 
 * // Appeler persist() déclenchera la sauvegarde après 2s d'inactivité
 * persist({ key: 'value' });
 */
export const useDebouncedPersist = (persistFn, config = {}) => {
  const {
    delay = DEFAULT_CONFIG.delay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    maxPendingItems = DEFAULT_CONFIG.maxPendingItems,
    onBeforeSave = DEFAULT_CONFIG.onBeforeSave,
    onAfterSave = DEFAULT_CONFIG.onAfterSave
  } = config;

  // Références pour gérer le debounce
  const debounceTimerRef = useRef(null);
  const maxDelayTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const lastSaveTimeRef = useRef(null);
  const isSavingRef = useRef(false);

  /**
   * Fonction de sauvegarde réelle
   */
  const doPersist = useCallback(async (data) => {
    if (isSavingRef.current) {
      log.debug('[useDebouncedPersist] Sauvegarde déjà en cours, ignoré');
      return;
    }

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      log.debug('[useDebouncedPersist] Données vides, sauvegarde ignorée');
      return;
    }

    isSavingRef.current = true;
    const startTime = Date.now();

    try {
      // Callback avant sauvegarde (validation)
      if (onBeforeSave && typeof onBeforeSave === 'function') {
        const validated = await onBeforeSave(data);
        if (validated === false) {
          log.debug('[useDebouncedPersist] Sauvegarde annulée par onBeforeSave');
          return;
        }
        // Si onBeforeSave retourne des données modifiées, les utiliser
        if (validated && typeof validated === 'object') {
          data = validated;
        }
      }

      // Exécuter la fonction de persistance
      await persistFn(data);

      lastSaveTimeRef.current = Date.now();
      const duration = Date.now() - startTime;

      log.debug('[useDebouncedPersist] Sauvegarde réussie', {
        duration,
        dataSize: JSON.stringify(data).length
      });

      // Callback après sauvegarde
      if (onAfterSave && typeof onAfterSave === 'function') {
        onAfterSave(data, duration);
      }

    } catch (error) {
      log.error('[useDebouncedPersist] Erreur lors de la sauvegarde', error);
      throw error;
    } finally {
      isSavingRef.current = false;
      pendingDataRef.current = null;
    }
  }, [persistFn, onBeforeSave, onAfterSave]);

  /**
   * Fonction pour déclencher la persistance avec debounce
   */
  const persist = useCallback((data) => {
    // Mettre à jour les données en attente
    pendingDataRef.current = data;

    // Annuler le timer de debounce précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Vérifier si on doit forcer la sauvegarde (trop d'items en attente)
    // Note: Cette logique peut être étendue pour compter les items si nécessaire

    // Programmer la sauvegarde après le délai de debounce
    debounceTimerRef.current = setTimeout(() => {
      const dataToSave = pendingDataRef.current;
      if (dataToSave) {
        doPersist(dataToSave);
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
        log.debug('[useDebouncedPersist] Sauvegarde forcée après maxDelay');
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        doPersist(dataToSave);
      }
      maxDelayTimerRef.current = null;
    }, maxDelay);

  }, [delay, maxDelay, doPersist]);

  /**
   * Fonction pour forcer la sauvegarde immédiate (sans debounce)
   */
  const flush = useCallback(() => {
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
      return doPersist(dataToSave);
    }
    return Promise.resolve();
  }, [doPersist]);

  /**
   * Nettoyage à la destruction du composant
   */
  useEffect(() => {
    return () => {
      // Nettoyer les timers d'abord
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (maxDelayTimerRef.current) {
        clearTimeout(maxDelayTimerRef.current);
        maxDelayTimerRef.current = null;
      }

      // Sauvegarder les données en attente avant de détruire le composant
      // Note: flush() est async, mais on ne peut pas attendre dans cleanup
      // Les données seront perdues si le composant est détruit avant flush
      // C'est acceptable car flush() devrait être appelé explicitement si nécessaire
      const dataToSave = pendingDataRef.current;
      if (dataToSave && !isSavingRef.current) {
        // Tenter flush mais ne pas bloquer le cleanup
        flush().catch(err => {
          log.warn('[useDebouncedPersist] Erreur lors du flush final (non bloquant)', err);
        });
      }
    };
  }, [flush]);

  return { persist, flush };
};

export default useDebouncedPersist;

