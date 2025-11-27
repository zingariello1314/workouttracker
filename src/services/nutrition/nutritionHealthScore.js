/**
 * nutritionHealthScore.js
 * 
 * Service pour le calcul du Score Santé Globale.
 * 
 * Calcule un score composite (0-100) basé sur :
 * - Score Nutrition (conformité, régularité, variété) - 25%
 * - Score Workout (fréquence, volume, progression) - 25%
 * - Score Récupération (sommeil, Body Battery, stress) - 20%
 * - Score Consistance (streaks) - 15%
 * - Score Équilibre (équilibre musculaire) - 15%
 * 
 * Fournit des tendances et recommandations personnalisées.
 * 
 * @module services/nutrition/nutritionHealthScore
 * @see ../../../../nouvelongletnutritionplan.md Section 5.2
 */

import logger from '../../utils/logger';
// ✅ OPTIMISATION Phase 15.4 : Cache calculs avec hash inputs
import { 
  getNutritionCalculationCache, 
  generateHash 
} from './nutritionCalculationCache';
import { NutritionConfig } from '../../config/nutrition.config';
// ✅ PHASE 15.7 : Validation limites complète avec helpers
import {
  safeDivision,
  validateAndNormalizeNumber,
  validateCalculationResult
} from './nutritionCalculationHelpers';
import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';
import { z } from 'zod';

const log = logger.module('nutritionHealthScore');

// ==================== SCHÉMAS ZOD POUR VALIDATION ====================

/**
 * ✅ PHASE 15.7 : Schéma pour validation données nutrition dans calculateGlobalHealthScore
 */
const nutritionDataSchema = z.object({
  dailyMeals: z.array(z.any()).optional(),
  meals: z.array(z.any()).optional(),
  activeProgram: z.any().optional()
}).passthrough();

/**
 * ✅ PHASE 15.7 : Schéma pour validation données workouts dans calculateGlobalHealthScore
 */
const workoutsDataSchema = z.object({
  workouts: z.array(z.any()).optional()
}).passthrough();

/**
 * ✅ PHASE 15.7 : Schéma pour validation données Garmin dans calculateGlobalHealthScore
 * Schéma très permissif car structure peut varier selon source de données
 */
const garminDataSchema = z.object({
  activities: z.any().optional(),
  dailyMetrics: z.any().optional()
}).passthrough();

// ==================== CONSTANTES ====================

/**
 * Pondérations pour le score global
 */
const WEIGHTS = {
  NUTRITION: 0.25,
  WORKOUT: 0.25,
  RECOVERY: 0.20,
  CONSISTENCY: 0.15,
  BALANCE: 0.15
};

/**
 * Nombre de jours pour calculer les scores
 */
const DAYS_FOR_SCORES = {
  NUTRITION: 7,    // Score nutrition basé sur 7 jours
  WORKOUT: 30,     // Score workout basé sur 30 jours
  RECOVERY: 7,     // Score récupération basé sur 7 jours
  CONSISTENCY: 30  // Score consistance basé sur 30 jours
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Obtient les N derniers jours d'un historique
 */
function getLastNDays(history, days) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  return history.filter(item => {
    const itemDate = new Date(item.date || item.timestamp);
    return itemDate >= cutoffDate && itemDate <= today;
  });
}

/**
 * Normalise une date (string ou Date) en format YYYY-MM-DD
 */
function normalizeDate(date) {
  if (!date) return null;
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return null;
}

// ==================== SCORE NUTRITION ====================

/**
 * Calcule le score nutrition (conformité, régularité, variété)
 * 
 * @param {Object} data - Données nutrition
 * @param {Array} data.dailyMeals - Liste des dailyMeals avec dailyTotals
 * @param {Array} data.meals - Liste de tous les repas
 * @param {Object} data.activeProgram - Programme nutrition actif
 * @returns {number} Score nutrition (0-100)
 */
