/**
 * Service de gestion d'erreurs avancée pour les modules sidebar historiques
 * Centralise la gestion des erreurs, retry automatique et notifications utilisateur
 * 
 * Requirements: 14.5 - Gestion gracieuse des erreurs
 * 
 * @module services/sidebar/errorHandlingService
 */

import { performanceOptimizationManager } from './performanceOptimizationManager';

/**
 * Types d'erreurs système
 */
export const SYSTEM_ERROR_TYPES = {
  NAVIGATION_FAILED: 'navigation_failed',
  SYNC_FAILED: 'sync_failed',
  DATA_LOAD_FAILED: 'data_load_failed',
  PERFORMANCE_DEGRADED: 'performance_degraded',
  CACHE_CORRUPTED: 'cache_corrupted',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error'
};

/**
 * Stratégies de récupération d'erreur
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  GRACEFUL_DEGRADATION: 'graceful_degradation',
  USER_INTERVENTION: 'user_intervention',
  SYSTEM_RESET: 'system_reset'
};

/**
 * Configuration des erreurs système
 */
const SYSTEM_ERROR_CONFIG = {
  [SYSTEM_ERROR_TYPES.NAVIGATION_FAILED]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 2,
    retryDelay: 500,
    fallbackAction: 'scroll_to_top',
    userNotification: true,
    severity: 'medium'
  },
  
  [SYSTEM_ERROR_TYPES.SYNC_FAILED]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 5,
    retryDelay: 2000,
    fallbackAction: 'use_cached_data',
    userNotification: false,
    severity: 'low'
  },
  
  [SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED]: {
    strategy: RECOVERY_STRATEGIES.FALLBACK,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackAction: 'show_placeholder',
    userNotification: true,
    severity: 'medium'
  },
  
  [SYSTEM_ERROR_TYPES.PERFORMANCE_DEGRADED]: {
    strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
    maxRetries: 0,
    retryDelay: 0,
    fallbackAction: 'reduce_features',
    userNotification: false,
    severity: 'low'
  },
  
  [SYSTEM_ERROR_TYPES.CACHE_CORRUPTED]: {
    strategy: RECOVERY_STRATEGIES.SYSTEM_RESET,
    maxRetries: 1,
    retryDelay: 0,
    fallbackAction: 'clear_cache',
    userNotification: true,
    severity: 'high'
  },
  
  [SYSTEM_ERROR_TYPES.NETWORK_ERROR]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 3,
    retryDelay: 5000,
    fallbackAction: 'offline_mode',
    userNotification: true,
    severity: 'medium'
  },
  
  [SYSTEM_ERROR_TYPES.TIMEOUT_ERROR]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 2,
    retryDelay: 1000,
    fallbackAction: 'reduce_timeout',
    userNotification: false,
    severity: 'low'
  }
};

/**
 * Service de gestion d'erreurs avancée
 */
class ErrorHandlingService {
  constructor() {
    this.isInitialized = false;
    this.errorHistory = [];
    this.activeRetries = new Map();
    this.errorListeners = new Map();
    this.notificationQueue = [];
    
    // Configuration
    this.config = {
      maxErrorHistory: 100,
      notificationDelay: 2000,
      retryBackoffMultiplier: 1.5,
      maxRetryDelay: 30000,
      errorReportingEnabled: true,
      debugMode: process.env.NODE_ENV === 'development'
    };
    
    // Statistiques
    this.stats = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      errorsByType: {},
      averageRecoveryTime: 0,
      lastError: null
    };
    
    // Timers
    this.notificationTimer = null;
    this.cleanupTimer = null;
    
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialise le service de gestion d'erreurs
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('[ErrorHandlingService] Initializing error handling service...');
    
