/**
 * Hook pour calculer l'XP Sport à partir des données workout + Garmin
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import {
  calculateSportXP,
  computeNutritionRegisteredFoodSportXp,
  countNutritionRegisteredFoodItems
} from '../services/xp/xpCalculations';
import { computeProgramCompletionBonusXp } from '../utils/programCompletionBonus';
import { computeVolumeKgForWorkoutKey } from '../utils/exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../utils/trainingLoadUtils';
import { useAuth } from '../context/AuthContext';
import { canAccessPrivateData } from '../utils/accessControl';
import { getAllMeals } from './nutritionDataCRUD';
import { getNutritionRepository } from '../services/nutrition/repository';
import { STORE_MEALS } from './nutritionDataUtils';
import { sumMergedDailyStepsTotal, manualDailyWalkChecksum } from '../utils/sport/manualDailyWalkUtils';
import { stretchRatingChecksum } from '../utils/stretchPerceivedRatings';

const DEFAULT_BREAKDOWN = {
  reps: 0,
  weightedRepsLoad: 0,
  weightedRepsXp: 0,
  exercises: 0,
  exercisesXp: 0,
  stretches: 0,
  stretchesXp: 0,
  calories: 0,
  caloriesXp: 0,
  steps: 0,
  stepsXp: 0,
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
  nutritionFoodItems: 0,
  nutritionFoodXp: 0,
  intervalTrainingSessions: 0,
  intervalTrainingXp: 0
};

let sportXpCache = {
  signature: null,
  result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
  garminData: null
};

/** Invalide le cache module après modification reps / coches. */
export const invalidateSportXpCache = () => {
  sportXpCache = {
    ...sportXpCache,
    signature: null,
    result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN }
  };
};

