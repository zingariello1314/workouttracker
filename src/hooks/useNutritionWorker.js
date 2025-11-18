/**
 * useNutritionWorker.js
 * 
 * ✅ OPTIMISATION : Hook React pour utiliser Web Worker calculs nutrition
 * 
 * Fournit une interface simple pour exécuter des calculs lourds
 * dans un Web Worker, avec fallback automatique si non disponible.
 * 
 * @module hooks/useNutritionWorker
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { executeInWorker, isWorkerAvailable, terminateWorker } from '../services/nutrition/nutritionWorkerService';
import logger from '../utils/logger';

const log = logger.module('useNutritionWorker');

/**
 * Hook pour exécuter des calculs lourds dans un Web Worker
 * 
 * @param {Function} fallbackFn - Fonction de fallback si worker non disponible
 * @returns {Object} { execute, isAvailable, loading, error }
 */
export function useNutritionWorker(fallbackFn = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  
  // Vérifier disponibilité worker
  const isAvailable = isWorkerAvailable();
  
  // Cleanup au démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  /**
   * Exécute un calcul dans le worker
   * 
   * @param {string} type - Type de calcul
   * @param {Object} data - Données pour le calcul
   * @returns {Promise<any>} Résultat du calcul
   */
  const execute = useCallback(async (type, data) => {
    if (!isMountedRef.current) {
      return Promise.reject(new Error('Component unmounted'));
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeInWorker(type, data, fallbackFn);
      
      if (isMountedRef.current) {
        setLoading(false);
        return result;
      }
      
      return result;
    } catch (err) {
      log.error(`[useNutritionWorker] Erreur calcul ${type}:`, err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
      
      throw err;
    }
  }, [fallbackFn]);
  
  return {
    execute,
    isAvailable,
    loading,
    error
  };
}

/**
 * Hook spécialisé pour calculs batch de totaux journaliers
 * 
 * @param {Function} fallbackFn - Fonction de fallback
 * @returns {Function} Fonction pour calculer totaux batch
 */
export function useCalculateDailyTotalsBatch(fallbackFn) {
  const { execute, loading, error } = useNutritionWorker(fallbackFn);
  
  const calculateBatch = useCallback(async (mealsByDate, program) => {
    return execute('calculateDailyTotalsBatch', { mealsByDate, program });
  }, [execute]);
  
  return { calculateBatch, loading, error };
}

/**
 * Hook spécialisé pour statistiques nutrition
 * 
 * @param {Function} fallbackFn - Fonction de fallback
 * @returns {Function} Fonction pour calculer statistiques
 */
export function useGetNutritionStats(fallbackFn) {
  const { execute, loading, error } = useNutritionWorker(fallbackFn);
  
  const getStats = useCallback(async (dailyMeals, startDate, endDate) => {
    return execute('getNutritionStats', { dailyMeals, startDate, endDate });
  }, [execute]);
  
  return { getStats, loading, error };
}

/**
 * Hook spécialisé pour analyse complète de données
 * 
 * @param {Function} fallbackFn - Fonction de fallback
 * @returns {Function} Fonction pour traiter données analyse
 */
export function useProcessDataForAnalysis(fallbackFn) {
  const { execute, loading, error } = useNutritionWorker(fallbackFn);
  
  const processData = useCallback(async (data) => {
    return execute('processDataForAnalysis', data);
  }, [execute]);
  
  return { processData, loading, error };
}

