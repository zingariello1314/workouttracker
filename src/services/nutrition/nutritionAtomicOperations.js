/**
 * nutritionAtomicOperations.js
 * 
 * ✅ OPTIMISATION : Opérations atomiques avec rollback automatique
 * 
 * Fournit des fonctions pour exécuter des opérations multi-stores dans
 * des transactions atomiques IndexedDB, garantissant l'intégrité des données
 * en cas d'erreur partielle (rollback automatique).
 * 
 * Impact attendu : Intégrité données garantie, pas d'états incohérents
 * 
 * @module services/nutrition/nutritionAtomicOperations
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.1
 */

import { STORE_DAILY_MEALS, STORE_MEALS } from '../../hooks/nutritionDataUtils';
import { getNutritionRepository } from './repository';
import { 
  NutritionError, 
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB
} from '../../utils/nutritionErrors';
import { validateMeal, validateDailyMeal } from './nutritionSchemas';
import { calculateDailyTotals } from '../../hooks/nutritionCalculations';
import { getActiveProgram } from '../../hooks/nutritionDataCRUD';
import { getMealsByDate } from '../../hooks/nutritionDataCRUD';
import logger from '../../utils/logger';

const log = logger.module('nutritionAtomicOperations');

/**
 * Sauvegarde un meal et met à jour le dailyMeal dans une transaction atomique
 * 
 * ✅ OPTIMISATION : Transaction atomique garantit cohérence (rollback si erreur)
 * 
 * @param {Object} meal - Données du repas à sauvegarder
 * @param {Object} options - Options
 * @param {boolean} options.updateDailyTotals - Si true, recalcule et sauvegarde dailyMeal (défaut: true)
 * @param {boolean} options.skipValidation - Si true, skip validation Zod (défaut: false)
 * @returns {Promise<boolean>} True si succès
 * @throws {NutritionError} Si erreur (transaction rollback automatique)
 */
export async function saveMealAtomically(meal, options = {}) {
  const {
    updateDailyTotals = true,
    skipValidation = false
  } = options;

  try {
    // ✅ Validation avant transaction (évite rollback inutile)
    if (!skipValidation) {
      try {
        validateMeal(meal);
      } catch (validationError) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          'Meal invalide',
          { mealId: meal.id, validationError: validationError.errors || validationError.message },
          validationError
        );
      }
    }

    // ✅ Utiliser Repository batch pour transaction atomique
    const repository = await getNutritionRepository();
    
    // Préparer opérations batch
    const operations = [
      {
        type: 'save',
        store: STORE_MEALS,
        data: meal
      }
    ];

    // Si updateDailyTotals, calculer et ajouter dailyMeal
    if (updateDailyTotals) {
      // ✅ Récupérer données nécessaires AVANT transaction (lecture rapide)
      const [meals, activeProgram] = await Promise.all([
        getMealsByDate(meal.date).catch(() => []),
        getActiveProgram().catch(() => null)
      ]);

      // ✅ Inclure le nouveau meal dans le calcul
      const allMeals = [...meals];
      const existingMealIndex = allMeals.findIndex(m => m.id === meal.id);
      if (existingMealIndex >= 0) {
        allMeals[existingMealIndex] = meal; // Remplacer si existe
      } else {
        allMeals.push(meal); // Ajouter si nouveau
      }

      // ✅ Calculer totaux
      const dailyTotals = calculateDailyTotals(allMeals, activeProgram);

      // ✅ Récupérer ou créer dailyMeal
      const existingDailyMeal = await repository.get(
        STORE_DAILY_MEALS,
        meal.date,
        { skipCache: true, operationName: 'saveMealAtomically:getDailyMeal' }
      ).catch(() => null);

      const dailyMeal = existingDailyMeal || {
        date: meal.date,
        lastModified: new Date().toISOString(),
        programId: activeProgram?.id || null,
        isComplete: false,
        isCatchup: false,
        mealIds: allMeals.map(m => m.id),
        dailyTotals
      };

      // ✅ Mettre à jour dailyMeal
      dailyMeal.dailyTotals = dailyTotals;
      dailyMeal.mealIds = allMeals.map(m => m.id);
      dailyMeal.lastModified = new Date().toISOString();

      // ✅ Valider dailyMeal avant ajout au batch
      if (!skipValidation) {
        try {
          validateDailyMeal(dailyMeal);
        } catch (validationError) {
          throw new NutritionError(
            NutritionErrorCodes.VALIDATION_INVALID_DATA,
            'DailyMeal invalide après calcul',
            { date: meal.date, validationError: validationError.errors || validationError.message },
            validationError
          );
        }
      }

      // ✅ Ajouter dailyMeal au batch
      operations.push({
        type: 'save',
        store: STORE_DAILY_MEALS,
        data: dailyMeal
      });
    }

    // ✅ Exécuter batch dans transaction atomique
    const result = await repository.batch(operations, {
      operationName: 'saveMealAtomically',
      validate: !skipValidation
    });

    if (result.success) {
      log.debug('[saveMealAtomically] Meal et dailyMeal sauvegardés atomiquement', { mealId: meal.id, date: meal.date });
      return true;
    } else {
      throw new NutritionError(
        NutritionErrorCodes.STORAGE_ERROR,
        'Erreur lors de la sauvegarde atomique',
        { mealId: meal.id, date: meal.date, batchResult: result }
      );
    }
  } catch (error) {
    // ✅ Transaction automatiquement rollback (IndexedDB)
    if (error instanceof NutritionError) {
      log.error('[saveMealAtomically] Erreur sauvegarde atomique:', error.toJSON());
      throw error;
    }

    // ✅ Wrapper erreurs inconnues
    log.error('[saveMealAtomically] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur inconnue lors de la sauvegarde atomique',
      { mealId: meal?.id, date: meal?.date },
      error
    );
  }
}

