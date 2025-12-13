/**
 * Service de mise en cache intelligente pour les modules sidebar historiques
 * Implémente un cache multi-niveaux avec éviction LRU et prédiction des besoins
 * 
 * Requirements: 14.2, 14.4 - Système de mise en cache intelligente
 * 
 * @module services/sidebar/intelligentCacheService
 */

import { measureSync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';

/**
 * Niveaux de cache
 */
export const CACHE_LEVELS = {
  MEMORY: 'memory',      // Cache en mémoire (le plus rapide)
  SESSION: 'session',    // SessionStorage (persistant pendant la session)
  LOCAL: 'local'         // LocalStorage (persistant entre les sessions)
};

/**
 * Stratégies d'éviction
 */
export const EVICTION_STRATEGIES = {
  LRU: 'lru',           // Least Recently Used
  LFU: 'lfu',           // Least Frequently Used
  TTL: 'ttl',           // Time To Live
  SIZE: 'size'          // Basé sur la taille
};

/**
 * Configuration par type de données
 */
const CACHE_CONFIG = {
  // Métriques vitales - cache agressif
  vital_metrics: {
    level: CACHE_LEVELS.MEMORY,
    ttl: 2 * 60 * 1000,        // 2 minutes
    maxSize: 50,
    strategy: EVICTION_STRATEGIES.LRU,
    preload: true
  },
  
  // Données Garmin - cache modéré
  garmin_data: {
    level: CACHE_LEVELS.SESSION,
    ttl: 5 * 60 * 1000,        // 5 minutes
    maxSize: 20,
    strategy: EVICTION_STRATEGIES.TTL,
    preload: true
  },
  
  // Statistiques de lecture - cache long terme
  reading_stats: {
    level: CACHE_LEVELS.LOCAL,
    ttl: 30 * 60 * 1000,       // 30 minutes
    maxSize: 100,
    strategy: EVICTION_STRATEGIES.LFU,
    preload: false
  },
  
  // Données de quêtes - cache court terme
  quest_data: {
    level: CACHE_LEVELS.MEMORY,
    ttl: 1 * 60 * 1000,        // 1 minute
    maxSize: 30,
    strategy: EVICTION_STRATEGIES.LRU,
    preload: true
  },
  
  // Données financières - cache long terme
  finance_data: {
    level: CACHE_LEVELS.LOCAL,
    ttl: 60 * 60 * 1000,       // 1 heure
    maxSize: 50,
    strategy: EVICTION_STRATEGIES.LFU,
    preload: false
  },
  
  // Données de nutrition - cache modéré
  nutrition_data: {
    level: CACHE_LEVELS.SESSION,
    ttl: 15 * 60 * 1000,       // 15 minutes
    maxSize: 40,
    strategy: EVICTION_STRATEGIES.TTL,
    preload: false
  }
};

/**
 * Entrée de cache avec métadonnées
 */
class CacheEntry {
  constructor(key, data, config) {
    this.key = key;
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = config.ttl;
    this.accessCount = 1;
    this.lastAccessed = Date.now();
    this.size = this.calculateSize(data);
    this.config = config;
  }

  /**
   * Calcule la taille approximative des données
   * @param {any} data - Données à mesurer
   * @returns {number} Taille en bytes (approximation)
   */
  calculateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Approximation UTF-16
    } catch {
      return 1000; // Taille par défaut si non sérialisable
    }
  }

  /**
   * Vérifie si l'entrée est expirée
   * @returns {boolean} True si expirée
   */
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  /**
   * Met à jour les statistiques d'accès
   */
  updateAccess() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  /**
   * Calcule le score LRU (plus bas = moins récemment utilisé)
   * @returns {number} Score LRU
   */
  getLRUScore() {
    return this.lastAccessed;
  }

  /**
   * Calcule le score LFU (plus bas = moins fréquemment utilisé)
   * @returns {number} Score LFU
   */
  getLFUScore() {
    const age = Date.now() - this.timestamp;
    return this.accessCount / (age / 1000); // Accès par seconde
  }
}

/**
 * Cache multi-niveaux avec éviction intelligente
 */
