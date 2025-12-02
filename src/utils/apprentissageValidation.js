/**
 * Schémas de validation Zod pour le module Apprentissage
 * Validation stricte de toutes les données avant sauvegarde
 */

import { z } from 'zod';
import { LIMITS, SESSION_TYPES, ACCEPTED_FILE_TYPES, ACCEPTED_MIME_TYPES } from './apprentissageConstants';

/**
 * Schéma de validation pour une matière (Subject)
 */
export const SubjectSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(LIMITS.MAX_SUBJECT_NAME_LENGTH, `Le nom ne peut pas dépasser ${LIMITS.MAX_SUBJECT_NAME_LENGTH} caractères`)
    .trim(),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        size: z.number().max(LIMITS.MAX_FILE_SIZE_BYTES, `Taille max: ${LIMITS.MAX_FILE_SIZE_MB}MB`),
        type: z.string(),
        content: z.string().optional(),
      })
    )
    .default([]),
  summary: z
    .string()
    .max(LIMITS.MAX_SUMMARY_LENGTH, `Le résumé ne peut pas dépasser ${LIMITS.MAX_SUMMARY_LENGTH} caractères`)
    .trim()
    .optional()
    .default(''),
  createdAt: z.number().positive('Date de création invalide'),
});

/**
 * Schéma de validation pour une session
 */
export const SessionSchema = z.object({
  id: z.number().optional(),
  subject: z.string().min(1, 'Matière requise'),
  type: z.enum([SESSION_TYPES.WORK, SESSION_TYPES.BREAK], {
    errorMap: () => ({ message: 'Type de session invalide' }),
  }),
  startTime: z.number().positive('Date de début invalide'),
  endTime: z.number().positive('Date de fin invalide').optional(),
  plannedDuration: z.number().positive('Durée planifiée invalide'),
  actualWorkTime: z.number().min(0, 'Temps de travail doit être ≥ 0'),
  isManual: z.boolean().default(false),
  userId: z.string().default('main'),
});

/**
 * Schéma de validation pour la progression d'une matière
 */
export const SubjectProgressionSchema = z.object({
  xp: z.number().min(0, 'XP doit être ≥ 0'),
  level: z.number().int().min(1, 'Niveau doit être ≥ 1'),
  sessions: z.number().int().min(0, 'Nombre de sessions doit être ≥ 0'),
  totalTime: z.number().min(0, 'Temps total doit être ≥ 0'),
  perfectSessions: z.number().int().min(0).default(0),
  earlyMorningSessions: z.number().int().min(0).default(0),
  lateEveningSessions: z.number().int().min(0).default(0),
  weekendSessions: z.number().int().min(0).default(0),
  longSessions: z.number().int().min(0).default(0),
  quickSessions: z.number().int().min(0).default(0),
  lastStudyDate: z.string().nullable().optional(),
  weeklyXP: z.array(z.number()).default([]),
  monthlyXP: z.array(z.number()).default([]),
});

/**
 * Schéma de validation pour la progression globale
 */
export const GlobalProgressionSchema = z.object({
  globalLevel: z.number().int().min(1, 'Niveau global doit être ≥ 1'),
  globalXP: z.number().min(0, 'XP global doit être ≥ 0'),
  totalStudyTime: z.number().min(0, 'Temps total doit être ≥ 0'),
  unlockedBadges: z.array(z.string()).default([]),
  unlockedTrophies: z.array(z.string()).default([]),
  dailyStreak: z.number().int().min(0, 'Streak doit être ≥ 0'),
  lastStudyDate: z.string().nullable().optional(),
  weeklyGoals: z.record(z.any()).default({}),
  monthlyStats: z.record(z.any()).default({}),
  progressionHistory: z.array(z.any()).default([]),
  subjects: z.record(z.string(), SubjectProgressionSchema).default({}),
});

/**
 * Schéma de validation pour le timer
 */
export const TimerSchema = z.object({
  remainingTime: z.number().int().min(0, 'Temps restant doit être ≥ 0'),
  plannedDuration: z.number().int().positive('Durée planifiée doit être > 0'),
  silentMode: z.boolean().default(false),
});

/**
 * Schéma de validation pour le planificateur
 */
export const PlannerSchema = z.object({
  compactMode: z.boolean().default(false),
  subjectOrder: z.record(z.string(), z.number().int().min(1).max(7)).default({}),
  currentWeekOffset: z.number().int().default(0),
});

/**
 * Valider un fichier uploadé
 */
export const validateFile = (file) => {
  // Vérifier taille
  if (file.size > LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Fichier trop volumineux (max: ${LIMITS.MAX_FILE_SIZE_MB}MB)`,
    };
  }

  // Vérifier extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!ACCEPTED_FILE_TYPES.includes(extension)) {
    return {
      valid: false,
      error: `Type de fichier non accepté. Types acceptés: ${ACCEPTED_FILE_TYPES.join(', ')}`,
    };
  }

  // Vérifier type MIME
  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Type MIME non accepté',
    };
  }

  return { valid: true };
};

/**
 * Valider et parser des données avec un schéma
 */
export const validateAndParse = (schema, data) => {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ path: 'unknown', message: 'Erreur de validation inconnue' }],
    };
  }
};

/**
 * Valider un tableau de sujets
 */
export const validateSubjects = (subjects) => {
  const results = subjects.map((subject, index) => {
    const result = validateAndParse(SubjectSchema, subject);
    return { index, ...result };
  });

  const invalid = results.filter((r) => !r.success);
  return {
    valid: invalid.length === 0,
    results,
    errors: invalid,
  };
};

/**
 * Valider une session
 */
export const validateSession = (session) => {
  return validateAndParse(SessionSchema, session);
};

/**
 * Valider la progression globale
 */
export const validateGlobalProgression = (progression) => {
  return validateAndParse(GlobalProgressionSchema, progression);
};

export default {
  SubjectSchema,
  SessionSchema,
  SubjectProgressionSchema,
  GlobalProgressionSchema,
  TimerSchema,
  PlannerSchema,
  validateFile,
  validateAndParse,
  validateSubjects,
  validateSession,
  validateGlobalProgression,
};

