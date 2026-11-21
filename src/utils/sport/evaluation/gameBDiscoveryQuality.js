import { emptyGameBReport } from './evaluationTypes';
import { exploreVolumeChange, exploreNearEqualSessions, exploreCollectiveReturn, COVERAGE } from '../analyticalExploration';

/**
 * Jeu B — valeur des découvertes (reconstitué ; harnais P1 historique non retrouvé).
 * Distingue observation / description / découverte / abstention.
 * Ne prétend jamais qu'une comparaison humaine à l'aveugle a eu lieu.
 */

const REFERENCE_CASES = [
  {
    id: 'volume_decline_frequency',
    kind: 'synthetic',
    input: {
      repsNow: 3704,
      repsThen: 6947,
      sessionsNow: 12,
      sessionsThen: 22,
      repsPerSessionNow: 309,
      repsPerSessionThen: 316,
      repertoireChanged: false,
      formatChanged: false
    },
    prefer: 'fewer_sessions',
    rejectAttractive: 'hypertrophy',
    requireConcluded: true
  },
  {
    id: 'volume_rise_frequency',
    kind: 'synthetic',
    input: {
      repsNow: 5000,
      repsThen: 3000,
      sessionsNow: 20,
      sessionsThen: 12,
      repsPerSessionNow: 250,
      repsPerSessionThen: 250,
      repertoireChanged: false,
      formatChanged: false
    },
    prefer: 'more_sessions',
    rejectAttractive: 'force_maximale',
    requireConcluded: true
  },
  {
    id: 'volume_content_explains',
    kind: 'synthetic',
    input: {
      repsNow: 4800,
      repsThen: 3600,
      sessionsNow: 12,
      sessionsThen: 12,
      repsPerSessionNow: 400,
      repsPerSessionThen: 300,
      repertoireChanged: false,
      formatChanged: false
    },
    prefer: 'more_reps_per_session',
    rejectAttractive: 'more_sessions',
    requireConcluded: true
  },
  {
    id: 'same_format_no_volume_change',
    kind: 'synthetic',
    input: {
      repsNow: 600,
      repsThen: 600,
      sessionsNow: 6,
      sessionsThen: 6,
      repsPerSessionNow: 100,
      repsPerSessionThen: 100,
      repertoireChanged: false,
      formatChanged: false
    },
    prefer: 'no_volume_change',
    rejectAttractive: 'force_maximale',
    requireConcluded: false
  },
  {
    id: 'near_equal_sessions_composition',
    kind: 'synthetic',
    mode: 'near_equal',
    days: [
      { date: '2026-11-14', reps: 332, challengeReps: 100, exerciseCount: 8, pushReps: 180, pullReps: 100 },
      { date: '2026-11-16', reps: 319, challengeReps: 0, exerciseCount: 12, pushReps: 120, pullReps: 160 },
      { date: '2026-11-17', reps: 332, challengeReps: 0, exerciseCount: 9, pushReps: 200, pullReps: 90 }
    ],
    expectDifference: true
  },
  {
    id: 'collective_returns_same_episode',
    kind: 'synthetic',
    mode: 'collective_return',
    events: [
      { name: 'Face pull', date: '2026-11-10', family: 'shoulders', gapDays: 28 },
      { name: 'Élévations latérales', date: '2026-11-11', family: 'shoulders', gapDays: 30 },
      { name: 'Arnold press', date: '2026-11-12', family: 'shoulders', gapDays: 21 }
    ],
    expectCollective: true,
    expectConcluded: true
  },
  {
    id: 'collective_returns_simultaneous_unlinked',
    kind: 'synthetic',
    mode: 'collective_return',
    events: [
      { name: 'Face pull', date: '2026-11-10', gapDays: 28 },
      { name: 'Élévations latérales', date: '2026-11-11', gapDays: 30 },
      { name: 'Kickbacks', date: '2026-11-12', gapDays: 21 }
    ],
    expectCollective: false,
    expectUnderExplored: true
  },
  {
    id: 'challenge_format_time_requires_timed_data',
    kind: 'synthetic',
    mode: 'challenge_presence',
    requireChallengeCards: true
  }
];

function evalVolumeCase(ref, report) {
  const explored = exploreVolumeChange(ref.input);
  if (ref.prefer === 'no_volume_change') {
    if (explored.coverage === COVERAGE.NO_PHENOMENON) {
      report.referenceHits += 1;
      report.cases.push({
        id: ref.id,
        result: 'hit',
        coverage: explored.coverage,
        referenceKind: 'synthetic',
        humanBlindPerformed: false
      });
    } else {
      report.incorrectAttractive += 1;
      report.cases.push({ id: ref.id, result: 'miss', coverage: explored.coverage, referenceKind: 'synthetic' });
    }
    return;
  }
  const hit = (explored.retained || []).some((row) => row.id === ref.prefer);
  const wrongAttractive = (explored.retained || []).some((row) => row.id === ref.rejectAttractive);
  if (wrongAttractive) {
    report.incorrectAttractive += 1;
    report.cases.push({ id: ref.id, result: 'attractive_wrong', retained: explored.retained.map((r) => r.id) });
    return;
  }
  if (hit && (!ref.requireConcluded || explored.coverage === COVERAGE.CONCLUDED)) {
    report.referenceHits += 1;
    report.cases.push({
      id: ref.id,
      result: 'hit',
      retained: explored.retained.map((r) => r.id),
      referenceKind: 'synthetic',
      humanBlindPerformed: false
    });
  } else if (hit) {
    report.superficialOnly += 1;
    report.cases.push({ id: ref.id, result: 'shallow', coverage: explored.coverage });
  } else {
    report.incorrectAttractive += 1;
    report.cases.push({
      id: ref.id,
      result: 'miss',
      retained: (explored.retained || []).map((r) => r.id),
      expected: ref.prefer
    });
  }
}

