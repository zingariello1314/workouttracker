import { useMemo } from 'react';
import { useSportXP } from './useSportXP';
import { useWorkout } from '../context/WorkoutContext';
import { masteryScoreFromBreakdown } from '../services/xp/sportMasteryScore';
import { computeSportActivityAggregates } from '../services/xp/sportActivityAggregates';
import { resolveSportGrades } from '../services/xp/sportGradeResolution';

export function useSportGrade() {
  const sport = useSportXP();
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();

  return useMemo(() => {
    const breakdown = sport.breakdown || {};
    const masteryScore = masteryScoreFromBreakdown(breakdown);
    const aggregates = computeSportActivityAggregates(workoutData, breakdown);
    const grades = resolveSportGrades({
      level: sport.level,
      masteryScore,
      aggregates,
      workoutData
    });

    return {
      ...sport,
      masteryScore,
      aggregates,
      grades
    };
  }, [
    sport.totalXP,
    sport.level,
    sport.breakdown,
    sport.progress,
    sport.isLoading,
    sport.isSportXpReady,
    workoutData
  ]);
}

export default useSportGrade;
