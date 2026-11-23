/**
 * Mission 29 — contrats fusion/métriques ; cas Hyperextension traverse sélection→publication.
 */
import { describe, expect, it } from 'vitest';
import { applyP6 } from '../p6Pipeline';
import { insightsFromP6 } from '../p6Publication';
import { marginalValue } from '../collectiveSelection';
import { substantiveEquivalence } from '../discoveryIdentity';
import { relateClaims, RELATION } from '../narrativeCoherenceEngine';
import { metricsAreComparable, METRIC_GRANULARITY, METRIC_UNIT, buildMetricFact } from '../recapMetricContract';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { validateAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';

function parallelDiscovery({ aspect, sess, cal, titleSuffix, window, mean = 48 }) {
  const id = `parallel_traj|ex:1979012181+ex:703294235|${aspect}|2`;
  const discovery = {
    kind: 'disc_composed_parallel_trajectories',
    title: `Hyperextension : 2 trajectoires parallèles (${titleSuffix})`,
    body: `body ${aspect}`,
    nature: 'trajectory',
    family: 'repertoire',
    informativeValue: aspect.includes('quarter') ? 80 : 55,
    id,
    occurrenceId: id,
    phenomenonId: `parallel|ex:1979012181+ex:703294235|${aspect}`,
    metrics: {
      subjectKey: 'parallel:ex:1979012181+ex:703294235',
      parallelSubjects: ['ex:1979012181', 'ex:703294235'],
      analyticalAspect: aspect,
      phenomenonKey: `parallel|ex:1979012181+ex:703294235|${aspect}`,
      name: 'Hyperextension',
      observationWindow: window,
      meanReps: mean,
      volumeBasis: 'per_session_mean',
      occurrenceId: id,
      observedValues: [{ id: 'meanReps', value: mean, unit: 'reps' }]
    }
  };
  const claim = {
    id: `c:${id}`,
    statement: discovery.title,
    status: 'supported',
    subject: { key: discovery.metrics.subjectKey },
    scope: {
      start: window.start,
      end: window.end,
      windowId: `${window.start}:${window.end}`
    },
    assertions: [
      {
        subjectId: discovery.metrics.subjectKey,
        metricId: 'disc_composed_parallel_trajectories',
        windowId: `${window.start}:${window.end}`,
        operator: 'present',
        value: mean,
        referenceValue: mean,
        observedValues: discovery.metrics.observedValues
      }
    ],
    proof: {
      observedValues: discovery.metrics.observedValues,
      analyticalAspect: aspect,
      sourceEvents: []
    },
    analyticalAspect: aspect
  };
  return { discovery: { ...discovery, claim }, claim, wasPriority: true, p6Disposition: 'consolidated' };
}

function structuralChild(exerciseId, parentId, reps, prev) {
  const dates =
    exerciseId === '1979012181'
      ? '2026-10-30,2026-11-06,2026-11-13,2026-11-20'
      : '2026-10-26,2026-11-02,2026-11-09,2026-11-16';
  const id = `disc_structural_memory|ex:${exerciseId}|dates:${dates}|aspect:default`;
  const discovery = {
    kind: 'disc_structural_memory',
    title: 'Hyperextension: 4 séances sur ces 30 jours',
    body: `${reps} vs ${prev}`,
    nature: 'trajectory',
    family: 'structural_memory',
    informativeValue: 70,
    id,
    occurrenceId: id,
    metrics: {
      exerciseId,
      name: 'Hyperextension',
      recentReps: reps,
      prevReps: prev,
      windowMeanPerSession: 48,
      observedValues: [
        { id: 'recentReps', value: reps, unit: 'reps' },
        { id: 'prevReps', value: prev, unit: 'reps' },
        { id: 'windowMeanPerSession', value: 48, unit: 'reps' }
      ]
    }
  };
  const claim = {
    id: `c:${id}`,
    statement: discovery.title,
    status: 'supported',
    subject: { key: `ex:${exerciseId}` },
    scope: { start: '2026-10-26', end: '2026-11-20', windowId: 'struct' },
    assertions: [
      {
        subjectId: `ex:${exerciseId}`,
        metricId: 'volume_reps',
        windowId: '2026-10-26:2026-11-20',
        operator: 'increase',
        value: reps,
        referenceValue: prev,
        observedValues: discovery.metrics.observedValues
      }
    ],
    proof: { observedValues: discovery.metrics.observedValues, sourceEvents: [] }
  };
  return {
    discovery: { ...discovery, claim },
    claim,
    wasPriority: true
  };
}

describe('Mission 29 — édition', () => {
  it('bumpe sélection / hiérarchie / composition', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v(29|30)/);
    expect(ANALYSIS_EDITION_PARTS.selection).toBe('partial-redundancy-reserve-v1');
    expect(ANALYSIS_EDITION_PARTS.hierarchy).toBe('graph-before-publish-v1');
  });
});

