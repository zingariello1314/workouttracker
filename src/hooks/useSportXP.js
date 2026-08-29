/**
 * Hook pour calculer l'XP Sport à partir des données workout + Garmin
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import {
  calculateSportXP,
  computeNutritionRegisteredFoodSportXp,
  countNutritionRegisteredFoodItems,
  SPORT_XP_FORMULA_REVISION
} from '../services/xp/xpCalculations';
import { computeProgramCompletionBonusXp } from '../utils/programCompletionBonus';
import { computeVolumeKgForWorkoutKey } from '../utils/exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../utils/trainingLoadUtils';
import { useAuth } from '../context/AuthContext';
import { canAccessPrivateData, isAdminUser } from '../utils/accessControl';
import { getAllMeals } from './nutritionDataCRUD';
import { getNutritionRepository } from '../services/nutrition/repository';
import { STORE_MEALS } from './nutritionDataUtils';
import { sumMergedDailyStepsTotal, manualDailyWalkChecksum } from '../utils/sport/manualDailyWalkUtils';
import { gtgChecksum } from '../services/endurance/gtgService';
import { stretchRatingChecksum } from '../utils/stretchPerceivedRatings';
import { sportXpProgressInLevel } from '../services/xp/sportLevelCurve';
import { computeSportXpDailyInsights } from '../services/xp/sportXpDailyAnalytics';

const DEFAULT_BREAKDOWN = {
  reps: 0,
  timeMinutes: 0,
  sessionMinutes: 0,
  weightedRepsLoad: 0,
  weightedRepsXp: 0,
  weightedTimeLoad: 0,
  weightedTimeXp: 0,
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

let sportXpCache = {
  signature: null,
  result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
  garminData: null,
  storageKey: null
};

/** Invalide le cache module après modification reps / coches / formule XP. */
export const invalidateSportXpCache = (storageKey = sportXpCache.storageKey) => {
  sportXpCache = {
    ...sportXpCache,
    signature: null,
    result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN }
  };
  if (storageKey) clearSportXpSessionSnapshot(storageKey);
};

function hasStableSportXpCache(storageKey) {
  return sportXpCacheMatchesScope(storageKey) && (sportXpCache.result?.totalXP ?? 0) > 0;
}

function hasWarmSportXpDisplay(storageKey) {
  return hasStableSportXpCache(storageKey) || Boolean(readSportXpSessionSnapshot(storageKey));
}

function resolveBootstrapSportXpResult(storageKey) {
  if (hasStableSportXpCache(storageKey)) return sportXpCache.result;
  const session = readSportXpSessionSnapshot(storageKey);
  if (session) return session;
  return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
}

function sportXpCacheMatchesScope(storageKey) {
  return Boolean(storageKey) && sportXpCache.storageKey === storageKey;
}

function sportXpSnapshotKey(storageKey) {
  return `momentum:sportXp:v1:${storageKey}`;
}

