import { describe, it, expect } from 'vitest';
import { buildQuizCompletionRecap } from './buildQuizCompletionRecap.js';
import { placementBandForScore } from './quizMetricTiers';
import { sanitizeLastCompletionRecap } from './schema';

describe('quizCompletionRecap', () => {
  it('produit un score et un bandeau', () => {
    const recap = buildQuizCompletionRecap({
      answers: {
        experienceLevel: 'intermediate_3_12m',
        goalPhysique: 'muscular_defined',
        existingProgramInApp: { hasProgram: 'no' }
      },
      snapshot: {}
    });
    expect(recap.placement.score0to100).toBeGreaterThan(0);
    expect(recap.placement.bandLabel).toBeTruthy();
    expect(recap.quizSummary.length).toBeGreaterThan(0);
  });

  it('placementBandForScore couvre les paliers', () => {
    expect(placementBandForScore(15).id).toBe('discovery');
    expect(placementBandForScore(75).id).toBe('confirmed');
  });

  it('sanitizeLastCompletionRecap garde un résumé léger', () => {
    const recap = buildQuizCompletionRecap({
      answers: { experienceLevel: 'beginner_0_3m', goalPhysique: 'balanced_functional' },
      snapshot: {}
    });
    const stored = sanitizeLastCompletionRecap({
      completedAt: '2026-05-27T12:00:00.000Z',
      placement: recap.placement,
      hasActivityLogs: false
    });
    expect(stored?.placement?.score0to100).toBe(recap.placement.score0to100);
    expect(stored?.placement?.bandLabel).toBeTruthy();
  });
});
