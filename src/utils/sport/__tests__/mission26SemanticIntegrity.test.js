/**
 * Mission 26 — intégrité sémantique (faux parallèles, référentiels, hiérarchie).
 */
import { describe, expect, it } from 'vitest';
import {
  applyParallelTrajectoryComposition,
  findParallelTrajectoryClusters,
  isConcreteStorageSubject
} from '../parallelTrajectoryComposition';
import { applyP6 } from '../p6Pipeline';
import { insightsFromP6 } from '../p6Publication';
import { justifyParentChildLink } from '../hierarchyLink';
import { composeCollectiveReturnReading } from '../phenomenonComposition';
import {
  loadAnalyticalMemory,
  saveAnalyticalMemory,
  freezeAnalyticalMemorySnapshot,
  emptyAnalyticalMemory,
  upsertPhenomenon
} from '../analyticalMemory';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';

function wrapRow(discovery, claimExtras = {}) {
  const claim = {
    id: `c:${discovery.metrics?.exerciseId || discovery.id}`,
    statement: discovery.title,
    status: 'supported',
    scope: { start: '2026-08-01', end: '2026-11-20' },
    ...claimExtras
  };
  return {
    discovery: { ...discovery, claim },
    claim,
    wasPriority: true
  };
}

describe('Mission 26 — édition', () => {
  it('bumpe editorial / selection / hierarchy / memory', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.selection).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.hierarchy).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.memory).toBeTruthy();
  });
});

