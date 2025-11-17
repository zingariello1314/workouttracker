/**
 * ✅ PHASE 1.5 : Module de retry avec backoff exponentiel pour IndexedDB
 * 
 * Ce module fournit des utilitaires pour :
 * - Retry automatique avec backoff exponentiel
 * - Calcul de délais de retry
 * - Statistiques de retry
 * 
 * Objectifs :
 * - Améliorer la résilience face aux erreurs transitoires
 * - Éviter la surcharge avec retries trop rapides
 * - Fournir des métriques pour monitoring
 * 
 * @module garminRetryUtils
 */

import { shouldRetry, logIndexedDBError } from './garminErrorHandler';
import logger from '../utils/logger';

const log = logger.module('garminRetryUtils');

// ==================== STATISTIQUES ====================

/**
 * Statistiques globales de retry
 */
const retryStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  totalAttempts: 0
};

/**
 * Obtient les statistiques de retry
 * 
 * @returns {Object} Statistiques
 */
export const getRetryStats = () => {
  return {
    ...retryStats,
    successRate: retryStats.totalRetries > 0
      ? Math.round((retryStats.successfulRetries / retryStats.totalRetries) * 100) / 100
      : 0
  };
};

/**
 * Réinitialise les statistiques de retry
 */
export const resetRetryStats = () => {
  retryStats.totalRetries = 0;
  retryStats.successfulRetries = 0;
  retryStats.failedRetries = 0;
  retryStats.totalAttempts = 0;
};

// ==================== CALCUL BACKOFF ====================

/**
 * Calcule le délai de backoff pour une tentative donnée
 * 
 * Utilise backoff exponentiel avec jitter pour éviter thundering herd
 * 
 * @param {number} attempt - Numéro de tentative (1 = première tentative)
 * @param {Object} options - Options de backoff
 * @param {number} options.initialDelay - Délai initial en ms (défaut: 100)
 * @param {number} options.maxDelay - Délai max en ms (défaut: 2000)
 * @param {number} options.backoffMultiplier - Multiplicateur backoff (défaut: 2)
 * @returns {number} Délai en millisecondes
 * 
 * @example
 * const delay = calculateBackoffDelay(2, { initialDelay: 100, backoffMultiplier: 2 });
 * // Retourne 200ms (100 * 2^1)
 */
export const calculateBackoffDelay = (attempt, options = {}) => {
  const {
    initialDelay = 100,
    maxDelay = 2000,
    backoffMultiplier = 2
  } = options;
  
  // Calculer délai exponentiel : initialDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  
  // Limiter au délai max
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Ajouter jitter aléatoire (±10%) pour éviter thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1); // -10% à +10%
  const finalDelay = Math.max(0, cappedDelay + jitter);
  
  return Math.round(finalDelay);
};

// ==================== RETRY AVEC BACKOFF ====================

/**
 * Retry une fonction avec backoff exponentiel
 * 
 * Cette fonction :
 * 1. Exécute la fonction
 * 2. Si erreur transitoire, attend backoff et retry
 * 3. Continue jusqu'à succès ou maxRetries atteint
 * 4. Ne retry jamais erreurs permanentes
 * 
 * @param {Function} fn - Fonction à exécuter (doit retourner Promise)
 * @param {Object} options - Options de retry
 * @param {number} options.maxRetries - Nombre max de tentatives (défaut: 3)
 * @param {number} options.initialDelay - Délai initial en ms (défaut: 100)
 * @param {number} options.maxDelay - Délai max en ms (défaut: 2000)
 * @param {number} options.backoffMultiplier - Multiplicateur backoff (défaut: 2)
 * @param {Function} options.shouldRetry - Fonction personnalisée pour déterminer retry (défaut: utilise shouldRetry)
 * @param {Object} options.context - Contexte pour logging (opération, store, etc.)
 * @returns {Promise<any>} Résultat de la fonction ou dernière erreur
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => saveToIndexedDB(data),
 *   { maxRetries: 3, context: { operation: 'saveActivities' } }
 * );
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    backoffMultiplier = 2,
    shouldRetryFn = shouldRetry,
    context = {},
    quiet = false // ✅ PHASE 12.2 : Option quiet pour réduire logs Observer
  } = options;
  
  if (typeof fn !== 'function') {
    throw new Error('retryWithBackoff: fn must be a function');
  }
  
  let lastError = null;
  let attempt = 1;
  
  while (attempt <= maxRetries + 1) { // +1 pour la tentative initiale
    try {
      retryStats.totalAttempts++;
      
      // ✅ PHASE 12.2 : Ne logger que les retries réels (attempt > 1) pour éviter spam
      // La première tentative (attempt === 1) réussit généralement, pas besoin de logger
      if (attempt > 1) {
        log.debug(`[retryWithBackoff] Attempt ${attempt}/${maxRetries + 1}`, context);
      }
      
      const result = await fn();
      
      // Succès : si c'était un retry, incrémenter statistiques
      if (attempt > 1) {
        retryStats.successfulRetries++;
        // ✅ PHASE 12.2 : Logger seulement si retry réel (évite spam)
        log.info(`[retryWithBackoff] Success after ${attempt - 1} retry(ies)`, context);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Vérifier si on doit retry
      const shouldRetryThis = shouldRetryFn(error, attempt, maxRetries);
      
      if (!shouldRetryThis || attempt > maxRetries) {
        // Pas de retry ou max atteint : log et throw
        if (attempt > 1) {
          retryStats.failedRetries++;
          log.error(`[retryWithBackoff] Failed after ${attempt - 1} retry(ies)`, {
            ...context,
            error: error.message || error.toString()
          });
        } else {
          // Première tentative : log erreur normale
          logIndexedDBError(error, context, 'error');
        }
        
        throw error;
      }
      
      // Retry nécessaire : calculer délai et attendre
      retryStats.totalRetries++;
      
      const delay = calculateBackoffDelay(attempt, {
        initialDelay,
        maxDelay,
        backoffMultiplier
      });
      
      // ✅ PHASE 12.2 : Ne logger que si pas quiet (Observer ne spam plus)
      if (!quiet) {
        log.warn(`[retryWithBackoff] Transient error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
          ...context,
          error: error.message || error.toString(),
          delay
        });
      }
      
      // Attendre avant retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
  
  // Ne devrait jamais arriver ici, mais au cas où
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('retryWithBackoff: Unexpected end of retry loop');
};

// ==================== UTILITAIRES ====================

/**
 * Wrapper pour retry avec contexte automatique
 * 
 * Crée automatiquement un contexte basé sur le nom de la fonction
 * 
 * @param {Function} fn - Fonction à exécuter
 * @param {string} operationName - Nom de l'opération (pour logging)
 * @param {Object} additionalContext - Contexte additionnel
 * @param {Object} retryOptions - Options de retry
 * @returns {Promise<any>} Résultat de la fonction
 */
export const retryWithContext = async (fn, operationName, additionalContext = {}, retryOptions = {}) => {
  const context = {
    operation: operationName,
    ...additionalContext
  };
  
  return retryWithBackoff(fn, {
    ...retryOptions,
    context
  });
};

/**
 * Retry simple sans backoff (pour tests ou cas spéciaux)
 * 
 * @param {Function} fn - Fonction à exécuter
 * @param {number} maxRetries - Nombre max de tentatives
 * @returns {Promise<any>} Résultat de la fonction
 */
export const retrySimple = async (fn, maxRetries = 3) => {
  return retryWithBackoff(fn, {
    maxRetries,
    initialDelay: 0, // Pas de délai
    maxDelay: 0,
    backoffMultiplier: 1
  });
};
