/**
 * Mission 28 — orphan parent, dénominateurs métriques, aspects parallèles distincts.
 */
import { describe, expect, it } from 'vitest';
import {
  applyParallelTrajectoryComposition
} from '../parallelTrajectoryComposition';
import { substantiveEquivalence, subjectKey, stablePublicationId } from '../discoveryIdentity';
import { marginalValue } from '../collectiveSelection';
import { insightsFromP6 } from '../p6Publication';
import { appendPublication, emptyAnalyticalMemory, notePublication } from '../analyticalMemory';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { validateAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';

function wrap(discovery, extras = {}) {
  const claim = {
    id: `c:${discovery.metrics?.exerciseId || discovery.metrics?.subjectKey || 'x'}`,
    statement: discovery.title,
    status: 'supported',
    subject: {
      key: discovery.metrics?.subjectKey || (discovery.metrics?.exerciseId ? `ex:${discovery.metrics.exerciseId}` : null)
    },
    scope: {
      start: discovery.metrics?.windowStart || '2026-08-01',
      end: discovery.metrics?.windowEnd || '2026-11-20',
      windowId: discovery.metrics?.observationWindow
        ? `${discovery.metrics.observationWindow.start}_${discovery.metrics.observationWindow.end}`
        : `${discovery.metrics?.dates?.[0] || 'a'}_${discovery.metrics?.dates?.at?.(-1) || 'b'}`
    },
    proof: {
      observedValues: discovery.metrics?.observedValues || [],
      sourceEvents: []
    },
    ...extras.claim
  };
  return {
    discovery: { ...discovery, claim },
    claim,
    wasPriority: true,
    p6Disposition: discovery.p6Disposition || null,
    ...extras
  };
}

describe('Mission 28 — édition', () => {
  it('bumpe parties métrique / hiérarchie / mémoire / sélection', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v2[789]/);
    expect(ANALYSIS_EDITION_PARTS.composition).toMatch(/metric-(denom|population)/);
    expect(ANALYSIS_EDITION_PARTS.hierarchy).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.memory).toBe('publication-registry-v1');
    expect(ANALYSIS_EDITION_PARTS.selection).toMatch(/parallel|partial-redundancy/);
  });
});

describe('Mission 28 A — subjectKey respecte parallel:', () => {
  it('ne retombe pas sur name:homonyme', () => {
    const row = {
      kind: 'disc_composed_parallel_trajectories',
      title: 'Hyperextension : 2 trajectoires',
      metrics: {
        name: 'Hyperextension',
        subjectKey: 'parallel:ex:1979012181+ex:703294235',
        exerciseId: null
      }
    };
    expect(subjectKey(row)).toBe('parallel:ex:1979012181+ex:703294235');
  });
});

