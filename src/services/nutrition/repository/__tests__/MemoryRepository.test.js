/**
 * MemoryRepository.test.js
 * 
 * ✅ PHASE 12.2 - Étape 9 : Tests unitaires pour MemoryRepository
 * 
 * Tests complets pour valider l'implémentation mémoire du Repository pattern.
 * Ces tests sont rapides car ils n'utilisent pas IndexedDB réel.
 * 
 * @module services/nutrition/repository/__tests__/MemoryRepository
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRepository } from '../MemoryRepository';
import { getRepositoryObserver } from '../repositoryObserver';
import { getStoreName } from '../index';

describe('MemoryRepository', () => {
  let repository;
  let observer;

  beforeEach(() => {
    // ✅ Créer nouvelle instance pour chaque test (isolation)
    repository = new MemoryRepository();
    observer = getRepositoryObserver();
    observer.clear(); // Nettoyer observer avant chaque test
  });

  afterEach(() => {
    // ✅ Cleanup après chaque test
    if (repository) {
      repository.clear();
    }
    if (observer) {
      observer.clear();
    }
  });

  describe('get(store, key)', () => {
    it('devrait retourner null si entrée inexistante', async () => {
      const result = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(result).toBeNull();
    });

    it('devrait récupérer une entrée existante', async () => {
      const dailyMeal = {
        date: '2025-01-16',
        totalCalories: 2000,
        totalProtein: 150,
        totalCarbs: 200,
        totalFat: 65
      };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      const result = await repository.get('nutrition_dailyMeals', '2025-01-16');

      expect(result).not.toBeNull();
      expect(result.date).toBe('2025-01-16');
      expect(result.totalCalories).toBe(2000);
    });

    it('devrait utiliser la clé primaire correcte (date pour dailyMeals)', async () => {
      const dailyMeal = {
        date: '2025-01-16',
        totalCalories: 2000
      };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      const result = await repository.get('nutrition_dailyMeals', '2025-01-16');

      expect(result).not.toBeNull();
      expect(result.date).toBe('2025-01-16');
    });

    it('devrait utiliser la clé primaire correcte (id pour meals)', async () => {
      const meal = {
        id: 'meal-123',
        date: '2025-01-16',
        type: 'breakfast',
        name: 'Oatmeal'
      };

      await repository.save('nutrition_meals', meal);
      const result = await repository.get('nutrition_meals', 'meal-123');

      expect(result).not.toBeNull();
      expect(result.id).toBe('meal-123');
      expect(result.name).toBe('Oatmeal');
    });
  });

  describe('getAll(store)', () => {
    it('devrait retourner tableau vide si store vide', async () => {
      const result = await repository.getAll('nutrition_dailyMeals');
      expect(result).toEqual([]);
    });

    it('devrait récupérer toutes les entrées d\'un store', async () => {
      const dailyMeal1 = { date: '2025-01-16', totalCalories: 2000 };
      const dailyMeal2 = { date: '2025-01-17', totalCalories: 2200 };
      const dailyMeal3 = { date: '2025-01-18', totalCalories: 1800 };

      await repository.save('nutrition_dailyMeals', dailyMeal1);
      await repository.save('nutrition_dailyMeals', dailyMeal2);
      await repository.save('nutrition_dailyMeals', dailyMeal3);

      const result = await repository.getAll('nutrition_dailyMeals');

      expect(result).toHaveLength(3);
      expect(result.map(r => r.date)).toContain('2025-01-16');
      expect(result.map(r => r.date)).toContain('2025-01-17');
      expect(result.map(r => r.date)).toContain('2025-01-18');
    });

    it('devrait retourner seulement les entrées du store spécifié', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };
      const meal = { id: 'meal-123', date: '2025-01-16', name: 'Oatmeal' };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      await repository.save('nutrition_meals', meal);

      const dailyMeals = await repository.getAll('nutrition_dailyMeals');
      const meals = await repository.getAll('nutrition_meals');

      expect(dailyMeals).toHaveLength(1);
      expect(meals).toHaveLength(1);
      expect(dailyMeals[0].date).toBe('2025-01-16');
      expect(meals[0].id).toBe('meal-123');
    });
  });

  describe('save(store, data)', () => {
    it('devrait sauvegarder une nouvelle entrée', async () => {
      const dailyMeal = {
        date: '2025-01-16',
        totalCalories: 2000
      };

      const result = await repository.save('nutrition_dailyMeals', dailyMeal);
      const retrieved = await repository.get('nutrition_dailyMeals', '2025-01-16');

      expect(result).toBe(true);
      expect(retrieved).not.toBeNull();
      expect(retrieved.date).toBe('2025-01-16');
    });

    it('devrait mettre à jour une entrée existante', async () => {
      const dailyMeal1 = { date: '2025-01-16', totalCalories: 2000 };
      const dailyMeal2 = { date: '2025-01-16', totalCalories: 2500 };

      await repository.save('nutrition_dailyMeals', dailyMeal1);
      await repository.save('nutrition_dailyMeals', dailyMeal2);

      const result = await repository.get('nutrition_dailyMeals', '2025-01-16');

      expect(result.totalCalories).toBe(2500); // Mise à jour
    });

    it('devrait notifier l\'observer après sauvegarde', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save('nutrition_dailyMeals', dailyMeal);

      // ✅ Attendre un peu pour laisser l'observer se déclencher
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].date).toBe(key);
    });
  });

  describe('delete(store, key)', () => {
    it('devrait supprimer une entrée existante', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      const beforeDelete = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(beforeDelete).not.toBeNull();

      const result = await repository.delete('nutrition_dailyMeals', '2025-01-16');
      const afterDelete = await repository.get('nutrition_dailyMeals', '2025-01-16');

      expect(result).toBe(true);
      expect(afterDelete).toBeNull();
    });

    it('ne devrait pas lever d\'erreur si entrée inexistante', async () => {
      // ✅ CORRECTION : Map.delete() retourne false si clé n'existe pas, true si supprimée
      // C'est le comportement attendu (pas d'erreur levée, juste false)
      const result = await repository.delete('nutrition_dailyMeals', '2025-01-16');
      expect(result).toBe(false); // Pas d'erreur, retourne false si clé inexistante
    });

    it('devrait notifier l\'observer après suppression', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save('nutrition_dailyMeals', dailyMeal);

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      await repository.delete('nutrition_dailyMeals', key);

      // ✅ Attendre un peu pour laisser l'observer se déclencher
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toBeNull(); // Suppression = null
    });
  });

  describe('query(store, index, range)', () => {
    it('devrait retourner tableau vide si store vide', async () => {
      // ✅ NOTE : MemoryRepository.query() retourne simplement getAll() (pas de filtrage par index)
      const result = await repository.query(
        'nutrition_meals',
        'date',
        { lower: '2025-01-16', upper: '2025-01-16', lowerOpen: false, upperOpen: false }
      );

      expect(result).toEqual([]);
    });

    it('devrait retourner toutes les entrées (query simplifié en mémoire)', async () => {
      // ✅ NOTE : MemoryRepository.query() est simplifié et retourne tous les résultats
      // Le filtrage par index/range n'est pas implémenté (fallback getAll)
      const meal1 = { id: 'meal-1', date: '2025-01-16', type: 'breakfast' };
      const meal2 = { id: 'meal-2', date: '2025-01-17', type: 'lunch' };
      const meal3 = { id: 'meal-3', date: '2025-01-16', type: 'dinner' };

      await repository.save('nutrition_meals', meal1);
      await repository.save('nutrition_meals', meal2);
      await repository.save('nutrition_meals', meal3);

      const result = await repository.query(
        'nutrition_meals',
        'date',
        { lower: '2025-01-16', upper: '2025-01-16', lowerOpen: false, upperOpen: false }
      );

      // ✅ MemoryRepository retourne tous les résultats (pas de filtrage)
      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toContain('meal-1');
      expect(result.map(r => r.id)).toContain('meal-2');
      expect(result.map(r => r.id)).toContain('meal-3');
    });

    it('devrait retourner seulement les entrées du store spécifié', async () => {
      const meal1 = { id: 'meal-1', date: '2025-01-16', type: 'breakfast' };
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };

      await repository.save('nutrition_meals', meal1);
      await repository.save('nutrition_dailyMeals', dailyMeal);

      const meals = await repository.query('nutrition_meals', 'date', null);
      const dailyMeals = await repository.query('nutrition_dailyMeals', 'date', null);

      expect(meals).toHaveLength(1);
      expect(meals[0].id).toBe('meal-1');
      expect(dailyMeals).toHaveLength(1);
      expect(dailyMeals[0].date).toBe('2025-01-16');
    });
  });

  describe('clearStore(store)', () => {
    it('devrait vider un store spécifique', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };
      const meal = { id: 'meal-123', date: '2025-01-16', name: 'Oatmeal' };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      await repository.save('nutrition_meals', meal);

      await repository.clearStore('nutrition_dailyMeals');

      const dailyMeals = await repository.getAll('nutrition_dailyMeals');
      const meals = await repository.getAll('nutrition_meals');

      expect(dailyMeals).toHaveLength(0);
      expect(meals).toHaveLength(1); // meals non affecté
    });
  });

  describe('clear()', () => {
    it('devrait vider tous les stores', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };
      const meal = { id: 'meal-123', date: '2025-01-16', name: 'Oatmeal' };
      const program = { id: 'prog-1', name: 'Program 1', isActive: true };

      await repository.save('nutrition_dailyMeals', dailyMeal);
      await repository.save('nutrition_meals', meal);
      await repository.save('nutrition_programs', program);

      await repository.clear();

      const dailyMeals = await repository.getAll('nutrition_dailyMeals');
      const meals = await repository.getAll('nutrition_meals');
      const programs = await repository.getAll('nutrition_programs');

      expect(dailyMeals).toHaveLength(0);
      expect(meals).toHaveLength(0);
      expect(programs).toHaveLength(0);
    });
  });

  describe('isAvailable()', () => {
    it('devrait toujours retourner true (mémoire toujours disponible)', async () => {
      const result = await repository.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('Observer Pattern', () => {
    it('devrait notifier après save', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save('nutrition_dailyMeals', dailyMeal);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('devrait notifier après delete', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');
      const key = '2025-01-16';

      const dailyMeal = { date: key, totalCalories: 2000 };
      await repository.save('nutrition_dailyMeals', dailyMeal);

      observer.subscribe(`${storeName}:${key}`, (data) => {
        notifications.push(data);
      });

      await repository.delete('nutrition_dailyMeals', key);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toBeNull();
    });

    it('devrait supporter pattern store:*', async () => {
      const notifications = [];
      const storeName = getStoreName('dailyMeals');

      observer.subscribe(`${storeName}:*`, (data) => {
        notifications.push(data);
      });

      const dailyMeal1 = { date: '2025-01-16', totalCalories: 2000 };
      const dailyMeal2 = { date: '2025-01-17', totalCalories: 2200 };

      await repository.save('nutrition_dailyMeals', dailyMeal1);
      await repository.save('nutrition_dailyMeals', dailyMeal2);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cache Integration', () => {
    it('devrait invalider le cache après save', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };
      
      // ✅ Première récupération (cache miss)
      const result1 = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(result1).toBeNull();

      await repository.save('nutrition_dailyMeals', dailyMeal);

      // ✅ Deuxième récupération (après save, cache invalidé)
      const result2 = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(result2).not.toBeNull();
    });

    it('devrait invalider le cache après delete', async () => {
      const dailyMeal = { date: '2025-01-16', totalCalories: 2000 };
      
      await repository.save('nutrition_dailyMeals', dailyMeal);
      const beforeDelete = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(beforeDelete).not.toBeNull();

      await repository.delete('nutrition_dailyMeals', '2025-01-16');

      // ✅ Après delete, cache invalidé
      const afterDelete = await repository.get('nutrition_dailyMeals', '2025-01-16');
      expect(afterDelete).toBeNull();
    });
  });
});
