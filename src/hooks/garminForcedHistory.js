import {
  openDB,
  getUseFallback,
  setUseFallback,
  getGarminScope,
  recordBelongsToCurrentScope,
  readStorageBucket,
  writeStorageBucket,
  deleteStorageBucket,
  STORE_FORCED_RANGES
} from './garminDataUtils';
import { retryWithBackoff } from './garminRetryUtils';
import { logIndexedDBError } from './garminErrorHandler';
import logger from '../utils/logger';

const log = logger.module('garminForcedHistory');

const MAX_HISTORY_ENTRIES = 200;
export const FORCED_HISTORY_LIMIT = MAX_HISTORY_ENTRIES;

const safeNumber = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toIsoString = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return fallback;
    }
    return date.toISOString();
  } catch {
    return fallback;
  }
};

const clampBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const computeRangeDays = (start, end) => {
  if (!start || !end) return null;
  try {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }
    const diff = endDate.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return null;
  }
};

const sanitizeCachePurge = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return {
    removedFiles: safeNumber(value.removedFiles, 0),
    dates: Array.isArray(value.dates) ? value.dates.slice(0, 64) : []
  };
};

const sanitizeDiagnostic = (diagnostic) => {
  if (!diagnostic || typeof diagnostic !== 'object') {
    return null;
  }
  const sanitized = {
    pythonDuration: safeNumber(diagnostic.pythonDuration, null),
    totalDuration: safeNumber(diagnostic.totalDuration, null),
    cacheUsed: clampBoolean(diagnostic.cacheUsed, false),
    cacheKey: diagnostic.cacheKey || null,
    requestTimestamp: diagnostic.requestTimestamp ? toIsoString(diagnostic.requestTimestamp, null) : null
  };
  if (diagnostic.resolve && typeof diagnostic.resolve === 'object') {
    sanitized.resolve = {
      mode: diagnostic.resolve.mode || null,
      forceRefresh: clampBoolean(diagnostic.resolve.forceRefresh, false),
      includeToday: clampBoolean(diagnostic.resolve.includeToday, false),
      cachePurge: sanitizeCachePurge(diagnostic.resolve.cachePurge)
    };
  }
  return sanitized;
};

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    throw new Error('[garminForcedHistory] Entry invalide');
  }

  const nowIso = new Date().toISOString();
  const triggeredAt = toIsoString(entry.triggeredAt || entry.requestTimestamp || nowIso, nowIso);
  const start = entry.start || entry.range?.start || null;
  const end = entry.end || entry.range?.end || start;
  const includeToday = clampBoolean(entry.includeToday ?? entry.meta?.includeToday, false);
  const finalEnd = includeToday && end && start ? (() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return todayStr;
  })() : end;

  const normalized = {
    id: entry.id ?? null,
    mode: entry.mode || entry.forceMode || null,
    start: start || null,
    end: finalEnd || null,
    includeToday,
    forceRefresh: clampBoolean(entry.forceRefresh, true),
    lastSync: entry.lastSync || null,
    triggeredAt,
    requestTimestamp: toIsoString(entry.requestTimestamp, triggeredAt),
    ok: clampBoolean(entry.ok, true),
    cached: clampBoolean(entry.cached, false),
    activitiesCount: safeNumber(entry.activitiesCount, 0),
    metricsCount: safeNumber(entry.metricsCount, 0),
    pythonDuration: safeNumber(entry.pythonDuration, null),
    totalDuration: safeNumber(entry.totalDuration, null),
    rangeDays: entry.rangeDays ?? computeRangeDays(start, finalEnd),
    cachePurge: sanitizeCachePurge(entry.cachePurge),
    diagnostic: sanitizeDiagnostic(entry.diagnostic),
    createdAt: toIsoString(entry.createdAt, triggeredAt),
    updatedAt: nowIso,
    source: entry.source || 'syncNow',
    notes: entry.notes || null,
    userId: entry.userId || getGarminScope()
  };

  if (!normalized.start || !normalized.end) {
    throw new Error('[garminForcedHistory] Entry doit contenir start et end');
  }

  return normalized;
};

const makeLocalKey = (entry) => {
  const safeMode = entry.mode || 'default';
  return `${entry.triggeredAt || entry.createdAt || entry.start}_${safeMode}_${entry.start}_${entry.end}`;
};

const saveToLocalStorage = (entry) => {
  const normalized = normalizeEntry(entry);
  let bucket = readStorageBucket(STORE_FORCED_RANGES);
  if (!bucket || typeof bucket !== 'object') {
    bucket = {};
  }
  const key = normalized.id || makeLocalKey(normalized);
  normalized.id = key;
  bucket[key] = normalized;

  const sorted = Object.values(bucket)
    .filter((item) => item && item.triggeredAt)
    .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
    .slice(0, MAX_HISTORY_ENTRIES);

  const trimmedBucket = sorted.reduce((acc, item) => {
    acc[item.id || makeLocalKey(item)] = item;
    return acc;
  }, {});

  writeStorageBucket(STORE_FORCED_RANGES, trimmedBucket);
  return normalized;
};

