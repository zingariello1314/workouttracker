/**
 * Mission 17 — épisode collectif (reprise vs confirmation) + direction variantes.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS, analysisEditionKey, analysisMissionLabel } from '../analysisEdition';
import { exploreCollectiveReturn, COVERAGE } from '../analyticalExploration';
import { composeCollectiveReturnReading } from '../phenomenonComposition';
import {
  decomposeVariantMixChange,
  findProgrammedVolumeVariants,
  isVariantMixCompatibleDiscovery,
  rewriteTrajectoryWithPrescriptions
} from '../programVariantContext';
import { extractAtomicFactsFromCards } from '../interHorizonFactCoherence';
import { assertionClaimKey } from '../evaluation/claimAssertionIdentity';

const midNovEvents = [
  {
    name: 'Face pull',
    exerciseId: '306',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    lastBefore: '2026-10-14',
    confirmationDates: ['2026-11-18'],
    dates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'resumed_former_level',
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: 45,
    currentReps: 60
  },
  {
    name: 'Élévations latérales',
    exerciseId: '304',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    lastBefore: '2026-10-14',
    confirmationDates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'resumed_former_level',
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: 45,
    currentReps: 60
  },
  {
    name: 'Développé Arnold',
    exerciseId: '1599606959',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'resumed_former_level',
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: 40,
    currentReps: 40
  },
  {
    name: 'Kickbacks triceps',
    exerciseId: '308',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'partial_resume',
    family: 'triceps',
    muscleGroup: 'triceps',
    prevReps: 60,
    currentReps: 48
  },
  {
    name: 'Extension triceps debout avec haltère',
    exerciseId: '307',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'partial_resume',
    family: 'triceps',
    muscleGroup: 'triceps',
    prevReps: 48,
    currentReps: 42
  },
  {
    name: 'Pompes pseudo-planche',
    exerciseId: '302',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    gapDays: 28,
    gapProvenByConsolidation: true,
    mechanism: 'resumed_former_level',
    family: 'chest',
    muscleGroup: 'chest',
    prevReps: 30,
    currentReps: 36
  }
];

describe('Mission 17 — épisode collectif', () => {
  it('édition courante + mission dérivée sans hardcode', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(analysisEditionKey()).toMatch(/collectiveReturn=/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
  });

  it('co-occurrence le 11 nov → collectif malgré 3 familles musculaires', () => {
    const explored = exploreCollectiveReturn(midNovEvents);
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.dates).toEqual(['2026-11-11']);
    expect(explored.confirmationDates).toContain('2026-11-18');
    expect(explored.retained.some((h) => h.id === 'shared_return_cooccurrence')).toBe(true);
  });

  it('confirmation hebdomadaire ≠ date de reprise', () => {
    const explored = exploreCollectiveReturn(midNovEvents);
    const composed = composeCollectiveReturnReading({
      namedMoves: explored.namedMoves,
      dates: explored.dates,
      confirmationDates: explored.confirmationDates,
      families: explored.families,
      sessionFamilyLinked: true,
      readingMode: 'confirmation'
    });
    expect(composed.conclusion).toMatch(/11 novembre|2026-11-11/);
    expect(composed.conclusion).toMatch(/18|confirme/i);
    expect(composed.conclusion).not.toMatch(/se réinstalle autour du 2026-11-18/);
  });

  it('contre-exemple : simultanés sans co-occurrence majoritaire ni lien', () => {
    const explored = exploreCollectiveReturn([
      { name: 'A', date: '2026-11-10', gapDays: 28, family: 'x' },
      { name: 'B', date: '2026-11-11', gapDays: 30, family: 'y' },
      { name: 'C', date: '2026-11-12', gapDays: 21, family: 'z' }
    ]);
    expect(explored.coverage).not.toBe(COVERAGE.CONCLUDED);
  });
});

describe('Mission 17 — variantes directionnelles', () => {
  const program = {
    schedule: {
      mon: {
        name: 'A',
        exercises: [{ name: 'Pompes déclinées', series: '3x12', id: 'd' }]
      },
      fri: {
        name: 'B',
        exercises: [{ name: 'Pompes déclinées', series: '5x10', id: 'd' }]
      }
    }
  };

  it('hausse globale → prose de hausse, pas « baisse »', () => {
    const ctx = findProgrammedVolumeVariants(program, 'Pompes déclinées');
    const day36 = ctx.variants.find((v) => Number(v.plannedReps) === 36)?.dayKey;
    const day50 = ctx.variants.find((v) => Number(v.plannedReps) === 50)?.dayKey;
    const sessions = [
      { date: '2026-10-01', totalReps: 36, dayKey: day36 },
      { date: '2026-10-08', totalReps: 36, dayKey: day36 },
      { date: '2026-10-15', totalReps: 36, dayKey: day36 },
      { date: '2026-11-01', totalReps: 50, dayKey: day50 },
      { date: '2026-11-08', totalReps: 50, dayKey: day50 },
      { date: '2026-11-15', totalReps: 50, dayKey: day50 }
    ];
    const decomp = decomposeVariantMixChange({
      sessions,
      variants: ctx.variants,
      splitDate: '2026-11-01'
    });
    expect(decomp.thesis).toBe('variant_mix_shift');
    expect(decomp.globalDeltaPct).toBeGreaterThan(0);
    const row = rewriteTrajectoryWithPrescriptions(
      {
        kind: 'disc_exercise_progress',
        title: 'Pompes déclinées: volume par séance en hausse',
        body: 'Hausse observée.',
        metrics: { exerciseName: 'Pompes déclinées', lastReps: 50 }
      },
      program,
      { sessions, splitDate: '2026-11-01' }
    );
    expect(row.body).toMatch(/hausse de moyenne/i);
    expect(row.body).not.toMatch(/^La baisse de moyenne/);
    expect(row.title).toMatch(/hausse de moyenne/i);
  });

  it('refuse de greffer le mix sur une carte de part musculaire', () => {
    expect(
      isVariantMixCompatibleDiscovery({
        kind: 'disc_family_fade',
        title: "Pompes pseudo-planche s'efface de ton tronc",
        body: 'La part musculaire baisse.'
      })
    ).toBe(false);
    const row = rewriteTrajectoryWithPrescriptions(
      {
        kind: 'disc_family_fade',
        title: "Pompes pseudo-planche s'efface de ton tronc",
        body: 'La part musculaire baisse.',
        metrics: { exerciseName: 'Pompes pseudo-planche' }
      },
      program,
      {
        sessions: [
          { date: '2026-10-01', totalReps: 36 },
          { date: '2026-11-01', totalReps: 50 }
        ]
      }
    );
    expect(row.title).toMatch(/s'efface/);
    expect(row.metrics?.thesis).not.toBe('variant_mix_shift');
  });

  it('refuse de greffer le mix sur une reprise de format', () => {
    expect(
      isVariantMixCompatibleDiscovery({
        kind: 'disc_format_consolidation',
        title: 'Face pull: un ancien niveau est retrouvé',
        body: 'Retrouve 60 reps.',
        metrics: { mechanism: 'resumed_former_level', exerciseName: 'Face pull' }
      })
    ).toBe(false);
  });
});

describe('Mission 17 — faits et population', () => {
  it('total périodique n’est pas attribué à une journée', () => {
    const { facts } = extractAtomicFactsFromCards([
      {
        id: 'c',
        kind: 'disc_th_concentration_now',
        metrics: {
          totalReps: 1340,
          peakDate: '2026-11-18',
          windowStart: '2026-11-15',
          windowEnd: '2026-11-21',
          population: 'period_window'
        }
      }
    ]);
    expect(facts[0].subjectKey).toMatch(/^period_volume:/);
    expect(facts[0].subjectKey).not.toMatch(/^day:/);
    expect(facts[0].value).toBe(1340);
  });

  it('population objet → pas de pop:[object Object]', () => {
    const key = assertionClaimKey(
      { population: { label: 'strength_days', id: 'sd' }, subject: { key: 'x' } },
      { metrics: { windowStart: '2026-11-01', windowEnd: '2026-11-21' } },
      '30d'
    );
    expect(key).not.toMatch(/\[object Object\]/);
    expect(key).toMatch(/pop:strength_days|pop:sd/);
  });
});
