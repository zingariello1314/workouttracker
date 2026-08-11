import { describe, it, expect } from 'vitest';
import { syncEnduranceRepsDayToWorkoutData, sumEnduranceRepSessionsOnDay } from '../enduranceRepsWorkoutSync';
import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../pushupEnduranceWorkoutKeys';
import { syncGtgDayToWorkoutData } from '../gtgWorkoutSync';
import { applyWorkoutRepIntegrations } from '../workoutRepIntegrations';
import { computeGtgXpForDayPlan } from '../../xp/gtgXpService';
import { isChallengeScheduledOnDate } from '../challengeScheduleUtils';

describe('workoutRepIntegrations', () => {
  it('sync endurance pushups vers clé défis dédiée', () => {
    const base = {
      reps: { '2026-03-01_104': '20' },
      checkedExercises: {},
      enduranceData: {
        sessions: {
          pushups: [{ id: '1', date: '2026-03-01', count: 30 }]
        }
      }
    };
    const sum = sumEnduranceRepSessionsOnDay(base.enduranceData, '2026-03-01', 'pushups');
    expect(sum).toBe(30);
    const next = syncEnduranceRepsDayToWorkoutData(base, base.enduranceData, '2026-03-01');
    const defiKey = `2026-03-01_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
    expect(next.reps[defiKey]).toBe('30');
    expect(next.checkedExercises[defiKey]).toBe(true);
    expect(next.reps['2026-03-01_104']).toBe('20');
    expect(next.enduranceData.repWorkoutSync['2026-03-01'].pushups).toBe(30);
  });

  it('GTG + endurance sur même clé s’additionnent via apply', () => {
    const gtgData = {
      config: {
        selectedIds: ['pushups'],
        scheduleFrom: '08:00',
        scheduleTo: '20:00',
        intervalHours: 2
      },
      days: {
        '2026-03-02': {
          exercises: {
            pushups: { slots: { '0': { done: true } } }
          }
        }
      },
      workoutSync: {}
    };
    let data = {
      reps: {},
      checkedExercises: {},
      enduranceData: {
        gtg: gtgData,
        sessions: { pushups: [{ id: 'p1', date: '2026-03-02', count: 10 }] }
      }
    };
    data = applyWorkoutRepIntegrations(data);
    const gtgReps = parseInt(data.reps['2026-03-02_104'], 10);
    const defiKey = `2026-03-02_${ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID}`;
    const defiReps = parseInt(data.reps[defiKey], 10);
    expect(gtgReps).toBeGreaterThan(0);
    expect(defiReps).toBe(10);
  });

  it('GTG XP sans double comptage reps (bonus seulement si repsInWorkout)', () => {
    const dayPlan = {
      plannedMiniSets: 4,
      doneReps: 20,
      reached50: true,
      reached100: false
    };
    const withReps = computeGtgXpForDayPlan(dayPlan, { repsInWorkout: true });
    expect(withReps.repsXp).toBe(0);
    expect(withReps.bonus50).toBe(12);
    expect(withReps.xp).toBe(12);
    const legacy = computeGtgXpForDayPlan(dayPlan, { repsInWorkout: false });
    expect(legacy.repsXp).toBeGreaterThan(0);
  });

  it('défi récurrent hebdo — jour de semaine', () => {
    const challenge = {
      type: 'recurrent',
      activityType: 'pushups',
      status: 'active',
      frequency: 'weekly',
      dayOfWeek: 3
    };
    expect(isChallengeScheduledOnDate(challenge, '2026-03-04')).toBe(true);
    expect(isChallengeScheduledOnDate(challenge, '2026-03-05')).toBe(false);
  });
});

describe('gtgWorkoutSync', () => {
  it('syncGtgDay remplace la part GTG sans écraser le manuel', () => {
    const gtg = {
      config: { selectedIds: ['pushups'], scheduleFrom: '08:00', scheduleTo: '20:00', intervalHours: 3 },
      days: {
        '2026-03-03': { exercises: { pushups: { slots: { '0': { done: true }, '1': { done: true } } } } }
      },
      workoutSync: { '2026-03-03': { pushups: 0 } }
    };
    const base = { reps: { '2026-03-03_104': '5' }, checkedExercises: {}, enduranceData: { gtg } };
    const next = syncGtgDayToWorkoutData(base, gtg, '2026-03-03', {});
    expect(parseInt(next.reps['2026-03-03_104'], 10)).toBeGreaterThan(5);
  });
});
