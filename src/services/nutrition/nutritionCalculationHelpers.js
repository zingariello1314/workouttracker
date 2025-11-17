/**
 * nutritionCalculationHelpers.js
 * 
 * ✅ PHASE 10.5 : Helpers de validation et normalisation pour calculs nutrition
 * 
 * Ce module fournit des utilitaires pour :
 * - Validation et normalisation de nombres (NaN, Infinity, négatifs)
 * - Division sécurisée (protection division par zéro)
 * - Racine carrée sécurisée (protection valeurs négatives)
 * - Validation targets avec plages min/max
 * - Validation résultats finaux (finiteness, plages)
 * 
 * Objectifs :
 * - Éviter NaN/Infinity dans tous les calculs
 * - Protéger contre division par zéro
 * - Normaliser valeurs invalides vers valeurs par défaut sûres
 * - Fournir messages d'erreur descriptifs
 * 
 * @module services/nutrition/nutritionCalculationHelpers
 */

import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';
import logger from '../../utils/logger';

const log = logger.module('nutritionCalculationHelpers');

// ==================== VALIDATION NOMBRES ====================

/**
 * Valide et normalise un nombre pour utilisation dans calculs
 * 
 * ✅ PHASE 10.5 : Protection contre NaN, Infinity, valeurs négatives
 * 
 * @param {any} value - Valeur à valider
 * @param {Object} options - Options de validation
 * @param {number} options.defaultValue - Valeur par défaut si invalide (défaut: 0)
 * @param {number} options.min - Valeur minimale autorisée (défaut: 0)
 * @param {number} options.max - Valeur maximale autorisée (défaut: Infinity)
 * @param {boolean} options.allowZero - Autoriser zéro (défaut: true)
 * @param {string} options.fieldName - Nom du champ (pour messages d'erreur)
 * @returns {number} Nombre validé et normalisé
 * 
 * @example
 * validateAndNormalizeNumber(NaN, { defaultValue: 0 }) // → 0
 * validateAndNormalizeNumber(Infinity, { defaultValue: 0 }) // → 0
 * validateAndNormalizeNumber(-5, { min: 0 }) // → 0
 * validateAndNormalizeNumber(150, { min: 0, max: 200 }) // → 150
 */
export const validateAndNormalizeNumber = (value, options = {}) => {
  const {
    defaultValue = 0,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowZero = true,
    fieldName = 'value'
  } = options;
  
  // Convertir en nombre si string
  let numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Vérifier type
  if (typeof numValue !== 'number') {
    // ✅ PHASE 10.5 : Réduire verbosité - seulement logger si valeur non undefined/null (cas normal)
    if (value !== undefined && value !== null) {
      log.warn(`[validateAndNormalizeNumber] ${fieldName} n'est pas un nombre:`, value);
    }
    return defaultValue;
  }
  
  // Vérifier NaN
  if (isNaN(numValue)) {
    // ✅ PHASE 10.5 : Logger seulement si valeur fournie (pas undefined)
    if (value !== undefined && value !== null) {
      log.warn(`[validateAndNormalizeNumber] ${fieldName} est NaN, utilisation valeur par défaut:`, defaultValue);
    }
    return defaultValue;
  }
  
  // Vérifier Infinity
  if (!isFinite(numValue)) {
    // ✅ PHASE 10.5 : Logger seulement si valeur fournie (pas undefined)
    if (value !== undefined && value !== null) {
      log.warn(`[validateAndNormalizeNumber] ${fieldName} est Infinity, utilisation valeur par défaut:`, defaultValue);
    }
    return defaultValue;
  }
  
  // Vérifier zéro si non autorisé
  if (!allowZero && numValue === 0) {
    // ✅ PHASE 10.5 : Réduire verbosité - division par zéro est géré par safeDivision, pas besoin de warning ici
    // (Le warning sera dans safeDivision si nécessaire)
    return defaultValue;
  }
  
  // Appliquer min/max
  if (numValue < min) {
    // ✅ OPTIMISATION WARNING 3 : Logger seulement si écart significatif ET si ce n'est pas un cas normal attendu
    // Cas normal : numérateur dans safeDivision peut être très grand (balance * 100), c'est attendu
    const isNormalCase = fieldName === 'numerator' && Math.abs(min) > 1000000;
    if (!isNormalCase && Math.abs(numValue - min) > 1) {
      log.warn(`[validateAndNormalizeNumber] ${fieldName} (${numValue}) < min (${min}), clamp à ${min}`);
    }
    return min;
  }
  
  if (numValue > max) {
    // ✅ OPTIMISATION WARNING 3 : Logger seulement si écart significatif ET si ce n'est pas un cas normal attendu
    const isNormalCase = fieldName === 'numerator' && max > 1000000;
    if (!isNormalCase && Math.abs(numValue - max) > 1) {
      log.warn(`[validateAndNormalizeNumber] ${fieldName} (${numValue}) > max (${max}), clamp à ${max}`);
    }
    return max;
  }
  
  return numValue;
};

