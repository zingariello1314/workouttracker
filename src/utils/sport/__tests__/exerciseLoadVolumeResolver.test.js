import { describe, expect, it } from 'vitest';
import {
  getExerciseVolumeFromLog,
  computeVolumeKgRepsFromStructuredSets,
  computeVolumeKgForWorkoutKey
} from '../../exerciseLoadVolume';

describe('getExerciseVolumeFromLog', () => {
  const baseWorkout = {
    checkedExercises: {
      '2026-06-01_99': true
    },
    reps: {
      '2026-06-01_99': 40
    },
    exerciseWeights: {
      '2026-06-01_99': '10'
    }
  };

  it('fallback legacy quand pas de exerciseSetLogs', () => {
    const r = getExerciseVolumeFromLog(baseWorkout, '2026-06-01_99');
    expect(r.source).toBe('legacy');
    expect(r.sets).toEqual([]);
    expect(r.volumeKgReps).toBeGreaterThan(0);
    expect(computeVolumeKgForWorkoutKey('2026-06-01_99', baseWorkout)).toBe(r.volumeKgReps);
  });

  it('exercice non coché → volume 0', () => {
    expect(getExerciseVolumeFromLog(baseWorkout, '2026-06-01_100').volumeKgReps).toBe(0);
  });

  it('log structuré exerciseSetLogs', () => {
    const workout = {
      ...baseWorkout,
      exerciseSetLogs: {
        '2026-06-01_99': {
          schemaVersion: 1,
          sets: [
            { reps: 10, weight: 12, weightMode: 'perHand' },
            { reps: 10, weight: 12, weightMode: 'perHand' }
          ]
        }
      }
    };
    const r = getExerciseVolumeFromLog(workout, '2026-06-01_99');
    expect(r.source).toBe('structured');
    expect(r.sets).toHaveLength(2);
    expect(r.volumeKgReps).toBe(computeVolumeKgRepsFromStructuredSets(r.sets, { id: 99, name: 'Exercice', materiel: '', series: '' }));
    expect(r.volumeKgReps).toBeGreaterThan(0);
  });
});
