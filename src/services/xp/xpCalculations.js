/**
 * Fonctions de calcul XP pour chaque catégorie
 */

// XP par difficulté pour les quêtes (réutilisé depuis useQuietQuestEngine)
const DIFFICULTY_XP_BASE = {
  1: 250,
  2: 375,
  3: 500,
  4: 750,
};

/**
 * Calcule l'XP pour les livres
 * @param {Array} sessions - Sessions de lecture
 * @returns {number} XP totale
 */
export const calculateBooksXP = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  let totalXP = 0;
  
  sessions.forEach(session => {
    // Base : 10 XP par session
    let sessionXP = 10;
    
    // Bonus pages : 1 XP par page lue
    sessionXP += session.pagesRead || 0;
    
    // Bonus durée : 0.5 XP par minute (max 30 min = 15 XP)
    const durationBonus = Math.min((session.durationMinutes || 0) * 0.5, 15);
    sessionXP += durationBonus;
    
    // Bonus vitesse : +20% si > 20 pages/heure, +50% si > 40 pages/heure
    if (session.durationMinutes > 0 && session.pagesRead > 0) {
      const pagesPerHour = (session.pagesRead / session.durationMinutes) * 60;
      if (pagesPerHour >= 40) {
        sessionXP *= 1.5;
      } else if (pagesPerHour >= 20) {
        sessionXP *= 1.2;
      }
    }
    
    totalXP += Math.round(sessionXP);
  });
  
  return totalXP;
};

/**
 * Calcule l'XP pour le sport
 * @param {Object} workoutData - Données d'entraînement
 * @param {Object} garminData - Données Garmin
 * @param {Object} enduranceData - Données d'endurance
 * @returns {Object} { totalXP, breakdown }
 */
export const calculateSportXP = (workoutData, garminData, enduranceData) => {
  let totalXP = 0;
  const breakdown = {
    reps: 0,
    exercises: 0,
    calories: 0,
    steps: 0,
    challenges: 0,
    sessions: 0
  };
  
  if (!workoutData) {
    return { totalXP: 0, breakdown };
  }
  
  // 1. XP des répétitions : 0.1 XP par répétition
  const totalReps = Object.values(workoutData.reps || {}).reduce((sum, reps) => {
    return sum + (parseInt(reps) || 0);
  }, 0);
  breakdown.reps = totalReps;
  totalXP += Math.round(totalReps * 0.1);
  
  // 2. XP des exercices cochés : 5 XP par exercice complété
  const checkedExercises = Object.values(workoutData.checkedExercises || {}).filter(v => v === true).length;
  breakdown.exercises = checkedExercises;
  totalXP += checkedExercises * 5;
  
  // 3. XP des calories (Garmin) : 0.5 XP par calorie active
  if (garminData?.dailyMetrics) {
    let totalCalories = 0;
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.calories?.active) {
        totalCalories += day.calories.active;
      }
    });
    breakdown.calories = totalCalories;
    totalXP += Math.round(totalCalories * 0.5);
  }
  
  // 4. XP des pas (Garmin) : 0.01 XP par pas
  if (garminData?.dailyMetrics) {
    let totalSteps = 0;
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.steps) {
        totalSteps += day.steps;
      }
    });
    breakdown.steps = totalSteps;
    totalXP += Math.round(totalSteps * 0.01);
  }
  
  // 5. XP des défis d'endurance : 50 XP par défi complété
  if (enduranceData?.challenges) {
    const completedChallenges = enduranceData.challenges.filter(c => c.status === 'completed').length;
    breakdown.challenges = completedChallenges;
    totalXP += completedChallenges * 50;
  }
  
  // 6. XP des sessions complètes : 25 XP par session avec feedback
  if (workoutData.sessionFeedbacks) {
    const sessionsWithFeedback = Object.keys(workoutData.sessionFeedbacks).length;
    breakdown.sessions = sessionsWithFeedback;
    totalXP += sessionsWithFeedback * 25;
  }
  
  return {
    totalXP: Math.round(totalXP),
    breakdown
  };
};

/**
 * Calcule l'XP pour les quêtes
 * @param {Array} validations - Validations de quêtes
 * @param {Array} allQuests - Toutes les quêtes
 * @returns {number} XP totale
 */
export const calculateQuestsXP = (validations, allQuests) => {
  if (!validations || !allQuests) return 0;
  
  let totalXP = 0;
  
  validations.forEach(validation => {
    if (!validation.completed) return;
    
    const quest = allQuests.find(q => q.id === validation.questId);
    if (quest) {
      const base = DIFFICULTY_XP_BASE[quest.difficulte] || DIFFICULTY_XP_BASE[1];
      const multiplier = (quest.duree || 60) / 60;
      totalXP += Math.round(base * multiplier);
    }
  });
  
  return totalXP;
};

/**
 * Calcule l'XP pour l'apprentissage
 * @param {Object} progressionData - Données de progression
 * @returns {number} XP totale
 */
export const calculateLearningXP = (progressionData) => {
  if (!progressionData) return 0;
  return progressionData.globalXP || 0;
};

/**
 * Calcule l'XP pour la nutrition
 * @param {Object} gamificationData - Données de gamification
 * @returns {number} XP totale
 */
export const calculateNutritionXP = (gamificationData) => {
  if (!gamificationData || !gamificationData.experience) return 0;
  return gamificationData.experience.currentXP || 0;
};

/**
 * Calcule l'XP pour toutes les catégories
 * @param {Object} data - Données de toutes les catégories
 * @returns {Object} XP totale et détails
 */
export const calculateXPForAllCategories = (data) => {
  const questsXP = calculateQuestsXP(data.quests?.validations, data.quests?.allQuests);
  const learningXP = calculateLearningXP(data.learning);
  const nutritionXP = calculateNutritionXP(data.nutrition);
  const booksXP = data.books?.totalXP || 0;
  const sportXP = data.sport?.totalXP || 0;
  
  const totalXP = questsXP + learningXP + nutritionXP + booksXP + sportXP;
  
  return {
    totalXP,
    xpByCategory: {
      quests: questsXP,
      learning: learningXP,
      nutrition: nutritionXP,
      books: booksXP,
      sport: sportXP
    },
    details: {
      quests: {
        totalXP: questsXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          completed: data.quests?.validations?.filter(v => v.completed).length || 0,
          difficulty: {
            1: 0, 2: 0, 3: 0, 4: 0
          }
        }
      },
      learning: {
        totalXP: learningXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          studyTime: data.learning?.totalStudyTime || 0,
          sessions: Object.values(data.learning?.subjects || {}).reduce((sum, s) => sum + (s.sessions || 0), 0),
          subjects: {}
        }
      },
      nutrition: {
        totalXP: nutritionXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          meals: 0,
          goals: 0,
          streaks: 0
        }
      },
      books: {
        totalXP: booksXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.books?.breakdown || { sessions: 0, pages: 0, pagesPerHour: 0 }
      },
      sport: {
        totalXP: sportXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.sport?.breakdown || { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 }
      }
    }
  };
};
