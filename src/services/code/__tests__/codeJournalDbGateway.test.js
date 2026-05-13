import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CODE_JOURNAL_DB_NAME,
  CODE_JOURNAL_DB_VERSION,
  STORE_CODE_JOURNAL_ENTRIES,
  STORE_CODE_META,
  applyCodeJournalSchemaUpgrade,
} from '../codeJournalDbGateway.js';

describe('codeJournalDbGateway', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(CODE_JOURNAL_DB_NAME);
    await new Promise((r) => setTimeout(r, 10));
  });

  it('crée journalEntries et codeMeta', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(CODE_JOURNAL_DB_NAME, CODE_JOURNAL_DB_VERSION);
      req.onupgradeneeded = (e) => applyCodeJournalSchemaUpgrade(e);
      req.onsuccess = () => {
        const db = req.result;
        expect(db.objectStoreNames.contains(STORE_CODE_JOURNAL_ENTRIES)).toBe(true);
        expect(db.objectStoreNames.contains(STORE_CODE_META)).toBe(true);
        db.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
});
