/**
 * Mission 37 — intelligence analytique : contraste volume, concentration bornée,
 * sommeil association-only, familles éditoriales, convergence proportionnée.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import {
  composeVolumeFrequencyContentReading,
  composeRelativeConcentrationReading
} from '../phenomenonComposition';
import { composeStructuralProgramDiscoveries } from '../structuralProgramDiscoveries';
import { applyParallelTrajectoryComposition } from '../parallelTrajectoryComposition';

describe('Mission 37 — édition', () => {
  it('bumpe editorial v36', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[678]$/);
  });
});

describe('Mission 37 — contraste volume↑ / contenu↓', () => {
  it('explicite l’opposition fréquence compensatrice (cas v35 4891→5730)', () => {
    const reading = composeVolumeFrequencyContentReading({
      repsBefore: 4891,
      repsAfter: 5730,
      daysBefore: 13,
      daysAfter: 17,
      labelBefore: "les 30 jours d'avant",
      labelAfter: 'ces 30 jours'
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.decomposition.contentPct).toBeLessThan(-5);
    expect(reading.decomposition.volumePct).toBeGreaterThan(5);
    expect(reading.title).toMatch(/moins de reps par journée|contenu/i);
    expect(reading.title).not.toBe('Hausse de volume surtout fréquentielle');
    expect(reading.conclusion).toMatch(/augmente alors que le contenu moyen/i);
    expect(reading.conclusion).toMatch(/n’est pas une progression de capacité/i);
  });

  it('négatif : hausse fréquentielle sans baisse de contenu garde l’ancien titre', () => {
    const reading = composeVolumeFrequencyContentReading({
      repsBefore: 4613,
      repsAfter: 6071,
      daysBefore: 13,
      daysAfter: 17,
      labelBefore: 'avant',
      labelAfter: 'après'
    });
    expect(reading.decomposition.contentPct).toBeGreaterThan(-5);
    expect(reading.title).toMatch(/fréquenti|fréquence/i);
    expect(reading.conclusion).not.toMatch(/progression de capacité par séance/i);
  });
});

describe('Mission 37 — concentration relative bornée', () => {
  it('ne généralise pas la surreprésentation à toute la semaine', () => {
    const reading = composeRelativeConcentrationReading({
      localReps: 124,
      moveShareOfParentWindow: 124 / 372,
      globalShareOfParentWindow: 347 / 5730,
      moveNames: ['Développé couché incliné', 'Pompes déclinées', 'Curl assis'],
      periodLabel: '7 jours',
      parentPeriodLabel: '30 jours',
      localRepsInParent: 372,
      globalRepsShort: 347,
      globalRepsParent: 5730
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/surreprésentés/);
    expect(reading.conclusion).toMatch(/pas une preuve que tout le volume/);
    expect(reading.conclusion).not.toMatch(/par rapport au volume général\.$/);
  });
});

describe('Mission 37 — familles structurelles : priorité today/week seulement', () => {
  const program = {
    schedule: {
      lundi: {
        name: 'Street Workout + Endurance fondamentale',
        exercises: [
          { id: 'a', name: 'Tractions', series: '3x10', primaryMuscle: 'dos' },
          { id: 'b', name: 'Pompes', series: '3x12', primaryMuscle: 'pectoraux' },
          { id: 'c', name: 'Curl', series: '3x12', primaryMuscle: 'biceps' },
          { id: 'g', name: 'Face pull', series: '3x12', primaryMuscle: 'dos' }
        ]
      },
      vendredi: {
        name: 'Street Workout + Cardio',
        exercises: [
          { id: 'a', name: 'Tractions', series: '3x8', primaryMuscle: 'dos' },
          { id: 'b', name: 'Pompes', series: '5x10', primaryMuscle: 'pectoraux' },
          { id: 'c', name: 'Curl', series: '3x10', primaryMuscle: 'biceps' },
          { id: 'd', name: 'Hyperextension', series: '3x12', primaryMuscle: 'lombaires' }
        ]
      },
      mardi: {
        name: 'Biceps',
        exercises: [
          { id: 'c', name: 'Curl', series: '4x10', primaryMuscle: 'biceps' },
          { id: 'e', name: 'Mollets', series: '4x15', primaryMuscle: 'mollets' },
          { id: 'h', name: 'Curl marteau', series: '3x12', primaryMuscle: 'biceps' }
        ]
      },
      samedi: {
        name: 'Pecs - Biceps - Jambes',
        exercises: [
          { id: 'c', name: 'Curl', series: '3x12', primaryMuscle: 'biceps' },
          { id: 'e', name: 'Mollets', series: '3x15', primaryMuscle: 'mollets' },
          { id: 'f', name: 'Squat', series: '4x8', primaryMuscle: 'quadriceps' }
        ]
      }
    }
  };

  it('month : rappel structurel, pas priorité', () => {
    const { discoveries } = composeStructuralProgramDiscoveries({
      activeProgram: program,
      voiceKey: 'month'
    });
    const overview = discoveries.find((r) =>
      String(r.metrics?.conclusionKey || '').startsWith('session_families_overview')
    );
    expect(overview).toBeTruthy();
    expect(overview.metrics.horizonRole).toBe('context_accessible');
    expect(overview.metrics.editorialRole).toBe('structural_recall');
    expect(overview.weights.importance).toBeLessThan(0.5);
  });

  it('week : reste candidat priorité', () => {
    const { discoveries } = composeStructuralProgramDiscoveries({
      activeProgram: program,
      voiceKey: 'week'
    });
    const overview = discoveries.find((r) =>
      String(r.metrics?.conclusionKey || '').startsWith('session_families_overview')
    );
    expect(overview).toBeTruthy();
    expect(overview.metrics.horizonRole).toBe('priority_candidate');
    expect(overview.weights.importance).toBeGreaterThan(0.9);
  });
});

describe('Mission 37 — convergence parallèle proportionnée', () => {
  function wrapRow({ exerciseId, totalReps, prevReps }) {
    return {
      discovery: {
        kind: 'disc_exercise_progress',
        title: 'Hyperextension : rythme stable',
        body: 'Trajectoire',
        nature: 'trajectory',
        family: 'repertoire',
        informativeValue: 80,
        metrics: {
          exerciseId,
          name: 'Hyperextension',
          dates: ['2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10'],
          totalReps,
          prevReps,
          sessionCount: 4
        }
      },
      kind: 'disc_exercise_progress',
      title: 'Hyperextension : rythme stable',
      informativeValue: 80
    };
  }

  it('écart ~9 % : fourchette proche, pas « convergent »', () => {
    const applied = applyParallelTrajectoryComposition(
      [wrapRow({ exerciseId: '348708679', totalReps: 66, prevReps: 72 }), wrapRow({ exerciseId: '302', totalReps: 72, prevReps: 72 })],
      { voiceKey: 'month' }
    );
    expect(applied.composedCount).toBe(1);
    const composed = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(composed.discovery.body).toMatch(/fourchette proche/i);
    expect(composed.discovery.body).not.toMatch(/convergent vers/i);
  });

  it('volumes identiques : conserve « convergent »', () => {
    const applied = applyParallelTrajectoryComposition(
      [
        wrapRow({ exerciseId: '703294235', totalReps: 192, prevReps: 144 }),
        wrapRow({ exerciseId: '1979012181', totalReps: 192, prevReps: 96 })
      ],
      { voiceKey: 'week' }
    );
    expect(applied.composedCount).toBe(1);
    const composed = applied.rows.find((r) => r.discovery?.kind === 'disc_composed_parallel_trajectories');
    expect(composed.discovery.body).toMatch(/convergent vers/i);
  });
});
