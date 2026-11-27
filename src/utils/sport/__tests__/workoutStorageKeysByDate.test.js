import { describe, expect, it } from 'vitest';
import { indexWorkoutStorageKeysByDate } from '../workoutStorageKeysByDate';

describe('indexWorkoutStorageKeysByDate', () => {
  it('indexe les clés par date sans parcours global répété', () => {
    const data = {
      reps: {
        '2026-11-01_1': '10',
        '2026-11-01_2': '12',
        '2026-11-02_1': '8'
      },
      checkedExercises: {
        '2026-11-01_1': true,
        '2026-11-02_3': true
      }
    };
    const idx = indexWorkoutStorageKeysByDate(data);
    expect(idx.repsKeysByDate.get('2026-11-01')).toHaveLength(2);
    expect(idx.hasCheckedOnDate('2026-11-01')).toBe(true);
    expect(idx.hasCheckedOnDate('2026-11-03')).toBe(false);
    const planned = new Set(['1']);
    expect(idx.orphanExerciseIdsForDate('2026-11-01', planned)).toEqual([2]);
  });
});
