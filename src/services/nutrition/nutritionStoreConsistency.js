/**
 * nutritionStoreConsistency.js
 * 
 * ✅ OPTIMISATION : Service de validation de cohérence entre stores nutrition
 * 
 * Vérifie et corrige automatiquement les incohérences entre stores :
 * - Références orphelines (meals sans dailyMeal, dailyMeals sans meals)
 * - Programmes actifs multiples (un seul doit être actif)
 * - Références invalides (mealIds dans dailyMeal pointant vers meals inexistants)
 * 
 * Impact attendu : Intégrité données garantie, pas d'orphelins dans IndexedDB
 * 
 * @module services/nutrition/nutritionStoreConsistency
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.1
 */

import { openNutritionDB, STORE_DAILY_MEALS, STORE_MEALS, STORE_PROGRAMS } from '../../hooks/nutritionDataUtils';
import { getNutritionRepository } from './repository';
import logger from '../../utils/logger';

const log = logger.module('nutritionStoreConsistency');

/**
 * Résultat d'une validation de cohérence
 */
class ConsistencyResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  addError(message, details = {}) {
    this.isValid = false;
    this.errors.push({ message, details, timestamp: Date.now() });
  }

  addWarning(message, details = {}) {
    this.warnings.push({ message, details, timestamp: Date.now() });
  }

  addFix(message, details = {}) {
    this.fixes.push({ message, details, timestamp: Date.now() });
  }

  toJSON() {
    return {
      isValid: this.isValid,
      errorsCount: this.errors.length,
      warningsCount: this.warnings.length,
      fixesCount: this.fixes.length,
      errors: this.errors,
      warnings: this.warnings,
      fixes: this.fixes
    };
  }
}

/**
 * Valide la cohérence entre meals et dailyMeals
 * 
 * ✅ OPTIMISATION : Vérifie références bidirectionnelles
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @param {ConsistencyResult} result - Résultat de validation
 * @returns {Promise<void>}
 */
async function validateMealsDailyMealsConsistency(db, result) {
  try {
    const repository = await getNutritionRepository();
    
    // Récupérer tous les meals et dailyMeals
    const allMeals = await repository.getAll('meals', { operationName: 'consistency:getAllMeals' });
    const allDailyMeals = await repository.getAll('dailyMeals', { operationName: 'consistency:getAllDailyMeals' });
    
    // Créer maps pour accès rapide
    const mealsMap = new Map(allMeals.map(meal => [meal.id, meal]));
    const dailyMealsMap = new Map(allDailyMeals.map(dm => [dm.date, dm]));
    
    // ✅ Vérifier 1 : Meals avec dailyMealId invalide
    for (const meal of allMeals) {
      if (meal.dailyMealId && !dailyMealsMap.has(meal.dailyMealId)) {
        result.addError(
          `Meal ${meal.id} référence un dailyMeal inexistant: ${meal.dailyMealId}`,
          { mealId: meal.id, dailyMealId: meal.dailyMealId }
        );
      }
    }
    
    // ✅ Vérifier 2 : DailyMeals avec mealIds invalides
    for (const dailyMeal of allDailyMeals) {
      if (dailyMeal.mealIds && Array.isArray(dailyMeal.mealIds)) {
        const invalidMealIds = dailyMeal.mealIds.filter(mealId => !mealsMap.has(mealId));
        
        if (invalidMealIds.length > 0) {
          result.addWarning(
            `DailyMeal ${dailyMeal.date} référence ${invalidMealIds.length} meal(s) inexistant(s)`,
            { date: dailyMeal.date, invalidMealIds }
          );
        }
      }
    }
    
    // ✅ Vérifier 3 : Meals sans dailyMealId mais avec date correspondant à un dailyMeal
    for (const meal of allMeals) {
      if (!meal.dailyMealId && meal.date) {
        const dailyMeal = dailyMealsMap.get(meal.date);
        if (dailyMeal) {
          result.addWarning(
            `Meal ${meal.id} a une date ${meal.date} correspondant à un dailyMeal mais pas de dailyMealId`,
            { mealId: meal.id, date: meal.date }
          );
        }
      }
    }
  } catch (error) {
    log.error('[validateMealsDailyMealsConsistency] Erreur validation:', error);
    result.addError('Erreur lors de la validation meals/dailyMeals', { error: error.message });
  }
}

