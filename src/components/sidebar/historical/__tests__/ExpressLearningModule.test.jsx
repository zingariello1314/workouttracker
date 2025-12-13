/**
 * Tests pour ExpressLearningModule
 * Valide l'affichage des sessions récentes, calculs de temps, progression par domaine et navigation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ExpressLearningModule from '../ExpressLearningModule';

// Mock des utilitaires IndexedDB
vi.mock('../../../../utils/apprentissageIndexedDB', () => ({
  openApprentissageDB: vi.fn(),
  loadSessionsHistoryFromIndexedDB: vi.fn(),
  loadSubjectsFromIndexedDB: vi.fn(),
  loadProgressionFromIndexedDB: vi.fn()
}));

// Mocks
const mockNavigateToModule = vi.fn();

// Données de test
const mockSubjects = [
  {
    id: '1',
    name: 'Mathématiques',
    icon: '🔢',
    createdAt: Date.now()
  },
  {
    id: '2', 
    name: 'Programmation',
    icon: '💻',
    createdAt: Date.now()
  },
  {
    id: '3',
    name: 'Anglais',
    icon: '🗣️',
    createdAt: Date.now()
  }
];

const mockSessions = [
  {
    id: 1,
    subject: 'Mathématiques',
    duration: 3600, // 1 heure en secondes
    startTime: new Date().getTime(),
    xpGained: 50
  },
  {
    id: 2,
    subject: 'Programmation',
    duration: 5400, // 1.5 heures en secondes
    startTime: new Date(Date.now() - 86400000).getTime(), // Hier
    xpGained: 75
  },
  {
    id: 3,
    subject: 'Anglais',
    duration: 1800, // 30 minutes en secondes
    startTime: new Date(Date.now() - 2 * 86400000).getTime(), // Avant-hier
    xpGained: 25
  }
];

const mockProgression = {
  subjects: {
    '1': { xp: 1500, level: 3 },
    '2': { xp: 2400, level: 4 },
    '3': { xp: 800, level: 2 }
  }
};

describe('ExpressLearningModule', () => {
  const defaultProps = {
    isExpanded: true,
    onToggle: vi.fn(),
    data: {},
    navigation: {
      navigateToModule: mockNavigateToModule
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('affiche le titre du module', () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      expect(screen.getByText('Apprentissage Express')).toBeInTheDocument();
    });

    it('affiche l\'icône du module', () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    it('est accessible au clavier', () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      const header = screen.getByRole('button', { name: /apprentissage express/i });
      expect(header).toHaveAttribute('tabIndex', '0');
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Sélecteur de période', () => {
    it('affiche tous les boutons de période', async () => {
      const { container } = render(<ExpressLearningModule {...defaultProps} />);
      
      await waitFor(() => {
        // Chercher spécifiquement les boutons de période
        const periodButtons = container.querySelectorAll('.sidebar-period-btn');
        expect(periodButtons).toHaveLength(5);
        
        const buttonTexts = Array.from(periodButtons).map(btn => btn.textContent);
        expect(buttonTexts).toEqual(['7j', '30j', '3m', '6m', '1a']);
      });
    });

    it('a la période 7j sélectionnée par défaut', async () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      await waitFor(() => {
        const periodButtons = screen.getAllByText('7j');
        const btn7j = periodButtons.find(btn => btn.classList.contains('sidebar-period-btn'));
        expect(btn7j).toHaveClass('active');
      });
    });

    it('change la période sélectionnée au clic', async () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      await waitFor(() => {
        const periodButtons = screen.getAllByText('30j');
        const btn30j = periodButtons.find(btn => btn.classList.contains('sidebar-period-btn'));
        fireEvent.click(btn30j);
        
        expect(btn30j).toHaveClass('active');
        
        const btn7jButtons = screen.getAllByText('7j');
        const btn7j = btn7jButtons.find(btn => btn.classList.contains('sidebar-period-btn'));
        expect(btn7j).not.toHaveClass('active');
      });
    });
  });

  describe('État de chargement', () => {
    it('affiche l\'état de chargement', async () => {
      render(<ExpressLearningModule {...defaultProps} />);
      
      // Initialement en chargement
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('affiche l\'état sans données quand aucune session', async () => {
      // Mock des fonctions IndexedDB pour retourner des données vides
      const { openApprentissageDB, loadSessionsHistoryFromIndexedDB, loadSubjectsFromIndexedDB, loadProgressionFromIndexedDB } = await import('../../../../utils/apprentissageIndexedDB');
      
      openApprentissageDB.mockResolvedValue({});
      loadSessionsHistoryFromIndexedDB.mockResolvedValue([]);
      loadSubjectsFromIndexedDB.mockResolvedValue([]);
      loadProgressionFromIndexedDB.mockResolvedValue({});

      render(<ExpressLearningModule {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Aucune session récente')).toBeInTheDocument();
        expect(screen.getByText('Aucune progression récente')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigue vers les paramètres d\'apprentissage au clic sur une carte', async () => {
      const { openApprentissageDB, loadSessionsHistoryFromIndexedDB, loadSubjectsFromIndexedDB, loadProgressionFromIndexedDB } = await import('../../../../utils/apprentissageIndexedDB');
      
      openApprentissageDB.mockResolvedValue({});
      loadSessionsHistoryFromIndexedDB.mockResolvedValue(mockSessions);
      loadSubjectsFromIndexedDB.mockResolvedValue(mockSubjects);
      loadProgressionFromIndexedDB.mockResolvedValue(mockProgression);

      render(<ExpressLearningModule {...defaultProps} />);
      
      await waitFor(() => {
        const timeCard = screen.getByText('Temps d\'étude').closest('.sidebar-data-card');
        fireEvent.click(timeCard);
        
        expect(mockNavigateToModule).toHaveBeenCalledWith({
          tab: 'settings',
          subtab: 'learning',
          moduleId: 'apprentissage-main',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });

    it('gère l\'absence de navigation gracieusement', async () => {
      const propsWithoutNav = { ...defaultProps, navigation: null };
      
      render(<ExpressLearningModule {...propsWithoutNav} />);
      
      await waitFor(() => {
        const timeCard = screen.getByText('Temps d\'étude').closest('.sidebar-data-card');
        // Ne doit pas lever d'erreur
        fireEvent.click(timeCard);
      });
    });
  });
});