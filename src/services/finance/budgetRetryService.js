/**
 * budgetRetryService.js
 * 
 * Service de retry avec exponential backoff pour opérations IndexedDB Budget
 * 
 * ✅ SOLUTION 1.17 : Retry Automatique avec Exponential Backoff
 * 
 * Ce service fournit :
 * - Retry automatique avec exponential backoff pour erreurs transitoires
 * - Détection intelligente des erreurs retryables vs non-retryables
 * - Statistiques de retry pour monitoring
 * - Jitter pour éviter thundering herd
 * - Configuration flexible par type d'opération
 * 
 * @module services/finance/budgetRetryService
 */

import logger from '../../utils/logger';

const log = logger.module('budgetRetryService');

// ==================== CONFIGURATION ====================

/**
 * Configuration par défaut pour retry
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100, // 100ms
  maxDelay: 2000, // 2s max
  backoffMultiplier: 2, // Double le délai à chaque retry
  jitterRatio: 0.1 // ±10% jitter
};

/**
 * Configuration spécifique par type d'opération
 */
const OPERATION_CONFIGS = {
  // Opérations critiques : plus de retries
  save: {
    maxRetries: 4,
    initialDelay: 150,
    maxDelay: 3000
  },
  // Opérations de lecture : moins de retries, délais plus courts
  load: {
    maxRetries: 2,
    initialDelay: 50,
    maxDelay: 1000
  },
  // Opérations de suppression : retries standards
  delete: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 2000
  },
  // Opérations batch : plus de retries
  batch: {
    maxRetries: 5,
    initialDelay: 200,
    maxDelay: 5000
  }
};

// ==================== DÉTECTION ERREURS RETRYABLES ====================

/**
 * Liste des codes d'erreur IndexedDB qui sont généralement transitoires
 */
const RETRYABLE_ERROR_NAMES = [
  'QuotaExceededError', // Peut être temporaire si storage presque plein
  'UnknownError', // Erreur générique, peut être transitoire
  'AbortError' // Transaction annulée, peut être temporaire
];

/**
 * Détecte si une erreur est retryable (transitoire)
 * 
 * @param {Error} error - Erreur à vérifier
 * @returns {boolean} true si l'erreur est retryable
 */
