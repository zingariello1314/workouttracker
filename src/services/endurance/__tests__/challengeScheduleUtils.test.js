import { describe, it, expect } from 'vitest';
import {
  isRecurrentChallengeOccurrenceOnDate,
  listPushupChallengesDueOnDate,
  partitionPushupChallengesForTodayPanel
} from '../challengeScheduleUtils';

describe('challengeScheduleUtils', () => {
  const baseChallenge = {
    id: 'c1',
    activityType: 'pushups',
    type: 'recurrent',
    status: 'active',
    startDate: '2026-03-01',
    goalCount: 100
  };

  it('every_n_days (interval 2) matches start and every second day', () => {
    const c = { ...baseChallenge, frequency: 'every_n_days', intervalDays: 2, startDate: '2026-03-02' };
    expect(isRecurrentChallengeOccurrenceOnDate(c, '2026-03-02')).toBe(true);
    expect(isRecurrentChallengeOccurrenceOnDate(c, '2026-03-03')).toBe(false);
    expect(isRecurrentChallengeOccurrenceOnDate(c, '2026-03-04')).toBe(true);
  });

  it('weekly_quota stays due until enough qualifying sessions in week', () => {
    const c = {
      ...baseChallenge,
      frequency: 'weekly_quota',
      weeklySessionTarget: 2,
      goalCount: 50
    };
    const workoutData = {
      enduranceData: {
        sessions: {
          pushups: [{ date: '2026-03-03', count: 50 }]
        }
      }
    };
    expect(listPushupChallengesDueOnDate([c], '2026-03-05', { workoutData })).toHaveLength(1);
    workoutData.enduranceData.sessions.pushups.push({ date: '2026-03-04', count: 50 });
    expect(listPushupChallengesDueOnDate([c], '2026-03-05', { workoutData })).toHaveLength(0);
  });

  it('daily recurrent hidden same day after lastCompletedDate', () => {
    const c = { ...baseChallenge, frequency: 'daily', lastCompletedDate: '2026-03-05' };
    expect(listPushupChallengesDueOnDate([c], '2026-03-05', {})).toHaveLength(0);
    expect(listPushupChallengesDueOnDate([c], '2026-03-06', {})).toHaveLength(1);
  });

  it('partition exposes off-schedule recurrent pushup challenges', () => {
    const c = {
      ...baseChallenge,
      frequency: 'every_n_days',
      intervalDays: 2,
      startDate: '2026-03-02'
    };
    const { due, offSchedule } = partitionPushupChallengesForTodayPanel([c], '2026-03-03', {});
    expect(due).toHaveLength(0);
    expect(offSchedule).toHaveLength(1);
    expect(offSchedule[0].id).toBe('c1');
  });
});
