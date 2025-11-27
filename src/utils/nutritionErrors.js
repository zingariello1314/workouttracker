/**
 * nutritionErrors.js
 * 
 * Système standardisé de codes d'erreur pour le module Nutrition.
 * Améliore le debugging, la gestion UI et la traçabilité des erreurs.
 * 
 * ✅ OPTIMISATION : Standardisation erreurs pour debugging rapide et gestion UI cohérente
 * 
 * Architecture :
 * - Codes d'erreur constants (enum-like)
 * - Classe NutritionError avec code, message, details, timestamp
 * - Méthode toJSON() pour logging/export
 * - Compatible avec QuotaExceededError existant
 * 
 * @module utils/nutritionErrors
 * @see ../docs/nutrition/ANALYSE_OPTIMISATIONS_CODE_REEL.md Section 10
 */

// ==================== CODES D'ERREUR ====================

/**
 * Codes d'erreur standardisés pour module Nutrition
 * 
 * Organisation :
 * - DB_* : Erreurs IndexedDB
 * - VALIDATION_* : Erreurs validation données
 * - API_* : Erreurs API externes
 * - ML_* : Erreurs Machine Learning
 */
export const NutritionErrorCodes = {
  // ========== INDEXEDDB ERRORS ==========
  
  /** Base de données non initialisée */
  DB_NOT_INITIALIZED: 'DB_NOT_INITIALIZED',
  
  /** Quota IndexedDB dépassé (géré par QuotaExceededError) */
  DB_QUOTA_EXCEEDED: 'DB_QUOTA_EXCEEDED',
  
  /** Transaction IndexedDB échouée */
  DB_TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',
  
  /** Store IndexedDB non trouvé */
  DB_STORE_NOT_FOUND: 'DB_STORE_NOT_FOUND',
  
  /** Version DB incompatible */
  DB_VERSION_ERROR: 'DB_VERSION_ERROR',
  
  /** Erreur lecture IndexedDB */
  DB_READ_ERROR: 'DB_READ_ERROR',
  
  /** Erreur écriture IndexedDB */
  DB_WRITE_ERROR: 'DB_WRITE_ERROR',
  
  // ========== VALIDATION ERRORS ==========
  
  /** Format date invalide (attendu YYYY-MM-DD) */
  VALIDATION_INVALID_DATE_FORMAT: 'VALIDATION_INVALID_DATE_FORMAT',
  
  /** Type de repas invalide */
  VALIDATION_INVALID_MEAL_TYPE: 'VALIDATION_INVALID_MEAL_TYPE',
  
  /** Champ requis manquant */
  VALIDATION_MISSING_REQUIRED_FIELD: 'VALIDATION_MISSING_REQUIRED_FIELD',
  
  /** Données invalides (format/type incorrect) */
  VALIDATION_INVALID_DATA: 'VALIDATION_INVALID_DATA',
  
  /** ID manquant ou invalide */
  VALIDATION_INVALID_ID: 'VALIDATION_INVALID_ID',
  
  /** Quantité invalide (négative, NaN, etc.) */
  VALIDATION_INVALID_QUANTITY: 'VALIDATION_INVALID_QUANTITY',
  
  // ========== CONCURRENCY ERRORS ==========
  
  /** Modification concurrente détectée (optimistic locking) */
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  
  // ========== CALCULATION ERRORS ==========
  
  /** Erreur lors d'un calcul nutritionnel */
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  
  /** Résultat calcul invalide (NaN, Infinity, etc.) */
  CALCULATION_INVALID_RESULT: 'CALCULATION_INVALID_RESULT',
  
  /** Division par zéro dans calcul */
  CALCULATION_DIVISION_BY_ZERO: 'CALCULATION_DIVISION_BY_ZERO',
  
  // ========== API ERRORS ==========
  
  /** Rate limit API dépassé */
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  
  /** Erreur réseau (fetch failed) */
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  
  /** Réponse API invalide (format incorrect) */
  API_INVALID_RESPONSE: 'API_INVALID_RESPONSE',
  
  /** API non disponible (timeout, 503, etc.) */
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  
  /** Clé API invalide ou expirée */
  API_INVALID_KEY: 'API_INVALID_KEY',
  
  // ========== ML ERRORS ==========
  
  /** Modèle ML non chargé */
  ML_MODEL_NOT_LOADED: 'ML_MODEL_NOT_LOADED',
  
  /** Erreur chargement modèle ML */
  ML_MODEL_LOAD_ERROR: 'ML_MODEL_LOAD_ERROR',
  
  /** Erreur prédiction ML */
  ML_PREDICTION_ERROR: 'ML_PREDICTION_ERROR',
  
  /** Données insuffisantes pour prédiction */
  ML_INSUFFICIENT_DATA: 'ML_INSUFFICIENT_DATA',
  
  // ========== GENERAL ERRORS ==========
  
  /** Opération non implémentée */
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  
  /** Opération non autorisée */
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  /** Ressource non trouvée */
  NOT_FOUND: 'NOT_FOUND',
  
  /** Erreur inconnue */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// ==================== CLASSE ERREUR CUSTOM ====================

/**
 * Classe erreur custom pour module Nutrition
 * 
 * @example
 * throw new NutritionError(
 *   NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT,
 *   'Format date invalide: doit être YYYY-MM-DD',
 *   { received: '2025/01/16', expected: 'YYYY-MM-DD' }
 * );
 * 
 * @example
 * try {
 *   // opération
 * } catch (error) {
 *   if (error instanceof NutritionError) {
 *     console.log('Code erreur:', error.code);
 *     console.log('Détails:', error.details);
 *   }
 * }
 */
export class NutritionError extends Error {
  /**
   * @param {string} code - Code d'erreur (NutritionErrorCodes)
   * @param {string} message - Message d'erreur lisible
   * @param {Object} details - Détails supplémentaires (optionnel)
   * @param {Error} cause - Erreur originale si wrapping (optionnel)
   */
  constructor(code, message, details = {}, cause = null) {
    super(message);
    
    // ✅ Propriétés standard Error
    this.name = 'NutritionError';
    this.message = message;
    
    // ✅ Propriétés custom
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    this.cause = cause; // Erreur originale si wrapping
    
    // ✅ Maintenir stack trace si cause fournie
    if (cause && cause.stack) {
      this.stack = cause.stack;
    } else {
      Error.captureStackTrace?.(this, NutritionError);
    }
  }

  /**
   * Convertit l'erreur en objet JSON (pour logging/export)
   * 
   * @returns {Object} Objet JSON sérialisable
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      ...(this.cause && { 
        cause: this.cause instanceof Error 
          ? { name: this.cause.name, message: this.cause.message }
          : this.cause
      })
    };
  }

  /**
   * Retourne un message d'erreur formaté pour affichage utilisateur
   * 
   * @returns {string} Message formaté
   */
  getUserMessage() {
    // Messages utilisateur spécifiques selon code
    const userMessages = {
      [NutritionErrorCodes.DB_QUOTA_EXCEEDED]: 
        'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
      
      [NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT]: 
        'Format de date invalide. Utilisez le format YYYY-MM-DD.',
      
      [NutritionErrorCodes.VALIDATION_INVALID_MEAL_TYPE]: 
        'Type de repas invalide. Types autorisés: breakfast, lunch, dinner, snack.',
      
      [NutritionErrorCodes.VALIDATION_MISSING_REQUIRED_FIELD]: 
        `Champ requis manquant: ${this.details.field || 'inconnu'}`,
      
      [NutritionErrorCodes.API_RATE_LIMIT_EXCEEDED]: 
        'Limite de requêtes API atteinte. Réessayez dans quelques instants.',
      
      [NutritionErrorCodes.API_NETWORK_ERROR]: 
        'Erreur de connexion. Vérifiez votre connexion internet.',
      
      [NutritionErrorCodes.ML_MODEL_NOT_LOADED]: 
        'Modèle de prédiction non disponible. Veuillez réessayer.',
      
      [NutritionErrorCodes.ML_INSUFFICIENT_DATA]: 
        'Données insuffisantes pour effectuer une prédiction.',
      
      [NutritionErrorCodes.CONCURRENT_MODIFICATION]: 
        'Les données ont été modifiées. Rechargez la page pour voir les dernières modifications.'
    };

    return userMessages[this.code] || this.message;
  }

  /**
   * Vérifie si l'erreur est récupérable (retry possible)
   * 
   * @returns {boolean} true si erreur récupérable
   */
  isRecoverable() {
    const recoverableCodes = [
      NutritionErrorCodes.API_NETWORK_ERROR,
      NutritionErrorCodes.API_UNAVAILABLE,
      NutritionErrorCodes.DB_TRANSACTION_FAILED,
      NutritionErrorCodes.ML_MODEL_LOAD_ERROR
      // Note: CONCURRENT_MODIFICATION n'est pas récupérable (nécessite rechargement)
    ];

    return recoverableCodes.includes(this.code);
  }
}

// ==================== HELPERS ====================

/**
 * Crée une NutritionError à partir d'une erreur IndexedDB
 * 
 * @param {DOMException|Error} error - Erreur IndexedDB originale
 * @param {string} operation - Nom de l'opération (ex: 'saveMeal')
 * @param {Object} context - Contexte additionnel (optionnel)
 * @returns {NutritionError} Erreur standardisée
 */
export function createNutritionErrorFromIndexedDB(error, operation, context = {}) {
  // Classification basique selon nom d'erreur
  let code = NutritionErrorCodes.DB_TRANSACTION_FAILED;
  let message = `Erreur IndexedDB lors de ${operation}`;

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'QuotaExceededError':
        code = NutritionErrorCodes.DB_QUOTA_EXCEEDED;
        message = 'Stockage saturé. Veuillez exporter vos données.';
        break;
      
      case 'VersionError':
        code = NutritionErrorCodes.DB_VERSION_ERROR;
        message = 'Version de base de données incompatible.';
        break;
      
      case 'NotFoundError':
        code = NutritionErrorCodes.DB_STORE_NOT_FOUND;
        message = 'Store IndexedDB non trouvé.';
        break;
      
      case 'TransactionInactiveError':
        code = NutritionErrorCodes.DB_TRANSACTION_FAILED;
        message = 'Transaction IndexedDB expirée.';
        break;
      
      default:
        code = NutritionErrorCodes.DB_TRANSACTION_FAILED;
        message = `Erreur IndexedDB: ${error.name}`;
    }
  }

  return new NutritionError(
    code,
    message,
    { 
      operation,
      originalError: error.name,
      ...context
    },
    error
  );
}

