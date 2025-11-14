/**
 * nutritionChronobiology.js
 * 
 * Service pour l'analyse chronobiologique (timing optimal des repas).
 * 
 * Analyse les corrélations entre :
 * - Timing des repas (pré/post-workout)
 * - Performance des entraînements
 * - Récupération
 * 
 * Fournit des recommandations personnalisées basées sur l'historique.
 * 
 * @module services/nutrition/nutritionChronobiology
 * @see ../../../../nouvelongletnutritionplan.md Section 5.1
 */

import logger from '../../utils/logger';

const log = logger.module('nutritionChronobiology');

// ==================== CONSTANTES ====================

/**
 * Fenêtres temporelles pour analyse
 */
const TIMING_WINDOWS = {
  PRE_WORKOUT: {
    MIN_HOURS: 1, // Minimum 1h avant workout
    MAX_HOURS: 3  // Maximum 3h avant workout
  },
  POST_WORKOUT: {
    MIN_HOURS: 0,  // Immédiatement après
    MAX_HOURS: 2   // Maximum 2h après workout
  }
};

/**
 * Taille minimale d'échantillon pour recommandations fiables
 */
const MIN_SAMPLE_SIZE = 3;

/**
 * Tranches temporelles pour analyse (en heures)
 */
const TIME_SLOTS = 0.5; // Analyse par tranches de 30 minutes

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Calcule la différence en heures entre deux dates
 */
function getHoursDifference(date1, date2) {
  return Math.abs(date1 - date2) / (1000 * 60 * 60);
}

/**
 * Vérifie si un repas est dans la fenêtre pré-workout
 */
function isPreWorkoutMeal(mealTime, workoutTime) {
  const diffHours = getHoursDifference(workoutTime, mealTime);
  return diffHours >= TIMING_WINDOWS.PRE_WORKOUT.MIN_HOURS &&
         diffHours <= TIMING_WINDOWS.PRE_WORKOUT.MAX_HOURS &&
         mealTime < workoutTime; // Repas doit être avant workout
}

/**
 * Vérifie si un repas est dans la fenêtre post-workout
 */
function isPostWorkoutMeal(mealTime, workoutTime) {
  const diffHours = getHoursDifference(mealTime, workoutTime);
  return diffHours >= TIMING_WINDOWS.POST_WORKOUT.MIN_HOURS &&
         diffHours <= TIMING_WINDOWS.POST_WORKOUT.MAX_HOURS &&
         mealTime > workoutTime; // Repas doit être après workout
}

/**
 * Arrondit à la tranche temporelle la plus proche
 */
function roundToTimeSlot(hours) {
  return Math.round(hours / TIME_SLOTS) * TIME_SLOTS;
}

// ==================== ANALYSE TIMING PRÉ-WORKOUT ====================

/**
 * Analyse les repas pré-workout et leur corrélation avec la performance
 * 
 * @param {Array} meals - Liste des repas avec timestamp
 * @param {Array} workouts - Liste des workouts avec timestamp et métriques
 * @returns {Object} Analyse du timing pré-workout optimal
 */
export function analyzePreWorkoutTiming(meals, workouts) {
  if (!meals || !workouts || meals.length === 0 || workouts.length === 0) {
    return {
      optimalHours: null,
      avgPerformance: null,
      sampleSize: 0,
      recommendation: null,
      dataPoints: []
    };
  }

  const preWorkoutMeals = [];

  // Pour chaque workout, trouver les repas dans la fenêtre pré-workout
  workouts.forEach(workout => {
    const workoutTime = new Date(workout.timestamp || workout.date);
    if (isNaN(workoutTime.getTime())) {
      log.warn('Timestamp workout invalide:', workout);
      return;
    }

    // Trouver repas dans fenêtre pré-workout
    const preMeal = meals.find(meal => {
      const mealTime = new Date(meal.timestamp);
      if (isNaN(mealTime.getTime())) {
        return false;
      }
      return isPreWorkoutMeal(mealTime, workoutTime);
    });

    if (preMeal) {
      const mealTime = new Date(preMeal.timestamp);
      const timeDiff = getHoursDifference(workoutTime, mealTime);
      
      // Extraire métrique de performance (priorité: RPE > intensity > calories)
      const performance = workout.rpe || 
                         workout.avgIntensity || 
                         workout.intensity ||
                         (workout.calories?.active || workout.calories?.total || 0) / 100; // Normaliser calories

      preWorkoutMeals.push({
        mealTime: mealTime.toISOString(),
        workoutTime: workoutTime.toISOString(),
        timeDiff: timeDiff,
        performance: performance,
        mealType: preMeal.type || 'unknown',
        mealCalories: preMeal.totalCalories || 0,
        mealProtein: preMeal.totalProtein || 0
      });
    }
  });

  if (preWorkoutMeals.length === 0) {
    return {
      optimalHours: null,
      avgPerformance: null,
      sampleSize: 0,
      recommendation: 'Pas assez de données pour analyser le timing pré-workout. Assurez-vous de manger 1-3h avant vos entraînements.',
      dataPoints: []
    };
  }

  // Grouper par tranches de 30 minutes
  const groups = {};
  
  preWorkoutMeals.forEach(meal => {
    const timeSlot = roundToTimeSlot(meal.timeDiff);
    if (!groups[timeSlot]) {
      groups[timeSlot] = [];
    }
    groups[timeSlot].push(meal.performance);
  });

  // Calculer moyenne par tranche
  const averages = Object.entries(groups).map(([time, values]) => ({
    time: parseFloat(time),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    sampleSize: values.length
  }));

  // Trouver meilleur timing (moyenne max avec échantillon suffisant)
  const validAverages = averages.filter(a => a.sampleSize >= MIN_SAMPLE_SIZE);
  
  if (validAverages.length === 0) {
    return {
      optimalHours: null,
      avgPerformance: null,
      sampleSize: preWorkoutMeals.length,
      recommendation: `Vous avez ${preWorkoutMeals.length} point(s) de données, mais pas assez pour chaque tranche temporelle. Continuez à enregistrer vos repas et entraînements.`,
      dataPoints: preWorkoutMeals
    };
  }

  const optimal = validAverages.sort((a, b) => b.avg - a.avg)[0];

  return {
    optimalHours: optimal.time,
    avgPerformance: optimal.avg,
    sampleSize: preWorkoutMeals.length,
    recommendation: `Basé sur ${preWorkoutMeals.length} point(s) de données, le timing optimal pour manger avant votre entraînement est ${optimal.time}h avant. Performance moyenne observée : ${optimal.avg.toFixed(1)}.`,
    dataPoints: preWorkoutMeals,
    allTimeSlots: averages
  };
}

