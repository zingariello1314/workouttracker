import { describe, it, expect } from 'vitest';
import {
  getStrengthSessionFloorMinutes,
  finalizeSessionForDurationBudget,
  estimateSessionMinutesFromExercises
} from './quizSessionDurationBudget';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';

describe('quizSessionDurationBudget — finalisation durée', () => {
  it('plancher 60–90 proche de 48 min semaine 1', () => {
    expect(getStrengthSessionFloorMinutes(incoherenceDocProfile6d, { weekIndex: 1 })).toBeGreaterThanOrEqual(
      44
    );
  });

  it('finalizeSessionForDurationBudget augmente volume séries sur séance courte', () => {
    const exercises = [
      { name: 'Pompes', exerciseBankKey: 'pompes', series: '2×10', rest: 60 },
      { name: 'Tractions', exerciseBankKey: 'tractions pronation', series: '2×6', rest: 90 },
      { name: 'Dips', exerciseBankKey: 'dips', series: '2×8', rest: 75 },
      { name: 'Squat gobelet', exerciseBankKey: 'squat gobelet', series: '2×12', rest: 75 }
    ];
    const before = estimateSessionMinutesFromExercises(exercises, incoherenceDocProfile6d);
    const out = finalizeSessionForDurationBudget(exercises, incoherenceDocProfile6d, {
      profile: { modality: 'strength' },
      coachContext: { deformers: {} }
    });
    const after = estimateSessionMinutesFromExercises(out, incoherenceDocProfile6d);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThanOrEqual(35);
  });
});
