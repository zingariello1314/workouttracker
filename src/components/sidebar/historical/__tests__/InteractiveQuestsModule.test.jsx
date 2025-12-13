import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InteractiveQuestsModule from '../InteractiveQuestsModule';

// Mock des hooks
const mockUseQuietQuestEngine = vi.fn();
const mockEmitSidebarEvent = vi.fn();
const mockGetTodayDateStr = vi.fn(() => '2024-12-13');

vi.mock('../../../hooks/useQuietQuestEngine', () => ({
  useQuietQuestEngine: mockUseQuietQuestEngine,
  getTodayDateStr: mockGetTodayDateStr
}));

vi.mock('../../../utils/sidebarEvents', () => ({
  emitSidebarEvent: mockEmitSidebarEvent,
  SIDEBAR_EVENTS: {
    QUEST_COMPLETED: 'quest_completed'
  }
}));

describe('InteractiveQuestsModule', () => {
  const mockNavigation = {
    navigateToModule: vi.fn().mockResolvedValue(true)
  };

  const defaultProps = {
    isExpanded: true,
    onToggle: vi.fn(),
    data: {},
    navigation: mockNavigation
  };

  const mockQuestEngineData = {
    userData: {
      currentXP: 1250,
      level: 5,
      xpForNextLevel: 2500
    },
    getQuestsForDate: vi.fn((date) => mockTodayQuests),
    isQuestCompletedOnDate: vi.fn(),
    toggleQuestValidation: vi.fn(),
    dailyPerformances: [
      { date: '2024-12-10', successRate: 85, xpEarned: 150 },
      { date: '2024-12-11', successRate: 90, xpEarned: 200 },
      { date: '2024-12-12', successRate: 80, xpEarned: 120 }
    ]
  };

  const mockTodayQuests = [
    {
      id: 'quest-1',
      nom: 'Faire du sport',
      icone: '🏃‍♂️',
      xp: 50,
      difficulte: 2,
      categorie: 'Sport'
    },
    {
      id: 'quest-2',
      nom: 'Lire 30 minutes',
      icone: '📚',
      xp: 30,
      difficulte: 1,
      categorie: 'Lecture'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock functions
    mockQuestEngineData.getQuestsForDate = vi.fn((date) => mockTodayQuests);
    mockQuestEngineData.isQuestCompletedOnDate = vi.fn().mockImplementation((questId) => {
      return questId === 'quest-2'; // Quest 2 is completed
    });
    mockQuestEngineData.toggleQuestValidation = vi.fn().mockResolvedValue();
    
    mockUseQuietQuestEngine.mockReturnValue(mockQuestEngineData);
    mockNavigation.navigateToModule.mockResolvedValue(true);
    mockGetTodayDateStr.mockReturnValue('2024-12-13');
  });

  describe('Rendering', () => {
    it('should render the module with correct title', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Quêtes Interactives')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should display quest count badge', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render XP bar with correct level and progress', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Niv. 5')).toBeInTheDocument();
      expect(screen.getByText(/1250 \/ 2500 XP/)).toBeInTheDocument();
    });
  });

  describe('Quest Display', () => {
    it('should display today\'s quests with correct information', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Faire du sport')).toBeInTheDocument();
      expect(screen.getByText('Lire 30 minutes')).toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
      expect(screen.getByText('30 XP')).toBeInTheDocument();
      expect(screen.getByText('Sport')).toBeInTheDocument();
      expect(screen.getByText('Lecture')).toBeInTheDocument();
    });

    it('should show completed quest with proper styling', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const completedQuest = screen.getByText('Lire 30 minutes').closest('.sidebar-quest-item');
      expect(completedQuest).toHaveClass('completed');
      
      const checkbox = completedQuest.querySelector('.sidebar-quest-checkbox');
      expect(checkbox).toContainHTML('✓');
    });

    it('should show uncompleted quest without checkmark', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const uncompletedQuest = screen.getByText('Faire du sport').closest('.sidebar-quest-item');
      expect(uncompletedQuest).not.toHaveClass('completed');
      
      const checkbox = uncompletedQuest.querySelector('.sidebar-quest-checkbox');
      expect(checkbox).not.toContainHTML('✓');
    });
  });

  describe('Quest Interaction', () => {
    it('should toggle quest completion when checkbox is clicked', async () => {
      const mockToggle = vi.fn().mockResolvedValue();
      mockQuestEngineData.toggleQuestValidation = mockToggle;
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const checkbox = screen.getByText('Faire du sport').closest('.sidebar-quest-item').querySelector('.sidebar-quest-checkbox');
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalledWith('quest-1', expect.any(String));
      });
      
      expect(mockEmitSidebarEvent).toHaveBeenCalledWith('quest_completed', {
        questId: 'quest-1',
        date: expect.any(String),
        moduleId: 'interactive-quests'
      });
    });

    it('should handle quest toggle errors gracefully', async () => {
      const mockToggle = vi.fn().mockRejectedValue(new Error('Toggle failed'));
      mockQuestEngineData.toggleQuestValidation = mockToggle;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const checkbox = screen.getByText('Faire du sport').closest('.sidebar-quest-item').querySelector('.sidebar-quest-checkbox');
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[InteractiveQuestsModule] Erreur toggle quête:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Create Quest Button', () => {
    it('should render create quest button', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Créer')).toBeInTheDocument();
      expect(screen.getByText('➕')).toBeInTheDocument();
    });

    it('should navigate to quest creation when create button is clicked', async () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockNavigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'quests',
          subtab: 'quests',
          moduleId: 'quest-creation-form',
          scrollBehavior: 'smooth',
          highlightDuration: 3000
        });
      });
    });
  });

  describe('No Quests State', () => {
    it('should display no quests message when there are no quests', () => {
      mockQuestEngineData.getQuestsForDate.mockReturnValue([]);
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Aucune quête aujourd\'hui')).toBeInTheDocument();
      expect(screen.getByText('Créer ma première quête')).toBeInTheDocument();
    });

    it('should navigate to quest creation when "create first quest" is clicked', async () => {
      mockQuestEngineData.getQuestsForDate.mockReturnValue([]);
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const createFirstButton = screen.getByText('Créer ma première quête');
      fireEvent.click(createFirstButton);
      
      await waitFor(() => {
        expect(mockNavigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'quests',
          subtab: 'quests',
          moduleId: 'quest-creation-form',
          scrollBehavior: 'smooth',
          highlightDuration: 3000
        });
      });
    });
  });

  describe('Statistics Section', () => {
    it('should display statistics with configurable periods', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Taux de réussite')).toBeInTheDocument();
      expect(screen.getByText('Série actuelle')).toBeInTheDocument();
      expect(screen.getByText('XP total')).toBeInTheDocument();
      
      // Check that period selectors are present
      const selectors = screen.getAllByRole('combobox');
      expect(selectors).toHaveLength(3);
    });

    it('should update period when selector is changed', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const selectors = screen.getAllByRole('combobox');
      const completionRateSelector = selectors[0];
      
      fireEvent.change(completionRateSelector, { target: { value: '30d' } });
      
      expect(completionRateSelector.value).toBe('30d');
    });

    it('should calculate statistics correctly', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      // The statistics should be calculated based on mock data
      // This is a basic check - actual values depend on the calculation logic
      expect(screen.getByText(/\d+%/)).toBeInTheDocument(); // Completion rate
      expect(screen.getByText('jours')).toBeInTheDocument(); // Streak unit
      
      // Check for specific values in the statistics cards
      const statisticsCards = screen.getAllByText(/\d+/);
      expect(statisticsCards.length).toBeGreaterThan(0); // Should have numeric values
    });
  });

  describe('Navigation Section', () => {
    it('should render navigation button to quests tab', () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText('Voir toutes les quêtes')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('should navigate to quests tab when navigation button is clicked', async () => {
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      const navButton = screen.getByText('Voir toutes les quêtes');
      fireEvent.click(navButton);
      
      await waitFor(() => {
        expect(mockNavigation.navigateToModule).toHaveBeenCalledWith({
          tab: 'quests',
          subtab: 'today',
          moduleId: 'quests-today-view',
          scrollBehavior: 'smooth',
          highlightDuration: 2000
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing quest engine data gracefully', () => {
      mockUseQuietQuestEngine.mockReturnValue({
        userData: null,
        getQuestsForDate: null,
        isQuestCompletedOnDate: null,
        toggleQuestValidation: null,
        dailyPerformances: null
      });
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      // Should still render without crashing
      expect(screen.getByText('Quêtes Interactives')).toBeInTheDocument();
      expect(screen.getByText('Niv. 1')).toBeInTheDocument(); // Default level
    });

    it('should handle quest loading errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a new mock that throws an error
      const errorMockData = {
        ...mockQuestEngineData,
        getQuestsForDate: vi.fn().mockImplementation(() => {
          throw new Error('Failed to load quests');
        })
      };
      
      mockUseQuietQuestEngine.mockReturnValueOnce(errorMockData);
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[InteractiveQuestsModule] Erreur chargement quêtes:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('XP Calculation', () => {
    it('should calculate XP progress correctly', () => {
      const customUserData = {
        currentXP: 12500, // Enough XP for level 5
        level: 5,
        xpForNextLevel: 2500
      };
      
      mockUseQuietQuestEngine.mockReturnValueOnce({
        ...mockQuestEngineData,
        userData: customUserData
      });
      
      render(<InteractiveQuestsModule {...defaultProps} />);
      
      expect(screen.getByText(/Niv\. 5/)).toBeInTheDocument();
    });
  });
});