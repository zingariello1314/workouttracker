import { useState, useEffect, useCallback } from 'react';
import {
  getPreferences,
  updateSectionState,
} from '../services/sidebar/sidebarStorage';

/**
 * Hook d’état UI de la Sidebar Premium (sections, mobile, statut système).
 *
 * P0.4 : l’horloge 1s a été retirée d’ici. Elle vivait dans ce hook et forçait
 * SidebarPremium + useSidebarData + ModuleRenderer (~17 modules) à se re-rendre
 * chaque seconde (~2,3 s / commit). Voir SidebarClock.jsx.
 */
export const useSidebar = () => {
  const [expandedSections, setExpandedSections] = useState(() => {
    return {
      actions: true,
      today: true,
      metrics: true,
      quests: true,
      sport: true,
      books: true,
      finance: true,
      nutrition: true,

      'course-garmin-running': true,
      'sidebar-sport-planning': true,
      'sidebar-sport-calendar': true,
      'sidebar-daily-quests': true,
      'sidebar-muscu-recap': true,
      'progression-lecture': true,
      'metriques-garmin': true,
      'liste-courses': true,
      'session-lecture-active': true,
      'creativite-projets': true,
      'performance-globale': true,
      'apprentissage-express': true,
      'sidebar-reading-session': true,
      'sidebar-book-focus': true,
      'sidebar-books-recap': true,
      'sidebar-body-recap': true,
      'sidebar-finance-snapshot': true,

      learning: false,
      journal: false,
      focusSession: false,
      achievements: false,
      focusRPG: false,
      dailyGoals: false,
      notifications: false,
      weather: false,
      motivation: false,
      rewards: false,
      history: false,
      quickSettings: false,
      aiPredictions: false,
      globalStats: false,
    };
  });

  const [systemStatus, setSystemStatus] = useState({
    active: true,
    nightMode: false,
    connected: true,
    focusPercentage: 0,
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getPreferences();
        setExpandedSections(prefs.expandedSections);
      } catch (error) {
        console.error('[useSidebar] Erreur lors du chargement des préférences:', error);
      }
    };

    loadPreferences();
  }, []);

  /**
   * Mode nuit : vérification minute (pas seconde) et setState uniquement si la
   * valeur change — évite un second re-render par tick d’horloge.
   */
  useEffect(() => {
    const updateNightMode = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 22 || hour < 6;
      setSystemStatus((prev) =>
        prev.nightMode === isNight ? prev : { ...prev, nightMode: isNight }
      );
    };

    updateNightMode();
    const id = setInterval(updateNightMode, 60_000);
    return () => clearInterval(id);
  }, []);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => {
      const newState = !prev[sectionId];

      updateSectionState(sectionId, newState).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });

      return {
        ...prev,
        [sectionId]: newState,
      };
    });
  }, []);

  const isSectionExpanded = useCallback((sectionId) => {
    return expandedSections[sectionId] ?? false;
  }, [expandedSections]);

  const openSection = useCallback((sectionId) => {
    if (!expandedSections[sectionId]) {
      toggleSection(sectionId);
    }
  }, [expandedSections, toggleSection]);

  const closeSection = useCallback((sectionId) => {
    if (expandedSections[sectionId]) {
      toggleSection(sectionId);
    }
  }, [expandedSections, toggleSection]);

  const openAllSections = useCallback(() => {
    const allExpanded = Object.keys(expandedSections).reduce((acc, key) => {
      acc[key] = true;
      updateSectionState(key, true).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });
      return acc;
    }, {});

    setExpandedSections(allExpanded);
  }, [expandedSections]);

  const closeAllSections = useCallback(() => {
    const allCollapsed = Object.keys(expandedSections).reduce((acc, key) => {
      acc[key] = false;
      updateSectionState(key, false).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });
      return acc;
    }, {});

    setExpandedSections(allCollapsed);
  }, [expandedSections]);

  const updateSystemStatus = useCallback((newStatus) => {
    setSystemStatus((prev) => ({
      ...prev,
      ...newStatus,
    }));
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  return {
    expandedSections,
    systemStatus,
    isMobileOpen,
    toggleSection,
    isSectionExpanded,
    openSection,
    closeSection,
    openAllSections,
    closeAllSections,
    updateSystemStatus,
    toggleMobileSidebar,
    closeMobileSidebar,
    openMobileSidebar,
  };
};

export default useSidebar;