function calculateNutritionScore(data) {
  const { dailyMeals = [], meals = [], activeProgram = null } = data;

  if (dailyMeals.length === 0 && meals.length === 0) {
    return 50; // Score neutre si pas de données
  }

  // Obtenir les 7 derniers jours
  const last7Days = getLastNDays(dailyMeals, DAYS_FOR_SCORES.NUTRITION);
  
  if (last7Days.length === 0) {
    return 50; // Score neutre si pas de données récentes
  }

  // 1. Conformité programme (40%)
  let complianceScore = 70; // Score par défaut si pas de programme
  if (activeProgram && last7Days.length > 0) {
    let totalCompliance = 0;
    let daysWithCompliance = 0;

    last7Days.forEach(day => {
      if (day.dailyTotals && typeof day.dailyTotals.complianceScore === 'number') {
        totalCompliance += day.dailyTotals.complianceScore;
        daysWithCompliance++;
      }
    });

    if (daysWithCompliance > 0) {
      // ✅ PHASE 15.7 : Division sécurisée pour moyenne conformité
      complianceScore = safeDivision(totalCompliance, daysWithCompliance, {
        operation: 'calculateNutritionScore.compliance',
        defaultValue: 70
      });
    }
  }

  // 2. Régularité saisie (30%)
  const daysWithMeals = last7Days.filter(day => {
    const dateStr = normalizeDate(day.date);
    return meals.some(meal => {
      const mealDate = normalizeDate(meal.date || meal.timestamp);
      return mealDate === dateStr;
    });
  }).length;

  // ✅ PHASE 15.7 : Division sécurisée pour régularité
  const regularityScore = safeDivision(daysWithMeals * 100, 7, {
    operation: 'calculateNutritionScore.regularity',
    defaultValue: 0
  });

  // 3. Variété alimentaire (30%)
  const uniqueFoods = new Set();
  const dateStrs = last7Days.map(d => normalizeDate(d.date));
  
  meals.forEach(meal => {
    const mealDate = normalizeDate(meal.date || meal.timestamp);
    if (dateStrs.includes(mealDate) && meal.foods && Array.isArray(meal.foods)) {
      meal.foods.forEach(food => {
        if (food.name) {
          uniqueFoods.add(food.name.toLowerCase().trim());
        }
      });
    }
  });

  // ✅ PHASE 15.7 : Division sécurisée pour variété (20 aliments différents = 100%)
  const varietyScore = Math.min(
    safeDivision(uniqueFoods.size * 100, 20, {
      operation: 'calculateNutritionScore.variety',
      defaultValue: 0
    }),
    100
  );

  // ✅ PHASE 15.7 : Validation scores intermédiaires
  const validatedCompliance = validateCalculationResult(complianceScore, {
    fieldName: 'complianceScore',
    operation: 'calculateNutritionScore',
    min: 0,
    max: 100
  });
  const validatedRegularity = validateCalculationResult(regularityScore, {
    fieldName: 'regularityScore',
    operation: 'calculateNutritionScore',
    min: 0,
    max: 100
  });
  const validatedVariety = validateCalculationResult(varietyScore, {
    fieldName: 'varietyScore',
    operation: 'calculateNutritionScore',
    min: 0,
    max: 100
  });
  
  // Score final pondéré
  const finalScore = (
    validatedCompliance * 0.4 +
    validatedRegularity * 0.3 +
    validatedVariety * 0.3
  );

  // ✅ PHASE 15.7 : Validation résultat final
  return Math.round(validateCalculationResult(finalScore, {
    fieldName: 'nutritionScore',
    operation: 'calculateNutritionScore',
    min: 0,
    max: 100
  }));
}

// ==================== SCORE WORKOUT ====================

/**
 * Calcule le score workout (fréquence, volume, progression)
 * 
 * @param {Object} data - Données workouts
 * @param {Array} data.workouts - Liste des workouts (Garmin activities)
 * @returns {number} Score workout (0-100)
 */
