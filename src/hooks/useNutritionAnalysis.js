/**
 * useNutritionAnalysis.js
 * 
 * Hook React pour l'analyse complète des données nutrition.
 * 
 * Ce hook fournit une analyse approfondie de la nutrition :
 * - Analyse des calories (totales, moyennes, tendances, conformité)
 * - Analyse des macros (protéines, glucides, lipides, distribution)
 * - Régularité des repas (fréquence, timing)
 * - Conformité au programme actif
 * - Hydratation
 * - Détection de patterns et anomalies
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Support de différentes périodes d'analyse
 * - Gestion gracieuse des données manquantes
 * 
 * @module hooks/useNutritionAnalysis
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

/**
 * Calcule les statistiques d'une série de valeurs numériques
 * @param {Array<number>} values - Valeurs à analyser
 * @returns {Object} Statistiques (min, max, avg, median, trend)
 */
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (validValues.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calcul de la tendance (comparaison première moitié vs deuxième moitié)
  let trend = null;
  if (validValues.length >= 4) {
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    const percentChange = (diff / firstAvg) * 100;
    trend = {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      percentChange: Math.round(percentChange * 10) / 10,
      value: diff
    };
  }
  
  return { min, max, avg: Math.round(avg * 10) / 10, median, trend, count: validValues.length };
}

/**
 * Calcule la distribution des macros en pourcentage
 * @param {number} protein - Protéines (g)
 * @param {number} carbs - Glucides (g)
 * @param {number} fat - Lipides (g)
 * @returns {Object} Distribution en pourcentage
 */
function calculateMacroDistribution(protein, carbs, fat) {
  const total = protein + carbs + fat;
  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }
  
  return {
    protein: Math.round((protein / total) * 100),
    carbs: Math.round((carbs / total) * 100),
    fat: Math.round((fat / total) * 100)
  };
}

/**
 * Hook pour analyser les données nutrition
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste des meals (optionnel, pour analyse détaillée)
 * @param {Object} activeProgram - Programme actif (optionnel)
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Analyse complète de la nutrition ou null si aucune donnée
 * @returns {Object} returns.calories - Analyse calories (stats, trend, compliance)
 * @returns {Object} returns.macros - Analyse macros (protein, carbs, fat, distribution)
 * @returns {Object} returns.mealRegularity - Régularité des repas (frequency, timing)
 * @returns {Object} returns.programCompliance - Conformité au programme actif
 * @returns {Object} returns.hydration - Analyse hydratation (si disponible)
 * @returns {Array} returns.anomalies - Anomalies détectées
 * @returns {Object} returns.period - Période analysée
 * 
 * @example
 * const analysis = useNutritionAnalysis(dailyMeals, meals, activeProgram, { period: '30days' });
 * 
 * if (analysis) {
 *   console.log(`Calories moyennes: ${analysis.calories.stats.avg}`);
 *   console.log(`Conformité: ${analysis.programCompliance.rate}%`);
 * }
 */
