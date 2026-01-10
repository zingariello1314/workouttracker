/**
 * Utilitaire pour la gestion robuste des erreurs IndexedDB
 * 
 * ✅ PHASE 1 : Gestion d'erreurs IndexedDB avec fallback
 * 
 * Features:
 * - Retry automatique avec exponential backoff
 * - Fallback vers localStorage si IndexedDB échoue
 * - Détection de corruption de données
 * - Logging détaillé des erreurs
 * 
 * @module utils/indexedDBErrorHandler
 */

/**
 * Types d'erreurs IndexedDB communes
 */
export const IDB_ERROR_TYPES = {
  QUOTA_EXCEEDED: 'QuotaExceededError',
  CONSTRAINT_ERROR: 'ConstraintError',
  NOT_FOUND: 'NotFoundError',
  INVALID_STATE: 'InvalidStateError',
  ABORT: 'AbortError',
  UNKNOWN: 'UnknownError'
};

/**
 * Détecte le type d'erreur IndexedDB
 * @param {Error} error - Erreur à analyser
 * @returns {string} Type d'erreur
 */
export const detectIDBErrorType = (error) => {
  if (!error) return IDB_ERROR_TYPES.UNKNOWN;
  
  const errorName = error.name || '';
  const errorMessage = error.message || '';
  
  if (errorName.includes('QuotaExceeded') || errorMessage.includes('quota')) {
    return IDB_ERROR_TYPES.QUOTA_EXCEEDED;
  }
  if (errorName.includes('Constraint') || errorMessage.includes('constraint')) {
    return IDB_ERROR_TYPES.CONSTRAINT_ERROR;
  }
  if (errorName.includes('NotFound') || errorMessage.includes('not found')) {
    return IDB_ERROR_TYPES.NOT_FOUND;
  }
  if (errorName.includes('InvalidState') || errorMessage.includes('invalid state')) {
    return IDB_ERROR_TYPES.INVALID_STATE;
  }
  if (errorName.includes('Abort') || errorMessage.includes('abort')) {
    return IDB_ERROR_TYPES.ABORT;
  }
  
  return IDB_ERROR_TYPES.UNKNOWN;
};

/**
 * Vérifie si IndexedDB est disponible
 * @returns {boolean} True si IndexedDB est disponible
 */
export const isIndexedDBAvailable = () => {
  try {
    return typeof window !== 'undefined' && 
           'indexedDB' in window && 
           window.indexedDB !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Vérifie si localStorage est disponible
 * @returns {boolean} True si localStorage est disponible
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Retry avec exponential backoff
 * @param {Function} fn - Fonction à exécuter
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @param {number} initialDelay - Délai initial en ms
 * @returns {Promise} Résultat de la fonction
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 100) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorType = detectIDBErrorType(error);
      
      // Ne pas retry pour certaines erreurs
      if (errorType === IDB_ERROR_TYPES.QUOTA_EXCEEDED || 
          errorType === IDB_ERROR_TYPES.CONSTRAINT_ERROR) {
        throw error;
      }
      
      // Calculer le délai avec exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      
      if (attempt < maxRetries - 1) {
        console.warn(`[IDBErrorHandler] Tentative ${attempt + 1}/${maxRetries} échouée, retry dans ${delay}ms`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Fallback vers localStorage
 * @param {string} storeName - Nom du store
 * @param {Function} idbOperation - Opération IndexedDB à exécuter
 * @param {Function} fallbackOperation - Opération de fallback
 * @returns {Promise} Résultat de l'opération
 */
export const withFallback = async (storeName, idbOperation, fallbackOperation) => {
  try {
    // Essayer IndexedDB d'abord
    if (isIndexedDBAvailable()) {
      return await retryWithBackoff(idbOperation);
    }
  } catch (error) {
    console.warn(`[IDBErrorHandler] IndexedDB échoué pour ${storeName}, fallback localStorage`, error);
    
    // Fallback vers localStorage si disponible
    if (isLocalStorageAvailable() && fallbackOperation) {
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        console.error(`[IDBErrorHandler] Fallback localStorage échoué pour ${storeName}`, fallbackError);
        throw new Error(`IndexedDB et localStorage ont échoué: ${error.message}`);
      }
    }
    
    throw error;
  }
  
  // Si IndexedDB n'est pas disponible, utiliser directement le fallback
  if (isLocalStorageAvailable() && fallbackOperation) {
    return await fallbackOperation();
  }
  
  throw new Error('IndexedDB et localStorage ne sont pas disponibles');
};

/**
 * Détecte si les données sont corrompues
 * @param {any} data - Données à vérifier
 * @param {Function} validator - Fonction de validation
 * @returns {boolean} True si les données sont valides
 */
export const isDataCorrupted = (data, validator) => {
  try {
    if (!data) return true;
    if (validator && typeof validator === 'function') {
      return !validator(data);
    }
    // Validation basique : vérifier que c'est un objet/array valide
    return typeof data !== 'object' || data === null;
  } catch (error) {
    return true;
  }
};

/**
 * Wrapper pour opérations IndexedDB avec gestion d'erreurs complète
 * @param {string} operationName - Nom de l'opération (pour logging)
 * @param {Function} idbOperation - Opération IndexedDB
 * @param {Function} fallbackOperation - Opération de fallback
 * @param {Function} validator - Validateur de données (optionnel)
 * @returns {Promise} Résultat de l'opération
 */
export const safeIDBOperation = async (
  operationName,
  idbOperation,
  fallbackOperation = null,
  validator = null
) => {
  try {
    const result = await withFallback(operationName, idbOperation, fallbackOperation);
    
    // Vérifier la corruption des données si un validateur est fourni
    if (validator && isDataCorrupted(result, validator)) {
      console.warn(`[IDBErrorHandler] Données corrompues détectées pour ${operationName}`);
      throw new Error(`Données corrompues pour ${operationName}`);
    }
    
    return result;
  } catch (error) {
    const errorType = detectIDBErrorType(error);
    
    // Logger l'erreur avec contexte
    console.error(`[IDBErrorHandler] Erreur ${errorType} pour ${operationName}:`, {
      error: error.message,
      stack: error.stack,
      operation: operationName,
      errorType
    });
    
    // Optionnel : envoyer à un service de tracking
    if (window.trackError) {
      window.trackError(error, {
        context: 'IndexedDB',
        operation: operationName,
        errorType
      });
    }
    
    throw error;
  }
};

/**
 * Crée un handler d'erreur personnalisé pour un store spécifique
 * @param {string} storeName - Nom du store
 * @param {Function} validator - Validateur de données
 * @returns {Function} Handler d'erreur
 */
export const createStoreErrorHandler = (storeName, validator = null) => {
  return async (idbOperation, fallbackOperation = null) => {
    return safeIDBOperation(
      storeName,
      idbOperation,
      fallbackOperation,
      validator
    );
  };
};

export default {
  detectIDBErrorType,
  isIndexedDBAvailable,
  isLocalStorageAvailable,
  retryWithBackoff,
  withFallback,
  isDataCorrupted,
  safeIDBOperation,
  createStoreErrorHandler,
  IDB_ERROR_TYPES
};
