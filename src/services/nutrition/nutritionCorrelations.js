/**
 * nutritionCorrelations.js
 * 
 * Service d'analyse de corrélations multi-variables pour la nutrition
 * 
 * Implémente :
 * - Coefficient de corrélation de Pearson
 * - Test de significativité statistique (p-value)
 * - Seuils ajustés selon taille échantillon
 * - Recommandations actionnables seulement si significatif et n >= 30
 * 
 * @module services/nutrition/nutritionCorrelations
 * @see ../../../../nouvelongletnutritionplan.md Section 5.3
 */

import logger from '../../utils/logger';
import { DateHelper } from '../../utils/dateHelper';
// ✅ OPTIMISATION Phase 15.4 : Cache calculs avec hash inputs
import { 
  getNutritionCalculationCache, 
  getNutritionDataCalculationHash 
} from './nutritionCalculationCache';
// ✅ OPTIMISATION Phase 15.5 : Web Workers pour calculs lourds
import { executeInWorker } from './nutritionWorkerService';
import { NutritionConfig } from '../../config/nutrition.config';
// ✅ PHASE 15.7 : Validation limites complète avec helpers
import {
  safeDivision,
  safeSqrt,
  validateAndNormalizeNumber,
  validateCalculationResult
} from './nutritionCalculationHelpers';
import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';
import { z } from 'zod';

const log = logger.module('nutritionCorrelations');

// ==================== SCHÉMAS ZOD POUR VALIDATION ====================

/**
 * ✅ PHASE 15.7 : Schéma pour validation historique nutrition
 */
const nutritionHistorySchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  calories: z.number().nonnegative().finite().optional(),
  avgCalories: z.number().nonnegative().finite().optional(),
  protein: z.number().nonnegative().finite().optional(),
  carbs: z.number().nonnegative().finite().optional(),
  fat: z.number().nonnegative().finite().optional(),
  water: z.number().nonnegative().finite().optional(),
  complianceScore: z.number().min(0).max(100).finite().optional()
})).min(1, 'Historique nutrition doit contenir au moins 1 élément');

/**
 * ✅ PHASE 15.7 : Schéma pour validation historique poids
 */
const weightHistorySchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  weight: z.number().positive().finite().min(30).max(300) // Poids raisonnable (kg)
})).min(1, 'Historique poids doit contenir au moins 1 élément');

/**
 * ✅ PHASE 15.7 : Schéma pour validation historique performance
 */
const performanceHistorySchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  performance: z.number().nonnegative().finite(),
  // Autres champs optionnels
}).passthrough()).min(1, 'Historique performance doit contenir au moins 1 élément');

/**
 * ✅ PHASE 15.7 : Schéma pour validation historique hydratation
 */
const hydrationHistorySchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  water: z.number().nonnegative().finite().min(0).max(20000) // Hydratation raisonnable (ml)
})).min(1, 'Historique hydratation doit contenir au moins 1 élément');

/**
 * ✅ PHASE 15.7 : Schéma pour validation historique endurance
 */
const enduranceHistorySchema = z.array(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  duration: z.number().nonnegative().finite().optional(),
  distance: z.number().nonnegative().finite().optional(),
  // Autres champs optionnels
}).passthrough()).min(1, 'Historique endurance doit contenir au moins 1 élément');

// ==================== CALCUL CORRÉLATION + SIGNIFICATIVITÉ ====================

/**
 * Calcule le coefficient de corrélation de Pearson avec test de significativité
 * 
 * @param {Array<number>} arrayX - Première série de valeurs
 * @param {Array<number>} arrayY - Deuxième série de valeurs
 * @returns {Object} Résultat avec r, pValue, significativité, recommandations
 */
