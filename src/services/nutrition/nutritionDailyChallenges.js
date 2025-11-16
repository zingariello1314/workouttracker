/**
 * nutritionDailyChallenges.js
 * 
 * Service pour la gestion des défis nutritionnels quotidiens
 * 
 * Défis disponibles :
 * - Respect du plan (petit-déj, collations, déjeuner, dîner)
 * - Timing (pré/post workout)
 * - Objectifs nutritionnels (protéines, hydratation, macros)
 * - Qualité (ultra-transformés, sucre ajouté)
 * - Complétude (journal 100% loggé)
 * 
 * @module services/nutrition/nutritionDailyChallenges
 */

import { DateHelper } from '../../utils/dateHelper';
import logger from '../../utils/logger';

const log = {
  debug: (...args) => logger.debug('[nutritionDailyChallenges]', ...args),
  info: (...args) => logger.info('[nutritionDailyChallenges]', ...args),
  warn: (...args) => logger.warn('[nutritionDailyChallenges]', ...args),
  error: (...args) => logger.error('[nutritionDailyChallenges]', ...args)
};

// ==================== HELPERS ====================

/**
 * Vérifie si un repas correspond au plan (comparaison basique)
 * Pour l'instant, vérifie si le type et les macros sont proches
 */
const matchesPlannedMeal = (loggedMeal, plannedMeal, tolerance = 0.10) => {
  if (!loggedMeal || !plannedMeal) return false;
  
  // Vérifier type
  if (loggedMeal.type !== plannedMeal.type) return false;
  
  // Vérifier macros avec tolérance (±10% par défaut)
  const caloriesDiff = Math.abs((loggedMeal.totalCalories || 0) - (plannedMeal.targetCalories || 0));
  const caloriesTolerance = (plannedMeal.targetCalories || 0) * tolerance;
  
  if (caloriesDiff > caloriesTolerance) return false;
  
  // Vérifier protéines (±10%)
  const proteinDiff = Math.abs((loggedMeal.totalProtein || 0) - (plannedMeal.targetProtein || 0));
  const proteinTolerance = (plannedMeal.targetProtein || 0) * tolerance;
  
  return proteinDiff <= proteinTolerance;
};

/**
 * Calcule la différence de temps en minutes entre deux dates
 */
const timeDifferenceMinutes = (date1, date2) => {
  if (!date1 || !date2) return Infinity;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return Infinity;
  return Math.abs((d2 - d1) / (1000 * 60));
};

/**
 * Vérifie si un aliment est ultra-transformé (détection basique)
 * Note: Pour l'instant, vérifie la présence de tags ou de certaines caractéristiques
 */
const isUltraProcessed = (food) => {
  if (!food) return false;
  
  // Vérifier tags
  const tags = (food.tags || []).map(t => t.toLowerCase());
  if (tags.some(t => t.includes('transform') || t.includes('process') || t.includes('industriel'))) {
    return true;
  }
  
  // Vérifier nom (mots-clés typiques)
  const name = (food.name || '').toLowerCase();
  const ultraProcessedKeywords = [
    'biscuit', 'cookie', 'gâteau', 'viennoiserie', 'pain de mie',
    'chips', 'crackers', 'barre chocolatée', 'barre énergétique',
    'plat préparé', 'surgelé industriel', 'sauce industrielle'
  ];
  
  return ultraProcessedKeywords.some(keyword => name.includes(keyword));
};

/**
 * Vérifie si un repas contient protéines ET glucides
 */
const hasProteinAndCarbs = (meal) => {
  if (!meal) return false;
  const protein = meal.totalProtein || 0;
  const carbs = meal.totalCarbs || 0;
  return protein > 10 && carbs > 10; // Au moins 10g de chaque
};

/**
 * Vérifie si les macros sont dans la tolérance
 */
