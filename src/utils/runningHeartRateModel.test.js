import { describe, expect, it } from 'vitest';
import {
  classifyHeartRateZone,
  estimateUserMaxHeartRateFromPeaks,
  hrPercentOfMax
} from './runningHeartRateModel';

describe('runningHeartRateModel', () => {
  it('ajuste la FC max vers le haut quand le plafond est fréquent', () => {
    const peaks = [
      { maxHR: 198, avgHR: 141, date: '2026-01-10' },
      { maxHR: 198, avgHR: 139, date: '2026-02-15' },
      { maxHR: 197, avgHR: 175, date: '2026-03-20' },
      { maxHR: 196, avgHR: 140, date: '2026-04-05' }
    ];
    expect(estimateUserMaxHeartRateFromPeaks(peaks)).toBeGreaterThanOrEqual(200);
  });

  it('utilise la formule âge sans données', () => {
    expect(estimateUserMaxHeartRateFromPeaks([], { ageYears: 30 })).toBe(187);
  });

  it('classe les zones 1–5', () => {
    const fcMax = 200;
    expect(classifyHeartRateZone(100, fcMax)).toBe(1);
    expect(classifyHeartRateZone(130, fcMax)).toBe(2);
    expect(classifyHeartRateZone(150, fcMax)).toBe(3);
    expect(classifyHeartRateZone(170, fcMax)).toBe(4);
    expect(classifyHeartRateZone(190, fcMax)).toBe(5);
  });

  it('calcule le pourcentage FC max', () => {
    expect(hrPercentOfMax(140, 200)).toBe(70);
  });
});
