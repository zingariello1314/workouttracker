import { z } from 'zod';

/**
 * Corps POST /api/v1/intentions/mutation (Phase 2 — idempotence clientMutationId).
 * @see backend/api_v1_phase2.py
 */
export const MutationEnvelopeV1Schema = z.object({
  clientMutationId: z.string().min(1),
  intent: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional().default({})
});

/** @typedef {z.infer<typeof MutationEnvelopeV1Schema>} MutationEnvelopeV1 */

export function safeParseMutationEnvelopeV1(data) {
  const r = MutationEnvelopeV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
