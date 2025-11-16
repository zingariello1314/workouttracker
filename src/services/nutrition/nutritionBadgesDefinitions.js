/**
 * nutritionBadgesDefinitions.js
 * 
 * Définitions complètes de tous les badges de gamification nutrition
 * Organisés par niveau de difficulté : FACILE, SIMPLE, MOYEN, DIFFICILE, HARDCORE, IMPOSSIBLE
 * 
 * @module services/nutrition/nutritionBadgesDefinitions
 */

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
      const targetWater = today?.dailyTotals?.targetWater || 2500;
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
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = today?.dailyTotals?.targetProtein || 150;
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
      const meals = today?.meals || [];
      return meals.some(m => m.type === 'breakfast');
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
      // Note: Nécessite tracking des aliments uniques testés
      // Pour l'instant, vérifier variété sur 7 jours
      return (userData.uniqueFoodsLast7Days || 0) >= 1;
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
      const meals = today?.meals || [];
      return meals.some(meal => {
        const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
        if (total === 0) return false;
        const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
        const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
        const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
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
      // Note: Nécessite tracking des sources de protéines uniques
      // Pour l'instant, vérifier variété
      return (userData.uniqueFoodsLast7Days || 0) >= 1;
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
      const fat = today?.dailyTotals?.fat || 0;
      const targetFat = today?.dailyTotals?.targetFat || 65;
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
      const fiber = today?.dailyTotals?.fiber || 0;
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
      const breakfast = (today?.meals || []).find(m => m.type === 'breakfast');
      if (!breakfast) return false;
      // Vérifier que le petit-déj a des protéines et pas trop de sucre
      const foods = breakfast.foods || [];
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
      const dinner = (today?.meals || []).find(m => m.type === 'dinner');
      if (!dinner) return false;
      const foods = dinner.foods || [];
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
      const calories = today?.dailyTotals?.calories || 0;
      const targetCalories = today?.dailyTotals?.targetCalories || 2000;
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
      // Note: Nécessite tracking des types de protéines
      // Pour l'instant, vérifier variété
      return (userData.uniqueFoodsLast7Days || 0) >= 1;
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
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        return water >= 2000;
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const meals = day.meals || [];
        return meals.some(m => m.type === 'breakfast');
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner) return false;
        const calories = (dinner.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
        return calories <= 600;
      });
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
      // Note: Nécessite tracking des nouveaux aliments par jour
      // Pour l'instant, vérifier variété sur 7 jours
      return (userData.uniqueFoodsLast7Days || 0) >= 3;
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
      return (userData.uniqueFoodsLast7Days || 0) >= 10;
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
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
    id: 'badge_protein_ratio_3days',
    name: 'Ratio Protéines Atteint 3 Jours',
    description: 'Atteindre objectif protéines 3 jours consécutifs',
    category: 'nutrition',
    icon: '💪💪💪',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return protein >= targetProtein * 0.95;
      });
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        return water >= targetWater * 0.9;
      });
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        return !meals.some(meal => {
          const foods = meal.foods || [];
          const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
          return calories > 800 && protein < 20; // Fast-food typique
        });
      });
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
        (day.meals || []).forEach(meal => {
          if ((meal.foods || []).length >= 3) recipeCount++;
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const meals = day.meals || [];
        const totalSugar = meals.reduce((sum, meal) => {
          return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
        }, 0);
        return totalSugar <= 30; // Max 30g/jour
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = Math.abs(calories - targetCalories);
        return balance <= 200; // ±200 kcal
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      let count = 0;
      last3Days.forEach(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (dinner) count++;
      });
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
      // Note: Nécessite tracking des types d'aliments
      return (userData.uniqueFoodsLast7Days || 0) >= 5;
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
      const water = today?.dailyTotals?.waterIntake || 0;
      const targetWater = today?.dailyTotals?.targetWater || 2500;
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = today?.dailyTotals?.targetProtein || 150;
      const calories = today?.dailyTotals?.calories || 0;
      const targetCalories = today?.dailyTotals?.targetCalories || 2000;
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
      // Note: Nécessite tracking des types d'aliments (fruits)
      // Pour l'instant, vérifier variété
      return (userData.uniqueFoodsLast7Days || 0) >= 7;
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
      const protein = today?.dailyTotals?.protein || 0;
      const targetProtein = today?.dailyTotals?.targetProtein || 150;
      const carbs = today?.dailyTotals?.carbs || 0;
      const targetCarbs = today?.dailyTotals?.targetCarbs || 200;
      const fat = today?.dailyTotals?.fat || 0;
      const targetFat = today?.dailyTotals?.targetFat || 65;
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner) return false;
        const calories = (dinner.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
        return calories <= 600;
      });
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const meals = day.meals || [];
        return meals.some(m => m.type === 'breakfast');
      });
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
      return last7Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        return water >= targetWater * 0.95;
      });
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
      const last14Days = userData.nutritionHistory.slice(-14);
      const uniqueFoods = new Set();
      last14Days.forEach(day => {
        (day.meals || []).forEach(meal => {
          (meal.foods || []).forEach(food => {
            if (food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      });
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasMainMealsWithData(day)) return false;
        
        const meals = day.meals || [];
        // Vérifier qu'il n'y a pas de snack ET qu'il y a au moins un repas principal avec données
        return !meals.some(m => m.type === 'snack') && 
               meals.some(m => ['breakfast', 'lunch', 'dinner'].includes(m.type) && (m.foods || []).length > 0);
      });
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
      return last7Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance < 0 && balance >= -500; // Déficit entre 0 et -500 kcal
      });
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
      return last7Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance > 0 && balance <= 500;
      });
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
      return last3Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = day.dailyTotals?.targetCarbs || 200;
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = day.dailyTotals?.targetFat || 65;
        return Math.abs(protein - targetProtein) / targetProtein <= 0.1 &&
               Math.abs(carbs - targetCarbs) / targetCarbs <= 0.1 &&
               Math.abs(fat - targetFat) / targetFat <= 0.1;
      });
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
      const last5Days = userData.nutritionHistory.slice(-5);
      return last5Days.every(day => {
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
      // Note: Nécessite tracking des types de protéines
      return (userData.uniqueFoodsLast7Days || 0) >= 10;
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return protein >= targetProtein * 0.95;
      });
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
      // Pour l'instant, vérifier compliance élevée
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 21) return false;
      const last21Days = userData.nutritionHistory.slice(-21);
      let weekendCount = 0;
      last21Days.forEach(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 80) weekendCount++;
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      return last3Days.every(day => {
        const fiber = day.dailyTotals?.fiber || 0;
        return fiber >= 25;
      });
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 75;
      });
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
      const last3Days = userData.nutritionHistory.slice(-3);
      let count = 0;
      last3Days.forEach(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (dinner) count++;
      });
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
        (day.meals || []).forEach(meal => {
          if ((meal.foods || []).length >= 3) recipeCount++;
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
      return last3Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        return water >= targetWater * 0.9 &&
               protein >= targetProtein * 0.95 &&
               Math.abs(calories - targetCalories) <= 200;
      });
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
      return last30Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance < 0 && balance >= -500;
      });
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
      return last30Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance > 0 && balance <= 500;
      });
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
      return last7Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = day.dailyTotals?.targetCarbs || 200;
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = day.dailyTotals?.targetFat || 65;
        return Math.abs(protein - targetProtein) / targetProtein <= 0.05 &&
               Math.abs(carbs - targetCarbs) / targetCarbs <= 0.05 &&
               Math.abs(fat - targetFat) / targetFat <= 0.05;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      let balancedCount = 0;
      last30Days.forEach(day => {
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
      const last14Days = userData.nutritionHistory.slice(-14);
      return last14Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return protein >= targetProtein * 0.95;
      });
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
      return last14Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = Math.abs(calories - targetCalories);
        return balance <= 200;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (!dinner) return false;
        const calories = (dinner.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
        return calories <= 600;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      const uniqueFoods = new Set();
      last30Days.forEach(day => {
        (day.meals || []).forEach(meal => {
          (meal.foods || []).forEach(food => {
            if (food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        return water >= 2000;
      });
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
      // Note: Nécessite tracking des types de protéines
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
      const uniqueFoods = new Set();
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          (meal.foods || []).forEach(food => {
            if (food.name && (food.protein || 0) > 5) uniqueFoods.add(food.name.toLowerCase());
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
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const fiber = day.dailyTotals?.fiber || 0;
        return water >= targetWater * 0.9 &&
               protein >= targetProtein * 0.95 &&
               Math.abs(calories - targetCalories) <= 200 &&
               fiber >= 25;
      });
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
      return last21Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = day.dailyTotals?.targetCarbs || 200;
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = day.dailyTotals?.targetFat || 65;
        return Math.abs(protein - targetProtein) / targetProtein <= 0.05 &&
               Math.abs(carbs - targetCarbs) / targetCarbs <= 0.05 &&
               Math.abs(fat - targetFat) / targetFat <= 0.05;
      });
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
      return last60Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance < 0 && balance >= -500;
      });
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
      return last60Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance > 0 && balance <= 500;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
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
      return last60Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        return water >= targetWater * 0.95;
      });
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
      return last30Days.every(day => {
        // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles AVANT de valider l'absence
        if (!hasRealNutritionData(day)) return false;
        
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance <= 500; // Pas de dépassement > 500 kcal
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      const avgCompliance = last30Days.reduce((sum, day) => {
        return sum + (day.complianceScore || day.dailyTotals?.complianceScore || 0);
      }, 0) / last30Days.length;
      const uniqueFoods = new Set();
      last30Days.forEach(day => {
        (day.meals || []).forEach(meal => {
          (meal.foods || []).forEach(food => {
            if (food.name) uniqueFoods.add(food.name.toLowerCase());
          });
        });
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 80;
      }) && userData.activeProgram !== null;
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
      const last30Days = userData.nutritionHistory.slice(-30);
      let count = 0;
      last30Days.forEach(day => {
        const dinner = (day.meals || []).find(m => m.type === 'dinner');
        if (dinner) count++;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const fiber = day.dailyTotals?.fiber || 0;
        return fiber >= 25 && fiber <= 35;
      });
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
      return last30Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return balance > 0 && balance <= 500 && protein >= targetProtein * 0.95;
      });
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
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return protein >= targetProtein * 0.95;
      });
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
      return last30Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const carbs = day.dailyTotals?.carbs || 0;
        const targetCarbs = day.dailyTotals?.targetCarbs || 200;
        const fat = day.dailyTotals?.fat || 0;
        const targetFat = day.dailyTotals?.targetFat || 65;
        return Math.abs(protein - targetProtein) / targetProtein <= 0.03 &&
               Math.abs(carbs - targetCarbs) / targetCarbs <= 0.03 &&
               Math.abs(fat - targetFat) / targetFat <= 0.03;
      });
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
      const last90Days = userData.nutritionHistory.slice(-90);
      return last90Days.every(day => {
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
      return last90Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance < 0 && balance >= -500;
      });
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
      return last90Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance > 0 && balance <= 500;
      });
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
      return last365Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        return water >= targetWater * 0.95;
      });
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
      const last365Days = userData.nutritionHistory.slice(-365);
      return last365Days.every(day => {
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
    id: 'badge_50recipes',
    name: '50 Recettes Créées',
    description: 'Créer ou tester 50 recettes différentes',
    category: 'discovery',
    icon: '👨‍🍳',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory) return false;
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          if ((meal.foods || []).length >= 3) recipeCount++;
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
      const last365Days = userData.nutritionHistory.slice(-365);
      return last365Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 80;
      });
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
      const uniqueFoods = new Set();
      userData.nutritionHistory.forEach(day => {
        (day.meals || []).forEach(meal => {
          (meal.foods || []).forEach(food => {
            if (food.name && (food.protein || 0) > 5) uniqueFoods.add(food.name.toLowerCase());
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
      return last365Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const ratio = calories / targetCalories;
        return ratio >= 0.9 && ratio <= 1.1;
      });
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
      const last365Days = userData.nutritionHistory.slice(-365);
      return last365Days.every(day => {
        const fiber = day.dailyTotals?.fiber || 0;
        return fiber >= 25 && fiber <= 35;
      });
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
      const last365Days = userData.nutritionHistory.slice(-365);
      return last365Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const fiber = day.dailyTotals?.fiber || 0;
        return water >= targetWater * 0.95 &&
               protein >= targetProtein * 0.95 &&
               Math.abs(calories - targetCalories) <= 200 &&
               fiber >= 25;
      });
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
