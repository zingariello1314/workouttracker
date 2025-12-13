/**
 * Moniteur de performance temps réel pour les modules sidebar historiques
 * Surveille les métriques de performance et déclenche des optimisations automatiques
 * 
 * Requirements: 14.1, 14.3 - Monitoring des performances temps réel
 * 
 * @module services/sidebar/realTimePerformanceMonitor
 */

import { 
  measureAsync, 
  measureSync, 
  SIDEBAR_OPERATIONS,
  recordPerformanceMetric,
  getAllPerformanceStats
} from '../../utils/performanceMonitor';

/**
 * Seuils de performance critiques
 */
export const CRITICAL_THRESHOLDS = {
  SIDEBAR_REFRESH: 100,        // 100ms max pour rafraîchir la sidebar
  MODULE_LOAD: 500,            // 500ms max pour charger un module
  DATA_SYNC: 200,              // 200ms max pour synchroniser les données
  MEMORY_USAGE: 50 * 1024 * 1024,  // 50MB max d'utilisation mémoire
  CPU_USAGE: 80,               // 80% max d'utilisation CPU
  FRAME_RATE: 55               // 55 FPS min pour les animations
};

/**
 * Seuils de performance pour les opérations (compatibilité avec performanceMonitor.js)
 */
const PERFORMANCE_THRESHOLDS = {
  STATISTICS_CALCULATION: 50,    // ms
  SIDEBAR_REFRESH: 100,          // ms
  INITIAL_LOAD: 500,             // ms
  EVENT_EMISSION: 10             // ms
};

/**
 * Types d'alertes de performance
 */
export const ALERT_TYPES = {
  THRESHOLD_EXCEEDED: 'threshold_exceeded',
  MEMORY_LEAK: 'memory_leak',
  CPU_SPIKE: 'cpu_spike',
  SLOW_OPERATION: 'slow_operation',
  FRAME_DROP: 'frame_drop',
  NETWORK_SLOW: 'network_slow'
};

/**
 * Niveaux de sévérité
 */
export const SEVERITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Collecteur de métriques système
 */
class SystemMetricsCollector {
  constructor() {
    this.metrics = {
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      cpu: {
        usage: 0,
        cores: navigator.hardwareConcurrency || 4
      },
      network: {
        downlink: 0,
        effectiveType: 'unknown',
        rtt: 0
      },
      rendering: {
        fps: 60,
        frameTime: 16.67,
        droppedFrames: 0
      }
    };
    
    this.isCollecting = false;
    this.collectionInterval = null;
  }

  /**
   * Démarre la collecte de métriques
   */
  startCollection() {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    // Collecter les métriques toutes les secondes
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
    
    // Collecter immédiatement
    this.collectMetrics();
  }

