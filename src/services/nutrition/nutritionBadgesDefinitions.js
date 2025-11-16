/**
 * nutritionBadgesDefinitions.js
 * 
 * Définitions complètes de tous les badges de gamification nutrition
 * Organisés par niveau de difficulté : FACILE, SIMPLE, MOYEN, DIFFICILE, HARDCORE, IMPOSSIBLE
 * 
 * @module services/nutrition/nutritionBadgesDefinitions
 */

import { DateHelper } from '../../utils/dateHelper';

// ==================== HELPER FUNCTIONS ====================

/**
 * Vérifie qu'un jour a des données nutritionnelles réelles (au moins un repas avec des aliments)
 * Nécessaire pour éviter que les badges "sans X" soient débloqués quand il n'y a pas de données
 * 
 * @param {Object} day - Objet jour avec meals
 * @returns {boolean} true si le jour a des données nutritionnelles réelles
 */
const hasRealNutritionData = (day) => {
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
const hasMainMealsWithData = (day) => {
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
const calculateFiberFromMeals = (day) => {
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
const getTargetValue = (day, userData, field) => {
  // 1. Vérifier dailyTotals du jour
  if (day?.dailyTotals?.[field]) return day.dailyTotals[field];
  // 2. Vérifier programme actif
  if (userData?.activeProgram?.[field]) return userData.activeProgram[field];
  // 3. Valeurs par défaut selon calculateDailyTotals (lignes 66-70)
  const defaults = {
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWater: 3000
  };
  return defaults[field] || 0;
};

// ==================== BADGES FACILES (20) ====================

export const EASY_BADGES = [
  {
    id: 'badge_first_meal',
    name: 'Premier Repas Loggé',
    description: 'Enregistrer votre premier repas',
    category: 'milestone',
    icon: '🎉',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      // ✅ CORRECTION : Vérifier qu'il y a vraiment un repas avec des aliments, pas juste une entrée vide
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      
      // Vérifier qu'au moins un jour a des données nutritionnelles réelles
      return userData.nutritionHistory.some(day => hasRealNutritionData(day));
    }
  },
  {
    id: 'badge_hydrated_today',
    name: 'Hydraté Aujourd\'hui',
    description: 'Atteindre objectif hydratation aujourd\'hui',
    category: 'nutrition',
    icon: '💧',
    rarity: 'common',
    points: 20,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      const water = today?.dailyTotals?.waterIntake || 0;
      // ✅ CORRECTION : Utiliser valeurs par défaut correctes (3000ml selon calculateDailyTotals, pas 2500)
      const targetWater = today?.dailyTotals?.targetWater || 
                          userData.activeProgram?.targetWater || 
                          3000; // Valeur par défaut réelle dans calculateDailyTotals
      return water >= targetWater * 0.9;
    }
  },
  {
    id: 'badge_protein_1day',
    name: 'Protéines Atteintes 1 Jour',
    description: 'Atteindre objectif protéines pour 1 jour',
    category: 'nutrition',
    icon: '💪',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = getTargetValue(today, userData, 'targetProtein');
      if (targetProtein === 0) return false;
      return protein >= targetProtein * 0.95;
    }
  },
  {
    id: 'badge_no_snack_today',
    name: 'Journée Sans Snack',
    description: 'Aucun snack enregistré aujourd\'hui',
    category: 'habits',
    icon: '🚫',
    rarity: 'common',
    points: 20,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
      if (!hasMainMealsWithData(today)) return false;
      
      const meals = today?.meals || [];
      // Vérifier qu'il n'y a pas de snack ET qu'il y a au moins un repas principal avec données
      return !meals.some(m => m.type === 'snack') && 
             meals.some(m => ['breakfast', 'lunch', 'dinner'].includes(m.type));
    }
  },
  {
    id: 'badge_breakfast_today',
    name: 'Petit-déjeuner Pris',
    description: 'Enregistrer un petit-déjeuner aujourd\'hui',
    category: 'habits',
    icon: '🌅',
    rarity: 'common',
    points: 20,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const meals = today?.meals || [];
      return meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
    }
  },
  {
    id: 'badge_new_vegetable',
    name: 'Nouveau Légume Goûté',
    description: 'Tester un nouveau légume',
    category: 'discovery',
    icon: '🥬',
    rarity: 'common',
    points: 30,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      // Vérifier sur les 7 derniers jours
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 1;
    }
  },
  {
    id: 'badge_water_1l',
    name: 'Eau +1L',
    description: 'Boire au moins 1L d\'eau aujourd\'hui',
    category: 'nutrition',
    icon: '💧',
    rarity: 'common',
    points: 15,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // Note: Pour l'eau, on vérifie juste la quantité, pas besoin de hasRealNutritionData
      // car l'eau peut être bue sans repas
      const water = today?.dailyTotals?.waterIntake || 0;
      return water >= 1000;
    }
  },
  {
    id: 'badge_balanced_meal',
    name: 'Repas Équilibré',
    description: 'Un repas avec macros équilibrés aujourd\'hui',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const meals = today?.meals || [];
      return meals.some(meal => {
        const foods = meal.foods || [];
        if (foods.length === 0) return false; // Vérifier qu'il y a des aliments
        const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
        if (total === 0) return false;
        const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
        const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
        const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
        const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
        return deviation < 30;
      });
    }
  },
  {
    id: 'badge_no_skipped_meal_today',
    name: 'Journée Sans Repas Sauté',
    description: 'Aucun repas sauté aujourd\'hui (petit-déj, déj, dîner)',
    category: 'habits',
    icon: '✅',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      
      const meals = today?.meals || [];
      const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
      const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
      const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
      return hasBreakfast && hasLunch && hasDinner;
    }
  },
  {
    id: 'badge_new_protein_source',
    name: 'Nouveau Aliment Protéiné',
    description: 'Tester une nouvelle source de protéines',
    category: 'discovery',
    icon: '🥩',
    rarity: 'common',
    points: 30,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueProteinFoods = new Set();
      // Vérifier sur les 7 derniers jours pour les aliments avec protéines
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name && (food.protein || 0) > 5) {
              uniqueProteinFoods.add(food.name.toLowerCase());
            }
          });
        });
      }
      return uniqueProteinFoods.size >= 1;
    }
  },
  {
    id: 'badge_fat_ratio_controlled',
    name: 'Ratio Lipides Maîtrisé (±20%)',
    description: 'Respecter ratio lipides objectif ±20% aujourd\'hui',
    category: 'nutrition',
    icon: '🥑',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      if (!hasRealNutritionData(today)) return false;
      const fat = today?.dailyTotals?.fat || 0;
      // ✅ CORRECTION : Utiliser valeurs par défaut correctes (80g selon calculateDailyTotals, pas 65g)
      const targetFat = today?.dailyTotals?.targetFat || 
                        userData.activeProgram?.targetFat || 
                        80; // Valeur par défaut réelle dans calculateDailyTotals
      if (targetFat === 0) return false; // Éviter division par zéro
      const ratio = fat / targetFat;
      return ratio >= 0.8 && ratio <= 1.2;
    }
  },
  {
    id: 'badge_fiber_starter',
    name: 'Fibre Starter (≥20g aujourd\'hui)',
    description: 'Atteindre 20g de fibres aujourd\'hui',
    category: 'nutrition',
    icon: '🌾',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
      if (!hasRealNutritionData(today)) return false;
      const fiber = calculateFiberFromMeals(today);
      return fiber >= 20;
    }
  },
  {
    id: 'badge_clean_breakfast',
    name: 'Focus Matinal : repas clean',
    description: 'Petit-déjeuner équilibré et clean aujourd\'hui',
    category: 'habits',
    icon: '🌅',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const breakfast = (today?.meals || []).find(m => m.type === 'breakfast');
      if (!breakfast || !breakfast.foods || breakfast.foods.length === 0) return false; // Vérifier qu'il y a des aliments
      // Vérifier que le petit-déj a des protéines et pas trop de sucre
      const foods = breakfast.foods;
      const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
      const sugar = foods.reduce((sum, f) => sum + (f.sugar || 0), 0);
      return protein >= 15 && sugar <= 20;
    }
  },
  {
    id: 'badge_light_dinner_today',
    name: 'Dîner Léger 1 Jour',
    description: 'Dîner léger et équilibré aujourd\'hui',
    category: 'habits',
    icon: '🌙',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const dinner = (today?.meals || []).find(m => m.type === 'dinner');
      if (!dinner || !dinner.foods || dinner.foods.length === 0) return false; // Vérifier qu'il y a des aliments
      const foods = dinner.foods;
      const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
      return calories <= 600; // Dîner léger = max 600 kcal
    }
  },
  {
    id: 'badge_first_recipe',
    name: 'Première Recette Testée',
    description: 'Tester votre première recette',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'common',
    points: 30,
    condition: (userData) => {
      // Note: Nécessite tracking des recettes testées
      // Pour l'instant, vérifier si plusieurs aliments dans un repas (recette probable)
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const allMeals = userData.nutritionHistory.flatMap(day => day.meals || []);
      return allMeals.some(meal => (meal.foods || []).length >= 3);
    }
  },
  {
    id: 'badge_no_added_sugar_today',
    name: 'Journée Sans Sucre Ajouté',
    description: 'Aucun sucre ajouté consommé aujourd\'hui',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'common',
    points: 30,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
      if (!hasRealNutritionData(today)) return false;
      
      const meals = today?.meals || [];
      const totalSugar = meals.reduce((sum, meal) => {
        return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
      }, 0);
      return totalSugar <= 5; // Tolérance 5g (fruits naturels)
    }
  },
  {
    id: 'badge_hydration_morning',
    name: 'Hydratation 3 Verres Avant Midi',
    description: 'Boire 3 verres d\'eau avant midi',
    category: 'habits',
    icon: '☀️💧',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      // Note: Nécessite tracking horaire de l'hydratation
      // Pour l'instant, vérifier hydratation du jour
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      const water = today?.dailyTotals?.waterIntake || 0;
      return water >= 750; // 3 verres = ~750ml
    }
  },
  {
    id: 'badge_meal_planned',
    name: 'Planification d\'un Repas',
    description: 'Planifier un repas à l\'avance',
    category: 'habits',
    icon: '📅',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      // Note: Nécessite tracking de la planification
      // Pour l'instant, vérifier si programme actif
      return userData.activeProgram !== null;
    }
  },
  {
    id: 'badge_portion_control',
    name: 'Contrôle Portions Basique',
    description: 'Respecter portions recommandées aujourd\'hui',
    category: 'habits',
    icon: '🍽️',
    rarity: 'common',
    points: 25,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      if (!hasRealNutritionData(today)) return false;
      const calories = today?.dailyTotals?.calories || 0;
      // ✅ CORRECTION : Utiliser valeurs par défaut correctes (2500 selon calculateDailyTotals, pas 2000)
      const targetCalories = getTargetValue(today, userData, 'targetCalories');
      if (targetCalories === 0) return false; // Éviter division par zéro
      const ratio = calories / targetCalories;
      return ratio >= 0.9 && ratio <= 1.1; // ±10%
    }
  },
  {
    id: 'badge_plant_protein',
    name: 'Protéines Végétales Découvertes',
    description: 'Tester une source de protéines végétales',
    category: 'discovery',
    icon: '🌱',
    rarity: 'common',
    points: 30,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      // Note: Pour protéines végétales, on vérifie les aliments avec protéines mais sans viande/poisson
      // Pour simplifier, on vérifie juste qu'il y a des aliments avec protéines végétales (légumineuses, etc.)
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = DateHelper.getTodayLocal();
      const uniquePlantProteins = new Set();
      // Vérifier sur les 7 derniers jours
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            // Protéines végétales : légumineuses, tofu, etc. (simplification : protéines > 5g mais pas de viande)
            if (food && food.name && (food.protein || 0) > 5) {
              const nameLower = food.name.toLowerCase();
              // Exclure viandes/poissons (simplification basique)
              if (!nameLower.includes('viande') && !nameLower.includes('poisson') && 
                  !nameLower.includes('poulet') && !nameLower.includes('boeuf') &&
                  !nameLower.includes('porc') && !nameLower.includes('saumon')) {
                uniquePlantProteins.add(nameLower);
              }
            }
          });
        });
      }
      return uniquePlantProteins.size >= 1;
    }
  }
];

