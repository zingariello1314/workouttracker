/**
 * importValidator.js
 * 
 * ✅ PHASE 12.1 : Validateur JSON pour import partage
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec validation Zod profonde
 * 
 * @module services/nutrition/sharing/import/importValidator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 14
 */

import { z } from 'zod';
import { nutritionShareSchema } from '../schemas';
import { ImportValidator } from '../validators';
import logger from '../../../../utils/logger';

const log = logger.module('importValidator');

/**
 * Valide le format JSON partagé
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec validation Zod profonde
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à valider
 * @returns {Promise<Object>} { valid: boolean, error: string|null, data?: Object }
 */
export async function validateShareJson(jsonDataOrFile) {
  try {
    // ✅ PHASE 4 : Support File, string ou object
    let parsed;
    
    if (jsonDataOrFile instanceof File || typeof jsonDataOrFile === 'string') {
      // ✅ PHASE 4 : Utiliser ImportValidator pour validation complète
      parsed = await ImportValidator.parseAndValidate(jsonDataOrFile);
    } else if (jsonDataOrFile && typeof jsonDataOrFile === 'object') {
      // ✅ PHASE 4 : Détecter contenu malveillant
      ImportValidator.detectMaliciousContent(jsonDataOrFile);
      
      // ✅ PHASE 4 : Valider avec schema Zod
      parsed = nutritionShareSchema.parse(jsonDataOrFile);
    } else {
      return { valid: false, error: 'Format invalide : File, string ou object attendu' };
    }

    // ✅ PHASE 4 : Vérifier expiration (si fournie)
    if (parsed.expiresAt && typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
      return { valid: false, error: 'Lien expiré' };
    }

    // ✅ PHASE 4 : Si export chiffré, vérifier structure chiffrement
    if (parsed.type === 'nutrition_share_encrypted') {
      // Validation déjà faite par schema Zod
      return { valid: true, error: null, data: parsed, encrypted: true };
    }

    return { valid: true, error: null, data: parsed, encrypted: false };
  } catch (error) {
    log.error('[validateShareJson] Erreur validation JSON:', error);
    
    // ✅ PHASE 4 : Messages d'erreur spécifiques selon type d'erreur
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorPath = firstError.path.length > 0 
        ? firstError.path.join('.') 
        : 'racine';
      return { 
        valid: false, 
        error: `Données invalides : ${errorPath} - ${firstError.message}` 
      };
    }
    
    return { valid: false, error: error.message || 'Erreur validation JSON' };
  }
}