  /**
   * Arrête la collecte de métriques
   */
  stopCollection() {
    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collecte toutes les métriques système
   */
  collectMetrics() {
    this.collectMemoryMetrics();
    this.collectNetworkMetrics();
    this.collectRenderingMetrics();
    // Note: CPU metrics are harder to get in browser, using approximation
    this.estimateCPUUsage();
  }

  /**
   * Collecte les métriques mémoire
   */
  collectMemoryMetrics() {
    if (performance.memory) {
      this.metrics.memory.used = performance.memory.usedJSHeapSize;
      this.metrics.memory.total = performance.memory.totalJSHeapSize;
      this.metrics.memory.percentage = 
        (this.metrics.memory.used / this.metrics.memory.total) * 100;
    }
  }

  /**
   * Collecte les métriques réseau
   */
  collectNetworkMetrics() {
    if (navigator.connection) {
      this.metrics.network.downlink = navigator.connection.downlink || 0;
      this.metrics.network.effectiveType = navigator.connection.effectiveType || 'unknown';
      this.metrics.network.rtt = navigator.connection.rtt || 0;
    }
  }

  /**
   * Collecte les métriques de rendu
   */
  collectRenderingMetrics() {
    // Utiliser requestAnimationFrame pour mesurer les FPS
    let lastTime = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;
    
    const measureFrame = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      totalFrameTime += deltaTime;
      frameCount++;
      
      if (frameCount >= 60) { // Calculer sur 60 frames
        this.metrics.rendering.fps = 1000 / (totalFrameTime / frameCount);
        this.metrics.rendering.frameTime = totalFrameTime / frameCount;
        
        // Détecter les frames droppées (> 20ms = dropped frame à 60fps)
        if (this.metrics.rendering.frameTime > 20) {
          this.metrics.rendering.droppedFrames++;
        }
        
        frameCount = 0;
        totalFrameTime = 0;
      }
      
      lastTime = currentTime;
      
      if (this.isCollecting) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    if (this.isCollecting) {
      requestAnimationFrame(measureFrame);
    }
  }

  /**
   * Estime l'utilisation CPU (approximation basée sur les performances)
   */
  estimateCPUUsage() {
    const start = performance.now();
    
    // Effectuer une opération CPU intensive courte
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += Math.random();
    }
    
    const duration = performance.now() - start;
    
    // Estimer l'usage CPU basé sur le temps d'exécution
    // (Approximation très basique)
    this.metrics.cpu.usage = Math.min(100, duration * 10);
  }

  /**
   * Obtient les métriques actuelles
   * @returns {Object} Métriques système
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Analyseur de tendances de performance
 */
class PerformanceTrendAnalyzer {
  constructor() {
    this.history = [];
    this.maxHistorySize = 300; // 5 minutes à 1 échantillon/seconde
    this.trends = {
      memory: { direction: 'stable', rate: 0 },
      cpu: { direction: 'stable', rate: 0 },
      fps: { direction: 'stable', rate: 0 }
    };
  }

  /**
   * Ajoute un échantillon de métriques
   * @param {Object} metrics - Métriques à analyser
   */
  addSample(metrics) {
    const sample = {
      timestamp: Date.now(),
      memory: metrics.memory.percentage,
      cpu: metrics.cpu.usage,
      fps: metrics.rendering.fps
    };
    
    this.history.push(sample);
    
    // Maintenir la taille de l'historique
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Analyser les tendances si on a assez d'échantillons
    if (this.history.length >= 10) {
      this.analyzeTrends();
    }
  }

  /**
   * Analyse les tendances de performance
   */
  analyzeTrends() {
    const recentSamples = this.history.slice(-10); // 10 derniers échantillons
    
    this.trends.memory = this.calculateTrend(recentSamples, 'memory');
    this.trends.cpu = this.calculateTrend(recentSamples, 'cpu');
    this.trends.fps = this.calculateTrend(recentSamples, 'fps');
  }

  /**
   * Calcule la tendance pour une métrique
   * @param {Array} samples - Échantillons
   * @param {string} metric - Nom de la métrique
   * @returns {Object} Tendance
   */
  calculateTrend(samples, metric) {
    if (samples.length < 2) {
      return { direction: 'stable', rate: 0 };
    }
    
    const values = samples.map(s => s[metric]);
    const n = values.length;
    
    // Calcul de la régression linéaire simple
    const sumX = samples.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = samples.reduce((sum, _, i) => sum + (i * values[i]), 0);
    const sumXX = samples.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction = 'stable';
    if (slope > 0.1) {
      direction = 'increasing';
    } else if (slope < -0.1) {
      direction = 'decreasing';
    }
    
    return { direction, rate: Math.abs(slope) };
  }

