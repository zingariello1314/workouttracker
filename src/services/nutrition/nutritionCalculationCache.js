/**
 * nutritionCalculationCache.js
 * 
 * ✅ OPTIMISATION : Cache intelligent pour calculs nutrition avec hash des inputs
 * 
 * Évite les recalculs inutiles en mémorisant les résultats des calculs coûteux
 * basés sur un hash des inputs. Utilise une stratégie LRU pour limiter la taille.
 * 
 * Impact attendu : Économie 80-95% sur recalculs identiques
 * 
 * @module services/nutrition/nutritionCalculationCache
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 1.3
 */

import logger from '../../utils/logger';

const log = logger.module('nutritionCalculationCache');

// ✅ OPTIMISATION : Utiliser configuration centralisée
import { NutritionConfig } from '../../config/nutrition.config';

/**
 * Configuration par défaut
 * 
 * ✅ OPTIMISATION : Utiliser valeurs depuis configuration centralisée
 */
const DEFAULT_CONFIG = {
  // Limite maximale d'entrées dans le cache (LRU)
  maxSize: NutritionConfig.cache.calculationCacheMaxSize,
  
  // Si true, log les hits/misses (défaut: false pour réduire spam)
  verbose: false
};

/**
 * Génère un hash rapide depuis une chaîne
 * 
 * ✅ OPTIMISATION Phase 15.4 : Hash simple mais efficace (plus rapide que MD5/SHA)
 * Basé sur l'algorithme djb2 (Daniel J. Bernstein)
 * 
 * @param {string} str - Chaîne à hasher
 * @returns {string} Hash en base 36 (alphanumérique)
 */
