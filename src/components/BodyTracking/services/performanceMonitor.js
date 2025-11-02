/**
 * Performance Monitor - Système de Monitoring Performance
 * 
 * Collecte et analyse métriques performance:
 * - Temps chargement composants
 * - Cache hit/miss rates
 * - Worker pool statistics
 * - Memory usage
 * - Network performance
 * - React render times
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import logger from '../../../utils/logger';

const log = logger.module('PerformanceMonitor');

/**
 * Monitor Performance avec collecte métriques et analytics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Composants
      componentLoads: new Map(), // componentName → [timestamps]
      componentRenderTimes: new Map(), // componentName → [renderTimes]
      
      // Cache
      cacheHits: 0,
      cacheMisses: 0,
      cacheAccessTimes: [], // Temps accès cache (ms)
      
      // Workers
      workerTasks: new Map(), // taskId → {startTime, endTime, duration}
      workerQueueWaits: [], // Temps attente queue (ms)
      
      // API Calls
      apiCalls: [], // {endpoint, method, duration, success, timestamp}
      
      // Memory
      memorySnapshots: [], // {timestamp, usedJSHeapSize, totalJSHeapSize}
      
      // Network
      networkRequests: [] // {url, type, duration, size, timestamp}
    };
    
    this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';
    this.samplingRate = 1.0; // 100% en dev, peut être réduit en prod
    
    // Auto-collect memory snapshots (toutes les 30s)
    if (this.enabled && typeof performance !== 'undefined') {
      this.startMemoryMonitoring();
    }
    
    log.info('Performance Monitor initialisé', { enabled: this.enabled });
  }

  /**
   * Marque début chargement composant
   */
  markComponentLoadStart(componentName) {
    if (!this.enabled || Math.random() > this.samplingRate) return;
    
    const now = performance.now();
    
    if (!this.metrics.componentLoads.has(componentName)) {
      this.metrics.componentLoads.set(componentName, []);
    }
    
    this.metrics.componentLoads.get(componentName).push({
      startTime: now,
      timestamp: Date.now()
    });
  }

  /**
   * Marque fin chargement composant
   */
  markComponentLoadEnd(componentName) {
    if (!this.enabled || Math.random() > this.samplingRate) return;
    
    const now = performance.now();
    const loads = this.metrics.componentLoads.get(componentName);
    
    if (!loads || loads.length === 0) return;
    
    const lastLoad = loads[loads.length - 1];
    if (lastLoad.endTime) return; // Déjà terminé
    
    lastLoad.endTime = now;
    lastLoad.duration = now - lastLoad.startTime;
    
    log.debug(`Composant ${componentName} chargé en ${lastLoad.duration.toFixed(2)}ms`);
  }

  /**
   * Enregistre temps rendu composant React
   */
  recordComponentRender(componentName, renderTime) {
    if (!this.enabled || Math.random() > this.samplingRate) return;
    
    if (!this.metrics.componentRenderTimes.has(componentName)) {
      this.metrics.componentRenderTimes.set(componentName, []);
    }
    
    this.metrics.componentRenderTimes.get(componentName).push(renderTime);
  }

  /**
   * Enregistre cache hit
   */
  recordCacheHit(accessTime) {
    if (!this.enabled) return;
    
    this.metrics.cacheHits++;
    if (accessTime !== undefined) {
      this.metrics.cacheAccessTimes.push(accessTime);
    }
  }

  /**
   * Enregistre cache miss
   */
  recordCacheMiss(accessTime) {
    if (!this.enabled) return;
    
    this.metrics.cacheMisses++;
    if (accessTime !== undefined) {
      this.metrics.cacheAccessTimes.push(accessTime);
    }
  }

  /**
   * Enregistre tâche worker
   */
  recordWorkerTask(taskId, startTime, endTime) {
    if (!this.enabled) return;
    
    const duration = endTime - startTime;
    this.metrics.workerTasks.set(taskId, {
      startTime,
      endTime,
      duration
    });
  }

  /**
   * Enregistre temps attente queue worker
   */
  recordWorkerQueueWait(waitTime) {
    if (!this.enabled) return;
    
    this.metrics.workerQueueWaits.push(waitTime);
  }

  /**
   * Enregistre appel API
   */
  recordAPICall(endpoint, method, duration, success = true) {
    if (!this.enabled || Math.random() > this.samplingRate) return;
    
    this.metrics.apiCalls.push({
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  /**
   * Enregistre requête réseau
   */
  recordNetworkRequest(url, type, duration, size = null) {
    if (!this.enabled || Math.random() > this.samplingRate) return;
    
    this.metrics.networkRequests.push({
      url,
      type,
      duration,
      size,
      timestamp: Date.now()
    });
  }

  /**
   * Démarre monitoring mémoire
   */
  startMemoryMonitoring(interval = 30000) {
    if (typeof performance === 'undefined' || !performance.memory) {
      log.warn('Performance.memory non disponible');
      return;
    }
    
    setInterval(() => {
      this.recordMemorySnapshot();
    }, interval);
  }

  /**
   * Enregistre snapshot mémoire
   */
  recordMemorySnapshot() {
    if (typeof performance === 'undefined' || !performance.memory) return;
    
    this.metrics.memorySnapshots.push({
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    });
    
    // Garder seulement 100 derniers snapshots
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots.shift();
    }
  }

  /**
   * Calcule statistiques composants
   */
  getComponentStats(componentName = null) {
    const stats = {};
    
    if (componentName) {
      // Stats pour un composant spécifique
      const loads = this.metrics.componentLoads.get(componentName) || [];
      const renderTimes = this.metrics.componentRenderTimes.get(componentName) || [];
      
      const loadDurations = loads
        .filter(l => l.duration !== undefined)
        .map(l => l.duration);
      
      return {
        name: componentName,
        loadCount: loads.length,
        averageLoadTime: loadDurations.length > 0
          ? loadDurations.reduce((a, b) => a + b, 0) / loadDurations.length
          : 0,
        minLoadTime: loadDurations.length > 0 ? Math.min(...loadDurations) : 0,
        maxLoadTime: loadDurations.length > 0 ? Math.max(...loadDurations) : 0,
        averageRenderTime: renderTimes.length > 0
          ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
          : 0,
        renderCount: renderTimes.length
      };
    }
    
    // Stats pour tous composants
    for (const [name] of this.metrics.componentLoads) {
      stats[name] = this.getComponentStats(name);
    }
    
    return stats;
  }

  /**
   * Calcule statistiques cache
   */
  getCacheStats() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
    
    const accessTimes = this.metrics.cacheAccessTimes;
    const averageAccessTime = accessTimes.length > 0
      ? accessTimes.reduce((a, b) => a + b, 0) / accessTimes.length
      : 0;
    
    return {
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      total,
      hitRate: hitRate.toFixed(2),
      averageAccessTime: averageAccessTime.toFixed(2),
      minAccessTime: accessTimes.length > 0 ? Math.min(...accessTimes).toFixed(2) : 0,
      maxAccessTime: accessTimes.length > 0 ? Math.max(...accessTimes).toFixed(2) : 0
    };
  }

  /**
   * Calcule statistiques workers
   */
  getWorkerStats() {
    const tasks = Array.from(this.metrics.workerTasks.values());
    const durations = tasks.map(t => t.duration);
    const queueWaits = this.metrics.workerQueueWaits;
    
    return {
      totalTasks: tasks.length,
      averageTaskDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      minTaskDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxTaskDuration: durations.length > 0 ? Math.max(...durations) : 0,
      averageQueueWait: queueWaits.length > 0
        ? queueWaits.reduce((a, b) => a + b, 0) / queueWaits.length
        : 0,
      maxQueueWait: queueWaits.length > 0 ? Math.max(...queueWaits) : 0
    };
  }

  /**
   * Calcule statistiques API
   */
  getAPIStats() {
    const calls = this.metrics.apiCalls;
    const durations = calls.map(c => c.duration);
    const successCount = calls.filter(c => c.success).length;
    
    return {
      totalCalls: calls.length,
      successCount,
      failureCount: calls.length - successCount,
      successRate: calls.length > 0 ? (successCount / calls.length) * 100 : 0,
      averageDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0
    };
  }

  /**
   * Calcule statistiques mémoire
   */
  getMemoryStats() {
    const snapshots = this.metrics.memorySnapshots;
    
    if (snapshots.length === 0) {
      return {
        available: false,
        message: 'Aucune donnée mémoire disponible'
      };
    }
    
    const latest = snapshots[snapshots.length - 1];
    const oldest = snapshots[0];
    
    const usedGrowth = latest.usedJSHeapSize - oldest.usedJSHeapSize;
    const growthPercentage = oldest.usedJSHeapSize > 0
      ? (usedGrowth / oldest.usedJSHeapSize) * 100
      : 0;
    
    return {
      available: true,
      current: {
        used: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2), // MB
        total: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2), // MB
        limit: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2), // MB
        percentage: ((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(2)
      },
      growth: {
        bytes: usedGrowth,
        mb: (usedGrowth / 1024 / 1024).toFixed(2),
        percentage: growthPercentage.toFixed(2),
        period: latest.timestamp - oldest.timestamp // ms
      },
      snapshots: snapshots.length
    };
  }

  /**
   * Obtient toutes statistiques
   */
  getAllStats() {
    return {
      components: this.getComponentStats(),
      cache: this.getCacheStats(),
      workers: this.getWorkerStats(),
      api: this.getAPIStats(),
      memory: this.getMemoryStats(),
      summary: this.getSummary()
    };
  }

  /**
   * Résumé performance global
   */
  getSummary() {
    const cacheStats = this.getCacheStats();
    const workerStats = this.getWorkerStats();
    const apiStats = this.getAPIStats();
    const memoryStats = this.getMemoryStats();
    
    return {
      cacheHitRate: `${cacheStats.hitRate}%`,
      averageWorkerTaskTime: `${workerStats.averageTaskDuration.toFixed(2)}ms`,
      averageAPITime: `${apiStats.averageDuration.toFixed(2)}ms`,
      memoryUsage: memoryStats.available 
        ? `${memoryStats.current.percentage}%`
        : 'N/A'
    };
  }

  /**
   * Export métriques pour analyse externe
   */
  exportMetrics(format = 'json') {
    const data = {
      timestamp: Date.now(),
      metrics: {
        ...this.metrics,
        // Convertir Maps en objets pour JSON
        componentLoads: Object.fromEntries(this.metrics.componentLoads),
        componentRenderTimes: Object.fromEntries(this.metrics.componentRenderTimes),
        workerTasks: Object.fromEntries(this.metrics.workerTasks)
      },
      stats: this.getAllStats()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }

  /**
   * Nettoie anciennes métriques (garder seulement récentes)
   */
  cleanOldMetrics(maxAge = 3600000) { // 1h par défaut
    const now = Date.now();
    const cutoff = now - maxAge;
    
    // Nettoyer API calls anciennes
    this.metrics.apiCalls = this.metrics.apiCalls.filter(
      call => call.timestamp > cutoff
    );
    
    // Nettoyer network requests anciennes
    this.metrics.networkRequests = this.metrics.networkRequests.filter(
      req => req.timestamp > cutoff
    );
    
    // Nettoyer memory snapshots (garder seulement 100 derniers)
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots = this.metrics.memorySnapshots.slice(-100);
    }
    
    log.debug('Métriques anciennes nettoyées');
  }

  /**
   * Réinitialise toutes métriques
   */
  reset() {
    this.metrics = {
      componentLoads: new Map(),
      componentRenderTimes: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      cacheAccessTimes: [],
      workerTasks: new Map(),
      workerQueueWaits: [],
      apiCalls: [],
      memorySnapshots: [],
      networkRequests: []
    };
    
    log.info('Métriques performance réinitialisées');
  }

  /**
   * Active/désactive monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    log.info(`Performance Monitor ${enabled ? 'activé' : 'désactivé'}`);
  }

  /**
   * Obtient état monitoring
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton
let monitorInstance = null;

/**
 * Obtient instance singleton Performance Monitor
 */
export const getPerformanceMonitor = () => {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
};

export default PerformanceMonitor;