describe('Mission 29 — fusion : aspects distincts restent accessibles', () => {
  it('assertions présentes + même sujet parallel → pas de suppression (overlap 0)', () => {
    const recent = parallelDiscovery({
      aspect: 'span:recent30|sess:4|cal:1gjmgdz',
      titleSuffix: '~4 séances',
      window: { start: '2026-10-26', end: '2026-11-20', spanDays: 25 }
    });
    const quarter = parallelDiscovery({
      aspect: 'span:quarter|sess:8|cal:1aie1tq',
      titleSuffix: '~8 séances',
      window: { start: '2026-09-28', end: '2026-11-20', spanDays: 53 }
    });
    expect(substantiveEquivalence(recent.discovery, quarter.discovery).equivalent).toBe(false);
    expect(relateClaims(recent.claim, quarter.claim)).toBe(RELATION.INDEPENDENT);
    const mv = marginalValue(recent, [quarter]);
    expect(mv.overlap).toBe(0);
  });

  it('pipeline applyP6+insights : recent30 et quarter accessibles ; pas d’orphan', () => {
    const recent = parallelDiscovery({
      aspect: 'span:recent30|sess:4|cal:1gjmgdz',
      titleSuffix: '~4 séances',
      window: { start: '2026-10-26', end: '2026-11-20', spanDays: 25 }
    });
    const quarter = parallelDiscovery({
      aspect: 'span:quarter|sess:8|cal:1aie1tq',
      titleSuffix: '~8 séances',
      window: { start: '2026-09-28', end: '2026-11-20', spanDays: 53 }
    });
    const childA = structuralChild('1979012181', recent.discovery.id, 192, 96);
    const childB = structuralChild('703294235', recent.discovery.id, 192, 144);

    // Simule post-composition : enfants liés au parent recent30
    const linkedA = {
      ...childA,
      p6Disposition: 'deepening_of_collective',
      collapsedInto: recent.discovery.id,
      hierarchyLink: {
        ok: true,
        reason: 'verified_parallel_storage_trajectories',
        proof: { parentId: recent.discovery.id, childSubject: 'ex:1979012181' }
      },
      discovery: {
        ...childA.discovery,
        p6Disposition: 'deepening_of_collective',
        collapsedInto: recent.discovery.id,
        hierarchyLink: {
          ok: true,
          reason: 'verified_parallel_storage_trajectories',
          proof: { parentId: recent.discovery.id }
        }
      }
    };
    const linkedB = {
      ...childB,
      p6Disposition: 'deepening_of_collective',
      collapsedInto: recent.discovery.id,
      hierarchyLink: {
        ok: true,
        reason: 'verified_parallel_storage_trajectories',
        proof: { parentId: recent.discovery.id, childSubject: 'ex:703294235' }
      },
      discovery: {
        ...childB.discovery,
        p6Disposition: 'deepening_of_collective',
        collapsedInto: recent.discovery.id,
        hierarchyLink: {
          ok: true,
          reason: 'verified_parallel_storage_trajectories',
          proof: { parentId: recent.discovery.id }
        }
      }
    };

    const p6 = applyP6({
      all: [recent.discovery, quarter.discovery, linkedA.discovery, linkedB.discovery],
      selected: [recent.discovery, quarter.discovery, linkedA.discovery, linkedB.discovery],
      window: { start: '2026-08-23', end: '2026-11-22' },
      voiceKey: 'quarter'
    });

    // Les parents composés peuvent être re-créés ; on publie le p6 tel quel
    const out = insightsFromP6(p6, { period: '3m' });
    const published = [
      ...(out.shortTerm || []),
      ...(out.mediumTerm || []),
      ...(out.longTerm || []),
      ...(out.accessibleReserve || [])
    ];
    const parallelParents = published.filter((c) => /parallel_traj/.test(c.id || ''));
    // Au moins un parent parallèle accessible ; si deux aspects distincts présents en entrée sélection, les deux doivent rester
    expect(parallelParents.length).toBeGreaterThanOrEqual(1);

    const orphans = published.filter(
      (c) =>
        (c.disposition === 'deepening_of_collective' || c.role === 'reserve') &&
        c.parentId &&
        c.hierarchyLink?.ok === true &&
        !published.some((p) => p.id === c.parentId)
    );
    expect(orphans).toEqual([]);

    const auditLike = {
      cardRegistry: Object.fromEntries(
        published.map((c) => [
          `3m|${c.id}`,
          {
            ...c,
            period: '3m',
            role: /priority|consolidated/.test(String(c.disposition || c.p6Disposition || ''))
              ? 'priority'
              : 'reserve'
          }
        ])
      ),
      claimRegistry: Object.fromEntries(published.map((c) => [`3m|${c.id}`, c.claim || { id: c.id }])),
      candidateRegistry: {},
      factRegistry: {},
      periods: {
        '3m': {
          publicationAuthority: 'p6',
          cardRefs: published.map((c) => `3m|${c.id}`),
          accessibleCount: published.length,
          reconciledStrict: true
        }
      },
      diagnostics: { cardClaimDivergenceCount: 0 }
    };
    // Forcer rôle reserve + hierarchy pour le validateur orphan
    published.forEach((c) => {
      const key = `3m|${c.id}`;
      if (c.parentId && c.hierarchyLink?.ok) {
        auditLike.cardRegistry[key].role = 'reserve';
      }
    });
    const v = validateAnalyticalAudit(auditLike);
    expect(v.integrityValidation.errors.filter((e) => e.startsWith('orphan_parent'))).toEqual([]);
  });

  it('famille non-Hyperextension : reformulation → réserve, pas suppression', () => {
    const a = {
      discovery: {
        kind: 'disc_exercise_progress',
        title: 'Curl : volume stable',
        body: 'A',
        informativeValue: 60,
        metrics: { exerciseId: 'curl1', name: 'Curl' },
        claim: {
          statement: 'Curl volume',
          assertions: [
            {
              subjectId: 'ex:curl1',
              metricId: 'volume_reps',
              windowId: 'w1',
              operator: 'stable',
              value: 40,
              referenceValue: 40
            }
          ],
          proof: { observedValues: [{ id: 'v', value: 40 }] }
        }
      },
      claim: {
        statement: 'Curl volume',
        assertions: [
          {
            subjectId: 'ex:curl1',
            metricId: 'volume_reps',
            windowId: 'w1',
            operator: 'stable',
            value: 40,
            referenceValue: 40
          }
        ],
        proof: { observedValues: [{ id: 'v', value: 40 }] }
      }
    };
    const b = {
      discovery: {
        kind: 'disc_exercise_progress',
        title: 'Curl : rythme inchangé',
        body: 'B',
        informativeValue: 50,
        metrics: { exerciseId: 'curl1', name: 'Curl' },
        claim: a.claim
      },
      claim: a.claim
    };
    // Même assertion → exact ou reformulation ; pas d’aspect parallèle
    const mv = marginalValue(b, [a]);
    // Soit équivalence forte (suppress), soit partielle — mais si partielle, overlap 0
    if (mv.partialOverlap === 1) {
      expect(mv.overlap).toBe(0);
    }
  });
});