export function generateHash(str) {
  if (!str || typeof str !== 'string') {
    return '0';
  }
  
  let hash = 5381; // djb2 seed
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Génère un hash des inputs pour un calcul nutrition
 * 
 * ✅ OPTIMISATION Phase 15.4 : Hash seulement les champs essentiels (évite hash trop lourd)
 * 
 * @param {Array<Object>} meals - Tableau de meals
 * @param {Object|null} program - Programme actif (optionnel)
 * @returns {string} Hash des inputs
 */
function generateInputsHash(meals = [], program = null) {
  try {
    // ✅ OPTIMISATION : Extraire seulement les champs essentiels pour le hash
    // Évite de hasher tout l'objet (plus rapide, moins de mémoire)
    const mealsHash = (meals || []).map(meal => ({
      id: meal.id || null,
      calories: meal.totalCalories || 0,
      protein: meal.totalProtein || 0,
      carbs: meal.totalCarbs || 0,
      fat: meal.totalFat || 0,
      water: meal.waterIntake || 0
    }));
    
    const programHash = program ? {
      calories: program.targetCalories || null,
      protein: program.targetProtein || null,
      carbs: program.targetCarbs || null,
      fat: program.targetFat || null,
      water: program.targetWater || null
    } : null;
    
    // ✅ OPTIMISATION : JSON.stringify avec sort_keys pour cohérence
    // Même si ordre des meals change, hash reste identique
    const hashInput = {
      meals: mealsHash.sort((a, b) => (a.id || '').localeCompare(b.id || '')),
      program: programHash
    };
    
    const hashStr = JSON.stringify(hashInput);
    return generateHash(hashStr);
  } catch (error) {
    log.warn('[generateInputsHash] Erreur génération hash, fallback:', error);
    // Fallback : hash simple avec longueur
    return generateHash(`${meals?.length || 0}_${program?.id || 'null'}`);
  }
}

/**
 * ✅ OPTIMISATION Phase 15.4 : Génère un hash pour calculs avec dailyMeals
 * 
 * @param {Array<Object>} dailyMeals - Liste des dailyMeals
 * @param {Array<Object>} meals - Liste de tous les repas (optionnel)
 * @param {Array<Object>} programs - Liste des programmes (optionnel)
 * @param {Object} options - Options additionnelles (minDays, maxDays, etc.)
 * @returns {string} Hash des inputs
 */
function generateDailyMealsHash(dailyMeals = [], meals = [], programs = [], options = {}) {
  try {
    // ✅ OPTIMISATION : Extraire seulement les champs essentiels pour le hash
    const dailyMealsHash = (dailyMeals || []).map(dm => ({
      date: dm.date || null,
      calories: dm.dailyTotals?.calories || 0,
      protein: dm.dailyTotals?.protein || 0,
      carbs: dm.dailyTotals?.carbs || 0,
      fat: dm.dailyTotals?.fat || 0,
      compliance: dm.dailyTotals?.complianceScore || 0,
      mealCount: dm.mealIds?.length || 0
    }));
    
    const activeProgram = (programs || []).find(p => p.isActive);
    const programHash = activeProgram ? {
      id: activeProgram.id || null,
      goal: activeProgram.goal || null
    } : null;
    
    const hashInput = {
      dailyMeals: dailyMealsHash.sort((a, b) => (a.date || '').localeCompare(b.date || '')),
      mealsCount: (meals || []).length,
      program: programHash,
      options: options || {}
    };
    
    const hashStr = JSON.stringify(hashInput);
    return generateHash(hashStr);
  } catch (error) {
    log.warn('[generateDailyMealsHash] Erreur génération hash, fallback:', error);
    return generateHash(`${dailyMeals?.length || 0}_${meals?.length || 0}_${options?.minDays || 0}_${options?.maxDays || 0}`);
  }
}

/**
 * ✅ OPTIMISATION Phase 15.4 : Génère un hash pour calculs avec nutritionData + garminData
 * 
 * @param {Object} nutritionData - Données nutrition (dailyMeals, meals, etc.)
 * @param {Object} garminData - Données Garmin (optionnel)
 * @param {Object} options - Options additionnelles
 * @returns {string} Hash des inputs
 */
function generateNutritionDataHash(nutritionData = {}, garminData = null, options = {}) {
  try {
    const dailyMeals = nutritionData.dailyMeals || [];
    const meals = nutritionData.meals || [];
    const programs = nutritionData.programs || [];
    
    // ✅ OPTIMISATION : Hash seulement les métadonnées essentielles
    const garminHash = garminData ? {
      activitiesCount: Object.keys(garminData.activities || {}).length,
      metricsCount: Object.keys(garminData.dailyMetrics || {}).length,
      hasWeight: Object.values(garminData.dailyMetrics || {}).some(m => m.weight != null),
      hasPerformance: Object.values(garminData.dailyMetrics || {}).some(m => m.performance != null)
    } : null;
    
    const hashInput = {
      dailyMealsCount: dailyMeals.length,
      mealsCount: meals.length,
      programsCount: programs.length,
      activeProgramId: programs.find(p => p.isActive)?.id || null,
      garmin: garminHash,
      options: options || {}
    };
    
    const hashStr = JSON.stringify(hashInput);
    return generateHash(hashStr);
  } catch (error) {
    log.warn('[generateNutritionDataHash] Erreur génération hash, fallback:', error);
    return generateHash(`${nutritionData?.dailyMeals?.length || 0}_${nutritionData?.meals?.length || 0}_${garminData ? 'garmin' : 'no_garmin'}`);
  }
}

/**
 * Cache LRU pour calculs nutrition
 * 
 * ✅ OPTIMISATION : Utilise Map avec ordre d'insertion (LRU natif)
 */
class NutritionCalculationCache {
  constructor(config = {}) {
    const { maxSize = DEFAULT_CONFIG.maxSize, verbose = DEFAULT_CONFIG.verbose } = config;
    
    this.cache = new Map(); // Hash → { result, timestamp }
    this.maxSize = maxSize;
    this.verbose = verbose;
    
    // Statistiques (optionnel, pour monitoring)
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Récupère un résultat depuis le cache
   * 
   * ✅ OPTIMISATION Phase 15.4 : Support préfixe pour différencier types de calculs
   * 
   * @param {string} hash - Hash des inputs (peut inclure préfixe "type:hash")
   * @returns {*|null} Résultat en cache ou null
   */
  get(hash) {
    if (!hash || typeof hash !== 'string') {
      return null;
    }
    
    // ✅ OPTIMISATION Phase 15.4 : Vérifier si cache activé
    if (!NutritionConfig.features.enableCalculationCache) {
      return null;
    }
    
    if (this.cache.has(hash)) {
      // ✅ OPTIMISATION : Move to end (LRU - most recently used)
      const entry = this.cache.get(hash);
      this.cache.delete(hash);
      this.cache.set(hash, entry);
      
      this.stats.hits++;
      if (this.verbose) {
        log.debug(`[NutritionCalculationCache] Cache hit: ${hash.substring(0, 20)}...`);
      }
      
      return entry.result;
    }
    
    this.stats.misses++;
    if (this.verbose) {
      log.debug(`[NutritionCalculationCache] Cache miss: ${hash.substring(0, 20)}...`);
    }
    
    return null;
  }

  /**
   * Met un résultat dans le cache
   * 
   * ✅ OPTIMISATION Phase 15.4 : Vérification cache activé
   * 
   * @param {string} hash - Hash des inputs (peut inclure préfixe "type:hash")
   * @param {*} result - Résultat à mettre en cache
   */
  set(hash, result) {
    if (!hash || typeof hash !== 'string') {
      return;
    }
    
    // ✅ OPTIMISATION Phase 15.4 : Vérifier si cache activé
    if (!NutritionConfig.features.enableCalculationCache) {
      return;
    }
    
    // ✅ OPTIMISATION : LRU - Si cache plein, supprimer entrée la plus ancienne
    if (this.cache.size >= this.maxSize) {
      // Map itère dans l'ordre d'insertion, donc first key = oldest
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
      
      if (this.verbose) {
        log.debug(`[NutritionCalculationCache] Eviction: ${firstKey.substring(0, 20)}... (cache plein)`);
      }
    }
    
    // ✅ OPTIMISATION : Stocker avec timestamp pour monitoring (optionnel)
    this.cache.set(hash, {
      result,
      timestamp: Date.now()
    });
    
    if (this.verbose) {
      log.debug(`[NutritionCalculationCache] Cached: ${hash.substring(0, 20)}... (size: ${this.cache.size}/${this.maxSize})`);
    }
  }

  /**
   * Invalide une entrée spécifique
   * 
   * @param {string} hash - Hash à invalider
   */
  invalidate(hash) {
    if (this.cache.delete(hash)) {
      if (this.verbose) {
        log.debug(`[NutritionCalculationCache] Invalidated: ${hash}`);
      }
    }
  }

  /**
   * Vide tout le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    
    if (this.verbose) {
      log.debug(`[NutritionCalculationCache] Cleared (${size} entries)`);
    }
  }

  /**
   * Retourne les statistiques du cache
   * 
   * @returns {Object} Statistiques (hits, misses, evictions, size, hitRate)
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`
    };
  }
}

// ✅ OPTIMISATION : Singleton global (un seul cache pour toute l'application)
let globalCache = null;

/**
 * Récupère l'instance globale du cache
 * 
 * @param {Object} config - Configuration (optionnel, utilisé seulement à la première création)
 * @returns {NutritionCalculationCache} Instance du cache
 */
export function getNutritionCalculationCache(config = {}) {
  if (!globalCache) {
    globalCache = new NutritionCalculationCache(config);
  }
  return globalCache;
}

/**
 * Génère un hash des inputs pour un calcul
 * 
 * @param {Array<Object>} meals - Tableau de meals
 * @param {Object|null} program - Programme actif (optionnel)
 * @returns {string} Hash des inputs
 */
export function getCalculationHash(meals = [], program = null) {
  return generateInputsHash(meals, program);
}

/**
 * ✅ OPTIMISATION Phase 15.4 : Génère un hash pour calculs avec dailyMeals
 * 
 * @param {Array<Object>} dailyMeals - Liste des dailyMeals
 * @param {Array<Object>} meals - Liste de tous les repas (optionnel)
 * @param {Array<Object>} programs - Liste des programmes (optionnel)
 * @param {Object} options - Options additionnelles (minDays, maxDays, etc.)
 * @returns {string} Hash des inputs
 */
export function getDailyMealsCalculationHash(dailyMeals = [], meals = [], programs = [], options = {}) {
  return generateDailyMealsHash(dailyMeals, meals, programs, options);
}

/**
 * ✅ OPTIMISATION Phase 15.4 : Génère un hash pour calculs avec nutritionData + garminData
 * 
 * @param {Object} nutritionData - Données nutrition (dailyMeals, meals, etc.)
 * @param {Object} garminData - Données Garmin (optionnel)
 * @param {Object} options - Options additionnelles
 * @returns {string} Hash des inputs
 */
export function getNutritionDataCalculationHash(nutritionData = {}, garminData = null, options = {}) {
  return generateNutritionDataHash(nutritionData, garminData, options);
}

/**
 * Wrapper pour exécuter un calcul avec cache
 * 
 * ✅ OPTIMISATION Phase 15.4 : Fonction utilitaire générique pour faciliter l'utilisation
 * 
 * @param {Function} calculationFn - Fonction de calcul à exécuter
 * @param {Array<Object>} meals - Tableau de meals
 * @param {Object|null} program - Programme actif (optionnel)
 * @returns {*} Résultat du calcul (depuis cache ou nouveau calcul)
 */
export function executeWithCache(calculationFn, meals = [], program = null) {
  const cache = getNutritionCalculationCache();
  const hash = generateInputsHash(meals, program);
  
  // Vérifier cache
  const cached = cache.get(hash);
  if (cached !== null) {
    return cached;
  }
  
  // Calculer
  const result = calculationFn(meals, program);
  
  // Mettre en cache
  cache.set(hash, result);
  
  return result;
}

/**
 * ✅ OPTIMISATION Phase 15.4 : Wrapper générique pour exécuter un calcul avec cache (préfixe personnalisé)
 * 
 * @param {string} calculationType - Type de calcul (ex: 'dailyTotals', 'aggregatedStats', 'correlations', 'healthScore')
 * @param {Function} calculationFn - Fonction de calcul à exécuter
 * @param {*} inputs - Inputs du calcul (peuvent être de n'importe quel type)
 * @param {Function} hashGenerator - Fonction pour générer le hash des inputs
 * @returns {*} Résultat du calcul (depuis cache ou nouveau calcul)
 */
export function executeWithCacheGeneric(calculationType, calculationFn, inputs, hashGenerator) {
  if (!NutritionConfig.features.enableCalculationCache) {
    // Cache désactivé, exécuter directement
    return calculationFn(inputs);
  }
  
  const cache = getNutritionCalculationCache();
  
  // Générer hash avec préfixe pour différencier types de calculs
  const baseHash = hashGenerator ? hashGenerator(inputs) : JSON.stringify(inputs);
  const hash = `${calculationType}:${generateHash(baseHash)}`;
  
  // Vérifier cache
  const cached = cache.get(hash);
  if (cached !== null) {
    return cached;
  }
  
  // Calculer
  const result = calculationFn(inputs);
  
  // Mettre en cache
  cache.set(hash, result);
  
  return result;
}

/**
 * Invalide le cache pour des inputs spécifiques
 * 
 * @param {Array<Object>} meals - Tableau de meals
 * @param {Object|null} program - Programme actif (optionnel)
 */
export function invalidateCache(meals = [], program = null) {
  const cache = getNutritionCalculationCache();
  const hash = generateInputsHash(meals, program);
  cache.invalidate(hash);
}

/**
 * Vide tout le cache
 */
export function clearCache() {
  const cache = getNutritionCalculationCache();
  cache.clear();
}

/**
 * Retourne les statistiques du cache
 * 
 * @returns {Object} Statistiques
 */
export function getCacheStats() {
  const cache = getNutritionCalculationCache();
  return cache.getStats();
}

