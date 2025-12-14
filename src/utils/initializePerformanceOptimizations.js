/**
 * Script d'initialisation des optimisations de performance pour les modules sidebar historiques
 * À appeler au démarrage de l'application
 * 
 * @module utils/initializePerformanceOptimizations
 */

import { performanceOptimizationManager, PERFORMANCE_MODES } from '../services/sidebar/performanceOptimizationManager';
import { errorHandlingService } from '../services/sidebar/errorHandlingService';
import { navigationErrorHandler } from '../services/sidebar/navigationErrorHandler';
import { syncErrorHandler } from '../services/sidebar/syncErrorHandler';

/**
 * Détecte le mode de performance optimal basé sur les capacités du dispositif
 * @returns {string} Mode de performance recommandé
 */
function detectOptimalPerformanceMode() {
  // Vérifier les capacités du navigateur et du dispositif
  const hasHighMemory = navigator.deviceMemory ? navigator.deviceMemory >= 4 : true;
  const hasHighConcurrency = navigator.hardwareConcurrency ? navigator.hardwareConcurrency >= 4 : true;
  const hasGoodConnection = navigator.connection ? 
    navigator.connection.effectiveType === '4g' || navigator.connection.downlink > 1.5 : true;
  
  // Détecter si on est sur mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Détecter si on est en mode développement
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return PERFORMANCE_MODES.DEVELOPER;
  }
  
  // Priorité aux conditions de faible performance - être plus strict
  if (isMobile || 
      (navigator.deviceMemory && navigator.deviceMemory < 4) || 
      (navigator.connection && (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === '3g'))) {
    return PERFORMANCE_MODES.POWER_SAVER;
  }
  
  if (hasHighMemory && hasHighConcurrency && hasGoodConnection) {
    return PERFORMANCE_MODES.PERFORMANCE;
  }
  
  return PERFORMANCE_MODES.BALANCED;
}

/**
 * Initialise les optimisations de performance
 * @param {Object} options - Options d'initialisation
 * @returns {Promise<void>}
 */
