/**
 * Hook de navigation centralisé pour la Sidebar Premium
 * Gère les redirections vers les différents modules/onglets avec support des paramètres contextuels
 * Intègre la navigation précise avec scroll automatique et mise en évidence
 * 
 * @module hooks/useNavigation
 */

import { useWorkout } from '../context/WorkoutContext';
import { useCallback } from 'react';
import { useDeepNavigation } from './useDeepNavigation';

/**
 * Hook pour naviguer entre les différents onglets de l'application
 * Inclut la navigation précise vers des modules spécifiques
 * 
 * @returns {Object} Fonctions de navigation
 */
export const useNavigation = () => {
  const { setActiveTab } = useWorkout();
  const deepNavigation = useDeepNavigation();

  /**
   * Navigue vers un onglet spécifique
   * @param {string} tab - Nom de l'onglet
   */
  const navigateTo = (tab) => {
    setActiveTab(tab);
  };

  /**
   * Navigue vers un onglet avec paramètres contextuels
   * @param {string} tab - Nom de l'onglet
   * @param {Object} params - Paramètres de navigation (tab, section, filter, date, scrollTo, questId, action)
   */
  const navigateWithParams = useCallback((tab, params = {}) => {
    // Naviguer vers l'onglet
    setActiveTab(tab);
    
    // Stocker les paramètres dans sessionStorage pour que le composant cible puisse les récupérer
    if (Object.keys(params).length > 0) {
      sessionStorage.setItem(`nav_params_${tab}`, JSON.stringify(params));
      
      // Nettoyer après un court délai pour éviter la pollution
      setTimeout(() => {
        sessionStorage.removeItem(`nav_params_${tab}`);
      }, 5000);
    }
    
    // Si scrollTo est demandé, attendre le render puis scroller
    if (params.scrollTo && params.questId) {
      setTimeout(() => {
        const element = document.getElementById(`quest-${params.questId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [setActiveTab]);

  /**
   * Navigation vers les différents modules avec support des paramètres
   */
  const navigation = {
    // QuietQuest - avec paramètres contextuels
    // params: { section, questId, scrollTo, filter }
    toQuests: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('quests', params);
      } else {
        navigateTo('quests');
      }
    },
    toQuestsStats: () => navigateWithParams('quests', { section: 'stats' }),
    
    // Sport - avec paramètres contextuels
    // params: { tab, filter, date, scrollTo, action }
    toSport: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('today', params);
      } else {
        navigateTo('today');
      }
    },
    toSportHistory: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('history', params);
      } else {
        navigateTo('history');
      }
    },
    toSportStats: () => navigateTo('stats'),
    
    // Garmin - avec paramètres contextuels
    // params: { tab, section, date }
    toGarmin: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('garmin', params);
      } else {
        navigateTo('garmin');
      }
    },
    
    // Apprentissage
    toLearning: () => navigateTo('apprentissage'),
    
    // Livres - avec paramètres contextuels
    // params: { filter, tab, date, action }
    toBooks: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('books', params);
      } else {
        navigateTo('books');
      }
    },
    
    // Finance - avec paramètres contextuels
    // params: { tab, section, action }
    toFinance: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('finance', params);
      } else {
        navigateTo('finance');
      }
    },
    toFinanceSynthese: (params = {}) => navigateWithParams('finance', { tab: 'synthese', ...params }),
    toFinancePlanificateur: (params = {}) => navigateWithParams('finance', { tab: 'planificateur', ...params }),
    
    // Nutrition - avec paramètres contextuels
    // params: { date, section, action }
    toNutrition: (params = {}) => {
      if (Object.keys(params).length > 0) {
        navigateWithParams('nutrition', params);
      } else {
        navigateTo('nutrition');
      }
    },
    
    // Dashboard
    toDashboard: () => navigateTo('dashboard'),
    
    // Autres
    toSettings: () => navigateTo('settings'),
    toCalendar: () => navigateTo('calendar'),
    toProgress: () => navigateTo('progress'),
    
    // Focus (nouveau)
    toFocus: () => navigateTo('today'),
  };

  return {
    navigateTo,
    navigateWithParams,
    ...navigation,
    
    // Navigation précise avec scroll automatique et mise en évidence
    navigateToModule: deepNavigation.navigateToModule,
    navigateToSportModule: deepNavigation.navigateToSport,
    navigateToBooksModule: deepNavigation.navigateToBooks,
    navigateToFinanceModule: deepNavigation.navigateToFinance,
    navigateToQuestsModule: deepNavigation.navigateToQuests,
    navigateToLearningModule: deepNavigation.navigateToLearning,
    navigateToNutritionModule: deepNavigation.navigateToNutrition,
    navigateToHomeModule: deepNavigation.navigateToHome,
    navigateToSettingsModule: deepNavigation.navigateToSettings,
    
    // Utilitaires de navigation
    getNavigationState: deepNavigation.getNavigationState,
    cancelPendingNavigations: deepNavigation.cancelPendingNavigations,
    isNavigating: deepNavigation.isNavigating
  };
};

export default useNavigation;