function calculateWorkoutScore(data) {
  if (!data) {
    return 50; // Score neutre si pas de données
  }

  const { workouts = [] } = data;

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return 50; // Score neutre si pas de données
  }

  // Obtenir les 30 derniers jours
  const last30Days = getLastNDays(workouts, DAYS_FOR_SCORES.WORKOUT);
  
  if (last30Days.length === 0) {
    return 50; // Score neutre si pas de données récentes
  }

  // 1. Fréquence (40%)
  // Grouper par date unique
  const uniqueDates = new Set();
  last30Days.forEach(workout => {
    const dateStr = normalizeDate(workout.timestamp || workout.date);
    if (dateStr) {
      uniqueDates.add(dateStr);
    }
  });

  const workoutDays = uniqueDates.size;
  // Idéal: 5-6 jours/semaine = 21-26 jours sur 30 jours
  const idealDays = 24; // 6 jours/semaine * 4 semaines
  // ✅ PHASE 15.7 : Division sécurisée pour fréquence
  const frequencyScore = Math.min(
    safeDivision(workoutDays * 100, idealDays, {
      operation: 'calculateWorkoutScore.frequency',
      defaultValue: 0
    }),
    100
  );

  // 2. Volume (30%)
  // Calculer volume total (durée en minutes ou calories)
  let totalVolume = 0;
  let volumeCount = 0;

  last30Days.forEach(workout => {
    // Prioriser durée (en minutes), sinon calories
    if (workout.duration) {
      totalVolume += workout.duration / 60; // secondes -> minutes
      volumeCount++;
    } else if (workout.calories && workout.calories.total) {
      // Calories comme proxy du volume (1 calorie ≈ 1 minute d'activité modérée)
      totalVolume += workout.calories.total / 100; // Normaliser
      volumeCount++;
    }
  });

  // ✅ PHASE 15.7 : Division sécurisée pour volume moyen
  const avgDailyVolume = volumeCount > 0 
    ? safeDivision(totalVolume, 30, {
        operation: 'calculateWorkoutScore.avgDailyVolume',
        defaultValue: 0
      })
    : 0;
  // Idéal: 45-60 minutes/jour = score 100
  const idealDailyVolume = 52.5; // Moyenne 45-60 minutes
  // ✅ PHASE 15.7 : Division sécurisée pour score volume
  const volumeScore = Math.min(
    safeDivision(avgDailyVolume * 100, idealDailyVolume, {
      operation: 'calculateWorkoutScore.volume',
      defaultValue: 0
    }),
    100
  );

  // 3. Progression (30%)
  // Simplification: comparer première moitié vs seconde moitié
  const progressionScore = calculateProgressionScore(last30Days);

  // Score final pondéré
  const finalScore = (
    frequencyScore * 0.4 +
    volumeScore * 0.3 +
    progressionScore * 0.3
  );

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calcule le score de progression basé sur l'évolution du volume
 */
function calculateProgressionScore(workouts) {
  if (workouts.length < 6) {
    return 50; // Pas assez de données pour évaluer progression
  }

  // Diviser en deux moitiés
  const midpoint = Math.floor(workouts.length / 2);
  const firstHalf = workouts.slice(0, midpoint);
  const secondHalf = workouts.slice(midpoint);

  // Calculer volume moyen par moitié
  const getAvgVolume = (half) => {
    let total = 0;
    let count = 0;
    half.forEach(w => {
      if (w.duration) {
        total += w.duration / 60;
        count++;
      } else if (w.calories && w.calories.total) {
        total += w.calories.total / 100;
        count++;
      }
    });
    // ✅ PHASE 15.7 : Division sécurisée pour moyenne
    return count > 0 
      ? safeDivision(total, count, {
          operation: 'calculateWorkoutScore.progression.avg',
          defaultValue: 0
        })
      : 0;
  };

  const firstAvg = getAvgVolume(firstHalf);
  const secondAvg = getAvgVolume(secondHalf);

  if (firstAvg === 0) return 50; // Pas de données de base

  // ✅ PHASE 15.7 : Division sécurisée pour pourcentage de progression
  const progressionPercent = safeDivision(
    (secondAvg - firstAvg) * 100,
    firstAvg,
    {
      operation: 'calculateWorkoutScore.progression.percent',
      defaultValue: 0
    }
  );

  // Normaliser progression (-20% à +20% → 0 à 100)
  // Progression idéale: +5% à +10%
  if (progressionPercent >= 5 && progressionPercent <= 10) {
    return 100;
  } else if (progressionPercent > 0) {
    // Progression positive mais pas optimale
    return Math.min(80 + (progressionPercent * 2), 100);
  } else if (progressionPercent >= -5) {
    // Stagnation (acceptable)
    return 60;
  } else {
    // Régression
    return Math.max(30, 50 + (progressionPercent * 0.5));
  }
}

