/**
 * Schéma IndexedDB GarminDataDB — hors singleton / retry (`garminDataUtils`).
 *
 * @module services/garmin/garminDbGateway
 */

export const DB_NAME = 'GarminDataDB';

/** @see garminDataUtils — version 5 : autoSyncHistory */
export const DB_VERSION = 5;

export const STORE_ACTIVITIES = 'activities';
export const STORE_DAILY_METRICS = 'dailyMetrics';
export const STORE_DEVICE_META = 'deviceMeta';
export const STORE_FORCED_RANGES = 'forcedRangesHistory';
export const STORE_TELEMETRY_HISTORY = 'telemetryHistory';
export const STORE_AUTO_SYNC_HISTORY = 'autoSyncHistory';

/**
 * @param {IDBVersionChangeEvent} event
 * @param {{ debug?: Function, warn?: Function, error?: Function }} log
 */
export function applyGarminSchemaUpgrade(event, log) {
  const db = event.target.result;

  let activityStore;
  if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
    activityStore = db.createObjectStore(STORE_ACTIVITIES, {
      keyPath: 'id',
      autoIncrement: false,
    });
    activityStore.createIndex('date', 'date', { unique: false });
    activityStore.createIndex('type', 'type', { unique: false });
    activityStore.createIndex('date_type', ['date', 'type'], { unique: false });
  } else {
    activityStore = event.target.transaction.objectStore(STORE_ACTIVITIES);
  }

  const activityIndexNames = Array.from(activityStore.indexNames);
  if (!activityIndexNames.includes('lastSyncTimestamp')) {
    try {
      activityStore.createIndex('lastSyncTimestamp', 'lastSyncTimestamp', { unique: false });
      log.debug('[openDB] Index lastSyncTimestamp créé sur activities');
    } catch (err) {
      log.warn('[openDB] Erreur création index lastSyncTimestamp:', err);
    }
  }
  if (!activityIndexNames.includes('timestamp')) {
    try {
      activityStore.createIndex('timestamp', 'timestamp', { unique: false });
      log.debug('[openDB] Index timestamp créé sur activities');
    } catch (err) {
      log.warn('[openDB] Erreur création index timestamp:', err);
    }
  }

  let metricsStore;
  if (!db.objectStoreNames.contains(STORE_DAILY_METRICS)) {
    metricsStore = db.createObjectStore(STORE_DAILY_METRICS, {
      keyPath: 'date',
      autoIncrement: false,
    });
    metricsStore.createIndex('date', 'date', { unique: true });
  } else {
    metricsStore = event.target.transaction.objectStore(STORE_DAILY_METRICS);
  }

  const metricsIndexNames = Array.from(metricsStore.indexNames);
  if (!metricsIndexNames.includes('lastSync')) {
    try {
      metricsStore.createIndex('lastSync', 'lastSync', { unique: false });
      log.debug('[openDB] Index lastSync créé sur dailyMetrics');
    } catch (err) {
      log.warn('[openDB] Erreur création index lastSync:', err);
    }
  }

  if (!db.objectStoreNames.contains(STORE_DEVICE_META)) {
    db.createObjectStore(STORE_DEVICE_META, {
      keyPath: 'key',
      autoIncrement: false,
    });
  }

  if (!db.objectStoreNames.contains(STORE_FORCED_RANGES)) {
    const forcedStore = db.createObjectStore(STORE_FORCED_RANGES, {
      keyPath: 'id',
      autoIncrement: true,
    });
    forcedStore.createIndex('triggeredAt', 'triggeredAt', { unique: false });
    forcedStore.createIndex('mode', 'mode', { unique: false });
    forcedStore.createIndex('start', 'start', { unique: false });
    forcedStore.createIndex('end', 'end', { unique: false });
  }

  if (!db.objectStoreNames.contains(STORE_TELEMETRY_HISTORY)) {
    const telemetryStore = db.createObjectStore(STORE_TELEMETRY_HISTORY, {
      keyPath: 'timestamp',
      autoIncrement: false,
    });
    telemetryStore.createIndex('timestamp', 'timestamp', { unique: true });
  }

  if (!db.objectStoreNames.contains(STORE_AUTO_SYNC_HISTORY)) {
    const autoSyncStore = db.createObjectStore(STORE_AUTO_SYNC_HISTORY, {
      keyPath: 'id',
      autoIncrement: false,
    });
    autoSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
    autoSyncStore.createIndex('triggerType', 'triggerType', { unique: false });
    autoSyncStore.createIndex('result', 'result', { unique: false });
  }
}
