/**
 * nutritionCalculations.js
 * 
 * Utilitaires de calcul pour la nutrition :
 * - Totaux journaliers (calories, macros, pourcentages)
 * - Conformité programme (écarts, scores)
 * - Bilan calorique (avec intégration Garmin)
 * - Statistiques et tendances
 * 
 * Tous les calculs sont optimisés et validés
 * 
 * @module hooks/nutritionCalculations
 */

// ==================== IMPORTS ====================

import { DateHelper } from '../utils/dateHelper';
import { NutritionError, NutritionErrorCodes, createValidationError } from '../utils/nutritionErrors';
import logger from '../utils/logger';
import { z } from 'zod';
import {
  validateMealForCalculation,
  validateProgramForCalculation,
  validateDateRange
} from '../services/nutrition/nutritionSchemas';
import {
  validateAndNormalizeNumber,
  safeDivision,
  safeSqrt,
  getValidCaloriesTarget,
  getValidProteinTarget,
  getValidCarbsTarget,
  getValidFatTarget,
  getValidWaterTarget,
  validateCalculationResult
} from '../services/nutrition/nutritionCalculationHelpers';
// ✅ OPTIMISATION : Cache calculs avec hash inputs (évite recalculs identiques)
import { getCalculationHash, getNutritionCalculationCache } from '../services/nutrition/nutritionCalculationCache';
// ✅ OPTIMISATION : Configuration centralisée (valeurs par défaut, limites)
import { NutritionConfig } from '../config/nutrition.config';

const log = logger.module('nutritionCalculations');

// ==================== CALCULS TOTAUX JOURNALIERS ====================

/**
 * Calcule les totaux journaliers à partir des repas d'un jour
 * 
 * ✅ PHASE 10.5 : Validation robuste avec Zod, protection NaN/Infinity, gestion erreurs standardisée
 * 
 * @param {Array<Object>} meals - Tableau de meals pour le jour
 * @param {Object} program - Programme actif (optionnel, pour targets)
 * @returns {Object} Totaux journaliers avec structure complète
 * @throws {NutritionError} Si validation échoue
 */
