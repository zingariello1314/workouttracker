/**
 * dataPreparationService.js
 * 
 * ✅ PHASE 12.1 : Service de préparation des données nutrition pour partage
 * 
 * Prépare les données nutrition selon le scope de partage (stats, charts, progress)
 * en anonymisant les informations personnelles identifiables.
 * 
 * @module services/nutrition/sharing/dataPreparation/dataPreparationService
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 10
 */

import { SHARE_SCOPES } from '../constants';
import DateHelper from '../../../../utils/dateHelper';
import logger from '../../../../utils/logger';
// ✅ OPTIMISATION Phase 15.4 : Cache calculs avec hash inputs
import { 
  getNutritionCalculationCache, 
  getDailyMealsCalculationHash 
} from '../../nutritionCalculationCache';
// ✅ OPTIMISATION Phase 15.5 : Web Workers pour calculs lourds
import { executeInWorker } from '../../nutritionWorkerService';
import { NutritionConfig } from '../../../../config/nutrition.config';
// ✅ PHASE 15.7 : Validation limites complète avec helpers
import {
  validateAndNormalizeNumber,
  safeDivision
} from '../../nutritionCalculationHelpers';

const log = logger.module('dataPreparation');

/**
 * Prépare les données nutrition pour partage selon scope
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {string} scope - Scope partage (SHARE_SCOPES.all|stats|charts|progress)
 * @returns {Object} Données partagées anonymisées
 */
export async function prepareNutritionDataForShare(nutritionData, scope = SHARE_SCOPES.all) {
  const {
    dailyMeals = [],
    meals = [],
    programs = [],
    gamification = {},
    hydrationLogs = []
  } = nutritionData;
  
  try {
    const sharedData = {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Scope: all ou stats
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.stats) {
      // Stats agrégées (anonymisées)
      sharedData.stats = calculateAggregatedStats(dailyMeals, meals, programs);
    }
    
    // Scope: all ou charts
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.charts) {
      // Données graphiques (anonymisées)
      sharedData.charts = prepareChartData(dailyMeals, meals, programs);
    }
    
    // Scope: all ou progress
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.progress) {
      // Données progression (anonymisées)
      sharedData.progress = prepareProgressData(dailyMeals, meals, programs, gamification);
    }
    
    log.debug('[prepareNutritionDataForShare] Données préparées', {
      scope,
      hasStats: !!sharedData.stats,
      hasCharts: !!sharedData.charts,
      hasProgress: !!sharedData.progress
    });
    
    return sharedData;
  } catch (error) {
    log.error('[prepareNutritionDataForShare] Erreur préparation données:', error);
    return {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0',
      error: error.message
    };
  }
}

/**
 * Calcule les statistiques agrégées (anonymisées)
 * 
 * ✅ OPTIMISATION Phase 15.4 : Cache avec hash inputs pour éviter recalculs identiques
 * ✅ OPTIMISATION Phase 15.5 : Web Workers pour calculs lourds (non bloquants)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Promise<Object>} Statistiques agrégées
 */
