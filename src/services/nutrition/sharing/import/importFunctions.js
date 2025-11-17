/**
 * importFunctions.js
 * 
 * ✅ PHASE 12.1 : Fonctions d'import nutrition pour partage
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec validation Zod profonde
 * ✅ PHASE 4 : Support exports chiffrés et migration de versions
 * 
 * @module services/nutrition/sharing/import/importFunctions
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 14
 */

import { VersionMigrator } from '../migration';
import { decryptNutritionExport } from '../export';
import { validateShareJson } from './importValidator';
import logger from '../../../../utils/logger';

const log = logger.module('importFunctions');

/**
 * Parse et valide JSON partagé
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec migration de versions
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à parser
 * @returns {Promise<Object>} { token, scope, data, metadata, expiresAt, shareDate, encrypted }
 * @throws {Error} Si JSON invalide
 */
export async function parseShareJson(jsonDataOrFile) {
  try {
    // ✅ PHASE 4 : Valider avec ImportValidator
    const validation = await validateShareJson(jsonDataOrFile);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const parsed = validation.data;

    // ✅ PHASE 4 : Si export chiffré, retourner structure chiffrée
    if (parsed.type === 'nutrition_share_encrypted') {
      return {
        type: parsed.type,
        version: parsed.version,
        encrypted: true,
        algorithm: parsed.algorithm,
        keyDerivation: parsed.keyDerivation,
        pbkdf2Iterations: parsed.pbkdf2Iterations,
        pbkdf2Hasher: parsed.pbkdf2Hasher,
        salt: parsed.salt,
        iv: parsed.iv,
        data: parsed.data,
        encryptedAt: parsed.encryptedAt,
        metadata: parsed.metadata || {}
      };
    }

    // ✅ PHASE 4 : Export non chiffré
    return {
      type: parsed.type,
      version: parsed.version,
      token: parsed.token,
      scope: parsed.scope,
      data: parsed.data,
      metadata: parsed.metadata || {},
      expiresAt: parsed.expiresAt || null,
      shareDate: parsed.shareDate || null,
      encrypted: false
    };
  } catch (error) {
    log.error('[parseShareJson] Erreur parsing JSON:', error);
    throw error;
  }
}

/**
 * Charge données depuis JSON partagé
 * 
 * ✅ PHASE 4 : Support exports chiffrés et migration de versions
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à charger
 * @param {Object} options - Options de chargement
 * @param {string} options.password - Mot de passe pour déchiffrement (requis si export chiffré)
 * @returns {Promise<Object>} Données formatées pour affichage
 * @throws {Error} Si JSON invalide ou déchiffrement échoue
 */
export async function loadShareDataFromJson(jsonDataOrFile, options = {}) {
  try {
    const { password = null } = options;

    // ✅ PHASE 4 : Parser JSON avec validation profonde
    const parsed = await parseShareJson(jsonDataOrFile);

    // ✅ PHASE 4 : Si export chiffré, déchiffrer d'abord
    if (parsed.encrypted) {
      if (!password || typeof password !== 'string') {
        throw new Error('Mot de passe requis pour déchiffrer l\'export');
      }

      // ✅ PHASE 4 : Déchiffrer export
      const decryptedData = await decryptNutritionExport(parsed, password);
      
      // ✅ PHASE 4 : Re-valider données déchiffrées
      const decryptedValidation = await validateShareJson(decryptedData);
      if (!decryptedValidation.valid) {
        throw new Error(`Données déchiffrées invalides : ${decryptedValidation.error}`);
      }

      // ✅ PHASE 4 : Utiliser données déchiffrées
      parsed.data = decryptedData.data;
      parsed.token = decryptedData.token;
      parsed.scope = decryptedData.scope;
      parsed.expiresAt = decryptedData.expiresAt;
      parsed.shareDate = decryptedData.shareDate;
      parsed.metadata = decryptedData.metadata || {};
    }

    // ✅ PHASE 4 : Migration de versions si nécessaire (futur)
    // Pour l'instant, v1.0 uniquement
    let finalData = parsed;
    if (parsed.version && parsed.version !== '1.0') {
      try {
        finalData = await VersionMigrator.migrate(parsed, parsed.version, '1.0');
        log.debug('[loadShareDataFromJson] Migration effectuée', {
          from: parsed.version,
          to: '1.0'
        });
      } catch (migrationError) {
        log.warn('[loadShareDataFromJson] Migration échouée, utilisation données originales', {
          error: migrationError.message
        });
        // Continuer avec données originales
      }
    }
    
    // ✅ PHASE 4 : Formater données pour affichage
    const formattedData = {
      token: finalData.token,
      scope: finalData.scope,
      expiresAt: finalData.expiresAt,
      shareDate: finalData.shareDate,
      metadata: finalData.metadata,
      version: finalData.version || '1.0',
      encrypted: parsed.encrypted || false,
      stats: finalData.data?.stats || null,
      charts: finalData.data?.charts || null,
      progress: finalData.data?.progress || null
    };
    
    // ✅ Réduction logs : chargement (non critique)
    // log.debug supprimé pour éviter spam
    
    return formattedData;
  } catch (error) {
    log.error('[loadShareDataFromJson] Erreur chargement données:', error);
    throw error;
  }
}

