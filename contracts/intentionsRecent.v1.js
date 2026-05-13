import { z } from 'zod';

/**
 * Réponse GET /api/v1/intentions/recent (Phase 2).
 */
export const IntentionsRecentItemV1Schema = z.object({
  clientMutationId: z.string(),
  intent: z.string(),
  accepted: z.boolean().optional(),
  createdAt: z.string().min(1)
});

export const IntentionsRecentV1Schema = z.object({
  items: z.array(IntentionsRecentItemV1Schema)
});

/** @typedef {z.infer<typeof IntentionsRecentV1Schema>} IntentionsRecentV1 */

export function safeParseIntentionsRecentV1(data) {
  const r = IntentionsRecentV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