export const calculateDailyTotals = (meals = [], program = null) => {
  try {
    // ✅ PHASE 10.5 : Validation inputs
    if (!Array.isArray(meals)) {
      throw new NutritionError(
        NutritionErrorCodes.VALIDATION_INVALID_DATA,
        'meals doit être un tableau',
        { meals, type: typeof meals }
      );
    }
    
    // ✅ PHASE 10.5 : Valider programme si fourni
    let validatedProgram = null;
    if (program !== null && program !== undefined) {
      try {
        validatedProgram = validateProgramForCalculation(program);
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.warn('[calculateDailyTotals] Programme invalide, utilisation valeurs par défaut:', error.errors);
          // Continuer avec valeurs par défaut (non bloquant)
        } else {
          throw error;
        }
      }
    }
    
    // ✅ OPTIMISATION : Cache calculs avec hash inputs (évite recalculs identiques)
    // Générer hash des inputs validés pour vérifier cache
    const inputsHash = getCalculationHash(meals, validatedProgram);
    const cache = getNutritionCalculationCache();
    
    // Vérifier cache AVANT calculs coûteux
    const cached = cache.get(inputsHash);
    if (cached !== null) {
      return cached; // ✅ Retourner résultat en cache (évite recalculs)
    }
    
    // ✅ OPTIMISATION WARNING 1 : Early return si pas de repas (évite calculs inutiles + warnings)
    if (meals.length === 0) {
      // ✅ OPTIMISATION : Utiliser valeurs par défaut depuis configuration centralisée
      const targetCalories = getValidCaloriesTarget(validatedProgram?.targetCalories, NutritionConfig.defaults.targetCalories);
      const targetProtein = getValidProteinTarget(validatedProgram?.targetProtein, NutritionConfig.defaults.targetProtein);
      const targetCarbs = getValidCarbsTarget(validatedProgram?.targetCarbs, NutritionConfig.defaults.targetCarbs);
      const targetFat = getValidFatTarget(validatedProgram?.targetFat, NutritionConfig.defaults.targetFat);
      const targetWater = getValidWaterTarget(validatedProgram?.targetWater, NutritionConfig.defaults.targetWater);
      
      // Retourner structure complète avec valeurs par défaut
      const emptyResult = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        waterIntake: 0,
        proteinPercent: 0,
        carbsPercent: 0,
        fatPercent: 0,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        targetWater,
        complianceCalories: -targetCalories, // Déficit total
        complianceProtein: -targetProtein,
        complianceCarbs: -targetCarbs,
        complianceFat: -targetFat,
        complianceWater: -targetWater,
        complianceScore: 0 // Pas de repas = score 0
      };
      
      // ✅ OPTIMISATION : Mettre en cache même pour cas vide
      cache.set(inputsHash, emptyResult);
      
      return emptyResult;
    }
    
    // Initialiser totaux
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalWater = 0;

    // ✅ PHASE 10.5 : Valider et sommer tous les repas
    meals.forEach((meal, index) => {
      try {
        // Valider meal avec Zod
        const validatedMeal = validateMealForCalculation(meal);
        
        // ✅ Utiliser validateAndNormalizeNumber pour garantir valeurs valides
        totalCalories += validateAndNormalizeNumber(validatedMeal.totalCalories, {
          fieldName: `meal[${index}].totalCalories`,
          defaultValue: 0
        });
        totalProtein += validateAndNormalizeNumber(validatedMeal.totalProtein, {
          fieldName: `meal[${index}].totalProtein`,
          defaultValue: 0
        });
        totalCarbs += validateAndNormalizeNumber(validatedMeal.totalCarbs, {
          fieldName: `meal[${index}].totalCarbs`,
          defaultValue: 0
        });
        totalFat += validateAndNormalizeNumber(validatedMeal.totalFat, {
          fieldName: `meal[${index}].totalFat`,
          defaultValue: 0
        });
        
        // Eau (si présent dans meal)
        if (validatedMeal.waterIntake !== undefined) {
          totalWater += validateAndNormalizeNumber(validatedMeal.waterIntake, {
            fieldName: `meal[${index}].waterIntake`,
            defaultValue: 0
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.warn(`[calculateDailyTotals] Meal invalide à l'index ${index}, ignoré:`, error.errors);
          // Ignorer meal invalide (non bloquant)
        } else {
          throw error;
        }
      }
    });

    // ✅ OPTIMISATION : Utiliser valeurs caloriques depuis configuration centralisée
    const proteinCalories = validateAndNormalizeNumber(totalProtein * NutritionConfig.macros.proteinCaloriesPerGram, { fieldName: 'proteinCalories' });
    const carbsCalories = validateAndNormalizeNumber(totalCarbs * NutritionConfig.macros.carbsCaloriesPerGram, { fieldName: 'carbsCalories' });
    const fatCalories = validateAndNormalizeNumber(totalFat * NutritionConfig.macros.fatCaloriesPerGram, { fieldName: 'fatCalories' });
    const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

    // ✅ OPTIMISATION WARNING 1 : Vérifier totalMacroCalories AVANT divisions (évite warnings inutiles)
    let proteinPercent, carbsPercent, fatPercent;
    if (totalMacroCalories === 0) {
      // Pas de macros = pas de pourcentages (cas normal si pas de repas avec macros)
      proteinPercent = 0;
      carbsPercent = 0;
      fatPercent = 0;
    } else {
      // ✅ PHASE 10.5 : Division sécurisée pour pourcentages
      proteinPercent = safeDivision(
        proteinCalories * 100,
        totalMacroCalories,
        { operation: 'proteinPercent', defaultValue: 0 }
      );
      carbsPercent = safeDivision(
        carbsCalories * 100,
        totalMacroCalories,
        { operation: 'carbsPercent', defaultValue: 0 }
      );
      fatPercent = safeDivision(
        fatCalories * 100,
        totalMacroCalories,
        { operation: 'fatPercent', defaultValue: 0 }
      );
    }

    // ✅ OPTIMISATION : Utiliser valeurs par défaut depuis configuration centralisée
    const targetCalories = getValidCaloriesTarget(validatedProgram?.targetCalories, NutritionConfig.defaults.targetCalories);
    const targetProtein = getValidProteinTarget(validatedProgram?.targetProtein, NutritionConfig.defaults.targetProtein);
    const targetCarbs = getValidCarbsTarget(validatedProgram?.targetCarbs, NutritionConfig.defaults.targetCarbs);
    const targetFat = getValidFatTarget(validatedProgram?.targetFat, NutritionConfig.defaults.targetFat);
    const targetWater = getValidWaterTarget(validatedProgram?.targetWater, NutritionConfig.defaults.targetWater);

    // ✅ PHASE 10.5 : Calculer écarts (conformité) avec validation
    const complianceCalories = validateAndNormalizeNumber(totalCalories - targetCalories, {
      fieldName: 'complianceCalories',
      min: -10000,
      max: 10000
    });
    const complianceProtein = validateAndNormalizeNumber(totalProtein - targetProtein, {
      fieldName: 'complianceProtein',
      min: -500,
      max: 500
    });
    const complianceCarbs = validateAndNormalizeNumber(totalCarbs - targetCarbs, {
      fieldName: 'complianceCarbs',
      min: -1000,
      max: 1000
    });
    const complianceFat = validateAndNormalizeNumber(totalFat - targetFat, {
      fieldName: 'complianceFat',
      min: -500,
      max: 500
    });
    const complianceWater = validateAndNormalizeNumber(totalWater - targetWater, {
      fieldName: 'complianceWater',
      min: -20000,
      max: 20000
    });

    // ✅ PHASE 10.5 : Valider résultats finaux
    const result = {
      // Totaux réels (validés)
      calories: validateCalculationResult(Math.round(totalCalories), {
        fieldName: 'calories',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 50000
      }),
      protein: validateCalculationResult(Math.round(totalProtein * 10) / 10, {
        fieldName: 'protein',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 2000
      }),
      carbs: validateCalculationResult(Math.round(totalCarbs * 10) / 10, {
        fieldName: 'carbs',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 5000
      }),
      fat: validateCalculationResult(Math.round(totalFat * 10) / 10, {
        fieldName: 'fat',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 2000
      }),
      waterIntake: validateCalculationResult(totalWater, {
        fieldName: 'waterIntake',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 50000
      }),

      // Pourcentages (validés)
      proteinPercent: validateCalculationResult(Math.round(proteinPercent), {
        fieldName: 'proteinPercent',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 100
      }),
      carbsPercent: validateCalculationResult(Math.round(carbsPercent), {
        fieldName: 'carbsPercent',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 100
      }),
      fatPercent: validateCalculationResult(Math.round(fatPercent), {
        fieldName: 'fatPercent',
        operation: 'calculateDailyTotals',
        min: 0,
        max: 100
      }),

      // Targets (déjà validés par getValid*Target)
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetWater,

      // Écarts (conformité) - déjà validés
      complianceCalories,
      complianceProtein,
      complianceCarbs,
      complianceFat,
      complianceWater,

      // Score de conformité global (0-100)
      complianceScore: calculateComplianceScore({
        calories: { actual: totalCalories, target: targetCalories },
        protein: { actual: totalProtein, target: targetProtein },
        carbs: { actual: totalCarbs, target: targetCarbs },
        fat: { actual: totalFat, target: targetFat }
      })
    };
    
    // ✅ OPTIMISATION : Mettre en cache le résultat AVANT retour
    cache.set(inputsHash, result);
    
    return result;
  } catch (error) {
    // ✅ PHASE 10.5 : Gestion erreurs standardisée
    if (error instanceof NutritionError) {
      log.error('[calculateDailyTotals] Erreur calcul:', error.toJSON());
      throw error;
    }
    
    // Wrapper erreurs inconnues
    log.error('[calculateDailyTotals] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_ERROR,
      'Erreur lors du calcul des totaux journaliers',
      { originalError: error.message },
      error
    );
  }
};