  /**
   * Prédit les valeurs futures basées sur les tendances
   * @param {number} minutesAhead - Minutes dans le futur
   * @returns {Object} Prédictions
   */
  predictFuture(minutesAhead = 5) {
    if (this.history.length < 10) {
      return null;
    }
    
    const predictions = {};
    const samplesAhead = minutesAhead * 60; // Échantillons par minute
    
    for (const [metric, trend] of Object.entries(this.trends)) {
      const lastValue = this.history[this.history.length - 1][metric];
      let predictedValue = lastValue;
      
      if (trend.direction === 'increasing') {
        predictedValue += trend.rate * samplesAhead;
      } else if (trend.direction === 'decreasing') {
        predictedValue -= trend.rate * samplesAhead;
      }
      
      predictions[metric] = {
        current: lastValue,
        predicted: predictedValue,
        trend: trend.direction,
        confidence: this.calculateConfidence(trend)
      };
    }
    
    return predictions;
  }

  /**
   * Calcule la confiance dans une prédiction
   * @param {Object} trend - Tendance
   * @returns {number} Confiance (0-1)
   */
  calculateConfidence(trend) {
    // Confiance basée sur la stabilité de la tendance
    if (trend.direction === 'stable') {
      return 0.9;
    }
    
    // Plus le taux de changement est élevé, moins on est confiant
    return Math.max(0.1, 1 - (trend.rate / 10));
  }

  /**
   * Obtient les tendances actuelles
   * @returns {Object} Tendances
   */
  getTrends() {
    return { ...this.trends };
  }
}

/**
 * Gestionnaire d'alertes de performance
 */
class PerformanceAlertManager {
  constructor() {
    this.alerts = [];
    this.alertHandlers = new Map();
    this.suppressedAlerts = new Set();
    this.alertCooldowns = new Map();
  }

  /**
   * Enregistre un gestionnaire d'alerte
   * @param {string} alertType - Type d'alerte
   * @param {Function} handler - Gestionnaire
   */
  registerAlertHandler(alertType, handler) {
    if (!this.alertHandlers.has(alertType)) {
      this.alertHandlers.set(alertType, []);
    }
    this.alertHandlers.get(alertType).push(handler);
  }

  /**
   * Déclenche une alerte
   * @param {string} type - Type d'alerte
   * @param {number} severity - Niveau de sévérité
   * @param {string} message - Message d'alerte
   * @param {Object} data - Données associées
   */
  triggerAlert(type, severity, message, data = {}) {
    const alertKey = `${type}:${message}`;
    
    // Vérifier le cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey);
      const cooldownPeriod = this.getCooldownPeriod(severity);
      
      if (Date.now() - lastAlert < cooldownPeriod) {
        return; // Alerte en cooldown
      }
    }
    
    // Vérifier si l'alerte est supprimée
    if (this.suppressedAlerts.has(alertKey)) {
      return;
    }
    
    const alert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      data,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.push(alert);
    this.alertCooldowns.set(alertKey, Date.now());
    
    // Maintenir seulement les 100 dernières alertes
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    // Notifier les gestionnaires
    this.notifyHandlers(alert);
    
    // Log selon la sévérité
    this.logAlert(alert);
  }

