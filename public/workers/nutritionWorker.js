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

// ==================== CALCULS LOURDS (Phase 15.5) ====================

/**
 * ✅ OPTIMISATION Phase 15.5 : Calcule les statistiques agrégées (version worker)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Statistiques agrégées
 */
function calculateAggregatedStatsWorker(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Calculer moyennes sur 7, 30, 90 jours
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90
    };
    
    const stats = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      // Calculer dates (version simplifiée sans DateHelper)
      const endDate = new Date(now);
      endDate.setHours(0, 0, 0, 0);
      const endDateStr = toYYYYMMDD(endDate);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = toYYYYMMDD(startDate);
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      if (periodDailyMeals.length === 0) {
        stats[period] = {
          days: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          avgCompliance: 0,
          totalMeals: 0
        };
        return;
      }
      
      const totals = periodDailyMeals.reduce((acc, dm) => {
        const dailyTotals = dm.dailyTotals || {};
        return {
          calories: acc.calories + validateAndNormalizeNumber(dailyTotals.calories, { defaultValue: 0 }),
          protein: acc.protein + validateAndNormalizeNumber(dailyTotals.protein, { defaultValue: 0 }),
          carbs: acc.carbs + validateAndNormalizeNumber(dailyTotals.carbs, { defaultValue: 0 }),
          fat: acc.fat + validateAndNormalizeNumber(dailyTotals.fat, { defaultValue: 0 }),
          compliance: acc.compliance + validateAndNormalizeNumber(dailyTotals.complianceScore, { defaultValue: 0 }),
          meals: acc.meals + (dm.mealIds?.length || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0, meals: 0 });
      
      const daysCount = periodDailyMeals.length;
      
      stats[period] = {
        days: daysCount,
        avgCalories: Math.round(totals.calories / daysCount),
        avgProtein: Math.round((totals.protein / daysCount) * 10) / 10,
        avgCarbs: Math.round((totals.carbs / daysCount) * 10) / 10,
        avgFat: Math.round((totals.fat / daysCount) * 10) / 10,
        avgCompliance: Math.round((totals.compliance / daysCount) * 10) / 10,
        totalMeals: totals.meals,
        avgMealsPerDay: Math.round((totals.meals / daysCount) * 10) / 10
      };
    });
    
    // Statistiques globales
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const activeProgramName = activeProgram?.name || null;
    const activeProgramGoal = activeProgram?.goal || null;
    
    return {
      periods: stats,
      totalDays,
      totalMeals,
      activeProgram: activeProgramName ? {
        name: activeProgramName,
        goal: activeProgramGoal,
        hasProgram: true
      } : null
    };
  } catch (error) {
    return {
      periods: {},
      totalDays: 0,
      totalMeals: 0,
      activeProgram: null,
      error: error.message
    };
  }
}

/**
 * ✅ OPTIMISATION Phase 15.5 : Calcule corrélation de Pearson (version worker)
 * 
 * @param {Array<number>} arrayX - Première série de valeurs
 * @param {Array<number>} arrayY - Deuxième série de valeurs
 * @returns {Object} Résultat avec r, pValue, significativité
 */
function calculateCorrelationWorker(arrayX, arrayY) {
  const n = arrayX.length;
  
  if (n < 10 || arrayX.length !== arrayY.length) {
    return {
      error: n < 10 ? 'Échantillon trop petit' : 'Longueurs inégales',
      actionable: false
    };
  }
  
  // Filtrer valeurs valides
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (
      arrayX[i] != null && !isNaN(arrayX[i]) && isFinite(arrayX[i]) &&
      arrayY[i] != null && !isNaN(arrayY[i]) && isFinite(arrayY[i])
    ) {
      validPairs.push({ x: arrayX[i], y: arrayY[i] });
    }
  }
  
  const validN = validPairs.length;
  if (validN < 10) {
    return {
      error: 'Échantillon insuffisant après filtrage',
      actionable: false
    };
  }
  
  // Calculer coefficient Pearson
  const meanX = validPairs.reduce((sum, pair) => sum + pair.x, 0) / validN;
  const meanY = validPairs.reduce((sum, pair) => sum + pair.y, 0) / validN;
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (const pair of validPairs) {
    const diffX = pair.x - meanX;
    const diffY = pair.y - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) {
    return { r: 0, error: 'Variance nulle', actionable: false };
  }
  
  const r = numerator / denominator;
  
  // Test significativité (approximation)
  const t = (r * Math.sqrt(validN - 2)) / Math.sqrt(1 - r * r);
  let pValue = 0.20;
  if (t > 2.576) pValue = 0.01;
  else if (t > 1.96) pValue = 0.05;
  else if (t > 1.645) pValue = 0.10;
  
  return {
    r: parseFloat(r.toFixed(3)),
    pValue: parseFloat(pValue.toFixed(4)),
    significant: pValue < 0.05,
    sampleSize: validN,
    actionable: pValue < 0.05 && validN >= 30
  };
}

/**
 * ✅ OPTIMISATION Phase 15.5 : Analyse toutes les corrélations nutrition (version worker)
 * 
 * @param {Object} data - { nutritionData, garminData, options }
 * @returns {Object} Toutes les corrélations calculées
 */
