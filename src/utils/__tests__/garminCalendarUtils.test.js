import { describe, expect, it } from 'vitest';
import { calculateDayIntensityWithGarmin } from '../garminCalendarUtils';

describe('calculateDayIntensityWithGarmin', () => {
  it('convertit la durée Garmin (secondes) en minutes pour le temps réel', () => {
    const garminData = {
      activities: {
        cardio: [{ date: '2026-06-18', duration: 4420 }]
      }
    };
    const adjusted = calculateDayIntensityWithGarmin(
      '2026-06-18',
      { level: 3, duration: 74, reps: 400 },
      garminData
    );
    expect(adjusted.adjustments.timeReal).not.toBeNull();
    expect(adjusted.adjustments.timeReal.réel).toBe(74);
    expect(adjusted.adjustments.timeReal.prévu).toBe(74);
  });
});
