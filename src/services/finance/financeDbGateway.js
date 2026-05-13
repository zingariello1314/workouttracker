/**
 * Schéma IndexedDB Finance (FinanceDB).
 * Utilisable depuis `idb` (`openDB` → callback `upgrade`) ou `onupgradeneeded` natif.
 *
 * @module services/finance/financeDbGateway
 */

export const FINANCE_DB_NAME = 'FinanceDB';
export const FINANCE_DB_VERSION = 2;

export const FINANCE_STORES = {
  PORTFOLIO: 'portfolio',
  YAHOO_CACHE: 'yahooCache',
  CALCULATIONS: 'calculations',
  HISTORY: 'history',
  EXCHANGE_RATES: 'exchangeRates',
};

/**
 * @param {IDBDatabase} db
 * @param {number} oldVersion
 * @param {number} [_newVersion]
 * @param {{ info?: (...args: unknown[]) => void }} [log]
 */
export function applyFinanceSchemaUpgrade(db, oldVersion, _newVersion, log = console) {
  const S = FINANCE_STORES;

  if (!db.objectStoreNames.contains(S.PORTFOLIO)) {
    const portfolioStore = db.createObjectStore(S.PORTFOLIO, { keyPath: 'id' });
    portfolioStore.createIndex('ticker', 'ticker', { unique: false });
    portfolioStore.createIndex('dateAchat', 'dateAchat', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.YAHOO_CACHE)) {
    const cacheStore = db.createObjectStore(S.YAHOO_CACHE, { keyPath: 'ticker' });
    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
  }

  if (!db.objectStoreNames.contains(S.CALCULATIONS)) {
    db.createObjectStore(S.CALCULATIONS, { keyPath: 'key' });
  }

  if (!db.objectStoreNames.contains(S.HISTORY)) {
    const historyStore = db.createObjectStore(S.HISTORY, {
      keyPath: 'id',
      autoIncrement: true,
    });
    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
    historyStore.createIndex('action', 'action', { unique: false });
  }

  if (oldVersion < 2 && !db.objectStoreNames.contains(S.EXCHANGE_RATES)) {
    log.info?.('Creating EXCHANGE_RATES store for multi-currency support');
    const exchangeRatesStore = db.createObjectStore(S.EXCHANGE_RATES, { keyPath: 'key' });
    exchangeRatesStore.createIndex('timestamp', 'timestamp', { unique: false });
  }
}
