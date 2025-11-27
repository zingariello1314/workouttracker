/**
 * nutritionHelpers.js
 * 
 * Helpers centralisés pour le module Nutrition
 * 
 * Fonctions utilitaires communes utilisées dans tout le module :
 * - Génération IDs uniques
 * - Formatage dates
 * - Validation et normalisation
 * - Calculs utilitaires
 * 
 * ✅ PHASE 14.1 : Centralisation helpers pour éviter duplication
 * 
 * @module services/nutrition/helpers/nutritionHelpers
 */

import { DateHelper } from '../../../utils/dateHelper';
import logger from '../../../utils/logger';
// ✅ PHASE 15.7 : Import helpers validation pour divisions sécurisées
import { safeDivision } from '../nutritionCalculationHelpers';

const log = logger.module('nutritionHelpers');

// ==================== GÉNÉRATION IDs ====================

/**
 * Génère un ID unique pour un meal
 * 
 * Format : "meal_<timestamp>"
 * 
 * @returns {string} ID unique pour meal
 * 
 * @example
 * generateMealId() // → "meal_1705324800000"
 */
export const generateMealId = () => {
  return `meal_${Date.now()}`;
};

/**
 * Génère un ID unique pour un program
 * 
 * Format : "prog_<timestamp>"
 * 
 * @returns {string} ID unique pour program
 * 
 * @example
 * generateProgramId() // → "prog_1705324800000"
 */
export const generateProgramId = () => {
  return `prog_${Date.now()}`;
};

/**
 * Génère un ID unique pour un favoriteFood
 * 
 * Format : "food_fav_<timestamp>"
 * 
 * @returns {string} ID unique pour favoriteFood
 * 
 * @example
 * generateFavoriteFoodId() // → "food_fav_1705324800000"
 */
export const generateFavoriteFoodId = () => {
  return `food_fav_${Date.now()}`;
};

/**
 * Génère un ID unique pour un dailyMeal
 * 
 * Format : "daily_<timestamp>"
 * 
 * @returns {string} ID unique pour dailyMeal
 * 
 * @example
 * generateDailyMealId() // → "daily_1705324800000"
 */
export const generateDailyMealId = () => {
  return `daily_${Date.now()}`;
};

/**
 * Génère un ID unique pour un hydrationLog
 * 
 * Format : "hydration_<timestamp>"
 * 
 * @returns {string} ID unique pour hydrationLog
 * 
 * @example
 * generateHydrationLogId() // → "hydration_1705324800000"
 */
export const generateHydrationLogId = () => {
  return `hydration_${Date.now()}`;
};

// ==================== FORMATAGE DATES ====================

/**
 * Formate une date au format "YYYY-MM-DD" (timezone locale garantie)
 * 
 * ✅ OPTIMISATION : Utilise DateHelper pour garantir cohérence timezone
 * Remplace l'implémentation précédente qui utilisait `new Date(date)` (risque timezone)
 * 
 * @param {Date|string|number} date - Date à formater
 * @returns {string} Date formatée "YYYY-MM-DD" ou null si invalide
 * 
 * @example
 * formatDate(new Date(2025, 0, 15)) // → "2025-01-15"
 * formatDate("2025-01-15") // → "2025-01-15"
 * formatDate("2025-01-15T12:30:00") // → "2025-01-15"
 */
export const formatDate = (date) => {
  return DateHelper.toYYYYMMDD(date);
};

/**
 * Calcule le nombre de jours entre deux dates (timezone locale garantie)
 * 
 * ✅ OPTIMISATION : Utilise DateHelper pour garantir cohérence timezone
 * 
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {number} Nombre de jours (peut être négatif) ou null si invalide
 * 
 * @example
 * daysBetween("2025-01-01", "2025-01-15") // → 14
 * daysBetween("2025-01-15", "2025-01-01") // → -14
 */
export const daysBetween = (startDate, endDate) => {
  return DateHelper.daysBetween(startDate, endDate);
};

/**
 * Obtient la date du jour en format "YYYY-MM-DD" (timezone locale)
 * 
 * @returns {string} Date au format "YYYY-MM-DD"
 * 
 * @example
 * getTodayLocal() // → "2025-01-15"
 */
export const getTodayLocal = () => {
  return DateHelper.getTodayLocal();
};

/**
 * Obtient une date N jours avant aujourd'hui
 * 
 * @param {number} daysAgo - Nombre de jours avant aujourd'hui
 * @returns {string} Date au format "YYYY-MM-DD"
 * 
 * @example
 * getDaysAgoLocal(7) // → "2025-01-08"
 */
export const getDaysAgoLocal = (daysAgo) => {
  return DateHelper.getDaysAgoLocal(daysAgo);
};

// ==================== VALIDATION ====================

/**
 * Valide qu'une date est au format "YYYY-MM-DD"
 * 
 * @param {string} dateStr - Date à valider
 * @returns {boolean} true si format valide
 * 
 * @example
 * isValidDateString("2025-01-15") // → true
 * isValidDateString("2025-13-45") // → false
 */
export const isValidDateString = (dateStr) => {
  return DateHelper.isValid(dateStr);
};

