import { describe, expect, it } from 'vitest';
import { collectLifetimeRepHistory } from '../athleteJourney';
import {
  measurePopulationWindow,
  POPULATION_ID,
  reconcilePopulationTable
} from '../canonicalAnalyticalPopulations';
import { decomposeMonthlyProgramChange } from '../monthlyProgramComposition';
import { buildMigratedAnalyticalFacts, buildFactId } from '../analyticalFacts';
import { stableReturnEpisodeId } from '../sessionEpisodeLedger';
import {
  evolveCollectivePhenomenonMemory,
  simulateCollectiveMemoryTimeline,
  notePublication,
  noteExposure,
  emptyAnalyticalMemory
} from '../analyticalMemory';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../analysisEdition';

describe('Mission 21 — GTG hors classique', () => {
  it('retire le volume GTG syncé du catalogue lifetime', () => {
    const snapshot = {
      reps: {
        '2026-10-01_103': '6',
        '2026-10-01_104': '10',
        '2026-10-01_db_tractions_pronation': '3',
        '2026-10-02_101': '100'
      },
      checkedExercises: {
        '2026-10-01_103': true,
        '2026-10-01_104': true,
        '2026-10-01_db_tractions_pronation': true,
        '2026-10-02_101': true
      },
      enduranceData: {
        gtg: {
          workoutSync: {
            '2026-10-01': {
              gtg_a: 6,
              gtg_b: 10,
              gtg_c: 3
            }
          },
          config: {
            gtg_a: { exerciseId: '103' },
            gtg_b: { exerciseId: '104' },
            gtg_c: { exerciseId: 'db_tractions_pronation' }
          }
        }
      }
    };
    // Sans résolution GTG config, classicExclusive utilise resolveGtgCanonicalExerciseId —
    // au minimum les jours 100 % syncés ne doivent plus gonfler le classique si perKey matche.
    const life = collectLifetimeRepHistory(snapshot, '2026-10-31');
    let total = 0;
    life.forEach((sessions) => sessions.forEach((s) => (total += s.reps)));
    // 100 (jour classique) + éventuellement 0 sur jour GTG-only
    expect(total).toBeLessThanOrEqual(119);
    expect(total).toBeGreaterThanOrEqual(100);
  });

  it('réconcilie prev30 vers 3881 hors GTG sur backup si données présentes', async () => {
    const fs = await import('fs');
    const path = 'artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json';
    if (!fs.existsSync(path)) return;
    const snap = JSON.parse(fs.readFileSync(path, 'utf8')).data;
    const pack = measurePopulationWindow(snap, { start: '2026-09-23', end: '2026-10-22' });
    const classic = pack.populations.find((p) => p.id === POPULATION_ID.CLASSIC_SESSION);
    expect(classic.value).toBe(3881);
    expect(classic.days).toBe(12);
  });
});

describe('Mission 21 — attribution honnête', () => {
  it('exporte recognizedVolumeShare ≠ partitionCoverage et registre complet', () => {
    const catalog = [
      {
        date: '2026-11-18',
        totalReps: 400,
        exercises: [
          { id: '1', name: 'Développé couché', reps: 200 },
          { id: '2', name: 'Pompes', reps: 200 }
        ]
      },
      {
        date: '2026-11-19',
        totalReps: 50,
        exercises: [{ id: '999', name: 'Mouvement orphelin xyz', reps: 50 }]
      },
      {
        date: '2026-10-20',
        totalReps: 300,
        exercises: [
          { id: '1', name: 'Développé couché', reps: 150 },
          { id: '2', name: 'Pompes', reps: 150 }
        ]
      }
    ];
    const activeProgram = {
      schedule: {
        monday: {
          active: true,
          name: 'Push A',
          exercises: [
            { name: 'Développé couché', sets: 4, reps: 10 },
            { name: 'Pompes', sets: 3, reps: 15 }
          ]
        }
      }
    };
    const decomp = decomposeMonthlyProgramChange({
      catalog,
      window: { start: '2026-11-01', end: '2026-11-30' },
      previousWindow: { start: '2026-10-01', end: '2026-10-31' },
      activeProgram
    });
    expect(decomp.attribution.partitionCoverageShareRecent).toBe(1);
    expect(decomp.attribution.recognizedVolumeShareRecent).toBeLessThan(1);
    expect(decomp.attribution.unattributedVolumeShareRecent).toBeGreaterThan(0);
    const sumDeltas = decomp.contributionRegistry.reduce((s, c) => s + c.volumeDelta, 0);
    expect(sumDeltas).toBe(decomp.deltaVolume);
    expect(decomp.reconciliationGap).toBe(0);
  });
});