/**
 * Valide la cohérence des programmes actifs
 * 
 * ✅ OPTIMISATION : Un seul programme doit être actif à la fois
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @param {ConsistencyResult} result - Résultat de validation
 * @returns {Promise<void>}
 */
async function validateActiveProgramConsistency(db, result) {
  try {
    const repository = await getNutritionRepository();
    
    const allPrograms = await repository.getAll('programs', { operationName: 'consistency:getAllPrograms' });
    
    const activePrograms = allPrograms.filter(p => p.isActive === true);
    
    if (activePrograms.length === 0) {
      // Pas d'erreur, juste info (peut être normal)
      result.addWarning('Aucun programme actif trouvé', { programsCount: allPrograms.length });
    } else if (activePrograms.length > 1) {
      result.addError(
        `${activePrograms.length} programmes actifs trouvés (un seul devrait être actif)`,
        { activeProgramIds: activePrograms.map(p => p.id) }
      );
    }
  } catch (error) {
    log.error('[validateActiveProgramConsistency] Erreur validation:', error);
    result.addError('Erreur lors de la validation programmes actifs', { error: error.message });
  }
}

/**
 * Valide la cohérence des dailyMeals avec programmes
 * 
 * ✅ OPTIMISATION : Vérifie que dailyMeals référencent des programmes valides
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @param {ConsistencyResult} result - Résultat de validation
 * @returns {Promise<void>}
 */
async function validateDailyMealsProgramsConsistency(db, result) {
  try {
    const repository = await getNutritionRepository();
    
    const allDailyMeals = await repository.getAll('dailyMeals', { operationName: 'consistency:getAllDailyMeals' });
    const allPrograms = await repository.getAll('programs', { operationName: 'consistency:getAllPrograms' });
    
    const programsMap = new Map(allPrograms.map(p => [p.id, p]));
    
    // Vérifier que dailyMeals référencent des programmes valides (si programId présent)
    for (const dailyMeal of allDailyMeals) {
      if (dailyMeal.programId && !programsMap.has(dailyMeal.programId)) {
        result.addWarning(
          `DailyMeal ${dailyMeal.date} référence un programme inexistant: ${dailyMeal.programId}`,
          { date: dailyMeal.date, programId: dailyMeal.programId }
        );
      }
    }
  } catch (error) {
    log.error('[validateDailyMealsProgramsConsistency] Erreur validation:', error);
    result.addError('Erreur lors de la validation dailyMeals/programmes', { error: error.message });
  }
}

/**
 * Corrige automatiquement les incohérences détectées
 * 
 * ✅ OPTIMISATION : Nettoie les orphelins et corrige les références invalides
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @param {ConsistencyResult} result - Résultat de validation (avec erreurs/warnings)
 * @param {Object} options - Options de correction
 * @param {boolean} options.fixOrphanMeals - Si true, supprime meals avec dailyMealId invalide
 * @param {boolean} options.fixInvalidMealIds - Si true, nettoie mealIds invalides dans dailyMeals
 * @param {boolean} options.fixMultipleActivePrograms - Si true, désactive tous sauf le plus récent
 * @returns {Promise<ConsistencyResult>} Résultat avec corrections appliquées
 */
