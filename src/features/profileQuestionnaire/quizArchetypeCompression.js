/**
 * v4 — Enveloppe archétype uniquement (intégrée dans quizGlobalLoadEngine).
 * Ne modifie plus volumeMul en cascade.
 */

import { ARCHETYPE_ENVELOPE } from './quizGlobalLoadEngine';

export { ARCHETYPE_ENVELOPE };

/** @deprecated v4 — compression dans global load engine */
export function applyChargeCompression(archetypeId, deformers) {
  return {
    deformers: { ...deformers, chargeCompressionArchetype: archetypeId },
    compression: ARCHETYPE_ENVELOPE[archetypeId]?.center ?? 1,
    deltas: []
  };
}

/** @deprecated */
export function compressionWhyLine() {
  return null;
}
