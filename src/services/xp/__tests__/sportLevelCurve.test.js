import { describe, it, expect } from 'vitest';
import {
  cumulXpForLevel,
  xpRequiredForLevelUp,
  levelFromTotalXp,
  sportXpProgressInLevel
} from '../sportLevelCurve';

describe('sportLevelCurve', () => {
  it('cumulXpForLevel(1) is 0', () => {
    expect(cumulXpForLevel(1)).toBe(0);
  });

  it('xpRequiredForLevelUp follows 500 + 30*(L-1)', () => {
    expect(xpRequiredForLevelUp(1)).toBe(500);
    expect(xpRequiredForLevelUp(2)).toBe(530);
  });

  it('levelFromTotalXp inverts cumul', () => {
    expect(levelFromTotalXp(0)).toBe(1);
    expect(levelFromTotalXp(499)).toBe(1);
    expect(levelFromTotalXp(500)).toBe(2);
  });

  it('sportXpProgressInLevel spans between cumul thresholds', () => {
    const p = sportXpProgressInLevel(500);
    expect(p.level).toBe(2);
    expect(p.xpOnLevel).toBe(0);
    expect(p.xpForLevel).toBe(xpRequiredForLevelUp(2));
  });
});
