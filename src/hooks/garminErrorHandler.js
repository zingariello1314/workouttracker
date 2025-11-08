/**
 * ✅ PHASE 1.5 : Module de gestion et classification des erreurs IndexedDB
 * 
 * Ce module fournit des utilitaires pour :
 * - Classifier les erreurs IndexedDB (transitoires vs permanentes)
 * - Extraire des détails d'erreur pour logging
 * - Déterminer si une erreur doit être retry
 * 
 * Objectifs :
 * - Améliorer la résilience du système face aux erreurs transitoires
 * - Fournir un logging détaillé pour diagnostic
 * - Éviter les retries inutiles sur erreurs permanentes
 * 
 * @module garminErrorHandler
 */

import logger from '../utils/logger';

const log = logger.module('garminErrorHandler');

// ==================== CONSTANTES ERREURS ====================

/**
 * Types d'erreurs IndexedDB transitoires (peuvent être retry)
 * Ces erreurs peuvent être résolues automatiquement avec un retry
 */
export const TRANSIENT_ERROR_TYPES = [
  'QuotaExceededError',      // Quota dépassé (peut être temporaire si espace libéré)
  'TransactionInactiveError', // Transaction fermée prématurément (peut être temporaire)
  'ConstraintError',         // Contrainte violée (peut être temporaire si conflit)
  'UnknownError'             // Erreur inconnue (peut être temporaire)
];

/**
 * Types d'erreurs IndexedDB permanentes (ne doivent PAS être retry)
 * Ces erreurs indiquent un problème structurel qui ne sera pas résolu par un retry
 */
export const PERMANENT_ERROR_TYPES = [
  'VersionError',        // Version incompatible (nécessite migration)
  'InvalidStateError',   // État invalide (DB fermée, structure incorrecte)
  'NotFoundError',       // Store/Index non trouvé (structure incorrecte)
  'DataError',          // Données invalides (nécessite correction)
  'AbortError',         // Transaction annulée (intentionnel)
  'ReadOnlyError'       // Tentative écriture sur transaction read-only
];

// ==================== CLASSIFICATION ERREURS ====================

/**
 * Extrait le nom de l'erreur depuis un objet d'erreur IndexedDB
 * 
 * @param {DOMException|Error|Object} error - Erreur à analyser
 * @returns {string} Nom de l'erreur (ex: 'QuotaExceededError')
 */
const getErrorName = (error) => {
  if (!error) return 'UnknownError';
  
  // IndexedDB errors sont des DOMException avec propriété 'name'
  if (error.name) return error.name;
  
  // Fallback pour erreurs standard
  if (error.constructor && error.constructor.name) {
    return error.constructor.name;
  }
  
  return 'UnknownError';
};

/**
 * Classifie une erreur IndexedDB comme transitoire ou permanente
 * 
 * @param {DOMException|Error|Object} error - Erreur à classifier
 * @returns {Object} Classification de l'erreur
 * @returns {boolean} returns.isTransient - Si erreur transitoire
 * @returns {boolean} returns.isPermanent - Si erreur permanente
 * @returns {string} returns.type - Type d'erreur ('transient' | 'permanent' | 'unknown')
 * @returns {string} returns.name - Nom de l'erreur
 * 
 * @example
 * const classification = classifyIndexedDBError(error);
 * if (classification.isTransient) {
 *   // Retry possible
 * }
 */
export const classifyIndexedDBError = (error) => {
  if (!error) {
    return {
      isTransient: false,
      isPermanent: false,
      type: 'unknown',
      name: 'UnknownError'
    };
  }
  
  const errorName = getErrorName(error);
  
  const isTransient = TRANSIENT_ERROR_TYPES.includes(errorName);
  const isPermanent = PERMANENT_ERROR_TYPES.includes(errorName);
  
  let type = 'unknown';
  if (isTransient) {
    type = 'transient';
  } else if (isPermanent) {
    type = 'permanent';
  }
  
  return {
    isTransient,
    isPermanent,
    type,
    name: errorName
  };
};

/**
 * Vérifie si une erreur IndexedDB est transitoire (peut être retry)
 * 
 * @param {DOMException|Error|Object} error - Erreur à vérifier
 * @returns {boolean} True si erreur transitoire
 * 
 * @example
 * if (isTransientError(error)) {
 *   // Retry possible
 * }
 */
export const isTransientError = (error) => {
  const classification = classifyIndexedDBError(error);
  return classification.isTransient;
};

/**
 * Vérifie si une erreur IndexedDB est permanente (ne doit pas être retry)
 * 
 * @param {DOMException|Error|Object} error - Erreur à vérifier
 * @returns {boolean} True si erreur permanente
 */
export const isPermanentError = (error) => {
  const classification = classifyIndexedDBError(error);
  return classification.isPermanent;
};

// ==================== DÉTAILS ERREUR ====================