describe('Mission 28 A — métriques : moyenne ≠ total', () => {
  it('compose des totaux 192/96 sans les remplacer par windowMeanPerSession', () => {
    const a = wrap({
      kind: 'disc_structural_memory',
      title: 'Hyperextension : 4 séances sur ces 30 jours',
      body: '192 reps',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20'],
        recentReps: 192,
        prevReps: 96,
        windowMeanPerSession: 48,
        observedValues: [
          { id: 'recentReps', value: 192, unit: 'reps' },
          { id: 'prevReps', value: 96, unit: 'reps' },
          { id: 'windowMeanPerSession', value: 48, unit: 'reps' }
        ]
      }
    });
    const b = wrap({
      kind: 'disc_structural_memory',
      title: 'Hyperextension : 4 séances sur ces 30 jours',
      body: '192 reps B',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16'],
        recentReps: 192,
        prevReps: 144,
        windowMeanPerSession: 48,
        observedValues: [
          { id: 'recentReps', value: 192, unit: 'reps' },
          { id: 'prevReps', value: 144, unit: 'reps' },
          { id: 'windowMeanPerSession', value: 48, unit: 'reps' }
        ]
      }
    });
    const applied = applyParallelTrajectoryComposition([a, b], {
      voiceKey: 'month',
      window: { start: '2026-10-23', end: '2026-11-22' }
    });
    expect(applied.composedCount).toBe(1);
    const parent = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(parent.discovery.metrics.volumeBasis).toBe('window_total');
    expect(parent.discovery.metrics.trajectories[0].recentReps).toBe(192);
    expect(parent.discovery.metrics.trajectories[0].prevReps).toBe(96);
    expect(parent.discovery.metrics.trajectories[0].delta).toBe(96);
    expect(parent.discovery.metrics.trajectories[1].prevReps).toBe(144);
    expect(parent.discovery.body).toMatch(/192/);
    expect(parent.discovery.body).not.toMatch(/converg(?:ent|ent) vers environ 48 répétitions chacune(?!\/)/);
  });

  it('s’abstient de delta total si seule une moyenne est disponible', () => {
    const a = wrap({
      kind: 'disc_traj',
      title: 'Hyperextension : volume',
      body: 'mean only',
      nature: 'trajectory',
      informativeValue: 60,
      metrics: {
        exerciseId: '111',
        name: 'Hyperextension',
        dates: ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22'],
        windowMeanPerSession: 48,
        arcEarlyMean: 48,
        observedValues: [
          { id: 'windowMeanPerSession', value: 48, unit: 'reps' },
          { id: 'arcEarlyMean', value: 48, unit: 'reps' }
        ]
      }
    });
    const b = wrap({
      kind: 'disc_traj',
      title: 'Hyperextension : volume',
      body: 'mean only B',
      nature: 'trajectory',
      informativeValue: 60,
      metrics: {
        exerciseId: '222',
        name: 'Hyperextension',
        dates: ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'],
        windowMeanPerSession: 48,
        arcEarlyMean: 40,
        observedValues: [
          { id: 'windowMeanPerSession', value: 48, unit: 'reps' },
          { id: 'arcEarlyMean', value: 40, unit: 'reps' }
        ]
      }
    });
    const applied = applyParallelTrajectoryComposition([a, b], {
      voiceKey: 'month',
      window: { start: '2026-10-01', end: '2026-10-31' }
    });
    const parent = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(parent.discovery.metrics.volumeBasis).toBe('per_session_mean');
    expect(parent.discovery.metrics.trajectories[0].recentReps).toBeNull();
    expect(parent.discovery.body).toMatch(/\/séance|reps_per_session|répétitions\/séance/);
  });
});

describe('Mission 28 A — aspects parallèles non fusionnés', () => {
  it('recent30 et quarter restent non équivalents', () => {
    const recent = {
      kind: 'disc_composed_parallel_trajectories',
      title: 'Hyperextension : 2 trajectoires parallèles (~4 séances)',
      body: 'recent',
      metrics: {
        subjectKey: 'parallel:ex:1979012181+ex:703294235',
        analyticalAspect: 'span:recent30|sess:4|cal:abc',
        phenomenonKey: 'parallel|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:abc',
        name: 'Hyperextension'
      },
      phenomenonId: 'parallel|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:abc',
      id: 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:abc|2'
    };
    const quarter = {
      kind: 'disc_composed_parallel_trajectories',
      title: 'Hyperextension : 2 trajectoires parallèles (~8 séances)',
      body: 'quarter',
      metrics: {
        subjectKey: 'parallel:ex:1979012181+ex:703294235',
        analyticalAspect: 'span:quarter|sess:8|cal:def',
        phenomenonKey: 'parallel|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:def',
        name: 'Hyperextension'
      },
      phenomenonId: 'parallel|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:def',
      id: 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:def|2'
    };
    const eq = substantiveEquivalence(recent, quarter);
    expect(eq.equivalent).toBe(false);
    expect(eq.reason).toMatch(/distinct_parallel/);
    const mv = marginalValue(
      { discovery: recent, claim: { subject: { key: recent.metrics.subjectKey }, statement: recent.title } },
      [{ discovery: quarter, claim: { subject: { key: quarter.metrics.subjectKey }, statement: quarter.title } }]
    );
    expect(mv.overlap).toBe(0);
  });
});

