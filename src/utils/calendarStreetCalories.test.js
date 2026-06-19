import { describe, expect, it } from 'vitest';
import {
  computeStreetWorkoutCaloriesAverageKcal,
  getStreetWorkoutCaloriesKcalForDate,
  isGarminStreetCardioActivity
} from './calendarPhysicalSessionStripes';
import { buildWorkoutDetailContext } from './calendarDayRecapDetail';

describe('street workout calories', () => {
  const garminData = {
    activities: {
      cardio: [
        {
          garminId: 'street-1',
          date: '2026-06-18',
          duration: 4420,
          activityName: 'Pessac Cardio',
          calories: { active: 325 }
        },
        {
          garminId: 'street-2',
          date: '2026-06-16',
          duration: 4000,
          activityName: 'Pessac Cardio',
          calories: { active: 280 }
        },
        {
          garminId: 'run-1',
          date: '2026-06-18',
          duration: 2400,
          distance: 5000,
          activityName: 'Pessac Course à pied',
          activityType: 'running',
          running: { distanceMeters: 5000 }
        }
      ]
    }
  };

  const workoutData = {
    checkedExercises: {
      '2026-06-18_1': true,
      '2026-06-16_1': true
    },
    reps: { '2026-06-18_1': 403, '2026-06-16_1': 350 }
  };

  it('isGarminStreetCardioActivity exclut course et marche', () => {
    expect(isGarminStreetCardioActivity(garminData.activities.cardio[0])).toBe(true);
    expect(isGarminStreetCardioActivity(garminData.activities.cardio[2])).toBe(false);
  });

  it('somme kcal street du jour sans inclure la course', () => {
    expect(getStreetWorkoutCaloriesKcalForDate(garminData, '2026-06-18')).toBe(325);
  });

  it('moyenne kcal sur les autres séances street', () => {
    const { average, sampleCount } = computeStreetWorkoutCaloriesAverageKcal(
      garminData,
      workoutData,
      '2026-06-18'
    );
    expect(average).toBe(280);
    expect(sampleCount).toBe(1);
  });

  it('buildWorkoutDetailContext expose durée Garmin et kcal', () => {
    const ctx = buildWorkoutDetailContext(
      workoutData,
      '2026-06-18',
      { reps: 403, duration: 74, completedCount: 9, session: { exercises: [] } },
      garminData
    );
    expect(ctx.durationMin).toBe(74);
    expect(ctx.caloriesKcal).toBe(325);
    expect(ctx.avgCaloriesKcal).toBe(280);
  });
});
