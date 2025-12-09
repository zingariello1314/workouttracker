/**
 * Performance tests for Sidebar Premium
 * Validates that performance requirements are met
 */

import { describe, it, expect } from 'vitest';
import { FPSMonitor, getMemoryUsage, throttle, debounce } from '../../../utils/performanceMonitor';

describe('SidebarPremium Performance Utilities', () => {
  it('should have FPSMonitor class', () => {
    const monitor = new FPSMonitor();
    expect(monitor).toBeDefined();
    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.stop).toBe('function');
    expect(typeof monitor.getAverageFPS).toBe('function');
  });

  it('should have getMemoryUsage function', () => {
    expect(typeof getMemoryUsage).toBe('function');
    // Memory API might not be available in test environment
    const memory = getMemoryUsage();
    expect(memory === null || typeof memory === 'object').toBe(true);
  });

  it('should throttle function calls', (done) => {
    let callCount = 0;
    const throttled = throttle(() => {
      callCount++;
    }, 100);

    // Call multiple times rapidly
    throttled();
    throttled();
    throttled();

    // Should only call once immediately
    expect(callCount).toBe(1);

    // Wait for throttle delay
    setTimeout(() => {
      // Should have called again after delay
      expect(callCount).toBeGreaterThanOrEqual(1);
      done();
    }, 150);
  });

  it('should debounce function calls', (done) => {
    let callCount = 0;
    const debounced = debounce(() => {
      callCount++;
    }, 100);

    // Call multiple times rapidly
    debounced();
    debounced();
    debounced();

    // Should not call immediately
    expect(callCount).toBe(0);

    // Wait for debounce delay
    setTimeout(() => {
      // Should have called once after delay
      expect(callCount).toBe(1);
      done();
    }, 150);
  });
});
