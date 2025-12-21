/**
 * budgetSchemas.js
 * 
 * Schémas Zod pour validation type-safe des données Budget Personnel
 * 
 * ✅ SOLUTION 1.6 : Validation complète avec Zod
 * 
 * - Validation complète des structures de données
 * - Limites de taille et plages de valeurs pour protection DoS
 * - Validation des types et formats (dates, nombres, montants, etc.)
 * - Support données optionnelles et valeurs par défaut
 * - Messages d'erreur descriptifs pour debugging
 * - Protection contre données corrompues
 * 
 * @module services/finance/budgetSchemas
 */

import { z } from 'zod';
import logger from '../../utils/logger';

const log = logger.module('budgetSchemas');

// ==================== HELPERS ====================

/**
 * Regex pour validation format date YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validation date avec format strict YYYY-MM-DD
 */
const dateStringSchema = z.string()
  .regex(DATE_REGEX, 'Format date invalide. Doit être YYYY-MM-DD')
  .refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Date invalide');

/**
 * Validation ISO timestamp (date + heure)
 */
const isoTimestampSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Format timestamp invalide. Doit être ISO 8601')
  .refine((ts) => {
    const d = new Date(ts);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Timestamp invalide');

/**
 * Schéma pour montants financiers (positifs, finis, avec limite raisonnable)
 * Protection DoS : limite à 10 millions €
 */
const montantSchema = z.number()
  .nonnegative('Le montant doit être positif ou nul')
  .finite('Le montant doit être un nombre fini')
  .max(10000000, 'Montant trop élevé (>10,000,000€)'); // Protection DoS

/**
 * Schéma pour pourcentages (0-100%)
 */
const percentageSchema = z.number()
  .min(0, 'Le pourcentage doit être >= 0')
  .max(100, 'Le pourcentage doit être <= 100')
  .finite('Le pourcentage doit être un nombre fini');

/**
 * Schéma pour ID (string non vide)
 */
const idSchema = z.string()
  .min(1, 'ID requis')
  .max(200, 'ID trop long (>200 caractères)');

/**
 * Schéma pour couleur hexadécimale (#RRGGBB ou #RRGGBBAA)
 */
const colorSchema = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, 'Format couleur invalide. Doit être #RRGGBB ou #RRGGBBAA');

// ==================== SCHEMAS BUDGET ====================

/**
 * Schéma pour la structure depenses dans Budget
 */
const budgetDepensesSchema = z.object({
  categories: z.array(idSchema).default([])
}).passthrough(); // Permettre autres champs pour compatibilité

/**
 * Schéma pour la structure epargne dans Budget
 */
const budgetEpargneSchema = z.object({
  objectif: montantSchema.default(0),
  actuelle: montantSchema.default(0)
}).passthrough();

/**
 * Schéma complet pour Budget
 */
export const budgetSchema = z.object({
  id: idSchema,
  revenus: montantSchema.default(0),
  depenses: budgetDepensesSchema.default({ categories: [] }),
  epargne: budgetEpargneSchema.default({
    objectif: 0,
    actuelle: 0
  })
}).passthrough(); // Permettre autres champs pour compatibilité future

// ==================== SCHEMAS CATEGORY ====================

/**
 * Schéma pour règles d'alerte dans Category
 */
const categoryReglesSchema = z.object({
  alerte80: z.boolean().default(true),
  alerte100: z.boolean().default(true),
  alerte120: z.boolean().default(true),
  action80: z.enum(['NOTIFICATION', 'WARNING', 'BLOCK', 'NONE'], {
    errorMap: () => ({ message: 'Action invalide (NOTIFICATION, WARNING, BLOCK, NONE)' })
  }).default('NOTIFICATION'),
  action100: z.enum(['NOTIFICATION', 'WARNING', 'BLOCK', 'BLOCK_STRICT', 'NONE'], {
    errorMap: () => ({ message: 'Action invalide (NOTIFICATION, WARNING, BLOCK, BLOCK_STRICT, NONE)' })
  }).default('BLOCK'),
  action120: z.enum(['NOTIFICATION', 'WARNING', 'BLOCK', 'BLOCK_STRICT', 'NONE'], {
    errorMap: () => ({ message: 'Action invalide (NOTIFICATION, WARNING, BLOCK, BLOCK_STRICT, NONE)' })
  }).default('BLOCK_STRICT')
}).passthrough();

/**
 * Schéma complet pour Category
 */
export const categorySchema = z.object({
  id: idSchema,
  nom: z.string()
    .min(1, 'Le nom de catégorie est requis')
    .max(100, 'Le nom de catégorie est trop long (>100 caractères)'),
  budgetMensuel: montantSchema.default(0),
  sousCategories: z.array(
    z.string()
      .min(1, 'Nom sous-catégorie requis')
      .max(100, 'Nom sous-catégorie trop long (>100 caractères)')
  ).default([]),
  icone: z.string()
    .max(10, 'Icône trop longue (>10 caractères)')
    .default('📁'),
  couleur: colorSchema.default('#6b7280'),
  ordre: z.number()
    .int('L\'ordre doit être un entier')
    .nonnegative('L\'ordre doit être positif ou nul')
    .default(0),
  regles: categoryReglesSchema.default({
    alerte80: true,
    alerte100: true,
    alerte120: true,
    action80: 'NOTIFICATION',
    action100: 'BLOCK',
    action120: 'BLOCK_STRICT'
  }),
  createdAt: isoTimestampSchema.optional(),
  updatedAt: isoTimestampSchema.optional()
}).passthrough(); // Permettre autres champs pour compatibilité

// ==================== SCHEMAS DEPENSE ====================

/**
 * Schéma pour statut de dépense
 */
const depenseStatutSchema = z.enum(['paye', 'en_attente', 'annule'], {
  errorMap: () => ({ message: 'Statut invalide (paye, en_attente, annule)' })
});

/**
 * Schéma complet pour Depense
 */
export const depenseSchema = z.object({
  id: idSchema,
  titre: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long (>200 caractères)'),
  montant: montantSchema,
  date: dateStringSchema,
  categorie: idSchema,
  statut: depenseStatutSchema.default('paye'),
  notes: z.string()
    .max(2000, 'Les notes sont trop longues (>2000 caractères)')
    .default(''),
  createdAt: isoTimestampSchema.optional(),
  updatedAt: isoTimestampSchema.optional()
}).passthrough(); // Permettre autres champs pour compatibilité

// ==================== SCHEMAS DEPENSE PLANIFIEE ====================

/**
 * Schéma pour priorité de dépense planifiée
 */
const depensePrioriteSchema = z.enum(['faible', 'normal', 'haute', 'urgente'], {
  errorMap: () => ({ message: 'Priorité invalide (faible, normal, haute, urgente)' })
});

/**
 * Schéma pour statut de dépense planifiée
 */
const depensePlanifieeStatutSchema = z.enum(['planifie', 'confirme', 'reporte', 'annule'], {
  errorMap: () => ({ message: 'Statut invalide (planifie, confirme, reporte, annule)' })
});

/**
 * Schéma complet pour DepensePlanifiee
 */
export const depensePlanifieeSchema = z.object({
  id: idSchema,
  titre: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long (>200 caractères)'),
  montant: montantSchema,
  date: dateStringSchema,
  categorie: idSchema.optional(),
  statut: depensePlanifieeStatutSchema.default('planifie'),
  priorite: depensePrioriteSchema.default('normal'),
  notes: z.string()
    .max(2000, 'Les notes sont trop longues (>2000 caractères)')
    .default(''),
  createdAt: isoTimestampSchema.optional(),
  updatedAt: isoTimestampSchema.optional()
}).passthrough(); // Permettre autres champs pour compatibilité

// ==================== SCHEMAS CHARGE FIXE ====================

/**
 * Schéma pour type de charge fixe
 */
const chargeTypeSchema = z.enum(['mensuel', 'trimestriel', 'semestriel', 'annuel', 'ponctuel'], {
  errorMap: () => ({ message: 'Type invalide (mensuel, trimestriel, semestriel, annuel, ponctuel)' })
});

/**
 * Schéma pour fréquence de charge fixe
 */
const chargeFrequenceSchema = z.object({
  type: chargeTypeSchema,
  jour: z.number()
    .int('Le jour doit être un entier')
    .min(1, 'Le jour doit être >= 1')
    .max(31, 'Le jour doit être <= 31')
    .optional(),
  mois: z.number()
    .int('Le mois doit être un entier')
    .min(0, 'Le mois doit être >= 0')
    .max(11, 'Le mois doit être <= 11')
    .optional() // 0-11 pour correspondre à Date.getMonth()
}).passthrough();

/**
 * Schéma complet pour ChargeFixe
 */
export const chargeFixeSchema = z.object({
  id: idSchema,
  titre: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long (>200 caractères)'),
  montant: montantSchema,
  frequence: chargeFrequenceSchema,
  dateDebut: dateStringSchema.optional(),
  dateFin: dateStringSchema.optional(),
  notes: z.string()
    .max(2000, 'Les notes sont trop longues (>2000 caractères)')
    .default(''),
  active: z.boolean().default(true),
  createdAt: isoTimestampSchema.optional(),
  updatedAt: isoTimestampSchema.optional()
}).passthrough(); // Permettre autres champs pour compatibilité

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Valide un objet Budget
 * 
 * @param {Object} budget - Budget à valider
 * @param {Object} options - Options { strict, throwOnError }
 * @returns {Object} Budget validé ou null si erreur
 */
export function validateBudget(budget, options = {}) {
  const { strict = false, throwOnError = true } = options;
  
  try {
    const schema = strict ? budgetSchema.strict() : budgetSchema;
    return schema.parse(budget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[validateBudget] Validation error:', {
        errors: error.errors,
        budget
      });
      
      if (throwOnError) {
        throw new Error(`Budget invalide: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Valide un objet Category
 * 
 * @param {Object} category - Category à valider
 * @param {Object} options - Options { strict, throwOnError }
 * @returns {Object} Category validée ou null si erreur
 */
export function validateCategory(category, options = {}) {
  const { strict = false, throwOnError = true } = options;
  
  try {
    const schema = strict ? categorySchema.strict() : categorySchema;
    return schema.parse(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[validateCategory] Validation error:', {
        errors: error.errors,
        category
      });
      
      if (throwOnError) {
        throw new Error(`Category invalide: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Valide un objet Depense
 * 
 * @param {Object} depense - Depense à valider
 * @param {Object} options - Options { strict, throwOnError }
 * @returns {Object} Depense validée ou null si erreur
 */
export function validateDepense(depense, options = {}) {
  const { strict = false, throwOnError = true } = options;
  
  try {
    const schema = strict ? depenseSchema.strict() : depenseSchema;
    return schema.parse(depense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[validateDepense] Validation error:', {
        errors: error.errors,
        depense
      });
      
      if (throwOnError) {
        throw new Error(`Depense invalide: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Valide un objet DepensePlanifiee
 * 
 * @param {Object} depensePlanifiee - DepensePlanifiee à valider
 * @param {Object} options - Options { strict, throwOnError }
 * @returns {Object} DepensePlanifiee validée ou null si erreur
 */
export function validateDepensePlanifiee(depensePlanifiee, options = {}) {
  const { strict = false, throwOnError = true } = options;
  
  try {
    const schema = strict ? depensePlanifieeSchema.strict() : depensePlanifieeSchema;
    return schema.parse(depensePlanifiee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[validateDepensePlanifiee] Validation error:', {
        errors: error.errors,
        depensePlanifiee
      });
      
      if (throwOnError) {
        throw new Error(`DepensePlanifiee invalide: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Valide un objet ChargeFixe
 * 
 * @param {Object} chargeFixe - ChargeFixe à valider
 * @param {Object} options - Options { strict, throwOnError }
 * @returns {Object} ChargeFixe validée ou null si erreur
 */
export function validateChargeFixe(chargeFixe, options = {}) {
  const { strict = false, throwOnError = true } = options;
  
  try {
    const schema = strict ? chargeFixeSchema.strict() : chargeFixeSchema;
    return schema.parse(chargeFixe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[validateChargeFixe] Validation error:', {
        errors: error.errors,
        chargeFixe
      });
      
      if (throwOnError) {
        throw new Error(`ChargeFixe invalide: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Valide plusieurs objets en batch
 * 
 * @param {Array} items - Tableau d'objets à valider
 * @param {Function} validator - Fonction de validation (validateCategory, validateDepense, etc.)
 * @param {Object} options - Options { throwOnError }
 * @returns {Array} Tableau d'objets validés (null pour ceux invalides si throwOnError=false)
 */
export function validateBatch(items, validator, options = {}) {
  const { throwOnError = false } = options;
  
  if (!Array.isArray(items)) {
    throw new Error('validateBatch: items doit être un tableau');
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i++) {
    try {
      const validated = validator(items[i], { throwOnError: true, strict: false });
      results.push(validated);
    } catch (error) {
      errors.push({ index: i, error: error.message, item: items[i] });
      
      if (throwOnError) {
        throw new Error(`Erreur validation item ${i}: ${error.message}`);
      }
      
      results.push(null);
    }
  }
  
  if (errors.length > 0) {
    log.warn('[validateBatch] Some items failed validation:', {
      total: items.length,
      failed: errors.length,
      errors
    });
  }
  
  return results;
}

/**
 * Valide un tableau de categories
 */
export function validateCategories(categories, options = {}) {
  return validateBatch(categories, validateCategory, options);
}

/**
 * Valide un tableau de depenses
 */
export function validateDepenses(depenses, options = {}) {
  return validateBatch(depenses, validateDepense, options);
}

/**
 * Valide un tableau de depenses planifiees
 */
export function validateDepensesPlanifiees(depensesPlanifiees, options = {}) {
  return validateBatch(depensesPlanifiees, validateDepensePlanifiee, options);
}

/**
 * Valide un tableau de charges fixes
 */
export function validateChargesFixes(chargesFixes, options = {}) {
  return validateBatch(chargesFixes, validateChargeFixe, options);
}

