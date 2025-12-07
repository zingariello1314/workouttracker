/**
 * useNutritionWorkoutCorrelations.js
 * 
 * Hook React pour analyser les corrélations entre données nutrition et entraînements.
 * 
 * Ce hook identifie les relations entre :
 * - Calories et performance d'entraînement
 * - Protéines et récupération/résultats
 * - Timing nutritionnel et performance
 * - Conformité programme et régularité entraînement
 * - Déficit/surplus calorique et progression
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs de corrélation optimisés
 * - Gestion gracieuse des données manquantes
 * - Support de différentes périodes d'analyse
 * 
 * @module hooks/useNutritionWorkoutCorrelations
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

/**
 * Calcule le coefficient de corrélation de Pearson entre deux séries
 * @param {Array<number>} x - Première série
 * @param {Array<number>} y - Deuxième série
 * @returns {number|null} Coefficient de corrélation (-1 à 1) ou null si impossible
 */
function calculateCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    return null;
  }
  
  const validPairs = x.map((xi, i) => ({ x: xi, y: y[i] }))
    .filter(pair => pair.x !== null && pair.y !== null && !isNaN(pair.x) && !isNaN(pair.y));
  
  if (validPairs.length < 2) {
    return null;
  }
  
  const n = validPairs.length;
  const sumX = validPairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = validPairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = validPairs.reduce((sum, p) => sum + p.y * p.y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) {
    return null;
  }
  
  return numerator / denominator;
}

/**
 * Calcule l'intensité d'une session d'entraînement
 * @param {Object} session - Session d'entraînement
 * @returns {number} Intensité (0-100)
 */
function calculateWorkoutIntensity(session) {
  if (!session) return 0;
  
  // Calculer l'intensité basée sur les répétitions totales
  let totalReps = 0;
  
  if (session.exercises && Array.isArray(session.exercises)) {
    totalReps = session.exercises.reduce((sum, ex) => {
      const reps = ex.reps || 0;
      return sum + (typeof reps === 'number' ? reps : 0);
    }, 0);
  }
  
  // Normaliser (0-100) basé sur une estimation
  // 100 reps = intensité modérée, 200+ = haute intensité
  const intensity = Math.min(100, (totalReps / 200) * 100);
  
  return Math.round(intensity);
}

/**
 * Hook pour analyser les corrélations entre Nutrition et entraînements
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} workoutHistory - Historique des sessions d'entraînement
 * @param {Object} activeProgram - Programme actif (optionnel)
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Corrélations analysées ou null si données insuffisantes
 * @returns {Object} returns.caloriesWorkout - Corrélation Calories ↔ Performance
 * @returns {Object} returns.proteinWorkout - Corrélation Protéines ↔ Performance
 * @returns {Object} returns.timingWorkout - Corrélation Timing Nutrition ↔ Performance
 * @returns {Object} returns.complianceWorkout - Corrélation Conformité Programme ↔ Régularité
 * @returns {Object} returns.deficitWorkout - Analyse Déficit/Surplus ↔ Progression
 * @returns {Array} returns.insights - Insights et recommandations
 * 
 * @example
 * const correlations = useNutritionWorkoutCorrelations(dailyMeals, workoutHistory, activeProgram, { period: '30days' });
 * 
 * if (correlations) {
 *   console.log(`Corrélation Calories: ${correlations.caloriesWorkout.correlation}`);
 *   console.log(`Insights: ${correlations.insights.length}`);
 * }
 */
