/**
 * useNutritionHealthScore.js
 * 
 * Hook React pour le calcul et l'affichage du Score Santé Globale.
 * 
 * Charge toutes les données nécessaires (nutrition, workouts, Garmin, gamification)
 * et calcule le score santé global avec ses sous-scores, tendances et recommandations.
 * 
 * @module hooks/useNutritionHealthScore
 * @see ../../nouvelongletnutritionplan.md Section 5.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { useNutritionGamification } from './useNutritionGamification';
import { calculateGlobalHealthScore } from '../services/nutrition/nutritionHealthScore';
import { DateHelper } from '../utils/dateHelper';
import logger from '../utils/logger';

const log = logger.module('useNutritionHealthScore');

/**
 * Hook pour le score santé global
 * 
 * @param {Object} options - Options
 * @param {boolean} options.autoRefresh - Rafraîchir automatiquement (défaut: true)
 * @param {number} options.refreshInterval - Intervalle de rafraîchissement en ms (défaut: 5min)
 * @returns {Object} État et résultats du score santé
 */
export const useNutritionHealthScore = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const { 
    dbReady: nutritionDbReady, 
    getDailyMealsByRange,
    getAllMeals,
    getAllPrograms
  } = useNutritionData();
  
  const { 
    dbReady: garminDbReady, 
    loadDataByRange,
    getDailyMetrics
  } = useGarminData();

  const { 
    gamificationState 
  } = useNutritionGamification();

  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Charge et calcule le score santé global
   */
  const loadHealthScore = useCallback(async () => {
    if (!nutritionDbReady) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      log.debug('Chargement données pour score santé global');

      // 1. Charger données nutrition (7 derniers jours pour score nutrition)
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const today = DateHelper.getTodayLocal();
      const nutritionStartStr = DateHelper.getDaysAgoLocal(7);
      const nutritionEndStr = today;

      const [dailyMeals, allMeals, programs] = await Promise.all([
        getDailyMealsByRange(nutritionStartStr, nutritionEndStr),
        getAllMeals(),
        getAllPrograms()
      ]);

      const activeProgram = programs.find(p => p.isActive) || null;

      // 2. Charger données workouts (30 derniers jours pour score workout)
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const workoutStartStr = DateHelper.getDaysAgoLocal(30);
      const workoutEndStr = today;

      let garminData = { activities: {}, dailyMetrics: {} };
      if (garminDbReady) {
        try {
          garminData = await loadDataByRange(workoutStartStr, workoutEndStr);
        } catch (garminErr) {
          log.warn('Erreur chargement données Garmin pour score santé:', garminErr);
          // Continuer sans données Garmin (scores seront neutres)
        }
      }

      // Transformer activités Garmin en format uniforme pour score workout
      const workouts = [];
      const activities = garminData?.activities || {};
      Object.entries(activities).forEach(([type, typeActivities]) => {
        if (!Array.isArray(typeActivities)) return;
        
        typeActivities.forEach(activity => {
          if (!activity.timestamp && !activity.date) return;
          
          workouts.push({
            id: activity.id || `garmin_${type}_${activity.timestamp || activity.date}`,
            timestamp: activity.timestamp || `${activity.date}T12:00:00Z`,
            date: normalizeDate(activity.timestamp || activity.date),
            type: type,
            duration: activity.duration || null,
            calories: activity.calories || null
          });
        });
      });

      // 3. Préparer données pour calcul
      const nutritionData = {
        dailyMeals: dailyMeals || [],
        meals: allMeals || [],
        activeProgram
      };

      const workoutsData = {
        workouts
      };

      const garminRecoveryData = {
        dailyMetrics: garminData.dailyMetrics || {}
      };

      const gamificationData = gamificationState || {};

      // 4. Calculer score santé global
      const score = calculateGlobalHealthScore({
        nutrition: nutritionData,
        workouts: workoutsData,
        garmin: garminRecoveryData,
        gamification: gamificationData,
        muscleBalance: null // TODO: Intégrer muscle balance si disponible
      });

      setHealthScore(score);
      setLastUpdate(new Date());
      
      log.debug('Score santé global calculé:', {
        global: score.global,
        subScores: score.subScores,
        recommendationsCount: score.recommendations.length
      });

    } catch (err) {
      log.error('Erreur calcul score santé global:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [
    nutritionDbReady,
    garminDbReady,
    getDailyMealsByRange,
    getAllMeals,
    getAllPrograms,
    loadDataByRange,
    gamificationState
  ]);

  // Charger au montage et quand dépendances changent
  useEffect(() => {
    loadHealthScore();
  }, [loadHealthScore]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh || !healthScore) return;

    const interval = setInterval(() => {
      loadHealthScore();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadHealthScore, healthScore]);

  /**
   * Recharger manuellement
   */
  const refresh = useCallback(() => {
    loadHealthScore();
  }, [loadHealthScore]);

  // Mémoïsation pour éviter recalculs
  const memoizedScore = useMemo(() => healthScore, [healthScore]);

  return {
    healthScore: memoizedScore,
    loading,
    error,
    lastUpdate,
    refresh
  };
};

/**
 * Normalise une date (string ou Date) en format YYYY-MM-DD (timezone locale garantie)
 * 
 * ✅ OPTIMISATION : Utilise DateHelper pour garantir cohérence timezone
 */
function normalizeDate(date) {
  return DateHelper.toYYYYMMDD(date);
}

export default useNutritionHealthScore;

