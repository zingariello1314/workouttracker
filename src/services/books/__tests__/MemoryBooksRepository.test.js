import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryBooksRepository } from '../MemoryBooksRepository.js';

describe('MemoryBooksRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new MemoryBooksRepository();
  });

  it('saveMerged puis loadAll', async () => {
    await repo.saveMerged([{ id: 'a', userId: 'u', title: 'T', readingSessions: [] }]);
    const all = await repo.loadAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('T');
  });
});
