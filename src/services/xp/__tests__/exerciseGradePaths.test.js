import { describe, expect, it } from 'vitest';
import {
  highestSortIndexViaVoieE,
  parallelLevelFromWeightedLifetime,
  mergeGradeSortIndex,
  VOIE_E_MIN_PCT
} from '../exerciseGradePaths';
import { applyDifficultyWeightToMetrics } from '../exerciseGradeDifficulty';

describe('parallelLevelFromWeightedLifetime', () => {
  it('monte avec le volume pondéré', () => {
    expect(parallelLevelFromWeightedLifetime(0)).toBe(1);
    expect(parallelLevelFromWeightedLifetime(100)).toBeGreaterThan(1);
    expect(parallelLevelFromWeightedLifetime(5000)).toBeGreaterThan(10);
  });
});

describe('highestSortIndexViaVoieE', () => {
  it('débloque si les 3 axes ≥ 70 %', () => {
    const metrics = {
      maxDailyTotalReps: 21,
      totalReps: 140,
      checkCount: 7
    };
    const idx = highestSortIndexViaVoieE(metrics, 'max_set_reps', {
      weightKg: 75,
      heightCm: 175,
      age: 30
    });
    expect(idx).toBeGreaterThanOrEqual(3);
  });
});

describe('mergeGradeSortIndex', () => {
  it('prend le max des voies dont voie E', () => {
    const s = mergeGradeSortIndex({
      peakIdx: 2,
      lifeIdx: 2,
      checkIdx: 2,
      averageIdx: 2,
      voieEIdx: 5,
      levelIdx: 1
    });
    expect(s).toBe(5);
  });
});

describe('applyDifficultyWeightToMetrics', () => {
  it('valorise plus les tractions que les pompes', () => {
    const m = { maxDailyTotalReps: 10, totalReps: 100, checkCount: 5 };
    const push = applyDifficultyWeightToMetrics(m, 'max_set_reps', { repWeight: 1 });
    const pull = applyDifficultyWeightToMetrics(m, 'max_set_reps', { repWeight: 1.75 });
    expect(pull.weightedLife).toBeGreaterThan(push.weightedLife);
  });
});

describe('VOIE_E_MIN_PCT', () => {
  it('reste à 70', () => {
    expect(VOIE_E_MIN_PCT).toBe(70);
  });
});
