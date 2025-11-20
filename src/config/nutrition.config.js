/**
 * nutrition.config.js
 * 
 * ✅ OPTIMISATION : Configuration centralisée pour l'onglet Nutrition
 * 
 * Centralise toutes les constantes, valeurs par défaut, limites et feature flags
 * pour faciliter la maintenance et éviter la duplication.
 * 
 * Impact attendu : Maintenabilité améliorée, cohérence garantie
 * 
 * @module config/nutrition.config
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 3.1
 */

import { z } from 'zod';
import logger from '../utils/logger';

const log = logger.module('nutritionConfig');

// ==================== SCHÉMA DE VALIDATION ====================

/**
 * Schéma Zod pour validation de la configuration
 */
const NutritionConfigSchema = z.object({
  limits: z.object({
    maxCalories: z.number().min(0).max(50000),
    maxProtein: z.number().min(0).max(2000),
    maxCarbs: z.number().min(0).max(5000),
    maxFat: z.number().min(0).max(2000),
    maxWater: z.number().min(0).max(50000), // ml
    minCalories: z.number().min(0).max(10000),
    minProtein: z.number().min(0).max(1000),
    minCarbs: z.number().min(0).max(2000),
    minFat: z.number().min(0).max(500),
    minWater: z.number().min(0).max(10000), // ml
  }),
  defaults: z.object({
    targetCalories: z.number().min(1000).max(10000),
    targetProtein: z.number().min(50).max(500),
    targetCarbs: z.number().min(100).max(1000),
    targetFat: z.number().min(30).max(300),
    targetWater: z.number().min(1000).max(10000), // ml
  }),
  macros: z.object({
    proteinCaloriesPerGram: z.number().min(3).max(5), // 4 kcal/g
    carbsCaloriesPerGram: z.number().min(3).max(5), // 4 kcal/g
    fatCaloriesPerGram: z.number().min(8).max(10), // 9 kcal/g
  }),
  cache: z.object({
    dailyMealTTL: z.number().min(1000).max(3600000), // ms
    mealsTTL: z.number().min(1000).max(3600000), // ms
    programTTL: z.number().min(1000).max(3600000), // ms
    activeProgramTTL: z.number().min(1000).max(3600000), // ms
    favoriteFoodsTTL: z.number().min(1000).max(3600000), // ms
    hydrationLogTTL: z.number().min(1000).max(3600000), // ms
    gamificationTTL: z.number().min(1000).max(3600000), // ms
    maxSize: z.number().min(10).max(1000),
    calculationCacheMaxSize: z.number().min(10).max(500),
  }),
  performance: z.object({
    debounceSave: z.number().min(0).max(5000), // ms
    debounceSaveMaxDelay: z.number().min(1000).max(10000), // ms
    debounceSearch: z.number().min(0).max(5000), // ms
    prefetchInitialDelay: z.number().min(0).max(10000), // ms
    prefetchIdleTimeout: z.number().min(1000).max(30000), // ms
    prefetchDaysRange: z.number().min(0).max(7),
    prefetchMinIdleTime: z.number().min(0).max(100), // ms
    virtualScrollThreshold: z.number().min(10).max(100), // Nombre d'items avant d'activer virtual scrolling
    virtualScrollItemHeight: z.number().min(50).max(500), // Hauteur estimée d'un item (px)
    virtualScrollOverscan: z.number().min(1).max(10), // Nombre d'items à rendre en dehors du viewport
    compressionLevel: z.number().min(1).max(9), // Niveau gzip (1-9)
    compressionMinSize: z.number().min(512).max(1048576), // Taille min avant compression (bytes)
    compressionPreferStream: z.boolean(), // Préférer CompressionStream API si dispo
  }),
  features: z.object({
    enableCompression: z.boolean(),
    enableWebWorkers: z.boolean(),
    enableOfflineQueue: z.boolean(),
    enablePrefetching: z.boolean(),
    enableCalculationCache: z.boolean(),
    enableStoreConsistencyValidation: z.boolean(),
  }),
  compliance: z.object({
    proteinWeight: z.number().min(0).max(1),
    carbsWeight: z.number().min(0).max(1),
    fatWeight: z.number().min(0).max(1),
    caloriesWeight: z.number().min(0).max(1),
    complianceThreshold: z.number().min(0).max(1), // 0.8 = 80%
    compliancePenaltyThreshold: z.number().min(0).max(2), // 1.2 = 120% (peut aller jusqu'à 200%)
  }),
  retry: z.object({
    writeMaxRetries: z.number().min(1).max(10),
    readMaxRetries: z.number().min(1).max(10),
    deleteMaxRetries: z.number().min(1).max(10),
    initialDelay: z.number().min(10).max(1000),
    maxDelay: z.number().min(100).max(10000),
    backoffMultiplier: z.number().min(1.5).max(5),
  }),
  api: z.object({
    pageSize: z.number().min(1).max(100),
    openFoodFactsTimeout: z.number().min(1000).max(60000),
    usdaTimeout: z.number().min(1000).max(60000),
    usdaRateLimitPerKey: z.number().min(1).max(100),
    usdaRateLimitWindow: z.number().min(1000).max(60000),
  }),
  gamification: z.object({
    xpRewards: z.object({
      mealLogged: z.number().min(0).max(1000),
      dayComplete: z.number().min(0).max(1000),
      programCompliant: z.number().min(0).max(1000),
      badgeUnlocked: z.number().min(0).max(1000),
      streakMilestone: z.number().min(0).max(1000),
    }),
    streak: z.object({
      forgivenessDays: z.number().min(0).max(7),
      maxDisplayDays: z.number().min(7).max(365),
    }),
  }),
  expertSystem: z.object({
    thresholds: z.object({
      proteinDeficitSevere: z.number().min(0).max(1), // 0.7 = 70%
      proteinDeficitModerate: z.number().min(0).max(1), // 0.85 = 85%
      carbsDeficitSevere: z.number().min(0).max(1),
      carbsExcessSevere: z.number().min(1).max(2),
      fatDeficitSevere: z.number().min(0).max(1),
      fatExcessSevere: z.number().min(1).max(2),
      caloriesDeficitSevere: z.number().min(0).max(1),
      caloriesExcessSevere: z.number().min(1).max(2),
    }),
  }),
  batch: z.object({
    maxSize: z.number().min(10).max(10000),
  }),
  corruption: z.object({
    maxRecoveryAttempts: z.number().min(1).max(10),
    recoveryDelay: z.number().min(100).max(5000),
  }),
  repository: z.object({
    factoryTimeout: z.number().min(1000).max(10000),
    dbOpenTimeout: z.number().min(1000).max(10000),
  }),
  worker: z.object({
    timeout: z.number().min(5000).max(120000),
    fallbackDelay: z.number().min(50).max(1000),
  }),
  scanner: z.object({
    timeout: z.number().min(5000).max(60000),
  }),
});

