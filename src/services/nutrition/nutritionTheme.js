/**
 * nutritionTheme.js
 * 
 * Service pour le calcul et l'application du Thème Dynamique.
 * 
 * Calcule un thème adaptatif basé sur l'état utilisateur :
 * - Thème Feu (fire) : Streaks 30+ jours → Orange/Rouge
 * - Thème Apaisant (calm) : Score santé < 40 → Bleu
 * - Thème Croissance (growth) : Surplus contrôlé 7+ jours → Vert
 * - Thème Classique (default) : Violet/Rose
 * 
 * Applique le thème via CSS variables pour adaptation automatique de l'interface.
 * 
 * Philosophie :
 * - Calcul basé sur données réelles (streaks, healthScore, nutrition)
 * - Priorité logique (feu > calm > growth > default)
 * - Application non-intrusive (CSS variables, classes)
 * - Performance optimisée (mise à jour uniquement si nécessaire)
 * - Option désactiver (preference utilisateur)
 * 
 * @module services/nutrition/nutritionTheme
 * @see ../../../../nouvelongletnutritionplan.md Section 7.3
 */

import logger from '../../utils/logger';

const log = logger.module('nutritionTheme');

// ==================== CONFIGURATION ====================

/**
 * Définitions des thèmes disponibles
 */
const THEME_DEFINITIONS = {
  fire: {
    name: 'theme-fire',
    label: 'Thème Feu',
    description: 'Série impressionnante de 30+ jours',
    colors: {
      primary: '#f97316',      // Orange-500
      secondary: '#ea580c',    // Orange-600
      accent: '#dc2626',       // Red-600
      gradient: 'from-orange-500 via-red-500 to-orange-600'
    },
    condition: (userState) => {
      const streaks = userState?.streaks || {};
      const overallStreak = streaks.overall?.current || streaks.overall?.actual || 0;
      return overallStreak >= 30;
    }
  },
  calm: {
    name: 'theme-calm',
    label: 'Thème Apaisant',
    description: 'Focus récupération et équilibre',
    colors: {
      primary: '#3b82f6',      // Blue-500
      secondary: '#2563eb',    // Blue-600
      accent: '#1e40af',       // Blue-800
      gradient: 'from-blue-500 to-blue-700'
    },
    condition: (userState) => {
      const healthScore = userState?.healthScore || {};
      const globalScore = healthScore.global;
      // Valider que le score est un nombre valide et < 40
      return typeof globalScore === 'number' && 
             isFinite(globalScore) && 
             !isNaN(globalScore) && 
             globalScore < 40;
    }
  },
  growth: {
    name: 'theme-growth',
    label: 'Thème Croissance',
    description: 'Surplus contrôlé et progression',
    colors: {
      primary: '#10b981',      // Green-500
      secondary: '#059669',    // Green-600
      accent: '#047857',       // Green-700
      gradient: 'from-green-500 to-green-700'
    },
    condition: (userState) => {
      const nutrition = userState?.nutrition || {};
      const surplusStreak = nutrition.surplusStreak || 0;
      return surplusStreak >= 7;
    }
  },
  default: {
    name: 'theme-default',
    label: 'Thème Classique',
    description: 'Violet/Rose par défaut',
    colors: {
      primary: '#8b5cf6',      // Purple-500
      secondary: '#7c3aed',    // Purple-600
      accent: '#ec4899',       // Pink-500
      gradient: 'from-purple-500 via-pink-500 to-purple-600'
    },
    condition: () => true // Toujours disponible comme fallback
  }
};

/**
 * Ordre de priorité pour sélection du thème
 */
const THEME_PRIORITY = ['fire', 'calm', 'growth', 'default'];

// ==================== CALCUL THÈME ====================

/**
 * Calcule le surplus streak basé sur les dailyMeals
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals avec dailyTotals
 * @param {Object} activeProgram - Programme actif (optionnel)
 * @returns {number} Nombre de jours consécutifs avec surplus contrôlé
 */
