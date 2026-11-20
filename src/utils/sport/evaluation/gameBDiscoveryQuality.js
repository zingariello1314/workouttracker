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
      { name: 'Face pull', date: '2026-11-10', family: 'shoulders' },
      { name: 'Élévations latérales', date: '2026-11-11', family: 'shoulders' },
      { name: 'Arnold press', date: '2026-11-12', family: 'shoulders' },
      { name: 'Kickbacks', date: '2026-11-12', family: 'triceps' }
    ],
    expectCollective: true
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
      const ok = Boolean(explored?.conclusion || explored?.collective || (explored?.retained || []).length);
      if (ok) {
        report.referenceHits += 1;
        report.cases.push({ id: ref.id, result: 'hit', referenceKind: 'synthetic', humanBlindPerformed: false });
      } else {
        report.incorrectAttractive += 1;
        report.cases.push({ id: ref.id, result: 'miss', referenceKind: 'synthetic' });
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
  accessible.forEach((card) => {
    const body = `${card?.title || ''} ${card?.body || ''}`;
    if (/force maximale|hypertrophie démontrée|adaptation physiologique prouvée/i.test(body)) {
      report.incorrectAttractive += 1;
      report.cases.push({ id: card?.id || card?.title, result: 'unsupported_physiology' });
    }
    if (
      /sommeil/i.test(body) &&
      /cause|provoque|diminue ta force|récupération insuffisante prouvée/i.test(body)
    ) {
      report.incorrectAttractive += 1;
      report.cases.push({ id: card?.id || card?.title, result: 'sleep_causality_overclaim' });
    }
  });

  report.pass =
    report.referenceHits >= 4 &&
    report.incorrectAttractive === 0 &&
    (report.blindComparisonAvailable || report.referenceHits >= REFERENCE_CASES.length - 1);
  return report;
}

export function referenceCasesForGameB() {
  return REFERENCE_CASES.map((row) => ({ ...row }));
}
