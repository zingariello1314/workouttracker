import { describe, expect, it } from 'vitest';
import {
  buildMomentumDayStripes,
  buildMomentumDayRecapRows,
  countMomentumCheckedExercises
} from './calendarDayMomentumStripes';
import { buildCalendarDayAllStripes } from './calendarDayAllStripes';

describe('calendarDayMomentumStripes', () => {
  const workoutData = {
    checkedExercises: {
      '2026-06-02_42': true,
      '2026-06-02_99': true
    },
    checkedStretches: {
      '2026-06-02_stretch_matin_9111': true
    },
    reps: { '2026-06-02_42': 120, '2026-06-02_99': 203 },
    enduranceData: {
      sessions: {
        running: [
          {
            id: 'run-1',
            date: '2026-06-02',
            distance: '8.2',
            duration: '54:00',
            pace: '6:35'
          }
        ]
      }
    }
  };

  it('compte les exercices cochés hors complémentaires', () => {
    expect(countMomentumCheckedExercises(workoutData, '2026-06-02')).toBe(2);
  });

  it('ajoute bandes workout, course et étirements', () => {
    const stripes = buildMomentumDayStripes(workoutData, '2026-06-02');
    expect(stripes.some((s) => s.kind === 'workout')).toBe(true);
    expect(stripes.some((s) => s.kind === 'momentumRun')).toBe(true);
    expect(stripes.some((s) => s.kind === 'stretch')).toBe(true);
  });

  it('récap avec détails reps et distance course', () => {
    const t = (_k, d) => (typeof d === 'string' ? d : d?.defaultValue) || _k;
    const rows = buildMomentumDayRecapRows(
      workoutData,
      '2026-06-02',
      { intensity: { reps: 323, duration: 54 } },
      t
    );
    const workout = rows.find((r) => r.kind === 'workout');
    const run = rows.find((r) => r.kind === 'momentumRun');
    expect(workout?.subtitle).toContain('323');
    expect(run?.subtitle).toContain('8.2 km');
  });

  it('ordonne activités avant étirements puis Garmin', () => {
    const garminData = {
      activities: { cardio: [], swimming: [], jumpRope: [] },
      dailyMetrics: {
        '2026-06-02': { steps: 4000, sleep: { duration: 8 } }
      }
    };
    const all = buildCalendarDayAllStripes({
      garminData,
      workoutData,
      dateStr: '2026-06-02'
    });
    const kinds = all.map((s) => s.kind);
    const workoutIdx = kinds.indexOf('workout');
    const runIdx = kinds.indexOf('momentumRun');
    const stretchIdx = kinds.indexOf('stretch');
    const sleepIdx = kinds.indexOf('sleep');
    expect(workoutIdx).toBeGreaterThanOrEqual(0);
    expect(runIdx).toBeGreaterThan(workoutIdx);
    expect(stretchIdx).toBeGreaterThan(runIdx);
    expect(sleepIdx).toBeGreaterThan(stretchIdx);
  });
});
