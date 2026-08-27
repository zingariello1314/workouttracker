import { describe, it, expect } from 'vitest';
import { syncEnduranceRepsDayToWorkoutData } from '../enduranceRepsWorkoutSync';
import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../pushupEnduranceWorkoutKeys';
import { applyWorkoutRepIntegrations } from '../workoutRepIntegrations';
import { hydratePushupSessionsFromWorkoutMirrors } from '../enduranceWipeGuard';

describe('endurance pushups workout sync', () => {
  it('stocke les défis sur complementary_endurance_pushups, pas sur 104', () => {
    const base = {
      reps: { '2026-08-01_104': '20' },
      checkedExercises: { '2026-08-01_104': true },
      enduranceData: {
        sessions: {
          pushups: [{ id: '1', date: '2026-08-01', count: 100 }]
        }
      }
    };
    const next = syncEnduranceRepsDayToWorkoutData(base, base.enduranceData, '2026-08-01');
    const defiKey = `2026-08-01_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
    expect(next.reps[defiKey]).toBe('100');
    expect(next.checkedExercises[defiKey]).toBe(true);
    expect(next.reps['2026-08-01_104']).toBe('20');
    expect(next.enduranceData.repWorkoutSync['2026-08-01'].pushups).toBe(100);
  });

  it('retire le doublon strict sur variante pompes si reps === défis', () => {
    const base = {
      reps: { '2026-08-01_104': '100' },
      checkedExercises: { '2026-08-01_104': true },
      enduranceData: {
        sessions: {
          pushups: [{ id: '1', date: '2026-08-01', count: 100 }]
        },
        repWorkoutSync: { '2026-08-01': { pushups: 100 } }
      }
    };
    const next = syncEnduranceRepsDayToWorkoutData(base, base.enduranceData, '2026-08-01');
    expect(next.checkedExercises['2026-08-01_104']).toBe(false);
    expect(next.reps['2026-08-01_104']).toBeUndefined();
  });

  it('conserve les pompes programme si reps différentes du défis', () => {
    const base = {
      reps: { '2026-08-01_104': '40' },
      checkedExercises: { '2026-08-01_104': true },
      enduranceData: {
        sessions: {
          pushups: [{ id: '1', date: '2026-08-01', count: 100 }]
        }
      }
    };
    const next = syncEnduranceRepsDayToWorkoutData(base, base.enduranceData, '2026-08-01');
    expect(next.reps['2026-08-01_104']).toBe('40');
    expect(next.checkedExercises['2026-08-01_104']).toBe(true);
  });

  it('applyWorkoutRepIntegrations migre les données existantes', () => {
    let data = {
      reps: { '2026-03-01_104': '30' },
      checkedExercises: { '2026-03-01_104': true },
      enduranceData: {
        sessions: {
          pushups: [{ id: '1', date: '2026-03-01', count: 30 }]
        }
      }
    };
    data = applyWorkoutRepIntegrations(data);
    const defiKey = `2026-03-01_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
    expect(data.reps[defiKey]).toBe('30');
    expect(data.checkedExercises['2026-03-01_104']).toBe(false);
  });

  it('hydrate + sync ne double pas les coches défis pompes', () => {
    const key = `2026-08-12_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
    const base = {
      reps: { [key]: '100' },
      checkedExercises: { [key]: true },
      enduranceData: {
        sessions: { pushups: [], running: [{ id: 'r' }] },
        challenges: [{ id: 'c' }]
      }
    };
    const hydrated = hydratePushupSessionsFromWorkoutMirrors(base);
    const next = applyWorkoutRepIntegrations(hydrated);
    expect(next.reps[key]).toBe('100');
    expect(next.checkedExercises[key]).toBe(true);
  });
});
