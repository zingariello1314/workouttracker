import { describe, it, expect } from 'vitest';
import { computeGlobalLoadState } from './quizGlobalLoadEngine';
import { runShadowValidation, detectLoadContradictions } from './quizShadowValidation';

describe('quizShadowValidation', () => {
  it('canaux structurel et historique peuvent diverger', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'hybrid_street_home_strict',
      constraints: { recoveryScore: 40 },
      trainingEvidence: {
        maturity: 'rich',
        regularityScore: 0.9,
        sessionLoadAlignment28: { avgScore0to100: 90, sessionDaysScored: 4 }
      }
    });
    expect(state.structuralLoadFactor).toBeLessThan(state.historyLoadFactor);
    expect(state.distributionFactor).not.toBe(state.sessionLimitsFactor);
  });

  it('shadow élargit la bande live si marge détectée', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'hybrid_street_home_dense',
      constraints: { recoveryScore: 78 },
      trainingEvidence: {
        maturity: 'rich',
        regularityScore: 0.5,
        volumeKgReps28: 12000,
        activeDays28: 10
      }
    });
    const shadow = runShadowValidation({
      loadState: state,
      constraints: { recoveryScore: 78 },
      trainingEvidence: {
        maturity: 'rich',
        regularityScore: 0.5,
        volumeKgReps28: 12000,
        activeDays28: 10
      }
    });
    expect(shadow.liveBand.max).toBeGreaterThanOrEqual(1.05);
  });

  it('détecte contradiction récupération vs régularité', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'recovery_sensitive',
      constraints: { recoveryScore: 42 },
      trainingEvidence: { maturity: 'rich', regularityScore: 0.88 }
    });
    const c = detectLoadContradictions(state, { recoveryScore: 42 }, { regularityScore: 0.88 });
    expect(c.some((x) => x.id === 'recovery_vs_regularity')).toBe(true);
  });
});