// ==================== ANALYSE TIMING POST-WORKOUT ====================

/**
 * Analyse les repas post-workout et leur corrélation avec la récupération
 * 
 * @param {Array} meals - Liste des repas avec timestamp
 * @param {Array} workouts - Liste des workouts avec timestamp et métriques
 * @returns {Object} Analyse du timing post-workout optimal
 */
export function analyzePostWorkoutTiming(meals, workouts) {
  if (!meals || !workouts || meals.length === 0 || workouts.length === 0) {
    return {
      optimalHours: null,
      avgRecovery: null,
      sampleSize: 0,
      recommendation: null,
      dataPoints: []
    };
  }

  const postWorkoutMeals = [];

  // Pour chaque workout, trouver les repas dans la fenêtre post-workout
  workouts.forEach(workout => {
    const workoutTime = new Date(workout.timestamp || workout.date);
    if (isNaN(workoutTime.getTime())) {
      log.warn('Timestamp workout invalide:', workout);
      return;
    }

    // Trouver repas dans fenêtre post-workout
    const postMeal = meals.find(meal => {
      const mealTime = new Date(meal.timestamp);
      if (isNaN(mealTime.getTime())) {
        return false;
      }
      return isPostWorkoutMeal(mealTime, workoutTime);
    });

    if (postMeal) {
      const mealTime = new Date(postMeal.timestamp);
      const timeDiff = getHoursDifference(mealTime, workoutTime);
      
      // Extraire métrique de récupération (priorité: recoveryScore > bodyBattery > stress)
      const recovery = workout.recoveryScore || 
                       workout.bodyBattery || 
                       (workout.stress ? 100 - workout.stress : null) || // Inverser stress (plus bas = mieux)
                       null;

      postWorkoutMeals.push({
        mealTime: mealTime.toISOString(),
        workoutTime: workoutTime.toISOString(),
        timeDiff: timeDiff,
        recovery: recovery,
        mealType: postMeal.type || 'unknown',
        mealCalories: postMeal.totalCalories || 0,
        mealProtein: postMeal.totalProtein || 0
      });
    }
  });

  if (postWorkoutMeals.length === 0) {
    return {
      optimalHours: null,
      avgRecovery: null,
      sampleSize: 0,
      recommendation: 'Pas assez de données pour analyser le timing post-workout. Assurez-vous de manger 0-2h après vos entraînements.',
      dataPoints: []
    };
  }

  // Grouper par tranches de 30 minutes
  const groups = {};
  
  postWorkoutMeals.forEach(meal => {
    if (meal.recovery === null) return; // Ignorer si pas de métrique récupération
    
    const timeSlot = roundToTimeSlot(meal.timeDiff);
    if (!groups[timeSlot]) {
      groups[timeSlot] = [];
    }
    groups[timeSlot].push(meal.recovery);
  });

  // Calculer moyenne par tranche
  const averages = Object.entries(groups).map(([time, values]) => ({
    time: parseFloat(time),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    sampleSize: values.length
  }));

  // Trouver meilleur timing (moyenne max avec échantillon suffisant)
  const validAverages = averages.filter(a => a.sampleSize >= MIN_SAMPLE_SIZE);
  
  if (validAverages.length === 0) {
    return {
      optimalHours: null,
      avgRecovery: null,
      sampleSize: postWorkoutMeals.length,
      recommendation: `Vous avez ${postWorkoutMeals.length} point(s) de données, mais pas assez pour chaque tranche temporelle. Continuez à enregistrer vos repas et entraînements.`,
      dataPoints: postWorkoutMeals
    };
  }

  const optimal = validAverages.sort((a, b) => b.avg - a.avg)[0];

  return {
    optimalHours: optimal.time,
    avgRecovery: optimal.avg,
    sampleSize: postWorkoutMeals.length,
    recommendation: `Basé sur ${postWorkoutMeals.length} point(s) de données, le timing optimal pour manger après votre entraînement est ${optimal.time}h après. Récupération moyenne observée : ${optimal.avg.toFixed(1)}.`,
    dataPoints: postWorkoutMeals,
    allTimeSlots: averages
  };
}