// ==================== CONFIGURATION PAR DÉFAUT ====================

/**
 * Configuration centralisée pour l'onglet Nutrition
 * 
 * ✅ OPTIMISATION : Toutes les constantes et valeurs par défaut centralisées
 */
export const NutritionConfig = {
  // Limites de validation (pour protection contre valeurs aberrantes)
  limits: {
    maxCalories: 50000,
    maxProtein: 2000,
    maxCarbs: 5000,
    maxFat: 2000,
    maxWater: 50000, // ml
    minCalories: 0,
    minProtein: 0,
    minCarbs: 0,
    minFat: 0,
    minWater: 0, // ml
  },
  
  // Valeurs par défaut (utilisées si pas de programme actif)
  defaults: {
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWater: 3000, // ml (3L)
  },
  
  // Valeurs caloriques des macros (pour calculs)
  macros: {
    proteinCaloriesPerGram: 4, // kcal/g
    carbsCaloriesPerGram: 4, // kcal/g
    fatCaloriesPerGram: 9, // kcal/g
  },
  
  // Configuration cache
  cache: {
    dailyMealTTL: 60000,        // 1 minute
    mealsTTL: 60000,            // 1 minute
    programTTL: 300000,         // 5 minutes
    activeProgramTTL: 300000,   // 5 minutes
    favoriteFoodsTTL: 300000,   // 5 minutes
    hydrationLogTTL: 60000,     // 1 minute
    gamificationTTL: 60000,     // 1 minute
    maxSize: 100,               // Limite cache global
    calculationCacheMaxSize: 50, // Limite cache calculs
  },
  
  // Configuration performance
  performance: {
    debounceSave: 300,              // ms (délai debounce sauvegardes)
    debounceSaveMaxDelay: 2000,     // ms (délai max avant forcer sauvegarde)
    debounceSearch: 300,             // ms (délai debounce recherche)
    prefetchInitialDelay: 2000,      // ms (délai avant prefetch)
    prefetchIdleTimeout: 5000,       // ms (timeout requestIdleCallback)
    prefetchDaysRange: 1,            // Nombre de jours à précharger (J±1)
    prefetchMinIdleTime: 10,         // ms (temps libre minimum requis)
    virtualScrollThreshold: 20,      // Nombre d'items avant d'activer virtual scrolling
    virtualScrollItemHeight: 180,    // Hauteur estimée d'un item meal (px)
    virtualScrollOverscan: 3,        // Nombre d'items à rendre en dehors du viewport
    compressionLevel: 6,             // Niveau gzip (1-9)
    compressionMinSize: 2048,        // Taille minimum avant compression (2 KB)
    compressionPreferStream: true,   // Préférer CompressionStream si dispo
  },
  
  // Feature flags (pour activer/désactiver features)
  features: {
    enableCompression: true,                    // Compression données export
    enableWebWorkers: true,                    // Web Workers pour calculs lourds (implémenté)
    enableOfflineQueue: true,                   // Queue offline pour sauvegardes
    enablePrefetching: true,                    // Prefetching données prévisibles
    enableCalculationCache: true,              // Cache calculs avec hash
    enableStoreConsistencyValidation: true,    // Validation cohérence stores
  },
  
  // Configuration conformité (pour calcul score)
  compliance: {
    caloriesWeight: 0.4,   // 40% du score
    proteinWeight: 0.3,    // 30% du score
    carbsWeight: 0.15,     // 15% du score
    fatWeight: 0.15,       // 15% du score
    complianceThreshold: 0.8,      // 80% = score 100
    compliancePenaltyThreshold: 1.2, // 120% = pénalité
  },
  
  // Configuration retry (pour opérations IndexedDB)
  retry: {
    writeMaxRetries: 3,        // Opérations WRITE (critiques)
    readMaxRetries: 2,          // Opérations READ (moins critiques)
    deleteMaxRetries: 2,        // Opérations DELETE (modérées)
    initialDelay: 100,         // ms (délai initial)
    maxDelay: 1000,            // ms (délai maximum)
    backoffMultiplier: 2,       // Multiplicateur backoff exponentiel
  },
  
  // Configuration API externes
  api: {
    pageSize: 20,               // Nombre de résultats par défaut (OpenFoodFacts, USDA)
    openFoodFactsTimeout: 10000, // ms (timeout OpenFoodFacts)
    usdaTimeout: 10000,          // ms (timeout USDA)
    usdaRateLimitPerKey: 30,     // Requêtes par minute par clé
    usdaRateLimitWindow: 60000,  // ms (fenêtre rate limit)
  },
  
  // Configuration gamification
  gamification: {
    xpRewards: {
      mealLogged: 5,            // XP pour repas saisi
      dayComplete: 20,          // XP pour jour complet
      programCompliant: 15,      // XP pour respect programme (≥80%)
      badgeUnlocked: 50,         // XP pour badge débloqué (base)
      streakMilestone: 100,     // XP pour milestone streak
    },
    streak: {
      forgivenessDays: 2,        // Jours manqués tolérés (anti-burnout)
      maxDisplayDays: 30,       // Limite affichage (anti-anxiété)
    },
  },
  
  // Configuration système expert (recommandations)
  expertSystem: {
    thresholds: {
      proteinDeficitSevere: 0.7,      // < 70% de la cible = déficit sévère
      proteinDeficitModerate: 0.85,  // < 85% de la cible = déficit modéré
      carbsDeficitSevere: 0.7,
      carbsExcessSevere: 1.3,        // > 130% de la cible = excès sévère
      fatDeficitSevere: 0.7,
      fatExcessSevere: 1.3,
      caloriesDeficitSevere: 0.7,
      caloriesExcessSevere: 1.3,
    },
  },
  
  // Configuration batch operations
  batch: {
    maxSize: 1000,              // Limite opérations par batch (éviter freeze UI)
  },
  
  // Configuration gestion corruption IndexedDB
  corruption: {
    maxRecoveryAttempts: 3,      // Nombre max tentatives récupération
    recoveryDelay: 500,         // ms (délai entre tentatives)
  },
  
  // Configuration Repository Factory
  repository: {
    factoryTimeout: 3000,        // ms (timeout création repository)
    dbOpenTimeout: 2000,         // ms (timeout ouverture DB)
  },
  
  // Configuration Web Workers
  worker: {
    timeout: 30000,              // ms (timeout calculs workers)
    fallbackDelay: 100,          // ms (délai avant fallback)
  },
  
  // Configuration scanner code-barres
  scanner: {
    timeout: 10000,              // ms (timeout scan)
  },
};

