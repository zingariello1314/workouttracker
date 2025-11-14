/**
 * useNutritionChronobiology.js
 * 
 * Hook React pour l'analyse chronobiologique (timing optimal des repas).
 * 
 * Charge les données nutrition et workouts, puis analyse les corrélations
 * entre timing des repas et performance/récupération.
 * 
 * @module hooks/useNutritionChronobiology
 * @see ../../nouvelongletnutritionplan.md Section 5.1
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { analyzeChronobiology } from '../services/nutrition/nutritionChronobiology';
import logger from '../utils/logger';

const log = logger.module('useNutritionChronobiology');

/**
 * Hook pour l'analyse chronobiologique
 * 
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days', '30days', '90days', 'all')
 * @param {Date} options.startDate - Date de début (optionnel, si period = 'custom')
 * @param {Date} options.endDate - Date de fin (optionnel, si period = 'custom')
 * @returns {Object} État et résultats de l'analyse
 */
export const useNutritionChronobiology = (options = {}) => {
  const {
    period = '30days',
    startDate = null,
    endDate = null
  } = options;

  const { 
    dbReady: nutritionDbReady, 
    getAllMeals,
    getDailyMealsByRange 
  } = useNutritionData();
  
  const { 
    dbReady: garminDbReady, 
    loadDataByRange 
  } = useGarminData();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Calcule la plage de dates selon la période
   */
  const calculateDateRange = useCallback((period) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    
    switch (period) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      case 'all':
        start.setFullYear(2020, 0, 1); // Date très ancienne
        break;
      case 'custom':
        if (startDate && endDate) {
          return {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          };
        }
        // Fallback à 30 jours si custom sans dates
        start.setDate(start.getDate() - 30);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    start.setHours(0, 0, 0, 0);
    
    return {
      startDate: start,
      endDate: end
    };
  }, [startDate, endDate]);

  /**
   * Charge et prépare les données pour l'analyse
   */
  const loadData = useCallback(async () => {
    if (!nutritionDbReady || !garminDbReady) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateRange = calculateDateRange(period);
      
      log.debug('Chargement données chronobiologie:', { period, dateRange });

      // Charger repas
      const allMeals = await getAllMeals();
      
      // Filtrer repas par plage de dates
      const filteredMeals = allMeals.filter(meal => {
        if (!meal.timestamp) return false;
        const mealDate = new Date(meal.timestamp);
        return mealDate >= dateRange.startDate && mealDate <= dateRange.endDate;
      });

      // Charger activités Garmin par plage de dates
      const garminData = await loadDataByRange(
        dateRange.startDate.toISOString().split('T')[0],
        dateRange.endDate.toISOString().split('T')[0]
      );

      // Transformer activités Garmin en format uniforme
      const workouts = [];
      
      // Parcourir tous les types d'activités
      const activities = garminData?.activities || {};
      Object.entries(activities).forEach(([type, typeActivities]) => {
        if (!Array.isArray(typeActivities)) return;
        
        typeActivities.forEach(activity => {
          if (!activity.timestamp && !activity.date) return;
          
          workouts.push({
            id: activity.id || `garmin_${type}_${activity.timestamp || activity.date}`,
            timestamp: activity.timestamp || `${activity.date}T12:00:00Z`,
            type: type,
            // Métriques de performance
            rpe: activity.rpe || null,
            intensity: activity.intensity || activity.avgIntensity || null,
            calories: activity.calories || null,
            // Métriques de récupération
            recoveryScore: activity.recoveryScore || null,
            bodyBattery: activity.bodyBattery || null,
            stress: activity.stress || null,
            // Métadonnées
            duration: activity.duration || null,
            distance: activity.distance || null
          });
        });
      });

      log.debug('Données chargées:', { 
        mealsCount: filteredMeals.length, 
        workoutsCount: workouts.length 
      });

      // Analyser chronobiologie
      const result = analyzeChronobiology(
        {
          meals: filteredMeals,
          workouts: workouts
        },
        {
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
          }
        }
      );

      setAnalysis(result);
    } catch (err) {
      log.error('Erreur analyse chronobiologie:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [nutritionDbReady, garminDbReady, period, getAllMeals, loadDataByRange, calculateDateRange]);

  // Charger données au montage et quand dépendances changent
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Recharger l'analyse manuellement
   */
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Mémoïser les résultats pour éviter recalculs
  const memoizedAnalysis = useMemo(() => analysis, [analysis]);

  return {
    analysis: memoizedAnalysis,
    loading,
    error,
    refresh
  };
};

export default useNutritionChronobiology;

