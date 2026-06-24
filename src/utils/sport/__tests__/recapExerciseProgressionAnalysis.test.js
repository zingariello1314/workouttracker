import { describe, it, expect } from 'vitest';
import {
  collectDistinctExercisesInWindow,
  collectEnrichedExerciseHistory,
  analyzeExerciseProgressionHistory
} from '../recapExerciseProgressionAnalysis';

describe('recapExerciseProgressionAnalysis', () => {
  const getName = (id) => (id === 101 || id === '101' ? 'Tractions' : `Exo ${id}`);

  const snapshot = {
    checkedExercises: {
      '2026-05-01_101': true,
      '2026-05-15_101': true,
      '2026-06-01_101': true,
      '2026-05-10_202': true
    },
    exerciseSetLogs: {
      '2026-05-01_101': { sets: [{ reps: 8, weight: null }], schemaVersion: 1 },
      '2026-05-15_101': { sets: [{ reps: 10, weight: null }], schemaVersion: 1 },
      '2026-06-01_101': { sets: [{ reps: 12, weight: null }], schemaVersion: 1 },
      '2026-05-10_202': {
        sets: [
          { reps: 10, weight: 20, weightMode: 'total' },
          { reps: 10, weight: 20, weightMode: 'total' }
        ],
        schemaVersion: 1
      }
    },
    reps: {
      '2026-05-01_101': '8',
      '2026-05-15_101': '10',
      '2026-06-01_101': '12',
      '2026-05-10_202': '20'
    }
  };

  const window = { start: '2026-05-01', end: '2026-06-30' };

  it('liste les exercices distincts de la fenêtre', () => {
    const list = collectDistinctExercisesInWindow(snapshot, window, getName);
    expect(list.length).toBe(2);
    expect(list.find((e) => e.exerciseId === '101')?.name).toBe('Tractions');
    expect(list.find((e) => e.exerciseId === '101')?.sessionCount).toBe(3);
  });

  it('construit un historique enrichi trié', () => {
    const hist = collectEnrichedExerciseHistory(snapshot, '101', window, getName);
    expect(hist.length).toBe(3);
    expect(hist[0].dateYmd).toBe('2026-05-01');
    expect(hist[2].totalReps).toBe(12);
  });

  it('interprète une progression haussière', () => {
    const hist = collectEnrichedExerciseHistory(snapshot, '101', window, getName);
    const analysis = analyzeExerciseProgressionHistory(hist);
    expect(analysis.status).toBe('rising');
    expect(analysis.headline).toMatch(/progression/i);
    expect(analysis.bullets.some((b) => /record période/i.test(b))).toBe(true);
  });
});
