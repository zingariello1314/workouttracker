/**
 * nutritionWorker.js
 * 
 * ✅ OPTIMISATION : Web Worker pour calculs nutrition lourds (non bloquants)
 * 
 * Ce worker exécute les calculs lourds dans un thread séparé,
 * permettant de garder l'UI responsive pendant les calculs.
 * 
 * Calculs supportés :
 * - calculateDailyTotals (batch)
 * - getNutritionStats (statistiques sur grandes plages)
 * - calculateProgramCompliance (conformité sur période)
 * - processDataForAnalysis (analyse complète période)
 * 
 * @module workers/nutritionWorker
 */

// ==================== IMPORTS (Web Workers supportent importScripts) ====================

// Note : Les Web Workers ne peuvent pas utiliser import/export ES6 directement
// On doit utiliser importScripts() ou bundler qui supporte workers (Vite le fait)

// ==================== HELPERS ====================

/**
 * Valide et normalise un nombre
 */
function validateAndNormalizeNumber(value, options = {}) {
  const { defaultValue = 0, min = -Infinity, max = Infinity } = options;
  
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, num));
}

/**
 * Division sécurisée (évite division par zéro)
 */
function safeDivision(numerator, denominator, defaultValue = 0) {
  if (!denominator || denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
    return defaultValue;
  }
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? defaultValue : result;
}

/**
 * Convertit date en format YYYY-MM-DD
 */
function toYYYYMMDD(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convertit YYYY-MM-DD en Date
 */
function fromYYYYMMDD(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return isNaN(date.getTime()) ? null : date;
}

// ==================== CALCULS ====================

/**
 * Calcule les totaux journaliers pour un jour
 */
function calculateDailyTotalsSingle(meals = [], program = null) {
  // Valeurs par défaut
  const defaults = {
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWater: 3000
  };
  
  // Extraire targets depuis programme
  const targetCalories = validateAndNormalizeNumber(
    program?.targetCalories || defaults.targetCalories,
    { defaultValue: defaults.targetCalories, min: 0, max: 50000 }
  );
  const targetProtein = validateAndNormalizeNumber(
    program?.targetProtein || defaults.targetProtein,
    { defaultValue: defaults.targetProtein, min: 0, max: 2000 }
  );
  const targetCarbs = validateAndNormalizeNumber(
    program?.targetCarbs || defaults.targetCarbs,
    { defaultValue: defaults.targetCarbs, min: 0, max: 5000 }
  );
  const targetFat = validateAndNormalizeNumber(
    program?.targetFat || defaults.targetFat,
    { defaultValue: defaults.targetFat, min: 0, max: 2000 }
  );
  const targetWater = validateAndNormalizeNumber(
    program?.targetWater || defaults.targetWater,
    { defaultValue: defaults.targetWater, min: 0, max: 50000 }
  );
  
  // Initialiser totaux
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalWater = 0;
  
  // Sommer tous les repas
  meals.forEach(meal => {
    totalCalories += validateAndNormalizeNumber(meal.totalCalories, { defaultValue: 0, min: 0 });
    totalProtein += validateAndNormalizeNumber(meal.totalProtein, { defaultValue: 0, min: 0 });
    totalCarbs += validateAndNormalizeNumber(meal.totalCarbs, { defaultValue: 0, min: 0 });
    totalFat += validateAndNormalizeNumber(meal.totalFat, { defaultValue: 0, min: 0 });
    totalWater += validateAndNormalizeNumber(meal.totalWater, { defaultValue: 0, min: 0 });
  });
  
  // Calculer pourcentages macros
  const totalMacroCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
  const proteinPercent = safeDivision(totalProtein * 4, totalMacroCalories, 0) * 100;
  const carbsPercent = safeDivision(totalCarbs * 4, totalMacroCalories, 0) * 100;
  const fatPercent = safeDivision(totalFat * 9, totalMacroCalories, 0) * 100;
  
  // Calculer conformité
  const complianceCalories = totalCalories - targetCalories;
  const complianceProtein = totalProtein - targetProtein;
  const complianceCarbs = totalCarbs - targetCarbs;
  const complianceFat = totalFat - targetFat;
  const complianceWater = totalWater - targetWater;
  
  // Calculer score de conformité (0-100)
  const caloriesRatio = safeDivision(totalCalories, targetCalories, 0);
  const proteinRatio = safeDivision(totalProtein, targetProtein, 0);
  const carbsRatio = safeDivision(totalCarbs, targetCarbs, 0);
  const fatRatio = safeDivision(totalFat, targetFat, 0);
  
  // Poids pour chaque macro (depuis config)
  const caloriesWeight = 0.4;
  const proteinWeight = 0.3;
  const carbsWeight = 0.15;
  const fatWeight = 0.15;
  
  // Score par macro (0-100)
  const caloriesScore = Math.min(100, caloriesRatio * 100);
  const proteinScore = Math.min(100, proteinRatio * 100);
  const carbsScore = Math.min(100, carbsRatio * 100);
  const fatScore = Math.min(100, fatRatio * 100);
  
  // Score pondéré
  const complianceScore = Math.round(
    caloriesScore * caloriesWeight +
    proteinScore * proteinWeight +
    carbsScore * carbsWeight +
    fatScore * fatWeight
  );
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    waterIntake: Math.round(totalWater),
    proteinPercent: Math.round(proteinPercent * 10) / 10,
    carbsPercent: Math.round(carbsPercent * 10) / 10,
    fatPercent: Math.round(fatPercent * 10) / 10,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWater,
    complianceCalories: Math.round(complianceCalories),
    complianceProtein: Math.round(complianceProtein * 10) / 10,
    complianceCarbs: Math.round(complianceCarbs * 10) / 10,
    complianceFat: Math.round(complianceFat * 10) / 10,
    complianceWater: Math.round(complianceWater),
    complianceScore
  };
}