export function useNutritionWorkoutCorrelations(dailyMeals, workoutHistory, activeProgram = null, options = {}) {
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
    
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
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
          const firstMealDate = dailyMeals.map(dm => dm.date).filter(Boolean).sort()[0];
          startDate = firstMealDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les dailyMeals et sessions dans la période
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
    
    const filteredSessions = workoutHistory.filter(session => {
      if (!session?.date) return false;
      try {
        const sessionDate = session.date instanceof Date 
          ? DateHelper.toYYYYMMDD(session.date)
          : session.date;
        const date = new Date(sessionDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredSessions.length === 0) {
      return null;
    }
    
    // Créer un mapping date → dailyMeal et date → sessions
    const dailyMealsByDate = {};
    filteredDailyMeals.forEach(dm => {
      if (dm.date) {
        dailyMealsByDate[dm.date] = dm;
      }
    });
    
    const sessionsByDate = {};
    filteredSessions.forEach(session => {
      const sessionDate = session.date instanceof Date 
        ? DateHelper.toYYYYMMDD(session.date)
        : session.date;
      if (sessionDate) {
        if (!sessionsByDate[sessionDate]) {
          sessionsByDate[sessionDate] = [];
        }
        sessionsByDate[sessionDate].push(session);
      }
    });
    
    // ==================== CORRÉLATION CALORIES ↔ PERFORMANCE ====================
    const caloriesWorkoutPairs = [];
    Object.keys(sessionsByDate).forEach(date => {
      const dailyMeal = dailyMealsByDate[date];
      const sessions = sessionsByDate[date] || [];
      
      if (dailyMeal && sessions.length > 0) {
        const calories = dailyMeal.dailyTotals?.totalCalories || null;
        if (calories !== null && calories > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          caloriesWorkoutPairs.push({ calories, intensity: avgIntensity });
        }
      }
    });
    
    const caloriesCorrelation = caloriesWorkoutPairs.length >= 3
      ? calculateCorrelation(
          caloriesWorkoutPairs.map(p => p.calories),
          caloriesWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION PROTÉINES ↔ PERFORMANCE ====================
    const proteinWorkoutPairs = [];
    Object.keys(sessionsByDate).forEach(date => {
      const dailyMeal = dailyMealsByDate[date];
      const sessions = sessionsByDate[date] || [];
      
      if (dailyMeal && sessions.length > 0) {
        const protein = dailyMeal.dailyTotals?.totalProtein || null;
        if (protein !== null && protein > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          proteinWorkoutPairs.push({ protein, intensity: avgIntensity });
        }
      }
    });
    
    const proteinCorrelation = proteinWorkoutPairs.length >= 3
      ? calculateCorrelation(
          proteinWorkoutPairs.map(p => p.protein),
          proteinWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== ANALYSE DÉFICIT/SURPLUS ↔ PROGRESSION ====================
    let deficitAnalysis = null;
    if (activeProgram && activeProgram.targetCalories) {
      const targetCalories = activeProgram.targetCalories;
      
      const deficitDays = [];
      const surplusDays = [];
      const balancedDays = [];
      
      filteredDailyMeals.forEach(dm => {
        const calories = dm.dailyTotals?.totalCalories || 0;
        const date = dm.date;
        const sessions = sessionsByDate[date] || [];
        
        if (sessions.length > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          const deficit = targetCalories - calories;
          
          if (deficit > 200) {
            deficitDays.push({ date, calories, deficit, intensity: avgIntensity });
          } else if (deficit < -200) {
            surplusDays.push({ date, calories, surplus: -deficit, intensity: avgIntensity });
          } else {
            balancedDays.push({ date, calories, intensity: avgIntensity });
          }
        }
      });
      
      const avgIntensityDeficit = deficitDays.length > 0
        ? deficitDays.reduce((sum, d) => sum + d.intensity, 0) / deficitDays.length
        : null;
      
      const avgIntensitySurplus = surplusDays.length > 0
        ? surplusDays.reduce((sum, d) => sum + d.intensity, 0) / surplusDays.length
        : null;
      
      const avgIntensityBalanced = balancedDays.length > 0
        ? balancedDays.reduce((sum, d) => sum + d.intensity, 0) / balancedDays.length
        : null;
      
      deficitAnalysis = {
        deficitDays: deficitDays.length,
        surplusDays: surplusDays.length,
        balancedDays: balancedDays.length,
        avgIntensityDeficit,
        avgIntensitySurplus,
        avgIntensityBalanced,
        intensityDifference: avgIntensityBalanced !== null && avgIntensityDeficit !== null
          ? avgIntensityBalanced - avgIntensityDeficit
          : null
      };
    }
    
    // ==================== CORRÉLATION CONFORMITÉ ↔ RÉGULARITÉ ====================
    let complianceWorkoutCorrelation = null;
    if (activeProgram && activeProgram.targetCalories) {
      const complianceWorkoutPairs = [];
      
      filteredDailyMeals.forEach(dm => {
        const calories = dm.dailyTotals?.totalCalories || 0;
        const targetCalories = activeProgram.targetCalories;
        const compliance = Math.max(0, Math.min(100, (calories / targetCalories) * 100));
        
        const date = dm.date;
        const hasWorkout = sessionsByDate[date] && sessionsByDate[date].length > 0;
        const workoutScore = hasWorkout ? 100 : 0;
        
        complianceWorkoutPairs.push({ compliance, workoutScore });
      });
      
      complianceWorkoutCorrelation = complianceWorkoutPairs.length >= 3
        ? calculateCorrelation(
            complianceWorkoutPairs.map(p => p.compliance),
            complianceWorkoutPairs.map(p => p.workoutScore)
          )
        : null;
    }
    
    // ==================== GÉNÉRATION D'INSIGHTS ====================
    const insights = [];
    
    // Insight Calories
    if (caloriesCorrelation !== null) {
      if (caloriesCorrelation > 0.3) {
        insights.push({
          type: 'positive_calories',
          message: 'Corrélation positive entre calories et performance d\'entraînement',
          strength: Math.abs(caloriesCorrelation),
          recommendation: 'Maintenir apport calorique adéquat les jours d\'entraînement pour optimiser performance'
        });
      } else if (caloriesCorrelation < -0.3) {
        insights.push({
          type: 'negative_calories',
          message: 'Corrélation négative détectée (entraînement intense même avec calories basses)',
          strength: Math.abs(caloriesCorrelation),
          recommendation: 'Augmenter apport calorique les jours d\'entraînement pour éviter déficit énergétique'
        });
      }
    }
    
    // Insight Protéines
    if (proteinCorrelation !== null && proteinCorrelation > 0.3) {
      insights.push({
        type: 'positive_protein',
        message: 'Protéines associées à meilleure performance',
        strength: proteinCorrelation,
        recommendation: 'Maintenir apport protéique élevé (1.6-2.2g/kg) pour récupération optimale'
      });
    }
    
    // Insight Déficit
    if (deficitAnalysis && deficitAnalysis.intensityDifference !== null) {
      const diff = deficitAnalysis.intensityDifference;
      if (diff > 10) {
        insights.push({
          type: 'deficit_impact',
          message: `Performance ${Math.round(diff)}% supérieure avec apport calorique équilibré`,
          strength: diff / 100,
          recommendation: 'Éviter déficit calorique important les jours d\'entraînement pour maintenir performance'
        });
      }
    }
    
    // Insight Conformité
    if (complianceWorkoutCorrelation !== null && complianceWorkoutCorrelation > 0.3) {
      insights.push({
        type: 'compliance_regularity',
        message: 'Conformité nutrition associée à régularité d\'entraînement',
        strength: complianceWorkoutCorrelation,
        recommendation: 'Maintenir discipline nutritionnelle pour améliorer régularité d\'entraînement'
      });
    }
    
    return {
      caloriesWorkout: {
        correlation: caloriesCorrelation,
        pairsCount: caloriesWorkoutPairs.length,
        interpretation: caloriesCorrelation !== null
          ? (caloriesCorrelation > 0.3 ? 'positive' : caloriesCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      proteinWorkout: {
        correlation: proteinCorrelation,
        pairsCount: proteinWorkoutPairs.length,
        interpretation: proteinCorrelation !== null
          ? (proteinCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      complianceWorkout: {
        correlation: complianceWorkoutCorrelation,
        interpretation: complianceWorkoutCorrelation !== null
          ? (complianceWorkoutCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      deficitWorkout: deficitAnalysis,
      insights,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        daysCount: filteredDailyMeals.length,
        sessionsCount: filteredSessions.length
      }
    };
  }, [dailyMeals, workoutHistory, activeProgram, period, customStartDate, customEndDate]);
}








