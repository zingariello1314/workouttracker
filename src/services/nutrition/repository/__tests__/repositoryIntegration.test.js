/**
 * repositoryIntegration.test.js
 * 
 * ✅ PHASE 12.2 - Étape 9 : Tests d'intégration Repository + Observer
 * 
 * Tests d'intégration complets pour valider le fonctionnement ensemble du Repository pattern
 * et du pattern Observer :
 * - Synchronisation automatique entre Repository et Observer
 * - Notifications lors des opérations CRUD
 * - Cache invalidation et notifications
 * - Batch operations avec notifications
 * 
 * @module services/nutrition/repository/__tests__/repositoryIntegration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ✅ Importer fake-indexeddb AVANT tout autre code
import 'fake-indexeddb/auto';
import { IndexedDBRepository } from '../IndexedDBRepository';
import { MemoryRepository } from '../MemoryRepository';
import { getRepositoryObserver } from '../repositoryObserver';
import { getStoreName } from '../index';

// Constantes pour tests
const STORE_DAILY_MEALS = 'nutrition_dailyMeals';
const STORE_MEALS = 'nutrition_meals';
const DB_NAME = 'WorkoutTrackerDB';
const DB_VERSION = 10;

/**
 * Helper : Créer une base IndexedDB avec stores nutrition pour tests
 */
async function createTestDB() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('indexedDB non disponible - fake-indexeddb/auto doit être importé');
  }

  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_DAILY_MEALS)) {
          db.createObjectStore(STORE_DAILY_MEALS, { keyPath: 'date' }).createIndex('date', 'date', { unique: true });
        }
        if (!db.objectStoreNames.contains(STORE_MEALS)) {
          const mealsStore = db.createObjectStore(STORE_MEALS, { keyPath: 'id' });
          mealsStore.createIndex('date', 'date', { unique: false });
        }
      };
    };
    deleteRequest.onerror = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_DAILY_MEALS)) {
          db.createObjectStore(STORE_DAILY_MEALS, { keyPath: 'date' }).createIndex('date', 'date', { unique: true });
        }
        if (!db.objectStoreNames.contains(STORE_MEALS)) {
          db.createObjectStore(STORE_MEALS, { keyPath: 'id' }).createIndex('date', 'date', { unique: false });
        }
      };
    };
  });
}

async function cleanupTestDB(db) {
  if (db) {
    db.close();
  }
  return new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => resolve();
    deleteRequest.onblocked = () => resolve();
  });
}

