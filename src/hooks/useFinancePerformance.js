/**
 * Hook useFinancePerformance - Mesure Performance Module Finance
 * 
 * ✅ PHASE 4 - Étape 4.1 : Tests performance
 * 
 * Fonctionnalités :
 * - Mesure temps chargement composants
 * - Comptage re-renders
 * - Mesure consommation API
 * - Métriques storage
 * 
 * @module hooks/useFinancePerformance
 */

import { useEffect, useRef, useCallback } from 'react';
import logger from '../utils/logger';

const log = logger.module('financePerformance');

/**
 * Stockage des métriques (en mémoire)
 */
const performanceMetrics = {
  componentLoads: new Map(), // componentName → [timestamps]
  renderCounts: new Map(),   // componentName → count
  apiCalls: [],              // [{endpoint, duration, timestamp}]
  storageSize: {             // Taille storage
    indexedDB: 0,
    localStorage: 0
  }
};

/**
 * Hook pour mesurer les performances d'un composant Finance
 * 
 * @param {string} componentName - Nom du composant
 * @param {boolean} enabled - Activer/désactiver (défaut: dev mode)
 * @returns {Object} Métriques et fonctions utilitaires
 */
export function useFinancePerformance(componentName, enabled = process.env.NODE_ENV === 'development') {
  const loadStartTimeRef = useRef(null);
  const renderCountRef = useRef(0);

  // Mesurer temps chargement
  useEffect(() => {
    if (!enabled) return;

    loadStartTimeRef.current = performance.now();
    
    return () => {
      if (loadStartTimeRef.current) {
        const loadTime = performance.now() - loadStartTimeRef.current;
        
        if (!performanceMetrics.componentLoads.has(componentName)) {
          performanceMetrics.componentLoads.set(componentName, []);
        }
        performanceMetrics.componentLoads.get(componentName).push(loadTime);
        
        log.debug(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled]);

  // Compter re-renders
  useEffect(() => {
    if (!enabled) return;
    
    renderCountRef.current++;
    const currentCount = renderCountRef.current;
    
    if (!performanceMetrics.renderCounts.has(componentName)) {
      performanceMetrics.renderCounts.set(componentName, 0);
    }
    performanceMetrics.renderCounts.set(componentName, currentCount);
    
    if (currentCount > 1) {
      log.debug(`[Performance] ${componentName} re-rendered (count: ${currentCount})`);
    }
  });

  // Fonction pour mesurer une opération
  const measureOperation = useCallback((operationName, fn) => {
    if (!enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    log.debug(`[Performance] ${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
    
    return result;
  }, [componentName, enabled]);

  // Fonction pour enregistrer un appel API
  const recordAPICall = useCallback((endpoint, duration) => {
    if (!enabled) return;
    
    performanceMetrics.apiCalls.push({
      endpoint,
      duration,
      timestamp: Date.now(),
      component: componentName
    });
    
    log.debug(`[Performance] API call ${endpoint} took ${duration.toFixed(2)}ms`);
  }, [componentName, enabled]);

  return {
    measureOperation,
    recordAPICall,
    getMetrics: () => ({
      loadTime: performanceMetrics.componentLoads.get(componentName)?.[0] || 0,
      renderCount: performanceMetrics.renderCounts.get(componentName) || 0
    })
  };
}

/**
 * Obtient toutes les métriques de performance
 * 
 * @returns {Object} Toutes les métriques
 */
export function getFinancePerformanceMetrics() {
  // Calculer moyennes
  const avgLoadTimes = {};
  performanceMetrics.componentLoads.forEach((times, component) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    avgLoadTimes[component] = avg;
  });

  // Compter appels API
  const apiCallStats = {
    total: performanceMetrics.apiCalls.length,
    byEndpoint: {},
    avgDuration: 0
  };
  
  if (performanceMetrics.apiCalls.length > 0) {
    const durations = performanceMetrics.apiCalls.map(c => c.duration);
    apiCallStats.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    performanceMetrics.apiCalls.forEach(call => {
      if (!apiCallStats.byEndpoint[call.endpoint]) {
        apiCallStats.byEndpoint[call.endpoint] = { count: 0, totalDuration: 0 };
      }
      apiCallStats.byEndpoint[call.endpoint].count++;
      apiCallStats.byEndpoint[call.endpoint].totalDuration += call.duration;
    });
  }

  return {
    components: {
      loadTimes: avgLoadTimes,
      renderCounts: Object.fromEntries(performanceMetrics.renderCounts)
    },
    api: apiCallStats,
    storage: performanceMetrics.storageSize
  };
}

/**
 * Réinitialise toutes les métriques
 */
export function resetFinancePerformanceMetrics() {
  performanceMetrics.componentLoads.clear();
  performanceMetrics.renderCounts.clear();
  performanceMetrics.apiCalls = [];
  log.info('Finance performance metrics reset');
}

/**
 * Exporte les métriques au format JSON
 * 
 * @returns {string} Métriques en JSON
 */
export function exportFinancePerformanceMetrics() {
  const metrics = getFinancePerformanceMetrics();
  return JSON.stringify(metrics, null, 2);
}

export default useFinancePerformance;
