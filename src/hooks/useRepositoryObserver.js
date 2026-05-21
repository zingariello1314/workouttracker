/**
 * useRepositoryObserver.js
 * 
 * ✅ PHASE 12.2 : Hook React pour intégrer Pattern Observer dans composants
 * 
 * Permet aux composants de s'abonner automatiquement aux changements de données
 * via le Repository Observer, avec cleanup automatique au unmount.
 * 
 * Réduit les re-renders inutiles et améliore la synchronisation état.
 * 
 * @module hooks/useRepositoryObserver
 * @see ../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRepositoryObserver, getNutritionRepository, getStoreName } from '../services/nutrition/repository';
import { getMealsByDate } from './nutritionDataCRUD/meals';
import { getActiveProgram as fetchActiveProgram } from './nutritionDataCRUD/programs';
import logger from '../utils/logger';

const log = logger.module('useRepositoryObserver');

/**
 * ✅ PHASE 12.2 : Hook pour s'abonner aux changements de données via Repository Observer
 * 
 * @param {string} store - Nom du store (ex: 'dailyMeals', 'meals')
 * @param {string|number|null} key - Clé de l'entrée (ex: '2025-01-16', 'meal-123') ou null pour tous
 * @param {Object} options - Options
 * @param {Function} options.initialValue - Valeur initiale (optionnel)
 * @param {Function} options.onChange - Callback appelé lors du changement (optionnel)
 * @param {boolean} options.subscribeToAll - Si true, s'abonne à tous les changements du store (ex: 'dailyMeals:*')
 * @returns {[any, Function]} [data, refresh] - Données actuelles et fonction de rafraîchissement manuel
 * 
 * @example
 * // S'abonner à un dailyMeal spécifique
 * const [dailyMeal, refresh] = useRepositoryObserver('dailyMeals', '2025-01-16');
 * 
 * // S'abonner à tous les dailyMeals
 * const [allDailyMeals, refresh] = useRepositoryObserver('dailyMeals', null, { subscribeToAll: true });
 * 
 * // Avec callback
 * const [meal, refresh] = useRepositoryObserver('meals', 'meal-123', {
 *   onChange: (newMeal) => console.log('Meal updated:', newMeal)
 * });
 */
