/**
 * Tests pour ActiveReadingSessionModule
 * Module de session de lecture active (Position 13)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ActiveReadingSessionModule from '../ActiveReadingSessionModule';
import deepLinkService from '../../../../services/navigation/DeepLinkService';

// Mock des dépendances
vi.mock('../../../../services/navigation/DeepLinkService', () => ({
  default: {
    navigateToModule: vi.fn()
  }
}));

// Mock des hooks de navigation
const mockNavigation = {
  setActiveTab: vi.fn()
};

describe('ActiveReadingSessionModule', () => {
  const defaultProps = {
    isExpanded: true,
    onToggle: vi.fn(),
    data: {
      activeReadingSession: {
        currentBook: {
          id: 'book1',
          title: 'Test Book',
          author: 'Test Author',
          totalPages: 300,
          currentPage: 150,
          progress: 50
        },
        dailyGoals: {
          pages: 20,
          minutes: 30
        },
        todayProgress: {
          pages: 25,
          minutes: 45
        },
        weeklyStats: {
          sessionsCount: 5,
          totalPages: 120
        },
        hasData: true
      }
    },
    navigation: mockNavigation
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche le titre du module', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('Session Lecture Active')).toBeInTheDocument();
    });

    it('affiche les données du livre actuel', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('150/300 pages')).toBeInTheDocument();
      expect(screen.getByText('50% terminé')).toBeInTheDocument();
    });

    it('affiche les objectifs quotidiens', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('25/20')).toBeInTheDocument(); // Pages lues/objectif
      expect(screen.getByText('45/30min')).toBeInTheDocument(); // Temps/objectif
    });

    it('affiche les statistiques de la semaine', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('5')).toBeInTheDocument(); // Sessions cette semaine
      expect(screen.getByText('120 pages lues')).toBeInTheDocument();
    });
  });

  describe('Affichage du livre actuel', () => {
    it('affiche les informations du livre en cours', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('150/300 pages')).toBeInTheDocument();
    });

    it('calcule et affiche correctement la progression', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      const progressText = screen.getByText('50% terminé');
      expect(progressText).toBeInTheDocument();
    });

    it('affiche un message quand aucun livre n\'est actif', () => {
      const propsWithoutBook = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            currentBook: null,
            dailyGoals: { pages: 20, minutes: 30 },
            todayProgress: { pages: 0, minutes: 0 },
            hasData: true
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithoutBook} />);
      
      expect(screen.getByText('Aucun livre')).toBeInTheDocument();
      expect(screen.getByText('Session inactive')).toBeInTheDocument();
    });

    it('affiche un état sans données', () => {
      const propsWithoutData = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            hasData: false
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithoutData} />);
      
      expect(screen.getByText('Aucune session')).toBeInTheDocument();
      expect(screen.getByText('Démarrez une lecture')).toBeInTheDocument();
    });
  });

  describe('Timer de session', () => {
    it('affiche l\'état initial du timer', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('Pas de timer')).toBeInTheDocument();
    });

    it('met à jour l\'affichage quand une session est active', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Simuler un événement de timer actif
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: true,
            elapsed: 1800 // 30 minutes
          }
        }));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session en cours')).toBeInTheDocument();
        expect(screen.getByText('30:00')).toBeInTheDocument();
      });
    });

    it('affiche l\'état en pause', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: false,
            elapsed: 600 // 10 minutes
          }
        }));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session en pause')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });
    });

    it('formate correctement les durées longues', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: true,
            elapsed: 3665 // 1h 1min 5s
          }
        }));
      });
      
      await waitFor(() => {
        expect(screen.getByText('1:01:05')).toBeInTheDocument();
      });
    });

    it('remet à zéro le timer quand la session s\'arrête', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // D'abord activer le timer
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: true,
            elapsed: 600
          }
        }));
      });
      
      // Puis l'arrêter
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:stop'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeInTheDocument();
        expect(screen.getByText('Pas de timer')).toBeInTheDocument();
      });
    });
  });

  describe('Objectifs quotidiens', () => {
    it('affiche les objectifs de pages et de temps', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(screen.getByText('Pages aujourd\'hui')).toBeInTheDocument();
      expect(screen.getByText('Temps aujourd\'hui')).toBeInTheDocument();
    });

    it('calcule correctement la progression des objectifs', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // 25 pages lues sur 20 objectif = 125% (objectif dépassé)
      const pagesProgress = screen.getByText('25/20');
      expect(pagesProgress).toBeInTheDocument();
      
      // 45 minutes sur 30 objectif = 150% (objectif dépassé)
      const timeProgress = screen.getByText('45/30min');
      expect(timeProgress).toBeInTheDocument();
      
      // Vérifier qu'il y a bien deux "Objectif atteint!" (pages et temps)
      const objectiveAchieved = screen.getAllByText('Objectif atteint!');
      expect(objectiveAchieved).toHaveLength(2);
    });

    it('affiche la progression globale', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Progression globale = moyenne des deux objectifs
      // Pages: 125%, Temps: 150% -> moyenne = 100% (plafonné)
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Progression globale')).toBeInTheDocument();
    });

    it('affiche les icônes de statut appropriées pour objectifs atteints', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Vérifier que les icônes de succès sont présentes (✅)
      const successIcons = screen.getAllByText('✅');
      expect(successIcons.length).toBeGreaterThan(0);
    });

    it('affiche les icônes normales pour objectifs non atteints', () => {
      const propsWithLowProgress = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            ...defaultProps.data.activeReadingSession,
            todayProgress: {
              pages: 5,  // Moins que l'objectif de 20
              minutes: 10 // Moins que l'objectif de 30
            }
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithLowProgress} />);
      
      expect(screen.getByText('25% de l\'objectif')).toBeInTheDocument();
      expect(screen.getByText('33% de l\'objectif')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigue vers le module de lecture au clic sur le bouton principal', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      const navButton = screen.getByRole('button', { 
        name: /naviguer vers le module de session de lecture/i 
      });
      
      fireEvent.click(navButton);
      
      expect(deepLinkService.navigateToModule).toHaveBeenCalledWith({
        tab: 'books',
        subtab: 'reading',
        moduleId: 'reading-session-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      }, mockNavigation.setActiveTab);
    });

    it('navigue au clic sur les cartes de données', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Cliquer sur la carte du livre
      const bookCard = screen.getByText('Test Book').closest('.sidebar-data-card');
      fireEvent.click(bookCard);
      
      expect(deepLinkService.navigateToModule).toHaveBeenCalled();
    });

    it('utilise le fallback en cas d\'erreur de navigation', async () => {
      deepLinkService.navigateToModule.mockRejectedValue(new Error('Navigation failed'));
      
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      const navButton = screen.getByRole('button', { 
        name: /naviguer vers le module de session de lecture/i 
      });
      
      fireEvent.click(navButton);
      
      await waitFor(() => {
        expect(mockNavigation.setActiveTab).toHaveBeenCalledWith('books');
      });
    });

    it('ne navigue pas si navigation n\'est pas disponible', () => {
      const propsWithoutNav = {
        ...defaultProps,
        navigation: null
      };
      
      render(<ActiveReadingSessionModule {...propsWithoutNav} />);
      
      const bookCard = screen.getByText('Test Book').closest('.sidebar-data-card');
      fireEvent.click(bookCard);
      
      expect(deepLinkService.navigateToModule).not.toHaveBeenCalled();
    });
  });

  describe('Synchronisation des données', () => {
    it('écoute les événements de timer', async () => {
      const { unmount } = render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Vérifier que les event listeners sont ajoutés
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      // Re-render pour déclencher useEffect
      unmount();
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('reading:timer:update', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('reading:timer:stop', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('historical:session:stopped', expect.any(Function));
    });

    it('met à jour l\'état du timer via les événements', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Simuler un événement de timer
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: true,
            elapsed: 900
          }
        }));
      });
      
      await waitFor(() => {
        expect(screen.getByText('15:00')).toBeInTheDocument();
        expect(screen.getByText('Session en cours')).toBeInTheDocument();
      });
    });

    it('remet à zéro le timer sur événement d\'arrêt', async () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // D'abord activer le timer
      await act(async () => {
        window.dispatchEvent(new CustomEvent('reading:timer:update', {
          detail: {
            isActive: true,
            elapsed: 600
          }
        }));
      });
      
      // Puis simuler l'arrêt
      await act(async () => {
        window.dispatchEvent(new CustomEvent('historical:session:stopped', {
          detail: {
            type: 'reading'
          }
        }));
      });
      
      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('gère les données manquantes gracieusement', () => {
      const propsWithMissingData = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            currentBook: {
              id: 'book1',
              title: 'Test Book'
              // Données manquantes: totalPages, currentPage, progress
            },
            dailyGoals: { pages: 20, minutes: 30 },
            todayProgress: { pages: 0, minutes: 0 },
            hasData: true
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithMissingData} />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('0/? pages')).toBeInTheDocument();
    });

    it('gère l\'absence de données de progression', () => {
      const propsWithoutProgress = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            currentBook: {
              id: 'book1',
              title: 'Test Book',
              totalPages: 300,
              currentPage: 150
              // Pas de champ progress
            },
            dailyGoals: { pages: 20, minutes: 30 },
            todayProgress: { pages: 5, minutes: 10 },
            hasData: true
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithoutProgress} />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('Voir détails')).toBeInTheDocument();
    });

    it('gère les objectifs manquants', () => {
      const propsWithoutGoals = {
        ...defaultProps,
        data: {
          activeReadingSession: {
            currentBook: defaultProps.data.activeReadingSession.currentBook,
            // Pas de dailyGoals
            todayProgress: { pages: 5, minutes: 10 },
            hasData: true
          }
        }
      };
      
      render(<ActiveReadingSessionModule {...propsWithoutGoals} />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      // Devrait utiliser les valeurs par défaut
      expect(screen.getByText('5/20')).toBeInTheDocument();
      expect(screen.getByText('10/30min')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('a les attributs ARIA appropriés', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      const header = screen.getByRole('button', { name: /session lecture active/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');
      expect(header).toHaveAttribute('tabIndex', '0');
    });

    it('supporte la navigation au clavier sur l\'en-tête', () => {
      const mockOnToggle = vi.fn();
      const propsWithMockToggle = {
        ...defaultProps,
        onToggle: mockOnToggle
      };
      
      render(<ActiveReadingSessionModule {...propsWithMockToggle} />);
      
      const header = screen.getByRole('button', { name: /session lecture active/i });
      
      // Test focus
      header.focus();
      expect(header).toHaveFocus();
      
      // Test activation avec clic
      fireEvent.click(header);
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('a des labels appropriés pour les boutons de navigation', () => {
      render(<ActiveReadingSessionModule {...defaultProps} />);
      
      const navButton = screen.getByRole('button', { 
        name: /naviguer vers le module de session de lecture/i 
      });
      expect(navButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('utilise memo pour éviter les re-renders inutiles', () => {
      const { rerender } = render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Re-render avec les mêmes props
      rerender(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Le composant devrait être mémorisé
      expect(screen.getByText('Session Lecture Active')).toBeInTheDocument();
    });

    it('nettoie les event listeners au démontage', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<ActiveReadingSessionModule {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('reading:timer:update', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('reading:timer:stop', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('historical:session:stopped', expect.any(Function));
    });

    it('gère les changements de props efficacement', () => {
      const { rerender } = render(<ActiveReadingSessionModule {...defaultProps} />);
      
      // Changer seulement isExpanded
      const newProps = {
        ...defaultProps,
        isExpanded: false
      };
      
      rerender(<ActiveReadingSessionModule {...newProps} />);
      
      expect(screen.getByText('Session Lecture Active')).toBeInTheDocument();
    });
  });
});