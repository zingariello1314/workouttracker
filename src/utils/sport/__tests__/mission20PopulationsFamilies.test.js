import { describe, expect, it } from 'vitest';
import {
  POPULATION_ID,
  measurePopulationWindow,
  reconcilePopulationTable,
  canonicalVolumeFor
} from '../canonicalAnalyticalPopulations';
import {
  decomposeMonthlyProgramChange,
  discoveryFromMonthlyComposition,
  titleForFamilyVolumeDecomposition
} from '../monthlyProgramComposition';
import { draftFromClaim } from '../draftFromClaim';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import { claimFromDiscovery } from '../analyticalClaim';

describe('Mission 20 — populations canoniques', () => {
  const snapshot = {
    reps: {
      '2026-10-24_101': '100',
      '2026-10-24_complementary_endurance_pushups': '100',
      '2026-10-25_102': '200',
      '2026-11-10_201': '150'
    },
    checkedExercises: {
      '2026-10-24_101': true,
      '2026-10-24_complementary_endurance_pushups': true,
      '2026-10-25_102': true,
      '2026-11-10_201': true
    },
    enduranceData: {
      sessions: {
        pushups: [{ date: '2026-11-17', reps: 100, count: 100 }]
      },
      gtg: { workoutSync: {} }
    }
  };

  it('distingue classique, inclusif et complémentaire', () => {
    const pack = measurePopulationWindow(snapshot, {
      start: '2026-10-23',
      end: '2026-11-21'
    });
    expect(pack.ok).toBe(true);
    const byId = Object.fromEntries(pack.populations.map((p) => [p.id, p]));
    expect(byId[POPULATION_ID.COMPLEMENTARY_SYNCED].value).toBe(100);
    expect(byId[POPULATION_ID.ENDURANCE_UNSYNCED].value).toBe(100);
    expect(byId[POPULATION_ID.CLASSIC_SESSION].value).toBe(450);
    // classique 450 + complémentaire sync 100 + défi unsync 100
    expect(byId[POPULATION_ID.STRENGTH_INCLUSIVE].value).toBe(650);
    expect(canonicalVolumeFor('family_composition')).toBe(POPULATION_ID.CLASSIC_SESSION);
    expect(canonicalVolumeFor('general_volume')).toBe(POPULATION_ID.STRENGTH_INCLUSIVE);
  });

  it('produit une table de réconciliation réutilisable', () => {
    const table = reconcilePopulationTable(
      snapshot,
      { start: '2026-10-23', end: '2026-11-21' },
      { start: '2026-09-23', end: '2026-10-22' }
    );
    expect(table.ok).toBe(true);
    expect(table.steps.length).toBeGreaterThanOrEqual(4);
    expect(table.identityCheck.partsMatchInclusive).toBe(true);
  });
});