export const calculateCorrelation = (arrayX, arrayY) => {
  // ✅ PHASE 15.7 : Validation inputs avec Zod
  try {
    const arrayXSchema = z.array(z.number().finite()).min(1);
    const arrayYSchema = z.array(z.number().finite()).min(1);
    
    arrayXSchema.parse(arrayX);
    arrayYSchema.parse(arrayY);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn('[calculateCorrelation] Validation inputs échouée:', error.errors);
      return {
        error: 'Inputs invalides',
        recommendation: 'Vérifiez que les tableaux contiennent des nombres valides',
        actionable: false
      };
    }
    throw error;
  }
  
  const n = arrayX.length;
  
  // 1. Vérifier taille échantillon minimum
  if (n < 10) {
    return {
      error: 'Échantillon trop petit (min 10 points)',
      recommendation: 'Collectez plus de données (minimum 10 jours)',
      sampleSize: n,
      actionable: false
    };
  }
  
  // 2. Vérifier longueurs égales
  if (arrayX.length !== arrayY.length) {
    return {
      error: 'Longueurs inégales',
      recommendation: 'Les séries doivent avoir la même longueur',
      actionable: false
    };
  }
  
  // 3. Filtrer valeurs valides (pas de null/undefined/NaN)
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (
      arrayX[i] != null && 
      !isNaN(arrayX[i]) && 
      arrayY[i] != null && 
      !isNaN(arrayY[i]) &&
      isFinite(arrayX[i]) &&
      isFinite(arrayY[i])
    ) {
      validPairs.push({ x: arrayX[i], y: arrayY[i] });
    }
  }
  
  const validN = validPairs.length;
  if (validN < 10) {
    return {
      error: `Échantillon insuffisant après filtrage (${validN} points valides, min 10)`,
      recommendation: 'Collectez plus de données valides',
      sampleSize: validN,
      actionable: false
    };
  }
  
  // 4. Calculer coefficient Pearson
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
    return {
      r: 0,
      error: 'Variance nulle',
      recommendation: 'Pas de variance dans les données',
      actionable: false
    };
  }
  
  // ✅ PHASE 15.7 : Division sécurisée pour coefficient de corrélation
  const r = safeDivision(numerator, denominator, {
    operation: 'calculateCorrelation.r',
    defaultValue: 0
  });
  
  // ✅ PHASE 15.7 : Validation résultat r (doit être entre -1 et 1)
  const validatedR = validateCalculationResult(r, {
    fieldName: 'correlationCoefficient',
    operation: 'calculateCorrelation',
    min: -1,
    max: 1
  });
  
  // 5. Test significativité (t-test)
  // ✅ PHASE 15.7 : Protection division par zéro dans t-test (Math.sqrt(1 - r * r) peut être 0 si r = ±1)
  const sqrtDenominator = safeSqrt(1 - validatedR * validatedR, {
    operation: 'calculateCorrelation.t-test.denominator',
    defaultValue: 0.0001 // Éviter division par zéro (valeur très petite)
  });
  
  // ✅ PHASE 15.7 : Division sécurisée pour t-test
  const sqrtNumerator = safeSqrt(validN - 2, {
    operation: 'calculateCorrelation.t-test.numerator',
    defaultValue: 0
  });
  
  const t = safeDivision(
    validatedR * sqrtNumerator,
    sqrtDenominator,
    {
      operation: 'calculateCorrelation.t-test',
      defaultValue: 0
    }
  );
  
  const df = validN - 2; // Degrés liberté
  
  // 6. Calculer p-value (approximation t-distribution)
  // ✅ PHASE 15.7 : Validation t avant calcul p-value
  const validatedT = validateAndNormalizeNumber(Math.abs(t), {
    fieldName: 't-statistic',
    defaultValue: 0,
    min: 0
  });
  const validatedDf = validateAndNormalizeNumber(df, {
    fieldName: 'degreesOfFreedom',
    defaultValue: 1,
    min: 1
  });
  
  const pValue = calculatePValue(validatedT, validatedDf);
  
  // ✅ PHASE 15.7 : Validation p-value
  const validatedPValue = validateCalculationResult(pValue, {
    fieldName: 'pValue',
    operation: 'calculateCorrelation',
    min: 0,
    max: 1
  });
  
  // 7. Interprétation contextualisée selon n
  const strength = interpretStrength(validatedR, validN, validatedPValue);
  
  // ✅ PHASE 15.7 : Validation résultats finaux
  const finalR = validateCalculationResult(parseFloat(validatedR.toFixed(3)), {
    fieldName: 'correlationCoefficient',
    operation: 'calculateCorrelation',
    min: -1,
    max: 1
  });
  
  return {
    r: finalR,
    pValue: parseFloat(validatedPValue.toFixed(4)),
    significant: validatedPValue < 0.05,
    sampleSize: validN,
    strength: strength,
    direction: finalR > 0 ? 'positive' : 'negative',
    
    // Avertissement si échantillon faible
    warning: validN < 30 ? 
      `Échantillon petit (n=${validN}). Résultats préliminaires.` : 
      null,
    
    // Recommandation action (seulement si fiable)
    actionable: pValue < 0.05 && validN >= 30,
    recommendation: generateRecommendation(r, pValue, validN)
  };
};

