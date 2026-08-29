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
import { isGarminRunningLikeActivity, shouldExcludeStoredGarminRunningSession } from '../../utils/garminRunningLaps';
import { mergeGarminCardioIntoRunningSessions } from '../../utils/garminEnduranceSessionBridge';
import {
  buildGarminCardioById,
  computeRunningVolumeTotals
} from '../../utils/sport/runningVolumeTruth';
import { averageCriteriaScore } from '../../utils/bookReadingRatings';
import { calculateQuestXP } from '../../utils/questXpCore';
import SessionAggregator from '../statistics/SessionAggregator.js';
import { computeVolumeKgForWorkoutKey } from '../../utils/exerciseLoadVolume';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  collectDedupedCheckedVolumeKeys,
  computeMedianWeightKgForExercise,
  computeStrengthCalendarContribution,
  resolveExerciseIntensityCoeff,
  resolveExerciseWeightMultiplier
} from '../../utils/trainingLoadUtils';
import { computeProgramCompletionBonusXp } from '../../utils/programCompletionBonus';
import { computeCircuitsXp } from './circuitsXpService';
import { computeGtgXp } from './gtgXpService';
import { parseStretchItemKey } from '../../utils/exerciseKeyGenerator';
import { buildPlannedStretchItemsForDateStr } from '../../utils/stretchUtils';
import { workoutProgram } from '../../data/workoutProgram';
import { computeLifetimeStepsMetrics } from '../sport/WalkingMetricsService';
import { computeStretchXpFromRating, computeStretchXpFromGlobal5 } from '../../utils/stretchPerceivedRatings';
import { collectFractionneIntervalXp } from '../../utils/intervalTrainingUtils';
import { computeLifetimeExerciseAndChallengeMinutes } from '../../utils/calendarPhysicalSessionStripes';
import { resolvePushupSessionTotalReps } from '../endurance/pushupSessionUtils';
import { detectExerciseUnit } from '../../utils/exerciseCalculations';
import {
  storedTimeToDisplayMinutes
} from '../../utils/sport/exerciseTimeValueUtils';
import { resolveExerciseScoring } from '../../utils/exerciseScoringResolver';

export {
  STRETCH_XP_MIN,
  STRETCH_XP_MAX,
  STRETCH_XP_FALLBACK,
  computeStretchXpFromRating
} from '../../utils/stretchPerceivedRatings';

/** Incrémenter quand la formule XP Sport change (invalidation cache `useSportXP`). */
export const SPORT_XP_FORMULA_REVISION = 7;

/** Reps pondérées : XP = charge pondérée cumulée × ce facteur. */
export const SPORT_XP_WEIGHTED_LOAD_FACTOR = 0.68;
/** XP par paire (date, exercice) cochée — aligné dedup fractionné. */
export const SPORT_XP_PER_CHECKED_EXERCISE = 19;
/** XP par kcal active Garmin cumulée. */
export const SPORT_XP_PER_ACTIVE_CALORIE = 0.21;

/** XP additionnelle liée au volume total cumulé (kg×reps), en complément du bonus déjà présent dans les reps pondérées. */
export const SPORT_XP_PER_TOTAL_KG_VOLUME = 0.04;
/** Plafond sur ce seul poste pour que l’historique ne fasse pas exploser l’XP globale. */
export const SPORT_XP_LIFTED_VOLUME_CAP = 12000;

/** XP Sport par ligne d’aliment enregistrée dans un repas (journal nutrition IndexedDB). */
export const SPORT_XP_PER_NUTRITION_FOOD_REGISTERED = 50;

/** Borne haute du coefficient « ~2 étoiles » (voir `intensityCoeffToStarCount`). */
const TWO_STAR_INTENSITY_COEFF_UPPER = 1.34;

const ENDURANCE_CHALLENGE_SESSION_TYPES = ['pushups', 'gainage', 'jumprope', 'swimming', 'boxing'];

