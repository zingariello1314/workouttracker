/**
 * useNutritionRecommendations.js
 * 
 * Hook React pour les recommandations nutritionnelles basées sur le système expert
 * 
 * @module hooks/useNutritionRecommendations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { generateNutritionAdvice, detectDeficiencies } from '../services/nutrition/nutritionExpertSystem';
import logger from '../utils/logger';

const log = logger.module('useNutritionRecommendations');

/**
 * Hook pour obtenir des recommandations nutritionnelles personnalisées
 * 
 * @param {Object} options - Options
 * @param {number} options.refreshInterval - Intervalle de rafraîchissement en ms (défaut: 5min)
 * @param {boolean} options.autoRefresh - Rafraîchir automatiquement (défaut: true)
 * @returns {Object} { recommendations, summary, loading, error, refresh }
 */
export const useNutritionRecommendations = (options = {}) => {
  const { refreshInterval = 5 * 60 * 1000, autoRefresh = true } = options;
  
  const { 
    dbReady: nutritionDbReady,
    getAllPrograms,
    getDailyMealsByRange,
    getAllMeals
  } = useNutritionData();
  const { garminData, dbReady: garminDbReady } = useGarminData();
  
  const [recommendations, setRecommendations] = useState(null);
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
        // Charger données des 7 derniers jours
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];

        const [dailyMeals, meals, programs] = await Promise.all([
          getDailyMealsByRange(startDateStr, endDateStr),
          getAllMeals(),
          getAllPrograms()
        ]);

        setNutritionDataCache({
          dailyMeals: dailyMeals || [],
          meals: meals || [],
          programs: programs || []
        });
      } catch (err) {
        log.error('Erreur chargement données nutrition:', err);
        setNutritionDataCache({
          dailyMeals: [],
          meals: [],
          programs: []
        });
      }
    };

    loadNutritionData();
  }, [nutritionDbReady, getDailyMealsByRange, getAllMeals, getAllPrograms]);

  // Programme actif
  const activeProgram = useMemo(() => {
    if (!nutritionDataCache?.programs) return null;
    return nutritionDataCache.programs.find(p => p.isActive) || null;
  }, [nutritionDataCache?.programs]);

  // Générer recommandations
  const generateRecommendations = useCallback(() => {
    try {
      if (!nutritionDbReady || !nutritionDataCache) {
        return null;
      }

      const advice = generateNutritionAdvice(
        nutritionDataCache,
        garminData,
        activeProgram
      );

      return advice;
    } catch (err) {
      log.error('Erreur génération recommandations:', err);
      setError(err);
      return null;
    }
  }, [nutritionDataCache, garminData, activeProgram, nutritionDbReady]);

  // Charger recommandations quand données disponibles
  useEffect(() => {
    if (!nutritionDbReady || !nutritionDataCache) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const advice = generateRecommendations();
      
      if (advice) {
        setRecommendations(advice);
        setLastUpdate(new Date());
      } else {
        setRecommendations({
          recommendations: [],
          summary: 'Données insuffisantes pour générer des recommandations.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      log.error('Erreur chargement recommandations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [nutritionDbReady, nutritionDataCache, generateRecommendations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !nutritionDbReady || !nutritionDataCache) {
      return;
    }

    const interval = setInterval(() => {
      log.debug('Auto-refresh recommandations...');
      const advice = generateRecommendations();
      if (advice) {
        setRecommendations(advice);
        setLastUpdate(new Date());
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, nutritionDbReady, nutritionDataCache, generateRecommendations]);

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
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const [dailyMeals, meals, programs] = await Promise.all([
        getDailyMealsByRange(startDateStr, endDateStr),
        getAllMeals(),
        getAllPrograms()
      ]);

      const updatedCache = {
        dailyMeals: dailyMeals || [],
        meals: meals || [],
        programs: programs || []
      };

      setNutritionDataCache(updatedCache);

      // Générer recommandations avec nouvelles données
      const activeProgram = updatedCache.programs?.find(p => p.isActive) || null;
      const advice = generateNutritionAdvice(updatedCache, garminData, activeProgram);

      if (advice) {
        setRecommendations(advice);
        setLastUpdate(new Date());
      }
    } catch (err) {
      log.error('Erreur refresh recommandations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [nutritionDbReady, getDailyMealsByRange, getAllMeals, getAllPrograms, garminData]);

  // Filtrer par priorité
  const getByPriority = (priority) => {
    if (!recommendations) return [];
    return recommendations.recommendations.filter(r => r.priority === priority);
  };

  // Filtrer par catégorie
  const getByCategory = (category) => {
    if (!recommendations) return [];
    return recommendations.recommendations.filter(r => r.category === category);
  };

  return {
    // Données
    recommendations: recommendations?.recommendations || [],
    summary: recommendations?.summary || '',
    timestamp: recommendations?.timestamp || null,
    dataQuality: recommendations?.dataQuality || null,
    
    // État
    loading,
    error,
    lastUpdate,
    
    // Actions
    refresh,
    
    // Helpers
    getByPriority,
    getByCategory,
    
    // Métadonnées
    hasRecommendations: recommendations?.recommendations?.length > 0,
    highPriorityCount: getByPriority('high').length,
    mediumPriorityCount: getByPriority('medium').length,
    lowPriorityCount: getByPriority('low').length
  };
};

/**
 * Hook pour détecter les carences nutritionnelles
 * 
 * @returns {Object} { deficiencies, loading, error }
 */
export const useNutritionDeficiencies = () => {
  const { 
    dbReady, 
    getAllPrograms,
    getDailyMealsByRange,
    getAllMeals
  } = useNutritionData();
  const [deficiencies, setDeficiencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutritionDataCache, setNutritionDataCache] = useState(null);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger données des 7 derniers jours
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];

        const [dailyMeals, meals, programs] = await Promise.all([
          getDailyMealsByRange(startDateStr, endDateStr),
          getAllMeals(),
          getAllPrograms()
        ]);

        const cache = {
          dailyMeals: dailyMeals || [],
          meals: meals || [],
          programs: programs || []
        };

        setNutritionDataCache(cache);

        const activeProgram = cache.programs?.find(p => p.isActive) || null;
        const detected = detectDeficiencies(cache, activeProgram);
        setDeficiencies(detected);
      } catch (err) {
        log.error('Erreur détection carences:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dbReady, getDailyMealsByRange, getAllMeals, getAllPrograms]);

  return {
    deficiencies,
    loading,
    error,
    hasDeficiencies: deficiencies.length > 0
  };
};

