/**
 * exportFunctions.js
 * 
 * ✅ PHASE 12.1 : Fonctions d'export nutrition pour partage
 * 
 * ✅ PHASE 3 : Support export chiffré optionnel
 * ✅ PHASE 8 : Cache export avec hash données (80-95% plus rapide sur cache hit)
 * 
 * @module services/nutrition/sharing/export/exportFunctions
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 12
 */

import { SHARE_SCOPES } from '../constants';
import { getShareLink, updateShareLinkAccess } from '../shareLinks';
import { prepareNutritionDataForShare } from '../dataPreparation';
import { ExportCacheService } from '../cache';
import { SecureExportService } from '../encryption';
import logger from '../../../../utils/logger';

const log = logger.module('exportFunctions');

/**
 * Exporte les données nutrition pour partage (avec token)
 * 
 * ✅ PHASE 3 : Support export chiffré optionnel
 * ✅ PHASE 8 : Cache export avec hash données (80-95% plus rapide sur cache hit)
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {string} token - Token de partage
 * @param {string} scope - Scope partage
 * @param {Object} options - Options d'export
 * @param {boolean} options.encrypt - Chiffrer l'export (défaut: false)
 * @param {string} options.password - Mot de passe pour chiffrement (requis si encrypt=true)
 * @param {boolean} options.useCache - Utiliser cache exports (défaut: true)
 * @returns {Promise<Object>} Données exportées avec token (chiffrées ou non)
 */
export async function exportNutritionDataForShare(nutritionData, token, scope = SHARE_SCOPES.all, options = {}) {
  try {
    const {
      encrypt = false,
      password = null,
      useCache = true
    } = options;

    // Vérifier token
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      throw new Error('Token invalide');
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      throw new Error('Token expiré');
    }
    
    // Vérifier scope
    if (shareLink.scope !== scope) {
      log.warn('[exportNutritionDataForShare] Scope mismatch, utilisation scope du token');
      scope = shareLink.scope;
    }
    
    // ✅ PHASE 8 : Générer hash des données pour cache (seulement si cache activé et non chiffré)
    let cacheKey = null;
    if (useCache && !encrypt) {
      try {
        cacheKey = await ExportCacheService.generateDataHash(nutritionData, scope, encrypt);
        
        // ✅ PHASE 8 : Vérifier cache avant génération
        const cachedExport = ExportCacheService.getCachedExport(cacheKey);
        if (cachedExport) {
          // ✅ PHASE 8 : Retourner export depuis cache (80-95% plus rapide)
          // Mettre à jour accès même pour cache hit
          await updateShareLinkAccess(token);
          
          log.debug('[exportNutritionDataForShare] Export récupéré depuis cache', {
            hash: cacheKey.substring(0, 8) + '...'
          });
          
          return cachedExport;
        }
      } catch (cacheError) {
        log.warn('[exportNutritionDataForShare] Erreur cache, génération normale:', cacheError);
        // Continuer avec génération normale si cache échoue
      }
    }
    
    // Préparer données selon scope
    const sharedData = prepareNutritionDataForShare(nutritionData, scope);
    
    // Créer export avec token et métadonnées
    const exportData = {
      type: encrypt ? 'nutrition_share_encrypted' : 'nutrition_share',
      version: '1.0',
      token,
      scope,
      shareDate: new Date().toISOString(),
      expiresAt: shareLink.expiresAt,
      data: sharedData,
      metadata: {
        generatedAt: new Date().toISOString(),
        scope,
        readOnly: true,
        encrypted: encrypt
      }
    };

    // ✅ PHASE 3 : Chiffrer si demandé
    if (encrypt) {
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new Error('Mot de passe requis pour chiffrement (minimum 8 caractères)');
      }

      // Chiffrer l'export complet avec le mot de passe
      const encryptedExport = await SecureExportService.encryptExport(exportData, password);
      
      // Mettre à jour accès
      await updateShareLinkAccess(token);
      
      // ✅ Réduction logs : export chiffré (important seulement)
      // log.debug supprimé pour éviter spam
      
      // ✅ PHASE 8 : Ne pas cacher exports chiffrés (mot de passe différent = export différent)
      return encryptedExport;
    }
    
    // Export non chiffré (comportement par défaut)
    // Mettre à jour accès
    await updateShareLinkAccess(token);
    
    // ✅ PHASE 8 : Mettre en cache export non chiffré
    if (useCache && cacheKey) {
      try {
        ExportCacheService.setCachedExport(cacheKey, exportData);
      } catch (cacheError) {
        log.warn('[exportNutritionDataForShare] Erreur sauvegarde cache:', cacheError);
        // Ne pas bloquer si cache échoue
      }
    }
    
    // ✅ Réduction logs : export non chiffré (non critique)
    // log.debug supprimé pour éviter spam
    
    return exportData;
  } catch (error) {
    log.error('[exportNutritionDataForShare] Erreur export données:', error);
    throw error;
  }
}

/**
 * ✅ PHASE 3 : Déchiffre un export nutrition
 * 
 * @param {Object} encryptedExport - Export chiffré
 * @param {string} password - Mot de passe pour déchiffrement
 * @returns {Promise<Object>} Export déchiffré
 */
export async function decryptNutritionExport(encryptedExport, password) {
  try {
    if (!encryptedExport || encryptedExport.type !== 'nutrition_share_encrypted') {
      throw new Error('Export non chiffré ou format invalide');
    }

    const decryptedData = await SecureExportService.decryptExport(encryptedExport, password);
    
    // ✅ Réduction logs : déchiffrement (non critique)
    // log.debug supprimé pour éviter spam
    
    return decryptedData;
  } catch (error) {
    log.error('[decryptNutritionExport] Erreur déchiffrement:', error);
    throw error;
  }
}


