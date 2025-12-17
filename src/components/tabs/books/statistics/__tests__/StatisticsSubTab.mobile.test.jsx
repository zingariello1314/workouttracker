/**
 * Mobile Responsiveness Tests for StatisticsSubTab
 * 
 * Tests pour valider la responsivité mobile et la persistance des préférences
 * dans le sous-onglet statistiques de lecture.
 * 
 * @see Requirements 10.1, 10.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatisticsSubTab from '../../StatisticsSubTab';

// Mock des hooks et services
vi.mock('../../../../hooks/useStatisticsData', () => ({
  useStatisticsData: vi.fn(() => ({
    hasData: true,
    metrics: {
      totalPages: 150,
      totalTime: 300,
      averageSpeed: 30,
      sessionsCount: 10,
      currentStreak: 5,
      longestStreak: 10
    },
    aggregatedData: {},
    patterns: {}
  }))
}));

vi.mock('../../../../hooks/usePredictions', () => ({
  usePredictions: vi.fn(() => [])
}));

vi.mock('../../../../hooks/useUserPreferences', () => ({
  useUserPreferences: vi.fn(() => ({
    preferences: {
      filters: {
        selectedPeriod: '1m',
        genre: '',
        status: '',
        author: ''
      },
      display: {
        activeChart: 'pages-per-day',
        comparisonMode: false,
        expandedSections: ['metrics-basic']
      },
      favoriteComparisons: []
    },
    updateFilters: vi.fn(),
    updateDisplay: vi.fn(),
    isSectionExpanded: vi.fn(() => true),
    toggleSection: vi.fn(),
    addFavoriteComparison: vi.fn(),
    removeFavoriteComparison: vi.fn()
  }))
}));

// Mock des composants enfants pour simplifier les tests
vi.mock('./ChartsContainer', () => ({
  default: ({ activeChart, onChartChange }) => (
    <div data-testid="charts-container">
      <div>Active Chart: {activeChart}</div>
      <button onClick={() => onChartChange('reading-speed')}>
        Change Chart
      </button>
    </div>
  )
}));

vi.mock('./MetricsPanel', () => ({
  default: ({ userPreferences }) => (
    <div data-testid="metrics-panel">
      <div>Metrics Panel</div>
      {userPreferences && (
        <button onClick={() => userPreferences.toggleSection('test-section')}>
          Toggle Section
        </button>
      )}
    </div>
  )
}));

vi.mock('./TimeFilters', () => ({
  default: ({ selectedPeriod, onPeriodChange }) => (
    <div data-testid="time-filters">
      <div>Selected: {selectedPeriod}</div>
      <button onClick={() => onPeriodChange('3m')}>
        Change Period
      </button>
    </div>
  )
}));

vi.mock('./ComparisonMode', () => ({
  default: ({ userPreferences }) => (
    <div data-testid="comparison-mode">
      Comparison Mode
    </div>
  )
}));

vi.mock('./ExportTools', () => ({
  default: () => <div data-testid="export-tools">Export Tools</div>
}));

vi.mock('./PredictionsPanel', () => ({
  default: () => <div data-testid="predictions-panel">Predictions</div>
}));

describe('StatisticsSubTab Mobile Responsiveness', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'Test Book 1',
      author: 'Test Author',
      genre: 'Fiction',
      status: 'completed',
      readingSessions: [
        {
          id: '1',
          date: '2024-01-01',
          durationMinutes: 30,
          pagesRead: 15
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the statistics container with mobile classes', () => {
      render(<StatisticsSubTab books={mockBooks} />);
      
      const container = screen.getByRole('main') || document.querySelector('.statistics-container');
      expect(container).toBeTruthy();
    });

    it('should render all main components', () => {
      render(<StatisticsSubTab books={mockBooks} />);
      
      expect(screen.getByTestId('charts-container')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
      expect(screen.getByTestId('time-filters')).toBeInTheDocument();
      expect(screen.getByTestId('export-tools')).toBeInTheDocument();
      expect(screen.getByTestId('predictions-panel')).toBeInTheDocument();
    });

    it('should display the correct title and subtitle', () => {
      render(<StatisticsSubTab books={mockBooks} />);
      
      expect(screen.getByText('Statistiques de Lecture')).toBeInTheDocument();
      expect(screen.getByText('Analyse de tes habitudes et progression de lecture')).toBeInTheDocument();
    });
  });

  describe('User Preferences Integration', () => {
    it('should initialize with preferences from the service', () => {
      render(<StatisticsSubTab books={mockBooks} />);
      
      // Vérifier que les filtres temporels affichent la période sélectionnée
      expect(screen.getByText('Selected: 1m')).toBeInTheDocument();
      
      // Vérifier que le graphique actif est correct
      expect(screen.getByText('Active Chart: pages-per-day')).toBeInTheDocument();
    });

    it('should update preferences when period changes', async () => {
      const { useUserPreferences } = await import('../../../../hooks/useUserPreferences');
      const mockUpdateFilters = vi.fn();
      
      useUserPreferences.mockReturnValue({
        preferences: {
          filters: { selectedPeriod: '1m', genre: '', status: '', author: '' },
          display: { activeChart: 'pages-per-day', comparisonMode: false, expandedSections: [] },
          favoriteComparisons: []
        },
        updateFilters: mockUpdateFilters,
        updateDisplay: vi.fn(),
        isSectionExpanded: vi.fn(() => false),
        toggleSection: vi.fn()
      });

      render(<StatisticsSubTab books={mockBooks} />);
      
      // Simuler un changement de période
      fireEvent.click(screen.getByText('Change Period'));
      
      await waitFor(() => {
        expect(mockUpdateFilters).toHaveBeenCalledWith({ selectedPeriod: '3m' });
      });
    });

    it('should update preferences when chart changes', async () => {
      const { useUserPreferences } = await import('../../../../hooks/useUserPreferences');
      const mockUpdateDisplay = vi.fn();
      
      useUserPreferences.mockReturnValue({
        preferences: {
          filters: { selectedPeriod: '1m', genre: '', status: '', author: '' },
          display: { activeChart: 'pages-per-day', comparisonMode: false, expandedSections: [] },
          favoriteComparisons: []
        },
        updateFilters: vi.fn(),
        updateDisplay: mockUpdateDisplay,
        isSectionExpanded: vi.fn(() => false),
        toggleSection: vi.fn()
      });

      render(<StatisticsSubTab books={mockBooks} />);
      
      // Simuler un changement de graphique
      fireEvent.click(screen.getByText('Change Chart'));
      
      await waitFor(() => {
        expect(mockUpdateDisplay).toHaveBeenCalledWith({ activeChart: 'reading-speed' });
      });
    });

    it('should toggle comparison mode and persist preference', async () => {
      const { useUserPreferences } = await import('../../../../hooks/useUserPreferences');
      const mockUpdateDisplay = vi.fn();
      
      useUserPreferences.mockReturnValue({
        preferences: {
          filters: { selectedPeriod: '1m', genre: '', status: '', author: '' },
          display: { activeChart: 'pages-per-day', comparisonMode: false, expandedSections: [] },
          favoriteComparisons: []
        },
        updateFilters: vi.fn(),
        updateDisplay: mockUpdateDisplay,
        isSectionExpanded: vi.fn(() => false),
        toggleSection: vi.fn()
      });

      render(<StatisticsSubTab books={mockBooks} />);
      
      // Trouver et cliquer sur le bouton de comparaison
      const comparisonButton = screen.getByText('Comparaison');
      fireEvent.click(comparisonButton);
      
      await waitFor(() => {
        expect(mockUpdateDisplay).toHaveBeenCalledWith({ comparisonMode: true });
      });
    });
  });

  describe('Filter Persistence', () => {
    it('should persist genre filter changes', async () => {
      const { useUserPreferences } = await import('../../../../hooks/useUserPreferences');
      const mockUpdateFilters = vi.fn();
      
      useUserPreferences.mockReturnValue({
        preferences: {
          filters: { selectedPeriod: '1m', genre: '', status: '', author: '' },
          display: { activeChart: 'pages-per-day', comparisonMode: false, expandedSections: [] },
          favoriteComparisons: []
        },
        updateFilters: mockUpdateFilters,
        updateDisplay: vi.fn(),
        isSectionExpanded: vi.fn(() => false),
        toggleSection: vi.fn()
      });

      render(<StatisticsSubTab books={mockBooks} />);
      
      // Trouver le sélecteur de genre
      const genreSelect = screen.getByDisplayValue('Tous les genres');
      fireEvent.change(genreSelect, { target: { value: 'Fiction' } });
      
      await waitFor(() => {
        expect(mockUpdateFilters).toHaveBeenCalledWith({
          selectedPeriod: '1m',
          genre: 'Fiction',
          status: '',
          author: ''
        });
      });
    });
  });

  describe('Comparison Mode', () => {
    it('should render comparison mode when enabled', () => {
      const { useUserPreferences } = require('../../../../hooks/useUserPreferences');
      
      useUserPreferences.mockReturnValue({
        preferences: {
          filters: { selectedPeriod: '1m', genre: '', status: '', author: '' },
          display: { activeChart: 'pages-per-day', comparisonMode: true, expandedSections: [] },
          favoriteComparisons: []
        },
        updateFilters: vi.fn(),
        updateDisplay: vi.fn(),
        isSectionExpanded: vi.fn(() => false),
        toggleSection: vi.fn()
      });

      render(<StatisticsSubTab books={mockBooks} />);
      
      expect(screen.getByTestId('comparison-mode')).toBeInTheDocument();
      expect(screen.queryByTestId('charts-container')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no books provided', () => {
      render(<StatisticsSubTab books={[]} />);
      
      expect(screen.getByText('Aucune donnée de lecture')).toBeInTheDocument();
      expect(screen.getByText('Commence à enregistrer des sessions de lecture pour voir tes statistiques apparaître ici.')).toBeInTheDocument();
    });

    it('should show suggestions in empty state', () => {
      render(<StatisticsSubTab books={[]} />);
      
      expect(screen.getByText('Pour commencer:')).toBeInTheDocument();
      expect(screen.getByText('• Ajoute un livre à ta bibliothèque')).toBeInTheDocument();
      expect(screen.getByText('• Enregistre une session de lecture')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Classes', () => {
    it('should apply mobile-responsive CSS classes', () => {
      const { container } = render(<StatisticsSubTab books={mockBooks} />);
      
      // Vérifier que les classes CSS responsives sont appliquées
      const statisticsContainer = container.querySelector('.statistics-container');
      expect(statisticsContainer).toBeTruthy();
      
      const headerSection = container.querySelector('.statistics-header');
      expect(headerSection).toBeTruthy();
      
      const mainLayout = container.querySelector('.statistics-main-layout');
      expect(mainLayout).toBeTruthy();
    });
  });
});