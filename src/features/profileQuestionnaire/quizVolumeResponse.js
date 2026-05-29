/**
 * @deprecated v4 — Les signaux volume passent par `quizGlobalLoadEngine`.
 * Conservé pour compat tests : délègue au moteur global.
 */

import { computeGlobalLoadState, deformersFromGlobalLoad } from './quizGlobalLoadEngine';

/**
 * @returns {{ index: number, factors: Record<string, number>, label: string }}
 */
export function computeVolumeResponseIndex(evidence, constraints = {}) {
  const state = computeGlobalLoadState({
    archetypeId: 'hybrid_street_home_dense',
    constraints,
    trainingEvidence: evidence
  });
  const factors = {};
  (state.signals || []).forEach((s) => {
    factors[s.key] = s.delta;
  });
  return {
    index: state.globalLoadFactor,
    factors,
    label: state.summaryFr
  };
}

/**
 * @deprecated Utiliser `deformersFromGlobalLoad`.
 */
export function applyDynamicVolumeToDeformers(deformers, response) {
  const f = response?.index ?? 1;
  if (!deformers || Math.abs(f - 1) < 0.02) return { ...deformers };
  return deformersFromGlobalLoad(deformers, {
    globalLoadFactor: f,
    effectiveVolumeFactor: f,
    trace: []
  });
}
