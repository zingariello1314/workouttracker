/**
 * Mission 19 — autorité narrative + ledger d’épisodes + composition mensuelle.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../analysisEdition';
import { draftFromClaim } from '../draftFromClaim';
import { exploreDiscovery, COVERAGE } from '../analyticalExploration';
import {
  buildOccurrenceLedgerFromCatalog,
  buildReturnEventsFromLedger,
  clusterLedgerReturnEpisodes,
  qualifyEpisodeLevels
} from '../sessionEpisodeLedger';
import {
  decomposeMonthlyProgramChange,
  discoveryFromMonthlyComposition
} from '../monthlyProgramComposition';
import { claimFromDiscovery } from '../analyticalClaim';

describe('Mission 19 — édition', () => {
  it('v18 / Mission 19', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.narrativeAuthority).toMatch(/^thesis-composition-v[12]$/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
  });
});

describe('Mission 19 — autorité narrative collectif', () => {
  it('draftFromClaim conserve composition.confirmation plutôt que conclusion brute', () => {
    const discovery = {
      kind: 'disc_collective_return',
      title: 'La reprise collective se confirme cette semaine',
      body: 'CORPS_BRUT_A_REMPLACER',
      drafting: { authority: 'composition' },
      metrics: {
        narrativeAuthority: 'composition',
        thesis: 'collective_return',
        composition: {
          conclusion:
            'La reprise de cette composante, commencée le 2026-11-11, se confirme le 2026-11-18.'
        },
        confirmationDates: ['2026-11-18'],
        dates: ['2026-11-11']
      }
    };
    const claim = claimFromDiscovery(discovery, { start: '2026-11-15', end: '2026-11-21' });
    const exploration = {
      coverage: COVERAGE.CONCLUDED,
      conclusion:
        '9 mouvements reviennent autour du 2026-11-11 : Face pull (après 28 j).'
    };
    const drafted = draftFromClaim(discovery, claim, exploration);
    expect(drafted.body).toMatch(/confirme le 2026-11-18/);
    expect(drafted.body).not.toMatch(/^9 mouvements reviennent/);
  });

  it('exploreDiscovery ne régénère pas une conclusion plate si composition présente', () => {
    const discovery = {
      kind: 'disc_collective_return',
      body: 'texte composé',
      metrics: {
        narrativeAuthority: 'composition',
        composition: { conclusion: 'Reprise le 11, confirmation le 18.' },
        events: [{ name: 'A', date: '2026-11-11', gapDays: 28 }]
      }
    };
    const explored = exploreDiscovery(discovery);
    expect(explored.fromComposition).toBe(true);
    expect(explored.conclusion).toMatch(/confirmation le 18/);
  });
});

describe('Mission 19 — ledger séances', () => {
  const catalog = [
    {
      date: '2026-10-14',
      totalReps: 200,
      muscles: ['shoulders'],
      exercises: [
        { id: '306', name: 'Face pull', reps: 45 },
        { id: '304', name: 'Élévations latérales', reps: 45 }
      ]
    },
    {
      date: '2026-11-11',
      totalReps: 220,
      muscles: ['shoulders'],
      exercises: [
        { id: '306', name: 'Face pull', reps: 60 },
        { id: '304', name: 'Élévations latérales', reps: 60 },
        { id: '302', name: 'Pompes pseudo-planche', reps: 36 }
      ]
    },
    {
      date: '2026-11-18',
      totalReps: 210,
      muscles: ['shoulders'],
      exercises: [
        { id: '306', name: 'Face pull', reps: 60 },
        { id: '304', name: 'Élévations latérales', reps: 60 },
        { id: '302', name: 'Pompes pseudo-planche', reps: 36 }
      ]
    }
  ];

  it('construit des retours depuis le catalogue sans cartes', () => {
    const occ = buildOccurrenceLedgerFromCatalog(catalog);
    const events = buildReturnEventsFromLedger(occ, { minGapDays: 14 });
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.every((e) => e.returnDate === '2026-11-11')).toBe(true);
    expect(events[0].confirmationDates).toContain('2026-11-18');
    const clusters = clusterLedgerReturnEpisodes(events, {
      window: { start: '2026-11-15', end: '2026-11-21' }
    });
    expect(clusters[0].date).toBe('2026-11-11');
    expect(clusters[0].confirmationInWindow).toBe(true);
    const qual = qualifyEpisodeLevels(events);
    expect(qual.participantCount).toBeGreaterThanOrEqual(2);
    expect(qual.confirmationCount).toBeGreaterThanOrEqual(2);
  });

  it('contre-exemple : retours simultanés sans lien (dates différentes)', () => {
    const occ = buildOccurrenceLedgerFromCatalog([
      {
        date: '2026-10-01',
        totalReps: 50,
        exercises: [{ id: '1', name: 'A', reps: 50 }]
      },
      {
        date: '2026-10-02',
        totalReps: 50,
        exercises: [{ id: '2', name: 'B', reps: 50 }]
      },
      {
        date: '2026-11-10',
        totalReps: 50,
        exercises: [{ id: '1', name: 'A', reps: 50 }]
      },
      {
        date: '2026-11-12',
        totalReps: 50,
        exercises: [{ id: '2', name: 'B', reps: 50 }]
      }
    ]);
    const events = buildReturnEventsFromLedger(occ, { minGapDays: 14 });
    const clusters = clusterLedgerReturnEpisodes(events);
    expect(clusters.every((c) => c.size < 2)).toBe(true);
  });
});

describe('Mission 19 — composition mensuelle familles', () => {
  it('attribue la hausse de volume à une famille plus fréquente', () => {
    const program = {
      schedule: {
        mon: {
          name: 'Push',
          exercises: [
            { id: '302', name: 'Pompes' },
            { id: '306', name: 'Face pull' }
          ]
        },
        wed: {
          name: 'Legs',
          exercises: [{ id: '501', name: 'Squat' }]
        }
      }
    };
    const catalog = [];
    // période précédente : 2 push + 2 legs
    for (const d of ['2026-10-06', '2026-10-13']) {
      catalog.push({
        date: d,
        totalReps: 100,
        exercises: [
          { id: '302', name: 'Pompes', reps: 50 },
          { id: '306', name: 'Face pull', reps: 50 }
        ]
      });
    }
    for (const d of ['2026-10-08', '2026-10-15']) {
      catalog.push({
        date: d,
        totalReps: 80,
        exercises: [{ id: '501', name: 'Squat', reps: 80 }]
      });
    }
    // période récente : 4 push + 2 legs
    for (const d of ['2026-11-03', '2026-11-10', '2026-11-11', '2026-11-18']) {
      catalog.push({
        date: d,
        totalReps: 100,
        exercises: [
          { id: '302', name: 'Pompes', reps: 50 },
          { id: '306', name: 'Face pull', reps: 50 }
        ]
      });
    }
    for (const d of ['2026-11-05', '2026-11-12']) {
      catalog.push({
        date: d,
        totalReps: 80,
        exercises: [{ id: '501', name: 'Squat', reps: 80 }]
      });
    }
    const decomp = decomposeMonthlyProgramChange({
      catalog,
      window: { start: '2026-11-01', end: '2026-11-30' },
      previousWindow: { start: '2026-10-01', end: '2026-10-30' },
      activeProgram: program
    });
    expect(decomp.ok).toBe(true);
    expect(decomp.deltaVolume).toBeGreaterThan(0);
    expect(decomp.drivers.some((d) => /push|frequency_up|appearance/i.test(`${d.familyName} ${d.evolution}`))).toBe(
      true
    );
    const card = discoveryFromMonthlyComposition(decomp);
    expect(card?.kind).toBe('disc_program_family_volume_decomposition');
    expect(card?.body).toMatch(/volume/i);
  });
});
