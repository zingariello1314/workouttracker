/**
 * nutritionExpertSystem.js
 * 
 * Système Expert pour Recommandations Nutritionnelles (Règles-Based)
 * 
 * Avantages :
 * - 0 MB (pas de modèle ML)
 * - <1ms de latence
 * - 100% fiable (pas d'hallucinations)
 * - Facile à maintenir (ajout de règles)
 * 
 * @module services/nutrition/nutritionExpertSystem
 * @see ../../../../nouvelongletnutritionplan.md Section 2.3
 */

import logger from '../../utils/logger';
import { DateHelper } from '../../utils/dateHelper';

const log = logger.module('nutritionExpertSystem');

// ==================== RÈGLES EXPERT ====================

/**
 * Règles expert pour recommandations nutritionnelles
 * Chaque règle contient :
 * - id: Identifiant unique
 * - condition: Fonction qui retourne true si la règle s'applique
 * - advice: Message de conseil (peut être une fonction pour messages dynamiques)
 * - priority: 'high' | 'medium' | 'low'
 * - category: Catégorie du conseil
 */
const EXPERT_RULES = [
  // ==================== PRIORITÉ HAUTE ====================
  
  {
    id: 'protein_deficit_severe',
    condition: (data) => {
      if (!data.avgProtein || !data.targetProtein) return false;
      return data.avgProtein < data.targetProtein * 0.7; // < 70% de la cible
    },
    advice: (data) => {
      const deficit = Math.round(data.targetProtein - data.avgProtein);
      return `Déficit protéique sévère (-${deficit}g/jour, ${Math.round((1 - data.avgProtein / data.targetProtein) * 100)}%). Augmentez immédiatement. Sources: poulet (31g/100g), œufs (13g/unité), whey (25g/scoop), thon (25g/100g).`;
    },
    priority: 'high',
    category: 'protein'
  },
  
  {
    id: 'protein_deficit_moderate',
    condition: (data) => {
      if (!data.avgProtein || !data.targetProtein) return false;
      return data.avgProtein >= data.targetProtein * 0.7 && data.avgProtein < data.targetProtein * 0.8;
    },
    advice: (data) => {
      const deficit = Math.round(data.targetProtein - data.avgProtein);
      return `Déficit protéique modéré (-${deficit}g/jour). Augmentez progressivement. Ajoutez 1-2 portions protéines/jour.`;
    },
    priority: 'high',
    category: 'protein'
  },
  
  {
    id: 'calories_surplus_excessive',
    condition: (data) => {
      if (!data.avgCalories || !data.targetCalories) return false;
      return data.avgCalories > data.targetCalories * 1.2; // > 20% surplus
    },
    advice: (data) => {
      const surplus = Math.round(data.avgCalories - data.targetCalories);
      const percent = Math.round((surplus / data.targetCalories) * 100);
      return `Surplus calorique excessif (+${surplus} kcal/jour, +${percent}%). Risque gain masse grasse. Réduisez de 200-300 kcal/jour progressivement.`;
    },
    priority: 'high',
    category: 'calories'
  },
  
  {
    id: 'calories_deficit_bulk',
    condition: (data) => {
      if (!data.avgCalories || !data.targetCalories || !data.goal) return false;
      return data.avgCalories < data.targetCalories * 0.8 && data.goal === 'bulk';
    },
    advice: (data) => {
      const deficit = Math.round(data.targetCalories - data.avgCalories);
      return `Déficit calorique incompatible avec prise de masse (-${deficit} kcal/jour). Augmentez calories de 300-500 kcal/jour. Privilégiez glucides (riz, pâtes) et lipides (avocat, noix).`;
    },
    priority: 'high',
    category: 'calories'
  },
  
  {
    id: 'calories_surplus_cut',
    condition: (data) => {
      if (!data.avgCalories || !data.targetCalories || !data.goal) return false;
      return data.avgCalories > data.targetCalories * 1.1 && data.goal === 'cut';
    },
    advice: (data) => {
      const surplus = Math.round(data.avgCalories - data.targetCalories);
      return `Surplus calorique incompatible avec sèche (+${surplus} kcal/jour). Réduisez de 200-400 kcal/jour. Réduisez glucides et lipides, maintenez protéines.`;
    },
    priority: 'high',
    category: 'calories'
  },
  
  {
    id: 'calories_deficit_severe',
    condition: (data) => {
      if (!data.avgCalories || !data.targetCalories) return false;
      return data.avgCalories < data.targetCalories * 0.7; // < 70% de la cible
    },
    advice: (data) => {
      const deficit = Math.round(data.targetCalories - data.avgCalories);
      return `Déficit calorique sévère (-${deficit} kcal/jour). Risque perte masse musculaire et métabolisme ralenti. Augmentez progressivement de 300-500 kcal/jour.`;
    },
    priority: 'high',
    category: 'calories'
  },
  
  // ==================== PRIORITÉ MOYENNE ====================
  
  {
    id: 'timing_post_workout',
    condition: (data) => {
      if (!data.lastWorkoutTime || !data.lastMealTime) return false;
      const diffMs = new Date(data.lastMealTime) - new Date(data.lastWorkoutTime);
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 2; // Repas >2h après workout
    },
    advice: (data) => {
      const diffMs = new Date(data.lastMealTime) - new Date(data.lastWorkoutTime);
      const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      return `Repas post-workout trop tardif (${diffHours}h après entraînement). Idéal: 30-60min après pour récupération optimale. Privilégiez protéines + glucides rapides.`;
    },
    priority: 'medium',
    category: 'timing'
  },
  
  {
    id: 'hydration_low',
    condition: (data) => {
      if (!data.avgWaterIntake || !data.targetWater) return false;
      return data.avgWaterIntake < data.targetWater * 0.7;
    },
    advice: (data) => {
      const deficit = Math.round(data.targetWater - data.avgWaterIntake);
      const percent = Math.round((data.avgWaterIntake / data.targetWater) * 100);
      return `Hydratation insuffisante (${Math.round(data.avgWaterIntake)}ml vs ${data.targetWater}ml cible, ${percent}%). Ciblez +${Math.min(500, deficit)}ml/jour minimum.`;
    },
    priority: 'medium',
    category: 'hydration'
  },
  
  {
    id: 'carbs_timing_pre_workout',
    condition: (data) => {
      if (!data.nextWorkoutTime || !data.lastMealTime) return false;
      const diffMs = new Date(data.nextWorkoutTime) - new Date(data.lastMealTime);
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 3 && diffHours < 6; // Dernier repas 3-6h avant workout
    },
    advice: () => {
      return `Dernier repas trop éloigné de l'entraînement (3-6h). Prenez une collation pré-workout 30-60min avant (banane, dattes, ou shake glucides) pour performance optimale.`;
    },
    priority: 'medium',
    category: 'timing'
  },
  
  {
    id: 'protein_distribution',
    condition: (data) => {
      if (!data.proteinPerMeal || !data.targetProtein) return false;
      const avgPerMeal = data.targetProtein / (data.mealsPerDay || 3);
      return data.proteinPerMeal < avgPerMeal * 0.7; // < 70% de la moyenne par repas
    },
    advice: (data) => {
      const avgPerMeal = data.targetProtein / (data.mealsPerDay || 3);
      return `Distribution protéique inégale (${Math.round(data.proteinPerMeal)}g/repas vs ${Math.round(avgPerMeal)}g idéal). Répartissez mieux les protéines sur tous les repas (20-40g/repas).`;
    },
    priority: 'medium',
    category: 'protein'
  },
  
  {
    id: 'fiber_low',
    condition: (data) => {
      if (!data.avgFiber) return false;
      return data.avgFiber < 25; // Minimum recommandé 25g/jour
    },
    advice: (data) => {
      const deficit = Math.round(25 - data.avgFiber);
      return `Fibres insuffisantes (${Math.round(data.avgFiber)}g/jour vs 25g minimum). Ajoutez légumes verts, fruits, céréales complètes. Ciblez +${deficit}g/jour.`;
    },
    priority: 'medium',
    category: 'macros'
  },
  
  {
    id: 'fat_low',
    condition: (data) => {
      if (!data.avgFat || !data.targetFat) return false;
      return data.avgFat < data.targetFat * 0.7;
    },
    advice: (data) => {
      const deficit = Math.round(data.targetFat - data.avgFat);
      return `Lipides insuffisants (-${deficit}g/jour). Essentiels pour hormones et absorption vitamines. Ajoutez avocat, noix, huile d'olive, poissons gras.`;
    },
    priority: 'medium',
    category: 'macros'
  },
  
  {
    id: 'carbs_low_active',
    condition: (data) => {
      if (!data.avgCarbs || !data.targetCarbs || !data.isActive) return false;
      return data.avgCarbs < data.targetCarbs * 0.7 && data.isActive;
    },
    advice: (data) => {
      const deficit = Math.round(data.targetCarbs - data.avgCarbs);
      return `Glucides insuffisants pour activité (-${deficit}g/jour). Risque fatigue et perte performance. Augmentez riz, pâtes, patates douces autour des entraînements.`;
    },
    priority: 'medium',
    category: 'macros'
  },
  
  // ==================== PRIORITÉ BASSE ====================
  
  {
    id: 'variety_low',
    condition: (data) => {
      if (!data.uniqueFoodsLast7Days) return false;
      return data.uniqueFoodsLast7Days < 15;
    },
    advice: (data) => {
      return `Variété alimentaire faible (${data.uniqueFoodsLast7Days} aliments différents sur 7 jours). Diversifiez sources protéines, glucides, légumes pour micronutriments complets et éviter carences.`;
    },
    priority: 'low',
    category: 'variety'
  },
  
  {
    id: 'meal_frequency_low',
    condition: (data) => {
      if (!data.mealsPerDay) return false;
      return data.mealsPerDay < 3;
    },
    advice: (data) => {
      return `Fréquence repas faible (${data.mealsPerDay} repas/jour). Idéal: 3-5 repas/jour pour meilleure distribution nutriments et contrôle faim.`;
    },
    priority: 'low',
    category: 'timing'
  },
  
  {
    id: 'meal_frequency_high',
    condition: (data) => {
      if (!data.mealsPerDay) return false;
      return data.mealsPerDay > 6;
    },
    advice: (data) => {
      return `Fréquence repas élevée (${data.mealsPerDay} repas/jour). Pas nécessaire si objectif non spécifique. 3-5 repas/jour suffisent généralement.`;
    },
    priority: 'low',
    category: 'timing'
  },
  
  {
    id: 'sodium_high',
    condition: (data) => {
      if (!data.avgSodium) return false;
      return data.avgSodium > 2300; // Maximum recommandé 2300mg/jour
    },
    advice: (data) => {
      return `Sodium élevé (${Math.round(data.avgSodium)}mg/jour vs 2300mg max). Réduisez aliments transformés, sel ajouté. Privilégiez aliments frais.`;
    },
    priority: 'low',
    category: 'macros'
  },
  
  {
    id: 'sugar_high',
    condition: (data) => {
      if (!data.avgSugar || !data.avgCalories) return false;
      const sugarPercent = (data.avgSugar * 4) / data.avgCalories * 100; // 4 kcal/g sucre
      return sugarPercent > 10; // > 10% des calories en sucre
    },
    advice: (data) => {
      const sugarPercent = Math.round((data.avgSugar * 4) / data.avgCalories * 100);
      return `Sucres ajoutés élevés (${Math.round(data.avgSugar)}g/jour, ${sugarPercent}% calories). Limitez boissons sucrées, desserts. Privilégiez fruits entiers.`;
    },
    priority: 'low',
    category: 'macros'
  },
  
  {
    id: 'consistency_low',
    condition: (data) => {
      if (!data.complianceScore) return false;
      return data.complianceScore < 60; // < 60% de conformité
    },
    advice: (data) => {
      return `Conformité au programme faible (${Math.round(data.complianceScore)}%). Améliorez régularité. Planifiez repas à l'avance, préparez en batch.`;
    },
    priority: 'low',
    category: 'consistency'
  }
];

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Génère un résumé des recommandations actives
 */
