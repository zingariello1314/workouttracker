/**
 * useNutritionGamification.js
 * 
 * Hook React pour la gamification nutritionnelle :
 * - Badges & Achievements
 * - XP & Niveaux
 * - Streaks avec forgiveness
 * 
 * @module hooks/useNutritionGamification
 */

import { useState, useEffect, useCallback } from 'react';
import { useNutritionData } from './useNutritionData';
import {
  getGamificationData,
  checkAchievements,
  unlockAchievement,
  addExperience,
  calculateStreakWithForgiveness,
  updateStreak,
  XP_REWARDS,
  getXPForLevel
} from '../services/nutrition/nutritionGamification';
import logger from '../utils/logger';

const log = logger.module('useNutritionGamification');

/**
 * Hook principal pour la gamification nutritionnelle
 * 
 * @param {Object} options - Options
 * @param {boolean} options.enabled - Si la gamification est activée (défaut: true)
 * @param {boolean} options.autoCheck - Vérifier badges automatiquement (défaut: true)
 * @returns {Object} { achievements, experience, streaks, loading, error, checkBadges, addXP }
 */
export const useNutritionGamification = (options = {}) => {
  const { enabled = true, autoCheck = true } = options;
  
  const { 
    dbReady,
    getDailyMealsByRange,
    getAllMeals,
    getAllPrograms
  } = useNutritionData();
  
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  // Charger données gamification
  useEffect(() => {
    if (!dbReady || !enabled) {
      setLoading(false);
      return;
    }

    const loadGamification = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getGamificationData();
        setGamificationData(data);
      } catch (err) {
        log.error('Erreur chargement gamification:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadGamification();
  }, [dbReady, enabled]);

  // Préparer données utilisateur pour vérification badges
  const prepareUserData = useCallback(async () => {
    if (!dbReady) return null;

    try {
      // Charger données des 100 derniers jours (pour streaks)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 100);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const [dailyMeals, meals, programs] = await Promise.all([
        getDailyMealsByRange(startDateStr, endDateStr),
        getAllMeals(),
        getAllPrograms()
      ]);

      // Calculer streaks
      const history = dailyMeals.map(dm => ({
        date: dm.date,
        hasMeals: (dm.mealIds?.length || 0) > 0,
        meals: meals.filter(m => m.date === dm.date)
      }));

      const streak = calculateStreakWithForgiveness(history, 'nutrition');

      // Compter aliments uniques sur 7 jours
      const last7Days = dailyMeals.slice(-7);
      const uniqueFoods = new Set();
      meals.forEach(meal => {
        if (meal.date >= last7Days[0]?.date) {
          meal.foods?.forEach(food => {
            if (food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        }
      });

      const activeProgram = programs?.find(p => p.isActive) || null;

      return {
        nutritionHistory: dailyMeals.map(dm => ({
          date: dm.date,
          dailyTotals: dm.dailyTotals,
          complianceScore: dm.complianceScore,
          meals: meals.filter(m => m.date === dm.date)
        })),
        streaks: {
          nutrition: streak
        },
        uniqueFoodsLast7Days: uniqueFoods.size,
        activeProgram
      };
    } catch (err) {
      log.error('Erreur préparation données utilisateur:', err);
      return null;
    }
  }, [dbReady, getDailyMealsByRange, getAllMeals, getAllPrograms]);

  // Vérifier et débloquer nouveaux badges
  const checkBadges = useCallback(async () => {
    if (!dbReady || !enabled || !gamificationData) {
      return [];
    }

    try {
      const userData = await prepareUserData();
      if (!userData) {
        return [];
      }

      // Vérifier nouveaux badges
      const newBadgesToUnlock = checkAchievements(
        userData,
        gamificationData.achievements
      );

      if (newBadgesToUnlock.length > 0) {
        // Débloquer chaque badge
        const unlocked = [];
        for (const badge of newBadgesToUnlock) {
          const achievement = await unlockAchievement(badge, userData);
          if (achievement) {
            unlocked.push(achievement);
          }
        }

        // Recharger données
        const updatedData = await getGamificationData();
        setGamificationData(updatedData);
        setNewBadges(unlocked);

        return unlocked;
      }

      return [];
    } catch (err) {
      log.error('Erreur vérification badges:', err);
      return [];
    }
  }, [dbReady, enabled, gamificationData, prepareUserData]);

  // Auto-vérification badges
  useEffect(() => {
    if (!autoCheck || !dbReady || !enabled || !gamificationData) {
      return;
    }

    // Vérifier badges après chargement initial
    const timer = setTimeout(() => {
      checkBadges();
    }, 2000); // Attendre 2s pour que les données soient chargées

    return () => clearTimeout(timer);
  }, [autoCheck, dbReady, enabled, gamificationData, checkBadges]);

  // Calculer et mettre à jour streaks
  useEffect(() => {
    if (!dbReady || !enabled) {
      return;
    }

    const updateStreaks = async () => {
      try {
        const userData = await prepareUserData();
        if (!userData) return;

        const streak = userData.streaks.nutrition;
        
        // Sauvegarder streak
        await updateStreak({
          id: 'streak_nutrition',
          category: 'nutrition',
          ...streak
        });

        // Recharger données
        const updatedData = await getGamificationData();
        setGamificationData(updatedData);
      } catch (err) {
        log.error('Erreur mise à jour streaks:', err);
      }
    };

    updateStreaks();
  }, [dbReady, enabled, prepareUserData]);

  // Ajouter XP manuellement
  const addXP = useCallback(async (points, reason) => {
    if (!dbReady || !enabled || !gamificationData) {
      return false;
    }

    try {
      const result = await addExperience(
        points,
        reason,
        gamificationData.experience
      );

      if (result.leveledUp) {
        // Notification level up (sera géré par UI)
        log.info(`🎉 Level Up ! Niveau ${result.newLevel}`);
      }

      // Recharger données
      const updatedData = await getGamificationData();
      setGamificationData(updatedData);

      return result;
    } catch (err) {
      log.error('Erreur addXP:', err);
      return false;
    }
  }, [dbReady, enabled, gamificationData]);

  // Calculer progression vers prochain niveau
  const getLevelProgress = useCallback(() => {
    if (!gamificationData?.experience) {
      return {
        currentXP: 0,
        level: 1,
        xpForNextLevel: 100,
        xpProgress: 0,
        xpNeeded: 100,
        progressPercent: 0
      };
    }

    const { currentXP = 0, level = 1 } = gamificationData.experience;
    const xpForCurrentLevel = getXPForLevel(level);
    const xpForNextLevel = getXPForLevel(level + 1);
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - currentXP;
    const progressPercent = xpForNextLevel > xpForCurrentLevel
      ? ((xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100)
      : 100;

    return {
      currentXP,
      level,
      xpForNextLevel,
      xpProgress,
      xpNeeded,
      progressPercent: Math.min(100, Math.max(0, progressPercent))
    };
  }, [gamificationData]);

  return {
    // Données
    achievements: gamificationData?.achievements || [],
    experience: gamificationData?.experience || { currentXP: 0, level: 1 },
    streaks: gamificationData?.streaks || { nutrition: { current: 0, actual: 0 } },
    newBadges,
    
    // État
    loading,
    error,
    enabled,
    
    // Actions
    checkBadges,
    addXP,
    
    // Helpers
    getLevelProgress: getLevelProgress(),
    hasNewBadges: newBadges.length > 0,
    
    // Constantes
    XP_REWARDS,
    getXPForLevel
  };
};

