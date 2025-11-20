/**
 * nutritionAtomicOperations.test.js
 * 
 * ✅ PHASE 13.1 : Tests unitaires complets pour nutritionAtomicOperations.js
 * 
 * Tests exhaustifs pour opérations atomiques avec rollback automatique :
 * - saveMealAtomically (sauvegarde meal + mise à jour dailyMeal)
 * - deleteMealAtomically (suppression meal + mise à jour dailyMeal)
 * - saveDailyMealWithMealsAtomically (sauvegarde dailyMeal + meals)
 * - Gestion erreurs et rollback automatique
 * - Validation avant transaction
 * 
 * Stratégie de test :
 * - Utiliser fake-indexeddb pour mocker IndexedDB
 * - Mocker Repository, calculateDailyTotals, getMealsByDate, getActiveProgram
 * - Tester cas normaux, erreurs, rollback, validation
 * - Vérifier que les transactions sont atomiques (tout ou rien)
 * 
 * @module services/nutrition/__tests__/nutritionAtomicOperations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ✅ Importer fake-indexeddb AVANT tout autre code
import 'fake-indexeddb/auto';
import {
  saveMealAtomically,
  deleteMealAtomically,
  saveDailyMealWithMealsAtomically
} from '../nutritionAtomicOperations';
import { NutritionError, NutritionErrorCodes } from '../../../utils/nutritionErrors';
import { STORE_DAILY_MEALS, STORE_MEALS } from '../../../hooks/nutritionDataUtils';

// ==================== MOCKS ====================

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

// Mock Repository
const mockRepository = {
  get: vi.fn(),
  batch: vi.fn()
};

vi.mock('../repository', () => ({
  getNutritionRepository: vi.fn(async () => mockRepository)
}));

// Mock calculateDailyTotals
const mockCalculateDailyTotals = vi.fn();
vi.mock('../../../hooks/nutritionCalculations', () => ({
  calculateDailyTotals: (...args) => mockCalculateDailyTotals(...args)
}));

// Mock getMealsByDate
const mockGetMealsByDate = vi.fn();
// Mock getActiveProgram
const mockGetActiveProgram = vi.fn();

vi.mock('../../../hooks/nutritionDataCRUD', () => ({
  getMealsByDate: (...args) => mockGetMealsByDate(...args),
  getActiveProgram: (...args) => mockGetActiveProgram(...args)
}));

// Mock validateMeal, validateDailyMeal
const mockValidateMeal = vi.fn();
const mockValidateDailyMeal = vi.fn();

vi.mock('../nutritionSchemas', () => ({
  validateMeal: (...args) => mockValidateMeal(...args),
  validateDailyMeal: (...args) => mockValidateDailyMeal(...args)
}));

// ==================== HELPERS ====================

/**
 * Crée un meal valide
 */
function createMeal(id, date) {
  return {
    id,
    date,
    type: 'breakfast',
    foods: [
      {
        id: 'food-1',
        name: 'Pomme',
        quantity: 100,
        unit: 'g'
      }
    ],
    totalCalories: 500,
    totalProtein: 30,
    totalCarbs: 50,
    totalFat: 20
  };
}

/**
 * Crée un dailyMeal valide
 */
function createDailyMeal(date, mealIds = []) {
  return {
    date,
    mealIds,
    dailyTotals: {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 80
    },
    isComplete: false,
    isCatchup: false
  };
}

// ==================== TESTS ====================

