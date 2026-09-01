import { describe, expect, it } from 'vitest';
import {
  extractRecentSleepNights,
  extractSleepNight,
  garminDurationToMinutes
} from '../recapSleepNight';

function garmin(days) {
  return { dailyMetrics: days };
}

describe('recapSleepNight', () => {
  it('normalise une durée en heures et les alias calendrier deep/rem/light', () => {
    const night = extractSleepNight(
      garmin({
        '2026-08-31': {
          sleep: {
            duration: 7.77,
            deep: 1.03,
            rem: 1.52,
            light: 5.22,
            awake: 0.3,
            efficiency: 93,
            bedTime: '23:12',
            wakeTime: '07:10',
            avgHR: 57
          },
          heartRate: { resting: 52 },
          bodyBattery: { start: 38, end: 92, charged: 54 }
        }
      }),
      '2026-08-31'
    );
    expect(night).toBeTruthy();
    expect(night.hours).toBeCloseTo(7.77, 1);
    expect(night.deepMin).toBeGreaterThanOrEqual(60);
    expect(night.deepMin).toBeLessThanOrEqual(64);
    expect(night.remMin).toBeGreaterThanOrEqual(90);
    expect(night.awakeMin).toBeGreaterThanOrEqual(17);
    expect(night.awakeMin).toBeLessThanOrEqual(19);
    expect(night.efficiency).toBe(93);
    expect(night.sleepHr).toBe(57);
    expect(night.rhr).toBe(52);
    expect(night.bodyBatteryStart).toBe(38);
    expect(night.bodyBatteryEnd).toBe(92);
    expect(night.bodyBatteryCharged).toBe(54);
    expect(night.source).toBe('garmin.dailyMetrics');
  });

  it('accepte les alias onglet Garmin (deepSleep, remSleep, minutes)', () => {
    const night = extractSleepNight(
      garmin({
        '2026-08-30': {
          sleep: {
            duration: 466,
            deepSleep: 62,
            remSleep: 91,
            lightSleep: 313,
            awake: 18,
            quality: 88
          }
        }
      }),
      '2026-08-30'
    );
    expect(night.totalMin).toBe(466);
    expect(night.hours).toBeCloseTo(7.77, 1);
    expect(night.deepMin).toBe(62);
    expect(night.remMin).toBe(91);
    expect(night.quality).toBe(88);
  });

  it('retourne null sans inventer une nuit — silence, pas un message', () => {
    expect(extractSleepNight(garmin({}), '2026-08-31')).toBeNull();
    expect(extractSleepNight(garmin({ '2026-08-31': {} }), '2026-08-31')).toBeNull();
    expect(
      extractSleepNight(
        garmin({ '2026-08-31': { sleep: { duration: 0.4 } } }),
        '2026-08-31'
      )
    ).toBeNull();
  });

  it('remonte les 7 dernières nuits présentes, en sautant les jours vides', () => {
    const days = {};
    days['2026-08-31'] = { sleep: { duration: 7.8 } };
    days['2026-08-29'] = { sleep: { duration: 8.2 } };
    days['2026-08-28'] = { sleep: { duration: 6.7 } };
    days['2026-08-27'] = { sleep: { duration: 7.1 } };
    days['2026-08-26'] = { sleep: { duration: 7.5 } };
    days['2026-08-25'] = { sleep: { duration: 7.4 } };
    days['2026-08-24'] = { sleep: { duration: 7.9 } };
    days['2026-08-23'] = { sleep: { duration: 6.4 } };
    const nights = extractRecentSleepNights(garmin(days), '2026-08-31', 7);
    expect(nights).toHaveLength(7);
    expect(nights[0].ymd).toBe('2026-08-31');
    expect(nights.map((n) => n.ymd)).not.toContain('2026-08-30');
    expect(nights[6].ymd).toBe('2026-08-24');
  });

  it('convertit heures et minutes selon la convention Garmin calendrier', () => {
    expect(garminDurationToMinutes(7.77)).toBe(466);
    expect(garminDurationToMinutes(466)).toBe(466);
    expect(garminDurationToMinutes(0)).toBeNull();
  });
});
