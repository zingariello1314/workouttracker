/**
 * badges/helpers.js
 * 
 * Helper functions communes pour les badges nutritionnels
 * Toutes les fonctions utilitaires réutilisables dans les conditions de badges
 * 
 * @module services/nutrition/badges/helpers
 */

import { DateHelper } from '../../../utils/dateHelper';

/**
 * Vérifie qu'un jour a des données nutritionnelles réelles (au moins un repas avec des aliments)
 * Nécessaire pour éviter que les badges "sans X" soient débloqués quand il n'y a pas de données
 * 
 * @param {Object} day - Objet jour avec meals
 * @returns {boolean} true si le jour a des données nutritionnelles réelles
 */
export const hasRealNutritionData = (day) => {
  if (!day || !day.meals || day.meals.length === 0) return false;
  
  // Vérifier qu'au moins un repas a des aliments (foods)
  return day.meals.some(meal => {
    const foods = meal.foods || [];
    // Vérifier qu'il y a des aliments ET qu'ils ont des valeurs nutritionnelles
    return foods.length > 0 && foods.some(food => {
      // Vérifier qu'au moins un aliment a des calories ou des macros
      return (food.calories || 0) > 0 || 
             (food.protein || 0) > 0 || 
             (food.carbs || 0) > 0 || 
             (food.fat || 0) > 0;
    });
  });
};

/**
 * Vérifie qu'un jour a des repas principaux (breakfast, lunch, dinner) avec données
 * Utilisé pour les badges qui nécessitent une journée complète
 * 
 * @param {Object} day - Objet jour avec meals
 * @returns {boolean} true si le jour a au moins un repas principal avec données
 */
export const hasMainMealsWithData = (day) => {
  if (!day || !day.meals || day.meals.length === 0) return false;
  
  const mainMealTypes = ['breakfast', 'lunch', 'dinner'];
  return day.meals.some(meal => {
    if (!mainMealTypes.includes(meal.type)) return false;
    const foods = meal.foods || [];
    return foods.length > 0 && foods.some(food => {
      return (food.calories || 0) > 0 || 
             (food.protein || 0) > 0 || 
             (food.carbs || 0) > 0 || 
             (food.fat || 0) > 0;
    });
  });
};

/**
 * Calcule le total de fibres depuis les meals (car n'existe pas dans dailyTotals)
 * ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, doit être calculé depuis meals.foods
 * 
 * @param {Object} day - Objet jour avec meals
 * @returns {number} Total de fibres en grammes
 */
export const calculateFiberFromMeals = (day) => {
  if (!day || !day.meals || day.meals.length === 0) return 0;
  
  return day.meals.reduce((sum, meal) => {
    const foods = meal.foods || [];
    return sum + foods.reduce((s, food) => s + (food.fiber || 0), 0);
  }, 0);
};

/**
 * Obtient une valeur cible avec fallback correct selon calculateDailyTotals
 * ✅ CORRECTION : Utiliser valeurs par défaut correctes (2500, 150, 300, 80, 3000)
 * 
 * @param {Object} day - Objet jour avec dailyTotals
 * @param {Object} userData - Données utilisateur avec activeProgram
 * @param {string} field - Champ cible ('targetCalories', 'targetProtein', 'targetCarbs', 'targetFat', 'targetWater')
 * @returns {number} Valeur cible avec fallback correct
 */
export const getTargetValue = (day, userData, field) => {
  // 1. Vérifier dailyTotals du jour
  if (day?.dailyTotals?.[field]) return day.dailyTotals[field];
  // 2. Vérifier programme actif
  if (userData?.activeProgram?.[field]) return userData.activeProgram[field];
  // 3. Valeurs par défaut selon calculateDailyTotals
  const defaults = {
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWater: 3000
  };
  return defaults[field] || 0;
};

/**
 * Re-export DateHelper pour usage dans les badges
 * Permet d'éviter d'importer DateHelper dans chaque fichier de badges
 */
export { DateHelper };