// ==================== SCORE RÉCUPÉRATION ====================

/**
 * Calcule le score récupération (sommeil, Body Battery, stress)
 * 
 * @param {Object} data - Données Garmin
 * @param {Object} data.dailyMetrics - Métriques quotidiennes par date
 * @returns {number} Score récupération (0-100)
 */
function calculateRecoveryScore(data) {
  if (!data) {
    return 50; // Score neutre si pas de données
  }

  const { dailyMetrics = {} } = data;

  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return 50; // Score neutre si pas de données Garmin
  }

  // Obtenir les 7 derniers jours
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_FOR_SCORES.RECOVERY);
  cutoffDate.setHours(0, 0, 0, 0);

  const last7Days = [];
  for (let i = 0; i < DAYS_FOR_SCORES.RECOVERY; i++) {
    const date = new Date(cutoffDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    if (dailyMetrics[dateStr]) {
      last7Days.push({ date: dateStr, ...dailyMetrics[dateStr] });
    }
  }

  if (last7Days.length === 0) {
    return 50; // Score neutre si pas de données récentes
  }

  // 1. Durée sommeil (50%)
  let sleepScore = 50;
  let sleepCount = 0;
  let totalSleepHours = 0;

  last7Days.forEach(day => {
    if (day.sleepHours != null) {
      totalSleepHours += day.sleepHours;
      sleepCount++;
    } else if (day.sleep && day.sleep.duration) {
      // Format alternatif: sleep.duration en minutes
      totalSleepHours += day.sleep.duration / 60;
      sleepCount++;
    }
  });

  if (sleepCount > 0) {
    // ✅ PHASE 15.7 : Division sécurisée pour moyenne sommeil
    const avgSleep = safeDivision(totalSleepHours, sleepCount, {
      operation: 'calculateRecoveryScore.avgSleep',
      defaultValue: 0
    });
    
    // Optimale: 7-8h
    if (avgSleep >= 7 && avgSleep <= 8) {
      sleepScore = 100;
    } else if (avgSleep >= 6 && avgSleep < 7) {
      sleepScore = 80;
    } else if (avgSleep > 8 && avgSleep <= 9) {
      sleepScore = 90;
    } else if (avgSleep < 6) {
      sleepScore = 40;
    } else {
      sleepScore = 70;
    }
  }

  // 2. Body Battery ou Stress (50%)
  let batteryScore = 50;
  let batteryCount = 0;
  let totalBattery = 0;

  last7Days.forEach(day => {
    if (day.bodyBattery != null) {
      totalBattery += day.bodyBattery;
      batteryCount++;
    } else if (day.stress != null) {
      // Utiliser stress inversé comme proxy (faible stress = bonne récupération)
      totalBattery += (100 - day.stress);
      batteryCount++;
    }
  });

  if (batteryCount > 0) {
    batteryScore = totalBattery / batteryCount;
  }

  // Score final pondéré
  const finalScore = (sleepScore * 0.5 + batteryScore * 0.5);

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

// ==================== SCORE CONSISTANCE ====================

/**
 * Calcule le score consistance basé sur les streaks
 * 
 * @param {Object} data - Données gamification
 * @param {Object} data.gamification - Données gamification avec streaks
 * @returns {number} Score consistance (0-100)
 */
function calculateConsistencyScore(data) {
  const { gamification = {} } = data;
  const { streaks = {} } = gamification;

  if (!streaks || Object.keys(streaks).length === 0) {
    return 50; // Score neutre si pas de streaks
  }

  // Extraire streaks nutrition et workout
  const nutritionStreak = streaks.nutrition?.current || streaks.nutrition?.actual || 0;
  const workoutStreak = streaks.workout?.current || streaks.workout?.actual || 0;
  const overallStreak = streaks.overall?.current || streaks.overall?.actual || 0;

  // ✅ PHASE 15.7 : Division sécurisée pour moyenne des streaks
  const avgStreak = safeDivision(
    nutritionStreak + workoutStreak + overallStreak,
    3,
    {
      operation: 'calculateConsistencyScore.avgStreak',
      defaultValue: 0
    }
  );

  // ✅ PHASE 15.7 : Division sécurisée pour normalisation (30 jours = 100%)
  const consistencyScore = Math.min(
    safeDivision(avgStreak * 100, 30, {
      operation: 'calculateConsistencyScore.normalize',
      defaultValue: 0
    }),
    100
  );

  return Math.round(Math.max(0, Math.min(100, consistencyScore)));
}

// ==================== SCORE ÉQUILIBRE ====================

/**
 * Calcule le score équilibre basé sur l'équilibre musculaire
 * 
 * @param {Object} data - Données workouts/muscle balance
 * @param {Array} data.muscleBalance - Équilibre musculaire par groupe
 * @returns {number} Score équilibre (0-100)
 */
function calculateBalanceScore(data) {
  const { muscleBalance = [] } = data;

  if (!Array.isArray(muscleBalance) || muscleBalance.length === 0) {
    return 50; // Score neutre si pas de données
  }

  // Calculer écart-type de la distribution musculaire
  const percentages = muscleBalance
    .map(m => typeof m === 'object' ? (m.percentage || 0) : m)
    .filter(p => p > 0);

  if (percentages.length === 0) {
    return 50;
  }

  // ✅ PHASE 15.7 : Division sécurisée pour moyenne
  const mean = safeDivision(
    percentages.reduce((a, b) => a + b, 0),
    percentages.length,
    {
      operation: 'calculateBalanceScore.mean',
      defaultValue: 0
    }
  );
  // ✅ PHASE 15.7 : Division sécurisée pour variance
  const variance = safeDivision(
    percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0),
    percentages.length,
    {
      operation: 'calculateBalanceScore.variance',
      defaultValue: 0
    }
  );
  const stdDev = Math.sqrt(variance);

  // Score inversement proportionnel à écart-type
  // Écart-type idéal: 5-10% → Score 100
  // Écart-type élevé: >20% → Score faible
  const balanceScore = Math.max(0, 100 - (stdDev * 5));

  return Math.round(Math.max(0, Math.min(100, balanceScore)));
}

