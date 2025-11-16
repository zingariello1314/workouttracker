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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNutritionData } from './useNutritionData';
import {
  getGamificationData,
  checkAchievements,
  unlockAchievement,
  addExperience,
  calculateStreakWithForgiveness,
  updateStreak,
  resetStreak,
  XP_REWARDS,
  getXPForLevel
} from '../services/nutrition/nutritionGamification';
import { DateHelper } from '../utils/dateHelper';
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
    getMealsByDateRange,
    getAllPrograms
  } = useNutritionData();
  
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const isMountedRef = useRef(true);
  
  // ✅ OPTIMISATION 2 : Cache pour prepareUserData avec hash et TTL
  const userDataCacheRef = useRef(null);
  const cacheTTL = 5 * 60 * 1000; // 5 minutes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Charger données gamification
  useEffect(() => {
    if (!dbReady || !enabled) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    const loadGamification = async () => {
      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }
        
        const data = await getGamificationData();
        if (isMountedRef.current) {
          setGamificationData(data);
        }
      } catch (err) {
        log.error('Erreur chargement gamification:', err);
        if (isMountedRef.current) {
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadGamification();
  }, [dbReady, enabled]);

  // Préparer données utilisateur pour vérification badges
  // ✅ OPTIMISATION : Utiliser getMealsByDateRange au lieu de getAllMeals + cache Map pour éviter .filter()
  // ✅ OPTIMISATION 2 : Cache avec hash et TTL pour éviter recalculs
  const prepareUserData = useCallback(async () => {
    if (!dbReady) return null;

    try {
      // Charger données des 100 derniers jours (pour streaks)
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const today = DateHelper.getTodayLocal();
      const startDateStr = DateHelper.getDaysAgoLocal(100);
      const endDateStr = today;
      
      // ✅ OPTIMISATION 2 : Vérifier cache avant de charger
      const cacheKey = `userData_${startDateStr}_${endDateStr}`;
      const now = Date.now();
      
      if (userDataCacheRef.current && 
          userDataCacheRef.current.key === cacheKey &&
          (now - userDataCacheRef.current.timestamp) < cacheTTL) {
        return userDataCacheRef.current.data;
      }

      const [dailyMeals, meals, programs] = await Promise.all([
        getDailyMealsByRange(startDateStr, endDateStr),
        getMealsByDateRange(startDateStr, endDateStr), // ✅ OPT 1.1 : Charger seulement 100 jours au lieu de tous
        getAllPrograms()
      ]);

      // ✅ OPTIMISATION 1.2 : Créer Map mealsByDate pour accès O(1) au lieu de .filter() O(n)
      const mealsByDate = new Map();
      meals.forEach(meal => {
        if (!mealsByDate.has(meal.date)) {
          mealsByDate.set(meal.date, []);
        }
        mealsByDate.get(meal.date).push(meal);
      });

      // Calculer streaks avec Map pour accès O(1)
      const history = dailyMeals.map(dm => ({
        date: dm.date,
        hasMeals: (dm.mealIds?.length || 0) > 0,
        meals: mealsByDate.get(dm.date) || [] // ✅ Accès O(1) au lieu de .filter()
      }));

      const streak = calculateStreakWithForgiveness(history, 'nutrition');

      // ✅ OPTIMISATION 1.3 : Filtrer meals 7 derniers jours AVANT boucle
      const last7Days = dailyMeals.slice(-7);
      const last7DaysDateSet = new Set(last7Days.map(dm => dm.date));
      const uniqueFoods = new Set();
      
      // Parcourir seulement meals des 7 derniers jours
      meals.forEach(meal => {
        if (last7DaysDateSet.has(meal.date)) {
          meal.foods?.forEach(food => {
            if (food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        }
      });

      const activeProgram = programs?.find(p => p.isActive) || null;

      const userData = {
        nutritionHistory: dailyMeals.map(dm => ({
          date: dm.date,
          dailyTotals: dm.dailyTotals,
          complianceScore: dm.complianceScore,
          meals: mealsByDate.get(dm.date) || [] // ✅ Accès O(1) au lieu de .filter()
        })),
        streaks: {
          nutrition: streak
        },
        uniqueFoodsLast7Days: uniqueFoods.size,
        activeProgram
      };
      
      // ✅ OPTIMISATION 2 : Mettre en cache avec timestamp
      userDataCacheRef.current = {
        key: cacheKey,
        data: userData,
        timestamp: now
      };
      
      return userData;
    } catch (err) {
      log.error('Erreur préparation données utilisateur:', err);
      return null;
    }
  }, [dbReady, getDailyMealsByRange, getMealsByDateRange, getAllPrograms, cacheTTL]);

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

      // ✅ CORRECTION : Revérifier les badges déjà débloqués et supprimer ceux qui ne remplissent plus les conditions
      const { revalidateAchievements } = await import('../services/nutrition/nutritionGamification');
      await revalidateAchievements(userData, gamificationData.achievements);

      // Recharger données après revalidation
      const updatedDataAfterRevalidation = await getGamificationData();

      // Vérifier nouveaux badges (avec badges mis à jour après revalidation)
      const newBadgesToUnlock = checkAchievements(
        userData,
        updatedDataAfterRevalidation.achievements
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
        if (isMountedRef.current) {
          setGamificationData(updatedData);
          setNewBadges(unlocked);
        }

        return unlocked;
      } else {
        // Même si aucun nouveau badge, mettre à jour les données (après revalidation)
        if (isMountedRef.current && updatedDataAfterRevalidation.achievements.length !== gamificationData.achievements.length) {
          setGamificationData(updatedDataAfterRevalidation);
        }
      }

      return [];
    } catch (err) {
      log.error('Erreur vérification badges:', err);
      return [];
    }
  }, [dbReady, enabled, gamificationData, prepareUserData]);

  // Auto-vérification badges
  // ✅ OPTIMISATION 1.7 : Debounce pour éviter appels multiples
  const checkBadgesDebouncedRef = useRef(null);
  const debouncedCheckBadges = useCallback(() => {
    if (checkBadgesDebouncedRef.current) {
      clearTimeout(checkBadgesDebouncedRef.current);
    }
    checkBadgesDebouncedRef.current = setTimeout(() => {
      checkBadges();
    }, 500); // Debounce 500ms
  }, [checkBadges]);
  
  useEffect(() => {
    if (!autoCheck || !dbReady || !enabled || !gamificationData) {
      return;
    }

    // Vérifier badges après chargement initial avec debounce
    const timer = setTimeout(() => {
      debouncedCheckBadges();
    }, 2000); // Attendre 2s pour que les données soient chargées

    return () => {
      clearTimeout(timer);
      if (checkBadgesDebouncedRef.current) {
        clearTimeout(checkBadgesDebouncedRef.current);
      }
    };
  }, [autoCheck, dbReady, enabled, gamificationData, debouncedCheckBadges]);

  // ✅ CORRECTION : Flag pour éviter resetStreak multiple + optimisation chargement
  const streakResetRef = useRef(false);
  const streaksInitializedRef = useRef(false);
  
  // Calculer et mettre à jour streaks (une seule fois au chargement initial)
  useEffect(() => {
    if (!dbReady || !enabled || streaksInitializedRef.current) {
      return;
    }

    const updateStreaks = async () => {
      try {
        // ✅ OPTIMISATION : Ne pas invalider le cache inutilement - utiliser cache si disponible
        // Seulement invalider si on doit vraiment recalculer (après resetStreak)
        
        // ✅ CORRECTION : Réinitialiser la streak sauvegardée UNE SEULE FOIS au premier chargement
        if (!streakResetRef.current) {
          await resetStreak('nutrition');
          streakResetRef.current = true;
          // Invalider cache seulement après reset pour forcer recalcul
          userDataCacheRef.current = null;
        }
        
        const userData = await prepareUserData();
        if (!userData) {
          streaksInitializedRef.current = true; // Marquer comme initialisé même si pas de données
          return;
        }

        const streak = userData.streaks.nutrition;
        
        // Sauvegarder la streak recalculée
        await updateStreak({
          id: 'streak_nutrition',
          category: 'nutrition',
          ...streak
        });

        // Recharger données et mettre à jour
        const updatedData = await getGamificationData();
        if (isMountedRef.current) {
          setGamificationData(updatedData);
          streaksInitializedRef.current = true; // Marquer comme initialisé
        }
      } catch (err) {
        log.error('Erreur mise à jour streaks:', err);
        streaksInitializedRef.current = true; // Marquer comme initialisé même en cas d'erreur
      }
    };

    // Attendre que les données soient chargées (delay réduit pour charger plus vite)
    const timer = setTimeout(() => {
      updateStreaks();
    }, 500);

    return () => clearTimeout(timer);
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
        // Log supprimé pour éviter spam
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
  // ✅ OPTIMISATION 1.5 : Utiliser useMemo pour éviter recalculs + retourner valeur directement
  const levelProgress = useMemo(() => {
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
  }, [gamificationData?.experience]);

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
    getLevelProgress: levelProgress, // ✅ OPT 1.5 : Retourner valeur directement (fix bug)
    hasNewBadges: newBadges.length > 0,
    
    // Constantes
    XP_REWARDS,
    getXPForLevel
  };
};

