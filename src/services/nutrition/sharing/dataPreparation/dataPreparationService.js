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

const log = logger.module('dataPreparation');

/**
 * Prépare les données nutrition pour partage selon scope
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {string} scope - Scope partage (SHARE_SCOPES.all|stats|charts|progress)
 * @returns {Object} Données partagées anonymisées
 */
export function prepareNutritionDataForShare(nutritionData, scope = SHARE_SCOPES.all) {
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
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Statistiques agrégées
 */
function calculateAggregatedStats(dailyMeals, meals, programs) {
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
      
      const totals = periodDailyMeals.reduce((acc, dm) => {
        const dailyTotals = dm.dailyTotals || {};
        return {
          calories: acc.calories + (dailyTotals.calories || 0),
          protein: acc.protein + (dailyTotals.protein || 0),
          carbs: acc.carbs + (dailyTotals.carbs || 0),
          fat: acc.fat + (dailyTotals.fat || 0),
          compliance: acc.compliance + (dailyTotals.complianceScore || 0),
          meals: acc.meals + (dm.mealIds?.length || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0, meals: 0 });
      
      const daysCount = periodDailyMeals.length;
      
      stats[period] = {
        days: daysCount,
        avgCalories: Math.round(totals.calories / daysCount),
        avgProtein: Math.round((totals.protein / daysCount) * 10) / 10,
        avgCarbs: Math.round((totals.carbs / daysCount) * 10) / 10,
        avgFat: Math.round((totals.fat / daysCount) * 10) / 10,
        avgCompliance: Math.round((totals.compliance / daysCount) * 10) / 10,
        totalMeals: totals.meals,
        avgMealsPerDay: Math.round((totals.meals / daysCount) * 10) / 10
      };
    });
    
    // Statistiques globales
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const activeProgramName = activeProgram?.name || null;
    const activeProgramGoal = activeProgram?.goal || null;
    
    return {
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


