/**
 * Schéma IndexedDB journal Code (MomentumCodeDB).
 *
 * @module services/code/codeJournalDbGateway
 */

export const CODE_JOURNAL_DB_NAME = 'MomentumCodeDB';
export const CODE_JOURNAL_DB_VERSION = 2;
export const STORE_CODE_JOURNAL_ENTRIES = 'journalEntries';
export const STORE_CODE_META = 'codeMeta';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applyCodeJournalSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_CODE_JOURNAL_ENTRIES)) {
    const store = db.createObjectStore(STORE_CODE_JOURNAL_ENTRIES, { keyPath: 'id' });
    store.createIndex('byUser', 'userId', { unique: false });
    store.createIndex('byCreated', 'createdAt', { unique: false });
  }
  if (!db.objectStoreNames.contains(STORE_CODE_META)) {
    db.createObjectStore(STORE_CODE_META, { keyPath: 'key' });
  }
}
