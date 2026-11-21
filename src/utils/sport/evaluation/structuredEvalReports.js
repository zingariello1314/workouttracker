/**
 * Rapports structurés des jeux A/B/C — exportables, sans faux aveugle humain.
 */

import { analysisEditionKey } from '../analysisEdition';
import { runGameAAccuracy } from './gameAAccuracy';
import { runGameBDiscoveryQuality, referenceCasesForGameB } from './gameBDiscoveryQuality';
import { runGameCCollective } from './gameCCollective';
import { EVAL_GAME } from './evaluationTypes';

function caseRow({
  id,
  game,
  referenceData = null,
  expected = null,
  obtained = null,
  status = 'unknown',
  justification = null,
  delta = null,
  edition = null,
  humanBlind = false,
  referenceKind = 'synthetic'
}) {
  return {
    id,
    game,
    referenceData,
    expected,
    obtained,
    status,
    justification,
    delta,
    edition: edition || analysisEditionKey(),
    humanBlindPerformed: humanBlind === true,
    referenceKind
  };
}

export function structureGameAReport(raw, { edition = analysisEditionKey() } = {}) {
  const cases = (raw?.cases || []).map((row, index) =>
    caseRow({
      id: row.id || row.issue || `A-${index + 1}`,
      game: EVAL_GAME.A_ACCURACY,
      referenceData: { issue: row.issue || null },
      expected: 'pass_constraint',
      obtained: row,
      status: 'fail',
      justification: row.issue || 'constraint_violated',
      delta: row,
      edition,
      referenceKind: 'synthetic'
    })
  );
  if (!cases.length && raw?.pass) {
    cases.push(
      caseRow({
        id: 'A-all-clear',
        game: EVAL_GAME.A_ACCURACY,
        expected: { pass: true },
        obtained: { pass: true },
        status: 'pass',
        justification: 'aucune violation détectée sur le paquet fourni',
        edition,
        referenceKind: 'synthetic'
      })
    );
  }
  return {
    schema: 'momentum.evalGameReport.v1',
    game: EVAL_GAME.A_ACCURACY,
    executedAt: new Date().toISOString(),
    edition,
    pass: raw?.pass === true,
    counters: {
      missingClaims: raw?.missingClaims || 0,
      fusedSourcesRepublished: raw?.fusedSourcesRepublished || 0,
      unpairedDensities: raw?.unpairedDensities || 0,
      inventedCauses: raw?.inventedCauses || 0,
      factualConflicts: raw?.factualConflicts || 0,
      identityMerges: raw?.identityMerges || 0
    },
    cases,
    humanBlindComparison: { performed: false, reason: 'not_requested' }
  };
}

export function structureGameBReport(raw, { edition = analysisEditionKey() } = {}) {
  const refs = referenceCasesForGameB();
  const cases = (raw?.cases || []).map((row) => {
    const ref = refs.find((item) => item.id === row.id) || null;
    const status =
      row.result === 'hit' || row.result === 'hit_abstain'
        ? 'pass'
        : row.result === 'not_applicable'
          ? 'not_applicable'
          : row.result === 'shallow' || row.result === 'scored' || row.result === 'partial'
            ? 'partial'
            : 'fail';
    return caseRow({
      id: row.id || 'B-case',
      game: EVAL_GAME.B_DISCOVERY_QUALITY,
      referenceData:
        row.referenceData ||
        ref?.input ||
        ref?.days ||
        ref?.events ||
        (row.kind || row.title
          ? { kind: row.kind || null, title: row.title || null, body: row.body || null }
          : null),
      expected: row.expected
        ? row.expected
        : ref
          ? {
              prefer: ref.prefer || null,
              rejectAttractive: ref.rejectAttractive || null,
              mode: ref.mode || 'volume'
            }
          : null,
      obtained: row,
      status,
      justification:
        row.result === 'hit'
          ? row.referenceKind === 'synthetic'
            ? 'référence synthétique satisfaite'
            : 'référence satisfaite'
          : row.result === 'hit_abstain'
            ? 'abstention correcte (référence négative satisfaite)'
            : row.result === 'not_applicable'
              ? row.reason || 'référence non applicable aux données du snapshot'
          : row.result === 'shallow'
            ? 'signal partiel — pas une découverte aboutie'
            : row.result === 'scored'
              ? 'dimensions de qualité scorées (informatif, hors PASS/FAIL binaire)'
            : row.result === 'sleep_causality_overclaim'
              ? row.reason ||
                `causalité sommeil suspecte${row.incriminatedSpan ? ` (« ${row.incriminatedSpan} »)` : ''}`
              : 'écart à la référence',
      delta: status === 'pass' || status === 'not_applicable' || status === 'partial' ? null : row,
      edition,
      humanBlind: false,
      referenceKind: row.referenceKind || ref?.kind || 'synthetic'
    });
  });
  return {
    schema: 'momentum.evalGameReport.v1',
    game: EVAL_GAME.B_DISCOVERY_QUALITY,
    executedAt: new Date().toISOString(),
    edition,
    pass: raw?.pass === true,
    counters: {
      referenceHits: raw?.referenceHits || 0,
      superficialOnly: raw?.superficialOnly || 0,
      incorrectAttractive: raw?.incorrectAttractive || 0
    },
    cases,
    referenceKindsPresent: {
      synthetic: true,
      external: false,
      humanBlind: raw?.blindComparisonAvailable === true
    },
    humanBlindComparison: {
      performed: raw?.blindComparisonAvailable === true,
      reason: raw?.blindComparisonAvailable
        ? 'blind_packets_provided'
        : 'aucune comparaison humaine à l’aveugle n’a été effectuée'
    }
  };
}