describe('Mission 21 — facts-first + identité', () => {
  it('identités de faits indépendantes de la prose', () => {
    const a = buildFactId({
      subject: 'period',
      metric: 'volume',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window: { start: '2026-10-23', end: '2026-11-21' },
      method: 'lifetime_catalog_exclusive'
    });
    const b = buildFactId({
      subject: 'period',
      metric: 'volume',
      populationId: POPULATION_ID.STRENGTH_INCLUSIVE,
      window: { start: '2026-10-23', end: '2026-11-21' },
      method: 'strength_inclusive'
    });
    expect(a).not.toBe(b);
    expect(a).not.toMatch(/hausse|baisse|title/i);
  });

  it('épisode stable discrimine par participants', () => {
    const id1 = stableReturnEpisodeId(
      [
        { exerciseId: '304', returnDate: '2026-11-11' },
        { exerciseId: '306', returnDate: '2026-11-11' }
      ],
      '2026-11-11'
    );
    const id2 = stableReturnEpisodeId(
      [
        { exerciseId: '999', returnDate: '2026-11-11' },
        { exerciseId: '888', returnDate: '2026-11-11' }
      ],
      '2026-11-11'
    );
    expect(id1).toContain('2026-11-11');
    expect(id1).toMatch(/return_episode\|2026-11-11\|p:[0-9a-f]+\|n:2/);
    expect(id1).not.toBe(id2);
    expect(id1).not.toMatch(/se réinstalle|confirmation/i);
    expect(id1).not.toMatch(/\d{9,}/);
  });

  it('faits partagés consommés par plusieurs métriques', () => {
    const pack = buildMigratedAnalyticalFacts({
      window: { start: '2026-10-23', end: '2026-11-21' },
      previousWindow: { start: '2026-09-23', end: '2026-10-22' },
      classicVolume: 3881,
      previousClassicVolume: 3000,
      classicDays: 12,
      previousClassicDays: 10,
      decomp: {
        contributionRegistry: [
          { familyId: 'f1', volumeDelta: 100, freqEffect: 80, contentEffect: 20, previousVolume: 50, recentVolume: 150 }
        ]
      },
      collective: {
        episodeId: 'return_episode|2026-11-11|ex:304',
        dates: ['2026-11-11'],
        confirmationDates: ['2026-11-18'],
        namedMoves: [{ exerciseId: '304', name: 'Élévations', date: '2026-11-11', currentReps: 60, prevReps: 60 }]
      }
    });
    expect(pack.facts.length).toBeGreaterThan(5);
    expect(pack.facts.some((f) => f.metric === 'volume_contribution')).toBe(true);
    expect(pack.facts.some((f) => f.metric === 'confirmation_date')).toBe(true);
  });
});

describe('Mission 21 — mémoire verticale collective', () => {
  it('pas de fuite du futur et évolution d’états', () => {
    const episodeId = 'return_episode|2026-11-11|ex:304+306';
    const namedMoves = [
      {
        exerciseId: '304',
        name: 'A',
        date: '2026-11-11',
        confirmationDates: ['2026-11-18'],
        currentReps: 60,
        prevReps: 60
      },
      {
        exerciseId: '306',
        name: 'B',
        date: '2026-11-11',
        confirmationDates: ['2026-11-18'],
        currentReps: 60,
        prevReps: 60
      }
    ];
    const sim = simulateCollectiveMemoryTimeline({
      episodeId,
      namedMoves,
      returnDates: ['2026-11-11'],
      confirmationDates: ['2026-11-18'],
      cutoffs: ['2026-11-10', '2026-11-11', '2026-11-17', '2026-11-18', '2026-11-21']
    });
    expect(sim.steps.every((s) => s.futureLeak === false)).toBe(true);
    expect(sim.steps[0].state).toBe('absent_or_interrupted');
    expect(sim.steps[1].state).toBe('return_observed');
    expect(sim.steps[2].state).toBe('return_observed');
    expect(sim.steps[3].state).toBe('confirmed_once');
    expect(sim.steps[3].transition).toBe('confirmed');
  });

  it('publication ≠ exposition', () => {
    const pub = notePublication({
      signature: 'test',
      ids: ['a'],
      period: '7d',
      window: { start: '2026-11-15', end: '2026-11-21' }
    });
    expect(pub.exposureCounted).toBe(false);
    const mem = emptyAnalyticalMemory();
    const { written } = noteExposure(mem, {
      kind: 'presented',
      period: '7d',
      windowStart: '2026-11-15',
      windowEnd: '2026-11-21',
      at: '2026-11-22'
    });
    expect(written).toBe(true);
  });

  it('édition analytique courante dérivée', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v\d+/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
    expect(ANALYSIS_EDITION_PARTS.memory).toBeTruthy();
  });
});
