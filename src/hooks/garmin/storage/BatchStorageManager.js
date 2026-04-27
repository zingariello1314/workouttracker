/**
 * Gestionnaire de stockage par batch pour IndexedDB.
 * Optimise les opérations d'écriture (activités, métriques quotidiennes)
 * en regroupant les lectures/écritures dans une transaction unique.
 */

import {
  openDB,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  getGarminScope,
  recordBelongsToCurrentScope
} from '../../garminDataUtils';
import { mergeActivityRecord, mergeDailyMetrics } from '../../garminDataFusion';
import logger from '../../../utils/logger';

const log = logger.module('BatchStorageManager');

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

class BatchStorageManager {
  async saveActivitiesBatch(activitiesByType = {}) {
    const entries = this.#flattenActivities(activitiesByType);
    if (entries.length === 0) {
      return { saved: 0, skipped: 0, duration: 0 };
    }

    const start = now();
    const db = await openDB();
    if (!db) {
      throw new Error('IndexedDB unavailable');
    }

    const tx = db.transaction([STORE_ACTIVITIES], 'readwrite');
    const store = tx.objectStore(STORE_ACTIVITIES);
    const scope = getGarminScope();

    try {
      const existingMap = await this.#loadExistingRecords(store, entries.map(({ item }) => item.id));

      const mergedActivities = entries.map(({ item, type }) => {
        const merged = mergeActivityRecord(existingMap.get(item.id) || null, item, type);
        return { ...merged, userId: scope };
      });

      await Promise.all(mergedActivities.map((activity) => this.#putRecord(store, activity)));
      await this.#awaitTransaction(tx);

      const duration = now() - start;
      log.debug('[BatchStorageManager] Activities batch saved', {
        saved: mergedActivities.length,
        duration
      });

      return {
        saved: mergedActivities.length,
        skipped: entries.length - mergedActivities.length,
        duration
      };
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  async saveDailyMetricsBatch(metricsMap = {}) {
    const entries = Object.entries(metricsMap);
    if (entries.length === 0) {
      return { saved: 0, duration: 0 };
    }

    const start = now();
    const db = await openDB();
    if (!db) {
      throw new Error('IndexedDB unavailable');
    }

    const tx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const store = tx.objectStore(STORE_DAILY_METRICS);
    const scope = getGarminScope();

    try {
      const existingMap = await this.#loadExistingRecords(store, entries.map(([date]) => date));

      await Promise.all(
        entries.map(([date, metrics]) => {
          const existing = existingMap.get(date) || null;
          const merged = mergeDailyMetrics(metrics, existing, date);
          return this.#putRecord(store, { ...merged, date, userId: scope });
        })
      );

      await this.#awaitTransaction(tx);
      const duration = now() - start;
      log.debug('[BatchStorageManager] Daily metrics batch saved', {
        saved: entries.length,
        duration
      });

      return {
        saved: entries.length,
        duration
      };
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  #flattenActivities(activitiesByType) {
    const flat = [];
    for (const type of ['swimming', 'jumpRope', 'cardio']) {
      const items = activitiesByType[type] || [];
      for (const item of items) {
        if (!item || !item.id) {
          continue;
        }
        flat.push({ item, type });
      }
    }
    return flat;
  }

  #loadExistingRecords(store, ids) {
    const targetIds = ids.filter(Boolean);
    if (targetIds.length === 0) {
      return Promise.resolve(new Map());
    }

    return new Promise((resolve, reject) => {
      const idsSet = new Set(targetIds);
      const existingMap = new Map();

      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (idsSet.has(cursor.key) && recordBelongsToCurrentScope(cursor.value)) {
            existingMap.set(cursor.key, cursor.value);
          }
          cursor.continue();
        } else {
          resolve(existingMap);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  #putRecord(store, payload) {
    return new Promise((resolve, reject) => {
      const request = store.put(payload);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  #awaitTransaction(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }
}

export const batchStorageManager = new BatchStorageManager();
