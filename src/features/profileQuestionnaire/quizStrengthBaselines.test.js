import { describe, it, expect } from 'vitest';
import {
  deriveStrengthImbalanceFromBaselines,
  applyImbalanceToMuscleTargets,
  minPullExposuresFromBaselines
} from './quizStrengthBaselines';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';

describe('quizStrengthBaselines', () => {
  it('détecte tirage faible vs poussée forte (profil doc)', () => {
    const imb = deriveStrengthImbalanceFromBaselines(incoherenceDocProfile6d);
    expect(imb.weak).toBe('pull');
    expect(imb.summaryFr).toMatch(/traction limitée/i);
  });

  it('boost dos quand tirage faible', () => {
    const base = { chest: 12, back: 10, shoulders: 8, quads: 10, hamstringsGlutes: 10 };
    const out = applyImbalanceToMuscleTargets(base, incoherenceDocProfile6d);
    expect(out.back).toBeGreaterThan(base.back);
  });

  it('min expositions traction pour repères faibles', () => {
    expect(minPullExposuresFromBaselines(incoherenceDocProfile6d)).toBeGreaterThanOrEqual(2);
  });
});
