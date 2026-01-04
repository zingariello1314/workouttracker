/**
 * Hook pour déterminer si la virtualisation est nécessaire
 * avec seuil adaptatif basé sur les performances réelles
 *
 * ✅ OPTIMISATION Phase 1.4 : Virtualisation Adaptative
 * - Seuil adaptatif basé sur la taille du dataset
 * - Mesure de performance pour ajustement dynamique
 * - Évite virtualisation inutile pour petits datasets
 * - Optimise rendu pour grands portfolios
 *
 * @module hooks/useVirtualScrolling
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 1
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import logger from '../utils/logger';

const log = logger.module('useVirtualScrolling');

/**
 * Seuil par défaut pour activer la virtualisation
 * Basé sur les meilleures pratiques : virtualisation utile à partir de ~50 items
 */
const DEFAULT_THRESHOLD = 50;

/**
 * Seuil minimum de hauteur de conteneur (px) pour activer virtualisation
 * Si le conteneur est trop petit, la virtualisation peut être contre-productive
 */
const MIN_CONTAINER_HEIGHT = 300;

/**
 * Mesure les performances de rendu pour ajuster le seuil dynamiquement
 */
class PerformanceMonitor {
  constructor() {
    this.renderTimes = [];
    this.maxSamples = 10;
  }

  /**
   * Mesurer le temps de rendu d'un batch
   */
  measureRender(callback) {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;

    this.renderTimes.push(duration);
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }

    return duration;
  }

  /**
   * Obtenir la moyenne des temps de rendu
   */
  getAverageRenderTime() {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * Déterminer si les performances sont dégradées (>16ms = <60fps)
   */
  isPerformanceDegraded() {
    const avg = this.getAverageRenderTime();
    return avg > 16; // 16ms = 60fps
  }

  reset() {
    this.renderTimes = [];
  }
}

/**
 * Hook pour déterminer si la virtualisation est nécessaire
 *
 * @param {number} itemCount - Nombre d'items à afficher
 * @param {Object} options - Options de configuration
 * @param {number} options.threshold - Seuil personnalisé (défaut: DEFAULT_THRESHOLD)
 * @param {number} options.containerHeight - Hauteur du conteneur en px (optionnel)
 * @param {boolean} options.forceVirtualization - Forcer la virtualisation (défaut: false)
 * @param {boolean} options.enablePerformanceMonitoring - Activer monitoring performance (défaut: true)
 * @returns {Object} { shouldVirtualize, estimatedItemHeight, performanceMetrics }
 */
export const useVirtualScrolling = (itemCount = 0, options = {}) => {
  const {
    threshold = DEFAULT_THRESHOLD,
    containerHeight = null,
    forceVirtualization = false,
    enablePerformanceMonitoring = true
  } = options;

  const performanceMonitorRef = useRef(new PerformanceMonitor());
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(threshold);
  const lastItemCountRef = useRef(itemCount);

  /**
   * Calculer si la virtualisation est nécessaire
   */
  const shouldVirtualize = useMemo(() => {
    // Forcer virtualisation si demandé
    if (forceVirtualization) {
      return true;
    }

    // Pas de virtualisation si pas assez d'items
    if (itemCount < adaptiveThreshold) {
      return false;
    }

    // Si conteneur trop petit, éviter virtualisation
    if (containerHeight && containerHeight < MIN_CONTAINER_HEIGHT) {
      return false;
    }

    return true;
  }, [itemCount, adaptiveThreshold, containerHeight, forceVirtualization]);

  /**
   * Estimer la hauteur d'un item (peut être ajustée dynamiquement)
   * Pour un tableau de portfolio, chaque ligne fait environ 80px
   */
  const estimatedItemHeight = useMemo(() => {
    // Hauteur par défaut pour une ligne de tableau portfolio
    return 80;
  }, []);

  /**
   * Calculer la hauteur optimale du conteneur virtualisé
   */
  const optimalContainerHeight = useMemo(() => {
    if (containerHeight) {
      return Math.max(containerHeight, MIN_CONTAINER_HEIGHT);
    }

    // Hauteur par défaut : afficher ~10 items visibles
    const visibleItems = 10;
    return estimatedItemHeight * visibleItems;
  }, [containerHeight, estimatedItemHeight]);

  /**
   * Ajuster le seuil adaptatif basé sur les performances
   */
  const adjustThreshold = useCallback(() => {
    if (!enablePerformanceMonitoring) return;

    const monitor = performanceMonitorRef.current;
    const avgRenderTime = monitor.getAverageRenderTime();

    // Si performances dégradées avec dataset actuel, baisser le seuil
    if (monitor.isPerformanceDegraded() && itemCount >= adaptiveThreshold) {
      const newThreshold = Math.max(20, Math.floor(adaptiveThreshold * 0.8));
      if (newThreshold !== adaptiveThreshold) {
        log.info(`Ajustement seuil virtualisation: ${adaptiveThreshold} → ${newThreshold} (perf: ${avgRenderTime.toFixed(2)}ms)`);
        setAdaptiveThreshold(newThreshold);
      }
    }
    // Si performances bonnes et seuil bas, augmenter progressivement
    else if (!monitor.isPerformanceDegraded() && adaptiveThreshold < threshold) {
      const newThreshold = Math.min(threshold, Math.floor(adaptiveThreshold * 1.2));
      if (newThreshold !== adaptiveThreshold) {
        log.info(`Ajustement seuil virtualisation: ${adaptiveThreshold} → ${newThreshold} (perf: ${avgRenderTime.toFixed(2)}ms)`);
        setAdaptiveThreshold(newThreshold);
      }
    }
  }, [itemCount, adaptiveThreshold, threshold, enablePerformanceMonitoring]);

  /**
   * Mesurer le rendu d'un batch d'items
   */
  const measureRender = useCallback((callback) => {
    if (!enablePerformanceMonitoring || !shouldVirtualize) {
      callback();
      return;
    }

    return performanceMonitorRef.current.measureRender(callback);
  }, [shouldVirtualize, enablePerformanceMonitoring]);

  /**
   * Réinitialiser le monitoring de performance
   */
  const resetPerformanceMonitoring = useCallback(() => {
    performanceMonitorRef.current.reset();
  }, []);

  /**
   * Obtenir les métriques de performance
   */
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) {
      return null;
    }

    const monitor = performanceMonitorRef.current;
    return {
      averageRenderTime: monitor.getAverageRenderTime(),
      isDegraded: monitor.isPerformanceDegraded(),
      sampleCount: monitor.renderTimes.length
    };
  }, [enablePerformanceMonitoring]);

  // Ajuster le seuil quand itemCount change significativement
  useEffect(() => {
    const change = Math.abs(itemCount - lastItemCountRef.current);
    if (change > 10) { // Changement significatif
      adjustThreshold();
      lastItemCountRef.current = itemCount;
    }
  }, [itemCount, adjustThreshold]);

  return {
    shouldVirtualize,
    estimatedItemHeight,
    optimalContainerHeight,
    adaptiveThreshold,
    performanceMetrics,
    measureRender,
    resetPerformanceMonitoring
  };
};

export default useVirtualScrolling;





