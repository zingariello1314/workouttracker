import { describe, expect, it } from 'vitest';
import { buildTrainingRhythmDiscoveries } from '../trainingRhythmDiscoveries.js';

describe('buildTrainingRhythmDiscoveries', () => {
  it('détecte streak, gap et jour dominant', () => {
    const repsByDate = {
      '2026-10-06': 200,
      '2026-10-07': 220,
      '2026-10-08': 210,
      '2026-10-12': 180,
      '2026-10-19': 190,
      '2026-10-20': 200,
      '2026-10-27': 210
    };
    const discs = buildTrainingRhythmDiscoveries(repsByDate, {
      start: '2026-10-06',
      end: '2026-10-27'
    });
    const kinds = discs.map((d) => d.kind);
    expect(kinds).toContain('disc_rhythm_streak');
    expect(kinds).toContain('disc_rhythm_gap');
    expect(discs.find((d) => d.kind === 'disc_rhythm_streak')?.metrics?.streakDays).toBe(3);
    expect(discs.find((d) => d.kind === 'disc_rhythm_gap')?.metrics?.maxGapDays).toBeGreaterThanOrEqual(5);
  });
});
