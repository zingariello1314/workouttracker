/**
 * 📊 PERFORMANCE MONITOR
 * 
 * Utilitaire pour mesurer et surveiller les performances de la sidebar
 * Suit les métriques critiques définies dans les requirements
 * 
 * Performance Budget (Requirements 6.1, 6.2, 6.3):
 * - Calcul des statistiques: < 50ms
 * - Rafraîchissement de la sidebar: < 100ms
 * - Chargement initial: < 500ms
 * - Émission d'événement: < 10ms
 * 
 * @module utils/performanceMonitor
 */

import { isBrowser } from './isBrowser';

// Configuration des seuils de performance
const PERFORMANCE_THRESHOLDS = {
  STATISTICS_CALCULATION: 50,    // ms
  SIDEBAR_REFRESH: 100,          // ms
  INITIAL_LOAD: 500,             // ms
  EVENT_EMISSION: 10             // ms
};

// Stockage des métriques
const performanceMetrics = new Map();
const performanceHistory = [];

/**
 * Démarre la mesure d'une opération
 * 
 * @param {string} operationName - Nom de l'opération
 * @returns {string} ID unique de la mesure
 */
export const startPerformanceMeasure = (operationName) => {
  if (!isBrowser() || !performance.mark) {
    return null;
  }

  const measureId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startMark = `${measureId}-start`;
  
  try {
    performance.mark(startMark);
    return measureId;
  } catch (error) {
    console.warn('[performanceMonitor] Erreur démarrage mesure:', error);
    return null;
  }
};

/**
 * Termine la mesure d'une opération et retourne la durée
 * 
 * @param {string} measureId - ID de la mesure
 * @param {string} operationName - Nom de l'opération
 * @returns {number|null} Durée en millisecondes ou null si erreur
 */
export const endPerformanceMeasure = (measureId, operationName) => {
  if (!isBrowser() || !performance.measure || !measureId) {
    return null;
  }

  const startMark = `${measureId}-start`;
  const endMark = `${measureId}-end`;
  const measureName = `${measureId}-measure`;
  
  try {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    const duration = measure ? measure.duration : null;
    
    // Nettoyer les marks et measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    // Stocker la métrique
    if (duration !== null) {
      recordPerformanceMetric(operationName, duration);
    }
    
    return duration;
  } catch (error) {
    console.warn('[performanceMonitor] Erreur fin mesure:', error);
    return null;
  }
};

/**
 * Mesure automatiquement une fonction async
 * 
 * @param {string} operationName - Nom de l'opération
 * @param {Function} fn - Fonction à mesurer
 * @returns {Promise<any>} Résultat de la fonction
 */
export const measureAsync = async (operationName, fn) => {
  const measureId = startPerformanceMeasure(operationName);
  
  try {
    const result = await fn();
    return result;
  } finally {
    endPerformanceMeasure(measureId, operationName);
  }
};

/**
 * Mesure automatiquement une fonction synchrone
 * 
 * @param {string} operationName - Nom de l'opération
 * @param {Function} fn - Fonction à mesurer
 * @returns {any} Résultat de la fonction
 */
export const measureSync = (operationName, fn) => {
  const measureId = startPerformanceMeasure(operationName);
  
  try {
    const result = fn();
    return result;
  } finally {
    endPerformanceMeasure(measureId, operationName);
  }
};

/**
 * Enregistre une métrique de performance
 * 
 * @param {string} operationName - Nom de l'opération
 * @param {number} duration - Durée en millisecondes
 */