// ==================== BADGES SIMPLES (20) ====================

export const SIMPLE_BADGES = [
  {
    id: 'badge_3days_logged',
    name: '3 Jours Consécutifs Loggés',
    description: 'Enregistrer des repas 3 jours consécutifs',
    category: 'consistency',
    icon: '🔥',
    rarity: 'common',
    points: 50,
    condition: (userData) => {
      return (userData.streaks?.nutrition?.current || 0) >= 3;
    }
  },
  {
    id: 'badge_hydration_2l_3days',
    name: 'Hydratation 2L / jour (3 jours)',
    description: 'Boire 2L d\'eau par jour pendant 3 jours',
    category: 'nutrition',
    icon: '💧💧',
    rarity: 'common',
    points: 60,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day) return false; // Jour manquant
        const water = day.dailyTotals?.waterIntake || 0;
        if (water < 2000) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_3breakfasts',
    name: '3 Petits-déjeuners Consécutifs',
    description: 'Prendre le petit-déjeuner 3 jours consécutifs',
    category: 'habits',
    icon: '🌅🌅🌅',
    rarity: 'common',
    points: 60,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        if (!meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_3light_dinners',
    name: '3 Dîners Légers',
    description: 'Dîner léger 3 jours consécutifs',
    category: 'habits',
    icon: '🌙🌙🌙',
    rarity: 'common',
    points: 60,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner || !dinner.foods || dinner.foods.length === 0) return false; // Vérifier qu'il y a des aliments
        const calories = dinner.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
        if (calories > 600) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_new_food_3days',
    name: 'Nouveau Aliment 3 Jours d\'affilée',
    description: 'Tester un nouvel aliment 3 jours consécutifs',
    category: 'discovery',
    icon: '🆕',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      // Vérifier qu'il y a au moins 3 aliments différents sur 3 jours consécutifs
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      // Vérifier sur les 3 derniers jours consécutifs
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Doit être consécutif
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 3;
    }
  },
  {
    id: 'badge_variety_10_7days',
    name: 'Variété 10 Ingrédients en 7 jours',
    description: 'Consommer 10 ingrédients différents en 7 jours',
    category: 'discovery',
    icon: '🍎',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      // Vérifier sur les 7 derniers jours
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 10;
    }
  },
  {
    id: 'badge_no_skipped_week',
    name: 'Semaine Sans Repas Sauté',
    description: 'Aucun repas sauté pendant 7 jours',
    category: 'habits',
    icon: '✅✅✅',
    rarity: 'rare',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
        const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
        const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (!(hasBreakfast && hasLunch && hasDinner)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_protein_ratio_3days',
    name: 'Ratio Protéines Atteint 3 Jours',
    description: 'Atteindre objectif protéines 3 jours consécutifs',
    category: 'nutrition',
    icon: '💪💪💪',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        if (targetProtein === 0) return false;
        if (protein < targetProtein * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_hydration_week_100',
    name: 'Semaine Hydratation 100%',
    description: 'Atteindre objectif hydratation 7 jours consécutifs',
    category: 'nutrition',
    icon: '💧💧💧',
    rarity: 'rare',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        if (targetWater === 0) return false;
        if (water < targetWater * 0.9) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_10balanced_meals',
    name: '10 Repas Équilibrés Cumulés',
    description: 'Enregistrer 10 repas équilibrés au total',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      });
      return balancedCount >= 10;
    }
  },
  {
    id: 'badge_no_fastfood_7days',
    name: '7 Jours Sans Fast-food',
    description: 'Aucun fast-food pendant 7 jours',
    category: 'habits',
    icon: '🚫🍔',
    rarity: 'rare',
    points: 100,
    condition: (userData) => {
      // Note: Nécessite tracking du type de repas (fast-food)
      // Pour l'instant, vérifier si pas de repas avec calories très élevées et peu de nutriments
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        if (meals.some(meal => {
          const foods = meal.foods || [];
          const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
          return calories > 800 && protein < 20; // Fast-food typique
        })) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_3recipes',
    name: '3 Recettes Testées',
    description: 'Tester 3 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳👨‍🍳👨‍🍳',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles avant de compter
        if (!hasRealNutritionData(day)) return;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
        });
      });
      return recipeCount >= 3;
    }
  },
  {
    id: 'badge_no_excess_sugar_week',
    name: 'Semaine Sans Excès de Sucre',
    description: 'Limiter sucre ajouté pendant 7 jours',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'rare',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        if (totalSugar > 30) return false; // Max 30g/jour
      }
      return true;
    }
  },
  {
    id: 'badge_energy_balance_3days',
    name: '3 Jours d\'Équilibre Énergétique',
    description: 'Respecter équilibre calorique 3 jours consécutifs',
    category: 'nutrition',
    icon: '⚡',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = Math.abs(calories - targetCalories);
        if (balance > 200) return false; // ±200 kcal
      }
      return true;
    }
  },
  {
    id: 'badge_dinner_before_8pm_3days',
    name: 'Dîner Avant 20h (3 fois)',
    description: 'Dîner avant 20h 3 fois',
    category: 'habits',
    icon: '🌙⏰',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      // Note: Nécessite tracking de l'heure des repas
      // Pour l'instant, vérifier présence de dîner
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let count = 0;
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Doit être consécutif
        const dinner = (day.meals || []).find(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (dinner) count++;
      }
      return count >= 3;
    }
  },
  {
    id: 'badge_5new_vegetables',
    name: '5 Nouveaux Légumes Testés',
    description: 'Tester 5 légumes différents',
    category: 'discovery',
    icon: '🥬🥬🥬',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      // Note: Pour les légumes, on simplifie en comptant tous les aliments (dans un vrai système, on filtrerait par catégorie)
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      // Vérifier sur les 7 derniers jours
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 5;
    }
  },
  {
    id: 'badge_perfect_day',
    name: 'Journée Parfaite (eau + protéines + calories OK)',
    description: 'Journée parfaite : hydratation, protéines et calories',
    category: 'mastery',
    icon: '⭐',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const water = today?.dailyTotals?.waterIntake || 0;
      // ✅ CORRECTION : Utiliser valeurs par défaut correctes
      const targetWater = getTargetValue(today, userData, 'targetWater');
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = getTargetValue(today, userData, 'targetProtein');
      const calories = today?.dailyTotals?.calories || 0;
      const targetCalories = getTargetValue(today, userData, 'targetCalories');
      if (targetWater === 0 || targetProtein === 0 || targetCalories === 0) return false;
      return water >= targetWater * 0.9 &&
             protein >= targetProtein * 0.95 &&
             Math.abs(calories - targetCalories) <= 200;
    }
  },
  {
    id: 'badge_7fruits_day',
    name: '7 Fruits/Jour (1 jour)',
    description: 'Consommer 7 portions de fruits en 1 jour',
    category: 'nutrition',
    icon: '🍎🍌🍊',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      // Note: Pour les fruits, on vérifie sur 1 jour (aujourd'hui) - 7 fruits différents
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      if (!hasRealNutritionData(today)) return false;
      const uniqueFoods = new Set();
      (today.meals || []).forEach(meal => {
        const foods = meal.foods || [];
        foods.forEach(food => {
          if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
        });
      });
      return uniqueFoods.size >= 7;
    }
  },
  {
    id: 'badge_clean_monday',
    name: 'Lundi Clean',
    description: 'Lundi parfait : tous objectifs atteints',
    category: 'habits',
    icon: '📅',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      // Note: Nécessite vérification du jour de la semaine
      // Pour l'instant, vérifier premier jour de la semaine dans l'historique
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      const compliance = today?.complianceScore || today?.dailyTotals?.complianceScore || 0;
      return compliance >= 90;
    }
  },
  {
    id: 'badge_macro_session',
    name: 'Objectif Macro Atteint (1 séance)',
    description: 'Atteindre tous les macros dans une journée',
    category: 'mastery',
    icon: '🎯',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = getTargetValue(today, userData, 'targetProtein');
      const carbs = today?.dailyTotals?.carbs || 0;
      const targetCarbs = getTargetValue(today, userData, 'targetCarbs');
      const fat = today?.dailyTotals?.fat || 0;
      const targetFat = getTargetValue(today, userData, 'targetFat');
      if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
      return protein >= targetProtein * 0.95 &&
             carbs >= targetCarbs * 0.95 &&
             fat >= targetFat * 0.95;
    }
  }
];

