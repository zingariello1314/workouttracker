import { useState, useEffect, useCallback, useMemo } from 'react';
import moduleAlternationService from '../services/sidebar/moduleAlternationService';

/**
 * Hook pour gérer l'alternance des modules sidebar
 * Fournit l'accès au service d'alternance avec état React
 */
export const useModuleAlternation = () => {
  const [alternationPattern, setAlternationPattern] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger le pattern d'alternance initial
  useEffect(() => {
    try {
      const pattern = moduleAlternationService.getAlternatedModules();
      setAlternationPattern(pattern);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Obtenir tous les modules dans l'ordre d'alternance
  const getAlternatedModules = useCallback(() => {
    return moduleAlternationService.getAlternatedModules();
  }, []);

  // Obtenir un module par ID
  const getModuleById = useCallback((moduleId) => {
    return moduleAlternationService.getModuleById(moduleId);
  }, []);

  // Obtenir les modules par type
  const getModulesByType = useCallback((type) => {
    return moduleAlternationService.getModulesByType(type);
  }, []);

  // Insérer un nouveau module
  const insertNewModule = useCallback((moduleConfig) => {
    try {
      const newModule = moduleAlternationService.insertNewModule(moduleConfig);
      const updatedPattern = moduleAlternationService.getAlternatedModules();
      setAlternationPattern(updatedPattern);
      return newModule;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Supprimer un module
  const removeModule = useCallback((moduleId) => {
    try {
      const success = moduleAlternationService.removeModule(moduleId);
      if (success) {
        const updatedPattern = moduleAlternationService.getAlternatedModules();
        setAlternationPattern(updatedPattern);
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Activer/désactiver un module
  const toggleModuleVisibility = useCallback((moduleId) => {
    try {
      const success = moduleAlternationService.toggleModuleVisibility(moduleId);
      if (success) {
        const updatedPattern = moduleAlternationService.getAlternatedModules();
        setAlternationPattern(updatedPattern);
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Valider le pattern d'alternance
  const validatePattern = useCallback(() => {
    return moduleAlternationService.validateAlternationPattern();
  }, []);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return moduleAlternationService.getAlternationStats();
  }, []);

  // Mémoriser les modules par type pour éviter les recalculs
  const modulesByType = useMemo(() => {
    return {
      legacy: alternationPattern.filter(m => m.type === 'legacy'),
      historical: alternationPattern.filter(m => m.type === 'historical')
    };
  }, [alternationPattern]);

  // Mémoriser les statistiques
  const stats = useMemo(() => {
    return getStats();
  }, [alternationPattern, getStats]);

  // Mémoriser la validation
  const validation = useMemo(() => {
    return validatePattern();
  }, [alternationPattern, validatePattern]);

  return {
    // État
    alternationPattern,
    modulesByType,
    stats,
    validation,
    isLoading,
    error,

    // Actions
    getAlternatedModules,
    getModuleById,
    getModulesByType,
    insertNewModule,
    removeModule,
    toggleModuleVisibility,
    validatePattern,
    getStats,

    // Utilitaires
    clearError: () => setError(null),
    refreshPattern: () => {
      const pattern = moduleAlternationService.getAlternatedModules();
      setAlternationPattern(pattern);
    }
  };
};