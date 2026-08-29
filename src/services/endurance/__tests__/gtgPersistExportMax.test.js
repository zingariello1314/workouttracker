import { mergeGtgData } from '../gtgDataMerge';
import { applyGtgDeclaredMaxToData } from '../gtgMaxPerformance';
import { resolveGtgCanonicalExerciseId } from '../gtgWorkoutSync';

describe('mergeGtgData', () => {
  it('unionne les jours et conserve les coches des deux sources', () => {
    const existing = {
      config: { selectedIds: ['pullups'] },
      days: {
        '2026-08-01': {
          exercises: { pullups: { slots: { 0: { done: true, updatedAt: 'a' } } } }
        }
      }
    };
    const incoming = {
      config: { selectedIds: ['dips'], protocolByExercise: { dips: { currentMax: 12 } } },
      days: {
        '2026-08-01': {
          exercises: { pullups: { slots: { 1: { done: true, updatedAt: 'b' } } } }
        },
        '2026-08-02': {
          exercises: { dips: { slots: { 0: { done: true } } } }
        }
      }
    };
    const merged = mergeGtgData(existing, incoming);
    expect(merged.config.selectedIds).toEqual(expect.arrayContaining(['pullups', 'dips']));
    expect(merged.days['2026-08-01'].exercises.pullups.slots['0'].done).toBe(true);
    expect(merged.days['2026-08-01'].exercises.pullups.slots['1'].done).toBe(true);
    expect(merged.days['2026-08-02'].exercises.dips.slots['0'].done).toBe(true);
    expect(merged.config.protocolByExercise.dips.currentMax).toBe(12);
  });

  it('garde l’existant si l’import n’a pas de GTG', () => {
    const existing = { config: { selectedIds: ['pullups'] }, days: { '2026-08-01': { exercises: {} } } };
    expect(mergeGtgData(existing, null)).toEqual(existing);
  });
});

describe('applyGtgDeclaredMaxToData', () => {
  it('enregistre un max reps sans toucher aux reps du jour', () => {
    const data = { reps: { '2026-08-29_101': '4' }, checkedExercises: {}, exerciseMaxHistory: [], exerciseMaxRecords: [] };
    const next = applyGtgDeclaredMaxToData(data, {
      gtgExerciseId: 'pullups',
      reps: 9,
      dateStr: '2026-08-29',
      config: {}
    });
    expect(next.reps['2026-08-29_101']).toBe('4');
    expect(next.checkedExercises['2026-08-29_101']).toBeUndefined();
    expect(next.exerciseMaxHistory).toHaveLength(1);
    expect(next.exerciseMaxHistory[0].reps).toBe(9);
    expect(next.exerciseMaxHistory[0].source).toBe('gtg');
    expect(next.exerciseMaxHistory[0].recordDate).toBe('2026-08-29');
    expect(String(next.exerciseMaxRecords[0].exerciseId)).toBe('101');
  });

  it('remplace le max GTG du même jour au lieu d’empiler', () => {
    const first = applyGtgDeclaredMaxToData(
      { exerciseMaxHistory: [], exerciseMaxRecords: [] },
      { gtgExerciseId: 'pullups', reps: 8, dateStr: '2026-08-29', config: {} }
    );
    const second = applyGtgDeclaredMaxToData(first, {
      gtgExerciseId: 'pullups',
      reps: 9,
      dateStr: '2026-08-29',
      config: {}
    });
    expect(second.exerciseMaxHistory).toHaveLength(1);
    expect(second.exerciseMaxHistory[0].reps).toBe(9);
  });
});

describe('resolveGtgCanonicalExerciseId', () => {
  it('mappe les tractions GTG vers l’id programme 101', () => {
    expect(resolveGtgCanonicalExerciseId('pullups')).toBe('101');
  });
});
