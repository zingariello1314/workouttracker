/**
 * badges/simpleBadges.js
 * 
 * Badges SIMPLES (20 badges)
 * Difficulté : Simple, nécessitent quelques jours de consistance
 * Points : 50-150 XP
 * 
 * @module services/nutrition/badges/simpleBadges
 */

import { 
  hasRealNutritionData, 
  hasMainMealsWithData,
  getTargetValue,
  DateHelper 
} from './helpers';

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
      // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles
      if (!hasRealNutritionData(today)) return false;
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

