import { describe, expect, it } from 'vitest';
import { computeCalendarChampionAnalysis, scoreCalendarDayIntensity } from './calendarDayChampion';

describe('calendarDayChampion', () => {
  const workoutData = {
    checkedExercises: { '2026-06-17_1': true },
    reps: { '2026-06-17_1': 100 },
    enduranceData: {
      sessions: {
        running: [
          {
            id: 'run-ef',
            garminId: 'g-ef',
            date: '2026-06-17',
            distance: 4.2,
            duration: '00:39:54',
            type: 'endurance'
          },
          {
            id: 'run-speed',
            garminId: 'g-speed',
            date: '2026-06-17',
            distance: 1.02,
            duration: '00:04:49',
            type: 'speed'
          }
        ]
      }
    }
  };

  const garminData = {
    dailyMetrics: {
      '2026-06-17': { calories: { active: 820 } }
    },
    activities: {
      cardio: [
        {
          garminId: 'g-street',
          date: '2026-06-17',
          duration: 3360,
          activityName: 'Pessac Cardio'
        },
        {
          garminId: 'g-ef',
          date: '2026-06-17',
          duration: 2394,
          distance: 4200,
          activityName: 'Pessac Course à pied',
          activityType: 'running',
          displayActivityType: 'running',
          running: { laps: [], distanceMeters: 4200 }
        },
        {
          garminId: 'g-speed',
          date: '2026-06-17',
          duration: 289,
          distance: 1020,
          activityName: 'Pessac Course à pied',
          activityType: 'running',
          displayActivityType: 'running',
          running: { laps: [], distanceMeters: 1020 }
        }
      ]
    }
  };

  it('lit les kcal actives depuis dailyMetrics.calories.active', () => {
    const day = scoreCalendarDayIntensity('2026-06-17', {
      workoutData,
      garminDaily: garminData.dailyMetrics['2026-06-17'],
      garminCardio: garminData.activities.cardio
    });
    expect(day.breakdown.activeKcal).toBe(820);
  });

  it('compte les minutes de course classique (format HH:MM:SS)', () => {
    const day = scoreCalendarDayIntensity('2026-06-17', {
      workoutData,
      garminDaily: garminData.dailyMetrics['2026-06-17'],
      garminCardio: garminData.activities.cardio
    });
    expect(day.breakdown.enduranceMinutes).toBeGreaterThanOrEqual(39);
    expect(day.breakdown.runningKm).toBeGreaterThan(5);
  });

  it('compare le champion à la moyenne des autres jours actifs', () => {
    const light = {
      checkedExercises: { '2026-06-10_1': true },
      reps: { '2026-06-10_1': 50 },
      enduranceData: { sessions: {} }
    };
    const analysis = computeCalendarChampionAnalysis({
      workoutData: {
        ...workoutData,
        checkedExercises: {
          ...workoutData.checkedExercises,
          ...light.checkedExercises
        },
        reps: { ...workoutData.reps, ...light.reps }
      },
      garminData: {
        dailyMetrics: {
          '2026-06-17': garminData.dailyMetrics['2026-06-17'],
          '2026-06-10': { calories: { active: 200 } }
        },
        activities: garminData.activities
      }
    });
    expect(analysis.champion?.date).toBe('2026-06-17');
    expect(analysis.champion?.vsAverage?.reps).toBeGreaterThan(0);
  });
});