/** Séances Défis / endurance loggées (même sans fiche défi `challenges[]` validée). */
export function countLoggedEnduranceChallengeSessions(sessionsByType) {
  let n = 0;
  ENDURANCE_CHALLENGE_SESSION_TYPES.forEach((type) => {
    const list = sessionsByType?.[type];
    if (!Array.isArray(list)) return;
    list.forEach((session) => {
      if (!session || typeof session !== 'object') return;
      if (type === 'pushups') {
        if (resolvePushupSessionTotalReps(session) > 0) n += 1;
        return;
      }
      if (type === 'gainage') {
        if ((Number(session.count) || 0) > 0 || session.duration) n += 1;
        return;
      }
      if (type === 'jumprope') {
        if ((Number(session.jumps ?? session.reps) || 0) > 0 || session.duration) n += 1;
        return;
      }
      if (session.duration || Number(session.distance) > 0 || Number(session.count) > 0) n += 1;
    });
  });
  return n;
}

/**
 * Charge de référence « 10 reps × difficulté ~2★ » dans la formule reps pondérées (sans charge additionnelle).
 * Sert de repère d’équilibre vs la récompense nutrition (affichée dans la barre XP).
 */
export function sportXpReferenceTenRepsTwoStarBodyweight() {
  const weightedLoad = 10 * TWO_STAR_INTENSITY_COEFF_UPPER * 1;
  return Math.round(weightedLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR);
}

/**
 * Compte les aliments réellement saisis dans les repas (nom ou id + quantité &gt; 0).
 */
