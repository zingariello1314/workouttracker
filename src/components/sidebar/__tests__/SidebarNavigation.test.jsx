/**
 * Tests de navigation pour la Sidebar Interactive
 * Vérifie que toutes les données cliquables naviguent correctement
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 12.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import des composants à tester
import ActivitePhysiqueSection from '../ActivitePhysiqueSection';
import QuestesJourSection from '../QuestesJourSection';
import LectureSection from '../LectureSection';
import FinancesSection from '../FinancesSection';
import NutritionSection from '../NutritionSection';
import ProgressionGlobaleSection from '../ProgressionGlobaleSection';

describe('Sidebar Navigation Tests', () => {
  let mockNavigation;

  beforeEach(() => {
    // Mock de toutes les fonctions de navigation
    mockNavigation = {
      toQuests: vi.fn(),
      toQuestsStats: vi.fn(),
      toSport: vi.fn(),
      toSportHistory: vi.fn(),
      toSportStats: vi.fn(),
      toGarmin: vi.fn(),
      toBooks: vi.fn(),
      toFinance: vi.fn(),
      toFinanceSynthese: vi.fn(),
      toFinancePlanificateur: vi.fn(),
      toNutrition: vi.fn(),
    };
  });

  describe('Sport > Historique Navigation (Requirement 2.1)', () => {
    it('devrait naviguer vers Sport > Historique au clic sur Entraînements', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine/i);
      fireEvent.click(workoutsCard);

      expect(mockNavigation.toSportHistory).toHaveBeenCalledWith({ filter: 'week' });
    });

    it('devrait supporter la navigation clavier sur Entraînements', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine/i);
      fireEvent.keyDown(workoutsCard, { key: 'Enter' });

      expect(mockNavigation.toSportHistory).toHaveBeenCalledWith({ filter: 'week' });
    });
  });

  describe('Garmin > Métriques Navigation (Requirements 2.2, 2.3, 2.4)', () => {
    it('devrait naviguer vers Garmin > Métriques > Calories au clic sur Calories', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const caloriesCard = screen.getByLabelText(/2.450 calories brûlées aujourd'hui/i);
      fireEvent.click(caloriesCard);

      expect(mockNavigation.toGarmin).toHaveBeenCalledWith({ 
        tab: 'metrics', 
        section: 'calories' 
      });
    });

    it('devrait naviguer vers Garmin > Métriques > Pas au clic sur Pas', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const stepsCard = screen.getByLabelText(/8.542 pas aujourd'hui/i);
      fireEvent.click(stepsCard);

      expect(mockNavigation.toGarmin).toHaveBeenCalledWith({ 
        tab: 'metrics', 
        section: 'steps' 
      });
    });

    it('devrait naviguer vers Garmin > Fréquence Cardiaque au clic sur BPM', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const heartRateCard = screen.getByLabelText(/72 BPM fréquence cardiaque moyenne/i);
      fireEvent.click(heartRateCard);

      expect(mockNavigation.toGarmin).toHaveBeenCalledWith({ 
        tab: 'heartRate' 
      });
    });

    it('devrait naviguer vers Garmin > Paramètres quand pas de données', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 0,
        todaySteps: 0,
        avgHeartRate: 0,
        hasGarminData: false
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const warningBox = screen.getByLabelText(/Données Garmin non disponibles/i);
      fireEvent.click(warningBox);

      expect(mockNavigation.toGarmin).toHaveBeenCalledWith({ 
        tab: 'settings' 
      });
    });
  });

  describe('Quêtes > Détail Navigation (Requirements 2.8, 2.9, 2.10)', () => {
    it('devrait naviguer vers Quêtes avec détail au clic sur une quête', () => {
      const quests = [
        {
          id: 'quest-1',
          title: 'Maîtriser JavaScript',
          icon: '📚',
          progress: 75,
          completed: false
        },
        {
          id: 'quest-2',
          title: 'Faire du sport',
          icon: '💪',
          progress: 100,
          completed: true
        }
      ];

      render(
        <QuestesJourSection
          isExpanded={true}
          onToggle={vi.fn()}
          quests={quests}
          navigation={mockNavigation}
        />
      );

      const questItem = screen.getByLabelText(/Quête: Maîtriser JavaScript/i);
      fireEvent.click(questItem);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({
        questId: 'quest-1',
        scrollTo: true
      });
    });

    it('devrait naviguer vers Quêtes filtrées au clic sur le badge compteur', () => {
      const quests = [
        {
          id: 'quest-1',
          title: 'Maîtriser JavaScript',
          icon: '📚',
          progress: 75,
          completed: false
        },
        {
          id: 'quest-2',
          title: 'Faire du sport',
          icon: '💪',
          progress: 100,
          completed: true
        }
      ];

      render(
        <QuestesJourSection
          isExpanded={true}
          onToggle={vi.fn()}
          quests={quests}
          navigation={mockNavigation}
        />
      );

      const badge = screen.getByLabelText(/2 quêtes actives. Cliquer pour voir toutes les quêtes du jour/i);
      fireEvent.click(badge);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ filter: 'today' });
    });

    it('devrait supporter la navigation clavier sur les quêtes', () => {
      const quests = [
        {
          id: 'quest-1',
          title: 'Maîtriser JavaScript',
          icon: '📚',
          progress: 75,
          completed: false
        }
      ];

      render(
        <QuestesJourSection
          isExpanded={true}
          onToggle={vi.fn()}
          quests={quests}
          navigation={mockNavigation}
        />
      );

      const questItem = screen.getByLabelText(/Quête: Maîtriser JavaScript/i);
      fireEvent.keyDown(questItem, { key: 'Enter' });

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({
        questId: 'quest-1',
        scrollTo: true
      });
    });
  });

  describe('Livres > Stats Navigation (Requirements 2.6, 2.7)', () => {
    it('devrait naviguer vers Livres avec filtre "en cours" au clic sur En cours', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const currentBooksCard = screen.getByLabelText(/3 livres en cours/i);
      fireEvent.click(currentBooksCard);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith({ filter: 'current' });
    });

    it('devrait naviguer vers Livres > Stats avec date au clic sur Pages', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const pagesCard = screen.getByLabelText(/45 pages lues aujourd'hui/i);
      fireEvent.click(pagesCard);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith({ 
        tab: 'stats', 
        date: '2025-12-09' 
      });
    });

    it('devrait naviguer vers Livres > Stats > Sessions au clic sur Temps', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const timeCard = screen.getByLabelText(/60 minutes de lecture/i);
      fireEvent.click(timeCard);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith({ 
        tab: 'stats', 
        section: 'sessions' 
      });
    });

    it('devrait naviguer vers Livres > Paramètres au clic sur Objectif', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const goalCard = screen.getByLabelText(/Objectif quotidien: 60 minutes/i);
      fireEvent.click(goalCard);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith({ action: 'settings' });
    });

    it('devrait naviguer vers Livres > Stats > Progression au clic sur la barre', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const progressBox = screen.getByLabelText(/Progression du jour: 60 sur 60 minutes/i);
      fireEvent.click(progressBox);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith({ 
        tab: 'stats', 
        section: 'progression' 
      });
    });
  });

  describe('Finance > Synthèse Navigation (Requirements 2.5)', () => {
    it('devrait naviguer vers Finance > Synthèse > Patrimoine au clic sur Patrimoine', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const netWorthCard = screen.getByLabelText(/Patrimoine net: 42.5K€/i);
      fireEvent.click(netWorthCard);

      expect(mockNavigation.toFinanceSynthese).toHaveBeenCalledWith({ 
        section: 'patrimoine' 
      });
    });

    it('devrait naviguer vers Finance > Synthèse > Investissements au clic sur Investissements', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const investmentsCard = screen.getByLabelText(/Investissements: 25.0K€/i);
      fireEvent.click(investmentsCard);

      expect(mockNavigation.toFinanceSynthese).toHaveBeenCalledWith({ 
        section: 'investissements' 
      });
    });

    it('devrait naviguer vers Finance > Planificateur > Répartition au clic sur Budget', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const budgetCard = screen.getByLabelText(/Budget mensuel: 2.5K€/i);
      fireEvent.click(budgetCard);

      expect(mockNavigation.toFinancePlanificateur).toHaveBeenCalledWith({ 
        section: 'repartition' 
      });
    });

    it('devrait naviguer vers Finance > Planificateur > Épargne au clic sur Épargne', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const savingsCard = screen.getByLabelText(/Épargne mensuelle: 800€/i);
      fireEvent.click(savingsCard);

      expect(mockNavigation.toFinancePlanificateur).toHaveBeenCalledWith({ 
        section: 'epargne' 
      });
    });

    it('devrait naviguer vers Finance > Synthèse > Comparaison au clic sur taux d\'épargne', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const savingsRateBox = screen.getByLabelText(/Taux d'épargne: 32% du budget mensuel/i);
      fireEvent.click(savingsRateBox);

      expect(mockNavigation.toFinanceSynthese).toHaveBeenCalledWith({ 
        section: 'comparaison' 
      });
    });
  });

  describe('Nutrition Navigation (Requirements 1.1, 1.2)', () => {
    it('devrait naviguer vers Nutrition avec date au clic sur Calories', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const caloriesCard = screen.getByLabelText(/Calories: 2100 kcal/i);
      fireEvent.click(caloriesCard);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith({ 
        date: '2025-12-09' 
      });
    });

    it('devrait naviguer vers Nutrition > Macros au clic sur Protéines', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const proteinsCard = screen.getByLabelText(/Protéines: 150 grammes/i);
      fireEvent.click(proteinsCard);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith({ 
        date: '2025-12-09',
        section: 'macros' 
      });
    });

    it('devrait naviguer vers Nutrition > Macros au clic sur Glucides', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const carbsCard = screen.getByLabelText(/Glucides: 250 grammes/i);
      fireEvent.click(carbsCard);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith({ 
        date: '2025-12-09',
        section: 'macros' 
      });
    });

    it('devrait naviguer vers Nutrition > Macros au clic sur Lipides', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const fatsCard = screen.getByLabelText(/Lipides: 70 grammes/i);
      fireEvent.click(fatsCard);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith({ 
        date: '2025-12-09',
        section: 'macros' 
      });
    });

    it('devrait naviguer vers Nutrition > Stats au clic sur Compliance', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const complianceBox = screen.getByLabelText(/Compliance: 95% de l'objectif calorique/i);
      fireEvent.click(complianceBox);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith({ 
        tab: 'stats' 
      });
    });
  });

  describe('Progression Globale Navigation (Requirements 2.9, 2.10)', () => {
    it('devrait naviguer vers Quêtes > Progression au clic sur XP', () => {
      const metricsData = {
        xp: 12500,
        level: 15,
        streak: 7,
        focus: 85
      };

      render(
        <ProgressionGlobaleSection
          isExpanded={true}
          onToggle={vi.fn()}
          metrics={metricsData}
          navigation={mockNavigation}
        />
      );

      const xpCard = screen.getByLabelText(/XP Total: 12.500 points/i);
      fireEvent.click(xpCard);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ 
        section: 'progression' 
      });
    });

    it('devrait naviguer vers Quêtes > Niveau au clic sur Niveau', () => {
      const metricsData = {
        xp: 12500,
        level: 15,
        streak: 7,
        focus: 85
      };

      render(
        <ProgressionGlobaleSection
          isExpanded={true}
          onToggle={vi.fn()}
          metrics={metricsData}
          navigation={mockNavigation}
        />
      );

      const levelCard = screen.getByLabelText(/Niveau: 15/i);
      fireEvent.click(levelCard);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ 
        section: 'niveau' 
      });
    });

    it('devrait naviguer vers Quêtes > Stats > Calendrier au clic sur Streak', () => {
      const metricsData = {
        xp: 12500,
        level: 15,
        streak: 7,
        focus: 85
      };

      render(
        <ProgressionGlobaleSection
          isExpanded={true}
          onToggle={vi.fn()}
          metrics={metricsData}
          navigation={mockNavigation}
        />
      );

      const streakCard = screen.getByLabelText(/Streak: 7 jours consécutifs/i);
      fireEvent.click(streakCard);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ 
        section: 'stats',
        subsection: 'calendrier'
      });
    });

    it('devrait naviguer vers Quêtes > Stats > Focus au clic sur Focus', () => {
      const metricsData = {
        xp: 12500,
        level: 15,
        streak: 7,
        focus: 85
      };

      render(
        <ProgressionGlobaleSection
          isExpanded={true}
          onToggle={vi.fn()}
          metrics={metricsData}
          navigation={mockNavigation}
        />
      );

      const focusCard = screen.getByLabelText(/Focus: 85 pourcent/i);
      fireEvent.click(focusCard);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith({ 
        section: 'stats',
        subsection: 'focus'
      });
    });
  });

  describe('Navigation avec paramètres contextuels (Requirement 12.3)', () => {
    it('devrait passer les bons paramètres pour Sport > Historique', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine/i);
      fireEvent.click(workoutsCard);

      expect(mockNavigation.toSportHistory).toHaveBeenCalledWith(
        expect.objectContaining({ filter: 'week' })
      );
    });

    it('devrait passer les bons paramètres pour Garmin avec section', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 2450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const caloriesCard = screen.getByLabelText(/2.450 calories brûlées aujourd'hui/i);
      fireEvent.click(caloriesCard);

      expect(mockNavigation.toGarmin).toHaveBeenCalledWith(
        expect.objectContaining({ 
          tab: 'metrics', 
          section: 'calories' 
        })
      );
    });

    it('devrait passer les bons paramètres pour Quêtes avec scrollTo', () => {
      const quests = [
        {
          id: 'quest-1',
          title: 'Maîtriser JavaScript',
          icon: '📚',
          progress: 75,
          completed: false
        }
      ];

      render(
        <QuestesJourSection
          isExpanded={true}
          onToggle={vi.fn()}
          quests={quests}
          navigation={mockNavigation}
        />
      );

      const questItem = screen.getByLabelText(/Quête: Maîtriser JavaScript/i);
      fireEvent.click(questItem);

      expect(mockNavigation.toQuests).toHaveBeenCalledWith(
        expect.objectContaining({
          questId: 'quest-1',
          scrollTo: true
        })
      );
    });

    it('devrait passer les bons paramètres pour Livres avec date', () => {
      const learningData = {
        currentBooks: 3,
        todayPages: 45,
        todayMinutes: 60,
        dailyGoal: 60,
        hasData: true
      };

      render(
        <LectureSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={learningData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const pagesCard = screen.getByLabelText(/45 pages lues aujourd'hui/i);
      fireEvent.click(pagesCard);

      expect(mockNavigation.toBooks).toHaveBeenCalledWith(
        expect.objectContaining({ 
          tab: 'stats', 
          date: '2025-12-09' 
        })
      );
    });

    it('devrait passer les bons paramètres pour Finance avec section', () => {
      const financeData = {
        netWorth: 42500,
        investments: 25000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      };

      render(
        <FinancesSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={financeData}
          navigation={mockNavigation}
        />
      );

      const netWorthCard = screen.getByLabelText(/Patrimoine net: 42.5K€/i);
      fireEvent.click(netWorthCard);

      expect(mockNavigation.toFinanceSynthese).toHaveBeenCalledWith(
        expect.objectContaining({ section: 'patrimoine' })
      );
    });

    it('devrait passer les bons paramètres pour Nutrition avec date et section', () => {
      const nutritionData = {
        calories: 2100,
        proteins: 150,
        carbs: 250,
        fats: 70,
        compliance: 95,
        hasData: true
      };

      render(
        <NutritionSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={nutritionData}
          navigation={mockNavigation}
          todayDate="2025-12-09"
        />
      );

      const proteinsCard = screen.getByLabelText(/Protéines: 150 grammes/i);
      fireEvent.click(proteinsCard);

      expect(mockNavigation.toNutrition).toHaveBeenCalledWith(
        expect.objectContaining({ 
          date: '2025-12-09',
          section: 'macros' 
        })
      );
    });
  });

  describe('Accessibilité de la navigation', () => {
    it('devrait avoir des aria-label descriptifs sur tous les éléments cliquables', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine. Cliquer pour voir l'historique/i);
      expect(workoutsCard).toHaveAttribute('role', 'button');
      expect(workoutsCard).toHaveAttribute('tabIndex', '0');
    });

    it('devrait supporter la navigation au clavier avec Space', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine/i);
      fireEvent.keyDown(workoutsCard, { key: ' ' });

      expect(mockNavigation.toSportHistory).toHaveBeenCalledWith({ filter: 'week' });
    });

    it('devrait avoir des tooltips sur les éléments cliquables', () => {
      const sportData = {
        weeklyWorkouts: 12,
        todayCalories: 450,
        todaySteps: 8542,
        avgHeartRate: 72,
        hasGarminData: true
      };

      render(
        <ActivitePhysiqueSection
          isExpanded={true}
          onToggle={vi.fn()}
          data={sportData}
          navigation={mockNavigation}
        />
      );

      const workoutsCard = screen.getByLabelText(/12 entraînements cette semaine/i);
      expect(workoutsCard).toHaveAttribute('title', 'Voir l\'historique des entraînements');
    });
  });
});
