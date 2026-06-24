import { describe, expect, it } from 'vitest';
import {
  interpretExerciseProgression,
  summarizeExerciseSession,
  computeProgressionInsights,
  classifyRepScheme,
  isActionableProgressionInsight
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

  it('détecte passage 4×12 → 5×5 (schéma force)', () => {
    const prev = {
      exerciseId: '42',
      dateYmd: '2026-05-01',
      totalReps: 48,
      setCount: 4,
      avgWeight: 10,
      volumeKgReps: 480,
      source: 'structured'
    };
    const curr = {
      exerciseId: '42',
      dateYmd: '2026-05-08',
      totalReps: 25,
      setCount: 5,
      avgWeight: 12,
      volumeKgReps: 300,
      source: 'structured'
    };
    const insight = interpretExerciseProgression(prev, curr);
    expect(insight.progressionType).toBe('strength');
    expect(insight.explanation).toMatch(/force|5×/i);
  });

  it('classifie schéma hypertrophie vs force', () => {
    expect(classifyRepScheme(4, 48)).toBe('hypertrophy');
    expect(classifyRepScheme(5, 25)).toBe('strength');
  });

  it('exclut les progressions « stables » du panneau Repères', () => {
    expect(
      isActionableProgressionInsight({
        progressionType: 'stall',
        confidence: 0.9,
        explanation: 'Performances stables sur les deux dernières séances comparables'
      })
    ).toBe(false);
    expect(
      isActionableProgressionInsight({
        progressionType: 'strength',
        confidence: 0.85,
        explanation: 'Schéma orienté force',
        metrics: { setCountDelta: 1, volumeDeltaPct: 12 }
      })
    ).toBe(true);
  });
});