describe('Repository + Observer Integration', () => {
  let repository;
  let observer;
  let db;

  beforeEach(async () => {
    // ✅ Utiliser IndexedDBRepository pour tests d'intégration
    db = await createTestDB();
    repository = new IndexedDBRepository(db);
    observer = getRepositoryObserver();
    observer.clear();
  });

  afterEach(async () => {
    if (observer) {
      observer.clear();
    }
    await cleanupTestDB(db);
  });

  describe('Synchronisation automatique save() → Observer', () => {
    it('devrait notifier observer lors de save()', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save(STORE_DAILY_MEALS, dailyMeal, { quiet: true });

      // ✅ Attendre notification
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].date).toBe(key);
      expect(notifications[0].totalCalories).toBe(2000);
    });

    it('devrait notifier tous les subscribers pour une clé', async () => {
      const notifications1 = [];
      const notifications2 = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications1.push(data);
      });
      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications2.push(data);
      });

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save(STORE_DAILY_MEALS, dailyMeal, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications1.length).toBeGreaterThan(0);
      expect(notifications2.length).toBeGreaterThan(0);
    });

    it('devrait notifier subscribers wildcard store:*', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');

      observer.subscribe(`${storeName}:*`, (data) => {
        notifications.push(data);
      });

      await repository.save(STORE_DAILY_MEALS, { date: '2025-01-16', totalCalories: 2000 }, { quiet: true });
      await repository.save(STORE_DAILY_MEALS, { date: '2025-01-17', totalCalories: 2200 }, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Synchronisation automatique delete() → Observer', () => {
    it('devrait notifier observer avec null lors de delete()', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      // ✅ Sauvegarder d'abord
      await repository.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2000 }, { quiet: true });

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      await repository.delete(STORE_DAILY_MEALS, key, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications.length).toBeGreaterThan(0);
      // ✅ Dernière notification devrait être null (suppression)
      const lastNotification = notifications[notifications.length - 1];
      expect(lastNotification).toBeNull();
    });
  });

  describe('Cache invalidation + Observer', () => {
    it('devrait invalider cache et notifier observer lors de save()', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      // ✅ Sauvegarder initialement
      await repository.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2000 }, { quiet: true });

      // ✅ Récupérer (cache miss puis cache hit)
      await repository.get(STORE_DAILY_MEALS, key, { quiet: true });

      // ✅ Mettre à jour (devrait invalider cache et notifier)
      await repository.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2500 }, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ Vérifier notification
      expect(notifications.length).toBeGreaterThan(0);
      
      // ✅ Vérifier cache invalidé (récupération devrait retourner nouvelle valeur)
      const result = await repository.get(STORE_DAILY_MEALS, key, { quiet: true });
      expect(result.totalCalories).toBe(2500);
    });
  });

  describe('Batch operations + Observer', () => {
    it('devrait notifier observer pour chaque opération save dans batch', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');

      observer.subscribe(`${storeName}:*`, (data) => {
        notifications.push(data);
      });

      const operations = [
        { type: 'save', store: STORE_DAILY_MEALS, data: { date: '2025-01-16', totalCalories: 2000 } },
        { type: 'save', store: STORE_DAILY_MEALS, data: { date: '2025-01-17', totalCalories: 2200 } },
        { type: 'save', store: STORE_DAILY_MEALS, data: { date: '2025-01-18', totalCalories: 1800 } }
      ];

      await repository.batch(operations, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(notifications.length).toBeGreaterThanOrEqual(3);
    });

    it('devrait notifier observer pour opérations delete dans batch', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');

      // ✅ Sauvegarder d'abord
      await repository.save(STORE_DAILY_MEALS, { date: '2025-01-16', totalCalories: 2000 }, { quiet: true });
      await repository.save(STORE_DAILY_MEALS, { date: '2025-01-17', totalCalories: 2200 }, { quiet: true });

      observer.subscribe(`${storeName}:*`, (data) => {
        notifications.push(data);
      });

      const operations = [
        { type: 'delete', store: STORE_DAILY_MEALS, key: '2025-01-16' },
        { type: 'delete', store: STORE_DAILY_MEALS, key: '2025-01-17' }
      ];

      await repository.batch(operations, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Multi-store notifications', () => {
    it('devrait notifier observer pour différents stores', async () => {
      const dailyMealNotifications = [];
      const mealNotifications = [];
      const dailyMealStoreName = getStoreName('dailyMeals');
      const mealStoreName = getStoreName('meals');

      observer.subscribe(`${dailyMealStoreName}:*`, (data) => {
        dailyMealNotifications.push(data);
      });
      observer.subscribe(`${mealStoreName}:*`, (data) => {
        mealNotifications.push(data);
      });

      await repository.save(STORE_DAILY_MEALS, { date: '2025-01-16', totalCalories: 2000 }, { quiet: true });
      await repository.save(STORE_MEALS, { 
        id: 'meal-1', 
        date: '2025-01-16', 
        type: 'breakfast',
        foods: [{ id: 'food-1', name: 'Oatmeal', quantity: 100, unit: 'g' }]
      }, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(dailyMealNotifications.length).toBeGreaterThan(0);
      expect(mealNotifications.length).toBeGreaterThan(0);
    });
  });

  describe('MemoryRepository + Observer Integration', () => {
    it('devrait fonctionner avec MemoryRepository également', async () => {
      const memoryRepo = new MemoryRepository();
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      await memoryRepo.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2000 }, { quiet: true });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].date).toBe(key);
    });
  });

  describe('Unsubscribe pendant opérations', () => {
    it('ne devrait pas notifier après unsubscribe', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      const unsubscribe = observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      await repository.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2000 }, { quiet: true });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(notifications.length).toBeGreaterThan(0);

      // ✅ Se désabonner
      unsubscribe();

      // ✅ Nouvelle sauvegarde ne devrait pas notifier
      const notificationsCount = notifications.length;
      await repository.save(STORE_DAILY_MEALS, { date: key, totalCalories: 2500 }, { quiet: true });
      await new Promise(resolve => setTimeout(resolve, 50));

      // ✅ Nombre de notifications ne devrait pas augmenter
      expect(notifications.length).toBe(notificationsCount);
    });
  });
});