// ==================== BADGES MOYENS (20) ====================

export const MEDIUM_BADGES = [
  {
    id: 'badge_7day_streak',
    name: 'Série 7 Jours Consécutifs',
    description: 'Enregistrer des repas 7 jours consécutifs',
    category: 'consistency',
    icon: '🔥',
    rarity: 'common',
    points: 50,
    condition: (userData) => {
      return (userData.streaks?.nutrition?.current || 0) >= 7;
    }
  },
  {
    id: 'badge_7light_dinners',
    name: '7 Dîners Légers',
    description: 'Dîner léger 7 jours consécutifs',
    category: 'habits',
    icon: '🌙🌙🌙',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner || !dinner.foods || dinner.foods.length === 0) return false; // Vérifier qu'il y a des aliments
        const calories = dinner.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
        if (calories > 600) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_7breakfasts',
    name: '7 Petits-déjeuners Tenus',
    description: 'Prendre le petit-déjeuner 7 jours consécutifs',
    category: 'habits',
    icon: '🌅🌅🌅',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        if (!meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_15balanced_meals',
    name: '15 Repas Équilibrés',
    description: 'Enregistrer 15 repas équilibrés au total',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles avant de compter
        if (!hasRealNutritionData(day)) return;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length === 0) return; // Vérifier qu'il y a des aliments
          const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      });
      return balancedCount >= 15;
    }
  },
  {
    id: 'badge_hydration_master_7days',
    name: 'Maître Hydratation 7J',
    description: 'Hydratation parfaite 7 jours consécutifs',
    category: 'nutrition',
    icon: '💧💧💧',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day) return false;
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        if (targetWater === 0) return false;
        if (water < targetWater * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_variety_20_14days',
    name: 'Variété 20 Ingrédients / 14 jours',
    description: 'Consommer 20 ingrédients différents en 14 jours',
    category: 'discovery',
    icon: '🍎🍌',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 14) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      for (let i = 0; i < 14; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 20;
    }
  },
  {
    id: 'badge_no_snack_7days',
    name: 'Sans Snack 7 jours',
    description: 'Aucun snack pendant 7 jours consécutifs',
    category: 'habits',
    icon: '🚫',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasMainMealsWithData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasMainMealsWithData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        // Vérifier qu'il n'y a pas de snack ET qu'il y a au moins un repas principal avec données
        if (meals.some(m => m.type === 'snack') || 
            !meals.some(m => ['breakfast', 'lunch', 'dinner'].includes(m.type) && (m.foods || []).length > 0)) {
          return false;
        }
      }
      return true;
    }
  },
  {
    id: 'badge_deficit_controlled_7days',
    name: '7 Jours Déficit Maîtrisé',
    description: 'Maintenir déficit calorique contrôlé 7 jours',
    category: 'mastery',
    icon: '📉',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance < 0 && balance >= -500)) return false; // Déficit entre 0 et -500 kcal
      }
      return true;
    }
  },
  {
    id: 'badge_surplus_controlled_7days',
    name: 'Surplus Contrôlé 7 jours',
    description: 'Maintenir surplus contrôlé 7 jours',
    category: 'mastery',
    icon: '📈',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance > 0 && balance <= 500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_macro_precision_10pct_3days',
    name: 'Macro-precision ±10% (3 jours)',
    description: 'Respecter macros ±10% pendant 3 jours',
    category: 'mastery',
    icon: '🎯',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      const last3Days = userData.nutritionHistory.slice(-3);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = getTargetValue(day, userData, 'targetCarbs');
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = getTargetValue(day, userData, 'targetFat');
        
        if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
        if (!(Math.abs(protein - targetProtein) / targetProtein <= 0.1 &&
              Math.abs(carbs - targetCarbs) / targetCarbs <= 0.1 &&
              Math.abs(fat - targetFat) / targetFat <= 0.1)) {
          return false;
        }
      }
      return true;
    }
  },
  {
    id: 'badge_no_sugar_5days',
    name: '5 Jours sans sucre ajouté',
    description: 'Aucun sucre ajouté pendant 5 jours consécutifs',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 5) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 5; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        if (totalSugar > 5) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_30meals_logged',
    name: '30 Repas enregistrés',
    description: 'Enregistrer 30 repas au total',
    category: 'milestone',
    icon: '🍽️',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      const totalMeals = userData.nutritionHistory.reduce((sum, day) => {
        return sum + (day.meals || []).length;
      }, 0);
      return totalMeals >= 30;
    }
  },
  {
    id: 'badge_10protein_sources',
    name: '10 Sources de protéines',
    description: 'Tester 10 sources de protéines différentes',
    category: 'discovery',
    icon: '🥩',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory au lieu de uniqueFoodsLast7Days
      if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
      const today = DateHelper.getTodayLocal();
      const uniqueProteinFoods = new Set();
      // Vérifier sur les 7 derniers jours pour les aliments avec protéines
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name && (food.protein || 0) > 5) {
              uniqueProteinFoods.add(food.name.toLowerCase());
            }
          });
        });
      }
      return uniqueProteinFoods.size >= 10;
    }
  },
  {
    id: 'badge_post_workout_7days',
    name: '7 jours de Post-enchaînement optimisé',
    description: 'Optimiser nutrition post-entraînement 7 jours',
    category: 'health',
    icon: '💪',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      // Note: Nécessite intégration avec données d'entraînement
      // Pour l'instant, vérifier protéines élevées après entraînement
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper, hasRealNutritionData et getTargetValue
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        if (targetProtein === 0) return false;
        if (protein < targetProtein * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_3weekends_mastered',
    name: '3 Weekends Consécutifs maîtrisés',
    description: 'Respecter objectifs nutrition 3 weekends consécutifs',
    category: 'balance',
    icon: '🎉',
    rarity: 'epic',
    points: 300,
    condition: (userData) => {
      // Note: Nécessite vérification du jour de la semaine
      // Pour l'instant, vérifier compliance élevée sur les 21 derniers jours
      // ✅ CORRECTION : Utiliser DateHelper pour itérer (mais pas consécutivité stricte car weekends)
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 21) return false;
      const today = DateHelper.getTodayLocal();
      let weekendCount = 0;
      for (let i = 0; i < 21; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 80) weekendCount++;
      }
      return weekendCount >= 6; // 2 jours par weekend x 3
    }
  },
  {
    id: 'badge_fiber_25g_3days',
    name: 'Ratio Fibre 25g/J pendant 3 jours',
    description: 'Atteindre 25g de fibres par jour pendant 3 jours',
    category: 'nutrition',
    icon: '🌾',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et calculer fiber depuis meals.foods
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
        const fiber = calculateFiberFromMeals(day);
        if (fiber < 25) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_clean_digestion_7days',
    name: '7 jours de digestion clean',
    description: 'Aucun problème digestif pendant 7 jours',
    category: 'health',
    icon: '🌿',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      // Note: Nécessite tracking des problèmes digestifs
      // Pour l'instant, vérifier équilibre nutritionnel
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance < 75) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_sleep_nutrition_3days',
    name: 'Sommeil & Nutrition (repas avant 2h du coucher pendant 3 jours)',
    description: 'Dîner au moins 2h avant coucher 3 jours',
    category: 'health',
    icon: '🌙',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      // Note: Nécessite tracking de l'heure des repas et du coucher
      // Pour l'instant, vérifier présence de dîner
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let count = 0;
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Doit être consécutif
        const dinner = (day.meals || []).find(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (dinner) count++;
      }
      return count >= 3;
    }
  },
  {
    id: 'badge_4recipes',
    name: '4 Recettes créées/testées',
    description: 'Créer ou tester 4 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles avant de compter
        if (!hasRealNutritionData(day)) return;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
        });
      });
      return recipeCount >= 4;
    }
  },
  {
    id: 'badge_3perfect_days',
    name: '3 jours consécutifs parfaits (eau + macros + calories)',
    description: 'Journées parfaites 3 jours consécutifs',
    category: 'mastery',
    icon: '⭐',
    rarity: 'epic',
    points: 300,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      const last3Days = userData.nutritionHistory.slice(-3);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 3; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        
        if (targetWater === 0 || targetProtein === 0 || targetCalories === 0) return false;
        if (!(water >= targetWater * 0.9 &&
              protein >= targetProtein * 0.95 &&
              Math.abs(calories - targetCalories) <= 200)) {
          return false;
        }
      }
      return true;
    }
  }
];