function readSportXpSessionSnapshot(storageKey) {
  if (typeof sessionStorage === 'undefined' || !storageKey) return null;
  try {
    const raw = sessionStorage.getItem(sportXpSnapshotKey(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.formulaRevision !== SPORT_XP_FORMULA_REVISION) return null;
    if (parsed.storageKey !== storageKey) return null;
    if (!parsed.result || typeof parsed.result.totalXP !== 'number') return null;
    return parsed.result;
  } catch {
    return null;
  }
}

function writeSportXpSessionSnapshot(storageKey, result) {
  if (typeof sessionStorage === 'undefined' || !storageKey || !result) return;
  try {
    sessionStorage.setItem(
      sportXpSnapshotKey(storageKey),
      JSON.stringify({
        formulaRevision: SPORT_XP_FORMULA_REVISION,
        storageKey,
        result,
        savedAt: Date.now()
      })
    );
  } catch {
    /* quota / mode privé */
  }
}

function clearSportXpSessionSnapshot(storageKey) {
  if (typeof sessionStorage === 'undefined' || !storageKey) return;
  try {
    sessionStorage.removeItem(sportXpSnapshotKey(storageKey));
  } catch {
    /* ignore */
  }
}

export const useSportXP = () => {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const canAccessData = canAccessPrivateData({ user: currentUser, isAuthenticated });
  const storageKey = useMemo(() => {
    if (isAdminUser(currentUser)) return 'main';
    if (currentUser?.id) return `user-${currentUser.id}`;
    return 'anonymous';
  }, [currentUser]);
  const {
    data,
    tempData,
    hasUnsavedExercises,
    hasUnsavedStretches,
    getCurrentData,
    programs,
    activeProgram,
    getExerciseNameById,
    isWorkoutDataLoading = false
  } = useWorkout();

  /** Brouillon cochages / reps : la barre XP doit suivre tout de suite (pas seulement après « Enregistrer »). */
  const workoutData = useMemo(
    () => getCurrentData(),
    [getCurrentData, data, tempData, hasUnsavedExercises, hasUnsavedStretches]
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
  const [garminData, setGarminData] = useState(() =>
    sportXpCacheMatchesScope(storageKey) ? sportXpCache.garminData || null : null
  );
  /** Repas nutrition (tous les jours) pour XP aliments enregistrés */
  const [nutritionMeals, setNutritionMeals] = useState([]);
  const [nutritionLoading, setNutritionLoading] = useState(true);
  const [garminLoading, setGarminLoading] = useState(() => true);
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  const sportXpBootstrapPending =
    authLoading || isWorkoutDataLoading || garminLoading || (canAccessData && nutritionLoading);
  const warmSportXpDisplay = hasWarmSportXpDisplay(storageKey);

  useEffect(() => {
    if (sportXpCache.storageKey && sportXpCache.storageKey !== storageKey) {
      sportXpCache = {
        signature: null,
        result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
        garminData: null,
        storageKey: null
      };
      setGarminData(null);
      setGarminLoading(true);
      cacheRef.current = { signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } };
    }
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    const loadNutrition = async () => {
      if (!canAccessData) {
        if (!cancelled) {
          setNutritionMeals([]);
          setNutritionLoading(false);
        }
        return;
      }
      setNutritionLoading(true);
      try {
        const meals = await getAllMeals();
        if (!cancelled) setNutritionMeals(Array.isArray(meals) ? meals : []);
      } catch {
        if (!cancelled) setNutritionMeals([]);
      } finally {
        if (!cancelled) setNutritionLoading(false);
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
      if (!canAccessData) {
        if (isMounted) {
          setGarminData(null);
          setGarminLoading(false);
        }
        return;
      }
      // IndexedDB Garmin pas prête : ne pas marquer « chargé » (évite un calcul XP partiel).
      if (!dbReady) {
        if (isMounted) setGarminLoading(true);
        return;
      }
      if (sportXpCacheMatchesScope(storageKey) && sportXpCache.garminData) {
        if (isMounted) {
          setGarminData(sportXpCache.garminData);
          setGarminLoading(false);
        }
        return;
      }
      try {
        const data = await loadAllData();
        if (isMounted) {
          setGarminData(data || null);
          sportXpCache = { ...sportXpCache, garminData: data || null, storageKey };
        }
      } catch (error) {
        console.error('[useSportXP] Erreur chargement Garmin:', error);
      } finally {
        if (isMounted) {
          setGarminLoading(false);
        }
      }
    };

    loadGarmin();

    return () => {
      isMounted = false;
    };
  }, [dbReady, loadAllData, canAccessData, storageKey]);

  const calculated = useMemo(() => {
    if (!canAccessData) {
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }
    // Tant que les sources ne sont pas prêtes : snapshot session (survit au F5) ou cache module, jamais un calcul partiel.
    if (sportXpBootstrapPending) {
      return resolveBootstrapSportXpResult(storageKey);
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
    const pushupSig = `${pushupList.length}|${pushupList.reduce(
      (s, r) => s + (Number(r?.count) || 0) + (Number(r?.duration) || 0),
      0
    )}`;
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
    const gtgSig = gtgChecksum(enduranceData?.gtg);

    const signature = [
      SPORT_XP_FORMULA_REVISION,
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
      manualWalkSig,
      gtgSig
    ].join('|');

    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (sportXpCache.signature === signature && sportXpCacheMatchesScope(storageKey)) {
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
    sportXpCache = { ...sportXpCache, signature, result, storageKey };
    writeSportXpSessionSnapshot(storageKey, result);
    return result;
  }, [workoutData, garminData, canAccessData, programsForCompletionXp, getExerciseNameById, activeProgram, nutritionMeals, sportXpBootstrapPending, storageKey]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    const prog = sportXpProgressInLevel(totalXP);
    return {
      level: prog.level,
      progress: {
        percent: prog.percent,
        xpNeeded: prog.xpNeeded,
        xpOnLevel: prog.xpOnLevel,
        xpForLevel: prog.xpForLevel
      }
    };
  }, [calculated.totalXP]);

  const dailyInsights = useMemo(() => {
    if (!canAccessData) {
      return { daysWithXp: 0, averageDailyXp: 0, breakdownRows: [] };
    }
    return computeSportXpDailyInsights({
      totalXP: calculated.totalXP || 0,
      breakdown: calculated.breakdown || DEFAULT_BREAKDOWN,
      workoutData,
      garminData,
      nutritionMeals
    });
  }, [
    calculated.totalXP,
    calculated.breakdown,
    workoutData,
    garminData,
    nutritionMeals,
    canAccessData
  ]);

  return {
    totalXP: calculated.totalXP || 0,
    level: levelInfo.level,
    breakdown: calculated.breakdown || DEFAULT_BREAKDOWN,
    progress: levelInfo.progress,
    dailyInsights,
    isLoading: sportXpBootstrapPending && !warmSportXpDisplay,
    isSportXpReady: !sportXpBootstrapPending
  };
};
