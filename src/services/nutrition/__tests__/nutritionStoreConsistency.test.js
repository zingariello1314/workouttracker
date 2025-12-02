/**
 * nutritionStoreConsistency.test.js
 * 
 * ✅ PHASE 13.1 : Tests unitaires complets pour nutritionStoreConsistency.js
 * 
 * Tests exhaustifs pour validation et correction de cohérence entre stores :
 * - ConsistencyResult class (errors, warnings, fixes)
 * - validateMealsDailyMealsConsistency (références bidirectionnelles)
 * - validateActiveProgramConsistency (un seul programme actif)
 * - validateDailyMealsProgramsConsistency (références programmes)
 * - fixInconsistencies (corrections automatiques)
 * - validateStoreConsistency (validation complète)
 * - validateAfterOperation (validation ciblée après opération)
 * 
 * Stratégie de test :
 * - Utiliser fake-indexeddb pour mocker IndexedDB
 * - Mocker Repository pour isoler les tests
 * - Tester cas normaux, incohérences, corrections automatiques
 * - Vérifier que les corrections fonctionnent correctement
 * 
 * @module services/nutrition/__tests__/nutritionStoreConsistency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ✅ Importer fake-indexeddb AVANT tout autre code
import 'fake-indexeddb/auto';
import {
  validateStoreConsistency,
  validateAfterOperation
} from '../nutritionStoreConsistency';
import { openNutritionDB, STORE_DAILY_MEALS, STORE_MEALS, STORE_PROGRAMS } from '../../../hooks/nutritionDataUtils';

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
  getAll: vi.fn(),
  get: vi.fn(),
  save: vi.fn()
};

vi.mock('../repository', () => ({
  getNutritionRepository: vi.fn(async () => mockRepository)
}));

// ==================== HELPERS ====================

/**
 * Crée un meal valide
 */
