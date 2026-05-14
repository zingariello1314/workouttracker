import { z } from 'zod';

const programRecordSchema = z.record(z.string(), z.unknown());

/** Réponse `GET /api/v1/sport/program-context`. */
export const SportProgramContextGetV1Schema = z
  .object({
    programs: z.array(programRecordSchema),
    activeProgram: programRecordSchema.nullable(),
    weekVariant: z.string(),
    isGymMode: z.boolean(),
    updatedAt: z.string().nullable()
  })
  .passthrough();

/** Corps `PUT /api/v1/sport/program-context` (idempotence via `clientMutationId`). */
export const SportProgramContextPutBodyV1Schema = z.object({
  clientMutationId: z.string().min(1),
  programs: z.array(programRecordSchema).default([]),
  activeProgram: programRecordSchema.nullable().optional(),
  weekVariant: z.string().min(1).max(8).default('A'),
  isGymMode: z.boolean().default(false)
});

/** Réponse `PUT /api/v1/sport/program-context`. */
export const SportProgramContextPutResponseV1Schema = z
  .object({
    accepted: z.boolean(),
    clientMutationId: z.string().min(1),
    updatedAt: z.string().min(1),
    programs: z.array(programRecordSchema),
    activeProgram: programRecordSchema.nullable().optional(),
    weekVariant: z.string(),
    isGymMode: z.boolean(),
    phase: z.number().optional(),
    note: z.string().optional(),
    idempotentReplay: z.boolean().optional()
  })
  .passthrough();

/** @typedef {z.infer<typeof SportProgramContextGetV1Schema>} SportProgramContextGetV1 */
/** @typedef {z.infer<typeof SportProgramContextPutBodyV1Schema>} SportProgramContextPutBodyV1 */
/** @typedef {z.infer<typeof SportProgramContextPutResponseV1Schema>} SportProgramContextPutResponseV1 */

export function safeParseSportProgramContextGetV1(data) {
  const r = SportProgramContextGetV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseSportProgramContextPutBodyV1(data) {
  const r = SportProgramContextPutBodyV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

export function safeParseSportProgramContextPutResponseV1(data) {
  const r = SportProgramContextPutResponseV1Schema.safeParse(data);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