async function calculateAggregatedStats(dailyMeals, meals, programs) {
  try {
    // ✅ OPTIMISATION Phase 15.4 : Vérifier cache avant calculs coûteux
    if (NutritionConfig.features.enableCalculationCache) {
      const hash = getDailyMealsCalculationHash(dailyMeals, meals, programs, {});
      const cache = getNutritionCalculationCache();
      const cacheKey = `aggregatedStats:${hash}`;
      
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    // ✅ OPTIMISATION Phase 15.5 : Utiliser Web Worker pour calculs lourds (non bloquants)
    // Fallback automatique vers main thread si worker non disponible
    if (NutritionConfig.features.enableWebWorkers) {
      try {
        const workerResult = await executeInWorker(
          'calculateAggregatedStats',
          { dailyMeals, meals, programs },
          // Fallback : calculer dans main thread
          () => calculateAggregatedStatsMainThread(dailyMeals, meals, programs)
        );
        
        // Mettre en cache le résultat
        if (NutritionConfig.features.enableCalculationCache) {
          const hash = getDailyMealsCalculationHash(dailyMeals, meals, programs, {});
          const cache = getNutritionCalculationCache();
          cache.set(`aggregatedStats:${hash}`, workerResult);
        }
        
        return workerResult;
      } catch (workerError) {
        log.warn('[calculateAggregatedStats] Erreur worker, fallback main thread:', workerError);
        // Continuer avec fallback
      }
    }
    
    // Fallback : calculer dans main thread
    return calculateAggregatedStatsMainThread(dailyMeals, meals, programs);
  } catch (error) {
    log.error('[calculateAggregatedStats] Erreur calcul stats:', error);
    return {
      periods: {},
      totalDays: 0,
      totalMeals: 0,
      activeProgram: null
    };
  }
}

/**
 * ✅ OPTIMISATION Phase 15.5 : Version main thread (fallback)
 */
function calculateAggregatedStatsMainThread(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Calculer moyennes sur 7, 30, 90 jours
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90
    };
    
    const stats = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDateStr = DateHelper.toYYYYMMDD(now);
      const startDateStr = DateHelper.getDaysAgoLocal(days);
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      if (periodDailyMeals.length === 0) {
        stats[period] = {
          days: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          avgCompliance: 0,
          totalMeals: 0
        };
        return;
      }
      
      // ✅ PHASE 15.7 : Calculer totaux avec validation
      const totals = periodDailyMeals.reduce((acc, dm) => {
        const dailyTotals = dm.dailyTotals || {};
        return {
          calories: acc.calories + validateAndNormalizeNumber(dailyTotals.calories, {
            fieldName: 'dailyTotals.calories',
            defaultValue: 0,
            min: 0,
            max: 50000
          }),
          protein: acc.protein + validateAndNormalizeNumber(dailyTotals.protein, {
            fieldName: 'dailyTotals.protein',
            defaultValue: 0,
            min: 0,
            max: 2000
          }),
          carbs: acc.carbs + validateAndNormalizeNumber(dailyTotals.carbs, {
            fieldName: 'dailyTotals.carbs',
            defaultValue: 0,
            min: 0,
            max: 5000
          }),
          fat: acc.fat + validateAndNormalizeNumber(dailyTotals.fat, {
            fieldName: 'dailyTotals.fat',
            defaultValue: 0,
            min: 0,
            max: 2000
          }),
          compliance: acc.compliance + validateAndNormalizeNumber(dailyTotals.complianceScore, {
            fieldName: 'dailyTotals.complianceScore',
            defaultValue: 0,
            min: 0,
            max: 100
          }),
          meals: acc.meals + validateAndNormalizeNumber(dm.mealIds?.length, {
            fieldName: 'mealIds.length',
            defaultValue: 0,
            min: 0,
            max: 100
          })
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0, meals: 0 });
      
      const daysCount = periodDailyMeals.length;
      
      // ✅ PHASE 15.7 : Division sécurisée pour moyennes
      stats[period] = {
        days: daysCount,
        avgCalories: Math.round(safeDivision(totals.calories, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgCalories`,
          defaultValue: 0
        })),
        avgProtein: Math.round((safeDivision(totals.protein, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgProtein`,
          defaultValue: 0
        })) * 10) / 10,
        avgCarbs: Math.round((safeDivision(totals.carbs, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgCarbs`,
          defaultValue: 0
        })) * 10) / 10,
        avgFat: Math.round((safeDivision(totals.fat, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgFat`,
          defaultValue: 0
        })) * 10) / 10,
        avgCompliance: Math.round((safeDivision(totals.compliance, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgCompliance`,
          defaultValue: 0
        })) * 10) / 10,
        totalMeals: totals.meals,
        avgMealsPerDay: Math.round((safeDivision(totals.meals, daysCount, {
          operation: `calculateAggregatedStats.${period}.avgMealsPerDay`,
          defaultValue: 0
        })) * 10) / 10
      };
    });
    
    // Statistiques globales
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const activeProgramName = activeProgram?.name || null;
    const activeProgramGoal = activeProgram?.goal || null;
    
    const result = {
      periods: stats,
      totalDays,
      totalMeals,
      activeProgram: activeProgramName ? {
        name: activeProgramName,
        goal: activeProgramGoal,
        // Ne pas exposer calories/macros exacts du programme (privacy)
        hasProgram: true
      } : null,
      // Ne pas exposer données personnelles identifiables
      // Pas de dates exactes, pas de poids, pas de noms d'aliments
    };
    
    // ✅ OPTIMISATION Phase 15.4 : Mettre en cache le résultat (si pas déjà fait par worker)
    if (NutritionConfig.features.enableCalculationCache) {
      const hash = getDailyMealsCalculationHash(dailyMeals, meals, programs, {});
      const cache = getNutritionCalculationCache();
      const cacheKey = `aggregatedStats:${hash}`;
      // Vérifier si pas déjà en cache (peut être mis par worker)
      if (!cache.get(cacheKey)) {
        cache.set(cacheKey, result);
      }
    }
    
    return result;
  } catch (error) {
    log.error('[calculateAggregatedStatsMainThread] Erreur calcul stats:', error);
    return {
      periods: {},
      totalDays: 0,
      totalMeals: 0,
      activeProgram: null
    };
  }
}

/**
 * Prépare les données graphiques (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Données graphiques
 */
function prepareChartData(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Préparer données pour graphiques (30 derniers jours)
    const now = new Date();
    // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
    const endDateStr = DateHelper.toYYYYMMDD(now);
    const startDateStr = DateHelper.getDaysAgoLocal(30);
    
    const chartDailyMeals = dailyMeals.filter(dm => {
      const date = dm.date || dm.timestamp;
      return date >= startDateStr && date <= endDateStr;
    }).sort((a, b) => {
      const dateA = a.date || a.timestamp;
      const dateB = b.date || b.timestamp;
      return dateA.localeCompare(dateB);
    });
    
    // Données pour graphiques (sans dates exactes, utiliser index)
    const chartData = chartDailyMeals.map((dm, index) => {
      const dailyTotals = dm.dailyTotals || {};
      return {
        day: index + 1, // Index au lieu de date exacte (privacy)
        calories: dailyTotals.calories || 0,
        protein: dailyTotals.protein || 0,
        carbs: dailyTotals.carbs || 0,
        fat: dailyTotals.fat || 0,
        compliance: dailyTotals.complianceScore || 0
      };
    });
    
    // Distributions macros (pourcentages)
    const macroDistribution = chartDailyMeals.reduce((acc, dm) => {
      const dailyTotals = dm.dailyTotals || {};
      const proteinPercent = dailyTotals.proteinPercent || 0;
      const carbsPercent = dailyTotals.carbsPercent || 0;
      const fatPercent = dailyTotals.fatPercent || 0;
      
      return {
        protein: acc.protein + proteinPercent,
        carbs: acc.carbs + carbsPercent,
        fat: acc.fat + fatPercent,
        count: acc.count + 1
      };
    }, { protein: 0, carbs: 0, fat: 0, count: 0 });
    
    const daysCount = macroDistribution.count || 1;
    
    return {
      timeline: chartData,
      macroDistribution: {
        protein: Math.round((macroDistribution.protein / daysCount) * 10) / 10,
        carbs: Math.round((macroDistribution.carbs / daysCount) * 10) / 10,
        fat: Math.round((macroDistribution.fat / daysCount) * 10) / 10
      },
      // Ne pas exposer dates exactes, noms d'aliments, etc.
    };
  } catch (error) {
    log.error('[prepareChartData] Erreur préparation données graphiques:', error);
    return {
      timeline: [],
      macroDistribution: { protein: 0, carbs: 0, fat: 0 }
    };
  }
}

/**
 * Prépare les données progression (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @param {Object} gamification - Données gamification
 * @returns {Object} Données progression
 */
function prepareProgressData(dailyMeals, meals, programs, gamification) {
  try {
    const streaks = gamification?.streaks || {};
    const achievements = gamification?.achievements || [];
    const experience = gamification?.experience || { currentXP: 0, level: 1 };
    
    // Statistiques progression (anonymisées)
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const nutritionStreak = streaks.nutrition?.current || 0;
    const level = experience.level || 1;
    const badgesCount = achievements.length;
    
    // Tendances (sans dates exactes)
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30
    };
    
    const trends = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDateStr = DateHelper.toYYYYMMDD(now);
      const startDateStr = DateHelper.getDaysAgoLocal(days);
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      const avgCompliance = periodDailyMeals.length > 0
        ? periodDailyMeals.reduce((sum, dm) => sum + (dm.dailyTotals?.complianceScore || 0), 0) / periodDailyMeals.length
        : 0;
      
      trends[period] = {
        days: periodDailyMeals.length,
        avgCompliance: Math.round(avgCompliance * 10) / 10,
        totalMeals: periodDailyMeals.reduce((sum, dm) => sum + (dm.mealIds?.length || 0), 0)
      };
    });
    
    return {
      totalDays,
      totalMeals,
      streak: nutritionStreak,
      level,
      badgesCount,
      trends,
      // Ne pas exposer données personnelles identifiables
    };
  } catch (error) {
    log.error('[prepareProgressData] Erreur préparation données progression:', error);
    return {
      totalDays: 0,
      totalMeals: 0,
      streak: 0,
      level: 1,
      badgesCount: 0,
      trends: {}
    };
  }
}


