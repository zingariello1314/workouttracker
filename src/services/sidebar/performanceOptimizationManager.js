/**
 * Gestionnaire principal des optimisations de performance pour les modules sidebar historiques
 * Coordonne tous les services d'optimisation et fournit une API unifiée
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4 - Coordination des optimisations de performance
 * 
 * @module services/sidebar/performanceOptimizationManager
 */

import { dataQueryOptimizer } from './dataQueryOptimizer';
import { intelligentCacheService } from './intelligentCacheService';
import { lazyLoadingManager } from './lazyLoadingManager';
import { dataCompressionService } from './dataCompressionService';
import { realTimePerformanceMonitor } from './realTimePerformanceMonitor';
import { measureAsync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';

/**
 * États d'optimisation
 */
export const OPTIMIZATION_STATES = {
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  AUTO: 'auto',
  AGGRESSIVE: 'aggressive'
};

/**
 * Modes de performance
 */
export const PERFORMANCE_MODES = {
  POWER_SAVER: 'power_saver',      // Optimisations maximales
  BALANCED: 'balanced',            // Équilibre performance/fonctionnalités
  PERFORMANCE: 'performance',      // Performance maximale
  DEVELOPER: 'developer'           // Mode debug avec métriques détaillées
};

/**
 * Configuration par mode de performance
 */
const MODE_CONFIGS = {
  [PERFORMANCE_MODES.POWER_SAVER]: {
    queryOptimization: OPTIMIZATION_STATES.AGGRESSIVE,
    caching: OPTIMIZATION_STATES.AGGRESSIVE,
    lazyLoading: OPTIMIZATION_STATES.AGGRESSIVE,
    compression: OPTIMIZATION_STATES.ENABLED,
    monitoring: OPTIMIZATION_STATES.ENABLED,
    maxConcurrentQueries: 2,
    cacheSize: 25,
    compressionThreshold: 200,
    monitoringInterval: 5000
  },
  
  [PERFORMANCE_MODES.BALANCED]: {
    queryOptimization: OPTIMIZATION_STATES.ENABLED,
    caching: OPTIMIZATION_STATES.ENABLED,
    lazyLoading: OPTIMIZATION_STATES.ENABLED,
    compression: OPTIMIZATION_STATES.ENABLED,
    monitoring: OPTIMIZATION_STATES.ENABLED,
    maxConcurrentQueries: 3,
    cacheSize: 50,
    compressionThreshold: 500,
    monitoringInterval: 2000
  },
  
  [PERFORMANCE_MODES.PERFORMANCE]: {
    queryOptimization: OPTIMIZATION_STATES.ENABLED,
    caching: OPTIMIZATION_STATES.AGGRESSIVE,
    lazyLoading: OPTIMIZATION_STATES.ENABLED,
    compression: OPTIMIZATION_STATES.DISABLED,
    monitoring: OPTIMIZATION_STATES.ENABLED,
    maxConcurrentQueries: 5,
    cacheSize: 100,
    compressionThreshold: 1000,
    monitoringInterval: 1000
  },
  
  [PERFORMANCE_MODES.DEVELOPER]: {
    queryOptimization: OPTIMIZATION_STATES.ENABLED,
    caching: OPTIMIZATION_STATES.ENABLED,
    lazyLoading: OPTIMIZATION_STATES.ENABLED,
    compression: OPTIMIZATION_STATES.ENABLED,
    monitoring: OPTIMIZATION_STATES.AGGRESSIVE,
    maxConcurrentQueries: 3,
    cacheSize: 50,
    compressionThreshold: 500,
    monitoringInterval: 500
  }
};

/**
 * Gestionnaire principal des optimisations de performance
 */
class PerformanceOptimizationManager {
  constructor() {
    this.currentMode = PERFORMANCE_MODES.BALANCED;
    this.isInitialized = false;
    this.optimizationServices = {
      queryOptimizer: dataQueryOptimizer,
      cacheService: intelligentCacheService,
      lazyLoader: lazyLoadingManager,
      compressionService: dataCompressionService,
      performanceMonitor: realTimePerformanceMonitor
    };
    
    // Configuration actuelle
    this.config = { ...MODE_CONFIGS[this.currentMode] };
    
    // Statistiques globales
    this.stats = {
      initializationTime: 0,
      totalOptimizations: 0,
      performanceGains: {
        queryTime: 0,
        cacheHits: 0,
        memoryReduction: 0,
        loadTimeReduction: 0
      },
      errors: 0,
      lastOptimization: null
    };
    
    // Événements d'optimisation
    this.eventListeners = new Map();
    
    this.setupEventListeners();
  }

  /**
   * Initialise le gestionnaire d'optimisation
   * @param {Object} options - Options d'initialisation
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('[PerformanceOptimizationManager] Already initialized');
      return;
    }

    const startTime = Date.now();
    
    try {
      console.log('[PerformanceOptimizationManager] Initializing performance optimizations...');
      
      // Appliquer les options
      if (options.mode && MODE_CONFIGS[options.mode]) {
        this.currentMode = options.mode;
        this.config = { ...MODE_CONFIGS[this.currentMode], ...options.config };
      } else if (options.mode && !MODE_CONFIGS[options.mode]) {
        throw new Error(`Invalid performance mode: ${options.mode}`);
      }
      
      // Initialiser les services selon la configuration
      await this.initializeServices();
      
      // Démarrer le monitoring si activé
      if (this.config.monitoring !== OPTIMIZATION_STATES.DISABLED) {
        this.startPerformanceMonitoring();
      }
      
      // Précharger les données critiques
      await this.preloadCriticalData();
      
      this.isInitialized = true;
      this.stats.initializationTime = Date.now() - startTime;
      
      console.log(`[PerformanceOptimizationManager] Initialized in ${this.stats.initializationTime}ms (mode: ${this.currentMode})`);
      
      // Émettre l'événement d'initialisation
      this.emitEvent('initialized', {
        mode: this.currentMode,
        config: this.config,
        initTime: this.stats.initializationTime
      });
      
    } catch (error) {
      console.error('[PerformanceOptimizationManager] Initialization failed:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Initialise les services d'optimisation
   */
  async initializeServices() {
    const { queryOptimizer, cacheService, lazyLoader, performanceMonitor } = this.optimizationServices;
    
    // Configurer l'optimiseur de requêtes
    if (this.config.queryOptimization !== OPTIMIZATION_STATES.DISABLED) {
      queryOptimizer.config.maxConcurrentQueries = this.config.maxConcurrentQueries;
    }
    
    // Configurer le service de cache
    if (this.config.caching !== OPTIMIZATION_STATES.DISABLED) {
      // La configuration du cache est gérée automatiquement
    }
    
    // Configurer le lazy loading
    if (this.config.lazyLoading !== OPTIMIZATION_STATES.DISABLED) {
      lazyLoader.performanceBudget.maxConcurrentLoads = this.config.maxConcurrentQueries;
    }
    
    // Configurer le monitoring
    if (this.config.monitoring !== OPTIMIZATION_STATES.DISABLED) {
      performanceMonitor.updateConfig({
        monitoringInterval: this.config.monitoringInterval,
        autoOptimization: this.config.monitoring === OPTIMIZATION_STATES.AGGRESSIVE,
        detailedLogging: this.currentMode === PERFORMANCE_MODES.DEVELOPER
      });
    }
  }

  /**
   * Démarre le monitoring de performance
   */
  startPerformanceMonitoring() {
    const { performanceMonitor } = this.optimizationServices;
    
    // Démarrer le monitoring
    performanceMonitor.start();
    
    // Écouter les événements d'optimisation automatique
    this.addEventListener('performance:optimize:memory', () => {
      this.optimizeMemoryUsage();
    });
    
    this.addEventListener('performance:optimize:cpu', () => {
      this.optimizeCPUUsage();
    });
    
    this.addEventListener('performance:optimize:rendering', () => {
      this.optimizeRenderingPerformance();
    });
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Écouter les événements de performance du navigateur
    if (typeof window !== 'undefined') {
      window.addEventListener('performance:optimize:memory', (event) => {
        this.handleOptimizationEvent('memory', event.detail);
      });
      
      window.addEventListener('performance:optimize:cpu', (event) => {
        this.handleOptimizationEvent('cpu', event.detail);
      });
      
      window.addEventListener('performance:optimize:rendering', (event) => {
        this.handleOptimizationEvent('rendering', event.detail);
      });
    }
  }

  /**
   * Gère les événements d'optimisation
   * @param {string} type - Type d'optimisation
   * @param {Object} detail - Détails de l'événement
   */
  handleOptimizationEvent(type, detail) {
    console.log(`[PerformanceOptimizationManager] Handling ${type} optimization event`, detail);
    
    switch (type) {
      case 'memory':
        this.optimizeMemoryUsage();
        break;
      case 'cpu':
        this.optimizeCPUUsage();
        break;
      case 'rendering':
        this.optimizeRenderingPerformance();
        break;
    }
  }

  /**
   * Exécute une requête optimisée
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres de la requête
   * @param {Function} queryFunction - Fonction de requête
   * @param {Object} options - Options d'optimisation
   * @returns {Promise<any>} Résultat optimisé
   */
  async executeOptimizedQuery(queryType, params, queryFunction, options = {}) {
    if (!this.isInitialized) {
      console.warn('[PerformanceOptimizationManager] Not initialized, executing query without optimization');
      return await queryFunction(params);
    }

    return await measureAsync(SIDEBAR_OPERATIONS.STATISTICS_CALCULATION, async () => {
      const { queryOptimizer, cacheService, compressionService } = this.optimizationServices;
      
      // Générer une clé de cache
      const cacheKey = this.generateCacheKey(queryType, params);
      
      // Vérifier le cache d'abord si activé
      if (this.config.caching !== OPTIMIZATION_STATES.DISABLED) {
        try {
          const cachedResult = cacheService.get(cacheKey, queryType);
          if (cachedResult !== null) {
            this.stats.performanceGains.cacheHits++;
            return cachedResult;
          }
        } catch (error) {
          console.warn('[PerformanceOptimizationManager] Cache error, falling back to direct query:', error);
        }
      }
      
      // Exécuter la requête optimisée
      let result;
      if (this.config.queryOptimization !== OPTIMIZATION_STATES.DISABLED) {
        result = await queryOptimizer.executeQuery(queryType, params, queryFunction);
      } else {
        result = await queryFunction(params);
      }
      
      // Compresser et mettre en cache le résultat si activé
      if (this.config.caching !== OPTIMIZATION_STATES.DISABLED) {
        try {
          let dataToCache = result;
          
          // Compresser si activé
          if (this.config.compression !== OPTIMIZATION_STATES.DISABLED) {
            const compressed = compressionService.compress(result, queryType);
            if (compressed.compressed) {
              dataToCache = compressed;
              this.stats.performanceGains.memoryReduction += 
                compressed.originalSize - compressed.compressedSize;
            }
          }
          
          cacheService.set(cacheKey, dataToCache, queryType);
        } catch (error) {
          console.warn('[PerformanceOptimizationManager] Cache storage error:', error);
        }
      }
      
      this.stats.totalOptimizations++;
      this.stats.lastOptimization = Date.now();
      
      return result;
    });
  }

  /**
   * Enregistre un module pour le lazy loading
   * @param {string} moduleId - ID du module
   * @param {HTMLElement} element - Élément DOM
   * @param {Function} loadFunction - Fonction de chargement
   */
  registerModuleForLazyLoading(moduleId, element, loadFunction) {
    if (!this.isInitialized || this.config.lazyLoading === OPTIMIZATION_STATES.DISABLED) {
      return;
    }

    const { lazyLoader } = this.optimizationServices;
    
    // Wrapper la fonction de chargement pour ajouter des optimisations
    const optimizedLoadFunction = async () => {
      return await this.executeOptimizedQuery(
        `module_${moduleId}`,
        { moduleId },
        loadFunction,
        { moduleId }
      );
    };
    
    lazyLoader.registerModule(moduleId, element, optimizedLoadFunction);
  }

  /**
   * Précharge les données critiques
   */
  async preloadCriticalData() {
    const { lazyLoader, cacheService } = this.optimizationServices;
    
    // Précharger les modules critiques
    await lazyLoader.preloadCriticalModules();
    
    // Précharger les données critiques dans le cache
    const criticalData = [
      {
        key: 'vital_metrics',
        dataType: 'vital_metrics',
        loader: () => this.loadVitalMetrics()
      },
      {
        key: 'garmin_today',
        dataType: 'garmin_data',
        loader: () => this.loadGarminData()
      }
    ];
    
    await cacheService.preloadCriticalData(criticalData);
  }

  /**
   * Optimise l'utilisation mémoire
   */
  optimizeMemoryUsage() {
    console.log('[PerformanceOptimizationManager] Optimizing memory usage');
    
    const { cacheService, lazyLoader, compressionService } = this.optimizationServices;
    
    // Nettoyer les caches
    cacheService.clearAll();
    
    // Optimiser le lazy loading
    lazyLoader.optimizeMemoryUsage();
    
    // Nettoyer le service de compression
    compressionService.cleanup();
    
    // Forcer le garbage collection si disponible
    if (window.gc) {
      window.gc();
    }
    
    this.stats.totalOptimizations++;
    this.emitEvent('memory_optimized', { timestamp: Date.now() });
  }

  /**
   * Optimise l'utilisation CPU
   */
  optimizeCPUUsage() {
    console.log('[PerformanceOptimizationManager] Optimizing CPU usage');
    
    const { queryOptimizer } = this.optimizationServices;
    
    // Réduire le nombre de requêtes concurrentes
    queryOptimizer.config.maxConcurrentQueries = Math.max(1, 
      Math.floor(queryOptimizer.config.maxConcurrentQueries * 0.7)
    );
    
    // Augmenter les délais de batch
    queryOptimizer.config.batchDelay *= 1.5;
    
    this.stats.totalOptimizations++;
    this.emitEvent('cpu_optimized', { timestamp: Date.now() });
  }

  /**
   * Optimise les performances de rendu
   */
  optimizeRenderingPerformance() {
    console.log('[PerformanceOptimizationManager] Optimizing rendering performance');
    
    // Réduire la fréquence des mises à jour
    this.emitEvent('reduce_animation_frequency', { factor: 0.5 });
    
    // Suspendre les modules non visibles
    const { lazyLoader } = this.optimizationServices;
    lazyLoader.optimizeMemoryUsage();
    
    this.stats.totalOptimizations++;
    this.emitEvent('rendering_optimized', { timestamp: Date.now() });
  }

  /**
   * Change le mode de performance
   * @param {string} mode - Nouveau mode
   */
  async changePerformanceMode(mode) {
    if (!MODE_CONFIGS[mode]) {
      throw new Error(`Invalid performance mode: ${mode}`);
    }

    console.log(`[PerformanceOptimizationManager] Changing mode from ${this.currentMode} to ${mode}`);
    
    const oldMode = this.currentMode;
    this.currentMode = mode;
    this.config = { ...MODE_CONFIGS[mode] };
    
    // Réinitialiser les services avec la nouvelle configuration
    if (this.isInitialized) {
      await this.initializeServices();
    }
    
    this.emitEvent('mode_changed', {
      oldMode,
      newMode: mode,
      config: this.config
    });
  }

  /**
   * Génère une clé de cache unique
   * @param {string} queryType - Type de requête
   * @param {Object} params - Paramètres
   * @returns {string} Clé de cache
   */
  generateCacheKey(queryType, params) {
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
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Fonctions de chargement de données critiques
   */
  
  async loadVitalMetrics() {
    // Implémentation simulée - à remplacer par la vraie logique
    return {
      xp: 1250,
      level: 5,
      streak: 7,
      focus: 85
    };
  }

  async loadGarminData() {
    // Implémentation simulée - à remplacer par la vraie logique
    return {
      calories: { active: 650, resting: 1350, total: 2000 },
      steps: 7500,
      heartRate: { resting: 62, max: 158, avg: 115 }
    };
  }

  /**
   * Gestion des événements
   */
  
  addEventListener(eventType, handler) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(handler);
    
    // Ajouter aussi l'écouteur DOM si c'est un événement global
    if (typeof window !== 'undefined' && eventType.startsWith('performance:')) {
      window.addEventListener(eventType, handler);
    }
  }

  removeEventListener(eventType, handler) {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    
    // Supprimer aussi l'écouteur DOM
    if (typeof window !== 'undefined' && eventType.startsWith('performance:')) {
      window.removeEventListener(eventType, handler);
    }
  }

  emitEvent(eventType, data) {
    const handlers = this.eventListeners.get(eventType) || [];
    
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[PerformanceOptimizationManager] Error in event handler for ${eventType}:`, error);
      }
    });
    
    // Émettre aussi un événement DOM si c'est un événement global
    if (typeof window !== 'undefined' && eventType.startsWith('performance:')) {
      window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    }
  }

  /**
   * Obtient un rapport de performance complet
   * @returns {Object} Rapport détaillé
   */
  getPerformanceReport() {
    if (!this.isInitialized) {
      return { error: 'Not initialized' };
    }

    const { queryOptimizer, cacheService, lazyLoader, compressionService, performanceMonitor } = this.optimizationServices;
    
    return {
      timestamp: Date.now(),
      mode: this.currentMode,
      config: this.config,
      stats: this.stats,
      services: {
        queryOptimizer: queryOptimizer.getStats(),
        cacheService: cacheService.getStats(),
        lazyLoader: lazyLoader.getStats(),
        compressionService: compressionService.getStats(),
        performanceMonitor: performanceMonitor.getPerformanceReport()
      },
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  /**
   * Génère des recommandations d'optimisation
   * @returns {Array} Liste de recommandations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    if (!this.isInitialized) {
      return recommendations;
    }
    
    const { queryOptimizer, cacheService, performanceMonitor } = this.optimizationServices;
    
    // Obtenir les statistiques directement sans appeler getPerformanceReport
    const cacheStats = cacheService.getStats();
    const queryStats = queryOptimizer.getStats();
    const perfReport = performanceMonitor.isMonitoring ? performanceMonitor.getPerformanceReport() : null;
    
    // Analyser les performances du cache
    if (cacheStats && cacheStats.performance) {
      const hitRate = parseFloat(cacheStats.performance.hitRate || '0');
      if (hitRate < 70) {
        recommendations.push({
          type: 'cache',
          priority: 'medium',
          message: `Cache hit rate is low (${hitRate}%). Consider increasing cache size or TTL.`,
          action: 'increase_cache_size'
        });
      }
    }
    
    // Analyser les performances des requêtes
    if (queryStats && queryStats.averageResponseTime > 200) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        message: `Average query response time is high (${queryStats.averageResponseTime}ms). Consider optimizing queries.`,
        action: 'optimize_queries'
      });
    }
    
    // Analyser l'utilisation mémoire
    if (perfReport && perfReport.system && perfReport.system.memory.percentage > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: `Memory usage is high (${perfReport.system.memory.percentage}%). Consider enabling aggressive caching or switching to power saver mode.`,
        action: 'optimize_memory'
      });
    }
    
    return recommendations;
  }

  /**
   * Applique automatiquement les recommandations
   * @param {Array} recommendations - Recommandations à appliquer
   */
  async applyRecommendations(recommendations) {
    for (const rec of recommendations) {
      try {
        switch (rec.action) {
          case 'increase_cache_size':
            // Augmenter la taille du cache
            this.config.cacheSize = Math.min(200, this.config.cacheSize * 1.5);
            break;
            
          case 'optimize_queries':
            // Réduire le nombre de requêtes concurrentes
            this.config.maxConcurrentQueries = Math.max(1, this.config.maxConcurrentQueries - 1);
            break;
            
          case 'optimize_memory':
            // Déclencher une optimisation mémoire
            this.optimizeMemoryUsage();
            break;
        }
        
        console.log(`[PerformanceOptimizationManager] Applied recommendation: ${rec.action}`);
      } catch (error) {
        console.error(`[PerformanceOptimizationManager] Failed to apply recommendation ${rec.action}:`, error);
      }
    }
    
    // Réinitialiser les services avec la nouvelle configuration
    await this.initializeServices();
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    console.log('[PerformanceOptimizationManager] Cleaning up resources');
    
    const { performanceMonitor, lazyLoader, compressionService, cacheService } = this.optimizationServices;
    
    // Arrêter le monitoring
    performanceMonitor.stop();
    
    // Nettoyer les services
    lazyLoader.cleanup();
    compressionService.cleanup();
    cacheService.clearAll();
    
    // Nettoyer les événements
    this.eventListeners.clear();
    
    this.isInitialized = false;
  }

  /**
   * Obtient les statistiques globales
   * @returns {Object} Statistiques
   */
  getStats() {
    return { ...this.stats };
  }
}

// Instance singleton
export const performanceOptimizationManager = new PerformanceOptimizationManager();

export default performanceOptimizationManager;