const generateSummary = (activeRules) => {
  if (activeRules.length === 0) {
    return 'Votre nutrition est globalement équilibrée. Continuez ainsi !';
  }
  
  const highPriority = activeRules.filter(r => r.priority === 'high').length;
  const mediumPriority = activeRules.filter(r => r.priority === 'medium').length;
  const lowPriority = activeRules.filter(r => r.priority === 'low').length;
  
  const parts = [];
  if (highPriority > 0) {
    parts.push(`${highPriority} point${highPriority > 1 ? 's' : ''} critique${highPriority > 1 ? 's' : ''} à corriger`);
  }
  if (mediumPriority > 0) {
    parts.push(`${mediumPriority} amélioration${mediumPriority > 1 ? 's' : ''} recommandée${mediumPriority > 1 ? 's' : ''}`);
  }
  if (lowPriority > 0) {
    parts.push(`${lowPriority} optimisation${lowPriority > 1 ? 's' : ''} optionnelle${lowPriority > 1 ? 's' : ''}`);
  }
  
  return `Analyse complète : ${parts.join(', ')}.`;
};

/**
 * Prépare les données utilisateur pour l'analyse
 */
const prepareUserData = (nutritionData, garminData, activeProgram) => {
  // Calculer moyennes sur 7 jours
  // ✅ OPTIMISATION : Utiliser DateHelper pour garantir cohérence timezone locale
  const last7Days = [];
  
  for (let i = 0; i < 7; i++) {
    const dateStr = DateHelper.getDaysAgoLocal(i);
    const dailyMeal = nutritionData.dailyMeals?.find(dm => dm.date === dateStr);
    if (dailyMeal) {
      last7Days.push(dailyMeal);
    }
  }
  
  // Calculer moyennes
  const totals = last7Days.reduce((acc, day) => {
    acc.calories += day.dailyTotals?.calories || 0;
    acc.protein += day.dailyTotals?.protein || 0;
    acc.carbs += day.dailyTotals?.carbs || 0;
    acc.fat += day.dailyTotals?.fat || 0;
    acc.fiber += day.dailyTotals?.fiber || 0;
    acc.sugar += day.dailyTotals?.sugar || 0;
    acc.sodium += day.dailyTotals?.sodium || 0;
    acc.water += day.dailyTotals?.waterIntake || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, water: 0 });
  
  const daysCount = Math.max(1, last7Days.length);
  
  // Filtrer meals des 7 derniers jours
  // ✅ OPTIMISATION : Utiliser DateHelper pour garantir cohérence timezone locale
  const todayStr = DateHelper.getTodayLocal();
  const sevenDaysAgoStr = DateHelper.getDaysAgoLocal(7);
  
  const mealsLast7Days = (nutritionData.meals || []).filter(meal => {
    const mealDate = DateHelper.toYYYYMMDD(meal.date || meal.timestamp);
    if (!mealDate) return false;
    
    return mealDate >= sevenDaysAgoStr && mealDate <= todayStr;
  });
  
  // Compter aliments uniques (sur les 7 derniers jours)
  const uniqueFoods = new Set();
  mealsLast7Days.forEach(meal => {
    meal.foods?.forEach(food => {
      if (food.name) uniqueFoods.add(food.name.toLowerCase());
    });
  });
  
  // Dernier repas (tous les meals, pas seulement 7 jours)
  const allMeals = nutritionData.meals || [];
  const sortedMeals = allMeals.sort((a, b) => {
    const dateA = new Date(a.timestamp || a.date || 0);
    const dateB = new Date(b.timestamp || b.date || 0);
    return dateB - dateA;
  });
  const lastMeal = sortedMeals[0];
  
  // Récupérer dernier workout depuis Garmin
  let lastWorkoutTime = null;
  let nextWorkoutTime = null;
  if (garminData?.activities) {
    const sortedActivities = Object.values(garminData.activities)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    if (sortedActivities.length > 0) {
      lastWorkoutTime = sortedActivities[0].startTime;
    }
  }
  
  return {
    // Moyennes 7 jours
    avgCalories: totals.calories / daysCount,
    avgProtein: totals.protein / daysCount,
    avgCarbs: totals.carbs / daysCount,
    avgFat: totals.fat / daysCount,
    avgFiber: totals.fiber / daysCount,
    avgSugar: totals.sugar / daysCount,
    avgSodium: totals.sodium / daysCount,
    avgWaterIntake: totals.water / daysCount,
    
    // Cibles programme
    targetCalories: activeProgram?.targetCalories || 2000,
    targetProtein: activeProgram?.targetProtein || 150,
    targetCarbs: activeProgram?.targetCarbs || 200,
    targetFat: activeProgram?.targetFat || 65,
    targetWater: 2500, // 2.5L par défaut
    
    // Objectif
    goal: activeProgram?.goal || 'maintain',
    
    // Conformité
    complianceScore: activeProgram ? 
      (nutritionData.dailyMeals?.reduce((sum, dm) => sum + (dm.complianceScore || 0), 0) / daysCount) : 
      null,
    
    // Timing
    lastMealTime: lastMeal?.timestamp || lastMeal?.date || null,
    lastWorkoutTime: lastWorkoutTime,
    nextWorkoutTime: nextWorkoutTime,
    
    // Variété
    uniqueFoodsLast7Days: uniqueFoods.size,
    mealsPerDay: daysCount > 0 ? mealsLast7Days.length / daysCount : 3,
    proteinPerMeal: daysCount > 0 && mealsLast7Days.length > 0 
      ? totals.protein / daysCount / (mealsLast7Days.length / daysCount) 
      : totals.protein / daysCount / 3,
    
    // Activité
    isActive: garminData?.activities && Object.keys(garminData.activities).length > 0
  };
};