function isRetryableError(error) {
  if (!error) return false;
  
  // Erreurs avec nom spécifique
  if (error.name && RETRYABLE_ERROR_NAMES.includes(error.name)) {
    return true;
  }
  
  // Messages d'erreur indiquant erreur transitoire
  const message = error.message || error.toString();
  const retryableMessages = [
    'quota exceeded',
    'database locked',
    'transaction aborted',
    'timeout',
    'network error',
    'temporary'
  ];
  
  const lowerMessage = message.toLowerCase();
  if (retryableMessages.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // Erreurs DOMException spécifiques (IndexedDB)
  if (error instanceof DOMException) {
    // Certaines erreurs DOMException peuvent être transitoires
    if (error.name === 'UnknownError' || error.name === 'AbortError') {
      return true;
    }
  }
  
  // Par défaut, ne pas retry (erreurs permanentes probablement)
  return false;
}

// ==================== CALCUL BACKOFF ====================

/**
 * Calcule le délai de backoff avec exponential backoff et jitter
 * 
 * @param {number} attempt - Numéro de tentative (0 = première, 1 = premier retry)
 * @param {Object} config - Configuration de retry
 * @returns {number} Délai en millisecondes
 */
function calculateBackoffDelay(attempt, config) {
  const {
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitterRatio
  } = config;
  
  // Calculer délai exponentiel : initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
  
  // Limiter au délai max
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Ajouter jitter aléatoire (±jitterRatio%) pour éviter thundering herd
  // Jitter distribue les retries pour éviter que tous les clients retryent en même temps
  const jitter = cappedDelay * jitterRatio * (Math.random() * 2 - 1); // -jitterRatio% à +jitterRatio%
  const finalDelay = Math.max(0, cappedDelay + jitter);
  
  return Math.round(finalDelay);
}

// ==================== STATISTIQUES ====================

/**
 * Statistiques globales de retry
 */
const retryStats = {
  totalAttempts: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalDelays: 0 // Temps total passé en attente
};

/**
 * Obtient les statistiques de retry
 * 
 * @returns {Object} Statistiques
 */
export function getRetryStats() {
  return {
    ...retryStats,
    successRate: retryStats.successfulRetries > 0
      ? Math.round((retryStats.successfulRetries / (retryStats.successfulRetries + retryStats.failedRetries)) * 100 * 100) / 100
      : 0,
    averageDelay: retryStats.successfulRetries > 0
      ? Math.round(retryStats.totalDelays / retryStats.successfulRetries)
      : 0
  };
}

/**
 * Réinitialise les statistiques de retry
 */
export function resetRetryStats() {
  retryStats.totalAttempts = 0;
  retryStats.successfulRetries = 0;
  retryStats.failedRetries = 0;
  retryStats.totalDelays = 0;
}

// ==================== RETRY PRINCIPAL ====================

/**
 * Retry une fonction avec exponential backoff
 * 
 * Cette fonction :
 * 1. Exécute la fonction
 * 2. Si erreur retryable, attend backoff et retry
 * 3. Continue jusqu'à succès ou maxRetries atteint
 * 4. Ne retry jamais erreurs non-retryables (validation, etc.)
 * 
 * @param {Function} fn - Fonction à exécuter (doit retourner Promise)
 * @param {Object} options - Options de retry
 * @param {string} options.operation - Type d'opération ('save', 'load', 'delete', 'batch')
 * @param {number} options.maxRetries - Nombre max de retries (override config par défaut)
 * @param {number} options.initialDelay - Délai initial en ms (override config par défaut)
 * @param {number} options.maxDelay - Délai max en ms (override config par défaut)
 * @param {string} options.operationName - Nom de l'opération pour logging (ex: 'saveBudget')
 * @param {Object} options.context - Contexte additionnel pour logging
 * @returns {Promise<any>} Résultat de la fonction
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => budgetStorage.saveBudget(budget),
 *   { operation: 'save', operationName: 'saveBudget' }
 * );
 */
export async function retryWithBackoff(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new Error('retryWithBackoff: fn must be a function');
  }
  
  const {
    operation = 'save',
    maxRetries: customMaxRetries,
    initialDelay: customInitialDelay,
    maxDelay: customMaxDelay,
    operationName = 'operation',
    context = {}
  } = options;
  
  // Obtenir configuration pour ce type d'opération
  const operationConfig = OPERATION_CONFIGS[operation] || {};
  const config = {
    ...DEFAULT_RETRY_CONFIG,
    ...operationConfig,
    ...(customMaxRetries !== undefined && { maxRetries: customMaxRetries }),
    ...(customInitialDelay !== undefined && { initialDelay: customInitialDelay }),
    ...(customMaxDelay !== undefined && { maxDelay: customMaxDelay })
  };
  
  let lastError = null;
  let attempt = 0;
  
  while (attempt <= config.maxRetries) {
    try {
      retryStats.totalAttempts++;
      
      const result = await fn();
      
      // Succès : si c'était un retry, mettre à jour statistiques
      if (attempt > 0) {
        retryStats.successfulRetries++;
        log.debug(`[${operationName}] Success after ${attempt} retry(ies)`, {
          ...context,
          attempt: attempt + 1,
          totalAttempts: attempt + 1
        });
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Vérifier si erreur est retryable
      const isRetryable = isRetryableError(error);
      
      // Si erreur non-retryable ou max retries atteint, throw immédiatement
      if (!isRetryable || attempt >= config.maxRetries) {
        if (attempt > 0) {
          retryStats.failedRetries++;
          log.error(`[${operationName}] Failed after ${attempt} retry(ies)`, {
            ...context,
            error: error.message || error.toString(),
            errorName: error.name,
            isRetryable,
            totalAttempts: attempt + 1
          });
        } else {
          // Première tentative : log info seulement
          log.debug(`[${operationName}] Failed on first attempt`, {
            ...context,
            error: error.message || error.toString(),
            errorName: error.name,
            isRetryable
          });
        }
        
        throw error;
      }
      
      // Calculer délai et attendre avant retry
      const delay = calculateBackoffDelay(attempt, config);
      retryStats.totalDelays += delay;
      
      log.warn(`[${operationName}] Transient error, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`, {
        ...context,
        error: error.message || error.toString(),
        errorName: error.name,
        delay,
        attempt: attempt + 1
      });
      
      // Attendre avant retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
  
  // Ne devrait jamais arriver ici, mais au cas où
  if (lastError) {
    throw lastError;
  }
  
  throw new Error(`retryWithBackoff: Unexpected end of retry loop for ${operationName}`);
}

/**
 * Wrapper pour retry avec contexte automatique
 * 
 * @param {Function} fn - Fonction à exécuter
 * @param {string} operation - Type d'opération
 * @param {string} operationName - Nom de l'opération
 * @param {Object} additionalContext - Contexte additionnel
 * @returns {Promise<any>} Résultat de la fonction
 */
export async function retryOperation(fn, operation, operationName, additionalContext = {}) {
  return retryWithBackoff(fn, {
    operation,
    operationName,
    context: additionalContext
  });
}

/**
 * Helper spécifique pour opérations save avec retry
 */
export async function retrySave(fn, operationName, context = {}) {
  return retryOperation(fn, 'save', operationName, context);
}

/**
 * Helper spécifique pour opérations load avec retry
 */
export async function retryLoad(fn, operationName, context = {}) {
  return retryOperation(fn, 'load', operationName, context);
}

/**
 * Helper spécifique pour opérations delete avec retry
 */
export async function retryDelete(fn, operationName, context = {}) {
  return retryOperation(fn, 'delete', operationName, context);
}