// ==================== BADGES DIFFICILES (20) ====================

export const HARD_BADGES = [
  {
    id: 'badge_30day_streak',
    name: 'Série 30 Jours Consécutifs',
    description: 'Enregistrer des repas 30 jours consécutifs',
    category: 'consistency',
    icon: '🔥🔥',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      return (userData.streaks?.nutrition?.current || 0) >= 30;
    }
  },
  {
    id: 'badge_deficit_30days',
    name: 'Déficit Maîtrisé 30 jours',
    description: 'Maintenir déficit contrôlé 30 jours consécutifs',
    category: 'mastery',
    icon: '📉',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance < 0 && balance >= -500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_surplus_30days',
    name: 'Surplus Contrôlé 30 jours',
    description: 'Maintenir surplus contrôlé 30 jours consécutifs',
    category: 'mastery',
    icon: '📈',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance > 0 && balance <= 500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_100meals',
    name: '100 Repas Enregistrés',
    description: 'Enregistrer 100 repas au total',
    category: 'milestone',
    icon: '🍽️🍽️',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      const totalMeals = userData.nutritionHistory.reduce((sum, day) => {
        return sum + (day.meals || []).length;
      }, 0);
      return totalMeals >= 100;
    }
  },
  {
    id: 'badge_macro_precision_5pct_7days',
    name: 'Macro-precision ±5% (7 jours)',
    description: 'Respecter macros ±5% pendant 7 jours',
    category: 'mastery',
    icon: '🎯',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = getTargetValue(day, userData, 'targetCarbs');
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = getTargetValue(day, userData, 'targetFat');
        
        if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
        if (!(Math.abs(protein - targetProtein) / targetProtein <= 0.05 &&
              Math.abs(carbs - targetCarbs) / targetCarbs <= 0.05 &&
              Math.abs(fat - targetFat) / targetFat <= 0.05)) {
          return false;
        }
      }
      return true;
    }
  },
  {
    id: 'badge_no_skipped_30days',
    name: '30 jours Sans Repas Sauté',
    description: 'Aucun repas sauté pendant 30 jours',
    category: 'habits',
    icon: '✅✅✅',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
        const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
        const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
        return hasBreakfast && hasLunch && hasDinner;
      });
    }
  },
  {
    id: 'badge_no_sugar_10days',
    name: '10 jours Sans Sucre Ajouté',
    description: 'Aucun sucre ajouté pendant 10 jours consécutifs',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 10) return false;
      const last10Days = userData.nutritionHistory.slice(-10);
      return last10Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        return totalSugar <= 5;
      });
    }
  },
  {
    id: 'badge_30balanced_30days',
    name: '30 Repas Équilibrés en 30 jours',
    description: 'Enregistrer 30 repas équilibrés en 30 jours',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let balancedCount = 0;
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length === 0) return; // Vérifier qu'il y a des aliments
          const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      }
      return balancedCount >= 30;
    }
  },
  {
    id: 'badge_recovery_14days',
    name: 'Récupération Nutritionnelle 14 jours post-training clean',
    description: 'Optimiser nutrition post-entraînement 14 jours',
    category: 'health',
    icon: '💪',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 14) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 14; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        if (targetProtein === 0) return false;
        if (protein < targetProtein * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_10recipes',
    name: '10 Recettes Créées',
    description: 'Créer ou tester 10 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          if ((meal.foods || []).length >= 3) recipeCount++;
        });
      });
      return recipeCount >= 10;
    }
  },
  {
    id: 'badge_energy_balance_14days',
    name: 'Équilibre Énergétique 14 jours',
    description: 'Respecter équilibre calorique 14 jours consécutifs',
    category: 'nutrition',
    icon: '⚡',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 14) return false;
      const last14Days = userData.nutritionHistory.slice(-14);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 14; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = Math.abs(calories - targetCalories);
        if (balance > 200) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_digestive_pro',
    name: 'Digestif Pro (10 jours sans inconfort)',
    description: 'Aucun problème digestif pendant 10 jours',
    category: 'health',
    icon: '🌿',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 10) return false;
      const last10Days = userData.nutritionHistory.slice(-10);
      return last10Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 80;
      });
    }
  },
  {
    id: 'badge_30light_dinners',
    name: '30 jours de Dîner Léger',
    description: 'Dîner léger 30 jours consécutifs',
    category: 'habits',
    icon: '🌙',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner || !dinner.foods || dinner.foods.length === 0) return false; // Vérifier qu'il y a des aliments
        const calories = dinner.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
        if (calories > 600) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_10new_foods_30days',
    name: 'Nouveaux aliments (10 en 30 jours)',
    description: 'Tester 10 nouveaux aliments en 30 jours',
    category: 'discovery',
    icon: '🆕',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      const uniqueFoods = new Set();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      return uniqueFoods.size >= 10;
    }
  },
  {
    id: 'badge_hydration_2l_30days',
    name: '30 jours Hydratation à 2L+',
    description: 'Boire 2L d\'eau par jour pendant 30 jours',
    category: 'nutrition',
    icon: '💧💧💧',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const water = day.dailyTotals?.waterIntake || 0;
        if (water < 2000) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_program_100',
    name: 'Programme Nutrition 100%',
    description: 'Respecter programme nutrition 1 semaine complète (≥80% conformité)',
    category: 'nutrition',
    icon: '🎯',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 80;
      });
    }
  },
  {
    id: 'badge_20protein_sources',
    name: '20 Protéines différentes testées',
    description: 'Tester 20 sources de protéines différentes',
    category: 'discovery',
    icon: '🥩',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory avec hasRealNutritionData
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const uniqueFoods = new Set();
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name && (food.protein || 0) > 5) {
              uniqueFoods.add(food.name.toLowerCase());
            }
          });
        });
      });
      return uniqueFoods.size >= 20;
    }
  },
  {
    id: 'badge_traveler_nutrition',
    name: 'Voyageur Nutrition (vacances maîtrisées)',
    description: 'Respecter objectifs nutrition pendant vacances',
    category: 'balance',
    icon: '✈️',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      // Note: Nécessite tracking des périodes de voyage
      // Pour l'instant, vérifier compliance élevée sur période
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      const last7Days = userData.nutritionHistory.slice(-7);
      const avgCompliance = last7Days.reduce((sum, day) => {
        return sum + (day.complianceScore || day.dailyTotals?.complianceScore || 0);
      }, 0) / last7Days.length;
      return avgCompliance >= 75;
    }
  },
  {
    id: 'badge_restaurant_mastered',
    name: 'Restaurants maîtrisés (5 choix équilibrés)',
    description: 'Faire 5 choix équilibrés au restaurant',
    category: 'balance',
    icon: '🍽️',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      // Note: Nécessite tracking du type de repas (restaurant)
      // Pour l'instant, vérifier repas équilibrés
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      });
      return balancedCount >= 5;
    }
  },
  {
    id: 'badge_masterclass_week',
    name: 'Semaine "MasterClass" (eau + macros + calories + fibres)',
    description: 'Semaine parfaite : tous objectifs atteints',
    category: 'mastery',
    icon: '⭐',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
        const fiber = calculateFiberFromMeals(day);
        
        if (targetWater === 0 || targetProtein === 0 || targetCalories === 0) return false;
        if (!(water >= targetWater * 0.9 &&
              protein >= targetProtein * 0.95 &&
              Math.abs(calories - targetCalories) <= 200 &&
              fiber >= 25)) {
          return false;
        }
      }
      return true;
    }
  }
];

