/**
 * Schémas de validation Zod centralisés
 * 
 * ✅ PHASE 1 : Validation des données avec Zod pour tous les formulaires
 * 
 * @module utils/validation/schemas
 */

import { z } from 'zod';

// ============================================================================
// SCHÉMAS COMMUNS
// ============================================================================

/**
 * Schéma pour les dates
 */
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
  .refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }, 'Date invalide')
  .refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d <= today;
  }, 'La date ne peut pas être dans le futur')
  .refine((date) => {
    const d = new Date(date);
    const minDate = new Date('1900-01-01');
    return d >= minDate;
  }, 'La date doit être après 1900');

/**
 * Schéma pour les nombres positifs
 */
export const positiveNumberSchema = z.number()
  .positive('Doit être un nombre positif')
  .finite('Doit être un nombre fini')
  .refine((val) => !isNaN(val), 'Ne peut pas être NaN')
  .refine((val) => isFinite(val), 'Ne peut pas être Infinity');

/**
 * Schéma pour les montants financiers
 */
export const amountSchema = positiveNumberSchema
  .max(1000000000, 'Le montant est trop élevé');

/**
 * Schéma pour les pourcentages
 */
export const percentageSchema = z.number()
  .min(0, 'Le pourcentage doit être >= 0')
  .max(100, 'Le pourcentage doit être <= 100')
  .finite('Doit être un nombre fini');

// ============================================================================
// SCHÉMAS FINANCE
// ============================================================================

/**
 * Schéma pour une position boursière
 */
export const positionSchema = z.object({
  ticker: z.string()
    .min(1, 'Le ticker est requis')
    .max(10, 'Le ticker ne peut pas dépasser 10 caractères')
    .regex(/^[A-Z0-9.]+$/, 'Le ticker ne peut contenir que des lettres majuscules, chiffres et points')
    .transform((val) => val.toUpperCase().trim()),
  entreprise: z.string()
    .max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères')
    .optional()
    .default(''),
  quantite: positiveNumberSchema
    .max(1000000, 'La quantité est trop élevée'),
  prixEntree: amountSchema,
  dateAchat: dateSchema
});

/**
 * Schéma pour une dépense budgétaire
 */
export const expenseSchema = z.object({
  montant: amountSchema,
  categorie: z.string()
    .min(1, 'La catégorie est requise')
    .max(50, 'La catégorie ne peut pas dépasser 50 caractères'),
  description: z.string()
    .max(200, 'La description ne peut pas dépasser 200 caractères')
    .optional()
    .default(''),
  date: dateSchema,
  tags: z.array(z.string())
    .optional()
    .default([])
});

/**
 * Schéma pour un investissement
 */
export const investmentSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  type: z.enum(['action', 'obligation', 'crypto', 'or', 'immobilier', 'autre'], {
    errorMap: () => ({ message: 'Type d\'investissement invalide' })
  }),
  montant: amountSchema,
  dateAchat: dateSchema,
  rendementAttendu: percentageSchema.optional(),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default('')
});

// ============================================================================
// SCHÉMAS QUÊTES
// ============================================================================

/**
 * Schéma pour une quête
 */
export const questSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
  categorie: z.string()
    .min(1, 'La catégorie est requise'),
  difficulte: z.coerce
    .number()
    .int('La difficulté doit être un entier')
    .min(1, 'La difficulté doit être >= 1')
    .max(4, 'La difficulté doit être <= 4'),
  duree: z.coerce
    .number()
    .int('La durée doit être un entier')
    .min(5, 'La durée minimum est 5 minutes')
    .max(420, 'La durée maximum est 420 minutes'),
  type: z.enum(['recurrente', 'exceptionnelle'], {
    errorMap: () => ({ message: 'Type de quête invalide' })
  }),
  jours: z.array(z.number().int().min(1).max(7))
    .optional()
    .default([1, 2, 3, 4, 5]),
  date: z.string()
    .optional()
    .default(''),
  heureType: z.enum(['creneau', 'precise'])
    .optional()
    .default('precise'),
  creneau: z.string()
    .optional()
    .default(''),
  priere: z.string()
    .optional()
    .default('')
    .refine((v) => !v || ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(v), 'Prière invalide'),
  heure: z.string()
    .optional()
    .default('')
    .refine((v) => !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v), 'Format attendu : HH:mm'),
  multiSlotsEnabled: z.boolean()
    .optional()
    .default(false),
  multiSlots: z.array(
    z.object({
      slot: z.enum(['matin', 'midi', 'soir']),
      enabled: z.boolean().optional().default(false),
      heure: z.string()
        .optional()
        .default('')
        .refine((v) => !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v), 'Format attendu : HH:mm')
    })
  ).optional().default([]),
  active: z.boolean()
    .default(true)
}).refine(
  (data) => data.heureType !== 'creneau' || ['matin', 'midi', 'apres-midi', 'soir', 'nuit'].includes(data.creneau || ''),
  { message: 'Choisis un créneau (matin, midi, après-midi, soir, nuit)', path: ['creneau'] }
).refine(
  (data) => data.categorie !== 'Prière' || ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(data.priere || ''),
  { message: 'Choisis une prière (Fajr, Dhuhr, Asr, Maghrib, Isha)', path: ['priere'] }
);

