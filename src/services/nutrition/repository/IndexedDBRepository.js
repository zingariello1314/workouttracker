/**
 * IndexedDBRepository.js
 * 
 * ✅ PHASE 12.2 : Implémentation IndexedDB du Repository pattern
 * 
 * Implémentation principale utilisée en production pour accès IndexedDB.
 * Intègre toutes les optimisations existantes :
 * - Cache en mémoire (nutritionDataCache)
 * - Retry automatique (nutritionRetryUtils)
 * - Validation Zod (nutritionSchemas)
 * - Gestion erreurs standardisée (nutritionErrors)
 * - Quota-safe storage (quotaSafeStorage)
 * - Pattern Observer pour synchronisation
 * 
 * @module services/nutrition/repository/IndexedDBRepository
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import { NutritionRepository } from './NutritionRepository';
import { openNutritionDB } from '../../../hooks/nutritionDataUtils';
import {
  getFromStoreWithRetry,
  putToStoreWithRetry,
  deleteFromStoreWithRetry,
  getAllFromStoreWithRetry
} from '../nutritionRetryUtils';
import { getQuotaSafeStorage, QuotaExceededError } from '../../../utils/quotaSafeStorage';
import { NutritionConfig } from '../../../config/nutrition.config';
import {
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB
} from '../../../utils/nutritionErrors';
import {
  validateDailyMeal,
  validateMeal,
  validateProgram,
  validateFavoriteFood,
  validateHydrationLog
} from '../nutritionSchemas';
// ✅ OPTIMISATION : Gestion corruption IndexedDB avec récupération automatique
import {
  isCorruptionError,
  handleCorruption,
  verifyDatabaseIntegrity,
  clearCorruptionFlags
} from '../nutritionCorruptionHandler';
import logger from '../../../utils/logger';

const log = logger.module('indexedDBRepository');

/**
 * ✅ PHASE 12.2 : Implémentation IndexedDB du Repository pattern
 * 
 * Cette classe implémente toutes les méthodes abstraites de NutritionRepository
 * en utilisant IndexedDB comme storage backend.
 */
export class IndexedDBRepository extends NutritionRepository {
  /**
   * @param {IDBDatabase} db - Instance IndexedDB (singleton)
   */
  constructor(db) {
    super();
    
    if (!db) {
      throw new Error('IndexedDB instance required for IndexedDBRepository');
    }
    
    this.db = db;
    this.quotaSafeStorage = null; // Lazy initialization
    this.corruptionHandled = false; // Flag pour éviter gestion multiple
  }

  /**
   * Obtient ou initialise quota-safe storage (lazy)
   * 
   * @returns {Promise<QuotaSafeStorage>} Instance quota-safe storage
   */
  async getQuotaSafeStorage() {
    if (!this.quotaSafeStorage) {
      this.quotaSafeStorage = await getQuotaSafeStorage();
    }
    return this.quotaSafeStorage;
  }

  /**
   * Vérifie si le repository est disponible
   * 
   * @returns {Promise<boolean>} true si IndexedDB disponible
   */
  async isAvailable() {
    try {
      return this.db !== null && this.db.objectStoreNames.length > 0;
    } catch (error) {
      log.warn('[isAvailable] Erreur vérification disponibilité:', error);
      return false;
    }
  }

  /**
   * Récupère une entrée par clé
   * 
   * ✅ PHASE 12.2 : Intègre cache + retry + gestion erreurs
   * 
   * @param {string} store - Nom du store (ex: 'dailyMeals')
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options { skipCache, operationName }
   * @returns {Promise<any|null>} Données ou null si inexistant
   */
  async get(store, key, options = {}) {
    const { skipCache = false, operationName = `get:${store}`, quiet = false } = options;
    
    // ✅ PHASE 12.2 : Utiliser cache avec pattern fetcher (sauf si skipCache)
    if (!skipCache) {
      const cacheKey = this.generateCacheKey(store, key);
      const cacheType = this.getCacheType(store);
      
      return await this.cache.get(
        cacheKey,
        async () => {
          // Fetcher: récupérer depuis IndexedDB
          return await this.getFromIndexedDB(store, key, operationName, quiet);
        },
        cacheType,
        { skipCache }
      );
    } else {
      // Skip cache: récupérer directement depuis IndexedDB
      return await this.getFromIndexedDB(store, key, operationName, quiet);
    }
  }

