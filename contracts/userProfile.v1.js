import { z } from 'zod';

/**
 * Profil utilisateur minimal pour premier pilote sync (Supabase ou API).
 * Étendre sans casser : nouveaux champs optionnels + bump version schéma si breaking.
 */
export const UserProfileV1Schema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  updatedAt: z.string().datetime().optional()
});

/** @typedef {z.infer<typeof UserProfileV1Schema>} UserProfileV1 */

export function safeParseUserProfileV1(data) {
  const r = UserProfileV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