async function fixInconsistencies(db, result, options = {}) {
  const {
    fixOrphanMeals = false,
    fixInvalidMealIds = true,
    fixMultipleActivePrograms = true
  } = options;

  try {
    const repository = await getNutritionRepository();
    
    // ✅ Fix 1 : Nettoyer mealIds invalides dans dailyMeals
    if (fixInvalidMealIds) {
      const allDailyMeals = await repository.getAll('dailyMeals', { operationName: 'consistency:fixDailyMeals' });
      const allMeals = await repository.getAll('meals', { operationName: 'consistency:fixMeals' });
      const mealsMap = new Map(allMeals.map(meal => [meal.id, meal]));
      
      let fixedCount = 0;
      for (const dailyMeal of allDailyMeals) {
        if (dailyMeal.mealIds && Array.isArray(dailyMeal.mealIds)) {
          const validMealIds = dailyMeal.mealIds.filter(mealId => mealsMap.has(mealId));
          
          if (validMealIds.length !== dailyMeal.mealIds.length) {
            const removedCount = dailyMeal.mealIds.length - validMealIds.length;
            dailyMeal.mealIds = validMealIds;
            
            await repository.save('dailyMeals', dailyMeal, { 
              operationName: 'consistency:fixDailyMealMealIds' 
            });
            
            result.addFix(
              `DailyMeal ${dailyMeal.date}: ${removedCount} mealId(s) invalide(s) supprimé(s)`,
              { date: dailyMeal.date, removedCount }
            );
            fixedCount++;
          }
        }
      }
      
      if (fixedCount > 0) {
        log.info(`[fixInconsistencies] ${fixedCount} dailyMeal(s) corrigé(s)`);
      }
    }
    
    // ✅ Fix 2 : Corriger meals avec dailyMealId invalide
    if (fixOrphanMeals) {
      const allMeals = await repository.getAll('meals', { operationName: 'consistency:fixOrphanMeals' });
      const allDailyMeals = await repository.getAll('dailyMeals', { operationName: 'consistency:fixDailyMeals' });
      const dailyMealsMap = new Map(allDailyMeals.map(dm => [dm.date, dm]));
      
      let fixedCount = 0;
      for (const meal of allMeals) {
        if (meal.dailyMealId && !dailyMealsMap.has(meal.dailyMealId)) {
          // Essayer de corriger en utilisant la date du meal
          if (meal.date && dailyMealsMap.has(meal.date)) {
            meal.dailyMealId = meal.date;
            await repository.save('meals', meal, { 
              operationName: 'consistency:fixMealDailyMealId' 
            });
            
            result.addFix(
              `Meal ${meal.id}: dailyMealId corrigé de ${meal.dailyMealId} vers ${meal.date}`,
              { mealId: meal.id, oldDailyMealId: meal.dailyMealId, newDailyMealId: meal.date }
            );
            fixedCount++;
          } else {
            // Supprimer dailyMealId invalide
            delete meal.dailyMealId;
            await repository.save('meals', meal, { 
              operationName: 'consistency:removeInvalidDailyMealId' 
            });
            
            result.addFix(
              `Meal ${meal.id}: dailyMealId invalide supprimé`,
              { mealId: meal.id, removedDailyMealId: meal.dailyMealId }
            );
            fixedCount++;
          }
        }
      }
      
      if (fixedCount > 0) {
        log.info(`[fixInconsistencies] ${fixedCount} meal(s) corrigé(s)`);
      }
    }
    
    // ✅ Fix 3 : Corriger programmes actifs multiples
    if (fixMultipleActivePrograms) {
      const allPrograms = await repository.getAll('programs', { operationName: 'consistency:fixPrograms' });
      const activePrograms = allPrograms.filter(p => p.isActive === true);
      
      if (activePrograms.length > 1) {
        // Garder le plus récent (par updatedAt ou createdAt)
        activePrograms.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });
        
        const keepActive = activePrograms[0];
        const toDeactivate = activePrograms.slice(1);
        
        for (const program of toDeactivate) {
          program.isActive = false;
          await repository.save('programs', program, { 
            operationName: 'consistency:deactivateProgram' 
          });
          
          result.addFix(
            `Programme ${program.id} désactivé (${activePrograms.length} programmes actifs → 1)`,
            { programId: program.id, keptActive: keepActive.id }
          );
        }
        
        log.info(`[fixInconsistencies] ${toDeactivate.length} programme(s) désactivé(s)`);
      }
    }
  } catch (error) {
    log.error('[fixInconsistencies] Erreur correction:', error);
    result.addError('Erreur lors de la correction des incohérences', { error: error.message });
  }
  
  return result;
}