/**
 * Calcule p-value (approximation t-distribution)
 * 
 * @param {number} t - Statistique t
 * @param {number} df - Degrés de liberté
 * @returns {number} p-value approximative
 */
const calculatePValue = (t, df) => {
  // Approximation simplifiée (pour df >= 10)
  if (df < 10) {
    // Table t-values pour petits df (approximation)
    if (t > 3.355) return 0.01; // df=8, 99% confiance
    if (t > 2.306) return 0.05; // df=8, 95% confiance
    if (t > 2.262) return 0.05; // df=9, 95% confiance
    if (t > 1.860) return 0.10; // df=9, 90% confiance
    return 0.20; // Non significatif
  }
  
  // Approximation pour df >= 10
  // p-value ≈ 2 * (1 - Φ(t)) où Φ est CDF normale
  if (t > 2.576) return 0.01; // 99% confiance
  if (t > 1.96) return 0.05;   // 95% confiance
  if (t > 1.645) return 0.10; // 90% confiance
  return 0.20; // Non significatif
};

/**
 * Interprète la force de la corrélation (ajustée selon n)
 * 
 * @param {number} r - Coefficient de corrélation
 * @param {number} n - Taille échantillon
 * @param {number} pValue - p-value
 * @returns {string} 'strong' | 'moderate' | 'weak' | 'negligible' | 'non_significant'
 */
const interpretStrength = (r, n, pValue) => {
  const absR = Math.abs(r);
  
  // Si non significatif, toujours "negligible"
  if (!pValue || pValue >= 0.05) {
    return 'non_significant';
  }
  
  // Ajuster seuils selon taille échantillon
  if (n < 30) {
    // Seuils plus stricts pour petits échantillons
    if (absR >= 0.7) return 'moderate'; // Pas "strong" si n < 30
    if (absR >= 0.5) return 'weak';
    return 'negligible';
  }
  
  // Seuils standards (n >= 30)
  if (absR >= 0.7) return 'strong';
  if (absR >= 0.4) return 'moderate';
  if (absR >= 0.2) return 'weak';
  return 'negligible';
};

/**
 * Génère recommandation contextualisée
 * 
 * @param {number} r - Coefficient de corrélation
 * @param {number} pValue - p-value
 * @param {number} n - Taille échantillon
 * @returns {string} Message de recommandation
 */
const generateRecommendation = (r, pValue, n) => {
  if (pValue >= 0.05) {
    return 'Corrélation non significative. Peut être due au hasard.';
  }
  
  if (n < 30) {
    return `Corrélation détectée (${n} points). Confirmez avec plus de données (minimum 30 jours recommandé).`;
  }
  
  const absR = Math.abs(r);
  if (absR >= 0.5) {
    return 'Corrélation significative et forte détectée. Utilisable pour optimisation.';
  }
  
  if (absR >= 0.3) {
    return 'Corrélation significative mais modérée. Effet présent mais limité.';
  }
  
  return 'Corrélation faible mais significative. Effet mineur.';
};

// ==================== ALIGNEMENT DONNÉES ====================

/**
 * Aligne deux séries de données par date
 * 
 * @param {Array<Object>} data1 - Première série [{date, value}, ...]
 * @param {Array<Object>} data2 - Deuxième série [{date, value}, ...]
 * @returns {Object} {x: Array<number>, y: Array<number>, dates: Array<string>}
 */
