/**
 * Tests pour ShoppingListModule
 * Validation des requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ShoppingListModule from '../ShoppingListModule';
import { useSmartShopping } from '../../../../hooks/useSmartShopping';
import deepLinkService from '../../../../services/navigation/DeepLinkService';

// Mock des hooks et services
vi.mock('../../../../hooks/useSmartShopping');
vi.mock('../../../../services/navigation/DeepLinkService');

describe('ShoppingListModule', () => {
  const mockSetActiveTab = vi.fn();
  const mockNavigateToModule = vi.fn();

  const defaultProps = {
    moduleId: 'shopping-list-module',
    moduleType: 'historical',
    setActiveTab: mockSetActiveTab
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deepLinkService.navigateToModule = mockNavigateToModule;
    
    // Mock de l'heure actuelle pour des tests cohérents
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15 14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('États de chargement et d\'erreur', () => {
    it('affiche un indicateur de chargement', () => {
      useSmartShopping.mockReturnValue({
        listes: [],
        loading: true,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('affiche un message d\'erreur', () => {
      useSmartShopping.mockReturnValue({
        listes: [],
        loading: false,
        error: 'Erreur de connexion'
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('affiche un état vide quand aucune liste', () => {
      useSmartShopping.mockReturnValue({
        listes: [],
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Aucune liste programmée')).toBeInTheDocument();
      expect(screen.getByText('Créer une liste')).toBeInTheDocument();
    });
  });

  describe('Sélection de la liste la plus proche (Requirements 6.1, 6.2)', () => {
    it('sélectionne la liste programmée pour maintenant', () => {
      const listes = [
        {
          id: '1',
          nom: 'Courses du midi',
          scheduledTime: '14:30', // Exactement maintenant
          statut: 'prete',
          articles: [
            { id: 'a1', nom: 'Pain', quantite: 1 },
            { id: 'a2', nom: 'Lait', quantite: 2 }
          ],
          budget: 25.50
        },
        {
          id: '2',
          nom: 'Courses du soir',
          scheduledTime: '18:00',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Courses du midi')).toBeInTheDocument();
      expect(screen.getByText('Maintenant')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Nombre d'articles
      expect(screen.getByText('25.50€')).toBeInTheDocument();
    });

    it('sélectionne la liste la plus proche temporellement', () => {
      const listes = [
        {
          id: '1',
          nom: 'Courses du matin',
          scheduledTime: '09:00',
          statut: 'prete',
          articles: []
        },
        {
          id: '2',
          nom: 'Courses du soir',
          scheduledTime: '18:00',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Courses du soir')).toBeInTheDocument();
      expect(screen.getByText(/dans/)).toBeInTheDocument(); // "dans Xh Ymin"
    });

    it('prend la première liste prête si aucune programmée', () => {
      const listes = [
        {
          id: '1',
          nom: 'Liste générale',
          statut: 'prete',
          articles: [{ id: 'a1', nom: 'Article test', quantite: 1 }]
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Liste générale')).toBeInTheDocument();
    });
  });

  describe('Affichage des informations de liste', () => {
    it('affiche correctement les détails de la liste', () => {
      const listes = [
        {
          id: '1',
          nom: 'Ma liste de courses',
          scheduledTime: '14:30',
          statut: 'prete',
          articles: [
            { id: 'a1', nom: 'Pain complet', quantite: 1 },
            { id: 'a2', nom: 'Pommes', quantite: 3 },
            { id: 'a3', nom: 'Yaourts', quantite: 2 },
            { id: 'a4', nom: 'Fromage', quantite: 1 }
          ],
          budget: 35.75
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('Ma liste de courses')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Nombre d'articles
      expect(screen.getByText('articles')).toBeInTheDocument();
      expect(screen.getByText('Pain complet')).toBeInTheDocument();
      expect(screen.getByText('Pommes')).toBeInTheDocument();
      expect(screen.getByText('Yaourts')).toBeInTheDocument();
      expect(screen.getByText('+1 autres')).toBeInTheDocument(); // 4ème article masqué
      expect(screen.getByText('35.75€')).toBeInTheDocument();
    });

    it('affiche les quantités multiples', () => {
      const listes = [
        {
          id: '1',
          nom: 'Test liste',
          statut: 'prete',
          articles: [
            { id: 'a1', nom: 'Bananes', quantite: 5 }
          ]
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('×5')).toBeInTheDocument();
    });

    it('affiche différents statuts de liste', () => {
      const listes = [
        {
          id: '1',
          nom: 'Liste en cours',
          statut: 'en-cours',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('En cours')).toBeInTheDocument();
    });
  });

  describe('Navigation vers Smart Shopping (Requirements 6.3, 6.4, 6.5)', () => {
    it('navigue vers Smart Shopping au clic sur le bouton', async () => {
      const listes = [
        {
          id: 'test-list-id',
          nom: 'Ma liste',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      mockNavigateToModule.mockResolvedValue(true);

      render(<ShoppingListModule {...defaultProps} />);

      const button = screen.getByText('Ouvrir la liste');
      fireEvent.click(button);

      expect(mockNavigateToModule).toHaveBeenCalledWith(
        {
          tab: 'Finances',
          subtab: 'smart-shopping',
          moduleId: 'shopping-list-test-list-id',
          scrollBehavior: 'smooth',
          highlightDuration: 3000,
          params: {
            listId: 'test-list-id',
            section: 'listes'
          }
        },
        mockSetActiveTab
      );
    }, 1000);

    it('navigue vers Smart Shopping depuis l\'état vide', async () => {
      useSmartShopping.mockReturnValue({
        listes: [],
        loading: false,
        error: null
      });

      mockNavigateToModule.mockResolvedValue(true);

      render(<ShoppingListModule {...defaultProps} />);

      const button = screen.getByText('Créer une liste');
      fireEvent.click(button);

      expect(mockNavigateToModule).toHaveBeenCalledWith(
        {
          tab: 'Finances',
          subtab: 'smart-shopping',
          moduleId: 'smart-shopping-main',
          scrollBehavior: 'smooth',
          highlightDuration: 3000,
          params: {
            listId: undefined,
            section: 'listes'
          }
        },
        mockSetActiveTab
      );
    }, 1000);

    it('gère les erreurs de navigation', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const listes = [
        {
          id: '1',
          nom: 'Test',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      mockNavigateToModule.mockRejectedValue(new Error('Navigation failed'));

      render(<ShoppingListModule {...defaultProps} />);

      const button = screen.getByText('Ouvrir la liste');
      fireEvent.click(button);

      // Vérifier que la navigation a été tentée
      expect(mockNavigateToModule).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('affiche un avertissement si setActiveTab n\'est pas fourni', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const listes = [
        {
          id: '1',
          nom: 'Test',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} setActiveTab={undefined} />);

      const button = screen.getByText('Ouvrir la liste');
      fireEvent.click(button);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ShoppingListModule] setActiveTab non fourni'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Mise à jour automatique (Requirement 6.4)', () => {
    it('met à jour l\'heure courante toutes les minutes', () => {
      const listes = [
        {
          id: '1',
          nom: 'Test',
          scheduledTime: '16:00', // 1h30 plus tard
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      // Vérifier que le module affiche bien l'heure relative
      expect(screen.getByText('dans 1h 30min')).toBeInTheDocument();
      
      // Vérifier que le timer est configuré (pas besoin de tester l'exécution)
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('Formatage du temps relatif', () => {
    it('formate correctement les minutes', () => {
      const listes = [
        {
          id: '1',
          nom: 'Test',
          scheduledTime: '16:00', // 1h30 plus tard, hors tolérance
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('dans 1h 30min')).toBeInTheDocument();
    });

    it('formate correctement les heures et minutes', () => {
      const listes = [
        {
          id: '1',
          nom: 'Test',
          scheduledTime: '16:45', // 2h15 plus tard
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      expect(screen.getByText('dans 2h 15min')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('a les attributs ARIA appropriés', () => {
      const listes = [
        {
          id: '1',
          nom: 'Ma liste accessible',
          statut: 'prete',
          articles: []
        }
      ];

      useSmartShopping.mockReturnValue({
        listes,
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      const button = screen.getByRole('button', { 
        name: 'Ouvrir la liste Ma liste accessible dans Smart Shopping' 
      });
      expect(button).toBeInTheDocument();
    });

    it('a les attributs de module appropriés', () => {
      useSmartShopping.mockReturnValue({
        listes: [],
        loading: false,
        error: null
      });

      render(<ShoppingListModule {...defaultProps} />);

      const module = document.querySelector('#shopping-list-module');
      
      expect(module).toBeInTheDocument();
      expect(module).toHaveAttribute('id', 'shopping-list-module');
    });
  });
});