function calculateSurplusStreak(dailyMeals, activeProgram) {
  if (!Array.isArray(dailyMeals) || dailyMeals.length === 0 || !activeProgram) {
    return 0;
  }

  const targetCalories = activeProgram.targetCalories || 2000;
  const surplusThreshold = targetCalories * 1.1; // 10% de surplus = acceptable
  const maxSurplus = targetCalories * 1.3; // 30% de surplus = maximum contrôlé

  // Trier par date décroissante (plus récent en premier)
  const sortedDailyMeals = [...dailyMeals].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0);
    const dateB = new Date(b.date || b.timestamp || 0);
    return dateB - dateA;
  });

  let streak = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Vérifier jours consécutifs depuis aujourd'hui
  for (let i = 0; i < sortedDailyMeals.length; i++) {
    const dailyMeal = sortedDailyMeals[i];
    const date = new Date(dailyMeal.date || dailyMeal.timestamp);
    date.setHours(23, 59, 59, 999);

    // Vérifier que c'est un jour consécutif (depuis aujourd'hui)
    const expectedDaysAgo = streak;
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    if (daysDiff !== expectedDaysAgo) {
      // Trou dans la série, arrêter
      break;
    }

    const calories = dailyMeal.dailyTotals?.calories || 0;
    
    // Surplus contrôlé : entre 10% et 30% de surplus
    if (calories >= surplusThreshold && calories <= maxSurplus) {
      streak++;
    } else {
      // Surplus non contrôlé, arrêter
      break;
    }
  }

  return streak;
}

/**
 * Prépare l'état utilisateur pour calcul du thème
 * 
 * @param {Object} data - Données utilisateur
 * @param {Object} data.streaks - Données streaks (depuis gamification)
 * @param {Object} data.healthScore - Score santé global
 * @param {Array} data.dailyMeals - DailyMeals (pour calcul surplus)
 * @param {Object} data.activeProgram - Programme actif (pour calcul surplus)
 * @returns {Object} État utilisateur formaté
 */
function prepareUserState(data) {
  const {
    streaks = {},
    healthScore = null,
    dailyMeals = [],
    activeProgram = null
  } = data;

  // Calculer surplus streak si programme actif
  const surplusStreak = calculateSurplusStreak(dailyMeals, activeProgram);

  return {
    streaks: {
      overall: {
        current: streaks.overall?.current || streaks.overall?.actual || 0,
        actual: streaks.overall?.actual || 0
      },
      nutrition: {
        current: streaks.nutrition?.current || streaks.nutrition?.actual || 0
      },
      workout: {
        current: streaks.workout?.current || streaks.workout?.actual || 0
      }
    },
    healthScore: healthScore || { global: 50 },
    nutrition: {
      surplusStreak
    }
  };
}

/**
 * Calcule le thème dynamique basé sur l'état utilisateur
 * 
 * @param {Object} userState - État utilisateur formaté
 * @returns {Object} Thème calculé avec propriétés :
 *   - name: string (nom du thème)
 *   - label: string (label affichable)
 *   - description: string (description du thème)
 *   - colors: Object (primary, secondary, accent, gradient)
 *   - reason: string (raison du choix du thème)
 */
export function getDynamicTheme(userState) {
  if (!userState) {
    log.warn('[getDynamicTheme] État utilisateur vide, utilisation thème par défaut');
    return {
      ...THEME_DEFINITIONS.default,
      reason: 'Pas de données utilisateur'
    };
  }

  try {
    // Essayer chaque thème par ordre de priorité
    for (const themeKey of THEME_PRIORITY) {
      const theme = THEME_DEFINITIONS[themeKey];
      
      if (!theme) {
        log.warn(`[getDynamicTheme] Thème ${themeKey} non défini`);
        continue;
      }

      try {
        if (theme.condition(userState)) {
          // Log supprimé pour éviter spam

          return {
            ...theme,
            reason: theme.description
          };
        }
      } catch (error) {
        log.warn(`[getDynamicTheme] Erreur condition thème ${themeKey}:`, error);
        continue;
      }
    }

    // Fallback: thème par défaut
    // Log supprimé pour éviter spam
    return {
      ...THEME_DEFINITIONS.default,
      reason: 'Aucune condition spécifique remplie'
    };
  } catch (error) {
    log.error('[getDynamicTheme] Erreur calcul thème:', error);
    return {
      ...THEME_DEFINITIONS.default,
      reason: 'Erreur calcul thème'
    };
  }
}

