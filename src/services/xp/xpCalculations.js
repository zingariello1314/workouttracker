/**
 * Fonctions de calcul XP pour chaque catégorie
 */

import { loadEnduranceData as loadEnduranceDataService } from '../endurance/enduranceDataService';
import { evaluateChallenges } from '../endurance/enduranceChallengesService';
import {
  evaluateRunningTrophies,
  computeRunningTrophiesXpDetailed
} from '../endurance/runningTrophiesService';
import {
  evaluateSimpleEnduranceTrophies,
  computeSimpleEnduranceTrophiesXpDetailed
} from '../endurance/simpleEnduranceTrophiesService';
import {
  evaluatePushupTrophies,
  computePushupTrophiesXpDetailed
} from '../endurance/pushupTrophiesService';
import { isGarminRunningLikeActivity } from '../../utils/garminRunningLaps';
import { averageCriteriaScore } from '../../utils/bookReadingRatings';
import { calculateQuestXP } from '../../utils/questXpCore';

function buildGarminRunningByIdForTrophies(garminData) {
  const full = new Map();
  const cardio = garminData?.activities?.cardio;
  if (!Array.isArray(cardio)) return full;
  for (const act of cardio) {
    const id = act.garminId ?? act.id;
    if (id == null) continue;
    if (!Array.isArray(act.running?.laps) || act.running.laps.length === 0) continue;
    if (!isGarminRunningLikeActivity(act)) continue;
    full.set(String(id), act);
  }
  return full;
}

function genreMultiplier(genre) {
  const g = (genre || '').toLowerCase();
  if (!g.trim()) return 1;
  if (/technique|science|docu|essai|manuel|acad|philosophie|histoire/.test(g)) return 1.08;
  if (/poésie|classique|théâtre/.test(g)) return 1.04;
  if (/bd|manga|comic|jeunesse|young/.test(g)) return 0.96;
  return 1;
}

/**
 * XP d'une session avec contexte livre (pages totales, genre, statut terminé, critères).
 */
function sessionXpWithContext(session, book) {
  const pages = Number(session?.pagesRead) || 0;
  const mins = Number(session?.durationMinutes) || 0;
  const totalBookPages = Math.max(0, Number(book?.pages) || 0);
  const critAvg = averageCriteriaScore(session?.criteriaRatings);
  const ratingMult = 0.78 + (critAvg / 10) * 0.44;

  let sessionXP = 8;
  sessionXP += pages * 0.92;
  sessionXP += Math.min(mins * 0.42, 22);

  if (totalBookPages > 0 && pages > 0) {
    const frac = Math.min(1, pages / totalBookPages);
    sessionXP *= 1 + frac * 0.28;
  }

  if (mins > 0 && pages > 0) {
    const pagesPerHour = (pages / mins) * 60;
    if (pagesPerHour >= 48) sessionXP *= 1.48;
    else if (pagesPerHour >= 32) sessionXP *= 1.26;
    else if (pagesPerHour >= 20) sessionXP *= 1.12;
    else if (pagesPerHour >= 12) sessionXP *= 1.04;
  }

  sessionXP *= ratingMult;
  sessionXP *= genreMultiplier(book?.genre);

  if (book?.status === 'completed') {
    sessionXP *= 1.14;
  }

  return Math.max(0, sessionXP);
}

/**
 * Calcule l'XP pour les livres (sessions + contexte par livre).
 * @param {Array<{ readingSessions?: object[], pages?: number|string, genre?: string, status?: string }>} books
 * @returns {number} XP totale
 */
export const calculateBooksXP = (books) => {
  if (!books || !Array.isArray(books) || books.length === 0) return 0;

  let totalXP = 0;
  books.forEach((book) => {
    const sessions = Array.isArray(book?.readingSessions) ? book.readingSessions : [];
    sessions.forEach((session) => {
      totalXP += sessionXpWithContext(session, book);
    });
  });

  return Math.round(totalXP);
};

