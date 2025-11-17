/**
 * repositoryFactory.js
 * 
 * ✅ PHASE 12.2 : Factory pattern pour création et gestion Repository
 * 
 * Factory pour créer et gérer l'instance singleton du repository selon le contexte.
 * Détection automatique : IndexedDB → LocalStorage → Memory
 * 
 * Fonctionnalités :
 * - Singleton pattern pour éviter multiples instances
 * - Détection automatique storage disponible
 * - Fallback automatique (IndexedDB → LocalStorage → Memory)
 * - Gestion lifecycle (initialisation, cleanup)
 * - Support override manuel pour tests
 * 
 * @module services/nutrition/repository/repositoryFactory
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import { IndexedDBRepository } from './IndexedDBRepository';
import { LocalStorageRepository } from './LocalStorageRepository';
import { MemoryRepository } from './MemoryRepository';
import { openNutritionDB } from '../../../hooks/nutritionDataUtils';
import logger from '../../../utils/logger';

const log = logger.module('repositoryFactory');

// ==================== CONSTANTES ====================

/**
 * Types de repository disponibles
 */
export const RepositoryType = {
  INDEXEDDB: 'indexeddb',
  LOCALSTORAGE: 'localstorage',
  MEMORY: 'memory'
};

// ==================== VARIABLES GLOBALES ====================

/**
 * Instance singleton du repository
 */
let repositoryInstance = null;

/**
 * Type de repository actuel
 */
let currentRepositoryType = null;

/**
 * Override manuel pour tests (optionnel)
 */
let manualOverride = null;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Vérifie si IndexedDB est disponible
 * 
 * @returns {Promise<boolean>} true si IndexedDB disponible
 */
async function isIndexedDBAvailable() {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return false;
    }
    
    // ✅ CORRECTION : Timeout pour éviter blocage indéfini
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: openNutritionDB took too long')), 2000);
    });
    
    // Tester ouverture DB avec timeout
    const db = await Promise.race([
      openNutritionDB(),
      timeoutPromise
    ]);
    return db !== null;
  } catch (error) {
    log.debug('[isIndexedDBAvailable] IndexedDB non disponible:', error);
    return false;
  }
}

/**
 * Vérifie si localStorage est disponible
 * 
 * @returns {boolean} true si localStorage disponible
 */
function isLocalStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    // Test write/read
    const testKey = `nutrition_repo_test_${Date.now()}`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    log.debug('[isLocalStorageAvailable] localStorage non disponible:', error);
    return false;
  }
}

/**
 * Détecte automatiquement le meilleur storage disponible
 * 
 * @returns {Promise<string>} Type de repository (RepositoryType)
 */
async function detectBestStorage() {
  // 1. Essayer IndexedDB (meilleur choix)
  if (await isIndexedDBAvailable()) {
    log.debug('[detectBestStorage] IndexedDB détecté');
    return RepositoryType.INDEXEDDB;
  }
  
  // 2. Essayer localStorage (fallback)
  if (isLocalStorageAvailable()) {
    log.debug('[detectBestStorage] localStorage détecté (fallback)');
    return RepositoryType.LOCALSTORAGE;
  }
  
  // 3. Fallback mémoire (toujours disponible)
  log.debug('[detectBestStorage] Mémoire utilisée (fallback final)');
  return RepositoryType.MEMORY;
}

/**
 * Crée une instance de repository selon le type
 * 
 * @param {string} type - Type de repository (RepositoryType)
 * @returns {Promise<NutritionRepository>} Instance du repository
 */
async function createRepository(type) {
  switch (type) {
    case RepositoryType.INDEXEDDB: {
      // ✅ CORRECTION : Timeout pour éviter blocage indéfini
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: openNutritionDB took too long')), 2000);
      });
      
      const db = await Promise.race([
        openNutritionDB(),
        timeoutPromise
      ]);
      
      if (!db) {
        throw new Error('IndexedDB non disponible malgré détection');
      }
      return new IndexedDBRepository(db);
    }
    
    case RepositoryType.LOCALSTORAGE: {
      return new LocalStorageRepository();
    }
    
    case RepositoryType.MEMORY: {
      return new MemoryRepository();
    }
    
    default:
      throw new Error(`Type de repository inconnu: ${type}`);
  }
}

// ==================== API PUBLIQUE ====================