function createMeal(id, date, dailyMealId = null) {
  return {
    id,
    date,
    dailyMealId: dailyMealId !== null && dailyMealId !== undefined ? dailyMealId : date,
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
function createDailyMeal(date, mealIds = [], programId = null) {
  return {
    date,
    programId,
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

/**
 * Crée un program valide
 */
function createProgram(id, isActive = false) {
  return {
    id,
    name: `Program ${id}`,
    isActive,
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    createdAt: new Date().toISOString()
  };
}

// ==================== TESTS ====================

describe('nutritionStoreConsistency', () => {
  beforeEach(() => {
    // Réinitialiser mocks
    vi.clearAllMocks();
    mockRepository.getAll.mockResolvedValue([]);
    mockRepository.get.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(true);
  });

  afterEach(async () => {
    // Nettoyer IndexedDB après chaque test
    try {
      const db = await openNutritionDB();
      if (db) {
        db.close();
      }
    } catch (error) {
      // Ignorer erreurs de nettoyage
    }
  });

  describe('validateStoreConsistency', () => {
    describe('Cas normaux (données cohérentes)', () => {
      it('devrait retourner isValid=true si toutes les données sont cohérentes', async () => {
        const meals = [
          createMeal('meal-1', '2025-01-16', '2025-01-16'),
          createMeal('meal-2', '2025-01-16', '2025-01-16')
        ];
        const dailyMeals = [
          createDailyMeal('2025-01-16', ['meal-1', 'meal-2'])
        ];
        const programs = [
          createProgram('program-1', true)
        ];

        mockRepository.getAll
          .mockResolvedValueOnce(meals) // getAll('meals')
          .mockResolvedValueOnce(dailyMeals) // getAll('dailyMeals')
          .mockResolvedValueOnce(programs) // getAll('programs')
          .mockResolvedValueOnce(dailyMeals) // getAll('dailyMeals') pour validateDailyMealsProgramsConsistency
          .mockResolvedValueOnce(programs); // getAll('programs') pour validateDailyMealsProgramsConsistency

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('Incohérences meals ↔ dailyMeals', () => {
      it('devrait détecter meal avec dailyMealId inexistant', async () => {
        const meals = [
          createMeal('meal-1', '2025-01-16', '2025-01-17') // dailyMealId inexistant
        ];
        const dailyMeals = [
          createDailyMeal('2025-01-16', ['meal-1'])
        ];

        mockRepository.getAll
          .mockResolvedValueOnce(meals)
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]) // programs
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]); // programs

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('référence un dailyMeal inexistant');
      });

      it('devrait détecter dailyMeal avec mealIds inexistants', async () => {
        const meals = [
          createMeal('meal-1', '2025-01-16')
        ];
        const dailyMeals = [
          createDailyMeal('2025-01-16', ['meal-1', 'meal-inexistant']) // meal-inexistant n'existe pas
        ];

        mockRepository.getAll
          .mockResolvedValueOnce(meals)
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]) // programs
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]); // programs

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].message).toContain('référence');
        expect(result.warnings[0].message).toContain('meal(s) inexistant(s)');
      });

      it('devrait détecter meal sans dailyMealId mais avec date correspondant à un dailyMeal', async () => {
        // Créer un meal explicitement sans dailyMealId
        const meal = createMeal('meal-1', '2025-01-16', null);
        delete meal.dailyMealId; // Supprimer explicitement dailyMealId
        const meals = [meal];
        const dailyMeals = [
          createDailyMeal('2025-01-16', [])
        ];

        mockRepository.getAll
          .mockResolvedValueOnce(meals)
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]) // programs
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce([]); // programs

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.warnings.length).toBeGreaterThan(0);
        // Le message exact est : "Meal meal-1 a une date 2025-01-16 correspondant à un dailyMeal mais pas de dailyMealId"
        const warningMessage = result.warnings.find(w => w.message.includes('pas de dailyMealId') || w.message.includes('correspondant à un dailyMeal'));
        expect(warningMessage).toBeDefined();
      });
    });

    describe('Incohérences programmes actifs', () => {
      it('devrait détecter plusieurs programmes actifs', async () => {
        const programs = [
          createProgram('program-1', true),
          createProgram('program-2', true) // Deux programmes actifs
        ];

        mockRepository.getAll
          .mockResolvedValueOnce([]) // meals
          .mockResolvedValueOnce([]) // dailyMeals
          .mockResolvedValueOnce(programs)
          .mockResolvedValueOnce([]) // dailyMeals pour validateDailyMealsProgramsConsistency
          .mockResolvedValueOnce(programs); // programs pour validateDailyMealsProgramsConsistency

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('programmes actifs trouvés');
      });

      it('devrait accepter aucun programme actif (warning seulement)', async () => {
        const programs = [
          createProgram('program-1', false)
        ];

        mockRepository.getAll
          .mockResolvedValueOnce([]) // meals
          .mockResolvedValueOnce([]) // dailyMeals
          .mockResolvedValueOnce(programs)
          .mockResolvedValueOnce([]) // dailyMeals
          .mockResolvedValueOnce(programs); // programs

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].message).toContain('Aucun programme actif');
      });
    });

    describe('Incohérences dailyMeals ↔ programmes', () => {
      it('devrait détecter dailyMeal avec programId inexistant', async () => {
        const dailyMeals = [
          createDailyMeal('2025-01-16', [], 'program-inexistant')
        ];
        const programs = [
          createProgram('program-1', true)
        ];

        mockRepository.getAll
          .mockResolvedValueOnce([]) // meals
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce(programs)
          .mockResolvedValueOnce(dailyMeals)
          .mockResolvedValueOnce(programs);

        const result = await validateStoreConsistency({ verbose: false });

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].message).toContain('référence un programme inexistant');
      });
    });

    describe('Corrections automatiques (autoFix)', () => {
      it('devrait corriger mealIds invalides dans dailyMeals si autoFix=true', async () => {
        const meals = [
          createMeal('meal-1', '2025-01-16')
        ];
        const dailyMeal = createDailyMeal('2025-01-16', ['meal-1', 'meal-inexistant']);
        const dailyMeals = [dailyMeal];

        mockRepository.getAll
          .mockResolvedValueOnce(meals) // validateMealsDailyMealsConsistency - getAll('meals')
          .mockResolvedValueOnce(dailyMeals) // validateMealsDailyMealsConsistency - getAll('dailyMeals')
          .mockResolvedValueOnce([]) // validateActiveProgramConsistency - getAll('programs')
          .mockResolvedValueOnce(dailyMeals) // validateDailyMealsProgramsConsistency - getAll('dailyMeals')
          .mockResolvedValueOnce([]) // validateDailyMealsProgramsConsistency - getAll('programs')
          .mockResolvedValueOnce(dailyMeals) // fixInconsistencies - getAll('dailyMeals')
          .mockResolvedValueOnce(meals); // fixInconsistencies - getAll('meals')

        const result = await validateStoreConsistency({
          autoFix: true,
          fixInvalidMealIds: true,
          verbose: false
        });

        // Vérifier que save a été appelé pour corriger
        expect(mockRepository.save).toHaveBeenCalled();
        expect(result.fixes.length).toBeGreaterThan(0);
      }, 15000);

      it('devrait corriger programmes actifs multiples si autoFix=true', async () => {
        const program1 = createProgram('program-1', true);
        program1.createdAt = '2025-01-01T00:00:00.000Z';
        const program2 = createProgram('program-2', true);
        program2.createdAt = '2025-01-02T00:00:00.000Z'; // Plus récent
        const programs = [program1, program2];

        mockRepository.getAll
          .mockResolvedValueOnce([]) // validateMealsDailyMealsConsistency - getAll('meals')
          .mockResolvedValueOnce([]) // validateMealsDailyMealsConsistency - getAll('dailyMeals')
          .mockResolvedValueOnce(programs) // validateActiveProgramConsistency - getAll('programs')
          .mockResolvedValueOnce([]) // validateDailyMealsProgramsConsistency - getAll('dailyMeals')
          .mockResolvedValueOnce(programs) // validateDailyMealsProgramsConsistency - getAll('programs')
          .mockResolvedValueOnce([]) // fixInconsistencies - fixInvalidMealIds - getAll('dailyMeals')
          .mockResolvedValueOnce([]) // fixInconsistencies - fixInvalidMealIds - getAll('meals')
          .mockResolvedValueOnce(programs); // fixInconsistencies - fixMultipleActivePrograms - getAll('programs')

        const result = await validateStoreConsistency({
          autoFix: true,
          fixMultipleActivePrograms: true,
          verbose: false
        });

        // Vérifier que save a été appelé pour désactiver program-1
        expect(mockRepository.save).toHaveBeenCalled();
        expect(result.fixes.length).toBeGreaterThan(0);
        const fixMessage = result.fixes.find(f => f.message.includes('désactivé'));
        expect(fixMessage).toBeDefined();
      }, 15000);
    });
  });

  describe('validateAfterOperation', () => {
    it('devrait valider après deleteMeal', async () => {
      const meals = [
        createMeal('meal-1', '2025-01-16')
      ];
      const dailyMeals = [
        createDailyMeal('2025-01-16', ['meal-1'])
      ];

      mockRepository.getAll
        .mockResolvedValueOnce(meals)
        .mockResolvedValueOnce(dailyMeals)
        .mockResolvedValueOnce(dailyMeals) // Pour fixInconsistencies
        .mockResolvedValueOnce(meals); // Pour fixInconsistencies

      const result = await validateAfterOperation('deleteMeal', 'meal-1', {
        autoFix: true,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    it('devrait valider après deleteProgram', async () => {
      const dailyMeals = [
        createDailyMeal('2025-01-16', [], 'program-1')
      ];
      const programs = [];

      mockRepository.getAll
        .mockResolvedValueOnce(dailyMeals)
        .mockResolvedValueOnce(programs);

      const result = await validateAfterOperation('deleteProgram', 'program-1', {
        autoFix: true,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    it('devrait valider après activateProgram', async () => {
      const programs = [
        createProgram('program-1', true),
        createProgram('program-2', true) // Deux actifs
      ];

      mockRepository.getAll
        .mockResolvedValueOnce(programs)
        .mockResolvedValueOnce(programs) // Pour fixInconsistencies
        .mockResolvedValueOnce([]) // dailyMeals
        .mockResolvedValueOnce(programs); // programs

      const result = await validateAfterOperation('activateProgram', 'program-1', {
        autoFix: true,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    it('devrait faire validation complète pour opération inconnue', async () => {
      mockRepository.getAll
        .mockResolvedValueOnce([]) // meals
        .mockResolvedValueOnce([]) // dailyMeals
        .mockResolvedValueOnce([]) // programs
        .mockResolvedValueOnce([]) // dailyMeals
        .mockResolvedValueOnce([]); // programs

      const result = await validateAfterOperation('unknownOperation', 'id-1', {
        autoFix: false,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Gestion erreurs', () => {
    it('devrait gérer gracieusement erreur ouverture IndexedDB', async () => {
      // Simuler erreur ouverture DB
      vi.spyOn(await import('../../../hooks/nutritionDataUtils'), 'openNutritionDB')
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await validateStoreConsistency({ verbose: false });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait gérer gracieusement erreur getAll', async () => {
      mockRepository.getAll.mockRejectedValueOnce(new Error('Repository error'));

      const result = await validateStoreConsistency({ verbose: false });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});