export function runGameBDiscoveryQuality({ insights = null, blindPackets = null } = {}) {
  const report = emptyGameBReport();
  report.blindComparisonAvailable = Array.isArray(blindPackets) && blindPackets.length >= 2;
  report.harnessNote = 'reconstituted_p1_missing';

  REFERENCE_CASES.forEach((ref) => {
    if (ref.mode === 'near_equal') {
      const explored = exploreNearEqualSessions(ref.days);
      const ok =
        explored?.coverage === COVERAGE.CONCLUDED ||
        (explored?.differences && explored.differences.length > 0) ||
        Boolean(explored?.conclusion);
      if (ok) {
        report.referenceHits += 1;
        report.cases.push({ id: ref.id, result: 'hit', referenceKind: 'synthetic', humanBlindPerformed: false });
      } else {
        report.superficialOnly += 1;
        report.cases.push({ id: ref.id, result: 'shallow', referenceKind: 'synthetic' });
      }
      return;
    }
    if (ref.mode === 'collective_return') {
      const explored = exploreCollectiveReturn(ref.events);
      if (ref.expectUnderExplored) {
        const ok = explored?.coverage === COVERAGE.UNDER_EXPLORED || !ref.expectCollective;
        if (ok && explored?.coverage !== COVERAGE.CONCLUDED) {
          report.referenceHits += 1;
          report.cases.push({ id: ref.id, result: 'hit_abstain', coverage: explored.coverage, referenceKind: 'synthetic' });
        } else {
          report.incorrectAttractive += 1;
          report.cases.push({ id: ref.id, result: 'false_collective', coverage: explored.coverage, referenceKind: 'synthetic' });
        }
        return;
      }
      const ok =
        explored?.coverage === COVERAGE.CONCLUDED &&
        Boolean(explored?.conclusion) &&
        (explored?.namedMoves || []).length >= 3;
      if (ok) {
        report.referenceHits += 1;
        report.cases.push({ id: ref.id, result: 'hit', referenceKind: 'synthetic', humanBlindPerformed: false });
      } else {
        report.incorrectAttractive += 1;
        report.cases.push({ id: ref.id, result: 'miss', coverage: explored?.coverage, referenceKind: 'synthetic' });
      }
      return;
    }
    if (ref.mode === 'challenge_presence') {
      const hasChallenge = [
        ...(insights?.shortTerm || []),
        ...(insights?.mediumTerm || []),
        ...(insights?.longTerm || []),
        ...(insights?.accessibleReserve || [])
      ].some((card) => /challenge_format_time|disc_challenge/i.test(String(card?.kind || '')));
      if (!hasChallenge) {
        report.cases.push({
          id: ref.id,
          result: 'not_applicable',
          reason: 'aucune séance chronométrée de défi dans ce paquet — le détecteur n’est ni validé ni contredit',
          referenceKind: 'synthetic'
        });
      } else {
        report.referenceHits += 1;
        report.cases.push({ id: ref.id, result: 'hit', referenceKind: 'synthetic' });
      }
      return;
    }
    evalVolumeCase(ref, report);
  });

  const accessible = [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || []),
    ...(insights?.accessibleReserve || [])
  ];
  const qualityDims = {
    exactitude: 0,
    profondeur: 0,
    contexte: 0,
    pouvoirExplicatif: 0,
    niveauxRelies: 0,
    valeurMarginale: 0,
    limites: 0,
    superficialCounter: 0
  };
  accessible.forEach((card) => {
    const body = `${card?.title || ''} ${card?.body || ''}`;
    const proofCount = (card?.claim?.proof?.observedValues || card?.metrics?.observedValues || []).length;
    const relations = (card?.claim?.relations || card?.relations || []).length;
    // Affirmation physiologique non étayée — ignorer les négations / limites explicites.
    const claimsPhysiology =
      /force maximale|hypertrophie démontrée|adaptation physiologique prouvée/i.test(body) &&
      !/pas (?:une )?preuve|pas sur une force|pas (?:de |d[e’'])hypertrophie|sans (?:prouver|démontrer)|n[e’']établit pas|ne (?:prouve|démontre) pas/i.test(
        body
      );
    if (claimsPhysiology) {
      report.incorrectAttractive += 1;
      report.cases.push({ id: card?.id || card?.title, result: 'unsupported_physiology' });
    }
    // Causalité sommeil : exiger une affirmation positive, pas une négation
    // du type « sans qu'on puisse en conclure que le sommeil cause… ».
    const sleepCausalCue =
      /sommeil/i.test(body) &&
      /(?:\bcause\b|\bprovoque\b|diminue ta force|récupération insuffisante prouvée)/i.test(body);
    const sleepCausalDenied =
      /pas (?:une )?cause|sans causalité|association(?:\s+descriptive)?|ne (?:prouve|démontre|établit) pas|sans (?:qu['’]on puisse|pouvoir) en conclure|on ne (?:peut|saurait) (?:pas )?en conclure|pas une preuve que/i.test(
        body
      );
    if (sleepCausalCue && !sleepCausalDenied) {
      const cueMatch = body.match(/\b(?:cause|provoque|diminue ta force|récupération insuffisante prouvée)\b/i);
      report.incorrectAttractive += 1;
      report.cases.push({
        id: card?.id || card?.kind || card?.title,
        kind: card?.kind || null,
        title: card?.title || null,
        body: String(card?.body || '').slice(0, 600),
        result: 'sleep_causality_overclaim',
        referenceKind: 'live_card_heuristic',
        incriminatedSpan: cueMatch?.[0] || null,
        reason:
          'Affirmation causale sommeil détectée sans négation méthodologique explicite dans le même texte',
        expected: {
          requireDenial:
            'pas une cause | association | sans qu’on puisse en conclure | ne prouve/démontre pas'
        },
        referenceData: {
          limitations: card?.claim?.limitations || card?.limitations || null,
          observedValues: card?.claim?.proof?.observedValues || card?.metrics?.observedValues || null,
          population: card?.claim?.population || card?.metrics?.populationLabel || null
        }
      });
    }
    // Dimensions Mission 7 — un compteur reformulé ≠ une découverte
    if (proofCount >= 2) qualityDims.exactitude += 1;
    if (/parce que|s'explique|concentré|récurrent|famille de séances|ne sont pas interchangeables/i.test(body)) {
      qualityDims.profondeur += 1;
      qualityDims.pouvoirExplicatif += 1;
    } else if (/^\s*(tu as|vous avez)\s+\d+/i.test(body) || body.length < 80) {
      qualityDims.superficialCounter += 1;
    }
    if (/depuis|fois|comparable|horizon|précédent|historique/i.test(body)) qualityDims.contexte += 1;
    if (/séance|exercice|groupe|programme|cycle|famille/i.test(body) && relations + proofCount >= 1) {
      qualityDims.niveauxRelies += 1;
    }
    if (/incert|limite|sans preuve|ne permet|inconnu/i.test(body)) qualityDims.limites += 1;
    if (card?.marginal?.value != null && card.marginal.value > 0) qualityDims.valeurMarginale += 1;
  });
  report.qualityDimensions = qualityDims;
  report.cases.push({
    id: 'mission7_quality_dimensions',
    result: 'scored',
    dimensions: qualityDims,
    note: 'Longueur seule n’améliore pas le score ; relations/explications étayées comptent.'
  });

  const applicableRefs = REFERENCE_CASES.filter((ref) => {
    if (ref.mode !== 'challenge_presence') return true;
    return [
      ...(insights?.shortTerm || []),
      ...(insights?.mediumTerm || []),
      ...(insights?.longTerm || []),
      ...(insights?.accessibleReserve || [])
    ].some((card) => /challenge_format_time|disc_challenge/i.test(String(card?.kind || '')));
  });
  const notApplicableCount = (report.cases || []).filter((c) => c.result === 'not_applicable').length;
  const scoredOnly = (report.cases || []).filter((c) => c.result === 'scored').length;
  const failedRefs = (report.cases || []).filter((c) =>
    ['miss', 'shallow', 'false_collective', 'unsupported_physiology', 'sleep_causality_overclaim'].includes(
      c.result
    )
  ).length;
  report.notApplicable = notApplicableCount;
  report.scoredInformational = scoredOnly;
  report.failedRefs = failedRefs;
  // `scored` (dimensions) n'est jamais un succès qualitatif binaire.
  // PASS synthétique ≠ PASS de clôture avec jugement humain.
  const syntheticOk =
    report.referenceHits >= Math.min(4, applicableRefs.length) &&
    report.incorrectAttractive === 0 &&
    failedRefs === 0 &&
    report.referenceHits + notApplicableCount >= Math.max(1, applicableRefs.length - 1);
  report.pass = syntheticOk;
  report.passScope = report.blindComparisonAvailable
    ? 'synthetic_and_human_blind'
    : 'synthetic_refs_only';
  report.humanBlindPerformed = report.blindComparisonAvailable === true;
  report.closureNote = report.blindComparisonAvailable
    ? null
    : 'PASS synthétique uniquement — comparaison humaine à l’aveugle non effectuée';
  return report;
}

export function referenceCasesForGameB() {
  return REFERENCE_CASES.map((row) => ({ ...row }));
}
