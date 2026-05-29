import { describe, it, expect } from 'vitest';
import {
  computeGlobalLoadState,
  deformersFromGlobalLoad,
  refineGlobalLoadState,
  computeLiveSessionAdjustment,
  LOAD_ENGINE_VERSION
} from './quizGlobalLoadEngine';

describe('quizGlobalLoadEngine v5', () => {
  it('produit un scalaire unique dans l’enveloppe archétype', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'recovery_sensitive',
      constraints: { recoveryScore: 40, forceRecoveryMode: true },
      trainingEvidence: { maturity: 'rich', regularityScore: 0.9 }
    });
    expect(state.version).toBe(LOAD_ENGINE_VERSION);
    expect(state.globalLoadFactor).toBeGreaterThanOrEqual(0.66);
    expect(state.globalLoadFactor).toBeLessThanOrEqual(0.86);
  });

  it('évite l’oscillation : régularité haute + surcharge nerveuse → facteur net stable', () => {
    const base = computeGlobalLoadState({
      archetypeId: 'hybrid_street_home_strict',
      constraints: { recoveryScore: 70 },
      trainingEvidence: { maturity: 'rich', regularityScore: 0.92 }
    });
    const refined = refineGlobalLoadState(
      { ...base, archetypeId: 'hybrid_street_home_strict', progressionCycleFactor: 1 },
      { loadRatio: 1.25, overloaded: true }
    );
    expect(refined.globalLoadFactor).toBeLessThanOrEqual(base.globalLoadFactor + 0.02);
    expect(refined.globalLoadFactor).toBeLessThan(1.05);
  });

  it('deformersFromGlobalLoad aligne volumeMul sur globalLoadFactor', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'busy_minimum',
      constraints: { recoveryScore: 65 },
      trainingEvidence: null
    });
    const d = deformersFromGlobalLoad({ maxExercisesPerSession: 7, volumeMul: 1.2 }, state);
    expect(d.volumeMul).toBe(state.globalLoadFactor);
    expect(d.maxExercisesPerSession).toBeLessThanOrEqual(8);
  });

  it('live respecte la bande shadow (peut monter à 1.1)', () => {
    const live = computeLiveSessionAdjustment(0.95, {
      missedFactor: 0.85,
      dailyFactor: 0.82,
      liveBand: { min: 0.82, max: 1.1, allowUplift: true },
      dailyUpliftFactor: 1.05
    });
    expect(live.liveSessionMul).toBeGreaterThanOrEqual(0.82);
    expect(live.liveSessionMul).toBeLessThanOrEqual(1.1);
  });

  it('dérivés non identiques au global', () => {
    const state = computeGlobalLoadState({
      archetypeId: 'street_intermediate',
      constraints: { recoveryScore: 55 },
      trainingEvidence: { maturity: 'rich', regularityScore: 0.85 }
    });
    expect(state.distributionFactor).toBeDefined();
    expect(state.sessionLimitsFactor).toBeLessThanOrEqual(state.globalLoadFactor + 0.01);
  });
});