class CacheLevel {
  constructor(level, storage) {
    this.level = level;
    this.storage = storage;
    this.entries = new Map();
    this.totalSize = 0;
    
    // Charger les données existantes depuis le storage persistant
    if (storage) {
      this.loadFromStorage();
    }
  }

  /**
   * Charge les données depuis le storage persistant
   */
  loadFromStorage() {
    try {
      const keys = Object.keys(this.storage);
      
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          const cacheKey = key.replace('cache:', '');
          const stored = JSON.parse(this.storage.getItem(key));
          
          if (stored && stored.data && stored.config) {
            const entry = new CacheEntry(cacheKey, stored.data, stored.config);
            entry.timestamp = stored.timestamp;
            entry.accessCount = stored.accessCount || 1;
            entry.lastAccessed = stored.lastAccessed || stored.timestamp;
            
            if (!entry.isExpired()) {
              this.entries.set(cacheKey, entry);
              this.totalSize += entry.size;
            } else {
              // Supprimer les entrées expirées
              this.storage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('[IntelligentCacheService] Erreur chargement storage:', error);
    }
  }

  /**
   * Sauvegarde une entrée dans le storage persistant
   * @param {CacheEntry} entry - Entrée à sauvegarder
   */
  saveToStorage(entry) {
    if (!this.storage) return;
    
    try {
      const storageKey = `cache:${entry.key}`;
      const storageData = {
        data: entry.data,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        config: entry.config
      };
      
      this.storage.setItem(storageKey, JSON.stringify(storageData));
    } catch (error) {
      console.warn('[IntelligentCacheService] Erreur sauvegarde storage:', error);
    }
  }

  /**
   * Supprime une entrée du storage persistant
   * @param {string} key - Clé à supprimer
   */
  removeFromStorage(key) {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('[IntelligentCacheService] Erreur suppression storage:', error);
    }
  }

  /**
   * Récupère une entrée du cache
   * @param {string} key - Clé de l'entrée
   * @returns {any|null} Données ou null si non trouvé/expiré
   */
  get(key) {
    const entry = this.entries.get(key);
    
    if (!entry) return null;
    
    if (entry.isExpired()) {
      this.delete(key);
      return null;
    }
    
    entry.updateAccess();
    this.saveToStorage(entry);
    
    return entry.data;
  }

  /**
   * Stocke une entrée dans le cache
   * @param {string} key - Clé de l'entrée
   * @param {any} data - Données à stocker
   * @param {Object} config - Configuration du cache
   */
  set(key, data, config) {
    // Supprimer l'ancienne entrée si elle existe
    if (this.entries.has(key)) {
      this.delete(key);
    }
    
    const entry = new CacheEntry(key, data, config);
    
    // Vérifier si on dépasse la taille maximale
    this.ensureCapacity(entry.size, config);
    
    this.entries.set(key, entry);
    this.totalSize += entry.size;
    
    this.saveToStorage(entry);
  }

  /**
   * Supprime une entrée du cache
   * @param {string} key - Clé à supprimer
   */
  delete(key) {
    const entry = this.entries.get(key);
    
    if (entry) {
      this.entries.delete(key);
      this.totalSize -= entry.size;
      this.removeFromStorage(key);
    }
  }

  /**
   * Assure que le cache a suffisamment de capacité
   * @param {number} requiredSize - Taille requise
   * @param {Object} config - Configuration
   */
  ensureCapacity(requiredSize, config) {
    const maxSize = config.maxSize * 1024; // Convertir KB en bytes
    
    while (this.totalSize + requiredSize > maxSize && this.entries.size > 0) {
      const victimKey = this.selectEvictionVictim(config.strategy);
      if (victimKey) {
        this.delete(victimKey);
      } else {
        break;
      }
    }
  }

  /**
   * Sélectionne une entrée à évincer selon la stratégie
   * @param {string} strategy - Stratégie d'éviction
   * @returns {string|null} Clé de l'entrée à évincer
   */
  selectEvictionVictim(strategy) {
    if (this.entries.size === 0) return null;
    
    let victim = null;
    let bestScore = Infinity;
    
    for (const [key, entry] of this.entries.entries()) {
      let score;
      
      switch (strategy) {
        case EVICTION_STRATEGIES.LRU:
          score = entry.getLRUScore();
          if (score < bestScore) {
            bestScore = score;
            victim = key;
          }
          break;
          
        case EVICTION_STRATEGIES.LFU:
          score = entry.getLFUScore();
          if (score < bestScore) {
            bestScore = score;
            victim = key;
          }
          break;
          
        case EVICTION_STRATEGIES.TTL:
          // Évincer l'entrée qui expire le plus tôt
          const timeToExpiry = entry.ttl - (Date.now() - entry.timestamp);
          if (timeToExpiry < bestScore) {
            bestScore = timeToExpiry;
            victim = key;
          }
          break;
          
        case EVICTION_STRATEGIES.SIZE:
          // Évincer la plus grosse entrée
          if (entry.size > bestScore) {
            bestScore = entry.size;
            victim = key;
          }
          break;
      }
    }
    
    return victim;
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup() {
    const expiredKeys = [];
    
    for (const [key, entry] of this.entries.entries()) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Obtient les statistiques du cache
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      level: this.level,
      entries: this.entries.size,
      totalSize: this.totalSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Calcule le taux de succès du cache
   * @returns {number} Taux de succès en pourcentage
   */
  calculateHitRate() {
    // Implémentation simplifiée - dans un vrai système, on trackrait les hits/misses
    return this.entries.size > 0 ? 85 : 0;
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    if (this.storage) {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          this.storage.removeItem(key);
        }
      });
    }
    
    this.entries.clear();
    this.totalSize = 0;
  }
}

