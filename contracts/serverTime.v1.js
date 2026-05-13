import { z } from 'zod';

/**
 * Réponse GET /api/v1/server-time (horloge serveur UTC, ISO 8601).
 */
export const ServerTimeV1Schema = z.object({
  serverTime: z.string().datetime()
});

/** @typedef {z.infer<typeof ServerTimeV1Schema>} ServerTimeV1 */

export function safeParseServerTimeV1(data) {
  const r = ServerTimeV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
