import {
  buildAscendingSteps,
  buildFullPyramidSteps,
  sumStepsReps,
  estimateMaxBandFromStraightSets,
  clampPeakFromMax,
  buildPyramidSuggestions,
  pickSuggestionClosestToVolume,
  formatStepsDash,
  normalizeTrainingPattern,
  PYRAMID_PATTERN_TYPES
} from '../pyramidEngine';

describe('pyramidEngine', () => {
  test('buildAscendingSteps', () => {
    expect(buildAscendingSteps(4)).toEqual([1, 2, 3, 4]);
    expect(buildAscendingSteps(1)).toEqual([1]);
  });

  test('buildFullPyramidSteps', () => {
    expect(buildFullPyramidSteps(5)).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);
    expect(sumStepsReps(buildFullPyramidSteps(5), 1)).toBe(25);
  });

  test('estimateMaxBandFromStraightSets', () => {
    const b = estimateMaxBandFromStraightSets({ sets: 5, repsPerSet: 4 });
    expect(b.min).toBeGreaterThan(4);
    expect(b.max).toBeGreaterThanOrEqual(b.min);
  });

  test('clampPeakFromMax', () => {
    expect(clampPeakFromMax(10, { ratio: 0.7, minPeak: 3, maxPeak: 12 })).toBe(7);
  });

  test('pickSuggestionClosestToVolume', () => {
    const s = buildPyramidSuggestions({
      observedMax: 10,
      meanSessionTotal: 20,
      sessionsPerWeek: 3,
      straightSets: { sets: 5, repsPerSet: 4 }
    });
    const p = pickSuggestionClosestToVolume(s, { sets: 5, repsPerSet: 4 });
    expect(p).toBeTruthy();
    expect(p.totalReps).toBeGreaterThan(0);
  });

  test('buildPyramidSuggestions returns 3 options', () => {
    const s = buildPyramidSuggestions({
      observedMax: 10,
      meanSessionTotal: 20,
      sessionsPerWeek: 3,
      straightSets: { sets: 5, repsPerSet: 4 }
    });
    expect(s).toHaveLength(3);
    expect(s[0].totalReps).toBeGreaterThan(0);
    expect(s.every((x) => Array.isArray(x.steps))).toBe(true);
  });

  test('formatStepsDash', () => {
    expect(formatStepsDash([1, 2, 3])).toBe('1-2-3');
  });

  test('normalizeTrainingPattern rejects unknown type', () => {
    expect(normalizeTrainingPattern({ patternType: 'foo', steps: [1, 2] })).toBeNull();
  });

  test('normalizeTrainingPattern accepts LIGHT', () => {
    const p = normalizeTrainingPattern({
      patternType: PYRAMID_PATTERN_TYPES.LIGHT,
      steps: [1, 2, 3, 2, 1],
      rounds: 1
    });
    expect(p).not.toBeNull();
    expect(p.totalReps).toBe(9);
  });
});
