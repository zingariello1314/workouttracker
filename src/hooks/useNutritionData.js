/**
 * useNutritionData.js
 * 
 * Hook principal pour la gestion des données Nutrition
 * 
 * Ce hook délègue toutes les opérations aux modules spécialisés :
 * - `nutritionDataUtils` : Utilitaires IndexedDB (openDB, stores)
 * - `nutritionDataCRUD` : Opérations CRUD (get, save, delete)
 * - `nutritionCalculations` : Calculs (totaux, conformité, statistiques)
 * 
 * Le hook gère :
 * - L'état `dbReady` (initialisation IndexedDB)
 * - Les opérations CRUD avec debounce pour sauvegarde
 * - Les calculs automatiques (totaux journaliers)
 * - L'export/import JSON (pour SettingsTab)
 * 
 * @module hooks/useNutritionData
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { openNutritionDB, isNutritionDBReady } from './nutritionDataUtils';
import {
  // DailyMeals
  getDailyMeal,
  saveDailyMeal,
  getDailyMealsByRange,
  deleteDailyMeal,
  // Meals
  getMeal,
  saveMeal,
  getMealsByDate,
  getMealsByDailyMealId,
  getAllMeals,
  deleteMeal,
  saveMealsBatch,
  // Programs
  getAllPrograms,
  getActiveProgram,
  saveProgram,
  deleteProgram,
  // FavoriteFoods
  getFavoriteFoods,
  getFavoriteFood,
  saveFavoriteFood,
  deleteFavoriteFood,
  // Hydration
  getHydrationLog,
  saveHydrationLog,
  addWaterIntake,
  getHydrationLogByRange,
  deleteHydrationLog
} from './nutritionDataCRUD';
import { getGamificationData } from '../services/nutrition/nutritionGamification';
import {
  calculateDailyTotals,
  calculateCaloricBalance,
  calculateProgramCompliance,
  getNutritionStats,
  getMacroDistribution,
  generateMealId,
  generateProgramId,
  generateFavoriteFoodId,
  formatDate
} from './nutritionCalculations';

/**
 * Hook principal pour la gestion des données Nutrition
 * 
 * @returns {Object} Interface du hook
 * @returns {boolean} returns.dbReady - Si la base de données est prête
 * @returns {Function} returns.getDailyMeal - Récupère les données d'un jour
 * @returns {Function} returns.saveDailyMeal - Sauvegarde un jour
 * @returns {Function} returns.getMealsByDate - Récupère les repas d'un jour
 * @returns {Function} returns.saveMeal - Sauvegarde un repas
 * @returns {Function} returns.calculateDailyTotals - Calcule les totaux journaliers
 * @returns {Function} returns.getAllPrograms - Récupère tous les programmes
 * @returns {Function} returns.getActiveProgram - Récupère le programme actif
 * @returns {Function} returns.saveProgram - Sauvegarde un programme
 * @returns {Function} returns.getFavoriteFoods - Récupère les aliments favoris
 * @returns {Function} returns.exportAll - Exporte toutes les données
 * 
 * @example
 * const { saveMeal, getDailyMeal, dbReady } = useNutritionData();
 * if (dbReady) {
 *   await saveMeal(mealData);
 *   const daily = await getDailyMeal('2025-01-15');
 * }
 */
