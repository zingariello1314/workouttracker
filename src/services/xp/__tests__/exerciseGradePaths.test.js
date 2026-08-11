import { describe, expect, it } from 'vitest';
import {
  highestSortIndexViaVoieE,
  parallelLevelFromWeightedLifetime,
  mergeGradeSortIndex,
  capSortIndexByHighTierRules,
  qualifiesViaVoieEAtTarget,
  voieEMinPctForTargetSortIndex,
  VOIE_E_MIN_PCT,
  VOIE_E_MIN_PCT_PENULTIMATE,
  VOIE_E_MIN_PCT_FINAL,
  EXERCISE_PENULTIMATE_SORT_INDEX,
  EXERCISE_FINAL_SORT_INDEX
} from '../exerciseGradePaths';
import { applyDifficultyWeightToMetrics } from '../exerciseGradeDifficulty';

describe('parallelLevelFromWeightedLifetime', () => {
  it('monte avec le volume pondéré', () => {
    expect(parallelLevelFromWeightedLifetime(0)).toBe(1);
    expect(parallelLevelFromWeightedLifetime(100)).toBeGreaterThan(1);
    expect(parallelLevelFromWeightedLifetime(5000)).toBeGreaterThan(10);
  });
});

describe('voieEMinPctForTargetSortIndex', () => {
  it('utilise 70 / 80 / 90 selon le palier', () => {
    expect(voieEMinPctForTargetSortIndex(6)).toBe(VOIE_E_MIN_PCT);
    expect(voieEMinPctForTargetSortIndex(EXERCISE_PENULTIMATE_SORT_INDEX)).toBe(
      VOIE_E_MIN_PCT_PENULTIMATE
    );
    expect(voieEMinPctForTargetSortIndex(EXERCISE_FINAL_SORT_INDEX)).toBe(VOIE_E_MIN_PCT_FINAL);
  });
});

describe('qualifiesViaVoieEAtTarget', () => {
  const vitals = { weightKg: 75, heightCm: 175, age: 30 };

  it('débloque Platine II avec 2 voies complètes', () => {
    const metrics = {
      maxDailyTotalReps: 100,
      totalReps: 6500,
      checkCount: 50
    };
    expect(qualifiesViaVoieEAtTarget(metrics, 'max_set_reps', vitals, EXERCISE_PENULTIMATE_SORT_INDEX)).toBe(
      true
    );
  });

  it('exige 80 % minimum pour Platine II via voie E seule', () => {
    const metrics = {
      maxDailyTotalReps: 21,
      totalReps: 140,
      checkCount: 7
    };
    expect(qualifiesViaVoieEAtTarget(metrics, 'max_set_reps', vitals, EXERCISE_PENULTIMATE_SORT_INDEX)).toBe(
      false
    );
  });
});

describe('highestSortIndexViaVoieE', () => {
  it('débloque si les 3 axes ≥ 70 % (grades standard)', () => {
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

describe('capSortIndexByHighTierRules', () => {
  it('cappe un pic seul qui viserait Platine II', () => {
    const capped = capSortIndexByHighTierRules(EXERCISE_PENULTIMATE_SORT_INDEX, {
      metrics: { maxDailyTotalReps: 200, totalReps: 100, checkCount: 5 },
      metric: 'max_set_reps',
      vitals: { weightKg: 75 },
      peakIdx: EXERCISE_PENULTIMATE_SORT_INDEX,
      lifeIdx: 4,
      checkIdx: 3,
      voieEIdx: -1,
      levelIdx: 1
    });
    expect(capped).toBeLessThan(EXERCISE_PENULTIMATE_SORT_INDEX);
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
  it('reste à 70 pour les paliers standard', () => {
    expect(VOIE_E_MIN_PCT).toBe(70);
  });
});