// ==================== FONCTION PRINCIPALE ====================

/**
 * Génère des recommandations nutritionnelles basées sur les règles expert
 * 
 * @param {Object} nutritionData - Données nutrition (dailyMeals, meals, etc.)
 * @param {Object} garminData - Données Garmin (activités, métriques)
 * @param {Object} activeProgram - Programme actif (optionnel)
 * @returns {Object} Recommandations avec summary, recommendations array, timestamp
 */
export const generateNutritionAdvice = (nutritionData, garminData = null, activeProgram = null) => {
  try {
    // Préparer données utilisateur
    const userData = prepareUserData(nutritionData, garminData, activeProgram);
    
    // Filtrer règles actives
    const activeRules = EXPERT_RULES
      .filter(rule => {
        try {
          return rule.condition(userData);
        } catch (error) {
          log.warn(`Erreur condition règle ${rule.id}:`, error);
          return false;
        }
      })
      .map(rule => ({
        ...rule,
        advice: typeof rule.advice === 'function' ? rule.advice(userData) : rule.advice
      }))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    
    // Générer recommandations
    const recommendations = activeRules.map(rule => ({
      id: rule.id,
      text: rule.advice,
      priority: rule.priority,
      category: rule.category
    }));
    
    // Générer résumé
    const summary = generateSummary(activeRules);
    
    log.debug(`Recommandations générées: ${recommendations.length} actives (${activeRules.filter(r => r.priority === 'high').length} critiques)`);
    
    return {
      recommendations,
      summary,
      timestamp: new Date().toISOString(),
      dataQuality: {
        daysAnalyzed: Math.min(7, nutritionData.dailyMeals?.length || 0),
        hasGarminData: !!garminData,
        hasActiveProgram: !!activeProgram
      }
    };
  } catch (error) {
    log.error('Erreur génération recommandations:', error);
    return {
      recommendations: [],
      summary: 'Erreur lors de l\'analyse. Vérifiez vos données.',
      timestamp: new Date().toISOString(),
      error: true
    };
  }
};

/**
 * Détecte les carences nutritionnelles
 * 
 * @param {Object} nutritionData - Données nutrition
 * @param {Object} activeProgram - Programme actif
 * @returns {Array} Liste des carences détectées
 */
export const detectDeficiencies = (nutritionData, activeProgram = null) => {
  const advice = generateNutritionAdvice(nutritionData, null, activeProgram);
  
  return advice.recommendations
    .filter(rec => rec.category === 'protein' || rec.category === 'macros')
    .map(rec => ({
      type: rec.category,
      message: rec.text,
      priority: rec.priority
    }));
};

// Export pour tests
export { EXPERT_RULES, prepareUserData };

