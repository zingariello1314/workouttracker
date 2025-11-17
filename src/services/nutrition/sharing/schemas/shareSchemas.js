/**
 * shareSchemas.js
 * 
 * ✅ PHASE 12.1 : Schémas Zod pour validation profonde des exports Nutrition
 * 
 * Schémas de validation pour :
 * - Statistiques nutrition (statsPeriodSchema, statsSchema)
 * - Données graphiques (chartTimelineItemSchema, chartsSchema)
 * - Données progression (progressTrendSchema, progressSchema)
 * - Données partagées (shareDataSchema)
 * - Métadonnées (metadataSchema)
 * - Exports (nutritionShareSchemaV1, nutritionShareEncryptedSchemaV1, nutritionShareSchema)
 * 
 * @module services/nutrition/sharing/schemas/shareSchemas
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 1
 */

import { z } from 'zod';

// ==================== SCHEMAS STATISTIQUES ====================

/**
 * ✅ PHASE 4 : Schéma pour les statistiques nutrition
 */
export const statsPeriodSchema = z.object({
  days: z.number().int().min(0).max(365),
  avgCalories: z.number().min(0).max(10000),
  avgProtein: z.number().min(0).max(1000),
  avgCarbs: z.number().min(0).max(1000),
  avgFat: z.number().min(0).max(1000),
  avgCompliance: z.number().min(0).max(100),
  totalMeals: z.number().int().min(0),
  avgMealsPerDay: z.number().min(0).max(10).optional()
});

export const statsSchema = z.object({
  periods: z.object({
    week: statsPeriodSchema.optional(),
    month: statsPeriodSchema.optional(),
    quarter: statsPeriodSchema.optional()
  }),
  totalDays: z.number().int().min(0),
  totalMeals: z.number().int().min(0),
  activeProgram: z.object({
    name: z.string(),
    goal: z.string().optional(),
    hasProgram: z.boolean().optional()
  }).nullable().optional()
});

// ==================== SCHEMAS GRAPHIQUES ====================

/**
 * ✅ PHASE 4 : Schéma pour les données graphiques
 */
export const chartTimelineItemSchema = z.object({
  day: z.number().int().min(1).max(365), // Index jour (privacy)
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  compliance: z.number().min(0).max(100).optional()
});

export const chartsSchema = z.object({
  timeline: z.array(chartTimelineItemSchema).max(365), // Max 1 an
  macroDistribution: z.object({
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100)
  }).optional()
});

// ==================== SCHEMAS PROGRESSION ====================

/**
 * ✅ PHASE 4 : Schéma pour les données progression
 */
export const progressTrendSchema = z.object({
  days: z.number().int().min(0),
  avgCompliance: z.number().min(0).max(100),
  totalMeals: z.number().int().min(0)
});

export const progressSchema = z.object({
  totalDays: z.number().int().min(0),
  totalMeals: z.number().int().min(0),
  streak: z.number().int().min(0),
  level: z.number().int().min(1).max(100),
  badgesCount: z.number().int().min(0),
  trends: z.object({
    week: progressTrendSchema.optional(),
    month: progressTrendSchema.optional()
  }).optional()
});

// ==================== SCHEMAS DONNÉES PARTAGÉES ====================

/**
 * ✅ PHASE 4 : Schéma pour les données partagées (selon scope)
 */
export const shareDataSchema = z.object({
  stats: statsSchema.optional(),
  charts: chartsSchema.optional(),
  progress: progressSchema.optional()
}).refine(
  (data) => data.stats || data.charts || data.progress,
  { message: 'Au moins un scope (stats, charts, progress) doit être présent' }
);

// ==================== SCHEMAS MÉTADONNÉES ====================

/**
 * ✅ PHASE 4 : Schéma pour les métadonnées
 */
export const metadataSchema = z.object({
  generatedAt: z.string().datetime().optional(),
  scope: z.string().optional(),
  readOnly: z.boolean().optional(),
  encrypted: z.boolean().optional()
});

// ==================== SCHEMAS EXPORTS ====================

/**
 * ✅ PHASE 4 : Schéma pour export non chiffré (version 1.0)
 */
export const nutritionShareSchemaV1 = z.object({
  type: z.literal('nutrition_share'),
  version: z.literal('1.0'),
  token: z.string().min(10).max(200), // Token avec préfixe
  scope: z.enum(['all', 'stats', 'charts', 'progress']),
  shareDate: z.string().datetime(),
  expiresAt: z.union([z.number().int().positive(), z.null()]),
  data: shareDataSchema,
  metadata: metadataSchema.optional()
});

/**
 * ✅ PHASE 4 : Schéma pour export chiffré (version 1.0)
 */
export const nutritionShareEncryptedSchemaV1 = z.object({
  type: z.literal('nutrition_share_encrypted'),
  version: z.literal('1.0'),
  algorithm: z.literal('AES-256-CBC'),
  keyDerivation: z.literal('PBKDF2'),
  pbkdf2Iterations: z.number().int().positive(),
  pbkdf2Hasher: z.literal('SHA-256'),
  salt: z.string().regex(/^[0-9a-fA-F]+$/), // Hex string
  iv: z.string().regex(/^[0-9a-fA-F]+$/), // Hex string
  data: z.string(), // Base64 encrypted data
  encryptedAt: z.string().datetime(),
  metadata: z.object({
    originalSize: z.number().int().positive(),
    encryptedSize: z.number().int().positive(),
    compressionRatio: z.string().optional()
  }).optional()
});

/**
 * ✅ PHASE 4 : Schéma union pour support exports chiffrés et non chiffrés
 */
export const nutritionShareSchema = z.union([
  nutritionShareSchemaV1,
  nutritionShareEncryptedSchemaV1
]);


