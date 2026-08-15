import { describe, it, expect } from 'vitest';
import {
  applyShortfallFromLastSets,
  inferFatigueFallbackDistribution,
  inferSetRepsDistribution,
  medianRepProfile,
  medianWeightProfile,
  resolveSetWeightsForLog,
  scaleWeightProfileToAverage,
  SET_INFERENCE_METHOD,
  WEIGHT_INFERENCE_MODE
} from '../exerciseSetInference';
import { buildSetLogFromPrescription } from '../../exerciseSetLogUtils';

const traction4x5 = {
  id: 101,
  name: 'Tractions pronation',
  series: '4×5',
  meta: { setCount: 4, repsMin: 5, repsMax: 5, volumeMode: 'reps', repsScope: 'total' }
};

describe('exerciseSetInference', () => {
  it('applyShortfallFromLastSets retire depuis la fin', () => {
    expect(applyShortfallFromLastSets([5, 5, 4, 3], 16)).toEqual([5, 5, 4, 2]);
    expect(applyShortfallFromLastSets([5, 5, 4, 3], 17)).toEqual([5, 5, 4, 3]);
  });

  it('fatigue fallback A : 4×5 prévu, 17 reps → 5/5/5/2', () => {
    expect(inferFatigueFallbackDistribution(5, 4, 17)).toEqual([5, 5, 5, 2]);
    expect(inferFatigueFallbackDistribution(5, 4, 17).reduce((s, r) => s + r, 0)).toBe(17);
  });

  it('total = plan exact → prescription 5/5/5/5', () => {
    const { setReps, inference } = inferSetRepsDistribution({
      exercise: traction4x5,
      totalReps: 20
    });
    expect(setReps).toEqual([5, 5, 5, 5]);
    expect(inference.method).toBe(SET_INFERENCE_METHOD.PRESCRIPTION);
    expect(inference.confidence).toBeGreaterThan(0.9);
  });

  it('total < plan sans historique → fatigue_fallback', () => {
    const { setReps, inference } = inferSetRepsDistribution({
      exercise: traction4x5,
      totalReps: 17,
      workoutData: { checkedExercises: {}, exerciseSetLogs: {} },
      storageKey: '2026-08-14_101'
    });
    expect(setReps.reduce((s, r) => s + r, 0)).toBe(17);
    expect(inference.method).toBe(SET_INFERENCE_METHOD.FATIGUE_FALLBACK);
    expect(setReps).toEqual([5, 5, 5, 2]);
  });

  it('total < plan avec historique habituel → profil C', () => {
    const workoutData = {
      checkedExercises: {
        '2026-08-01_101': true,
        '2026-08-08_101': true
      },
      exerciseSetLogs: {
        '2026-08-01_101': {
          sets: [
            { reps: 5, weight: null },
            { reps: 5, weight: null },
            { reps: 4, weight: null },
            { reps: 3, weight: null }
          ],
          schemaVersion: 2
        },
        '2026-08-08_101': {
          sets: [
            { reps: 5, weight: null },
            { reps: 5, weight: null },
            { reps: 4, weight: null },
            { reps: 3, weight: null }
          ],
          schemaVersion: 2
        }
      }
    };

    const { setReps, inference } = inferSetRepsDistribution({
      exercise: traction4x5,
      totalReps: 16,
      workoutData,
      storageKey: '2026-08-14_101'
    });

    expect(setReps).toEqual([5, 5, 4, 2]);
    expect(inference.method).toBe(SET_INFERENCE_METHOD.HABIT);
    expect(inference.confidence).toBeGreaterThan(0.7);
  });

  it('medianRepProfile calcule la médiane par série', () => {
    expect(
      medianRepProfile([
        [5, 5, 4, 3],
        [5, 5, 5, 3],
        [5, 5, 4, 4]
      ])
    ).toEqual([5, 5, 4, 3]);
  });

  it('poids unique + historique pyramidal → habit', () => {
    const workoutData = {
      checkedExercises: {
        '2026-08-01_201': true,
        '2026-08-08_201': true
      },
      exerciseSetLogs: {
        '2026-08-01_201': {
          sets: [
            { reps: 8, weight: 80 },
            { reps: 8, weight: 80 },
            { reps: 8, weight: 75 },
            { reps: 8, weight: 70 }
          ],
          schemaVersion: 2
        },
        '2026-08-08_201': {
          sets: [
            { reps: 8, weight: 80 },
            { reps: 8, weight: 80 },
            { reps: 8, weight: 75 },
            { reps: 8, weight: 70 }
          ],
          schemaVersion: 2
        }
      },
      exerciseWeights: {
        '2026-08-14_201': '76.25'
      }
    };

    const { weights, weightInference } = resolveSetWeightsForLog(workoutData, '2026-08-14_201', 4);
    expect(weightInference.mode).toBe(WEIGHT_INFERENCE_MODE.HABIT);
    expect(weights).toEqual([80, 80, 75, 70]);
    expect(weightInference.confidence).toBeGreaterThan(0.7);
  });

  it('medianWeightProfile et scaleWeightProfileToAverage', () => {
    const median = medianWeightProfile([
      [80, 80, 75, 70],
      [82, 80, 74, 68]
    ]);
    expect(median).toEqual([81, 80, 74.5, 69]);
    expect(scaleWeightProfileToAverage([80, 80, 75, 70], 76.25)).toEqual([80, 80, 75, 70]);
  });
});

describe('buildSetLogFromPrescription + inference', () => {
  it('4×5 · 20 reps inclut inference prescription', () => {
    const log = buildSetLogFromPrescription(traction4x5, { totalReps: 20 });
    expect(log.sets.map((s) => s.reps)).toEqual([5, 5, 5, 5]);
    expect(log.inference.method).toBe(SET_INFERENCE_METHOD.PRESCRIPTION);
    expect(log.schemaVersion).toBe(2);
  });
});