/**
 * Valide la cohérence de tous les stores nutrition
 * 
 * ✅ OPTIMISATION : Validation complète avec options de correction
 * 
 * @param {Object} options - Options de validation
 * @param {boolean} options.autoFix - Si true, corrige automatiquement les incohérences
 * @param {boolean} options.fixOrphanMeals - Si true, supprime meals avec dailyMealId invalide
 * @param {boolean} options.fixInvalidMealIds - Si true, nettoie mealIds invalides dans dailyMeals
 * @param {boolean} options.fixMultipleActivePrograms - Si true, désactive tous sauf le plus récent
 * @param {boolean} options.verbose - Si true, log détaillé
 * @returns {Promise<ConsistencyResult>} Résultat de validation
 */
export async function validateStoreConsistency(options = {}) {
  const {
    autoFix = false,
    fixOrphanMeals = false,
    fixInvalidMealIds = true,
    fixMultipleActivePrograms = true,
    verbose = false
  } = options;
  
  const result = new ConsistencyResult();
  
  try {
    const db = await openNutritionDB();
    if (!db) {
      result.addError('Impossible d\'ouvrir IndexedDB');
      return result;
    }
    
    if (verbose) {
      log.info('[validateStoreConsistency] Début validation cohérence stores...');
    }
    
    // ✅ Valider cohérence meals ↔ dailyMeals
    await validateMealsDailyMealsConsistency(db, result);
    
    // ✅ Valider cohérence programmes actifs
    await validateActiveProgramConsistency(db, result);
    
    // ✅ Valider cohérence dailyMeals ↔ programmes
    await validateDailyMealsProgramsConsistency(db, result);
    
    // ✅ Corriger automatiquement si demandé
    if (autoFix && (!result.isValid || result.warnings.length > 0)) {
      if (verbose) {
        log.info('[validateStoreConsistency] Correction automatique des incohérences...');
      }
      
      await fixInconsistencies(db, result, {
        fixOrphanMeals,
        fixInvalidMealIds,
        fixMultipleActivePrograms
      });
    }
    
    if (verbose) {
      log.info('[validateStoreConsistency] Validation terminée:', result.toJSON());
    }
    
    return result;
  } catch (error) {
    log.error('[validateStoreConsistency] Erreur validation:', error);
    result.addError('Erreur lors de la validation de cohérence', { error: error.message });
    return result;
  }
}

/**
 * Valide la cohérence après une opération CRUD
 * 
 * ✅ OPTIMISATION : Validation rapide après modification
 * 
 * @param {string} operation - Type d'opération ('deleteMeal', 'deleteDailyMeal', 'deleteProgram', etc.)
 * @param {string} entityId - ID de l'entité modifiée
 * @param {Object} options - Options de validation
 * @returns {Promise<ConsistencyResult>} Résultat de validation
 */
export async function validateAfterOperation(operation, entityId, options = {}) {
  const { autoFix = true, verbose = false } = options;
  
  const result = new ConsistencyResult();
  
  try {
    const db = await openNutritionDB();
    if (!db) {
      return result; // Pas d'erreur si DB non disponible
    }
    
    // Validation ciblée selon l'opération
    switch (operation) {
      case 'deleteMeal':
        // Vérifier que dailyMeal ne référence plus ce meal
        await validateMealsDailyMealsConsistency(db, result);
        break;
        
      case 'deleteDailyMeal':
        // Vérifier que meals n'ont plus ce dailyMealId
        await validateMealsDailyMealsConsistency(db, result);
        break;
        
      case 'deleteProgram':
        // Vérifier que dailyMeals n'ont plus ce programId
        await validateDailyMealsProgramsConsistency(db, result);
        break;
        
      case 'activateProgram':
        // Vérifier qu'un seul programme est actif
        await validateActiveProgramConsistency(db, result);
        break;
        
      default:
        // Validation complète pour opérations inconnues
        return await validateStoreConsistency({ autoFix, verbose });
    }
    
    // Corriger automatiquement si demandé
    if (autoFix && (!result.isValid || result.warnings.length > 0)) {
      await fixInconsistencies(db, result, {
        fixOrphanMeals: false,
        fixInvalidMealIds: true,
        fixMultipleActivePrograms: true
      });
    }
    
    return result;
  } catch (error) {
    log.error('[validateAfterOperation] Erreur validation:', error);
    result.addError('Erreur lors de la validation après opération', { error: error.message });
    return result;
  }
}

