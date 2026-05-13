/**
 * Schéma IndexedDB citations (MomentumQuotes).
 *
 * @module services/quotes/quotesDbGateway
 */

export const DB_NAME = 'MomentumQuotes';
export const DB_VERSION = 1;

export const STORE_QUOTES = 'quotes';
export const STORE_SETTINGS = 'settings';

/**
 * @param {IDBVersionChangeEvent} event
 * @param {{ info?: (...args: unknown[]) => void }} [log]
 */
export function applyQuotesSchemaUpgrade(event, log = console) {
  const db = event.target.result;

  if (!db.objectStoreNames.contains(STORE_QUOTES)) {
    const quotesStore = db.createObjectStore(STORE_QUOTES, { keyPath: 'id' });
    quotesStore.createIndex('order', 'order', { unique: false });
    quotesStore.createIndex('isPinned', 'isPinned', { unique: false });
    quotesStore.createIndex('createdAt', 'createdAt', { unique: false });
    log.info?.('Created quotes object store with indexes');
  }

  if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
    db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
    log.info?.('Created settings object store');
  }
}