/** @deprecated Préfère calculateBooksXP(books) ; conservé pour appels anciens qui passent une liste plate de sessions. */
export const calculateBooksXPFromSessionsOnly = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  const fakeBook = { pages: 0, genre: '', status: 'in-progress' };
  let totalXP = 0;
  sessions.forEach((session) => {
    totalXP += sessionXpWithContext(session, fakeBook);
  });
  return Math.round(totalXP);
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
    sessions: 0,
    runningTrophies: 0,
    runningTrophyTiers: 0,
    runningTrophiesUnlocked: 0,
    runningTotalDistanceKm: 0,
    runningSessionCount: 0,
    jumpRopeTrophies: 0,
    jumpRopeTrophyTiers: 0,
    jumpRopeTrophiesUnlocked: 0,
    gainageTrophies: 0,
    gainageTrophyTiers: 0,
    gainageTrophiesUnlocked: 0,
    pushupTrophies: 0,
    pushupTrophyTiers: 0,
    pushupTrophiesUnlocked: 0
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
  
  // 5. XP des défis d'endurance : 50 XP par défi validé
  const normalizedEndurance = loadEnduranceDataService(enduranceData || {});
  const sessionsByType = normalizedEndurance?.sessions || {};
  const allChallenges = Array.isArray(normalizedEndurance?.challenges)
    ? normalizedEndurance.challenges
    : [];

  const evaluationChallenges = allChallenges.map((challenge) => ({
    ...challenge,
    status: 'active'
  }));

  const sessionValidations = Object.values(sessionsByType).reduce((sum, list) => {
    if (!Array.isArray(list)) return sum;
    return sum + list.reduce((innerSum, session) => {
      if (Array.isArray(session?.validatedChallenges) && session.validatedChallenges.length > 0) {
        const uniqueIds = new Set(
          session.validatedChallenges
            .filter((id) => id !== null && id !== undefined)
            .map((id) => String(id))
        );
        return innerSum + uniqueIds.size;
      }
      const activityType = session?.activityType;
      if (!activityType) return innerSum;
      const relatedPushupSessions = activityType === 'pushups' && Array.isArray(list) ? list : undefined;
      const evaluation = evaluateChallenges(evaluationChallenges, session, activityType, {
        relatedPushupSessions
      });
      return innerSum + (evaluation.validatedIds?.length || 0);
    }, 0);
  }, 0);
  
  const completedChallenges = allChallenges.filter(c => c.status === 'completed').length;
  
  const totalChallengeCompletions = sessionValidations > 0 ? sessionValidations : completedChallenges;
  
  breakdown.challenges = totalChallengeCompletions;
  totalXP += totalChallengeCompletions * 50;
  
  // 6. XP des sessions complètes : 25 XP par session avec feedback
  if (workoutData.sessionFeedbacks) {
    const sessionsWithFeedback = Object.keys(workoutData.sessionFeedbacks).length;
    breakdown.sessions = sessionsWithFeedback;
    totalXP += sessionsWithFeedback * 25;
  }

  const runningSessions = Array.isArray(sessionsByType.running) ? sessionsByType.running : [];
  const runningTotalDistanceKm = runningSessions.reduce((acc, r) => acc + (Number(r?.distance) || 0), 0);
  breakdown.runningTotalDistanceKm = Math.round(runningTotalDistanceKm * 100) / 100;
  breakdown.runningSessionCount = runningSessions.length;
  const garminById = buildGarminRunningByIdForTrophies(garminData);
  const runningTrophyEval = evaluateRunningTrophies({ runningSessions, garminById });
  const rt = computeRunningTrophiesXpDetailed(runningTrophyEval.results);
  breakdown.runningTrophies = rt.xp;
  breakdown.runningTrophyTiers = rt.unlockedTierCount;
  breakdown.runningTrophiesUnlocked = rt.trophiesWithTier;
  totalXP += rt.xp;

  const jumpRopeSessions = Array.isArray(sessionsByType.jumprope) ? sessionsByType.jumprope : [];
  const gainageSessions = Array.isArray(sessionsByType.gainage) ? sessionsByType.gainage : [];
  const jrEval = evaluateSimpleEnduranceTrophies({ activityType: 'jumprope', sessions: jumpRopeSessions });
  const jrXp = computeSimpleEnduranceTrophiesXpDetailed(jrEval.results);
  breakdown.jumpRopeTrophies = jrXp.xp;
  breakdown.jumpRopeTrophyTiers = jrXp.unlockedTierCount;
  breakdown.jumpRopeTrophiesUnlocked = jrXp.trophiesWithTier;
  totalXP += jrXp.xp;

  const gaEval = evaluateSimpleEnduranceTrophies({ activityType: 'gainage', sessions: gainageSessions });
  const gaXp = computeSimpleEnduranceTrophiesXpDetailed(gaEval.results);
  breakdown.gainageTrophies = gaXp.xp;
  breakdown.gainageTrophyTiers = gaXp.unlockedTierCount;
  breakdown.gainageTrophiesUnlocked = gaXp.trophiesWithTier;
  totalXP += gaXp.xp;

  const pushupSessions = Array.isArray(sessionsByType.pushups) ? sessionsByType.pushups : [];
  const puEval = evaluatePushupTrophies({ sessions: pushupSessions });
  const puXp = computePushupTrophiesXpDetailed(puEval.results);
  breakdown.pushupTrophies = puXp.xp;
  breakdown.pushupTrophyTiers = puXp.unlockedTierCount;
  breakdown.pushupTrophiesUnlocked = puXp.trophiesWithTier;
  totalXP += puXp.xp;

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
  if (!validations || validations.length === 0) return 0;
  
  // QuietQuest stocke souvent xpGagne directement dans les validations.
  const xpFromValidations = validations.reduce((sum, v) => {
    return sum + (v?.xpGagne || 0);
  }, 0);
  if (xpFromValidations > 0) return xpFromValidations;
  
  if (!allQuests || allQuests.length === 0) return 0;
  
  let totalXP = 0;
  validations.forEach((validation) => {
    const questId = validation?.queteId ?? validation?.questId;
    if (!questId) return;
    const quest = allQuests.find(q => q.id === questId);
    if (!quest) return;
    totalXP += calculateQuestXP(quest);
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
  const addictionQuitXP = Math.round(data.addictionQuit?.totalXP || 0);
  const addictionBreakdown = data.addictionQuit?.breakdown || {
    milestones: 0,
    daily: 0,
    sessions: 0,
    relapses: 0,
  };
  const codeXP = Math.round(data.code?.totalXP || 0);

  const totalXP = questsXP + learningXP + nutritionXP + booksXP + sportXP + addictionQuitXP + codeXP;

  return {
    totalXP,
    xpByCategory: {
      quests: questsXP,
      learning: learningXP,
      nutrition: nutritionXP,
      books: booksXP,
      sport: sportXP,
      addictionQuit: addictionQuitXP,
      code: codeXP,
    },
    details: {
      quests: {
        totalXP: questsXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          completed: data.quests?.validations?.length || 0,
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
        breakdown: data.sport?.breakdown || {
          reps: 0,
          exercises: 0,
          calories: 0,
          steps: 0,
          challenges: 0,
          sessions: 0,
          runningTrophies: 0,
          runningTrophyTiers: 0,
          runningTrophiesUnlocked: 0,
          jumpRopeTrophies: 0,
          jumpRopeTrophyTiers: 0,
          jumpRopeTrophiesUnlocked: 0,
          gainageTrophies: 0,
          gainageTrophyTiers: 0,
          gainageTrophiesUnlocked: 0,
          pushupTrophies: 0,
          pushupTrophyTiers: 0,
          pushupTrophiesUnlocked: 0
        }
      },
      addictionQuit: {
        totalXP: addictionQuitXP,
        lastCalculated: new Date().toISOString(),
        breakdown: addictionBreakdown || { milestones: 0, daily: 0, sessions: 0, relapses: 0 },
      },
      code: {
        totalXP: codeXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.code?.breakdown || {
          totalContributions: 0,
          activeCodingDays: 0,
          calendarDays: 0,
        },
      },
    }
  };
};
