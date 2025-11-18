/**
 * nutritionCalculations.test.js
 * 
 * ✅ PHASE 10.6 : Tests unitaires complets pour nutritionCalculations.js
 * 
 * Tests exhaustifs pour toutes les fonctions de calcul nutrition :
 * - calculateDailyTotals : Totaux journaliers avec conformité
 * - calculateCaloricBalance : Bilan calorique (consommé - dépensé)
 * - getBalanceClassification : Classification bilan
 * - calculateProgramCompliance : Conformité programme sur période
 * - getNutritionStats : Statistiques nutrition
 * - getMacroDistribution : Distribution macros
 * - Helpers : generateMealId, formatDate, daysBetween
 * 
 * Stratégie de test :
 * - Cas normaux (happy path)
 * - Edge cases (tableaux vides, valeurs nulles, limites)
 * - Validation (données invalides, erreurs)
 * - Protection NaN/Infinity (division par zéro, valeurs extrêmes)
 * - Cohérence résultats (plages de valeurs, types)
 * 
 * @module hooks/__tests__/nutritionCalculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateDailyTotals,
  calculateCaloricBalance,
  getBalanceClassification,
  calculateProgramCompliance,
  getNutritionStats,
  getMacroDistribution,
  generateMealId,
  generateProgramId,
  generateFavoriteFoodId,
  formatDate,
  daysBetween
} from '../nutritionCalculations';
import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';

// ==================== MOCKS ====================

// Mock logger pour éviter bruit dans tests
vi.mock('../../utils/logger', () => ({
  default: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

// ==================== TESTS calculateDailyTotals ====================

describe('calculateDailyTotals', () => {
  const defaultProgram = {
    id: 'program-1',
    name: 'Test Program',
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    targetWater: 3000
  };

  describe('Cas normaux', () => {
    it('devrait calculer totaux correctement avec repas valides', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 50,
          totalFat: 20
        },
        {
          id: 'meal-2',
          totalCalories: 300,
          totalProtein: 20,
          totalCarbs: 40,
          totalFat: 10
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      expect(result.calories).toBe(800);
      expect(result.protein).toBe(50);
      expect(result.carbs).toBe(90);
      expect(result.fat).toBe(30);
      expect(result.targetCalories).toBe(2500);
      expect(result.targetProtein).toBe(150);
      expect(result.complianceCalories).toBe(800 - 2500); // -1700
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it('devrait calculer pourcentages macros correctement', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 400,
          totalProtein: 30, // 30g * 4 = 120 kcal
          totalCarbs: 50,   // 50g * 4 = 200 kcal
          totalFat: 9       // 9g * 9 = 81 kcal
        }
      ];
      // Total macro calories = 120 + 200 + 81 = 401 kcal

      const result = calculateDailyTotals(meals, defaultProgram);

      // Vérifier pourcentages (arrondis)
      expect(result.proteinPercent).toBeGreaterThanOrEqual(0);
      expect(result.proteinPercent).toBeLessThanOrEqual(100);
      expect(result.carbsPercent).toBeGreaterThanOrEqual(0);
      expect(result.carbsPercent).toBeLessThanOrEqual(100);
      expect(result.fatPercent).toBeGreaterThanOrEqual(0);
      expect(result.fatPercent).toBeLessThanOrEqual(100);
      
      // Vérifier cohérence (somme ≈ 100%)
      const sumPercent = result.proteinPercent + result.carbsPercent + result.fatPercent;
      expect(sumPercent).toBeGreaterThanOrEqual(95); // Tolérance arrondis
      expect(sumPercent).toBeLessThanOrEqual(105);
    });

    it('devrait utiliser targets du programme si fourni', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 2000,
          totalProtein: 100,
          totalCarbs: 200,
          totalFat: 60
        }
      ];

      const customProgram = {
        ...defaultProgram,
        targetCalories: 3000,
        targetProtein: 200,
        targetCarbs: 400,
        targetFat: 100
      };

      const result = calculateDailyTotals(meals, customProgram);

      expect(result.targetCalories).toBe(3000);
      expect(result.targetProtein).toBe(200);
      expect(result.targetCarbs).toBe(400);
      expect(result.targetFat).toBe(100);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer tableau vide de repas', () => {
      const result = calculateDailyTotals([], defaultProgram);

      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
      expect(result.complianceScore).toBe(0); // Pas de repas = score 0
      expect(result.targetCalories).toBe(2500); // Targets toujours présents
    });

    it('devrait gérer programme null (valeurs par défaut)', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 2000,
          totalProtein: 100,
          totalCarbs: 200,
          totalFat: 60
        }
      ];

      const result = calculateDailyTotals(meals, null);

      // Devrait utiliser valeurs par défaut
      expect(result.targetCalories).toBe(2500);
      expect(result.targetProtein).toBe(150);
      expect(result.targetCarbs).toBe(300);
      expect(result.targetFat).toBe(80);
    });

    it('devrait ignorer repas invalides et continuer', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 50,
          totalFat: 20
        },
        {
          // Repas invalide (manque champs requis)
          id: 'meal-2'
        },
        {
          id: 'meal-3',
          totalCalories: 300,
          totalProtein: 20,
          totalCarbs: 40,
          totalFat: 10
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      // Devrait calculer avec repas valides seulement
      expect(result.calories).toBe(800); // 500 + 300
      expect(result.protein).toBe(50);   // 30 + 20
    });

    it('devrait gérer valeurs zéro dans repas', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
      expect(result.proteinPercent).toBe(0);
      expect(result.carbsPercent).toBe(0);
      expect(result.fatPercent).toBe(0);
    });

    it('devrait gérer valeurs très élevées (limites)', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 10000,
          totalProtein: 500,
          totalCarbs: 1000,
          totalFat: 300
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      // Devrait valider et limiter si nécessaire
      expect(result.calories).toBeGreaterThanOrEqual(0);
      expect(result.calories).toBeLessThanOrEqual(50000);
      expect(result.protein).toBeGreaterThanOrEqual(0);
      expect(result.protein).toBeLessThanOrEqual(2000);
    });
  });

  describe('Validation et erreurs', () => {
    it('devrait throw NutritionError si meals n\'est pas un tableau', () => {
      expect(() => {
        calculateDailyTotals('not an array', defaultProgram);
      }).toThrow(NutritionError);

      expect(() => {
        calculateDailyTotals({}, defaultProgram);
      }).toThrow(NutritionError);
    });

    it('devrait gérer programme invalide gracieusement', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: 2000,
          totalProtein: 100,
          totalCarbs: 200,
          totalFat: 60
        }
      ];

      const invalidProgram = {
        targetCalories: 'not a number', // Invalide
        targetProtein: -100 // Invalide
      };

      // Ne devrait pas throw, utiliser valeurs par défaut
      const result = calculateDailyTotals(meals, invalidProgram);
      expect(result.targetCalories).toBe(2500); // Valeur par défaut
      expect(result.targetProtein).toBe(150);   // Valeur par défaut
    });
  });

  describe('Protection NaN/Infinity', () => {
    it('devrait gérer NaN dans repas', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: NaN,
          totalProtein: 30,
          totalCarbs: 50,
          totalFat: 20
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      // Devrait normaliser NaN à 0
      expect(result.calories).toBeGreaterThanOrEqual(0);
      expect(isNaN(result.calories)).toBe(false);
    });

    it('devrait gérer Infinity dans repas', () => {
      const meals = [
        {
          id: 'meal-1',
          totalCalories: Infinity,
          totalProtein: 30,
          totalCarbs: 50,
          totalFat: 20
        }
      ];

      const result = calculateDailyTotals(meals, defaultProgram);

      // Devrait limiter Infinity
      expect(isFinite(result.calories)).toBe(true);
      expect(result.calories).toBeLessThanOrEqual(50000);
    });
  });
});

// ==================== TESTS calculateCaloricBalance ====================

describe('calculateCaloricBalance', () => {
  describe('Cas normaux', () => {
    it('devrait calculer bilan correctement avec données Garmin', () => {
      const caloriesConsumed = 2500;
      const garminData = {
        dailyMetrics: {
          '2025-01-16': {
            calories: {
              total: 2200
            }
          }
        }
      };

      const result = calculateCaloricBalance(caloriesConsumed, garminData, '2025-01-16');

      expect(result.consumed).toBe(2500);
      expect(result.burned).toBe(2200);
      expect(result.balance).toBe(300); // 2500 - 2200
      expect(result.classification).toBe('surplus');
      expect(result.percent).toBeGreaterThan(0);
    });

    it('devrait utiliser estimation si pas de données Garmin', () => {
      const caloriesConsumed = 2000;

      const result = calculateCaloricBalance(caloriesConsumed, null, null);

      expect(result.consumed).toBe(2000);
      expect(result.burned).toBe(2000); // Estimation par défaut
      expect(result.balance).toBe(0);
      expect(result.classification).toBe('maintien');
    });

    it('devrait calculer déficit correctement', () => {
      const caloriesConsumed = 1500;
      const garminData = {
        dailyMetrics: {
          '2025-01-16': {
            calories: {
              total: 2500
            }
          }
        }
      };

      const result = calculateCaloricBalance(caloriesConsumed, garminData, '2025-01-16');

      expect(result.balance).toBe(-1000); // 1500 - 2500
      expect(result.classification).toBe('deficit');
      expect(result.percent).toBeLessThan(0);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer calories consommées = 0', () => {
      const result = calculateCaloricBalance(0, null, null);

      expect(result.consumed).toBe(0);
      expect(result.balance).toBeLessThan(0); // Déficit
      expect(result.classification).toBe('deficit');
    });

    it('devrait gérer valeurs très élevées', () => {
      const result = calculateCaloricBalance(50000, null, null);

      expect(result.consumed).toBeLessThanOrEqual(50000);
      expect(isFinite(result.balance)).toBe(true);
    });

    it('devrait gérer date invalide gracieusement', () => {
      const caloriesConsumed = 2000;
      const garminData = {
        dailyMetrics: {
          '2025-01-16': {
            calories: { total: 2200 }
          }
        }
      };

      // Date invalide
      const result = calculateCaloricBalance(caloriesConsumed, garminData, 'invalid-date');

      // Devrait utiliser estimation
      expect(result.burned).toBe(2000); // Estimation
    });
  });

  describe('Validation', () => {
    it('devrait valider calories consommées', () => {
      expect(() => {
        calculateCaloricBalance(-100, null, null);
      }).not.toThrow(); // Devrait normaliser à 0

      const result = calculateCaloricBalance(-100, null, null);
      expect(result.consumed).toBeGreaterThanOrEqual(0);
    });
  });
});

// ==================== TESTS getBalanceClassification ====================

describe('getBalanceClassification', () => {
  it('devrait retourner "surplus" si balance > 200', () => {
    expect(getBalanceClassification(300)).toBe('surplus');
    expect(getBalanceClassification(500)).toBe('surplus');
  });

  it('devrait retourner "deficit" si balance < -200', () => {
    expect(getBalanceClassification(-300)).toBe('deficit');
    expect(getBalanceClassification(-500)).toBe('deficit');
  });

  it('devrait retourner "maintien" si -200 <= balance <= 200', () => {
    expect(getBalanceClassification(0)).toBe('maintien');
    expect(getBalanceClassification(200)).toBe('maintien');
    expect(getBalanceClassification(-200)).toBe('maintien');
    expect(getBalanceClassification(100)).toBe('maintien');
    expect(getBalanceClassification(-100)).toBe('maintien');
  });
});

// ==================== TESTS calculateProgramCompliance ====================

describe('calculateProgramCompliance', () => {
  const program = {
    id: 'program-1',
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80
  };

  const dailyMeals = [
    {
      date: '2025-01-16',
      programId: 'program-1',
      dailyTotals: {
        calories: 2400,
        protein: 140,
        carbs: 290,
        fat: 75,
        complianceScore: 85,
        complianceCalories: -100,
        complianceProtein: -10,
        complianceCarbs: -10,
        complianceFat: -5
      }
    },
    {
      date: '2025-01-17',
      programId: 'program-1',
      dailyTotals: {
        calories: 2600,
        protein: 160,
        carbs: 310,
        fat: 85,
        complianceScore: 90,
        complianceCalories: 100,
        complianceProtein: 10,
        complianceCarbs: 10,
        complianceFat: 5
      }
    }
  ];

  describe('Cas normaux', () => {
    it('devrait calculer conformité sur période', () => {
      const result = calculateProgramCompliance(
        'program-1',
        dailyMeals,
        program,
        '2025-01-16',
        '2025-01-17'
      );

      expect(result).toHaveProperty('avgComplianceScore');
      expect(result).toHaveProperty('daysTotal');
      expect(result).toHaveProperty('daysWithData');
      expect(result).toHaveProperty('caloriesCompliance');
      expect(result.avgComplianceScore).toBeGreaterThanOrEqual(0);
      expect(result.avgComplianceScore).toBeLessThanOrEqual(100);
    });

    it('devrait calculer moyennes correctement', () => {
      const result = calculateProgramCompliance(
        'program-1',
        dailyMeals,
        program,
        '2025-01-16',
        '2025-01-17'
      );

      // Vérifier structure de conformité
      expect(result.caloriesCompliance).toHaveProperty('avg');
      expect(result.caloriesCompliance).toHaveProperty('days');
      expect(result.proteinCompliance).toHaveProperty('avg');
      expect(result.daysTotal).toBe(2);
      expect(result.daysWithData).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer tableau vide de dailyMeals', () => {
      const result = calculateProgramCompliance(
        'program-1',
        [],
        program,
        '2025-01-16',
        '2025-01-17'
      );

      expect(result.avgComplianceScore).toBe(0);
      expect(result.daysTotal).toBe(0);
      expect(result.daysWithData).toBe(0);
      expect(result.caloriesCompliance.avg).toBe(0);
    });

    it('devrait valider plage de dates', () => {
      expect(() => {
        calculateProgramCompliance(
          'program-1',
          dailyMeals,
          program,
          'invalid-date',
          '2025-01-17'
        );
      }).toThrow(NutritionError);
    });
  });
});

// ==================== TESTS getNutritionStats ====================

describe('getNutritionStats', () => {
  const dailyMeals = [
    {
      date: '2025-01-16',
      dailyTotals: {
        calories: 2000,
        protein: 100,
        carbs: 200,
        fat: 60
      }
    },
    {
      date: '2025-01-17',
      dailyTotals: {
        calories: 2500,
        protein: 150,
        carbs: 250,
        fat: 80
      }
    }
  ];

  it('devrait calculer statistiques correctement', () => {
    const result = getNutritionStats(dailyMeals, '2025-01-16', '2025-01-17');

    expect(result).toHaveProperty('avgCalories');
    expect(result).toHaveProperty('avgProtein');
    expect(result).toHaveProperty('totalCalories');
    expect(result.avgCalories).toBe(2250); // (2000 + 2500) / 2
    expect(result.totalCalories).toBe(4500);   // 2000 + 2500
    expect(result.days).toBe(2);
  });

  it('devrait gérer tableau vide', () => {
    const result = getNutritionStats([], '2025-01-16', '2025-01-17');

    expect(result.avgCalories).toBe(0);
    expect(result.totalCalories).toBe(0);
    expect(result.days).toBe(0);
  });
});

// ==================== TESTS getMacroDistribution ====================

describe('getMacroDistribution', () => {
  const dailyMeals = [
    {
      date: '2025-01-16',
      dailyTotals: {
        proteinPercent: 30,
        carbsPercent: 40,
        fatPercent: 30
      }
    }
  ];

  it('devrait calculer distribution macros', () => {
    const result = getMacroDistribution(dailyMeals, '2025-01-16', '2025-01-16');

    expect(result).toHaveProperty('protein');
    expect(result).toHaveProperty('carbs');
    expect(result).toHaveProperty('fat');
    expect(result.protein).toBeGreaterThanOrEqual(0);
    expect(result.protein).toBeLessThanOrEqual(100);
  });
});

// ==================== TESTS Helpers ====================

describe('generateMealId', () => {
  it('devrait générer ID unique', async () => {
    const id1 = generateMealId();
    // Attendre 1ms pour garantir timestamp différent
    await new Promise(resolve => setTimeout(resolve, 1));
    const id2 = generateMealId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^meal_/);
  });
});

describe('generateProgramId', () => {
  it('devrait générer ID unique', async () => {
    const id1 = generateProgramId();
    // Attendre 1ms pour garantir timestamp différent
    await new Promise(resolve => setTimeout(resolve, 1));
    const id2 = generateProgramId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^prog_/);
  });
});

describe('generateFavoriteFoodId', () => {
  it('devrait générer ID unique', async () => {
    const id1 = generateFavoriteFoodId();
    // Attendre 1ms pour garantir timestamp différent
    await new Promise(resolve => setTimeout(resolve, 1));
    const id2 = generateFavoriteFoodId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^food_fav_/);
  });
});

describe('formatDate', () => {
  it('devrait formater date correctement', () => {
    const date = new Date('2025-01-16');
    const result = formatDate(date);

    expect(result).toBe('2025-01-16');
  });

  it('devrait gérer Date object', () => {
    const date = new Date(2025, 0, 16); // Janvier 16, 2025
    const result = formatDate(date);

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysBetween', () => {
  it('devrait calculer nombre de jours correctement', () => {
    const start = '2025-01-16';
    const end = '2025-01-20';

    const result = daysBetween(start, end);

    expect(result).toBe(4); // 16, 17, 18, 19, 20 = 4 jours entre
  });

  it('devrait retourner 0 si même date', () => {
    const date = '2025-01-16';

    const result = daysBetween(date, date);

    expect(result).toBe(0);
  });

  it('devrait gérer dates inversées (retourne valeur négative)', () => {
    const start = '2025-01-20';
    const end = '2025-01-16';

    const result = daysBetween(start, end);

    // daysBetween peut retourner valeur négative si start > end (comportement normal)
    expect(typeof result).toBe('number');
    expect(result).toBeLessThan(0); // -4 jours
  });
});