/**
 * Crée une NutritionError de validation
 * 
 * @param {string} code - Code d'erreur validation
 * @param {string} field - Nom du champ en erreur
 * @param {*} received - Valeur reçue
 * @param {*} expected - Valeur attendue (optionnel)
 * @returns {NutritionError} Erreur de validation
 */
export function createValidationError(code, field, received, expected = null) {
  const messages = {
    [NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT]: 
      `Format de date invalide pour '${field}'. Reçu: '${received}', attendu: YYYY-MM-DD`,
    
    [NutritionErrorCodes.VALIDATION_INVALID_MEAL_TYPE]: 
      `Type de repas invalide pour '${field}'. Reçu: '${received}'`,
    
    [NutritionErrorCodes.VALIDATION_MISSING_REQUIRED_FIELD]: 
      `Champ requis manquant: '${field}'`,
    
    [NutritionErrorCodes.VALIDATION_INVALID_DATA]: 
      `Données invalides pour '${field}'. Reçu: ${JSON.stringify(received)}`,
    
    [NutritionErrorCodes.VALIDATION_INVALID_ID]: 
      `ID invalide pour '${field}'. Reçu: '${received}'`,
    
      [NutritionErrorCodes.VALIDATION_INVALID_QUANTITY]: 
        `Quantité invalide pour '${field}'. Reçu: '${received}'`
    };

    return new NutritionError(
      code,
      messages[code] || `Erreur de validation pour '${field}'`,
      { field, received, ...(expected !== null && { expected }) }
    );
  }

  /**
   * Crée une NutritionError de modification concurrente
   * 
   * ✅ OPTIMISATION Phase 15.3 : Erreur optimistic locking
   * 
   * @param {string} resourceType - Type de ressource ('dailyMeal', 'meal', 'program')
   * @param {string} resourceId - ID de la ressource
   * @param {number} currentVersion - Version actuelle en DB
   * @param {number} providedVersion - Version fournie par le client
   * @returns {NutritionError} Erreur de modification concurrente
   */
  export function createConcurrentModificationError(resourceType, resourceId, currentVersion, providedVersion) {
    return new NutritionError(
      NutritionErrorCodes.CONCURRENT_MODIFICATION,
      `Données modifiées par un autre processus. Rechargez la page pour voir les dernières modifications.`,
      {
        resourceType,
        resourceId,
        currentVersion,
        providedVersion,
        suggestion: 'Rechargez la page et réessayez votre modification.'
      }
    );
  }

// ==================== EXPORTS ====================

export default NutritionError;