// ============================================================================
// SCHÉMAS LIVRES
// ============================================================================

/**
 * Schéma pour un livre
 */
export const bookSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  author: z.string()
    .min(1, 'L\'auteur est requis')
    .max(100, 'Le nom de l\'auteur ne peut pas dépasser 100 caractères'),
  year: z.union([
    z.string()
      .regex(/^\d{4}$/, 'L\'année doit être au format YYYY')
      .refine((year) => {
        const y = parseInt(year);
        return y >= 1000 && y <= new Date().getFullYear() + 1;
      }, 'L\'année doit être entre 1000 et l\'année prochaine'),
    z.number()
      .int('L\'année doit être un entier')
      .min(1000, 'L\'année doit être >= 1000')
      .max(new Date().getFullYear() + 1, 'L\'année ne peut pas être dans le futur')
  ])
    .optional()
    .default('')
    .transform((val) => typeof val === 'string' ? val : String(val)),
  genre: z.string()
    .max(50, 'Le genre ne peut pas dépasser 50 caractères')
    .optional()
    .default(''),
  pages: z.union([
    z.string()
      .regex(/^\d+$/, 'Le nombre de pages doit être un nombre')
      .refine((pages) => {
        const p = parseInt(pages);
        return p > 0 && p <= 100000;
      }, 'Le nombre de pages doit être entre 1 et 100000'),
    z.number()
      .int('Le nombre de pages doit être un entier')
      .min(1, 'Le nombre de pages doit être >= 1')
      .max(100000, 'Le nombre de pages doit être <= 100000')
  ])
    .optional()
    .default('')
    .transform((val) => typeof val === 'string' ? val : String(val)),
  status: z.enum(['in-progress', 'completed', 'to-read', 'abandoned', 'paused'], {
    errorMap: () => ({ message: 'Statut invalide' })
  }),
  shortSummary: z.string()
    .max(500, 'Le résumé court ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
  longSummary: z.string()
    .max(5000, 'Le résumé long ne peut pas dépasser 5000 caractères')
    .optional()
    .default(''),
  personalScore: z.coerce.number()
    .int('Le score doit être un entier')
    .min(0, 'Le score doit être >= 0')
    .max(10, 'Le score doit être <= 10')
    .optional()
    .default(0),
  /** Date (YYYY-MM-DD) où le livre a été terminé (auto ou manuel). */
  finishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format finishedAt invalide')
    .optional()
});

const readingCriterionScoreSchema = z.coerce
  .number()
  .int()
  .min(1, 'Chaque critère doit être entre 1 et 10')
  .max(10, 'Chaque critère doit être entre 1 et 10');

/**
 * Schéma pour une session de lecture
 * Accepte string ou number pour durationMinutes/pagesRead (formulaire envoie souvent un number).
 */
export const readingSessionSchema = z
  .object({
    date: dateSchema,
    durationMinutes: z.union([z.string(), z.number()])
      .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
      .refine(
        (d) => !Number.isNaN(d) && d >= 0 && d <= 1440,
        'La durée doit être entre 0 et 1440 minutes'
      )
      .optional()
      .default(0),
    pagesRead: z.union([z.string(), z.number()])
      .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
      .refine((p) => !Number.isNaN(p) && p >= 0 && p <= 10000, 'Le nombre de pages doit être entre 0 et 10000')
      .optional()
      .default(0),
    startTime: z.string()
      .optional()
      .default('')
      .refine(
        (v) => !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        'Heure invalide (format attendu : HH:mm)'
      ),
    note: z.string()
      .max(1000, 'La note ne peut pas dépasser 1000 caractères')
      .optional()
      .default(''),
    criteriaRatings: z
      .object({
        immersion: readingCriterionScoreSchema.optional(),
        rythme: readingCriterionScoreSchema.optional(),
        richesse: readingCriterionScoreSchema.optional(),
        concentration: readingCriterionScoreSchema.optional(),
        plaisir: readingCriterionScoreSchema.optional(),
      })
      .optional()
      .default({}),
  })
  .superRefine((data, ctx) => {
    const dur = data.durationMinutes ?? 0;
    const pages = data.pagesRead ?? 0;
    if (dur <= 0 && pages <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Renseigne au moins une durée > 0 ou des pages lues > 0',
        path: ['durationMinutes'],
      });
    }
  })
  .transform((data) => {
    const { criteriaRatings: rawCr, ...rest } = data;
    const cr = rawCr && typeof rawCr === 'object' ? rawCr : {};
    const criteriaRatings = {
      immersion: cr.immersion ?? 5,
      rythme: cr.rythme ?? 5,
      richesse: cr.richesse ?? 5,
      concentration: cr.concentration ?? 5,
      plaisir: cr.plaisir ?? 5,
    };
    const sum =
      criteriaRatings.immersion +
      criteriaRatings.rythme +
      criteriaRatings.richesse +
      criteriaRatings.concentration +
      criteriaRatings.plaisir;
    const sessionScore = Math.round((sum / 5) * 10) / 10;
    return { ...rest, criteriaRatings, sessionScore };
  });