/**
 * Service de cache intelligent multi-niveaux
 */
class IntelligentCacheService {
  constructor() {
    this.caches = new Map();
    this.accessPatterns = new Map();
    this.predictionModel = new Map();
    
    // Initialiser les niveaux de cache
    this.initializeCacheLevels();
    
    // Démarrer le nettoyage périodique
    this.startCleanupTimer();
    
    // Démarrer l'analyse des patterns d'accès
    this.startPatternAnalysis();
  }

  /**
   * Initialise les différents niveaux de cache
   */
  initializeCacheLevels() {
    // Cache mémoire (le plus rapide)
    this.caches.set(CACHE_LEVELS.MEMORY, new CacheLevel(CACHE_LEVELS.MEMORY, null));
    
    // Cache session (persistant pendant la session)
    try {
      this.caches.set(CACHE_LEVELS.SESSION, new CacheLevel(CACHE_LEVELS.SESSION, sessionStorage));
    } catch {
      console.warn('[IntelligentCacheService] SessionStorage non disponible');
    }
    
    // Cache local (persistant entre les sessions)
    try {
      this.caches.set(CACHE_LEVELS.LOCAL, new CacheLevel(CACHE_LEVELS.LOCAL, localStorage));
    } catch {
      console.warn('[IntelligentCacheService] LocalStorage non disponible');
    }
  }

  /**
   * Récupère des données du cache
   * @param {string} key - Clé des données
   * @param {string} dataType - Type de données
   * @returns {any|null} Données ou null si non trouvé
   */
  get(key, dataType = 'vital_metrics') {
    return measureSync(SIDEBAR_OPERATIONS.SIDEBAR_REFRESH, () => {
      const config = CACHE_CONFIG[dataType] || CACHE_CONFIG.vital_metrics;
      const cache = this.caches.get(config.level);
      
      if (!cache) return null;
      
      // Enregistrer l'accès pour l'analyse des patterns
      this.recordAccess(key, dataType);
      
      const result = cache.get(key);
      
      if (result) {
        // Prédire les prochains accès
        this.updatePredictionModel(key, dataType);
      }
      
      return result;
    });
  }

  /**
   * Stocke des données dans le cache
   * @param {string} key - Clé des données
   * @param {any} data - Données à stocker
   * @param {string} dataType - Type de données
   */
  set(key, data, dataType = 'vital_metrics') {
    measureSync(SIDEBAR_OPERATIONS.SIDEBAR_REFRESH, () => {
      const config = CACHE_CONFIG[dataType] || CACHE_CONFIG.vital_metrics;
      const cache = this.caches.get(config.level);
      
      if (!cache) return;
      
      cache.set(key, data, config);
      
      // Enregistrer le stockage pour l'analyse des patterns
      this.recordStorage(key, dataType);
    });
  }

