import { z } from 'zod';

/**
 * Réponse POST /api/v1/xp/port-verify (alignée `backend/api_v1_xp.py`).
 */
export const XpPortVerifyResponseV1Schema = z.object({
  nutritionFoodItems: z.number().int().nonnegative(),
  nutritionFoodXp: z.number().int().nonnegative(),
  clientNutritionFoodXpMatch: z.boolean().nullable().optional(),
  booksStreakBonusXp: z.number().int().nullable().optional(),
  sportXpReferenceTenRepsTwoStarBodyweight: z.number().int()
});

/** @typedef {z.infer<typeof XpPortVerifyResponseV1Schema>} XpPortVerifyResponseV1 */

export function safeParseXpPortVerifyResponseV1(data) {
  const r = XpPortVerifyResponseV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
