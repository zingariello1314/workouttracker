/**
 * tokenBucket.js
 * 
 * Implémentation optimale d'un Token Bucket pour rate limiting.
 * Alternative plus smooth au sliding window pour distribution équitable des requêtes.
 * 
 * ✅ OPTIMISATION : Remplace sliding window par token bucket (distribution équitable)
 * 
 * Avantages Token Bucket vs Sliding Window :
 * - Distribution équitable : tokens se remplissent progressivement
 * - Meilleure gestion bursts : permet quelques requêtes rapides puis ralentit
 * - Plus prévisible : on sait exactement quand le prochain token sera disponible
 * - Performance : pas de nettoyage array/timestamps (O(1) au lieu de O(n))
 * 
 * Architecture :
 * - Bucket avec tokens (maxTokens) qui se remplissent au fil du temps
 * - Refill automatique basé sur intervalle (progressive, pas tout-ou-rien)
 * - Support multi-bucket (pour rotation clés API)
 * 
 * @module utils/tokenBucket
 * @see ../docs/nutrition/ANALYSE_OPTIMISATIONS_CODE_REEL.md Section 9
 */

import logger from './logger';

const log = logger.module('tokenBucket');

// ==================== CLASSE TOKEN BUCKET ====================

/**
 * Token Bucket pour rate limiting
 * 
 * @example
 * // Single bucket (OpenFoodFacts: 10 req/min)
 * const bucket = new TokenBucket(10, 60000);
 * await bucket.consume(); // Attend si nécessaire
 * 
 * @example
 * // Multi-bucket (USDA: 30 req/min par clé API)
 * const buckets = new TokenBucket(30, 60000, { multiBucket: true });
 * await buckets.consume('api_key_1'); // Bucket spécifique à la clé
 * await buckets.consume('api_key_2'); // Bucket séparé
 */
export class TokenBucket {
  /**
   * @param {number} maxTokens - Nombre maximum de tokens (défaut: 10)
   * @param {number} refillInterval - Intervalle de refill en ms (défaut: 60000 = 1 min)
   * @param {Object} options - Options additionnelles
   * @param {boolean} options.multiBucket - Support multi-bucket (par clé, défaut: false)
   * @param {boolean} options.enableStats - Activer statistiques (défaut: false)
   */
  constructor(maxTokens = 10, refillInterval = 60000, options = {}) {
    if (maxTokens <= 0) {
      throw new Error('TokenBucket maxTokens doit être > 0');
    }
    if (refillInterval <= 0) {
      throw new Error('TokenBucket refillInterval doit être > 0');
    }

    this.maxTokens = maxTokens;
    this.refillInterval = refillInterval;
    this.multiBucket = options.multiBucket || false;
    this.enableStats = options.enableStats || false;

    // Single bucket mode
    if (!this.multiBucket) {
      this.tokens = maxTokens;
      this.lastRefill = Date.now();
    } else {
      // Multi-bucket mode : Map<bucketKey, { tokens, lastRefill }>
      this.buckets = new Map();
    }

    // Statistiques (optionnel)
    if (this.enableStats) {
      this.stats = {
        totalConsumed: 0,
        totalWaited: 0,
        totalWaitTime: 0,
        refills: 0
      };
    }
  }