// ==================== DIVISION SÉCURISÉE ====================

/**
 * Division sécurisée avec protection division par zéro
 * 
 * ✅ PHASE 10.5 : Protection contre division par zéro et NaN/Infinity
 * 
 * @param {number} numerator - Numérateur
 * @param {number} denominator - Dénominateur
 * @param {Object} options - Options
 * @param {number} options.defaultValue - Valeur par défaut si division par zéro (défaut: 0)
 * @param {string} options.operation - Nom de l'opération (pour messages d'erreur)
 * @returns {number} Résultat de la division ou defaultValue
 * 
 * @example
 * safeDivision(10, 2) // → 5
 * safeDivision(10, 0) // → 0 (defaultValue)
 * safeDivision(10, 0, { defaultValue: 1 }) // → 1
 */
export const safeDivision = (numerator, denominator, options = {}) => {
  const {
    defaultValue = 0,
    operation = 'division',
    min = -Number.MAX_SAFE_INTEGER, // ✅ OPTIMISATION WARNING 3 : Permettre valeurs négatives par défaut
    max = Number.MAX_SAFE_INTEGER
  } = options;
  
  // Valider numérateur avec min/max personnalisés
  const validNumerator = validateAndNormalizeNumber(numerator, {
    fieldName: 'numerator',
    defaultValue: 0,
    min, // ✅ Utiliser min personnalisé (peut être négatif)
    max  // ✅ Utiliser max personnalisé
  });
  
  // Valider dénominateur
  const validDenominator = validateAndNormalizeNumber(denominator, {
    fieldName: 'denominator',
    defaultValue: 0,
    allowZero: false // Dénominateur ne peut pas être zéro
  });
  
  // Vérifier division par zéro
  if (validDenominator === 0) {
    // ✅ PHASE 10.5 : Réduire verbosité - division par zéro est normale quand totalMacroCalories = 0 (pas de repas)
    // Logger seulement si numérateur non nul (vraie division par zéro problématique)
    if (validNumerator !== 0) {
      log.warn(`[safeDivision] Division par zéro dans ${operation}, utilisation valeur par défaut:`, defaultValue);
    }
    return defaultValue;
  }
  
  // Effectuer division
  const result = validNumerator / validDenominator;
  
  // Vérifier résultat
  if (!isFinite(result)) {
    log.warn(`[safeDivision] Résultat ${operation} non fini (${result}), utilisation valeur par défaut:`, defaultValue);
    return defaultValue;
  }
  
  return result;
};

// ==================== RACINE CARRÉE SÉCURISÉE ====================

