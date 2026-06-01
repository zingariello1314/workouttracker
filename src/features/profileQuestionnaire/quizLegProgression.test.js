import { describe, it, expect } from 'vitest';
import { isStrengthExerciseAllowed } from './quizLegProgression';

describe('quizLegProgression', () => {
  it('refuse pistol pour débutant', () => {
    expect(
      isStrengthExerciseAllowed('pistol squat', {
        experienceLevel: 'beginner_0_3m',
        strengthBaselineMaxes: { pullupsMax: 5, dipsMax: 17, squatGobletMax: 8 }
      })
    ).toBe(false);
  });

  it('autorise goblet pour débutant', () => {
    expect(
      isStrengthExerciseAllowed('squat gobelet', {
        experienceLevel: 'beginner_0_3m',
        strengthBaselineMaxes: { squatGobletMax: 12 }
      })
    ).toBe(true);
  });
});