  /**
   * Récupère depuis IndexedDB (sans cache)
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @param {string} operationName - Nom de l'opération
   * @returns {Promise<any|null>} Données ou null
   * @private
   */
  async getFromIndexedDB(store, key, operationName, quiet = false) {
    try {
      // Vérifier disponibilité DB
      if (!this.db || !await this.isAvailable()) {
        if (!quiet) {
          log.warn(`[${this.name}] DB non disponible pour get`, { store, key });
        }
        return null;
      }

      // Créer transaction readonly
      const tx = this.db.transaction([store], 'readonly');
      const objectStore = tx.objectStore(store);

      // ✅ PHASE 12.2 : Retry automatique avec backoff exponentiel
      const result = await getFromStoreWithRetry(
        objectStore,
        key,
        operationName,
        { store, key, quiet } // ✅ Passer quiet pour réduire logs Observer
      );

      return result;
    } catch (error) {
      // ✅ OPTIMISATION : Détecter et gérer corruption IndexedDB
      if (isCorruptionError(error) && !this.corruptionHandled) {
        this.corruptionHandled = true;
        log.warn(`[${this.name}] Corruption détectée dans get, tentative récupération...`);
        
        const recoveredDb = await handleCorruption(error, { autoRecover: true, autoReset: false });
        if (recoveredDb) {
          this.db = recoveredDb;
          this.corruptionHandled = false;
          clearCorruptionFlags();
          log.info(`[${this.name}] Récupération réussie, nouvelle tentative get...`);
          // Retenter l'opération avec DB récupérée
          return this.get(store, key, { ...options, quiet: true });
        }
      }
      
      // ✅ PHASE 12.2 : Convertir erreur IndexedDB en NutritionError standardisée
      const nutritionError = createNutritionErrorFromIndexedDB(
        error,
        operationName,
        { store, key }
      );
      // ✅ PHASE 12.2 : Logger seulement si pas quiet
      if (!quiet) {
        log.error(`[${this.name}] Erreur get après retry:`, nutritionError.toJSON());
      }
      
      // Pour lecture, retourner null plutôt que throw (robustesse)
      return null;
    }
  }

  /**
   * Récupère toutes les entrées d'un store
   * 
   * @param {string} store - Nom du store
   * @param {Object} options - Options { filters, operationName }
   * @returns {Promise<Array>} Tableau de données
   */
  async getAll(store, options = {}) {
    const { filters = null, operationName = `getAll:${store}`, quiet = false } = options;

    try {
      if (!this.db || !await this.isAvailable()) {
        if (!quiet) {
          log.warn(`[${this.name}] DB non disponible pour getAll`, { store });
        }
        return [];
      }

      const tx = this.db.transaction([store], 'readonly');
      const objectStore = tx.objectStore(store);

      // ✅ PHASE 12.2 : Retry automatique avec option quiet pour Observer
      const results = await getAllFromStoreWithRetry(
        objectStore,
        null, // Pas de keyRange (tous)
        operationName,
        { store, quiet } // Passer quiet pour réduire logs
      );

      // ✅ PHASE 12.2 : Appliquer filters si fournis
      if (filters && typeof filters === 'function') {
        return results.filter(filters);
      }

      return Array.isArray(results) ? results : [];
    } catch (error) {
      // ✅ OPTIMISATION : Détecter et gérer corruption IndexedDB
      if (isCorruptionError(error) && !this.corruptionHandled) {
        this.corruptionHandled = true;
        log.warn(`[${this.name}] Corruption détectée dans getAll, tentative récupération...`);
        
        const recoveredDb = await handleCorruption(error, { autoRecover: true, autoReset: false });
        if (recoveredDb) {
          this.db = recoveredDb;
          this.corruptionHandled = false;
          clearCorruptionFlags();
          log.info(`[${this.name}] Récupération réussie, nouvelle tentative getAll...`);
          // Retenter l'opération avec DB récupérée
          return this.getAll(store, { ...options, quiet: true });
        }
      }
      
      const nutritionError = createNutritionErrorFromIndexedDB(
        error,
        operationName,
        { store }
      );
      // ✅ PHASE 12.2 : Logger seulement si pas quiet (Observer ne spam plus)
      if (!quiet) {
        log.error(`[${this.name}] Erreur getAll après retry:`, nutritionError.toJSON());
      }
      return [];
    }
  }

