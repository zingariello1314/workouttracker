/**
 * Bench chargement des données Garmin (MultiStoreLoader)
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
import { multiStoreLoader } from '../../src/hooks/garmin/storage/MultiStoreLoader.js';
import { resetGlobalState, openDB, closeDB } from '../../src/hooks/garminDataUtils.js';

const DAY_COUNTS = [30, 90, 180];

const generateMetrics = (date) => ({
  date,
  steps: Math.floor(Math.random() * 15000),
  distance: Number((Math.random() * 8).toFixed(2)),
  calories: {
    total: Math.floor(Math.random() * 2800),
    active: Math.floor(Math.random() * 900),
    resting: Math.floor(Math.random() * 2000)
  },
  heartRate: {
    resting: 50 + Math.random() * 15,
    max: 150 + Math.random() * 40,
    timeSeries: []
  }
});

const buildDataset = (dayCount) => {
  const activities = { swimming: [], jumpRope: [], cardio: [] };
  const dailyMetrics = {};
  const today = new Date();

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const isoDate = date.toISOString().split('T')[0];

    dailyMetrics[isoDate] = generateMetrics(isoDate);

    // Ajouter quelques activités par jour
    const activity = {
      id: `cardio_${isoDate}_${i}`,
      date: isoDate,
      type: 'cardio',
      duration: Math.floor(Math.random() * 3600),
      distance: Number((Math.random() * 5).toFixed(2)),
      calories: Math.floor(Math.random() * 500),
      lastSynced: new Date().toISOString()
    };
    activities.cardio.push(activity);
  }

  return { activities, dailyMetrics };
};

const prepareData = async (dayCount) => {
  await resetGlobalState();
  await openDB();
  const dataset = buildDataset(dayCount);
  await batchStorageManager.saveActivitiesBatch(dataset.activities);
  await batchStorageManager.saveDailyMetricsBatch(dataset.dailyMetrics);
};

const runScenario = async (dayCount) => {
  await prepareData(dayCount);
  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dayCount + 1);
  const isoStart = startDate.toISOString().split('T')[0];

  const start = performance.now();
  const { activities, metrics } = await multiStoreLoader.loadDataByRange(isoStart, today);
  const duration = performance.now() - start;

  await closeDB();

  return {
    days: dayCount,
    activitiesLoaded: activities.swimming.length + activities.jumpRope.length + activities.cardio.length,
    metricsLoaded: Object.keys(metrics).length,
    durationMs: Number(duration.toFixed(2))
  };
};

const main = async () => {
  const results = [];
  for (const dayCount of DAY_COUNTS) {
    const metrics = await runScenario(dayCount);
    results.push(metrics);
  }
  console.table(results);
};

main().catch((error) => {
  console.error('[bench] loadData failure:', error);
  process.exitCode = 1;
});
