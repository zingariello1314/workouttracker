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
    // TOUTES LES SECTIONS ACTIVES SONT OUVERTES PAR DÉFAUT
    return {
      // Nouvelles sections de la refonte - OUVERTES
      actions: true,
      today: true,
      metrics: true,
      quests: true,
      sport: true,
      books: true,
      finance: true,
      nutrition: true,
      
      // AJOUTER: Sections pour modules historiques - OUVERTES
      'enregistrer-session': true,
      'progression-lecture': true,
      'metriques-garmin': true,
      'quetes-interactives': true,
      'evolution-patrimoine': true,
      'liste-courses': true,
      'session-lecture-active': true,
      'entrainement-jour': true,
      'creativite-projets': true,
      'performance-globale': true,
      'apprentissage-express': true,
      
      // Anciennes sections supprimées - FERMÉES (compatibilité)
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
   * Met à jour l'heure actuelle chaque seconde
   */
  useEffect(() => {
    // Mettre à jour immédiatement
    setCurrentTime(new Date());
    
    // Mettre à jour chaque seconde
    clockIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1 seconde
    
    // Nettoyage
    return () => {
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
   * Formate l'heure au format HH:MM:SS
   * @returns {string} Heure formatée
   */
  const getFormattedTime = useCallback(() => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
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
    
    const localeStr = locale === 'fr' ? 'fr-FR' : 'en-US';
    return currentTime.toLocaleDateString(localeStr, options);
  }, [currentTime]);

  /**
   * Formate la date sans l'année (jour + mois uniquement)
   * @returns {string} Date formatée sans année
   */
  const getFormattedDayMonth = useCallback(() => {
    const options = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return currentTime.toLocaleDateString('fr-FR', options);
  }, [currentTime]);

  /**
   * Retourne l'année uniquement
   * @returns {string} Année
   */
  const getFormattedYear = useCallback(() => {
    return currentTime.getFullYear().toString();
  }, [currentTime]);

  /**
   * DEPRECATED - Utiliser getFormattedDate à la place
   * @param {string} locale - Locale (fr, en, etc.)
   * @returns {string} Date formatée
   */
  const getFormattedDateOld = useCallback((locale = 'fr') => {
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
    getFormattedDayMonth,
    getFormattedYear,
  };
};

export default useSidebar;
