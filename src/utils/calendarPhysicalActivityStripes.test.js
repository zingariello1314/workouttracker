import { describe, expect, it } from 'vitest';
import {
  CALENDAR_PHYSICAL_ACTIVITY_COLOR,
  filterCalendarStripesForYearView
} from './calendarPhysicalActivityStripes';
import { buildMomentumDayStripes } from './calendarDayMomentumStripes';
import { buildCalendarDayAllStripes } from './calendarDayAllStripes';

describe('calendarPhysicalActivityStripes', () => {
  const workoutData = {
    checkedExercises: { '2026-06-02_42': true },
    enduranceData: {
      sessions: {
        running: [{ id: 'r1', date: '2026-06-02', distance: '5', duration: '30:00' }]
      }
    }
  };

  it('unifie la couleur des bandes workout et course', () => {
    const stripes = buildMomentumDayStripes(workoutData, '2026-06-02');
    const workout = stripes.find((s) => s.kind === 'workout');
    const run = stripes.find((s) => s.kind === 'momentumRun');
    expect(workout?.color).toBe(CALENDAR_PHYSICAL_ACTIVITY_COLOR);
    expect(run?.color).toBe(CALENDAR_PHYSICAL_ACTIVITY_COLOR);
  });

  it('filtre la vue année sur les activités physiques uniquement', () => {
    const garminData = {
      activities: {
        cardio: [{ date: '2026-06-02', activityName: 'Marche', duration: 3600 }],
        swimming: [],
        jumpRope: []
      },
      dailyMetrics: {
        '2026-06-02': { steps: 12000, sleep: { duration: 7 } }
      }
    };
    const all = buildCalendarDayAllStripes({
      garminData,
      workoutData,
      dateStr: '2026-06-02'
    });
    const year = filterCalendarStripesForYearView(all);
    const kinds = year.map((s) => s.kind);
    expect(kinds).toContain('workout');
    expect(kinds).toContain('momentumRun');
    expect(kinds).not.toContain('walk');
    expect(kinds).not.toContain('sleep');
    expect(kinds).not.toContain('steps');
    expect(kinds).not.toContain('stretch');
  });
});