  /**
   * Obtient la période de cooldown selon la sévérité
   * @param {number} severity - Niveau de sévérité
   * @returns {number} Période en millisecondes
   */
  getCooldownPeriod(severity) {
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL:
        return 10 * 1000;  // 10 secondes
      case SEVERITY_LEVELS.HIGH:
        return 30 * 1000;  // 30 secondes
      case SEVERITY_LEVELS.MEDIUM:
        return 60 * 1000;  // 1 minute
      case SEVERITY_LEVELS.LOW:
        return 300 * 1000; // 5 minutes
      default:
        return 60 * 1000;
    }
  }

  /**
   * Notifie les gestionnaires d'alerte
   * @param {Object} alert - Alerte
   */
  notifyHandlers(alert) {
    const handlers = this.alertHandlers.get(alert.type) || [];
    
    handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('[PerformanceAlertManager] Erreur handler:', error);
      }
    });
  }

  /**
   * Log une alerte selon sa sévérité
   * @param {Object} alert - Alerte
   */
  logAlert(alert) {
    const logMessage = `[Performance Alert] ${alert.message}`;
    
    switch (alert.severity) {
      case SEVERITY_LEVELS.CRITICAL:
        console.error(logMessage, alert.data);
        break;
      case SEVERITY_LEVELS.HIGH:
        console.warn(logMessage, alert.data);
        break;
      case SEVERITY_LEVELS.MEDIUM:
        console.warn(logMessage, alert.data);
        break;
      case SEVERITY_LEVELS.LOW:
        console.info(logMessage, alert.data);
        break;
    }
  }

  /**
   * Génère un ID unique pour une alerte
   * @returns {string} ID d'alerte
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Supprime une alerte
   * @param {string} alertKey - Clé d'alerte
   * @param {number} duration - Durée de suppression en ms
   */
  suppressAlert(alertKey, duration = 300000) { // 5 minutes par défaut
    this.suppressedAlerts.add(alertKey);
    
    setTimeout(() => {
      this.suppressedAlerts.delete(alertKey);
    }, duration);
  }

  /**
   * Obtient les alertes actives
   * @param {number} severity - Niveau de sévérité minimum
   * @returns {Array} Alertes
   */
  getActiveAlerts(severity = SEVERITY_LEVELS.LOW) {
    return this.alerts
      .filter(alert => !alert.resolved && alert.severity >= severity)
      .sort((a, b) => b.severity - a.severity || b.timestamp - a.timestamp);
  }

  /**
   * Marque une alerte comme résolue
   * @param {string} alertId - ID de l'alerte
   */
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }
}

/**
 * Moniteur de performance temps réel principal
 */
class RealTimePerformanceMonitor {
  constructor() {
    this.metricsCollector = new SystemMetricsCollector();
    this.trendAnalyzer = new PerformanceTrendAnalyzer();
    this.alertManager = new PerformanceAlertManager();
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    // Configuration
    this.config = {
      monitoringInterval: 1000,    // 1 seconde
      alertThresholds: { ...CRITICAL_THRESHOLDS },
      autoOptimization: true,
      detailedLogging: false
    };
    
    // Statistiques
    this.stats = {
      monitoringStartTime: null,
      totalAlerts: 0,
      criticalAlerts: 0,
      optimizationsTriggered: 0,
      averageResponseTime: 0
    };
    
    this.setupAlertHandlers();
  }

  /**
   * Configure les gestionnaires d'alerte par défaut
   */
  setupAlertHandlers() {
    // Gestionnaire pour les dépassements de seuil
    this.alertManager.registerAlertHandler(
      ALERT_TYPES.THRESHOLD_EXCEEDED,
      (alert) => this.handleThresholdAlert(alert)
    );
    
    // Gestionnaire pour les fuites mémoire
    this.alertManager.registerAlertHandler(
      ALERT_TYPES.MEMORY_LEAK,
      (alert) => this.handleMemoryLeakAlert(alert)
    );
    
    // Gestionnaire pour les pics CPU
    this.alertManager.registerAlertHandler(
      ALERT_TYPES.CPU_SPIKE,
      (alert) => this.handleCPUSpikeAlert(alert)
    );
    
    // Gestionnaire pour les opérations lentes
    this.alertManager.registerAlertHandler(
      ALERT_TYPES.SLOW_OPERATION,
      (alert) => this.handleSlowOperationAlert(alert)
    );
  }

