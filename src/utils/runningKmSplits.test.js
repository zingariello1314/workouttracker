import { describe, it, expect } from 'vitest';
import { buildKmSplitsFromLaps, parseClockToSeconds } from './runningKmSplits';

describe('runningKmSplits', () => {
  it('parseClockToSeconds', () => {
    expect(parseClockToSeconds('01:02:57')).toBe(3777);
    expect(parseClockToSeconds('6:16')).toBe(376);
  });

  it('buildKmSplitsFromLaps sur tours ~1 km', () => {
    const laps = [
      { index: 1, distanceKm: 1, durationSeconds: 360, avgSpeedKmh: 10 },
      { index: 2, distanceKm: 1, durationSeconds: 380, avgSpeedKmh: 9.5 },
      { index: 3, distanceKm: 1.01, durationSeconds: 370, avgSpeedKmh: 9.8 }
    ];
    const out = buildKmSplitsFromLaps(laps, {
      session: { distance: '3.01', duration: '01:09:10' }
    });
    expect(out.rows).toHaveLength(3);
    expect(out.rows[0].paceSecPerKm).toBeCloseTo(360, 0);
    expect(out.totals.durationSeconds).toBeGreaterThan(1000);
    expect(out.totals.paceSecPerKm).toBeTruthy();
  });
});
