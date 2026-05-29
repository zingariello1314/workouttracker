import { describe, it, expect } from 'vitest';
import { computeVolumeResponseIndex, applyDynamicVolumeToDeformers } from './quizVolumeResponse';

describe('quizVolumeResponse', () => {
  it('monte l’index avec bonne régularité et alignement', () => {
    const r = computeVolumeResponseIndex(
      {
        maturity: 'rich',
        regularityScore: 0.92,
        activeDays28: 10,
        sessionLoadAlignment28: { avgScore0to100: 90, sessionDaysScored: 4 },
        adjustments: { volumeMulDelta: 0.05 }
      },
      { recoveryScore: 75 }
    );
    expect(r.index).toBeGreaterThan(1);
  });

  it('abaisse les plafonds séance si index bas', () => {
    const base = { maxExercisesPerSession: 8, maxEffectiveSetsPerSession: 25, volumeMul: 1 };
    const next = applyDynamicVolumeToDeformers(base, { index: 0.85, label: 'test' });
    expect(next.maxExercisesPerSession).toBeLessThan(8);
    expect(next.maxEffectiveSetsPerSession).toBeLessThan(25);
  });
});
