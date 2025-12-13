/**
 * Service d'optimisation des requêtes de données pour les modules sidebar historiques
 * Implémente le batching, la déduplication et la priorisation des requêtes
 * 
 * Requirements: 14.1 - Optimisation des requêtes de données
 * 
 * @module services/sidebar/dataQueryOptimizer
 */

import { measureAsync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';

/**
 * Types de requêtes supportées
 */
export const QUERY_TYPES = {
  GARMIN_METRICS: 'garmin_metrics',
  BOOKS_STATISTICS: 'books_statistics',
  QUEST_DATA: 'quest_data',
  NUTRITION_DATA: 'nutrition_data',
  FINANCE_DATA: 'finance_data',
  LEARNING_DATA: 'learning_data'
};

/**
 * Priorités des requêtes
 */
export const QUERY_PRIORITIES = {
  HIGH: 1,    // Données critiques (métriques vitales)
  MEDIUM: 2,  // Données importantes (quêtes, sport)
  LOW: 3      // Données secondaires (statistiques historiques)
};

/**
 * Configuration des requêtes par type
 */
const QUERY_CONFIG = {
  [QUERY_TYPES.GARMIN_METRICS]: {
    priority: QUERY_PRIORITIES.HIGH,
    cacheTTL: 5 * 60 * 1000,      // 5 minutes
    batchable: false,              // Requête unique
    retryAttempts: 3
  },
  [QUERY_TYPES.BOOKS_STATISTICS]: {
    priority: QUERY_PRIORITIES.MEDIUM,
    cacheTTL: 10 * 60 * 1000,     // 10 minutes
    batchable: true,
    retryAttempts: 2
  },
  [QUERY_TYPES.QUEST_DATA]: {
    priority: QUERY_PRIORITIES.HIGH,
    cacheTTL: 2 * 60 * 1000,      // 2 minutes
    batchable: true,
    retryAttempts: 3
  },
  [QUERY_TYPES.NUTRITION_DATA]: {
    priority: QUERY_PRIORITIES.MEDIUM,
    cacheTTL: 15 * 60 * 1000,     // 15 minutes
    batchable: true,
    retryAttempts: 2
  },
  [QUERY_TYPES.FINANCE_DATA]: {
    priority: QUERY_PRIORITIES.LOW,
    cacheTTL: 30 * 60 * 1000,     // 30 minutes
    batchable: true,
    retryAttempts: 1
  },
  [QUERY_TYPES.LEARNING_DATA]: {
    priority: QUERY_PRIORITIES.MEDIUM,
    cacheTTL: 10 * 60 * 1000,     // 10 minutes
    batchable: true,
    retryAttempts: 2
  }
};

/**
 * Service d'optimisation des requêtes de données
 */
class DataQueryOptimizer {
  constructor() {
    this.queryQueue = [];
    this.batchQueue = new Map();
    this.activeQueries = new Map();
    this.queryCache = new Map();
    this.isProcessing = false;
    
    // Configuration
    this.config = {
      batchDelay: 50,           // 50ms pour grouper les requêtes
      maxBatchSize: 10,         // Maximum 10 requêtes par batch
      maxConcurrentQueries: 5,  // Maximum 5 requêtes simultanées
      queryTimeout: 10000       // 10 secondes timeout
    };
    
    // Statistiques
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchedQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0
    };
    
    // Démarrer le processeur de batch
    this.startBatchProcessor();
  }

  /**
   * Exécute une requête optimisée
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres de la requête
   * @param {Function} queryFunction - Fonction de requête à exécuter
   * @returns {Promise<any>} Résultat de la requête
   */
  async executeQuery(queryType, params, queryFunction) {
    const queryId = this.generateQueryId(queryType, params);
    const config = QUERY_CONFIG[queryType] || QUERY_CONFIG[QUERY_TYPES.LEARNING_DATA];
    
    this.stats.totalQueries++;
    
    try {
      // Vérifier le cache d'abord
      const cachedResult = this.getCachedResult(queryId, config.cacheTTL);
      if (cachedResult !== null) {
        this.stats.cacheHits++;
        return cachedResult;
      }
      
      this.stats.cacheMisses++;
      
      // Vérifier si la requête est déjà en cours
      if (this.activeQueries.has(queryId)) {
        return await this.activeQueries.get(queryId);
      }
      
      // Créer la promesse de requête
      const queryPromise = this.createOptimizedQuery(
        queryId,
        queryType,
        params,
        queryFunction,
        config
      );
      
      this.activeQueries.set(queryId, queryPromise);
      
      try {
        const result = await queryPromise;
        
        // Mettre en cache le résultat
        this.cacheResult(queryId, result, config.cacheTTL);
        
        return result;
      } finally {
        this.activeQueries.delete(queryId);
      }
      
    } catch (error) {
      this.stats.failedQueries++;
      console.error('[DataQueryOptimizer] Erreur lors de l\'exécution de la requête:', error);
      throw error;
    }
  }

  /**
   * Crée une requête optimisée avec retry et timeout
   * @param {string} queryId - ID de la requête
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres
   * @param {Function} queryFunction - Fonction de requête
   * @param {Object} config - Configuration
   * @returns {Promise<any>} Résultat
   */
  async createOptimizedQuery(queryId, queryType, params, queryFunction, config) {
    const startTime = Date.now();
    
    return await measureAsync(SIDEBAR_OPERATIONS.STATISTICS_CALCULATION, async () => {
      let lastError;
      
      for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
        try {
          // Appliquer un timeout à la requête
          const result = await Promise.race([
            queryFunction(params),
            this.createTimeoutPromise(this.config.queryTimeout)
          ]);
          
          // Mettre à jour les statistiques de performance
          const responseTime = Date.now() - startTime;
          this.updateResponseTimeStats(responseTime);
          
          return result;
          
        } catch (error) {
          lastError = error;
          
          if (attempt < config.retryAttempts) {
            // Attendre avant le retry avec backoff exponentiel
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await this.delay(delay);
          }
        }
      }
      
      throw lastError;
    });
  }

  /**
   * Ajoute une requête au batch si possible
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres
   * @param {Function} queryFunction - Fonction de requête
   * @returns {Promise<any>} Résultat de la requête
   */
  async addToBatch(queryType, params, queryFunction) {
    const config = QUERY_CONFIG[queryType];
    
    if (!config.batchable) {
      return this.executeQuery(queryType, params, queryFunction);
    }
    
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(queryType)) {
        this.batchQueue.set(queryType, []);
      }
      
      const batch = this.batchQueue.get(queryType);
      batch.push({
        params,
        queryFunction,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      // Si le batch est plein, le traiter immédiatement
      if (batch.length >= this.config.maxBatchSize) {
        this.processBatch(queryType);
      }
    });
  }

  /**
   * Démarre le processeur de batch
   */
  startBatchProcessor() {
    setInterval(() => {
      for (const [queryType, batch] of this.batchQueue.entries()) {
        if (batch.length > 0) {
          this.processBatch(queryType);
        }
      }
    }, this.config.batchDelay);
  }

  /**
   * Traite un batch de requêtes
   * @param {string} queryType - Type de requête
   */
  async processBatch(queryType) {
    const batch = this.batchQueue.get(queryType);
    if (!batch || batch.length === 0) return;
    
    // Vider le batch
    this.batchQueue.set(queryType, []);
    this.stats.batchedQueries += batch.length;
    
    try {
      // Grouper les paramètres similaires
      const groupedBatch = this.groupBatchByParams(batch);
      
      // Exécuter les requêtes groupées
      for (const group of groupedBatch) {
        try {
          const results = await this.executeBatchGroup(queryType, group);
          
          // Résoudre les promesses avec les résultats correspondants
          group.forEach((item, index) => {
            item.resolve(results[index]);
          });
          
        } catch (error) {
          // Rejeter toutes les promesses du groupe
          group.forEach(item => {
            item.reject(error);
          });
        }
      }
      
    } catch (error) {
      console.error('[DataQueryOptimizer] Erreur lors du traitement du batch:', error);
      
      // Rejeter toutes les promesses
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * Groupe les requêtes du batch par paramètres similaires
   * @param {Array} batch - Batch de requêtes
   * @returns {Array} Groupes de requêtes
   */
  groupBatchByParams(batch) {
    const groups = new Map();
    
    batch.forEach(item => {
      const key = JSON.stringify(item.params);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key).push(item);
    });
    
    return Array.from(groups.values());
  }

  /**
   * Exécute un groupe de requêtes similaires
   * @param {string} queryType - Type de requête
   * @param {Array} group - Groupe de requêtes
   * @returns {Promise<Array>} Résultats
   */
  async executeBatchGroup(queryType, group) {
    // Pour les requêtes identiques, exécuter une seule fois et partager le résultat
    if (group.length === 1) {
      const item = group[0];
      return [await item.queryFunction(item.params)];
    }
    
    // Pour les requêtes similaires, optimiser si possible
    const firstItem = group[0];
    const result = await firstItem.queryFunction(firstItem.params);
    
    // Retourner le même résultat pour toutes les requêtes identiques
    return new Array(group.length).fill(result);
  }

  /**
   * Génère un ID unique pour une requête
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres
   * @returns {string} ID de la requête
   */
  generateQueryId(queryType, params) {
    const paramsString = JSON.stringify(params, Object.keys(params).sort());
    return `${queryType}:${this.hashString(paramsString)}`;
  }

  /**
   * Génère un hash simple d'une chaîne
   * @param {string} str - Chaîne à hasher
   * @returns {string} Hash
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Récupère un résultat du cache
   * @param {string} queryId - ID de la requête
   * @param {number} ttl - TTL en millisecondes
   * @returns {any|null} Résultat ou null si expiré
   */
  getCachedResult(queryId, ttl) {
    const cached = this.queryCache.get(queryId);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > ttl) {
      this.queryCache.delete(queryId);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Met en cache un résultat
   * @param {string} queryId - ID de la requête
   * @param {any} result - Résultat à cacher
   * @param {number} ttl - TTL en millisecondes
   */
  cacheResult(queryId, result, ttl) {
    this.queryCache.set(queryId, {
      result,
      timestamp: Date.now(),
      ttl
    });
    
    // Nettoyer le cache si trop volumineux
    if (this.queryCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Nettoie le cache des entrées expirées
   */
  cleanupCache() {
    const now = Date.now();
    
    for (const [queryId, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(queryId);
      }
    }
  }

  /**
   * Crée une promesse de timeout
   * @param {number} timeout - Timeout en millisecondes
   * @returns {Promise} Promesse qui rejette après le timeout
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Délai d'attente
   * @param {number} ms - Millisecondes à attendre
   * @returns {Promise} Promesse qui se résout après le délai
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Met à jour les statistiques de temps de réponse
   * @param {number} responseTime - Temps de réponse en ms
   */
  updateResponseTimeStats(responseTime) {
    const currentAvg = this.stats.averageResponseTime;
    const totalQueries = this.stats.totalQueries;
    
    this.stats.averageResponseTime = 
      (currentAvg * (totalQueries - 1) + responseTime) / totalQueries;
  }

  /**
   * Obtient les statistiques de performance
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.totalQueries > 0 
        ? (this.stats.cacheHits / this.stats.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      cacheSize: this.queryCache.size,
      activeQueries: this.activeQueries.size,
      queuedBatches: Array.from(this.batchQueue.values()).reduce((sum, batch) => sum + batch.length, 0)
    };
  }

  /**
   * Vide le cache et reset les statistiques
   */
  reset() {
    this.queryCache.clear();
    this.activeQueries.clear();
    this.batchQueue.clear();
    
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchedQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Précharge des données critiques
   * @param {Array} queries - Liste des requêtes à précharger
   */
  async preloadCriticalData(queries) {
    const criticalQueries = queries.filter(q => 
      QUERY_CONFIG[q.type]?.priority === QUERY_PRIORITIES.HIGH
    );
    
    const preloadPromises = criticalQueries.map(query =>
      this.executeQuery(query.type, query.params, query.queryFunction)
        .catch(error => {
          console.warn('[DataQueryOptimizer] Erreur préchargement:', error);
          return null;
        })
    );
    
    await Promise.allSettled(preloadPromises);
  }
}

// Instance singleton
export const dataQueryOptimizer = new DataQueryOptimizer();

export default dataQueryOptimizer;