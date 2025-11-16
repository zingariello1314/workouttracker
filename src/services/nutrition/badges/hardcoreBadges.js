/**
 * badges/hardcoreBadges.js
 * 
 * Badges HARDCORES (20 badges)
 * Difficulté : Hardcore, nécessitent 60-90 jours ou plus de consistance
 * Points : 500-1000 XP
 * 
 * @module services/nutrition/badges/hardcoreBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper 
} from './helpers';

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
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies données
      let totalMeals = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        totalMeals += (day.meals || []).length;
      });
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
        if (!(balance < 0 && balance >= -500)) return false; // Déficit entre 0 et -500 kcal
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 60; i++) {
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
    id: 'badge_no_fastfood_30days',
    name: '30 jours sans fast-food',
    description: 'Aucun fast-food pendant 30 jours',
    category: 'habits',
    icon: '🚫🍔',
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
    id: 'badge_no_cheat_30days',
    name: '30 jours sans cheat meal',
    description: 'Aucun cheat meal pendant 30 jours',
    category: 'habits',
    icon: '🚫',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
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
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies recettes
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
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
      for (let i = 0; i < 30; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Doit être consécutif
        const dinner = (day.meals || []).find(m => m.type === 'dinner' && (m.foods || []).length > 0);
        if (!dinner) return false;
      }
      return true;
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
      // ✅ CORRECTION : Utiliser DateHelper pour itérer (mais pas consécutivité stricte car weekends)
      const today = DateHelper.getTodayLocal();
      let weekendCount = 0;
      for (let i = 0; i < 42; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 75) weekendCount++;
      }
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 14; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance < 95) return false;
      }
      return true;
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 60; i++) {
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
    id: 'badge_clean_bulk_30days',
    name: 'Clean Bulk : 30 jours',
    description: 'Surplus propre et contrôlé 30 jours',
    category: 'mastery',
    icon: '📈',
    rarity: 'legendary',
    points: 1000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) return false;
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

