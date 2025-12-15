import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GarminMetricsModule from '../GarminMetricsModule';

// Mock du hook useGarminData
const mockLoadDataForTab = vi.fn();
const mockUseGarminData = {
  loadDataForTab: mockLoadDataForTab,
  dbReady: true
};

vi.mock('../../../../hooks/useGarminData', () => ({
  useGarminData: () => mockUseGarminData
}));

// Mock du hook useRealGarminData
const mockUseRealGarminData = {
  garminData: null,
  loading: false,
  error: null,
  refreshData: vi.fn(),
  hasData: false
};

vi.mock('../../../../hooks/useRealGarminData', () => ({
  useRealGarminData: () => mockUseRealGarminData
}));

// Mock du contexte Auth
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user' }
  })
}));

// Mock de la navigation
const mockNavigation = {
  navigateToModule: vi.fn()
};

describe('GarminMetricsModule', () => {
  const defaultProps = {
    moduleId: 'garmin-metrics-module',
    moduleType: 'historical',
    navigationTarget: {
      tab: 'sport',
      subtab: 'today',
      moduleId: 'garmin-today-module'
    },
    navigation: mockNavigation
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {}
    });
    // Reset mock data
    mockUseRealGarminData.garminData = null;
    mockUseRealGarminData.loading = false;
    mockUseRealGarminData.error = null;
    mockUseRealGarminData.hasData = false;
  });

  it('affiche le titre du module', () => {
    render(<GarminMetricsModule isExpanded={true} onToggle={vi.fn()} />);
    
    expect(screen.getByText('Métriques Garmin')).toBeInTheDocument();
  });

  it('affiche un état de chargement initial', () => {
    mockUseRealGarminData.loading = true;
    
    render(<GarminMetricsModule isExpanded={true} onToggle={vi.fn()} />);
    
    expect(screen.getByText('Chargement des données Garmin...')).toBeInTheDocument();
  });

  it('affiche un message quand aucune donnée n\'est disponible', async () => {
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {}
    });

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Aucune donnée aujourd\'hui')).toBeInTheDocument();
      expect(screen.getByText('Synchronisez votre montre Garmin')).toBeInTheDocument();
    });
  });

  it('affiche les métriques Garmin complètes', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockMetrics = {
      calories: { active: 800, resting: 1400, total: 2200 },
      bodyBattery: 85,
      steps: 8500,
      heartRate: { resting: 58, max: 165, avg: 120 },
      sleep: { duration: 480, quality: 'good' } // 8 heures en minutes
    };

    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: mockMetrics
      }
    });

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      // Vérifier les calories (format français avec espaces)
      expect(screen.getByText('800')).toBeInTheDocument(); // Calories actives
      expect(screen.getByText('1 400')).toBeInTheDocument(); // Calories repos
      expect(screen.getByText('2 200')).toBeInTheDocument(); // Calories total
      
      // Vérifier Body Battery
      expect(screen.getByText('85')).toBeInTheDocument();
      
      // Vérifier les pas (format français avec espaces)
      expect(screen.getByText('8 500')).toBeInTheDocument();
      
      // Vérifier la fréquence cardiaque
      expect(screen.getByText('58 bpm')).toBeInTheDocument(); // Repos
      expect(screen.getByText('120 bpm')).toBeInTheDocument(); // Moyenne
      expect(screen.getByText('165 bpm')).toBeInTheDocument(); // Max
      
      // Vérifier le sommeil
      expect(screen.getByText('8h')).toBeInTheDocument(); // Durée convertie
    });
  });

  it('affiche seulement les données disponibles', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockMetrics = {
      calories: { active: 600, resting: 1200 },
      steps: 7500
      // Pas de bodyBattery, heartRate ou sleep
    };

    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: mockMetrics
      }
    });

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      // Vérifier que les données disponibles sont affichées
      expect(screen.getByText('600')).toBeInTheDocument(); // Calories actives
      expect(screen.getByText('7 500')).toBeInTheDocument(); // Pas (format français)
      
      // Vérifier que les sections manquantes ne sont pas affichées
      expect(screen.queryByText('Body Battery')).not.toBeInTheDocument();
      expect(screen.queryByText('Sommeil')).not.toBeInTheDocument();
    });
  });

  it('navigue vers Sport > Aujourd\'hui quand on clique sur le bouton', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: { steps: 5000 }
      }
    });

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      const navButton = screen.getByRole('button', { name: /naviguer vers l'onglet sport/i });
      fireEvent.click(navButton);
      
      expect(mockNavigation.navigateToModule).toHaveBeenCalledWith({
        tab: 'sport',
        subtab: 'today',
        moduleId: 'garmin-today-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    });
  });

  it('gère les erreurs de chargement', async () => {
    mockLoadDataForTab.mockRejectedValue(new Error('Erreur de base de données'));

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
      expect(screen.getByText('Erreur de base de données')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    });
  });

  it('permet de réessayer après une erreur', async () => {
    mockLoadDataForTab.mockRejectedValueOnce(new Error('Erreur temporaire'));

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });

    // Simuler un succès lors du retry
    const today = new Date().toISOString().split('T')[0];
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: { steps: 3000 }
      }
    });

    const retryButton = screen.getByRole('button', { name: 'Réessayer' });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('3 000')).toBeInTheDocument(); // Format français avec espace
      expect(screen.queryByText('Erreur de chargement')).not.toBeInTheDocument();
    });
  });

  it('formate correctement les calories avec différents formats', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Test avec objet calories complet
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: { 
          calories: { active: 900, resting: 1300, total: 2200 }
        }
      }
    });

    render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('900')).toBeInTheDocument(); // Actives
      expect(screen.getByText('1 300')).toBeInTheDocument(); // Repos (format français)
      expect(screen.getByText('2 200')).toBeInTheDocument(); // Total (format français)
    });
  });

  it('affiche la barre Body Battery avec la bonne couleur', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Test avec Body Battery élevé (vert)
    mockLoadDataForTab.mockResolvedValue({
      dailyMetrics: {
        [today]: { bodyBattery: 85 }
      }
    });

    const { container } = render(<GarminMetricsModule {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Body Battery')).toBeInTheDocument();
      const batteryBar = container.querySelector('.battery-bar.high');
      expect(batteryBar).toBeTruthy();
    });
  });
});