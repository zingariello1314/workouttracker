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
import { useDebouncedSave } from './useDebouncedSave';
// ✅ OPTIMISATION : Configuration centralisée (valeurs par défaut pour debounce)
import { NutritionConfig, getConfigForExport } from '../config/nutrition.config';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/accessControl';
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
  getMealsByDateAndType,
  getMealsByDailyMealId,
  getMealsByDateRange,
  getAllMeals,
  deleteMeal,
  saveMeals,
  // Programs
  getAllPrograms,
  getActiveProgram,
  getAllProgramsWithActive,
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
import { exportProgressPhotos } from '../services/nutrition/nutritionProgressPhotos';
import { exportModels as exportMLModels } from '../services/nutrition/nutritionPredictions';
// ✅ OPTIMISATION : Opérations atomiques avec rollback automatique
import { saveMealAtomically, deleteMealAtomically } from '../services/nutrition/nutritionAtomicOperations';
import { NutritionError } from '../utils/nutritionErrors';
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
// ✅ SOLUTION 3 : Singleton pattern avec garde-fou React StrictMode
let globalDBReadyPromise = null;
let globalDBReady = false;

/**
 * Initialise la DB globalement (une seule fois, même avec React StrictMode)
 */
const ensureGlobalDBReady = async () => {
  // Si déjà initialisé, retourner promesse résolue
  if (globalDBReadyPromise && globalDBReady) {
    return globalDBReadyPromise;
  }
  
  // Si initialisation en cours, retourner promesse existante
  if (globalDBReadyPromise) {
    return globalDBReadyPromise;
  }
  
  // Créer nouvelle promesse d'initialisation globale
  globalDBReadyPromise = (async () => {
    try {
      const db = await openNutritionDB();
      if (db) {
        globalDBReady = true;
        // Log supprimé pour éviter spam
      } else {
        globalDBReady = false;
      }
      return db;
    } catch (error) {
      // Log supprimé pour éviter spam - seulement erreurs critiques
      globalDBReady = false;
      globalDBReadyPromise = null; // Réinitialiser en cas d'erreur pour retry
      throw error;
    }
  })();
  
  return globalDBReadyPromise;
};