// ==================== ANALYSE DISTRIBUTION PROTÉINES ====================

/**
 * Analyse la distribution des protéines sur la journée
 * 
 * @param {Array} meals - Liste des repas avec timestamp et macros
 * @returns {Object} Analyse de la distribution protéique
 */
export function analyzeProteinDistribution(meals) {
  if (!meals || meals.length === 0) {
    return {
      breakfast: { avg: 0, count: 0 },
      lunch: { avg: 0, count: 0 },
      dinner: { avg: 0, count: 0 },
      snack: { avg: 0, count: 0 },
      total: 0,
      recommendation: null
    };
  }

  const mealsByType = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  meals.forEach(meal => {
    const type = meal.type || 'snack';
    if (mealsByType[type]) {
      mealsByType[type].push(meal.totalProtein || 0);
    }
  });

  const distribution = {};
  let totalProtein = 0;

  Object.entries(mealsByType).forEach(([type, proteins]) => {
    const avg = proteins.length > 0 
      ? proteins.reduce((a, b) => a + b, 0) / proteins.length 
      : 0;
    distribution[type] = {
      avg: Math.round(avg * 10) / 10,
      count: proteins.length
    };
    totalProtein += avg * proteins.length;
  });

  // Recommandation basée sur distribution idéale (25-30% par repas principal)
  const idealPerMeal = totalProtein / 3; // 3 repas principaux
  const recommendations = [];

  if (distribution.breakfast.avg < idealPerMeal * 0.7) {
    recommendations.push(`Augmentez les protéines au petit-déjeuner (actuellement ${distribution.breakfast.avg.toFixed(1)}g, cible: ${idealPerMeal.toFixed(1)}g)`);
  }
  if (distribution.lunch.avg < idealPerMeal * 0.7) {
    recommendations.push(`Augmentez les protéines au déjeuner (actuellement ${distribution.lunch.avg.toFixed(1)}g, cible: ${idealPerMeal.toFixed(1)}g)`);
  }
  if (distribution.dinner.avg < idealPerMeal * 0.7) {
    recommendations.push(`Augmentez les protéines au dîner (actuellement ${distribution.dinner.avg.toFixed(1)}g, cible: ${idealPerMeal.toFixed(1)}g)`);
  }

  return {
    ...distribution,
    total: Math.round(totalProtein * 10) / 10,
    recommendation: recommendations.length > 0 
      ? recommendations.join('. ') 
      : 'Distribution protéique équilibrée sur la journée.'
  };
}

// ==================== ANALYSE COMPLÈTE ====================

/**
 * Analyse complète de la chronobiologie nutritionnelle
 * 
 * @param {Object} data - Données nutrition et workouts
 * @param {Array} data.meals - Liste des repas
 * @param {Array} data.workouts - Liste des workouts (Garmin activities ou TodayTab)
 * @param {Object} options - Options d'analyse
 * @returns {Object} Analyse complète
 */
export function analyzeChronobiology(data, options = {}) {
  const { meals = [], workouts = [] } = data;
  const { 
    dateRange = null, // Filtrer par plage de dates
    minSampleSize = MIN_SAMPLE_SIZE 
  } = options;

  log.debug('Analyse chronobiologie:', { 
    mealsCount: meals.length, 
    workoutsCount: workouts.length,
    dateRange 
  });

  // Filtrer par plage de dates si fournie
  let filteredMeals = meals;
  let filteredWorkouts = workouts;

  if (dateRange) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    filteredMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= start && mealDate <= end;
    });

    filteredWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.timestamp || workout.date);
      return workoutDate >= start && workoutDate <= end;
    });
  }

  // Analyses
  const preWorkout = analyzePreWorkoutTiming(filteredMeals, filteredWorkouts);
  const postWorkout = analyzePostWorkoutTiming(filteredMeals, filteredWorkouts);
  const proteinDistribution = analyzeProteinDistribution(filteredMeals);

  return {
    preWorkout,
    postWorkout,
    proteinDistribution,
    summary: {
      totalMeals: filteredMeals.length,
      totalWorkouts: filteredWorkouts.length,
      hasEnoughData: preWorkout.sampleSize >= minSampleSize || postWorkout.sampleSize >= minSampleSize,
      dateRange: dateRange || null
    }
  };
}

export default {
  analyzeChronobiology,
  analyzePreWorkoutTiming,
  analyzePostWorkoutTiming,
  analyzeProteinDistribution
};

