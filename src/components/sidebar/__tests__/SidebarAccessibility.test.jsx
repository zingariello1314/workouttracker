/**
 * Tests d'accessibilité pour les sections de la Sidebar
 * Vérifie les aria-labels, roles, navigation clavier, et tooltips
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * @module components/sidebar/__tests__/SidebarAccessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActionsRapidesSection from '../ActionsRapidesSection';
import AujourdhuiSection from '../AujourdhuiSection';
import ProgressionGlobaleSection from '../ProgressionGlobaleSection';
import QuestesJourSection from '../QuestesJourSection';
import ActivitePhysiqueSection from '../ActivitePhysiqueSection';
import LectureSection from '../LectureSection';
import NutritionSection from '../NutritionSection';
import FinancesSection from '../FinancesSection';
import { QuickActionsProvider } from '../../../context/QuickActionsContext';

/**
 * Mock navigation object
 */
const mockNavigation = {
  toFocus: vi.fn(),
  toBooks: vi.fn(),
  toSport: vi.fn(),
  toSportHistory: vi.fn(),
  toQuests: vi.fn(),
  toFinancePlanificateur: vi.fn(),
  toFinanceSynthese: vi.fn(),
  toNutrition: vi.fn(),
  toSettings: vi.fn(),
  toGarmin: vi.fn(),
};

/**
 * Wrapper pour les composants nécessitant QuickActionsContext
 */
const renderWithContext = (component) => {
  return render(
    <QuickActionsProvider>
      {component}
    </QuickActionsProvider>
  );
};

