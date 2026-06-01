import { describe, expect, it } from 'vitest';
import {
  adjustIntensitySplitForRunningProfile,
  inferRunningSessionProfile
} from './quizRunningSessionProfile';

describe('quizRunningSessionProfile', () => {
  it('endurance augmente la part easy', () => {
    const split = adjustIntensitySplitForRunningProfile(
      { easy: 0.7, tempo: 0.2, intervals: 0.1 },
      'endurance'
    );
    expect(split.easy).toBeGreaterThan(0.8);
  });

  it('infère return depuis runningGoal', () => {
    expect(inferRunningSessionProfile({ runningGoal: 'return_to_run' })).toBe('return');
  });
});
