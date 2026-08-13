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

describe('calculateSportXP — isométrique (paliers sec × coeff catalogue)', () => {
  const gainageId = 'ex_gainage_test';

  it('utilise tieredIsometricRawUnits au lieu de compter les secondes comme des reps', () => {
    const seconds = 45;
    const scoring = resolveExerciseScoring({ name: 'Gainage', id: gainageId });
    const exerciseLike = { name: 'Gainage', id: gainageId };
    const expectedLoad = computeStrengthCalendarContribution(
      exerciseLike,
      seconds,
      scoring?.intensityCoeff ?? 1,
      1
    );

    const data = {
      checkedExercises: { [`2026-08-13_${gainageId}`]: true },
      reps: { [`2026-08-13_${gainageId}`]: seconds },
      exerciseIntensityCoeffs: {}
    };

    const result = calculateSportXP(data, null, null, {
      getExerciseNameById: (id) => (id === gainageId ? 'Gainage' : '')
    });

    expect(scoring?.scoringType).toBe('isometric');
    expect(result.breakdown.weightedRepsLoad).not.toBe(seconds);
    expect(result.breakdown.weightedRepsLoad).toBeCloseTo(expectedLoad, 1);
    expect(result.breakdown.weightedRepsXp).toBe(
      Math.round(result.breakdown.weightedRepsLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR)
    );
  });

  it('ne confond pas un hold isométrique avec un exercice temps cardio', () => {
    const seconds = 60;
    const data = {
      checkedExercises: { [`2026-08-13_${gainageId}`]: true },
      reps: { [`2026-08-13_${gainageId}`]: seconds },
      exerciseIntensityCoeffs: {}
    };

    const result = calculateSportXP(data, null, null, {
      getExerciseNameById: (id) => (id === gainageId ? 'Gainage' : '')
    });

    expect(result.breakdown?.timeMinutes ?? 0).toBe(0);
    expect(result.breakdown?.weightedTimeXp ?? 0).toBe(0);
  });
});
