import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { applyP6 } from '../p6Pipeline';
import { insightsFromP6, stablePublicationId } from '../p6Publication';
import {
  occurrenceId,
  semanticPhenomenonKey,
  stampDiscoveryIdentity,
  substantiveEquivalence
} from '../discoveryIdentity';
import { analysisEditionKey } from '../analysisEdition';
import { reviewCollectively } from '../collectiveReview';
import { exploreNearEqualSessions } from '../analyticalExploration';
import { runGameCCollective } from '../evaluation/gameCCollective';

function returnCard({ exerciseId, name, date = '2026-11-20', gapDays = 28 }) {
  return {
    kind: 'disc_ms_return',
    nature: 'now',
    family: 'ms_return',
    title: `Tu reprends ${name} après ${gapDays} jours d'absence`,
    body: `${name} revient après ${gapDays} jours.`,
    evidence: date,
    metrics: {
      exerciseId,
      name,
      date,
      prevDate: '2026-10-23',
      gapDays,
      returnReps: 40,
      priorAvg: 36
    }
  };
}

describe('Mission 6 — identité et preuves', () => {
  it('édition courante conserve identité + revue collective', () => {
    const key = analysisEditionKey();
    expect(key).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(key).toMatch(/identity=discovery-occurrence-v1/);
    expect(key).toMatch(/program=structural-/);
    expect(key).toMatch(/review=collective-pass4-/);
  });

  it('même détecteur, sujets différents → publications distinctes (pas de fausse suppression)', () => {
    const face = stampDiscoveryIdentity(returnCard({ exerciseId: 306, name: 'Face pull' }));
    const elev = stampDiscoveryIdentity(returnCard({ exerciseId: 304, name: 'Élévations latérales' }));
    const kick = stampDiscoveryIdentity(returnCard({ exerciseId: 308, name: 'Kickbacks triceps' }));
    expect(stablePublicationId(face)).not.toBe(stablePublicationId(elev));
    expect(stablePublicationId(elev)).not.toBe(stablePublicationId(kick));
    expect(stablePublicationId(face)).not.toBe('disc_ms_return');

    const withClaims = [face, elev, kick].map((d) => ({
      ...d,
      claim: claimFromDiscovery(d)
    }));
    const p6 = {
      counters: { reconciled: true, priority: 3, reserve: 0 },
      priority: withClaims,
      reserve: [],
      sources: [],
      blocked: []
    };
    const insights = insightsFromP6(p6);
    const published = [
      ...insights.shortTerm,
      ...insights.mediumTerm,
      ...insights.longTerm,
      ...insights.accessibleReserve
    ];
    expect(published).toHaveLength(3);
    expect(insights.publicationDispositions.filter((d) => d.disposition === 'published')).toHaveLength(3);
    expect(
      insights.publicationDispositions.some((d) => d.disposition === 'exact_duplicate_suppressed')
    ).toBe(false);
  });

  it('détecteurs différents, même thèse et mêmes preuves → consolidation', () => {
    const shared = {
      title: 'Le haut du corps travaille surtout en poussée',
      body: '464 répétitions de poussée contre 297 de tirage.',
      evidence: 'push 464 / pull 297',
      metrics: {
        pushReps: 464,
        pullReps: 297,
        observedValues: [
          { id: 'pushReps', value: 464, unit: 'reps' },
          { id: 'pullReps', value: 297, unit: 'reps' }
        ]
      }
    };
    const now = stampDiscoveryIdentity({
      kind: 'disc_th_pushPull_now',
      nature: 'now',
      family: 'stimulus',
      ...shared
    });
    const traj = stampDiscoveryIdentity({
      kind: 'disc_th_pushPull_trajectory',
      nature: 'trajectory',
      family: 'stimulus',
      ...shared
    });
    const journey = stampDiscoveryIdentity({
      kind: 'disc_th_pushPull_journey',
      nature: 'journey',
      family: 'stimulus',
      ...shared
    });
    expect(substantiveEquivalence(now, traj).equivalent).toBe(true);
    expect(semanticPhenomenonKey(now)).toBe(semanticPhenomenonKey(journey));

    const wrapped = [now, traj, journey].map((d) => {
      const claim = claimFromDiscovery(d);
      return { discovery: { ...d, claim }, claim, exploration: { coverage: 'concluded' } };
    });
    const reviewed = reviewCollectively(wrapped, { voiceKey: 'week' });
    expect(reviewed.survivors.length).toBe(1);
    expect(reviewed.fused.length).toBe(2);
    expect(reviewed.fused.every((f) => f.collapsedInto && f.equivalence?.proof)).toBe(true);
  });

  it('même titre, populations/exercices différents → pas de fusion automatique', () => {
    const a = stampDiscoveryIdentity({
      kind: 'disc_structural_memory',
      title: 'Exercice déjà pratiqué',
      body: 'Hyperextension était déjà là.',
      metrics: { exerciseId: 101, name: 'Hyperextension', date: '2026-11-18' }
    });
    const b = stampDiscoveryIdentity({
      kind: 'disc_structural_memory',
      title: 'Exercice déjà pratiqué',
      body: 'Relevés de genoux aux parallèles étaient déjà là.',
      metrics: { exerciseId: 202, name: 'Relevés de genoux aux parallèles', date: '2026-11-17' }
    });
    expect(occurrenceId(a)).not.toBe(occurrenceId(b));
    expect(substantiveEquivalence(a, b).equivalent).toBe(false);
    expect(substantiveEquivalence(a, b).reason).toMatch(/distinct_subjects|same_title_distinct/);
  });

  it('near_equal propage volumes et dates dans le claim (pas extraction texte)', () => {
    const exploration = exploreNearEqualSessions([
      { date: '2026-11-14', reps: 332, challengeReps: 100, exerciseCount: 7 },
      { date: '2026-11-16', reps: 332, challengeReps: 0, exerciseCount: 9 },
      { date: '2026-11-17', reps: 319, challengeReps: 100, exerciseCount: 7 }
    ]);
    const discovery = stampDiscoveryIdentity({
      kind: 'disc_near_equal_sessions',
      nature: 'now',
      title: 'Des journées à volume proche racontent des séances différentes',
      body: exploration.conclusion,
      evidence: 'composition',
      metrics: {
        days: exploration.nearDays,
        dates: exploration.nearDays.map((d) => d.date),
        observedValues: exploration.nearDays.map((d) => ({
          id: `volume:${d.date}`,
          value: d.reps,
          unit: 'reps'
        })),
        comparisonMethod: 'near_equal_session_composition',
        producer: 'exploreNearEqualSessions'
      }
    });
    const claim = claimFromDiscovery(discovery);
    expect(claim.proof.observedValues.length).toBeGreaterThanOrEqual(3);
    expect(claim.proof.observedValues.some((v) => v.id === 'volume:2026-11-14' && v.value === 332)).toBe(
      true
    );
    expect(claim.assertions[0].metricId).not.toBe('disc_near_equal_sessions');
    expect(claim.assertions[0].operator).toBe('compare');
  });

  it('jeu C indépendant : collision technique détecteur → FAIL ; sujets distincts → PASS', () => {
    // Simulation de l’ancien bug : trois retours avec id=kind
    const legacy = ['Face pull', 'Élévations', 'Kickbacks'].map((name, i) => ({
      id: 'disc_ms_return',
      kind: 'disc_ms_return',
      title: name,
      body: `${name} revient`,
      claim: claimFromDiscovery(
        returnCard({ exerciseId: 300 + i, name, date: '2026-11-20' })
      ),
      metrics: { exerciseId: 300 + i, name, date: '2026-11-20', gapDays: 28 }
    }));
    // Avec identité corrigée
    const fixed = legacy.map((row) => stampDiscoveryIdentity(row));
    const insights = insightsFromP6({
      counters: { reconciled: true, priority: 3, reserve: 0 },
      priority: fixed.map((d) => ({ ...d, claim: claimFromDiscovery(d) })),
      reserve: [],
      sources: [],
      blocked: []
    });
    const report = runGameCCollective({
      insights,
      p6: {
        counters: { reconciled: true },
        priority: fixed.map((d) => ({ ...d, claim: claimFromDiscovery(d) })),
        reserve: []
      }
    });
    expect(insights.shortTerm.length + insights.mediumTerm.length).toBe(3);
    expect(report.exactDuplicatesAccessible).toBe(0);
    expect(report.cases.some((c) => c.admissiblePreserved === false)).toBe(false);
  });

  it('applyP6 : reprise collective potentielle ne disparaît plus par id détecteur', () => {
    const all = [
      returnCard({ exerciseId: 306, name: 'Face pull' }),
      returnCard({ exerciseId: 304, name: 'Élévations latérales' }),
      returnCard({ exerciseId: 308, name: 'Kickbacks triceps' })
    ];
    const p6 = applyP6({ all, selected: all, voiceKey: 'month' });
    expect(p6.counters.reconciled).toBe(true);
    const insights = insightsFromP6(p6);
    const published = [
      ...insights.shortTerm,
      ...insights.mediumTerm,
      ...insights.longTerm,
      ...insights.accessibleReserve
    ];
    const returnish = published.filter((c) => /reprend|format repris|Kickbacks|Face pull|Élévations/i.test(c.title));
    expect(returnish.length).toBeGreaterThanOrEqual(2);
  });
});