/**
 * Supprime un meal et met à jour le dailyMeal dans une transaction atomique
 * 
 * ✅ OPTIMISATION : Transaction atomique garantit cohérence (rollback si erreur)
 * 
 * @param {string} mealId - ID du repas à supprimer
 * @param {Object} options - Options
 * @param {boolean} options.updateDailyTotals - Si true, recalcule et sauvegarde dailyMeal (défaut: true)
 * @returns {Promise<boolean>} True si succès
 * @throws {NutritionError} Si erreur (transaction rollback automatique)
 */
export async function deleteMealAtomically(mealId, options = {}) {
  const {
    updateDailyTotals = true
  } = options;

  try {
    const repository = await getNutritionRepository();

    // ✅ Récupérer meal AVANT suppression pour obtenir date
    const meal = await repository.get(
      STORE_MEALS,
      mealId,
      { operationName: 'deleteMealAtomically:getMeal' }
    ).catch(() => null);

    if (!meal) {
      log.warn('[deleteMealAtomically] Meal non trouvé, considéré comme déjà supprimé', { mealId });
      return true; // Déjà supprimé, considérer comme succès
    }

    const date = meal.date;
    if (!date) {
      throw new NutritionError(
        NutritionErrorCodes.VALIDATION_INVALID_DATA,
        'Meal sans date, impossible de mettre à jour dailyMeal',
        { mealId }
      );
    }

    // ✅ Préparer opérations batch
    const operations = [
      {
        type: 'delete',
        store: STORE_MEALS,
        key: mealId
      }
    ];

    // Si updateDailyTotals, recalculer et mettre à jour dailyMeal
    if (updateDailyTotals) {
      // ✅ Récupérer meals restants AVANT transaction
      const meals = await getMealsByDate(date).catch(() => []);
      const remainingMeals = meals.filter(m => m.id !== mealId);

      // ✅ Récupérer programme actif
      const activeProgram = await getActiveProgram().catch(() => null);

      // ✅ Calculer totaux avec meals restants
      const dailyTotals = calculateDailyTotals(remainingMeals, activeProgram);

      // ✅ Récupérer dailyMeal existant
      const existingDailyMeal = await repository.get(
        STORE_DAILY_MEALS,
        date,
        { skipCache: true, operationName: 'deleteMealAtomically:getDailyMeal' }
      ).catch(() => null);

      if (existingDailyMeal) {
        // ✅ Mettre à jour dailyMeal
        existingDailyMeal.dailyTotals = dailyTotals;
        existingDailyMeal.mealIds = remainingMeals.map(m => m.id);
        existingDailyMeal.lastModified = new Date().toISOString();

        // ✅ Valider avant ajout au batch
        try {
          validateDailyMeal(existingDailyMeal);
        } catch (validationError) {
          throw new NutritionError(
            NutritionErrorCodes.VALIDATION_INVALID_DATA,
            'DailyMeal invalide après suppression',
            { date, validationError: validationError.errors || validationError.message },
            validationError
          );
        }

        // ✅ Ajouter dailyMeal au batch
        operations.push({
          type: 'save',
          store: STORE_DAILY_MEALS,
          data: existingDailyMeal
        });
      }
    }

    // ✅ Exécuter batch dans transaction atomique
    const result = await repository.batch(operations, {
      operationName: 'deleteMealAtomically',
      validate: true
    });

    if (result.success) {
      log.debug('[deleteMealAtomically] Meal supprimé et dailyMeal mis à jour atomiquement', { mealId, date });
      return true;
    } else {
      throw new NutritionError(
        NutritionErrorCodes.STORAGE_ERROR,
        'Erreur lors de la suppression atomique',
        { mealId, date, batchResult: result }
      );
    }
  } catch (error) {
    // ✅ Transaction automatiquement rollback (IndexedDB)
    if (error instanceof NutritionError) {
      log.error('[deleteMealAtomically] Erreur suppression atomique:', error.toJSON());
      throw error;
    }

    // ✅ Wrapper erreurs inconnues
    log.error('[deleteMealAtomically] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur inconnue lors de la suppression atomique',
      { mealId },
      error
    );
  }
}