/**
 * Extrait les détails d'une erreur IndexedDB pour logging
 * 
 * @param {DOMException|Error|Object} error - Erreur à analyser
 * @param {Object} context - Contexte additionnel (opération, store, etc.)
 * @returns {Object} Détails de l'erreur
 * @returns {string} returns.name - Nom de l'erreur
 * @returns {string} returns.message - Message d'erreur
 * @returns {string} returns.type - Type ('transient' | 'permanent' | 'unknown')
 * @returns {string} returns.code - Code d'erreur (si disponible)
 * @returns {Object} returns.context - Contexte additionnel
 * @returns {string} returns.stack - Stack trace (si disponible)
 * 
 * @example
 * const details = getErrorDetails(error, { operation: 'saveActivities', store: 'activities' });
 * console.error('Error details:', details);
 */
export const getErrorDetails = (error, context = {}) => {
  if (!error) {
    return {
      name: 'UnknownError',
      message: 'No error provided',
      type: 'unknown',
      code: null,
      context,
      stack: null
    };
  }
  
  const classification = classifyIndexedDBError(error);
  
  return {
    name: classification.name,
    message: error.message || error.toString() || 'Unknown error',
    type: classification.type,
    code: error.code || error.errorCode || null,
    context: {
      ...context,
      timestamp: new Date().toISOString()
    },
    stack: error.stack || null
  };
};

// ==================== DÉCISION RETRY ====================

/**
 * Détermine si une erreur doit être retry selon le nombre de tentatives
 * 
 * @param {DOMException|Error|Object} error - Erreur à analyser
 * @param {number} attempt - Numéro de tentative (1 = première tentative)
 * @param {number} maxRetries - Nombre maximum de retries autorisés
 * @returns {boolean} True si retry doit être effectué
 * 
 * @example
 * if (shouldRetry(error, attempt, 3)) {
 *   // Effectuer retry
 * }
 */
export const shouldRetry = (error, attempt, maxRetries = 3) => {
  if (attempt > maxRetries) {
    log.debug(`[shouldRetry] Max retries (${maxRetries}) reached, no retry`);
    return false;
  }
  
  const classification = classifyIndexedDBError(error);
  
  // Ne jamais retry les erreurs permanentes
  if (classification.isPermanent) {
    log.debug(`[shouldRetry] Permanent error (${classification.name}), no retry`);
    return false;
  }
  
  // Retry les erreurs transitoires
  if (classification.isTransient) {
    log.debug(`[shouldRetry] Transient error (${classification.name}), retry allowed (attempt ${attempt}/${maxRetries})`);
    return true;
  }
  
  // Pour erreurs inconnues, être conservateur (pas de retry par défaut)
  log.debug(`[shouldRetry] Unknown error type (${classification.name}), no retry by default`);
  return false;
};

// ==================== LOGGING ERREUR ====================

/**
 * Log une erreur IndexedDB avec détails complets
 * 
 * @param {DOMException|Error|Object} error - Erreur à logger
 * @param {Object} context - Contexte additionnel
 * @param {string} level - Niveau de log ('error' | 'warn' | 'debug')
 */
export const logIndexedDBError = (error, context = {}, level = 'error') => {
  const details = getErrorDetails(error, context);
  const classification = classifyIndexedDBError(error);
  
  const logMessage = `[IndexedDB Error] ${details.name}: ${details.message}`;
  const logData = {
    ...details,
    classification,
    shouldRetry: shouldRetry(error, 1, 3) // Vérifier si retry possible
  };
  
  switch (level) {
    case 'warn':
      log.warn(logMessage, logData);
      break;
    case 'debug':
      log.debug(logMessage, logData);
      break;
    case 'error':
    default:
      log.error(logMessage, logData);
      break;
  }
};

// ==================== UTILITAIRES ====================

/**
 * Crée un message d'erreur lisible pour l'utilisateur
 * 
 * @param {DOMException|Error|Object} error - Erreur
 * @returns {string} Message lisible
 */
export const getUserFriendlyErrorMessage = (error) => {
  if (!error) {
    return 'Une erreur inconnue est survenue';
  }
  
  const classification = classifyIndexedDBError(error);
  const errorName = classification.name;
  
  const messages = {
    'QuotaExceededError': 'L\'espace de stockage est insuffisant. Veuillez libérer de l\'espace.',
    'TransactionInactiveError': 'La transaction a été interrompue. Veuillez réessayer.',
    'ConstraintError': 'Une contrainte a été violée. Les données peuvent être en conflit.',
    'VersionError': 'La base de données nécessite une mise à jour. Veuillez rafraîchir la page.',
    'InvalidStateError': 'La base de données est dans un état invalide. Veuillez rafraîchir la page.',
    'NotFoundError': 'Une ressource nécessaire est introuvable. Veuillez rafraîchir la page.',
    'DataError': 'Les données sont invalides. Veuillez contacter le support.',
    'UnknownError': 'Une erreur inconnue est survenue. Veuillez réessayer.'
  };
  
  return messages[errorName] || messages['UnknownError'];
};