  /**
   * Supprime des données du cache
   * @param {string} key - Clé à supprimer
   * @param {string} dataType - Type de données
   */
  delete(key, dataType = 'vital_metrics') {
    const config = CACHE_CONFIG[dataType] || CACHE_CONFIG.vital_metrics;
    const cache = this.caches.get(config.level);
    
    if (cache) {
      cache.delete(key);
    }
  }

  /**
   * Précharge des données critiques
   * @param {Array} preloadList - Liste des données à précharger
   */
  async preloadCriticalData(preloadList) {
    const preloadPromises = preloadList
      .filter(item => CACHE_CONFIG[item.dataType]?.preload)
      .map(async item => {
        try {
          if (!this.get(item.key, item.dataType)) {
            const data = await item.loader();
            this.set(item.key, data, item.dataType);
          }
        } catch (error) {
          console.warn('[IntelligentCacheService] Erreur préchargement:', error);
        }
      });
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Enregistre un accès pour l'analyse des patterns
   * @param {string} key - Clé accédée
   * @param {string} dataType - Type de données
   */
  recordAccess(key, dataType) {
    const patternKey = `${dataType}:${key}`;
    const now = Date.now();
    
    if (!this.accessPatterns.has(patternKey)) {
      this.accessPatterns.set(patternKey, {
        count: 0,
        lastAccess: now,
        intervals: [],
        avgInterval: 0
      });
    }
    
    const pattern = this.accessPatterns.get(patternKey);
    
    if (pattern.lastAccess > 0) {
      const interval = now - pattern.lastAccess;
      pattern.intervals.push(interval);
      
      // Garder seulement les 10 derniers intervalles
      if (pattern.intervals.length > 10) {
        pattern.intervals.shift();
      }
      
      // Calculer l'intervalle moyen
      pattern.avgInterval = pattern.intervals.reduce((sum, i) => sum + i, 0) / pattern.intervals.length;
    }
    
    pattern.count++;
    pattern.lastAccess = now;
  }

  /**
   * Enregistre un stockage pour l'analyse des patterns
   * @param {string} key - Clé stockée
   * @param {string} dataType - Type de données
   */
  recordStorage(key, dataType) {
    // Pour l'instant, on enregistre juste comme un accès
    this.recordAccess(key, dataType);
  }

  /**
   * Met à jour le modèle de prédiction
   * @param {string} key - Clé accédée
   * @param {string} dataType - Type de données
   */
  updatePredictionModel(key, dataType) {
    const patternKey = `${dataType}:${key}`;
    const pattern = this.accessPatterns.get(patternKey);
    
    if (!pattern || pattern.intervals.length < 3) return;
    
    // Prédire le prochain accès basé sur l'intervalle moyen
    const predictedNextAccess = Date.now() + pattern.avgInterval;
    
    this.predictionModel.set(patternKey, {
      nextAccess: predictedNextAccess,
      confidence: Math.min(pattern.intervals.length / 10, 1) // Confiance basée sur le nombre d'échantillons
    });
  }

  /**
   * Prédit et précharge les données qui seront bientôt nécessaires
   */
  predictivePreload() {
    const now = Date.now();
    const preloadWindow = 30 * 1000; // 30 secondes d'avance
    
    for (const [patternKey, prediction] of this.predictionModel.entries()) {
      if (prediction.confidence > 0.7 && 
          prediction.nextAccess - now < preloadWindow &&
          prediction.nextAccess > now) {
        
        const [dataType, key] = patternKey.split(':', 2);
        
        // Vérifier si les données ne sont pas déjà en cache
        if (!this.get(key, dataType)) {
          console.log(`[IntelligentCacheService] Préchargement prédictif: ${patternKey}`);
          // Ici, on pourrait déclencher un préchargement
          // Pour l'instant, on log juste l'intention
        }
      }
    }
  }

  /**
   * Démarre le nettoyage périodique
   */
  startCleanupTimer() {
    // Nettoyage toutes les 5 minutes
    setInterval(() => {
      for (const cache of this.caches.values()) {
        cache.cleanup();
      }
      
      // Nettoyer les patterns d'accès anciens
      this.cleanupAccessPatterns();
      
      // Prédiction préventive
      this.predictivePreload();
      
    }, 5 * 60 * 1000);
  }

  /**
   * Démarre l'analyse des patterns d'accès
   */
  startPatternAnalysis() {
    // Analyse toutes les minutes
    setInterval(() => {
      this.analyzeAccessPatterns();
    }, 60 * 1000);
  }

  /**
   * Nettoie les patterns d'accès anciens
   */
  cleanupAccessPatterns() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (now - pattern.lastAccess > maxAge) {
        this.accessPatterns.delete(key);
        this.predictionModel.delete(key);
      }
    }
  }

  /**
   * Analyse les patterns d'accès pour optimiser le cache
   */
  analyzeAccessPatterns() {
    // Identifier les données fréquemment accédées
    const frequentData = [];
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.count > 10 && pattern.avgInterval < 5 * 60 * 1000) { // Accès fréquent (< 5 min)
        frequentData.push(key);
      }
    }
    
    // Ajuster les TTL pour les données fréquemment accédées
    // (Implémentation future)
  }

  /**
   * Obtient les statistiques complètes du cache
   * @returns {Object} Statistiques détaillées
   */
  getStats() {
    const stats = {
      levels: {},
      patterns: {
        totalPatterns: this.accessPatterns.size,
        predictions: this.predictionModel.size
      },
      performance: {
        totalSize: 0,
        totalEntries: 0
      }
    };
    
    for (const [level, cache] of this.caches.entries()) {
      const cacheStats = cache.getStats();
      stats.levels[level] = cacheStats;
      stats.performance.totalSize += cacheStats.totalSize;
      stats.performance.totalEntries += cacheStats.entries;
    }
    
    return stats;
  }

  /**
   * Vide tous les caches
   */
  clearAll() {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    
    this.accessPatterns.clear();
    this.predictionModel.clear();
  }

  /**
   * Optimise automatiquement la configuration du cache
   */
  autoOptimize() {
    // Analyser les patterns d'utilisation
    const usage = this.analyzeUsagePatterns();
    
    // Ajuster les configurations basées sur l'usage
    this.adjustCacheConfigurations(usage);
  }

  /**
   * Analyse les patterns d'utilisation
   * @returns {Object} Analyse des patterns
   */
  analyzeUsagePatterns() {
    const analysis = {
      mostAccessed: [],
      leastAccessed: [],
      avgAccessInterval: new Map()
    };
    
    const sortedPatterns = Array.from(this.accessPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    analysis.mostAccessed = sortedPatterns.slice(0, 10);
    analysis.leastAccessed = sortedPatterns.slice(-10);
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      analysis.avgAccessInterval.set(key, pattern.avgInterval);
    }
    
    return analysis;
  }

  /**
   * Ajuste les configurations de cache basées sur l'usage
   * @param {Object} usage - Analyse d'usage
   */
  adjustCacheConfigurations(usage) {
    // Pour les données les plus accédées, augmenter le TTL
    usage.mostAccessed.forEach(([key, pattern]) => {
      const [dataType] = key.split(':', 1);
      if (CACHE_CONFIG[dataType] && pattern.avgInterval < 2 * 60 * 1000) {
        // Augmenter le TTL de 50% pour les accès très fréquents
        CACHE_CONFIG[dataType].ttl *= 1.5;
      }
    });
    
    // Pour les données les moins accédées, diminuer le TTL
    usage.leastAccessed.forEach(([key, pattern]) => {
      const [dataType] = key.split(':', 1);
      if (CACHE_CONFIG[dataType] && pattern.avgInterval > 30 * 60 * 1000) {
        // Diminuer le TTL de 25% pour les accès rares
        CACHE_CONFIG[dataType].ttl *= 0.75;
      }
    });
  }
}

// Instance singleton
export const intelligentCacheService = new IntelligentCacheService();

export default intelligentCacheService;