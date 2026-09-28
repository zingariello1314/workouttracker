import { describe, expect, it } from 'vitest';
import { buildCalendarDayAllStripes } from './calendarDayAllStripes';
import { filterCalendarStripesForYearView } from './calendarPhysicalActivityStripes';
import {
  buildCalendarGtgDayView,
  omitGtgOnlyCalendarExercises
} from './calendarGtgDay';
import { syncGtgDayToWorkoutData } from '../services/endurance/gtgWorkoutSync';

function gtgWorkout(dateStr = '2026-09-28') {
  const gtg = {
    config: {
      selectedIds: ['pushups'],
      scheduleFrom: '08:00',
      scheduleTo: '12:00',
      intervalHours: 2,
      slotMode: 'manual',
      slotTimes: ['08:00', '10:00', '12:00'],
      manualMax: { pushups: 20 }
    },
    days: {
      [dateStr]: {
        exercises: {
          pushups: {
            slots: {
              0: { done: true },
              1: { done: true }
            }
          }
        }
      }
    },
    workoutSync: {}
  };
  return syncGtgDayToWorkoutData(
    { reps: { [`${dateStr}_42`]: '15' }, checkedExercises: { [`${dateStr}_42`]: true }, enduranceData: { gtg } },
    gtg,
    dateStr,
    { workoutData: { enduranceData: { gtg } } }
  );
}

describe('calendar GTG', () => {
  it('ajoute une barre GTG orange, y compris en vue année, sans remplacer la séance', () => {
    const dateStr = '2026-09-28';
    const workoutData = gtgWorkout(dateStr);
    const stripes = buildCalendarDayAllStripes({ workoutData, dateStr });
    const gtg = stripes.find((s) => s.kind === 'gtg');
    expect(gtg?.color).toBe('#ff8c00');
    const year = filterCalendarStripesForYearView(stripes).map((s) => s.kind);
    expect(year).toContain('gtg');
    expect(year).toContain('workout');
  });

  it('retire du détail les reps qui ne viennent que du GTG', () => {
    const dateStr = '2026-09-28';
    const workoutData = gtgWorkout(dateStr);
    const rows = omitGtgOnlyCalendarExercises(
      [
        { name: 'Squat', reps: 15, _storageKey: `${dateStr}_42` },
        { name: 'Pompes', reps: parseInt(workoutData.reps[`${dateStr}_104`], 10), _storageKey: `${dateStr}_104` }
      ],
      workoutData,
      dateStr
    );
    expect(rows.map((r) => r.name)).toEqual(['Squat']);
  });

  it('détaille créneaux, reps faites et prévues', () => {
    const dateStr = '2026-09-28';
    const view = buildCalendarGtgDayView(gtgWorkout(dateStr), dateStr, {});
    expect(view.doneMiniSets).toBe(2);
    expect(view.plannedMiniSets).toBe(3);
    expect(view.doneReps).toBeGreaterThan(0);
    expect(view.plannedReps).toBeGreaterThan(view.doneReps);
    expect(view.exercisePlans[0].slots.map((s) => s.time)).toEqual(['08:00', '10:00', '12:00']);
    expect(view.exercisePlans[0].slots.filter((s) => s.done)).toHaveLength(2);
  });
});
