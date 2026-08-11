import { describe, it, expect } from 'vitest';
import { removeCatalogCheckHistoryEntry } from '../exerciseGradeCheckHistoryRemove';
import { removeExerciseGradeCheckAndReconcile } from '../exerciseGradeCheckHistoryActions';
import { collectCatalogCheckHistory } from '../exerciseGradeCheckHistory';

describe('exerciseGradeCheckHistoryRemove', () => {
  it('décoche une entrée programme et resync', () => {
    const data = {
      checkedExercises: { '2026-08-01_104': true },
      reps: { '2026-08-01_104': '40' },
      enduranceData: {}
    };
    const { next, removed } = removeCatalogCheckHistoryEntry(
      data,
      'w:2026-08-01_104',
      'ex:104',
      () => 'Pompes'
    );
    expect(removed).toBe(true);
    expect(next.checkedExercises['2026-08-01_104']).toBeUndefined();
    expect(next.reps['2026-08-01_104']).toBeUndefined();
  });

  it('retire le grade du classement si dernière coche', () => {
    const data = {
      checkedExercises: { '2026-08-01_104': true },
      reps: { '2026-08-01_104': '40' },
      enduranceData: {}
    };
    const result = removeExerciseGradeCheckAndReconcile(
      data,
      'w:2026-08-01_104',
      'ex:104',
      () => 'Pompes',
      { weightKg: 75 }
    );
    expect(result.gradeRemoved).toBe(true);
    expect(collectCatalogCheckHistory(result.next, 'ex:104', () => 'Pompes')).toHaveLength(0);
  });
});
