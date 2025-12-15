/**
 * Service d'Optimisation des Performances pour Graphiques
 * Phase 6 - Tâche 6.2 : Optimiser les performances et l'accessibilité
 * 
 * Ce service fournit des optimisations de performance pour les graphiques :
 * - Lazy loading intelligent
 * - Virtualisation des données
 * - Optimisation du rendu
 * - Gestion de la mémoire
 * - Monitoring des performances
 */

class ChartPerformanceService {
  constructor() {
    this.performanceMetrics = new Map();
    this.intersectionObserver = null;
    this.resizeObserver = null;
    this.chartInstances = new WeakMap();
    this.renderQueue = [];
    this.isProcessingQueue = false;
    
    this.initializeObservers();
  }

  // ===== LAZY LOADING INTELLIGENT =====

  /**
   * Initialise les observateurs pour le lazy loading
   */
  initializeObservers() {
    // Intersection Observer pour le lazy loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          root: null,
          rootMargin: '50px', // Précharge 50px avant d'être visible
          threshold: 0.1
        }
      );
    }

    // Resize Observer pour les redimensionnements
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(
        this.handleResize.bind(this)
      );
    }
  }

  /**
   * Active le lazy loading pour un graphique
   */
  enableLazyLoading(chartElement, loadCallback) {
    if (!this.intersectionObserver || !chartElement) return;

    // Marquer comme en attente de chargement
    chartElement.dataset.lazyChart = 'pending';
    chartElement.dataset.loadCallback = loadCallback.toString();

    // Observer l'élément
    this.intersectionObserver.observe(chartElement);

    // Ajouter un placeholder de chargement
    this.addLazyPlaceholder(chartElement);
  }

  /**
   * Gère l'intersection (visibilité) des graphiques
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        if (element.dataset.lazyChart === 'pending') {
          this.loadChart(element);
          this.intersectionObserver.unobserve(element);
        }
      }
    });
  }

  /**
   * Charge un graphique de manière asynchrone
   */
  async loadChart(element) {
    try {
      element.dataset.lazyChart = 'loading';
      
      // Simuler un délai pour éviter les pics de charge
      await this.throttleLoading();
      
      // Déclencher le callback de chargement
      const loadCallback = element.dataset.loadCallback;
      if (loadCallback) {
        // Exécuter le callback de chargement
        const callback = new Function('return ' + loadCallback)();
        await callback();
      }
      
      element.dataset.lazyChart = 'loaded';
      this.removeLazyPlaceholder(element);
      
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error);
      element.dataset.lazyChart = 'error';
      this.showLoadingError(element);
    }
  }

  /**
   * Ajoute un placeholder pendant le lazy loading
   */
  addLazyPlaceholder(element) {
    const placeholder = document.createElement('div');
    placeholder.className = 'chart-lazy-placeholder';
    placeholder.innerHTML = `
      <div class="chart-lazy-skeleton">
        <div class="chart-lazy-header"></div>
        <div class="chart-lazy-content">
          <div class="chart-lazy-bars">
            <div class="chart-lazy-bar" style="height: 60%"></div>
            <div class="chart-lazy-bar" style="height: 80%"></div>
            <div class="chart-lazy-bar" style="height: 40%"></div>
            <div class="chart-lazy-bar" style="height: 90%"></div>
            <div class="chart-lazy-bar" style="height: 70%"></div>
          </div>
        </div>
      </div>
    `;
    
    element.appendChild(placeholder);
  }

  /**
   * Supprime le placeholder après chargement
   */
  removeLazyPlaceholder(element) {
    const placeholder = element.querySelector('.chart-lazy-placeholder');
    if (placeholder) {
      placeholder.style.opacity = '0';
      setTimeout(() => placeholder.remove(), 300);
    }
  }

  /**
   * Affiche une erreur de chargement
   */
  showLoadingError(element) {
    const placeholder = element.querySelector('.chart-lazy-placeholder');
    if (placeholder) {
      placeholder.innerHTML = `
        <div class="chart-lazy-error">
          <div class="chart-lazy-error-icon">⚠️</div>
          <div class="chart-lazy-error-text">
            Erreur de chargement du graphique
          </div>
          <button class="chart-lazy-retry" onclick="this.closest('[data-lazy-chart]').click()">
            Réessayer
          </button>
        </div>
      `;
    }
  }

  /**
   * Limite la charge de chargement simultané
   */
  async throttleLoading() {
    return new Promise(resolve => {
      // Délai aléatoire entre 0 et 200ms pour éviter les pics
      const delay = Math.random() * 200;
      setTimeout(resolve, delay);
    });
  }

  // ===== VIRTUALISATION DES DONNÉES =====

  /**
   * Virtualise un large dataset pour les performances
   */
  virtualizeDataset(data, options = {}) {
    const {
      maxPoints = 100,
      strategy = 'adaptive',
      preserveExtremes = true
    } = options;

    if (!Array.isArray(data) || data.length <= maxPoints) {
      return data;
    }

    switch (strategy) {
      case 'uniform':
        return this.uniformSampling(data, maxPoints, preserveExtremes);
      case 'adaptive':
        return this.adaptiveSampling(data, maxPoints, preserveExtremes);
      case 'lod':
        return this.levelOfDetailSampling(data, maxPoints);
      default:
        return this.uniformSampling(data, maxPoints, preserveExtremes);
    }
  }

  /**
   * Échantillonnage uniforme
   */
  uniformSampling(data, maxPoints, preserveExtremes) {
    const step = Math.floor(data.length / maxPoints);
    const sampled = [];

    // Préserver le premier point
    if (preserveExtremes && data.length > 0) {
      sampled.push(data[0]);
    }

    // Échantillonnage uniforme
    for (let i = step; i < data.length - step; i += step) {
      sampled.push(data[i]);
    }

    // Préserver le dernier point
    if (preserveExtremes && data.length > 1) {
      sampled.push(data[data.length - 1]);
    }

    return sampled;
  }

  /**
   * Échantillonnage adaptatif basé sur la variance
   */
  adaptiveSampling(data, maxPoints, preserveExtremes) {
    if (data.length <= maxPoints) return data;

    const importance = this.calculateImportanceScores(data);
    const indices = importance
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPoints)
      .map(item => item.index)
      .sort((a, b) => a - b);

    // Assurer la préservation des extrêmes
    if (preserveExtremes) {
      if (!indices.includes(0)) indices.unshift(0);
      if (!indices.includes(data.length - 1)) indices.push(data.length - 1);
    }

    return indices.map(i => data[i]);
  }

  /**
   * Calcule les scores d'importance pour l'échantillonnage adaptatif
   */
  calculateImportanceScores(data) {
    const scores = new Array(data.length).fill(0);

    for (let i = 1; i < data.length - 1; i++) {
      const prev = this.getNumericValue(data[i - 1]);
      const curr = this.getNumericValue(data[i]);
      const next = this.getNumericValue(data[i + 1]);

      // Score basé sur la courbure (dérivée seconde)
      const curvature = Math.abs(prev - 2 * curr + next);
      
      // Score basé sur la variation locale
      const variation = Math.abs(curr - prev) + Math.abs(next - curr);
      
      scores[i] = curvature + variation * 0.5;
    }

    // Scores élevés pour les extrêmes
    scores[0] = Math.max(...scores) * 1.5;
    scores[scores.length - 1] = Math.max(...scores) * 1.5;

    return scores;
  }

  /**
   * Échantillonnage par niveau de détail (LOD)
   */
  levelOfDetailSampling(data, maxPoints) {
    const levels = [];
    let currentData = [...data];

    // Créer plusieurs niveaux de détail
    while (currentData.length > maxPoints && levels.length < 5) {
      levels.push([...currentData]);
      currentData = this.uniformSampling(currentData, Math.floor(currentData.length / 2), true);
    }

    levels.push(currentData);
    return levels[levels.length - 1];
  }

  /**
   * Extrait une valeur numérique d'un point de données
   */
  getNumericValue(dataPoint) {
    if (typeof dataPoint === 'number') return dataPoint;
    if (dataPoint && typeof dataPoint.value === 'number') return dataPoint.value;
    if (dataPoint && typeof dataPoint.y === 'number') return dataPoint.y;
    return 0;
  }

  // ===== OPTIMISATION DU RENDU =====

  /**
   * Optimise le rendu d'un graphique
   */
  optimizeChartRendering(chartElement, options = {}) {
    const {
      enableGPUAcceleration = true,
      useRequestAnimationFrame = true,
      batchUpdates = true,
      debounceResize = true
    } = options;

    // Accélération GPU
    if (enableGPUAcceleration) {
      this.enableGPUAcceleration(chartElement);
    }

    // Gestion des redimensionnements
    if (debounceResize && this.resizeObserver) {
      this.resizeObserver.observe(chartElement);
    }

    // Mise en file d'attente des rendus
    if (batchUpdates) {
      this.enableBatchedUpdates(chartElement);
    }

    // Enregistrer les métriques
    this.trackChartPerformance(chartElement);
  }

  /**
   * Active l'accélération GPU
   */
  enableGPUAcceleration(element) {
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform, opacity';
    
    // Optimiser les éléments SVG
    const svgElements = element.querySelectorAll('svg');
    svgElements.forEach(svg => {
      svg.style.transform = 'translateZ(0)';
    });
  }

  /**
   * Active les mises à jour par batch
   */
  enableBatchedUpdates(element) {
    const instance = {
      element,
      pendingUpdates: [],
      isScheduled: false
    };

    this.chartInstances.set(element, instance);
  }

  /**
   * Ajoute une mise à jour à la file d'attente
   */
  queueUpdate(element, updateFunction) {
    const instance = this.chartInstances.get(element);
    if (!instance) return;

    instance.pendingUpdates.push(updateFunction);

    if (!instance.isScheduled) {
      instance.isScheduled = true;
      requestAnimationFrame(() => this.processBatchedUpdates(instance));
    }
  }

  /**
   * Traite les mises à jour par batch
   */
  processBatchedUpdates(instance) {
    const startTime = performance.now();

    // Traiter toutes les mises à jour en une fois
    instance.pendingUpdates.forEach(updateFn => {
      try {
        updateFn();
      } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique:', error);
      }
    });

    // Nettoyer
    instance.pendingUpdates = [];
    instance.isScheduled = false;

    // Enregistrer les métriques
    const duration = performance.now() - startTime;
    this.recordPerformanceMetric(instance.element, 'batchUpdate', duration);
  }

  /**
   * Gère les redimensionnements avec debounce
   */
  handleResize(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      
      // Debounce les redimensionnements
      clearTimeout(element._resizeTimeout);
      element._resizeTimeout = setTimeout(() => {
        this.handleChartResize(element, entry);
      }, 150);
    });
  }

  /**
   * Gère le redimensionnement d'un graphique
   */
  handleChartResize(element, entry) {
    const startTime = performance.now();

    // Déclencher l'événement de redimensionnement
    const resizeEvent = new CustomEvent('chartResize', {
      detail: {
        width: entry.contentRect.width,
        height: entry.contentRect.height
      }
    });
    
    element.dispatchEvent(resizeEvent);

    // Enregistrer les métriques
    const duration = performance.now() - startTime;
    this.recordPerformanceMetric(element, 'resize', duration);
  }

  // ===== MONITORING DES PERFORMANCES =====

  /**
   * Suit les performances d'un graphique
   */
  trackChartPerformance(element) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('chart') || entry.name.includes('render')) {
          this.recordPerformanceMetric(element, entry.name, entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }

  /**
   * Enregistre une métrique de performance
   */
  recordPerformanceMetric(element, metricName, value) {
    const elementId = element.id || element.dataset.chartId || 'unknown';
    
    if (!this.performanceMetrics.has(elementId)) {
      this.performanceMetrics.set(elementId, {});
    }

    const metrics = this.performanceMetrics.get(elementId);
    
    if (!metrics[metricName]) {
      metrics[metricName] = {
        values: [],
        average: 0,
        min: Infinity,
        max: -Infinity
      };
    }

    const metric = metrics[metricName];
    metric.values.push(value);
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.average = metric.values.reduce((a, b) => a + b, 0) / metric.values.length;

    // Garder seulement les 100 dernières valeurs
    if (metric.values.length > 100) {
      metric.values = metric.values.slice(-100);
    }

    // Alerter si les performances se dégradent
    this.checkPerformanceThresholds(elementId, metricName, metric);
  }

  /**
   * Vérifie les seuils de performance
   */
  checkPerformanceThresholds(elementId, metricName, metric) {
    const thresholds = {
      render: 16, // 60fps = 16ms par frame
      batchUpdate: 10,
      resize: 5
    };

    const threshold = thresholds[metricName];
    if (threshold && metric.average > threshold) {
      console.warn(`Performance dégradée pour ${elementId}.${metricName}: ${metric.average.toFixed(2)}ms (seuil: ${threshold}ms)`);
      
      // Émettre un événement de performance
      const event = new CustomEvent('chartPerformanceWarning', {
        detail: {
          elementId,
          metricName,
          value: metric.average,
          threshold
        }
      });
      
      document.dispatchEvent(event);
    }
  }

  /**
   * Obtient les métriques de performance
   */
  getPerformanceMetrics(elementId = null) {
    if (elementId) {
      return this.performanceMetrics.get(elementId) || {};
    }
    
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Génère un rapport de performance
   */
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      charts: {},
      summary: {
        totalCharts: this.performanceMetrics.size,
        averageRenderTime: 0,
        slowestChart: null,
        fastestChart: null
      }
    };

    let totalRenderTime = 0;
    let chartCount = 0;
    let slowestTime = 0;
    let fastestTime = Infinity;

    this.performanceMetrics.forEach((metrics, elementId) => {
      const chartReport = {
        elementId,
        metrics: {}
      };

      Object.entries(metrics).forEach(([metricName, metric]) => {
        chartReport.metrics[metricName] = {
          average: parseFloat(metric.average.toFixed(2)),
          min: parseFloat(metric.min.toFixed(2)),
          max: parseFloat(metric.max.toFixed(2)),
          samples: metric.values.length
        };

        if (metricName === 'render') {
          totalRenderTime += metric.average;
          chartCount++;

          if (metric.average > slowestTime) {
            slowestTime = metric.average;
            report.summary.slowestChart = elementId;
          }

          if (metric.average < fastestTime) {
            fastestTime = metric.average;
            report.summary.fastestChart = elementId;
          }
        }
      });

      report.charts[elementId] = chartReport;
    });

    if (chartCount > 0) {
      report.summary.averageRenderTime = parseFloat((totalRenderTime / chartCount).toFixed(2));
    }

    return report;
  }

  // ===== GESTION DE LA MÉMOIRE =====

  /**
   * Nettoie les ressources d'un graphique
   */
  cleanup(element) {
    // Arrêter l'observation
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }

    // Nettoyer les timeouts
    if (element._resizeTimeout) {
      clearTimeout(element._resizeTimeout);
    }

    // Supprimer de la WeakMap
    this.chartInstances.delete(element);

    // Nettoyer les métriques
    const elementId = element.id || element.dataset.chartId;
    if (elementId) {
      this.performanceMetrics.delete(elementId);
    }

    // Nettoyer les styles GPU
    element.style.transform = '';
    element.style.willChange = '';
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.performanceMetrics.clear();
    this.chartInstances = new WeakMap();
    this.renderQueue = [];
  }
}

// Instance singleton
const chartPerformanceService = new ChartPerformanceService();

export default chartPerformanceService;