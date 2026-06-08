import { describe, expect, it } from 'vitest';
import {
  buildSleepDetailContext,
  buildStepsDetailContext,
  canDrillDownRecapRow
} from './calendarDayRecapDetail';

describe('calendarDayRecapDetail', () => {
  const garminData = {
    stepsGoal: 10000,
    dailyMetrics: {
      '2026-06-01': { steps: 8000 },
      '2026-06-02': {
        steps: 15076,
        stepsGoal: 10000,
        sleep: {
          duration: 13.03,
          deepSleep: 2.1,
          lightSleep: 6.5,
          remSleep: 3.2,
          awake: 0.3,
          quality: 82,
          bedTime: '22:15',
          wakeTime: '11:17'
        },
        heartRate: {
          resting: 50,
          min: 50,
          max: 190,
          avg: 72,
          timeSeries: [
            { timestamp: Date.parse('2026-06-02T08:00:00'), bpm: 65 },
            { timestamp: Date.parse('2026-06-02T12:00:00'), bpm: 120 },
            { timestamp: Date.parse('2026-06-02T18:00:00'), bpm: 80 }
          ]
        },
        stress: { average: 17, max: 45 }
      }
    }
  };

  it('canDrillDownRecapRow accepte les kinds connus', () => {
    expect(canDrillDownRecapRow({ kind: 'sleep' })).toBe(true);
    expect(canDrillDownRecapRow({ kind: 'unknown' })).toBe(false);
  });

  it('buildSleepDetailContext expose phases et horaires', () => {
    const ctx = buildSleepDetailContext(garminData, '2026-06-02');
    expect(ctx?.totalLabel).toContain('h');
    expect(ctx?.bedTime).toBe('22:15');
    expect(ctx?.sleepChartData.length).toBe(1);
  });

  it('buildStepsDetailContext calcule moyennes et objectif', () => {
    const ctx = buildStepsDetailContext(garminData, '2026-06-02', {});
    expect(ctx.today).toBe(15076);
    expect(ctx.goal).toBe(10000);
    expect(ctx.pct).toBe(151);
    expect(ctx.weekAvg).toBeGreaterThan(0);
  });
});