/**
 * Racine carrée sécurisée avec protection valeurs négatives
 * 
 * ✅ PHASE 10.5 : Protection contre sqrt de valeurs négatives (→ NaN)
 * 
 * @param {number} value - Valeur pour sqrt
 * @param {Object} options - Options
 * @param {number} options.defaultValue - Valeur par défaut si valeur négative (défaut: 0)
 * @param {string} options.operation - Nom de l'opération (pour messages d'erreur)
 * @returns {number} Résultat de sqrt ou defaultValue
 * 
 * @example
 * safeSqrt(16) // → 4
 * safeSqrt(-4) // → 0 (defaultValue)
 * safeSqrt(-4, { defaultValue: 1 }) // → 1
 */
export const safeSqrt = (value, options = {}) => {
  const {
    defaultValue = 0,
    operation = 'sqrt'
  } = options;
  
  // Valider valeur
  const validValue = validateAndNormalizeNumber(value, {
    fieldName: 'value',
    defaultValue: 0,
    min: 0 // Sqrt nécessite valeur >= 0
  });
  
  // Vérifier valeur négative (après normalisation, devrait être 0)
  if (validValue < 0) {
    log.warn(`[safeSqrt] Valeur négative dans ${operation} (${value}), utilisation valeur par défaut:`, defaultValue);
    return defaultValue;
  }
  
  // Effectuer sqrt
  const result = Math.sqrt(validValue);
  
  // Vérifier résultat
  if (!isFinite(result)) {
    log.warn(`[safeSqrt] Résultat ${operation} non fini (${result}), utilisation valeur par défaut:`, defaultValue);
    return defaultValue;
  }
  
  return result;
};

// ==================== VALIDATION TARGETS ====================

/**
 * Valide et normalise un target (calories, macros, etc.) avec plages min/max
 * 
 * ✅ PHASE 10.5 : Validation targets avec plages réalistes
 * 
 * @param {any} value - Valeur du target
 * @param {Object} options - Options
 * @param {number} options.defaultValue - Valeur par défaut si invalide
 * @param {number} options.min - Valeur minimale autorisée
 * @param {number} options.max - Valeur maximale autorisée
 * @param {string} options.fieldName - Nom du champ (pour messages d'erreur)
 * @returns {number} Target validé et normalisé
 * 
 * @example
 * getValidTarget(2500, { defaultValue: 2500, min: 500, max: 10000 }) // → 2500
 * getValidTarget(0, { defaultValue: 150, min: 10, max: 500 }) // → 150 (defaultValue)
 * getValidTarget(NaN, { defaultValue: 80, min: 10, max: 500 }) // → 80 (defaultValue)
 */
export const getValidTarget = (value, options = {}) => {
  const {
    defaultValue,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    fieldName = 'target'
  } = options;
  
  if (defaultValue === undefined) {
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_ERROR,
      'getValidTarget: defaultValue est requis',
      { fieldName, value }
    );
  }
  
  // ✅ OPTIMISATION WARNING 2 : Gérer undefined/null en amont (cas normal, pas d'erreur)
  if (value === undefined || value === null) {
    return defaultValue; // Pas de warning, cas normal (pas de programme actif)
  }
  
  // Valider et normaliser seulement si valeur fournie
  const normalized = validateAndNormalizeNumber(value, {
    defaultValue,
    min,
    max,
    allowZero: false, // Targets ne peuvent pas être zéro
    fieldName
  });
  
  // Si valeur invalide (mais fournie), logger warning
  if (normalized === defaultValue && value !== defaultValue) {
    log.warn(`[getValidTarget] ${fieldName} invalide (${value}), utilisation valeur par défaut:`, defaultValue);
  }
  
  return normalized;
};

// ==================== VALIDATION RÉSULTATS FINAUX ====================

/**
 * Valide un résultat de calcul (vérifie finiteness, plages)
 * 
 * ✅ PHASE 10.5 : Validation résultats finaux avant retour
 * 
 * @param {any} result - Résultat à valider
 * @param {Object} options - Options
 * @param {number} options.min - Valeur minimale autorisée (défaut: 0)
 * @param {number} options.max - Valeur maximale autorisée (défaut: Infinity)
 * @param {string} options.fieldName - Nom du champ (pour messages d'erreur)
 * @param {string} options.operation - Nom de l'opération (pour messages d'erreur)
 * @returns {number} Résultat validé
 * @throws {NutritionError} Si résultat invalide et non récupérable
 * 
 * @example
 * validateCalculationResult(150.5, { fieldName: 'calories' }) // → 150.5
 * validateCalculationResult(NaN, { fieldName: 'calories' }) // → throw NutritionError
 */
