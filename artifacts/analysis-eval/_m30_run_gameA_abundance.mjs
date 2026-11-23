/**
 * Mission 30 — Jeu A indépendant + scénarios d’abondance (pipeline réel applyP6).
 * Oracle = corpus JSON (sommes manuelles), pas l’export moteur.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyParallelTrajectoryComposition } from '../../src/utils/sport/parallelTrajectoryComposition.js';
import { applyP6 } from '../../src/utils/sport/p6Pipeline.js';
import { insightsFromP6 } from '../../src/utils/sport/p6Publication.js';
import { runGameAAccuracy } from '../../src/utils/sport/evaluation/gameAAccuracy.js';
import { validateCardClaimConsistency } from '../../src/utils/sport/evaluation/claimAssertionIdentity.js';
import {
  resolvePrimaryWindowSessionPopulation,
  validateSumMeanSampleConsistency
} from '../../src/utils/sport/recapMetricContract.js';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../../src/utils/sport/analysisEdition.js';
import { claimFromDiscovery } from '../../src/utils/sport/analyticalClaim.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'artifacts/analysis-eval/mission30-results');
fs.mkdirSync(outDir, { recursive: true });

const corpus = JSON.parse(
  fs.readFileSync(path.join(root, 'artifacts/analysis-eval/mission30-gameA/independentCorpus.json'), 'utf8')
);

function sumWindow(events) {
  const w = (events || []).filter((e) => e.inWindow !== false);
  const total = w.reduce((s, e) => s + Number(e.reps || 0), 0);
  return { total, sessions: w.length, mean: w.length ? total / w.length : null, dates: w.map((e) => e.date) };
}

function wrapDiscovery(discovery) {
  const claim =
    discovery.claim ||
    claimFromDiscovery(discovery, {
      start: discovery.metrics?.observationWindow?.start,
      end: discovery.metrics?.observationWindow?.end
    });
  return { discovery: { ...discovery, claim }, claim, wasPriority: true };
}

function structuralFromEvents(exerciseId, name, events, prevEvents = []) {
  const cur = sumWindow(events);
  const prev = sumWindow(prevEvents);
  const allDates = (events || []).map((e) => e.date).sort();
  const windowDates = cur.dates;
  return wrapDiscovery({
    kind: 'disc_structural_memory',
    title: `${name} : volume fenêtre`,
    body: `${cur.total} reps sur ${cur.sessions} séances`,
    nature: 'trajectory',
    family: 'repertoire',
    informativeValue: 70,
    metrics: {
      exerciseId,
      name,
      dates: allDates,
      arcDates: allDates,
      sessionCount: cur.sessions,
      recentReps: cur.total,
      windowTotalReps: cur.total,
      prevReps: prev.total || null,
      windowMeanPerSession: cur.mean,
      sessions: (events || []).map((e) => ({
        date: e.date,
        reps: e.reps,
        inSelectedWindow: e.inWindow !== false
      })),
      temporalScope: { windowDates },
      observationWindow: {
        start: windowDates[0] || null,
        end: windowDates[windowDates.length - 1] || null
      },
      observedValues: [
        { id: 'recentReps', value: cur.total, unit: 'reps' },
        { id: 'windowMeanPerSession', value: cur.mean, unit: 'reps' },
        { id: 'sessionCount', value: cur.sessions, unit: 'sessions' }
      ]
    }
  });
}

// --- Jeu A : composition parent ---
const caseParallel = corpus.cases.find((c) => c.id === 'ga-tractions-window-vs-arc');
const rowA = structuralFromEvents('exA', 'Tractions', caseParallel.eventsA);
const rowB = structuralFromEvents('exB', 'Tractions', caseParallel.eventsB);
const composed = applyParallelTrajectoryComposition([rowA, rowB], {
  voiceKey: '3m',
  window: { start: '2026-08-24', end: '2026-11-21' }
});
const parent = composed.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
const trajBy = Object.fromEntries((parent?.discovery?.metrics?.trajectories || []).map((t) => [t.subject, t]));

const independentA = caseParallel.independentExpected.A;
const independentB = caseParallel.independentExpected.B;
const oracleCheckA = sumWindow(caseParallel.eventsA);
const oracleCheckB = sumWindow(caseParallel.eventsB);

const gameACases = [];
const pushCase = (row) => gameACases.push(row);

pushCase({
  id: caseParallel.id,
  independentExpected: caseParallel.independentExpected,
  oracleRecompute: { A: oracleCheckA, B: oracleCheckB },
  engineCalculated: {
    A: { total: trajBy['ex:exA']?.recentReps, sessions: trajBy['ex:exA']?.sessions },
    B: { total: trajBy['ex:exB']?.recentReps, sessions: trajBy['ex:exB']?.sessions }
  },
  published: {
    body: parent?.discovery?.body || null,
    A: trajBy['ex:exA'],
    B: trajBy['ex:exB']
  },
  firstDivergence:
    trajBy['ex:exA']?.sessions !== independentA.sessions ||
    trajBy['ex:exB']?.sessions !== independentB.sessions
      ? 'sessionFingerprint/population'
      : null,
  failureFamily: null,
  pass:
    trajBy['ex:exA']?.sessions === independentA.sessions &&
    trajBy['ex:exB']?.sessions === independentB.sessions &&
    trajBy['ex:exA']?.recentReps === independentA.total &&
    trajBy['ex:exB']?.recentReps === independentB.total
});

// Contradiction prose
const contra = corpus.cases.find((c) => c.id === 'ga-contradiction-proof-vs-prose');
const badCard = {
  id: 'contra',
  title: 'Squat',
  body: `${contra.independentExpected.total} répétitions sur ${contra.independentExpected.falseProseSessions} séances`,
  metrics: {
    recentReps: contra.independentExpected.total,
    windowMeanPerSession: contra.independentExpected.mean,
    sessionCount: contra.independentExpected.sessions,
    sessions: Array.from({ length: contra.independentExpected.sessions }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      inSelectedWindow: true
    }))
  }
};
const badClaim = {
  statement: badCard.body,
  proof: {
    observedValues: [
      { id: 'recentReps', value: contra.independentExpected.total },
      { id: 'windowMeanPerSession', value: contra.independentExpected.mean }
    ]
  }
};
const contraCheck = validateCardClaimConsistency(badCard, badClaim);
pushCase({
  id: contra.id,
  independentExpected: contra.independentExpected,
  engineCalculated: { validationOk: contraCheck.ok, conflicts: contraCheck.conflicts },
  published: { body: badCard.body },
  firstDivergence: contraCheck.ok ? 'validation_missed_prose' : null,
  failureFamily: contraCheck.ok ? 'validation_gap' : null,
  pass: contraCheck.ok === false
});

// Fréquence / moyenne
for (const id of ['ga-rowing-freq-change-mean-stable', 'ga-military-mean-change-freq-stable']) {
  const c = corpus.cases.find((x) => x.id === id);
  const cur = sumWindow(c.events);
  const prev = sumWindow(c.prevEvents);
  const exp = c.independentExpected;
  const pop = resolvePrimaryWindowSessionPopulation({
    sessionCount: cur.sessions,
    sessions: c.events.map((e) => ({ date: e.date, inSelectedWindow: e.inWindow !== false })),
    dates: c.events.map((e) => e.date)
  });
  const triple = validateSumMeanSampleConsistency({
    total: cur.total,
    mean: cur.mean,
    sampleSize: pop.sessionCount
  });
  pushCase({
    id: c.id,
    family: c.family,
    independentExpected: exp,
    engineCalculated: {
      total: cur.total,
      sessions: pop.sessionCount,
      mean: cur.mean,
      prevTotal: prev.total,
      prevSessions: prev.sessions,
      prevMean: prev.mean,
      triple
    },
    published: null,
    note: 'Oracle indépendant (pas de publication moteur sur ce mini-cas)',
    firstDivergence: null,
    failureFamily: null,
    pass:
      cur.total === exp.total &&
      pop.sessionCount === exp.sessions &&
      Math.abs(cur.mean - exp.mean) < 0.01 &&
      (exp.freqChanged == null || (prev.sessions !== cur.sessions) === exp.freqChanged) &&
      (exp.meanChanged == null ||
        (Math.abs((prev.mean || 0) - cur.mean) > 0.01) === exp.meanChanged) &&
      triple.ok
  });
}

const parentCard = {
  id: parent?.discovery?.id,
  title: parent?.discovery?.title,
  body: parent?.discovery?.body,
  metrics: parent?.discovery?.metrics,
  claim: parent?.claim || parent?.discovery?.claim
};
const insights = {
  shortTerm: [],
  mediumTerm: [
    {
      ...parent?.discovery,
      id: parent?.discovery?.id,
      claim: parent?.claim || parent?.discovery?.claim
    }
  ],
  longTerm: [],
  accessibleReserve: []
};
const gameAReport = runGameAAccuracy({
  insights,
  referenceFacts: {
    expectedMetricTriples: [
      {
        cardId: parent?.discovery?.id,
        subjectKey: 'ex:exA',
        total: independentA.total,
        sessionCount: independentA.sessions,
        mean: independentA.mean
      },
      {
        cardId: parent?.discovery?.id,
        subjectKey: 'ex:exB',
        total: independentB.total,
        sessionCount: independentB.sessions,
        mean: independentB.mean
      }
    ]
  }
});

const gameAOut = {
  schema: 'momentum.mission30.gameA.v1',
  mission: analysisMissionLabel(),
  edition: ANALYSIS_EDITION_PARTS.editorial,
  proofKind: 'independent_corpus_pipeline',
  distinctFromUserReplay: true,
  cases: gameACases,
  runGameAAccuracy: {
    pass: gameAReport.pass,
    factualConflicts: gameAReport.factualConflicts,
    cases: gameAReport.cases
  },
  parentCardId: parentCard.id,
  pass: gameACases.every((c) => c.pass) && gameAReport.pass
};

// --- Abondance ---
function makeDisc(i, { title, body, subject, aspect, iv, kind = 'disc_traj' }) {
  const id = `${kind}|${subject}|${aspect}|${i}`;
  const discovery = {
    kind,
    title,
    body,
    nature: 'trajectory',
    family: 'repertoire',
    informativeValue: iv,
    id,
    occurrenceId: id,
    phenomenonId: `phen|${subject}|${aspect}`,
    metrics: {
      exerciseId: String(subject).replace(/^ex:/, ''),
      subjectKey: subject,
      analyticalAspect: aspect,
      phenomenonKey: `phen|${subject}|${aspect}`,
      observedValues: [{ id: 'marker', value: i, unit: 'index' }]
    }
  };
  const claim = claimFromDiscovery(discovery, { start: '2026-10-01', end: '2026-11-21' });
  return { ...discovery, claim };
}

function runAbundance(label, builders) {
  const all = builders();
  const selected = all.slice(0, Math.min(12, all.length));
  const p6 = applyP6({ all, selected, voiceKey: 'month', window: { start: '2026-10-01', end: '2026-11-21' } });
  const insights = insightsFromP6(p6);
  const priority = [...(insights.shortTerm || []), ...(insights.mediumTerm || []), ...(insights.longTerm || [])];
  const reserve = insights.accessibleReserve || [];
  const accessible = [...priority, ...reserve];
  const distinctIndependent = new Set(all.map((d) => d.phenomenonId || d.metrics?.phenomenonKey)).size;
  const lost = all.filter((d) => {
    const id = d.id || d.occurrenceId;
    return !accessible.some((c) => c.id === id || c.occurrenceId === id || c.phenomenonId === d.phenomenonId);
  });
  // « perdu » = distinct phenomenon absent du catalogue accessible
  const lostPhen = [...new Set(lost.map((d) => d.phenomenonId))].filter(
    (phen) => !accessible.some((c) => c.phenomenonId === phen)
  );
  return {
    label,
    candidates: all.length,
    distinctIndependent,
    admissible: (p6.priority || []).length + (p6.reserve || []).length,
    priorities: priority.length,
    complementaryAccessible: reserve.length,
    lostDistinctPhenomena: lostPhen.length,
    lostPhenomenaSample: lostPhen.slice(0, 8),
    fusionSample: (p6.dispositions || insights.publicationDispositions || []).slice(0, 12),
    reconciliation: insights.publicationReconciliation || p6.counters || null
  };
}

const abundance = {
  schema: 'momentum.mission30.abundance.v1',
  scenarios: [
    runAbundance('48_candidates_8_distinct', () => {
      const out = [];
      for (let i = 0; i < 48; i += 1) {
        const aspect = `aspect:${i % 8}`;
        out.push(
          makeDisc(i, {
            title: `Lecture ${i % 8}`,
            body: i < 8 ? `preuve distincte ${i}` : `reformulation de ${i % 8}`,
            subject: 'ex:shared',
            aspect,
            iv: 80 - (i % 8)
          })
        );
      }
      return out;
    }),
    runAbundance('48_distinct_admissible', () => {
      const out = [];
      for (let i = 0; i < 48; i += 1) {
        out.push(
          makeDisc(i, {
            title: `Phénomène ${i}`,
            body: `preuve unique ${i}`,
            subject: `ex:${1000 + i}`,
            aspect: `default:${i}`,
            iv: 60 + (i % 20)
          })
        );
      }
      return out;
    }),
    runAbundance('31st_good_discovery_accessible', () => {
      const out = [];
      for (let i = 0; i < 30; i += 1) {
        out.push(
          makeDisc(i, {
            title: `Prioritaire ${i}`,
            body: `corps ${i}`,
            subject: `ex:${2000 + i}`,
            aspect: 'default',
            iv: 90 - (i % 5)
          })
        );
      }
      out.push(
        makeDisc(30, {
          title: '31e bonne découverte',
          body: 'doit rester accessible même hors plafond prioritaire',
          subject: 'ex:2999',
          aspect: 'default',
          iv: 88
        })
      );
      return out;
    }),
    runAbundance('partial_reformulations', () => {
      const out = [];
      for (let i = 0; i < 12; i += 1) {
        out.push(
          makeDisc(i, {
            title: 'Même photo volume',
            body: i === 0 ? 'formulation A' : `reformulation partielle ${i}`,
            subject: 'ex:3001',
            aspect: 'default',
            iv: 70 - i
          })
        );
      }
      return out;
    }),
    runAbundance('parents_children_different_columns', () => {
      const parent = makeDisc(0, {
        title: 'Parent parallèle',
        body: 'composition',
        subject: 'parallel:ex:1+ex:2',
        aspect: 'span:recent30',
        iv: 85,
        kind: 'disc_composed_parallel_trajectories'
      });
      parent.metrics.parallelSubjects = ['ex:1', 'ex:2'];
      const child = makeDisc(1, {
        title: 'Enfant preuve',
        body: 'approfondissement',
        subject: 'ex:1',
        aspect: 'default',
        iv: 60,
        kind: 'disc_structural_memory'
      });
      child.parentId = parent.id;
      return [parent, child];
    })
  ]
};

fs.writeFileSync(path.join(outDir, 'gameA-independent.json'), JSON.stringify(gameAOut, null, 2));
fs.writeFileSync(path.join(outDir, 'abundance.json'), JSON.stringify(abundance, null, 2));
console.log(
  JSON.stringify(
    {
      outDir,
      gameAPass: gameAOut.pass,
      gameACases: gameACases.map((c) => ({ id: c.id, pass: c.pass })),
      abundance: abundance.scenarios.map((s) => ({
        label: s.label,
        candidates: s.candidates,
        distinct: s.distinctIndependent,
        priorities: s.priorities,
        complementary: s.complementaryAccessible,
        lost: s.lostDistinctPhenomena
      }))
    },
    null,
    2
  )
);
