/**
 * IndexedDB simulé — importer fake-indexeddb en premier.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalWorkoutRepository } from '../LocalWorkoutRepository.js';

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
});
