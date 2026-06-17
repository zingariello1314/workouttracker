import { describe, expect, it } from 'vitest';
import { formatCalendarSportDuration, computeYearSportRecordHolders } from './calendarSportStatsFormat';
import { hasCalendarRunningForDate } from './calendarDayMomentumStripes';
import { garminActivityMatchesCalendarDate } from './calendarUtils';

describe('calendarSportStatsFormat', () => {
  it('formate les durées en heures et minutes', () => {
    expect(formatCalendarSportDuration(68.78)).toBe('1h 09m');
    expect(formatCalendarSportDuration(45)).toBe('45m');
    expect(formatCalendarSportDuration(120)).toBe('2h');
  });

  it('détecte les records annuels', () => {
    const holders = computeYearSportRecordHolders([
      { sportStats: { totalReps: 100, longestStreak: 3 } },
      { sportStats: { totalReps: 200, longestStreak: 5 } }
    ]);
    expect(holders.totalReps).toBe(1);
    expect(holders.longestStreak).toBe(1);
  });
});

describe('garminActivityMatchesCalendarDate', () => {
  it('accepte les dates Garmin avec heure', () => {
    expect(
      garminActivityMatchesCalendarDate({ date: '2026-06-05 20:22:00' }, '2026-06-05')
    ).toBe(true);
  });
});

describe('hasCalendarRunningForDate', () => {
  it('détecte une course uniquement côté Garmin', () => {
    const workoutData = { enduranceData: { sessions: { running: [] } } };
    const garminData = {
      activities: {
        cardio: [
          {
            garminId: 99,
            date: '2026-06-05 20:22:00',
            duration: 2434,
            distance: { total: 4285 },
            activityName: 'Pessac Course à pied',
            running: { distanceMeters: 4285 }
          }
        ]
      }
    };
    expect(hasCalendarRunningForDate(workoutData, garminData, '2026-06-05')).toBe(true);
  });
});
