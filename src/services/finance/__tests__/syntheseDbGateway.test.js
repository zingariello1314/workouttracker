import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { openSyntheseDb, SYNTHESE_DB_NAME } from '../syntheseDbGateway.js';

describe('syntheseDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(SYNTHESE_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('ouvre SyntheseDB avec les stores attendus', async () => {
    const db = await openSyntheseDb();
    expect(db.objectStoreNames.contains('patrimoine')).toBe(true);
    expect(db.objectStoreNames.contains('projections')).toBe(true);
    expect(db.objectStoreNames.contains('planEpargne')).toBe(true);
    expect(db.objectStoreNames.contains('historique')).toBe(true);
    db.close();
  });
});