  /**
   * Démarre le monitoring de performance
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.stats.monitoringStartTime = Date.now();
    
    // Démarrer la collecte de métriques système
    this.metricsCollector.startCollection();
    
    // Démarrer le monitoring principal
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.monitoringInterval);
    
    console.log('[RealTimePerformanceMonitor] Monitoring started');
  }

  /**
   * Arrête le monitoring de performance
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Arrêter la collecte de métriques
    this.metricsCollector.stopCollection();
    
    // Arrêter le monitoring principal
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[RealTimePerformanceMonitor] Monitoring stopped');
  }

  /**
   * Effectue un cycle de monitoring complet
   */
  performMonitoringCycle() {
    try {
      // Collecter les métriques système
      const systemMetrics = this.metricsCollector.getMetrics();
      
      // Collecter les métriques de performance de l'application
      const appMetrics = getAllPerformanceStats();
      
      // Analyser les tendances
      this.trendAnalyzer.addSample(systemMetrics);
      
      // Vérifier les seuils et déclencher des alertes
      this.checkThresholds(systemMetrics, appMetrics);
      
      // Détecter les anomalies
      this.detectAnomalies(systemMetrics);
      
      // Optimisation automatique si activée
      if (this.config.autoOptimization) {
        this.performAutoOptimization(systemMetrics, appMetrics);
      }
      
      // Log détaillé si activé
      if (this.config.detailedLogging) {
        this.logDetailedMetrics(systemMetrics, appMetrics);
      }
      
    } catch (error) {
      console.error('[RealTimePerformanceMonitor] Erreur cycle monitoring:', error);
    }
  }

  /**
   * Vérifie les seuils de performance
   * @param {Object} systemMetrics - Métriques système
   * @param {Object} appMetrics - Métriques application
   */
  checkThresholds(systemMetrics, appMetrics) {
    // Vérifier la mémoire
    if (systemMetrics.memory.used > this.config.alertThresholds.MEMORY_USAGE) {
      this.alertManager.triggerAlert(
        ALERT_TYPES.THRESHOLD_EXCEEDED,
        SEVERITY_LEVELS.HIGH,
        `Memory usage exceeded: ${(systemMetrics.memory.used / 1024 / 1024).toFixed(2)}MB`,
        { metric: 'memory', value: systemMetrics.memory.used, threshold: this.config.alertThresholds.MEMORY_USAGE }
      );
    }
    
    // Vérifier le CPU
    if (systemMetrics.cpu.usage > this.config.alertThresholds.CPU_USAGE) {
      this.alertManager.triggerAlert(
        ALERT_TYPES.CPU_SPIKE,
        SEVERITY_LEVELS.MEDIUM,
        `CPU usage exceeded: ${systemMetrics.cpu.usage.toFixed(1)}%`,
        { metric: 'cpu', value: systemMetrics.cpu.usage, threshold: this.config.alertThresholds.CPU_USAGE }
      );
    }
    
    // Vérifier les FPS
    if (systemMetrics.rendering.fps < this.config.alertThresholds.FRAME_RATE) {
      this.alertManager.triggerAlert(
        ALERT_TYPES.FRAME_DROP,
        SEVERITY_LEVELS.MEDIUM,
        `Frame rate dropped: ${systemMetrics.rendering.fps.toFixed(1)} FPS`,
        { metric: 'fps', value: systemMetrics.rendering.fps, threshold: this.config.alertThresholds.FRAME_RATE }
      );
    }
    
    // Vérifier les opérations lentes dans les métriques app
    for (const [operation, stats] of Object.entries(appMetrics)) {
      if (stats.avgDuration > this.getOperationThreshold(operation)) {
        this.alertManager.triggerAlert(
          ALERT_TYPES.SLOW_OPERATION,
          SEVERITY_LEVELS.MEDIUM,
          `Slow operation detected: ${operation} (${stats.avgDuration.toFixed(2)}ms)`,
          { operation, avgDuration: stats.avgDuration, threshold: this.getOperationThreshold(operation) }
        );
      }
    }
  }

  /**
   * Obtient le seuil pour une opération
   * @param {string} operation - Nom de l'opération
   * @returns {number} Seuil en millisecondes
   */
  getOperationThreshold(operation) {
    const thresholds = {
      [SIDEBAR_OPERATIONS.SIDEBAR_REFRESH]: this.config.alertThresholds.SIDEBAR_REFRESH,
      [SIDEBAR_OPERATIONS.INITIAL_LOAD]: this.config.alertThresholds.MODULE_LOAD,
      [SIDEBAR_OPERATIONS.STATISTICS_CALCULATION]: 50,
      [SIDEBAR_OPERATIONS.EVENT_EMISSION]: 10
    };
    
    return thresholds[operation] || 100;
  }