/**
 * Valide qu'une plage de dates est valide (startDate <= endDate)
 * 
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {boolean} true si plage valide
 * 
 * @example
 * isValidDateRange("2025-01-01", "2025-01-15") // → true
 * isValidDateRange("2025-01-15", "2025-01-01") // → false
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return false;
  }
  return startDate <= endDate;
};

// ==================== NORMALISATION ====================

/**
 * Normalise un nombre (remplace NaN/Infinity par valeur par défaut)
 * 
 * @param {number} value - Valeur à normaliser
 * @param {number} defaultValue - Valeur par défaut si invalide
 * @returns {number} Valeur normalisée
 * 
 * @example
 * normalizeNumber(NaN, 0) // → 0
 * normalizeNumber(Infinity, 0) // → 0
 * normalizeNumber(42, 0) // → 42
 */
export const normalizeNumber = (value, defaultValue = 0) => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return value;
};

/**
 * Normalise un pourcentage (0-100)
 * 
 * @param {number} value - Pourcentage à normaliser
 * @param {number} defaultValue - Valeur par défaut si invalide
 * @returns {number} Pourcentage normalisé (0-100)
 * 
 * @example
 * normalizePercentage(150, 0) // → 100
 * normalizePercentage(-10, 0) // → 0
 * normalizePercentage(75, 0) // → 75
 */
export const normalizePercentage = (value, defaultValue = 0) => {
  const normalized = normalizeNumber(value, defaultValue);
  return Math.max(0, Math.min(100, normalized));
};

// ==================== CALCULS UTILITAIRES ====================

/**
 * Calcule la moyenne d'un tableau de nombres
 * 
 * @param {Array<number>} values - Tableau de nombres
 * @returns {number} Moyenne ou 0 si tableau vide
 * 
 * @example
 * calculateAverage([10, 20, 30]) // → 20
 * calculateAverage([]) // → 0
 */
export const calculateAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, val) => acc + normalizeNumber(val, 0), 0);
  // ✅ PHASE 15.7 : Division sécurisée (values.length ne peut pas être 0 grâce au check ci-dessus)
  // Mais on utilise safeDivision pour cohérence et protection future
  return safeDivision(sum, values.length, {
    operation: 'calculateAverage',
    defaultValue: 0
  });
};

/**
 * Calcule la somme d'un tableau de nombres
 * 
 * @param {Array<number>} values - Tableau de nombres
 * @returns {number} Somme ou 0 si tableau vide
 * 
 * @example
 * calculateSum([10, 20, 30]) // → 60
 * calculateSum([]) // → 0
 */
export const calculateSum = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  return values.reduce((acc, val) => acc + normalizeNumber(val, 0), 0);
};

/**
 * Calcule le pourcentage d'une valeur par rapport à une cible
 * 
 * @param {number} value - Valeur actuelle
 * @param {number} target - Valeur cible
 * @returns {number} Pourcentage (0-100+) ou 0 si target invalide
 * 
 * @example
 * calculatePercentage(75, 100) // → 75
 * calculatePercentage(150, 100) // → 150
 * calculatePercentage(50, 0) // → 0
 */
export const calculatePercentage = (value, target) => {
  const normalizedValue = normalizeNumber(value, 0);
  const normalizedTarget = normalizeNumber(target, 0);
  
  // ✅ PHASE 15.7 : Division sécurisée pour pourcentage
  return safeDivision(
    normalizedValue * 100,
    normalizedTarget,
    {
      operation: 'calculatePercentage',
      defaultValue: 0
    }
  );
};

// ==================== UTILITAIRES ARRAYS ====================

/**
 * Filtre un tableau en gardant seulement les valeurs valides (non null/undefined/NaN)
 * 
 * @param {Array} array - Tableau à filtrer
 * @returns {Array} Tableau filtré
 * 
 * @example
 * filterValidValues([1, null, 2, undefined, 3, NaN]) // → [1, 2, 3]
 */
export const filterValidValues = (array) => {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.filter(item => item != null && !isNaN(item) && isFinite(item));
};

/**
 * Groupe un tableau d'objets par une clé
 * 
 * @param {Array<Object>} array - Tableau d'objets
 * @param {string|Function} keyGetter - Clé ou fonction pour obtenir la clé
 * @returns {Map} Map groupée par clé
 * 
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], 'type')
 * // → Map { 'a' => [{type: 'a', val: 1}], 'b' => [{type: 'b', val: 2}] }
 */
export const groupBy = (array, keyGetter) => {
  if (!Array.isArray(array)) {
    return new Map();
  }
  
  const map = new Map();
  const getKey = typeof keyGetter === 'function' ? keyGetter : (item) => item[keyGetter];
  
  array.forEach(item => {
    const key = getKey(item);
    if (key != null) {
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    }
  });
  
  return map;
};

// ==================== EXPORT PAR DÉFAUT ====================

export default {
  // IDs
  generateMealId,
  generateProgramId,
  generateFavoriteFoodId,
  generateDailyMealId,
  generateHydrationLogId,
  
  // Dates
  formatDate,
  daysBetween,
  getTodayLocal,
  getDaysAgoLocal,
  
  // Validation
  isValidDateString,
  isValidDateRange,
  
  // Normalisation
  normalizeNumber,
  normalizePercentage,
  
  // Calculs
  calculateAverage,
  calculateSum,
  calculatePercentage,
  
  // Arrays
  filterValidValues,
  groupBy
};