export const useNutritionData = () => {
  const [dbReady, setDbReady] = useState(false);
  const debounceTimerRef = useRef(null);

  // Initialisation IndexedDB
  useEffect(() => {
    openNutritionDB()
      .then((db) => {
        if (db) {
          setDbReady(true);
          console.log('[useNutritionData] IndexedDB initialisée');
        } else {
          console.warn('[useNutritionData] IndexedDB non disponible');
          setDbReady(false);
        }
      })
      .catch((err) => {
        console.error('[useNutritionData] Erreur initialisation DB:', err);
        setDbReady(false);
      });
  }, []);

  // ==================== DAILY MEALS ====================

  /**
   * Récupère les données d'un jour avec recalcul automatique des totaux
   * 
   * @param {string} date - Date au format "YYYY-MM-DD"
   * @param {Object} options - Options
   * @param {boolean} options.recalculateTotals - Si true, recalcule les totaux depuis les meals
   * @returns {Promise<Object|null>} Données du jour ou null
   */
  const getDailyMealWithTotals = useCallback(async (date, options = {}) => {
    if (!dbReady) return null;

    try {
      // Récupérer dailyMeal
      let dailyMeal = await getDailyMeal(date);
      
      // Si recalcul demandé ou dailyMeal inexistant, calculer depuis meals
      if (options.recalculateTotals || !dailyMeal) {
        const [meals, activeProgram, hydrationLog] = await Promise.all([
          getMealsByDate(date),
          getActiveProgram(),
          getHydrationLog(date).catch(() => null) // Ne pas bloquer si erreur
        ]);
        
        // Calculer totaux depuis meals
        const dailyTotals = calculateDailyTotals(meals, activeProgram);
        
        // Intégrer hydratation depuis hydrationLog (si disponible)
        if (hydrationLog && hydrationLog.waterIntake) {
          dailyTotals.waterIntake = hydrationLog.waterIntake;
          // Utiliser targetWater depuis hydrationLog si défini, sinon depuis programme
          if (hydrationLog.targetWater) {
            dailyTotals.targetWater = hydrationLog.targetWater;
          }
          // Recalculer complianceWater
          dailyTotals.complianceWater = dailyTotals.waterIntake - dailyTotals.targetWater;
        }
        
        // Créer ou mettre à jour dailyMeal
        if (!dailyMeal) {
          dailyMeal = {
            date,
            lastModified: new Date().toISOString(),
            programId: activeProgram?.id || null,
            isComplete: false,
            isCatchup: false,
            mealIds: meals.map(m => m.id),
            dailyTotals
          };
        } else {
          dailyMeal.dailyTotals = dailyTotals;
          dailyMeal.mealIds = meals.map(m => m.id);
          dailyMeal.lastModified = new Date().toISOString();
        }
        
        // Sauvegarder si modifié
        if (options.recalculateTotals) {
          await saveDailyMeal(dailyMeal);
        }
      } else if (dailyMeal && dailyMeal.dailyTotals) {
        // Même si pas de recalcul, intégrer hydratation si disponible
        const hydrationLog = await getHydrationLog(date).catch(() => null);
        if (hydrationLog && hydrationLog.waterIntake) {
          dailyMeal.dailyTotals.waterIntake = hydrationLog.waterIntake;
          if (hydrationLog.targetWater) {
            dailyMeal.dailyTotals.targetWater = hydrationLog.targetWater;
          }
          dailyMeal.dailyTotals.complianceWater = dailyMeal.dailyTotals.waterIntake - dailyMeal.dailyTotals.targetWater;
        }
      }
      
      return dailyMeal;
    } catch (error) {
      console.error('[useNutritionData] Erreur getDailyMealWithTotals:', error);
      return null;
    }
  }, [dbReady]);

  /**
   * Sauvegarde un dailyMeal avec debounce
   * 
   * @param {Object} dailyMeal - Données du jour
   * @param {boolean} immediate - Si true, sauvegarde immédiate (pas de debounce)
   * @returns {Promise<boolean>} true si succès
   */
  const saveDailyMealDebounced = useCallback(async (dailyMeal, immediate = false) => {
    if (!dbReady) return false;

    if (immediate) {
      return await saveDailyMeal(dailyMeal);
    }

    // Debounce 1 seconde
    return new Promise((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const result = await saveDailyMeal(dailyMeal);
        resolve(result);
      }, 1000);
    });
  }, [dbReady]);

  // ==================== MEALS ====================

  /**
   * Sauvegarde un repas et met à jour automatiquement les totaux du jour
   * 
   * @param {Object} meal - Données du repas
   * @param {boolean} updateDailyTotals - Si true, recalcule les totaux du jour
   * @returns {Promise<boolean>} true si succès
   */
  const saveMealAndUpdateTotals = useCallback(async (meal, updateDailyTotals = true) => {
    if (!dbReady) return false;

    try {
      // Générer ID si absent
      if (!meal.id) {
        meal.id = generateMealId();
      }

      // S'assurer que date et dailyMealId sont présents
      if (!meal.date) {
        meal.date = formatDate(new Date());
      }
      if (!meal.dailyMealId) {
        meal.dailyMealId = meal.date;
      }

      // Sauvegarder le repas
      const saved = await saveMeal(meal);
      if (!saved) return false;

      // Mettre à jour les totaux du jour si demandé
      if (updateDailyTotals) {
        const meals = await getMealsByDate(meal.date);
        const activeProgram = await getActiveProgram();
        const dailyTotals = calculateDailyTotals(meals, activeProgram);

        // Récupérer ou créer dailyMeal
        let dailyMeal = await getDailyMeal(meal.date);
        if (!dailyMeal) {
          dailyMeal = {
            date: meal.date,
            lastModified: new Date().toISOString(),
            programId: activeProgram?.id || null,
            isComplete: false,
            isCatchup: false,
            mealIds: meals.map(m => m.id),
            dailyTotals
          };
        } else {
          dailyMeal.dailyTotals = dailyTotals;
          dailyMeal.mealIds = meals.map(m => m.id);
          dailyMeal.lastModified = new Date().toISOString();
        }

        // Sauvegarder dailyMeal (debounced)
        await saveDailyMealDebounced(dailyMeal);
      }

      return true;
    } catch (error) {
      console.error('[useNutritionData] Erreur saveMealAndUpdateTotals:', error);
      return false;
    }
  }, [dbReady, saveDailyMealDebounced]);

  /**
   * Supprime un repas et met à jour les totaux du jour
   * 
   * @param {string} mealId - ID du repas
   * @returns {Promise<boolean>} true si succès
   */
  const deleteMealAndUpdateTotals = useCallback(async (mealId) => {
    if (!dbReady) return false;

    try {
      // Récupérer le repas pour connaître sa date
      const meal = await getMeal(mealId);
      if (!meal) return false;

      const date = meal.date;

      // Supprimer le repas
      const deleted = await deleteMeal(mealId);
      if (!deleted) return false;

      // Mettre à jour les totaux du jour
      const meals = await getMealsByDate(date);
      const activeProgram = await getActiveProgram();
      const dailyTotals = calculateDailyTotals(meals, activeProgram);

      // Mettre à jour dailyMeal
      let dailyMeal = await getDailyMeal(date);
      if (dailyMeal) {
        dailyMeal.dailyTotals = dailyTotals;
        dailyMeal.mealIds = meals.map(m => m.id);
        dailyMeal.lastModified = new Date().toISOString();
        await saveDailyMealDebounced(dailyMeal);
      }

      return true;
    } catch (error) {
      console.error('[useNutritionData] Erreur deleteMealAndUpdateTotals:', error);
      return false;
    }
  }, [dbReady, saveDailyMealDebounced]);

  // ==================== PROGRAMS ====================

  /**
   * Active un programme (désactive automatiquement les autres)
   * 
   * @param {string} programId - ID du programme à activer
   * @returns {Promise<boolean>} true si succès
   */
  const activateProgram = useCallback(async (programId) => {
    if (!dbReady) return false;

    try {
      // Récupérer le programme
      const programs = await getAllPrograms();
      const program = programs.find(p => p.id === programId);
      
      if (!program) {
        console.error('[useNutritionData] Programme non trouvé:', programId);
        return false;
      }

      // Activer ce programme (saveProgram désactivera automatiquement les autres)
      program.isActive = true;
      program.startDate = program.startDate || formatDate(new Date());
      
      return await saveProgram(program);
    } catch (error) {
      console.error('[useNutritionData] Erreur activateProgram:', error);
      return false;
    }
  }, [dbReady]);

  /**
   * Désactive le programme actif
   * 
   * @returns {Promise<boolean>} true si succès
   */
  const deactivateProgram = useCallback(async () => {
    if (!dbReady) return false;

    try {
      const activeProgram = await getActiveProgram();
      if (!activeProgram) return true; // Déjà désactivé

      activeProgram.isActive = false;
      return await saveProgram(activeProgram);
    } catch (error) {
      console.error('[useNutritionData] Erreur deactivateProgram:', error);
      return false;
    }
  }, [dbReady]);

  // ==================== EXPORT/IMPORT ====================

  /**
   * Exporte toutes les données nutrition pour backup
   * 
   * @returns {Promise<Object>} Objet avec toutes les données
   */
  const exportAll = useCallback(async () => {
    if (!dbReady) {
      return {
        dailyMeals: [],
        meals: [],
        programs: [],
        favoriteFoods: [],
        gamification: { achievements: [], experience: { currentXP: 0, level: 1 }, streaks: {} },
        hydrationLogs: [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    }

    try {
      // Charger toutes les données en parallèle
      const [dailyMeals, allMeals, programs, favoriteFoods, gamification, hydrationLogs] = await Promise.all([
        // Récupérer tous les dailyMeals (plage large)
        getDailyMealsByRange('2020-01-01', '2099-12-31'),
        // Récupérer tous les meals directement
        getAllMeals(),
        getAllPrograms(),
        getFavoriteFoods({}),
        // Récupérer données gamification
        getGamificationData().catch(err => {
          console.warn('[useNutritionData] Erreur récupération gamification:', err);
          return { achievements: [], experience: { currentXP: 0, level: 1 }, streaks: {} };
        }),
        // Récupérer données hydratation (plage large)
        getHydrationLogByRange('2020-01-01', '2099-12-31').catch(err => {
          console.warn('[useNutritionData] Erreur récupération hydratation:', err);
          return [];
        })
      ]);

      return {
        dailyMeals,
        meals: allMeals,
        programs,
        favoriteFoods,
        gamification,
        hydrationLogs,
        exportDate: new Date().toISOString(),
        version: '1.0',
        metadata: {
          totalDailyMeals: dailyMeals.length,
          totalMeals: allMeals.length,
        totalPrograms: programs.length,
        totalFavoriteFoods: favoriteFoods.length,
        totalAchievements: gamification.achievements?.length || 0,
        totalHydrationLogs: hydrationLogs?.length || 0,
        dateRange: dailyMeals.length > 0 ? {
          earliest: dailyMeals.map(dm => dm.date).sort()[0],
          latest: dailyMeals.map(dm => dm.date).sort().reverse()[0]
        } : null
        }
      };
    } catch (error) {
      console.error('[useNutritionData] Erreur exportAll:', error);
      return {
        dailyMeals: [],
        meals: [],
        programs: [],
        favoriteFoods: [],
        gamification: { achievements: [], experience: { currentXP: 0, level: 1 }, streaks: {} },
        hydrationLogs: [],
        exportDate: new Date().toISOString(),
        version: '1.0',
        error: error.message
      };
    }
  }, [dbReady]);

  // ==================== RETURN ====================

  return {
    // État
    dbReady,

    // DailyMeals
    getDailyMeal: getDailyMealWithTotals,
    saveDailyMeal: saveDailyMealDebounced,
    getDailyMealsByRange,
    deleteDailyMeal,

    // Meals
    getMeal,
    saveMeal: saveMealAndUpdateTotals,
    getMealsByDate,
    getMealsByDailyMealId,
    getAllMeals,
    deleteMeal: deleteMealAndUpdateTotals,
    saveMealsBatch,

    // Programs
    getAllPrograms,
    getActiveProgram,
    saveProgram,
    deleteProgram,
    activateProgram,
    deactivateProgram,

    // FavoriteFoods
    getFavoriteFoods,
    getFavoriteFood,
    saveFavoriteFood,
    deleteFavoriteFood,

    // Hydration
    getHydrationLog,
    saveHydrationLog,
    addWaterIntake,
    getHydrationLogByRange,
    deleteHydrationLog,

    // Calculs
    calculateDailyTotals,
    calculateCaloricBalance,
    calculateProgramCompliance,
    getNutritionStats,
    getMacroDistribution,

    // Utilitaires
    generateMealId,
    generateProgramId,
    generateFavoriteFoodId,
    formatDate,

    // Export/Import
    exportAll
  };
};

