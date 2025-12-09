/**
 * Performance monitoring utilities for Sidebar Premium
 * Helps track memory usage, FPS, and interaction times
 */

/**
 * Monitor memory usage
 * @returns {Object} Memory stats in MB
 */
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

/**
 * Measure interaction time
 * @param {Function} callback - Function to measure
 * @returns {Promise<number>} Time in milliseconds
 */
export const measureInteraction = async (callback) => {
  const start = performance.now();
  await callback();
  const end = performance.now();
  return end - start;
};

/**
 * FPS Monitor
 * Tracks frames per second over a period
 */
export class FPSMonitor {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
    this.rafId = null;
  }

  start() {
    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastTime;
      this.lastTime = now;
      
      if (delta > 0) {
        const fps = 1000 / delta;
        this.frames.push(fps);
        
        // Keep only last 60 frames
        if (this.frames.length > 60) {
          this.frames.shift();
        }
      }
      
      this.rafId = requestAnimationFrame(measure);
    };
    
    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getAverageFPS() {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  getMinFPS() {
    if (this.frames.length === 0) return 0;
    return Math.round(Math.min(...this.frames));
  }

  getMaxFPS() {
    if (this.frames.length === 0) return 0;
    return Math.round(Math.max(...this.frames));
  }

  getStats() {
    return {
      average: this.getAverageFPS(),
      min: this.getMinFPS(),
      max: this.getMaxFPS(),
      samples: this.frames.length,
    };
  }
}

/**
 * Log performance metrics to console
 */
export const logPerformanceMetrics = () => {
  const memory = getMemoryUsage();
  
  console.group('🎯 Sidebar Performance Metrics');
  
  if (memory) {
    console.log(`💾 Memory: ${memory.used}MB / ${memory.total}MB (Limit: ${memory.limit}MB)`);
    console.log(`✅ Memory OK: ${memory.used < 50 ? 'YES' : 'NO'} (Target: < 50MB)`);
  }
  
  console.groupEnd();
};


/**
 * Create a throttled function
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay) => {
  let timeoutId = null;
  let lastRan = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastRan >= delay) {
      func.apply(this, args);
      lastRan = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, delay - (now - lastRan));
    }
  };
};

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId = null;

  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

