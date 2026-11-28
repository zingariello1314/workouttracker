/**
 * Diagnostic + garde-fous : dépriorisation structure 7j doit modifier l'ordre publié.
 */
import { describe, expect, it } from 'vitest';
import { discoveryInformativeValue } from '../recapPeriodSelection';
import { editorialValueAdjustments } from '../recapEditorialSelection';
import { selectCollectively } from '../collectiveSelection';
import { composeStructuralProgramDiscoveries } from '../structuralProgramDiscoveries';
import { buildVisualInsightSpec } from '../analysisVisualInsight';
import { narrateFromComposedEvidence } from '../recapComposedNarration';
import { buildExerciseTrajectory } from '../exerciseTrajectoryAnalysis';
import { buildComposedEvidenceFromTrajectory } from '../recapComposedEvidence';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';

function row(discovery, { wasPriority = true } = {}) {
  const d = { ...discovery };
  const iv = discoveryInformativeValue(d, 'week', { attachEditorial: true });
  return {
    discovery: { ...d, informativeValue: iv },
    claim: {
      id: d.kind,
      assertions: [{ subjectId: 'period:x', metricId: 'm', operator: 'present' }]
    },
    wasPriority
  };
}

function ymd(offsetFromBase, base = '2026-09-28') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offsetFromBase);
  return d.toISOString().slice(0, 10);
}

