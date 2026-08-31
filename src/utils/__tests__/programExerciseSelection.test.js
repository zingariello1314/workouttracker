import { describe, expect, it } from 'vitest';
import {
  PROGRAM_EXERCISE_SLOTS,
  appendDuplicateExercisesToDay,
  buildDuplicateItemsFromSelection,
  buildSingleDuplicateItem,
  collectSelectedProgramExercises,
  deleteSelectedExercisesFromDay,
  dropSlotFromSelection,
  exerciseSelectionKey,
  isExerciseSelected,
  normalizeSelectedKeys,
  toggleExerciseSelectionKeys
} from '../programExerciseSelection';

const day = {
  exercises: [{ id: 'm1', name: 'Pompes' }],
  salleVariants: {
    semaineA: { name: 'A', exercises: [{ id: 'a1', name: 'Wall sit' }] },
    semaineB: { name: 'B', exercises: [{ id: 'b1', name: 'Tractions' }] }
  }
};

describe('programExerciseSelection', () => {
  it('normalise les anciennes clés nues vers la piste principale', () => {
    expect(normalizeSelectedKeys(['m1'])).toEqual(['main:m1']);
    expect(isExerciseSelected(['m1'], 'main', 'm1')).toBe(true);
  });

  it('sélectionne les variantes salle indépendamment de la piste principale', () => {
    let keys = [];
    keys = toggleExerciseSelectionKeys(keys, 'semaineA', 'a1', true);
    keys = toggleExerciseSelectionKeys(keys, 'main', 'm1', true);
    expect(keys).toEqual(['semaineA:a1', 'main:m1']);
    expect(isExerciseSelected(keys, 'semaineB', 'b1')).toBe(false);
    const collected = collectSelectedProgramExercises(day, keys);
    expect(collected.map((c) => c.exercise.name).sort()).toEqual(['Pompes', 'Wall sit']);
  });

  it('construit des items de duplication avec la piste source', () => {
    const items = buildDuplicateItemsFromSelection(day, [
      exerciseSelectionKey('semaineB', 'b1')
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].sourceSlot).toBe('semaineB');
    expect(items[0].label).toMatch(/Semaine B/);
  });

  it('duplique vers la même piste sur le jour cible', () => {
    const target = { exercises: [], salleVariants: {} };
    const next = appendDuplicateExercisesToDay(
      target,
      [{ sourceSlot: 'semaineA', payload: { id: 'a1', name: 'Wall sit' } }],
      (p) => ({ ...p, id: 'dup1' })
    );
    expect(next.exercises).toEqual([]);
    expect(next.salleVariants.semaineA.exercises).toEqual([{ id: 'dup1', name: 'Wall sit' }]);
  });

  it('supprime la sélection sur les trois pistes', () => {
    const next = deleteSelectedExercisesFromDay(day, ['main:m1', 'semaineA:a1', 'semaineB:b1']);
    expect(next.exercises).toEqual([]);
    expect(next.salleVariants.semaineA.exercises).toEqual([]);
    expect(next.salleVariants.semaineB.exercises).toEqual([]);
  });

  it('ne touche pas aux autres pistes si la sélection est partielle', () => {
    const next = deleteSelectedExercisesFromDay(day, [exerciseSelectionKey(PROGRAM_EXERCISE_SLOTS.SEMAINE_A, 'a1')]);
    expect(next.exercises).toHaveLength(1);
    expect(next.salleVariants.semaineA.exercises).toEqual([]);
    expect(next.salleVariants.semaineB.exercises).toHaveLength(1);
  });

  it('duplique un mélange de pistes sans les mélanger', () => {
    const target = { exercises: [{ id: 'keep', name: 'Gainage' }], salleVariants: {} };
    const next = appendDuplicateExercisesToDay(
      target,
      [
        { sourceSlot: 'main', payload: { id: 'm1', name: 'Pompes' } },
        { sourceSlot: 'semaineB', payload: { id: 'b1', name: 'Tractions' } }
      ],
      (p) => ({ ...p, id: `dup_${p.id}` })
    );
    expect(next.exercises.map((ex) => ex.id)).toEqual(['keep', 'dup_m1']);
    expect(next.salleVariants.semaineB.exercises).toEqual([{ id: 'dup_b1', name: 'Tractions' }]);
    expect(next.salleVariants.semaineA).toBeUndefined();
  });

  it('retire une piste entière de la sélection', () => {
    expect(dropSlotFromSelection(['main:m1', 'semaineB:b1', 'semaineA:a1'], 'semaineB')).toEqual([
      'main:m1',
      'semaineA:a1'
    ]);
  });

  it('construit un item unitaire avec le libellé de piste', () => {
    const item = buildSingleDuplicateItem({ id: 'a1', name: 'Wall sit' }, 'semaineA');
    expect(item.sourceSlot).toBe('semaineA');
    expect(item.label).toBe('Wall sit · Semaine A');
  });
});