/**
 * Calcule le score de conformité (0-100) basé sur les écarts
 * 
 * ✅ PHASE 10.5 : Protection NaN/Infinity, division sécurisée, validation résultats
 * 
 * @param {Object} macros - Objet avec actual/target pour chaque macro
 * @returns {number} Score de 0 à 100
 */
const calculateComplianceScore = (macros) => {
  // ✅ PHASE 10.5 : Validation inputs
  if (!macros || typeof macros !== 'object') {
    log.warn('[calculateComplianceScore] macros invalide, retour 0');
    return 0;
  }
  
  // ✅ OPTIMISATION : Utiliser poids depuis configuration centralisée
  const weights = {
    calories: NutritionConfig.compliance.caloriesWeight,
    protein: NutritionConfig.compliance.proteinWeight,
    carbs: NutritionConfig.compliance.carbsWeight,
    fat: NutritionConfig.compliance.fatWeight
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(macros).forEach(([key, { actual, target }]) => {
    // ✅ PHASE 10.5 : Validation valeurs
    const actualValue = validateAndNormalizeNumber(actual, {
      fieldName: `${key}.actual`,
      defaultValue: 0
    });
    const targetValue = validateAndNormalizeNumber(target, {
      fieldName: `${key}.target`,
      defaultValue: 0,
      allowZero: false // Target ne peut pas être zéro
    });
    
    // ✅ PHASE 10.5 : Vérifier target valide
    if (targetValue > 0) {
      const weight = weights[key] || 0.25;
      
      // ✅ PHASE 10.5 : Division sécurisée pour ratio
      const ratio = safeDivision(actualValue, targetValue, {
        operation: `calculateComplianceScore.${key}.ratio`,
        defaultValue: 0
      });
      
      // ✅ PHASE 10.5 : Validation ratio
      if (!isFinite(ratio) || ratio < 0) {
        log.warn(`[calculateComplianceScore] Ratio ${key} invalide (${ratio}), ignoré`);
        return; // Skip ce macro
      }
      
      // ✅ OPTIMISATION : Utiliser seuils depuis configuration centralisée
      // Score basé sur proximité de la cible
      // 100% = score 100, entre threshold et penaltyThreshold = score 100, <threshold ou >penaltyThreshold = pénalité
      const threshold = NutritionConfig.compliance.complianceThreshold; // 0.8 = 80%
      const penaltyThreshold = NutritionConfig.compliance.compliancePenaltyThreshold; // 1.2 = 120%
      
      let score = 100;
      if (ratio < threshold) {
        // ✅ PHASE 10.5 : Division sécurisée pour pénalité
        score = safeDivision(100 * ratio, threshold, {
          operation: `calculateComplianceScore.${key}.penaltyLow`,
          defaultValue: 0
        });
      } else if (ratio > penaltyThreshold) {
        // ✅ PHASE 10.5 : Division sécurisée pour pénalité
        score = safeDivision(100 * penaltyThreshold, ratio, {
          operation: `calculateComplianceScore.${key}.penaltyHigh`,
          defaultValue: 0
        });
      }
      
      // ✅ PHASE 10.5 : Validation score final
      if (isFinite(score) && score >= 0 && score <= 100) {
        totalScore += score * weight;
        totalWeight += weight;
      } else {
        log.warn(`[calculateComplianceScore] Score ${key} invalide (${score}), ignoré`);
      }
    }
  });

  // ✅ PHASE 10.5 : Division sécurisée pour score final
  const finalScore = safeDivision(totalScore, totalWeight, {
    operation: 'calculateComplianceScore.final',
    defaultValue: 0
  });
  
  // ✅ PHASE 10.5 : Valider et arrondir résultat
  return validateCalculationResult(Math.round(finalScore), {
    fieldName: 'complianceScore',
    operation: 'calculateComplianceScore',
    min: 0,
    max: 100
  });
};

// ==================== CALCULS BILAN CALORIQUE ====================

/**
 * Calcule le bilan calorique d'un jour (consommé - dépensé)
 * 
 * ✅ PHASE 10.5 : Validation inputs, protection NaN/Infinity, division sécurisée
 * 
 * @param {number} caloriesConsumed - Calories consommées (nutrition)
 * @param {Object} garminData - Données Garmin (optionnel)
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Object} Bilan avec classification
 * @throws {NutritionError} Si validation échoue
 */
export const calculateCaloricBalance = (caloriesConsumed, garminData = null, date = null) => {
  try {
    // ✅ PHASE 10.5 : Valider calories consommées
    const validCaloriesConsumed = validateAndNormalizeNumber(caloriesConsumed, {
      fieldName: 'caloriesConsumed',
      defaultValue: 0,
      min: 0,
      max: 50000
    });
    
    // ✅ PHASE 10.5 : Valider date si fournie
    if (date !== null && date !== undefined) {
      if (!DateHelper.isValid(date)) {
        log.warn('[calculateCaloricBalance] Date invalide, utilisation estimation:', date);
        // Continuer avec estimation (non bloquant)
      }
    }
    
    // Récupérer calories dépensées depuis Garmin
    let caloriesBurned = 0;
    
    if (garminData && garminData.dailyMetrics && date) {
      const metrics = garminData.dailyMetrics[date];
      if (metrics && metrics.calories) {
        const rawBurned = metrics.calories.total || metrics.calories || 0;
        // ✅ PHASE 10.5 : Valider calories brûlées
        caloriesBurned = validateAndNormalizeNumber(rawBurned, {
          fieldName: 'caloriesBurned',
          defaultValue: 0,
          min: 0,
          max: 20000
        });
      }
    }

    // Si pas de données Garmin, estimation basique (TDEE approximatif)
    if (caloriesBurned === 0) {
      // Estimation basique : 2000 kcal/jour (sera remplacé par calcul TDEE réel)
      caloriesBurned = 2000;
    }

    // ✅ PHASE 10.5 : Bilan = consommé - dépensé avec validation
    // Note: balance peut être négatif (déficit), donc pas de min: 0
    const balance = validateAndNormalizeNumber(validCaloriesConsumed - caloriesBurned, {
      fieldName: 'balance',
      min: -50000, // ✅ Permettre déficit (négatif)
      max: 50000
    });

    // Classification
    const classification = getBalanceClassification(balance);

    // ✅ PHASE 10.5 : Division sécurisée pour pourcentage (permettre négatif)
    // Note: balance peut être jusqu'à -50000, donc balance * 100 peut être -5000000
    // On ne limite pas le numérateur, seulement le résultat final (percent)
    const percent = safeDivision(
      balance * 100,
      caloriesBurned,
      { 
        operation: 'calculateCaloricBalance.percent', 
        defaultValue: 0,
        min: -5000000, // ✅ OPTIMISATION WARNING 3 : Permettre numérateur jusqu'à -5000000 (balance -50000 * 100)
        max: 5000000   // ✅ Permettre numérateur jusqu'à 5000000 (balance 50000 * 100)
      }
    );
    
    // ✅ OPTIMISATION WARNING 3 : Limiter le résultat final (percent) à une plage raisonnable
    const finalPercent = validateAndNormalizeNumber(percent, {
      fieldName: 'percent',
      defaultValue: 0,
      min: -1000, // Pourcentages entre -1000% et +1000% (déficit/surplus extrême)
      max: 1000
    });

    // ✅ PHASE 10.5 : Valider résultats finaux
    const result = {
      consumed: validateCalculationResult(Math.round(validCaloriesConsumed), {
        fieldName: 'consumed',
        operation: 'calculateCaloricBalance',
        min: 0,
        max: 50000
      }),
      burned: validateCalculationResult(Math.round(caloriesBurned), {
        fieldName: 'burned',
        operation: 'calculateCaloricBalance',
        min: 0,
        max: 20000
      }),
      balance: validateCalculationResult(Math.round(balance), {
        fieldName: 'balance',
        operation: 'calculateCaloricBalance',
        min: -50000, // ✅ Permettre déficit (négatif)
        max: 50000
      }),
      classification, // 'surplus' | 'maintien' | 'deficit'
      percent: finalPercent // ✅ OPTIMISATION WARNING 3 : Utiliser finalPercent (déjà validé et limité)
    };
    
    return result;
  } catch (error) {
    // ✅ PHASE 10.5 : Gestion erreurs standardisée
    if (error instanceof NutritionError) {
      log.error('[calculateCaloricBalance] Erreur calcul:', error.toJSON());
      throw error;
    }
    
    // Wrapper erreurs inconnues
    log.error('[calculateCaloricBalance] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_ERROR,
      'Erreur lors du calcul du bilan calorique',
      { originalError: error.message },
      error
    );
  }
};

/**
 * Classifie le bilan calorique
 * 
 * @param {number} balance - Bilan (consommé - dépensé)
 * @returns {string} 'surplus' | 'maintien' | 'deficit'
 */
export const getBalanceClassification = (balance) => {
  // Seuils : ±200 kcal = maintien
  if (balance > 200) return 'surplus';
  if (balance < -200) return 'deficit';
  return 'maintien';
};

// ==================== CALCULS CONFORMITÉ PROGRAMME ====================

/**
 * Calcule la conformité à un programme sur une plage de dates
 * 
 * ✅ PHASE 10.5 : Validation dates, protection division par zéro, validation résultats
 * 
 * @param {string} programId - ID du programme
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {Object} program - Programme avec targets
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Statistiques de conformité
 * @throws {NutritionError} Si validation échoue
 */
export const calculateProgramCompliance = (programId, dailyMeals, program, startDate, endDate) => {
  try {
    // ✅ PHASE 10.5 : Validation inputs
    if (!Array.isArray(dailyMeals)) {
      throw new NutritionError(
        NutritionErrorCodes.VALIDATION_INVALID_DATA,
        'dailyMeals doit être un tableau',
        { dailyMeals, type: typeof dailyMeals }
      );
    }
    
    // ✅ PHASE 10.5 : Valider plage de dates
    try {
      validateDateRange({ startDate, endDate });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT,
          'Plage de dates invalide',
          { startDate, endDate, errors: error.errors }
        );
      }
      throw error;
    }
    
    // ✅ PHASE 10.5 : Normaliser dates pour comparaison fiable
    const normalizedStartDate = DateHelper.toYYYYMMDD(startDate);
    const normalizedEndDate = DateHelper.toYYYYMMDD(endDate);
    
    if (!normalizedStartDate || !normalizedEndDate) {
      throw new NutritionError(
        NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT,
        'Impossible de normaliser les dates',
        { startDate, endDate }
      );
    }
    
    if (!program || dailyMeals.length === 0) {
      return {
        daysTotal: 0,
        daysWithData: 0,
        avgComplianceScore: 0,
        caloriesCompliance: { avg: 0, days: 0 },
        proteinCompliance: { avg: 0, days: 0 },
        carbsCompliance: { avg: 0, days: 0 },
        fatCompliance: { avg: 0, days: 0 }
      };
    }

    // ✅ PHASE 10.5 : Filtrer dailyMeals dans la plage avec dates normalisées
    const filteredMeals = dailyMeals.filter(dm => {
      if (!dm || !dm.date) return false;
      const normalizedDate = DateHelper.toYYYYMMDD(dm.date);
      if (!normalizedDate) return false;
      
      const inRange = normalizedDate >= normalizedStartDate && normalizedDate <= normalizedEndDate;
      const correctProgram = !programId || dm.programId === programId;
      return inRange && correctProgram;
    });

    if (filteredMeals.length === 0) {
      return {
        daysTotal: 0,
        daysWithData: 0,
        avgComplianceScore: 0,
        caloriesCompliance: { avg: 0, days: 0 },
        proteinCompliance: { avg: 0, days: 0 },
        carbsCompliance: { avg: 0, days: 0 },
        fatCompliance: { avg: 0, days: 0 }
      };
    }

    // ✅ PHASE 10.5 : Calculer statistiques avec validation
    let totalComplianceScore = 0;
    let totalCaloriesCompliance = 0;
    let totalProteinCompliance = 0;
    let totalCarbsCompliance = 0;
    let totalFatCompliance = 0;
    let daysWithData = 0;

    filteredMeals.forEach(dm => {
      if (dm.dailyTotals) {
        daysWithData++;
        
        // ✅ Utiliser validateAndNormalizeNumber pour garantir valeurs valides
        totalComplianceScore += validateAndNormalizeNumber(dm.dailyTotals.complianceScore, {
          fieldName: 'dailyTotals.complianceScore',
          defaultValue: 0,
          min: 0,
          max: 100
        });
        totalCaloriesCompliance += validateAndNormalizeNumber(dm.dailyTotals.complianceCalories, {
          fieldName: 'dailyTotals.complianceCalories',
          defaultValue: 0,
          min: -10000,
          max: 10000
        });
        totalProteinCompliance += validateAndNormalizeNumber(dm.dailyTotals.complianceProtein, {
          fieldName: 'dailyTotals.complianceProtein',
          defaultValue: 0,
          min: -500,
          max: 500
        });
        totalCarbsCompliance += validateAndNormalizeNumber(dm.dailyTotals.complianceCarbs, {
          fieldName: 'dailyTotals.complianceCarbs',
          defaultValue: 0,
          min: -1000,
          max: 1000
        });
        totalFatCompliance += validateAndNormalizeNumber(dm.dailyTotals.complianceFat, {
          fieldName: 'dailyTotals.complianceFat',
          defaultValue: 0,
          min: -500,
          max: 500
        });
      }
    });

    // ✅ PHASE 10.5 : Division sécurisée pour moyennes
    const avgComplianceScore = safeDivision(totalComplianceScore, daysWithData, {
      operation: 'calculateProgramCompliance.avgComplianceScore',
      defaultValue: 0
    });

    // ✅ PHASE 10.5 : Valider résultats finaux
    const result = {
      daysTotal: validateCalculationResult(filteredMeals.length, {
        fieldName: 'daysTotal',
        operation: 'calculateProgramCompliance',
        min: 0,
        max: 10000
      }),
      daysWithData: validateCalculationResult(daysWithData, {
        fieldName: 'daysWithData',
        operation: 'calculateProgramCompliance',
        min: 0,
        max: 10000
      }),
      avgComplianceScore: validateCalculationResult(Math.round(avgComplianceScore), {
        fieldName: 'avgComplianceScore',
        operation: 'calculateProgramCompliance',
        min: 0,
        max: 100
      }),
      caloriesCompliance: {
        avg: validateCalculationResult(
          Math.round(safeDivision(totalCaloriesCompliance, daysWithData, {
            operation: 'calculateProgramCompliance.caloriesCompliance.avg',
            defaultValue: 0
          })),
          {
            fieldName: 'caloriesCompliance.avg',
            operation: 'calculateProgramCompliance',
            min: -10000,
            max: 10000
          }
        ),
        days: daysWithData
      },
      proteinCompliance: {
        avg: validateCalculationResult(
          Math.round(safeDivision(totalProteinCompliance, daysWithData, {
            operation: 'calculateProgramCompliance.proteinCompliance.avg',
            defaultValue: 0
          }) * 10) / 10,
          {
            fieldName: 'proteinCompliance.avg',
            operation: 'calculateProgramCompliance',
            min: -500,
            max: 500
          }
        ),
        days: daysWithData
      },
      carbsCompliance: {
        avg: validateCalculationResult(
          Math.round(safeDivision(totalCarbsCompliance, daysWithData, {
            operation: 'calculateProgramCompliance.carbsCompliance.avg',
            defaultValue: 0
          }) * 10) / 10,
          {
            fieldName: 'carbsCompliance.avg',
            operation: 'calculateProgramCompliance',
            min: -1000,
            max: 1000
          }
        ),
        days: daysWithData
      },
      fatCompliance: {
        avg: validateCalculationResult(
          Math.round(safeDivision(totalFatCompliance, daysWithData, {
            operation: 'calculateProgramCompliance.fatCompliance.avg',
            defaultValue: 0
          }) * 10) / 10,
          {
            fieldName: 'fatCompliance.avg',
            operation: 'calculateProgramCompliance',
            min: -500,
            max: 500
          }
        ),
        days: daysWithData
      }
    };
    
    return result;
  } catch (error) {
    // ✅ PHASE 10.5 : Gestion erreurs standardisée
    if (error instanceof NutritionError) {
      log.error('[calculateProgramCompliance] Erreur calcul:', error.toJSON());
      throw error;
    }
    
    // Wrapper erreurs inconnues
    log.error('[calculateProgramCompliance] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_ERROR,
      'Erreur lors du calcul de la conformité programme',
      { originalError: error.message, programId, startDate, endDate },
      error
    );
  }
};

