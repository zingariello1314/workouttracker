/**
 * Bench sauvegarde activités Garmin (IndexedDB via fake-indexeddb)
 */

import 'fake-indexeddb/auto';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: () => Date.now() };
}

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    const value = this.store.get(String(key));
    return value === undefined ? null : value;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(String(key));
  }
  clear() {
    this.store.clear();
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length() {
    return this.store.size;
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MemoryStorage();
}

import { batchStorageManager } from '../../src/hooks/garmin/storage/BatchStorageManager.js';
import { resetGlobalState, openDB, closeDB } from '../../src/hooks/garminDataUtils.js';

const SCENARIOS = [10, 50, 200, 500];

const generateActivity = (id, type) => {
  const date = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30));
  const isoDate = date.toISOString().split('T')[0];
  return {
    id: `${type}_${id}_${isoDate}`,
    date: isoDate,
    type,
    lastSynced: new Date().toISOString(),
    duration: Math.floor(Math.random() * 3600),
    distance: Number((Math.random() * 5).toFixed(2)),
    calories: Math.floor(Math.random() * 500),
    intensityMinutes: Math.floor(Math.random() * 120),
    heartRateZones: {
      zone1: Math.random() * 10,
      zone2: Math.random() * 10,
      zone3: Math.random() * 10,
      zone4: Math.random() * 10
    }
  };
};

const buildPayload = (count) => {
  const result = {
    swimming: [],
    jumpRope: [],
    cardio: []
  };
  for (let i = 0; i < count; i++) {
    const type = i % 3 === 0 ? 'swimming' : i % 3 === 1 ? 'jumpRope' : 'cardio';
    result[type].push(generateActivity(i + 1, type));
  }
  return result;
};

const runScenario = async (count) => {
  await resetGlobalState();
  await openDB();
  const payload = buildPayload(count);
  const start = performance.now();
  const result = await batchStorageManager.saveActivitiesBatch(payload);
  const duration = performance.now() - start;
  await closeDB();
  return {
    count,
    saved: result.saved,
    durationMs: Number(duration.toFixed(2)),
    perActivityMs: Number((duration / Math.max(result.saved, 1)).toFixed(2))
  };
};

const main = async () => {
  const results = [];
  for (const count of SCENARIOS) {
    const metrics = await runScenario(count);
    results.push(metrics);
  }
  console.table(results);
};

main().catch((error) => {
  console.error('[bench] saveActivities failure:', error);
  process.exitCode = 1;
});