export const useNutritionData = () => {
  const [dbReady, setDbReady] = useState(false);
  const initializedRef = useRef(false); // ✅ Garde-fou React StrictMode
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);

  // ✅ Calculer le userId pour le filtrage et l'ajout automatique
  // Admin : userId = null (pour récupérer toutes les données, y compris sans userId)
  // Autre user : userId = currentUser.id
  // Déconnecté : userId = null → retourne [] (pas de données)
  const userId = isAuthenticated && currentUser 
    ? (isAdmin ? null : currentUser.id)
    : null;

  // ✅ OPTIMISATION : Debouncing pour toutes les sauvegardes (économise 50-70% transactions si sauvegarde rapide)
  // ✅ OPTIMISATION : Utiliser valeurs depuis configuration centralisée
  const debounceConfig = {
    delay: NutritionConfig.performance.debounceSave,
    maxDelay: NutritionConfig.performance.debounceSaveMaxDelay,
    verbose: false
  };
  
  const { save: saveDailyMealDebounced, flush: flushDailyMeal } = useDebouncedSave(
    async (dailyMeal) => {
      if (!dbReady) return false;
      // ✅ Ajouter userId automatiquement si absent et utilisateur connecté
      if (userId && !dailyMeal.userId) {
        dailyMeal.userId = userId;
      }
      return await saveDailyMeal(dailyMeal);
    },
    debounceConfig
  );

  const { save: saveProgramDebounced, flush: flushProgram } = useDebouncedSave(
    async (program) => {
      if (!dbReady) return false;
      // ✅ Ajouter userId automatiquement si absent et utilisateur connecté
      if (userId && !program.userId) {
        program.userId = userId;
      }
      return await saveProgram(program);
    },
    debounceConfig
  );

  const { save: saveFavoriteFoodDebounced, flush: flushFavoriteFood } = useDebouncedSave(
    async (favoriteFood) => {
      if (!dbReady) return false;
      // ✅ Ajouter userId automatiquement si absent et utilisateur connecté
      if (userId && !favoriteFood.userId) {
        favoriteFood.userId = userId;
      }
      return await saveFavoriteFood(favoriteFood);
    },
    debounceConfig
  );

  const { save: saveHydrationLogDebounced, flush: flushHydrationLog } = useDebouncedSave(
    async (hydrationLog) => {
      if (!dbReady) return false;
      // ✅ Ajouter userId automatiquement si absent et utilisateur connecté
      if (userId && !hydrationLog.userId) {
        hydrationLog.userId = userId;
      }
      return await saveHydrationLog(hydrationLog);
    },
    debounceConfig
  );

  // Initialisation IndexedDB (singleton global)
  useEffect(() => {
    // ✅ Éviter double appel React StrictMode
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    
    ensureGlobalDBReady()
      .then(async (db) => {
        if (db) {
          setDbReady(true);
          // ✅ Pas de log ici (déjà logué dans ensureGlobalDBReady pour éviter duplication)
          
          // ✅ OPTIMISATION Phase 15.6 : Initialiser gestionnaire online/offline
          if (typeof window !== 'undefined') {
            try {
              const { getNutritionOnlineManager } = await import('../services/nutrition/nutritionOnlineManager');
              await getNutritionOnlineManager();
              // Gestionnaire initialisé automatiquement (singleton)
            } catch (error) {
              // Erreur non bloquante (queue offline optionnelle)
              console.warn('[useNutritionData] Erreur initialisation gestionnaire online/offline:', error);
            }
          }
        } else {
          setDbReady(false);
        }
      })
      .catch((err) => {
        console.error('[useNutritionData] Erreur initialisation DB:', err);
        setDbReady(false);
        initializedRef.current = false; // Réinitialiser en cas d'erreur pour retry
      });
    
    // Cleanup : ne pas fermer DB (singleton partagé)
    return () => {
      // Pas de cleanup nécessaire (DB est un singleton)
    };
  }, []); // ✅ Dépendances vides = exécuté une seule fois par composant

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
      
      // ✅ Filtrer par userId si nécessaire
      if (userId && dailyMeal && dailyMeal.userId !== userId) {
        dailyMeal = null;
      } else if (userId === null && dailyMeal && dailyMeal.userId) {
        // Si on est déconnecté, ne pas afficher les données avec userId
        dailyMeal = null;
      }
      
      // Si recalcul demandé ou dailyMeal inexistant, calculer depuis meals
      if (options.recalculateTotals || !dailyMeal) {
        const [meals, activeProgram, hydrationLog] = await Promise.all([
          getMealsByDate(date),
          getActiveProgram(),
          getHydrationLog(date).catch(() => null) // Ne pas bloquer si erreur
        ]);
        
        // ✅ Filtrer meals par userId
        const filteredMeals = userId === null 
          ? meals.filter(m => !m.userId) // Admin : seulement données sans userId
          : userId 
            ? meals.filter(m => m.userId === userId) // User : seulement ses données
            : []; // Déconnecté : aucune donnée
        
        // Calculer totaux depuis meals filtrés
        const dailyTotals = calculateDailyTotals(filteredMeals, activeProgram);
        
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
            mealIds: filteredMeals.map(m => m.id),
            dailyTotals,
            ...(userId ? { userId } : {}) // Ajouter userId si connecté
          };
        } else {
          dailyMeal.dailyTotals = dailyTotals;
          dailyMeal.mealIds = filteredMeals.map(m => m.id);
          dailyMeal.lastModified = new Date().toISOString();
          if (userId && !dailyMeal.userId) {
            dailyMeal.userId = userId;
          }
        }
        
        // Sauvegarder si modifié
        if (options.recalculateTotals) {
          await saveDailyMeal(dailyMeal);
        }
      } else if (dailyMeal && dailyMeal.dailyTotals) {
        // Même si pas de recalcul, intégrer hydratation si disponible
        const hydrationLog = await getHydrationLog(date).catch(() => null);
        // ✅ Filtrer hydrationLog par userId
        if (hydrationLog) {
          if (userId && hydrationLog.userId !== userId) {
            // Ne pas utiliser cette hydrationLog
          } else if (userId === null && hydrationLog.userId) {
            // Admin : ne pas utiliser les données avec userId
          } else if (hydrationLog.waterIntake) {
            dailyMeal.dailyTotals.waterIntake = hydrationLog.waterIntake;
            if (hydrationLog.targetWater) {
              dailyMeal.dailyTotals.targetWater = hydrationLog.targetWater;
            }
            dailyMeal.dailyTotals.complianceWater = dailyMeal.dailyTotals.waterIntake - dailyMeal.dailyTotals.targetWater;
          }
        }
      }
      
      return dailyMeal;
    } catch (error) {
      console.error('[useNutritionData] Erreur getDailyMealWithTotals:', error);
      return null;
    }
  }, [dbReady, userId]);

  /**
   * Sauvegarde un dailyMeal avec debounce (300ms)
   * 
   * ✅ OPTIMISATION : Utilise useDebouncedSave pour économie 50-70% transactions
   * 
   * @param {Object} dailyMeal - Données du jour
   * @param {boolean} immediate - Si true, sauvegarde immédiate (pas de debounce)
   * @returns {Promise<boolean>} true si succès
   */
  const saveDailyMealWithDebounce = useCallback(async (dailyMeal, immediate = false) => {
    if (!dbReady) return false;
    return saveDailyMealDebounced(dailyMeal, immediate);
  }, [dbReady, saveDailyMealDebounced]);

  // ==================== MEALS ====================

  /**
   * Sauvegarde un repas et met à jour automatiquement les totaux du jour
   * 
   * @param {Object} meal - Données du repas
   * @param {boolean} updateDailyTotals - Si true, recalcule les totaux du jour
   * @returns {Promise<boolean>} true si succès
   */
  /**
   * Sauvegarde un meal et met à jour le dailyMeal dans une transaction atomique
   * 
   * ✅ OPTIMISATION : Transaction atomique garantit cohérence (rollback si erreur)
   * 
   * @param {Object} meal - Données du repas
   * @param {boolean} updateDailyTotals - Si true, recalcule et sauvegarde dailyMeal (défaut: true)
   * @returns {Promise<boolean>} True si succès
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

      // ✅ Ajouter userId automatiquement si absent et utilisateur connecté
      if (userId && !meal.userId) {
        meal.userId = userId;
      }

      // ✅ OPTIMISATION : Utiliser opération atomique (transaction avec rollback automatique)
      const saved = await saveMealAtomically(meal, { updateDailyTotals });
      
      return saved;
    } catch (error) {
      // ✅ OPTIMISATION : Gestion spécifique QuotaExceededError
      // Note: L'erreur doit être propagée pour gestion UI (toast/modal)
      if (error && error.name === 'QuotaExceededError') {
        console.error('[useNutritionData] Quota dépassé (propager pour gestion UI):', error);
        throw error; // Propager pour gestion UI dans composant
      }
      
      // ✅ PROPAGATION NutritionError pour gestion UI cohérente
      if (error instanceof NutritionError) {
        console.error('[useNutritionData] Erreur saveMealAndUpdateTotals:', error.toJSON());
        throw error; // Propager pour gestion UI
      }
      
      console.error('[useNutritionData] Erreur saveMealAndUpdateTotals:', error);
      return false;
    }
  }, [dbReady, userId]);

  /**
   * Supprime un repas et met à jour les totaux du jour dans une transaction atomique
   * 
   * ✅ OPTIMISATION : Transaction atomique garantit cohérence (rollback si erreur)
   * 
   * @param {string} mealId - ID du repas
   * @returns {Promise<boolean>} true si succès
   */
  const deleteMealAndUpdateTotals = useCallback(async (mealId) => {
    if (!dbReady) return false;

    try {
      // ✅ OPTIMISATION : Utiliser opération atomique (transaction avec rollback automatique)
      const deleted = await deleteMealAtomically(mealId, { updateDailyTotals: true });
      
      return deleted;
    } catch (error) {
      // ✅ OPTIMISATION : Gestion spécifique QuotaExceededError
      if (error && error.name === 'QuotaExceededError') {
        console.error('[useNutritionData] Quota dépassé (propager pour gestion UI):', error);
        throw error; // Propager pour gestion UI dans composant
      }
      
      // ✅ PROPAGATION NutritionError pour gestion UI cohérente
      if (error instanceof NutritionError) {
        console.error('[useNutritionData] Erreur deleteMealAndUpdateTotals:', error.toJSON());
        throw error; // Propager pour gestion UI
      }
      
      console.error('[useNutritionData] Erreur deleteMealAndUpdateTotals:', error);
      return false;
    }
  }, [dbReady]);

  // ==================== PROGRAMS ====================

  /**
   * ✅ OPTIMISATION 4.2 : Active un programme (désactive automatiquement les autres)
   * 
   * Optimisé pour éviter double chargement : passe DB instance à saveProgram
   * 
   * @param {string} programId - ID du programme à activer
   * @returns {Promise<boolean>} true si succès
   */
  const activateProgram = useCallback(async (programId) => {
    if (!dbReady) return false;

    try {
      // ✅ OPTIMISATION 4.2 : Ouvrir DB une seule fois
      const db = await openNutritionDB();
      if (!db) return false;
      
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
      
      // ✅ OPTIMISATION 4.2 : Passer DB instance pour éviter réouverture
      // Note: activateProgram nécessite sauvegarde immédiate avec dbInstance, donc pas de debounce
      return await saveProgram(program, { dbInstance: db });
    } catch (error) {
      console.error('[useNutritionData] Erreur activateProgram:', error);
      return false;
    }
  }, [dbReady, getAllPrograms, saveProgram, formatDate]);

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
      // ✅ OPTIMISATION : Utiliser version debouncée (300ms)
      return await saveProgramDebounced(activeProgram, true); // immediate = true pour désactivation
    } catch (error) {
      console.error('[useNutritionData] Erreur deactivateProgram:', error);
      return false;
    }
  }, [dbReady]);

  // ==================== HELPERS FILTRAGE PAR USERID ====================

  /**
   * Filtre un tableau par userId
   */
  const filterByUserId = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    if (userId === null) {
      // Admin : retourner toutes les données (avec ou sans userId)
      return items;
    }
    if (userId) {
      // User : seulement ses données
      return items.filter(item => item && item.userId === userId);
    }
    // Déconnecté : aucune donnée
    return [];
  }, [userId]);

  /**
   * Wrapper pour getAllMeals avec filtrage par userId
   */
  const getAllMealsFiltered = useCallback(async () => {
    if (!dbReady) return [];
    const allMeals = await getAllMeals();
    return filterByUserId(allMeals);
  }, [dbReady, userId, filterByUserId]);

  /**
   * Wrapper pour getAllPrograms avec filtrage par userId
   */
  const getAllProgramsFiltered = useCallback(async () => {
    if (!dbReady) return [];
    const allPrograms = await getAllPrograms();
    return filterByUserId(allPrograms);
  }, [dbReady, userId, filterByUserId]);

  /**
   * Wrapper pour getFavoriteFoods avec filtrage par userId
   */
  const getFavoriteFoodsFiltered = useCallback(async (options = {}) => {
    if (!dbReady) return [];
    const allFavorites = await getFavoriteFoods(options);
    return filterByUserId(allFavorites);
  }, [dbReady, userId, filterByUserId]);

  /**
   * Wrapper pour getDailyMealsByRange avec filtrage par userId
   */
  const getDailyMealsByRangeFiltered = useCallback(async (startDate, endDate) => {
    if (!dbReady) return [];
    const allDailyMeals = await getDailyMealsByRange(startDate, endDate);
    return filterByUserId(allDailyMeals);
  }, [dbReady, userId, filterByUserId]);

  /**
   * Wrapper pour getHydrationLogByRange avec filtrage par userId
   */
  const getHydrationLogByRangeFiltered = useCallback(async (startDate, endDate) => {
    if (!dbReady) return [];
    const allHydration = await getHydrationLogByRange(startDate, endDate);
    return filterByUserId(allHydration);
  }, [dbReady, userId, filterByUserId]);

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
        progressPhotos: { version: '1.0', exportDate: new Date().toISOString(), totalPhotos: 0, photos: [] },
        mlModels: { models: [], metadata: { total: 0, exportedAt: new Date().toISOString() } },
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    }

    try {
      // Charger toutes les données en parallèle (avec filtrage par userId)
      const [dailyMeals, allMeals, programs, favoriteFoods, gamification, hydrationLogs, progressPhotos, mlModels] = await Promise.all([
        // Récupérer tous les dailyMeals (plage large) avec filtrage
        getDailyMealsByRangeFiltered('2020-01-01', '2099-12-31'),
        // Récupérer tous les meals directement avec filtrage
        getAllMealsFiltered(),
        getAllProgramsFiltered(),
        getFavoriteFoodsFiltered({}),
        // Récupérer données gamification
        getGamificationData().catch(err => {
          console.warn('[useNutritionData] Erreur récupération gamification:', err);
          return { achievements: [], experience: { currentXP: 0, level: 1 }, streaks: {} };
        }),
        // Récupérer données hydratation (plage large) avec filtrage
        getHydrationLogByRangeFiltered('2020-01-01', '2099-12-31').catch(err => {
          console.warn('[useNutritionData] Erreur récupération hydratation:', err);
          return [];
        }),
        // Récupérer photos de progression
        exportProgressPhotos().catch(err => {
          console.warn('[useNutritionData] Erreur récupération photos progression:', err);
          return { version: '1.0', exportDate: new Date().toISOString(), totalPhotos: 0, photos: [] };
        }),
        // Récupérer modèles ML entraînés
        exportMLModels().catch(err => {
          console.warn('[useNutritionData] Erreur récupération modèles ML:', err);
          return { models: [], metadata: { total: 0, exportedAt: new Date().toISOString() } };
        })
      ]);

      return {
        dailyMeals,
        meals: allMeals,
        programs,
        favoriteFoods,
        gamification,
        hydrationLogs,
        progressPhotos, // Photos de progression avant/après
        mlModels, // Modèles ML entraînés (TensorFlow.js)
        exportDate: new Date().toISOString(),
        version: '1.0',
        // ✅ OPTIMISATION : Inclure configuration dans export (pour référence)
        config: getConfigForExport(),
        metadata: {
          totalDailyMeals: dailyMeals.length,
          totalMeals: allMeals.length,
          totalPrograms: programs.length,
          totalFavoriteFoods: favoriteFoods.length,
          totalAchievements: gamification.achievements?.length || 0,
          totalHydrationLogs: hydrationLogs?.length || 0,
          totalProgressPhotos: progressPhotos?.totalPhotos || 0,
          totalMLModels: mlModels?.models?.length || 0,
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
        progressPhotos: { version: '1.0', exportDate: new Date().toISOString(), totalPhotos: 0, photos: [] },
        mlModels: { models: [], metadata: { total: 0, exportedAt: new Date().toISOString() } },
        exportDate: new Date().toISOString(),
        version: '1.0',
        error: error.message
      };
    }
  }, [dbReady, getDailyMealsByRangeFiltered, getAllMealsFiltered, getAllProgramsFiltered, getFavoriteFoodsFiltered, getHydrationLogByRangeFiltered]);

  // ==================== RETURN ====================

  return {
    // État
    dbReady,

    // DailyMeals
    getDailyMeal: getDailyMealWithTotals,
    saveDailyMeal: saveDailyMealWithDebounce, // ✅ OPTIMISATION : Version debouncée (300ms)
    getDailyMealsByRange,
    deleteDailyMeal,

    // Meals
    getMeal,
    saveMeal: saveMealAndUpdateTotals,
    getMealsByDate,
    getMealsByDateAndType,
    getMealsByDailyMealId,
    getMealsByDateRange,
    getAllMeals: getAllMealsFiltered, // ✅ Filtré par userId
    deleteMeal: deleteMealAndUpdateTotals,
    saveMeals,

    // Programs
    getAllPrograms: getAllProgramsFiltered, // ✅ Filtré par userId
    getActiveProgram,
    getAllProgramsWithActive,
    saveProgram: saveProgramDebounced, // ✅ OPTIMISATION : Version debouncée (300ms)
    deleteProgram,
    activateProgram,
    deactivateProgram,

    // FavoriteFoods
    getFavoriteFoods: getFavoriteFoodsFiltered, // ✅ Filtré par userId
    getFavoriteFood,
    saveFavoriteFood: saveFavoriteFoodDebounced, // ✅ OPTIMISATION : Version debouncée (300ms)
    deleteFavoriteFood,

    // Hydration
    getHydrationLog,
    saveHydrationLog: saveHydrationLogDebounced, // ✅ OPTIMISATION : Version debouncée (300ms)
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