  /**
   * Détecte les anomalies de performance
   * @param {Object} systemMetrics - Métriques système
   */
  detectAnomalies(systemMetrics) {
    const trends = this.trendAnalyzer.getTrends();
    
    // Détecter une fuite mémoire potentielle
    if (trends.memory.direction === 'increasing' && trends.memory.rate > 1) {
      this.alertManager.triggerAlert(
        ALERT_TYPES.MEMORY_LEAK,
        SEVERITY_LEVELS.HIGH,
        `Potential memory leak detected (increasing at ${trends.memory.rate.toFixed(2)}%/s)`,
        { trend: trends.memory, currentUsage: systemMetrics.memory.percentage }
      );
    }
    
    // Détecter une dégradation des performances de rendu
    if (trends.fps.direction === 'decreasing' && trends.fps.rate > 2) {
      this.alertManager.triggerAlert(
        ALERT_TYPES.FRAME_DROP,
        SEVERITY_LEVELS.MEDIUM,
        `Rendering performance degrading (FPS decreasing at ${trends.fps.rate.toFixed(2)}/s)`,
        { trend: trends.fps, currentFPS: systemMetrics.rendering.fps }
      );
    }
  }

  /**
   * Effectue des optimisations automatiques
   * @param {Object} systemMetrics - Métriques système
   * @param {Object} appMetrics - Métriques application
   */
  performAutoOptimization(systemMetrics, appMetrics) {
    // Optimisation mémoire si usage élevé
    if (systemMetrics.memory.percentage > 80) {
      this.triggerMemoryOptimization();
    }
    
    // Optimisation CPU si usage élevé
    if (systemMetrics.cpu.usage > 70) {
      this.triggerCPUOptimization();
    }
    
    // Optimisation rendu si FPS bas
    if (systemMetrics.rendering.fps < 50) {
      this.triggerRenderingOptimization();
    }
  }

  /**
   * Déclenche l'optimisation mémoire
   */
  triggerMemoryOptimization() {
    console.log('[RealTimePerformanceMonitor] Triggering memory optimization');
    
    // Émettre un événement pour que les services nettoient leurs caches
    window.dispatchEvent(new CustomEvent('performance:optimize:memory', {
      detail: { trigger: 'auto', timestamp: Date.now() }
    }));
    
    this.stats.optimizationsTriggered++;
  }

  /**
   * Déclenche l'optimisation CPU
   */
  triggerCPUOptimization() {
    console.log('[RealTimePerformanceMonitor] Triggering CPU optimization');
    
    // Émettre un événement pour réduire la fréquence des opérations
    window.dispatchEvent(new CustomEvent('performance:optimize:cpu', {
      detail: { trigger: 'auto', timestamp: Date.now() }
    }));
    
    this.stats.optimizationsTriggered++;
  }

  /**
   * Déclenche l'optimisation du rendu
   */
  triggerRenderingOptimization() {
    console.log('[RealTimePerformanceMonitor] Triggering rendering optimization');
    
    // Émettre un événement pour réduire les animations
    window.dispatchEvent(new CustomEvent('performance:optimize:rendering', {
      detail: { trigger: 'auto', timestamp: Date.now() }
    }));
    
    this.stats.optimizationsTriggered++;
  }

  /**
   * Gestionnaires d'alerte spécialisés
   */
  
  handleThresholdAlert(alert) {
    this.stats.totalAlerts++;
    
    if (alert.severity >= SEVERITY_LEVELS.HIGH) {
      this.stats.criticalAlerts++;
    }
  }

  handleMemoryLeakAlert(alert) {
    this.stats.totalAlerts++;
    this.stats.criticalAlerts++;
    
    // Déclencher un nettoyage mémoire agressif
    this.triggerMemoryOptimization();
  }