const pruneIndexedDB = async (db) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_FORCED_RANGES], 'readwrite');
    const store = tx.objectStore(STORE_FORCED_RANGES);

    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
    tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));

    const index = store.index('triggeredAt');
    const entries = [];
    index.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        if (entries.length <= MAX_HISTORY_ENTRIES) {
          return;
        }
        const toDelete = entries.slice(0, entries.length - MAX_HISTORY_ENTRIES);
        toDelete.forEach((entry) => {
          if (entry?.id !== undefined && entry?.id !== null) {
            store.delete(entry.id);
          }
        });
        return;
      }
      if (recordBelongsToCurrentScope(cursor.value)) {
        entries.push(cursor.value);
      }
      cursor.continue();
    };
  });
};

const requestToPromise = (request) => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToIndexedDB = async (entry) => {
  const normalized = normalizeEntry(entry);
  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    return saveToLocalStorage(entry);
  }

  return retryWithBackoff(async () => {
    const tx = db.transaction([STORE_FORCED_RANGES], 'readwrite');
    const store = tx.objectStore(STORE_FORCED_RANGES);

    const data = { ...normalized };
    if (!data.createdAt) {
      data.createdAt = data.triggeredAt;
    }
    data.updatedAt = new Date().toISOString();

    let request;
    if (data.id) {
      request = store.put(data);
    } else {
      const payload = { ...data };
      delete payload.id;
      request = store.add(payload);
    }

    const id = await requestToPromise(request);
    data.id = data.id || id;

    await pruneIndexedDB(db);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
    });

    return data;
  }, {
    maxRetries: 2,
    initialDelay: 100,
    maxDelay: 800,
    context: {
      store: STORE_FORCED_RANGES,
      operation: 'saveForcedRange'
    }
  }).catch((error) => {
    logIndexedDBError(error, {
      store: STORE_FORCED_RANGES,
      operation: 'saveForcedRange'
    }, 'error');
    setUseFallback(true);
    return saveToLocalStorage(entry);
  });
};

export const saveForcedRangeEntry = async (entry) => {
  if (!entry) return null;
  if (getUseFallback() || !window.indexedDB) {
    return saveToLocalStorage(entry);
  }
  return saveToIndexedDB(entry);
};

export const loadForcedRangesHistory = async (limit = MAX_HISTORY_ENTRIES) => {
  const effectiveLimit = Math.max(1, Math.min(limit, MAX_HISTORY_ENTRIES));

  if (getUseFallback() || !window.indexedDB) {
    const bucket = readStorageBucket(STORE_FORCED_RANGES);
    if (!bucket || typeof bucket !== 'object') {
      return [];
    }
    return Object.values(bucket)
      .filter((item) => item && item.triggeredAt && recordBelongsToCurrentScope(item))
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
      .slice(0, effectiveLimit);
  }

  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    return loadForcedRangesHistory(limit);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_FORCED_RANGES], 'readonly');
    const store = tx.objectStore(STORE_FORCED_RANGES);
    let results = [];

    tx.oncomplete = () => {
      results = results
        .filter((item) => item && item.triggeredAt && recordBelongsToCurrentScope(item))
        .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
        .slice(0, effectiveLimit);
      resolve(results);
    };
    tx.onerror = (event) => reject(event.target.error);
    tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));

    let cursorRequest;
    try {
      cursorRequest = store.index('triggeredAt').openCursor(null, 'prev');
    } catch (e) {
      log.warn('[garminForcedHistory] Index triggeredAt indisponible, fallback sur ordre naturel');
      cursorRequest = store.openCursor(null, 'prev');
    }

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        return;
      }
      if (results.length < effectiveLimit) {
        results.push(cursor.value);
        cursor.continue();
      }
    };
    cursorRequest.onerror = (event) => reject(event.target.error);
  });
};

export const clearForcedRangesHistory = async () => {
  if (getUseFallback() || !window.indexedDB) {
    deleteStorageBucket(STORE_FORCED_RANGES);
    return;
  }

  const db = await openDB();
  if (!db) {
    setUseFallback(true);
    deleteStorageBucket(STORE_FORCED_RANGES);
    return;
  }

  await retryWithBackoff(() => new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_FORCED_RANGES], 'readwrite');
    const store = tx.objectStore(STORE_FORCED_RANGES);
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return;
      if (recordBelongsToCurrentScope(cursor.value)) {
        cursor.delete();
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
    tx.onabort = (event) => reject(event.target.error || new Error('Transaction aborted'));
  }), {
    maxRetries: 2,
    initialDelay: 100,
    maxDelay: 500,
    context: {
      store: STORE_FORCED_RANGES,
      operation: 'clearForcedRanges'
    }
  }).catch((error) => {
    logIndexedDBError(error, {
      store: STORE_FORCED_RANGES,
      operation: 'clearForcedRanges'
    }, 'error');
    setUseFallback(true);
    deleteStorageBucket(STORE_FORCED_RANGES);
  });
};

export const importForcedRangesHistory = async (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { imported: 0 };
  }

  let imported = 0;
  for (const entry of entries.slice(0, MAX_HISTORY_ENTRIES)) {
    try {
      const normalized = normalizeEntry(entry);
      await saveForcedRangeEntry(normalized);
      imported += 1;
    } catch (err) {
      log.warn('[garminForcedHistory] Impossible d’importer une entrée', { err, entry });
    }
  }
  return { imported };
};
