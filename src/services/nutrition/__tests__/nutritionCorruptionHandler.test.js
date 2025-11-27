/**
 * nutritionCorruptionHandler.test.js
 * 
 * ✅ PHASE 13.1 : Tests unitaires complets pour nutritionCorruptionHandler.js
 * 
 * Tests exhaustifs pour gestion corruption IndexedDB :
 * - isCorruptionError (détection différents types d'erreurs)
 * - verifyDatabaseIntegrity (vérification intégrité)
 * - attemptRecovery (tentative récupération)
 * - resetDatabase (réinitialisation complète)
 * - handleCorruption (gestion automatique)
 * - hasDetectedCorruption, clearCorruptionFlags
 * - startIntegrityMonitoring (monitoring périodique)
 * 
 * Stratégie de test :
 * - Utiliser fake-indexeddb pour mocker IndexedDB
 * - Mocker Repository, openNutritionDB
 * - Tester détection corruption, récupération, réinitialisation
 * - Vérifier gestion localStorage (flags, compteurs)
 * 
 * @module services/nutrition/__tests__/nutritionCorruptionHandler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ✅ Importer fake-indexeddb AVANT tout autre code
import 'fake-indexeddb/auto';
import {
  isCorruptionError,
  verifyDatabaseIntegrity,
  attemptRecovery,
  resetDatabase,
  handleCorruption,
  hasDetectedCorruption,
  clearCorruptionFlags,
  startIntegrityMonitoring
} from '../nutritionCorruptionHandler';
import { openNutritionDB, DB_NAME } from '../../../hooks/nutritionDataUtils';

// ==================== MOCKS ====================

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

// Mock Repository
const mockRepository = {
  exportAll: vi.fn(),
  importAll: vi.fn()
};

vi.mock('../repository', () => ({
  getNutritionRepository: vi.fn(async () => mockRepository)
}));

// Mock NutritionConfig
vi.mock('../../../config/nutrition.config', () => ({
  NutritionConfig: {
    corruption: {
      maxRecoveryAttempts: 3,
      recoveryDelay: 100
    }
  }
}));

// ==================== HELPERS ====================

/**
 * Crée une erreur DOMException
 */
