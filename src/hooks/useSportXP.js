/**
 * Hook pour calculer l'XP Sport à partir des données workout + Garmin
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import { calculateSportXP } from '../services/xp/xpCalculations';

const DEFAULT_BREAKDOWN = {
  reps: 0,
  weightedRepsLoad: 0,
  weightedRepsXp: 0,
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

let sportXpCache = {
  signature: null,
  result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
  garminData: null
};

export const useSportXP = () => {
  const { data: workoutData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [garminData, setGarminData] = useState(sportXpCache.garminData || null);
  const [isLoading, setIsLoading] = useState(!sportXpCache.garminData);
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  useEffect(() => {
    let isMounted = true;

    const loadGarmin = async () => {
      if (!dbReady) return;
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
  }, [dbReady, loadAllData]);

  const calculated = useMemo(() => {
    if (!workoutData) {
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }
    const totalReps = Object.values(workoutData.reps || {}).reduce((sum, reps) => {
      return sum + (parseInt(reps) || 0);
    }, 0);
    const coeffs = Object.values(workoutData.exerciseIntensityCoeffs || {});
    const coeffsChecksum = coeffs.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const weights = Object.values(workoutData.exerciseWeights || {});
    const weightsChecksum = weights.reduce((sum, value) => sum + (Number(String(value).replace(',', '.')) || 0), 0);
    const checkedExercises = Object.values(workoutData.checkedExercises || {}).filter(v => v === true).length;
    const sessionsWithFeedback = workoutData.sessionFeedbacks ? Object.keys(workoutData.sessionFeedbacks).length : 0;

    let totalCalories = 0;
    let totalSteps = 0;
    if (garminData?.dailyMetrics) {
      Object.values(garminData.dailyMetrics).forEach(day => {
        if (day.calories?.active) totalCalories += day.calories.active;
        if (day.steps) totalSteps += day.steps;
      });
    }

    const enduranceData = workoutData?.enduranceData || {};
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

    const signature = [
      totalReps,
      coeffs.length,
      Math.round(coeffsChecksum * 1000),
      weights.length,
      Math.round(weightsChecksum * 1000),
      checkedExercises,
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
      garminLapTally
    ].join('|');

    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (sportXpCache.signature === signature) {
      cacheRef.current = { signature, result: sportXpCache.result };
      return sportXpCache.result;
    }

    const result = calculateSportXP(workoutData, garminData, enduranceData);
    cacheRef.current = { signature, result };
    sportXpCache = { ...sportXpCache, signature, result };
    return result;
  }, [workoutData, garminData]);

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
