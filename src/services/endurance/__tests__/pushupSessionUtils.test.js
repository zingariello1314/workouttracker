import { describe, expect, it } from 'vitest';
import {
  normalizePushupSessionFields,
  resolvePushupSessionTotalReps,
  resolvePushupChallengePlannedReps
} from '../pushupSessionUtils.js';
import { isRecurrentChallengeOccurrenceOnDate } from '../challengeScheduleUtils.js';

describe('pushupSessionUtils', () => {
  it('calcule total depuis séries × reps', () => {
    expect(resolvePushupSessionTotalReps({ setCount: 10, repsPerSet: 10 })).toBe(100);
    const n = normalizePushupSessionFields({ setCount: '20', repsPerSet: '5' });
    expect(n.count).toBe(100);
  });

  it('conserve une seule dimension tant que la paire séries×reps est incomplète', () => {
    expect(resolvePushupSessionTotalReps({ setCount: '10', repsPerSet: '' })).toBe(0);
    expect(resolvePushupSessionTotalReps({ setCount: '10', repsPerSet: '5' })).toBe(50);
  });

  it('objectif défi depuis goalSetCount', () => {
    expect(resolvePushupChallengePlannedReps({ goalSetCount: 20, goalRepsPerSet: 5 })).toBe(100);
  });
});

describe('challengeScheduleUtils every_n_days', () => {
  const ch = {
    type: 'recurrent',
    activityType: 'pushups',
    frequency: 'every_n_days',
    intervalDays: 2,
    startDate: '2026-08-01'
  };

  it('alterne tous les 2 jours', () => {
    expect(isRecurrentChallengeOccurrenceOnDate(ch, '2026-08-01')).toBe(true);
    expect(isRecurrentChallengeOccurrenceOnDate(ch, '2026-08-02')).toBe(false);
    expect(isRecurrentChallengeOccurrenceOnDate(ch, '2026-08-03')).toBe(true);
  });
});