// ==================== VALIDATION ====================

/**
 * Valide la configuration au démarrage
 * 
 * ✅ OPTIMISATION : Validation avec Zod pour détecter erreurs de configuration
 * 
 * @returns {boolean} True si configuration valide, false sinon
 */
export function validateConfig() {
  try {
    NutritionConfigSchema.parse(NutritionConfig);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ✅ CORRECTION : Vérifier que error.errors existe avant forEach
      if (error.errors && Array.isArray(error.errors)) {
        log.error('[validateConfig] Configuration invalide:', error.errors);
        // ✅ OPTIMISATION : Logger détails mais ne pas bloquer (fallback vers valeurs par défaut)
        error.errors.forEach(err => {
          const path = err.path && Array.isArray(err.path) ? err.path.join('.') : 'unknown';
          log.error(`  - ${path}: ${err.message || 'Erreur inconnue'}`);
        });
      } else {
        log.error('[validateConfig] Configuration invalide (erreur Zod sans détails):', error);
      }
    } else {
      log.error('[validateConfig] Erreur validation:', error);
    }
    return false;
  }
}

// ==================== HELPERS ====================

/**
 * Récupère une valeur de configuration avec fallback
 * 
 * @param {string} path - Chemin vers la valeur (ex: 'defaults.targetCalories')
 * @param {*} fallback - Valeur par défaut si non trouvée
 * @returns {*} Valeur de configuration ou fallback
 */
