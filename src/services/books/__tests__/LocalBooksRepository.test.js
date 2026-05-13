import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalBooksRepository } from '../LocalBooksRepository.js';
import { BOOKS_TRACKER_DB_NAME } from '../booksDbGateway.js';

describe('LocalBooksRepository', () => {
  let repo;

  beforeEach(async () => {
    repo = new LocalBooksRepository();
    indexedDB.deleteDatabase(BOOKS_TRACKER_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('persiste un livre et loadAll', async () => {
    const ok = await repo.saveMerged([
      {
        id: 'b1',
        userId: 'user-a',
        title: 'Test',
        author: 'A',
        readingSessions: [],
      },
    ]);
    expect(ok).toBe(true);
    const all = await repo.loadAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('b1');
    expect(all[0].title).toBe('Test');
  });

  it('merge : conserve un autre userId', async () => {
    await repo.saveMerged([{ id: 'x1', userId: 'u1', title: 'X', readingSessions: [] }]);
    await repo.saveMerged([{ id: 'y1', userId: 'u2', title: 'Y', readingSessions: [] }]);
    const all = await repo.loadAll();
    expect(all.some((b) => b.id === 'x1')).toBe(true);
    expect(all.some((b) => b.id === 'y1')).toBe(true);
  });
});