    try {
      // Démarrer le nettoyage périodique
      this.startPeriodicCleanup();
      
      // Démarrer le processeur de notifications
      this.startNotificationProcessor();
      
      // Écouter les événements de performance
      this.setupPerformanceErrorHandling();
      
      this.isInitialized = true;
      console.log('[ErrorHandlingService] Error handling service initialized');
      
    } catch (error) {
      console.error('[ErrorHandlingService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Configure les gestionnaires d'erreurs globaux
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Erreurs JavaScript non capturées
    window.addEventListener('error', (event) => {
      this.handleGlobalError({
        type: SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED,
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'global_error'
      });
    });
    
    // Promesses rejetées non capturées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError({
        type: SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED,
        error: event.reason,
        message: event.reason?.message || 'Unhandled promise rejection',
        source: 'unhandled_rejection'
      });
    });
    
    // Erreurs de navigation
    window.addEventListener('sidebar:navigation:error', (event) => {
      this.handleSystemError(SYSTEM_ERROR_TYPES.NAVIGATION_FAILED, event.detail);
    });
    
    // Erreurs de synchronisation
    window.addEventListener('sidebar:sync:error', (event) => {
      this.handleSystemError(SYSTEM_ERROR_TYPES.SYNC_FAILED, event.detail);
    });
    
    // Erreurs de performance
    window.addEventListener('performance:error', (event) => {
      this.handleSystemError(SYSTEM_ERROR_TYPES.PERFORMANCE_DEGRADED, event.detail);
    });
  }

  /**
   * Configure la gestion d'erreurs de performance
   */
  setupPerformanceErrorHandling() {
    // Écouter les événements du gestionnaire de performance
    if (performanceOptimizationManager) {
      performanceOptimizationManager.addEventListener('performance:error', (data) => {
        this.handleSystemError(SYSTEM_ERROR_TYPES.PERFORMANCE_DEGRADED, data);
      });
      
      performanceOptimizationManager.addEventListener('cache:error', (data) => {
        this.handleSystemError(SYSTEM_ERROR_TYPES.CACHE_CORRUPTED, data);
      });
    }
  }

  /**
   * Gère une erreur globale
   */
  handleGlobalError(errorData) {
    console.error('[ErrorHandlingService] Global error:', errorData);
    
    // Enregistrer l'erreur
    this.recordError(errorData.type, errorData);
    
    // Appliquer la stratégie de récupération
    this.applyRecoveryStrategy(errorData.type, errorData);
  }

  /**
   * Gère une erreur système spécifique
   */
  async handleSystemError(errorType, errorData = {}) {
    const config = SYSTEM_ERROR_CONFIG[errorType];
    if (!config) {
      console.warn(`[ErrorHandlingService] Unknown error type: ${errorType}`);
      return;
    }

    console.log(`[ErrorHandlingService] Handling system error: ${errorType}`, errorData);
    
    // Enregistrer l'erreur
    this.recordError(errorType, errorData);
    
    // Vérifier si un retry est déjà en cours
    if (this.activeRetries.has(errorType)) {
      console.log(`[ErrorHandlingService] Retry already active for ${errorType}`);
      return;
    }
    
    // Appliquer la stratégie de récupération
    const recovered = await this.applyRecoveryStrategy(errorType, errorData);
    
    // Notifier l'utilisateur si nécessaire
    if (config.userNotification && !recovered) {
      this.queueUserNotification(errorType, errorData);
    }
    
    return recovered;
  }

  /**
   * Applique la stratégie de récupération appropriée
   */
  async applyRecoveryStrategy(errorType, errorData) {
    const config = SYSTEM_ERROR_CONFIG[errorType];
    if (!config) return false;

    const startTime = Date.now();
    let recovered = false;
    
    try {
      switch (config.strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          recovered = await this.executeRetryStrategy(errorType, errorData, config);
          break;
          
        case RECOVERY_STRATEGIES.FALLBACK:
          recovered = await this.executeFallbackStrategy(errorType, errorData, config);
          break;
          
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
          recovered = await this.executeGracefulDegradation(errorType, errorData, config);
          break;
          
        case RECOVERY_STRATEGIES.SYSTEM_RESET:
          recovered = await this.executeSystemReset(errorType, errorData, config);
          break;
          
        case RECOVERY_STRATEGIES.USER_INTERVENTION:
          recovered = await this.requestUserIntervention(errorType, errorData, config);
          break;
          
        default:
          console.warn(`[ErrorHandlingService] Unknown recovery strategy: ${config.strategy}`);
      }
      
      // Mettre à jour les statistiques
      const recoveryTime = Date.now() - startTime;
      this.updateRecoveryStats(recovered, recoveryTime);
      
    } catch (recoveryError) {
      console.error(`[ErrorHandlingService] Recovery strategy failed for ${errorType}:`, recoveryError);
      recovered = false;
    }
    
    return recovered;
  }

  /**
   * Exécute la stratégie de retry
   */
  async executeRetryStrategy(errorType, errorData, config) {
    const retryKey = `${errorType}_${JSON.stringify(errorData)}`;
    
    if (this.activeRetries.has(retryKey)) {
      return false;
    }
    
    this.activeRetries.set(retryKey, {
      attempts: 0,
      maxRetries: config.maxRetries,
      startTime: Date.now()
    });
    
    try {
      for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        console.log(`[ErrorHandlingService] Retry attempt ${attempt}/${config.maxRetries} for ${errorType}`);
        
        // Attendre le délai de retry avec backoff
        if (attempt > 1) {
          const delay = Math.min(
            config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, attempt - 1),
            this.config.maxRetryDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Tenter la récupération
        const success = await this.attemptRecovery(errorType, errorData);
        
        if (success) {
          console.log(`[ErrorHandlingService] Recovery successful for ${errorType} after ${attempt} attempts`);
          this.stats.recoveredErrors++;
          return true;
        }
        
        this.activeRetries.get(retryKey).attempts = attempt;
      }
      
      console.warn(`[ErrorHandlingService] All retry attempts failed for ${errorType}`);
      this.stats.failedRecoveries++;
      return false;
      
    } finally {
      this.activeRetries.delete(retryKey);
    }
  }

  /**
   * Exécute la stratégie de fallback
   */
  async executeFallbackStrategy(errorType, errorData, config) {
    console.log(`[ErrorHandlingService] Executing fallback strategy for ${errorType}: ${config.fallbackAction}`);
    
    try {
      switch (config.fallbackAction) {
        case 'show_placeholder':
          this.showPlaceholderContent(errorData);
          break;
          
        case 'use_cached_data':
          return await this.useCachedData(errorData);
          
        case 'offline_mode':
          this.enableOfflineMode();
          break;
          
        case 'scroll_to_top':
          this.scrollToTop();
          break;
          
        default:
          console.warn(`[ErrorHandlingService] Unknown fallback action: ${config.fallbackAction}`);
          return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(`[ErrorHandlingService] Fallback strategy failed:`, error);
      return false;
    }
  }

  /**
   * Exécute la dégradation gracieuse
   */
  async executeGracefulDegradation(errorType, errorData, config) {
    console.log(`[ErrorHandlingService] Executing graceful degradation for ${errorType}`);
    
    try {
      switch (config.fallbackAction) {
        case 'reduce_features':
          this.reduceFeatures();
          break;
          
        case 'reduce_timeout':
          this.reduceTimeouts();
          break;
          
        default:
          console.warn(`[ErrorHandlingService] Unknown degradation action: ${config.fallbackAction}`);
          return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(`[ErrorHandlingService] Graceful degradation failed:`, error);
      return false;
    }
  }

  /**
   * Exécute la réinitialisation système
   */
  async executeSystemReset(errorType, errorData, config) {
    console.log(`[ErrorHandlingService] Executing system reset for ${errorType}`);
    
    try {
      switch (config.fallbackAction) {
        case 'clear_cache':
          await this.clearSystemCache();
          break;
          
        case 'reset_state':
          this.resetApplicationState();
          break;
          
        default:
          console.warn(`[ErrorHandlingService] Unknown reset action: ${config.fallbackAction}`);
          return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(`[ErrorHandlingService] System reset failed:`, error);
      return false;
    }
  }

  /**
   * Demande l'intervention de l'utilisateur
   */
  async requestUserIntervention(errorType, errorData, config) {
    console.log(`[ErrorHandlingService] Requesting user intervention for ${errorType}`);
    
    // Afficher une notification persistante
    this.showPersistentNotification(errorType, errorData);
    
    return false; // L'utilisateur doit agir manuellement
  }

  /**
   * Tente la récupération pour un type d'erreur spécifique
   */
  async attemptRecovery(errorType, errorData) {
    switch (errorType) {
      case SYSTEM_ERROR_TYPES.NAVIGATION_FAILED:
        return await this.recoverNavigation(errorData);
        
      case SYSTEM_ERROR_TYPES.SYNC_FAILED:
        return await this.recoverSync(errorData);
        
      case SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED:
        return await this.recoverDataLoad(errorData);
        
      case SYSTEM_ERROR_TYPES.NETWORK_ERROR:
        return await this.recoverNetwork(errorData);
        
      default:
        return false;
    }
  }

  /**
   * Récupération de navigation
   */
  async recoverNavigation(errorData) {
    try {
      // Réessayer la navigation
      if (errorData.targetModule && errorData.targetTab) {
        const event = new CustomEvent('sidebar:navigate:retry', {
          detail: {
            moduleId: errorData.targetModule,
            tab: errorData.targetTab,
            subtab: errorData.targetSubtab
          }
        });
        
        window.dispatchEvent(event);
        
        // Attendre un délai pour vérifier le succès
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier si la navigation a réussi
        return this.verifyNavigationSuccess(errorData);
      }
      
      return false;
      
    } catch (error) {
      console.error('[ErrorHandlingService] Navigation recovery failed:', error);
      return false;
    }
  }

  /**
   * Récupération de synchronisation
   */
  async recoverSync(errorData) {
    try {
      // Réinitialiser la connexion de synchronisation
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('sidebar:sync:reconnect', {
          detail: errorData
        });
        
        window.dispatchEvent(event);
        
        // Attendre la reconnexion
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[ErrorHandlingService] Sync recovery failed:', error);
      return false;
    }
  }

  /**
   * Récupération de chargement de données
   */
  async recoverDataLoad(errorData) {
    try {
      // Réessayer le chargement avec des paramètres réduits
      if (errorData.moduleId && errorData.dataType) {
        const event = new CustomEvent('sidebar:data:reload', {
          detail: {
            moduleId: errorData.moduleId,
            dataType: errorData.dataType,
            fallbackMode: true
          }
        });
        
        window.dispatchEvent(event);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[ErrorHandlingService] Data load recovery failed:', error);
      return false;
    }
  }

  /**
   * Récupération réseau
   */
  async recoverNetwork(errorData) {
    try {
      // Vérifier la connectivité
      if (navigator.onLine) {
        // Réessayer la requête réseau
        const event = new CustomEvent('sidebar:network:retry', {
          detail: errorData
        });
        
        window.dispatchEvent(event);
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[ErrorHandlingService] Network recovery failed:', error);
      return false;
    }
  }

  /**
   * Actions de fallback spécifiques
   */
  
  showPlaceholderContent(errorData) {
    const event = new CustomEvent('sidebar:show:placeholder', {
      detail: {
        moduleId: errorData.moduleId,
        message: 'Données temporairement indisponibles'
      }
    });
    
    window.dispatchEvent(event);
  }

  async useCachedData(errorData) {
    const event = new CustomEvent('sidebar:use:cache', {
      detail: errorData
    });
    
    window.dispatchEvent(event);
    return true;
  }

  enableOfflineMode() {
    const event = new CustomEvent('sidebar:mode:offline');
    window.dispatchEvent(event);
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  reduceFeatures() {
    const event = new CustomEvent('sidebar:features:reduce');
    window.dispatchEvent(event);
  }

  reduceTimeouts() {
    const event = new CustomEvent('sidebar:timeouts:reduce');
    window.dispatchEvent(event);
  }

  async clearSystemCache() {
    if (performanceOptimizationManager) {
      performanceOptimizationManager.optimizeMemoryUsage();
    }
    
    // Nettoyer le localStorage
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sidebar_') || key.startsWith('historical_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  resetApplicationState() {
    const event = new CustomEvent('sidebar:state:reset');
    window.dispatchEvent(event);
  }

  /**
   * Vérifications de succès
   */
  
  verifyNavigationSuccess(errorData) {
    // Vérifier si l'élément cible est visible
    if (errorData.targetModule) {
      const element = document.querySelector(`[data-module-id="${errorData.targetModule}"]`);
      return element && element.offsetParent !== null;
    }
    
    return false;
  }

  /**
   * Gestion des notifications utilisateur
   */
  
  queueUserNotification(errorType, errorData) {
    const notification = {
      id: Date.now(),
      type: errorType,
      data: errorData,
      timestamp: Date.now(),
      severity: SYSTEM_ERROR_CONFIG[errorType]?.severity || 'medium'
    };
    
    this.notificationQueue.push(notification);
  }

  startNotificationProcessor() {
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
    }
    
    this.notificationTimer = setInterval(() => {
      this.processNotificationQueue();
    }, this.config.notificationDelay);
  }

  processNotificationQueue() {
    if (this.notificationQueue.length === 0) return;
    
    const notification = this.notificationQueue.shift();
    this.showUserNotification(notification);
  }

  showUserNotification(notification) {
    const event = new CustomEvent('sidebar:notification:show', {
      detail: {
        type: 'error',
        severity: notification.severity,
        message: this.getErrorMessage(notification.type),
        actions: this.getErrorActions(notification.type),
        duration: notification.severity === 'high' ? 10000 : 5000
      }
    });
    
    window.dispatchEvent(event);
  }

  showPersistentNotification(errorType, errorData) {
    const event = new CustomEvent('sidebar:notification:persistent', {
      detail: {
        type: 'error',
        severity: 'high',
        message: this.getErrorMessage(errorType),
        actions: [
          { label: 'Réessayer', action: 'retry' },
          { label: 'Signaler', action: 'report' },
          { label: 'Ignorer', action: 'dismiss' }
        ]
      }
    });
    
    window.dispatchEvent(event);
  }

  getErrorMessage(errorType) {
    const messages = {
      [SYSTEM_ERROR_TYPES.NAVIGATION_FAILED]: 'Impossible de naviguer vers le module demandé',
      [SYSTEM_ERROR_TYPES.SYNC_FAILED]: 'Synchronisation des données échouée',
      [SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED]: 'Échec du chargement des données',
      [SYSTEM_ERROR_TYPES.PERFORMANCE_DEGRADED]: 'Performance dégradée détectée',
      [SYSTEM_ERROR_TYPES.CACHE_CORRUPTED]: 'Cache corrompu, réinitialisation nécessaire',
      [SYSTEM_ERROR_TYPES.NETWORK_ERROR]: 'Erreur de connexion réseau',
      [SYSTEM_ERROR_TYPES.TIMEOUT_ERROR]: 'Délai d\'attente dépassé'
    };
    
    return messages[errorType] || 'Erreur système inattendue';
  }

  getErrorActions(errorType) {
    const actions = {
      [SYSTEM_ERROR_TYPES.NAVIGATION_FAILED]: [
        { label: 'Réessayer', action: 'retry' }
      ],
      [SYSTEM_ERROR_TYPES.SYNC_FAILED]: [
        { label: 'Reconnecter', action: 'reconnect' }
      ],
      [SYSTEM_ERROR_TYPES.DATA_LOAD_FAILED]: [
        { label: 'Recharger', action: 'reload' }
      ],
      [SYSTEM_ERROR_TYPES.NETWORK_ERROR]: [
        { label: 'Vérifier connexion', action: 'check_network' }
      ]
    };
    
    return actions[errorType] || [{ label: 'OK', action: 'dismiss' }];
  }

  /**
   * Enregistrement et statistiques
   */
  
  recordError(errorType, errorData) {
    const errorRecord = {
      id: Date.now(),
      type: errorType,
      data: errorData,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
    
    // Ajouter à l'historique
    this.errorHistory.push(errorRecord);
    
    // Limiter la taille de l'historique
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    // Mettre à jour les statistiques
    this.stats.totalErrors++;
    this.stats.lastError = errorRecord;
    
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;
    
    // Logger en mode debug
    if (this.config.debugMode) {
      console.log('[ErrorHandlingService] Error recorded:', errorRecord);
    }
  }

  updateRecoveryStats(recovered, recoveryTime) {
    if (recovered) {
      this.stats.recoveredErrors++;
    } else {
      this.stats.failedRecoveries++;
    }
    
    // Calculer le temps moyen de récupération
    const totalRecoveries = this.stats.recoveredErrors + this.stats.failedRecoveries;
    this.stats.averageRecoveryTime = 
      (this.stats.averageRecoveryTime * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
  }

  /**
   * Nettoyage périodique
   */
  
  startPeriodicCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Nettoyer toutes les heures
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);
  }

  performCleanup() {
    console.log('[ErrorHandlingService] Performing periodic cleanup');
    
    // Nettoyer l'historique des erreurs anciennes (plus de 24h)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(error => error.timestamp > cutoffTime);
    
    // Nettoyer les retries actifs abandonnés
    for (const [key, retry] of this.activeRetries.entries()) {
      if (Date.now() - retry.startTime > 5 * 60 * 1000) { // 5 minutes
        console.warn(`[ErrorHandlingService] Cleaning up abandoned retry: ${key}`);
        this.activeRetries.delete(key);
      }
    }
    
    // Nettoyer la queue de notifications anciennes
    this.notificationQueue = this.notificationQueue.filter(
      notification => Date.now() - notification.timestamp < 10 * 60 * 1000 // 10 minutes
    );
  }

  /**
   * API publique
   */
  
  /**
   * Enregistre un écouteur d'erreur personnalisé
   */
  addEventListener(errorType, handler) {
    if (!this.errorListeners.has(errorType)) {
      this.errorListeners.set(errorType, []);
    }
    
    this.errorListeners.get(errorType).push(handler);
  }

  /**
   * Supprime un écouteur d'erreur
   */
  removeEventListener(errorType, handler) {
    const handlers = this.errorListeners.get(errorType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Obtient les statistiques d'erreur
   */
  getStats() {
    return {
      ...this.stats,
      activeRetries: this.activeRetries.size,
      queuedNotifications: this.notificationQueue.length,
      errorHistorySize: this.errorHistory.length
    };
  }

  /**
   * Obtient l'historique des erreurs
   */
  getErrorHistory(limit = 50) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Force la récupération d'un type d'erreur
   */
  async forceRecovery(errorType, errorData = {}) {
    return await this.handleSystemError(errorType, errorData);
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    console.log('[ErrorHandlingService] Cleaning up error handling service');
    
    // Nettoyer les timers
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
      this.notificationTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Nettoyer les données
    this.errorHistory = [];
    this.activeRetries.clear();
    this.errorListeners.clear();
    this.notificationQueue = [];
    
    this.isInitialized = false;
  }
}

// Instance singleton
export const errorHandlingService = new ErrorHandlingService();

export default errorHandlingService;