export function countNutritionRegisteredFoodItems(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return 0;
  let n = 0;
  for (const meal of meals) {
    const foods = meal?.foods;
    if (!Array.isArray(foods)) continue;
    for (const f of foods) {
      if (!f || typeof f !== 'object') continue;
      const qty = Number(f.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (String(f.name || '').trim() || String(f.id || '').trim()) n += 1;
    }
  }
  return n;
}

/** XP cumulée liée aux aliments enregistrés dans le journal nutrition. */
export function computeNutritionRegisteredFoodSportXp(meals) {
  const nutritionFoodItems = countNutritionRegisteredFoodItems(meals);
  return {
    nutritionFoodItems,
    nutritionFoodXp: nutritionFoodItems * SPORT_XP_PER_NUTRITION_FOOD_REGISTERED
  };
}

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
 * Bonus XP lié aux séries (même logique de dates que les statistiques livres).
 * Courbes en √ : forte récompense au début, plafond pour éviter d’écraser le reste.
 */
export function booksStreakBonusXp(currentStreak, longestStreak) {
  const c = Math.max(0, Number(currentStreak) || 0);
  const l = Math.max(0, Number(longestStreak) || 0);
  const raw = 17 * Math.sqrt(c) + 10 * Math.sqrt(l);
  return Math.min(240, Math.round(raw));
}

/**
 * Bonus « volume » global (pages cumulées), en complément du XP par session.
 */
export function booksReadingVolumeBonusXp(totalPages) {
  const p = Math.max(0, Number(totalPages) || 0);
  return Math.min(175, Math.round(Math.log1p(p) * 24));
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

  // Base + bonus « session enregistrée » ; pages et durée pondérées plus fort
  let sessionXP = 12;
  sessionXP += pages * 1.32;
  sessionXP += Math.min(mins * 0.5, 28);

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

const EMPTY_BOOKS_XP_BREAKDOWN = {
  sessions: 0,
  pages: 0,
  pagesPerHour: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakBonusXp: 0,
  volumeBonusXp: 0,
  sessionSubtotalXp: 0,
};

/**
 * Détail XP livres : sessions (pages, durée, contexte) + bonus volume pages + bonus streaks.
 * @param {Array<{ readingSessions?: object[], pages?: number|string, genre?: string, status?: string }>} books
 * @returns {{ totalXP: number, breakdown: typeof EMPTY_BOOKS_XP_BREAKDOWN }}
 */
export const computeBooksXPTotal = (books) => {
  if (!books || !Array.isArray(books) || books.length === 0) {
    return { totalXP: 0, breakdown: { ...EMPTY_BOOKS_XP_BREAKDOWN } };
  }

  let sessionXpSum = 0;
  let totalPages = 0;
  let sessionCount = 0;
  let totalMinutes = 0;

  books.forEach((book) => {
    const sessions = Array.isArray(book?.readingSessions) ? book.readingSessions : [];
    sessions.forEach((session) => {
      sessionCount += 1;
      totalPages += Number(session?.pagesRead) || 0;
      totalMinutes += Number(session?.durationMinutes) || 0;
      sessionXpSum += sessionXpWithContext(session, book);
    });
  });

  const allSessions = SessionAggregator.extractAllSessions(books);
  const { currentStreak, longestStreak } = SessionAggregator.calculateStreaks(allSessions);
  const streakBonusXp = booksStreakBonusXp(currentStreak, longestStreak);
  const volumeBonusXp = booksReadingVolumeBonusXp(totalPages);
  const sessionSubtotalXp = Math.round(sessionXpSum);
  const totalXP = sessionSubtotalXp + streakBonusXp + volumeBonusXp;

  const pagesPerHour = totalMinutes > 0 ? (totalPages / totalMinutes) * 60 : 0;

  return {
    totalXP,
    breakdown: {
      sessions: sessionCount,
      pages: totalPages,
      pagesPerHour: Math.round(pagesPerHour * 10) / 10,
      currentStreak,
      longestStreak,
      streakBonusXp,
      volumeBonusXp,
      sessionSubtotalXp,
    },
  };
};

/**
 * Calcule l'XP pour les livres (sessions + contexte + volume + streaks).
 * @param {Array<{ readingSessions?: object[], pages?: number|string, genre?: string, status?: string }>} books
 * @returns {number} XP totale
 */
export const calculateBooksXP = (books) => computeBooksXPTotal(books).totalXP;

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
export const calculateSportXP = (workoutData, garminData, enduranceData, sportOptions = {}) => {
  let totalXP = 0;
  const breakdown = {
    reps: 0,
    timeMinutes: 0,
    sessionMinutes: 0,
    weightedRepsLoad: 0,
    weightedRepsXp: 0,
    weightedTimeLoad: 0,
    weightedTimeXp: 0,
    exercises: 0,
    exercisesXp: 0,
    calories: 0,
    caloriesXp: 0,
    steps: 0,
    stepsXp: 0,
    stepsXpVerified: 0,
    stepsXpDeclarative: 0,
    challenges: 0,
    challengesXp: 0,
    sessions: 0,
    sessionsFeedbackXp: 0,
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
    pushupTrophiesUnlocked: 0,
    programCompletionBonusXp: 0,
    liftedVolumeKg: 0,
    liftedVolumeKgXp: 0,
    circuitsXp: 0,
    circuitCompletedDays: 0,
    circuitTripleAchievedDays: 0,
    circuitBonusRounds: 0,
    gtgXp: 0,
    gtgReps: 0,
    gtgDaysWithXp: 0,
    gtgDaysAt50: 0,
    gtgDaysAt100: 0,
    nutritionFoodItems: 0,
    nutritionFoodXp: 0,
    intervalTrainingSessions: 0,
    intervalTrainingXp: 0
  };
  
  if (!workoutData) {
    const nutOnly = computeNutritionRegisteredFoodSportXp(sportOptions?.nutritionMeals);
    breakdown.nutritionFoodItems = nutOnly.nutritionFoodItems;
    breakdown.nutritionFoodXp = nutOnly.nutritionFoodXp;
    return { totalXP: Math.round(nutOnly.nutritionFoodXp), breakdown };
  }

  const extractExerciseIdFromStorageKey = (key) => {
    const k = String(key || '');
    if (!k) return '';
    const firstUnderscore = k.indexOf('_');
    if (firstUnderscore < 0) return k;
    return k
      .slice(firstUnderscore + 1)
      .replace(/_semaineA$|_semaineB$/, '');
  };

  const resolveVolumeKeyScoring = (key) => {
    const exerciseId = extractExerciseIdFromStorageKey(key);
    const name =
      typeof sportOptions?.getExerciseNameById === 'function'
        ? sportOptions.getExerciseNameById(exerciseId) || ''
        : '';
    return resolveExerciseScoring({ name, id: exerciseId });
  };

  // 1. XP pondérée : reps dynamiques · isométriques (paliers) · temps cardio/min séparé
  const repsMap = workoutData.reps || {};
  const coeffs = workoutData.exerciseIntensityCoeffs || {};
  let totalReps = 0;
  let totalTimeMinutes = 0;
  let weightedLoad = 0;
  let weightedTimeLoad = 0;
  let totalLiftedVolumeKg = 0;

  const volumeKeys = collectDedupedCheckedVolumeKeys(workoutData);
  volumeKeys.forEach((key) => {
    const raw = Number(repsMap[key]);
    if (!Number.isFinite(raw) || raw <= 0) return;

    const scoring = resolveVolumeKeyScoring(key);
    const exerciseId = extractExerciseIdFromStorageKey(key);
    const name =
      typeof sportOptions?.getExerciseNameById === 'function'
        ? sportOptions.getExerciseNameById(exerciseId) || ''
        : '';
    const unitInfo = detectExerciseUnit({ name, series: '' });

    const coeff = resolveExerciseIntensityCoeff({ name, id: exerciseId }, coeffs);

    const volumeKg = computeVolumeKgForWorkoutKey(key, workoutData);
    totalLiftedVolumeKg += volumeKg;
    const exerciseLike = { name, id: exerciseId };
    const countForWeight =
      scoring?.scoringType === 'isometric' ? raw : Math.floor(raw);
    const weightKg = countForWeight > 0 && volumeKg > 0 ? volumeKg / countForWeight : 0;
    const medianKg = computeMedianWeightKgForExercise(
      workoutData.exerciseWeights,
      exerciseId
    );
    const weightMultiplier = resolveExerciseWeightMultiplier(
      exerciseLike,
      weightKg,
      medianKg
    );

    if (scoring?.scoringType === 'isometric' && scoring?.unit === 'seconds') {
      weightedLoad += computeStrengthCalendarContribution(
        exerciseLike,
        raw,
        coeff,
        weightMultiplier
      );
      return;
    }

    const isTime = unitInfo?.isTimeBased === true && scoring?.scoringType !== 'dynamic';
    if (isTime) {
      totalTimeMinutes += storedTimeToDisplayMinutes(raw, unitInfo.unit);
      weightedTimeLoad += raw * coeff;
      return;
    }

    const reps = Math.floor(raw);
    totalReps += reps;
    weightedLoad += computeStrengthCalendarContribution(
      exerciseLike,
      reps,
      coeff,
      weightMultiplier
    );
  });

  breakdown.reps = totalReps;
  breakdown.timeMinutes = Math.round(totalTimeMinutes * 10) / 10;
  const snapshotForTime = {
    ...workoutData,
    enduranceData: enduranceData || workoutData.enduranceData
  };
  breakdown.sessionMinutes = Math.round(
    computeLifetimeExerciseAndChallengeMinutes(snapshotForTime, garminData) * 10
  ) / 10;
  breakdown.weightedRepsLoad = Math.round(weightedLoad * 100) / 100;
  breakdown.weightedRepsXp = Math.round(weightedLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR);
  breakdown.weightedTimeLoad = Math.round(weightedTimeLoad * 100) / 100;
  breakdown.weightedTimeXp = Math.round(weightedTimeLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR);
  totalXP += breakdown.weightedRepsXp + breakdown.weightedTimeXp;

  breakdown.liftedVolumeKg = Math.round(totalLiftedVolumeKg * 10) / 10;
  breakdown.liftedVolumeKgXp = Math.min(
    SPORT_XP_LIFTED_VOLUME_CAP,
    Math.round(totalLiftedVolumeKg * SPORT_XP_PER_TOTAL_KG_VOLUME)
  );
  totalXP += breakdown.liftedVolumeKgXp;
  
  // 2. XP des exercices cochés — par (date, exercice) dédupliqué
  const checkedMap = workoutData.checkedExercises || {};
  const repsMapForDedup = workoutData.reps || {};
  const exerciseDedup = aggregateCheckedRepsByDateAndExerciseId(repsMapForDedup, checkedMap);
  const checkedExercises = exerciseDedup.size;
  breakdown.exercises = checkedExercises;
  breakdown.exercisesXp = checkedExercises * SPORT_XP_PER_CHECKED_EXERCISE;
  totalXP += breakdown.exercisesXp;

  const fractionneXp = collectFractionneIntervalXp(workoutData, garminData, sportOptions);
  if (fractionneXp.totalXp > 0) {
    breakdown.intervalTrainingSessions = fractionneXp.sessions;
    breakdown.intervalTrainingXp = fractionneXp.totalXp;
    const genericOverlap = Math.min(
      breakdown.exercisesXp,
      fractionneXp.sessions * SPORT_XP_PER_CHECKED_EXERCISE
    );
    breakdown.exercisesXp -= genericOverlap;
    breakdown.exercises = Math.max(0, breakdown.exercises - fractionneXp.sessions);
    totalXP += fractionneXp.totalXp - genericOverlap;
  }

  // 2bis. XP des étirements cochés (granularité item individuel).
  // Ancien triplet /10 : formule linéaire 100–300 (moyenne des critères > 0).
  // Nouveau schéma : 7 curseurs /5 pondérés → note globale /5 puis même droite 100–300 XP.
  // On résout la `stretchKey` en regardant la liste planifiée pour la date :
  //   programme par défaut (admin) + programmes custom utilisateur passés en ctx.
  {
    const stretchRatings = workoutData?.stretchPerceivedRatings || {};
    const stretchSessionEffortStars = workoutData?.stretchSessionEffortStars || {};
    const userPrograms = Array.isArray(sportOptions?.programs) ? sportOptions.programs : [];
    const checked = workoutData?.checkedStretches || {};
    const plannedCacheByDate = new Map(); // dateStr → Map<itemId,string|null>

    let stretchesCount = 0;
    let stretchesXp = 0;

    for (const [key, value] of Object.entries(checked)) {
      if (value !== true) continue;
      const parsed = parseStretchItemKey(key);
      if (!parsed) continue; // ignore les clés legacy "YYYY-MM-DD_matin" (ne donnent plus d'XP)

      const { dateStr, stretchId } = parsed;

      let mapForDate = plannedCacheByDate.get(dateStr);
      if (!mapForDate) {
        const items = buildPlannedStretchItemsForDateStr(dateStr, workoutProgram, {
          programs: userPrograms
        });
        mapForDate = new Map(items.map((it) => [String(it.id), it.stretchKey]));
        plannedCacheByDate.set(dateStr, mapForDate);
      }
      const stretchKey = mapForDate.get(String(stretchId)) || null;
      const rating = stretchKey ? stretchRatings[stretchKey] : null;

      stretchesCount += 1;
      const sess = stretchSessionEffortStars[key];
      const sns = Number(sess);
      if (Number.isFinite(sns) && sns >= 1 && sns <= 5) {
        stretchesXp += computeStretchXpFromGlobal5(sns);
      } else {
        stretchesXp += computeStretchXpFromRating(rating);
      }
    }

    breakdown.stretches = stretchesCount;
    breakdown.stretchesXp = stretchesXp;
    totalXP += stretchesXp;
  }
  
  // 3. XP des calories actives Garmin
  if (garminData?.dailyMetrics) {
    let totalCalories = 0;
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.calories?.active) {
        totalCalories += day.calories.active;
      }
    });
    breakdown.calories = totalCalories;
    breakdown.caloriesXp = Math.round(totalCalories * SPORT_XP_PER_ACTIVE_CALORIE);
    totalXP += breakdown.caloriesXp;
  }
  
  // 4. XP des pas : montre / déclaratif (via WalkingMetricsService)
  {
    const dm =
      garminData?.dailyMetrics && typeof garminData.dailyMetrics === 'object' ? garminData.dailyMetrics : {};
    const stepsMetrics = computeLifetimeStepsMetrics(dm, enduranceData?.manualDailyWalkByDate);
    breakdown.steps = stepsMetrics.totalSteps;
    breakdown.stepsXp = stepsMetrics.stepsXp;
    breakdown.stepsXpVerified = stepsMetrics.stepsXpVerified;
    breakdown.stepsXpDeclarative = stepsMetrics.stepsXpDeclarative;
    totalXP += breakdown.stepsXp;
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

  const sessionValidations = Object.entries(sessionsByType).reduce((sum, [bucketType, list]) => {
    if (!Array.isArray(list)) return sum;
    return (
      sum +
      list.reduce((innerSum, session) => {
        const activityType = session?.activityType || bucketType;
        if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(session)) {
          return innerSum;
        }
        if (Array.isArray(session?.validatedChallenges) && session.validatedChallenges.length > 0) {
          const uniqueIds = new Set(
            session.validatedChallenges
              .filter((id) => id !== null && id !== undefined)
              .map((id) => String(id))
          );
          return innerSum + uniqueIds.size;
        }
        if (!activityType) return innerSum;
        const relatedPushupSessions = activityType === 'pushups' && Array.isArray(list) ? list : undefined;
        const evaluation = evaluateChallenges(evaluationChallenges, session, activityType, {
          relatedPushupSessions,
          workoutAggregate: workoutData
        });
        return innerSum + (evaluation.validatedIds?.length || 0);
      }, 0)
    );
  }, 0);
  
  const completedChallenges = allChallenges.filter(c => c.status === 'completed').length;
  const loggedChallengeSessions = countLoggedEnduranceChallengeSessions(sessionsByType);

  const totalChallengeCompletions = Math.max(
    sessionValidations,
    completedChallenges,
    loggedChallengeSessions
  );
  
  breakdown.challenges = totalChallengeCompletions;
  breakdown.challengesXp = totalChallengeCompletions * 50;
  totalXP += breakdown.challengesXp;
  
  // 6. XP des sessions complètes : 25 XP par session avec feedback
  if (workoutData.sessionFeedbacks) {
    const sessionsWithFeedback = Object.keys(workoutData.sessionFeedbacks).length;
    breakdown.sessions = sessionsWithFeedback;
    breakdown.sessionsFeedbackXp = sessionsWithFeedback * 25;
    totalXP += breakdown.sessionsFeedbackXp;
  }

  const garminById = buildGarminRunningByIdForTrophies(garminData);
  const mergedRunning = mergeGarminCardioIntoRunningSessions(
    Array.isArray(sessionsByType.running) ? sessionsByType.running : [],
    [...buildGarminCardioById(garminData?.activities?.cardio).values()]
  );
  const runningSessions = mergedRunning.filter((r) => !shouldExcludeStoredGarminRunningSession(r));
  const runningVolume = computeRunningVolumeTotals(runningSessions, garminById, { period: 'all' });
  breakdown.runningTotalDistanceKm = runningVolume.totalKm;
  breakdown.runningSessionCount = runningVolume.sessionCount;
  const runningTrophyEval = evaluateRunningTrophies({
    runningSessions,
    garminById,
    workoutAggregate: workoutData
  });
  const rt = computeRunningTrophiesXpDetailed(runningTrophyEval.results);
  breakdown.runningTrophies = rt.xp;
  breakdown.runningTrophyTiers = rt.unlockedTierCount;
  breakdown.runningTrophiesUnlocked = rt.trophiesWithTier;
  totalXP += rt.xp;

  const jumpRopeSessions = Array.isArray(sessionsByType.jumprope) ? sessionsByType.jumprope : [];
  const gainageSessions = Array.isArray(sessionsByType.gainage) ? sessionsByType.gainage : [];
  const jrEval = evaluateSimpleEnduranceTrophies({
    activityType: 'jumprope',
    sessions: jumpRopeSessions,
    workoutAggregate: workoutData
  });
  const jrXp = computeSimpleEnduranceTrophiesXpDetailed(jrEval.results);
  breakdown.jumpRopeTrophies = jrXp.xp;
  breakdown.jumpRopeTrophyTiers = jrXp.unlockedTierCount;
  breakdown.jumpRopeTrophiesUnlocked = jrXp.trophiesWithTier;
  totalXP += jrXp.xp;

  const gaEval = evaluateSimpleEnduranceTrophies({
    activityType: 'gainage',
    sessions: gainageSessions,
    workoutAggregate: workoutData
  });
  const gaXp = computeSimpleEnduranceTrophiesXpDetailed(gaEval.results);
  breakdown.gainageTrophies = gaXp.xp;
  breakdown.gainageTrophyTiers = gaXp.unlockedTierCount;
  breakdown.gainageTrophiesUnlocked = gaXp.trophiesWithTier;
  totalXP += gaXp.xp;

  const pushupSessions = Array.isArray(sessionsByType.pushups) ? sessionsByType.pushups : [];
  const puEval = evaluatePushupTrophies({ sessions: pushupSessions, workoutAggregate: workoutData });
  const puXp = computePushupTrophiesXpDetailed(puEval.results);
  breakdown.pushupTrophies = puXp.xp;
  breakdown.pushupTrophyTiers = puXp.unlockedTierCount;
  breakdown.pushupTrophiesUnlocked = puXp.trophiesWithTier;
  totalXP += puXp.xp;

  const programsList = Array.isArray(sportOptions.programs) ? [...sportOptions.programs] : [];
  if (
    sportOptions.activeProgram?.schedule &&
    !programsList.some((p) => p && sportOptions.activeProgram && p.id === sportOptions.activeProgram.id)
  ) {
    programsList.push(sportOptions.activeProgram);
  }
  const completionCtx = {
    programs: programsList,
    getExerciseNameById: sportOptions.getExerciseNameById
  };
  breakdown.programCompletionBonusXp = computeProgramCompletionBonusXp(workoutData, completionCtx);
  totalXP += breakdown.programCompletionBonusXp;

  // Nutrition — XP pour chaque aliment enregistré dans les repas (journal)
  const nutSport = computeNutritionRegisteredFoodSportXp(sportOptions?.nutritionMeals);
  breakdown.nutritionFoodItems = nutSport.nutritionFoodItems;
  breakdown.nutritionFoodXp = nutSport.nutritionFoodXp;
  totalXP += nutSport.nutritionFoodXp;

  // Circuits — XP via paliers (target / +tour / 3×target)
  const circuitsResult = computeCircuitsXp(
    workoutData?.circuitProgress,
    workoutData?.circuitDefinitions
  );
  breakdown.circuitsXp = circuitsResult.totalXp;
  breakdown.circuitCompletedDays = circuitsResult.completedCircuitDays;
  breakdown.circuitTripleAchievedDays = circuitsResult.tripleAchievedDays;
  breakdown.circuitBonusRounds = circuitsResult.bonusRoundsTotal;
  totalXP += circuitsResult.totalXp;

  const gtgResult = computeGtgXp(enduranceData?.gtg, { workoutData, repsInWorkout: true });
  breakdown.gtgXp = gtgResult.totalXp;
  breakdown.gtgReps = gtgResult.totalReps;
  breakdown.gtgDaysWithXp = gtgResult.daysWithXp;
  breakdown.gtgDaysAt50 = gtgResult.daysAt50;
  breakdown.gtgDaysAt100 = gtgResult.daysAt100;
  totalXP += gtgResult.totalXp;

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
        breakdown: data.books?.breakdown || { ...EMPTY_BOOKS_XP_BREAKDOWN }
      },
      sport: {
        totalXP: sportXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.sport?.breakdown || {
          reps: 0,
          weightedRepsLoad: 0,
          weightedRepsXp: 0,
          exercises: 0,
          exercisesXp: 0,
          calories: 0,
          caloriesXp: 0,
          steps: 0,
          stepsXp: 0,
          stepsXpVerified: 0,
          stepsXpDeclarative: 0,
          challenges: 0,
          challengesXp: 0,
          sessions: 0,
          sessionsFeedbackXp: 0,
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
          pushupTrophiesUnlocked: 0,
          programCompletionBonusXp: 0,
          circuitsXp: 0,
          circuitCompletedDays: 0,
          circuitTripleAchievedDays: 0,
          circuitBonusRounds: 0
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