function analyzeAllNutritionCorrelationsWorker(data) {
  const { nutritionData, garminData, options } = data;
  const { minDays = 10, maxDays = 90 } = options || {};
  
  try {
    const correlations = {};
    
    // Calculer dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);
    const endDateStr = toYYYYMMDD(endDate);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - maxDays);
    const startDateStr = toYYYYMMDD(startDate);
    
    // Filtrer dailyMeals sur période
    const dailyMeals = (nutritionData.dailyMeals || []).filter(dm => {
      return dm.date >= startDateStr && dm.date <= endDateStr;
    });
    
    if (dailyMeals.length < minDays) {
      return {
        error: 'Données insuffisantes',
        message: `Seulement ${dailyMeals.length} jours de données (minimum ${minDays} requis)`,
        correlations: {}
      };
    }
    
    // 1. Calories vs Poids (si données poids disponibles)
    if (garminData?.dailyMetrics) {
      const weightHistory = Object.values(garminData.dailyMetrics)
        .filter(m => m.weight != null)
        .map(m => ({ date: m.date, weight: m.weight }));
      
      if (weightHistory.length >= minDays) {
        const caloriesData = dailyMeals
          .map(dm => ({ date: dm.date, calories: dm.dailyTotals?.calories }))
          .filter(d => d.calories != null);
        
        // Aligner données par date
        const aligned = [];
        for (const cal of caloriesData) {
          const weight = weightHistory.find(w => w.date === cal.date);
          if (weight) {
            aligned.push({ calories: cal.calories, weight: weight.weight });
          }
        }
        
        if (aligned.length >= minDays) {
          const arrayX = aligned.map(a => a.calories);
          const arrayY = aligned.map(a => a.weight);
          correlations.caloriesWeight = calculateCorrelationWorker(arrayX, arrayY);
        }
      }
    }
    
    // 2. Protéines vs Performance (simplifié pour worker)
    if (garminData?.activities) {
      const performanceHistory = Object.values(garminData.activities)
        .filter(a => a.performance != null)
        .map(a => ({ date: a.date, performance: a.performance }));
      
      if (performanceHistory.length >= minDays) {
        const proteinData = dailyMeals
          .map(dm => ({ date: dm.date, protein: dm.dailyTotals?.protein }))
          .filter(d => d.protein != null);
        
        const aligned = [];
        for (const prot of proteinData) {
          const perf = performanceHistory.find(p => p.date === prot.date);
          if (perf) {
            aligned.push({ protein: prot.protein, performance: perf.performance });
          }
        }
        
        if (aligned.length >= minDays) {
          const arrayX = aligned.map(a => a.protein);
          const arrayY = aligned.map(a => a.performance);
          correlations.proteinPerformance = calculateCorrelationWorker(arrayX, arrayY);
        }
      }
    }
    
    return {
      success: true,
      correlations,
      totalDays: dailyMeals.length,
      correlationsCount: Object.keys(correlations).length,
      actionableCount: Object.values(correlations).filter(c => c.actionable).length
    };
  } catch (error) {
    return {
      error: 'Erreur calcul',
      message: error.message,
      correlations: {}
    };
  }
}

/**
 * ✅ OPTIMISATION Phase 15.5 : Calcule score santé global (version worker simplifiée)
 * 
 * @param {Object} data - { nutrition, workouts, garmin, gamification, muscleBalance }
 * @returns {Object} Score santé global
 */
function calculateGlobalHealthScoreWorker(data) {
  const {
    nutrition = {},
    workouts = {},
    garmin = {},
    gamification = {},
    muscleBalance = null
  } = data;
  
  // Calculer sous-scores (versions simplifiées)
  // Note: Les calculs complets sont dans nutritionHealthScore.js
  // Ici on fait une version simplifiée pour le worker
  
  // Score Nutrition (simplifié)
  const nutritionScore = 50; // Placeholder - calcul complet dans fallback
  
  // Score Workout (simplifié)
  const workoutScore = 50; // Placeholder
  
  // Score Récupération (simplifié)
  const recoveryScore = 50; // Placeholder
  
  // Score Consistance (simplifié)
  const consistencyScore = 50; // Placeholder
  
  // Score Équilibre (simplifié)
  const balanceScore = 50; // Placeholder
  
  // Score global (moyenne pondérée)
  const weights = {
    NUTRITION: 0.25,
    WORKOUT: 0.25,
    RECOVERY: 0.20,
    CONSISTENCY: 0.15,
    BALANCE: 0.15
  };
  
  const globalScore = (
    nutritionScore * weights.NUTRITION +
    workoutScore * weights.WORKOUT +
    recoveryScore * weights.RECOVERY +
    consistencyScore * weights.CONSISTENCY +
    balanceScore * weights.BALANCE
  );
  
  return {
    global: Math.round(globalScore),
    subScores: {
      nutrition: nutritionScore,
      workout: workoutScore,
      recovery: recoveryScore,
      consistency: consistencyScore,
      balance: balanceScore
    },
    trends: {},
    recommendations: []
  };
}

// ==================== MESSAGE HANDLER ====================

/**
 * Gestionnaire de messages du Web Worker
 * 
 * ✅ OPTIMISATION Phase 15.5 : Ajout calculs lourds (stats, corrélations, health score)
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
        
      // ✅ OPTIMISATION Phase 15.5 : Nouveaux calculs lourds
      case 'calculateAggregatedStats':
        result = calculateAggregatedStatsWorker(data.dailyMeals, data.meals, data.programs);
        break;
        
      case 'analyzeAllNutritionCorrelations':
        result = analyzeAllNutritionCorrelationsWorker(data);
        break;
        
      case 'calculateGlobalHealthScore':
        result = calculateGlobalHealthScoreWorker(data);
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

