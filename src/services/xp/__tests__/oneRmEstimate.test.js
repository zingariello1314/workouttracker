import { describe, expect, it } from 'vitest';
import { estimateOneRmKg, estimateOneRmKgFromSets } from '../oneRmEstimate';
import { adjustLoadedOneRmToRef } from '../loadedOneRmAdjust';

describe('estimateOneRmKg', () => {
  it('conserve un vrai 1RM', () => {
    expect(estimateOneRmKg(30, 1)).toBe(30);
  });

  it('estime depuis un set submaximal (Epley)', () => {
    expect(estimateOneRmKg(20, 8)).toBe(25.3);
  });

  it('ignore les sets trop longs', () => {
    expect(estimateOneRmKg(12, 20)).toBe(0);
  });

  it('prend le meilleur set', () => {
    expect(
      estimateOneRmKgFromSets([
        { weight: 16, reps: 10 },
        { weight: 20, reps: 6 }
      ])
    ).toBeGreaterThan(20);
  });
});

describe('adjustLoadedOneRmToRef', () => {
  it('ne change pas un 1RM à 75 kg', () => {
    expect(adjustLoadedOneRmToRef(30, 75)).toBe(30);
  });

  it('valorise davantage le même 1RM chez un lifter plus léger', () => {
    expect(adjustLoadedOneRmToRef(30, 70)).toBeGreaterThan(adjustLoadedOneRmToRef(30, 100));
  });
});
