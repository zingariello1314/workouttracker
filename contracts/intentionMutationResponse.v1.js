import { z } from 'zod';

/**
 * Réponse POST /api/v1/intentions/mutation (acceptée ou rejouée idempotent).
 * Champs additionnels tolérés (`.passthrough()`) pour évolutions sans bump majeur.
 */
export const IntentionMutationResponseV1Schema = z
  .object({
    clientMutationId: z.string().min(1),
    intent: z.string().min(1),
    accepted: z.boolean().optional(),
    userId: z.string().optional(),
    phase: z.number().optional(),
    note: z.string().optional(),
    idempotentReplay: z.boolean().optional()
  })
  .passthrough();

/** @typedef {z.infer<typeof IntentionMutationResponseV1Schema>} IntentionMutationResponseV1 */

export function safeParseIntentionMutationResponseV1(data) {
  const r = IntentionMutationResponseV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