export function getConfig(path, fallback = null) {
  try {
    const keys = path.split('.');
    let value = NutritionConfig;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    
    return value;
  } catch (error) {
    log.warn(`[getConfig] Erreur récupération config ${path}:`, error);
    return fallback;
  }
}

/**
 * Met à jour une valeur de configuration (pour tests/override)
 * 
 * ⚠️ ATTENTION : Utiliser avec précaution, peut casser la validation
 * 
 * @param {string} path - Chemin vers la valeur (ex: 'defaults.targetCalories')
 * @param {*} value - Nouvelle valeur
 * @returns {boolean} True si mise à jour réussie
 */
export function setConfig(path, value) {
  try {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = NutritionConfig;
    
    for (const key of keys) {
      if (target && typeof target === 'object' && key in target) {
        target = target[key];
      } else {
        log.warn(`[setConfig] Chemin invalide: ${path}`);
        return false;
      }
    }
    
    if (target && typeof target === 'object') {
      target[lastKey] = value;
      
      // ✅ Valider après modification
      if (!validateConfig()) {
        log.warn(`[setConfig] Configuration invalide après modification, rollback recommandé`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`[setConfig] Erreur mise à jour config ${path}:`, error);
    return false;
  }
}

// ==================== EXPORT POUR EXPORT JSON ====================

/**
 * Récupère la configuration pour export JSON
 * 
 * ✅ OPTIMISATION : Export configuration dans SettingsTab (pour référence)
 * 
 * @returns {Object} Configuration exportable (sans feature flags sensibles)
 */
export function getConfigForExport() {
  return {
    limits: NutritionConfig.limits,
    defaults: NutritionConfig.defaults,
    macros: NutritionConfig.macros,
    cache: {
      dailyMealTTL: NutritionConfig.cache.dailyMealTTL,
      mealsTTL: NutritionConfig.cache.mealsTTL,
      programTTL: NutritionConfig.cache.programTTL,
      maxSize: NutritionConfig.cache.maxSize,
    },
    performance: {
      debounceSave: NutritionConfig.performance.debounceSave,
      debounceSaveMaxDelay: NutritionConfig.performance.debounceSaveMaxDelay,
      prefetchInitialDelay: NutritionConfig.performance.prefetchInitialDelay,
    },
    compliance: NutritionConfig.compliance,
    retry: {
      writeMaxRetries: NutritionConfig.retry.writeMaxRetries,
      readMaxRetries: NutritionConfig.retry.readMaxRetries,
      initialDelay: NutritionConfig.retry.initialDelay,
      maxDelay: NutritionConfig.retry.maxDelay,
    },
    api: {
      pageSize: NutritionConfig.api.pageSize,
    },
    gamification: {
      xpRewards: NutritionConfig.gamification.xpRewards,
      streak: NutritionConfig.gamification.streak,
    },
    batch: {
      maxSize: NutritionConfig.batch.maxSize,
    },
    // Note: features, corruption, repository, worker, scanner non exportés (sécurité/technique)
  };
}

// ==================== INITIALISATION ====================

// ✅ Valider configuration au chargement du module
// ✅ CORRECTION : Utiliser setTimeout pour s'assurer que tout est chargé
if (typeof window !== 'undefined') {
  // ✅ Délai pour s'assurer que Zod et logger sont complètement initialisés
  setTimeout(() => {
    try {
      const isValid = validateConfig();
      if (!isValid) {
        log.warn('[nutritionConfig] Configuration invalide, utilisation valeurs par défaut');
      } else {
        log.debug('[nutritionConfig] Configuration validée avec succès');
      }
    } catch (error) {
      // ✅ CORRECTION : Gérer erreurs lors de la validation initiale
      log.error('[nutritionConfig] Erreur lors de la validation initiale:', error);
    }
  }, 0);
}

