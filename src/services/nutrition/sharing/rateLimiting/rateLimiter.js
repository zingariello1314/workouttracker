/**
 * rateLimiter.js
 * 
 * ✅ PHASE 12.1 : Rate Limiter avec bucket algorithm (token bucket)
 * 
 * ✅ PHASE 1.2 : Protection contre abus création liens
 * - Limite nombre de tokens disponibles (bucket)
 * - Refill automatique selon taux défini
 * - Calcul temps d'attente si bucket vide
 * 
 * @module services/nutrition/sharing/rateLimiting/rateLimiter
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 4
 */

import { MAX_ACTIVE_SHARE_LINKS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('rateLimiter');

/**
 * Rate Limiter avec bucket algorithm (token bucket)
 * 
 * ✅ PHASE 1.2 : Protection contre abus création liens
 * - Limite nombre de tokens disponibles (bucket)
 * - Refill automatique selon taux défini
 * - Calcul temps d'attente si bucket vide
 * 
 * @class RateLimiter
 */
export class RateLimiter {
  /**
   * @param {number} maxTokens - Nombre max de tokens (capacité bucket)
   * @param {number} refillRate - Taux de refill (tokens/seconde)
   */
  constructor(maxTokens, refillRate) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate; // tokens/seconde
    this.lastRefill = Date.now();
  }

  /**
   * Refill le bucket selon temps écoulé
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // secondes
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Tente de consommer un token
   * @returns {boolean} true si token consommé, false si bucket vide
   */
  tryConsume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Calcule le temps d'attente avant prochaine disponibilité
   * @returns {number} Temps d'attente en millisecondes
   */
  getWaitTime() {
    this.refill();
    if (this.tokens >= 1) return 0;
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // ms
  }

  /**
   * Réinitialise le bucket (pour tests ou reset manuel)
   */
  reset() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

// ✅ PHASE 1.2 : Configuration rate limiter création liens
// Max 5 créations initiales, puis 1 token par minute (1/60 tokens/seconde)
export const shareLinkCreationLimiter = new RateLimiter(5, 1/60);

/**
 * ✅ PHASE 1.2 : Vérifie si création lien autorisée (rate limiting + limite active)
 * 
 * @param {Array<Object>} existingLinks - Liste des liens existants (pour vérifier actifs)
 * @returns {Object} { allowed: boolean, reason?: string, waitTime?: number, activeCount?: number }
 */
export function checkShareLinkCreationAllowed(existingLinks = []) {
  // 1. Vérifier rate limiting
  if (!shareLinkCreationLimiter.tryConsume()) {
    const waitMs = shareLinkCreationLimiter.getWaitTime();
    const waitMin = Math.ceil(waitMs / 60000);
    return {
      allowed: false,
      reason: 'rate_limit',
      waitTime: waitMs,
      waitMinutes: waitMin,
      message: `Limite de création atteinte. Attendez ${waitMin} minute${waitMin > 1 ? 's' : ''} avant de créer un nouveau lien.`
    };
  }

  // 2. Vérifier nombre total liens actifs
  const now = Date.now();
  const activeLinks = existingLinks.filter(link => {
    const expiresAt = typeof link.expiresAt === 'number' ? link.expiresAt : new Date(link.expiresAt).getTime();
    return expiresAt > now;
  });

  if (activeLinks.length >= MAX_ACTIVE_SHARE_LINKS) {
    return {
      allowed: false,
      reason: 'max_active_links',
      activeCount: activeLinks.length,
      maxActive: MAX_ACTIVE_SHARE_LINKS,
      message: `Vous avez atteint la limite de ${MAX_ACTIVE_SHARE_LINKS} liens actifs. Révoquez des liens expirés ou inutilisés avant d'en créer un nouveau.`
    };
  }

  // ✅ Création autorisée
  return {
    allowed: true,
    activeCount: activeLinks.length,
    maxActive: MAX_ACTIVE_SHARE_LINKS
  };
}


