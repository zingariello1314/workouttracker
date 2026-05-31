import { describe, it, expect } from 'vitest';
import { effectiveStrengthTier, overallStrengthTier } from './quizVolumeFromBaselines';

describe('effectiveStrengthTier', () => {
  it('repères forts l’emportent sur expérience débutante déclarée', () => {
    const answers = {
      experienceLevel: 'beginner_0_3m',
      strengthBaselineMaxes: {
        pushupsMax: 25,
        pullupsMax: 5,
        dipsMax: 17,
        plankSecMax: 90
      }
    };
    expect(overallStrengthTier(answers)).toBe('advanced');
    expect(effectiveStrengthTier(answers)).toBe('advanced');
  });
});
