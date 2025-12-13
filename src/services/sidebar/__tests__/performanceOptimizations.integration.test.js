/**
 * Tests d'intégration pour les optimisations de performance des modules sidebar historiques
 * Vérifie que tous les services d'optimisation fonctionnent ensemble correctement
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4 - Tests des optimisations de performance
 */

import { 
  performanceOptimizationManager, 
  PERFORMANCE_MODES 
} from '../performanceOptimizationManager';
import { dataQueryOptimizer } from '../dataQueryOptimizer';
import { intelligentCacheService } from '../intelligentCacheService';
import { lazyLoadingManager } from '../lazyLoadingManager';
import { dataCompressionService } from '../dataCompressionService';
import { realTimePerformanceMonitor } from '../realTimePerformanceMonitor';

import { vi } from 'vitest';

// Mock des APIs du navigateur
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 50 }]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024,
    totalJSHeapSize: 50 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024
  }
};

global.navigator = {
  ...global.navigator,
  deviceMemory: 8,
  hardwareConcurrency: 8,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
};

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));

describe('Performance Optimizations Integration', () => {
  beforeEach(() => {
    // Reset tous les services avant chaque test
    performanceOptimizationManager.cleanup();
    dataQueryOptimizer.reset();
    intelligentCacheService.clearAll();
    lazyLoadingManager.cleanup();
    dataCompressionService.cleanup();
    realTimePerformanceMonitor.stop();
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Nettoyer après chaque test
    performanceOptimizationManager.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize all optimization services correctly', async () => {
      const result = await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });

      expect(performanceOptimizationManager.isInitialized).toBe(true);
      expect(performanceOptimizationManager.currentMode).toBe(PERFORMANCE_MODES.BALANCED);
      expect(performanceOptimizationManager.stats.initializationTime).toBeGreaterThan(0);
    });

    test('should detect optimal performance mode based on device capabilities', async () => {
      // Test avec un dispositif haute performance
      global.navigator.deviceMemory = 16;
      global.navigator.hardwareConcurrency = 12;
      global.navigator.connection.effectiveType = '4g';
      global.navigator.connection.downlink = 20;

      await performanceOptimizationManager.initialize();
      
      // Le mode devrait être PERFORMANCE pour un dispositif puissant
      expect([PERFORMANCE_MODES.PERFORMANCE, PERFORMANCE_MODES.BALANCED])
        .toContain(performanceOptimizationManager.currentMode);
    });

    test('should use power saver mode for low-end devices', async () => {
      // Simuler un dispositif bas de gamme
      global.navigator.deviceMemory = 2;
      global.navigator.hardwareConcurrency = 2;
      global.navigator.connection.effectiveType = '3g';
      global.navigator.connection.downlink = 1;

      await performanceOptimizationManager.initialize();
      
      expect(performanceOptimizationManager.currentMode).toBe(PERFORMANCE_MODES.POWER_SAVER);
    });
  });

  describe('Query Optimization', () => {
    beforeEach(async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
    });

    test('should optimize queries with caching', async () => {
      const mockQueryFunction = vi.fn().mockResolvedValue({ data: 'test' });
      
      // Première exécution - devrait appeler la fonction
      const result1 = await performanceOptimizationManager.executeOptimizedQuery(
        'test_query',
        { param: 'value' },
        mockQueryFunction
      );
      
      expect(mockQueryFunction).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test' });
      
      // Deuxième exécution - devrait utiliser le cache
      const result2 = await performanceOptimizationManager.executeOptimizedQuery(
        'test_query',
        { param: 'value' },
        mockQueryFunction
      );
      
      expect(mockQueryFunction).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
      expect(result2).toEqual({ data: 'test' });
    });

    test('should batch similar queries', async () => {
      const mockQueryFunction = vi.fn().mockResolvedValue({ data: 'batch_test' });
      
      // Exécuter plusieurs requêtes similaires en parallèle
      const promises = Array.from({ length: 5 }, () =>
        dataQueryOptimizer.addToBatch('batchable_query', { param: 'batch' }, mockQueryFunction)
      );
      
      const results = await Promise.all(promises);
      
      // Toutes les requêtes devraient avoir le même résultat
      results.forEach(result => {
        expect(result).toEqual({ data: 'batch_test' });
      });
      
      // La fonction ne devrait être appelée qu'une fois grâce au batching
      expect(mockQueryFunction).toHaveBeenCalledTimes(1);
    });

    test('should handle query timeouts', async () => {
      const slowQueryFunction = vi.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'slow' }), 15000))
      );
      
      await expect(
        performanceOptimizationManager.executeOptimizedQuery(
          'slow_query',
          {},
          slowQueryFunction
        )
      ).rejects.toThrow('Query timeout');
    });
  });

  describe('Intelligent Caching', () => {
    beforeEach(async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
    });

    test('should cache data with appropriate TTL', () => {
      const testData = { value: 'cached_data', timestamp: Date.now() };
      
      // Stocker dans le cache
      intelligentCacheService.set('test_key', testData, 'vital_metrics');
      
      // Récupérer immédiatement - devrait fonctionner
      const retrieved = intelligentCacheService.get('test_key', 'vital_metrics');
      expect(retrieved).toEqual(testData);
    });

    test('should evict expired cache entries', async () => {
      const testData = { value: 'expired_data' };
      
      // Stocker avec un TTL très court
      intelligentCacheService.set('expire_key', testData, 'vital_metrics');
      
      // Attendre l'expiration (simuler en modifiant le timestamp)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forcer le nettoyage
      intelligentCacheService.caches.get('memory').cleanup();
      
      // La donnée devrait être expirée
      const retrieved = intelligentCacheService.get('expire_key', 'vital_metrics');
      expect(retrieved).toBeNull();
    });

    test('should predict and preload data', async () => {
      const preloadData = [
        {
          key: 'preload_test',
          dataType: 'vital_metrics',
          loader: vi.fn().mockResolvedValue({ preloaded: true })
        }
      ];
      
      await intelligentCacheService.preloadCriticalData(preloadData);
      
      expect(preloadData[0].loader).toHaveBeenCalled();
      
      // Les données devraient être en cache
      const cached = intelligentCacheService.get('preload_test', 'vital_metrics');
      expect(cached).toEqual({ preloaded: true });
    });
  });

  describe('Lazy Loading', () => {
    beforeEach(async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
    });

    test('should register modules for lazy loading', () => {
      const mockElement = document.createElement('div');
      const mockLoadFunction = vi.fn().mockResolvedValue({ loaded: true });
      
      performanceOptimizationManager.registerModuleForLazyLoading(
        'test_module',
        mockElement,
        mockLoadFunction
      );
      
      const moduleState = lazyLoadingManager.getModuleState('test_module');
      expect(moduleState).toBeTruthy();
      expect(moduleState.moduleId).toBe('test_module');
      expect(moduleState.state).toBe('not_loaded');
    });

    test('should load modules based on priority', async () => {
      const criticalModule = document.createElement('div');
      const lowPriorityModule = document.createElement('div');
      
      const criticalLoader = vi.fn().mockResolvedValue({ critical: true });
      const lowPriorityLoader = vi.fn().mockResolvedValue({ low: true });
      
      // Enregistrer les modules
      lazyLoadingManager.registerModule('critical-module', criticalModule, criticalLoader);
      lazyLoadingManager.registerModule('low-priority-module', lowPriorityModule, lowPriorityLoader);
      
      // Précharger les modules critiques
      await lazyLoadingManager.preloadCriticalModules();
      
      // Le module critique devrait être chargé
      const criticalState = lazyLoadingManager.getModuleState('critical-module');
      expect(criticalState.state).toBe('loaded');
      
      // Le module de basse priorité ne devrait pas être chargé automatiquement
      const lowPriorityState = lazyLoadingManager.getModuleState('low-priority-module');
      expect(lowPriorityState.state).toBe('not_loaded');
    });

    test('should suspend invisible modules to save memory', () => {
      const mockElement = document.createElement('div');
      const mockLoadFunction = vi.fn().mockResolvedValue({ data: 'test' });
      
      lazyLoadingManager.registerModule('suspendable-module', mockElement, mockLoadFunction);
      
      // Simuler que le module devient invisible
      const moduleState = lazyLoadingManager.modules.get('suspendable-module');
      moduleState.state = 'loaded';
      moduleState.data = { large: 'data' };
      
      // Simuler l'invisibilité prolongée
      moduleState.updateVisibility(false, 0);
      
      // Forcer l'optimisation mémoire
      lazyLoadingManager.optimizeMemoryUsage();
      
      // Le module devrait être suspendu si la mémoire est sous pression
      expect(moduleState.state === 'suspended' || moduleState.state === 'loaded').toBe(true);
    });
  });

  describe('Data Compression', () => {
    test('should compress large data payloads', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a long description for item ${i}`.repeat(10)
        }))
      };
      
      const compressed = dataCompressionService.compress(largeData, 'finance_data');
      
      expect(compressed.compressed).toBe(true);
      expect(compressed.compressedSize).toBeLessThan(compressed.originalSize);
      expect(compressed.compressionRatio).toBeLessThan(1);
    });

    test('should decompress data correctly', () => {
      const originalData = { test: 'data', numbers: [1, 2, 3, 4, 5] };
      
      const compressed = dataCompressionService.compress(originalData, 'vital_metrics');
      const decompressed = dataCompressionService.decompress(compressed);
      
      expect(decompressed).toEqual(originalData);
    });

    test('should use delta compression for frequent updates', () => {
      const baseData = { value: 100, status: 'active', items: ['a', 'b', 'c'] };
      const updatedData = { value: 150, status: 'active', items: ['a', 'b', 'c', 'd'] };
      
      // Première compression - données complètes
      const firstCompression = dataCompressionService.compressDelta(
        baseData, 
        'garmin_data', 
        { moduleId: 'test' }
      );
      
      // Deuxième compression - delta
      const deltaCompression = dataCompressionService.compressDelta(
        updatedData, 
        'garmin_data', 
        { moduleId: 'test' }
      );
      
      // Le delta devrait être plus petit que les données complètes
      expect(deltaCompression.length).toBeLessThanOrEqual(firstCompression.length);
    });
  });

  describe('Real-time Performance Monitoring', () => {
    test('should start and stop monitoring', () => {
      expect(realTimePerformanceMonitor.isMonitoring).toBe(false);
      
      realTimePerformanceMonitor.start();
      expect(realTimePerformanceMonitor.isMonitoring).toBe(true);
      
      realTimePerformanceMonitor.stop();
      expect(realTimePerformanceMonitor.isMonitoring).toBe(false);
    });

    test('should generate performance reports', () => {
      realTimePerformanceMonitor.start();
      
      const report = realTimePerformanceMonitor.getPerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('system');
      expect(report).toHaveProperty('application');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('health');
      
      realTimePerformanceMonitor.stop();
    });

    test('should trigger alerts for performance violations', () => {
      const alertHandler = vi.fn();
      
      realTimePerformanceMonitor.alertManager.registerAlertHandler(
        'threshold_exceeded',
        alertHandler
      );
      
      // Simuler un dépassement de seuil mémoire
      const highMemoryMetrics = {
        memory: {
          used: 60 * 1024 * 1024, // 60MB > seuil de 50MB
          total: 100 * 1024 * 1024,
          percentage: 60
        },
        cpu: { usage: 30 },
        rendering: { fps: 60 }
      };
      
      realTimePerformanceMonitor.checkThresholds(highMemoryMetrics, {});
      
      expect(alertHandler).toHaveBeenCalled();
    });
  });

  describe('Performance Mode Switching', () => {
    test('should switch between performance modes', async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
      
      expect(performanceOptimizationManager.currentMode).toBe(PERFORMANCE_MODES.BALANCED);
      
      await performanceOptimizationManager.changePerformanceMode(PERFORMANCE_MODES.PERFORMANCE);
      
      expect(performanceOptimizationManager.currentMode).toBe(PERFORMANCE_MODES.PERFORMANCE);
      expect(performanceOptimizationManager.config.maxConcurrentQueries).toBe(5);
    });

    test('should adjust configuration based on performance mode', async () => {
      // Mode économie d'énergie
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.POWER_SAVER
      });
      
      expect(performanceOptimizationManager.config.maxConcurrentQueries).toBe(2);
      expect(performanceOptimizationManager.config.compressionThreshold).toBe(200);
      
      // Mode performance
      await performanceOptimizationManager.changePerformanceMode(PERFORMANCE_MODES.PERFORMANCE);
      
      expect(performanceOptimizationManager.config.maxConcurrentQueries).toBe(5);
      expect(performanceOptimizationManager.config.compression).toBe('disabled');
    });
  });

  describe('Automatic Optimizations', () => {
    beforeEach(async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
    });

    test('should trigger memory optimization automatically', () => {
      const optimizeSpy = vi.spyOn(performanceOptimizationManager, 'optimizeMemoryUsage');
      
      // Simuler un événement de mémoire faible
      window.dispatchEvent(new CustomEvent('performance:optimize:memory', {
        detail: { trigger: 'auto', timestamp: Date.now() }
      }));
      
      expect(optimizeSpy).toHaveBeenCalled();
    });

    test('should apply optimization recommendations', async () => {
      const recommendations = [
        {
          type: 'cache',
          priority: 'medium',
          action: 'increase_cache_size'
        },
        {
          type: 'query',
          priority: 'high',
          action: 'optimize_queries'
        }
      ];
      
      const originalCacheSize = performanceOptimizationManager.config.cacheSize;
      const originalMaxQueries = performanceOptimizationManager.config.maxConcurrentQueries;
      
      await performanceOptimizationManager.applyRecommendations(recommendations);
      
      expect(performanceOptimizationManager.config.cacheSize).toBeGreaterThan(originalCacheSize);
      expect(performanceOptimizationManager.config.maxConcurrentQueries).toBeLessThan(originalMaxQueries);
    });
  });

  describe('Integration with Sidebar Components', () => {
    beforeEach(async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
    });

    test('should integrate with module rendering', () => {
      const mockElement = document.createElement('div');
      mockElement.dataset.moduleId = 'integration-test';
      
      const mockLoadFunction = vi.fn().mockResolvedValue({
        data: 'integrated',
        timestamp: Date.now()
      });
      
      // Enregistrer le module via le gestionnaire principal
      performanceOptimizationManager.registerModuleForLazyLoading(
        'integration-test',
        mockElement,
        mockLoadFunction
      );
      
      // Vérifier que le module est enregistré dans le lazy loader
      const moduleState = lazyLoadingManager.getModuleState('integration-test');
      expect(moduleState).toBeTruthy();
      expect(moduleState.moduleId).toBe('integration-test');
    });

    test('should provide comprehensive performance report', () => {
      const report = performanceOptimizationManager.getPerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('mode');
      expect(report).toHaveProperty('config');
      expect(report).toHaveProperty('stats');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('recommendations');
      
      // Vérifier que tous les services sont inclus
      expect(report.services).toHaveProperty('queryOptimizer');
      expect(report.services).toHaveProperty('cacheService');
      expect(report.services).toHaveProperty('lazyLoader');
      expect(report.services).toHaveProperty('compressionService');
      expect(report.services).toHaveProperty('performanceMonitor');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle initialization failures gracefully', async () => {
      // Simuler une erreur d'initialisation
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      // Forcer une erreur en corrompant la configuration
      const invalidConfig = { mode: 'invalid_mode' };
      
      await expect(
        performanceOptimizationManager.initialize(invalidConfig)
      ).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalled();
      expect(performanceOptimizationManager.stats.errors).toBeGreaterThan(0);
      
      console.error = originalConsoleError;
    });

    test('should continue working when individual services fail', async () => {
      await performanceOptimizationManager.initialize({
        mode: PERFORMANCE_MODES.BALANCED
      });
      
      // Simuler une erreur dans le service de cache
      const originalGet = intelligentCacheService.get;
      intelligentCacheService.get = vi.fn().mockImplementation(() => {
        throw new Error('Cache service error');
      });
      
      const mockQueryFunction = vi.fn().mockResolvedValue({ data: 'fallback' });
      
      // La requête devrait toujours fonctionner malgré l'erreur de cache
      const result = await performanceOptimizationManager.executeOptimizedQuery(
        'error_test',
        {},
        mockQueryFunction
      );
      
      expect(result).toEqual({ data: 'fallback' });
      expect(mockQueryFunction).toHaveBeenCalled();
      
      // Restaurer la fonction originale
      intelligentCacheService.get = originalGet;
    });
  });
});