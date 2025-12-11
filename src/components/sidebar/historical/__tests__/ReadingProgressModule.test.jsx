/**
 * Tests for ReadingProgressModule
 * Validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ReadingProgressModule from '../ReadingProgressModule';
import { readingAPI } from '../../../../services/dashboard/dashboardStorage';

// Mock the readingAPI
vi.mock('../../../../services/dashboard/dashboardStorage', () => ({
  readingAPI: {
    getStats: vi.fn()
  }
}));

// Mock the DeepLinkService
vi.mock('../../../../services/navigation/DeepLinkService', () => ({
  default: {
    navigateToModule: vi.fn()
  }
}));

describe('ReadingProgressModule', () => {
  const mockNavigation = {
    setActiveTab: vi.fn()
  };

  const mockStats = {
    sessions: 5,
    totalTime: 150, // 2.5 hours
    totalPages: 75,
    avgSpeed: 30, // pages/hour
    avgSession: 30 // minutes
  };

  beforeEach(() => {
    vi.clearAllMocks();
    readingAPI.getStats.mockResolvedValue(mockStats);
  });

  it('should render with loading state initially', () => {
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    expect(screen.getByText('Progression Lecture')).toBeInTheDocument();
    // Check for loading spinner by class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display reading statistics after loading', async () => {
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // sessions
      expect(screen.getByText('75')).toBeInTheDocument(); // pages
      expect(screen.getByText('2h30min')).toBeInTheDocument(); // time
      expect(screen.getByText('30')).toBeInTheDocument(); // speed
    });
  });

  it('should allow period selection', async () => {
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      const periodSelect = screen.getByLabelText('Sélectionner la période d\'analyse');
      expect(periodSelect).toBeInTheDocument();
    });

    const periodSelect = screen.getByLabelText('Sélectionner la période d\'analyse');
    fireEvent.change(periodSelect, { target: { value: '30' } });

    await waitFor(() => {
      expect(readingAPI.getStats).toHaveBeenCalledWith(30);
    });
  });

  it('should display trend indicators', async () => {
    // Mock different stats for comparison
    readingAPI.getStats
      .mockResolvedValueOnce(mockStats) // current period
      .mockResolvedValueOnce({ // previous period (for comparison)
        sessions: 10,
        totalTime: 300,
        totalPages: 120,
        avgSpeed: 24
      });

    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      // Should show trend indicators - check for SVG elements instead of role="img"
      const trendElements = screen.getAllByText(/[+-]\d+%/);
      expect(trendElements.length).toBeGreaterThan(0);
    });
  });

  it('should navigate to books tab when clicked', async () => {
    const mockDeepLink = await import('../../../../services/navigation/DeepLinkService');
    
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Progression Lecture')).toBeInTheDocument();
    });

    const moduleContainer = screen.getByText('Progression Lecture').closest('.reading-progress-module');
    fireEvent.click(moduleContainer);

    expect(mockDeepLink.default.navigateToModule).toHaveBeenCalledWith({
      tab: 'books',
      subtab: 'reading',
      moduleId: 'reading-progress',
      scrollBehavior: 'smooth'
    }, mockNavigation.setActiveTab);
  });

  it('should handle API errors gracefully', async () => {
    readingAPI.getStats.mockRejectedValue(new Error('API Error'));

    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });
  });

  it('should format time correctly', async () => {
    const statsWithDifferentTimes = [
      { ...mockStats, totalTime: 45 }, // 45 minutes
      { ...mockStats, totalTime: 90 }, // 1h30min
      { ...mockStats, totalTime: 120 }, // 2h
    ];

    for (const stats of statsWithDifferentTimes) {
      readingAPI.getStats.mockResolvedValueOnce(stats);
      
      const { unmount } = render(
        <ReadingProgressModule
          moduleId="progression-lecture"
          moduleType="historical"
          navigation={mockNavigation}
        />
      );

      if (stats.totalTime === 45) {
        await waitFor(() => {
          expect(screen.getByText('45min')).toBeInTheDocument();
        });
      } else if (stats.totalTime === 90) {
        await waitFor(() => {
          expect(screen.getByText('1h30min')).toBeInTheDocument();
        });
      } else if (stats.totalTime === 120) {
        await waitFor(() => {
          expect(screen.getByText('2h')).toBeInTheDocument();
        });
      }

      unmount();
    }
  });

  it('should respond to session saved events', async () => {
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(readingAPI.getStats).toHaveBeenCalledTimes(2); // Initial load
    });

    // Simulate a session saved event
    window.dispatchEvent(new CustomEvent('sidebar:session:saved', {
      detail: { type: 'reading' }
    }));

    await waitFor(() => {
      expect(readingAPI.getStats).toHaveBeenCalledTimes(4); // Reload after event
    });
  });

  it('should display mini chart when data is available', async () => {
    render(
      <ReadingProgressModule
        moduleId="progression-lecture"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pages par jour')).toBeInTheDocument();
    });

    // Check that chart bars are rendered
    const chartContainer = screen.getByText('Pages par jour').closest('.chart-container');
    expect(chartContainer.querySelector('.mini-chart')).toBeInTheDocument();
  });
});