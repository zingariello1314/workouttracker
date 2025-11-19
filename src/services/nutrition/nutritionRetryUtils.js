/**
 * nutritionRetryUtils.js
 * 
 * ✅ PHASE 10.4 : Module de retry avec backoff exponentiel pour IndexedDB Nutrition
 * 
 * Ce module fournit des utilitaires pour :
 * - Retry automatique avec backoff exponentiel pour opérations IndexedDB Nutrition
 * - Réutilisation des utilitaires Garmin (cohérence codebase)
 * - Statistiques de retry spécifiques à Nutrition
 * - Classification intelligente des erreurs (transitoires vs permanentes)
 * 
 * Objectifs :
 * - Améliorer la résilience face aux erreurs transitoires IndexedDB
 * - Éviter la surcharge avec retries trop rapides
 * - Fournir des métriques pour monitoring
 * - Cohérence avec système Garmin existant
 * 
 * @module services/nutrition/nutritionRetryUtils
 */

import { retryWithBackoff, calculateBackoffDelay } from '../../hooks/garminRetryUtils';
import { classifyIndexedDBError, shouldRetry, logIndexedDBError } from '../../hooks/garminErrorHandler';
import logger from '../../utils/logger';
import { NutritionConfig } from '../../config/nutrition.config';

const log = logger.module('nutritionRetryUtils');

// ==================== STATISTIQUES ====================

/**
 * Statistiques globales de retry pour Nutrition
 */
const nutritionRetryStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalAttempts: 0,
  operations: {
    saveDailyMeal: { retries: 0, successes: 0, failures: 0 },
    saveMeal: { retries: 0, successes: 0, failures: 0 },
    getDailyMeal: { retries: 0, successes: 0, failures: 0 },
    saveProgram: { retries: 0, successes: 0, failures: 0 },
    deleteDailyMeal: { retries: 0, successes: 0, failures: 0 },
    deleteMeal: { retries: 0, successes: 0, failures: 0 }
  }
};

/**
 * Obtient les statistiques de retry pour Nutrition
 * 
 * @returns {Object} Statistiques complètes
 */
export const getNutritionRetryStats = () => {
  return {
    ...nutritionRetryStats,
    successRate: nutritionRetryStats.totalRetries > 0
      ? Math.round((nutritionRetryStats.successfulRetries / nutritionRetryStats.totalRetries) * 100) / 100
      : 0,
    operations: { ...nutritionRetryStats.operations }
  };
};

/**
 * Réinitialise les statistiques de retry pour Nutrition
 */
export const resetNutritionRetryStats = () => {
  nutritionRetryStats.totalRetries = 0;
  nutritionRetryStats.successfulRetries = 0;
  nutritionRetryStats.failedRetries = 0;
  nutritionRetryStats.totalAttempts = 0;
  Object.keys(nutritionRetryStats.operations).forEach(op => {
    nutritionRetryStats.operations[op] = { retries: 0, successes: 0, failures: 0 };
  });
};

// ==================== CONFIGURATION RETRY PAR OPÉRATION ====================

/**
 * Configuration retry par type d'opération Nutrition
 * 
 * - WRITE (save*) : Plus de retries (3) car critiques
 * - READ (get*) : Moins de retries (2) car moins critiques
 * - DELETE : Retries modérés (2)
 */
