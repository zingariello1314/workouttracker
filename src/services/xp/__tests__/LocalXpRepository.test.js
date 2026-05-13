import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalXpRepository } from '../LocalXpRepository.js';
import { XP_DB_NAME } from '../xpDbGateway.js';

describe('LocalXpRepository', () => {
  let repo;

  beforeEach(async () => {
    repo = new LocalXpRepository();
    indexedDB.deleteDatabase(XP_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
    localStorage.clear();
  });

  it('persiste et relit par userId', async () => {
    await repo.save({ userId: 'u1', totalXP: 42, version: '1.0' });
    const out = await repo.loadByUserId('u1');
    expect(out?.totalXP).toBe(42);
    expect(out?.userId).toBe('u1');
  });
});
