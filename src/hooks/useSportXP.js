/**
 * Hook pour calculer l'XP Sport à partir des données workout + Garmin
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import { calculateSportXP } from '../services/xp/xpCalculations';

const DEFAULT_BREAKDOWN = {
  reps: 0,
  exercises: 0,
  calories: 0,
  steps: 0,
  challenges: 0,
  sessions: 0
};

export const useSportXP = () => {
  const { data: workoutData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef({ signature: null, result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN } });

  useEffect(() => {
    let isMounted = true;

    const loadGarmin = async () => {
      if (!dbReady) return;
      try {
        const data = await loadAllData();
        if (isMounted) {
          setGarminData(data || null);
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

    const signature = [
      totalReps,
      checkedExercises,
      sessionsWithFeedback,
      totalCalories,
      totalSteps,
      validatedChallengesCount,
      enduranceData.challenges?.length || 0
    ].join('|');

    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }

    const result = calculateSportXP(workoutData, garminData, enduranceData);
    cacheRef.current = { signature, result };
    return result;
  }, [workoutData, garminData]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpForCurrentLevel = (level - 1) * 1000;
    const xpForNextLevel = level * 1000;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const percent = (xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100;

    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded
      }
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
