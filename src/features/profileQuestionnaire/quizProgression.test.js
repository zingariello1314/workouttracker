import { describe, it, expect } from 'vitest';
import {
  buildProgramProgressionPlan,
  resolveCycleWeekMeta,
  scaleSeriesForProgressionPhase,
  progressionVolumeMulForWeek1
} from './quizProgression';

describe('quizProgression', () => {
  it('cycle 6 semaines : adaptation puis deload', () => {
    const plan = buildProgramProgressionPlan(6);
    expect(plan).toHaveLength(6);
    expect(plan[0].phase).toBe('adaptation');
    expect(plan[5].phase).toBe('deload');
    expect(progressionVolumeMulForWeek1(6)).toBeLessThan(1);
  });

  it('scaleSeriesForProgressionPhase réduit les séries en adaptation', () => {
    const scaled = scaleSeriesForProgressionPhase('4×10', resolveCycleWeekMeta(6, 1));
    expect(scaled).toMatch(/^3×/);
  });

  it('ne modifie pas le cardio temps', () => {
    const s = scaleSeriesForProgressionPhase('1×25 min', { volumeFactor: 0.8 });
    expect(s).toBe('1×25 min');
  });
});
