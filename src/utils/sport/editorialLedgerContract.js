/**
 * Contrat préparé pour P2. Il ne sélectionne rien.
 * La mémoire peut baisser une priorité. Elle ne retire pas une conclusion
 * encore vraie de l'ensemble accessible.
 */

export const LEDGER_CONTRACT = Object.freeze({
  phenomenonRegistry:
    'sujet, identité canonique, phénomène, conclusion, référentiel, ancre temporelle, épisode',
  publicationLedger: 'édition, fenêtre, run, conclusions publiées',
  exposureLedger: 'consultations datées. Priorité seulement.'
});

export const MEMORY_TRANSITION = Object.freeze({
  NEW: 'new',
  CONFIRMED: 'confirmed',
  REFINED: 'refined',
  REVISED: 'revised',
  CONTRADICTED: 'contradicted',
  UNCHANGED: 'unchanged'
});

export function exposureEffect() {
  return {
    mayLowerPriority: true,
    mayRemoveFromAccessible: false
  };
}