/**
 * ✅ PHASE 12.2 : Obtient l'instance singleton du repository
 * 
 * Détection automatique : IndexedDB → LocalStorage → Memory
 * Singleton pattern : une seule instance partagée
 * 
 * @param {Object} options - Options
 * @param {string} [options.forceType] - Forcer un type spécifique (pour tests)
 * @param {boolean} [options.recreate] - Recréer l'instance même si existe déjà
 * @returns {Promise<NutritionRepository>} Instance du repository
 * 
 * @example
 * // Utilisation normale (détection automatique)
 * const repo = await getNutritionRepository();
 * const dailyMeal = await repo.get('nutrition_dailyMeals', '2025-01-16');
 * 
 * @example
 * // Forcer un type pour tests
 * const repo = await getNutritionRepository({ forceType: RepositoryType.MEMORY });
 */
export const getNutritionRepository = async (options = {}) => {
  const { forceType = null, recreate = false } = options;
  
  // ✅ PHASE 12.2 : Override manuel pour tests
  if (manualOverride) {
    log.debug('[getNutritionRepository] Utilisation override manuel');
    return manualOverride;
  }
  
  // ✅ PHASE 12.2 : Singleton : retourner instance existante si non recréée
  if (repositoryInstance && !recreate && !forceType) {
    return repositoryInstance;
  }
  
  // ✅ PHASE 12.2 : Déterminer type de repository
  let repositoryType;
  if (forceType) {
    repositoryType = forceType;
    log.debug('[getNutritionRepository] Type forcé:', repositoryType);
  } else {
    repositoryType = await detectBestStorage();
  }
  
  // ✅ PHASE 12.2 : Créer instance si type différent ou recreate
  if (!repositoryInstance || recreate || currentRepositoryType !== repositoryType) {
    log.info('[getNutritionRepository] Création repository:', repositoryType);
    
    try {
      // ✅ CORRECTION : Timeout pour éviter blocage indéfini lors de la création
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: createRepository took too long')), 3000);
      });
      
      repositoryInstance = await Promise.race([
        createRepository(repositoryType),
        timeoutPromise
      ]);
      currentRepositoryType = repositoryType;
      
      // Vérifier disponibilité
      const isAvailable = await repositoryInstance.isAvailable();
      if (!isAvailable) {
        log.warn('[getNutritionRepository] Repository non disponible, fallback mémoire');
        repositoryInstance = new MemoryRepository();
        currentRepositoryType = RepositoryType.MEMORY;
      }
    } catch (error) {
      log.error('[getNutritionRepository] Erreur création repository, fallback mémoire:', error);
      // ✅ CORRECTION : Fallback vers MemoryRepository si erreur
      repositoryInstance = new MemoryRepository();
      currentRepositoryType = RepositoryType.MEMORY;
    }
  }
  
  return repositoryInstance;
};

/**
 * ✅ PHASE 12.2 : Obtient le type de repository actuel
 * 
 * @returns {string|null} Type de repository ou null si non initialisé
 */
export const getCurrentRepositoryType = () => {
  return currentRepositoryType;
};

/**
 * ✅ PHASE 12.2 : Réinitialise le repository (utile pour tests)
 * 
 * @returns {Promise<void>}
 */
export const resetRepository = async () => {
  if (repositoryInstance) {
    try {
      await repositoryInstance.close();
    } catch (error) {
      log.warn('[resetRepository] Erreur fermeture repository:', error);
    }
  }
  
  repositoryInstance = null;
  currentRepositoryType = null;
  manualOverride = null;
  
  log.debug('[resetRepository] Repository réinitialisé');
};

/**
 * ✅ PHASE 12.2 : Override manuel du repository (pour tests)
 * 
 * @param {NutritionRepository|null} repository - Instance de repository ou null pour désactiver
 */
export const setRepositoryOverride = (repository) => {
  manualOverride = repository;
  log.debug('[setRepositoryOverride] Override défini:', repository ? repository.constructor.name : 'null');
};

/**
 * ✅ PHASE 12.2 : Vérifie si un type de repository est disponible
 * 
 * @param {string} type - Type de repository (RepositoryType)
 * @returns {Promise<boolean>} true si disponible
 */
export const isRepositoryTypeAvailable = async (type) => {
  switch (type) {
    case RepositoryType.INDEXEDDB:
      return await isIndexedDBAvailable();
    case RepositoryType.LOCALSTORAGE:
      return isLocalStorageAvailable();
    case RepositoryType.MEMORY:
      return true; // Toujours disponible
    default:
      return false;
  }
};

/**
 * ✅ PHASE 12.2 : Retourne les statistiques du repository actuel
 * 
 * @returns {Promise<Object>} Statistiques
 */
export const getRepositoryStats = async () => {
  const repo = await getNutritionRepository();
  return {
    type: currentRepositoryType,
    stats: repo.getStats()
  };
};

