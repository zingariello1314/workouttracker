import { describe, it, expect } from 'vitest';
import { computeExerciseGradeProgressBars } from '../exerciseGradeProgress';
import { EXERCISE_GRADE_LADDER } from '../exerciseGradeLadder';

describe('computeExerciseGradeProgressBars', () => {
  it('affiche des jauges en Platine III (dernier palier échelle)', () => {
    const maxIdx = EXERCISE_GRADE_LADDER.length - 1;
    const metrics = {
      maxDailyTotalReps: 48,
      maxSetReps: 12,
      totalReps: 800,
      checkCount: 40
    };
    const def = { metric: 'max_set_reps' };
    const vitals = { weightKg: 75 };
    const gradeExtra = {
      parallelLevel: 11,
      parallelLevelProgress: { pct: 42, nextAt: 3400, currentFloor: 2600 },
      weightedLifetimeValue: 2900
    };

    const progress = computeExerciseGradeProgressBars(
      metrics,
      def,
      vitals,
      maxIdx,
      gradeExtra
    );

    expect(progress.maxed).toBe(false);
    expect(progress.bars.length).toBeGreaterThan(0);
    expect(progress.bars.some((b) => b.labelFallback === 'Rep eq. (niveau)')).toBe(true);
    expect(progress.voieE).not.toBeNull();
    expect(progress.ladderMaxed).toBe(true);
  });

  it('affiche la jauge niveau sur un grade intermédiaire', () => {
    const metrics = {
      maxDailyTotalReps: 20,
      totalReps: 200,
      checkCount: 8
    };
    const def = { metric: 'max_set_reps' };
    const vitals = { weightKg: 75 };
    const gradeExtra = {
      parallelLevel: 5,
      parallelLevelProgress: { pct: 55, nextAt: 520, currentFloor: 320 },
      weightedLifetimeValue: 410
    };
    const progress = computeExerciseGradeProgressBars(metrics, def, vitals, 4, gradeExtra);
    expect(progress.bars.some((b) => b.labelFallback === 'Rep eq. (niveau)')).toBe(true);
  });
});
