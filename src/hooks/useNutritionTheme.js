/**
 * useNutritionTheme.js
 * 
 * Hook React pour le Thème Dynamique Nutrition.
 * 
 * Charge les données nécessaires (streaks, healthScore, dailyMeals, activeProgram)
 * et calcule/applique le thème dynamique automatiquement.
 * 
 * Mise à jour automatique lorsque les données changent (streaks, healthScore, etc.).
 * 
 * Philosophie :
 * - Calcul automatique basé sur données réelles
 * - Application non-intrusive (CSS variables)
 * - Performance optimisée (debounce, memoization)
 * - Option désactiver (preference utilisateur)
 * 
 * @module hooks/useNutritionTheme
 * @see ../../nouvelongletnutritionplan.md Section 7.3
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNutritionData } from './useNutritionData';
import { useNutritionGamification } from './useNutritionGamification';
import { useNutritionHealthScore } from './useNutritionHealthScore';
import { calculateAndApplyTheme, getDynamicTheme, applyDynamicTheme, resetTheme } from '../services/nutrition/nutritionTheme';
import logger from '../utils/logger';

const log = logger.module('useNutritionTheme');

/**
 * Hook pour le thème dynamique nutrition
 * 
 * @param {Object} options - Options
 * @param {boolean} options.enabled - Si le thème dynamique est activé (défaut: true)
 * @param {boolean} options.autoApply - Appliquer le thème automatiquement (défaut: true)
 * @param {boolean} options.animate - Activer animation transition (défaut: true)
 * @param {number} options.updateInterval - Intervalle de mise à jour en ms (défaut: 5min)
 * @returns {Object} État et méthodes du thème
 */
export const useNutritionTheme = (options = {}) => {
  const {
    enabled = true,
    autoApply = true,
    animate = true,
    updateInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const { 
    dbReady: nutritionDbReady,
    getDailyMealsByRange,
    getAllPrograms
  } = useNutritionData();

  const {
    streaks: gamificationStreaks,
    enabled: gamificationEnabled
  } = useNutritionGamification({ enabled: true, autoCheck: false });

  const {
    healthScore,
    loading: healthScoreLoading
  } = useNutritionHealthScore({ autoRefresh: true, refreshInterval: updateInterval });

  const [currentTheme, setCurrentTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastUpdateRef = useRef(null);

  /**
   * Charge les données nécessaires et calcule/applique le thème
   */
  const calculateTheme = useCallback(async () => {
    if (!nutritionDbReady || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log supprimé pour éviter spam

      // 1. Charger données nutrition (7 derniers jours pour surplus streak)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const [dailyMeals, programs] = await Promise.all([
        getDailyMealsByRange(startDateStr, endDateStr),
        getAllPrograms()
      ]);

      // 2. Trouver programme actif
      const activeProgram = programs.find(p => p.isActive) || null;

      // 3. Préparer données pour calcul thème
      const streaks = gamificationStreaks || {};
      const themeData = {
        streaks,
        healthScore,
        dailyMeals,
        activeProgram
      };

      // 4. Calculer et appliquer thème
      const theme = calculateAndApplyTheme(themeData, {
        apply: autoApply,
        animate
      });

      setCurrentTheme(theme);
      lastUpdateRef.current = new Date();

      // Log supprimé pour éviter spam
    } catch (err) {
      log.error('[calculateTheme] Erreur calcul thème:', err);
      setError(err);
      
      // En cas d'erreur, réinitialiser au thème par défaut
      if (autoApply) {
        resetTheme();
      }
    } finally {
      setLoading(false);
    }
  }, [
    nutritionDbReady,
    enabled,
    autoApply,
    animate,
    getDailyMealsByRange,
    getAllPrograms,
    gamificationStreaks,
    healthScore
  ]);

  // ✅ OPTIMISATION : Debounce pour éviter recalculs multiples rapides
  const themeCalculationRef = useRef(null);
  
  // Calculer thème au chargement et lors de changements (avec debounce)
  useEffect(() => {
    if (!nutritionDbReady || !enabled) {
      setLoading(false);
      if (!enabled && autoApply) {
        resetTheme();
      }
      return;
    }

    // Attendre que healthScore soit chargé (si activé)
    if (healthScoreLoading) {
      return;
    }

    // ✅ OPTIMISATION : Debounce pour éviter recalculs multiples
    if (themeCalculationRef.current) {
      clearTimeout(themeCalculationRef.current);
    }
    
    themeCalculationRef.current = setTimeout(() => {
      calculateTheme();
    }, 300);

    return () => {
      if (themeCalculationRef.current) {
        clearTimeout(themeCalculationRef.current);
      }
    };
  }, [
    nutritionDbReady,
    enabled,
    healthScoreLoading,
    calculateTheme,
    autoApply
  ]);

  // Mise à jour périodique (si activé)
  useEffect(() => {
    if (!enabled || !autoApply || updateInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      calculateTheme();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enabled, autoApply, updateInterval, calculateTheme]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      // Optionnel: réinitialiser au thème par défaut au démontage
      // Pour l'instant, on garde le thème appliqué
    };
  }, []);

  /**
   * Applique manuellement un thème
   */
  const applyTheme = useCallback((theme) => {
    if (!theme) {
      log.warn('[applyTheme] Thème invalide');
      return;
    }

    try {
      applyDynamicTheme(theme, { animate });
      setCurrentTheme(theme);
      // Log supprimé pour éviter spam
    } catch (err) {
      log.error('[applyTheme] Erreur application thème:', err);
    }
  }, [animate]);

  /**
   * Réinitialise au thème par défaut
   */
  const reset = useCallback(() => {
    try {
      resetTheme();
      const defaultTheme = {
        name: 'theme-default',
        label: 'Thème Classique',
        colors: {
          primary: '#8b5cf6',
          secondary: '#7c3aed',
          accent: '#ec4899',
          gradient: 'from-purple-500 via-pink-500 to-purple-600'
        },
        reason: 'Réinitialisation manuelle'
      };
      setCurrentTheme(defaultTheme);
      // Log supprimé pour éviter spam
    } catch (err) {
      log.error('[reset] Erreur réinitialisation thème:', err);
    }
  }, []);

  /**
   * Recalcule le thème manuellement
   */
  const refresh = useCallback(() => {
    calculateTheme();
  }, [calculateTheme]);

  return {
    // État
    theme: currentTheme,
    loading,
    error,
    enabled,
    lastUpdate: lastUpdateRef.current,

    // Méthodes
    applyTheme,
    reset,
    refresh,
    calculateTheme
  };
};

export default useNutritionTheme;