export const alignDataByDate = (data1, data2) => {
  // Créer map par date pour accès rapide
  // ✅ OPTIMISATION : Utiliser DateHelper pour garantir cohérence timezone locale
  const map1 = new Map();
  data1.forEach(item => {
    const date = DateHelper.toYYYYMMDD(item.date);
    if (date && item.value != null && !isNaN(item.value)) {
      map1.set(date, item.value);
    }
  });
  
  const map2 = new Map();
  data2.forEach(item => {
    const date = DateHelper.toYYYYMMDD(item.date);
    if (date && item.value != null && !isNaN(item.value)) {
      map2.set(date, item.value);
    }
  });
  
  // Trouver dates communes
  const commonDates = Array.from(map1.keys()).filter(date => map2.has(date));
  
  // Extraire valeurs alignées
  const x = [];
  const y = [];
  const dates = [];
  
  commonDates.forEach(date => {
    x.push(map1.get(date));
    y.push(map2.get(date));
    dates.push(date);
  });
  
  return { x, y, dates };
};

// ==================== ANALYSES SPÉCIFIQUES NUTRITION ====================

/**
 * Analyse corrélation calories vs poids (via Garmin ou données manuelles)
 * 
 * @param {Array<Object>} nutritionHistory - Historique nutrition [{date, calories}, ...]
 * @param {Array<Object>} weightHistory - Historique poids [{date, weight}, ...]
 * @returns {Object} Résultat corrélation
 */
export const analyzeCaloriesWeightCorrelation = (nutritionHistory, weightHistory) => {
  try {
    // ✅ PHASE 15.7 : Validation inputs avec Zod
    try {
      nutritionHistorySchema.parse(nutritionHistory);
      weightHistorySchema.parse(weightHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('[analyzeCaloriesWeightCorrelation] Validation inputs échouée:', error.errors);
        return {
          error: 'Données invalides',
          message: 'Les historiques doivent contenir des données valides avec dates au format YYYY-MM-DD',
          actionable: false
        };
      }
      throw error;
    }
    
    const aligned = alignDataByDate(
      nutritionHistory.map(d => ({ date: d.date, value: d.calories || d.avgCalories })),
      weightHistory.map(d => ({ date: d.date, value: d.weight }))
    );
    
    if (aligned.x.length < 10) {
      return {
        error: 'Données insuffisantes',
        message: `Seulement ${aligned.x.length} points communs (minimum 10 requis)`,
        actionable: false
      };
    }
    
    const result = calculateCorrelation(aligned.x, aligned.y);
    
    return {
      ...result,
      variable1: 'Calories',
      variable2: 'Poids',
      description: result.r > 0 
        ? 'Corrélation positive : Plus de calories → Gain de poids'
        : 'Corrélation négative : Plus de calories → Perte de poids',
      insights: generateInsights('Calories', 'Poids', result.r, result.strength, result.direction, result.sampleSize),
      actionable: result.actionable
    };
  } catch (error) {
    log.error('Erreur analyse calories vs poids:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      actionable: false
    };
  }
};

/**
 * Analyse corrélation protéines vs performance (via Garmin)
 * 
 * @param {Array<Object>} nutritionHistory - Historique nutrition [{date, protein}, ...]
 * @param {Array<Object>} performanceHistory - Historique performance [{date, performance}, ...]
 * @returns {Object} Résultat corrélation
 */
export const analyzeProteinPerformanceCorrelation = (nutritionHistory, performanceHistory) => {
  try {
    // ✅ PHASE 15.7 : Validation inputs avec Zod
    try {
      nutritionHistorySchema.parse(nutritionHistory);
      performanceHistorySchema.parse(performanceHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('[analyzeProteinPerformanceCorrelation] Validation inputs échouée:', error.errors);
        return {
          error: 'Données invalides',
          message: 'Les historiques doivent contenir des données valides avec dates au format YYYY-MM-DD',
          actionable: false
        };
      }
      throw error;
    }
    
    const aligned = alignDataByDate(
      nutritionHistory.map(d => ({ date: d.date, value: d.protein || d.avgProtein })),
      performanceHistory.map(d => ({ date: d.date, value: d.performance || d.avgPerformance }))
    );
    
    if (aligned.x.length < 10) {
      return {
        error: 'Données insuffisantes',
        message: `Seulement ${aligned.x.length} points communs (minimum 10 requis)`,
        actionable: false
      };
    }
    
    const result = calculateCorrelation(aligned.x, aligned.y);
    
    return {
      ...result,
      variable1: 'Protéines',
      variable2: 'Performance',
      description: result.r > 0 
        ? 'Corrélation positive : Plus de protéines → Meilleure performance'
        : 'Corrélation négative : Plus de protéines → Performance réduite',
      insights: generateInsights('Protéines', 'Performance', result.r, result.strength, result.direction, result.sampleSize),
      actionable: result.actionable
    };
  } catch (error) {
    log.error('Erreur analyse protéines vs performance:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      actionable: false
    };
  }
};

