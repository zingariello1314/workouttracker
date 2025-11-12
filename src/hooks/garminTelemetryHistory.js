import logger from '../utils/logger';
import {
  openDB,
  getUseFallback,
  setUseFallback,
  readStorageBucket,
  writeStorageBucket,
  deleteStorageBucket,
  STORE_TELEMETRY_HISTORY
} from './garminDataUtils';
import { retryWithBackoff } from './garminRetryUtils';
import { logIndexedDBError } from './garminErrorHandler';

const log = logger.module('garminTelemetryHistory');

const MAX_ENTRIES = 20;

const fallbackRead = () => {
  const bucket = readStorageBucket(STORE_TELEMETRY_HISTORY);
  return Array.isArray(bucket) ? bucket : [];
};

const fallbackWrite = (entries) => {
  writeStorageBucket(STORE_TELEMETRY_HISTORY, entries);
};

const buildEntry = (snapshot) => {
  const timestamp = snapshot?.generatedAt || new Date().toISOString();
  const diagnostics = snapshot?.diagnostics ?? null;
  return {
    timestamp,
    reason: snapshot?.reason ?? null,
    sessionId: snapshot?.sessionId ?? null,
    schemaVersion: snapshot?.schemaVersion ?? null,
    diagnostics: diagnostics
      ? {
          cacheHits: diagnostics.cacheStats?.hits ?? null,
          networkTotals: diagnostics.networkStats?.totals ?? null,
          renderCount: diagnostics.uiMetrics?.renderCount ?? null
        }
      : null
  };
};

const trimEntries = (entries, limit = MAX_ENTRIES) =>
  entries
    .filter((entry) => entry && entry.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

export const persistTelemetrySnapshot = async (snapshot) => {
  if (!snapshot) {
    return;
  }

  const entry = buildEntry(snapshot);

  if (getUseFallback() || !window.indexedDB) {
    const bucket = fallbackRead();
    const merged = trimEntries([entry, ...bucket.filter((item) => item.timestamp !== entry.timestamp)]);
    fallbackWrite(merged);
    return;
  }

  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    const bucket = fallbackRead();
    const merged = trimEntries([entry, ...bucket.filter((item) => item.timestamp !== entry.timestamp)]);
    fallbackWrite(merged);
    return;
  }

  try {
    await retryWithBackoff(() => new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TELEMETRY_HISTORY], 'readwrite');
      const store = tx.objectStore(STORE_TELEMETRY_HISTORY);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
    }), {
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 500,
      context: { store: STORE_TELEMETRY_HISTORY, operation: 'persistTelemetrySnapshot' }
    });

    await retryWithBackoff(() => new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TELEMETRY_HISTORY], 'readwrite');
      const store = tx.objectStore(STORE_TELEMETRY_HISTORY);
      const request = store.getAll();
      request.onsuccess = () => {
        const allEntries = request.result || [];
        const trimmed = trimEntries(allEntries, MAX_ENTRIES);
        const trimmedIds = new Set(trimmed.map((item) => item.timestamp));
        allEntries
          .filter((item) => !trimmedIds.has(item.timestamp))
          .forEach((item) => store.delete(item.timestamp));
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
    }), {
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 500,
      context: { store: STORE_TELEMETRY_HISTORY, operation: 'pruneTelemetryHistory' }
    });
  } catch (error) {
    logIndexedDBError(error, { store: STORE_TELEMETRY_HISTORY, operation: 'persistTelemetrySnapshot' }, 'warn');
    setUseFallback(true);
    const bucket = fallbackRead();
    const merged = trimEntries([entry, ...bucket.filter((item) => item.timestamp !== entry.timestamp)]);
    fallbackWrite(merged);
  }
};

export const loadTelemetryHistory = async (limit = MAX_ENTRIES) => {
  if (getUseFallback() || !window.indexedDB) {
    return trimEntries(fallbackRead(), limit);
  }

  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    return trimEntries(fallbackRead(), limit);
  }

  try {
    const entries = await retryWithBackoff(() => new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TELEMETRY_HISTORY], 'readonly');
      const store = tx.objectStore(STORE_TELEMETRY_HISTORY);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
    }), {
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 500,
      context: { store: STORE_TELEMETRY_HISTORY, operation: 'loadTelemetryHistory' }
    });

    return trimEntries(entries, limit);
  } catch (error) {
    logIndexedDBError(error, { store: STORE_TELEMETRY_HISTORY, operation: 'loadTelemetryHistory' }, 'warn');
    setUseFallback(true);
    return trimEntries(fallbackRead(), limit);
  }
};

export const clearTelemetryHistory = async () => {
  if (getUseFallback() || !window.indexedDB) {
    deleteStorageBucket(STORE_TELEMETRY_HISTORY);
    return;
  }

  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    deleteStorageBucket(STORE_TELEMETRY_HISTORY);
    return;
  }

  try {
    await retryWithBackoff(() => new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TELEMETRY_HISTORY], 'readwrite');
      const store = tx.objectStore(STORE_TELEMETRY_HISTORY);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
    }), {
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 500,
      context: { store: STORE_TELEMETRY_HISTORY, operation: 'clearTelemetryHistory' }
    });
  } catch (error) {
    logIndexedDBError(error, { store: STORE_TELEMETRY_HISTORY, operation: 'clearTelemetryHistory' }, 'warn');
    setUseFallback(true);
    deleteStorageBucket(STORE_TELEMETRY_HISTORY);
  }
};

