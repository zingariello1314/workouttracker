/**
 * Gestionnaire de lazy loading pour les modules sidebar historiques
 * Implémente le chargement différé basé sur la visibilité et la priorité
 * 
 * Requirements: 14.3 - Lazy loading des modules non visibles
 * 
 * @module services/sidebar/lazyLoadingManager
 */

import { measureAsync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';

/**
 * États de chargement des modules
 */
export const LOADING_STATES = {
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  SUSPENDED: 'suspended'
};

/**
 * Priorités de chargement
 */
export const LOADING_PRIORITIES = {
  CRITICAL: 1,    // Modules vitaux (toujours visibles)
  HIGH: 2,        // Modules importants (above the fold)
  MEDIUM: 3,      // Modules standards (visible avec scroll)
  LOW: 4,         // Modules secondaires (far below fold)
  BACKGROUND: 5   // Modules de fond (préchargement)
};

/**
 * Configuration des modules par type
 */
const MODULE_CONFIG = {
  // Module Enregistrer Session - Critique (position 1)
  'session-recorder': {
    priority: LOADING_PRIORITIES.CRITICAL,
    preload: true,
    suspendable: false,
    intersectionThreshold: 0.1,
    loadingStrategy: 'immediate'
  },
  
  // Module Progression Lecture - Haute priorité (position 3)
  'reading-progress': {
    priority: LOADING_PRIORITIES.HIGH,
    preload: true,
    suspendable: true,
    intersectionThreshold: 0.2,
    loadingStrategy: 'intersection'
  },
  
  // Module Métriques Garmin - Haute priorité (position 5)
  'garmin-metrics': {
    priority: LOADING_PRIORITIES.HIGH,
    preload: true,
    suspendable: true,
    intersectionThreshold: 0.2,
    loadingStrategy: 'intersection'
  },
  
  // Module Quêtes Interactives - Moyenne priorité (position 7)
  'interactive-quests': {
    priority: LOADING_PRIORITIES.MEDIUM,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.3,
    loadingStrategy: 'intersection'
  },
  
  // Module Évolution Patrimoine - Moyenne priorité (position 9)
  'patrimony-evolution': {
    priority: LOADING_PRIORITIES.MEDIUM,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.3,
    loadingStrategy: 'intersection'
  },
  
  // Module Liste Courses - Basse priorité (position 11)
  'shopping-list': {
    priority: LOADING_PRIORITIES.LOW,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.4,
    loadingStrategy: 'intersection'
  },
  
  // Modules avancés - Priorité de fond
  'active-reading-session': {
    priority: LOADING_PRIORITIES.BACKGROUND,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.5,
    loadingStrategy: 'lazy'
  },
  
  'training-day': {
    priority: LOADING_PRIORITIES.BACKGROUND,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.5,
    loadingStrategy: 'lazy'
  },
  
  'creativity-projects': {
    priority: LOADING_PRIORITIES.BACKGROUND,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.5,
    loadingStrategy: 'lazy'
  },
  
  'global-performance': {
    priority: LOADING_PRIORITIES.BACKGROUND,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.5,
    loadingStrategy: 'lazy'
  },
  
  'express-learning': {
    priority: LOADING_PRIORITIES.BACKGROUND,
    preload: false,
    suspendable: true,
    intersectionThreshold: 0.5,
    loadingStrategy: 'lazy'
  }
};

/**
 * Gestionnaire d'état d'un module
 */
class ModuleState {
  constructor(moduleId, config) {
    this.moduleId = moduleId;
    this.config = config;
    this.state = LOADING_STATES.NOT_LOADED;
    this.data = null;
    this.error = null;
    this.loadPromise = null;
    this.lastVisible = null;
    this.visibilityDuration = 0;
    this.loadAttempts = 0;
    this.suspendedAt = null;
    
    // Métriques de performance
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      dataSize: 0,
      memoryUsage: 0
    };
  }

  /**
   * Met à jour l'état de visibilité
   * @param {boolean} isVisible - Module visible
   * @param {number} intersectionRatio - Ratio d'intersection
   */
  updateVisibility(isVisible, intersectionRatio = 0) {
    const now = Date.now();
    
    if (isVisible && !this.lastVisible) {
      this.lastVisible = now;
    } else if (!isVisible && this.lastVisible) {
      this.visibilityDuration += now - this.lastVisible;
      this.lastVisible = null;
    }
    
    // Décider si le module doit être suspendu
    if (!isVisible && this.config.suspendable && this.state === LOADING_STATES.LOADED) {
      const invisibleTime = now - (this.lastVisible || now);
      if (invisibleTime > 30000) { // 30 secondes d'invisibilité
        this.suspend();
      }
    }
  }

  /**
   * Suspend le module pour libérer la mémoire
   */
  suspend() {
    if (this.state === LOADING_STATES.LOADED && this.config.suspendable) {
      this.state = LOADING_STATES.SUSPENDED;
      this.suspendedAt = Date.now();
      
      // Libérer les données non critiques
      if (this.data && typeof this.data === 'object') {
        // Garder seulement les données essentielles
        this.data = {
          ...this.data,
          _suspended: true,
          _suspendedAt: this.suspendedAt
        };
      }
    }
  }

  /**
   * Réactive le module suspendu
   */
  resume() {
    if (this.state === LOADING_STATES.SUSPENDED) {
      this.state = LOADING_STATES.LOADED;
      this.suspendedAt = null;
      
      if (this.data && this.data._suspended) {
        delete this.data._suspended;
        delete this.data._suspendedAt;
      }
    }
  }

  /**
   * Vérifie si le module doit être chargé
   * @param {boolean} isVisible - Module visible
   * @param {number} intersectionRatio - Ratio d'intersection
   * @returns {boolean} Doit être chargé
   */
  shouldLoad(isVisible, intersectionRatio = 0) {
    if (this.state === LOADING_STATES.LOADED || this.state === LOADING_STATES.LOADING) {
      return false;
    }
    
    switch (this.config.loadingStrategy) {
      case 'immediate':
        return true;
        
      case 'intersection':
        return isVisible && intersectionRatio >= this.config.intersectionThreshold;
        
      case 'lazy':
        return isVisible && intersectionRatio >= this.config.intersectionThreshold;
        
      default:
        return false;
    }
  }
}