export const recordPerformanceMetric = (operationName, duration) => {
  const timestamp = Date.now();
  
  // Ajouter à l'historique
  performanceHistory.push({
    operation: operationName,
    duration,
    timestamp,
    threshold: PERFORMANCE_THRESHOLDS[operationName.toUpperCase().replace(/[^A-Z_]/g, '_')] || null
  });
  
  // Maintenir seulement les 100 dernières métriques
  if (performanceHistory.length > 100) {
    performanceHistory.shift();
  }
  
  // Mettre à jour les statistiques par opération
  if (!performanceMetrics.has(operationName)) {
    performanceMetrics.set(operationName, {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0,
      violations: 0
    });
  }
  
  const stats = performanceMetrics.get(operationName);
  stats.count++;
  stats.totalDuration += duration;
  stats.minDuration = Math.min(stats.minDuration, duration);
  stats.maxDuration = Math.max(stats.maxDuration, duration);
  stats.avgDuration = stats.totalDuration / stats.count;
  
  // Vérifier les violations de seuil
  const threshold = PERFORMANCE_THRESHOLDS[operationName.toUpperCase().replace(/[^A-Z_]/g, '_')];
  if (threshold && duration > threshold) {
    stats.violations++;
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[performanceMonitor] ⚠️ Violation de performance: ${operationName}`,
        `${duration.toFixed(2)}ms > ${threshold}ms`
      );
    }
  }
  
  performanceMetrics.set(operationName, stats);
};

/**
 * Obtient les statistiques de performance pour une opération
 * 
 * @param {string} operationName - Nom de l'opération
 * @returns {Object|null} Statistiques ou null si non trouvé
 */
export const getPerformanceStats = (operationName) => {
  return performanceMetrics.get(operationName) || null;
};

/**
 * Obtient toutes les statistiques de performance
 * 
 * @returns {Object} Toutes les statistiques
 */
export const getAllPerformanceStats = () => {
  const stats = {};
  for (const [operation, data] of performanceMetrics.entries()) {
    stats[operation] = { ...data };
  }
  return stats;
};

/**
 * Obtient l'historique récent des performances
 * 
 * @param {number} limit - Nombre d'entrées à retourner (défaut: 20)
 * @returns {Array} Historique des performances
 */
export const getPerformanceHistory = (limit = 20) => {
  return performanceHistory.slice(-limit);
};

/**
 * Génère un rapport de performance
 * 
 * @returns {Object} Rapport détaillé
 */
export const generatePerformanceReport = () => {
  const stats = getAllPerformanceStats();
  const history = getPerformanceHistory();
  const totalViolations = Object.values(stats).reduce((sum, stat) => sum + stat.violations, 0);
  
  return {
    summary: {
      totalOperations: Object.keys(stats).length,
      totalMeasurements: Object.values(stats).reduce((sum, stat) => sum + stat.count, 0),
      totalViolations,
      healthScore: totalViolations === 0 ? 100 : Math.max(0, 100 - (totalViolations * 5))
    },
    operations: stats,
    recentHistory: history,
    thresholds: PERFORMANCE_THRESHOLDS,
    timestamp: new Date().toISOString()
  };
};

/**
 * Nettoie les métriques de performance
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.clear();
  performanceHistory.length = 0;
};

/**
 * Hook React pour surveiller les performances d'un composant
 * 
 * @param {string} componentName - Nom du composant
 * @returns {Object} Fonctions de mesure
 */
export const usePerformanceMonitor = (componentName) => {
  if (!isBrowser()) {
    return {
      measureRender: () => {},
      measureEffect: () => {},
      getStats: () => null
    };
  }

  const measureRender = React.useCallback(() => {
    return startPerformanceMeasure(`${componentName}-render`);
  }, [componentName]);

  const measureEffect = React.useCallback((effectName) => {
    return startPerformanceMeasure(`${componentName}-${effectName}`);
  }, [componentName]);

  const getStats = React.useCallback(() => {
    return getPerformanceStats(componentName);
  }, [componentName]);

  return {
    measureRender,
    measureEffect,
    getStats
  };
};

// Opérations prédéfinies pour la sidebar
export const SIDEBAR_OPERATIONS = {
  STATISTICS_CALCULATION: 'sidebar-statistics-calculation',
  SIDEBAR_REFRESH: 'sidebar-refresh',
  INITIAL_LOAD: 'sidebar-initial-load',
  EVENT_EMISSION: 'sidebar-event-emission',
  BOOKS_STATISTICS: 'books-statistics-calculation',
  GARMIN_DATA_LOAD: 'garmin-data-load',
  NUTRITION_DATA_LOAD: 'nutrition-data-load'
};

export default {
  startPerformanceMeasure,
  endPerformanceMeasure,
  measureAsync,
  measureSync,
  recordPerformanceMetric,
  getPerformanceStats,
  getAllPerformanceStats,
  getPerformanceHistory,
  generatePerformanceReport,
  clearPerformanceMetrics,
  usePerformanceMonitor,
  SIDEBAR_OPERATIONS,
  PERFORMANCE_THRESHOLDS
};