/**
 * Sauvegarde un dailyMeal avec ses meals dans une transaction atomique
 * 
 * ✅ OPTIMISATION : Transaction atomique garantit cohérence (rollback si erreur)
 * 
 * @param {Object} dailyMeal - Données du jour
 * @param {Array<Object>} meals - Tableau de meals à sauvegarder
 * @param {Object} options - Options
 * @param {boolean} options.skipValidation - Si true, skip validation Zod (défaut: false)
 * @returns {Promise<boolean>} True si succès
 * @throws {NutritionError} Si erreur (transaction rollback automatique)
 */
export async function saveDailyMealWithMealsAtomically(dailyMeal, meals = [], options = {}) {
  const {
    skipValidation = false
  } = options;

  try {
    // ✅ Validation avant transaction
    if (!skipValidation) {
      try {
        validateDailyMeal(dailyMeal);
        meals.forEach(meal => validateMeal(meal));
      } catch (validationError) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          'Données invalides',
          { date: dailyMeal.date, validationError: validationError.errors || validationError.message },
          validationError
        );
      }
    }

    // ✅ Utiliser Repository batch pour transaction atomique
    const repository = await getNutritionRepository();

    // ✅ Préparer opérations batch
    const operations = [
      {
        type: 'save',
        store: STORE_DAILY_MEALS,
        data: dailyMeal
      },
      ...meals.map(meal => ({
        type: 'save',
        store: STORE_MEALS,
        data: meal
      }))
    ];

    // ✅ Exécuter batch dans transaction atomique
    const result = await repository.batch(operations, {
      operationName: 'saveDailyMealWithMealsAtomically',
      validate: !skipValidation
    });

    if (result.success) {
      log.debug('[saveDailyMealWithMealsAtomically] DailyMeal et meals sauvegardés atomiquement', { 
        date: dailyMeal.date, 
        mealsCount: meals.length 
      });
      return true;
    } else {
      throw new NutritionError(
        NutritionErrorCodes.STORAGE_ERROR,
        'Erreur lors de la sauvegarde atomique',
        { date: dailyMeal.date, mealsCount: meals.length, batchResult: result }
      );
    }
  } catch (error) {
    // ✅ Transaction automatiquement rollback (IndexedDB)
    if (error instanceof NutritionError) {
      log.error('[saveDailyMealWithMealsAtomically] Erreur sauvegarde atomique:', error.toJSON());
      throw error;
    }

    // ✅ Wrapper erreurs inconnues
    log.error('[saveDailyMealWithMealsAtomically] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur inconnue lors de la sauvegarde atomique',
      { date: dailyMeal?.date, mealsCount: meals?.length },
      error
    );
  }
}

