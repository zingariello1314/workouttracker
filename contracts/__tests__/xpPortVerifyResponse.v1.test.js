import { describe, it, expect } from 'vitest';
import { safeParseXpPortVerifyResponseV1 } from '../xpPortVerifyResponse.v1.js';

describe('XpPortVerifyResponseV1Schema', () => {
  it('accepte la charge nominale', () => {
    const payload = {
      nutritionFoodItems: 2,
      nutritionFoodXp: 100,
      clientNutritionFoodXpMatch: true,
      booksStreakBonusXp: 71,
      sportXpReferenceTenRepsTwoStarBodyweight: 1
    };
    expect(safeParseXpPortVerifyResponseV1(payload).success).toBe(true);
  });

  it('accepte match et books null', () => {
    const payload = {
      nutritionFoodItems: 0,
      nutritionFoodXp: 0,
      clientNutritionFoodXpMatch: null,
      booksStreakBonusXp: null,
      sportXpReferenceTenRepsTwoStarBodyweight: 1
    };
    expect(safeParseXpPortVerifyResponseV1(payload).success).toBe(true);
  });

  it('rejette un champ manquant', () => {
    expect(
      safeParseXpPortVerifyResponseV1({
        nutritionFoodItems: 0,
        nutritionFoodXp: 0
      }).success
    ).toBe(false);
  });
});
