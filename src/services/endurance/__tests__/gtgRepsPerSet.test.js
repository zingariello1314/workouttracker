import { describe, expect, it } from 'vitest';
import {
  computeGtgRepsPerSet,
  getGtgExercisePlan,
  normalizeGtgData,
  updateGtgExerciseConfig
} from '../gtgService';

describe('GTG reps par créneau', () => {
  it('sans cible explicite, applique encore ~50 % du max', () => {
    expect(computeGtgRepsPerSet(3)).toMatchObject({ reps: 2, maxReps: 3 });
    const gtg = normalizeGtgData({
      config: { selectedIds: ['pullups'], manualMax: { pullups: 3 } }
    });
    const plan = getGtgExercisePlan('pullups', {
      workoutData: { enduranceData: { gtg } }
    });
    expect(plan.repsPerSet).toBe(2);
    expect(plan.targetExplicit).toBe(false);
  });

  it('utilise le nombre saisi comme reps par créneau, sans fourchette 50 %', () => {
    let gtg = normalizeGtgData({
      config: { selectedIds: ['pullups'], manualMax: { pullups: 10 } }
    });
    gtg = updateGtgExerciseConfig(gtg, 'pullups', { repsPerSet: 3 });
    const plan = getGtgExercisePlan('pullups', {
      workoutData: { enduranceData: { gtg } }
    });
    expect(plan.repsPerSet).toBe(3);
    expect(plan.rangeLow).toBe(3);
    expect(plan.rangeHigh).toBe(3);
    expect(plan.targetExplicit).toBe(true);
  });
});