/**
 * Analyse corrélation hydratation vs endurance (via Garmin)
 * 
 * @param {Array<Object>} hydrationHistory - Historique hydratation [{date, water}, ...]
 * @param {Array<Object>} enduranceHistory - Historique endurance [{date, endurance}, ...]
 * @returns {Object} Résultat corrélation
 */
export const analyzeHydrationEnduranceCorrelation = (hydrationHistory, enduranceHistory) => {
  try {
    // ✅ PHASE 15.7 : Validation inputs avec Zod
    try {
      hydrationHistorySchema.parse(hydrationHistory);
      enduranceHistorySchema.parse(enduranceHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('[analyzeHydrationEnduranceCorrelation] Validation inputs échouée:', error.errors);
        return {
          error: 'Données invalides',
          message: 'Les historiques doivent contenir des données valides avec dates au format YYYY-MM-DD',
          actionable: false
        };
      }
      throw error;
    }
    
    const aligned = alignDataByDate(
      hydrationHistory.map(d => ({ date: d.date, value: d.water || d.waterIntake })),
      enduranceHistory.map(d => ({ date: d.date, value: d.endurance || d.avgEndurance }))
    );
    
    if (aligned.x.length < 10) {
      return {
        error: 'Données insuffisantes',
        message: `Seulement ${aligned.x.length} points communs (minimum 10 requis)`,
        actionable: false
      };
    }
    
    const result = calculateCorrelation(aligned.x, aligned.y);
    
    return {
      ...result,
      variable1: 'Hydratation',
      variable2: 'Endurance',
      description: result.r > 0 
        ? 'Corrélation positive : Plus d\'hydratation → Meilleure endurance'
        : 'Corrélation négative : Plus d\'hydratation → Endurance réduite',
      insights: generateInsights('Hydratation', 'Endurance', result.r, result.strength, result.direction, result.sampleSize),
      actionable: result.actionable
    };
  } catch (error) {
    log.error('Erreur analyse hydratation vs endurance:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      actionable: false
    };
  }
};

/**
 * Analyse corrélation conformité programme vs résultats
 * 
 * @param {Array<Object>} complianceHistory - Historique conformité [{date, complianceScore}, ...]
 * @param {Array<Object>} resultsHistory - Historique résultats [{date, result}, ...]
 * @returns {Object} Résultat corrélation
 */
export const analyzeComplianceResultsCorrelation = (complianceHistory, resultsHistory) => {
  try {
    // ✅ PHASE 15.7 : Validation inputs avec Zod
    // complianceHistory et resultsHistory sont des nutritionHistory (même structure)
    try {
      nutritionHistorySchema.parse(complianceHistory);
      nutritionHistorySchema.parse(resultsHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('[analyzeComplianceResultsCorrelation] Validation inputs échouée:', error.errors);
        return {
          error: 'Données invalides',
          message: 'Les historiques doivent contenir des données valides avec dates au format YYYY-MM-DD',
          actionable: false
        };
      }
      throw error;
    }
    
    const aligned = alignDataByDate(
      complianceHistory.map(d => ({ date: d.date, value: d.complianceScore || d.compliance })),
      resultsHistory.map(d => ({ date: d.date, value: d.result || d.progress }))
    );
    
    if (aligned.x.length < 10) {
      return {
        error: 'Données insuffisantes',
        message: `Seulement ${aligned.x.length} points communs (minimum 10 requis)`,
        actionable: false
      };
    }
    
    const result = calculateCorrelation(aligned.x, aligned.y);
    
    return {
      ...result,
      variable1: 'Conformité Programme',
      variable2: 'Résultats',
      description: result.r > 0 
        ? 'Corrélation positive : Meilleure conformité → Meilleurs résultats'
        : 'Corrélation négative : Meilleure conformité → Résultats réduits',
      insights: generateInsights('Conformité', 'Résultats', result.r, result.strength, result.direction, result.sampleSize),
      actionable: result.actionable
    };
  } catch (error) {
    log.error('Erreur analyse conformité vs résultats:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      actionable: false
    };
  }
};

