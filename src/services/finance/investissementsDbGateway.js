/**
 * Schéma IndexedDB Investissements (InvestissementsDB).
 *
 * @module services/finance/investissementsDbGateway
 */

export const INVESTISSEMENTS_DB_NAME = 'InvestissementsDB';
export const INVESTISSEMENTS_DB_VERSION = 2;

export const INVESTISSEMENTS_STORES = {
  OR: 'or',
  LIQUIDITES: 'liquidites',
  BOURSE_CRYPTO: 'bourseCrypto',
  ACQUISITIONS: 'acquisitions',
  ALLOCATION: 'allocation',
};

/**
 * @param {IDBDatabase} db
 * @param {number} oldVersion
 * @param {number} newVersion
 * @param {{ debug?: (...args: unknown[]) => void, warn?: (...args: unknown[]) => void }} [log]
 */
export function applyInvestissementsSchemaUpgrade(db, oldVersion, newVersion, log = console) {
  const dbg = log.debug ?? (() => {});
  const wrn = log.warn ?? (() => {});

  dbg(`Upgrading InvestissementsDB from version ${oldVersion} to ${newVersion}`);

  const S = INVESTISSEMENTS_STORES;

  if (!db.objectStoreNames.contains(S.OR)) {
    const orStore = db.createObjectStore(S.OR, { keyPath: 'id' });
    orStore.createIndex('date', 'date', { unique: false });
    dbg(`Created store: ${S.OR}`);
  }

  if (!db.objectStoreNames.contains(S.LIQUIDITES)) {
    const liqStore = db.createObjectStore(S.LIQUIDITES, { keyPath: 'id' });
    liqStore.createIndex('date', 'date', { unique: false });
    dbg(`Created store: ${S.LIQUIDITES}`);
  }

  if (!db.objectStoreNames.contains(S.BOURSE_CRYPTO)) {
    const bcStore = db.createObjectStore(S.BOURSE_CRYPTO, { keyPath: 'id' });
    bcStore.createIndex('type', 'type', { unique: false });
    bcStore.createIndex('date', 'date', { unique: false });
    dbg(`Created store: ${S.BOURSE_CRYPTO}`);
  }

  if (!db.objectStoreNames.contains(S.ACQUISITIONS)) {
    const acqStore = db.createObjectStore(S.ACQUISITIONS, {
      keyPath: 'id',
      autoIncrement: true,
    });
    acqStore.createIndex('date', 'date', { unique: false });
    acqStore.createIndex('type', 'type', { unique: false });
    dbg(`Created store: ${S.ACQUISITIONS}`);
  }

  if (!db.objectStoreNames.contains(S.ALLOCATION)) {
    db.createObjectStore(S.ALLOCATION, { keyPath: 'id' });
    dbg(`Created store: ${S.ALLOCATION}`);
  }

  const missingStores = Object.values(S).filter((name) => !db.objectStoreNames.contains(name));
  if (missingStores.length > 0) {
    wrn(`Missing stores after upgrade: ${missingStores.join(', ')}`);
  }
}
