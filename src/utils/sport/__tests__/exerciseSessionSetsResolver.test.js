import { describe, it, expect } from 'vitest';
import { resolveExerciseSetsForAnalysis } from '../exerciseSessionSetsResolver';
import { extractBenchmarkMetricsByExercise } from '../strengthBenchmarkExtractors';

describe('exerciseSessionSetsResolver', () => {
  it('dips 4×12 : total 40 → meilleure série ~10 (pas 40)', () => {
    const key = '2026-06-09_1003';
    const snapshot = {
      checkedExercises: { [key]: true },
      reps: { [key]: '40' }
    };
    const getName = (id) =>
      id === 1003 || id === '1003' ? 'Dips parallèles' : '';
    const resolved = resolveExerciseSetsForAnalysis(snapshot, key, getName);
    expect(resolved.maxSetReps).toBeLessThanOrEqual(12);
    expect(resolved.maxSetReps).toBeGreaterThanOrEqual(8);
    expect(resolved.maxSetReps).not.toBe(40);
    expect(resolved.setCount).toBe(4);

    const { byBenchmarkKey } = extractBenchmarkMetricsByExercise(
      snapshot,
      { start: '2026-06-01', end: '2026-06-30' },
      getName
    );
    expect(byBenchmarkKey.get('dips')?.maxSetReps).not.toBe(40);
  });

  it('wall sit 3×1 min : maintien 60 s (pas 3 s)', () => {
    const key = '2026-06-09_999';
    const snapshot = {
      checkedExercises: { [key]: true },
      reps: { [key]: '3' },
      exerciseSetLogs: {
        [key]: {
          sets: [
            { reps: 1, weight: null },
            { reps: 1, weight: null },
            { reps: 1, weight: null }
          ],
          schemaVersion: 1
        }
      }
    };
    const exercise = { name: 'Wall sit', series: '3×1 min', materiel: 'poids du corps' };
    const getName = () => exercise.name;

    const resolved = resolveExerciseSetsForAnalysis(snapshot, key, getName);
    expect(resolved.maxHoldSeconds).toBe(60);
    expect(resolved.isTimeBased).toBe(true);
  });
});