// ==================== GÉNÉRATION INSIGHTS ====================

/**
 * Génère insights basés sur corrélation
 * 
 * @param {string} var1 - Nom variable 1
 * @param {string} var2 - Nom variable 2
 * @param {number} r - Coefficient corrélation
 * @param {string} strength - Force corrélation
 * @param {string} direction - Direction (positive/negative)
 * @param {number} n - Taille échantillon
 * @returns {Array<string>} Liste d'insights
 */
const generateInsights = (var1, var2, r, strength, direction, n) => {
  const insights = [];
  const absR = Math.abs(r);
  
  if (strength === 'non_significant') {
    insights.push(`Aucune corrélation significative détectée entre ${var1} et ${var2}.`);
    return insights;
  }
  
  if (n < 30) {
    insights.push(`Corrélation préliminaire détectée (${n} points). Collectez plus de données pour confirmation.`);
  }
  
  if (strength === 'strong' && absR >= 0.7) {
    insights.push(`Corrélation forte (r=${r.toFixed(2)}). ${var1} et ${var2} sont étroitement liés.`);
  } else if (strength === 'moderate' && absR >= 0.4) {
    insights.push(`Corrélation modérée (r=${r.toFixed(2)}). ${var1} influence ${var2} de manière notable.`);
  } else if (strength === 'weak' && absR >= 0.2) {
    insights.push(`Corrélation faible (r=${r.toFixed(2)}). ${var1} a un effet mineur sur ${var2}.`);
  }
  
  if (direction === 'positive') {
    insights.push(`Relation positive : Augmenter ${var1} tend à augmenter ${var2}.`);
  } else {
    insights.push(`Relation négative : Augmenter ${var1} tend à diminuer ${var2}.`);
  }
  
  return insights;
};

// ==================== ANALYSE MULTI-CORRÉLATIONS ====================

/**
 * Analyse toutes les corrélations nutrition disponibles
 * 
 * ✅ OPTIMISATION Phase 15.5 : Web Workers pour calculs lourds (non bloquants)
 * 
 * @param {Object} nutritionData - Données nutrition (dailyMeals, meals, etc.)
 * @param {Object} garminData - Données Garmin (activités, métriques)
 * @param {Object} options - Options d'analyse
 * @returns {Promise<Object>} Toutes les corrélations calculées
 */
