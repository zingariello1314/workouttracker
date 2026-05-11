import { resolveExercisePyramidPattern } from '../resolveExercisePyramidPattern';
import { PYRAMID_PATTERN_TYPES } from '../pyramidEngine';

describe('resolveExercisePyramidPattern', () => {
  test('priorité variation du jour', () => {
    const exercise = { id: 7, name: 'Tractions', series: '5×4' };
    const dailyVariations = {
      '2026-05-10': {
        exerciseTrainingPatterns: {
          '7': {
            patternType: PYRAMID_PATTERN_TYPES.FULL,
            steps: [1, 2, 1],
            rounds: 1
          }
        }
      }
    };
    const p = resolveExercisePyramidPattern({
      dailyVariations,
      dateStr: '2026-05-10',
      exercise,
      records: []
    });
    expect(p?.steps).toEqual([1, 2, 1]);
  });

  test('modèle programme auto', () => {
    const exercise = {
      id: 8,
      name: 'Pompes',
      series: '5×5',
      pyramidTemplate: { enabled: true, preset: 'auto' }
    };
    const p = resolveExercisePyramidPattern({
      dailyVariations: {},
      dateStr: '2026-05-11',
      exercise,
      records: []
    });
    expect(p).not.toBeNull();
    expect(Array.isArray(p.steps)).toBe(true);
    expect(p.totalReps).toBeGreaterThan(0);
  });
});
