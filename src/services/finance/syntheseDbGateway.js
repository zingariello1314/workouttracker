/**
 * Ouverture IndexedDB `SyntheseDB` — hors classe `SyntheseStorage` (Phase 1 sync).
 *
 * @module services/finance/syntheseDbGateway
 */

import logger from '../../utils/logger.js';

const log = logger.module('syntheseStorage');

export const SYNTHESE_DB_NAME = 'SyntheseDB';
export const SYNTHESE_DB_VERSION = 1;

function runUpgrade(db) {
  if (!db.objectStoreNames.contains('patrimoine')) {
    db.createObjectStore('patrimoine', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('projections')) {
    db.createObjectStore('projections', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('planEpargne')) {
    db.createObjectStore('planEpargne', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('historique')) {
    const store = db.createObjectStore('historique', { keyPath: 'id', autoIncrement: true });
    store.createIndex('date', 'date', { unique: false });
  }
  log.debug('SyntheseDB stores ensured');
}

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openSyntheseDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNTHESE_DB_NAME, SYNTHESE_DB_VERSION);

    request.onerror = () => {
      log.error('Failed to open SyntheseDB', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      log.debug('SyntheseDB initialized successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      runUpgrade(event.target.result);
    };
  });
}
