import { describe, it, expect } from 'vitest';
import {
  resolveTriathlonMissionId,
  adjustIntensitySplitForTriathlonWeakLeg
} from './quizTriathlonResolver';

describe('quizTriathlonResolver', () => {
  it('résout triathlon + distance olympique', () => {
    expect(
      resolveTriathlonMissionId({
        primaryMission: 'triathlon',
        triathlonDistance: 'olympic'
      })
    ).toBe('triathlon_olympic');
  });

  it('résout clé explicite triathlon_iron', () => {
    expect(resolveTriathlonMissionId({ primaryMission: 'triathlon_iron' })).toBe('triathlon_iron');
  });

  it('ajuste split pour point faible course', () => {
    const base = { easy: 0.72, tempo: 0.18, intervals: 0.1 };
    const adj = adjustIntensitySplitForTriathlonWeakLeg(base, 'run');
    expect(adj.intervals).toBeGreaterThan(base.intervals);
    expect(adj.easy).toBeLessThan(base.easy);
  });
});
