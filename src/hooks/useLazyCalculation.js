/**
 * useLazyCalculation.js
 * 
 * ✅ OPTIMISATION : Hook pour lazy evaluation de calculs optionnels
 * 
 * Fournit une interface simple pour ne calculer des données que si nécessaire
 * (par exemple, si une section est visible ou si des données sont requises).
 * 
 * Impact attendu : Économie sur calculs inutiles (ne calcule que si affiché)
 * 
 * @module hooks/useLazyCalculation
 */

import React, { useMemo, useState, useEffect } from 'react';
import logger from '../utils/logger';

const log = logger.module('useLazyCalculation');

/**
 * Hook pour lazy evaluation d'un calcul
 * 
 * Ne calcule que si la condition est vraie, sinon retourne null ou valeur par défaut.
 * 
 * @param {Function} calculationFn - Fonction de calcul (sera appelée seulement si condition vraie)
 * @param {boolean} condition - Condition pour exécuter le calcul (défaut: true)
 * @param {any} defaultValue - Valeur par défaut si condition fausse (défaut: null)
 * @param {Array} dependencies - Dépendances pour useMemo
 * @returns {any} Résultat du calcul ou defaultValue
 * 
 * @example
 * // Ne calcule stats que si section stats visible
 * const stats = useLazyCalculation(
 *   () => getNutritionStats(meals),
 *   activeTab === 'stats',
 *   null,
 *   [meals, activeTab]
 * );
 */
export function useLazyCalculation(calculationFn, condition = true, defaultValue = null, dependencies = []) {
  return useMemo(() => {
    if (!condition) {
      return defaultValue;
    }
    
    try {
      return calculationFn();
    } catch (error) {
      log.error('[useLazyCalculation] Erreur calcul:', error);
      return defaultValue;
    }
  }, [condition, ...dependencies]);
}

/**
 * Hook pour lazy evaluation d'un calcul asynchrone
 * 
 * Ne charge les données que si la condition est vraie.
 * 
 * @param {Function} asyncCalculationFn - Fonction async de calcul
 * @param {boolean} condition - Condition pour exécuter le calcul
 * @param {any} defaultValue - Valeur par défaut si condition fausse
 * @param {Array} dependencies - Dépendances
 * @returns {Object} { data, loading, error }
 * 
 * @example
 * // Ne charge corrélations que si section visible
 * const { data: correlations, loading } = useLazyAsyncCalculation(
 *   () => loadCorrelations(meals, workouts),
 *   activeTab === 'correlations',
 *   null,
 *   [meals, workouts, activeTab]
 * );
 */
export function useLazyAsyncCalculation(asyncCalculationFn, condition = true, defaultValue = null, dependencies = []) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!condition) {
      setData(defaultValue);
      setLoading(false);
      setError(null);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    asyncCalculationFn()
      .then(result => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          log.error('[useLazyAsyncCalculation] Erreur calcul async:', err);
          setError(err);
          setLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [condition, ...dependencies]);
  
  return { data, loading, error };
}

/**
 * Hook pour lazy evaluation avec cache
 * 
 * Cache le résultat et ne recalcule que si dépendances changent ET condition vraie.
 * 
 * @param {Function} calculationFn - Fonction de calcul
 * @param {boolean} condition - Condition pour exécuter le calcul
 * @param {any} defaultValue - Valeur par défaut si condition fausse
 * @param {Array} dependencies - Dépendances pour invalidation cache
 * @param {number} cacheTTL - TTL du cache en ms (défaut: 60000 = 1 minute)
 * @returns {any} Résultat du calcul ou defaultValue
 */
export function useLazyCalculationWithCache(
  calculationFn,
  condition = true,
  defaultValue = null,
  dependencies = [],
  cacheTTL = 60000
) {
  const cacheRef = React.useRef({ data: null, timestamp: 0, depsHash: null });
  
  return useMemo(() => {
    if (!condition) {
      return defaultValue;
    }
    
    // Générer hash des dépendances
    const depsHash = JSON.stringify(dependencies);
    const now = Date.now();
    const cached = cacheRef.current;
    
    // Vérifier cache : même hash + pas expiré
    if (cached.data !== null && cached.depsHash === depsHash && (now - cached.timestamp) < cacheTTL) {
      return cached.data;
    }
    
    // Calculer et mettre en cache
    try {
      const result = calculationFn();
      cacheRef.current = {
        data: result,
        timestamp: now,
        depsHash
      };
      return result;
    } catch (error) {
      log.error('[useLazyCalculationWithCache] Erreur calcul:', error);
      return defaultValue;
    }
  }, [condition, ...dependencies]);
}

