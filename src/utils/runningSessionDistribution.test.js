import { describe, expect, it } from 'vitest';
import { computeRunningTypeDistribution } from './runningSessionDistribution';

describe('computeRunningTypeDistribution', () => {
  it('répartit par type précis et agrège le macro', () => {
    const rows = [
      {
        session: { id: '1', type: 'endurance', date: '2026-06-01' },
        dist: 4,
        kind: 'endurance'
      },
      {
        session: { id: '2', type: 'speed', date: '2026-06-02', avgHR: 175 },
        dist: 1,
        kind: 'speed'
      },
      {
        session: { id: '3', type: 'interval', date: '2026-06-03' },
        dist: 2,
        kind: 'interval'
      }
    ];

    const dist = computeRunningTypeDistribution(rows, { fcMax: 200 });
    expect(dist.totalKm).toBe(7);
    expect(dist.items.length).toBeGreaterThanOrEqual(2);
    expect(dist.macroKm.endurance).toBeGreaterThan(0);
    expect(dist.macroKm.speed).toBeGreaterThan(0);
    expect(dist.macroKm.interval).toBeGreaterThan(0);
  });
});