export const useRepositoryObserver = (store, key, options = {}) => {
  const {
    initialValue = null,
    onChange = null,
    subscribeToAll = false,
    enabled = true // ✅ OPTIMISATION : Chargement conditionnel basé sur visibilité
  } = options;

  // État local pour les données
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(enabled); // ✅ Si disabled, pas de loading initial
  const [error, setError] = useState(null);
  
  // Ref pour éviter re-subscriptions inutiles
  const observerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // ✅ Construire clé de subscription (utilise nom réel pour Observer)
  const subscriptionKey = useCallback(() => {
    // ✅ PHASE 12.2 : Utiliser nom réel pour Observer (cohérence avec repository.notify)
    const realStoreName = getStoreName(store);
    
    if (subscribeToAll) {
      return `${realStoreName}:*`; // Tous les changements du store
    }
    if (key === null || key === undefined) {
      return `${realStoreName}:*`; // Par défaut, tous les changements
    }
    return `${realStoreName}:${key}`; // Changement spécifique
  }, [store, key, subscribeToAll]);

  // ✅ Fonction de rafraîchissement manuel
  const refresh = useCallback(async () => {
    // ✅ PHASE 12.2 : Ne pas logger refresh (réduit spam)
    hasLoadedRef.current = false; // Réinitialiser pour forcer rechargement
    
    // ✅ CORRECTION : Recharger directement sans dépendre de loadInitialData
    try {
      setLoading(true);
      setError(null);

      const realStoreName = getStoreName(store);
      const repository = await getNutritionRepository();
      
      if (subscribeToAll || key === null || key === undefined) {
        const allData = await repository.getAll(realStoreName, { 
          operationName: `useRepositoryObserver:getAll:${store}`,
          quiet: true
        });
        if (isMountedRef.current) {
          setData(allData || []);
          hasLoadedRef.current = true;
          setLoading(false);
        }
      } else {
        const entry = await repository.get(realStoreName, key, { 
          operationName: `useRepositoryObserver:get:${store}:${key}`,
          quiet: true
        });
        if (isMountedRef.current) {
          setData(entry);
          hasLoadedRef.current = true;
          setLoading(false);
        }
      }
    } catch (err) {
      log.error('[useRepositoryObserver] Erreur refresh:', err);
      if (isMountedRef.current) {
        setError(err);
        setData(initialValue);
        setLoading(false);
        hasLoadedRef.current = true;
      }
    }
  }, [store, key, subscribeToAll, initialValue]);

  // ✅ Charger données initiales
  // ✅ CORRECTION : Logique directement dans useEffect pour éviter boucle infinie
  // ✅ OPTIMISATION : Chargement conditionnel basé sur visibilité (économise 60-80% requêtes si section inactive)
  useEffect(() => {
    // ✅ OPTIMISATION : Ne pas charger si disabled (section non visible)
    if (!enabled) {
      // Si disabled, garder données initiales et ne pas charger
      setLoading(false);
      hasLoadedRef.current = true; // Marquer comme "chargé" pour éviter re-tentatives
      return; // Sortir immédiatement
    }

    // ✅ CORRECTION : Réinitialiser hasLoadedRef quand dépendances changent
    hasLoadedRef.current = false;
    isMountedRef.current = true;
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ PHASE 12.2 : Convertir nom simplifié en nom réel IndexedDB
        const realStoreName = getStoreName(store);
        
        // ✅ CORRECTION : Gérer erreur si repository non disponible avec timeout
        let repository;
        try {
          // ✅ CORRECTION : Timeout pour éviter blocage indéfini (3 secondes)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: Repository initialization took too long')), 3000);
          });
          
          repository = await Promise.race([
            getNutritionRepository(),
            timeoutPromise
          ]);
        } catch (repoError) {
          log.error('[useRepositoryObserver] Erreur obtention repository:', repoError);
          // ✅ CORRECTION : Ne pas throw, utiliser fallback pour éviter loading perpétuel
          if (!cancelled && isMountedRef.current) {
            setError(repoError);
            setData(initialValue);
            setLoading(false);
            hasLoadedRef.current = true;
          }
          return; // Sortir de la fonction
        }
        
        // ✅ CORRECTION : Vérifier que repository est valide
        if (!repository) {
          log.error('[useRepositoryObserver] Repository est null');
          if (!cancelled && isMountedRef.current) {
            setError(new Error('Repository non disponible'));
            setData(initialValue);
            setLoading(false);
            hasLoadedRef.current = true;
          }
          return;
        }
        
        // ✅ PHASE 12.2 : Utiliser quiet: true pour Observer (réduit spam logs)
        if (subscribeToAll || key === null || key === undefined) {
          // Charger toutes les entrées du store
          const allData = await repository.getAll(realStoreName, { 
            operationName: `useRepositoryObserver:getAll:${store}`,
            quiet: true // ✅ Réduire logs pour Observer
          });
          if (!cancelled && isMountedRef.current) {
            setData(allData || []);
            hasLoadedRef.current = true;
            setLoading(false);
          }
        } else {
          // Charger entrée spécifique
          const entry = await repository.get(realStoreName, key, { 
            operationName: `useRepositoryObserver:get:${store}:${key}`,
            quiet: true // ✅ Réduire logs pour Observer
          });
          if (!cancelled && isMountedRef.current) {
            setData(entry);
            hasLoadedRef.current = true;
            setLoading(false);
          }
        }
      } catch (err) {
        log.error('[useRepositoryObserver] Erreur chargement initial:', err);
        if (!cancelled && isMountedRef.current) {
          setError(err);
          setData(initialValue); // Fallback vers valeur initiale
          setLoading(false); // ✅ CORRECTION : Toujours mettre loading à false même en cas d'erreur
          hasLoadedRef.current = true; // ✅ CORRECTION : Marquer comme chargé pour éviter boucle infinie
        }
      }
    };

    loadData();

    // ✅ CORRECTION : Fallback timeout global (10 secondes max)
    const fallbackTimeout = setTimeout(() => {
      if (!cancelled && isMountedRef.current && hasLoadedRef.current === false) {
        log.warn('[useRepositoryObserver] Timeout fallback: Forcer loading à false', { store, key });
        setLoading(false);
        setData(initialValue);
        hasLoadedRef.current = true;
      }
    }, 10000);

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      clearTimeout(fallbackTimeout);
    };
  }, [store, key, subscribeToAll, initialValue, enabled]); // ✅ OPTIMISATION : Ajouter enabled dans dépendances

  // ✅ S'abonner aux changements
  // ✅ OPTIMISATION : S'abonner seulement si enabled (évite subscriptions inutiles)
  useEffect(() => {
    // ✅ OPTIMISATION : Ne pas s'abonner si disabled
    if (!enabled) {
      // Si disabled, ne pas s'abonner aux changements
      return;
    }

    isMountedRef.current = true;
    
    // Obtenir l'instance de l'observer
    const observer = getRepositoryObserver();
    observerRef.current = observer;

    const keyToSubscribe = subscriptionKey();

    // ✅ Callback de notification
    const handleChange = (newData) => {
      if (!isMountedRef.current) {
        return; // Ignorer si composant démonté
      }

      try {
        // Mettre à jour l'état
        setData(newData);
        setError(null); // Clear error si données reçues

        // Appeler callback personnalisé si fourni
        if (onChange && typeof onChange === 'function') {
          onChange(newData);
        }

        // ✅ PHASE 12.2 : Ne pas logger mises à jour automatiques (réduit spam)
      } catch (error) {
        log.error('[useRepositoryObserver] Erreur dans handleChange:', error);
        if (isMountedRef.current) {
          setError(error);
        }
      }
    };

    // S'abonner
    const unsubscribe = observer.subscribe(keyToSubscribe, handleChange);
    unsubscribeRef.current = unsubscribe;

    // ✅ PHASE 12.2 : Ne pas logger abonnement (réduit spam)

    // ✅ Cleanup au unmount
    return () => {
      isMountedRef.current = false;
      
          if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
            unsubscribeRef.current();
            // ✅ PHASE 12.2 : Ne pas logger désabonnement (réduit spam)
          }
    };
  }, [store, key, subscriptionKey, onChange, enabled]); // ✅ OPTIMISATION : Ajouter enabled dans dépendances

  return [data, refresh, { loading, error }];
};

