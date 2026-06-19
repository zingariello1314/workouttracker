import { describe, it, expect } from 'vitest';
import {
  computePeriodCompletionMetrics,
  computePushPullBalance,
  aggregateSessionFeedbacksForWindow,
  buildUnifiedSessionTimeline,
  computeDayOfWeekAdherence
} from '../recapEnrichmentMetrics';
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';

describe('recapEnrichmentMetrics', () => {
  const window = { start: '2026-06-01', end: '2026-06-05' };

  it('calcule la complétion globale en moyenne journalière (jours entraînés)', () => {
    const snapshot = {
      checkedExercises: {
        '2026-06-01_101': true,
        '2026-06-01_102': true
      },
      checkedStretches: {},
      dailyVariations: {}
    };
    const result = computePeriodCompletionMetrics(snapshot, window, { programs: [] });
    expect(result).toHaveProperty('activeTrainingDays');
    expect(result).toHaveProperty('globalPct');
    expect(typeof result.plannedDays).toBe('number');
  });

  it('agrège les feedbacks sur la fenêtre', () => {
    const fb = aggregateSessionFeedbacksForWindow(
      {
        '2026-06-02': { ressenti: 8, difficulte: 6, motivation: 7 },
        '2026-06-04': { ressenti: 6, difficulte: 8 }
      },
      window
    );
    expect(fb.count).toBe(2);
    expect(fb.ressenti).toBe(7);
    expect(fb.difficulte).toBe(7);
  });

  it('calcule push/pull à partir des parts de reps', () => {
    const balance = computePushPullBalance({
      repShareByGroup: {
        [MuscleGroups.CHEST]: 100,
        [MuscleGroups.BACK]: 50,
        [MuscleGroups.SHOULDERS]: 30,
        [MuscleGroups.BICEPS]: 20
      }
    });
    expect(balance.push).toBe(130);
    expect(balance.pull).toBe(70);
    expect(balance.pushPct).toBeGreaterThan(0);
  });

  it('construit une timeline multi-activités', () => {
    const snapshot = {
      checkedExercises: { '2026-06-03_101': true },
      enduranceData: {
        sessions: {
          running: [{ id: 1, date: '2026-06-02', distance: '5', duration: '30' }]
        }
      },
      circuitProgress: {}
    };
    const digest = {
      perActivity: {
        running: {
          sessions: [
            {
              raw: snapshot.enduranceData.sessions.running[0],
              dateYmd: '2026-06-02',
              minutes: 30,
              load: 1
            }
          ],
          totals: {}
        }
      },
      challenges: []
    };
    const { rows, totalsByType } = buildUnifiedSessionTimeline(snapshot, window, digest);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(totalsByType.running).toBe(1);
    expect(totalsByType.strength).toBe(1);
  });

  it('adhérence par jour de semaine retourne 7 buckets', () => {
    const rows = computeDayOfWeekAdherence({ checkedExercises: {}, checkedStretches: {} }, window, {
      programs: []
    });
    expect(rows).toHaveLength(7);
    expect(rows[0]).toHaveProperty('label');
  });
});
