import { describe, expect, it } from 'vitest';
import { mergeGarminDataForRecap, recapGarminRangeForWindow } from '../recapGarminMerge';
import { extractSleepNight } from '../recapSleepNight';

describe('mergeGarminDataForRecap', () => {
  it('unionne les dates et garde la nuit du partial si le bundle est vide', () => {
    const merged = mergeGarminDataForRecap(
      { dailyMetrics: { '2026-08-01': { calories: { active: 400 } } }, activities: { cardio: [] } },
      {
        status: 'ready',
        dailyMetrics: {
          '2026-08-31': {
            sleep: { duration: 7.7, deep: 1.05, rem: 1.5, light: 5.1, awake: 0.3 }
          }
        }
      }
    );
    expect(merged.dailyMetrics['2026-08-01'].calories.active).toBe(400);
    const night = extractSleepNight(merged, '2026-08-31');
    expect(night).toBeTruthy();
    expect(night.hours).toBeGreaterThan(7);
  });

  it('ne jette pas une nuit du bundle si le partial n’a que les pas du jour', () => {
    const merged = mergeGarminDataForRecap(
      {
        dailyMetrics: {
          '2026-08-31': { sleep: { duration: 7.8, deep: 1.1, rem: 1.4, light: 5.0 } }
        }
      },
      {
        status: 'ready',
        dailyMetrics: { '2026-08-31': { steps: 9000 } }
      }
    );
    expect(merged.dailyMetrics['2026-08-31'].steps).toBe(9000);
    expect(extractSleepNight(merged, '2026-08-31')?.hours).toBeGreaterThan(7);
  });

  it('ignore un partial encore en loading', () => {
    const merged = mergeGarminDataForRecap(
      { dailyMetrics: { '2026-08-31': { sleep: { duration: 7.5 } } } },
      { status: 'loading', dailyMetrics: {} }
    );
    expect(extractSleepNight(merged, '2026-08-31')?.hours).toBeGreaterThan(7);
  });

  it('ne remplace pas une vraie nuit par un sleep.duration à 0', () => {
    const merged = mergeGarminDataForRecap(
      {
        dailyMetrics: {
          '2026-08-31': { sleep: { duration: 7.8, deep: 1.1, rem: 1.4, light: 5.0 } }
        }
      },
      {
        status: 'ready',
        dailyMetrics: { '2026-08-31': { sleep: { duration: 0 }, calories: { active: 400 } } }
      }
    );
    expect(merged.dailyMetrics['2026-08-31'].calories.active).toBe(400);
    expect(extractSleepNight(merged, '2026-08-31')?.hours).toBeGreaterThan(7);
  });

  it('élargit une fenêtre 7 j. à 90 j. de nuits', () => {
    const range = recapGarminRangeForWindow({ start: '2026-08-26', end: '2026-09-01' });
    expect(range.endYmd).toBe('2026-09-01');
    expect(range.startYmd).toBe('2026-06-04');
  });
});
