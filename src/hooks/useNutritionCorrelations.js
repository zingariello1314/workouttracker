/**
 * useNutritionCorrelations.js
 * 
 * Hook React pour les analyses de corrélations nutritionnelles
 * 
 * @module hooks/useNutritionCorrelations
 */

import { useState, useEffect, useCallback } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { analyzeAllNutritionCorrelations } from '../services/nutrition/nutritionCorrelations';
import logger from '../utils/logger';

const log = logger.module('useNutritionCorrelations');

/**
 * Hook pour obtenir les corrélations nutritionnelles
 * 
 * @param {Object} options - Options
 * @param {number} options.minDays - Nombre minimum de jours requis (défaut: 10)
 * @param {number} options.maxDays - Nombre maximum de jours à analyser (défaut: 90)
 * @param {boolean} options.autoRefresh - Rafraîchir automatiquement (défaut: false)
 * @param {number} options.refreshInterval - Intervalle de rafraîchissement en ms (défaut: 5min)
 * @returns {Object} { correlations, loading, error, refresh, hasData }
 */
export const useNutritionCorrelations = (options = {}) => {
  const { 
    minDays = 10, 
    maxDays = 90, 
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 
  } = options;
  
  const { 
    dbReady: nutritionDbReady,
    getAllPrograms,
    getDailyMealsByRange
  } = useNutritionData();
  const { garminData, dbReady: garminDbReady } = useGarminData();
  
  const [correlations, setCorrelations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [nutritionDataCache, setNutritionDataCache] = useState(null);

  // Charger données nutrition pour analyse
  useEffect(() => {
    if (!nutritionDbReady) {
      return;
    }

    const loadNutritionData = async () => {
      try {
        // Charger données sur la période
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - maxDays);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];

        const [dailyMeals, programs] = await Promise.all([
          getDailyMealsByRange(startDateStr, endDateStr),
          getAllPrograms()
        ]);

        setNutritionDataCache({
          dailyMeals: dailyMeals || [],
          programs: programs || []
        });
      } catch (err) {
        log.error('Erreur chargement données nutrition:', err);
        setNutritionDataCache({
          dailyMeals: [],
          programs: []
        });
      }
    };

    loadNutritionData();
  }, [nutritionDbReady, maxDays, getDailyMealsByRange, getAllPrograms]);

  // Calculer corrélations
  const calculateCorrelations = useCallback(() => {
    if (!nutritionDbReady || !nutritionDataCache) {
      return null;
    }

    try {
      const result = analyzeAllNutritionCorrelations(
        nutritionDataCache,
        garminData,
        { minDays, maxDays }
      );

      return result;
    } catch (err) {
      log.error('Erreur calcul corrélations:', err);
      setError(err);
      return null;
    }
  }, [nutritionDataCache, garminData, nutritionDbReady, minDays, maxDays]);

  // Charger corrélations
  useEffect(() => {
    if (!nutritionDbReady || !nutritionDataCache) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = calculateCorrelations();
      
      if (result) {
        setCorrelations(result);
        setLastUpdate(new Date());
      } else {
        setCorrelations({
          error: 'Erreur calcul',
          correlations: {}
        });
      }
    } catch (err) {
      log.error('Erreur chargement corrélations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [nutritionDbReady, nutritionDataCache, calculateCorrelations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !nutritionDbReady || !nutritionDataCache) {
      return;
    }

    const interval = setInterval(() => {
      log.debug('Auto-refresh corrélations...');
      const result = calculateCorrelations();
      if (result) {
        setCorrelations(result);
        setLastUpdate(new Date());
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, nutritionDbReady, nutritionDataCache, calculateCorrelations]);

  // Fonction de rafraîchissement manuel
  const refresh = useCallback(async () => {
    if (!nutritionDbReady) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Recharger données
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - maxDays);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const [dailyMeals, programs] = await Promise.all([
        getDailyMealsByRange(startDateStr, endDateStr),
        getAllPrograms()
      ]);

      const updatedCache = {
        dailyMeals: dailyMeals || [],
        programs: programs || []
      };

      setNutritionDataCache(updatedCache);

      // Recalculer corrélations
      const result = analyzeAllNutritionCorrelations(
        updatedCache,
        garminData,
        { minDays, maxDays }
      );

      if (result) {
        setCorrelations(result);
        setLastUpdate(new Date());
      }
    } catch (err) {
      log.error('Erreur refresh corrélations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [nutritionDbReady, maxDays, getDailyMealsByRange, getAllPrograms, garminData, minDays]);

  // Helpers
  const getCorrelation = (key) => {
    if (!correlations?.correlations) return null;
    return correlations.correlations[key] || null;
  };

  const hasActionableCorrelations = () => {
    if (!correlations?.correlations) return false;
    return Object.values(correlations.correlations).some(c => c.actionable);
  };

  const getSignificantCorrelations = () => {
    if (!correlations?.correlations) return [];
    return Object.entries(correlations.correlations)
      .filter(([_, c]) => c.significant && !c.error)
      .map(([key, value]) => ({ key, ...value }));
  };

  return {
    // Données
    correlations: correlations?.correlations || {},
    metadata: {
      totalDays: correlations?.totalDays || 0,
      correlationsCount: correlations?.correlationsCount || 0,
      actionableCount: correlations?.actionableCount || 0,
      hasError: !!correlations?.error,
      errorMessage: correlations?.error || correlations?.message
    },
    
    // État
    loading,
    error,
    lastUpdate,
    
    // Actions
    refresh,
    
    // Helpers
    getCorrelation,
    hasActionableCorrelations: hasActionableCorrelations(),
    getSignificantCorrelations: getSignificantCorrelations(),
    
    // Métadonnées
    hasData: correlations && !correlations.error && Object.keys(correlations.correlations || {}).length > 0,
    hasGarminData: !!garminData
  };
};

