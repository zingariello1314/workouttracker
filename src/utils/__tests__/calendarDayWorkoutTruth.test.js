import { describe, expect, it } from 'vitest';
import {
  dayHasLoggedVoluntaryWorkout,
  getRecordedGarminWorkoutForDate
} from '../calendarDayWorkoutTruth';

describe('calendarDayWorkoutTruth', () => {
  it('dayHasLoggedVoluntaryWorkout est false sans enregistrement', () => {
    expect(
      dayHasLoggedVoluntaryWorkout({
        completedExercises: 0,
        enduranceSessionCount: 0,
        isComplementaryChecked: false
      })
    ).toBe(false);
  });

  it('dayHasLoggedVoluntaryWorkout est true avec exercices cochés', () => {
    expect(
      dayHasLoggedVoluntaryWorkout({
        completedExercises: 2,
        enduranceSessionCount: 0,
        isComplementaryChecked: false
      })
    ).toBe(true);
  });

  it('ignore le Garmin passif sans activité enregistrée', () => {
    const result = getRecordedGarminWorkoutForDate(
      {
        dailyMetrics: {
          '2026-08-12': {
            intensityMinutes: { total: 36 },
            activeTime: 45
          }
        },
        activities: { cardio: [], swimming: [], jumpRope: [] }
      },
      '2026-08-12',
      {
        parseDurationToMinutes: (v) => Number(v) || 0,
        calculateTimeIntensityLevel: () => 3,
        dynamicTimeThresholds: { thresholds: {} }
      }
    );
    expect(result.hasActivity).toBe(false);
    expect(result.duration).toBe(0);
  });

  it('compte une course Garmin enregistrée', () => {
    const result = getRecordedGarminWorkoutForDate(
      {
        activities: {
          cardio: [{ date: '2026-08-12', duration: 42 }],
          swimming: [],
          jumpRope: []
        }
      },
      '2026-08-12',
      {
        parseDurationToMinutes: (v) => Number(v) || 0,
        calculateTimeIntensityLevel: () => 2,
        dynamicTimeThresholds: { thresholds: {} }
      }
    );
    expect(result.hasActivity).toBe(true);
    expect(result.duration).toBe(42);
  });
});