/**
 * Calcule les totaux journaliers pour plusieurs jours (batch)
 */
function calculateDailyTotalsBatch(mealsByDate, program) {
  const results = {};
  
  for (const [date, meals] of Object.entries(mealsByDate)) {
    results[date] = calculateDailyTotalsSingle(meals, program);
  }
  
  return results;
}

/**
 * Calcule les statistiques nutrition sur une période
 */
function getNutritionStats(dailyMeals = [], startDate, endDate) {
  if (!Array.isArray(dailyMeals) || dailyMeals.length === 0) {
    return {
      totalDays: 0,
      daysWithMeals: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      avgWater: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalWater: 0
    };
  }
  
  // Filtrer par plage de dates
  let filteredMeals = dailyMeals;
  if (startDate && endDate) {
    filteredMeals = dailyMeals.filter(dm => {
      if (!dm || !dm.date) return false;
      return dm.date >= startDate && dm.date <= endDate;
    });
  }
  
  if (filteredMeals.length === 0) {
    return {
      totalDays: 0,
      daysWithMeals: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      avgWater: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalWater: 0
    };
  }
  
  // Calculer totaux
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalWater = 0;
  let daysWithMeals = 0;
  
  filteredMeals.forEach(dm => {
    if (dm.dailyTotals) {
      daysWithMeals++;
      totalCalories += validateAndNormalizeNumber(dm.dailyTotals.calories, { defaultValue: 0 });
      totalProtein += validateAndNormalizeNumber(dm.dailyTotals.protein, { defaultValue: 0 });
      totalCarbs += validateAndNormalizeNumber(dm.dailyTotals.carbs, { defaultValue: 0 });
      totalFat += validateAndNormalizeNumber(dm.dailyTotals.fat, { defaultValue: 0 });
      totalWater += validateAndNormalizeNumber(dm.dailyTotals.waterIntake, { defaultValue: 0 });
    }
  });
  
  const daysCount = Math.max(1, daysWithMeals);
  
  return {
    totalDays: filteredMeals.length,
    daysWithMeals,
    avgCalories: Math.round(totalCalories / daysCount),
    avgProtein: Math.round((totalProtein / daysCount) * 10) / 10,
    avgCarbs: Math.round((totalCarbs / daysCount) * 10) / 10,
    avgFat: Math.round((totalFat / daysCount) * 10) / 10,
    avgWater: Math.round(totalWater / daysCount),
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalWater: Math.round(totalWater)
  };
}

