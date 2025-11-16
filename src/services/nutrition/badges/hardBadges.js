/**
 * badges/hardBadges.js
 * 
 * Badges DIFFICILES (20 badges)
 * Difficulté : Difficile, nécessitent un mois ou plus de consistance
 * Points : 200-500 XP
 * 
 * @module services/nutrition/badges/hardBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper 
} from './helpers';

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
        if (!(balance < 0 && balance >= -500)) return false; // Déficit entre 0 et -500 kcal
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
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies données
      let totalMeals = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        totalMeals += (day.meals || []).length;
      });
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 30; i++) {
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
    id: 'badge_no_sugar_10days',
    name: '10 jours Sans Sucre Ajouté',
    description: 'Aucun sucre ajouté pendant 10 jours consécutifs',
    category: 'habits',
    icon: '🚫🍬',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 10) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 10; i++) {
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
      // ✅ CORRECTION : Ajouter hasRealNutritionData pour ne compter que les vraies recettes
      let recipeCount = 0;
      userData.nutritionHistory.forEach(day => {
        if (!hasRealNutritionData(day)) return; // Skip jours sans données réelles
        (day.meals || []).forEach(meal => {
          const foods = meal.foods || [];
          if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
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
        if (balance > 200) return false; // ±200 kcal
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 10; i++) {
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 7; i++) {
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let totalCompliance = 0;
      let daysCount = 0;
      for (let i = 0; i < 7; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        totalCompliance += compliance;
        daysCount++;
      }
      if (daysCount === 0) return false;
      const avgCompliance = totalCompliance / daysCount;
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