export const analyzeAllNutritionCorrelations = async (nutritionData, garminData = null, options = {}) => {
  const { minDays = 10, maxDays = 90 } = options;
  
  try {
    // ✅ OPTIMISATION Phase 15.4 : Vérifier cache avant calculs coûteux
    if (NutritionConfig.features.enableCalculationCache) {
      const hash = getNutritionDataCalculationHash(nutritionData, garminData, { minDays, maxDays });
      const cache = getNutritionCalculationCache();
      const cacheKey = `correlations:${hash}`;
      
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    // ✅ OPTIMISATION Phase 15.5 : Utiliser Web Worker pour calculs lourds (non bloquants)
    // Fallback automatique vers main thread si worker non disponible
    if (NutritionConfig.features.enableWebWorkers) {
      try {
        const workerResult = await executeInWorker(
          'analyzeAllNutritionCorrelations',
          { nutritionData, garminData, options: { minDays, maxDays } },
          // Fallback : calculer dans main thread
          () => analyzeAllNutritionCorrelationsMainThread(nutritionData, garminData, options)
        );
        
        // Mettre en cache le résultat
        if (NutritionConfig.features.enableCalculationCache) {
          const hash = getNutritionDataCalculationHash(nutritionData, garminData, { minDays, maxDays });
          const cache = getNutritionCalculationCache();
          cache.set(`correlations:${hash}`, workerResult);
        }
        
        return workerResult;
      } catch (workerError) {
        log.warn('[analyzeAllNutritionCorrelations] Erreur worker, fallback main thread:', workerError);
        // Continuer avec fallback
      }
    }
    
    // Fallback : calculer dans main thread
    return analyzeAllNutritionCorrelationsMainThread(nutritionData, garminData, options);
  } catch (error) {
    log.error('Erreur analyse corrélations nutrition:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      correlations: {}
    };
  }
};

/**
 * ✅ OPTIMISATION Phase 15.5 : Version main thread (fallback)
 */
function analyzeAllNutritionCorrelationsMainThread(nutritionData, garminData = null, options = {}) {
  try {
    const { minDays = 10, maxDays = 90 } = options;
    
    const correlations = {};
    
    // Préparer données historiques
    // ✅ OPTIMISATION : Utiliser DateHelper pour garantir cohérence timezone locale
    const endDateStr = DateHelper.getTodayLocal();
    const startDateStr = DateHelper.getDaysAgoLocal(maxDays);
    
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
        correlations.caloriesWeight = analyzeCaloriesWeightCorrelation(
          dailyMeals.map(dm => ({ date: dm.date, calories: dm.dailyTotals?.calories })),
          weightHistory
        );
      }
    }
    
    // 2. Protéines vs Performance (si données performance disponibles)
    if (garminData?.activities) {
      const performanceHistory = Object.values(garminData.activities)
        .filter(a => a.performance != null)
        .map(a => ({ date: a.startTime?.split('T')[0], performance: a.performance }));
      
      if (performanceHistory.length >= minDays) {
        correlations.proteinPerformance = analyzeProteinPerformanceCorrelation(
          dailyMeals.map(dm => ({ date: dm.date, protein: dm.dailyTotals?.protein })),
          performanceHistory
        );
      }
    }
    
    // 3. Hydratation vs Endurance (si données endurance disponibles)
    if (garminData?.activities) {
      const enduranceHistory = Object.values(garminData.activities)
        .filter(a => a.endurance != null)
        .map(a => ({ date: a.startTime?.split('T')[0], endurance: a.endurance }));
      
      if (enduranceHistory.length >= minDays) {
        correlations.hydrationEndurance = analyzeHydrationEnduranceCorrelation(
          dailyMeals.map(dm => ({ date: dm.date, water: dm.dailyTotals?.waterIntake })),
          enduranceHistory
        );
      }
    }
    
    // 4. Conformité vs Résultats (si programme actif)
    const activeProgram = nutritionData.programs?.find(p => p.isActive);
    if (activeProgram) {
      const complianceHistory = dailyMeals.map(dm => ({
        date: dm.date,
        complianceScore: dm.complianceScore || 0
      }));
      
      // Utiliser progression poids comme proxy résultats
      if (garminData?.dailyMetrics) {
        const resultsHistory = Object.values(garminData.dailyMetrics)
          .filter(m => m.weight != null)
          .map(m => ({ date: m.date, result: m.weight }));
        
        if (resultsHistory.length >= minDays) {
          correlations.complianceResults = analyzeComplianceResultsCorrelation(
            complianceHistory,
            resultsHistory
          );
        }
      }
    }
    
    const result = {
      success: true,
      correlations,
      totalDays: dailyMeals.length,
      correlationsCount: Object.keys(correlations).length,
      actionableCount: Object.values(correlations).filter(c => c.actionable).length
    };
    
    // ✅ OPTIMISATION Phase 15.4 : Mettre en cache le résultat
    if (NutritionConfig.features.enableCalculationCache) {
      const hash = getNutritionDataCalculationHash(nutritionData, garminData, { minDays, maxDays });
      const cache = getNutritionCalculationCache();
      cache.set(`correlations:${hash}`, result);
    }
    
    return result;
  } catch (error) {
    log.error('[analyzeAllNutritionCorrelationsMainThread] Erreur analyse corrélations nutrition:', error);
    return {
      error: 'Erreur calcul',
      message: error.message,
      correlations: {}
    };
  }
}

