/**
 * tokenValidator.js
 * 
 * ✅ PHASE 12.1 : Validateur de token pour partage
 * 
 * ✅ PHASE 1.3 : Vérification étendue avec access control
 * - Vérifie expiration
 * - Vérifie si lien bloqué
 * - Met à jour audit trail (appel updateShareLinkAccess)
 * 
 * @module services/nutrition/sharing/validator/tokenValidator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 13
 */

import { getShareLink, deleteShareLink, updateShareLinkAccess } from '../shareLinks';
import logger from '../../../../utils/logger';

const log = logger.module('tokenValidator');

/**
 * Vérifie si un token est valide et non expiré
 * 
 * ✅ PHASE 1.3 : Vérification étendue avec access control
 * - Vérifie expiration
 * - Vérifie si lien bloqué
 * - Met à jour audit trail (appel updateShareLinkAccess)
 * 
 * @param {string} token - Token à vérifier
 * @param {Object} context - Contexte accès (optionnel: userAgent, etc.)
 * @returns {Promise<Object|null>} Lien de partage si valide, null sinon
 */
export async function validateShareToken(token, context = {}) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      log.debug('[validateShareToken] Token non trouvé');
      return null;
    }
    
    // ✅ PHASE 1.3 : Vérifier si lien bloqué
    if (shareLink.locked) {
      log.warn('[validateShareToken] Token bloqué', {
        token: token.substring(0, 8) + '...',
        lockReason: shareLink.lockReason,
        lockedAt: shareLink.lockedAt ? new Date(shareLink.lockedAt).toISOString() : null
      });
      return null;
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      log.debug('[validateShareToken] Token expiré', {
        expiresAt: new Date(shareLink.expiresAt).toISOString()
      });
      // Supprimer lien expiré
      await deleteShareLink(token);
      return null;
    }
    
    // ✅ PHASE 1.3 : Mettre à jour audit trail (avec détection abus)
    try {
      await updateShareLinkAccess(token, context);
    } catch (accessError) {
      // Si accès refusé (limite atteinte ou comportement suspect), retourner null
      if (accessError.code === 'max_accesses_reached' || 
          accessError.code === 'link_locked' || 
          accessError.code === 'suspicious_behavior') {
        log.warn('[validateShareToken] Accès refusé', {
          token: token.substring(0, 8) + '...',
          reason: accessError.code,
          message: accessError.message
        });
        return null;
      }
      // Autres erreurs : log mais continuer (robustesse)
      log.error('[validateShareToken] Erreur mise à jour accès:', accessError);
    }
    
    return shareLink;
  } catch (error) {
    log.error('[validateShareToken] Erreur validation token:', error);
    return null;
  }
}