export async function initializePerformanceOptimizations(options = {}) {
  try {
    console.log('[Performance] Initializing performance optimizations...');
    
    // Détecter le mode optimal si non spécifié
    const mode = options.mode || detectOptimalPerformanceMode();
    
    // Configuration par défaut
    const config = {
      mode,
      config: {
        // Ajustements spécifiques si nécessaire
        ...options.config
      }
    };
    
    // Initialiser le gestionnaire d'optimisation
    await performanceOptimizationManager.initialize(config);
    
    // Initialiser les services de gestion d'erreurs
    await initializeErrorHandlingServices();
    
    // Configurer les écouteurs d'événements globaux
    setupGlobalEventListeners();
    
    // Configurer le nettoyage automatique
    setupAutomaticCleanup();
    
    console.log(`[Performance] Performance optimizations initialized successfully (mode: ${mode})`);
    
    return {
      success: true,
      mode,
      manager: performanceOptimizationManager
    };
    
  } catch (error) {
    console.error('[Performance] Failed to initialize performance optimizations:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialise les services de gestion d'erreurs
 */
async function initializeErrorHandlingServices() {
  try {
    console.log('[Performance] Initializing error handling services...');
    
    // Initialiser le service principal de gestion d'erreurs
    await errorHandlingService.initialize();
    
    // Initialiser le gestionnaire d'erreurs de navigation
    await navigationErrorHandler.initialize();
    
    // Initialiser le gestionnaire d'erreurs de synchronisation
    await syncErrorHandler.initialize();
    
    console.log('[Performance] Error handling services initialized successfully');
    
  } catch (error) {
    console.error('[Performance] Failed to initialize error handling services:', error);
    // Ne pas faire échouer l'initialisation complète pour les erreurs de gestion d'erreurs
  }
}

/**
 * Configure les écouteurs d'événements globaux
 */
function setupGlobalEventListeners() {
  // Écouter les changements de visibilité de la page
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page cachée - optimiser pour économiser les ressources
      performanceOptimizationManager.optimizeMemoryUsage();
    }
  });
  
  // Écouter les changements de connexion réseau
  if (navigator.connection) {
    navigator.connection.addEventListener('change', () => {
      const connection = navigator.connection;
      
      // Ajuster le mode selon la qualité de connexion
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        performanceOptimizationManager.changePerformanceMode(PERFORMANCE_MODES.POWER_SAVER);
      } else if (connection.effectiveType === '4g' && connection.downlink > 2) {
        performanceOptimizationManager.changePerformanceMode(PERFORMANCE_MODES.PERFORMANCE);
      }
    });
  }
  
  // Écouter les avertissements de mémoire faible
  if ('memory' in performance && performance.memory) {
    setInterval(() => {
      const memoryInfo = performance.memory;
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 85) {
        console.warn('[Performance] High memory usage detected, triggering optimization');
        performanceOptimizationManager.optimizeMemoryUsage();
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }
}

/**
 * Configure le nettoyage automatique
 */
function setupAutomaticCleanup() {
  // Nettoyage périodique toutes les 10 minutes
  setInterval(() => {
    performanceOptimizationManager.optimizeMemoryUsage();
  }, 10 * 60 * 1000);
  
  // Nettoyage avant la fermeture de la page
  window.addEventListener('beforeunload', () => {
    performanceOptimizationManager.cleanup();
    errorHandlingService.cleanup();
    navigationErrorHandler.cleanup();
    syncErrorHandler.cleanup();
  });
  
  // Nettoyage lors du changement de route (si applicable)
  window.addEventListener('popstate', () => {
    performanceOptimizationManager.optimizeMemoryUsage();
  });
}

/**
 * Obtient le rapport de performance actuel
 * @returns {Object} Rapport de performance
 */
export function getPerformanceReport() {
  return performanceOptimizationManager.getPerformanceReport();
}

/**
 * Change le mode de performance
 * @param {string} mode - Nouveau mode
 * @returns {Promise<void>}
 */
export async function changePerformanceMode(mode) {
  return await performanceOptimizationManager.changePerformanceMode(mode);
}

/**
 * Optimise manuellement les performances
 * @param {string} type - Type d'optimisation ('memory', 'cpu', 'rendering', 'all')
 */
export function optimizePerformance(type = 'all') {
  switch (type) {
    case 'memory':
      performanceOptimizationManager.optimizeMemoryUsage();
      break;
    case 'cpu':
      performanceOptimizationManager.optimizeCPUUsage();
      break;
    case 'rendering':
      performanceOptimizationManager.optimizeRenderingPerformance();
      break;
    case 'all':
    default:
      performanceOptimizationManager.optimizeMemoryUsage();
      performanceOptimizationManager.optimizeCPUUsage();
      performanceOptimizationManager.optimizeRenderingPerformance();
      break;
  }
}

/**
 * Obtient les statistiques de performance
 * @returns {Object} Statistiques
 */
export function getPerformanceStats() {
  return performanceOptimizationManager.getStats();
}

/**
 * Active/désactive le mode debug de performance
 * @param {boolean} enabled - Activer le mode debug
 */
export function setPerformanceDebugMode(enabled) {
  if (enabled) {
    performanceOptimizationManager.changePerformanceMode(PERFORMANCE_MODES.DEVELOPER);
  } else {
    const optimalMode = detectOptimalPerformanceMode();
    if (optimalMode !== PERFORMANCE_MODES.DEVELOPER) {
      performanceOptimizationManager.changePerformanceMode(optimalMode);
    }
  }
}

// Exporter les modes pour utilisation externe
export { PERFORMANCE_MODES } from '../services/sidebar/performanceOptimizationManager';

export default {
  initializePerformanceOptimizations,
  getPerformanceReport,
  changePerformanceMode,
  optimizePerformance,
  getPerformanceStats,
  setPerformanceDebugMode,
  PERFORMANCE_MODES
};