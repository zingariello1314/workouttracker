/**
 * Hook de navigation centralisé pour la Sidebar Premium
 * Gère les redirections vers les différents modules/onglets
 * 
 * @module hooks/useNavigation
 */

import { useWorkout } from '../context/WorkoutContext';

/**
 * Hook pour naviguer entre les différents onglets de l'application
 * 
 * @returns {Object} Fonctions de navigation
 */
export const useNavigation = () => {
  const { setActiveTab } = useWorkout();

  /**
   * Navigue vers un onglet spécifique
   * @param {string} tab - Nom de l'onglet
   */
  const navigateTo = (tab) => {
    setActiveTab(tab);
  };

  /**
   * Navigation vers les différents modules
   */
  const navigation = {
    // QuietQuest
    toQuests: () => navigateTo('quests'),
    toQuestsStats: () => navigateTo('quests'), // Même onglet, section stats
    
    // Sport
    toSport: () => navigateTo('today'),
    toSportHistory: () => navigateTo('history'),
    toSportStats: () => navigateTo('stats'),
    toGarmin: () => navigateTo('garmin'),
    
    // Apprentissage
    toLearning: () => navigateTo('apprentissage'),
    toBooks: () => navigateTo('books'),
    
    // Finance
    toFinance: () => navigateTo('finance'),
    toFinanceSynthese: () => navigateTo('finance'), // Sous-onglet Synthèse
    toFinancePlanificateur: () => navigateTo('finance'), // Sous-onglet Planificateur
    
    // Nutrition
    toNutrition: () => navigateTo('nutrition'),
    
    // Dashboard
    toDashboard: () => navigateTo('dashboard'),
    
    // Autres
    toSettings: () => navigateTo('settings'),
    toCalendar: () => navigateTo('calendar'),
    toProgress: () => navigateTo('progress'),
  };

  return {
    navigateTo,
    ...navigation
  };
};

export default useNavigation;