// ==================== TENDANCES & RECOMMANDATIONS ====================

/**
 * Calcule les tendances du score global
 */
function calculateTrends(currentScores, historicalScores) {
  if (!historicalScores || !currentScores) {
    return {
      lastWeek: 0,
      lastMonth: 0,
      direction: 'stable'
    };
  }

  const lastWeek = currentScores.global - (historicalScores.lastWeek || currentScores.global);
  const lastMonth = currentScores.global - (historicalScores.lastMonth || currentScores.global);

  let direction = 'stable';
  if (lastWeek > 2) direction = 'up';
  else if (lastWeek < -2) direction = 'down';

  return {
    lastWeek: Math.round(lastWeek),
    lastMonth: Math.round(lastMonth),
    direction
  };
}

/**
 * Génère des recommandations basées sur les sous-scores
 */
function generateHealthRecommendations(scores) {
  const recommendations = [];

  // Identifier scores faibles (<60)
  Object.entries(scores.subScores || {}).forEach(([category, score]) => {
    if (score < 60) {
      recommendations.push({
        category,
        priority: score < 40 ? 'high' : 'medium',
        score,
        message: getRecommendationMessage(category, score)
      });
    }
  });

  // Trier par priorité puis par score (plus faible = plus prioritaire)
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.score - b.score;
  });
}

/**
 * Retourne le message de recommandation pour une catégorie
 */
function getRecommendationMessage(category, score) {
  const messages = {
    nutrition: `Score nutrition ${score}/100. Améliorez la conformité au programme, la régularité de saisie et la variété alimentaire.`,
    workout: `Score workout ${score}/100. Augmentez la fréquence et le volume d'entraînement. Ciblez 5-6 séances par semaine.`,
    recovery: `Score récupération ${score}/100. Ciblez 7-8h de sommeil par nuit et surveillez votre Body Battery.`,
    consistency: `Score consistance ${score}/100. Maintenez une régularité quotidienne dans votre nutrition et vos entraînements.`,
    balance: `Score équilibre ${score}/100. Équilibrez le travail des différents groupes musculaires.`
  };

  return messages[category] || `Améliorez votre score ${category} (actuellement ${score}/100).`;
}

