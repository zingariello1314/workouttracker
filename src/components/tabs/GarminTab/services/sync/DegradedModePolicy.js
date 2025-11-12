/**
 * Service centralisé pour la gestion du mode dégradé et des politiques de retry
 * 
 * Ce service extrait la logique de mode dégradé de SyncRetryService et useGarminSyncActions
 * pour offrir une API claire et testable, tout en conservant les comportements existants.
 * 
 * Responsabilités :
 * - Détection du mode dégradé (seuil de durée, circuit breaker)
 * - Calcul des cooldowns et prochains retry
 * - Génération de métadonnées pour instrumentation
 * - Politiques de retry adaptatives
 */

import { FORCE_SYNC_DEGRADE_THRESHOLD_MS } from '../../constants';

/**
 * Classe pour gérer les politiques de mode dégradé
 */
export class DegradedModePolicy {
  constructor({
    degradeThresholdMs = FORCE_SYNC_DEGRADE_THRESHOLD_MS,
    circuitBreaker = null
  } = {}) {
    this.degradeThresholdMs = Math.max(1000, degradeThresholdMs);
    this.circuitBreaker = circuitBreaker;
    this.activeDegradedSessions = new Map(); // Map<sessionId, metadata>
  }

  /**
   * Vérifie si une requête doit passer en mode dégradé
   * 
   * @param {Object} params
   * @param {number} params.durationMs - Durée de la requête en ms
   * @param {boolean} params.forceRefresh - Si c'est un forçage
   * @param {string} params.sessionId - ID de session (optionnel)
   * @returns {boolean} True si mode dégradé activé
   */
  shouldDegrade({ durationMs, forceRefresh = false, sessionId = null }) {
    if (!forceRefresh) {
      return false; // Mode dégradé uniquement pour forçages
    }

    if (durationMs >= this.degradeThresholdMs) {
      return true;
    }

    // Vérifier aussi le circuit breaker si disponible
    if (this.circuitBreaker && this.circuitBreaker.getState() === 'open') {
      return true;
    }

    return false;
  }

  /**
   * Calcule le cooldown restant (circuit breaker ou mode dégradé)
   * 
   * @param {Object} params
   * @param {string} params.sessionId - ID de session (optionnel)
   * @returns {number} Cooldown restant en ms (0 si aucun)
   */
  getCooldownRemaining({ sessionId = null } = {}) {
    // Priorité au circuit breaker
    if (this.circuitBreaker) {
      const circuitCooldown = this.circuitBreaker.getCooldownRemaining();
      if (circuitCooldown > 0) {
        return circuitCooldown;
      }
    }

    // Vérifier les sessions dégradées actives
    if (sessionId && this.activeDegradedSessions.has(sessionId)) {
      const session = this.activeDegradedSessions.get(sessionId);
      const elapsed = Date.now() - (session.triggeredAt || Date.now());
      const sessionCooldown = Math.max(0, this.degradeThresholdMs - elapsed);
      return sessionCooldown;
    }

    return 0;
  }

  /**
   * Calcule le timestamp du prochain retry possible
   * 
   * @param {Object} params
   * @param {string} params.sessionId - ID de session (optionnel)
   * @returns {number|null} Timestamp du prochain retry (null si aucun cooldown)
   */
  getNextRetryTimestamp({ sessionId = null } = {}) {
    const cooldown = this.getCooldownRemaining({ sessionId });
    if (cooldown <= 0) {
      return null;
    }
    return Date.now() + cooldown;
  }

  /**
   * Génère la raison du mode dégradé
   * 
   * @param {Object} params
   * @param {number} params.durationMs - Durée de la requête
   * @param {boolean} params.forceRefresh - Si c'est un forçage
   * @param {string} params.circuitState - État du circuit breaker ('open', 'half-open', 'closed')
   * @returns {string|null} Raison du dégradé (null si pas dégradé)
   */
  getDegradedReason({ durationMs, forceRefresh = false, circuitState = null }) {
    if (!forceRefresh) {
      return null;
    }

    if (circuitState === 'open') {
      return 'circuit_breaker_open';
    }

    if (durationMs >= this.degradeThresholdMs) {
      return `duration_threshold_exceeded_${durationMs}ms`;
    }

    return null;
  }