export function useNutritionAnalysis(dailyMeals, meals = [], activeProgram = null, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!Array.isArray(dailyMeals) || dailyMeals.length === 0) {
      return null;
    }
    
    // Calculer les dates de période
    let startDate, endDate;
    const today = DateHelper.getTodayLocal();
    
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const end = new Date(today + 'T23:59:59');
      endDate = today;
      
      const start = new Date(today);
      switch (period) {
        case '7days':
          start.setDate(start.getDate() - 7);
          break;
        case '30days':
          start.setDate(start.getDate() - 30);
          break;
        case '90days':
          start.setDate(start.getDate() - 90);
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'all':
        default:
          // Pour 'all', prendre la première dailyMeal comme début
          const firstDate = dailyMeals
            .map(dm => dm.date)
            .filter(Boolean)
            .sort()[0];
          startDate = firstDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les dailyMeals dans la période
    const filteredDailyMeals = dailyMeals.filter(dm => {
      if (!dm?.date) return false;
      try {
        const date = new Date(dm.date + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredDailyMeals.length === 0) {
      return null;
    }
    
    // ==================== ANALYSE CALORIES ====================
    const caloriesValues = filteredDailyMeals
      .map(dm => {
        const totals = dm.dailyTotals || {};
        return totals.totalCalories || null;
      })
      .filter(v => v !== null && v > 0);
    
    const caloriesStats = calculateStats(caloriesValues);
    
    // Conformité calories (si programme actif)
    let caloriesCompliance = null;
    if (activeProgram && activeProgram.targetCalories) {
      const targetCalories = activeProgram.targetCalories;
      const compliantDays = filteredDailyMeals.filter(dm => {
        const calories = dm.dailyTotals?.totalCalories || 0;
        // Tolérance de ±10%
        const minTarget = targetCalories * 0.9;
        const maxTarget = targetCalories * 1.1;
        return calories >= minTarget && calories <= maxTarget;
      }).length;
      
      caloriesCompliance = {
        target: targetCalories,
        compliantDays,
        totalDays: filteredDailyMeals.length,
        rate: filteredDailyMeals.length > 0
          ? Math.round((compliantDays / filteredDailyMeals.length) * 100)
          : 0,
        avgDeviation: caloriesStats.avg !== null
          ? Math.round(Math.abs(caloriesStats.avg - targetCalories))
          : null
      };
    }
    
    // ==================== ANALYSE MACROS ====================
    const proteinValues = filteredDailyMeals
      .map(dm => dm.dailyTotals?.totalProtein || null)
      .filter(v => v !== null && v > 0);
    
    const carbsValues = filteredDailyMeals
      .map(dm => dm.dailyTotals?.totalCarbs || null)
      .filter(v => v !== null && v > 0);
    
    const fatValues = filteredDailyMeals
      .map(dm => dm.dailyTotals?.totalFat || null)
      .filter(v => v !== null && v > 0);
    
    const proteinStats = calculateStats(proteinValues);
    const carbsStats = calculateStats(carbsValues);
    const fatStats = calculateStats(fatValues);
    
    // Distribution moyenne des macros
    const avgProtein = proteinStats.avg || 0;
    const avgCarbs = carbsStats.avg || 0;
    const avgFat = fatStats.avg || 0;
    const macroDistribution = calculateMacroDistribution(avgProtein, avgCarbs, avgFat);
    
    // Conformité macros (si programme actif)
    let macrosCompliance = null;
    if (activeProgram && activeProgram.targetProtein && activeProgram.targetCarbs && activeProgram.targetFat) {
      const compliantDays = filteredDailyMeals.filter(dm => {
        const totals = dm.dailyTotals || {};
        const protein = totals.totalProtein || 0;
        const carbs = totals.totalCarbs || 0;
        const fat = totals.totalFat || 0;
        
        // Tolérance de ±15% pour chaque macro
        const proteinOk = Math.abs(protein - activeProgram.targetProtein) <= activeProgram.targetProtein * 0.15;
        const carbsOk = Math.abs(carbs - activeProgram.targetCarbs) <= activeProgram.targetCarbs * 0.15;
        const fatOk = Math.abs(fat - activeProgram.targetFat) <= activeProgram.targetFat * 0.15;
        
        return proteinOk && carbsOk && fatOk;
      }).length;
      
      macrosCompliance = {
        target: {
          protein: activeProgram.targetProtein,
          carbs: activeProgram.targetCarbs,
          fat: activeProgram.targetFat
        },
        compliantDays,
        totalDays: filteredDailyMeals.length,
        rate: filteredDailyMeals.length > 0
          ? Math.round((compliantDays / filteredDailyMeals.length) * 100)
          : 0
      };
    }
    
    // ==================== ANALYSE RÉGULARITÉ DES REPAS ====================
    // Compter les jours avec repas enregistrés
    const daysWithMeals = filteredDailyMeals.filter(dm => {
      const mealIds = dm.mealIds || [];
      return Array.isArray(mealIds) && mealIds.length > 0;
    }).length;
    
    const mealFrequency = {
      daysWithMeals,
      totalDays: filteredDailyMeals.length,
      rate: filteredDailyMeals.length > 0
        ? Math.round((daysWithMeals / filteredDailyMeals.length) * 100)
        : 0
    };
    
    // Analyse du timing des repas (si meals disponibles)
    let mealTiming = null;
    if (Array.isArray(meals) && meals.length > 0) {
      const filteredMeals = meals.filter(meal => {
        if (!meal?.date) return false;
        try {
          const date = new Date(meal.date + 'T00:00:00');
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          return !isNaN(date.getTime()) && date >= start && date <= end;
        } catch {
          return false;
        }
      });
      
      if (filteredMeals.length > 0) {
        const mealsByType = {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0
        };
        
        filteredMeals.forEach(meal => {
          const type = meal.type?.toLowerCase();
          if (type && mealsByType[type] !== undefined) {
            mealsByType[type]++;
          }
        });
        
        mealTiming = {
          byType: mealsByType,
          total: filteredMeals.length
        };
      }
    }
    
    // ==================== ANALYSE HYDRATATION ====================
    // Note: L'hydratation est dans un store séparé, on ne l'analyse pas ici pour l'instant
    // Mais on peut l'ajouter plus tard si nécessaire
    
    // ==================== DÉTECTION D'ANOMALIES ====================
    const anomalies = [];
    
    // Calories insuffisantes ou excessives
    if (caloriesStats.avg !== null) {
      if (caloriesStats.avg < 1200) {
        anomalies.push({
          type: 'low_calories',
          severity: 'high',
          message: `Calories moyennes très basses: ${Math.round(caloriesStats.avg)} kcal/jour (minimum recommandé: 1200 kcal)`,
          recommendation: 'Augmenter progressivement les calories pour éviter carences et ralentissement métabolique'
        });
      } else if (caloriesStats.avg > 4000) {
        anomalies.push({
          type: 'high_calories',
          severity: 'medium',
          message: `Calories moyennes très élevées: ${Math.round(caloriesStats.avg)} kcal/jour`,
          recommendation: 'Vérifier la précision des données, ajuster si nécessaire selon objectifs'
        });
      }
    }
    
    // Protéines insuffisantes (recommandé: 1.6-2.2g/kg pour sportifs)
    if (proteinStats.avg !== null && proteinStats.avg < 100) {
      anomalies.push({
        type: 'low_protein',
        severity: 'medium',
        message: `Protéines moyennes faibles: ${Math.round(proteinStats.avg)}g/jour (recommandé: 100-150g+)`,
        recommendation: 'Augmenter apport protéique pour récupération et développement musculaire'
      });
    }
    
    // Conformité programme faible
    if (caloriesCompliance && caloriesCompliance.rate < 50) {
      anomalies.push({
        type: 'low_program_compliance',
        severity: 'medium',
        message: `Faible conformité au programme: ${caloriesCompliance.rate}% (objectif: ${caloriesCompliance.target} kcal)`,
        recommendation: 'Améliorer l\'adhérence au programme pour optimiser les résultats'
      });
    }
    
    // Régularité des repas faible
    if (mealFrequency.rate < 50) {
      anomalies.push({
        type: 'low_meal_regularity',
        severity: 'low',
        message: `Repas enregistrés seulement ${mealFrequency.rate}% des jours`,
        recommendation: 'Enregistrer les repas plus régulièrement pour meilleure analyse'
      });
    }
    
    return {
      calories: {
        stats: caloriesStats,
        trend: caloriesStats.trend,
        compliance: caloriesCompliance
      },
      macros: {
        protein: proteinStats,
        carbs: carbsStats,
        fat: fatStats,
        distribution: macroDistribution,
        compliance: macrosCompliance
      },
      mealRegularity: {
        frequency: mealFrequency,
        timing: mealTiming
      },
      programCompliance: {
        calories: caloriesCompliance,
        macros: macrosCompliance,
        overall: caloriesCompliance && macrosCompliance
          ? Math.round((caloriesCompliance.rate + macrosCompliance.rate) / 2)
          : caloriesCompliance?.rate || macrosCompliance?.rate || null
      },
      anomalies,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        daysCount: filteredDailyMeals.length
      }
    };
  }, [dailyMeals, meals, activeProgram, period, customStartDate, customEndDate]);
}





