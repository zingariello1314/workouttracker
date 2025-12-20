/**
 * financeErrors.js
 * 
 * Système standardisé de codes d'erreur pour le module Finance.
 * Améliore le debugging, la gestion UI et la traçabilité des erreurs.
 * 
 * ✅ PHASE 4 - Étape 4.7 : Système erreur standardisé
 * 
 * Architecture :
 * - Codes d'erreur constants (enum-like)
 * - Classe FinanceError avec code, message, details, timestamp
 * - Méthode toJSON() pour logging/export
 * - Compatible avec gestion erreurs existante
 * - ErrorBoundary React pour capturer erreurs composants
 * 
 * @module utils/financeErrors
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 27
 */

// ==================== CODES D'ERREUR ====================

/**
 * Codes d'erreur standardisés pour module Finance
 * 
 * Organisation :
 * - DB_* : Erreurs IndexedDB
 * - VALIDATION_* : Erreurs validation données
 * - API_* : Erreurs API externes (Yahoo Finance, Alpha Vantage, etc.)
 * - CALCULATION_* : Erreurs calculs financiers
 * - PORTFOLIO_* : Erreurs gestion portfolio
 * - ALERT_* : Erreurs système alertes
 */
export const FinanceErrorCodes = {
  // ========== INDEXEDDB ERRORS ==========
  
  /** Base de données non initialisée */
  DB_NOT_INITIALIZED: 'DB_NOT_INITIALIZED',
  
  /** Quota IndexedDB dépassé */
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
  
  /** Ticker invalide ou non trouvé */
  VALIDATION_INVALID_TICKER: 'VALIDATION_INVALID_TICKER',
  
  /** Champ requis manquant */
  VALIDATION_MISSING_REQUIRED_FIELD: 'VALIDATION_MISSING_REQUIRED_FIELD',
  
  /** Données invalides (format/type incorrect) */
  VALIDATION_INVALID_DATA: 'VALIDATION_INVALID_DATA',
  
  /** ID position manquant ou invalide */
  VALIDATION_INVALID_POSITION_ID: 'VALIDATION_INVALID_POSITION_ID',
  
  /** Quantité invalide (négative, NaN, etc.) */
  VALIDATION_INVALID_QUANTITY: 'VALIDATION_INVALID_QUANTITY',
  
  /** Prix invalide (négatif, NaN, etc.) */
  VALIDATION_INVALID_PRICE: 'VALIDATION_INVALID_PRICE',
  
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
  
  /** Circuit breaker ouvert (trop d'erreurs) */
  API_CIRCUIT_BREAKER_OPEN: 'API_CIRCUIT_BREAKER_OPEN',
  
  /** Timeout requête API */
  API_TIMEOUT: 'API_TIMEOUT',
  
  // ========== CALCULATION ERRORS ==========
  
  /** Erreur lors d'un calcul financier */
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  
  /** Résultat calcul invalide (NaN, Infinity, etc.) */
  CALCULATION_INVALID_RESULT: 'CALCULATION_INVALID_RESULT',
  
  /** Division par zéro dans calcul */
  CALCULATION_DIVISION_BY_ZERO: 'CALCULATION_DIVISION_BY_ZERO',
  
  /** Données historiques insuffisantes pour calcul */
  CALCULATION_INSUFFICIENT_DATA: 'CALCULATION_INSUFFICIENT_DATA',
  
  // ========== PORTFOLIO ERRORS ==========
  
  /** Position non trouvée dans portfolio */
  PORTFOLIO_POSITION_NOT_FOUND: 'PORTFOLIO_POSITION_NOT_FOUND',
  
  /** Position déjà existante (doublon) */
  PORTFOLIO_DUPLICATE_POSITION: 'PORTFOLIO_DUPLICATE_POSITION',
  
  /** Portfolio vide ou invalide */
  PORTFOLIO_INVALID: 'PORTFOLIO_INVALID',
  
  /** Erreur sauvegarde portfolio */
  PORTFOLIO_SAVE_ERROR: 'PORTFOLIO_SAVE_ERROR',
  
  /** Erreur chargement portfolio */
  PORTFOLIO_LOAD_ERROR: 'PORTFOLIO_LOAD_ERROR',
  
  // ========== ALERT ERRORS ==========
  
  /** Erreur vérification alertes */
  ALERT_CHECK_ERROR: 'ALERT_CHECK_ERROR',
  
  /** Erreur création alerte */
  ALERT_CREATE_ERROR: 'ALERT_CREATE_ERROR',
  
  /** Erreur suppression alerte */
  ALERT_DELETE_ERROR: 'ALERT_DELETE_ERROR',
  
  // ========== RECOMMENDATION ERRORS ==========
  
  /** Erreur génération recommandation */
  RECOMMENDATION_GENERATION_ERROR: 'RECOMMENDATION_GENERATION_ERROR',
  
  /** Données insuffisantes pour recommandation */
  RECOMMENDATION_INSUFFICIENT_DATA: 'RECOMMENDATION_INSUFFICIENT_DATA',
  
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
 * Classe erreur custom pour module Finance
 * 
 * ✅ PHASE 4 - Étape 4.7 : Classe erreur standardisée
 * 
 * @example
 * throw new FinanceError(
 *   FinanceErrorCodes.VALIDATION_INVALID_TICKER,
 *   'Ticker invalide: doit être un symbole valide',
 *   { received: 'INVALID', ticker: 'INVALID' }
 * );
 * 
 * @example
 * try {
 *   // opération
 * } catch (error) {
 *   if (error instanceof FinanceError) {
 *     console.error('Code:', error.code);
 *     console.error('Details:', error.details);
 *   }
 * }
 */
export class FinanceError extends Error {
  /**
   * @param {string} code - Code d'erreur (FinanceErrorCodes)
   * @param {string} message - Message d'erreur lisible
   * @param {Object} [details={}] - Détails supplémentaires (ticker, positionId, etc.)
   * @param {Error} [originalError=null] - Erreur originale si wrapping
   */
  constructor(code, message, details = {}, originalError = null) {
    super(message);
    
    this.name = 'FinanceError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Maintenir stack trace pour debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FinanceError);
    }
    
    // Si erreur originale, préserver son stack trace
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\n--- Original Error ---\n${originalError.stack}`;
    }
  }
  
  /**
   * Convertir en JSON pour logging/export
   * 
   * @returns {Object} Représentation JSON de l'erreur
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
  
  /**
   * Vérifier si erreur est récupérable
   * 
   * @returns {boolean} True si erreur peut être récupérée (retry possible)
   */
  isRecoverable() {
    const recoverableCodes = [
      FinanceErrorCodes.API_RATE_LIMIT_EXCEEDED,
      FinanceErrorCodes.API_NETWORK_ERROR,
      FinanceErrorCodes.API_TIMEOUT,
      FinanceErrorCodes.API_UNAVAILABLE,
      FinanceErrorCodes.DB_TRANSACTION_FAILED,
      FinanceErrorCodes.DB_READ_ERROR,
      FinanceErrorCodes.DB_WRITE_ERROR,
      FinanceErrorCodes.CALCULATION_INSUFFICIENT_DATA,
      FinanceErrorCodes.RECOMMENDATION_INSUFFICIENT_DATA
    ];
    
    return recoverableCodes.includes(this.code);
  }
  
  /**
   * Vérifier si erreur est critique (nécessite action immédiate)
   * 
   * @returns {boolean} True si erreur est critique
   */
  isCritical() {
    const criticalCodes = [
      FinanceErrorCodes.DB_NOT_INITIALIZED,
      FinanceErrorCodes.DB_QUOTA_EXCEEDED,
      FinanceErrorCodes.API_INVALID_KEY,
      FinanceErrorCodes.VALIDATION_INVALID_TICKER,
      FinanceErrorCodes.PORTFOLIO_LOAD_ERROR,
      FinanceErrorCodes.PORTFOLIO_SAVE_ERROR
    ];
    
    return criticalCodes.includes(this.code);
  }
  
  /**
   * Obtenir message utilisateur friendly
   * 
   * @returns {string} Message à afficher à l'utilisateur
   */
  getUserMessage() {
    // Messages par défaut selon code
    const defaultMessages = {
      [FinanceErrorCodes.API_RATE_LIMIT_EXCEEDED]: 'Limite API atteinte. Réessayez dans quelques instants.',
      [FinanceErrorCodes.API_NETWORK_ERROR]: 'Erreur réseau. Vérifiez votre connexion.',
      [FinanceErrorCodes.API_TIMEOUT]: 'Timeout. Réessayez.',
      [FinanceErrorCodes.API_INVALID_KEY]: 'Clé API invalide. Vérifiez la configuration.',
      [FinanceErrorCodes.VALIDATION_INVALID_TICKER]: `Ticker invalide: ${this.details.ticker || 'inconnu'}`,
      [FinanceErrorCodes.DB_QUOTA_EXCEEDED]: 'Espace de stockage insuffisant. Libérez de l\'espace.',
      [FinanceErrorCodes.PORTFOLIO_LOAD_ERROR]: 'Erreur lors du chargement du portfolio.',
      [FinanceErrorCodes.PORTFOLIO_SAVE_ERROR]: 'Erreur lors de la sauvegarde du portfolio.',
      [FinanceErrorCodes.CALCULATION_INSUFFICIENT_DATA]: 'Données insuffisantes pour ce calcul.',
      [FinanceErrorCodes.UNKNOWN_ERROR]: 'Une erreur inattendue s\'est produite.'
    };
    
    return defaultMessages[this.code] || this.message || 'Une erreur s\'est produite.';
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Créer erreur validation ticker
 * 
 * @param {string} ticker - Ticker invalide
 * @param {string} [reason] - Raison de l'invalidité
 * @returns {FinanceError} Erreur validation ticker
 */
export function createInvalidTickerError(ticker, reason = null) {
  return new FinanceError(
    FinanceErrorCodes.VALIDATION_INVALID_TICKER,
    reason || `Ticker invalide: ${ticker}`,
    { ticker, reason }
  );
}

/**
 * Créer erreur API rate limit
 * 
 * @param {string} [ticker] - Ticker concerné
 * @param {number} [retryAfter] - Secondes avant retry possible
 * @returns {FinanceError} Erreur rate limit
 */
export function createRateLimitError(ticker = null, retryAfter = null) {
  return new FinanceError(
    FinanceErrorCodes.API_RATE_LIMIT_EXCEEDED,
    `Limite API atteinte${ticker ? ` pour ${ticker}` : ''}.${retryAfter ? ` Réessayez dans ${retryAfter}s.` : ''}`,
    { ticker, retryAfter }
  );
}

/**
 * Créer erreur réseau
 * 
 * @param {string} [ticker] - Ticker concerné
 * @param {Error} [originalError] - Erreur réseau originale
 * @returns {FinanceError} Erreur réseau
 */
export function createNetworkError(ticker = null, originalError = null) {
  return new FinanceError(
    FinanceErrorCodes.API_NETWORK_ERROR,
    `Erreur réseau${ticker ? ` pour ${ticker}` : ''}. Vérifiez votre connexion.`,
    { ticker },
    originalError
  );
}

/**
 * Créer erreur calcul insuffisant données
 * 
 * @param {string} calculationType - Type de calcul (ex: 'RSI', 'MACD')
 * @param {number} required - Nombre de points requis
 * @param {number} available - Nombre de points disponibles
 * @returns {FinanceError} Erreur données insuffisantes
 */
export function createInsufficientDataError(calculationType, required, available) {
  return new FinanceError(
    FinanceErrorCodes.CALCULATION_INSUFFICIENT_DATA,
    `Données insuffisantes pour calcul ${calculationType}: ${available}/${required} points requis`,
    { calculationType, required, available }
  );
}

/**
 * Créer erreur position non trouvée
 * 
 * @param {string} positionId - ID position non trouvée
 * @returns {FinanceError} Erreur position non trouvée
 */
export function createPositionNotFoundError(positionId) {
  return new FinanceError(
    FinanceErrorCodes.PORTFOLIO_POSITION_NOT_FOUND,
    `Position non trouvée: ${positionId}`,
    { positionId }
  );
}

/**
 * Wrapper erreur générique en FinanceError
 * 
 * @param {Error|unknown} error - Erreur à wrapper
 * @param {string} [context] - Contexte de l'erreur
 * @returns {FinanceError} FinanceError wrapper
 */
export function wrapError(error, context = null) {
  // Si déjà FinanceError, retourner tel quel
  if (error instanceof FinanceError) {
    return error;
  }
  
  // Détecter type d'erreur depuis message
  const errorMessage = error?.message || String(error);
  let code = FinanceErrorCodes.UNKNOWN_ERROR;
  let message = errorMessage;
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('API rate limit')) {
    code = FinanceErrorCodes.API_RATE_LIMIT_EXCEEDED;
    message = 'Limite API atteinte. Réessayez dans quelques instants.';
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Network')) {
    code = FinanceErrorCodes.API_NETWORK_ERROR;
    message = 'Erreur réseau. Vérifiez votre connexion.';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    code = FinanceErrorCodes.API_TIMEOUT;
    message = 'Timeout. Réessayez.';
  } else if (errorMessage.includes('API key') || errorMessage.includes('Invalid API')) {
    code = FinanceErrorCodes.API_INVALID_KEY;
    message = 'Clé API invalide. Vérifiez la configuration.';
  } else if (errorMessage.includes('Invalid ticker') || errorMessage.includes('symbol')) {
    code = FinanceErrorCodes.VALIDATION_INVALID_TICKER;
    message = `Ticker invalide: ${errorMessage}`;
  } else if (errorMessage.includes('Invalid response') || errorMessage.includes('Invalid data')) {
    code = FinanceErrorCodes.API_INVALID_RESPONSE;
    message = 'Réponse API invalide. Réessayez.';
  }
  
  return new FinanceError(
    code,
    message,
    { context, originalMessage: errorMessage },
    error instanceof Error ? error : null
  );
}

// ==================== EXPORTS ====================

// Note: FinanceErrorBoundary est exporté depuis son fichier
// pour éviter dépendance circulaire
// Import: import FinanceErrorBoundary from '../components/finance/FinanceErrorBoundary';