describe('Mission 26 A1 — faux parallèle même exercice', () => {
  it('refuse deux producteurs du même stockage 504', () => {
    const emergence = wrapRow({
      kind: 'disc_emergence',
      title: 'Pompes déclinées : rythme stable',
      body: 'Même corps de trajectoire.',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 70,
      metrics: {
        exerciseId: '504',
        name: 'Pompes déclinées',
        dates: [
          '2026-08-28',
          '2026-09-11',
          '2026-09-18',
          '2026-10-02',
          '2026-10-30',
          '2026-11-06',
          '2026-11-13',
          '2026-11-20'
        ],
        totalReps: 240
      }
    });
    const progress = wrapRow({
      kind: 'disc_exercise_progress',
      title: 'Pompes déclinées : rythme stable',
      body: 'Même corps de trajectoire.',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 72,
      metrics: {
        exerciseId: '504',
        name: 'Pompes déclinées',
        dates: [
          '2026-08-28',
          '2026-09-11',
          '2026-09-18',
          '2026-10-02',
          '2026-10-30',
          '2026-11-06',
          '2026-11-13',
          '2026-11-20'
        ],
        totalReps: 240
      }
    });
    const clusters = findParallelTrajectoryClusters([emergence, progress]);
    expect(clusters.length).toBe(0);
    const applied = applyParallelTrajectoryComposition([emergence, progress]);
    expect(applied.composedCount).toBe(0);
    expect(applied.rejectedSameSubject.length).toBeGreaterThan(0);
    expect(applied.rejectedSameSubject[0].subject).toBe('ex:504');
  });

  it('accepte deux sujets distincts, même intitulé', () => {
    const a = wrapRow({
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'Trajectoire A',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 80,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10'],
        totalReps: 192,
        prevReps: 144
      }
    });
    const b = wrapRow({
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'Trajectoire B',
      nature: 'trajectory',
      family: 'repertoire',
      informativeValue: 80,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11'],
        totalReps: 192,
        prevReps: 96
      }
    });
    const applied = applyParallelTrajectoryComposition([a, b], { voiceKey: 'month' });
    expect(applied.composedCount).toBe(1);
    const parent = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(parent).toBeTruthy();
    expect(parent.claim?.proof?.sourceEvents?.length).toBeGreaterThan(0);
    // Mission 27 — ids techniques hors prose utilisateur ; présents dans preuves/metrics
    expect(parent.discovery.body).not.toMatch(/703294235|1979012181/);
    expect(parent.discovery.body).toMatch(/192/);
    expect(parent.discovery.metrics.parallelSubjects).toEqual(
      expect.arrayContaining(['ex:703294235', 'ex:1979012181'])
    );
    expect(parent.claim.subject?.key).toMatch(/^parallel:/);
    expect(parent.discovery.metrics.observationWindow?.start).toBeTruthy();
  });

  it('n’absorbe pas des trajectoires divergentes', () => {
    const a = wrapRow({
      kind: 'disc_traj',
      title: 'Squat : rythme stable',
      body: 'A',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '1',
        name: 'Squat',
        dates: ['2026-11-01', '2026-11-08'],
        totalReps: 200
      }
    });
    const b = wrapRow({
      kind: 'disc_traj',
      title: 'Squat : rythme stable',
      body: 'B',
      nature: 'trajectory',
      informativeValue: 70,
      metrics: {
        exerciseId: '2',
        name: 'Squat',
        dates: ['2026-11-02', '2026-11-09'],
        totalReps: 40
      }
    });
    expect(applyParallelTrajectoryComposition([a, b]).composedCount).toBe(0);
  });

  it('applyP6 reste réconcilié sans faux parallèle 504', () => {
    const all = [
      {
        kind: 'disc_emergence',
        title: 'Pompes déclinées : rythme stable',
        body: 'Corps commun',
        evidence: 'ev',
        nature: 'trajectory',
        family: 'repertoire',
        informativeValue: 70,
        metrics: {
          exerciseId: '504',
          name: 'Pompes déclinées',
          dates: ['2026-10-02', '2026-10-30', '2026-11-06', '2026-11-13'],
          totalReps: 200,
          windowStart: '2026-08-01',
          windowEnd: '2026-11-20',
          observedValues: [{ id: 'totalReps', value: 200, unit: 'reps' }]
        }
      },
      {
        kind: 'disc_exercise_progress',
        title: 'Pompes déclinées : rythme stable',
        body: 'Corps commun',
        evidence: 'ev',
        nature: 'trajectory',
        family: 'repertoire',
        informativeValue: 70,
        metrics: {
          exerciseId: '504',
          name: 'Pompes déclinées',
          dates: ['2026-10-02', '2026-10-30', '2026-11-06', '2026-11-13'],
          totalReps: 200,
          windowStart: '2026-08-01',
          windowEnd: '2026-11-20',
          observedValues: [{ id: 'totalReps', value: 200, unit: 'reps' }]
        }
      },
      {
        kind: 'disc_traj',
        title: 'Gainage : tenue stable',
        body: 'Autre',
        evidence: 'ev',
        nature: 'trajectory',
        informativeValue: 60,
        metrics: {
          exerciseId: '99',
          name: 'Gainage',
          dates: ['2026-11-01', '2026-11-08'],
          totalReps: 40,
          windowStart: '2026-08-01',
          windowEnd: '2026-11-20',
          observedValues: [{ id: 'totalReps', value: 40, unit: 'reps' }]
        }
      }
    ];
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-08-01', end: '2026-11-20' },
      voiceKey: 'quarter'
    });
    expect(p6.counters.reconciled).toBe(true);
    expect(p6.counters.composedParallel || 0).toBe(0);
    const insights = insightsFromP6(p6, { period: '3m' });
    expect(insights.publicationAuthority).toBe('p6');
    const parallelPublished = [
      ...(insights.shortTerm || []),
      ...(insights.mediumTerm || []),
      ...(insights.longTerm || [])
    ].filter((c) => String(c.kind || '').includes('parallel'));
    expect(parallelPublished.length).toBe(0);
  });
});

describe('Mission 26 A3 — portée temporelle', () => {
  it('marque temporalMismatch sur horizon long avec preuves récentes', () => {
    const a = wrapRow({
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'A',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '703294235',
        name: 'Hyperextension',
        dates: ['2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10'],
        totalReps: 192,
        prevReps: 144
      }
    });
    const b = wrapRow({
      kind: 'disc_traj',
      title: 'Hyperextension : rythme stable',
      body: 'B',
      nature: 'trajectory',
      informativeValue: 80,
      metrics: {
        exerciseId: '1979012181',
        name: 'Hyperextension',
        dates: ['2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11'],
        totalReps: 192,
        prevReps: 96
      }
    });
    const applied = applyParallelTrajectoryComposition([a, b], { voiceKey: '1y' });
    const parent = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(parent.discovery.metrics.temporalMismatch).toBe(true);
    expect(parent.discovery.body).toMatch(/horizon long|fenêtre d’observation récente/i);
    expect(parent.wasPriority).toBe(false);
  });
});