  /**
   * Sauvegarde ou met à jour une entrée
   * 
   * ✅ PHASE 12.2 : Intègre quota-safe storage + retry + cache invalidation + observer
   * 
   * @param {string} store - Nom du store
   * @param {Object} data - Données à sauvegarder (doit contenir clé primaire)
   * @param {Object} options - Options { validate, operationName, skipObserver }
   * @returns {Promise<boolean>} true si succès
   */
  async save(store, data, options = {}) {
    const { 
      validate = true, 
      operationName = `save:${store}`,
      skipObserver = false
    } = options;

    try {
      // ✅ PHASE 12.2 : Validation Zod si activée (délégation)
      // Note: Validation doit être faite avant d'appeler save()
      // Ici on assume que data est déjà validé si validate=true

      if (!this.db || !await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'Base de données non initialisée',
          { operation: operationName, store }
        );
      }

      // ✅ PHASE 12.2 : Extraire clé primaire depuis data
      const key = this.extractPrimaryKey(store, data);
      if (!key) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          'Clé primaire manquante dans données',
          { operation: operationName, store, data }
        );
      }

      // ✅ PHASE 12.2 : Utiliser quota-safe storage pour gestion QuotaExceededError
      try {
        const quotaSafeStorage = await this.getQuotaSafeStorage();
        const saved = await quotaSafeStorage.put(store, data);
        
        if (saved) {
          // ✅ PHASE 12.2 : Invalider cache après sauvegarde
          const cacheKey = this.generateCacheKey(store, key);
          this.cache.invalidate(cacheKey);
          
          // ✅ PHASE 12.2 : Notifier Observer pour synchronisation automatique
          if (!skipObserver) {
            this.notify(store, key, data);
          }
          
          log.debug(`[${this.name}] Données sauvegardées`, { store, key });
          return true;
        }
        return false;
      } catch (error) {
        // ✅ PHASE 12.2 : Propager QuotaExceededError pour gestion UI
        if (error instanceof QuotaExceededError) {
          throw error;
        }
        
        // ✅ PHASE 12.2 : Fallback méthode traditionnelle si wrapper non disponible
        log.debug(`[${this.name}] Fallback méthode traditionnelle`, { store, key });
        
        const tx = this.db.transaction([store], 'readwrite');
        const objectStore = tx.objectStore(store);
        
        // ✅ PHASE 12.2 : Retry automatique avec backoff exponentiel
        await putToStoreWithRetry(
          objectStore,
          data,
          operationName,
          { store, key }
        );
        
        // ✅ PHASE 12.2 : Invalider cache après sauvegarde (fallback)
        const cacheKey = this.generateCacheKey(store, key);
        this.cache.invalidate(cacheKey);
        
        // ✅ PHASE 12.2 : Notifier Observer (fallback)
        if (!skipObserver) {
          this.notify(store, key, data);
        }
        
        log.debug(`[${this.name}] Données sauvegardées (fallback)`, { store, key });
        return true;
      }
    } catch (error) {
      // ✅ PHASE 12.2 : Propager QuotaExceededError pour gestion UI
      if (error instanceof QuotaExceededError) {
        throw error;
      }
      
      // ✅ PHASE 12.2 : Convertir erreur IndexedDB en NutritionError standardisée
      const nutritionError = error instanceof NutritionError
        ? error
        : createNutritionErrorFromIndexedDB(
            error,
            operationName,
            { store, data }
          );
      log.error(`[${this.name}] Erreur save après retry:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  /**
   * Supprime une entrée
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options { operationName, skipObserver }
   * @returns {Promise<boolean>} true si succès
   */
  async delete(store, key, options = {}) {
    const { operationName = `delete:${store}`, skipObserver = false } = options;

    try {
      if (!this.db || !await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'Base de données non initialisée',
          { operation: operationName, store, key }
        );
      }

      const tx = this.db.transaction([store], 'readwrite');
      const objectStore = tx.objectStore(store);

      // ✅ PHASE 12.2 : Retry automatique avec backoff exponentiel
      await deleteFromStoreWithRetry(
        objectStore,
        key,
        operationName,
        { store, key }
      );

      // ✅ PHASE 12.2 : Invalider cache après suppression
      const cacheKey = this.generateCacheKey(store, key);
      this.cache.invalidate(cacheKey);
      
      // ✅ PHASE 12.2 : Notifier Observer pour synchronisation automatique
      if (!skipObserver) {
        this.notify(store, key, null); // null = supprimé
      }

      log.debug(`[${this.name}] Données supprimées`, { store, key });
      return true;
    } catch (error) {
      // ✅ OPTIMISATION : Détecter et gérer corruption IndexedDB
      if (isCorruptionError(error) && !this.corruptionHandled) {
        this.corruptionHandled = true;
        log.warn(`[${this.name}] Corruption détectée dans delete, tentative récupération...`);
        
        const recoveredDb = await handleCorruption(error, { autoRecover: true, autoReset: false });
        if (recoveredDb) {
          this.db = recoveredDb;
          this.corruptionHandled = false;
          clearCorruptionFlags();
          log.info(`[${this.name}] Récupération réussie, nouvelle tentative delete...`);
          // Retenter l'opération avec DB récupérée
          return this.delete(store, key, { ...options });
        }
      }
      
      const nutritionError = createNutritionErrorFromIndexedDB(
        error,
        operationName,
        { store, key }
      );
      log.error(`[${this.name}] Erreur delete après retry:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  /**
   * Requête avec index
   * 
   * @param {string} store - Nom du store
   * @param {string} indexName - Nom de l'index
   * @param {IDBKeyRange} range - Range de clés (optionnel)
   * @param {Object} options - Options { operationName }
   * @returns {Promise<Array>} Tableau de résultats
   */
  async query(store, indexName, range = null, options = {}) {
    const { operationName = `query:${store}:${indexName}` } = options;

    try {
      if (!this.db || !await this.isAvailable()) {
        log.warn(`[${this.name}] DB non disponible pour query`, { store, indexName });
        return [];
      }

      const tx = this.db.transaction([store], 'readonly');
      const objectStore = tx.objectStore(store);
      
      // Vérifier que l'index existe
      if (!objectStore.indexNames.contains(indexName)) {
        log.warn(`[${this.name}] Index non trouvé, fallback getAll`, { store, indexName });
        // Fallback: getAll puis filter
        return this.getAll(store, { ...options, operationName });
      }

      const index = objectStore.index(indexName);

      // ✅ PHASE 12.2 : Retry automatique
      const results = await getAllFromStoreWithRetry(
        index,
        range,
        operationName,
        { store, indexName }
      );

      return Array.isArray(results) ? results : [];
    } catch (error) {
      const nutritionError = createNutritionErrorFromIndexedDB(
        error,
        operationName,
        { store, indexName }
      );
      log.error(`[${this.name}] Erreur query après retry:`, nutritionError.toJSON());
      return [];
    }
  }

  /**
   * Exécute plusieurs opérations dans une transaction atomique
   * 
   * ✅ PHASE 12.2 : Batch operations optimisées (une transaction au lieu de N)
   * 
   * @param {Array<Object>} operations - Tableau d'opérations [{type, store, data/key, ...}]
   * @param {Object} options - Options { operationName }
   * @returns {Promise<Object>} Résultats des opérations { success: boolean, results: Array }
   */
  async batch(operations, options = {}) {
    const { 
      operationName = 'batch',
      validate = true,
      quiet = false
    } = options;

    // ✅ PHASE 12.2 Étape 8 : Vérifier batch vide
    if (!Array.isArray(operations) || operations.length === 0) {
      return { success: true, results: [] };
    }

    // ✅ PHASE 12.2 Étape 8 : Limite de taille pour éviter freeze UI
    // ✅ PHASE 12.3 : Utiliser configuration centralisée
    const MAX_BATCH_SIZE = NutritionConfig.batch.maxSize;
    if (operations.length > MAX_BATCH_SIZE) {
      throw new NutritionError(
        NutritionErrorCodes.VALIDATION_INVALID_DATA,
        `Batch trop volumineux (max ${MAX_BATCH_SIZE} opérations, reçu ${operations.length})`,
        { operation: operationName, operationsCount: operations.length, maxSize: MAX_BATCH_SIZE }
      );
    }

    // ✅ PHASE 12.2 Étape 8 : Statistiques de performance
    const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    try {
      if (!this.db || !await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'Base de données non initialisée',
          { operation: operationName, operationsCount: operations.length }
        );
      }

      // ✅ PHASE 12.2 Étape 8 : Valider toutes les données avant de créer la transaction
      if (validate) {
        for (const op of operations) {
          if (op.type === 'save' || op.type === 'put') {
            const validator = this.getValidatorForStore(op.store);
            if (validator) {
              try {
                validator(op.data); // Throw si invalide
              } catch (validationError) {
                throw new NutritionError(
                  NutritionErrorCodes.VALIDATION_INVALID_DATA,
                  `Validation échouée pour opération batch: ${validationError.message}`,
                  { 
                    operation: operationName,
                    store: op.store,
                    validationError: validationError.errors || validationError.message
                  }
                );
              }
            }
          }
        }
      }

      // ✅ PHASE 12.2 : Déterminer stores nécessaires (optimisation transaction)
      const storesNeeded = new Set(operations.map(op => op.store));
      const storesArray = Array.from(storesNeeded);

      // ✅ PHASE 12.2 Étape 8 : Déterminer mode transaction (readwrite ou readonly)
      const hasWriteOps = operations.some(op => op.type === 'save' || op.type === 'put' || op.type === 'delete');
      const txMode = hasWriteOps ? 'readwrite' : 'readonly';

      // ✅ PHASE 12.2 : Créer transaction unique pour toutes les opérations
      const tx = this.db.transaction(storesArray, txMode);
      const results = [];
      const notifications = []; // Pour notifier après transaction complète

      // ✅ PHASE 12.2 : Exécuter toutes les opérations dans la transaction
      for (const op of operations) {
        const { type, store, data, key } = op;
        const objectStore = tx.objectStore(store);

        try {
          switch (type) {
            case 'save':
            case 'put': {
              const opKey = this.extractPrimaryKey(store, data);
              await putToStoreWithRetry(
                objectStore,
                data,
                `${operationName}:save:${store}`,
                { store, key: opKey, quiet }
              );
              results.push({ success: true, type, store, key: opKey });
              
              // Préparer notification
              notifications.push({ store, key: opKey, data });
              
              // Invalider cache
              const cacheKey = this.generateCacheKey(store, opKey);
              this.cache.invalidate(cacheKey);
              break;
            }
            
            case 'delete': {
              await deleteFromStoreWithRetry(
                objectStore,
                key,
                `${operationName}:delete:${store}`,
                { store, key, quiet }
              );
              results.push({ success: true, type, store, key });
              
              // Préparer notification
              notifications.push({ store, key, data: null });
              
              // Invalider cache
              const cacheKey = this.generateCacheKey(store, key);
              this.cache.invalidate(cacheKey);
              break;
            }
            
            // ✅ PHASE 12.2 Étape 8 : Support opérations get en batch (lecture optimisée)
            case 'get': {
              const result = await getFromStoreWithRetry(
                objectStore,
                key,
                `${operationName}:get:${store}`,
                { store, key, quiet: true } // Quiet pour batch get
              );
              results.push({ success: true, type, store, key, data: result });
              break;
            }
            
            default:
              log.warn(`[${this.name}] Type d'opération batch non supporté:`, type);
              results.push({ success: false, type, store, error: 'Type non supporté' });
          }
        } catch (error) {
          // ✅ PHASE 12.2 Étape 8 : Gestion explicite QuotaExceededError
          if (error instanceof QuotaExceededError) {
            log.error(`[${this.name}] QuotaExceededError dans batch:`, { type, store, error });
            // Tenter cleanup automatique via quotaSafeStorage
            try {
              const quotaStorage = await this.getQuotaSafeStorage();
              await quotaStorage.handleQuotaExceeded();
            } catch (quotaError) {
              log.error(`[${this.name}] Erreur gestion quota:`, quotaError);
            }
            // Re-throw pour rollback transaction
            throw error;
          }
          
          log.error(`[${this.name}] Erreur opération batch:`, { type, store, error });
          results.push({ success: false, type, store, error: error.message });
          // Continuer avec autres opérations (transaction sera rollback si nécessaire)
        }
      }

      // ✅ PHASE 12.2 : Attendre completion transaction (atomicité garantie)
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // ✅ PHASE 12.2 : Notifier Observer après transaction complète
      notifications.forEach(({ store, key, data }) => {
        this.notify(store, key, data);
      });

      // ✅ PHASE 12.2 Étape 8 : Calculer statistiques de performance
      const duration = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;
      const successCount = results.filter(r => r.success).length;
      const success = results.every(r => r.success);
      
      const stats = {
        operationsCount: operations.length,
        successCount,
        failureCount: operations.length - successCount,
        duration,
        opsPerSecond: duration > 0 ? (operations.length / duration * 1000).toFixed(2) : 'N/A'
      };

      if (!quiet) {
        log.debug(`[${this.name}] Batch terminé`, { 
          ...stats,
          success 
        });
      }

      return { success, results, stats };
    } catch (error) {
      // ✅ OPTIMISATION : Détecter et gérer corruption IndexedDB
      if (isCorruptionError(error) && !this.corruptionHandled) {
        this.corruptionHandled = true;
        log.warn(`[${this.name}] Corruption détectée dans batch, tentative récupération...`);
        
        const recoveredDb = await handleCorruption(error, { autoRecover: true, autoReset: false });
        if (recoveredDb) {
          this.db = recoveredDb;
          this.corruptionHandled = false;
          clearCorruptionFlags();
          log.info(`[${this.name}] Récupération réussie, nouvelle tentative batch...`);
          // Retenter l'opération avec DB récupérée
          return this.batch(operations, { ...options, quiet: true });
        }
      }
      
      // ✅ PHASE 12.2 Étape 8 : Gestion explicite QuotaExceededError au niveau batch
      if (error instanceof QuotaExceededError) {
        const nutritionError = new NutritionError(
          NutritionErrorCodes.DB_QUOTA_EXCEEDED,
          'Quota de stockage dépassé lors du batch',
          { 
            operation: operationName,
            operationsCount: operations.length,
            originalError: error.message
          }
        );
        log.error(`[${this.name}] QuotaExceededError batch:`, nutritionError.toJSON());
        throw nutritionError;
      }

      const nutritionError = createNutritionErrorFromIndexedDB(
        error,
        operationName,
        { operationsCount: operations.length }
      );
      log.error(`[${this.name}] Erreur batch après retry:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  // ==================== MÉTHODES UTILITAIRES PRIVÉES ====================

  /**
   * Extrait la clé primaire depuis les données selon le store
   * 
   * @param {string} store - Nom du store
   * @param {Object} data - Données
   * @returns {string|number|null} Clé primaire ou null
   * @private
   */
  extractPrimaryKey(store, data) {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Mapping stores → clé primaire
    const keyMappings = {
      'nutrition_dailyMeals': 'date',
      'nutrition_meals': 'id',
      'nutrition_programs': 'id',
      'nutrition_favoriteFoods': 'id',
      'nutrition_hydrationLog': 'date',
      'nutrition_mealPhotos': 'id',
      'nutrition_apiCache': 'key',
      'nutrition_gamification': 'id',
      'nutrition_shareLinks': 'token',
      'nutrition_progressPhotos': 'id',
      'nutrition_mlModels': 'id'
    };

    const keyField = keyMappings[store] || 'id';
    return data[keyField] || data.id || null;
  }

  /**
   * Retourne le validateur Zod approprié pour un store donné
   * 
   * ✅ PHASE 12.2 Étape 8 : Helper pour validation batch
   * 
   * @param {string} store - Nom du store
   * @returns {Function|null} Fonction de validation ou null si pas de validateur
   * @private
   */
  getValidatorForStore(store) {
    // Mapping stores → validateurs Zod
    const validatorMappings = {
      'nutrition_dailyMeals': validateDailyMeal,
      'nutrition_meals': validateMeal,
      'nutrition_programs': validateProgram,
      'nutrition_favoriteFoods': validateFavoriteFood,
      'nutrition_hydrationLog': validateHydrationLog
      // Autres stores n'ont pas de validateur dédié (optionnel)
    };

    return validatorMappings[store] || null;
  }

  /**
   * Retourne le type de cache pour un store donné
   * (utilisé par nutritionDataCache pour déterminer TTL)
   * 
   * @param {string} store - Nom du store
   * @returns {string} Type de cache
   * @private
   */
  getCacheType(store) {
    // Mapping stores → type cache (cohérent avec nutritionDataCache DEFAULT_TTL)
    const typeMappings = {
      'nutrition_dailyMeals': 'dailyMeal',
      'nutrition_meals': 'meals',
      'nutrition_programs': 'program',
      'nutrition_favoriteFoods': 'favoriteFoods',
      'nutrition_hydrationLog': 'hydrationLog',
      'nutrition_gamification': 'gamification',
      'nutrition_shareLinks': 'program', // Utilise TTL program (5 min)
      'nutrition_apiCache': 'program',   // Utilise TTL program (5 min)
      'nutrition_mealPhotos': 'program', // Utilise TTL program (5 min)
      'nutrition_progressPhotos': 'program', // Utilise TTL program (5 min)
      'nutrition_mlModels': 'program'    // Utilise TTL program (5 min)
    };

    return typeMappings[store] || 'dailyMeal'; // Défaut: dailyMeal (1 min)
  }

  /**
   * Ferme/Nettoie le repository
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // IndexedDB ne nécessite pas de fermeture explicite
    // La connexion est gérée par le singleton
    log.debug(`[${this.name}] Repository fermé`);
  }
}