  handleCPUSpikeAlert(alert) {
    this.stats.totalAlerts++;
    
    // Déclencher une optimisation CPU
    this.triggerCPUOptimization();
  }

  handleSlowOperationAlert(alert) {
    this.stats.totalAlerts++;
    
    // Log détaillé pour debug
    console.warn('[Performance] Slow operation:', alert.data);
  }

  /**
   * Log détaillé des métriques
   * @param {Object} systemMetrics - Métriques système
   * @param {Object} appMetrics - Métriques application
   */
  logDetailedMetrics(systemMetrics, appMetrics) {
    console.group('[Performance Metrics]');
    console.log('System:', {
      memory: `${(systemMetrics.memory.used / 1024 / 1024).toFixed(2)}MB (${systemMetrics.memory.percentage.toFixed(1)}%)`,
      cpu: `${systemMetrics.cpu.usage.toFixed(1)}%`,
      fps: `${systemMetrics.rendering.fps.toFixed(1)} FPS`,
      network: `${systemMetrics.network.downlink}Mbps (${systemMetrics.network.effectiveType})`
    });
    console.log('Application:', appMetrics);
    console.groupEnd();
  }

  /**
   * Obtient un rapport de performance complet
   * @returns {Object} Rapport détaillé
   */
  getPerformanceReport() {
    const systemMetrics = this.metricsCollector.getMetrics();
    const appMetrics = getAllPerformanceStats();
    const trends = this.trendAnalyzer.getTrends();
    const activeAlerts = this.alertManager.getActiveAlerts();
    const predictions = this.trendAnalyzer.predictFuture(5);
    
    return {
      timestamp: Date.now(),
      system: systemMetrics,
      application: appMetrics,
      trends,
      alerts: {
        active: activeAlerts,
        total: this.stats.totalAlerts,
        critical: this.stats.criticalAlerts
      },
      predictions,
      stats: {
        ...this.stats,
        uptime: this.stats.monitoringStartTime 
          ? Date.now() - this.stats.monitoringStartTime 
          : 0
      },
      health: this.calculateHealthScore(systemMetrics, activeAlerts)
    };
  }

  /**
   * Calcule un score de santé global
   * @param {Object} systemMetrics - Métriques système
   * @param {Array} activeAlerts - Alertes actives
   * @returns {Object} Score de santé
   */
  calculateHealthScore(systemMetrics, activeAlerts) {
    let score = 100;
    
    // Pénalités basées sur les métriques
    if (systemMetrics.memory.percentage > 80) score -= 20;
    if (systemMetrics.cpu.usage > 70) score -= 15;
    if (systemMetrics.rendering.fps < 50) score -= 15;
    
    // Pénalités basées sur les alertes
    activeAlerts.forEach(alert => {
      switch (alert.severity) {
        case SEVERITY_LEVELS.CRITICAL:
          score -= 25;
          break;
        case SEVERITY_LEVELS.HIGH:
          score -= 15;
          break;
        case SEVERITY_LEVELS.MEDIUM:
          score -= 10;
          break;
        case SEVERITY_LEVELS.LOW:
          score -= 5;
          break;
      }
    });
    
    score = Math.max(0, score);
    
    let status = 'excellent';
    if (score < 90) status = 'good';
    if (score < 70) status = 'fair';
    if (score < 50) status = 'poor';
    if (score < 30) status = 'critical';
    
    return { score, status };
  }

  /**
   * Met à jour la configuration
   * @param {Object} newConfig - Nouvelle configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtient les statistiques de monitoring
   * @returns {Object} Statistiques
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset les statistiques
   */
  resetStats() {
    this.stats = {
      monitoringStartTime: this.isMonitoring ? Date.now() : null,
      totalAlerts: 0,
      criticalAlerts: 0,
      optimizationsTriggered: 0,
      averageResponseTime: 0
    };
  }
}

// Instance singleton
export const realTimePerformanceMonitor = new RealTimePerformanceMonitor();

export default realTimePerformanceMonitor;