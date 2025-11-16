/**
 * badges/impossibleBadges.js
 * 
 * Badges IMPOSSIBLES (20 badges)
 * Difficulté : Impossible, nécessitent 365 jours ou plus de consistance absolue
 * Points : 2000 XP
 * 
 * @module services/nutrition/badges/impossibleBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  calculateFiberFromMeals,
  getTargetValue,
  DateHelper 
} from './helpers';

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
      // ✅ CORRECTION : Vérifier qu'il y a au moins 365 jours avec des données réelles
      let daysWithData = 0;
      userData.nutritionHistory.forEach(day => {
        if (hasRealNutritionData(day)) daysWithData++;
      });
      return daysWithData >= 365;
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 90; i++) {
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
        if (!(balance < 0 && balance >= -500)) return false; // Déficit entre 0 et -500 kcal
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
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
          return calories > 800 && protein < 20; // Fast-food typique
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
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance < 85) return false;
      }
      return true;
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
      // ✅ CORRECTION : Utiliser DateHelper pour itérer (mais pas consécutivité stricte car weekends)
      const today = DateHelper.getTodayLocal();
      let weekendCount = 0;
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        if (compliance >= 75) weekendCount++;
      }
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
      // ✅ CORRECTION : Utiliser DateHelper pour itérer avec hasRealNutritionData
      const today = DateHelper.getTodayLocal();
      let totalCompliance = 0;
      let daysWithData = 0;
      for (let i = 0; i < 365; i++) {
        const expectedDate = DateHelper.getDaysAgoLocal(i);
        const day = userData.nutritionHistory.find(d => d.date === expectedDate);
        if (!day || !hasRealNutritionData(day)) continue; // Skip jour manquant ou pas de données
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        totalCompliance += compliance;
        daysWithData++;
      }
      if (daysWithData === 0) return false;
      const avgCompliance = totalCompliance / daysWithData;
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
    name: 'Maître Nutrition Absolu (365 jours parfaits)',
    description: 'Journées parfaites 365 jours consécutifs',
    category: 'mastery',
    icon: '⭐',
    rarity: 'legendary',
    points: 2000,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 365) return false;
      // ✅ CORRECTION : Vérifier consécutivité avec DateHelper et valeurs par défaut correctes
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

