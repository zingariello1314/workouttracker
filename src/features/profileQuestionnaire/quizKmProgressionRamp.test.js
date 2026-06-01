import { describe, expect, it } from 'vitest';
import { buildWeeklyKmProgressionRamp, kmProgressionSummaryFr } from './quizKmProgressionRamp';

describe('quizKmProgressionRamp', () => {
  it('produit une rampe croissante puis deload', () => {
    const ramp = buildWeeklyKmProgressionRamp(40, 8, 15);
    expect(ramp.length).toBe(8);
    expect(ramp[0].kmTarget).toBeLessThan(ramp[3].kmTarget);
    expect(ramp[ramp.length - 1].kmTarget).toBeLessThanOrEqual(ramp[3].kmTarget);
    expect(kmProgressionSummaryFr(ramp)).toMatch(/Rampe course/);
  });
});