describe('Mission 26 B1 — référentiels concurrent', () => {
  it('distingue dernière séance avant gap et niveau habituel', () => {
    const reading = composeCollectiveReturnReading({
      namedMoves: [
        { name: 'Élévations', exerciseId: '1', prevReps: 60, currentReps: 60, gapDays: 21 },
        { name: 'Face pull', exerciseId: '2', prevReps: 60, currentReps: 60, gapDays: 21 },
        {
          name: 'Kickbacks',
          exerciseId: '3',
          prevReps: 48,
          currentReps: 48,
          habitualReps: 60,
          gapDays: 21
        },
        {
          name: 'Extension triceps',
          exerciseId: '4',
          prevReps: 42,
          currentReps: 42,
          habitualReps: 48,
          gapDays: 21
        }
      ],
      dates: ['2026-11-11'],
      confirmationDates: ['2026-11-18'],
      families: ['triceps', 'épaule'],
      sessionFamilyLinked: true,
      readingMode: 'confirmation'
    });
    expect(reading.conclusion).toMatch(/dernière séance avant interruption/i);
    expect(reading.conclusion).toMatch(/niveau habituel/i);
    expect(reading.conclusion).toMatch(/Kickbacks/i);
    expect(reading.stats.referenceKind).toBe('last_before_gap');
    expect(reading.stats.habitualShortfallCount).toBe(2);
  });
});

describe('Mission 26 B2 — ancre temporelle hiérarchie', () => {
  it('ne rattache pas un enfant via le nuage de dates historiques', () => {
    const parent = {
      discovery: {
        kind: 'disc_collective_return',
        title: 'Reprise collective',
        metrics: {
          returnDate: '2026-11-11',
          confirmationDates: ['2026-11-18'],
          namedMoves: [
            { exerciseId: '304', name: 'Élévations', date: '2026-11-11' },
            { exerciseId: '505', name: 'Kickbacks', date: '2026-11-11' }
          ]
        }
      }
    };
    const child = {
      discovery: {
        kind: 'disc_ms_return',
        title: 'Kickbacks',
        metrics: {
          exerciseId: '505',
          name: 'Kickbacks',
          // Nuage historique — ne doit PAS créer minGap=1 avec le parent du 11
          dates: ['2026-11-01', '2026-11-08', '2026-11-11'],
          returnDate: '2026-10-01'
        }
      }
    };
    const link = justifyParentChildLink(parent, child, { maxEpisodeGapDays: 45 });
    // returnDate enfant 2026-10-01 vs parent 2026-11-11 → gap ~41 : borderline
    // Avec ancres seules (sans cloud), gap = |11-01| jours depuis returnDate octobre
    expect(link.proof?.minGap == null || link.proof.minGap > 1).toBe(true);
  });
});

describe('Mission 26 C2 — mémoire persistante profil isolé', () => {
  it('survit à deux sessions save/load sans purge', () => {
    const profile = `m26-test-${Date.now()}`;
    const store = globalThis.localStorage;
    if (!store) {
      // jsdom fournit localStorage dans vitest
      expect(store).toBeTruthy();
      return;
    }
    const key = `momentum.analyticalMemory.v1:${profile}`;
    store.removeItem(key);

    let mem = { ...emptyAnalyticalMemory(), profile };
    mem = upsertPhenomenon(mem, {
      id: 'phen:collective:nov11',
      state: 'return_observed',
      phenomenon: 'collective_return',
      updatedAt: '2026-11-11T12:00:00Z',
      lastConclusion: 'Reprise collective'
    });
    expect(saveAnalyticalMemory(mem)).toBe(true);

    const session2 = loadAnalyticalMemory(profile);
    expect(Object.keys(session2.phenomena).length).toBe(1);
    expect(session2.phenomena['phen:collective:nov11'].state).toBe('return_observed');

    const freeze = freezeAnalyticalMemorySnapshot(session2);
    expect(Object.keys(freeze.phenomena).length).toBe(1);

    // Exposition seule ne doit pas effacer
    const exposureOnly = {
      ...emptyAnalyticalMemory(),
      profile,
      phenomena: {},
      exposures: [{ id: 'exp1', at: '2026-11-22' }]
    };
    saveAnalyticalMemory(exposureOnly);
    const afterExposure = loadAnalyticalMemory(profile);
    expect(afterExposure.phenomena['phen:collective:nov11']).toBeTruthy();
    expect(afterExposure.exposures.length).toBeGreaterThan(0);

    store.removeItem(key);
  });
});

describe('Mission 26 helpers', () => {
  it('isConcreteStorageSubject', () => {
    expect(isConcreteStorageSubject('ex:504')).toBe(true);
    expect(isConcreteStorageSubject('period:activity')).toBe(false);
    expect(isConcreteStorageSubject('name:foo')).toBe(false);
  });
});
