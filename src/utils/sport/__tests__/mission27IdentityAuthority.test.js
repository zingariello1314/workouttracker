/**
 * Mission 27 — identités canoniques, faits de composition, mémoire profil.
 */
import { describe, expect, it } from 'vitest';
import {
  applyParallelTrajectoryComposition,
  findParallelTrajectoryClusters
} from '../parallelTrajectoryComposition';
import { resolveAnalyticalMemoryProfile, loadAnalyticalMemory, saveAnalyticalMemory, emptyAnalyticalMemory, upsertPhenomenon } from '../analyticalMemory';
import { justifyParentChildLink } from '../hierarchyLink';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { validateAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { applyP6 } from '../p6Pipeline';
import { insightsFromP6 } from '../p6Publication';

function wrap(discovery) {
  const claim = {
    id: `c:${discovery.metrics?.exerciseId}`,
    statement: discovery.title,
    status: 'supported',
    scope: { start: '2026-08-01', end: '2026-11-20' },
    proof: {
      observedValues: discovery.metrics?.observedValues || [],
      sourceEvents: []
    }
  };
  return { discovery: { ...discovery, claim }, claim, wasPriority: true };
}

describe('Mission 27 — édition', () => {
  it('bumpe parties identité / mémoire / sélection', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.selection).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.memory).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.claim).toBe('assertion-window-v3');
  });
});