export const useSportXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const canAccessData = canAccessPrivateData({ user: currentUser, isAuthenticated });
  const {
    data,
<<<<<<< HEAD
    tempData,
    hasUnsavedExercises,
    hasUnsavedStretches,
    getCurrentData,
    programs,
    activeProgram,
    getExerciseNameById
  } = useWorkout();

  /** Brouillon cochages / reps : la barre XP doit suivre tout de suite (pas seulement après « Enregistrer »). */
  const workoutData = useMemo(
    () => getCurrentData(),
    [getCurrentData, data, tempData, hasUnsavedExercises, hasUnsavedStretches]
=======
    programs,
    activeProgram,
    getExerciseNameById,
    getCurrentData,
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData
  } = useWorkout();

  const workoutData = useMemo(
    () => getCurrentData(),
    [data, getCurrentData, hasUnsavedExercises, hasUnsavedStretches, tempData]
>>>>>>> 9e0d966 (avancements au niveau de la remise a niveau de la sauvegarde des quetes de livre set ajouts d etrucs dans livres)
  );

  const programsForCompletionXp = useMemo(() => {
    const arr = Array.isArray(programs) ? [...programs] : [];
    if (
      activeProgram?.schedule &&
      activeProgram.id != null &&
      !arr.some((p) => p && p.id === activeProgram.id)
    ) {
      arr.push(activeProgram);
    }
    return arr;
  }, [programs, activeProgram]);
  const { dbReady, loadAllData } = useGarminData();
  const [garminData, setGarminData] = useState(sportXpCache.garminData || null);
  /** Repas nutrition (tous les jours) pour XP aliments enregistrés */
  const [nutritionMeals, setNutritionMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(!sportXpCache.garminData);
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  useEffect(() => {
    let cancelled = false;
    const loadNutrition = async () => {
      if (!canAccessData) {
        setNutritionMeals([]);
        return;
      }
      try {
        const meals = await getAllMeals();
        if (!cancelled) setNutritionMeals(Array.isArray(meals) ? meals : []);
      } catch {
        if (!cancelled) setNutritionMeals([]);
      }
    };
    loadNutrition();

    let unsubMeals = () => {};
    (async () => {
      try {
        const repo = await getNutritionRepository();
        if (repo && typeof repo.subscribe === 'function') {
          unsubMeals = repo.subscribe(STORE_MEALS, '*', () => {
            loadNutrition();
          });
        }
      } catch {
        /* IndexedDB / repo indisponible : XP nutrition reste 0 jusqu’au prochain rendu manuel */
      }
    })();

    return () => {
      cancelled = true;
      unsubMeals();
    };
  }, [canAccessData]);

  useEffect(() => {
    let isMounted = true;

    const loadGarmin = async () => {
      if (!canAccessData || !dbReady) {
        if (isMounted) {
          setGarminData(null);
          setIsLoading(false);
        }
        return;
      }
      if (sportXpCache.garminData) {
        if (isMounted) {
          setGarminData(sportXpCache.garminData);
          setIsLoading(false);
        }
        return;
      }
      try {
        const data = await loadAllData();
        if (isMounted) {
          setGarminData(data || null);
          sportXpCache.garminData = data || null;
        }
      } catch (error) {
        console.error('[useSportXP] Erreur chargement Garmin:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGarmin();

    return () => {
      isMounted = false;
    };
  }, [dbReady, loadAllData, canAccessData]);

  const calculated = useMemo(() => {
    if (!canAccessData) {
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }
    if (!workoutData) {
      const nutOnly = computeNutritionRegisteredFoodSportXp(nutritionMeals);
      return {
        totalXP: nutOnly.nutritionFoodXp,
        breakdown: {
          ...DEFAULT_BREAKDOWN,
          nutritionFoodItems: nutOnly.nutritionFoodItems,
          nutritionFoodXp: nutOnly.nutritionFoodXp
        }
      };
    }
    let totalReps = 0;
    collectDedupedCheckedVolumeKeys(workoutData).forEach((key) => {
      totalReps += parseInt(workoutData.reps?.[key], 10) || 0;
    });
    const coeffs = Object.values(workoutData.exerciseIntensityCoeffs || {});
    const coeffsChecksum = coeffs.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const weights = Object.values(workoutData.exerciseWeights || {});
    const weightsChecksum = weights.reduce((sum, value) => sum + (Number(String(value).replace(',', '.')) || 0), 0);
    let checkedExercises = 0;
    let checkedKeysChecksum = 0;
    for (const [k, v] of Object.entries(workoutData.checkedExercises || {})) {
      if (v !== true) continue;
      checkedExercises += 1;
      for (let i = 0; i < k.length; i++) {
        checkedKeysChecksum = (checkedKeysChecksum * 31 + k.charCodeAt(i)) | 0;
      }
    }
    const sessionsWithFeedback = workoutData.sessionFeedbacks ? Object.keys(workoutData.sessionFeedbacks).length : 0;

    // Étirements : on intègre le nombre cochés + un checksum des notes perçues dans la
    // signature du cache. Sans ça, cocher un étirement laissait le résultat précédent
    // en cache (les autres clés restant identiques) → l'XP n'apparaissait pas.
    const checkedStretches = workoutData.checkedStretches || {};
    let checkedStretchCount = 0;
    let stretchKeysChecksum = 0;
    for (const [k, v] of Object.entries(checkedStretches)) {
      if (v !== true) continue;
      checkedStretchCount += 1;
      // Petit hash positionnel sans dépendance pour distinguer rapidement deux ensembles
      // de clés cochées ; la valeur exacte importe peu, seules les variations comptent.
      for (let i = 0; i < k.length; i++) {
        stretchKeysChecksum = (stretchKeysChecksum * 31 + k.charCodeAt(i)) | 0;
      }
    }
    const stretchRatings = workoutData.stretchPerceivedRatings || {};
    let stretchRatingsChecksum = 0;
    for (const [k, r] of Object.entries(stretchRatings)) {
      stretchRatingsChecksum =
        (stretchRatingsChecksum * 17 + stretchRatingChecksum(r) + k.length) | 0;
    }

    const sessionEffortStars = workoutData.exerciseSessionEffortStars || {};
    let sessionStarsChecksum = 0;
    for (const [k, sv] of Object.entries(sessionEffortStars)) {
      const n = Number(sv);
      if (!Number.isFinite(n)) continue;
      sessionStarsChecksum =
        (sessionStarsChecksum * 41 + Math.round(n * 10) + k.length) | 0;
    }

    const sessionPleasureStars = workoutData.exerciseSessionPleasureStars || {};
    let sessionPleasureChecksum = 0;
    for (const [k, sv] of Object.entries(sessionPleasureStars)) {
      const n = Number(sv);
      if (!Number.isFinite(n)) continue;
      sessionPleasureChecksum =
        (sessionPleasureChecksum * 47 + Math.round(n * 10) + k.length) | 0;
    }

    const stretchSessionEffortStars = workoutData.stretchSessionEffortStars || {};
    let stretchSessionStarsChecksum = 0;
    for (const [k, sv] of Object.entries(stretchSessionEffortStars)) {
      const n = Number(sv);
      if (!Number.isFinite(n)) continue;
      stretchSessionStarsChecksum =
        (stretchSessionStarsChecksum * 43 + Math.round(n * 10) + k.length) | 0;
    }

    let totalCalories = 0;
    if (garminData?.dailyMetrics) {
      Object.values(garminData.dailyMetrics).forEach(day => {
        if (day.calories?.active) totalCalories += day.calories.active;
      });
    }

    const enduranceData = workoutData?.enduranceData || {};
    const totalSteps = sumMergedDailyStepsTotal(garminData?.dailyMetrics, enduranceData?.manualDailyWalkByDate);
    const sessionsByType = enduranceData.sessions || {};
    const validatedChallengesCount = Object.values(sessionsByType).reduce((sum, list) => {
      if (!Array.isArray(list)) return sum;
      return sum + list.reduce((innerSum, session) => {
        if (!Array.isArray(session?.validatedChallenges)) return innerSum;
        const uniqueIds = new Set(
          session.validatedChallenges
            .filter((id) => id !== null && id !== undefined)
            .map((id) => String(id))
        );
        return innerSum + uniqueIds.size;
      }, 0);
    }, 0);

    const runningList = Array.isArray(sessionsByType.running) ? sessionsByType.running : [];
    const runningSig = `${runningList.length}|${runningList.reduce((s, r) => s + (Number(r?.distance) || 0), 0)}`;
    const jumpRopeList = Array.isArray(sessionsByType.jumprope) ? sessionsByType.jumprope : [];
    const jumpRopeSig = `${jumpRopeList.length}|${jumpRopeList.reduce((s, r) => s + (Number(r?.jumps) || 0), 0)}`;
    const gainageList = Array.isArray(sessionsByType.gainage) ? sessionsByType.gainage : [];
    const gainageSig = `${gainageList.length}|${gainageList.reduce((s, r) => s + (Number(r?.count) || 0), 0)}`;
    const pushupList = Array.isArray(sessionsByType.pushups) ? sessionsByType.pushups : [];
    const pushupSig = `${pushupList.length}|${pushupList.reduce((s, r) => s + (Number(r?.count) || 0), 0)}`;
    const cardioLen = Array.isArray(garminData?.activities?.cardio) ? garminData.activities.cardio.length : 0;
    let garminLapTally = 0;
    if (Array.isArray(garminData?.activities?.cardio)) {
      garminData.activities.cardio.forEach((act) => {
        garminLapTally += Array.isArray(act?.running?.laps) ? act.running.laps.length : 0;
      });
    }

    const programCompletionBonusXp = computeProgramCompletionBonusXp(workoutData, {
      programs: programsForCompletionXp,
      getExerciseNameById
    });

    let liftedVolumeChecksum = 0;
    collectDedupedCheckedVolumeKeys(workoutData).forEach((k) => {
      liftedVolumeChecksum += computeVolumeKgForWorkoutKey(k, workoutData);
    });

    // Circuits : signature = total tours par jour + nb de définitions actives.
    // Force la recompute lorsqu'on incrémente un tour ou qu'on ajoute / modifie un circuit.
    const circuitProgress = workoutData.circuitProgress || {};
    const circuitDefinitions = workoutData.circuitDefinitions || {};
    let circuitProgressChecksum = 0;
    let circuitProgressEntries = 0;
    for (const [d, byCircuit] of Object.entries(circuitProgress)) {
      if (!byCircuit || typeof byCircuit !== 'object') continue;
      for (const [cid, val] of Object.entries(byCircuit)) {
        circuitProgressEntries += 1;
        const r = Math.max(0, Math.round(Number(val?.roundsCompleted) || 0));
        circuitProgressChecksum =
          (circuitProgressChecksum * 31 + r + d.length + cid.length) | 0;
      }
    }
    let circuitDefChecksum = 0;
    for (const [cid, def] of Object.entries(circuitDefinitions)) {
      const t = Math.max(1, Math.round(Number(def?.targetRounds) || 1));
      const items = Array.isArray(def?.items) ? def.items.length : 0;
      circuitDefChecksum =
        (circuitDefChecksum * 17 + t * 7 + items + cid.length) | 0;
    }

    const nutritionFoodTally = countNutritionRegisteredFoodItems(nutritionMeals);
    const nutritionMealsLen = Array.isArray(nutritionMeals) ? nutritionMeals.length : 0;
    const manualWalkSig = manualDailyWalkChecksum(enduranceData?.manualDailyWalkByDate);

    const signature = [
      totalReps,
      coeffs.length,
      Math.round(coeffsChecksum * 1000),
      weights.length,
      Math.round(weightsChecksum * 1000),
      checkedExercises,
      checkedKeysChecksum,
      sessionsWithFeedback,
      totalCalories,
      totalSteps,
      validatedChallengesCount,
      enduranceData.challenges?.length || 0,
      runningSig,
      jumpRopeSig,
      gainageSig,
      pushupSig,
      cardioLen,
      garminLapTally,
      programCompletionBonusXp,
      Math.round(liftedVolumeChecksum * 10),
      checkedStretchCount,
      stretchKeysChecksum,
      stretchRatingsChecksum,
      sessionStarsChecksum,
      sessionPleasureChecksum,
      stretchSessionStarsChecksum,
      circuitProgressEntries,
      circuitProgressChecksum,
      Object.keys(circuitDefinitions).length,
      circuitDefChecksum,
      nutritionMealsLen,
      nutritionFoodTally,
      manualWalkSig
    ].join('|');

    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (sportXpCache.signature === signature) {
      cacheRef.current = { signature, result: sportXpCache.result };
      return sportXpCache.result;
    }

    const result = calculateSportXP(workoutData, garminData, enduranceData, {
      programs: programsForCompletionXp,
      activeProgram,
      getExerciseNameById,
      nutritionMeals
    });
    cacheRef.current = { signature, result };
    sportXpCache = { ...sportXpCache, signature, result };
    return result;
  }, [workoutData, garminData, canAccessData, programsForCompletionXp, getExerciseNameById, activeProgram, nutritionMeals]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    /** Palier Sport : 1000 XP par niveau (aligné avec categoryLevels / barre globale). */
    const xpPerLevel = 1000;
    const level = Math.floor(totalXP / xpPerLevel) + 1;
    const xpAtLevelStart = (level - 1) * xpPerLevel;
    const xpOnLevel = totalXP - xpAtLevelStart;
    const xpForLevel = xpPerLevel;
    const xpNeeded = Math.max(0, xpAtLevelStart + xpPerLevel - totalXP);
    const percent = (xpOnLevel / xpForLevel) * 100;

    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded,
        xpOnLevel,
        xpForLevel,
      },
    };
  }, [calculated.totalXP]);

  return {
    totalXP: calculated.totalXP || 0,
    level: levelInfo.level,
    breakdown: calculated.breakdown || DEFAULT_BREAKDOWN,
    progress: levelInfo.progress,
    isLoading
  };
};
