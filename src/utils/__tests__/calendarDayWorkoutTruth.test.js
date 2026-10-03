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

  it('compte une activité Garmin sur sa date réaffectée, plus sur le jour d’enregistrement', () => {
    const opts = {
      parseDurationToMinutes: (v) => Number(v) || 0,
      calculateTimeIntensityLevel: () => 2,
      dynamicTimeThresholds: { thresholds: {} },
      workoutData: {
        garminActivityDateOverrides: { 8801: { logicalDate: '2026-10-02' } }
      }
    };
    const garminData = {
      activities: {
        cardio: [{ id: 8801, garminId: 8801, date: '2026-10-01', duration: 58 }],
        swimming: [],
        jumpRope: []
      }
    };
    expect(getRecordedGarminWorkoutForDate(garminData, '2026-10-02', opts).duration).toBe(58);
    expect(getRecordedGarminWorkoutForDate(garminData, '2026-10-01', opts).duration).toBe(0);
  });
});