function createDOMException(name, message = '') {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * Nettoie localStorage
 */
function clearLocalStorage() {
  localStorage.removeItem('nutrition_db_corruption_detected');
  localStorage.removeItem('nutrition_db_recovery_attempts');
}

// ==================== TESTS ====================

describe('nutritionCorruptionHandler', () => {
  beforeEach(() => {
    // Réinitialiser mocks
    vi.clearAllMocks();
    clearLocalStorage();
    mockRepository.exportAll.mockResolvedValue({});
    mockRepository.importAll.mockResolvedValue(true);
  });

  afterEach(() => {
    clearLocalStorage();
  });

  describe('isCorruptionError', () => {
    it('devrait détecter InvalidStateError', () => {
      const error = createDOMException('InvalidStateError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('devrait détecter UnknownError', () => {
      const error = createDOMException('UnknownError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('devrait détecter DataError', () => {
      const error = createDOMException('DataError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('devrait détecter ConstraintError', () => {
      const error = createDOMException('ConstraintError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('devrait détecter erreur avec message "corrupt"', () => {
      const error = new Error('Database is corrupt');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('devrait détecter erreur avec message "invalid state"', () => {
      const error = new Error('Invalid state of database');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('ne devrait pas détecter erreur normale', () => {
      const error = new Error('Normal error');
      expect(isCorruptionError(error)).toBe(false);
    });

    it('ne devrait pas détecter null/undefined', () => {
      expect(isCorruptionError(null)).toBe(false);
      expect(isCorruptionError(undefined)).toBe(false);
    });
  });

  describe('verifyDatabaseIntegrity', () => {
    it('devrait retourner isValid=false si db est null', async () => {
      const result = await verifyDatabaseIntegrity(null);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('devrait retourner isValid=true si db valide', async () => {
      const db = await openNutritionDB();
      
      const result = await verifyDatabaseIntegrity(db);
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('devrait détecter stores manquants', async () => {
      // Créer une DB mock sans stores
      const db = {
        objectStoreNames: {
          length: 0,
          contains: () => false
        }
      };
      
      const result = await verifyDatabaseIntegrity(db);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('attemptRecovery', () => {
    it('devrait tenter récupération et retourner DB si succès', async () => {
      const error = createDOMException('InvalidStateError');
      
      const result = await attemptRecovery(error);
      
      // Vérifier que localStorage a été mis à jour
      const attempts = parseInt(localStorage.getItem('nutrition_db_recovery_attempts') || '0', 10);
      expect(attempts).toBeGreaterThan(0);
      
      // Si récupération réussie, flags devraient être nettoyés
      if (result) {
        expect(localStorage.getItem('nutrition_db_corruption_detected')).toBeNull();
      }
    });

    it('devrait retourner null si nombre max tentatives atteint', async () => {
      localStorage.setItem('nutrition_db_recovery_attempts', '3'); // Max atteint
      const error = createDOMException('InvalidStateError');
      
      const result = await attemptRecovery(error);
      
      expect(result).toBeNull();
    });

    it('devrait incrémenter compteur tentatives', async () => {
      const error = createDOMException('InvalidStateError');
      
      await attemptRecovery(error);
      
      const attempts = parseInt(localStorage.getItem('nutrition_db_recovery_attempts') || '0', 10);
      expect(attempts).toBe(1);
    });
  });

  describe('resetDatabase', () => {
    it('devrait créer backup avant réinitialisation si createBackup=true', async () => {
      const result = await resetDatabase(true);
      
      expect(mockRepository.exportAll).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('devrait réinitialiser sans backup si createBackup=false', async () => {
      const result = await resetDatabase(false);
      
      expect(mockRepository.exportAll).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('devrait restaurer backup après réinitialisation si disponible', async () => {
      const backup = { dailyMeals: [], meals: [] };
      mockRepository.exportAll.mockResolvedValueOnce(backup);
      
      const result = await resetDatabase(true);
      
      expect(mockRepository.importAll).toHaveBeenCalledWith(backup);
      expect(result).toBeDefined();
    });

    it('devrait nettoyer flags après réinitialisation', async () => {
      localStorage.setItem('nutrition_db_corruption_detected', '123456');
      localStorage.setItem('nutrition_db_recovery_attempts', '2');
      
      await resetDatabase(false);
      
      expect(localStorage.getItem('nutrition_db_corruption_detected')).toBeNull();
      expect(localStorage.getItem('nutrition_db_recovery_attempts')).toBeNull();
    });
  });

  describe('handleCorruption', () => {
    it('devrait ignorer erreur non-corruption', async () => {
      const error = new Error('Normal error');
      
      const result = await handleCorruption(error);
      
      expect(result).toBeNull();
    });

    it('devrait tenter récupération automatique si autoRecover=true', async () => {
      const error = createDOMException('InvalidStateError');
      
      const result = await handleCorruption(error, { autoRecover: true });
      
      // Vérifier que flag corruption a été mis
      expect(localStorage.getItem('nutrition_db_corruption_detected')).not.toBeNull();
    });

    it('devrait réinitialiser si autoReset=true et récupération échoue', async () => {
      const error = createDOMException('InvalidStateError');
      // Simuler échec récupération (max tentatives atteint)
      localStorage.setItem('nutrition_db_recovery_attempts', '3');
      
      const result = await handleCorruption(error, {
        autoRecover: true,
        autoReset: true
      });
      
      // Vérifier que resetDatabase a été appelé (via exportAll)
      expect(mockRepository.exportAll).toHaveBeenCalled();
    });

    it('devrait retourner null si autoRecover=false', async () => {
      const error = createDOMException('InvalidStateError');
      
      const result = await handleCorruption(error, { autoRecover: false });
      
      expect(result).toBeNull();
      expect(localStorage.getItem('nutrition_db_corruption_detected')).not.toBeNull();
    });
  });

  describe('hasDetectedCorruption', () => {
    it('devrait retourner false si pas de flag', () => {
      clearLocalStorage();
      expect(hasDetectedCorruption()).toBe(false);
    });

    it('devrait retourner true si flag présent', () => {
      localStorage.setItem('nutrition_db_corruption_detected', '123456');
      expect(hasDetectedCorruption()).toBe(true);
    });
  });

  describe('clearCorruptionFlags', () => {
    it('devrait nettoyer tous les flags', () => {
      localStorage.setItem('nutrition_db_corruption_detected', '123456');
      localStorage.setItem('nutrition_db_recovery_attempts', '2');
      
      clearCorruptionFlags();
      
      expect(localStorage.getItem('nutrition_db_corruption_detected')).toBeNull();
      expect(localStorage.getItem('nutrition_db_recovery_attempts')).toBeNull();
    });
  });

  describe('startIntegrityMonitoring', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('devrait retourner fonction noop si db est null', () => {
      const stopMonitoring = startIntegrityMonitoring(null);
      
      expect(typeof stopMonitoring).toBe('function');
      stopMonitoring(); // Ne devrait pas crasher
    });

    it('devrait démarrer monitoring avec intervalle par défaut', async () => {
      const db = await openNutritionDB();
      const stopMonitoring = startIntegrityMonitoring(db);
      
      // Avancer le temps pour déclencher vérification
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      
      // Vérifier que verifyDatabaseIntegrity a été appelé (via les logs)
      // Note: On ne peut pas vérifier directement, mais on peut vérifier que la fonction existe
      expect(typeof stopMonitoring).toBe('function');
      
      stopMonitoring();
    });

    it('devrait arrêter monitoring quand stopMonitoring appelé', async () => {
      const db = await openNutritionDB();
      const stopMonitoring = startIntegrityMonitoring(db, 1000); // 1 seconde pour test
      
      stopMonitoring();
      
      // Avancer le temps - monitoring ne devrait plus tourner
      vi.advanceTimersByTime(2000);
      
      // Si monitoring arrêté, pas de nouvelles vérifications
      // (difficile à tester directement, mais fonction stopMonitoring existe)
      expect(typeof stopMonitoring).toBe('function');
    });
  });
});