  /**
   * Enregistre une session en mode dégradé
   * 
   * @param {Object} params
   * @param {string} params.sessionId - ID unique de la session
   * @param {Object} params.metadata - Métadonnées (startDate, endDate, thresholdMs, etc.)
   */
  recordDegradedSession({ sessionId, metadata = {} }) {
    this.activeDegradedSessions.set(sessionId, {
      triggeredAt: Date.now(),
      thresholdMs: metadata.thresholdMs || this.degradeThresholdMs,
      startDate: metadata.startDate || null,
      endDate: metadata.endDate || null,
      reason: metadata.reason || 'unknown',
      ...metadata
    });

    // Nettoyer les sessions expirées (> 5 min)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000;
    for (const [id, session] of this.activeDegradedSessions.entries()) {
      if (now - (session.triggeredAt || 0) > maxAge) {
        this.activeDegradedSessions.delete(id);
      }
    }
  }

  /**
   * Récupère les métadonnées d'une session dégradée
   * 
   * @param {string} sessionId - ID de la session
   * @returns {Object|null} Métadonnées ou null si session inconnue
   */
  getDegradedSession(sessionId) {
    return this.activeDegradedSessions.get(sessionId) || null;
  }

  /**
   * Génère un snapshot complet pour instrumentation
   * 
   * @param {Object} params
   * @param {string} params.sessionId - ID de session actuelle (optionnel)
   * @param {number} params.currentDurationMs - Durée de la requête actuelle (optionnel)
   * @param {boolean} params.forceRefresh - Si c'est un forçage (optionnel)
   * @returns {Object} Snapshot avec toutes les métriques
   */
  getSnapshot({
    sessionId = null,
    currentDurationMs = null,
    forceRefresh = false
  } = {}) {
    const circuitState = this.circuitBreaker ? this.circuitBreaker.getState() : null;
    const circuitFailureCount = this.circuitBreaker ? this.circuitBreaker.getFailureCount() : 0;
    const cooldownRemaining = this.getCooldownRemaining({ sessionId });
    const nextRetry = this.getNextRetryTimestamp({ sessionId });

    let degradedReason = null;
    let isDegraded = false;

    if (currentDurationMs !== null && forceRefresh) {
      isDegraded = this.shouldDegrade({ durationMs: currentDurationMs, forceRefresh });
      degradedReason = this.getDegradedReason({
        durationMs: currentDurationMs,
        forceRefresh,
        circuitState
      });
    } else if (circuitState === 'open') {
      isDegraded = true;
      degradedReason = 'circuit_breaker_open';
    } else if (sessionId && this.activeDegradedSessions.has(sessionId)) {
      isDegraded = true;
      const session = this.activeDegradedSessions.get(sessionId);
      degradedReason = session.reason || 'session_degraded';
    }

    return {
      isDegraded,
      degradedReason,
      currentCooldown: cooldownRemaining,
      nextRetry,
      nextRetryTimestamp: nextRetry,
      circuitState,
      circuitFailureCount,
      degradeThresholdMs: this.degradeThresholdMs,
      activeDegradedSessionsCount: this.activeDegradedSessions.size,
      sessionMetadata: sessionId ? this.getDegradedSession(sessionId) : null
    };
  }

  /**
   * Nettoie les sessions expirées (appelé périodiquement)
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    for (const [id, session] of this.activeDegradedSessions.entries()) {
      if (now - (session.triggeredAt || 0) > maxAge) {
        this.activeDegradedSessions.delete(id);
      }
    }
  }

  /**
   * Réinitialise toutes les sessions dégradées (utile pour tests)
   */
  reset() {
    this.activeDegradedSessions.clear();
  }
}

export default DegradedModePolicy;