describe('nutritionAtomicOperations', () => {
  beforeEach(() => {
    // Réinitialiser mocks
    vi.clearAllMocks();
    mockRepository.get.mockResolvedValue(null);
    mockRepository.batch.mockResolvedValue({ success: true });
    mockGetMealsByDate.mockResolvedValue([]);
    mockGetActiveProgram.mockResolvedValue(null);
    mockCalculateDailyTotals.mockReturnValue({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 80
    });
    mockValidateMeal.mockImplementation((meal) => meal);
    mockValidateDailyMeal.mockImplementation((dailyMeal) => dailyMeal);
  });

  afterEach(async () => {
    // Nettoyer IndexedDB après chaque test
    try {
      const { openNutritionDB } = await import('../../../hooks/nutritionDataUtils');
      const db = await openNutritionDB();
      if (db) {
        db.close();
      }
    } catch (error) {
      // Ignorer erreurs de nettoyage
    }
  });

  describe('saveMealAtomically', () => {
    describe('Cas normaux', () => {
      it('devrait sauvegarder meal seul si updateDailyTotals=false', async () => {
        const meal = createMeal('meal-1', '2025-01-16');

        const result = await saveMealAtomically(meal, {
          updateDailyTotals: false
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'save',
              store: STORE_MEALS,
              data: meal
            })
          ]),
          expect.any(Object)
        );
        expect(mockGetMealsByDate).not.toHaveBeenCalled();
      });

      it('devrait sauvegarder meal + dailyMeal si updateDailyTotals=true', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        const existingMeals = [];
        const activeProgram = {
          id: 'program-1',
          targetCalories: 2500,
          targetProtein: 150
        };

        mockGetMealsByDate.mockResolvedValueOnce(existingMeals);
        mockGetActiveProgram.mockResolvedValueOnce(activeProgram);
        mockRepository.get.mockResolvedValueOnce(null); // Pas de dailyMeal existant

        const result = await saveMealAtomically(meal, {
          updateDailyTotals: true
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalled();
        const batchCall = mockRepository.batch.mock.calls[0][0];
        expect(batchCall).toHaveLength(2); // meal + dailyMeal
        expect(batchCall[0].type).toBe('save');
        expect(batchCall[0].store).toBe(STORE_MEALS);
        expect(batchCall[1].type).toBe('save');
        expect(batchCall[1].store).toBe(STORE_DAILY_MEALS);
      });

      it('devrait mettre à jour dailyMeal existant', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        const existingDailyMeal = createDailyMeal('2025-01-16', []);

        mockGetMealsByDate.mockResolvedValueOnce([]);
        mockGetActiveProgram.mockResolvedValueOnce(null);
        mockRepository.get.mockResolvedValueOnce(existingDailyMeal);

        const result = await saveMealAtomically(meal, {
          updateDailyTotals: true
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalled();
        const batchCall = mockRepository.batch.mock.calls[0][0];
        expect(batchCall[1].data.date).toBe('2025-01-16');
        expect(batchCall[1].data.mealIds).toContain('meal-1');
      });

      it('devrait remplacer meal existant dans le calcul', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        meal.totalCalories = 600; // Modifié
        const existingMeal = createMeal('meal-1', '2025-01-16');
        existingMeal.totalCalories = 500; // Ancien

        mockGetMealsByDate.mockResolvedValueOnce([existingMeal]);
        mockGetActiveProgram.mockResolvedValueOnce(null);
        mockRepository.get.mockResolvedValueOnce(null);

        await saveMealAtomically(meal, {
          updateDailyTotals: true
        });

        // Vérifier que calculateDailyTotals a été appelé avec le meal modifié
        expect(mockCalculateDailyTotals).toHaveBeenCalled();
        const mealsArg = mockCalculateDailyTotals.mock.calls[0][0];
        expect(mealsArg).toHaveLength(1);
        expect(mealsArg[0].totalCalories).toBe(600); // Meal modifié
      });
    });

    describe('Validation', () => {
      it('devrait valider meal avant transaction', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        const validationError = new Error('Validation failed');
        mockValidateMeal.mockImplementation(() => {
          throw validationError;
        });

        await expect(
          saveMealAtomically(meal, { updateDailyTotals: false })
        ).rejects.toThrow(NutritionError);

        expect(mockValidateMeal).toHaveBeenCalledWith(meal);
        expect(mockRepository.batch).not.toHaveBeenCalled();
      });

      it('devrait valider dailyMeal avant ajout au batch', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        const validationError = new Error('DailyMeal validation failed');
        mockValidateDailyMeal.mockImplementation(() => {
          throw validationError;
        });

        mockGetMealsByDate.mockResolvedValueOnce([]);
        mockGetActiveProgram.mockResolvedValueOnce(null);
        mockRepository.get.mockResolvedValueOnce(null);

        await expect(
          saveMealAtomically(meal, { updateDailyTotals: true })
        ).rejects.toThrow(NutritionError);

        expect(mockValidateDailyMeal).toHaveBeenCalled();
      });

      it('devrait skip validation si skipValidation=true', async () => {
        const meal = createMeal('meal-1', '2025-01-16');

        await saveMealAtomically(meal, {
          updateDailyTotals: false,
          skipValidation: true
        });

        expect(mockValidateMeal).not.toHaveBeenCalled();
        expect(mockRepository.batch).toHaveBeenCalled();
      });
    });

    describe('Gestion erreurs', () => {
      it('devrait rollback si batch échoue', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        mockRepository.batch.mockResolvedValueOnce({ success: false, error: 'Batch failed' });

        await expect(
          saveMealAtomically(meal, { updateDailyTotals: false })
        ).rejects.toThrow(NutritionError);

        // Vérifier que l'erreur contient les détails
        try {
          await saveMealAtomically(meal, { updateDailyTotals: false });
        } catch (error) {
          expect(error).toBeInstanceOf(NutritionError);
          expect(error.code).toBe(NutritionErrorCodes.STORAGE_ERROR);
        }
      });

      it('devrait wrapper erreurs inconnues en NutritionError', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        mockRepository.batch.mockRejectedValueOnce(new Error('Unknown error'));

        await expect(
          saveMealAtomically(meal, { updateDailyTotals: false })
        ).rejects.toThrow(NutritionError);
      });
    });
  });

  describe('deleteMealAtomically', () => {
    describe('Cas normaux', () => {
      it('devrait supprimer meal seul si updateDailyTotals=false', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        mockRepository.get.mockResolvedValueOnce(meal);

        const result = await deleteMealAtomically('meal-1', {
          updateDailyTotals: false
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'delete',
              store: STORE_MEALS,
              key: 'meal-1'
            })
          ]),
          expect.any(Object)
        );
        expect(mockGetMealsByDate).not.toHaveBeenCalled();
      });

      it('devrait supprimer meal + mettre à jour dailyMeal si updateDailyTotals=true', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        const existingDailyMeal = createDailyMeal('2025-01-16', ['meal-1', 'meal-2']);
        const remainingMeals = [createMeal('meal-2', '2025-01-16')];

        mockRepository.get
          .mockResolvedValueOnce(meal) // get meal
          .mockResolvedValueOnce(existingDailyMeal); // get dailyMeal
        mockGetMealsByDate.mockResolvedValueOnce([meal, ...remainingMeals]);
        mockGetActiveProgram.mockResolvedValueOnce(null);

        const result = await deleteMealAtomically('meal-1', {
          updateDailyTotals: true
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalled();
        const batchCall = mockRepository.batch.mock.calls[0][0];
        expect(batchCall).toHaveLength(2); // delete meal + save dailyMeal
        expect(batchCall[0].type).toBe('delete');
        expect(batchCall[1].type).toBe('save');
        expect(batchCall[1].data.mealIds).not.toContain('meal-1');
      });

      it('devrait retourner true si meal n\'existe pas déjà', async () => {
        mockRepository.get.mockResolvedValueOnce(null);

        const result = await deleteMealAtomically('meal-inexistant', {
          updateDailyTotals: false
        });

        expect(result).toBe(true);
        expect(mockRepository.batch).not.toHaveBeenCalled();
      });

      it('devrait rejeter si meal sans date', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        delete meal.date;
        mockRepository.get.mockResolvedValueOnce(meal);

        await expect(
          deleteMealAtomically('meal-1', { updateDailyTotals: false })
        ).rejects.toThrow(NutritionError);
      });
    });

    describe('Gestion erreurs', () => {
      it('devrait rollback si batch échoue', async () => {
        const meal = createMeal('meal-1', '2025-01-16');
        mockRepository.get.mockResolvedValueOnce(meal);
        mockRepository.batch.mockResolvedValueOnce({ success: false });

        await expect(
          deleteMealAtomically('meal-1', { updateDailyTotals: false })
        ).rejects.toThrow(NutritionError);
      });
    });
  });

  describe('saveDailyMealWithMealsAtomically', () => {
    describe('Cas normaux', () => {
      it('devrait sauvegarder dailyMeal + meals dans transaction atomique', async () => {
        const dailyMeal = createDailyMeal('2025-01-16', ['meal-1', 'meal-2']);
        const meals = [
          createMeal('meal-1', '2025-01-16'),
          createMeal('meal-2', '2025-01-16')
        ];

        const result = await saveDailyMealWithMealsAtomically(dailyMeal, meals);

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalled();
        const batchCall = mockRepository.batch.mock.calls[0][0];
        expect(batchCall).toHaveLength(3); // dailyMeal + 2 meals
        expect(batchCall[0].type).toBe('save');
        expect(batchCall[0].store).toBe(STORE_DAILY_MEALS);
        expect(batchCall[1].type).toBe('save');
        expect(batchCall[1].store).toBe(STORE_MEALS);
      });

      it('devrait sauvegarder dailyMeal seul si meals vide', async () => {
        const dailyMeal = createDailyMeal('2025-01-16', []);

        const result = await saveDailyMealWithMealsAtomically(dailyMeal, []);

        expect(result).toBe(true);
        expect(mockRepository.batch).toHaveBeenCalled();
        const batchCall = mockRepository.batch.mock.calls[0][0];
        expect(batchCall).toHaveLength(1); // Seulement dailyMeal
      });
    });

    describe('Validation', () => {
      it('devrait valider dailyMeal et meals avant transaction', async () => {
        const dailyMeal = createDailyMeal('2025-01-16', []);
        const meals = [createMeal('meal-1', '2025-01-16')];
        const validationError = new Error('Validation failed');
        mockValidateDailyMeal.mockImplementation(() => {
          throw validationError;
        });

        await expect(
          saveDailyMealWithMealsAtomically(dailyMeal, meals)
        ).rejects.toThrow(NutritionError);

        expect(mockValidateDailyMeal).toHaveBeenCalledWith(dailyMeal);
        expect(mockRepository.batch).not.toHaveBeenCalled();
      });

      it('devrait skip validation si skipValidation=true', async () => {
        const dailyMeal = createDailyMeal('2025-01-16', []);
        const meals = [createMeal('meal-1', '2025-01-16')];

        await saveDailyMealWithMealsAtomically(dailyMeal, meals, {
          skipValidation: true
        });

        expect(mockValidateDailyMeal).not.toHaveBeenCalled();
        expect(mockValidateMeal).not.toHaveBeenCalled();
        expect(mockRepository.batch).toHaveBeenCalled();
      });
    });

    describe('Gestion erreurs', () => {
      it('devrait rollback si batch échoue', async () => {
        const dailyMeal = createDailyMeal('2025-01-16', []);
        const meals = [createMeal('meal-1', '2025-01-16')];
        mockRepository.batch.mockResolvedValueOnce({ success: false });

        await expect(
          saveDailyMealWithMealsAtomically(dailyMeal, meals)
        ).rejects.toThrow(NutritionError);
      });
    });
  });
});