// ==================== SCORE GLOBAL ====================

/**
 * Calcule le score santé global complet
 * 
 * @param {Object} data - Toutes les données nécessaires
 * @param {Object} data.nutrition - Données nutrition (dailyMeals, meals, activeProgram)
 * @param {Object} data.workouts - Données workouts (workouts array)
 * @param {Object} data.garmin - Données Garmin (dailyMetrics)
 * @param {Object} data.gamification - Données gamification (streaks)
 * @param {Object} data.muscleBalance - Équilibre musculaire
 * @param {Object} options - Options de calcul
 * @param {Object} options.historicalScores - Scores historiques pour tendances
 * @returns {Object} Score global avec sous-scores, tendances et recommandations
 */
export function calculateGlobalHealthScore(data, options = {}) {
  // ✅ PHASE 15.7 : Validation inputs avec Zod (version robuste)
  try {
    // Gérer le cas où data est undefined/null
    if (!data || typeof data !== 'object') {
      data = {};
    }
    
    // Valider chaque section individuellement pour éviter erreurs Zod sur schémas imbriqués
    const validatedData = {
      nutrition: (() => {
        try {
          if (data.nutrition && typeof data.nutrition === 'object') {
            return nutritionDataSchema.parse(data.nutrition);
          }
        } catch (e) {
          log.warn('[calculateGlobalHealthScore] Validation nutrition échouée, utilisation valeurs par défaut');
        }
        return {};
      })(),
      workouts: (() => {
        try {
          if (data.workouts && typeof data.workouts === 'object') {
            return workoutsDataSchema.parse(data.workouts);
          }
        } catch (e) {
          log.warn('[calculateGlobalHealthScore] Validation workouts échouée, utilisation valeurs par défaut');
        }
        return {};
      })(),
      garmin: (() => {
        // Validation permissive : accepter tout objet valide sans warning
        if (data.garmin && typeof data.garmin === 'object' && !Array.isArray(data.garmin)) {
          // Utiliser directement sans validation stricte (structure peut varier)
          // Les champs seront validés individuellement lors de l'utilisation
          return data.garmin;
        }
        return {};
      })(),
      gamification: data.gamification || {},
      muscleBalance: data.muscleBalance || null
    };
    
    data = validatedData;
  } catch (error) {
    // Erreur non bloquante : continuer avec données originales
    log.warn('[calculateGlobalHealthScore] Erreur validation globale, utilisation données originales:', error.message);
  }
  
  const {
    nutrition = {},
    workouts = {},
    garmin = {},
    gamification = {},
    muscleBalance = null
  } = data;

  const { historicalScores = null } = options;

  // ✅ OPTIMISATION Phase 15.4 : Vérifier cache avant calculs coûteux
  if (NutritionConfig.features.enableCalculationCache) {
    const hashInput = JSON.stringify({
      nutrition: {
        dailyMealsCount: nutrition.dailyMeals?.length || 0,
        mealsCount: nutrition.meals?.length || 0,
        activeProgramId: nutrition.activeProgram?.id || null
      },
      workouts: {
        count: workouts.workouts?.length || 0
      },
      garmin: {
        activitiesCount: Object.keys(garmin.activities || {}).length,
        metricsCount: Object.keys(garmin.dailyMetrics || {}).length
      },
      gamification: {
        hasStreaks: Object.keys(gamification.streaks || {}).length > 0
      },
      muscleBalance: {
        count: muscleBalance?.length || 0
      },
      options: options || {}
    });
    const hash = generateHash(hashInput);
    const cache = getNutritionCalculationCache();
    const cacheKey = `healthScore:${hash}`;
    
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  log.debug('Calcul score santé global:', {
    hasNutrition: Object.keys(nutrition).length > 0,
    hasWorkouts: Array.isArray(workouts.workouts) && workouts.workouts.length > 0,
    hasGarmin: Object.keys(garmin).length > 0,
    hasGamification: Object.keys(gamification).length > 0,
    hasMuscleBalance: Array.isArray(muscleBalance) && muscleBalance.length > 0
  });

  // Calculer sous-scores
  const nutritionScore = calculateNutritionScore(nutrition);
  const workoutScore = calculateWorkoutScore(workouts);
  const recoveryScore = calculateRecoveryScore(garmin);
  const consistencyScore = calculateConsistencyScore({ gamification });
  const balanceScore = calculateBalanceScore({ muscleBalance });

  // Valider que tous les scores sont des nombres valides (pas NaN, Infinity, etc.)
  const safeNutritionScore = isFinite(nutritionScore) ? nutritionScore : 50;
  const safeWorkoutScore = isFinite(workoutScore) ? workoutScore : 50;
  const safeRecoveryScore = isFinite(recoveryScore) ? recoveryScore : 50;
  const safeConsistencyScore = isFinite(consistencyScore) ? consistencyScore : 50;
  const safeBalanceScore = isFinite(balanceScore) ? balanceScore : 50;

  // Score global (moyenne pondérée)
  const globalScore = (
    safeNutritionScore * WEIGHTS.NUTRITION +
    safeWorkoutScore * WEIGHTS.WORKOUT +
    safeRecoveryScore * WEIGHTS.RECOVERY +
    safeConsistencyScore * WEIGHTS.CONSISTENCY +
    safeBalanceScore * WEIGHTS.BALANCE
  );

  // Valider le score global
  const safeGlobalScore = isFinite(globalScore) ? globalScore : 50;

  const subScores = {
    nutrition: safeNutritionScore,
    workout: safeWorkoutScore,
    recovery: safeRecoveryScore,
    consistency: safeConsistencyScore,
    balance: safeBalanceScore
  };

  // Tendances (si scores historiques fournis)
  const trends = calculateTrends(
    { global: Math.round(safeGlobalScore), subScores },
    historicalScores
  );

  // Recommandations
  const recommendations = generateHealthRecommendations({ subScores });

  const result = {
    global: Math.round(safeGlobalScore),
    subScores,
    trends,
    recommendations,
    breakdown: {
      weights: WEIGHTS,
      calculation: {
        nutrition: `${safeNutritionScore} × ${WEIGHTS.NUTRITION * 100}%`,
        workout: `${safeWorkoutScore} × ${WEIGHTS.WORKOUT * 100}%`,
        recovery: `${safeRecoveryScore} × ${WEIGHTS.RECOVERY * 100}%`,
        consistency: `${safeConsistencyScore} × ${WEIGHTS.CONSISTENCY * 100}%`,
        balance: `${safeBalanceScore} × ${WEIGHTS.BALANCE * 100}%`
      }
    }
  };
  
  // ✅ OPTIMISATION Phase 15.4 : Mettre en cache le résultat
  if (NutritionConfig.features.enableCalculationCache) {
    const hashInput = JSON.stringify({
      nutrition: {
        dailyMealsCount: nutrition.dailyMeals?.length || 0,
        mealsCount: nutrition.meals?.length || 0,
        activeProgramId: nutrition.activeProgram?.id || null
      },
      workouts: {
        count: workouts.workouts?.length || 0
      },
      garmin: {
        activitiesCount: Object.keys(garmin.activities || {}).length,
        metricsCount: Object.keys(garmin.dailyMetrics || {}).length
      },
      gamification: {
        hasStreaks: Object.keys(gamification.streaks || {}).length > 0
      },
      muscleBalance: {
        count: muscleBalance?.length || 0
      },
      options: options || {}
    });
    const hash = generateHash(hashInput);
    const cache = getNutritionCalculationCache();
    cache.set(`healthScore:${hash}`, result);
  }
  
  return result;
}

export default {
  calculateGlobalHealthScore,
  calculateNutritionScore,
  calculateWorkoutScore,
  calculateRecoveryScore,
  calculateConsistencyScore,
  calculateBalanceScore
};