/**
 * Gestionnaire de lazy loading pour les modules sidebar
 */
class LazyLoadingManager {
  constructor() {
    this.modules = new Map();
    this.intersectionObserver = null;
    this.loadingQueue = [];
    this.isProcessingQueue = false;
    this.performanceBudget = {
      maxConcurrentLoads: 3,
      maxLoadTime: 2000,      // 2 secondes max par module
      maxMemoryUsage: 50 * 1024 * 1024  // 50MB max
    };
    
    // Statistiques
    this.stats = {
      totalModules: 0,
      loadedModules: 0,
      suspendedModules: 0,
      failedModules: 0,
      averageLoadTime: 0,
      memoryUsage: 0
    };
    
    this.initializeIntersectionObserver();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialise l'Intersection Observer
   */
  initializeIntersectionObserver() {
    if (!window.IntersectionObserver) {
      console.warn('[LazyLoadingManager] IntersectionObserver non supporté');
      return;
    }

    const options = {
      root: null,
      rootMargin: '100px', // Commencer à charger 100px avant que le module soit visible
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const moduleId = entry.target.dataset.moduleId;
        if (moduleId && this.modules.has(moduleId)) {
          this.handleIntersection(moduleId, entry);
        }
      });
    }, options);
  }

  /**
   * Démarre le monitoring de performance
   */
  startPerformanceMonitoring() {
    // Monitoring toutes les 30 secondes
    setInterval(() => {
      this.updatePerformanceStats();
      this.optimizeMemoryUsage();
    }, 30000);
  }

  /**
   * Enregistre un module pour le lazy loading
   * @param {string} moduleId - ID du module
   * @param {HTMLElement} element - Élément DOM du module
   * @param {Function} loadFunction - Fonction de chargement des données
   */
  registerModule(moduleId, element, loadFunction) {
    const config = MODULE_CONFIG[moduleId] || MODULE_CONFIG['express-learning'];
    const moduleState = new ModuleState(moduleId, config);
    
    moduleState.loadFunction = loadFunction;
    moduleState.element = element;
    
    this.modules.set(moduleId, moduleState);
    this.stats.totalModules++;
    
    // Observer l'élément si Intersection Observer est disponible
    if (this.intersectionObserver && element) {
      this.intersectionObserver.observe(element);
    }
    
    // Charger immédiatement si c'est un module critique ou préchargeable
    if (config.loadingStrategy === 'immediate' || config.preload) {
      this.loadModule(moduleId);
    }
  }

  /**
   * Désenregistre un module
   * @param {string} moduleId - ID du module
   */
  unregisterModule(moduleId) {
    const moduleState = this.modules.get(moduleId);
    
    if (moduleState) {
      // Arrêter d'observer l'élément
      if (this.intersectionObserver && moduleState.element) {
        this.intersectionObserver.unobserve(moduleState.element);
      }
      
      this.modules.delete(moduleId);
      this.stats.totalModules--;
      
      if (moduleState.state === LOADING_STATES.LOADED) {
        this.stats.loadedModules--;
      } else if (moduleState.state === LOADING_STATES.SUSPENDED) {
        this.stats.suspendedModules--;
      } else if (moduleState.state === LOADING_STATES.ERROR) {
        this.stats.failedModules--;
      }
    }
  }

  /**
   * Gère les événements d'intersection
   * @param {string} moduleId - ID du module
   * @param {IntersectionObserverEntry} entry - Entrée d'intersection
   */
  handleIntersection(moduleId, entry) {
    const moduleState = this.modules.get(moduleId);
    if (!moduleState) return;

    const isVisible = entry.isIntersecting;
    const intersectionRatio = entry.intersectionRatio;
    
    // Mettre à jour l'état de visibilité
    moduleState.updateVisibility(isVisible, intersectionRatio);
    
    // Décider du chargement
    if (moduleState.shouldLoad(isVisible, intersectionRatio)) {
      this.loadModule(moduleId);
    }
    
    // Réactiver si suspendu et visible
    if (isVisible && moduleState.state === LOADING_STATES.SUSPENDED) {
      moduleState.resume();
    }
  }

  /**
   * Charge un module
   * @param {string} moduleId - ID du module
   * @returns {Promise<any>} Données du module
   */
  async loadModule(moduleId) {
    const moduleState = this.modules.get(moduleId);
    if (!moduleState) {
      throw new Error(`Module ${moduleId} non enregistré`);
    }

    // Éviter les chargements multiples
    if (moduleState.state === LOADING_STATES.LOADING) {
      return moduleState.loadPromise;
    }
    
    if (moduleState.state === LOADING_STATES.LOADED) {
      return moduleState.data;
    }

    // Vérifier le budget de performance
    if (!this.canLoadModule()) {
      this.queueModule(moduleId);
      return null;
    }

    moduleState.state = LOADING_STATES.LOADING;
    moduleState.loadAttempts++;
    
    const startTime = Date.now();
    
    try {
      moduleState.loadPromise = measureAsync(
        SIDEBAR_OPERATIONS.INITIAL_LOAD,
        async () => {
          // Appliquer un timeout basé sur la priorité
          const timeout = this.getLoadTimeout(moduleState.config.priority);
          
          return Promise.race([
            moduleState.loadFunction(),
            this.createTimeoutPromise(timeout)
          ]);
        }
      );

      const data = await moduleState.loadPromise;
      
      moduleState.data = data;
      moduleState.state = LOADING_STATES.LOADED;
      moduleState.error = null;
      
      // Calculer les métriques
      moduleState.metrics.loadTime = Date.now() - startTime;
      moduleState.metrics.dataSize = this.calculateDataSize(data);
      
      this.stats.loadedModules++;
      this.updateAverageLoadTime(moduleState.metrics.loadTime);
      
      // Traiter la queue si nécessaire
      this.processLoadingQueue();
      
      return data;
      
    } catch (error) {
      moduleState.state = LOADING_STATES.ERROR;
      moduleState.error = error;
      moduleState.loadPromise = null;
      
      this.stats.failedModules++;
      
      console.error(`[LazyLoadingManager] Erreur chargement module ${moduleId}:`, error);
      
      // Retry logic pour les modules critiques
      if (moduleState.config.priority <= LOADING_PRIORITIES.HIGH && moduleState.loadAttempts < 3) {
        setTimeout(() => {
          this.loadModule(moduleId);
        }, 1000 * moduleState.loadAttempts);
      }
      
      throw error;
    }
  }

  /**
   * Vérifie si un module peut être chargé selon le budget de performance
   * @returns {boolean} Peut charger
   */
  canLoadModule() {
    const currentLoading = Array.from(this.modules.values())
      .filter(m => m.state === LOADING_STATES.LOADING).length;
    
    return currentLoading < this.performanceBudget.maxConcurrentLoads;
  }

  /**
   * Ajoute un module à la queue de chargement
   * @param {string} moduleId - ID du module
   */
  queueModule(moduleId) {
    if (!this.loadingQueue.includes(moduleId)) {
      const moduleState = this.modules.get(moduleId);
      
      // Insérer selon la priorité
      const insertIndex = this.loadingQueue.findIndex(queuedId => {
        const queuedState = this.modules.get(queuedId);
        return queuedState.config.priority > moduleState.config.priority;
      });
      
      if (insertIndex === -1) {
        this.loadingQueue.push(moduleId);
      } else {
        this.loadingQueue.splice(insertIndex, 0, moduleId);
      }
    }
  }

  /**
   * Traite la queue de chargement
   */
  async processLoadingQueue() {
    if (this.isProcessingQueue || this.loadingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.loadingQueue.length > 0 && this.canLoadModule()) {
        const moduleId = this.loadingQueue.shift();
        
        try {
          await this.loadModule(moduleId);
        } catch (error) {
          // Continuer avec le prochain module même en cas d'erreur
          console.warn(`[LazyLoadingManager] Erreur queue module ${moduleId}:`, error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Obtient le timeout de chargement selon la priorité
   * @param {number} priority - Priorité du module
   * @returns {number} Timeout en millisecondes
   */
  getLoadTimeout(priority) {
    switch (priority) {
      case LOADING_PRIORITIES.CRITICAL:
        return 1000;  // 1 seconde
      case LOADING_PRIORITIES.HIGH:
        return 2000;  // 2 secondes
      case LOADING_PRIORITIES.MEDIUM:
        return 3000;  // 3 secondes
      case LOADING_PRIORITIES.LOW:
        return 5000;  // 5 secondes
      case LOADING_PRIORITIES.BACKGROUND:
        return 10000; // 10 secondes
      default:
        return 2000;
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
        reject(new Error(`Module load timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Calcule la taille approximative des données
   * @param {any} data - Données à mesurer
   * @returns {number} Taille en bytes
   */
  calculateDataSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Approximation UTF-16
    } catch {
      return 1000; // Taille par défaut
    }
  }

  /**
   * Met à jour la moyenne des temps de chargement
   * @param {number} loadTime - Temps de chargement
   */
  updateAverageLoadTime(loadTime) {
    const currentAvg = this.stats.averageLoadTime;
    const loadedCount = this.stats.loadedModules;
    
    this.stats.averageLoadTime = 
      (currentAvg * (loadedCount - 1) + loadTime) / loadedCount;
  }

  /**
   * Met à jour les statistiques de performance
   */
  updatePerformanceStats() {
    let totalMemory = 0;
    
    for (const moduleState of this.modules.values()) {
      if (moduleState.state === LOADING_STATES.LOADED) {
        totalMemory += moduleState.metrics.dataSize;
      }
    }
    
    this.stats.memoryUsage = totalMemory;
  }

  /**
   * Optimise l'utilisation mémoire
   */
  optimizeMemoryUsage() {
    if (this.stats.memoryUsage > this.performanceBudget.maxMemoryUsage) {
      // Suspendre les modules les moins utilisés
      const candidates = Array.from(this.modules.values())
        .filter(m => m.state === LOADING_STATES.LOADED && m.config.suspendable)
        .sort((a, b) => a.visibilityDuration - b.visibilityDuration);
      
      for (const moduleState of candidates) {
        moduleState.suspend();
        this.stats.suspendedModules++;
        this.stats.loadedModules--;
        
        if (this.stats.memoryUsage <= this.performanceBudget.maxMemoryUsage * 0.8) {
          break;
        }
      }
    }
  }

  /**
   * Précharge les modules critiques
   * @returns {Promise<void>} Promesse de préchargement
   */
  async preloadCriticalModules() {
    const criticalModules = Array.from(this.modules.entries())
      .filter(([_, state]) => state.config.preload)
      .sort((a, b) => a[1].config.priority - b[1].config.priority);
    
    const preloadPromises = criticalModules.map(([moduleId, _]) =>
      this.loadModule(moduleId).catch(error => {
        console.warn(`[LazyLoadingManager] Erreur préchargement ${moduleId}:`, error);
        return null;
      })
    );
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Force le chargement de tous les modules visibles
   */
  loadVisibleModules() {
    for (const [moduleId, moduleState] of this.modules.entries()) {
      if (moduleState.lastVisible && moduleState.state === LOADING_STATES.NOT_LOADED) {
        this.loadModule(moduleId);
      }
    }
  }

  /**
   * Obtient l'état d'un module
   * @param {string} moduleId - ID du module
   * @returns {Object|null} État du module
   */
  getModuleState(moduleId) {
    const moduleState = this.modules.get(moduleId);
    
    if (!moduleState) return null;
    
    return {
      moduleId,
      state: moduleState.state,
      loadAttempts: moduleState.loadAttempts,
      metrics: { ...moduleState.metrics },
      isVisible: moduleState.lastVisible !== null,
      visibilityDuration: moduleState.visibilityDuration,
      error: moduleState.error?.message
    };
  }

  /**
   * Obtient les statistiques complètes
   * @returns {Object} Statistiques détaillées
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.loadingQueue.length,
      modules: Array.from(this.modules.keys()).map(id => this.getModuleState(id))
    };
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.modules.clear();
    this.loadingQueue = [];
  }
}

// Instance singleton
export const lazyLoadingManager = new LazyLoadingManager();

export default lazyLoadingManager;