// ✅ PHASE 12.3 : Utiliser configuration centralisée
const RETRY_CONFIG_BY_OPERATION = {
  // Opérations WRITE (critiques)
  saveDailyMeal: {
    maxRetries: NutritionConfig.retry.writeMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  saveMeal: {
    maxRetries: NutritionConfig.retry.writeMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  saveProgram: {
    maxRetries: NutritionConfig.retry.writeMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  saveFavoriteFood: {
    maxRetries: NutritionConfig.retry.writeMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  saveHydrationLog: {
    maxRetries: NutritionConfig.retry.writeMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  
  // Opérations READ (moins critiques)
  getDailyMeal: {
    maxRetries: NutritionConfig.retry.readMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  getMealsByDate: {
    maxRetries: NutritionConfig.retry.readMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  getActiveProgram: {
    maxRetries: NutritionConfig.retry.readMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  
  // Opérations DELETE (modérées)
  deleteDailyMeal: {
    maxRetries: NutritionConfig.retry.deleteMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  deleteMeal: {
    maxRetries: NutritionConfig.retry.deleteMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  },
  
  // Configuration par défaut
  default: {
    maxRetries: NutritionConfig.retry.readMaxRetries,
    initialDelay: NutritionConfig.retry.initialDelay,
    maxDelay: NutritionConfig.retry.maxDelay,
    backoffMultiplier: NutritionConfig.retry.backoffMultiplier
  }
};

/**
 * Obtient la configuration retry pour une opération donnée
 * 
 * @param {string} operationName - Nom de l'opération
 * @returns {Object} Configuration retry
 */
const getRetryConfig = (operationName) => {
  return RETRY_CONFIG_BY_OPERATION[operationName] || RETRY_CONFIG_BY_OPERATION.default;
};

// ==================== WRAPPER RETRY POUR NUTRITION ====================

/**
 * Wrapper retry avec backoff pour opérations IndexedDB Nutrition
 * 
 * ✅ PHASE 10.4 : Retry automatique avec classification intelligente des erreurs
 * 
 * Cette fonction :
 * - Utilise `retryWithBackoff` de Garmin (cohérence codebase)
 * - Classifie automatiquement les erreurs (transitoires vs permanentes)
 * - Met à jour les statistiques Nutrition
 * - Log les erreurs avec contexte Nutrition
 * 
 * @param {Function} fn - Fonction à exécuter avec retry
 * @param {string} operationName - Nom de l'opération (pour config + stats)
 * @param {Object} context - Contexte additionnel pour logging
 * @param {Object} customOptions - Options retry personnalisées (override config par défaut)
 * @returns {Promise<any>} Résultat de la fonction
 * 
 * @example
 * const result = await executeWithRetry(
 *   () => store.put(data),
 *   'saveDailyMeal',
 *   { date: '2025-01-16' }
 * );
 */
export const executeWithRetry = async (fn, operationName, context = {}, customOptions = {}) => {
  const config = getRetryConfig(operationName);
  // ✅ PHASE 12.2 : Extraire quiet du customOptions
  const { quiet = false, ...restCustomOptions } = customOptions;
  const { ...restContext } = context;
  
  const retryOptions = {
    maxRetries: restCustomOptions.maxRetries ?? config.maxRetries,
    initialDelay: restCustomOptions.initialDelay ?? config.initialDelay,
    maxDelay: restCustomOptions.maxDelay ?? config.maxDelay,
    backoffMultiplier: restCustomOptions.backoffMultiplier ?? config.backoffMultiplier,
    context: {
      ...restContext,
      operation: operationName,
      module: 'nutrition'
    },
    quiet, // ✅ PHASE 12.2 : Passer quiet à retryWithBackoff
    shouldRetryFn: (error, attempt, maxRetries) => {
      // ✅ Utiliser classification Garmin (cohérence)
      const classification = classifyIndexedDBError(error);
      
      // Ne jamais retry erreurs permanentes
      if (classification.isPermanent) {
        // ✅ PHASE 12.2 : Ne logger que si pas quiet (Observer ne spam plus)
        if (!quiet) {
          log.debug(`[executeWithRetry] Permanent error (${classification.name}), no retry`, {
            operation: operationName,
            attempt
          });
        }
        return false;
      }
      
      // Retry erreurs transitoires
      if (classification.isTransient) {
        // ✅ PHASE 12.2 : Ne logger que si pas quiet (Observer ne spam plus)
        if (!quiet) {
          log.debug(`[executeWithRetry] Transient error (${classification.name}), retry allowed`, {
            operation: operationName,
            attempt,
            maxRetries
          });
        }
        return true;
      }
      
      // Pour erreurs inconnues, utiliser shouldRetry de Garmin (conservateur)
      return shouldRetry(error, attempt, maxRetries);
    }
  };
  
  // Mettre à jour stats
  nutritionRetryStats.totalAttempts++;
  
  // Mettre à jour stats opération
  if (!nutritionRetryStats.operations[operationName]) {
    nutritionRetryStats.operations[operationName] = { retries: 0, successes: 0, failures: 0 };
  }
  
  try {
    const result = await retryWithBackoff(fn, retryOptions);
    
    // Succès : mettre à jour stats si retry effectué
    // (retryWithBackoff ne fournit pas cette info, on assume succès si pas d'erreur)
    return result;
  } catch (error) {
    // Échec : mettre à jour stats
    nutritionRetryStats.failedRetries++;
    nutritionRetryStats.operations[operationName].failures++;
    
    // Log erreur avec contexte Nutrition
    logIndexedDBError(error, {
      ...context,
      operation: operationName,
      module: 'nutrition'
    }, 'error');
    
    throw error;
  }
};

// ==================== HELPERS SPÉCIFIQUES ====================

/**
 * Helper pour opération IndexedDB get avec retry (Nutrition)
 * 
 * @param {IDBObjectStore} store - Object store IndexedDB
 * @param {string|number} key - Clé à récupérer
 * @param {string} operationName - Nom de l'opération (pour stats)
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<any>} Données récupérées ou null
 */
export const getFromStoreWithRetry = async (store, key, operationName, context = {}) => {
  // ✅ PHASE 12.2 : Extraire quiet du context
  const { quiet = false, ...restContext } = context;
  
  return executeWithRetry(
    () => new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        const error = req.error;
        // Pour get, NotFoundError est acceptable (données peuvent ne pas exister)
        if (error && error.name !== 'NotFoundError') {
          // ✅ PHASE 12.2 : Logger seulement si pas quiet
          if (!quiet) {
            logIndexedDBError(error, { ...restContext, operation: 'get', key }, 'warn');
          }
          reject(error); // Reject pour permettre retry
        } else {
          resolve(null); // NotFoundError = données non trouvées (pas d'erreur)
        }
      };
    }),
    operationName,
    { ...restContext, key, storeName: store.name },
    { quiet } // ✅ Passer quiet dans customOptions
  );
};

/**
 * Helper pour opération IndexedDB put avec retry (Nutrition)
 * 
 * @param {IDBObjectStore} store - Object store IndexedDB
 * @param {Object} data - Données à sauvegarder
 * @param {string} operationName - Nom de l'opération (pour stats)
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<void>} Promise résolue quand sauvegarde terminée
 */
export const putToStoreWithRetry = async (store, data, operationName, context = {}) => {
  return executeWithRetry(
    () => new Promise((resolve, reject) => {
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        const error = req.error;
        logIndexedDBError(error, { ...context, operation: 'put' }, 'error');
        reject(error); // Reject pour permettre retry
      };
    }),
    operationName,
    { ...context, storeName: store.name }
  );
};

/**
 * Helper pour opération IndexedDB delete avec retry (Nutrition)
 * 
 * @param {IDBObjectStore} store - Object store IndexedDB
 * @param {string|number} key - Clé à supprimer
 * @param {string} operationName - Nom de l'opération (pour stats)
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<void>} Promise résolue quand suppression terminée
 */
export const deleteFromStoreWithRetry = async (store, key, operationName, context = {}) => {
  return executeWithRetry(
    () => new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        const error = req.error;
        // Pour delete, NotFoundError est acceptable (données peuvent déjà être supprimées)
        if (error && error.name !== 'NotFoundError') {
          logIndexedDBError(error, { ...context, operation: 'delete', key }, 'error');
          reject(error); // Reject pour permettre retry
        } else {
          resolve(); // NotFoundError = déjà supprimé (pas d'erreur)
        }
      };
    }),
    operationName,
    { ...context, key, storeName: store.name }
  );
};

/**
 * Helper pour opération IndexedDB getAll avec retry (Nutrition)
 * 
 * @param {IDBObjectStore|IDBIndex} storeOrIndex - Object store ou index IndexedDB
 * @param {IDBKeyRange|null} keyRange - Range de clés (optionnel)
 * @param {string} operationName - Nom de l'opération (pour stats)
 * @param {Object} context - Contexte pour logging
 * @returns {Promise<Array>} Données récupérées
 */
export const getAllFromStoreWithRetry = async (storeOrIndex, keyRange, operationName, context = {}) => {
  // ✅ PHASE 12.2 : Extraire quiet du context pour réduire logs Observer
  const { quiet = false, ...restContext } = context;
  
  return executeWithRetry(
    () => new Promise((resolve, reject) => {
      const req = keyRange 
        ? storeOrIndex.getAll(keyRange)
        : storeOrIndex.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => {
        const error = req.error;
        // ✅ PHASE 12.2 : Logger seulement si pas quiet
        if (!quiet) {
          logIndexedDBError(error, { ...restContext, operation: 'getAll' }, 'error');
        }
        reject(error); // Reject pour permettre retry
      };
    }),
    operationName,
    { ...restContext, storeName: storeOrIndex.name || storeOrIndex.objectStore?.name, quiet }
  );
};
