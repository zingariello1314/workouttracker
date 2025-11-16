/**
 * badges/mediumBadges.js
 * 
 * Badges MOYENS (20 badges)
 * Difficulté : Moyen, nécessitent une semaine ou plus de consistance
 * Points : 150-300 XP
 * 
 * @module services/nutrition/badges/mediumBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper 
} from './helpers';

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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
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
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies données
      let totalMeals = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        totalMeals += (day.meals || []).length;
      });
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

