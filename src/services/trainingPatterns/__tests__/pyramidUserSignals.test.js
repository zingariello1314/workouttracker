import {
  parseStraightSetSeries,
  sumRepsForExerciseOnDate,
  collectRecentSessionTotalsForExercise,
  getObservedMaxRepsFromRecords,
  estimateSessionsPerWeek,
  resolveObservedMaxReps,
  collectProgramExercises,
  collectCustomProgramExercises
} from '../pyramidUserSignals';
import { workoutProgram } from '../../../data/workoutProgram';

describe('pyramidUserSignals', () => {
  test('parseStraightSetSeries', () => {
    expect(parseStraightSetSeries('5×4')).toEqual({ sets: 5, repsPerSet: 4 });
    expect(parseStraightSetSeries('4 x 10-12')).toEqual({ sets: 4, repsPerSet: 11 });
    expect(parseStraightSetSeries('')).toBeNull();
  });

  test('sumRepsForExerciseOnDate aggregates gym suffix keys', () => {
    const reps = {
      '2026-05-01_101': 10,
      '2026-05-01_101_semaineA': 5
    };
    expect(sumRepsForExerciseOnDate(reps, '2026-05-01', 101)).toBe(15);
  });

  test('collectRecentSessionTotalsForExercise', () => {
    const reps = {
      '2026-05-01_7': 20,
      '2026-05-03_7': 18
    };
    const r = collectRecentSessionTotalsForExercise(reps, 7, { maxDays: 30 });
    expect(r.totals.length).toBe(2);
    expect(r.meanPerSession).toBe(19);
  });

  test('getObservedMaxRepsFromRecords', () => {
    const records = [{ exerciseId: 101, reps: 9, performanceType: 'reps' }];
    expect(getObservedMaxRepsFromRecords(records, 101)).toBe(9);
    expect(getObservedMaxRepsFromRecords(records, 102)).toBeNull();
  });

  test('resolveObservedMaxReps falls back to name', () => {
    const records = [
      { exerciseId: 'db_tractions', exerciseName: 'Tractions pronation', reps: 11, performanceType: 'reps' }
    ];
    expect(resolveObservedMaxReps(records, { programExerciseId: 101, exerciseName: 'Tractions pronation' })).toBe(11);
  });

  test('collectProgramExercises returns numeric ids', () => {
    const rows = collectProgramExercises(workoutProgram);
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      expect(Number.isFinite(rows[0].id)).toBe(true);
    }
  });

  test('collectCustomProgramExercises', () => {
    const ap = {
      schedule: {
        lundi: {
          exercises: [{ id: 9001, name: 'Test exo', series: '3×5' }]
        }
      }
    };
    const rows = collectCustomProgramExercises(ap);
    expect(rows.some((r) => r.id === 9001)).toBe(true);
  });

  test('estimateSessionsPerWeek', () => {
    const reps = {};
    for (let i = 0; i < 21; i += 1) {
      const d = new Date(2026, 4, i + 1);
      const ds = d.toISOString().slice(0, 10);
      reps[`${ds}_5`] = 12;
    }
    const w = estimateSessionsPerWeek(reps, 5, { windowDays: 28 });
    expect(w).not.toBeNull();
    expect(w).toBeGreaterThan(0);
  });
});
