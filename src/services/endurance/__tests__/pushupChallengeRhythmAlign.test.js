import { describe, it, expect } from 'vitest';
import {
  realignPushupChallengeRhythmFromDate,
  mergePushupChallengeRhythmUpdate,
  resolveSchedulePatternFromChallenge
} from '../pushupChallengeRhythmAlign';
import { isRecurrentChallengeOccurrenceOnDate } from '../challengeScheduleUtils';

describe('pushupChallengeRhythmAlign', () => {
  it('every_n_days: anchor today makes tomorrow off (interval 2)', () => {
    const c = {
      frequency: 'every_n_days',
      intervalDays: 2,
      startDate: '2026-03-02',
      schedulePattern: 'every_other_day'
    };
    const next = realignPushupChallengeRhythmFromDate(c, '2026-03-05');
    expect(next.startDate).toBe('2026-03-05');
    expect(isRecurrentChallengeOccurrenceOnDate(next, '2026-03-05')).toBe(true);
    expect(isRecurrentChallengeOccurrenceOnDate(next, '2026-03-06')).toBe(false);
    expect(isRecurrentChallengeOccurrenceOnDate(next, '2026-03-07')).toBe(true);
  });

  it('weekdays: shifts pattern so anchor weekday is included', () => {
    const c = {
      frequency: 'weekly',
      scheduleWeekdays: [1, 3, 5],
      startDate: '2026-03-01'
    };
    const next = realignPushupChallengeRhythmFromDate(c, '2026-03-03');
    expect(next.scheduleWeekdays.sort()).toEqual([2, 4, 6]);
    expect(isRecurrentChallengeOccurrenceOnDate(next, '2026-03-03')).toBe(true);
  });

  it('mergePushupChallengeRhythmUpdate changes interval and realigns', () => {
    const c = {
      frequency: 'every_n_days',
      intervalDays: 2,
      startDate: '2026-03-01',
      schedulePattern: 'every_other_day'
    };
    const next = mergePushupChallengeRhythmUpdate(
      c,
      { schedulePattern: 'every_n_days', intervalDays: 3 },
      { realignFromYmd: '2026-03-10' }
    );
    expect(next.intervalDays).toBe(3);
    expect(next.startDate).toBe('2026-03-10');
    expect(resolveSchedulePatternFromChallenge(next)).toBe('every_n_days');
  });
});