export function structureGameCReport(raw, { edition = analysisEditionKey() } = {}) {
  const cases = (raw?.cases || []).map((row, index) =>
    caseRow({
      id: `C-${index + 1}`,
      game: EVAL_GAME.C_COLLECTIVE,
      referenceData: row,
      expected: { admissiblePreserved: true, exactDuplicatesAccessible: 0, fusedSourcesAccessible: 0 },
      obtained: row,
      status: raw?.pass ? 'pass' : 'fail',
      justification: 'qualité collective du paquet accessible',
      delta: raw?.pass
        ? null
        : {
            exactDuplicatesAccessible: raw?.exactDuplicatesAccessible,
            fusedSourcesAccessible: raw?.fusedSourcesAccessible,
            admissiblePreserved: raw?.admissiblePreserved
          },
      edition,
      referenceKind: 'synthetic'
    })
  );
  return {
    schema: 'momentum.evalGameReport.v1',
    game: EVAL_GAME.C_COLLECTIVE,
    executedAt: new Date().toISOString(),
    edition,
    pass: raw?.pass === true,
    counters: {
      exactDuplicatesAccessible: raw?.exactDuplicatesAccessible || 0,
      fusedSourcesAccessible: raw?.fusedSourcesAccessible || 0,
      admissiblePreserved: raw?.admissiblePreserved !== false,
      horizonConfusion: raw?.horizonConfusion || 0
    },
    cases,
    humanBlindComparison: { performed: false, reason: 'not_applicable' }
  };
}

export function runStructuredEvalSuite({ insights = null, measure = null, p6 = null, blindPackets = null } = {}) {
  const edition = analysisEditionKey();
  const rawA = runGameAAccuracy({ insights, measure });
  const rawB = runGameBDiscoveryQuality({ insights, blindPackets });
  const rawC = runGameCCollective({ insights, p6 });
  const A = structureGameAReport(rawA, { edition });
  const B = structureGameBReport(rawB, { edition });
  const C = structureGameCReport(rawC, { edition });
  const bundle = {
    schema: 'momentum.evalGamesBundle.v1',
    executedAt: new Date().toISOString(),
    edition,
    games: { A, B, C },
    pass: A.pass && B.pass && C.pass
  };
  const summaryMd = [
    '# Synthèse d’évaluation P6 (jeux A/B/C)',
    '',
    `Exécuté : ${bundle.executedAt}`,
    `Édition : \`${edition}\``,
    '',
    `- Jeu A : ${A.pass ? 'PASS' : 'FAIL'}`,
    `- Jeu B : ${B.pass ? 'PASS' : 'FAIL'} (références synthétiques ; aveugle humain : ${B.humanBlindComparison.performed ? 'oui' : 'non'})`,
    `- Jeu C : ${C.pass ? 'PASS' : 'FAIL'}`,
    '',
    B.humanBlindComparison.performed
      ? ''
      : '> Aucune comparaison humaine à l’aveugle n’a été réalisée dans cette exécution.',
    ''
  ].join('\n');
  return { A, B, C, bundle, summaryMd };
}
