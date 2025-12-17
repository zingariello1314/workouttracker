/**
 * Tests for User Preferences Service
 * 
 * Tests unitaires pour le service de gestion des préférences utilisateur
 * dans les statistiques de lecture.
 * 
 * @see Requirements 10.5, 9.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import userPreferencesService from '../userPreferencesService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('UserPreferencesService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset service state by creating a fresh instance
    userPreferencesService.resetPreferences();
    
    // Clear any existing favorite comparisons
    const favorites = userPreferencesService.getFavoriteComparisons();
    favorites.forEach(fav => {
      userPreferencesService.removeFavoriteComparison(fav.id);
    });
  });

  describe('Basic Functionality', () => {
    it('should load default preferences when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const preferences = userPreferencesService.getPreferences();
      
      expect(preferences).toBeDefined();
      expect(preferences.filters.selectedPeriod).toBe('1m');
      expect(preferences.display.activeChart).toBe('pages-per-day');
      expect(preferences.favoriteComparisons).toEqual([]);
    });

    it('should save preferences to localStorage', () => {
      const result = userPreferencesService.savePreferences();
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reading_statistics_preferences',
        expect.any(String)
      );
    });

    it('should update filters and persist them', () => {
      const newFilters = {
        selectedPeriod: '3m',
        genre: 'fiction',
        status: 'completed'
      };
      
      userPreferencesService.updateFilters(newFilters);
      
      const preferences = userPreferencesService.getPreferences();
      expect(preferences.filters.selectedPeriod).toBe('3m');
      expect(preferences.filters.genre).toBe('fiction');
      expect(preferences.filters.status).toBe('completed');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update display preferences', () => {
      const newDisplay = {
        activeChart: 'reading-speed',
        comparisonMode: true
      };
      
      userPreferencesService.updateDisplayPreferences(newDisplay);
      
      const preferences = userPreferencesService.getPreferences();
      expect(preferences.display.activeChart).toBe('reading-speed');
      expect(preferences.display.comparisonMode).toBe(true);
    });
  });

  describe('Favorite Comparisons', () => {
    it('should add a favorite comparison', () => {
      const comparison = {
        name: 'Test Comparison',
        period1: { key: '1m', label: '1 mois' },
        period2: { key: '3m', label: '3 mois' },
        filters: { genre: 'fiction' }
      };
      
      const result = userPreferencesService.addFavoriteComparison(comparison);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Comparison');
      expect(result.createdAt).toBeDefined();
      
      const favorites = userPreferencesService.getFavoriteComparisons();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe('Test Comparison');
    });

    it('should remove a favorite comparison', () => {
      // Add a comparison first
      const comparison = {
        name: 'Test Comparison',
        period1: { key: '1m', label: '1 mois' },
        period2: { key: '3m', label: '3 mois' }
      };
      
      const added = userPreferencesService.addFavoriteComparison(comparison);
      expect(userPreferencesService.getFavoriteComparisons()).toHaveLength(1);
      
      // Remove it
      const removed = userPreferencesService.removeFavoriteComparison(added.id);
      
      expect(removed).toBeDefined();
      expect(removed.id).toBe(added.id);
      expect(userPreferencesService.getFavoriteComparisons()).toHaveLength(0);
    });

    it('should limit favorite comparisons to 10', () => {
      // Add 12 comparisons
      for (let i = 0; i < 12; i++) {
        userPreferencesService.addFavoriteComparison({
          name: `Comparison ${i}`,
          period1: { key: '1m', label: '1 mois' },
          period2: { key: '3m', label: '3 mois' }
        });
      }
      
      const favorites = userPreferencesService.getFavoriteComparisons();
      expect(favorites).toHaveLength(10);
    });
  });

  describe('Expandable Sections', () => {
    it('should toggle section expansion state', () => {
      const sectionId = 'test-section';
      
      // Initially not expanded
      expect(userPreferencesService.isSectionExpanded(sectionId)).toBe(false);
      
      // Toggle to expanded
      userPreferencesService.toggleExpandedSection(sectionId);
      expect(userPreferencesService.isSectionExpanded(sectionId)).toBe(true);
      
      // Toggle back to collapsed
      userPreferencesService.toggleExpandedSection(sectionId);
      expect(userPreferencesService.isSectionExpanded(sectionId)).toBe(false);
    });

    it('should persist expanded sections', () => {
      const sectionId = 'persistent-section';
      
      userPreferencesService.toggleExpandedSection(sectionId);
      
      const preferences = userPreferencesService.getPreferences();
      expect(preferences.display.expandedSections).toContain(sectionId);
    });
  });

  describe('Chart Settings', () => {
    it('should update chart settings', () => {
      const newSettings = {
        showTooltips: false,
        showLegend: false,
        animationsEnabled: false
      };
      
      userPreferencesService.updateChartSettings(newSettings);
      
      const preferences = userPreferencesService.getPreferences();
      expect(preferences.display.chartSettings.showTooltips).toBe(false);
      expect(preferences.display.chartSettings.showLegend).toBe(false);
      expect(preferences.display.chartSettings.animationsEnabled).toBe(false);
    });
  });

  describe('Import/Export', () => {
    it('should export preferences', () => {
      // Set some preferences first
      userPreferencesService.updateFilters({ selectedPeriod: '6m' });
      
      const exported = userPreferencesService.exportPreferences();
      
      expect(exported).toBeDefined();
      expect(exported.data).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
      expect(exported.version).toBeDefined();
      expect(exported.data.filters.selectedPeriod).toBe('6m');
    });

    it('should import preferences', () => {
      const importData = {
        data: {
          filters: { selectedPeriod: '1y', genre: 'sci-fi' },
          display: { activeChart: 'heatmap-calendar' }
        },
        version: '1.0.0'
      };
      
      const result = userPreferencesService.importPreferences(importData);
      
      expect(result).toBe(true);
      
      const preferences = userPreferencesService.getPreferences();
      expect(preferences.filters.selectedPeriod).toBe('1y');
      expect(preferences.filters.genre).toBe('sci-fi');
      expect(preferences.display.activeChart).toBe('heatmap-calendar');
    });

    it('should handle invalid import data', () => {
      const result = userPreferencesService.importPreferences({ invalid: 'data' });
      
      expect(result).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on preference changes', () => {
      const listener = vi.fn();
      
      const unsubscribe = userPreferencesService.addListener(listener);
      
      userPreferencesService.updateFilters({ selectedPeriod: '3m' });
      
      expect(listener).toHaveBeenCalledWith('filters_updated', expect.any(Object));
      
      unsubscribe();
    });

    it('should remove listeners properly', () => {
      const listener = vi.fn();
      
      const unsubscribe = userPreferencesService.addListener(listener);
      unsubscribe();
      
      userPreferencesService.updateFilters({ selectedPeriod: '3m' });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove old favorite comparisons during cleanup', () => {
      // Add an old comparison (simulate 7 months ago)
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 7);
      
      const comparison = {
        name: 'Old Comparison',
        period1: { key: '1m', label: '1 mois' },
        period2: { key: '3m', label: '3 mois' }
      };
      
      const added = userPreferencesService.addFavoriteComparison(comparison);
      
      // Manually set old date
      const preferences = userPreferencesService.getPreferences();
      preferences.favoriteComparisons[0].createdAt = oldDate.toISOString();
      
      // Run cleanup
      userPreferencesService.cleanup();
      
      const favorites = userPreferencesService.getFavoriteComparisons();
      expect(favorites).toHaveLength(0);
    });
  });

  describe('Usage Stats', () => {
    it('should provide usage statistics', () => {
      // Add some data
      userPreferencesService.addFavoriteComparison({
        name: 'Test',
        period1: { key: '1m', label: '1 mois' },
        period2: { key: '3m', label: '3 mois' }
      });
      
      userPreferencesService.toggleExpandedSection('test-section');
      
      const stats = userPreferencesService.getUsageStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalComparisons).toBe(1);
      expect(stats.expandedSectionsCount).toBe(1);
      expect(stats.version).toBeDefined();
    });
  });
});