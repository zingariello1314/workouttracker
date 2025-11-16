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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNutritionData } from './useNutritionData';
import { useGarminData } from './useGarminData';
import { useNutritionGamification } from './useNutritionGamification';
import { calculateGlobalHealthScore } from '../services/nutrition/nutritionHealthScore';
import { getMealsByDateRange } from './nutritionDataCRUD';
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
  // ✅ OPTIMISATION 4.1 : Ref pour cleanup async operations (évite memory leaks)
  const isMountedRef = useRef(true);
  // ✅ OPTIMISATION 3.4 : Cache avec hash pour score santé (90-95% réduction calculs)
  const healthScoreCacheRef = useRef({ data: null, hash: null, timestamp: 0, TTL: 300000 });

  /**
   * Charge et calcule le score santé global
   */
  const loadHealthScore = useCallback(async () => {
    if (!nutritionDbReady) {
      return;
    }

    // ✅ CORRECTION 1 : Vérifier isMountedRef avant tous setState (évite memory leaks)
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      log.debug('Chargement données pour score santé global');

      // 1. Charger données nutrition (7 derniers jours pour score nutrition)
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const today = DateHelper.getTodayLocal();
      const nutritionStartStr = DateHelper.getDaysAgoLocal(7);
      const nutritionEndStr = today;

      // ✅ OPTIMISATION 1.3 : Utiliser getMealsByDateRange (seulement période nécessaire)
      const [dailyMeals, meals, programs] = await Promise.all([
        getDailyMealsByRange(nutritionStartStr, nutritionEndStr),
        getMealsByDateRange(nutritionStartStr, nutritionEndStr), // ✅ Seulement 7 jours au lieu de tous
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

      // ✅ OPTIMISATION 3.4 : Générer hash des données pour détecter changements (APRÈS chargement garminData)
      const dataHash = JSON.stringify({
        dailyMealsCount: dailyMeals?.length || 0,
        mealsCount: meals?.length || 0,
        programId: activeProgram?.id || null,
        gamificationXP: gamificationState?.experience?.currentXP || 0,
        garminActivitiesCount: garminData?.activities ? Object.keys(garminData.activities).length : 0
      });
      
      const cached = healthScoreCacheRef.current;
      const now = Date.now();
      
      // ✅ OPTIMISATION 3.4 : Vérifier cache : même hash + pas expiré
      if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
        if (isMountedRef.current) {
          setHealthScore(cached.data); // ✅ Utiliser cache (évite calculs coûteux)
          setLastUpdate(new Date());
          setLoading(false);
        }
        return;
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

      // ✅ OPTIMISATION 3.4 : Calculs (seulement si données changées ou cache expiré)
      // 3. Préparer données pour calcul
      const nutritionData = {
        dailyMeals: dailyMeals || [],
        meals: meals || [],
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

      // ✅ OPTIMISATION 3.4 : Mettre en cache
      healthScoreCacheRef.current = {
        data: score,
        hash: dataHash,
        timestamp: now,
        TTL: 300000 // 5 minutes
      };

      // ✅ OPTIMISATION 4.1 : Vérifier si composant toujours monté avant setState
      if (isMountedRef.current) {
        setHealthScore(score);
        setLastUpdate(new Date());
      }
      
      log.debug('Score santé global calculé:', {
        global: score.global,
        subScores: score.subScores,
        recommendationsCount: score.recommendations.length
      });

    } catch (err) {
      if (isMountedRef.current) {
        log.error('Erreur calcul score santé global:', err);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    nutritionDbReady,
    garminDbReady,
    getDailyMealsByRange,
    getAllPrograms,
    loadDataByRange,
    gamificationState
  ]);

  // ✅ OPTIMISATION 4.1 : Cleanup async operations (évite memory leaks)
  // Charger au montage et quand dépendances changent
  useEffect(() => {
    isMountedRef.current = true;
    loadHealthScore();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadHealthScore]);

  // ✅ OPTIMISATION 4.2 : Ref pour cleanup setInterval (évite memory leaks)
  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh || !healthScore) return;

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadHealthScore();
      }
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
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

