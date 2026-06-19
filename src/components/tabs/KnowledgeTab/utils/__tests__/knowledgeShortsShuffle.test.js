import { describe, expect, it } from 'vitest';
import {
  buildSpacedFeedBatch,
  computeMinGapBetweenRepeats,
  hasConsecutiveDuplicate,
  minIndexGapForVideo,
  SHORTS_MIN_OTHER_VIDEOS_BETWEEN_REPEAT
} from '../knowledgeShortsShuffle';

const pool = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
  { id: 'd', title: 'D' },
  { id: 'e', title: 'E' }
];

describe('knowledgeShortsShuffle', () => {
  it('calcule un écart minimum adapté à la taille du catalogue', () => {
    expect(computeMinGapBetweenRepeats(1)).toBe(0);
    expect(computeMinGapBetweenRepeats(2)).toBe(1);
    expect(computeMinGapBetweenRepeats(5)).toBe(
      Math.min(4, SHORTS_MIN_OTHER_VIDEOS_BETWEEN_REPEAT)
    );
  });

  it('évite les doublons consécutifs sur un lot généré', () => {
    for (let run = 0; run < 20; run += 1) {
      const { items } = buildSpacedFeedBatch(pool, 30);
      expect(hasConsecutiveDuplicate(items)).toBe(false);
    }
  });

  it('espace les répétitions quand le catalogue le permet', () => {
    for (let run = 0; run < 20; run += 1) {
      const { items } = buildSpacedFeedBatch(pool, 40);
      for (const v of pool) {
        const gap = minIndexGapForVideo(items, v.id);
        if (gap !== Infinity) {
          expect(gap).toBeGreaterThan(1);
        }
      }
    }
  });

  it('enchaîne les lots sans doublon à la jonction', () => {
    const first = buildSpacedFeedBatch(pool, 10);
    const second = buildSpacedFeedBatch(pool, 10, first.recentIds);
    const merged = [...first.items, ...second.items];
    expect(hasConsecutiveDuplicate(merged)).toBe(false);
  });
});