describe('Mission 20 — familles et direction', () => {
  it('titre suit le signe du delta (pas de hausse hardcodée)', () => {
    expect(titleForFamilyVolumeDecomposition({ direction: 'down', deltaVolume: -700 })).toMatch(
      /baisse/i
    );
    expect(titleForFamilyVolumeDecomposition({ direction: 'up', deltaVolume: 800 })).toMatch(
      /hausse/i
    );
    const disc = discoveryFromMonthlyComposition({
      ok: true,
      direction: 'down',
      deltaVolume: -756,
      recent: { volume: 1240, trainingDays: 4 },
      previous: { volume: 1996, trainingDays: 6 },
      drivers: [
        {
          familyName: 'Push',
          volumeDelta: -400,
          evolution: 'frequency_down',
          previousDays: 3,
          recentDays: 1,
          freqEffect: -200,
          contentEffect: -200
        }
      ],
      conclusion: 'Le volume classique passe de 1996 à 1240 répétitions.',
      attribution: { recentShare: 0.8 },
      populationId: POPULATION_ID.CLASSIC_SESSION,
      populationLabel: 'test'
    });
    expect(disc.title).toMatch(/baisse/i);
    expect(disc.metrics.direction).toBe('down');
  });

  it('draftFromClaim corrige une contradiction hausse/baisse sans liste de kinds', () => {
    const drafted = draftFromClaim(
      {
        kind: 'disc_any_volume_story',
        title: 'La hausse de volume se lit dans la composition',
        body: 'Le volume classique passe de 1996 à 1240 répétitions.',
        metrics: {
          deltaVolume: -756,
          observedValues: [{ id: 'deltaVolume', value: -756, unit: 'reps' }],
          narrativeAuthority: 'composition',
          composition: { conclusion: 'Le volume classique passe de 1996 à 1240 répétitions.' }
        }
      },
      { statement: 'La hausse de volume se lit dans la composition', status: 'supported' },
      null
    );
    expect(drafted.title).toMatch(/baisse/i);
    expect(drafted.drafting.directionMismatch).toBe(true);
  });

  it('attribue structurellement quand les noms correspondent au programme', () => {
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
        },
        friday: {
          active: true,
          name: 'Push B',
          exercises: [
            { name: 'Développé couché', sets: 4, reps: 8 },
            { name: 'Pompes', sets: 3, reps: 12 }
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
    expect(decomp.ok).toBe(true);
    expect(decomp.recent.unattributedVolume).toBeLessThan(decomp.recent.volume);
    expect(decomp.recent.attributionShare).toBeGreaterThan(0.5);
    expect(decomp.contributions.some((c) => c.familyId !== 'unattributed')).toBe(true);
    expect(decomp.contributions[0]).toHaveProperty('freqEffect');
    expect(decomp.contributions[0]).toHaveProperty('contentEffect');
  });
});

describe('Mission 20 — fingerprint charges', () => {
  it('compte exerciseWeights et non un champ weights vide', () => {
    const fp = snapshotFingerprint({
      reps: { '2026-11-01_1': 10 },
      checkedExercises: { '2026-11-01_1': true },
      exerciseWeights: { '2026-11-01_1': 40, '2026-11-02_1': 42 },
      exerciseSetLogs: { '2026-11-01_1': [{ reps: 10 }] }
    });
    expect(fp.weightKeys).toBe(2);
    expect(fp.setLogKeys).toBe(1);
    expect(fp.version).toBeGreaterThanOrEqual(3);
    expect(fp.sources.weightsField).toBe('exerciseWeights');
  });
});

describe('Mission 20 — variantes : circularité vs preuve indépendante', () => {
  it('refuse le mix circular (volume seul) et accepte le mix slot-matched', async () => {
    const { decomposeVariantMixChange } = await import('../programVariantContext.js');
    const variants = [
      { dayKey: 'mon', sessionName: 'A', series: '3x12', plannedReps: 36 },
      { dayKey: 'fri', sessionName: 'B', series: '5x10', plannedReps: 50 }
    ];
    const circular = decomposeVariantMixChange({
      sessions: [
        { date: '2026-10-01', reps: 36 },
        { date: '2026-10-08', reps: 36 },
        { date: '2026-11-05', reps: 50 },
        { date: '2026-11-12', reps: 50 }
      ],
      variants,
      splitDate: '2026-11-01'
    });
    expect(circular.circularRisk).toBe(true);
    expect(circular.thesis).not.toBe('variant_mix_shift');

    const independent = decomposeVariantMixChange({
      sessions: [
        { date: '2026-10-01', reps: 36, dayKey: 'mon', sessionName: 'A' },
        { date: '2026-10-08', reps: 36, dayKey: 'mon', sessionName: 'A' },
        { date: '2026-11-05', reps: 50, dayKey: 'fri', sessionName: 'B' },
        { date: '2026-11-12', reps: 50, dayKey: 'fri', sessionName: 'B' }
      ],
      variants,
      splitDate: '2026-11-01'
    });
    expect(independent.circularRisk).toBe(false);
    expect(independent.thesis).toBe('variant_mix_shift');
    expect(independent.independentMatches).toBeGreaterThan(0);
  });
});

describe('Mission 20 — claim sourceEvents confirmation', () => {
  it('propage confirmationDates dans les sourceEvents', () => {
    const claim = claimFromDiscovery(
      {
        kind: 'disc_collective_return',
        title: 'confirmation',
        body: 'ok',
        metrics: {
          dates: ['2026-11-11'],
          returnDates: ['2026-11-11'],
          confirmationDates: ['2026-11-18'],
          observedValues: [{ id: 'x', value: 1, unit: 'reps' }]
        }
      },
      { start: '2026-11-15', end: '2026-11-21' }
    );
    const events = claim?.proof?.sourceEvents || [];
    const ids = events.map((e) => e.id);
    expect(ids).toContain('2026-11-11');
    expect(ids).toContain('2026-11-18');
  });
});