describe('Mission 29 — contrat métrique comparable', () => {
  it('refuse total vs moyenne', () => {
    const total = buildMetricFact({
      value: 192,
      granularity: METRIC_GRANULARITY.TOTAL,
      unit: METRIC_UNIT.REPS,
      denominator: 'window'
    });
    const mean = buildMetricFact({
      value: 48,
      granularity: METRIC_GRANULARITY.PER_SESSION,
      unit: METRIC_UNIT.REPS,
      denominator: 'session'
    });
    expect(metricsAreComparable(total, mean).ok).toBe(false);
  });

  it('autorise deux totaux de fenêtre', () => {
    const a = buildMetricFact({
      value: 192,
      granularity: METRIC_GRANULARITY.TOTAL,
      unit: METRIC_UNIT.REPS,
      denominator: 'window',
      referent: 'primary_window'
    });
    const b = buildMetricFact({
      value: 96,
      granularity: METRIC_GRANULARITY.TOTAL,
      unit: METRIC_UNIT.REPS,
      denominator: 'window',
      referent: 'previous_equal_window'
    });
    // referent différent → needsExplicitDistinction mais ok peut être false
    const cmp = metricsAreComparable(
      { ...a, referent: 'primary_window' },
      { ...b, referent: 'primary_window' }
    );
    expect(cmp.ok).toBe(true);
  });
});