// ==================== BADGES HARDCORE (20) ====================

export const HARDCORE_BADGES = [
  {
    id: 'badge_100day_streak',
    name: 'Série 100 Jours Consécutifs',
    description: 'Enregistrer des repas 100 jours consécutifs',
    category: 'consistency',
    icon: '🔥🔥🔥',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      return (userData.streaks?.nutrition?.current || 0) >= 100;
    }
  },
  {
    id: 'badge_1000meals',
    name: '1000 Repas Enregistrés',
    description: 'Enregistrer 1000 repas au total',
    category: 'milestone',
    icon: '🍽️🍽️🍽️',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      const totalMeals = userData.nutritionHistory.reduce((sum, day) => {
        return sum + (day.meals || []).length;
      }, 0);
      return totalMeals >= 1000;
    }
  },
  {
    id: 'badge_macro_precision_5pct_21days',
    name: 'Macro-precision ±5% pendant 21 jours',
    description: 'Respecter macros ±5% pendant 21 jours',
    category: 'mastery',
    icon: '🎯',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 21) return false;
      const last21Days = userData.nutritionHistory.slice(-21);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 21; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = getTargetValue(day, userData, 'targetCarbs');
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = getTargetValue(day, userData, 'targetFat');
        
        if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
        if (!(Math.abs(protein - targetProtein) / targetProtein <= 0.05 &&
              Math.abs(carbs - targetCarbs) / targetCarbs <= 0.05 &&
              Math.abs(fat - targetFat) / targetFat <= 0.05)) {
          return false;
        }
      }
      return true;
    }
  },
  {
    id: 'badge_deficit_60days',
    name: 'Déficit Maîtrisé 60 jours',
    description: 'Maintenir déficit contrôlé 60 jours consécutifs',
    category: 'mastery',
    icon: '📉',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 60) return false;
      const last60Days = userData.nutritionHistory.slice(-60);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 60; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance < 0 && balance >= -500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_surplus_60days',
    name: 'Surplus Maîtrisé 60 jours',
    description: 'Maintenir surplus contrôlé 60 jours consécutifs',
    category: 'mastery',
    icon: '📈',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 60) return false;
      const last60Days = userData.nutritionHistory.slice(-60);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 60; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance > 0 && balance <= 500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_no_sugar_30days',
    name: '30 Jours Sans Sucre Ajouté',
    description: 'Aucun sucre ajouté pendant 30 jours consécutifs',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        if (totalSugar > 5) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_100balanced_meals',
    name: '100 Repas Équilibrés',
    description: 'Enregistrer 100 repas équilibrés au total',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      });
      return balancedCount >= 100;
    }
  },
  {
    id: 'badge_hydration_60days_100',
    name: '60 jours Hydratation 100%',
    description: 'Atteindre objectif hydratation 60 jours consécutifs',
    category: 'nutrition',
    icon: '💧💧💧',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 60) return false;
      const last60Days = userData.nutritionHistory.slice(-60);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 60; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day) return false;
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        if (targetWater === 0) return false;
        if (water < targetWater * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_no_fastfood_30days',
    name: '30 jours sans fast-food',
    description: 'Aucun fast-food pendant 30 jours',
    category: 'habits',
    icon: '🚫🍔',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        return !meals.some(meal => {
          const foods = meal.foods || [];
          const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
          return calories > 800 && protein < 20;
        });
      });
    }
  },
  {
    id: 'badge_no_cheat_30days',
    name: '30 jours sans cheat meal',
    description: 'Aucun cheat meal pendant 30 jours',
    category: 'habits',
    icon: '🚫',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (balance > 500) return false; // Pas de dépassement > 500 kcal
      }
      return true;
    }
  },
  {
    id: 'badge_flexibility_mastered',
    name: 'Flexibilité Maîtrisée (objectifs tenus + variabilité max)',
    description: 'Respecter objectifs avec variété maximale',
    category: 'mastery',
    icon: '🎯',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let totalCompliance = 0;
      let daysWithData = 0;
      const uniqueFoods = new Set();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue;
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        totalCompliance += compliance;
        daysWithData++;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      }
      if (daysWithData === 0) return false;
      const avgCompliance = totalCompliance / daysWithData;
      return avgCompliance >= 80 && uniqueFoods.size >= 50;
    }
  },
  {
    id: 'badge_20recipes',
    name: '20 Recettes Créées',
    description: 'Créer ou tester 20 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          if ((meal.foods || []).length >= 3) recipeCount++;
        });
      });
      return recipeCount >= 20;
    }
  },
  {
    id: 'badge_30days_meal_plans',
    name: '30 jours Plans de repas parfaits',
    description: 'Planifier et respecter repas 30 jours',
    category: 'habits',
    icon: '📅',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      if (!userData.activeProgram) return false;
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance < 80) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_dinner_before_8pm_30days',
    name: '30 jours Dîner avant 20h',
    description: 'Dîner avant 20h 30 jours consécutifs',
    category: 'habits',
    icon: '🌙⏰',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      // Note: Nécessite tracking de l'heure des repas
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let count = 0;
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const dinner = (day.meals || []).find(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (dinner) count++;
      }
      return count >= 30;
    }
  },
  {
    id: 'badge_fiber_25_35g_30days',
    name: '30 jours ratio fibres 25–35g',
    description: 'Atteindre 25-35g de fibres par jour pendant 30 jours',
    category: 'nutrition',
    icon: '🌾',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et calculer fiber depuis meals.foods
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
        const fiber = calculateFiberFromMeals(day);
        if (fiber < 25 || fiber > 35) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_6weekends_mastered',
    name: 'Weekends maîtrisés (6 weekends d\'affilée)',
    description: 'Respecter objectifs nutrition 6 weekends consécutifs',
    category: 'balance',
    icon: '🎉',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 42) return false;
      const last42Days = userData.nutritionHistory.slice(-42);
      let weekendCount = 0;
      last42Days.forEach(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 75) weekendCount++;
      });
      return weekendCount >= 12; // 2 jours par weekend x 6
    }
  },
  {
    id: 'badge_seminar_14days',
    name: 'Séminaire interne (nutrition irréprochable 14 jours intensifs)',
    description: 'Nutrition parfaite pendant 14 jours intensifs',
    category: 'mastery',
    icon: '⭐',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 14) return false;
      const last14Days = userData.nutritionHistory.slice(-14);
      return last14Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 95;
      });
    }
  },
  {
    id: 'badge_no_skipped_60days',
    name: '60 jours sans repas sauté',
    description: 'Aucun repas sauté pendant 60 jours',
    category: 'habits',
    icon: '✅✅✅',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 60) return false;
      const last60Days = userData.nutritionHistory.slice(-60);
      return last60Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
        const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
        const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
        return hasBreakfast && hasLunch && hasDinner;
      });
    }
  },
  {
    id: 'badge_clean_bulk_30days',
    name: 'Clean Bulk : 30 jours',
    description: 'Surplus propre et contrôlé 30 jours',
    category: 'mastery',
    icon: '📈',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        
        if (targetCalories === 0 || targetProtein === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance > 0 && balance <= 500 && protein >= targetProtein * 0.95)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_post_workout_30days',
    name: 'Post-entraînement optimisé 30 jours',
    description: 'Optimiser nutrition post-entraînement 30 jours',
    category: 'health',
    icon: '💪',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        if (targetProtein === 0) return false;
        if (protein < targetProtein * 0.95) return false;
      }
      return true;
    }
  }
];

