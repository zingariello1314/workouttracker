/**
 * nutritionCalculations.js
 * 
 * Utilitaires de calcul pour la nutrition :
 * - Totaux journaliers (calories, macros, pourcentages)
 * - Conformité programme (écarts, scores)
 * - Bilan calorique (avec intégration Garmin)
 * - Statistiques et tendances
 * 
 * Tous les calculs sont optimisés et validés
 * 
 * @module hooks/nutritionCalculations
 */

// ==================== CALCULS TOTAUX JOURNALIERS ====================

/**
 * Calcule les totaux journaliers à partir des repas d'un jour
 * 
 * @param {Array<Object>} meals - Tableau de meals pour le jour
 * @param {Object} program - Programme actif (optionnel, pour targets)
 * @returns {Object} Totaux journaliers avec structure complète
 */
export const calculateDailyTotals = (meals = [], program = null) => {
  // Initialiser totaux
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalWater = 0;

  // Sommer tous les repas
  meals.forEach(meal => {
    totalCalories += meal.totalCalories || 0;
    totalProtein += meal.totalProtein || 0;
    totalCarbs += meal.totalCarbs || 0;
    totalFat += meal.totalFat || 0;
    
    // Eau (si présent dans meal)
    if (meal.waterIntake) {
      totalWater += meal.waterIntake;
    }
  });

  // Calculer pourcentages (basés sur calories)
  const proteinCalories = totalProtein * 4; // 4 kcal/g
  const carbsCalories = totalCarbs * 4; // 4 kcal/g
  const fatCalories = totalFat * 9; // 9 kcal/g
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  const proteinPercent = totalMacroCalories > 0 
    ? Math.round((proteinCalories / totalMacroCalories) * 100) 
    : 0;
  const carbsPercent = totalMacroCalories > 0 
    ? Math.round((carbsCalories / totalMacroCalories) * 100) 
    : 0;
  const fatPercent = totalMacroCalories > 0 
    ? Math.round((fatCalories / totalMacroCalories) * 100) 
    : 0;

  // Récupérer targets depuis programme ou valeurs par défaut
  const targetCalories = program?.targetCalories || 2500;
  const targetProtein = program?.targetProtein || 150;
  const targetCarbs = program?.targetCarbs || 300;
  const targetFat = program?.targetFat || 80;
  const targetWater = program?.targetWater || 3000; // ml

  // Calculer écarts (conformité)
  const complianceCalories = totalCalories - targetCalories;
  const complianceProtein = totalProtein - targetProtein;
  const complianceCarbs = totalCarbs - targetCarbs;
  const complianceFat = totalFat - targetFat;
  const complianceWater = totalWater - targetWater;

  return {
    // Totaux réels
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10, // 1 décimale
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    waterIntake: totalWater,

    // Pourcentages
    proteinPercent,
    carbsPercent,
    fatPercent,

    // Targets
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWater,

    // Écarts (conformité)
    complianceCalories,
    complianceProtein,
    complianceCarbs,
    complianceFat,
    complianceWater,

    // Score de conformité global (0-100)
    complianceScore: calculateComplianceScore({
      calories: { actual: totalCalories, target: targetCalories },
      protein: { actual: totalProtein, target: targetProtein },
      carbs: { actual: totalCarbs, target: targetCarbs },
      fat: { actual: totalFat, target: targetFat }
    })
  };
};

/**
 * Calcule le score de conformité (0-100) basé sur les écarts
 * 
 * @param {Object} macros - Objet avec actual/target pour chaque macro
 * @returns {number} Score de 0 à 100
 */
