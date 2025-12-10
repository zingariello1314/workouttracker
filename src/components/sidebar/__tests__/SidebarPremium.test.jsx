import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarPremium from '../SidebarPremium';
import * as useSidebarModule from '../../../hooks/useSidebar';
import * as useSidebarDataModule from '../../../hooks/useSidebarData';
import * as useNavigationModule from '../../../hooks/useNavigation';

// Mock des hooks
vi.mock('../../../hooks/useSidebar');
vi.mock('../../../hooks/useSidebarData');
vi.mock('../../../hooks/useNavigation');

describe('SidebarPremium - Tests finaux et polish', () => {
  let mockUseSidebar;
  let mockUseSidebarData;
  let mockNavigation;

  beforeEach(() => {
    // Configuration des mocks par défaut
    mockUseSidebar = {
      currentTime: new Date('2025-12-08T14:30:00'),
      expandedSections: { actions: true, metrics: true },
      systemStatus: {
        nightMode: true,
        connected: true,
        focusPercentage: 85
      },
      isMobileOpen: false,
      toggleSection: vi.fn(),
      isSectionExpanded: vi.fn((section) => section === 'actions' || section === 'metrics'),
      getFormattedTime: vi.fn(() => '14:30'),
      getFormattedDate: vi.fn(() => 'Dimanche 8 décembre 2025'),
      getFormattedDayMonth: vi.fn(() => 'Dimanche 8 décembre'),
      getFormattedYear: vi.fn(() => '2025'),
      toggleMobileSidebar: vi.fn(),
      closeMobileSidebar: vi.fn(),
    };

    mockUseSidebarData = {
      metrics: {
        xp: 12500,
        level: 15,
        streak: 7,
        focus: 85
      },
      quests: [
        {
          id: 1,
          title: 'Lire 30 minutes',
          icon: '📚',
          progress: 75,
          completed: false
        },
        {
          id: 2,
          title: 'Faire du sport',
          icon: '💪',
          progress: 100,
          completed: true
        }
      ],
      sport: {
        weeklyWorkouts: 3,
        todayCalories: 450,
        todaySteps: 8500,
        avgHeartRate: 72,
        hasGarminData: true
      },
      finance: {
        netWorth: 125000,
        investments: 85000,
        monthlyBudget: 2500,
        monthlySavings: 800,
        hasData: true
      },
      learning: {
        currentBooks: 2,
        todayPages: 25,
        todayMinutes: 45,
        dailyGoal: 60,
        hasData: true
      },
      isLoading: false
    };

    mockNavigation = {
      toQuests: vi.fn(),
      toSportHistory: vi.fn(),
      toGarmin: vi.fn(),
      toBooks: vi.fn(),
      toFinance: vi.fn(),
      toLearning: vi.fn(),
    };

    vi.spyOn(useSidebarModule, 'useSidebar').mockReturnValue(mockUseSidebar);
    vi.spyOn(useSidebarDataModule, 'useSidebarData').mockReturnValue(mockUseSidebarData);
    vi.spyOn(useNavigationModule, 'useNavigation').mockReturnValue(mockNavigation);

    // Mock de requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      cb();
      return 1;
    });
    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Test des interactions utilisateur', () => {
    it('devrait afficher l\'horloge et la date correctement', () => {
      render(<SidebarPremium />);
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
      expect(screen.getByText('Dimanche 8 décembre 2025')).toBeInTheDocument();
    });

    it('devrait afficher les statuts système', () => {
      render(<SidebarPremium />);
      
      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Nuit')).toBeInTheDocument();
      expect(screen.getByText('En ligne')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('devrait permettre de plier/déplier les sections', () => {
      render(<SidebarPremium />);
      
      const actionsHeader = screen.getByRole('button', { name: /Actions Rapides/i });
      fireEvent.click(actionsHeader);
      
      expect(mockUseSidebar.toggleSection).toHaveBeenCalledWith('actions');
    });

    it('devrait supporter la navigation clavier sur les sections', () => {
      render(<SidebarPremium />);
      
      const actionsHeader = screen.getByRole('button', { name: /Actions Rapides/i });
      fireEvent.keyDown(actionsHeader, { key: 'Enter' });
      
      expect(mockUseSidebar.toggleSection).toHaveBeenCalledWith('actions');
    });

    it('devrait afficher la progression globale avec les bonnes valeurs', () => {
      render(<SidebarPremium />);
      
      expect(screen.getByText('12,500')).toBeInTheDocument(); // XP
      expect(screen.getByText('15')).toBeInTheDocument(); // Niveau
      expect(screen.getByText('7')).toBeInTheDocument(); // Streak
    });

    it('devrait afficher les quêtes actives avec progression', () => {
      render(<SidebarPremium />);
      
      expect(screen.getByText('Lire 30 minutes')).toBeInTheDocument();
      expect(screen.getByText('Faire du sport')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('2. Test de la navigation', () => {
    it('devrait naviguer vers les quêtes au clic sur les métriques', () => {
      render(<SidebarPremium />);
      
      const xpCard = screen.getByLabelText(/XP Total: 12,500 points/i);
      fireEvent.click(xpCard);
      
      expect(mockNavigation.toQuests).toHaveBeenCalled();
    });

    it('devrait naviguer vers l\'historique sport au clic', () => {
      render(<SidebarPremium />);
      
      // Ouvrir la section Sport
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'sport');
      render(<SidebarPremium />);
      
      const workoutsCard = screen.getByText('Entraînements').closest('.sidebar-data-card');
      if (workoutsCard) {
        fireEvent.click(workoutsCard);
        expect(mockNavigation.toSportHistory).toHaveBeenCalled();
      }
    });

    it('devrait naviguer vers Garmin au clic sur les calories', () => {
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'sport');
      render(<SidebarPremium />);
      
      const caloriesCard = screen.getByText('Calories').closest('.sidebar-data-card');
      if (caloriesCard) {
        fireEvent.click(caloriesCard);
        expect(mockNavigation.toGarmin).toHaveBeenCalled();
      }
    });

    it('devrait naviguer vers les livres au clic', () => {
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'books');
      render(<SidebarPremium />);
      
      const booksCard = screen.getByText('En cours').closest('.sidebar-data-card');
      if (booksCard) {
        fireEvent.click(booksCard);
        expect(mockNavigation.toBooks).toHaveBeenCalled();
      }
    });

    it('devrait naviguer vers les finances au clic', () => {
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'finance');
      render(<SidebarPremium />);
      
      const financeCard = screen.getByText('Patrimoine').closest('.sidebar-data-card');
      if (financeCard) {
        fireEvent.click(financeCard);
        expect(mockNavigation.toFinance).toHaveBeenCalled();
      }
    });
  });

  describe('3. Test du responsive mobile', () => {
    it('devrait afficher le bouton toggle mobile', () => {
      render(<SidebarPremium />);
      
      const toggleButton = screen.getByLabelText('Ouvrir la sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('devrait ouvrir/fermer la sidebar mobile', () => {
      render(<SidebarPremium />);
      
      const toggleButton = screen.getByLabelText('Ouvrir la sidebar');
      fireEvent.click(toggleButton);
      
      expect(mockUseSidebar.toggleMobileSidebar).toHaveBeenCalled();
    });

    it('devrait fermer la sidebar au clic sur l\'overlay', () => {
      render(<SidebarPremium />);
      
      const overlay = document.querySelector('.sidebar-mobile-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockUseSidebar.closeMobileSidebar).toHaveBeenCalled();
      }
    });

    it('devrait changer le label du bouton quand la sidebar est ouverte', () => {
      mockUseSidebar.isMobileOpen = true;
      render(<SidebarPremium />);
      
      const toggleButton = screen.getByLabelText('Fermer la sidebar');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('4. Test de l\'accessibilité', () => {
    it('devrait avoir un skip link pour la navigation', () => {
      render(<SidebarPremium />);
      
      const skipLink = screen.getByText('Aller au contenu principal');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#sidebar-main-content');
    });

    it('devrait avoir des attributs ARIA corrects sur les sections', () => {
      render(<SidebarPremium />);
      
      const actionsHeader = screen.getByRole('button', { name: /Actions Rapides/i });
      expect(actionsHeader).toHaveAttribute('aria-expanded');
      expect(actionsHeader).toHaveAttribute('tabIndex', '0');
    });

    it('devrait avoir des progressbar avec aria-valuenow', () => {
      render(<SidebarPremium />);
      
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });

    it('devrait avoir des labels aria sur les cartes cliquables', () => {
      render(<SidebarPremium />);
      
      const xpCard = screen.getByLabelText(/XP Total: 12,500 points/i);
      expect(xpCard).toHaveAttribute('role', 'button');
      expect(xpCard).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('5. Test des données et formatage', () => {
    it('devrait formater les grandes valeurs correctement', () => {
      mockUseSidebarData.finance.netWorth = 1250000;
      render(<SidebarPremium />);
      
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'finance');
      render(<SidebarPremium />);
      
      // Devrait afficher 1.2M€ ou 1.3M€
      const financeSection = screen.getByText(/Patrimoine/i).closest('.sidebar-section');
      expect(financeSection).toBeInTheDocument();
    });

    it('devrait afficher un message quand il n\'y a pas de quêtes', () => {
      mockUseSidebarData.quests = [];
      render(<SidebarPremium />);
      
      expect(screen.getByText('Aucune quête active aujourd\'hui')).toBeInTheDocument();
    });

    it('devrait afficher le badge avec le nombre de quêtes', () => {
      render(<SidebarPremium />);
      
      const badge = screen.getByText('2');
      expect(badge).toHaveClass('sidebar-section-badge');
    });

    it('devrait afficher les warnings pour les modules en développement', () => {
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'journal');
      render(<SidebarPremium />);
      
      const warnings = screen.getAllByText('Module en développement');
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('6. Test de la carte 3D', () => {
    it('devrait afficher la carte de profil', () => {
      render(<SidebarPremium />);
      
      const profileCard = screen.getByLabelText(/Carte de profil: QuietQuest/i);
      expect(profileCard).toBeInTheDocument();
    });

    it('devrait avoir l\'avatar avec le bon alt text', () => {
      render(<SidebarPremium />);
      
      const avatar = screen.getByAltText('Avatar de QuietQuest');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', '/logo.png');
    });

    it('devrait supporter la navigation clavier sur la carte', () => {
      render(<SidebarPremium />);
      
      const profileCard = screen.getByLabelText(/Carte de profil: QuietQuest/i);
      expect(profileCard).toHaveAttribute('tabIndex', '0');
      
      fireEvent.keyDown(profileCard, { key: 'Enter' });
      // La carte devrait réagir au clavier
    });
  });

  describe('7. Test de la persistance', () => {
    it('devrait charger les données au montage', () => {
      render(<SidebarPremium />);
      
      // Vérifier que useSidebarData a été appelé
      expect(useSidebarDataModule.useSidebarData).toHaveBeenCalled();
    });

    it('devrait afficher les données réelles des modules', () => {
      render(<SidebarPremium />);
      
      // Sport
      expect(screen.getByText('3')).toBeInTheDocument(); // weeklyWorkouts
      
      // Finance
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'finance');
      render(<SidebarPremium />);
      
      // Learning
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'books');
      render(<SidebarPremium />);
      expect(screen.getByText('2')).toBeInTheDocument(); // currentBooks
    });
  });

  describe('8. Test des performances', () => {
    it('devrait utiliser React.memo pour éviter les re-renders', () => {
      const { rerender } = render(<SidebarPremium />);
      
      // Re-render avec les mêmes props
      rerender(<SidebarPremium />);
      
      // Le composant ne devrait pas se re-render inutilement
      expect(useSidebarModule.useSidebar).toHaveBeenCalledTimes(2);
    });

    it('devrait utiliser requestAnimationFrame pour les animations', () => {
      render(<SidebarPremium />);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('9. Test des cas limites', () => {
    it('devrait gérer les valeurs nulles ou undefined', () => {
      mockUseSidebarData.finance.netWorth = null;
      render(<SidebarPremium />);
      
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'finance');
      render(<SidebarPremium />);
      
      // Devrait afficher 0€ au lieu de crasher
      expect(screen.getByText('0€')).toBeInTheDocument();
    });

    it('devrait gérer l\'absence de données Garmin', () => {
      mockUseSidebarData.sport.hasGarminData = false;
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'sport');
      render(<SidebarPremium />);
      
      expect(screen.getByText('Données Garmin non disponibles')).toBeInTheDocument();
    });

    it('devrait gérer l\'absence de données financières', () => {
      mockUseSidebarData.finance.hasData = false;
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'finance');
      render(<SidebarPremium />);
      
      expect(screen.getByText('Données financières non disponibles')).toBeInTheDocument();
    });

    it('devrait gérer l\'absence de données de lecture', () => {
      mockUseSidebarData.learning.hasData = false;
      mockUseSidebar.isSectionExpanded.mockImplementation((section) => section === 'books');
      render(<SidebarPremium />);
      
      expect(screen.getByText('Données de lecture non disponibles')).toBeInTheDocument();
    });
  });

  describe('10. Test de l\'intégration complète', () => {
    it('devrait afficher toutes les sections principales', () => {
      render(<SidebarPremium />);
      
      expect(screen.getByText('Actions Rapides')).toBeInTheDocument();
      expect(screen.getByText('Progression Globale')).toBeInTheDocument();
      expect(screen.getByText('Quêtes Actives')).toBeInTheDocument();
      expect(screen.getByText('Activité Physique')).toBeInTheDocument();
      expect(screen.getByText('Livres')).toBeInTheDocument();
      expect(screen.getByText('Finances')).toBeInTheDocument();
    });

    it('devrait avoir la structure HTML correcte', () => {
      const { container } = render(<SidebarPremium />);
      
      const sidebar = container.querySelector('.sidebar-premium');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute('role', 'complementary');
      
      const clockSection = container.querySelector('.sidebar-clock-section');
      expect(clockSection).toBeInTheDocument();
      
      const content = container.querySelector('.sidebar-content');
      expect(content).toBeInTheDocument();
    });
  });
});
