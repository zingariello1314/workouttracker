/**
 * Hook pour la navigation précise vers les modules
 * Intègre le DeepLinkService avec le système de navigation existant
 * 
 * @module hooks/useDeepNavigation
 */

import { useCallback, useEffect, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import deepLinkService from '../services/navigation/DeepLinkService';

/**
 * Hook pour la navigation précise avec scroll automatique et mise en évidence
 * @returns {Object} Fonctions et état de navigation
 */
export const useDeepNavigation = () => {
  const { setActiveTab } = useWorkout();
  const navigationStateRef = useRef({
    isNavigating: false,
    lastNavigation: null,
    pendingNavigations: []
  });

  /**
   * Navigue vers un module spécifique avec toutes les fonctionnalités avancées
   * @param {Object} target - Configuration de navigation
   * @param {string} target.tab - Onglet cible
   * @param {string} [target.subtab] - Sous-onglet optionnel
   * @param {string} target.moduleId - ID du module cible
   * @param {'smooth'|'instant'} [target.scrollBehavior='smooth'] - Comportement du scroll
   * @param {number} [target.highlightDuration=2000] - Durée de mise en évidence
   * @param {Object} [target.params={}] - Paramètres additionnels
   * @returns {Promise<boolean>} Succès de la navigation
   */
  const navigateToModule = useCallback(async (target) => {
    try {
      // Vérifier si une navigation est déjà en cours
      if (navigationStateRef.current.isNavigating) {
        console.log('[useDeepNavigation] Navigation en cours, ajout à la queue');
        navigationStateRef.current.pendingNavigations.push(target);
        return false;
      }

      navigationStateRef.current.isNavigating = true;
      navigationStateRef.current.lastNavigation = {
        target,
        timestamp: Date.now()
      };

      // Utiliser le DeepLinkService pour la navigation
      const success = await deepLinkService.navigateToModule(target, setActiveTab);

      if (success) {
        // Émettre un événement personnalisé pour les composants qui écoutent
        window.dispatchEvent(new CustomEvent('module-navigation-success', {
          detail: { target, timestamp: Date.now() }
        }));
      }

      return success;

    } catch (error) {
      console.error('[useDeepNavigation] Erreur de navigation:', error);
      return false;
    } finally {
      navigationStateRef.current.isNavigating = false;
      
      // Traiter les navigations en attente
      if (navigationStateRef.current.pendingNavigations.length > 0) {
        const nextNavigation = navigationStateRef.current.pendingNavigations.shift();
        setTimeout(() => navigateToModule(nextNavigation), 500);
      }
    }
  }, [setActiveTab]);

  /**
   * Navigation rapide vers les modules Sport
   */
  const navigateToSport = useCallback(async (params = {}) => {
    const { subtab = 'today', moduleId = 'sport-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'today',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les modules Livres
   */
  const navigateToBooks = useCallback(async (params = {}) => {
    const { subtab, moduleId = 'books-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'books',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les modules Finances
   */
  const navigateToFinance = useCallback(async (params = {}) => {
    const { subtab, moduleId = 'finance-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'finance',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les modules Quêtes
   */
  const navigateToQuests = useCallback(async (params = {}) => {
    const { subtab, moduleId = 'quests-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'quests',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les modules Apprentissage
   */
  const navigateToLearning = useCallback(async (params = {}) => {
    const { subtab, moduleId = 'learning-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'apprentissage',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les modules Nutrition
   */
  const navigateToNutrition = useCallback(async (params = {}) => {
    const { subtab, moduleId = 'nutrition-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'nutrition',
      subtab,
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers la page d'accueil avec positionnement
   */
  const navigateToHome = useCallback(async (params = {}) => {
    const { moduleId = 'home-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'home',
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 1500,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Navigation rapide vers les paramètres
   */
  const navigateToSettings = useCallback(async (params = {}) => {
    const { moduleId = 'settings-main', ...otherParams } = params;
    
    return navigateToModule({
      tab: 'settings',
      moduleId,
      scrollBehavior: 'smooth',
      highlightDuration: 2000,
      params: otherParams
    });
  }, [navigateToModule]);

  /**
   * Obtient l'état actuel de la navigation
   */
  const getNavigationState = useCallback(() => {
    return {
      isNavigating: navigationStateRef.current.isNavigating,
      lastNavigation: navigationStateRef.current.lastNavigation,
      pendingCount: navigationStateRef.current.pendingNavigations.length
    };
  }, []);

  /**
   * Annule toutes les navigations en attente
   */
  const cancelPendingNavigations = useCallback(() => {
    navigationStateRef.current.pendingNavigations = [];
    console.log('[useDeepNavigation] Navigations en attente annulées');
  }, []);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      deepLinkService.cleanup();
      navigationStateRef.current.pendingNavigations = [];
    };
  }, []);

  // Écouter les événements de navigation pour la synchronisation
  useEffect(() => {
    const handleNavigationEvent = (event) => {
      const { target } = event.detail;
      console.log('[useDeepNavigation] Navigation détectée:', target);
    };

    window.addEventListener('deeplink-navigation', handleNavigationEvent);
    
    return () => {
      window.removeEventListener('deeplink-navigation', handleNavigationEvent);
    };
  }, []);

  return {
    // Navigation générique
    navigateToModule,
    
    // Navigations spécialisées
    navigateToSport,
    navigateToBooks,
    navigateToFinance,
    navigateToQuests,
    navigateToLearning,
    navigateToNutrition,
    navigateToHome,
    navigateToSettings,
    
    // Utilitaires
    getNavigationState,
    cancelPendingNavigations,
    
    // État
    isNavigating: navigationStateRef.current.isNavigating
  };
};

export default useDeepNavigation;