describe('v38b ajustement — week_structural vs ancrage fenêtre', () => {
  it('édition editorial = p6-sovereign-v38b', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toBe('p6-sovereign-v38b');
  });

  it('applique week_structural_context_not_priority (baisse de score réelle, pas no-op)', () => {
    const structure = {
      kind: 'disc_session_family_structure',
      score: 76,
      rawScore: 76,
      metrics: {
        population: 'programmed_structure',
        editorialRole: 'structural_discovery',
        horizonRole: 'priority_candidate'
      }
    };
    const adj = editorialValueAdjustments(structure, 'week');
    expect(adj.factors.some((f) => f.id === 'week_structural_context_not_priority' && f.delta < 0)).toBe(
      true
    );
    const iv = discoveryInformativeValue({ ...structure }, 'week');
    expect(iv).toBeLessThan(76);
  });

  it('structure 7j publie en nature trajectory (pas now → shortTerm)', () => {
    const program = {
      schedule: {
        monday: {
          name: 'Séance A',
          active: true,
          exercises: [
            { id: 1, name: 'Pompes déclinées', sets: 3, reps: 12 },
            { id: 2, name: 'Pompes inclinées', sets: 3, reps: 12 },
            { id: 3, name: 'Squat', sets: 4, reps: 10 }
          ]
        },
        friday: {
          name: 'Séance A′',
          active: true,
          exercises: [
            { id: 1, name: 'Pompes déclinées', sets: 5, reps: 10 },
            { id: 3, name: 'Squat', sets: 4, reps: 10 }
          ]
        },
        tuesday: {
          name: 'Séance B',
          active: true,
          exercises: [
            { id: 10, name: 'Tractions', sets: 4, reps: 8 },
            { id: 11, name: 'Row', sets: 3, reps: 10 }
          ]
        },
        saturday: {
          name: 'Séance B′',
          active: true,
          exercises: [
            { id: 10, name: 'Tractions', sets: 5, reps: 6 },
            { id: 12, name: 'Face pull', sets: 3, reps: 15 }
          ]
        }
      }
    };
    const { discoveries } = composeStructuralProgramDiscoveries({
      activeProgram: program,
      voiceKey: 'week',
      window: { start: '2026-11-17', end: '2026-11-23' }
    });
    const structureCards = (discoveries || []).filter((d) =>
      /session_family_structure|session_family_variant/.test(d.kind)
    );
    expect(structureCards.length).toBeGreaterThan(0);
    structureCards.forEach((d) => {
      expect(d.nature).toBe('trajectory');
      expect(d.nature).not.toBe('now');
    });
  });

  it('concentration ancrée fenêtre dépasse structure au classement collectif 7j', () => {
    const structure = row({
      kind: 'disc_session_family_structure',
      score: 76,
      rawScore: 76,
      title: 'Structure des trois familles',
      family: 'program_structure',
      metrics: {
        population: 'programmed_structure',
        editorialRole: 'structural_discovery',
        horizonRole: 'priority_candidate'
      }
    });
    const variant = row({
      kind: 'disc_session_family_variant',
      score: 70,
      rawScore: 70,
      title: 'Variantes de séances',
      family: 'program_structure',
      metrics: {
        population: 'programmed_structure',
        editorialRole: 'structural_discovery'
      }
    });
    const concentration = row({
      kind: 'disc_composed_relative_concentration',
      score: 78,
      rawScore: 78,
      title: 'Concentration relative',
      metrics: {
        visualKind: 'relative_concentration',
        windowSessionCount: 3,
        moveShareOfParentWindow: 124 / 372,
        globalShareOfParentWindow: 347 / 5730
      }
    });
    const volume = row({
      kind: 'disc_volume_shape',
      score: 70,
      rawScore: 70,
      title: 'Répartition du volume hebdomadaire',
      metrics: {}
    });

    expect(concentration.discovery.informativeValue).toBeGreaterThan(
      structure.discovery.informativeValue
    );

    const selected = selectCollectively([structure, variant, concentration, volume], {
      voiceKey: 'week'
    });
    const kinds = selected.priority.map((r) => r.discovery.kind);
    expect(kinds[0]).toBe('disc_composed_relative_concentration');
    expect(kinds).toContain('disc_session_family_structure');
  });

  it('concentration : fractions 124/372 et 347/5730 exposées dans le spec', () => {
    const spec = buildVisualInsightSpec({
      kind: 'disc_composed_relative_concentration',
      metrics: {
        moveShareOfParentWindow: 124 / 372,
        globalShareOfParentWindow: 347 / 5730,
        localReps: 124,
        localRepsInParent: 372,
        globalRepsShort: 347,
        globalRepsParent: 5730,
        visualKind: 'relative_concentration'
      }
    });
    expect(spec.series[0].numerator).toBe(124);
    expect(spec.series[0].denominator).toBe(372);
    expect(spec.series[1].numerator).toBe(347);
    expect(spec.series[1].denominator).toBe(5730);
    expect(spec.series[0].population).not.toBe(spec.series[1].population);
  });

  it('volume : bornes/fenêtres du moteur dans le spec (pas inventées)', () => {
    const spec = buildVisualInsightSpec({
      kind: 'disc_composed_volume_decomp',
      metrics: {
        prevReps: 4891,
        curReps: 5730,
        freqEffect: 1427,
        contentEffect: -588,
        netDelta: 839,
        labelBefore: "les 30 jours d'avant",
        labelAfter: 'ces 30 jours',
        prevWindow: { start: '2026-09-24', end: '2026-10-23' },
        recentWindow: { start: '2026-10-24', end: '2026-11-22' },
        comparisonWindows: 'prev30_vs_recent30',
        visualKind: 'volume_freq_content'
      }
    });
    expect(spec.meta.windowLabels.before).toBe("les 30 jours d'avant");
    expect(spec.meta.windowLabels.after).toBe('ces 30 jours');
    expect(spec.meta.windows.before.start).toBe('2026-09-24');
    expect(spec.meta.comparisonWindows).toBe('prev30_vs_recent30');
    expect(spec.meta.signed.freq).toBeGreaterThan(0);
    expect(spec.meta.signed.content).toBeLessThan(0);
  });

  it('Hyperextension : trajectoire exacte, prudence non répétée dans le corps', () => {
    const totals = [48, 48, 48, 48, 48, 48, 48, 24];
    const checkedExercises = {};
    const reps = {};
    totals.forEach((total, i) => {
      checkedExercises[`${ymd(i * 7)}_703294235`] = true;
      reps[`${ymd(i * 7)}_703294235`] = String(total);
    });
    const traj = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps },
      exerciseId: '703294235',
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(7 * 7) },
      mode: 'progress'
    });
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const narrated = narrateFromComposedEvidence(composed, {
      metrics: { composedEvidence: composed }
    });
    expect(narrated.body).toMatch(/ponctuelle|atypique|sans permettre de conclure/i);
    const prudenceHits = (
      narrated.body.match(/sans permettre de conclure|pas encore une tendance|hors norme/gi) || []
    ).length;
    expect(prudenceHits).toBeLessThanOrEqual(2);
    expect(narrated.body).not.toMatch(/Sans détail de séries/i);
    const spec = buildVisualInsightSpec({
      kind: 'disc_exercise_progress',
      metrics: {
        visualKind: 'trajectory_sessions',
        sessionTotals: totals,
        sessionDates: totals.map((_, i) => ymd(i * 7)),
        composedEvidence: composed
      }
    });
    expect(spec.series.map((s) => s.value)).toEqual(totals);
  });
});
