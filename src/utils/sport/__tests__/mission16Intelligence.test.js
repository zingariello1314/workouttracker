/**
 * Mission 16 — preuves verticales : programme → thèse, collectif, faits atomiques.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS, analysisEditionKey } from '../analysisEdition';
import {
  decomposeVariantMixChange,
  findProgrammedVolumeVariants,
  rewriteTrajectoryWithPrescriptions
} from '../programVariantContext';
import { exploreCollectiveReturn, COVERAGE } from '../analyticalExploration';
import { composeCollectiveReturnReading } from '../phenomenonComposition';
import { extractAtomicFactsFromCards } from '../interHorizonFactCoherence';
import { substantiveEquivalence } from '../discoveryIdentity';

const pushProgram = {
  schedule: {
    mon: {
      name: 'Variante A',
      exercises: [
        { name: 'Pompes déclinées', series: '3x12', id: 'decl' },
        { name: 'Pompes inclinées', series: '3x12', id: 'incl' }
      ]
    },
    fri: {
      name: 'Variante B',
      exercises: [{ name: 'Pompes déclinées', series: '5x10', id: 'decl' }]
    }
  }
};

describe('Mission 16 — Livraison 1 : programme explique les trajectoires', () => {
  it('édition ≥ v15 avec raisonnement programme', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/p6-sovereign-v1[5-9]/);
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v1[5-9]/);
    expect(analysisEditionKey()).toMatch(/programReasoning=variant-mix/);
  });

  it('détecte les prescriptions distinctes pompes déclinées A/B', () => {
    const ctx = findProgrammedVolumeVariants(pushProgram, 'Pompes déclinées');
    expect(ctx.distinctPrescriptions).toBe(true);
    expect(ctx.variants.length).toBeGreaterThanOrEqual(2);
    const planned = ctx.variants.map((v) => v.plannedReps).sort((a, b) => a - b);
    expect(planned).toEqual([36, 50]);
  });

  it('mélange modifié + variantes stables → thèse variant_mix_shift (pas recul de capacité)', () => {
    const ctx = findProgrammedVolumeVariants(pushProgram, 'Pompes déclinées');
    const dayA = ctx.variants.find((v) => Number(v.plannedReps) === 36)?.dayKey;
    const dayB = ctx.variants.find((v) => Number(v.plannedReps) === 50)?.dayKey;
    // Avant : surtout B (50). Après : surtout A (36). Appariement par créneau (anti-circularité).
    const sessions = [
      { date: '2026-10-01', totalReps: 50, dayKey: dayB },
      { date: '2026-10-08', totalReps: 50, dayKey: dayB },
      { date: '2026-10-15', totalReps: 50, dayKey: dayB },
      { date: '2026-11-01', totalReps: 36, dayKey: dayA },
      { date: '2026-11-08', totalReps: 36, dayKey: dayA },
      { date: '2026-11-15', totalReps: 36, dayKey: dayA }
    ];
    const decomp = decomposeVariantMixChange({
      sessions,
      variants: ctx.variants,
      splitDate: '2026-11-01'
    });
    expect(decomp.coverage).toBe('concluded');
    expect(decomp.thesis).toBe('variant_mix_shift');
    expect(decomp.circularRisk).toBe(false);
    expect(decomp.globalDeltaPct).toBeLessThan(-10);

    const before = {
      title: 'Pompes déclinées: volume par séance en baisse',
      body: 'Le volume moyen passe de 50 à 36 répétitions. Recul apparent de capacité.',
      metrics: { exerciseName: 'Pompes déclinées', exerciseId: 'decl', lastReps: 36 }
    };
    const after = rewriteTrajectoryWithPrescriptions(before, pushProgram, { sessions, splitDate: '2026-11-01' });
    expect(after.metrics.thesis).toBe('variant_mix_shift');
    expect(after.title).toMatch(/mélange de variantes/i);
    expect(after.body).toMatch(/ne traduit pas un recul de capacité/i);
    expect(after.body).not.toMatch(/Recul apparent de capacité/);
    expect(after.metrics.composition).toBe('program_variant_mix_explains');
  });

  it('contre-exemple circularité : volume seul ne suffit pas à prouver le mélange', () => {
    const ctx = findProgrammedVolumeVariants(pushProgram, 'Pompes déclinées');
    const sessions = [
      { date: '2026-10-01', totalReps: 50 },
      { date: '2026-10-08', totalReps: 50 },
      { date: '2026-11-01', totalReps: 36 },
      { date: '2026-11-08', totalReps: 36 }
    ];
    const decomp = decomposeVariantMixChange({
      sessions,
      variants: ctx.variants,
      splitDate: '2026-11-01'
    });
    expect(decomp.thesis).not.toBe('variant_mix_shift');
    expect(decomp.circularRisk).toBe(true);
  });

  it('contre-exemple : mélange stable + baisse dans les deux variantes → within_variant_decline', () => {
    const ctx = findProgrammedVolumeVariants(pushProgram, 'Pompes déclinées');
    // Même alternance A/B avant/après ; chaque variante baisse ~10–12 %
    const sessions = [
      { date: '2026-10-01', totalReps: 50 },
      { date: '2026-10-08', totalReps: 36 },
      { date: '2026-10-15', totalReps: 50 },
      { date: '2026-10-22', totalReps: 36 },
      { date: '2026-11-01', totalReps: 44 },
      { date: '2026-11-08', totalReps: 31 },
      { date: '2026-11-15', totalReps: 44 },
      { date: '2026-11-18', totalReps: 31 }
    ];
    const decomp = decomposeVariantMixChange({
      sessions,
      variants: ctx.variants,
      splitDate: '2026-11-01'
    });
    expect(decomp.mixShift).toBe(false);
    expect(decomp.thesis).toBe('within_variant_decline');
    const row = rewriteTrajectoryWithPrescriptions(
      {
        title: 'Pompes déclinées: baisse',
        body: 'Baisse observée.',
        metrics: { exerciseName: 'Pompes déclinées', lastReps: 31 }
      },
      pushProgram,
      { sessions, splitDate: '2026-11-01' }
    );
    expect(row.metrics.thesis).toBe('within_variant_decline');
    expect(row.body).toMatch(/à l’intérieur des variantes/i);
  });

  it('contre-exemple : variante inconnue → pas de thèse forcée', () => {
    const ctx = findProgrammedVolumeVariants(pushProgram, 'Pompes déclinées');
    const sessions = [
      { date: '2026-10-01', totalReps: 12 },
      { date: '2026-10-08', totalReps: 14 },
      { date: '2026-11-01', totalReps: 11 },
      { date: '2026-11-08', totalReps: 13 }
    ];
    const decomp = decomposeVariantMixChange({
      sessions,
      variants: ctx.variants,
      splitDate: '2026-11-01'
    });
    expect(decomp.thesis).toBe('unknown_variant');
  });
});

describe('Mission 16 — Livraison 2 : reprise collective', () => {
  it('événements mi-novembre liés → disc_collective_return conclu', () => {
    const events = [
      {
        name: 'Face pull',
        exerciseId: '306',
        date: '2026-11-18',
        gapDays: 28,
        family: 'shoulders',
        muscleGroup: 'shoulders',
        sessionFamilyId: 'upper_a',
        prevReps: 60,
        currentReps: 60,
        habitualCadenceDays: 7
      },
      {
        name: 'Élévations latérales',
        exerciseId: '304',
        date: '2026-11-18',
        gapDays: 28,
        family: 'shoulders',
        muscleGroup: 'shoulders',
        sessionFamilyId: 'upper_a',
        prevReps: 60,
        currentReps: 60,
        habitualCadenceDays: 7
      },
      {
        name: 'Développé Arnold',
        exerciseId: '1599606959',
        date: '2026-11-18',
        gapDays: 28,
        family: 'shoulders',
        muscleGroup: 'shoulders',
        sessionFamilyId: 'upper_a',
        prevReps: 40,
        currentReps: 40,
        habitualCadenceDays: 7
      },
      {
        name: 'Kickbacks triceps',
        exerciseId: '308',
        date: '2026-11-18',
        gapDays: 28,
        family: 'triceps',
        muscleGroup: 'triceps',
        sessionFamilyId: 'upper_a',
        prevReps: 60,
        currentReps: 48,
        habitualCadenceDays: 7
      },
      {
        name: 'Extension triceps debout avec haltère',
        exerciseId: '307',
        date: '2026-11-18',
        gapDays: 28,
        family: 'triceps',
        muscleGroup: 'triceps',
        sessionFamilyId: 'upper_a',
        prevReps: 48,
        currentReps: 42,
        habitualCadenceDays: 7
      },
      {
        name: 'Pompes pseudo-planche',
        exerciseId: '302',
        date: '2026-11-18',
        gapDays: 28,
        family: 'chest',
        muscleGroup: 'chest',
        sessionFamilyId: 'upper_a',
        prevReps: 36,
        currentReps: 36,
        habitualCadenceDays: 7
      }
    ];
    const explored = exploreCollectiveReturn(events);
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.namedMoves.length).toBeGreaterThanOrEqual(3);
    expect(explored.conclusion).toBeTruthy();

    const composed = composeCollectiveReturnReading({
      namedMoves: events,
      dates: ['2026-11-18'],
      spanDays: 0,
      families: ['shoulders', 'triceps'],
      sessionFamilyLinked: true,
      baseConclusion: explored.conclusion
    });
    expect(composed.coverage).toBe('concluded');
    expect(composed.conclusion).toMatch(/composante|réinstalle/i);
    expect(composed.conclusion).toMatch(/Face pull|Élévations|Arnold/i);
    expect(composed.conclusion).toMatch(/retrait|volume proche|formats/i);
  });

  it('simultanéité seule sans lien → sous-exploré (contre-exemple)', () => {
    const explored = exploreCollectiveReturn([
      { name: 'A', date: '2026-11-10', gapDays: 28 },
      { name: 'B', date: '2026-11-11', gapDays: 30 },
      { name: 'C', date: '2026-11-12', gapDays: 21 }
    ]);
    expect(explored.coverage).not.toBe(COVERAGE.CONCLUDED);
  });
});

describe('Mission 16 — faits atomiques sans collision', () => {
  it('deux totalReps sur fenêtres différentes ne partagent pas la même clé vide', () => {
    const { facts } = extractAtomicFactsFromCards(
      [
        {
          id: 'c1',
          kind: 'disc_th_concentration_now',
          metrics: {
            totalReps: 263,
            date: '2026-11-20',
            windowStart: '2026-11-20',
            windowEnd: '2026-11-20',
            population: 'today'
          }
        },
        {
          id: 'c2',
          kind: 'disc_th_concentration_now',
          metrics: {
            totalReps: 426,
            peakDate: '2026-11-18',
            windowStart: '2026-11-15',
            windowEnd: '2026-11-21',
            population: 'week'
          }
        }
      ],
      { period: '7d' }
    );
    expect(facts.length).toBeGreaterThanOrEqual(2);
    const keys = facts.map(
      (f) =>
        `${f.subjectKey}|${f.metricId}|${f.population}|${f.windowStart}|${f.windowEnd}`
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.some((k) => k.includes('||||'))).toBe(false);
  });

  it('fait sans fenêtre est refusé (évite disc_th_*|totalReps||||)', () => {
    const { facts } = extractAtomicFactsFromCards([
      {
        id: 'bad',
        kind: 'disc_th_composition_now',
        metrics: { totalReps: 1340 }
      }
    ]);
    expect(facts).toHaveLength(0);
  });
});

describe('Mission 16 — redondance concentration / pic', () => {
  it('deux libellés du 18 novembre sont équivalents', () => {
    const a = {
      kind: 'disc_th_concentration_now',
      title: 'Le 18 novembre 2026 porte une grande part de ces 7 jours',
      body: '426 répétitions sur 1340.',
      metrics: { peakDate: '2026-11-18', totalReps: 426 }
    };
    const b = {
      kind: 'disc_peak_day',
      title: 'La séance du 18 novembre 2026 concentre une part importante de ces 7 jours',
      body: 'La journée concentre une part importante.',
      metrics: { date: '2026-11-18', totalReps: 426 }
    };
    const eq = substantiveEquivalence(a, b);
    expect(eq.equivalent).toBe(true);
  });
});
