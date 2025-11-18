/**
 * nutrition.constants.js
 * 
 * ✅ OPTIMISATION : Constantes centralisées pour l'onglet Nutrition
 * 
 * Centralise tous les noms de stores, constantes et valeurs fixes
 * pour faciliter la maintenance et éviter la duplication.
 * 
 * Impact attendu : Maintenabilité améliorée, cohérence garantie
 * 
 * @module constants/nutrition.constants
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 3.1
 */

// ==================== STORES INDEXEDDB ====================

/**
 * Noms des stores IndexedDB pour Nutrition
 * 
 * ✅ OPTIMISATION : Centralisation pour éviter erreurs de typo
 */
export const NUTRITION_STORES = {
  DAILY_MEALS: 'nutrition_dailyMeals',
  MEALS: 'nutrition_meals',
  PROGRAMS: 'nutrition_programs',
  FAVORITE_FOODS: 'nutrition_favoriteFoods',
  MEAL_PHOTOS: 'nutrition_mealPhotos',
  HYDRATION_LOG: 'nutrition_hydrationLog',
  API_CACHE: 'nutrition_apiCache',
  GAMIFICATION: 'nutrition_gamification',
  SHARE_LINKS: 'nutrition_shareLinks',
  PROGRESS_PHOTOS: 'nutrition_progressPhotos',
  ML_MODELS: 'nutrition_mlModels',
};

/**
 * Liste de tous les stores nutrition (pour migrations, validations, etc.)
 */
export const ALL_NUTRITION_STORES = Object.values(NUTRITION_STORES);

// ==================== VERSIONS BASE DE DONNÉES ====================

/**
 * Version de la base de données Nutrition
 */
export const DB_VERSION_NUTRITION = 10;

// ==================== OBJECTIFS PROGRAMMES ====================

/**
 * Objectifs disponibles pour les programmes nutrition
 */
export const PROGRAM_GOALS = {
  BULK: 'bulk',
  CUT: 'cut',
  MAINTAIN: 'maintain',
  RECOMP: 'recomp',
};

/**
 * Labels des objectifs (pour affichage)
 */
export const PROGRAM_GOAL_LABELS = {
  [PROGRAM_GOALS.BULK]: 'Prise de masse',
  [PROGRAM_GOALS.CUT]: 'Sèche',
  [PROGRAM_GOALS.MAINTAIN]: 'Maintien',
  [PROGRAM_GOALS.RECOMP]: 'Recomposition',
};

/**
 * Icônes des objectifs (pour affichage)
 */
export const PROGRAM_GOAL_ICONS = {
  [PROGRAM_GOALS.BULK]: '📈',
  [PROGRAM_GOALS.CUT]: '📉',
  [PROGRAM_GOALS.MAINTAIN]: '⚖️',
  [PROGRAM_GOALS.RECOMP]: '🔄',
};

// ==================== TYPES DE REPAS ====================

/**
 * Types de repas disponibles
 */
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
  PRE_WORKOUT: 'pre-workout',
  POST_WORKOUT: 'post-workout',
};

/**
 * Labels des types de repas (pour affichage)
 */
export const MEAL_TYPE_LABELS = {
  [MEAL_TYPES.BREAKFAST]: 'Petit-déjeuner',
  [MEAL_TYPES.LUNCH]: 'Déjeuner',
  [MEAL_TYPES.DINNER]: 'Dîner',
  [MEAL_TYPES.SNACK]: 'Collation',
  [MEAL_TYPES.PRE_WORKOUT]: 'Avant entraînement',
  [MEAL_TYPES.POST_WORKOUT]: 'Après entraînement',
};

// ==================== UNITÉS ====================

/**
 * Unités disponibles pour les quantités
 */
export const UNITS = {
  GRAMS: 'g',
  KILOGRAMS: 'kg',
  MILLILITERS: 'ml',
  LITERS: 'l',
  PIECES: 'pieces',
  CUPS: 'cups',
  TABLESPOONS: 'tbsp',
  TEASPOONS: 'tsp',
};

// ==================== SOURCES DONNÉES ====================

/**
 * Sources de données pour les aliments
 */
export const FOOD_SOURCES = {
  MANUAL: 'manual',
  OPEN_FOOD_FACTS: 'openFoodFacts',
  USDA: 'usda',
  SCAN: 'scan',
  PHOTO: 'photo',
  VOICE: 'voice',
};

// ==================== CODES ERREUR ====================

/**
 * Codes d'erreur spécifiques Nutrition (référence vers nutritionErrors.js)
 * 
 * Note: Les codes réels sont définis dans nutritionErrors.js
 * Ceci est une référence pour documentation
 */
export const NUTRITION_ERROR_CODES = {
  VALIDATION_INVALID_DATA: 'VALIDATION_INVALID_DATA',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// ==================== XP REWARDS ====================

/**
 * Récompenses XP pour actions nutrition
 * 
 * Note: Défini aussi dans nutritionGamification.js, centralisé ici pour référence
 */
export const XP_REWARDS = {
  MEAL_LOGGED: 5,
  DAY_COMPLETE: 20,
  PROGRAM_COMPLIANT: 15,
  BADGE_UNLOCKED: 50,
  STREAK_MILESTONE: 100,
};

// ==================== STREAK FORGIVENESS ====================

/**
 * Configuration streaks avec forgiveness (anti-burnout)
 */
export const STREAK_CONFIG = {
  FORGIVENESS_DAYS: 2,        // Jours manqués tolérés
  MAX_DISPLAY_DAYS: 30,       // Limite affichage (anti-anxiété)
};

// ==================== EXPORT VERSION ====================

/**
 * Version du format d'export JSON
 * 
 * ✅ OPTIMISATION : Versioning pour compatibilité future
 */
export const EXPORT_VERSION = '1.0.0';

// ==================== HELPERS ====================

/**
 * Vérifie si un store existe
 * 
 * @param {string} storeName - Nom du store
 * @returns {boolean} True si store existe
 */
export function isValidStore(storeName) {
  return ALL_NUTRITION_STORES.includes(storeName);
}

/**
 * Vérifie si un objectif est valide
 * 
 * @param {string} goal - Objectif à vérifier
 * @returns {boolean} True si objectif valide
 */
export function isValidGoal(goal) {
  return Object.values(PROGRAM_GOALS).includes(goal);
}

/**
 * Vérifie si un type de repas est valide
 * 
 * @param {string} mealType - Type de repas à vérifier
 * @returns {boolean} True si type valide
 */
export function isValidMealType(mealType) {
  return Object.values(MEAL_TYPES).includes(mealType);
}

