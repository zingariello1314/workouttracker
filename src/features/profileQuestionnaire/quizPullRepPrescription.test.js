import { describe, expect, it } from 'vitest';
import {
  assertPullRepsWithinBaseline,
  balancePullExercisesOnDay,
  targetRepsForPullExercise
} from './quizPullRepPrescription';
import { parseRepsMid } from './quizSessionLimits';

describe('quizPullRepPrescription', () => {
  const answers = {
    strengthBaselineMaxes: { pullupsMax: 5, pushupsMax: 25 }
  };

  it('plafonne les tractions strictes au repère quiz', () => {
    const ex = {
      exerciseBankKey: 'tractions pronation',
      name: 'Tractions pronation',
      series: '6×9'
    };
    const out = balancePullExercisesOnDay([ex], answers)[0];
    expect(parseRepsMid(out.series)).toBeLessThanOrEqual(5);
    expect(assertPullRepsWithinBaseline([out], answers)).toBe(true);
  });

  it('garde des australiennes un peu plus hautes que le strict', () => {
    const strict = targetRepsForPullExercise(
      { exerciseBankKey: 'tractions pronation', name: 'Tractions' },
      answers
    );
    const aus = targetRepsForPullExercise(
      { exerciseBankKey: 'tractions australiennes', name: 'Australiennes' },
      answers
    );
    expect(aus).toBeGreaterThan(strict);
  });
});
