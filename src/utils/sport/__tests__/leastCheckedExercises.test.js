import { describe, it, expect } from 'vitest';
import {
  computeLeastCheckedExercises,
  dayHadStrengthActivity,
  inferAddedDateFromExerciseId,
  getExerciseEligibleSince
} from '../leastCheckedExercises';

describe('leastCheckedExercises', () => {
  const window = { start: '2025-01-06', end: '2025-01-12' };

  it('ignore les jours sans séance effectuée', () => {
    const snapshot = {
      checkedExercises: {
        '2025-01-07_101': true,
        '2025-01-11_101': true
      },
      reps: { '2025-01-07_101': '10', '2025-01-11_101': '8' }
    };
    const ctx = {
      programs: [],
      alignWithCalendar: true,
      getTodayWorkout: (date) => {
        const d = date.toISOString().slice(0, 10);
        if (d === '2025-01-07' || d === '2025-01-11') {
          return {
            exercices: [
              { id: 101, name: 'Squat' },
              { id: 102, name: 'Presse' }
            ]
          };
        }
        return null;
      }
    };
    const result = computeLeastCheckedExercises(snapshot, window, ctx, 8);
    const squat = result.find((r) => r.name === 'Squat');
    expect(squat).toBeTruthy();
    expect(squat.planned).toBe(2);
    expect(squat.checked).toBe(2);
    const presse = result.find((r) => r.name === 'Presse');
    expect(presse).toBeTruthy();
    expect(presse.planned).toBe(2);
    expect(presse.checked).toBe(0);
  });

  it('parse la date depuis un id ex_timestamp', () => {
    const d = inferAddedDateFromExerciseId({ id: 'ex_1717603200000_abc' });
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getExerciseEligibleSince utilise addedToProgramAt', () => {
    const since = getExerciseEligibleSince(
      { id: 1, addedToProgramAt: '2026-06-05' },
      {}
    );
    expect(since).toBe('2026-06-05');
  });

  it('dayHadStrengthActivity détecte circuitProgress', () => {
    expect(
      dayHadStrengthActivity(
        { circuitProgress: { '2026-06-03': { c1: { roundsCompleted: 1 } } } },
        '2026-06-03'
      )
    ).toBe(true);
  });
});
