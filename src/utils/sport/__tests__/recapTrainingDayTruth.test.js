import { describe, expect, it } from 'vitest';
import {
  countTrainingDaysInRange,
  dayHasTrainingActivity,
  isGarminTrainingActivity,
  collectGarminTrainingDates
} from '../recapTrainingDayTruth';

describe('recapTrainingDayTruth', () => {
  it('compte muscu + endurance + Garmin hors marche', () => {
    const snapshot = {
      checkedExercises: { '2026-06-01_101': true },
      enduranceData: {
        sessions: {
          running: [{ date: '2026-06-02', distance: 5, duration: '00:30:00' }]
        }
      },
      circuitProgress: { '2026-06-03': { c1: 3 } }
    };
    const garminData = {
      activities: {
        cardio: [
          { date: '2026-06-04', duration: 1800, garminTypeKey: 'strength_training' },
          { date: '2026-06-05', duration: 3600, garminTypeKey: 'walking', activityName: 'Marche' }
        ]
      }
    };

    expect(countTrainingDaysInRange(snapshot, '2026-06-01', '2026-06-05', garminData)).toBe(4);
    expect(collectGarminTrainingDates(garminData).has('2026-06-05')).toBe(false);
    expect(dayHasTrainingActivity(snapshot, '2026-06-04', garminData)).toBe(true);
  });

  it('ignore marche Garmin', () => {
    const walk = {
      date: '2026-06-01',
      duration: 3600,
      garminTypeKey: 'walking',
      activityName: 'Marche à pied'
    };
    expect(isGarminTrainingActivity(walk)).toBe(false);
  });
});
