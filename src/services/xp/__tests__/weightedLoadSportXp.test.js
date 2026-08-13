import { describe, it, expect } from 'vitest';
import {
  calculateSportXP,
  SPORT_XP_WEIGHTED_LOAD_FACTOR
} from '../xpCalculations';
import {
  computeStrengthCalendarContribution,
  resolveExerciseWeightMultiplier
} from '../../../utils/trainingLoadUtils';
import { resolveExerciseScoring } from '../../../utils/exerciseScoringResolver';

describe('calculateSportXP — charge lestée séparée du coeff variante', () => {
  const exId = '201';

  it('Pompes lestées : coeff catalogue × multiplicateur kg (pas l’ancienne formule linéaire)', () => {
    const scoring = resolveExerciseScoring({ name: 'Pompes lestées', id: exId });
    expect(scoring?.intensityCoeff).toBeCloseTo(1.25, 2);

    const reps = 10;
    const weightKg = 15;
    const medianKg = 10;
    const exerciseLike = { name: 'Pompes lestées', id: exId, materiel: 'gilet lesté' };
    const wMult = resolveExerciseWeightMultiplier(exerciseLike, weightKg, medianKg);
    expect(wMult).toBeGreaterThan(1);
    expect(wMult).toBeLessThan(1.25);

    const expectedLoad = computeStrengthCalendarContribution(
      exerciseLike,
      reps,
      scoring.intensityCoeff,
      wMult
    );
    const variantOnlyLoad = reps * scoring.intensityCoeff;
    expect(expectedLoad).toBeGreaterThan(variantOnlyLoad);

    const data = {
      checkedExercises: { [`2026-08-13_${exId}`]: true },
      reps: { [`2026-08-13_${exId}`]: reps },
      exerciseWeights: {
        '2026-08-01_201': '10',
        [`2026-08-13_${exId}`]: String(weightKg)
      }
    };

    const result = calculateSportXP(data, null, null, {
      getExerciseNameById: (id) => (String(id) === exId ? 'Pompes lestées' : '')
    });

    expect(result.breakdown.weightedRepsLoad).toBeGreaterThan(variantOnlyLoad);
    expect(result.breakdown.weightedRepsXp).toBe(
      Math.round(result.breakdown.weightedRepsLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR)
    );
  });

  it('sans kg saisi : seul le coeff variante s’applique (multiplicateur = 1)', () => {
    const scoring = resolveExerciseScoring({ name: 'Pompes lestées', id: exId });
    const reps = 12;
    const expectedLoad = computeStrengthCalendarContribution(
      { name: 'Pompes lestées', id: exId },
      reps,
      scoring.intensityCoeff,
      1
    );

    const data = {
      checkedExercises: { [`2026-08-13_${exId}`]: true },
      reps: { [`2026-08-13_${exId}`]: reps }
    };

    const result = calculateSportXP(data, null, null, {
      getExerciseNameById: (id) => (String(id) === exId ? 'Pompes lestées' : '')
    });

    expect(result.breakdown.weightedRepsLoad).toBeCloseTo(expectedLoad, 1);
  });
});
