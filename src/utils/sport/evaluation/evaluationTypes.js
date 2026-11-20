/**
 * Contrats des jeux A/B/C. Les baselines historiques B0/B1 ne sont pas
 * réécrites ici : ce module pose les types pour la reconstitution.
 */

export const EVAL_GAME = Object.freeze({
  A_ACCURACY: 'A',
  B_DISCOVERY_QUALITY: 'B',
  C_COLLECTIVE: 'C'
});

export function emptyGameAReport() {
  return {
    game: EVAL_GAME.A_ACCURACY,
    factualConflicts: 0,
    identityMerges: 0,
    inventedCauses: 0,
    unpairedDensities: 0,
    missingClaims: 0,
    fusedSourcesRepublished: 0,
    cases: []
  };
}

export function emptyGameBReport() {
  return {
    game: EVAL_GAME.B_DISCOVERY_QUALITY,
    referenceHits: 0,
    superficialOnly: 0,
    incorrectAttractive: 0,
    blindComparisonAvailable: false,
    cases: []
  };
}

export function emptyGameCReport() {
  return {
    game: EVAL_GAME.C_COLLECTIVE,
    exactDuplicatesAccessible: 0,
    fusedSourcesAccessible: 0,
    admissiblePreserved: true,
    horizonConfusion: 0,
    cases: []
  };
}
