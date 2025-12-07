/**
 * Validation des données pour le module Investissements Divers
 * Utilise Zod pour la validation de schémas
 */

import { z } from 'zod';

/**
 * Schéma de validation pour acquisition d'or
 */
export const orAcquisitionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  quantite: z.number().positive('La quantité doit être positive').max(10000, 'Max 10kg'),
  prix: z.number().positive('Le prix doit être positif').max(100000, 'Prix max 100k€/g'),
  prime: z.number().min(0, 'La prime ne peut pas être négative').max(50, 'Prime max 50%'),
  lieuStockage: z.enum(['coffre-banque', 'coffre-domicile', 'tiers-confiance'], {
    errorMap: () => ({ message: 'Lieu de stockage invalide' })
  }),
  notes: z.string().max(500, 'Max 500 caractères').optional().nullable()
});

/**
 * Schéma de validation pour entrée liquidités
 */
export const liquiditesEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  montant: z.number().positive('Le montant doit être positif').max(1000000, 'Montant max 1M€'),
  source: z.enum(['salaire', 'bonus', 'vente', 'economie', 'autre']).optional(),
  notes: z.string().max(500, 'Max 500 caractères').optional().nullable()
});

/**
 * Schéma de validation pour position bourse/crypto
 */
export const positionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  type: z.enum(['action', 'etf', 'crypto', 'cash']),
  ticker: z.string().min(1, 'Ticker requis').max(20, 'Ticker max 20 caractères'),
  nom: z.string().max(100, 'Nom max 100 caractères').optional(),
  montant: z.number().positive('Le montant doit être positif').max(10000000, 'Montant max 10M€'),
  quantite: z.number().min(0, 'La quantité ne peut pas être négative').optional(),
  prixAchat: z.number().min(0, 'Le prix ne peut pas être négatif').optional(),
  notes: z.string().max(500, 'Max 500 caractères').optional().nullable()
});

/**
 * Valide une acquisition d'or
 * @param {Object} data - Données à valider
 * @returns {{success: boolean, data?: Object, errors?: Array}}
 */
export function validateOrAcquisition(data) {
  try {
    const validated = orAcquisitionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, errors: [{ message: 'Erreur de validation inconnue' }] };
  }
}

/**
 * Valide une entrée liquidités
 * @param {Object} data - Données à valider
 * @returns {{success: boolean, data?: Object, errors?: Array}}
 */
export function validateLiquiditesEntry(data) {
  try {
    const validated = liquiditesEntrySchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, errors: [{ message: 'Erreur de validation inconnue' }] };
  }
}

/**
 * Valide une position bourse/crypto
 * @param {Object} data - Données à valider
 * @returns {{success: boolean, data?: Object, errors?: Array}}
 */
export function validatePosition(data) {
  try {
    const validated = positionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, errors: [{ message: 'Erreur de validation inconnue' }] };
  }
}