export const validateCalculationResult = (result, options = {}) => {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    fieldName = 'result',
    operation = 'calculation'
  } = options;
  
  // Vérifier type
  if (typeof result !== 'number') {
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_INVALID_RESULT,
      `Résultat ${operation} (${fieldName}) n'est pas un nombre`,
      { result, fieldName, operation, type: typeof result }
    );
  }
  
  // Vérifier NaN
  if (isNaN(result)) {
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_INVALID_RESULT,
      `Résultat ${operation} (${fieldName}) est NaN`,
      { result, fieldName, operation }
    );
  }
  
  // Vérifier Infinity
  if (!isFinite(result)) {
    throw new NutritionError(
      NutritionErrorCodes.CALCULATION_INVALID_RESULT,
      `Résultat ${operation} (${fieldName}) est Infinity`,
      { result, fieldName, operation }
    );
  }
  
  // Vérifier plages (warning seulement, pas d'erreur)
  if (result < min) {
    log.warn(`[validateCalculationResult] ${fieldName} (${result}) < min (${min}), clamp à ${min}`);
    return min;
  }
  
  if (result > max) {
    log.warn(`[validateCalculationResult] ${fieldName} (${result}) > max (${max}), clamp à ${max}`);
    return max;
  }
  
  return result;
};

// ==================== HELPERS SPÉCIFIQUES NUTRITION ====================

/**
 * Valide et normalise un target calories
 * 
 * @param {any} value - Valeur calories
 * @param {number} defaultValue - Valeur par défaut (défaut: 2500)
 * @returns {number} Calories validées
 */
export const getValidCaloriesTarget = (value, defaultValue = 2500) => {
  return getValidTarget(value, {
    defaultValue,
    min: 500,
    max: 10000,
    fieldName: 'targetCalories'
  });
};

/**
 * Valide et normalise un target protéines
 * 
 * @param {any} value - Valeur protéines (g)
 * @param {number} defaultValue - Valeur par défaut (défaut: 150)
 * @returns {number} Protéines validées
 */
export const getValidProteinTarget = (value, defaultValue = 150) => {
  return getValidTarget(value, {
    defaultValue,
    min: 10,
    max: 500,
    fieldName: 'targetProtein'
  });
};

/**
 * Valide et normalise un target glucides
 * 
 * @param {any} value - Valeur glucides (g)
 * @param {number} defaultValue - Valeur par défaut (défaut: 300)
 * @returns {number} Glucides validées
 */
export const getValidCarbsTarget = (value, defaultValue = 300) => {
  return getValidTarget(value, {
    defaultValue,
    min: 10,
    max: 1000,
    fieldName: 'targetCarbs'
  });
};

/**
 * Valide et normalise un target lipides
 * 
 * @param {any} value - Valeur lipides (g)
 * @param {number} defaultValue - Valeur par défaut (défaut: 80)
 * @returns {number} Lipides validées
 */
export const getValidFatTarget = (value, defaultValue = 80) => {
  return getValidTarget(value, {
    defaultValue,
    min: 10,
    max: 500,
    fieldName: 'targetFat'
  });
};

/**
 * Valide et normalise un target eau
 * 
 * @param {any} value - Valeur eau (ml)
 * @param {number} defaultValue - Valeur par défaut (défaut: 3000)
 * @returns {number} Eau validée
 */
export const getValidWaterTarget = (value, defaultValue = 3000) => {
  return getValidTarget(value, {
    defaultValue,
    min: 500,
    max: 20000,
    fieldName: 'targetWater'
  });
};

