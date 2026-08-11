import { describe, expect, it } from 'vitest';
import {
  masteryScoreFromBreakdown,
  MASTERY_WEIGHT_WEIGHTED_REPS,
  MASTERY_WEIGHT_EXERCISES,
  MASTERY_WEIGHT_CALORIES,
  MASTERY_WEIGHT_STEPS
} from '../sportMasteryScore';

describe('masteryScoreFromBreakdown', () => {
  it('pondère reps et exos à ×1,2, cal/pas à ×0,5', () => {
    const score = masteryScoreFromBreakdown({
      weightedRepsXp: 1000,
      exercisesXp: 500,
      caloriesXp: 2000,
      stepsXp: 800
    });
    expect(score).toBe(
      Math.round(
        1000 * MASTERY_WEIGHT_WEIGHTED_REPS +
          500 * MASTERY_WEIGHT_EXERCISES +
          2000 * MASTERY_WEIGHT_CALORIES +
          800 * MASTERY_WEIGHT_STEPS
      )
    );
  });
});
