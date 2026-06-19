import { describe, expect, it } from 'vitest';
import {
  challengeProgressPct,
  findExerciseSessions,
  magnitudeWord,
  pctChange,
  isVerticalPullExercise
} from '../recapInsightHelpers';
import { collectCheckedExerciseRepHistory } from '../recapAdaptiveInsights';

describe('recapInsightHelpers', () => {
  it('magnitudeWord gradue les variations', () => {
    expect(magnitudeWord(35)).toBe('net');
    expect(magnitudeWord(8)).toBe('modéré');
    expect(magnitudeWord(2)).toBe('discret');
  });

  it('pctChange calcule correctement', () => {
    expect(pctChange(110, 100)).toBeCloseTo(10);
  });

  it('findExerciseSessions résout id string et number', () => {
    const map = new Map([['101', [{ reps: 20, date: '2026-06-01' }]]]);
    expect(findExerciseSessions(map, 101)).toHaveLength(1);
    expect(findExerciseSessions(map, '101')).toHaveLength(1);
  });

  it('challengeProgressPct pour pushups_cumul', () => {
    const snapshot = {
      enduranceData: {
        sessions: {
          pushups: [
            { date: '2026-06-01', count: 60 },
            { date: '2026-06-02', count: 50 }
          ]
        }
      }
    };
    const pct = challengeProgressPct(
      {
        type: 'pushups_cumul',
        status: 'active',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        goalTotalCount: 200
      },
      snapshot
    );
    expect(pct).toBe(55);
  });

  it('challengeProgressPct course via runningFactors', () => {
    const pct = challengeProgressPct(
      {
        type: 'ponctuel',
        activityType: 'running',
        status: 'active',
        goalDistance: 10
      },
      {},
      {
        running: {
          sessions: [{ runningFactors: { distanceKm: 7.5 }, raw: { distance: '7,5' } }]
        }
      }
    );
    expect(pct).toBe(75);
  });

  it('isVerticalPullExercise reconnaît id et nom', () => {
    expect(isVerticalPullExercise(101, () => 'Tractions pronation')).toBe(true);
    expect(isVerticalPullExercise(999, () => 'Rowing barre')).toBe(false);
    expect(isVerticalPullExercise(999, () => 'Tractions australiennes')).toBe(true);
  });
});
