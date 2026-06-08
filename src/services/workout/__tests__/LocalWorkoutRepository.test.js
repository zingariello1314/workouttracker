/**
 * IndexedDB simulé — importer fake-indexeddb en premier.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalWorkoutRepository } from '../LocalWorkoutRepository.js';
import { persistWorkoutSessionDay, getWorkoutRow } from '../workoutDbGateway.js';
import { getWorkoutSessionDay } from '../workoutSessionDbGateway.js';

describe('LocalWorkoutRepository', () => {
  let repo;

  beforeEach(async () => {
    repo = new LocalWorkoutRepository();
    indexedDB.deleteDatabase('WorkoutTrackerDB');
    indexedDB.deleteDatabase('WorkoutTrackerContextDB');
    await new Promise((r) => setTimeout(r, 10));
  });

  it('persiste aggregate sur main', async () => {
    await repo.saveAggregate('main', { weekVariant: 'A', reps: { k: '5' } });
    const out = await repo.loadAggregate('main');
    expect(out?.weekVariant).toBe('A');
    expect(out?.reps?.k).toBe('5');
  });

  it('persiste program context', async () => {
    await repo.saveProgramContext('user-xyz', { programs: [{ id: 'p1' }], weekVariant: 'B' });
    const ctx = await repo.loadProgramContext('user-xyz');
    expect(ctx?.weekVariant).toBe('B');
    expect(ctx?.programs?.length).toBe(1);
  });

  it('persistWorkoutSessionDay persiste reps/kg dans workoutSessions + workouts', async () => {
    await repo.saveAggregate('user-1', { weekVariant: 'A', reps: {} });
    const fullData = {
      reps: { '2026-06-05_ex1': '12' },
      exerciseWeights: { '2026-06-05_ex1': '20' },
      checkedStretches: { '2026-06-05_st1': true },
    };
    await persistWorkoutSessionDay('user-1', '2026-06-05', fullData, {
      mapFields: {
        reps: fullData.reps,
        exerciseWeights: fullData.exerciseWeights,
        checkedStretches: fullData.checkedStretches,
      },
    });
    const session = await getWorkoutSessionDay('user-1', '2026-06-05');
    expect(session?.mapFields?.reps?.['2026-06-05_ex1']).toBe('12');
    const row = await getWorkoutRow('user-1');
    expect(row.reps['2026-06-05_ex1']).toBe('12');
    expect(row.exerciseWeights['2026-06-05_ex1']).toBe('20');
    expect(row.checkedStretches['2026-06-05_st1']).toBe(true);
    expect(row.weekVariant).toBe('A');
  });
});