const macrosWithinTolerance = (actual, target, tolerancePercent = 10) => {
  if (!target || !actual) return false;
  const tolerance = tolerancePercent / 100;
  
  const proteinOk = Math.abs((actual.protein || 0) - (target.protein || 0)) <= (target.protein || 0) * tolerance;
  const carbsOk = Math.abs((actual.carbs || 0) - (target.carbs || 0)) <= (target.carbs || 0) * tolerance;
  const fatOk = Math.abs((actual.fat || 0) - (target.fat || 0)) <= (target.fat || 0) * tolerance;
  
  return proteinOk && carbsOk && fatOk;
};

// ==================== DÉFIS ====================

/**
 * Défi : Petit-déjeuner respecté
 */
export const checkBreakfastRespected = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const breakfast = meals.find(m => m.type === 'breakfast' && (m.foods || []).length > 0);
  
  if (!breakfast) {
    return { completed: false, reason: 'Aucun petit-déjeuner enregistré' };
  }
  
  // Si programme actif avec plan, vérifier correspondance
  if (activeProgram?.mealPlan?.breakfast) {
    const planned = activeProgram.mealPlan.breakfast;
    const matches = matchesPlannedMeal(breakfast, planned);
    
    if (!matches) {
      return { completed: false, reason: 'Petit-déjeuner ne correspond pas au plan' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Collation matin respectée
 */
export const checkMorningSnackRespected = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const morningSnacks = meals.filter(m => 
    m.type === 'snack' && 
    m.timestamp && 
    new Date(m.timestamp).getHours() < 12 &&
    (m.foods || []).length > 0
  );
  
  if (morningSnacks.length === 0) {
    // Vérifier si une collation était planifiée
    if (activeProgram?.mealPlan?.snackMorning) {
      return { completed: false, reason: 'Collation matin planifiée non prise' };
    }
    return { completed: false, reason: 'Aucune collation matin enregistrée' };
  }
  
  // Si programme actif avec plan, vérifier correspondance
  if (activeProgram?.mealPlan?.snackMorning) {
    const planned = activeProgram.mealPlan.snackMorning;
    const matches = morningSnacks.some(snack => matchesPlannedMeal(snack, planned));
    
    if (!matches) {
      return { completed: false, reason: 'Collation matin ne correspond pas au plan' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Déjeuner programmé - 100% respect (±10%)
 */
export const checkLunchProgrammed = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const lunch = meals.find(m => m.type === 'lunch' && (m.foods || []).length > 0);
  
  if (!lunch) {
    return { completed: false, reason: 'Aucun déjeuner enregistré' };
  }
  
  // Si programme actif avec plan, vérifier correspondance stricte (±10%)
  if (activeProgram?.mealPlan?.lunch) {
    const planned = activeProgram.mealPlan.lunch;
    const matches = matchesPlannedMeal(lunch, planned, 0.10);
    
    if (!matches) {
      return { completed: false, reason: 'Déjeuner ne correspond pas au plan (±10%)' };
    }
  } else {
    return { completed: false, reason: 'Aucun plan de déjeuner défini' };
  }
  
  return { completed: true };
};

/**
 * Défi : Collation après-midi respectée
 */
export const checkAfternoonSnackRespected = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const afternoonSnacks = meals.filter(m => 
    m.type === 'snack' && 
    m.timestamp && 
    new Date(m.timestamp).getHours() >= 12 &&
    new Date(m.timestamp).getHours() < 18 &&
    (m.foods || []).length > 0
  );
  
  if (afternoonSnacks.length === 0) {
    // Vérifier si une collation était planifiée
    if (activeProgram?.mealPlan?.snackAfternoon) {
      return { completed: false, reason: 'Collation après-midi planifiée non prise' };
    }
    return { completed: false, reason: 'Aucune collation après-midi enregistrée' };
  }
  
  // Si programme actif avec plan, vérifier correspondance
  if (activeProgram?.mealPlan?.snackAfternoon) {
    const planned = activeProgram.mealPlan.snackAfternoon;
    const matches = afternoonSnacks.some(snack => matchesPlannedMeal(snack, planned));
    
    if (!matches) {
      return { completed: false, reason: 'Collation après-midi ne correspond pas au plan' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Pré-entraînement propre
 */
export const checkPreWorkoutClean = (dailyMeal, meals, workouts) => {
  if (!dailyMeal || !meals || !workouts || workouts.length === 0) {
    return { completed: false, reason: 'Pas de workout aujourd\'hui' };
  }
  
  // Trouver le workout du jour
  const todayStr = dailyMeal.date;
  const todayWorkouts = workouts.filter(w => {
    const workoutDate = DateHelper.toYYYYMMDD(w.startTime || w.timestamp || w.date);
    return workoutDate === todayStr;
  });
  
  if (todayWorkouts.length === 0) {
    return { completed: false, reason: 'Pas de workout aujourd\'hui' };
  }
  
  // Pour chaque workout, vérifier s'il y a un repas pré-workout dans les 30-60 min
  for (const workout of todayWorkouts) {
    const workoutTime = new Date(workout.startTime || workout.timestamp || workout.date);
    if (isNaN(workoutTime.getTime())) continue;
    
    const preWorkoutMeal = meals.find(meal => {
      if (!meal.timestamp || (meal.foods || []).length === 0) return false;
      const mealTime = new Date(meal.timestamp);
      if (isNaN(mealTime.getTime())) return false;
      
      // Repas doit être avant le workout
      if (mealTime >= workoutTime) return false;
      
      const diffMinutes = timeDifferenceMinutes(mealTime, workoutTime);
      return diffMinutes >= 30 && diffMinutes <= 60;
    });
    
    if (!preWorkoutMeal) {
      return { completed: false, reason: 'Pas de repas pré-workout (30-60 min avant)' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Post-entraînement optimisé
 */
export const checkPostWorkoutOptimized = (dailyMeal, meals, workouts) => {
  if (!dailyMeal || !meals || !workouts || workouts.length === 0) {
    return { completed: false, reason: 'Pas de workout aujourd\'hui' };
  }
  
  // Trouver le workout du jour
  const todayStr = dailyMeal.date;
  const todayWorkouts = workouts.filter(w => {
    const workoutDate = DateHelper.toYYYYMMDD(w.startTime || w.timestamp || w.date);
    return workoutDate === todayStr;
  });
  
  if (todayWorkouts.length === 0) {
    return { completed: false, reason: 'Pas de workout aujourd\'hui' };
  }
  
  // Pour chaque workout, vérifier s'il y a un repas post-workout avec protéines + glucides dans les 60 min
  for (const workout of todayWorkouts) {
    const workoutTime = new Date(workout.endTime || workout.startTime || workout.timestamp || workout.date);
    if (isNaN(workoutTime.getTime())) continue;
    
    const postWorkoutMeal = meals.find(meal => {
      if (!meal.timestamp || (meal.foods || []).length === 0) return false;
      const mealTime = new Date(meal.timestamp);
      if (isNaN(mealTime.getTime())) return false;
      
      // Repas doit être après le workout
      if (mealTime <= workoutTime) return false;
      
      const diffMinutes = timeDifferenceMinutes(mealTime, workoutTime);
      if (diffMinutes > 60) return false;
      
      // Vérifier protéines + glucides
      return hasProteinAndCarbs(meal);
    });
    
    if (!postWorkoutMeal) {
      return { completed: false, reason: 'Pas de repas post-workout avec protéines + glucides (dans 60 min)' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Dîner respecté
 */
export const checkDinnerRespected = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const dinner = meals.find(m => m.type === 'dinner' && (m.foods || []).length > 0);
  
  if (!dinner) {
    return { completed: false, reason: 'Aucun dîner enregistré' };
  }
  
  // Si programme actif avec plan, vérifier correspondance
  if (activeProgram?.mealPlan?.dinner) {
    const planned = activeProgram.mealPlan.dinner;
    const matches = matchesPlannedMeal(dinner, planned);
    
    if (!matches) {
      return { completed: false, reason: 'Dîner ne correspond pas au plan' };
    }
  }
  
  return { completed: true };
};

/**
 * Défi : Hydratation journalière
 */
export const checkHydrationDaily = (dailyMeal) => {
  if (!dailyMeal || !dailyMeal.dailyTotals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const water = dailyMeal.dailyTotals.waterIntake || 0;
  const targetWater = dailyMeal.dailyTotals.targetWater || 2500; // Défaut 2.5L
  
  if (water >= targetWater) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `Hydratation: ${Math.round(water)}ml / ${targetWater}ml` 
  };
};

/**
 * Défi : Objectif protéines atteint
 */
export const checkProteinGoalReached = (dailyMeal) => {
  if (!dailyMeal || !dailyMeal.dailyTotals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const protein = dailyMeal.dailyTotals.protein || 0;
  const targetProtein = dailyMeal.dailyTotals.targetProtein || 150;
  
  if (protein >= targetProtein * 0.95) { // 95% pour tolérance
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `Protéines: ${Math.round(protein)}g / ${targetProtein}g` 
  };
};

/**
 * Défi : Végétal du jour
 */
export const checkVegetablesDaily = (meals) => {
  if (!meals || meals.length === 0) {
    return { completed: false, reason: 'Pas de repas' };
  }
  
  let vegetableCount = 0;
  const vegetableKeywords = ['légume', 'vegetable', 'salade', 'brocoli', 'carotte', 'courgette', 'haricot', 'poivron', 'tomate', 'épinard', 'chou'];
  
  meals.forEach(meal => {
    (meal.foods || []).forEach(food => {
      const name = (food.name || '').toLowerCase();
      if (vegetableKeywords.some(keyword => name.includes(keyword))) {
        vegetableCount += 1;
      }
    });
  });
  
  if (vegetableCount >= 3) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `Légumes: ${vegetableCount} / 3 portions` 
  };
};

/**
 * Défi : Aucun ultra-transformé
 */
export const checkNoUltraProcessed = (meals) => {
  if (!meals || meals.length === 0) {
    return { completed: false, reason: 'Pas de repas' };
  }
  
  const ultraProcessedFoods = [];
  
  meals.forEach(meal => {
    (meal.foods || []).forEach(food => {
      if (isUltraProcessed(food)) {
        ultraProcessedFoods.push(food.name || 'Aliment inconnu');
      }
    });
  });
  
  if (ultraProcessedFoods.length === 0) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `${ultraProcessedFoods.length} aliment(s) ultra-transformé(s) détecté(s)` 
  };
};

/**
 * Défi : Zéro sucre ajouté
 */
export const checkZeroAddedSugar = (meals) => {
  if (!meals || meals.length === 0) {
    return { completed: false, reason: 'Pas de repas' };
  }
  
  let totalAddedSugar = 0;
  
  meals.forEach(meal => {
    (meal.foods || []).forEach(food => {
      totalAddedSugar += food.addedSugar || food.sugar || 0;
    });
  });
  
  // Tolérance 5g (fruits naturels)
  if (totalAddedSugar <= 5) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `${Math.round(totalAddedSugar)}g de sucre ajouté` 
  };
};

/**
 * Défi : Macros dans la plage (±10%)
 */
export const checkMacrosInRange = (dailyMeal, tolerancePercent = 10) => {
  if (!dailyMeal || !dailyMeal.dailyTotals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const actual = {
    protein: dailyMeal.dailyTotals.protein || 0,
    carbs: dailyMeal.dailyTotals.carbs || 0,
    fat: dailyMeal.dailyTotals.fat || 0
  };
  
  const target = {
    protein: dailyMeal.dailyTotals.targetProtein || 150,
    carbs: dailyMeal.dailyTotals.targetCarbs || 200,
    fat: dailyMeal.dailyTotals.targetFat || 65
  };
  
  if (macrosWithinTolerance(actual, target, tolerancePercent)) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `Macros hors tolérance (±${tolerancePercent}%)` 
  };
};

/**
 * Défi : Journal complet - 100% loggé
 */
export const checkJournalComplete = (dailyMeal, meals, activeProgram) => {
  if (!dailyMeal || !meals) {
    return { completed: false, reason: 'Pas de données' };
  }
  
  const requiredMeals = [];
  
  // Petit-déjeuner toujours requis
  requiredMeals.push({ type: 'breakfast', label: 'Petit-déjeuner' });
  
  // Collation matin si planifiée
  if (activeProgram?.mealPlan?.snackMorning) {
    requiredMeals.push({ type: 'snack', label: 'Collation matin', timeRange: [0, 12] });
  }
  
  // Déjeuner toujours requis
  requiredMeals.push({ type: 'lunch', label: 'Déjeuner' });
  
  // Collation après-midi si planifiée
  if (activeProgram?.mealPlan?.snackAfternoon) {
    requiredMeals.push({ type: 'snack', label: 'Collation après-midi', timeRange: [12, 18] });
  }
  
  // Dîner toujours requis
  requiredMeals.push({ type: 'dinner', label: 'Dîner' });
  
  // Vérifier chaque repas requis
  const missingMeals = [];
  
  requiredMeals.forEach(required => {
    const hasMeal = meals.some(meal => {
      if (meal.type !== required.type || (meal.foods || []).length === 0) return false;
      
      if (required.timeRange) {
        const hour = meal.timestamp ? new Date(meal.timestamp).getHours() : null;
        if (hour === null) return false;
        return hour >= required.timeRange[0] && hour < required.timeRange[1];
      }
      
      return true;
    });
    
    if (!hasMeal) {
      missingMeals.push(required.label);
    }
  });
  
  if (missingMeals.length === 0) {
    return { completed: true };
  }
  
  return { 
    completed: false, 
    reason: `Repas manquants: ${missingMeals.join(', ')}` 
  };
};

// ==================== FONCTION PRINCIPALE ====================

/**
 * Calcule tous les défis pour une journée donnée
 * 
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {Object} dailyMeal - Données du jour (dailyMeal)
 * @param {Array} meals - Liste des repas du jour
 * @param {Object} activeProgram - Programme actif (optionnel)
 * @param {Array} workouts - Liste des workouts du jour (optionnel)
 * @returns {Object} Résultats de tous les défis
 */
export const calculateDailyChallenges = (dateStr, dailyMeal, meals = [], activeProgram = null, workouts = []) => {
  const challenges = {
    breakfastRespected: checkBreakfastRespected(dailyMeal, meals, activeProgram),
    morningSnackRespected: checkMorningSnackRespected(dailyMeal, meals, activeProgram),
    lunchProgrammed: checkLunchProgrammed(dailyMeal, meals, activeProgram),
    afternoonSnackRespected: checkAfternoonSnackRespected(dailyMeal, meals, activeProgram),
    preWorkoutClean: checkPreWorkoutClean(dailyMeal, meals, workouts),
    postWorkoutOptimized: checkPostWorkoutOptimized(dailyMeal, meals, workouts),
    dinnerRespected: checkDinnerRespected(dailyMeal, meals, activeProgram),
    hydrationDaily: checkHydrationDaily(dailyMeal),
    proteinGoalReached: checkProteinGoalReached(dailyMeal),
    vegetablesDaily: checkVegetablesDaily(meals),
    noUltraProcessed: checkNoUltraProcessed(meals),
    zeroAddedSugar: checkZeroAddedSugar(meals),
    macrosInRange: checkMacrosInRange(dailyMeal),
    journalComplete: checkJournalComplete(dailyMeal, meals, activeProgram)
  };
  
  const completedCount = Object.values(challenges).filter(c => c.completed).length;
  const totalCount = Object.keys(challenges).length;
  
  return {
    date: dateStr,
    challenges,
    stats: {
      completed: completedCount,
      total: totalCount,
      percentage: Math.round((completedCount / totalCount) * 100)
    },
    timestamp: new Date().toISOString()
  };
};

export default {
  calculateDailyChallenges,
  checkBreakfastRespected,
  checkMorningSnackRespected,
  checkLunchProgrammed,
  checkAfternoonSnackRespected,
  checkPreWorkoutClean,
  checkPostWorkoutOptimized,
  checkDinnerRespected,
  checkHydrationDaily,
  checkProteinGoalReached,
  checkVegetablesDaily,
  checkNoUltraProcessed,
  checkZeroAddedSugar,
  checkMacrosInRange,
  checkJournalComplete
};

