import { describe, expect, it } from 'vitest';
import {
  listUncountedCompletedExceptionalExercises,
  recordedValueForExceptionalExercise,
} from '../calendarUtils';
import { detectExerciseUnit } from '../exerciseCalculations';

describe('exercices exceptionnels dans le total du jour', () => {
  it('additionne les reps cochées même sans clé de séance', () => {
    const variation = {
      additionalExercises: [
        {
          id: 'exceptional_2026-09-27_1',
          name: 'Traction pronation',
          type: 'reps',
          completed: true,
          repsPerSeries: [8, 8, 6],
          totalReps: 22,
        },
        {
          id: 'exceptional_2026-09-27_2',
          name: 'Gainage',
          type: 'duration',
          completed: true,
          actualDuration: 90,
        },
        {
          id: 'exceptional_2026-09-27_3',
          name: 'Pas encore fait',
          type: 'reps',
          completed: false,
          totalReps: 10,
        },
      ],
    };

    const rows = listUncountedCompletedExceptionalExercises('2026-09-27', variation, []);
    expect(rows.map((row) => row.exercise.name)).toEqual(['Traction pronation', 'Gainage']);
    expect(rows[0].repsForTotal).toBe(22);
    expect(rows[0].storageKey).toBe('2026-09-27_exceptional_2026-09-27_1');
    expect(rows[1].repsForTotal).toBe(0);
    expect(rows[1].recordedValue).toBe(90);
  });

  it('ne compte pas deux fois une traction déjà dans les clés du jour', () => {
    const variation = {
      additionalExercises: [
        {
          id: 'exceptional_2026-09-27_1',
          name: 'Traction pronation',
          type: 'reps',
          completed: true,
          totalReps: 22,
        },
      ],
    };
    const rows = listUncountedCompletedExceptionalExercises(
      '2026-09-27',
      variation,
      ['2026-09-27_exceptional_2026-09-27_1']
    );
    expect(rows).toEqual([]);
    expect(recordedValueForExceptionalExercise(variation.additionalExercises[0])).toBe(22);
  });

  it('accepte un nombre de séries sur un exercice exceptionnel', () => {
    expect(
      detectExerciseUnit({ name: 'Traction pronation', series: 4, type: 'reps' })
    ).toEqual({ unit: 'reps', isTimeBased: false });
  });
});