const calculateComplianceScore = (macros) => {
  const weights = {
    calories: 0.4,  // 40% du score
    protein: 0.3,   // 30% du score
    carbs: 0.15,    // 15% du score
    fat: 0.15       // 15% du score
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(macros).forEach(([key, { actual, target }]) => {
    if (target > 0) {
      const weight = weights[key] || 0.25;
      const ratio = actual / target;
      
      // Score basé sur proximité de la cible
      // 100% = score 100, 90-110% = score 100, <80% ou >120% = pénalité
      let score = 100;
      if (ratio < 0.8) {
        score = 100 * ratio / 0.8; // Pénalité si < 80%
      } else if (ratio > 1.2) {
        score = 100 * (1.2 / ratio); // Pénalité si > 120%
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

// ==================== CALCULS BILAN CALORIQUE ====================

/**
 * Calcule le bilan calorique d'un jour (consommé - dépensé)
 * 
 * @param {number} caloriesConsumed - Calories consommées (nutrition)
 * @param {Object} garminData - Données Garmin (optionnel)
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Object} Bilan avec classification
 */
export const calculateCaloricBalance = (caloriesConsumed, garminData = null, date = null) => {
  // Récupérer calories dépensées depuis Garmin
  let caloriesBurned = 0;
  
  if (garminData && garminData.dailyMetrics && date) {
    const metrics = garminData.dailyMetrics[date];
    if (metrics && metrics.calories) {
      caloriesBurned = metrics.calories.total || metrics.calories || 0;
    }
  }

  // Si pas de données Garmin, estimation basique (TDEE approximatif)
  if (caloriesBurned === 0) {
    // Estimation basique : 2000 kcal/jour (sera remplacé par calcul TDEE réel)
    caloriesBurned = 2000;
  }

  // Bilan = consommé - dépensé
  const balance = caloriesConsumed - caloriesBurned;

  // Classification
  const classification = getBalanceClassification(balance);

  return {
    consumed: Math.round(caloriesConsumed),
    burned: Math.round(caloriesBurned),
    balance: Math.round(balance),
    classification, // 'surplus' | 'maintien' | 'deficit'
    percent: caloriesBurned > 0 
      ? Math.round((balance / caloriesBurned) * 100) 
      : 0
  };
};

/**
 * Classifie le bilan calorique
 * 
 * @param {number} balance - Bilan (consommé - dépensé)
 * @returns {string} 'surplus' | 'maintien' | 'deficit'
 */
export const getBalanceClassification = (balance) => {
  // Seuils : ±200 kcal = maintien
  if (balance > 200) return 'surplus';
  if (balance < -200) return 'deficit';
  return 'maintien';
};

// ==================== CALCULS CONFORMITÉ PROGRAMME ====================

/**
 * Calcule la conformité à un programme sur une plage de dates
 * 
 * @param {string} programId - ID du programme
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {Object} program - Programme avec targets
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Statistiques de conformité
 */
export const calculateProgramCompliance = (programId, dailyMeals, program, startDate, endDate) => {
  if (!program || !dailyMeals || dailyMeals.length === 0) {
    return {
      daysTotal: 0,
      daysWithData: 0,
      avgComplianceScore: 0,
      caloriesCompliance: { avg: 0, days: 0 },
      proteinCompliance: { avg: 0, days: 0 },
      carbsCompliance: { avg: 0, days: 0 },
      fatCompliance: { avg: 0, days: 0 }
    };
  }

  // Filtrer dailyMeals dans la plage et pour ce programme
  const filteredMeals = dailyMeals.filter(dm => {
    const inRange = dm.date >= startDate && dm.date <= endDate;
    const correctProgram = !programId || dm.programId === programId;
    return inRange && correctProgram;
  });

  if (filteredMeals.length === 0) {
    return {
      daysTotal: 0,
      daysWithData: 0,
      avgComplianceScore: 0,
      caloriesCompliance: { avg: 0, days: 0 },
      proteinCompliance: { avg: 0, days: 0 },
      carbsCompliance: { avg: 0, days: 0 },
      fatCompliance: { avg: 0, days: 0 }
    };
  }

  // Calculer statistiques
  let totalComplianceScore = 0;
  let totalCaloriesCompliance = 0;
  let totalProteinCompliance = 0;
  let totalCarbsCompliance = 0;
  let totalFatCompliance = 0;
  let daysWithData = 0;

  filteredMeals.forEach(dm => {
    if (dm.dailyTotals) {
      daysWithData++;
      
      totalComplianceScore += dm.dailyTotals.complianceScore || 0;
      totalCaloriesCompliance += dm.dailyTotals.complianceCalories || 0;
      totalProteinCompliance += dm.dailyTotals.complianceProtein || 0;
      totalCarbsCompliance += dm.dailyTotals.complianceCarbs || 0;
      totalFatCompliance += dm.dailyTotals.complianceFat || 0;
    }
  });

  const avgComplianceScore = daysWithData > 0 
    ? Math.round(totalComplianceScore / daysWithData) 
    : 0;

  return {
    daysTotal: filteredMeals.length,
    daysWithData,
    avgComplianceScore,
    caloriesCompliance: {
      avg: daysWithData > 0 ? Math.round(totalCaloriesCompliance / daysWithData) : 0,
      days: daysWithData
    },
    proteinCompliance: {
      avg: daysWithData > 0 ? Math.round(totalProteinCompliance / daysWithData * 10) / 10 : 0,
      days: daysWithData
    },
    carbsCompliance: {
      avg: daysWithData > 0 ? Math.round(totalCarbsCompliance / daysWithData * 10) / 10 : 0,
      days: daysWithData
    },
    fatCompliance: {
      avg: daysWithData > 0 ? Math.round(totalFatCompliance / daysWithData * 10) / 10 : 0,
      days: daysWithData
    }
  };
};

// ==================== CALCULS STATISTIQUES ====================

/**
 * Calcule les statistiques nutritionnelles sur une plage de dates
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Statistiques complètes
 */
export const getNutritionStats = (dailyMeals = [], startDate, endDate) => {
  // Filtrer dans la plage
  const filtered = dailyMeals.filter(dm => 
    dm.date >= startDate && dm.date <= endDate && dm.dailyTotals
  );

  if (filtered.length === 0) {
    return {
      days: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      totalCalories: 0,
      variability: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
  }

  // Calculer moyennes
  const totals = filtered.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += dt.calories || 0;
    acc.protein += dt.protein || 0;
    acc.carbs += dt.carbs || 0;
    acc.fat += dt.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const days = filtered.length;
  const avgCalories = Math.round(totals.calories / days);
  const avgProtein = Math.round((totals.protein / days) * 10) / 10;
  const avgCarbs = Math.round((totals.carbs / days) * 10) / 10;
  const avgFat = Math.round((totals.fat / days) * 10) / 10;

  // Calculer variabilité (écart-type)
  const variability = calculateVariability(filtered);

  return {
    days,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    totalCalories: totals.calories,
    variability
  };
};

/**
 * Calcule la variabilité (écart-type) des macros
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @returns {Object} Variabilité pour chaque macro
 */
const calculateVariability = (dailyMeals) => {
  if (dailyMeals.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // Calculer moyennes
  const means = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += dt.calories || 0;
    acc.protein += dt.protein || 0;
    acc.carbs += dt.carbs || 0;
    acc.fat += dt.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const n = dailyMeals.length;
  means.calories /= n;
  means.protein /= n;
  means.carbs /= n;
  means.fat /= n;

  // Calculer variance
  const variances = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.calories += Math.pow((dt.calories || 0) - means.calories, 2);
    acc.protein += Math.pow((dt.protein || 0) - means.protein, 2);
    acc.carbs += Math.pow((dt.carbs || 0) - means.carbs, 2);
    acc.fat += Math.pow((dt.fat || 0) - means.fat, 2);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Écart-type = sqrt(variance / n)
  return {
    calories: Math.round(Math.sqrt(variances.calories / n)),
    protein: Math.round((Math.sqrt(variances.protein / n)) * 10) / 10,
    carbs: Math.round((Math.sqrt(variances.carbs / n)) * 10) / 10,
    fat: Math.round((Math.sqrt(variances.fat / n)) * 10) / 10
  };
};

/**
 * Calcule la distribution des macros sur une période
 * 
 * @param {Array<Object>} dailyMeals - Tableau de dailyMeals
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Object} Distribution moyenne des macros
 */
export const getMacroDistribution = (dailyMeals = [], startDate, endDate) => {
  const filtered = dailyMeals.filter(dm => 
    dm.date >= startDate && dm.date <= endDate && dm.dailyTotals
  );

  if (filtered.length === 0) {
    return {
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  const totals = filtered.reduce((acc, dm) => {
    const dt = dm.dailyTotals;
    acc.protein += dt.proteinPercent || 0;
    acc.carbs += dt.carbsPercent || 0;
    acc.fat += dt.fatPercent || 0;
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });

  const n = filtered.length;
  return {
    protein: Math.round(totals.protein / n),
    carbs: Math.round(totals.carbs / n),
    fat: Math.round(totals.fat / n)
  };
};

// ==================== HELPERS ====================

/**
 * Génère un ID unique pour un meal
 * 
 * @returns {string} ID au format "meal_<timestamp>"
 */
export const generateMealId = () => {
  return `meal_${Date.now()}`;
};

/**
 * Génère un ID unique pour un program
 * 
 * @returns {string} ID au format "prog_<timestamp>"
 */
export const generateProgramId = () => {
  return `prog_${Date.now()}`;
};

/**
 * Génère un ID unique pour un favoriteFood
 * 
 * @returns {string} ID au format "food_fav_<timestamp>"
 */
export const generateFavoriteFoodId = () => {
  return `food_fav_${Date.now()}`;
};

/**
 * Formate une date au format "YYYY-MM-DD"
 * 
 * @param {Date|string} date - Date à formater
 * @returns {string} Date formatée
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calcule le nombre de jours entre deux dates
 * 
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {number} Nombre de jours
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

