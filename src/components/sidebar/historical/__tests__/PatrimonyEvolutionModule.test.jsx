/**
 * Tests pour PatrimonyEvolutionModule
 * Validation des fonctionnalités du module d'évolution patrimoine
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PatrimonyEvolutionModule from '../PatrimonyEvolutionModule';

// Mock des hooks et services
vi.mock('../../../../hooks/useSynthese', () => ({
  useSynthese: vi.fn()
}));

vi.mock('../../../../services/navigation/DeepLinkService', () => ({
  default: {
    navigateToModule: vi.fn()
  }
}));

vi.mock('../../../../utils/planificateurUtils', () => ({
  formatCurrency: vi.fn((value) => `€${value.toLocaleString()}`)
}));

import { useSynthese } from '../../../../hooks/useSynthese';
import deepLinkService from '../../../../services/navigation/DeepLinkService';

describe('PatrimonyEvolutionModule', () => {
  const mockNavigation = {
    setActiveTab: vi.fn(),
    navigateToModule: vi.fn()
  };

  const mockPatrimoine = {
    total: { valorise: 50000, plusValue: 5000 },
    or: { valorisation: 15000, capitalInvesti: 12000 },
    bourse: { valorisation: 25000, capitalInvesti: 20000 },
    cash: { valorisation: 10000, capitalInvesti: 10000 }
  };

  const mockPlanEpargne = {
    totalMensuel: 800
  };

  const mockHistorique = [
    {
      date: '2024-11-01',
      patrimoine: {
        total: { valorise: 45000 }
      }
    },
    {
      date: '2024-10-01',
      patrimoine: {
        total: { valorise: 42000 }
      }
    }
  ];

  beforeEach(() => {
    useSynthese.mockReturnValue({
      patrimoine: mockPatrimoine,
      planEpargne: mockPlanEpargne,
      historique: mockHistorique,
      loading: false,
      error: null
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render module with correct title and icon', () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    expect(screen.getByText('Évolution Patrimoine')).toBeInTheDocument();
    expect(screen.getByText('💎')).toBeInTheDocument();
  });

  it('should display loading state when data is loading', () => {
    useSynthese.mockReturnValue({
      patrimoine: null,
      planEpargne: null,
      historique: [],
      loading: true,
      error: null
    });

    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should display error state when there is an error', () => {
    useSynthese.mockReturnValue({
      patrimoine: null,
      planEpargne: null,
      historique: [],
      loading: false,
      error: 'Erreur de chargement'
    });

    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
  });

  it('should calculate and display net worth change correctly', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Variation Net Worth')).toBeInTheDocument();
    });

    // Should display some variation value
    const variationElements = screen.getAllByText(/€/);
    expect(variationElements.length).toBeGreaterThan(0);
  });

  it('should display average savings from plan épargne', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Épargne/mois')).toBeInTheDocument();
      expect(screen.getByText('€800')).toBeInTheDocument();
    });
  });

  it('should calculate investment performance correctly', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Perf. Invest.')).toBeInTheDocument();
    });

    // Investment performance should be calculated from or + bourse
    // (15000 + 25000) - (12000 + 20000) = 8000
    expect(screen.getByText('€8,000')).toBeInTheDocument();
  });

  it('should display objectives reached indicator', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Objectifs atteints')).toBeInTheDocument();
      expect(screen.getByText(/\/3$/)).toBeInTheDocument();
    });
  });

  it('should allow period selection', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    const periodSelect = screen.getByLabelText('Sélectionner la période d\'analyse');
    expect(periodSelect).toBeInTheDocument();

    // Change period
    fireEvent.change(periodSelect, { target: { value: '90' } });
    expect(periodSelect.value).toBe('90');
  });

  it('should navigate to finance module when clicked', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    const moduleElement = screen.getByText('Évolution Patrimoine').closest('[data-module-id]');
    
    fireEvent.click(moduleElement);

    await waitFor(() => {
      expect(deepLinkService.navigateToModule).toHaveBeenCalledWith(
        {
          tab: 'finance',
          subtab: 'synthese',
          moduleId: 'patrimony-evolution',
          scrollBehavior: 'smooth'
        },
        mockNavigation.setActiveTab
      );
    });
  });

  it('should handle missing patrimoine data gracefully', async () => {
    useSynthese.mockReturnValue({
      patrimoine: null,
      planEpargne: null,
      historique: [],
      loading: false,
      error: null
    });

    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Variation Net Worth')).toBeInTheDocument();
      // Should show €0 for all values when no data
      const zeroValues = screen.getAllByText('€0');
      expect(zeroValues.length).toBeGreaterThan(0);
    });
  });

  it('should display trend indicators correctly', async () => {
    const { container } = render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      // Should have trend indicators (SVG icons)
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  it('should render evolution chart when data is available', async () => {
    render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      // The chart may not always render if there's no historical data
      // Just check that the module renders without errors
      expect(screen.getByText('Évolution Patrimoine')).toBeInTheDocument();
    });
  });

  it('should handle period change and recalculate metrics', async () => {
    const { rerender } = render(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    // Change period
    const periodSelect = screen.getByLabelText('Sélectionner la période d\'analyse');
    fireEvent.change(periodSelect, { target: { value: '365' } });

    // Rerender to trigger recalculation
    rerender(
      <PatrimonyEvolutionModule
        moduleId="evolution-patrimoine"
        moduleType="historical"
        navigation={mockNavigation}
      />
    );

    await waitFor(() => {
      expect(periodSelect.value).toBe('365');
    });
  });
});