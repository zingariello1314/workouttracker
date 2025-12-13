/**
 * Gestionnaire d'erreurs de navigation pour les modules sidebar historiques
 * Gère les erreurs de navigation, retry automatique et fallbacks
 * 
 * Requirements: 14.5 - Gestion gracieuse des erreurs de navigation
 * 
 * @module services/sidebar/navigationErrorHandler
 */

import { errorHandlingService, SYSTEM_ERROR_TYPES } from './errorHandlingService';

/**
 * Types d'erreurs de navigation
 */
export const NAVIGATION_ERROR_TYPES = {
  SCROLL_FAILED: 'scroll_failed',
  TAB_ACTIVATION_FAILED: 'tab_activation_failed',
  MODULE_NOT_FOUND: 'module_not_found',
  DEEP_LINK_FAILED: 'deep_link_failed',
  HIGHLIGHT_FAILED: 'highlight_failed',
  TIMEOUT: 'navigation_timeout'
};

/**
 * Configuration des timeouts de navigation
 */
const NAVIGATION_TIMEOUTS = {
  SCROLL: 2000,
  TAB_ACTIVATION: 1500,
  MODULE_HIGHLIGHT: 1000,
  DEEP_LINK: 3000
};

/**
 * Gestionnaire d'erreurs de navigation
 */
class NavigationErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.activeNavigations = new Map();
    this.navigationHistory = [];
    this.retryAttempts = new Map();
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 500,
      fallbackScrollOffset: 100,
      highlightDuration: 2000,
      debugMode: process.env.NODE_ENV === 'development'
    };
    
    // Statistiques
    this.stats = {
      totalNavigations: 0,
      successfulNavigations: 0,
      failedNavigations: 0,
      retriedNavigations: 0,
      errorsByType: {}
    };
  }

  /**
   * Initialise le gestionnaire d'erreurs de navigation
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('[NavigationErrorHandler] Initializing navigation error handler...');
    
    try {
      // Écouter les événements de navigation
      this.setupNavigationListeners();
      
      // Écouter les événements d'erreur
      this.setupErrorListeners();
      
      this.isInitialized = true;
      console.log('[NavigationErrorHandler] Navigation error handler initialized');
      
    } catch (error) {
      console.error('[NavigationErrorHandler] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Configure les écouteurs d'événements de navigation
   */
  setupNavigationListeners() {
    if (typeof window === 'undefined') return;
    
    // Écouter les demandes de navigation
    window.addEventListener('sidebar:navigate', (event) => {
      this.handleNavigationRequest(event.detail);
    });
    
    // Écouter les retries de navigation
    window.addEventListener('sidebar:navigate:retry', (event) => {
      this.handleNavigationRetry(event.detail);
    });
    
    // Écouter les succès de navigation
    window.addEventListener('sidebar:navigate:success', (event) => {
      this.handleNavigationSuccess(event.detail);
    });
    
    // Écouter les échecs de navigation
    window.addEventListener('sidebar:navigate:failed', (event) => {
      this.handleNavigationFailure(event.detail);
    });
  }

  /**
   * Configure les écouteurs d'erreurs
   */
  setupErrorListeners() {
    if (typeof window === 'undefined') return;
    
    // Écouter les erreurs de scroll
    window.addEventListener('scroll:error', (event) => {
      this.handleScrollError(event.detail);
    });
    
    // Écouter les erreurs d'activation d'onglet
    window.addEventListener('tab:activation:error', (event) => {
      this.handleTabActivationError(event.detail);
    });
    
    // Écouter les erreurs de mise en évidence
    window.addEventListener('highlight:error', (event) => {
      this.handleHighlightError(event.detail);
    });
  }

  /**
   * Gère une demande de navigation
   */
  async handleNavigationRequest(navigationData) {
    const navigationId = this.generateNavigationId(navigationData);
    
    console.log(`[NavigationErrorHandler] Handling navigation request:`, navigationData);
    
    // Enregistrer la navigation active
    this.activeNavigations.set(navigationId, {
      ...navigationData,
      startTime: Date.now(),
      attempts: 0
    });
    
    this.stats.totalNavigations++;
    
    try {
      // Exécuter la navigation avec timeout
      const success = await this.executeNavigationWithTimeout(navigationData);
      
      if (success) {
        this.handleNavigationSuccess({ ...navigationData, navigationId });
      } else {
        this.handleNavigationFailure({ 
          ...navigationData, 
          navigationId,
          error: 'Navigation timeout or failed'
        });
      }
      
    } catch (error) {
      this.handleNavigationFailure({ 
        ...navigationData, 
        navigationId,
        error: error.message
      });
    }
  }

  /**
   * Exécute la navigation avec timeout
   */
  async executeNavigationWithTimeout(navigationData) {
    const timeout = NAVIGATION_TIMEOUTS.DEEP_LINK;
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);
      
      this.executeNavigation(navigationData)
        .then((success) => {
          clearTimeout(timeoutId);
          resolve(success);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          resolve(false);
        });
    });
  }

  /**
   * Exécute la navigation étape par étape
   */
  async executeNavigation(navigationData) {
    const { targetTab, targetSubtab, targetModule, scrollToModule } = navigationData;
    
    try {
      // Étape 1: Activer l'onglet principal
      if (targetTab) {
        const tabActivated = await this.activateTab(targetTab);
        if (!tabActivated) {
          throw new Error(`Failed to activate tab: ${targetTab}`);
        }
      }
      
      // Étape 2: Activer le sous-onglet si nécessaire
      if (targetSubtab) {
        const subtabActivated = await this.activateSubtab(targetTab, targetSubtab);
        if (!subtabActivated) {
          throw new Error(`Failed to activate subtab: ${targetSubtab}`);
        }
      }
      
      // Étape 3: Scroller vers le module si nécessaire
      if (scrollToModule && targetModule) {
        const scrolled = await this.scrollToModule(targetModule);
        if (!scrolled) {
          throw new Error(`Failed to scroll to module: ${targetModule}`);
        }
      }
      
      // Étape 4: Mettre en évidence le module
      if (targetModule) {
        await this.highlightModule(targetModule);
      }
      
      return true;
      
    } catch (error) {
      console.error('[NavigationErrorHandler] Navigation execution failed:', error);
      return false;
    }
  }

  /**
   * Active un onglet principal
   */
  async activateTab(tabName) {
    return new Promise((resolve) => {
      try {
        // Émettre l'événement d'activation d'onglet
        window.dispatchEvent(new CustomEvent('app:activate:tab', {
          detail: { tab: tabName }
        }));
        
        // Vérifier l'activation après un délai
        setTimeout(() => {
          const isActive = this.verifyTabActivation(tabName);
          resolve(isActive);
        }, 500);
        
      } catch (error) {
        console.error('[NavigationErrorHandler] Tab activation failed:', error);
        resolve(false);
      }
    });
  }

  /**
   * Active un sous-onglet
   */
  async activateSubtab(tabName, subtabName) {
    return new Promise((resolve) => {
      try {
        // Émettre l'événement d'activation de sous-onglet
        window.dispatchEvent(new CustomEvent('app:activate:subtab', {
          detail: { tab: tabName, subtab: subtabName }
        }));
        
        // Vérifier l'activation après un délai
        setTimeout(() => {
          const isActive = this.verifySubtabActivation(tabName, subtabName);
          resolve(isActive);
        }, 300);
        
      } catch (error) {
        console.error('[NavigationErrorHandler] Subtab activation failed:', error);
        resolve(false);
      }
    });
  }

  /**
   * Scroller vers un module
   */
  async scrollToModule(moduleId) {
    return new Promise((resolve) => {
      try {
        const element = document.querySelector(`[data-module-id="${moduleId}"]`);
        
        if (!element) {
          console.warn(`[NavigationErrorHandler] Module element not found: ${moduleId}`);
          resolve(false);
          return;
        }
        
        // Calculer la position de scroll
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - this.config.fallbackScrollOffset;
        
        // Scroller avec animation
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // Vérifier le scroll après un délai
        setTimeout(() => {
          const newRect = element.getBoundingClientRect();
          const isVisible = newRect.top >= 0 && newRect.top <= window.innerHeight;
          resolve(isVisible);
        }, 1000);
        
      } catch (error) {
        console.error('[NavigationErrorHandler] Scroll failed:', error);
        resolve(false);
      }
    });
  }

  /**
   * Met en évidence un module
   */
  async highlightModule(moduleId) {
    try {
      const element = document.querySelector(`[data-module-id="${moduleId}"]`);
      
      if (!element) {
        console.warn(`[NavigationErrorHandler] Module element not found for highlight: ${moduleId}`);
        return false;
      }
      
      // Ajouter la classe de mise en évidence
      element.classList.add('sidebar-module-highlighted');
      
      // Supprimer la classe après la durée configurée
      setTimeout(() => {
        element.classList.remove('sidebar-module-highlighted');
      }, this.config.highlightDuration);
      
      return true;
      
    } catch (error) {
      console.error('[NavigationErrorHandler] Highlight failed:', error);
      return false;
    }
  }

  /**
   * Vérifie l'activation d'un onglet
   */
  verifyTabActivation(tabName) {
    try {
      // Vérifier si l'onglet est actif dans l'interface
      const activeTab = document.querySelector('.tab-button.active');
      return activeTab && activeTab.dataset.tab === tabName;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie l'activation d'un sous-onglet
   */
  verifySubtabActivation(tabName, subtabName) {
    try {
      // Vérifier si le sous-onglet est actif
      const activeSubtab = document.querySelector('.subtab-button.active');
      return activeSubtab && activeSubtab.dataset.subtab === subtabName;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gère le succès de navigation
   */
  handleNavigationSuccess(navigationData) {
    const { navigationId } = navigationData;
    
    console.log(`[NavigationErrorHandler] Navigation successful:`, navigationData);
    
    // Nettoyer la navigation active
    this.activeNavigations.delete(navigationId);
    
    // Mettre à jour les statistiques
    this.stats.successfulNavigations++;
    
    // Ajouter à l'historique
    this.addToNavigationHistory({
      ...navigationData,
      success: true,
      timestamp: Date.now()
    });
    
    // Émettre l'événement de succès
    window.dispatchEvent(new CustomEvent('sidebar:navigation:success', {
      detail: navigationData
    }));
  }

  /**
   * Gère l'échec de navigation
   */
  async handleNavigationFailure(navigationData) {
    const { navigationId, error } = navigationData;
    
    console.error(`[NavigationErrorHandler] Navigation failed:`, navigationData);
    
    // Mettre à jour les statistiques
    this.stats.failedNavigations++;
    
    // Déterminer le type d'erreur
    const errorType = this.classifyNavigationError(error);
    
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;
    
    // Ajouter à l'historique
    this.addToNavigationHistory({
      ...navigationData,
      success: false,
      error,
      errorType,
      timestamp: Date.now()
    });
    
    // Tenter un retry si possible
    const retryKey = `${navigationData.targetTab}_${navigationData.targetModule}`;
    const currentRetries = this.retryAttempts.get(retryKey) || 0;
    
    if (currentRetries < this.config.maxRetries) {
      console.log(`[NavigationErrorHandler] Attempting retry ${currentRetries + 1}/${this.config.maxRetries}`);
      
      this.retryAttempts.set(retryKey, currentRetries + 1);
      this.stats.retriedNavigations++;
      
      // Attendre avant le retry
      setTimeout(() => {
        this.handleNavigationRetry(navigationData);
      }, this.config.retryDelay * (currentRetries + 1));
      
    } else {
      // Échec définitif - appliquer les fallbacks
      await this.applyNavigationFallback(navigationData, errorType);
      
      // Nettoyer
      this.activeNavigations.delete(navigationId);
      this.retryAttempts.delete(retryKey);
      
      // Notifier le service d'erreur principal
      await errorHandlingService.handleSystemError(SYSTEM_ERROR_TYPES.NAVIGATION_FAILED, {
        ...navigationData,
        error,
        errorType
      });
    }
  }

  /**
   * Gère le retry de navigation
   */
  async handleNavigationRetry(navigationData) {
    console.log(`[NavigationErrorHandler] Retrying navigation:`, navigationData);
    
    // Réexécuter la navigation
    await this.handleNavigationRequest(navigationData);
  }

  /**
   * Classifie le type d'erreur de navigation
   */
  classifyNavigationError(error) {
    const errorMessage = error?.toLowerCase() || '';
    
    if (errorMessage.includes('scroll')) {
      return NAVIGATION_ERROR_TYPES.SCROLL_FAILED;
    }
    
    if (errorMessage.includes('tab')) {
      return NAVIGATION_ERROR_TYPES.TAB_ACTIVATION_FAILED;
    }
    
    if (errorMessage.includes('module') && errorMessage.includes('not found')) {
      return NAVIGATION_ERROR_TYPES.MODULE_NOT_FOUND;
    }
    
    if (errorMessage.includes('highlight')) {
      return NAVIGATION_ERROR_TYPES.HIGHLIGHT_FAILED;
    }
    
    if (errorMessage.includes('timeout')) {
      return NAVIGATION_ERROR_TYPES.TIMEOUT;
    }
    
    return NAVIGATION_ERROR_TYPES.DEEP_LINK_FAILED;
  }

  /**
   * Applique les fallbacks de navigation
   */
  async applyNavigationFallback(navigationData, errorType) {
    console.log(`[NavigationErrorHandler] Applying fallback for ${errorType}:`, navigationData);
    
    try {
      switch (errorType) {
        case NAVIGATION_ERROR_TYPES.SCROLL_FAILED:
          // Fallback: scroll vers le haut de la page
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
          
        case NAVIGATION_ERROR_TYPES.TAB_ACTIVATION_FAILED:
          // Fallback: naviguer vers l'accueil
          window.location.hash = '#/';
          break;
          
        case NAVIGATION_ERROR_TYPES.MODULE_NOT_FOUND:
          // Fallback: afficher une notification
          window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
            detail: {
              type: 'warning',
              message: `Module "${navigationData.targetModule}" non trouvé`,
              duration: 3000
            }
          }));
          break;
          
        case NAVIGATION_ERROR_TYPES.HIGHLIGHT_FAILED:
          // Fallback: continuer sans mise en évidence
          console.warn('[NavigationErrorHandler] Continuing without highlight');
          break;
          
        default:
          // Fallback général: scroll vers le haut
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (fallbackError) {
      console.error('[NavigationErrorHandler] Fallback failed:', fallbackError);
    }
  }

  /**
   * Gère les erreurs de scroll spécifiques
   */
  handleScrollError(errorData) {
    console.error('[NavigationErrorHandler] Scroll error:', errorData);
    
    // Appliquer le fallback de scroll
    this.applyNavigationFallback(errorData, NAVIGATION_ERROR_TYPES.SCROLL_FAILED);
  }

  /**
   * Gère les erreurs d'activation d'onglet
   */
  handleTabActivationError(errorData) {
    console.error('[NavigationErrorHandler] Tab activation error:', errorData);
    
    // Appliquer le fallback d'onglet
    this.applyNavigationFallback(errorData, NAVIGATION_ERROR_TYPES.TAB_ACTIVATION_FAILED);
  }

  /**
   * Gère les erreurs de mise en évidence
   */
  handleHighlightError(errorData) {
    console.error('[NavigationErrorHandler] Highlight error:', errorData);
    
    // Appliquer le fallback de mise en évidence
    this.applyNavigationFallback(errorData, NAVIGATION_ERROR_TYPES.HIGHLIGHT_FAILED);
  }

  /**
   * Utilitaires
   */
  
  generateNavigationId(navigationData) {
    const { targetTab, targetSubtab, targetModule } = navigationData;
    return `nav_${targetTab || 'unknown'}_${targetSubtab || 'none'}_${targetModule || 'none'}_${Date.now()}`;
  }

  addToNavigationHistory(navigationRecord) {
    this.navigationHistory.push(navigationRecord);
    
    // Limiter la taille de l'historique
    if (this.navigationHistory.length > 100) {
      this.navigationHistory.shift();
    }
  }

  /**
   * API publique
   */
  
  /**
   * Force une navigation avec gestion d'erreur
   */
  async navigateWithErrorHandling(navigationData) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.handleNavigationRequest(navigationData);
  }

  /**
   * Obtient les statistiques de navigation
   */
  getStats() {
    return {
      ...this.stats,
      activeNavigations: this.activeNavigations.size,
      retryAttempts: this.retryAttempts.size,
      historySize: this.navigationHistory.length
    };
  }

  /**
   * Obtient l'historique de navigation
   */
  getNavigationHistory(limit = 20) {
    return this.navigationHistory.slice(-limit);
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    console.log('[NavigationErrorHandler] Cleaning up navigation error handler');
    
    // Nettoyer les données
    this.activeNavigations.clear();
    this.retryAttempts.clear();
    this.navigationHistory = [];
    
    this.isInitialized = false;
  }
}

// Instance singleton
export const navigationErrorHandler = new NavigationErrorHandler();

export default navigationErrorHandler;