// ============================================================================
// SCHÉMAS APPRENTISSAGE
// ============================================================================

/**
 * Schéma pour une matière
 */
export const subjectSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
  couleur: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être au format hexadécimal (#RRGGBB)')
    .optional()
    .default('#3b82f6')
});

/**
 * Schéma pour une session d'apprentissage
 */
export const learningSessionSchema = z.object({
  matiereId: z.string()
    .min(1, 'La matière est requise'),
  duree: z.number()
    .int('La durée doit être un entier')
    .min(1, 'La durée minimum est 1 minute')
    .max(480, 'La durée maximum est 480 minutes'),
  date: dateSchema,
  note: z.string()
    .max(1000, 'La note ne peut pas dépasser 1000 caractères')
    .optional()
    .default('')
});

// ============================================================================
// SCHÉMAS NUTRITION
// ============================================================================

/**
 * Schéma pour un repas
 */
export const mealSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  calories: z.number()
    .int('Les calories doivent être un entier')
    .min(0, 'Les calories doivent être >= 0')
    .max(10000, 'Les calories sont trop élevées'),
  proteines: z.number()
    .min(0, 'Les protéines doivent être >= 0')
    .max(1000, 'Les protéines sont trop élevées')
    .optional()
    .default(0),
  glucides: z.number()
    .min(0, 'Les glucides doivent être >= 0')
    .max(1000, 'Les glucides sont trop élevées')
    .optional()
    .default(0),
  lipides: z.number()
    .min(0, 'Les lipides doivent être >= 0')
    .max(1000, 'Les lipides sont trop élevées')
    .optional()
    .default(0),
  date: dateSchema,
  type: z.enum(['petit-dejeuner', 'dejeuner', 'diner', 'collation'], {
    errorMap: () => ({ message: 'Type de repas invalide' })
  })
});

// ============================================================================
// SCHÉMAS SPORT
// ============================================================================

/**
 * Schéma pour un exercice
 */
export const exerciseSchema = z.object({
  nom: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  series: z.number()
    .int('Le nombre de séries doit être un entier')
    .min(1, 'Le nombre de séries doit être >= 1')
    .max(50, 'Le nombre de séries est trop élevé'),
  reps: z.string()
    .regex(/^\d+(-\d+)?$/, 'Format de répétitions invalide (ex: 8 ou 8-12)')
    .optional()
    .default(''),
  poids: z.number()
    .min(0, 'Le poids doit être >= 0')
    .max(1000, 'Le poids est trop élevé')
    .optional()
    .default(0),
  repos: z.number()
    .int('Le temps de repos doit être un entier')
    .min(0, 'Le temps de repos doit être >= 0')
    .max(600, 'Le temps de repos maximum est 600 secondes')
    .optional()
    .default(60)
});

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Valide des données avec un schéma Zod
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {any} data - Données à valider
 * @returns {{ success: boolean, data?: any, errors?: Record<string, string> }}
 */
export const validateWithSchema = (schema, data) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    // Zod v4 : `issues` ; Zod v3 : alias `errors` → mêmes entrées
    const issues =
      error instanceof z.ZodError ? error.issues ?? error.errors : null;
    if (Array.isArray(issues) && issues.length > 0) {
      const errors = {};
      issues.forEach((err) => {
        const path = err.path || [];
        const field = path.length > 0 ? path[0] : '_global';
        const key = String(field);
        if (!errors[key]) {
          errors[key] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _global: error?.message || 'Erreur de validation' } };
  }
};

/**
 * Valide des données avec un schéma Zod (safe parse)
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {any} data - Données à valider
 * @returns {z.SafeParseReturnType}
 */
export const safeValidate = (schema, data) => {
  return schema.safeParse(data);
};

export default {
  // Communs
  dateSchema,
  positiveNumberSchema,
  amountSchema,
  percentageSchema,
  
  // Finance
  positionSchema,
  expenseSchema,
  investmentSchema,
  
  // Quêtes
  questSchema,
  
  // Livres
  bookSchema,
  readingSessionSchema,
  
  // Apprentissage
  subjectSchema,
  learningSessionSchema,
  
  // Nutrition
  mealSchema,
  
  // Sport
  exerciseSchema,
  
  // Utilitaires
  validateWithSchema,
  safeValidate
};
