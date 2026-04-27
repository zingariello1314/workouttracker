/**
 * MultiStoreLoader
 * -----------------
 * Fournit un chargement optimisé des activités et métriques Garmin en une seule
 * transaction IndexedDB afin de réduire l’overhead et garantir un snapshot
 * cohérent.
 */

import {
  openDB,
  STORE_ACTIVITIES,
  STORE_DAILY_METRICS,
  recordBelongsToCurrentScope
} from '../../garminDataUtils';
import logger from '../../../utils/logger';

const log = logger.module('MultiStoreLoader');

class MultiStoreLoader {
  async loadDataByRange(startDate, endDate) {
    const db = await openDB();
    if (!db) {
      throw new Error('IndexedDB unavailable');
    }

    const tx = db.transaction([STORE_ACTIVITIES, STORE_DAILY_METRICS], 'readonly');
    const activitiesStore = tx.objectStore(STORE_ACTIVITIES);
    const metricsStore = tx.objectStore(STORE_DAILY_METRICS);

    try {
      const [activities, dailyMetrics] = await Promise.all([
        this.#loadActivitiesFromStore(activitiesStore, startDate, endDate),
        this.#loadMetricsFromStore(metricsStore, startDate, endDate)
      ]);

      await this.#awaitTransaction(tx);
      log.debug('[MultiStoreLoader] Loaded data by range', {
        startDate,
        endDate,
        activitiesCount: activities.swimming.length + activities.jumpRope.length + activities.cardio.length,
        metricsCount: Object.keys(dailyMetrics).length
      });

      return { activities, metrics: dailyMetrics };
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  #awaitTransaction(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }

  #loadActivitiesFromStore(store, startDate, endDate) {
    const activities = { swimming: [], jumpRope: [], cardio: [] };
    const range = startDate && endDate ? IDBKeyRange.bound(startDate, endDate) : null;

    const pushActivity = (activity) => {
      if (!activity || !activity.type) return;
      if (activity.type === 'swimming') {
        activities.swimming.push(activity);
      } else if (activity.type === 'jumpRope') {
        activities.jumpRope.push(activity);
      } else {
        activities.cardio.push(activity);
      }
    };

    return new Promise((resolve, reject) => {
      let request;
      try {
        const dateIndex = store.index('date');
        request = range ? dateIndex.openCursor(range) : dateIndex.openCursor();
      } catch (error) {
        log.warn('[MultiStoreLoader] Index "date" not available, falling back to full scan');
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const activity = cursor.value;
          if (
            recordBelongsToCurrentScope(activity) &&
            (!range || (activity.date >= startDate && activity.date <= endDate))
          ) {
            pushActivity(activity);
          }
          cursor.continue();
        } else {
          resolve(activities);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  #loadMetricsFromStore(store, startDate, endDate) {
    const metrics = {};
    const range = startDate && endDate ? IDBKeyRange.bound(startDate, endDate) : null;

    return new Promise((resolve, reject) => {
      let request;
      try {
        const dateIndex = store.index('date');
        request = range ? dateIndex.openCursor(range) : dateIndex.openCursor();
      } catch (error) {
        log.warn('[MultiStoreLoader] Index "date" not available for metrics, falling back to full scan');
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const metric = cursor.value;
          if (
            recordBelongsToCurrentScope(metric) &&
            (!range || (metric.date >= startDate && metric.date <= endDate))
          ) {
            const { date, ...rest } = metric;
            metrics[date] = rest;
          }
          cursor.continue();
        } else {
          resolve(metrics);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const multiStoreLoader = new MultiStoreLoader();
