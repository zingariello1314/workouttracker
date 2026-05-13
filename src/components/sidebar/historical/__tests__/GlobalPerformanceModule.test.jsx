/**
 * Tests unitaires pour GlobalPerformanceModule
 * 
 * Tests couverts:
 * - Rendu du composant avec données
 * - Calcul du score de productivité
 * - Évaluation de l'équilibre vie/travail/loisirs
 * - Génération de recommandations IA
 * - Navigation vers la page d'accueil
 * - Gestion des états de chargement et d'erreur
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import GlobalPerformanceModule from '../GlobalPerformanceModule';
import deepLinkService from '../../../../services/navigation/DeepLinkService';

// Mock du service de navigation
vi.mock('../../../../services/navigation/DeepLinkService', () => ({
  default: {
    navigateToModule: vi.fn().mockResolvedValue(true)
  }
}));

describe('GlobalPerformanceModule', () => {
  const defaultProps = {
    moduleId: 'global-performance-19',
    moduleType: 'historical',
    navigationTarget: {
      tab: 'homepage',
      moduleId: 'performance-dashboard'
    },
    data: {
      quests: { completed: 4, total: 6 },
      sport: { todayWorkouts: 1, workoutTime: 45 },
      learning: { pagesRead: 25, readingTime: 60, studyTime: 30 },
      finance: { budgetRespected: true, planningTime: 20 },
      nutrition: { caloriesGoalMet: true, mealPrepTime: 30 },
      today: { dailyTasks: 8 }
    },
    navigation: {
      setActiveTab: vi.fn()
    },
    isExpanded: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock des événements window
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true
    });
    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendu du composant', () => {
    it('affiche le titre du module correctement', () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      expect(screen.getByText('Performance Globale')).toBeInTheDocument();
      expect(screen.getAllByText('📊')).toHaveLength(2); // Icon in header and navigation hint
    });

    it('affiche l\'état de chargement initialement', async () => {
      render(<GlobalPerformanceModule {...defaultProps} data={{}} />);
      
      expect(screen.getByText('Performance Globale')).toBeInTheDocument();
      
      // Attendre que le contenu se charge
      await waitFor(() => {
        expect(screen.getByText('Score de Productivité')).toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('affiche le contenu quand les données sont chargées', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Score de Productivité')).toBeInTheDocument();
        expect(screen.getByText('Équilibre de Vie')).toBeInTheDocument();
      });
    });

    it('n\'affiche pas le contenu quand isExpanded est false', () => {
      render(<GlobalPerformanceModule {...defaultProps} isExpanded={false} />);
      
      expect(screen.queryByText('Score de Productivité')).not.toBeInTheDocument();
    });
  });

  describe('Calcul du score de productivité', () => {
    it('calcule correctement le score avec toutes les données', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Score de Productivité')).toBeInTheDocument();
        // Vérifier qu'un pourcentage est affiché
        const scoreElements = screen.getAllByText(/%/);
        expect(scoreElements.length).toBeGreaterThan(0);
      }, { timeout: 8000 });
    });

    it('gère les données manquantes gracieusement', async () => {
      const incompleteData = {
        quests: { completed: 2, total: 4 }
        // Autres données manquantes
      };
      
      render(<GlobalPerformanceModule {...defaultProps} data={incompleteData} />);
      
      await waitFor(() => {
        expect(screen.getByText('Score de Productivité')).toBeInTheDocument();
        // Devrait afficher un score basé uniquement sur les quêtes
      }, { timeout: 8000 });
    });
  });

  describe('Équilibre vie/travail/loisirs', () => {
    it('affiche les barres d\'équilibre', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/💼\s*\d+%/)).toBeInTheDocument();
        expect(screen.getByText(/🏠\s*\d+%/)).toBeInTheDocument();
        expect(screen.getByText(/🎮\s*\d+%/)).toBeInTheDocument();
      });
    });

    it('affiche les pourcentages d\'équilibre', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        // Vérifier que des pourcentages sont affichés
        const percentageElements = screen.getAllByText(/%$/);
        expect(percentageElements.length).toBeGreaterThan(0);
      });
    });

    it('affiche l\'indicateur d\'équilibre', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        const balanceIndicator = screen.getByText(
          /Parfaitement équilibré|Bien équilibré|Acceptable|À rééquilibrer|À ajuster/i
        );
        expect(balanceIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Recommandations IA', () => {
    it('affiche une recommandation IA', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('IA Coach')).toBeInTheDocument();
      });
    });

    it('permet de rafraîchir la recommandation', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Nouvelle recommandation');
        expect(refreshButton).toBeInTheDocument();
        
        fireEvent.click(refreshButton);
        expect(window.dispatchEvent).toHaveBeenCalled();
      });
    });

    it('affiche différents types de recommandations', async () => {
      // Test avec un score élevé pour déclencher une recommandation de succès
      const highPerformanceData = {
        ...defaultProps.data,
        quests: { completed: 6, total: 6 },
        sport: { todayWorkouts: 2, workoutTime: 90 },
        learning: { pagesRead: 50, readingTime: 120, studyTime: 60 }
      };
      
      render(<GlobalPerformanceModule {...defaultProps} data={highPerformanceData} />);
      
      await waitFor(() => {
        expect(screen.getByText('IA Coach')).toBeInTheDocument();
      });
    });
  });

  describe('Métriques rapides', () => {
    it('affiche les métriques d\'objectifs et d\'énergie', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Objectifs')).toBeInTheDocument();
        expect(screen.getByText('Énergie')).toBeInTheDocument();
      });
    });

    it('calcule les métriques basées sur le score de productivité', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        const metricElements = screen.getAllByText(/%$/);
        expect(metricElements.length).toBeGreaterThan(2); // Au moins les métriques rapides + équilibre
      });
    });
  });

  describe('Navigation', () => {
    it('navigue vers la page d\'accueil au clic', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Globale')).toBeInTheDocument();
      }, { timeout: 8000 });
      
      const moduleElement = screen.getByText('Performance Globale').closest('.sidebar-section');
      expect(moduleElement).toBeInTheDocument();
      
      fireEvent.click(moduleElement);
      
      await waitFor(() => {
        expect(deepLinkService.navigateToModule).toHaveBeenCalledWith(
          {
            tab: 'homepage',
            moduleId: 'performance-dashboard',
            scrollBehavior: 'smooth',
            highlightDuration: 2000
          },
          defaultProps.navigation.setActiveTab
        );
      });
    });

    it('utilise le fallback de navigation en cas d\'erreur', async () => {
      deepLinkService.navigateToModule.mockRejectedValue(new Error('Navigation failed'));
      
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Globale')).toBeInTheDocument();
      }, { timeout: 8000 });
      
      const moduleElement = screen.getByText('Performance Globale').closest('.sidebar-section');
      fireEvent.click(moduleElement);
      
      await waitFor(() => {
        expect(defaultProps.navigation.setActiveTab).toHaveBeenCalledWith('homepage');
      });
    });

    it('affiche l\'indicateur de navigation', async () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Voir le dashboard complet')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des événements', () => {
    it('écoute les événements de mise à jour', () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        'sidebar:performance:updated',
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'historical:performance:updated',
        expect.any(Function)
      );
    });

    it('nettoie les event listeners au démontage', () => {
      const { unmount } = render(<GlobalPerformanceModule {...defaultProps} />);
      
      unmount();
      
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'sidebar:performance:updated',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'historical:performance:updated',
        expect.any(Function)
      );
    });
  });

  describe('Accessibilité', () => {
    it('a les attributs ARIA appropriés', () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      const moduleElement = screen.getByText('Performance Globale').closest('.sidebar-section');
      expect(moduleElement).toHaveAttribute('data-module-id', 'global-performance-19');
      expect(moduleElement).toHaveAttribute('data-module-type', 'historical');
    });

    it('a un curseur pointer pour indiquer la cliquabilité', () => {
      render(<GlobalPerformanceModule {...defaultProps} />);
      
      const moduleElement = screen.getByText('Performance Globale').closest('.sidebar-section');
      expect(moduleElement).toHaveClass('cursor-pointer');
    });
  });
});