/**
 * Traite les données pour analyse complète (utilisé dans NutritionAnalyses)
 */
function processDataForAnalysis(data) {
  const { dailyMeals, allMeals, program, garminMap, startDate, endDate } = data;
  
  // Créer map des meals par date
  const mealsByDate = {};
  if (allMeals && Array.isArray(allMeals)) {
    allMeals.forEach(meal => {
      if (meal.date) {
        if (!mealsByDate[meal.date]) {
          mealsByDate[meal.date] = [];
        }
        mealsByDate[meal.date].push(meal);
      }
    });
  }
  
  // Traiter chaque jour
  const dailyData = [];
  const stats = {
    totalDays: 0,
    daysWithMeals: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalWater: 0,
    avgCompliance: 0,
    complianceScores: []
  };
  
  // Parcourir chaque jour de la période
  const start = fromYYYYMMDD(startDate);
  const end = fromYYYYMMDD(endDate);
  if (!start || !end) {
    return { dailyData: [], stats };
  }
  
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = toYYYYMMDD(currentDate);
    if (!dateStr) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    const dailyMeal = dailyMeals.find(dm => dm.date === dateStr);
    const meals = mealsByDate[dateStr] || [];
    
    // Calculer totaux
    const totals = calculateDailyTotalsSingle(meals, program);
    
    // Récupérer données Garmin
    const garminMetric = garminMap && garminMap[dateStr] ? garminMap[dateStr] : null;
    const caloriesBurned = garminMetric?.calories || null;
    const caloricBalance = caloriesBurned ? totals.calories - caloriesBurned : null;
    
    const hasData = dailyMeal || meals.length > 0;
    
    if (hasData) {
      stats.daysWithMeals++;
      stats.totalCalories += totals.calories;
      stats.totalProtein += totals.protein;
      stats.totalCarbs += totals.carbs;
      stats.totalFat += totals.fat;
      stats.totalWater += totals.waterIntake;
      stats.complianceScores.push(totals.complianceScore);
    }
    
    dailyData.push({
      date: dateStr,
      ...totals,
      caloriesBurned,
      caloricBalance,
      hasData
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculer moyennes
  const daysCount = Math.max(1, stats.daysWithMeals);
  stats.avgCompliance = stats.complianceScores.length > 0
    ? Math.round(stats.complianceScores.reduce((a, b) => a + b, 0) / stats.complianceScores.length)
    : 0;
  stats.totalDays = dailyData.length;
  
  return { dailyData, stats };
}

// ==================== MESSAGE HANDLER ====================

/**
 * Gestionnaire de messages du Web Worker
 */
self.onmessage = function(e) {
  const { type, id, data } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateDailyTotalsBatch':
        result = calculateDailyTotalsBatch(data.mealsByDate, data.program);
        break;
        
      case 'getNutritionStats':
        result = getNutritionStats(data.dailyMeals, data.startDate, data.endDate);
        break;
        
      case 'processDataForAnalysis':
        result = processDataForAnalysis(data);
        break;
        
      default:
        throw new Error(`Type de calcul non supporté: ${type}`);
    }
    
    // Envoyer résultat
    self.postMessage({
      type: 'success',
      id,
      result
    });
  } catch (error) {
    // Envoyer erreur
    self.postMessage({
      type: 'error',
      id,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};

// Message de confirmation que le worker est prêt
self.postMessage({ type: 'ready' });

