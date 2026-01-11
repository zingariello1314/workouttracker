/**
 * Circuit Breaker Amélioré
 * 
 * ✅ PHASE 3 - Étape 3.4 : Circuit breaker amélioré avec half-open optimisé
 * 
 * Fonctionnalités :
 * - États CLOSED, OPEN, HALF_OPEN avec transitions intelligentes
 * - Half-open state optimisé avec test automatique
 * - Gestion différenciée des erreurs (rate limit vs autres)
 * - Timeout adaptatif selon type d'erreur
 * - Métriques de performance
 * 
 * @module services/finance/improvedCircuitBreaker
 */

import logger from '../../utils/logger';

const log = logger.module('improvedCircuitBreaker');

/**
 * Circuit Breaker Amélioré
 */
class ImprovedCircuitBreaker {
  constructor(options = {}) {
    const {
      threshold = 5,              // Nombre d'échecs avant ouverture
      timeout = 60000,            // Timeout initial (60s)
      halfOpenTimeout = 30000,   // Timeout pour half-open (30s)
      halfOpenMaxAttempts = 3,   // Max tentatives en half-open
      rateLimitTimeout = 5 * 60 * 1000, // Timeout pour rate limit (5 min)
      name = 'CircuitBreaker'    // Nom pour logging
    } = options;

    this.name = name;
    this.threshold = threshold;
    this.timeout = timeout;
    this.halfOpenTimeout = halfOpenTimeout;
    this.halfOpenMaxAttempts = halfOpenMaxAttempts;
    this.rateLimitTimeout = rateLimitTimeout;

    // État du circuit breaker
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = 0;
    this.lastError = null;

    // Métriques
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateChanges: 0,
      lastStateChange: null
    };
  }

  /**
   * Exécute une fonction avec protection circuit breaker
   * 
   * @param {Function} fn - Fonction à exécuter
   * @param {Object} options - Options
   * @param {boolean} options.force - Forcer exécution même si OPEN
   * @returns {Promise<any>} Résultat de la fonction
   */
  async execute(fn, options = {}) {
    const { force = false } = options;

    this.metrics.totalRequests++;

    // Vérifier état circuit breaker
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        const remaining = Math.round((this.nextAttempt - Date.now()) / 1000);
        log.debug(`[${this.name}] Circuit breaker OPEN, retry in ${remaining}s`);
        throw new Error(`Circuit breaker is OPEN (retry in ${remaining}s)`);
      }
      
      // Transition vers HALF_OPEN
      this.transitionToHalfOpen();
    }

    // ✅ PHASE 3.4 : Half-open state optimisé
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        // Trop de tentatives en half-open, revenir à OPEN
        this.transitionToOpen(this.lastError);
        throw new Error('Circuit breaker HALF_OPEN max attempts reached');
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Transition vers état CLOSED
   */
  transitionToClosed() {
    if (this.state !== 'CLOSED') {
      log.info(`[${this.name}] Circuit breaker CLOSED`);
      this.metrics.stateChanges++;
      this.metrics.lastStateChange = Date.now();
    }
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.nextAttempt = 0;
  }

  /**
   * Transition vers état OPEN
   */
  transitionToOpen(error = null) {
    if (this.state !== 'OPEN') {
      log.warn(`[${this.name}] Circuit breaker OPEN (failures: ${this.failures}/${this.threshold})`);
      this.metrics.stateChanges++;
      this.metrics.lastStateChange = Date.now();
    }
    
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    this.lastError = error;

    // ✅ PHASE 3.4 : Timeout adaptatif selon type d'erreur
    let timeout = this.timeout;
    if (error) {
      const errorMsg = error.message || String(error);
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        timeout = this.rateLimitTimeout; // 5 min pour rate limit
        log.warn(`[${this.name}] Rate limit detected, using extended timeout (${timeout / 1000}s)`);
      }
    }

    this.nextAttempt = Date.now() + timeout;
  }

  /**
   * Transition vers état HALF_OPEN
   */
  transitionToHalfOpen() {
    if (this.state !== 'HALF_OPEN') {
      log.info(`[${this.name}] Circuit breaker HALF_OPEN (testing...)`);
      this.metrics.stateChanges++;
      this.metrics.lastStateChange = Date.now();
    }
    
    this.state = 'HALF_OPEN';
    this.halfOpenAttempts = 0;
    this.successes = 0;
    this.nextAttempt = Date.now() + this.halfOpenTimeout;
  }

  /**
   * Appelé en cas de succès
   */
  onSuccess() {
    this.metrics.totalSuccesses++;
    this.successes++;

    if (this.state === 'HALF_OPEN') {
      // ✅ PHASE 3.4 : Half-open optimisé - besoin de plusieurs succès
      if (this.successes >= 2) {
        // 2 succès consécutifs = circuit fermé
        this.transitionToClosed();
      }
    } else if (this.state === 'CLOSED') {
      // Réinitialiser compteur d'échecs après succès
      if (this.failures > 0) {
        this.failures = Math.max(0, this.failures - 1);
      }
    }
  }

  /**
   * Appelé en cas d'échec
   */
  onFailure(error) {
    this.metrics.totalFailures++;
    this.failures++;
    this.lastError = error;

    if (this.state === 'HALF_OPEN') {
      // Échec en half-open = revenir à OPEN immédiatement
      this.transitionToOpen(error);
    } else if (this.state === 'CLOSED') {
      // Vérifier si seuil atteint
      if (this.failures >= this.threshold) {
        this.transitionToOpen(error);
      }
    }
  }

  /**
   * Réinitialise le circuit breaker
   */
  reset() {
    log.info(`[${this.name}] Circuit breaker RESET`);
    this.transitionToClosed();
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateChanges: 0,
      lastStateChange: null
    };
  }

  /**
   * Obtient les métriques
   */
  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.nextAttempt,
      failureRate: this.metrics.totalRequests > 0
        ? (this.metrics.totalFailures / this.metrics.totalRequests) * 100
        : 0
    };
  }

  /**
   * Vérifie si le circuit breaker est disponible
   */
  isAvailable() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    if (this.state === 'OPEN') {
      return Date.now() >= this.nextAttempt;
    }
    return false;
  }
}

export default ImprovedCircuitBreaker;