describe('Mission 27 A1 — collision Hyperextension évitée', () => {
  it('deux dimensions (calendriers distincts) → deux conclusionKey', () => {
    const volumeA = wrap({
      kind: 'disc_exercise_progress',
      title: 'Hyperextension : volume par séance stable',
      body: 'Vol A',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-09-01', '2026-09-15', '2026-10-01', '2026-10-15', '2026-11-01', '2026-11-08', '2026-11-15', '2026-11-20'],
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
    const volumeB = wrap({
      kind: 'disc_exercise_progress',
      title: 'Hyperextension : volume par séance stable',
      body: 'Vol B',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-09-02', '2026-09-16', '2026-10-02', '2026-10-16', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-21'],
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
    const structA = wrap({
      kind: 'disc_traj',
      title: 'Hyperextension : 4 séances sur ces 30 jours',
      body: 'Struct A',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-10-24', '2026-11-01', '2026-11-08', '2026-11-15'],
        recentReps: 180,
        windowMeanPerSession: 45,
        observedValues: [
          { id: 'recentReps', value: 180, unit: 'reps' },
          { id: 'windowMeanPerSession', value: 45, unit: 'reps' }
        ]
      }
    });
    const structB = wrap({
      kind: 'disc_traj',
      title: 'Hyperextension : 4 séances sur ces 30 jours',
      body: 'Struct B',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-10-25', '2026-11-02', '2026-11-09', '2026-11-16'],
        recentReps: 180,
        windowMeanPerSession: 45,
        observedValues: [
          { id: 'recentReps', value: 180, unit: 'reps' },
          { id: 'windowMeanPerSession', value: 45, unit: 'reps' }
        ]
      }
    });

    const applied = applyParallelTrajectoryComposition(
      [volumeA, volumeB, structA, structB],
      { voiceKey: 'quarter', window: { start: '2026-08-23', end: '2026-11-22' } }
    );
    expect(applied.composedCount).toBe(2);
    const parents = applied.rows.filter(
      (r) => r.discovery?.kind === 'disc_composed_parallel_trajectories'
    );
    const ids = parents.map((p) => p.discovery.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id) => id.includes('span:'))).toBe(true);
    // Pas de fusion vers soi
    parents.forEach((p) => {
      expect(p.discovery.collapsedInto).not.toBe(p.discovery.id);
    });
  });

  it('remonte les volumes structurés (pas « non chiffré »)', () => {
    const a = wrap({
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'A',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10'],
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
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'B',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11'],
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
    const applied = applyParallelTrajectoryComposition([a, b], { voiceKey: 'month' });
    const parent = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(parent.discovery.body).toMatch(/192/);
    expect(parent.discovery.body).not.toMatch(/non chiffré/);
    expect(parent.discovery.body).not.toMatch(/1979012181/);
    expect(parent.claim.proof.observedValues.some((v) => v.id.startsWith('recentReps:') && v.value === 192)).toBe(
      true
    );
    expect(parent.claim.proof.observedValues.some((v) => v.id.startsWith('prevReps:'))).toBe(true);
  });
});

describe('Mission 27 A2 — invariants graphe', () => {
  it('détecte self_fusion et orphan_parent', () => {
    const doc = {
      schema: 'momentum.analyticalAudit.v2',
      manifest: { edition: 'test' },
      cardRegistry: {
        '3m|parent-a': {
          id: 'parent-a',
          role: 'priority',
          period: '3m',
          title: 'P',
          claimId: 'c1',
          collapsedInto: 'parent-a'
        },
        '3m|child-b': {
          id: 'child-b',
          role: 'reserve',
          period: '3m',
          title: 'C',
          claimId: 'c2',
          parentId: 'missing-parent',
          hierarchyLink: { ok: true }
        }
      },
      claimRegistry: {
        c1: { id: 'c1', period: '3m', scope: { end: '2026-11-20' } },
        c2: { id: 'c2', period: '3m', scope: { end: '2026-11-20' } }
      },
      candidateRegistry: {},
      factRegistry: {},
      periods: {}
    };
    const v = validateAnalyticalAudit(doc);
    expect(v.integrityValidation.ok).toBe(false);
    expect(v.errors.some((e) => e.startsWith('self_fusion'))).toBe(true);
    expect(v.errors.some((e) => e.startsWith('orphan_parent'))).toBe(true);
  });
});

describe('Mission 27 A3 — temporalité claim', () => {
  it('ne confond pas présentation et observation', () => {
    const card = {
      id: 'p1',
      metrics: {
        windowEnd: '2026-11-22',
        observationWindow: { end: '2026-11-20' },
        presentationWindow: { end: '2026-11-22' },
        observedValues: [{ id: 'meanReps', value: 10 }]
      }
    };
    const claim = {
      scope: {
        end: '2026-11-20',
        observationWindow: { end: '2026-11-20' },
        presentationWindow: { end: '2026-11-22' }
      },
      proof: { observedValues: [{ id: 'meanReps', value: 10 }] }
    };
    expect(validateCardClaimConsistency(card, claim).ok).toBe(true);
  });
});

describe('Mission 27 B3 — prior episode', () => {
  it('refuse deepening si ancre enfant antérieure au collectif', () => {
    const parent = {
      discovery: {
        kind: 'disc_collective_return',
        metrics: {
          returnDate: '2026-11-11',
          confirmationDates: ['2026-11-18'],
          namedMoves: [{ exerciseId: '505', name: 'Kickbacks', date: '2026-11-11' }]
        }
      }
    };
    const child = {
      discovery: {
        kind: 'disc_ms_return',
        metrics: {
          exerciseId: '505',
          name: 'Kickbacks',
          returnDate: '2026-11-01',
          date: '2026-11-01'
        }
      }
    };
    const link = justifyParentChildLink(parent, child, { maxEpisodeGapDays: 45 });
    expect(link.ok).toBe(false);
    expect(link.reason).toBe('prior_episode_not_deepening');
  });
});

describe('Mission 27 C — profil mémoire', () => {
  it('resolveAnalyticalMemoryProfile évite u:u:', () => {
    expect(resolveAnalyticalMemoryProfile('u:abc')).toBe('u:abc');
    expect(resolveAnalyticalMemoryProfile('abc')).toBe('u:abc');
    expect(resolveAnalyticalMemoryProfile('guest')).toBe('local');
    expect(resolveAnalyticalMemoryProfile(null)).toBe('local');
  });

  it('save/load sur la même clé résolue', () => {
    const profile = resolveAnalyticalMemoryProfile(`m27-${Date.now()}`);
    const store = globalThis.localStorage;
    expect(store).toBeTruthy();
    store.removeItem(`momentum.analyticalMemory.v1:${profile}`);
    let mem = { ...emptyAnalyticalMemory(), profile };
    mem = upsertPhenomenon(mem, {
      id: 'phen:test',
      state: 'confirmed_once',
      phenomenon: 'collective_return'
    });
    expect(saveAnalyticalMemory(mem)).toBe(true);
    const loaded = loadAnalyticalMemory(profile);
    expect(loaded.phenomena['phen:test']?.state).toBe('confirmed_once');
    store.removeItem(`momentum.analyticalMemory.v1:${profile}`);
  });
});

describe('Mission 27 — applyP6 sans collision parallèle', () => {
  it('deux clusters distincts restent publiables avec claims', () => {
    const mk = (id, dates, reps, prev, title) => ({
      kind: 'disc_traj',
      title,
      body: `body ${id}`,
      evidence: 'ev',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 75,
      metrics: {
        exerciseId: id,
        name: 'Hyperextension',
        dates,
        windowMeanPerSession: reps,
        prevReps: prev,
        windowStart: '2026-08-23',
        windowEnd: '2026-11-22',
        observedValues: [{ id: 'windowMeanPerSession', value: reps, unit: 'reps' }]
      }
    });
    const all = [
      mk('1979012181', ['2026-09-01', '2026-09-15', '2026-10-01', '2026-10-15', '2026-11-01', '2026-11-08', '2026-11-15', '2026-11-20'], 192, 96, 'Hyperextension : volume stable'),
      mk('703294235', ['2026-09-02', '2026-09-16', '2026-10-02', '2026-10-16', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-21'], 192, 144, 'Hyperextension : volume stable'),
      mk('1979012181', ['2026-10-24', '2026-11-01', '2026-11-08', '2026-11-15'], 180, 160, 'Hyperextension : 4 séances'),
      mk('703294235', ['2026-10-25', '2026-11-02', '2026-11-09', '2026-11-16'], 180, 160, 'Hyperextension : 4 séances')
    ];
    // Deduplicate by making second pair different titles already
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-08-23', end: '2026-11-22' },
      voiceKey: 'quarter'
    });
    expect(p6.counters.reconciled).toBe(true);
    const insights = insightsFromP6(p6, { period: '3m' });
    expect(insights.publicationAuthority).toBe('p6');
    const parallelIds = [
      ...(insights.shortTerm || []),
      ...(insights.mediumTerm || []),
      ...(insights.longTerm || []),
      ...(insights.accessibleReserve || [])
    ]
      .filter((c) => String(c.kind || '').includes('parallel'))
      .map((c) => c.id);
    expect(new Set(parallelIds).size).toBe(parallelIds.length);
  });
});
