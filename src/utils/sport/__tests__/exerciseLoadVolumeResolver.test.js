import { describe, expect, it } from 'vitest';
import {
  getExerciseVolumeFromLog,
  computeVolumeKgRepsFromStructuredSets,
  computeVolumeKgForWorkoutKey,
  aggregateLiftVolumeKgByDate
} from '../../exerciseLoadVolume';
import { syncExerciseSetLogWeightsFromLegacy } from '../../exerciseSetLogUtils';

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
    expect(r.volumeKgReps).toBeGreaterThan(0);
    expect(r.sets.some((s) => s.weight === 10)).toBe(true);
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

  it('F7.0j — sets structurés weight:null + exerciseWeights → repli legacy (pas 0 kg)', () => {
    const workout = {
      checkedExercises: { '2026-11-01_203': true },
      reps: { '2026-11-01_203': '40' },
      exerciseWeights: { '2026-11-01_203': '8' },
      exerciseWeightPerArm: { '2026-11-01_203': true },
      exerciseSetLogs: {
        '2026-11-01_203': {
          schemaVersion: 2,
          sets: [
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' }
          ]
        }
      }
    };
    const r = getExerciseVolumeFromLog(workout, '2026-11-01_203');
    expect(r.source).toBe('legacy');
    expect(r.volumeKgReps).toBeGreaterThan(0);
    expect(computeVolumeKgForWorkoutKey('2026-11-01_203', workout)).toBe(r.volumeKgReps);
  });

  it('F7.0j — vrai bodyweight (pas de charge legacy) reste volume 0', () => {
    const workout = {
      checkedExercises: { '2026-11-01_501': true },
      reps: { '2026-11-01_501': '30' },
      exerciseSetLogs: {
        '2026-11-01_501': {
          schemaVersion: 2,
          sets: [
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' }
          ]
        }
      }
    };
    const r = getExerciseVolumeFromLog(workout, '2026-11-01_501');
    expect(r.source).toBe('structured');
    expect(r.volumeKgReps).toBe(0);
  });

  it('F7.0j — syncExerciseSetLogWeightsFromLegacy hydrate les sets', () => {
    const workout = {
      checkedExercises: { '2026-11-01_203': true },
      reps: { '2026-11-01_203': '40' },
      exerciseWeights: { '2026-11-01_203': '8' },
      exerciseWeightPerArm: { '2026-11-01_203': true },
      exerciseSetLogs: {
        '2026-11-01_203': {
          schemaVersion: 2,
          sets: [
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' }
          ]
        }
      }
    };
    const synced = syncExerciseSetLogWeightsFromLegacy(workout, '2026-11-01_203');
    expect(synced.exerciseSetLogs['2026-11-01_203'].sets.every((s) => s.weight === 8)).toBe(true);
    expect(synced.exerciseSetLogs['2026-11-01_203'].sets.every((s) => s.weightMode === 'perHand')).toBe(true);
    const r = getExerciseVolumeFromLog(synced, '2026-11-01_203');
    expect(r.source).toBe('structured');
    expect(r.volumeKgReps).toBeGreaterThan(0);
  });

  it('F7.0j — cohérence agrégat jour : legacy poids visibles dans UI comptés', () => {
    const workout = {
      checkedExercises: {
        '2026-11-01_bw': true,
        '2026-11-01_db': true
      },
      reps: {
        '2026-11-01_bw': '30',
        '2026-11-01_db': '40'
      },
      exerciseWeights: {
        '2026-11-01_db': '8'
      },
      exerciseSetLogs: {
        '2026-11-01_bw': {
          sets: [
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' }
          ]
        },
        '2026-11-01_db': {
          sets: [
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' },
            { reps: 10, weight: null, weightMode: 'bodyweight' }
          ]
        }
      }
    };
    const map = aggregateLiftVolumeKgByDate(workout);
    expect(map.get('2026-11-01')).toBeGreaterThan(0);
    expect(map.get('2026-11-01')).toBe(getExerciseVolumeFromLog(workout, '2026-11-01_db').volumeKgReps);
  });
});
