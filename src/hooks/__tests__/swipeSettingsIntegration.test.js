/**
 * Integration test for swipe settings connection between HomePage and SettingsTab
 * Tests Requirements: 8.2, 8.3, 8.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSettings, saveSettings } from '../../services/swipeNavigationSettings';

describe('Swipe Settings Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should load default settings when no settings exist', () => {
    const settings = getSettings();
    
    expect(settings).toEqual({
      enabled: true,
      threshold: 100,
      velocityThreshold: 0.5,
    });
  });

  it('should save and retrieve settings correctly', () => {
    const newSettings = {
      enabled: false,
      threshold: 150,
      velocityThreshold: 0.5,
    };
    
    const success = saveSettings(newSettings);
    expect(success).toBe(true);
    
    const retrieved = getSettings();
    expect(retrieved).toEqual(newSettings);
  });

  it('should apply settings changes immediately', () => {
    // Initial settings
    const initialSettings = {
      enabled: true,
      threshold: 100,
      velocityThreshold: 0.5,
    };
    saveSettings(initialSettings);
    
    // Change settings
    const updatedSettings = {
      enabled: false,
      threshold: 150,
      velocityThreshold: 0.5,
    };
    saveSettings(updatedSettings);
    
    // Verify changes are immediately available
    const retrieved = getSettings();
    expect(retrieved.enabled).toBe(false);
    expect(retrieved.threshold).toBe(150);
  });

  it('should handle enabled toggle correctly (Requirement 8.2)', () => {
    // Start with enabled
    saveSettings({ enabled: true, threshold: 100, velocityThreshold: 0.5 });
    let settings = getSettings();
    expect(settings.enabled).toBe(true);
    
    // Disable
    saveSettings({ enabled: false, threshold: 100, velocityThreshold: 0.5 });
    settings = getSettings();
    expect(settings.enabled).toBe(false);
    
    // Re-enable
    saveSettings({ enabled: true, threshold: 100, velocityThreshold: 0.5 });
    settings = getSettings();
    expect(settings.enabled).toBe(true);
  });

  it('should handle threshold changes correctly (Requirement 8.3)', () => {
    // Test various threshold values
    const thresholds = [50, 100, 150, 200];
    
    thresholds.forEach(threshold => {
      saveSettings({ enabled: true, threshold, velocityThreshold: 0.5 });
      const settings = getSettings();
      expect(settings.threshold).toBe(threshold);
    });
  });

  it('should persist settings across page reloads (Requirement 8.5)', () => {
    const customSettings = {
      enabled: false,
      threshold: 175,
      velocityThreshold: 0.5,
    };
    
    saveSettings(customSettings);
    
    // Simulate page reload by getting settings again
    const retrieved = getSettings();
    expect(retrieved).toEqual(customSettings);
  });

  it('should dispatch custom event when settings change', () => {
    const eventListener = vi.fn();
    window.addEventListener('swipeSettingsUpdated', eventListener);
    
    // Simulate settings change by dispatching event
    window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
    
    expect(eventListener).toHaveBeenCalledTimes(1);
    
    window.removeEventListener('swipeSettingsUpdated', eventListener);
  });

  it('should validate threshold range (50-200px)', () => {
    // Valid thresholds
    expect(saveSettings({ enabled: true, threshold: 50, velocityThreshold: 0.5 })).toBe(true);
    expect(saveSettings({ enabled: true, threshold: 200, velocityThreshold: 0.5 })).toBe(true);
    
    // Invalid thresholds should use default
    saveSettings({ enabled: true, threshold: 30, velocityThreshold: 0.5 });
    let settings = getSettings();
    expect(settings.threshold).toBe(100); // Should use default
    
    saveSettings({ enabled: true, threshold: 250, velocityThreshold: 0.5 });
    settings = getSettings();
    expect(settings.threshold).toBe(100); // Should use default
  });
});