// ==================== APPLICATION THÈME ====================

/**
 * Applique un thème dynamique via CSS variables et classes
 * 
 * @param {Object} theme - Thème à appliquer (retourné par getDynamicTheme)
 * @param {Object} options - Options d'application
 * @param {boolean} options.animate - Activer animation transition (défaut: true)
 * @param {string} options.targetSelector - Sélecteur cible (défaut: ':root')
 */
export function applyDynamicTheme(theme, options = {}) {
  const {
    animate = true,
    targetSelector = ':root'
  } = options;

  if (!theme || !theme.colors) {
    log.warn('[applyDynamicTheme] Thème invalide, application ignorée');
    return;
  }

  try {
    const root = document.documentElement;

    // Appliquer classes CSS pour thème
    // Retirer toutes les classes de thème existantes
    THEME_PRIORITY.forEach(themeKey => {
      root.classList.remove(THEME_DEFINITIONS[themeKey].name);
    });

    // Ajouter classe du nouveau thème
    root.classList.add(theme.name);

    // Appliquer CSS variables
    if (animate) {
      root.style.transition = 'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease';
    }

    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-gradient', theme.colors.gradient);

    // Appliquer également aux variables CSS standard (si utilisées)
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);

    // Log supprimé pour éviter spam
  } catch (error) {
    log.error('[applyDynamicTheme] Erreur application thème:', error);
  }
}

/**
 * Réinitialise le thème au thème par défaut
 */
export function resetTheme() {
  const defaultTheme = THEME_DEFINITIONS.default;
  applyDynamicTheme(defaultTheme, { animate: false });
  // Log supprimé pour éviter spam
}

// ==================== CALCUL COMPLET ====================

/**
 * Calcule et applique le thème dynamique complet
 * 
 * @param {Object} data - Données utilisateur brutes
 * @param {Object} data.streaks - Données streaks (depuis gamification)
 * @param {Object} data.healthScore - Score santé global
 * @param {Array} data.dailyMeals - DailyMeals (pour calcul surplus)
 * @param {Object} data.activeProgram - Programme actif (pour calcul surplus)
 * @param {Object} options - Options
 * @param {boolean} options.apply - Appliquer le thème automatiquement (défaut: true)
 * @param {boolean} options.animate - Activer animation transition (défaut: true)
 * @returns {Object} Thème calculé
 */
export function calculateAndApplyTheme(data, options = {}) {
  const {
    apply = true,
    animate = true
  } = options;

  try {
    // Préparer état utilisateur
    const userState = prepareUserState(data);

    // Calculer thème
    const theme = getDynamicTheme(userState);

    // Appliquer si demandé
    if (apply) {
      applyDynamicTheme(theme, { animate });
    }

    return theme;
  } catch (error) {
    log.error('[calculateAndApplyTheme] Erreur calcul/application thème:', error);
    const defaultTheme = THEME_DEFINITIONS.default;
    if (apply) {
      applyDynamicTheme(defaultTheme, { animate: false });
    }
    return defaultTheme;
  }
}

// ==================== EXPORTS ====================

export default {
  getDynamicTheme,
  applyDynamicTheme,
  resetTheme,
  calculateAndApplyTheme,
  THEME_DEFINITIONS,
  THEME_PRIORITY
};