/**
 * ✅ PHASE 12.2 : Hook spécialisé pour s'abonner à un dailyMeal spécifique
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {Object} options - Options (voir useRepositoryObserver)
 * @returns {[Object|null, Function]} [dailyMeal, refresh]
 */
export const useDailyMeal = (date, options = {}) => {
  return useRepositoryObserver('dailyMeals', date, options);
};

/**
 * ✅ PHASE 12.2 : Hook spécialisé pour s'abonner aux meals d'une date
 * 
 * Note: Les meals ont une clé primaire `id`, pas `date`. 
 * On s'abonne à tous les meals (`meals:*`) et on filtre par date côté composant.
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {Object} options - Options (voir useRepositoryObserver)
 * @returns {[Array, Function, Object]} [meals, refresh, { loading, error }]
 */
export const useMealsByDate = (date, options = {}) => {
  const { enabled = true, onChange = null } = options;
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled || !date) {
      setMeals([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const dayMeals = await getMealsByDate(date);
      if (!isMountedRef.current) return;
      const list = Array.isArray(dayMeals) ? dayMeals : [];
      setMeals(list);
      onChange?.(list);
    } catch (err) {
      log.error('[useMealsByDate] Erreur chargement:', err);
      if (isMountedRef.current) {
        setError(err);
        setMeals([]);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [date, enabled, onChange]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    refresh();
    const observer = getRepositoryObserver();
    const storeKey = `${getStoreName('meals')}:*`;
    const unsubscribe = observer.subscribe(storeKey, () => {
      refresh();
    });
    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [enabled, refresh]);

  return [meals, refresh, { loading, error }];
};

/**
 * ✅ PHASE 12.2 : Hook spécialisé pour s'abonner à un meal spécifique
 * 
 * @param {string} mealId - ID du meal
 * @param {Object} options - Options (voir useRepositoryObserver)
 * @returns {[Object|null, Function]} [meal, refresh]
 */
export const useMeal = (mealId, options = {}) => {
  return useRepositoryObserver('meals', mealId, options);
};

/**
 * ✅ PHASE 12.2 : Hook spécialisé pour s'abonner au programme actif
 * 
 * Note: Les programmes n'ont pas de clé 'active'. On charge tous les programmes
 * et on filtre pour trouver celui avec isActive === true.
 * 
 * @param {Object} options - Options (voir useRepositoryObserver)
 * @returns {[Object|null, Function, Object]} [activeProgram, refresh, { loading, error }]
 */
export const useActiveProgram = (options = {}) => {
  const { enabled = true, onChange = null } = options;
  const [activeProgram, setActiveProgram] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActiveProgram(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const program = await fetchActiveProgram({ skipCache: true });
      if (!isMountedRef.current) return;
      setActiveProgram(program || null);
      onChange?.(program || null);
    } catch (err) {
      log.error('[useActiveProgram] Erreur chargement:', err);
      if (isMountedRef.current) {
        setError(err);
        setActiveProgram(null);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [enabled, onChange]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    refresh();
    const observer = getRepositoryObserver();
    const storeKey = `${getStoreName('programs')}:*`;
    const unsubscribe = observer.subscribe(storeKey, () => {
      refresh();
    });
    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [enabled, refresh]);

  return [activeProgram, refresh, { loading, error }];
};

/**
 * ✅ PHASE 12.2 : Hook spécialisé pour s'abonner à un hydrationLog spécifique
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {Object} options - Options (voir useRepositoryObserver)
 * @returns {[Object|null, Function]} [hydrationLog, refresh]
 */
export const useHydrationLog = (date, options = {}) => {
  return useRepositoryObserver('hydrationLog', date, options);
};