// ==================== CALCULS STATISTIQUES ====================

/**
 * Calcule les statistiques nutritionnelles sur une plage de dates
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Statistiques complètes
 */
export const getNutritionStats = (dailyMeals = [], startDate, endDate) => {
  // Filtrer dans la plage
  const filtered = dailyMeals.filter(dm => 
    dm.date >= startDate && dm.date <= endDate && dm.dailyTotals
  );

  if (filtered.length === 0) {
    return {
      days: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      totalCalories: 0,
      variability: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
  }

  // Calculer moyennes
  const totals = filtered.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += dt.calories || 0;
    acc.protein += dt.protein || 0;
    acc.carbs += dt.carbs || 0;
    acc.fat += dt.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const days = filtered.length;
  const avgCalories = Math.round(totals.calories / days);
  const avgProtein = Math.round((totals.protein / days) * 10) / 10;
  const avgCarbs = Math.round((totals.carbs / days) * 10) / 10;
  const avgFat = Math.round((totals.fat / days) * 10) / 10;

  // Calculer variabilité (écart-type)
  const variability = calculateVariability(filtered);

  return {
    days,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    totalCalories: totals.calories,
    variability
  };
};

/**
 * Calcule la variabilité (écart-type) des macros
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @returns {Object} Variabilité pour chaque macro
 */
const calculateVariability = (dailyMeals) => {
  if (dailyMeals.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // Calculer moyennes
  const means = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += dt.calories || 0;
    acc.protein += dt.protein || 0;
    acc.carbs += dt.carbs || 0;
    acc.fat += dt.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const n = dailyMeals.length;
  means.calories /= n;
  means.protein /= n;
  means.carbs /= n;
  means.fat /= n;

  // Calculer variance
  const variances = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += Math.pow((dt.calories || 0) - means.calories, 2);
    acc.protein += Math.pow((dt.protein || 0) - means.protein, 2);
    acc.carbs += Math.pow((dt.carbs || 0) - means.carbs, 2);
    acc.fat += Math.pow((dt.fat || 0) - means.fat, 2);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Écart-type = sqrt(variance / n)
  return {
    calories: Math.round(Math.sqrt(variances.calories / n)),
    protein: Math.round((Math.sqrt(variances.protein / n)) * 10) / 10,
    carbs: Math.round((Math.sqrt(variances.carbs / n)) * 10) / 10,
    fat: Math.round((Math.sqrt(variances.fat / n)) * 10) / 10
  };
};

/**
 * Calcule la distribution des macros sur une période
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Distribution moyenne des macros
 */
export const getMacroDistribution = (dailyMeals = [], startDate, endDate) => {
  const filtered = dailyMeals.filter(dm => 
    dm.date >= startDate && dm.date <= endDate && dm.dailyTotals
  );

  if (filtered.length === 0) {
    return {
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  const totals = filtered.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.protein += dt.proteinPercent || 0;
    acc.carbs += dt.carbsPercent || 0;
    acc.fat += dt.fatPercent || 0;
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });

  const n = filtered.length;
  return {
    protein: Math.round(totals.protein / n),
    carbs: Math.round(totals.carbs / n),
    fat: Math.round(totals.fat / n)
  };
};

// ==================== HELPERS ====================

// ==================== HELPERS (DÉLÉGUÉS AUX HELPERS CENTRALISÉS) ====================

/**
 * ✅ PHASE 14.1 : Délégation aux helpers centralisés pour éviter duplication
 * Ces fonctions sont maintenant dans nutritionHelpers.js mais sont réexportées
 * ici pour rétrocompatibilité avec le code existant.
 * 
 * @deprecated Utiliser directement depuis services/nutrition/helpers/nutritionHelpers
 */

import {
  generateMealId,
  generateProgramId,
  generateFavoriteFoodId,
  formatDate,
  daysBetween
} from '../services/nutrition/helpers/nutritionHelpers';

// Réexporter pour rétrocompatibilité
export { generateMealId, generateProgramId, generateFavoriteFoodId, formatDate, daysBetween };

