import { describe, it, expect } from 'vitest';
import { computeBlendedExerciseEffortStars } from '../exerciseSessionEffortBlend';

describe('exerciseSessionEffortBlend', () => {
  const ex = { id: 101, name: 'Pompes' };

  it('sans historique coché retombe sur l indice auto', () => {
    const r = computeBlendedExerciseEffortStars({}, ex);
    expect(r.source).toBe('auto');
    expect(r.displayStars).toBe(r.autoStars);
  });

  it('intègre le ressenti fiche quand renseigné', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      exerciseSessionEffortStars: {},
      exercisePerceivedRatings: {
        '101': {
          schemaVersion: 2,
          effortGlobal: 5,
          technicalDifficulty: 4,
          fatigueAfter: 4,
          recoveryTime: 3,
          pleasure: 2,
          wantAgain: 3,
          jointDiscomfort: 3,
          muscleConnection: 3
        }
      },
      exerciseIntensityCoeffs: {},
      exerciseWeights: {}
    };
    const r = computeBlendedExerciseEffortStars(data, ex);
    expect(String(r.source).includes('perceived')).toBe(true);
    expect(r.perceivedStars).toBeGreaterThanOrEqual(1);
    expect(r.perceivedStars).toBeLessThanOrEqual(5);
    expect(r.displayStars).toBeGreaterThanOrEqual(1);
  });

  it('fusionne plusieurs séances avec étoiles utilisateur', () => {
    const data = {
      checkedExercises: {
        '2026-05-01_101': true,
        '2026-05-06_101': true
      },
      reps: {
        '2026-05-01_101': '10',
        '2026-05-06_101': '9'
      },
      exerciseSessionEffortStars: {
        '2026-05-01_101': 4,
        '2026-05-06_101': 4
      },
      exerciseWeights: {},
      exerciseIntensityCoeffs: {}
    };
    const r = computeBlendedExerciseEffortStars(data, ex);
    expect(r.source).toMatch(/^blend_stars_history(_perceived)?$/);
    expect(r.starredSessionCount).toBe(2);
    expect(r.displayStars).toBeGreaterThanOrEqual(1);
    expect(r.displayStars).toBeLessThanOrEqual(5);
  });
});
