import { describe, it, expect } from 'vitest';
import { collectCompletedSessionsForExercise } from '../exerciseSessionHistory';

describe('collectCompletedSessionsForExercise', () => {
  const ex = { id: 101, name: 'Pompes' };

  it('renvoie une liste vide sans séances cochées', () => {
    expect(collectCompletedSessionsForExercise({}, ex)).toEqual([]);
  });

  it('agrège reps, charge et étoiles par date', () => {
    const data = {
      checkedExercises: {
        '2026-05-01_101': true,
        '2026-05-06_101': true
      },
      reps: {
        '2026-05-01_101': '10',
        '2026-05-06_101': '12'
      },
      exerciseSessionEffortStars: {
        '2026-05-01_101': 4,
        '2026-05-06_101': 3
      },
      exerciseWeights: {
        '2026-05-06_101': '5'
      }
    };

    const rows = collectCompletedSessionsForExercise(data, ex);
    expect(rows).toHaveLength(2);
    expect(rows[0].dateStr).toBe('2026-05-06');
    expect(rows[0].reps).toBe(12);
    expect(rows[0].stars).toBe(3);
    expect(rows[1].dateStr).toBe('2026-05-01');
    expect(rows[1].reps).toBe(10);
    expect(rows[1].stars).toBe(4);
  });
});
