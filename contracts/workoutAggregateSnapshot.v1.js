import { z } from 'zod';

const aggregateRecordSchema = z.record(z.string(), z.unknown());

/** Réponse `GET /api/v1/workout/aggregate`. */
export const WorkoutAggregateSnapshotGetV1Schema = z
  .object({
    aggregate: aggregateRecordSchema,
    updatedAt: z.string().nullable()
  })
  .passthrough();

/** Corps `PUT /api/v1/workout/aggregate` (idempotence via `clientMutationId`). */
export const WorkoutAggregateSnapshotPutBodyV1Schema = z.object({
  clientMutationId: z.string().min(1),
  aggregate: aggregateRecordSchema.default({})
});

/** Réponse `PUT /api/v1/workout/aggregate`. */
export const WorkoutAggregateSnapshotPutResponseV1Schema = z
  .object({
    accepted: z.boolean(),
    clientMutationId: z.string().min(1),
    updatedAt: z.string().min(1),
    aggregate: aggregateRecordSchema,
    phase: z.number().optional(),
    note: z.string().optional(),
    idempotentReplay: z.boolean().optional()
  })
  .passthrough();

/** @typedef {z.infer<typeof WorkoutAggregateSnapshotGetV1Schema>} WorkoutAggregateSnapshotGetV1 */
/** @typedef {z.infer<typeof WorkoutAggregateSnapshotPutBodyV1Schema>} WorkoutAggregateSnapshotPutBodyV1 */
/** @typedef {z.infer<typeof WorkoutAggregateSnapshotPutResponseV1Schema>} WorkoutAggregateSnapshotPutResponseV1 */

export function safeParseWorkoutAggregateSnapshotGetV1(data) {
  const r = WorkoutAggregateSnapshotGetV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseWorkoutAggregateSnapshotPutBodyV1(data) {
  const r = WorkoutAggregateSnapshotPutBodyV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseWorkoutAggregateSnapshotPutResponseV1(data) {
  const r = WorkoutAggregateSnapshotPutResponseV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
