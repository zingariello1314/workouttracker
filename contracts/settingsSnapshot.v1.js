import { z } from 'zod';

/** Réponse `GET /api/v1/settings/snapshot`. */
export const SettingsSnapshotGetV1Schema = z
  .object({
    settings: z.record(z.string(), z.unknown()),
    updatedAt: z.string().nullable()
  })
  .passthrough();

/** Corps `PUT /api/v1/settings/snapshot` (idempotence via `clientMutationId`). */
export const SettingsSnapshotPutBodyV1Schema = z.object({
  clientMutationId: z.string().min(1),
  settings: z.record(z.string(), z.unknown()).default({})
});

/** Réponse `PUT /api/v1/settings/snapshot`. */
export const SettingsSnapshotPutResponseV1Schema = z
  .object({
    accepted: z.boolean(),
    clientMutationId: z.string().min(1),
    updatedAt: z.string().min(1),
    settings: z.record(z.string(), z.unknown()),
    phase: z.number().optional(),
    note: z.string().optional(),
    idempotentReplay: z.boolean().optional()
  })
  .passthrough();

/** @typedef {z.infer<typeof SettingsSnapshotGetV1Schema>} SettingsSnapshotGetV1 */
/** @typedef {z.infer<typeof SettingsSnapshotPutBodyV1Schema>} SettingsSnapshotPutBodyV1 */
/** @typedef {z.infer<typeof SettingsSnapshotPutResponseV1Schema>} SettingsSnapshotPutResponseV1 */

export function safeParseSettingsSnapshotGetV1(data) {
  const r = SettingsSnapshotGetV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseSettingsSnapshotPutBodyV1(data) {
  const r = SettingsSnapshotPutBodyV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseSettingsSnapshotPutResponseV1(data) {
  const r = SettingsSnapshotPutResponseV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
