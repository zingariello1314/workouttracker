/**
 * badges/easyBadges.js
 * 
 * Badges FACILES (20 badges)
 * Difficulté : Facile à obtenir, encouragent l'engagement initial
 * Points : 15-30 XP
 * 
 * @module services/nutrition/badges/easyBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper 
} from './helpers';

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
      const targetWater = getTargetValue(today, userData, 'targetWater');
      if (targetWater === 0) return false;
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
      const targetFat = getTargetValue(today, userData, 'targetFat');
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

