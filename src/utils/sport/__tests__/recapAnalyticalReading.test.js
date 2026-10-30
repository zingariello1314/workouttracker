import { describe, expect, it } from 'vitest';
import {
  composeAnalyticalReading,
  densityImplication,
  pushPullImplication,
  calendarGapImplication,
  volumeShapeImplication,
  peakDayImplication,
  isMetricOnlyTitle
} from '../recapAnalyticalReading';

describe('composeAnalyticalReading', () => {
  it('assemble titre-thèse + beats dans l’ordre, sans hedges inventés', () => {
    const reading = composeAnalyticalReading({
      titleThesis: 'La poussée domine nettement le tirage de ces 7 jours',
      constat: '108 reps de dos contre 470 de poussée',
      mechanism: 'Le haut du corps reçoit plus de travail en poussée qu’en tirage',
      scope: 'Le dos représente environ 18 % du volume de tirage mensuel sur cette fenêtre',
      implication: 'Le stimulus dominant est la poussée'
    });
    expect(reading.title).toBe('La poussée domine nettement le tirage de ces 7 jours');
    expect(reading.body).toMatch(/108 reps/);
    expect(reading.body).toMatch(/stimulus dominant/);
    expect(reading.body).not.toMatch(/il faudrait|Si tes autres/i);
    expect(reading.beats.mechanism).toBeTruthy();
  });

  it('omet les beats absents sans remplir avec du générique', () => {
    const reading = composeAnalyticalReading({
      titleThesis: 'Le volume repose sur peu de journées',
      constat: '3 jours entraînés, 4 sans séance'
    });
    expect(reading.body).toBe('3 jours entraînés, 4 sans séance.');
    expect(reading.beats.implication).toBeNull();
  });
});

describe('garde-fous titre / implications', () => {
  it('détecte un titre qui n’est qu’une métrique', () => {
    expect(isMetricOnlyTitle('27,9 % Les pectoraux')).toBe(true);
    expect(isMetricOnlyTitle('La poussée domine le tirage')).toBe(false);
  });

  it('densityImplication ne force rien si l’écart est mince', () => {
    expect(densityImplication({ denser: true, vsPct: 2 })).toBeNull();
    expect(densityImplication({ denser: true, vsPct: 12 })).toMatch(/compresses/i);
  });

  it('pushPullImplication borne le message', () => {
    expect(pushPullImplication({ pushReps: 470, pullReps: 108 })).toMatch(/poussée/i);
    expect(pushPullImplication({ pushReps: 100, pullReps: 90 })).toBeNull();
  });

  it('calendarGapImplication sur fenêtre courte', () => {
    expect(
      calendarGapImplication({ trainedDays: 3, quietDays: 4, spanDays: 7 })
    ).toMatch(/peu de journées|régularité/i);
  });

  it('volumeShapeImplication et peakDayImplication restent bornés', () => {
    expect(volumeShapeImplication({ singleDay: true })).toMatch(/une journée/i);
    expect(volumeShapeImplication({})).toBeNull();
    expect(peakDayImplication({ sharePct: 45 })).toMatch(/moyenne/i);
    expect(peakDayImplication({ aboveMedian: true })).toMatch(/point haut|habitude/i);
  });
});
