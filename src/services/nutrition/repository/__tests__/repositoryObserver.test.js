/**
 * repositoryObserver.test.js
 * 
 * ✅ PHASE 12.2 - Étape 9 : Tests pour Repository Observer Pattern
 * 
 * Tests complets pour valider le pattern Observer :
 * - Subscribe/Unsubscribe
 * - Notifications automatiques
 * - Wildcards (store:*)
 * - Statistiques
 * 
 * @module services/nutrition/repository/__tests__/repositoryObserver
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRepositoryObserver, RepositoryObserver } from '../repositoryObserver';

describe('Repository Observer', () => {
  let observer;

  beforeEach(() => {
    observer = getRepositoryObserver();
    observer.clear(); // Nettoyer avant chaque test
  });

  afterEach(() => {
    if (observer) {
      observer.clear();
    }
  });

  describe('subscribe(key, callback)', () => {
    it('devrait s\'abonner à une clé spécifique', () => {
      const callback = vi.fn();
      const unsubscribe = observer.subscribe('dailyMeal:2025-01-16', callback);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('devrait appeler callback lors de notification', () => {
      const callback = vi.fn();
      observer.subscribe('dailyMeal:2025-01-16', callback);
      
      const data = { date: '2025-01-16', totalCalories: 2000 };
      observer.notify('dailyMeal:2025-01-16', data);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(data);
    });

    it('devrait supporter wildcard store:*', () => {
      const callback = vi.fn();
      observer.subscribe('dailyMeal:*', callback);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      observer.notify('dailyMeal:2025-01-17', { date: '2025-01-17' });
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('devrait supporter wildcard global *:*', () => {
      const callback = vi.fn();
      observer.subscribe('*:*', callback);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      observer.notify('meal:meal-123', { id: 'meal-123' });
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('devrait retourner no-op unsubscribe si clé invalide', () => {
      const unsubscribe = observer.subscribe(null, vi.fn());
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
      
      // ✅ Devrait être no-op (ne pas throw)
      expect(() => unsubscribe()).not.toThrow();
    });

    it('devrait retourner no-op unsubscribe si callback invalide', () => {
      const unsubscribe = observer.subscribe('dailyMeal:2025-01-16', null);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
      
      // ✅ Devrait être no-op (ne pas throw)
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('unsubscribe(key, callback)', () => {
    it('devrait désabonner callback spécifique', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      observer.subscribe('dailyMeal:2025-01-16', callback1);
      observer.subscribe('dailyMeal:2025-01-16', callback2);
      
      observer.unsubscribe('dailyMeal:2025-01-16', callback1);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('devrait désabonner tous callbacks si callback non fourni', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      observer.subscribe('dailyMeal:2025-01-16', callback1);
      observer.subscribe('dailyMeal:2025-01-16', callback2);
      
      observer.unsubscribe('dailyMeal:2025-01-16');
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('ne devrait rien faire si clé inexistante', () => {
      expect(() => {
        observer.unsubscribe('inexistant:key', vi.fn());
      }).not.toThrow();
    });
  });

  describe('notify(key, data)', () => {
    it('devrait notifier tous les callbacks abonnés', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      observer.subscribe('dailyMeal:2025-01-16', callback1);
      observer.subscribe('dailyMeal:2025-01-16', callback2);
      
      const data = { date: '2025-01-16', totalCalories: 2000 };
      observer.notify('dailyMeal:2025-01-16', data);
      
      expect(callback1).toHaveBeenCalledWith(data);
      expect(callback2).toHaveBeenCalledWith(data);
    });

    it('devrait notifier callbacks wildcard store:*', () => {
      const callback = vi.fn();
      observer.subscribe('dailyMeal:*', callback);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('devrait notifier callbacks wildcard global *:*', () => {
      const callback = vi.fn();
      observer.subscribe('*:*', callback);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      observer.notify('meal:meal-123', { id: 'meal-123' });
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('ne devrait rien faire si aucun callback abonné', () => {
      expect(() => {
        observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      }).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('devrait supprimer tous les abonnements', () => {
      const callback = vi.fn();
      observer.subscribe('dailyMeal:2025-01-16', callback);
      
      observer.clear();
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('devrait réinitialiser statistiques', () => {
      observer.subscribe('dailyMeal:2025-01-16', vi.fn());
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      
      observer.clear();
      
      const stats = observer.getStats();
      expect(stats.activeSubscriptions).toBe(0);
      expect(stats.totalNotifications).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('devrait retourner statistiques complètes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      observer.subscribe('dailyMeal:2025-01-16', callback1);
      observer.subscribe('dailyMeal:2025-01-17', callback2);
      
      observer.notify('dailyMeal:2025-01-16', { date: '2025-01-16' });
      observer.notify('dailyMeal:2025-01-17', { date: '2025-01-17' });
      
      const stats = observer.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalSubscriptions).toBeGreaterThanOrEqual(2);
      expect(stats.totalNotifications).toBeGreaterThanOrEqual(2);
      expect(stats.activeSubscriptions).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getActiveSubscriptionsCount()', () => {
    it('devrait retourner nombre abonnements actifs', () => {
      expect(observer.getActiveSubscriptionsCount()).toBe(0);
      
      observer.subscribe('dailyMeal:2025-01-16', vi.fn());
      observer.subscribe('dailyMeal:2025-01-17', vi.fn());
      
      expect(observer.getActiveSubscriptionsCount()).toBe(2);
      
      observer.unsubscribe('dailyMeal:2025-01-16');
      
      expect(observer.getActiveSubscriptionsCount()).toBe(1);
    });
  });

  describe('Singleton pattern', () => {
    it('devrait retourner même instance via getRepositoryObserver()', () => {
      const observer1 = getRepositoryObserver();
      const observer2 = getRepositoryObserver();
      
      expect(observer1).toBe(observer2);
    });
  });
});

