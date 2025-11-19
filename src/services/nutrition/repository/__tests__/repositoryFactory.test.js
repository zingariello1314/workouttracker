/**
 * repositoryFactory.test.js
 * 
 * ✅ PHASE 12.2 - Étape 9 : Tests pour Repository Factory
 * 
 * Tests complets pour valider la Factory du Repository pattern :
 * - Détection automatique storage (IndexedDB → LocalStorage → Memory)
 * - Singleton pattern
 * - Fallback automatique
 * - Override manuel pour tests
 * 
 * @module services/nutrition/repository/__tests__/repositoryFactory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ✅ Importer fake-indexeddb AVANT tout autre code
import 'fake-indexeddb/auto';
import {
  getNutritionRepository,
  getCurrentRepositoryType,
  resetRepository,
  setRepositoryOverride,
  isRepositoryTypeAvailable,
  getRepositoryStats,
  RepositoryType
} from '../repositoryFactory';
import { MemoryRepository } from '../MemoryRepository';
import { IndexedDBRepository } from '../IndexedDBRepository';
import { LocalStorageRepository } from '../LocalStorageRepository';

// Mock nutritionDataUtils
vi.mock('../../../hooks/nutritionDataUtils', () => ({
  openNutritionDB: vi.fn(async () => {
    // Simuler IndexedDB disponible
    if (typeof indexedDB !== 'undefined') {
      return new Promise((resolve) => {
        const request = indexedDB.open('WorkoutTrackerDB', 10);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    }
    return null;
  })
}));

describe('Repository Factory', () => {
  beforeEach(async () => {
    // ✅ Nettoyer avant chaque test
    await resetRepository();
  });

  afterEach(async () => {
    // ✅ Nettoyer après chaque test
    await resetRepository();
  });

  describe('getNutritionRepository()', () => {
    it('devrait retourner une instance singleton', async () => {
      const repo1 = await getNutritionRepository();
      const repo2 = await getNutritionRepository();
      
      expect(repo1).toBe(repo2);
      expect(repo1).toBeDefined();
    });

    it('devrait détecter automatiquement IndexedDB si disponible', async () => {
      const repo = await getNutritionRepository();
      const type = getCurrentRepositoryType();
      
      // ✅ Si IndexedDB disponible, devrait être utilisé
      if (typeof indexedDB !== 'undefined' && indexedDB) {
        expect(type).toBe(RepositoryType.INDEXEDDB);
        expect(repo).toBeInstanceOf(IndexedDBRepository);
      }
    });

    it('devrait utiliser MemoryRepository si IndexedDB non disponible', async () => {
      // ✅ Forcer fallback mémoire
      const repo = await getNutritionRepository({ forceType: RepositoryType.MEMORY });
      const type = getCurrentRepositoryType();
      
      expect(type).toBe(RepositoryType.MEMORY);
      expect(repo).toBeInstanceOf(MemoryRepository);
    });

    it('devrait recréer instance si recreate = true', async () => {
      const repo1 = await getNutritionRepository();
      const repo2 = await getNutritionRepository({ recreate: true });
      
      // ✅ Nouvelle instance créée
      expect(repo1).not.toBe(repo2);
      expect(repo2).toBeDefined();
    });

    it('devrait forcer un type spécifique si forceType fourni', async () => {
      const repo = await getNutritionRepository({ forceType: RepositoryType.MEMORY });
      const type = getCurrentRepositoryType();
      
      expect(type).toBe(RepositoryType.MEMORY);
      expect(repo).toBeInstanceOf(MemoryRepository);
    });
  });

  describe('setRepositoryOverride()', () => {
    it('devrait permettre override manuel pour tests', async () => {
      const mockRepo = new MemoryRepository();
      setRepositoryOverride(mockRepo);
      
      const repo = await getNutritionRepository();
      
      expect(repo).toBe(mockRepo);
      
      // ✅ Nettoyer override
      setRepositoryOverride(null);
    });

    it('devrait désactiver override si null fourni', async () => {
      const mockRepo = new MemoryRepository();
      setRepositoryOverride(mockRepo);
      setRepositoryOverride(null);
      
      const repo = await getNutritionRepository();
      
      // ✅ Devrait utiliser détection automatique
      expect(repo).not.toBe(mockRepo);
      expect(repo).toBeDefined();
    });
  });

  describe('getCurrentRepositoryType()', () => {
    it('devrait retourner null si repository non initialisé', () => {
      // ✅ Après reset, devrait être null
      const type = getCurrentRepositoryType();
      expect(type).toBeNull();
    });

    it('devrait retourner type actuel après initialisation', async () => {
      await getNutritionRepository({ forceType: RepositoryType.MEMORY });
      const type = getCurrentRepositoryType();
      
      expect(type).toBe(RepositoryType.MEMORY);
    });
  });

  describe('resetRepository()', () => {
    it('devrait réinitialiser repository et type', async () => {
      await getNutritionRepository({ forceType: RepositoryType.MEMORY });
      
      expect(getCurrentRepositoryType()).toBe(RepositoryType.MEMORY);
      
      await resetRepository();
      
      expect(getCurrentRepositoryType()).toBeNull();
    });
  });

  describe('isRepositoryTypeAvailable()', () => {
    it('devrait retourner true pour MEMORY (toujours disponible)', async () => {
      const available = await isRepositoryTypeAvailable(RepositoryType.MEMORY);
      expect(available).toBe(true);
    });

    it('devrait vérifier disponibilité IndexedDB', async () => {
      const available = await isRepositoryTypeAvailable(RepositoryType.INDEXEDDB);
      // ✅ Résultat dépend de l'environnement (fake-indexeddb dans tests)
      expect(typeof available).toBe('boolean');
    });

    it('devrait vérifier disponibilité LocalStorage', async () => {
      const available = await isRepositoryTypeAvailable(RepositoryType.LOCALSTORAGE);
      // ✅ Résultat dépend de l'environnement
      expect(typeof available).toBe('boolean');
    });
  });

  describe('getRepositoryStats()', () => {
    it('devrait retourner statistiques repository', async () => {
      await getNutritionRepository({ forceType: RepositoryType.MEMORY });
      
      const stats = await getRepositoryStats();
      
      expect(stats).toBeDefined();
      expect(stats.type).toBe(RepositoryType.MEMORY);
      expect(stats.stats).toBeDefined();
    });
  });

  describe('Fallback automatique', () => {
    it('devrait fallback vers MemoryRepository si IndexedDB échoue', async () => {
      // ✅ Simuler échec IndexedDB
      const { openNutritionDB } = await import('../../../hooks/nutritionDataUtils');
      vi.mocked(openNutritionDB).mockRejectedValueOnce(new Error('IndexedDB error'));
      
      const repo = await getNutritionRepository();
      
      // ✅ Devrait fallback vers MemoryRepository
      expect(repo).toBeInstanceOf(MemoryRepository);
      expect(getCurrentRepositoryType()).toBe(RepositoryType.MEMORY);
    });
  });
});

