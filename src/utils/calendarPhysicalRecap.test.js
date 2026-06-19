import { describe, expect, it } from 'vitest';
import { buildCalendarDayAllRecapRows } from './calendarDayAllStripes';
import { enumerateDedupedRunSessionsForDate } from './calendarPhysicalSessionStripes';
import { isMockEnduranceSession } from './calendarUtils';
import { collectEnduranceSessionsForCalendarDay } from './calendarUtils';

describe('calendarPhysicalRecap dedup', () => {
  const workoutData = {
    checkedExercises: { '2026-06-17_1': true, '2026-06-17_2': true },
    reps: { '2026-06-17_1': 200, '2026-06-17_2': 245 },
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
      ],
      swimming: [],
      jumpRope: []
    },
    dailyMetrics: {}
  };

  it('ne filtre pas les séances Garmin crédibles à date future', () => {
    const ef = workoutData.enduranceData.sessions.running[0];
    const speed = workoutData.enduranceData.sessions.running[1];
    expect(isMockEnduranceSession(ef)).toBe(false);
    expect(isMockEnduranceSession(speed)).toBe(false);
    expect(collectEnduranceSessionsForCalendarDay(workoutData, '2026-06-17').rows).toHaveLength(2);
  });

  it('fusionne 2 sorties course sans doublon', () => {
    expect(enumerateDedupedRunSessionsForDate(workoutData, garminData, '2026-06-17')).toHaveLength(2);
  });

  it('affiche 3 activités physiques sans doublon Cardio Garmin', () => {
    const t = (_k, d) => (typeof d === 'string' ? d : d?.defaultValue) || _k;
    const rows = buildCalendarDayAllRecapRows({
      garminData,
      workoutData,
      dateStr: '2026-06-17',
      intensity: { reps: 445, duration: 101 },
      t
    });
    const physical = rows.filter((r) => r.kind === 'workout' || r.kind === 'momentumRun');
    expect(physical).toHaveLength(3);
    expect(rows.some((r) => r.title === 'Cardio' || r.title?.includes('Cardio'))).toBe(false);
    const workout = rows.find((r) => r.kind === 'workout');
    expect(workout?.subtitle).toContain('56 min');
    expect(workout?.subtitle).not.toContain('101');
    const runs = rows.filter((r) => r.kind === 'momentumRun');
    expect(runs.some((r) => String(r.subtitle).includes('4.2'))).toBe(true);
    expect(runs.some((r) => String(r.subtitle).includes('1.02'))).toBe(true);
  });
});
