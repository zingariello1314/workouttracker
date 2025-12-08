import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPreferences,
  updateSectionState,
  getSectionState,
} from '../services/sidebar/sidebarStorage';

/**
 * Hook personnalisé pour gérer l'état et la logique de la Sidebar Premium
 * @returns {Object} État et fonctions de la sidebar
 */
export const useSidebar = () => {
  // État de l'horloge
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // État des sections expandées
  const [expandedSections, setExpandedSections] = useState(() => {
    // Valeurs par défaut en attendant le chargement depuis IndexedDB
    return {
      actions: true,
      metrics: true,
      quests: true,
      sport: false,
      learning: false,
      books: false,
      finance: false,
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
  
  // État du système
  const [systemStatus, setSystemStatus] = useState({
    active: true,
    nightMode: false,
    connected: true,
    focusPercentage: 0,
  });
  
  // État mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Référence pour l'intervalle de l'horloge
  const clockIntervalRef = useRef(null);

  /**
   * Charge les préférences depuis IndexedDB au montage
   */
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
   * Met à jour l'heure actuelle chaque minute
   */
  useEffect(() => {
    // Mettre à jour immédiatement
    setCurrentTime(new Date());
    
    // Calculer le délai jusqu'à la prochaine minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    // Attendre jusqu'à la prochaine minute, puis mettre à jour chaque minute
    const initialTimeout = setTimeout(() => {
      setCurrentTime(new Date());
      
      // Démarrer l'intervalle pour les mises à jour suivantes
      clockIntervalRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // 60 secondes
    }, msUntilNextMinute);
    
    // Nettoyage
    return () => {
      clearTimeout(initialTimeout);
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
      }
    };
  }, []);

  /**
   * Bascule l'état d'une section
   * @param {string} sectionId - Identifiant de la section
   */
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => {
      const newState = !prev[sectionId];
      
      // Sauvegarder immédiatement dans IndexedDB (async, sans attendre)
      updateSectionState(sectionId, newState).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });
      
      return {
        ...prev,
        [sectionId]: newState,
      };
    });
  }, []);

  /**
   * Vérifie si une section est expandée
   * @param {string} sectionId - Identifiant de la section
   * @returns {boolean} État d'expansion
   */
  const isSectionExpanded = useCallback((sectionId) => {
    return expandedSections[sectionId] ?? false;
  }, [expandedSections]);

  /**
   * Ouvre une section spécifique
   * @param {string} sectionId - Identifiant de la section
   */
  const openSection = useCallback((sectionId) => {
    if (!expandedSections[sectionId]) {
      toggleSection(sectionId);
    }
  }, [expandedSections, toggleSection]);

  /**
   * Ferme une section spécifique
   * @param {string} sectionId - Identifiant de la section
   */
  const closeSection = useCallback((sectionId) => {
    if (expandedSections[sectionId]) {
      toggleSection(sectionId);
    }
  }, [expandedSections, toggleSection]);

  /**
   * Ouvre toutes les sections
   */
  const openAllSections = useCallback(() => {
    const allExpanded = Object.keys(expandedSections).reduce((acc, key) => {
      acc[key] = true;
      // Sauvegarder de manière asynchrone
      updateSectionState(key, true).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });
      return acc;
    }, {});
    
    setExpandedSections(allExpanded);
  }, [expandedSections]);

  /**
   * Ferme toutes les sections
   */
  const closeAllSections = useCallback(() => {
    const allCollapsed = Object.keys(expandedSections).reduce((acc, key) => {
      acc[key] = false;
      // Sauvegarder de manière asynchrone
      updateSectionState(key, false).catch((error) => {
        console.error('[useSidebar] Erreur lors de la sauvegarde de l\'état de la section:', error);
      });
      return acc;
    }, {});
    
    setExpandedSections(allCollapsed);
  }, [expandedSections]);

  /**
   * Met à jour le statut système
   * @param {Object} newStatus - Nouveau statut
   */
  const updateSystemStatus = useCallback((newStatus) => {
    setSystemStatus((prev) => ({
      ...prev,
      ...newStatus,
    }));
  }, []);

  /**
   * Détecte le mode nuit basé sur l'heure
   */
  useEffect(() => {
    const hour = currentTime.getHours();
    const isNight = hour >= 22 || hour < 6;
    
    setSystemStatus((prev) => ({
      ...prev,
      nightMode: isNight,
    }));
  }, [currentTime]);

  /**
   * Bascule l'état mobile de la sidebar
   */
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  /**
   * Ferme la sidebar mobile
   */
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  /**
   * Ouvre la sidebar mobile
   */
  const openMobileSidebar = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  /**
   * Formate l'heure au format HH:MM
   * @returns {string} Heure formatée
   */
  const getFormattedTime = useCallback(() => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  /**
   * Formate la date au format localisé
   * @param {string} locale - Locale (fr, en, etc.)
   * @returns {string} Date formatée
   */
  const getFormattedDate = useCallback((locale = 'fr') => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return currentTime.toLocaleDateString(locale, options);
  }, [currentTime]);

  return {
    // État
    currentTime,
    expandedSections,
    systemStatus,
    isMobileOpen,
    
    // Fonctions de section
    toggleSection,
    isSectionExpanded,
    openSection,
    closeSection,
    openAllSections,
    closeAllSections,
    
    // Fonctions système
    updateSystemStatus,
    
    // Fonctions mobile
    toggleMobileSidebar,
    closeMobileSidebar,
    openMobileSidebar,
    
    // Fonctions de formatage
    getFormattedTime,
    getFormattedDate,
  };
};

export default useSidebar;
