import { describe, expect, it } from 'vitest';
import { computeCalendarMonthSportStats } from './calendarMonthSportStats';
import { computeNonRunningExerciseMinutesForDate } from './calendarPhysicalSessionStripes';

const getDateStr = (d) => d.toISOString().slice(0, 10);

describe('computeCalendarMonthSportStats', () => {
  it('ne double-compte pas une sortie Garmin déjà fusionnée', () => {
    const workoutData = {
      enduranceData: {
        sessions: {
          running: [
            {
              id: 'g1',
              garminId: 'g1',
              date: '2026-03-15',
              duration: '30:00',
              source: 'garmin'
            }
          ]
        }
      }
    };
    const garminData = {
      activities: {
        cardio: [
          {
            garminId: 'g1',
            date: '2026-03-15',
            distance: 5200,
            duration: 1800,
            activityType: 'running'
          }
        ]
      }
    };
    const monthDays = [
      { isCurrentMonth: true, date: new Date('2026-03-15T12:00:00'), intensity: {} }
    ];
    const stats = computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr);
    expect(stats.runningKm).toBeCloseTo(5.2, 1);
    expect(stats.runningSessionCount).toBe(1);
  });

  it('inclut une sortie Garmin orpheline sans session endurance', () => {
    const workoutData = { enduranceData: { sessions: { running: [] } } };
    const garminData = {
      activities: {
        cardio: [
          {
            garminId: 'g2',
            date: '2026-03-16',
            distance: 8000,
            duration: 2700,
            activityType: 'running'
          }
        ]
      }
    };
    const monthDays = [
      { isCurrentMonth: true, date: new Date('2026-03-16T12:00:00'), intensity: {} }
    ];
    const stats = computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr);
    expect(stats.runningKm).toBeCloseTo(8, 1);
  });

  it('temps exos = somme des séances cardio street Garmin du jour', () => {
    const workoutData = {
      checkedExercises: { '2026-06-19_ex1': true },
      enduranceData: { sessions: { running: [] } }
    };
    const garminData = {
      activities: {
        cardio: [
          {
            garminId: 'street1',
            date: '2026-06-19',
            duration: 2640,
            activityName: 'Pessac Cardio',
            activityType: 'strength_training'
          }
        ]
      }
    };
    const min = computeNonRunningExerciseMinutesForDate(workoutData, garminData, '2026-06-19');
    expect(min).toBe(44);

    const monthDays = [
      { isCurrentMonth: true, date: new Date('2026-06-19T12:00:00'), intensity: { duration: 90 } }
    ];
    const stats = computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr);
    expect(stats.otherExerciseMinutes).toBe(44);
  });

  it('somme les kcal actives Garmin dailyMetrics sur le mois', () => {
    const workoutData = { enduranceData: { sessions: { running: [] } } };
    const garminData = {
      dailyMetrics: {
        '2026-06-01': { calories: { active: 400 } },
        '2026-06-02': { calories: { active: 253 } },
        '2026-06-03': { activeKilocalories: 150 }
      }
    };
    const monthDays = [
      { isCurrentMonth: true, date: new Date('2026-06-01T12:00:00'), intensity: {} },
      { isCurrentMonth: true, date: new Date('2026-06-02T12:00:00'), intensity: {} },
      { isCurrentMonth: true, date: new Date('2026-06-03T12:00:00'), intensity: {} }
    ];
    const stats = computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr);
    expect(stats.activeKcal).toBe(803);
  });
});
