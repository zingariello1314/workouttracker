import { useMemo } from 'react';
import { useSportXP } from './useSportXP';
import { masteryScoreFromBreakdown } from '../services/xp/sportMasteryScore';
import { computeSportActivityAggregates } from '../services/xp/sportActivityAggregates';
import { resolveSportGrades } from '../services/xp/sportGradeResolution';
import { withWorkSpan } from '../dev/todayDiagnostics/workSpanTracker';

export function useSportGrade(options = {}) {
  const enabled = options.enabled !== false;
  const sport = useSportXP({ enabled });
  const workoutData = sport.workoutSnapshot;

  return useMemo(() => {
    if (!enabled) {
      return {
        ...sport,
        masteryScore: 0,
        aggregates: null,
        grades: { merited: { gradeId: null }, progression: null, nextGateProgress: null }
      };
    }
    const breakdown = sport.breakdown || {};
    const masteryScore = masteryScoreFromBreakdown(breakdown);
    const aggregates = withWorkSpan('computeSportActivityAggregates', () =>
      computeSportActivityAggregates(workoutData, breakdown)
    );
    const grades = withWorkSpan('resolveSportGrades', () =>
      resolveSportGrades({
        level: sport.level,
        masteryScore,
        aggregates,
        workoutData
      })
    );

    return {
      ...sport,
      masteryScore,
      aggregates,
      grades
    };
  }, [
    enabled,
    sport.totalXP,
    sport.level,
    sport.breakdown,
    sport.progress,
    sport.isLoading,
    sport.isSportXpReady,
    sport.dailyInsights,
    workoutData
  ]);
}

export default useSportGrade;