describe('Mission 28 A — orphan parent réconcilié à la publication', () => {
  it('redirige ou détache un deepening dont le parent est absent', () => {
    const parentQuarter = {
      kind: 'disc_composed_parallel_trajectories',
      title: 'Hyperextension : 2 trajectoires parallèles (~8 séances)',
      body: 'quarter parent',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 80,
      id: 'parallel_traj|ex:A+ex:B|span:quarter|sess:8|cal:x|2',
      occurrenceId: 'parallel_traj|ex:A+ex:B|span:quarter|sess:8|cal:x|2',
      metrics: {
        subjectKey: 'parallel:ex:A+ex:B',
        parallelSubjects: ['ex:A', 'ex:B'],
        analyticalAspect: 'span:quarter|sess:8|cal:x',
        occurrenceId: 'parallel_traj|ex:A+ex:B|span:quarter|sess:8|cal:x|2',
        observedValues: [{ id: 'parallelCount', value: 2, unit: 'trajectories' }]
      },
      claim: {
        id: 'cq',
        statement: 'quarter',
        status: 'supported',
        subject: { key: 'parallel:ex:A+ex:B' },
        scope: { start: '2026-09-01', end: '2026-11-20' },
        proof: { observedValues: [{ id: 'parallelCount', value: 2 }], sourceEvents: [] }
      }
    };
    const child = {
      kind: 'disc_structural_memory',
      title: 'Hyperextension: 4 séances',
      body: 'child',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 28,
      id: 'disc_structural_memory|ex:A|dates:2026-10-30|aspect:default',
      occurrenceId: 'disc_structural_memory|ex:A|dates:2026-10-30|aspect:default',
      p6Disposition: 'deepening_of_collective',
      collapsedInto: 'parallel_traj|ex:A+ex:B|span:recent30|sess:4|cal:missing|2',
      hierarchyLink: {
        ok: true,
        reason: 'verified_parallel_storage_trajectories',
        proof: { parentId: 'parallel_traj|ex:A+ex:B|span:recent30|sess:4|cal:missing|2' }
      },
      metrics: {
        exerciseId: 'A',
        subjectKey: 'ex:A',
        observedValues: [{ id: 'recentReps', value: 192, unit: 'reps' }]
      },
      claim: {
        id: 'cc',
        statement: 'child',
        status: 'supported',
        subject: { key: 'ex:A' },
        scope: { start: '2026-10-01', end: '2026-11-20' },
        proof: { observedValues: [{ id: 'recentReps', value: 192 }], sourceEvents: [] }
      }
    };

    const p6 = {
      counters: { reconciled: true },
      priority: [parentQuarter],
      reserve: [child],
      sources: [],
      blocked: []
    };
    const out = insightsFromP6(p6, { period: '3m' });
    const published = [
      ...(out.shortTerm || []),
      ...(out.mediumTerm || []),
      ...(out.longTerm || []),
      ...(out.accessibleReserve || [])
    ];
    const publishedChild = published.find((c) => String(c.id).includes('structural_memory'));
    expect(publishedChild).toBeTruthy();
    if (publishedChild.parentId) {
      expect(published.some((c) => c.id === publishedChild.parentId)).toBe(true);
    } else {
      expect(publishedChild.hierarchyLink).toBeFalsy();
    }
    const auditLike = {
      cardRegistry: Object.fromEntries(
        published.map((c) => [`3m|${c.id}`, { ...c, period: '3m', role: c.disposition === 'priority' ? 'priority' : 'reserve' }])
      ),
      claimRegistry: Object.fromEntries(published.map((c) => [`3m|${c.id}`, c.claim || { id: c.id }])),
      candidateRegistry: {},
      factRegistry: {},
      periods: { '3m': { publicationAuthority: 'p6', cardRefs: published.map((c) => `3m|${c.id}`), accessibleCount: published.length, reconciledStrict: true } },
      diagnostics: { cardClaimDivergenceCount: 0 }
    };
    const v = validateAnalyticalAudit(auditLike);
    expect(v.integrityValidation.errors.filter((e) => e.startsWith('orphan_parent'))).toEqual([]);
  });
});

describe('Mission 28 A — registre publications mémoire', () => {
  it('appendPublication incrémente le registre', () => {
    let mem = emptyAnalyticalMemory();
    mem = appendPublication(mem, notePublication({ signature: 'sig1', ids: ['p1'], period: '7d' }));
    expect(mem.publications.length).toBe(1);
    mem = appendPublication(mem, { signature: 'sig2', ids: ['p2'], period: '30d' });
    expect(mem.publications.length).toBe(2);
  });
});