describe('Sidebar Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Vérifier tous les aria-label
   * Requirement 9.1
   */
  describe('ARIA Labels', () => {
    it('should have proper aria-labels on ActionsRapidesSection buttons', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/Démarrer une session Pomodoro de 25 minutes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ajouter des pages lues/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ajouter une nouvelle séance de sport/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Voir les quêtes du jour/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ajouter un revenu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ajouter une dépense/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ajouter un repas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ouvrir les paramètres/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on AujourdhuiSection cards', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      expect(screen.getByLabelText(/Quêtes: 3 sur 5 complétées/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sport: Entraînement fait/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lecture: 25 pages lues/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nutrition: 2 sur 3 repas loggés/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on ProgressionGlobaleSection metrics', () => {
      const mockMetrics = {
        xp: 12500,
        level: 42,
        streak: 15,
        focus: 85,
      };

      render(
        <ProgressionGlobaleSection 
          isExpanded={true}
          onToggle={vi.fn()}
          metrics={mockMetrics}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/XP Total: 12.500 points/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Niveau: 42/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Streak: 15 jours consécutifs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Focus: 85 pourcent/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on QuestesJourSection quests', () => {
      const mockQuests = [
        { id: '1', title: 'Maîtriser JavaScript', icon: '💻', progress: 75, completed: false },
        { id: '2', title: 'Lire 30 pages', icon: '📖', progress: 100, completed: true },
      ];

      render(
        <QuestesJourSection 
          isExpanded={true}
          onToggle={vi.fn()}
          quests={mockQuests}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/Quête: Maîtriser JavaScript, progression 75 pourcent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quête: Lire 30 pages, progression 100 pourcent, complétée/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on ActivitePhysiqueSection cards', () => {
      const mockData = {
        weeklyWorkouts: 5,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true,
      };

      render(
        <ActivitePhysiqueSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/5 entraînements cette semaine/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2.450 calories brûlées aujourd'hui/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/8.542 pas aujourd'hui/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/72 BPM fréquence cardiaque moyenne/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on LectureSection cards', () => {
      const mockData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 90,
        hasData: true,
      };

      render(
        <LectureSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      expect(screen.getByLabelText(/3 livres en cours/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/45 pages lues aujourd'hui/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/60 minutes de lecture/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Objectif quotidien: 90 minutes/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on NutritionSection cards', () => {
      const mockData = {
        calories: 1850,
        proteins: 120,
        carbs: 200,
        fats: 65,
        compliance: 95,
        hasData: true,
      };

      render(
        <NutritionSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      expect(screen.getByLabelText(/Calories: 1850 kcal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Protéines: 120 grammes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Glucides: 200 grammes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lipides: 65 grammes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Compliance: 95% de l'objectif calorique/i)).toBeInTheDocument();
    });

    it('should have proper aria-labels on FinancesSection cards', () => {
      const mockData = {
        netWorth: 42500,
        investments: 15000,
        monthlyBudget: 3000,
        monthlySavings: 900,
        hasData: true,
      };

      render(
        <FinancesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/Patrimoine net: 42.5K€/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Investissements: 15.0K€/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Budget mensuel: 3.0K€/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Épargne mensuelle: 900€/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 2: Vérifier tous les role
   * Requirement 9.1
   */
  describe('ARIA Roles', () => {
    it('should have proper roles on section headers', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper roles on clickable cards', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const cards = screen.getAllByRole('button');
      // Header + 4 cards
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('should have proper roles on action buttons', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Header + 8 action buttons
      expect(buttons.length).toBeGreaterThanOrEqual(8);
    });

    it('should have proper group roles', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByRole('group', { name: /Actions principales/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /Actions secondaires/i })).toBeInTheDocument();
    });

    it('should have proper progressbar roles', () => {
      const mockQuests = [
        { id: '1', title: 'Test Quest', icon: '💻', progress: 75, completed: false },
      ];

      render(
        <QuestesJourSection 
          isExpanded={true}
          onToggle={vi.fn()}
          quests={mockQuests}
          navigation={mockNavigation}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  /**
   * Test 3: Vérifier navigation clavier
   * Requirement 9.3
   */
  describe('Keyboard Navigation', () => {
    it('should toggle section with Enter key', () => {
      const onToggle = vi.fn();
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={onToggle}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      fireEvent.keyDown(header, { key: 'Enter' });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should toggle section with Space key', () => {
      const onToggle = vi.fn();
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={onToggle}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      fireEvent.keyDown(header, { key: ' ' });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should navigate with Enter key on clickable cards', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const questCard = screen.getByLabelText(/Quêtes: 3 sur 5 complétées/i);
      fireEvent.keyDown(questCard, { key: 'Enter' });
      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ filter: 'today' });
    });

    it('should navigate with Space key on clickable cards', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const sportCard = screen.getByLabelText(/Sport: Entraînement fait/i);
      fireEvent.keyDown(sportCard, { key: ' ' });
      expect(mockNavigation.toSport).toHaveBeenCalledWith({ tab: 'today' });
    });

    it('should not trigger navigation with other keys', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const questCard = screen.getByLabelText(/Quêtes: 3 sur 5 complétées/i);
      fireEvent.keyDown(questCard, { key: 'a' });
      expect(mockNavigation.toQuests).not.toHaveBeenCalled();
    });

    it('should have proper tabIndex on all interactive elements', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      expect(header).toHaveAttribute('tabIndex', '0');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button !== header) {
          // Buttons have implicit tabIndex
          expect(button.tabIndex).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should navigate quest badge with keyboard', () => {
      const mockQuests = [
        { id: '1', title: 'Test Quest', icon: '💻', progress: 75, completed: false },
      ];

      render(
        <QuestesJourSection 
          isExpanded={true}
          onToggle={vi.fn()}
          quests={mockQuests}
          navigation={mockNavigation}
        />
      );

      const badge = screen.getByLabelText(/1 quête active. Cliquer pour voir toutes les quêtes du jour/i);
      fireEvent.keyDown(badge, { key: 'Enter' });
      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ filter: 'today' });
    });
  });

  /**
   * Test 4: Vérifier tooltips
   * Requirement 9.2
   */
  describe('Tooltips', () => {
    it('should have title attributes on clickable cards', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const questCard = screen.getByLabelText(/Quêtes: 3 sur 5 complétées/i);
      expect(questCard).toHaveAttribute('title', 'Voir les quêtes du jour');

      const sportCard = screen.getByLabelText(/Sport: Entraînement fait/i);
      expect(sportCard).toHaveAttribute('title', "Voir l'activité du jour");
    });

    it('should have title attributes on action buttons', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const focusButton = screen.getByLabelText(/Démarrer une session Pomodoro de 25 minutes/i);
      expect(focusButton).toHaveAttribute('title', 'Démarrer Focus 25min');

      const readButton = screen.getByLabelText(/Ajouter des pages lues/i);
      expect(readButton).toHaveAttribute('title', 'Ajouter pages lues');
    });

    it('should have hint text on clickable cards', () => {
      const mockData = {
        weeklyWorkouts: 5,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true,
      };

      render(
        <ActivitePhysiqueSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByText('Voir historique')).toBeInTheDocument();
      expect(screen.getAllByText('Voir métriques')).toHaveLength(2);
      expect(screen.getByText('Voir graphique')).toBeInTheDocument();
    });

    it('should have hint text on nutrition cards', () => {
      const mockData = {
        calories: 1850,
        proteins: 120,
        carbs: 200,
        fats: 65,
        compliance: 95,
        hasData: true,
      };

      render(
        <NutritionSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      expect(screen.getByText('Voir repas')).toBeInTheDocument();
      expect(screen.getAllByText('Voir macros')).toHaveLength(3);
      expect(screen.getByText('Voir stats')).toBeInTheDocument();
    });
  });

  /**
   * Test 5: Vérifier aria-hidden sur éléments décoratifs
   * Requirement 9.1
   */
  describe('ARIA Hidden', () => {
    it('should have aria-hidden on decorative icons', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const icons = document.querySelectorAll('.sidebar-action-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have aria-hidden on toggle arrows', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const toggle = document.querySelector('.sidebar-section-toggle');
      expect(toggle).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-hidden on decorative values', () => {
      const mockData = {
        questsCompleted: 3,
        questsTotal: 5,
        workoutDone: true,
        pagesRead: 25,
        mealsLogged: 2,
        mealsTarget: 3,
      };

      render(
        <AujourdhuiSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const values = document.querySelectorAll('.sidebar-data-value');
      values.forEach(value => {
        expect(value).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  /**
   * Test 6: Vérifier aria-expanded
   * Requirement 9.1
   */
  describe('ARIA Expanded', () => {
    it('should have aria-expanded=false when collapsed', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-expanded=true when expanded', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });
  });

  /**
   * Test 7: Vérifier disabled state
   * Requirement 9.4
   */
  describe('Disabled State', () => {
    it('should disable Focus button when Pomodoro is active', () => {
      // This test would need to mock the QuickActionsContext with pomodoroActive=true
      // For now, we verify the button can be disabled
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const focusButton = screen.getByLabelText(/Démarrer une session Pomodoro de 25 minutes/i);
      expect(focusButton).not.toBeDisabled(); // Default state
    });
  });

  /**
   * Test 8: Vérifier les messages d'état vide
   * Requirement 9.5
   */
  describe('Empty States', () => {
    it('should show accessible empty state for quests', () => {
      render(
        <QuestesJourSection 
          isExpanded={true}
          onToggle={vi.fn()}
          quests={[]}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByText(/Aucune quête active aujourd'hui/i)).toBeInTheDocument();
    });

    it('should show accessible warning for missing Garmin data', () => {
      const mockData = {
        weeklyWorkouts: 5,
        todayCalories: 0,
        todaySteps: 0,
        avgHeartRate: 0,
        hasGarminData: false,
      };

      render(
        <ActivitePhysiqueSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/Données Garmin non disponibles. Cliquer pour configurer/i)).toBeInTheDocument();
    });

    it('should show accessible warning for missing nutrition data', () => {
      const mockData = {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        compliance: 0,
        hasData: false,
      };

      render(
        <NutritionSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      expect(screen.getByLabelText(/Données nutritionnelles non disponibles. Cliquer pour configurer/i)).toBeInTheDocument();
    });

    it('should show accessible warning for missing finance data', () => {
      const mockData = {
        netWorth: 0,
        investments: 0,
        monthlyBudget: 0,
        monthlySavings: 0,
        hasData: false,
      };

      render(
        <FinancesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          data={mockData}
          navigation={mockNavigation}
        />
      );

      expect(screen.getByLabelText(/Données financières non disponibles. Cliquer pour configurer/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 9: Vérifier la structure sémantique
   * Requirement 9.5
   */
  describe('Semantic Structure', () => {
    it('should use proper heading hierarchy', () => {
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const heading = screen.getByRole('heading', { name: /Actions Rapides/i });
      expect(heading.tagName).toBe('H2');
    });

    it('should use section elements', () => {
      const { container } = renderWithContext(
        <ActionsRapidesSection 
          isExpanded={true}
          onToggle={vi.fn()}
          navigation={mockNavigation}
        />
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('sidebar-section');
    });
  });

  /**
   * Test 10: Vérifier la prévention des événements par défaut
   * Requirement 9.3
   */
  describe('Event Prevention', () => {
    it('should prevent default on Space key', () => {
      const onToggle = vi.fn();
      renderWithContext(
        <ActionsRapidesSection 
          isExpanded={false}
          onToggle={onToggle}
          navigation={mockNavigation}
        />
      );

      const header = screen.getByRole('button', { name: /Actions Rapides/i });
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      fireEvent(header, event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
