import { describe, it, expect } from 'vitest';
import {
  computeWeeklyMuscleCaps,
  estimatePlannedWeeklySetsByFamily,
  applyMuscleVolumeCaps
} from './quizMuscleVolumeCaps';

describe('quizMuscleVolumeCaps', () => {
  it('caps dynamiques selon récupération', () => {
    const low = computeWeeklyMuscleCaps({}, 35, 4);
    const high = computeWeeklyMuscleCaps({}, 82, 5);
    expect(high.pull).toBeGreaterThan(low.pull);
  });

  it('réduit le poids des groupes surchargés', () => {
    const weekProfiles = {
      lundi: { modality: 'strength', groups: ['upper'] },
      mardi: { modality: 'strength', groups: ['upper'] },
      mercredi: { modality: 'strength', groups: ['upper'] },
      jeudi: { modality: 'strength', groups: ['upper'] },
      vendredi: { modality: 'strength', groups: ['upper'] }
    };
    const activeDayKeys = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    const planned = estimatePlannedWeeklySetsByFamily(weekProfiles, activeDayKeys);
    expect(planned.push + planned.pull).toBeGreaterThan(20);

    const result = applyMuscleVolumeCaps({
      deformers: {
        volumeMul: 1,
        maxExercisesPerSession: 8,
        preferredGroupWeights: { upper: 1.1, lower: 1, core: 1, cardio: 1 }
      },
      weekProfiles,
      activeDayKeys,
      answers: {},
      constraints: { recoveryScore: 70 },
      snapshot: null
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.deformers.preferredGroupWeights.upper).toBeLessThan(1.1);
  });
});
