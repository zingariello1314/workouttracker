import { describe, expect, it } from 'vitest';
import {
  buildDedupedPhysicalActivityStripes,
  countRunSessionsForDate,
  countStreetWorkoutSessionsForDate
} from './calendarPhysicalSessionStripes';
import { buildCalendarDayAllStripes } from './calendarDayAllStripes';
import { filterCalendarStripesForYearView } from './calendarPhysicalActivityStripes';

const DATE = '2026-06-05';

const garminRun = {
  garminId: 'run-1',
  date: `${DATE} 20:22:00`,
  activityName: 'Pessac Course à pied',
  duration: 2497,
  distance: 5.831,
  activityType: 'running',
  running: { distanceMeters: 5831, durationSeconds: 2497 }
};

const garminStreet = {
  garminId: 'cardio-1',
  date: `${DATE} 18:00:00`,
  activityName: 'Pessac Cardio',
  duration: 2640,
  activityType: 'indoor_cardio'
};

describe('calendarPhysicalSessionStripes', () => {
  const workoutData = {
    checkedExercises: { [`${DATE}_42`]: true, [`${DATE}_99`]: true },
    reps: { [`${DATE}_42`]: 120 },
    enduranceData: {
      sessions: {
        running: [
          {
            id: 'manual-run',
            date: DATE,
            distance: 5.831,
            duration: '00:41:37',
            pace: '7:08'
          }
        ]
      }
    }
  };

  const garminData = {
    activities: {
      cardio: [garminStreet, garminRun],
      swimming: [],
      jumpRope: []
    },
    dailyMetrics: {}
  };

  it('fusionne exos + Pessac Cardio en une seule séance street', () => {
    expect(countStreetWorkoutSessionsForDate(workoutData, garminData, DATE)).toBe(1);
  });

  it('fusionne Course + Pessac Course à pied en une seule sortie', () => {
    expect(countRunSessionsForDate(workoutData, garminData, DATE)).toBe(1);
  });

  it('produit 2 barres orange pour street + course le même jour', () => {
    const physical = buildDedupedPhysicalActivityStripes(workoutData, garminData, DATE);
    const year = filterCalendarStripesForYearView(physical);
    expect(year).toHaveLength(2);
    expect(year.filter((s) => s.kind === 'workout')).toHaveLength(1);
    expect(year.filter((s) => s.kind === 'momentumRun')).toHaveLength(1);
  });

  it('compte 2 séances street si deux Pessac Cardio sans exos', () => {
    const data = {
      activities: {
        cardio: [
          { ...garminStreet, garminId: 'c1' },
          { ...garminStreet, garminId: 'c2', date: `${DATE} 21:00:00` }
        ],
        swimming: [],
        jumpRope: []
      },
      dailyMetrics: {}
    };
    expect(countStreetWorkoutSessionsForDate(null, data, DATE)).toBe(2);
  });

  it('n’ajoute pas de barres cardio Garmin en doublon dans le calendrier fusionné', () => {
    const all = buildCalendarDayAllStripes({
      garminData,
      workoutData,
      dateStr: DATE
    });
    const physical = filterCalendarStripesForYearView(all);
    expect(physical).toHaveLength(2);
    expect(physical.filter((s) => s.kind === 'activity')).toHaveLength(0);
  });
});
