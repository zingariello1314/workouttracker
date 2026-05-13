import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkoutRepository } from '../MemoryWorkoutRepository.js';

describe('MemoryWorkoutRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new MemoryWorkoutRepository();
  });

  it('roundtrip aggregate', async () => {
    await repo.saveAggregate('main', { reps: { a: '10' }, weekVariant: 'B' });
    const out = await repo.loadAggregate('main');
    expect(out?.reps?.a).toBe('10');
    expect(out?.weekVariant).toBe('B');
  });

  it('merge aggregate shallow', async () => {
    await repo.saveAggregate('u1', { reps: { x: '1' } });
    await repo.saveAggregate('u1', { weekVariant: 'A' });
    const out = await repo.loadAggregate('u1');
    expect(out?.reps?.x).toBe('1');
    expect(out?.weekVariant).toBe('A');
  });

  it('roundtrip program context', async () => {
    await repo.saveProgramContext('main', { weekVariant: 'B', programs: [] });
    const ctx = await repo.loadProgramContext('main');
    expect(ctx?.weekVariant).toBe('B');
    expect(Array.isArray(ctx?.programs)).toBe(true);
  });

  it('roundtrip raw workout row (forme IndexedDB)', async () => {
    const row = { id: 'main', weekVariant: 'A', reps: { x: '1' }, lastSaved: 't', dataVersion: '1.0' };
    await repo.saveRawWorkoutRow('main', row);
    const out = await repo.loadRawWorkoutRow('main');
    expect(out?.id).toBe('main');
    expect(out?.reps?.x).toBe('1');
  });
});
