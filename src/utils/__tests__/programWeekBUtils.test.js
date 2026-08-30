import { describe, expect, it } from 'vitest';
import {
  clearAllWeekBExercises,
  clearWeekBExercisesForDay,
  removeWeekBFromProgram,
  removeWeekBVariantForDay
} from '../programWeekBUtils';
import { mergeProgramListsByLatest, pickLatestProgram } from '../programVersionUtils';

const sample = () => ({
  id: 'p1',
  weekAlternation: 'ab_enabled',
  updatedAt: '2026-01-01T00:00:00.000Z',
  schedule: {
    lundi: {
      name: 'Force',
      exercises: [{ id: 'main1', name: 'Tractions' }],
      salleVariants: {
        semaineA: { name: 'A', exercises: [{ id: 'a1', name: 'Rowing' }] },
        semaineB: { name: 'B', exercises: [{ id: 'b1', name: 'Curl' }, { id: 'b2', name: 'Pompes' }] }
      }
    }
  }
});

describe('programWeekBUtils', () => {
  it('vide les exercices B d’un jour sans toucher A ni le principal', () => {
    const next = clearWeekBExercisesForDay(sample(), 'lundi');
    expect(next.schedule.lundi.exercises).toHaveLength(1);
    expect(next.schedule.lundi.salleVariants.semaineA.exercises).toHaveLength(1);
    expect(next.schedule.lundi.salleVariants.semaineB.exercises).toEqual([]);
    expect(next.schedule.lundi.salleVariants.semaineB.name).toBe('B');
    expect(next.weekAlternation).toBe('ab_enabled');
  });

  it('retire la variante B d’un jour', () => {
    const next = removeWeekBVariantForDay(sample(), 'lundi');
    expect(next.schedule.lundi.salleVariants.semaineB).toBeUndefined();
    expect(next.schedule.lundi.salleVariants.semaineA.exercises[0].id).toBe('a1');
    expect(next.schedule.lundi.exercises[0].id).toBe('main1');
  });

  it('supprime toute la semaine B et désactive l’alternance', () => {
    const next = removeWeekBFromProgram(sample());
    expect(next.schedule.lundi.salleVariants.semaineB).toBeUndefined();
    expect(next.weekAlternation).toBe('none');
    expect(next.schedule.lundi.exercises[0].name).toBe('Tractions');
  });

  it('clearAllWeekBExercises vide B partout', () => {
    const next = clearAllWeekBExercises(sample());
    expect(next.schedule.lundi.salleVariants.semaineB.exercises).toEqual([]);
    expect(next.weekAlternation).toBe('ab_enabled');
  });
});

describe('programVersionUtils', () => {
  it('garde la version la plus récente', () => {
    const oldP = { id: 1, updatedAt: '2026-01-01T00:00:00.000Z', name: 'old' };
    const newP = { id: 1, updatedAt: '2026-06-01T00:00:00.000Z', name: 'new' };
    expect(pickLatestProgram(oldP, newP).name).toBe('new');
    expect(mergeProgramListsByLatest([oldP], [newP])[0].name).toBe('new');
  });
});
