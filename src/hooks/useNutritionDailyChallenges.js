/**
 * useNutritionDailyChallenges.js
 * 
 * Hook pour gérer les défis nutritionnels quotidiens
 * 
 * @module hooks/useNutritionDailyChallenges
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { DateHelper } from '../utils/dateHelper';
import { calculateDailyChallenges } from '../services/nutrition/nutritionDailyChallenges';
import logger from '../utils/logger';

const log = {
  debug: (...args) => logger.debug('[useNutritionDailyChallenges]', ...args),
  info: (...args) => logger.info('[useNutritionDailyChallenges]', ...args),
  warn: (...args) => logger.warn('[useNutritionDailyChallenges]', ...args),
  error: (...args) => logger.error('[useNutritionDailyChallenges]', ...args)
};

/**
 * Hook pour obtenir les défis nutritionnels quotidiens
 * 
 * @param {Object} options - Options
 * @param {string} options.date - Date au format YYYY-MM-DD (défaut: aujourd'hui)
 * @param {boolean} options.autoRefresh - Rafraîchir automatiquement (défaut: true)
 * @returns {Object} { challenges, stats, loading, error, refresh }
 */
export const useNutritionDailyChallenges = (options = {}) => {
  const { date: targetDate, autoRefresh = true } = options;
  
  const { 
    dbReady: nutritionDbReady,
    getDailyMeal,
    getMealsByDate,
    getActiveProgram
  } = useNutritionData();
  
  const { 
    dbReady: garminDbReady,
    activities: garminActivities
  } = useGarminData();
  
  const [challenges, setChallenges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  
  // Date cible (aujourd'hui par défaut)
  const dateStr = useMemo(() => {
    if (targetDate) {
      return DateHelper.toYYYYMMDD(targetDate);
    }
    return DateHelper.getTodayLocal();
  }, [targetDate]);
  
  /**
   * Charge les données et calcule les défis
   */
  const loadChallenges = useCallback(async () => {
    if (!nutritionDbReady) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }
    
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // Charger données en parallèle
      const [dailyMeal, meals, activeProgram] = await Promise.all([
        getDailyMeal(dateStr),
        getMealsByDate(dateStr),
        getActiveProgram()
      ]);
      
      // Charger workouts du jour depuis Garmin
      const workouts = [];
      if (garminDbReady && garminActivities) {
        Object.values(garminActivities).forEach(typeActivities => {
          if (!Array.isArray(typeActivities)) return;
          
          typeActivities.forEach(activity => {
            const activityDate = DateHelper.toYYYYMMDD(activity.startTime || activity.timestamp || activity.date);
            if (activityDate === dateStr) {
              workouts.push(activity);
            }
          });
        });
      }
      
      // Calculer défis
      const challengesResult = calculateDailyChallenges(
        dateStr,
        dailyMeal,
        meals || [],
        activeProgram,
        workouts
      );
      
      if (isMountedRef.current) {
        setChallenges(challengesResult);
        setLoading(false);
      }
      
      log.debug('Défis calculés:', {
        date: dateStr,
        completed: challengesResult.stats.completed,
        total: challengesResult.stats.total,
        percentage: challengesResult.stats.percentage
      });
      
    } catch (err) {
      log.error('Erreur calcul défis:', err);
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [nutritionDbReady, garminDbReady, dateStr, getDailyMeal, getMealsByDate, getActiveProgram, garminActivities]);
  
  // Charger défis au montage et quand les dépendances changent
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoRefresh) {
      loadChallenges();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadChallenges, autoRefresh]);
  
  /**
   * Rafraîchir manuellement les défis
   */
  const refresh = useCallback(() => {
    loadChallenges();
  }, [loadChallenges]);
  
  return {
    challenges,
    stats: challenges?.stats || { completed: 0, total: 0, percentage: 0 },
    loading,
    error,
    refresh,
    date: dateStr
  };
};

export default useNutritionDailyChallenges;

