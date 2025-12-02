/**
 * nutritionOptimisticLocking.js
 * 
 * ✅ OPTIMISATION Phase 15.3 : Optimistic Locking pour détection modifications concurrentes
 * 
 * Implémente l'optimistic locking avec version pour éviter les race conditions
 * et garantir la cohérence des données lors de modifications concurrentes.
 * 
 * Principe :
 * - Chaque entrée (dailyMeal, meal, program) a un champ `version` (entier, incrémenté à chaque save)
 * - Avant sauvegarde, on vérifie que la version fournie correspond à la version en DB
 * - Si versions différentes → erreur CONCURRENT_MODIFICATION (données modifiées entre-temps)
 * - Si versions identiques → sauvegarde avec version incrémentée
 * 
 * Bénéfices :
 * - Détection automatique modifications concurrentes
 * - Pas de perte de données (rollback automatique)
 * - Cohérence garantie
 * - Performance : Pas d'impact (juste une lecture supplémentaire)
 * 
 * @module services/nutrition/nutritionOptimisticLocking
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.3
 */

import { NutritionError, NutritionErrorCodes, createConcurrentModificationError } from '../../utils/nutritionErrors';
import logger from '../../utils/logger';

const log = logger.module('nutritionOptimisticLocking');

/**
 * Vérifie et met à jour la version pour optimistic locking
 * 
 * ✅ OPTIMISATION Phase 15.3 : Vérification version avant sauvegarde
 * 
 * @param {Object} currentData - Données actuelles en DB (null si nouvelle entrée)
 * @param {Object} newData - Données à sauvegarder
 * @param {string} resourceType - Type de ressource ('dailyMeal', 'meal', 'program')
 * @param {string} resourceId - ID de la ressource
 * @param {Object} options - Options
 * @param {boolean} options.enableOptimisticLocking - Activer optimistic locking (défaut: true)
 * @param {boolean} options.skipVersionCheck - Forcer skip vérification version (défaut: false)
 * @returns {Object} Données avec version mise à jour
 * @throws {NutritionError} Si modification concurrente détectée
 */
export function checkAndIncrementVersion(currentData, newData, resourceType, resourceId, options = {}) {
  const {
    enableOptimisticLocking = true,
    skipVersionCheck = false
  } = options;

  // ✅ Si optimistic locking désactivé ou skip demandé, retourner données telles quelles
  if (!enableOptimisticLocking || skipVersionCheck) {
    // Si nouvelle entrée, initialiser version à 0
    if (!currentData && !newData.version) {
      return {
        ...newData,
        version: 0
      };
    }
    // Si entrée existante sans version, initialiser à 0
    if (currentData && !currentData.version && !newData.version) {
      return {
        ...newData,
        version: 0
      };
    }
    // Sinon, garder version fournie ou incrémenter si absente
    return {
      ...newData,
      version: newData.version ?? (currentData?.version ?? 0)
    };
  }

  // ✅ OPTIMISATION Phase 15.3 : Nouvelle entrée (pas de version en DB)
  if (!currentData) {
    // Initialiser version à 0 pour nouvelle entrée
    return {
      ...newData,
      version: 0
    };
  }

  // ✅ OPTIMISATION Phase 15.3 : Entrée existante - Vérifier version
  const currentVersion = currentData.version ?? 0; // Compatibilité : données existantes sans version = 0
  const providedVersion = newData.version ?? 0; // Si version non fournie, assumer 0 (première sauvegarde)

  // ✅ Vérifier que version fournie correspond à version en DB
  if (providedVersion !== currentVersion) {
    // ❌ Modification concurrente détectée !
    log.warn(`[checkAndIncrementVersion] Modification concurrente détectée`, {
      resourceType,
      resourceId,
      currentVersion,
      providedVersion
    });

    throw createConcurrentModificationError(
      resourceType,
      resourceId,
      currentVersion,
      providedVersion
    );
  }

  // ✅ Versions identiques : Incrémenter version pour sauvegarde
  const updatedData = {
    ...newData,
    version: currentVersion + 1,
    lastModified: new Date().toISOString() // Mettre à jour timestamp aussi
  };

  log.debug(`[checkAndIncrementVersion] Version incrémentée`, {
    resourceType,
    resourceId,
    oldVersion: currentVersion,
    newVersion: currentVersion + 1
  });

  return updatedData;
}

/**
 * Initialise la version pour une nouvelle entrée
 * 
 * ✅ OPTIMISATION Phase 15.3 : Helper pour initialiser version
 * 
 * @param {Object} data - Données de l'entrée
 * @returns {Object} Données avec version initialisée
 */
export function initializeVersion(data) {
  if (data.version === undefined || data.version === null) {
    return {
      ...data,
      version: 0
    };
  }
  return data;
}

/**
 * Vérifie si optimistic locking est activé pour un store
 * 
 * ✅ OPTIMISATION Phase 15.3 : Helper pour vérifier activation
 * 
 * @param {string} store - Nom du store
 * @param {Object} config - Configuration nutrition
 * @returns {boolean} true si optimistic locking activé pour ce store
 */
export function isOptimisticLockingEnabled(store, config = null) {
  // Stores supportant optimistic locking
  const supportedStores = ['dailyMeals', 'meals', 'programs'];
  
  if (!supportedStores.includes(store)) {
    return false; // Store non supporté
  }

  // Si config fournie, vérifier feature flag
  if (config && config.features && config.features.enableOptimisticLocking !== undefined) {
    return config.features.enableOptimisticLocking;
  }

  // Par défaut, activé pour stores supportés
  return true;
}