  /**
   * Remplit automatiquement le bucket (ou buckets en mode multi)
   * 
   * ✅ OPTIMISATION : Refill progressif (pas tout-ou-rien)
   * Calcule nombre de tokens à ajouter basé sur temps écoulé
   * 
   * @param {string} bucketKey - Clé du bucket (si multi-bucket, sinon ignoré)
   * @returns {number} Nombre de tokens actuellement disponibles
   */
  refill(bucketKey = 'default') {
    const now = Date.now();

    if (!this.multiBucket) {
      // Single bucket mode
      const timePassed = now - this.lastRefill;
      
      // ✅ Calculer tokens à ajouter (proportionnel au temps écoulé)
      // Ex: 10 tokens/min = 1 token toutes les 6 secondes
      const tokensPerMs = this.maxTokens / this.refillInterval;
      const tokensToAdd = Math.floor(timePassed * tokensPerMs);
      
      if (tokensToAdd > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
        
        if (this.enableStats) {
          this.stats.refills++;
        }
        
        if (this.tokens < this.maxTokens && log.debug) {
          log.debug(`[TokenBucket] Refill: ${tokensToAdd} tokens (total: ${this.tokens}/${this.maxTokens})`);
        }
      }
      
      return this.tokens;
    } else {
      // Multi-bucket mode
      let bucket = this.buckets.get(bucketKey);
      
      // Créer bucket si n'existe pas
      if (!bucket) {
        bucket = {
          tokens: this.maxTokens,
          lastRefill: now
        };
        this.buckets.set(bucketKey, bucket);
        return bucket.tokens;
      }
      
      const timePassed = now - bucket.lastRefill;
      const tokensPerMs = this.maxTokens / this.refillInterval;
      const tokensToAdd = Math.floor(timePassed * tokensPerMs);
      
      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        
        if (this.enableStats) {
          this.stats.refills++;
        }
        
        if (log.debug && bucket.tokens < this.maxTokens) {
          log.debug(`[TokenBucket] Refill bucket '${bucketKey}': ${tokensToAdd} tokens (total: ${bucket.tokens}/${this.maxTokens})`);
        }
      }
      
      return bucket.tokens;
    }
  }

  /**
   * Consomme un token (attend si nécessaire jusqu'à disponibilité)
   * 
   * ✅ OPTIMISATION : Attente intelligente basée sur refill progressif
   * Ne bloque pas plus que nécessaire
   * 
   * @param {string} bucketKey - Clé du bucket (si multi-bucket, sinon ignoré)
   * @returns {Promise<boolean>} true si token consommé avec succès
   */
  async consume(bucketKey = 'default') {
    // ✅ Refill automatique avant consommation
    const availableTokens = this.refill(bucketKey);
    
    if (!this.multiBucket) {
      // Single bucket mode
      if (this.tokens > 0) {
        this.tokens--;
        
        if (this.enableStats) {
          this.stats.totalConsumed++;
        }
        
        return true;
      }
      
      // Pas de tokens disponibles, calculer temps d'attente
      // ✅ OPTIMISATION : Calcul précis basé sur refill progressif
      const timeUntilNextToken = this.refillInterval / this.maxTokens;
      const timeSinceLastRefill = Date.now() - this.lastRefill;
      const waitTime = Math.max(0, timeUntilNextToken - timeSinceLastRefill);
      
      if (waitTime > 0) {
        if (this.enableStats) {
          this.stats.totalWaited++;
          this.stats.totalWaitTime += waitTime;
        }
        
        log.debug(`[TokenBucket] Pas de tokens disponibles, attente ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, Math.ceil(waitTime)));
        
        // Retry après attente (refill automatique)
        return await this.consume();
      }
      
      return false;
    } else {
      // Multi-bucket mode
      const bucket = this.buckets.get(bucketKey);
      
      if (!bucket || bucket.tokens <= 0) {
        // Pas de bucket ou pas de tokens, attendre refill
        const timeUntilNextToken = this.refillInterval / this.maxTokens;
        let waitTime = timeUntilNextToken;
        
        if (bucket) {
          const timeSinceLastRefill = Date.now() - bucket.lastRefill;
          waitTime = Math.max(0, timeUntilNextToken - timeSinceLastRefill);
        }
        
        if (waitTime > 0) {
          if (this.enableStats) {
            this.stats.totalWaited++;
            this.stats.totalWaitTime += waitTime;
          }
          
          log.debug(`[TokenBucket] Pas de tokens pour bucket '${bucketKey}', attente ${Math.round(waitTime)}ms...`);
          await new Promise(resolve => setTimeout(resolve, Math.ceil(waitTime)));
          
          // Retry après attente
          return await this.consume(bucketKey);
        }
        
        return false;
      }
      
      bucket.tokens--;
      
      if (this.enableStats) {
        this.stats.totalConsumed++;
      }
      
      return true;
    }
  }

  /**
   * Vérifie si un token est disponible (sans consommation)
   * 
   * @param {string} bucketKey - Clé du bucket (si multi-bucket)
   * @returns {boolean} true si token disponible
   */
  hasTokens(bucketKey = 'default') {
    this.refill(bucketKey);
    
    if (!this.multiBucket) {
      return this.tokens > 0;
    } else {
      const bucket = this.buckets.get(bucketKey);
      return bucket ? bucket.tokens > 0 : false;
    }
  }

  /**
   * Obtient le nombre de tokens disponibles
   * 
   * @param {string} bucketKey - Clé du bucket (si multi-bucket)
   * @returns {number} Nombre de tokens disponibles
   */
  getAvailableTokens(bucketKey = 'default') {
    this.refill(bucketKey);
    
    if (!this.multiBucket) {
      return this.tokens;
    } else {
      const bucket = this.buckets.get(bucketKey);
      return bucket ? bucket.tokens : 0;
    }
  }

  /**
   * Réinitialise un bucket (ou tous en single mode)
   * 
   * @param {string} bucketKey - Clé du bucket (si multi-bucket, si null = tous)
   */
  reset(bucketKey = null) {
    if (!this.multiBucket) {
      this.tokens = this.maxTokens;
      this.lastRefill = Date.now();
    } else {
      if (bucketKey === null) {
        // Reset tous les buckets
        this.buckets.clear();
      } else {
        // Reset bucket spécifique
        const bucket = this.buckets.get(bucketKey);
        if (bucket) {
          bucket.tokens = this.maxTokens;
          bucket.lastRefill = Date.now();
        }
      }
    }
  }

  /**
   * Retourne les statistiques (si activées)
   * 
   * @returns {Object|null} Statistiques ou null
   */
  getStats() {
    if (!this.enableStats) {
      return null;
    }

    const { totalConsumed, totalWaited, totalWaitTime } = this.stats;
    const avgWaitTime = totalWaited > 0 ? (totalWaitTime / totalWaited).toFixed(2) : 0;

    return {
      ...this.stats,
      avgWaitTime: `${avgWaitTime}ms`,
      waitRate: totalConsumed > 0 ? `${((totalWaited / totalConsumed) * 100).toFixed(2)}%` : '0%',
      ...(this.multiBucket && { bucketCount: this.buckets.size })
    };
  }
}

// ==================== EXPORTS ====================

export default TokenBucket;

