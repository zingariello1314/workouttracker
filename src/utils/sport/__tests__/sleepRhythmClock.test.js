import { describe, expect, it } from 'vitest';
import { formatClockFr, normalizeSleepClock, parseClockMinutes, sleepClockBand } from '../sleepRhythmClock';

describe('parseClockMinutes', () => {
  it('lit HH:MM et refuse le reste', () => {
    expect(parseClockMinutes('03:12')).toBe(192);
    expect(parseClockMinutes('23:40')).toBe(1420);
    expect(parseClockMinutes('24:00')).toBeNull();
    expect(parseClockMinutes('')).toBeNull();
    expect(parseClockMinutes(null)).toBeNull();
  });
});

describe('normalizeSleepClock', () => {
  it('place le milieu de nuit de 3 h 12 à 11 h 04', () => {
    const row = normalizeSleepClock({
      ymd: '2026-05-12',
      bedTime: '03:12',
      wakeTime: '11:04',
      durationHours: 7.87
    });
    expect(row.complete).toBe(true);
    expect(row.bedMin).toBe(192);
    expect(row.wakeMin).toBe(664);
    expect(row.durationMin).toBe(472);
    expect(formatClockFr(row.midpointMin)).toBe('7 h 08');
  });

  it('compte le coucher de la veille quand il est après minuit sur l’horloge inverse', () => {
    const row = normalizeSleepClock({
      bedTime: '23:40',
      wakeTime: '07:10',
      durationHours: 7.5
    });
    expect(row.bedMin).toBe(1420 - 1440);
    expect(row.durationMin).toBe(430 + 1440 - 1420);
    expect(formatClockFr(row.bedMin)).toBe('23 h 40');
  });

  it('rejette une heure manquante', () => {
    expect(normalizeSleepClock({ bedTime: '23:40', wakeTime: null, durationHours: 7 })).toBeNull();
    expect(normalizeSleepClock({ bedTime: null, wakeTime: '07:10', durationHours: 7 })).toBeNull();
  });

  it('rejette une durée reconstruite qui contredit la durée stockée de plus de 90 min', () => {
    expect(
      normalizeSleepClock({
        bedTime: '23:00',
        wakeTime: '07:00',
        durationHours: 4
      })
    ).toBeNull();
  });

  it('rejette une nuit trop courte ou trop longue', () => {
    expect(normalizeSleepClock({ bedTime: '07:00', wakeTime: '07:40' })).toBeNull();
    expect(normalizeSleepClock({ bedTime: '01:00', wakeTime: '20:00' })).toBeNull();
  });
});

describe('sleepClockBand', () => {
  it('groupe par 30 minutes, y compris un coucher de la veille', () => {
    expect(sleepClockBand(23 * 60 + 10)).toBe(23 * 60);
    expect(sleepClockBand(23 * 60 + 40)).toBe(23 * 60 + 30);
    expect(sleepClockBand(-50)).toBe(23 * 60);
  });
});
