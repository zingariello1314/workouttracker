/**
 * Performance Optimization Service
 * 
 * Service pour optimiser les performances des statistiques de lecture
 * avec cache intelligent, debouncing et virtualisation.
 * 
 * Features:
 * - Cache intelligent avec invalidation automatique
 * - Debouncing des recalculs coûteux
 * - Virtualisation pour les grandes listes
 * - Memoization des transformations de données
 * 
 * @see Requirements 1.2, 10.3
 */

class PerformanceOptimizationService {
  constructor() {
    this.cache = new Map();
    this.debounceTimers = new Map();
    this.memoizedResults = new Map();
    this.cacheVersion = 0;
  }

  /**
   * Cache intelligent avec invalidation automatique
   */
  getCachedResult(key, computeFn, dependencies = []) {
    const cacheKey = this.generateCacheKey(key, dependencies);
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.result;
      }
    }

    // Calculer et mettre en cache
    const result = computeFn();
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      version: this.cacheVersion,
      dependencies: this.hashDependencies(dependencies)
    });

    return result;
  }

  /**
   * Debouncing pour les recalculs coûteux
   */
  debounce(key, fn, delay = 300) {
    return (...args) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Memoization avec gestion des dépendances
   */
  memoize(fn, keyGenerator) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (this.memoizedResults.has(key)) {
        return this.memoizedResults.get(key);
      }

      const result = fn(...args);
      this.memoizedResults.set(key, result);
      
      // Limiter la taille du cache memoized
      if (this.memoizedResults.size > 100) {
        const firstKey = this.memoizedResults.keys().next().value;
        this.memoizedResults.delete(firstKey);
      }

      return result;
    };
  }

  /**
   * Virtualisation pour les grandes listes
   */
  createVirtualizedData(items, startIndex, endIndex, itemHeight = 50) {
    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return {
      visibleItems,
      totalHeight,
      offsetY,
      startIndex,
      endIndex
    };
  }

  /**
   * Calculer les indices visibles pour la virtualisation
   */
  calculateVisibleRange(scrollTop, containerHeight, itemHeight, totalItems, overscan = 5) {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }

  /**
   * Invalidation du cache
   */
  invalidateCache(pattern = null) {
    if (pattern) {
      // Invalider seulement les clés qui matchent le pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalider tout le cache
      this.cache.clear();
      this.cacheVersion++;
    }
  }

  /**
   * Nettoyage des ressources
   */
  cleanup() {
    // Nettoyer les timers de debounce
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Nettoyer les caches
    this.cache.clear();
    this.memoizedResults.clear();
  }

  /**
   * Méthodes privées
   */
  generateCacheKey(key, dependencies) {
    const depHash = this.hashDependencies(dependencies);
    return `${key}_${depHash}_${this.cacheVersion}`;
  }

  hashDependencies(dependencies) {
    try {
      return btoa(JSON.stringify(dependencies)).slice(0, 16);
    } catch {
      return String(dependencies.length || 0);
    }
  }

  isCacheValid(cached, maxAge = 5 * 60 * 1000) { // 5 minutes par défaut
    return (
      cached.version === this.cacheVersion &&
      Date.now() - cached.timestamp < maxAge
    );
  }

  /**
   * Optimisation des transformations de données
   */
  optimizeDataTransformation(data, transformFn, chunkSize = 1000) {
    if (!Array.isArray(data) || data.length <= chunkSize) {
      return transformFn(data);
    }

    // Traitement par chunks pour éviter de bloquer le thread principal
    return new Promise((resolve) => {
      const result = [];
      let index = 0;

      const processChunk = () => {
        const chunk = data.slice(index, index + chunkSize);
        const transformedChunk = transformFn(chunk);
        result.push(...transformedChunk);
        
        index += chunkSize;

        if (index < data.length) {
          // Utiliser requestIdleCallback si disponible, sinon setTimeout
          if (window.requestIdleCallback) {
            window.requestIdleCallback(processChunk);
          } else {
            setTimeout(processChunk, 0);
          }
        } else {
          resolve(result);
        }
      };

      processChunk();
    });
  }

  /**
   * Monitoring des performances
   */
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Statistiques du cache
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      memoizedSize: this.memoizedResults.size,
      cacheVersion: this.cacheVersion,
      activeDebounceTimers: this.debounceTimers.size
    };
  }
}

// Instance singleton
const performanceOptimizationService = new PerformanceOptimizationService();

export default performanceOptimizationService;