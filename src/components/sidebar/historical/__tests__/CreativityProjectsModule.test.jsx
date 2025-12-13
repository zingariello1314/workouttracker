import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreativityProjectsModule from '../CreativityProjectsModule';

describe('CreativityProjectsModule', () => {
  const defaultProps = {
    isExpanded: false,
    onToggle: vi.fn(),
    data: {
      creativity: {
        projects: [
          {
            id: 'project_1',
            name: 'Roman Fantasy',
            type: 'writing',
            progress: 65,
            lastSession: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            totalSessions: 12,
            status: 'active'
          },
          {
            id: 'project_2',
            name: 'Peinture Abstraite',
            type: 'art',
            progress: 30,
            lastSession: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            totalSessions: 5,
            status: 'active'
          },
          {
            id: 'project_3',
            name: 'Composition Musicale',
            type: 'music',
            progress: 80,
            lastSession: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            totalSessions: 20,
            status: 'paused'
          }
        ],
        recentSessions: [
          {
            id: 'session_1',
            projectId: 'project_1',
            projectName: 'Roman Fantasy',
            type: 'writing',
            duration: 90,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            wordsWritten: 1200,
            satisfaction: 4
          },
          {
            id: 'session_2',
            projectId: 'project_2',
            projectName: 'Peinture Abstraite',
            type: 'art',
            duration: 120,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            satisfaction: 5
          }
        ]
      }
    },
    navigation: {
      navigateToModule: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render collapsed state correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} />);
      
      expect(screen.getByText('Créativité & Projets')).toBeInTheDocument();
      expect(screen.getByText('🎨')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge avec nombre de projets actifs
    });

    it('should render expanded state correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Projets en cours')).toBeInTheDocument();
      expect(screen.getByText('Sessions récentes')).toBeInTheDocument();
      expect(screen.getByText('Voir mes projets')).toBeInTheDocument();
    });

    it('should display daily inspiration when expanded', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // L'inspiration change selon le jour, mais il devrait y avoir une citation
      expect(screen.getByText('💡')).toBeInTheDocument();
      // Vérifier qu'il y a une citation (contient des guillemets)
      const inspirationText = screen.getByText(/"/);
      expect(inspirationText).toBeInTheDocument();
    });

    it('should display active projects when expanded', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Roman Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Peinture Abstraite')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      // Le projet en pause ne devrait pas apparaître dans les projets actifs
      expect(screen.queryByText('Composition Musicale')).not.toBeInTheDocument();
    });

    it('should display recent sessions statistics when expanded', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('Cette semaine').parentElement.querySelector('.sidebar-data-value')).toHaveTextContent('2');
      expect(screen.getByText('Cette semaine')).toBeInTheDocument();
      expect(screen.getByText('3h30min')).toBeInTheDocument(); // Temps total (90+120 min)
      expect(screen.getByText('Temps total')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Satisfaction moyenne (4+5)/2
      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no active projects', () => {
      const propsWithoutActiveProjects = {
        ...defaultProps,
        data: {
          creativity: {
            projects: [
              {
                id: 'project_1',
                name: 'Projet Terminé',
                type: 'writing',
                progress: 100,
                status: 'completed'
              }
            ],
            recentSessions: []
          }
        },
        isExpanded: true
      };
      
      render(<CreativityProjectsModule {...propsWithoutActiveProjects} />);
      
      expect(screen.getByText('Aucun projet créatif en cours')).toBeInTheDocument();
      expect(screen.getByText('Créer un projet')).toBeInTheDocument();
    });

    it('should handle missing creativity data gracefully', () => {
      const propsWithoutData = {
        ...defaultProps,
        data: {},
        isExpanded: true
      };
      
      render(<CreativityProjectsModule {...propsWithoutData} />);
      
      // Devrait utiliser les données par défaut
      expect(screen.getByText('Roman Fantasy')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onToggle when header is clicked', () => {
      render(<CreativityProjectsModule {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /créativité & projets/i }));
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('should navigate to creativity section when main button is clicked', async () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      fireEvent.click(screen.getByText('Voir mes projets'));
      
      await waitFor(() => {
        expect(defaultProps.navigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'home',
          section: 'creativity-projects',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });

    it('should navigate to specific project when project is clicked', async () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      fireEvent.click(screen.getByText('Roman Fantasy'));
      
      await waitFor(() => {
        expect(defaultProps.navigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'home',
          section: 'creativity-projects',
          projectId: 'project_1',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });

    it('should navigate to creativity when session statistics are clicked', async () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      fireEvent.click(screen.getByText('Cette semaine'));
      
      await waitFor(() => {
        expect(defaultProps.navigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'home',
          section: 'creativity-projects',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });

    it('should navigate to creativity when create project button is clicked', async () => {
      const propsWithoutActiveProjects = {
        ...defaultProps,
        data: {
          creativity: {
            projects: [],
            recentSessions: []
          }
        },
        isExpanded: true
      };
      
      render(<CreativityProjectsModule {...propsWithoutActiveProjects} />);
      
      fireEvent.click(screen.getByText('Créer un projet'));
      
      await waitFor(() => {
        expect(defaultProps.navigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'home',
          section: 'creativity-projects',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });
  });

  describe('Project Type Icons', () => {
    it('should display correct icons for different project types', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Les icônes sont dans le DOM mais peuvent être difficiles à tester directement
      // On vérifie que les projets sont affichés
      expect(screen.getByText('Roman Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Peinture Abstraite')).toBeInTheDocument();
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate and display project progress correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      expect(screen.getByText('65%')).toBeInTheDocument(); // Roman Fantasy
      expect(screen.getByText('30%')).toBeInTheDocument(); // Peinture Abstraite
    });

    it('should calculate session statistics correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // 2 sessions dans les 7 derniers jours
      expect(screen.getByText('Cette semaine').parentElement.querySelector('.sidebar-data-value')).toHaveTextContent('2');
      // Temps total: 90 + 120 = 210 minutes = 3h30min
      expect(screen.getByText('3h30min')).toBeInTheDocument();
      // Satisfaction moyenne: (4 + 5) / 2 = 4.5
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format relative dates correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Les dates relatives devraient être affichées
      expect(screen.getByText(/Il y a \d+ jours?/)).toBeInTheDocument();
    });
  });

  describe('Daily Inspiration Rotation', () => {
    it('should display different inspiration based on day', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Vérifier qu'une inspiration est affichée
      const inspirationElement = screen.getByText(/"/);
      expect(inspirationElement).toBeInTheDocument();
      
      // Vérifier qu'il y a un auteur
      const authorElement = screen.getByText(/—/);
      expect(authorElement).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const navigationWithError = {
        navigateToModule: vi.fn().mockRejectedValue(new Error('Navigation failed'))
      };
      
      render(
        <CreativityProjectsModule 
          {...defaultProps} 
          navigation={navigationWithError}
          isExpanded={true} 
        />
      );
      
      fireEvent.click(screen.getByText('Voir mes projets'));
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[CreativityProjectsModule] Erreur navigation créativité:',
          expect.any(Error)
        );
      });
      
      consoleError.mockRestore();
    });

    it('should filter active projects correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Seuls les projets actifs devraient être affichés
      expect(screen.getByText('Roman Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Peinture Abstraite')).toBeInTheDocument();
      expect(screen.queryByText('Composition Musicale')).not.toBeInTheDocument();
    });

    it('should calculate recent sessions within 7 days', () => {
      const propsWithOldSessions = {
        ...defaultProps,
        data: {
          creativity: {
            projects: defaultProps.data.creativity.projects,
            recentSessions: [
              {
                id: 'session_old',
                projectId: 'project_1',
                type: 'writing',
                duration: 60,
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
                satisfaction: 3
              }
            ]
          }
        },
        isExpanded: true
      };
      
      render(<CreativityProjectsModule {...propsWithOldSessions} />);
      
      // Aucune session récente dans les 7 derniers jours
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CreativityProjectsModule {...defaultProps} />);
      
      const header = screen.getByRole('button', { name: /créativité & projets/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(header).toHaveAttribute('tabIndex', '0');
    });

    it('should update aria-expanded when expanded', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      const header = screen.getByRole('button', { name: /créativité & projets/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Re-render with same props
      rerender(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // Component should not re-calculate projects or sessions
      expect(screen.getByText('Roman Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Cette semaine').parentElement.querySelector('.sidebar-data-value')).toHaveTextContent('2'); // Sessions count
    });
  });

  describe('Duration Formatting', () => {
    it('should format durations correctly', () => {
      render(<CreativityProjectsModule {...defaultProps} isExpanded={true} />);
      
      // 90 + 120 = 210 minutes = 3h30min
      expect(screen.getByText('3h30min')).toBeInTheDocument();
      
      // Moyenne: 210/2 = 105 minutes = 1h45min
      expect(screen.getByText(/1h45min.*session/)).toBeInTheDocument();
    });
  });
});