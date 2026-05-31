import { describe, it, expect } from 'vitest';
import {
  buildExercisePreferenceScore,
  buildExercisePreferenceCompareFr,
  preferenceTieBreakDelta,
  mergePreferenceIntoAdjustments
} from './quizExercisePreferenceScore';
import { buildTrainingEvidence, applyTrainingEvidenceToDeformers } from './quizTrainingEvidence';

describe('quizExercisePreferenceScore', () => {
  it('favorise tractions vs burpees peu pratiqués', () => {
    const reps = {};
    const checked = {};
    for (let i = 0; i < 8; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const pullKey = `${ds}_quiz_ex_tractions_pronation_1`;
      reps[pullKey] = 12;
      checked[pullKey] = true;
    }
    reps[`${new Date().toISOString().slice(0, 10)}_quiz_ex_burpees_1`] = 3;
    checked[`${new Date().toISOString().slice(0, 10)}_quiz_ex_burpees_1`] = true;

    const pref = buildExercisePreferenceScore({
      snapshot: { reps, checkedExercises: checked },
      activeDays28: 8
    });
    expect(pref.scores['tractions pronation']).toBeGreaterThan(pref.scores.burpees ?? -99);
    expect(pref.boosts).toContain('tractions pronation');
    const fr = buildExercisePreferenceCompareFr(pref.topPositive, pref.topNegative);
    expect(fr).toMatch(/tractions/i);
  });

  it('preferenceTieBreakDelta borne le bonus / malus', () => {
    expect(preferenceTieBreakDelta('tractions pronation', { 'tractions pronation': 18 })).toBeLessThanOrEqual(8);
    expect(preferenceTieBreakDelta('burpees', { burpees: -11 })).toBeGreaterThanOrEqual(-8);
  });

  it('intègre dans buildTrainingEvidence et deformers', () => {
    const reps = {};
    const checked = {};
    for (let i = 0; i < 5; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const k = `${ds}_quiz_ex_dips_1`;
      reps[k] = 10;
      checked[k] = true;
    }
    const ev = buildTrainingEvidence({
      snapshot: {
        reps,
        checkedExercises: checked,
        trainingPrefs: { journeyStartYmd: '2026-01-01' }
      },
      answers: {
        goalPhysique: 'muscular_defined',
        availableTrainingDays: ['lundi', 'mercredi', 'vendredi'],
        existingProgramInApp: { hasProgram: 'yes', programId: 'p1' }
      },
      programs: [
        {
          id: 'p1',
          name: 'Street',
          startDate: '2026-04-01',
          schedule: {
            lundi: {
              active: true,
              exercises: [
                { id: 'quiz_ex_tractions_pronation_1', exerciseBankKey: 'tractions pronation' },
                { id: 'quiz_ex_burpees_1', exerciseBankKey: 'burpees' }
              ]
            }
          }
        }
      ]
    });
    expect(ev.exercisePreference?.scores?.dips).toBeGreaterThan(0);
    const d = applyTrainingEvidenceToDeformers(
      { volumeMul: 1, maxExercisesPerSession: 7, preferredGroupWeights: {} },
      ev
    );
    expect(d.exercisePreferenceScore?.dips).toBeGreaterThan(0);
    expect(d.templateKeyBoosts).toContain('dips');
  });

  it('mergePreferenceIntoAdjustments ajoute compareFr aux whyLines', () => {
    const adj = mergePreferenceIntoAdjustments(
      { templateKeyBoosts: [] },
      {
        maturity: 'usable',
        boosts: ['pompes'],
        penalties: [],
        scores: { pompes: 12 },
        compareFr: 'Tu progresses mieux sur pompes que sur burpees — le prochain plan favorisera tes habitudes réelles.'
      }
    );
    expect(adj.whyLines?.[0]).toMatch(/pompes/i);
    expect(adj.templateKeyBoosts).toContain('pompes');
  });
});
