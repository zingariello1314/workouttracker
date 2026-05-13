import { z } from 'zod';

/**
 * Réponse attendue de GET /api/v1/health (FastAPI Momentum).
 * Versionnée pour le client mobile annexe et le desktop (Remote).
 */
export const MomentumApiV1HealthSchema = z.object({
  service: z.literal('momentum-api'),
  version: z.number().int().positive(),
  status: z.enum(['ok', 'degraded']),
  zlib_ready: z.boolean().optional(),
  auth_db_ready: z.boolean().optional(),
  supabase_configured: z.boolean().optional(),
  supabase_reachable: z.boolean().optional()
});

/** @typedef {z.infer<typeof MomentumApiV1HealthSchema>} MomentumApiV1Health */

/**
 * @param {unknown} data
 * @returns {{ success: true, data: MomentumApiV1Health } | { success: false, error: z.ZodError }}
 */
export function safeParseMomentumApiV1Health(data) {
  const r = MomentumApiV1HealthSchema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
