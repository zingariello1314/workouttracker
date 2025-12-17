/**
 * Hook React pour utiliser les préférences utilisateur
 * 
 * Hook personnalisé pour gérer les préférences utilisateur dans les statistiques
 * de lecture avec persistance automatique et synchronisation d'état.
 * 
 * @see Requirements 10.5, 9.5
 */

import { useState, useEffect } from 'react';
import userPreferencesService from '../services/statistics/userPreferencesService';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(
    userPreferencesService.getPreferences()
  );

  useEffect(() => {
    const unsubscribe = userPreferencesService.addListener((event, data) => {
      setPreferences(userPreferencesService.getPreferences());
    });

    return unsubscribe;
  }, []);

  return {
    preferences,
    updateFilters: (filters) => userPreferencesService.updateFilters(filters),
    updateDisplay: (display) => userPreferencesService.updateDisplayPreferences(display),
    updateChartSettings: (settings) => userPreferencesService.updateChartSettings(settings),
    addFavoriteComparison: (comparison) => userPreferencesService.addFavoriteComparison(comparison),
    removeFavoriteComparison: (id) => userPreferencesService.removeFavoriteComparison(id),
    toggleSection: (sectionId) => userPreferencesService.toggleExpandedSection(sectionId),
    isSectionExpanded: (sectionId) => userPreferencesService.isSectionExpanded(sectionId),
    resetPreferences: () => userPreferencesService.resetPreferences(),
    exportPreferences: () => userPreferencesService.exportPreferences(),
    importPreferences: (data) => userPreferencesService.importPreferences(data)
  };
};

export default useUserPreferences;