// ==================== BADGES IMPOSSIBLES (20) ====================

export const IMPOSSIBLE_BADGES = [
  {
    id: 'badge_365day_streak',
    name: 'Série 365 Jours Consécutifs',
    description: 'Enregistrer des repas 365 jours consécutifs',
    category: 'consistency',
    icon: '🔥🔥🔥🔥',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      return (userData.streaks?.nutrition?.actual || 0) >= 365;
    }
  },
  {
    id: 'badge_1year_tracking',
    name: '1 An De Suivi Complet',
    description: 'Suivre sa nutrition pendant 1 an complet',
    category: 'milestone',
    icon: '📅',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      return userData.nutritionHistory.length >= 365;
    }
  },
  {
    id: 'badge_macro_precision_3pct_30days',
    name: 'Macro-precision ±3% pendant 30 jours',
    description: 'Respecter macros ±3% pendant 30 jours',
    category: 'mastery',
    icon: '🎯',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const last30Days = userData.nutritionHistory.slice(-30);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = getTargetValue(day, userData, 'targetCarbs');
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = getTargetValue(day, userData, 'targetFat');
        
        if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
        if (!(Math.abs(protein - targetProtein) / targetProtein <= 0.03 &&
              Math.abs(carbs - targetCarbs) / targetCarbs <= 0.03 &&
              Math.abs(fat - targetFat) / targetFat <= 0.03)) {
          return false;
        }
      }
      return true;
    }
  },
  {
    id: 'badge_no_sugar_90days',
    name: '90 jours Sans Sucre Ajouté',
    description: 'Aucun sucre ajouté pendant 90 jours consécutifs',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 90) return false;
      const last90Days = userData.nutritionHistory.slice(-90);
      return last90Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        return totalSugar <= 5;
      });
    }
  },
  {
    id: 'badge_no_skipped_90days',
    name: '90 jours Sans Repas Sauté',
    description: 'Aucun repas sauté pendant 90 jours',
    category: 'habits',
    icon: '✅✅✅',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 90) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 90; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
        const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
        const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (!(hasBreakfast && hasLunch && hasDinner)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_deficit_90days',
    name: 'Déficit Maîtrisé 90 jours',
    description: 'Maintenir déficit contrôlé 90 jours consécutifs',
    category: 'mastery',
    icon: '📉',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 90) return false;
      const last90Days = userData.nutritionHistory.slice(-90);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 90; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance < 0 && balance >= -500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_surplus_90days',
    name: 'Surplus Maîtrisé 90 jours',
    description: 'Maintenir surplus contrôlé 90 jours consécutifs',
    category: 'mastery',
    icon: '📈',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 90) return false;
      const last90Days = userData.nutritionHistory.slice(-90);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 90; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const balance = calories - targetCalories;
        if (!(balance > 0 && balance <= 500)) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_365balanced_meals',
    name: '365 Repas Équilibrés',
    description: 'Enregistrer 365 repas équilibrés au total',
    category: 'nutrition',
    icon: '⚖️',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles avant de compter
        if (!hasRealNutritionData(day)) return;
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length === 0) return; // Vérifier qu'il y a des aliments
          const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 30) balancedCount++;
        });
      });
      return balancedCount >= 365;
    }
  },
  {
    id: 'badge_hydration_365days',
    name: '365 jours hydratation parfaite',
    description: 'Atteindre objectif hydratation 365 jours consécutifs',
    category: 'nutrition',
    icon: '💧💧💧',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      const last365Days = userData.nutritionHistory.slice(-365);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day) return false;
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        if (targetWater === 0) return false;
        if (water < targetWater * 0.95) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_no_fastfood_1year',
    name: 'Zéro fast-food pendant 1 an',
    description: 'Aucun fast-food pendant 365 jours',
    category: 'habits',
    icon: '🚫🍔',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const meals = day.meals || [];
        if (meals.some(meal => {
          const foods = meal.foods || [];
          const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
          return calories > 800 && protein < 20;
        })) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_50recipes',
    name: '50 Recettes Créées',
    description: 'Créer ou tester 50 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies recettes
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
        });
      });
      return recipeCount >= 50;
    }
  },
  {
    id: 'badge_365perfect_programs',
    name: '365 Programmes Parfaits',
    description: 'Respecter programme nutrition 365 jours',
    category: 'nutrition',
    icon: '🎯',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance < 80) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_100protein_sources',
    name: '100 Sources Protéines testées',
    description: 'Tester 100 sources de protéines différentes',
    category: 'discovery',
    icon: '🥩',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      // ✅ CORRECTION : Calculer directement depuis nutritionHistory avec hasRealNutritionData
      const uniqueFoods = new Set();
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          foods.forEach(food => {
            if (food && food.name && (food.protein || 0) > 5) {
              uniqueFoods.add(food.name.toLowerCase());
            }
          });
        });
      });
      return uniqueFoods.size >= 100;
    }
  },
  {
    id: 'badge_no_excess_1year',
    name: '1 an sans dépassement calorique >10%',
    description: 'Respecter objectif calories ±10% pendant 1 an',
    category: 'mastery',
    icon: '📊',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      const last365Days = userData.nutritionHistory.slice(-365);
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        if (targetCalories === 0) return false;
        const ratio = calories / targetCalories;
        if (ratio < 0.9 || ratio > 1.1) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_perfect_digestion_1year',
    name: '1 an de digestion parfaite',
    description: 'Aucun problème digestif pendant 1 an',
    category: 'health',
    icon: '🌿',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      const last365Days = userData.nutritionHistory.slice(-365);
      return last365Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 85;
      });
    }
  },
  {
    id: 'badge_12months_weekends',
    name: '12 mois weekends maîtrisés',
    description: 'Respecter objectifs nutrition tous les weekends pendant 1 an',
    category: 'balance',
    icon: '🎉',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      const last365Days = userData.nutritionHistory.slice(-365);
      let weekendCount = 0;
      last365Days.forEach(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 75) weekendCount++;
      });
      return weekendCount >= 104; // 2 jours par weekend x 52 semaines
    }
  },
  {
    id: 'badge_traveler_ultimate',
    name: 'Voyageur Nutrition Ultime (tous voyages maîtrisés 1 an)',
    description: 'Respecter objectifs nutrition pendant tous les voyages',
    category: 'balance',
    icon: '✈️',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      const last365Days = userData.nutritionHistory.slice(-365);
      const avgCompliance = last365Days.reduce((sum, day) => {
        return sum + (day.complianceScore || day.dailyTotals?.complianceScore || 0);
      }, 0) / last365Days.length;
      return avgCompliance >= 80;
    }
  },
  {
    id: 'badge_restaurant_god',
    name: 'Restaurant God (20 choix parfaits)',
    description: 'Faire 20 choix équilibrés parfaits au restaurant',
    category: 'balance',
    icon: '🍽️',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let balancedCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
          if (total === 0) return;
          const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
          const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
          const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
          const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
          if (deviation < 20) balancedCount++; // Plus strict pour "parfait"
        });
      });
      return balancedCount >= 20;
    }
  },
  {
    id: 'badge_fiber_365days',
    name: 'Ratio fibres 365 jours',
    description: 'Atteindre 25-35g de fibres par jour pendant 365 jours',
    category: 'nutrition',
    icon: '🌾',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et calculer fiber depuis meals.foods
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
        const fiber = calculateFiberFromMeals(day);
        if (fiber < 25 || fiber > 35) return false;
      }
      return true;
    }
  },
  {
    id: 'badge_master_nutrition_absolute',
    name: 'Master Nutrition Absolu (365 jours parfaits eau + macros + fibres + calories)',
    description: '365 jours parfaits : tous objectifs atteints',
    category: 'mastery',
    icon: '⭐',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false;
        
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = getTargetValue(day, userData, 'targetWater');
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = getTargetValue(day, userData, 'targetProtein');
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = getTargetValue(day, userData, 'targetCalories');
        // ✅ CORRECTION CRITIQUE : fiber n'existe pas dans dailyTotals, calculer depuis meals.foods
        const fiber = calculateFiberFromMeals(day);
        
        if (targetWater === 0 || targetProtein === 0 || targetCalories === 0) return false;
        if (!(water >= targetWater * 0.95 &&
              protein >= targetProtein * 0.95 &&
              Math.abs(calories - targetCalories) <= 200 &&
              fiber >= 25)) {
          return false;
        }
      }
      return true;
    }
  }
];

// ==================== EXPORT TOUS LES BADGES ====================

export const ALL_BADGES = [
  ...EASY_BADGES,
  ...SIMPLE_BADGES,
  ...MEDIUM_BADGES,
  ...HARD_BADGES,
  ...HARDCORE_BADGES,
  ...IMPOSSIBLE_BADGES
];

// ==================== EXPORT PAR CATÉGORIE ====================

export const BADGES_BY_DIFFICULTY = {
  easy: EASY_BADGES,
  simple: SIMPLE_BADGES,
  medium: MEDIUM_BADGES,
  hard: HARD_BADGES,
  hardcore: HARDCORE_BADGES,
  impossible: IMPOSSIBLE_BADGES
};
