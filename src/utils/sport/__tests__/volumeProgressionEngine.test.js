import { describe, expect, it } from 'vitest';
import {
  interpretExerciseProgression,
  summarizeExerciseSession,
  computeProgressionInsights
} from '../volumeProgressionEngine';

describe('volumeProgressionEngine', () => {
  const key1 = '2026-05-01_42';
  const key2 = '2026-05-08_42';

  it('détecte orientation force', () => {
    const prev = {
      exerciseId: '42',
      dateYmd: '2026-05-01',
      totalReps: 40,
      setCount: 4,
      avgWeight: 12,
      volumeKgReps: 960,
      source: 'structured'
    };
    const curr = {
      exerciseId: '42',
      dateYmd: '2026-05-08',
      totalReps: 36,
      setCount: 4,
      avgWeight: 18,
      volumeKgReps: 1296,
      source: 'structured'
    };
    const insight = interpretExerciseProgression(prev, curr);
    expect(insight.progressionType).toBe('strength');
    expect(insight.confidence).toBeGreaterThan(0.8);
  });

  it('résume une séance structurée', () => {
    const data = {
      checkedExercises: { [key1]: true },
      exerciseSetLogs: {
        [key1]: {
          sets: [
            { reps: 10, weight: 12, weightMode: 'perHand' },
            { reps: 10, weight: 12, weightMode: 'perHand' }
          ],
          schemaVersion: 1
        }
      },
      reps: { [key1]: '20' }
    };
    const summary = summarizeExerciseSession(data, key1);
    expect(summary.totalReps).toBe(20);
    expect(summary.source).toBe('structured');
  });

  it('produit des insights pour exos avec 2+ séances', () => {
    const data = {
      checkedExercises: { [key1]: true, [key2]: true },
      reps: { [key1]: '40', [key2]: '36' },
      exerciseWeights: { [key1]: '12', [key2]: '18' },
      exerciseWeightPerArm: { [key1]: true, [key2]: true }
    };
    const insights = computeProgressionInsights(data, null);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights[0].exerciseId).toBe('42');
  });
});
