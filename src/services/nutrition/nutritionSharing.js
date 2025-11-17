/**
 * nutritionSharing.js
 * 
 * Service pour le Partage avec Coach (liens sécurisés).
 * 
 * Permet de partager des données nutrition avec un coach via :
 * - Génération token sécurisé
 * - Export JSON avec données anonymisées selon scope
 * - Vue coach en lecture seule
 * - Expiration automatique des liens
 * - Contrôle permissions (scope : all, stats, charts, progress)
 * 
 * Architecture locale (sans serveur) :
 * - Tokens stockés dans IndexedDB (nutrition_shareLinks)
 * - Export JSON avec token intégré
 * - Import JSON par coach dans son app
 * - Vue coach en lecture seule avec données anonymisées
 * 
 * Philosophie :
 * - Sécurité : Tokens cryptographiques, expiration automatique
 * - Privacy : Données anonymisées, pas de données personnelles identifiables
 * - Performance : Stockage local IndexedDB, pas de requêtes serveur
 * - UX : QR codes pour partage facile, export JSON simple
 * 
 * @module services/nutrition/nutritionSharing
 * @see ../../../../nouvelongletnutritionplan.md Section 6.1
 */

import logger from '../../utils/logger';

const log = logger.module('nutritionSharing');

// ✅ PHASE 12.1 : Importer RateLimiter et checkShareLinkCreationAllowed depuis module séparé
import { RateLimiter, checkShareLinkCreationAllowed } from './sharing/rateLimiting';

// ✅ PHASE 12.1 : Importer constantes depuis module séparé
import {
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS,
  MAX_ACTIVE_SHARE_LINKS,
  MAX_ACCESSES_PER_TOKEN,
  SUSPICIOUS_ACCESS_THRESHOLD,
  BURST_WINDOW_MS,
  BURST_THRESHOLD,
  MIN_ACCESS_INTERVAL_MS
} from './sharing/constants';

// ✅ PHASE 12.1 : Importer génération QR code depuis module séparé
import { generateQRCode, cleanupOrphanedQRCache } from './sharing/qrcode';

// ✅ PHASE 12.1 : Importer SecureExportService depuis module séparé
import { SecureExportService } from './sharing/encryption';

// ✅ PHASE 12.1 : Importer Share Links CRUD depuis module séparé
import {
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  lockShareLink,
  updateShareLinkAccess,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks
} from './sharing/shareLinks';

// ✅ PHASE 12.1 : Importer Token Generator depuis module séparé
import { generateSecureToken, parseDuration } from './sharing/token';

// ✅ PHASE 12.1 : Importer CleanupService depuis module séparé
import { CleanupService } from './sharing/cleanup';

// ✅ PHASE 12.1 : Importer Data Preparation depuis module séparé
import { prepareNutritionDataForShare } from './sharing/dataPreparation';

// ✅ PHASE 12.1 : Importer Export Cache Service depuis module séparé
import { ExportCacheService } from './sharing/cache';

// ✅ PHASE 12.1 : Importer Export Functions depuis module séparé
import { exportNutritionDataForShare, decryptNutritionExport } from './sharing/export';

// ✅ PHASE 12.1 : Importer Token Validator depuis module séparé
import { validateShareToken } from './sharing/validator';

// ✅ PHASE 12.1 : Importer Import Functions depuis module séparé
import { validateShareJson, parseShareJson, loadShareDataFromJson } from './sharing/import';

// ✅ PHASE 12.1 : Share Links CRUD extrait vers sharing/shareLinks/shareLinksCRUD.js
// ✅ PHASE 12.1 : Data Preparation extrait vers sharing/dataPreparation/dataPreparationService.js
// ✅ PHASE 12.1 : Export Cache Service extrait vers sharing/cache/exportCacheService.js
// ✅ PHASE 12.1 : Export Functions extrait vers sharing/export/exportFunctions.js
// ✅ PHASE 12.1 : Token Validator extrait vers sharing/validator/tokenValidator.js
// ✅ PHASE 12.1 : Import Functions extrait vers sharing/import/importFunctions.js

// ==================== GÉNÉRATION LIEN PARTAGE ====================

/**
 * Génère un lien de partage sécurisé
 * 
 * ✅ PHASE 1.2 : Vérification rate limiting + limite liens actifs avant génération
 * 
 * @param {Object} options - Options de partage
 * @param {string} options.expiresIn - Durée validité (défaut: '24h')
 * @param {Array<string>} options.permissions - Permissions (défaut: ['read'])
 * @param {string} options.scope - Scope partage (défaut: 'all')
 * @param {Array<Object>} options.existingLinks - Liens existants (pour vérifier limites) - optionnel
 * @returns {Promise<Object>} Lien de partage avec URL, token, QR code
 * @throws {Error} Si rate limiting ou limite liens actifs atteinte
 */
export async function generateSecureShareLink(options = {}) {
  const {
    expiresIn = '24h',
    permissions = [PERMISSIONS.read],
    scope = SHARE_SCOPES.all,
    existingLinks = null // Optionnel : passer pour éviter rechargement
  } = options;
  
  try {
    // ✅ PHASE 1.2 : Vérifier rate limiting et limite liens actifs
    let linksToCheck = existingLinks;
    if (linksToCheck === null) {
      // Charger liens si non fournis (évite rechargement si déjà chargés)
      linksToCheck = await getAllShareLinks();
    }
    
    const checkResult = checkShareLinkCreationAllowed(linksToCheck);
    if (!checkResult.allowed) {
      const error = new Error(checkResult.message || 'Création de lien non autorisée');
      error.code = checkResult.reason;
      error.waitTime = checkResult.waitTime;
      error.activeCount = checkResult.activeCount;
      error.maxActive = checkResult.maxActive;
      log.warn('[generateSecureShareLink] Création refusée', checkResult);
      throw error;
    }

    // ✅ PHASE 1.1 : Générer token sécurisé avec vérification collision
    const token = await generateSecureToken(32, 'share_', 5);
    const expiresAt = Date.now() + parseDuration(expiresIn);
    const createdAt = Date.now();
    
    // Créer payload
    const shareLink = {
      id: token,
      token,
      expiresAt,
      permissions,
      scope,
      createdAt,
      accessCount: 0,
      lastAccessed: null
    };
    
    // Sauvegarder dans IndexedDB
    await saveShareLink(shareLink);
    
    // Générer URL de partage (pour export JSON)
    // Dans une app locale, l'URL est juste pour référence (export JSON contient token)
    const shareUrl = `${window.location.origin}/nutrition/share/${token}`;
    
    // ✅ PHASE 2 : Générer QR code localement (avec cache automatique)
    const qrCode = await generateQRCode(shareUrl, {
      size: 200,
      margin: 2,
      errorCorrectionLevel: 'M'
    });
    
    // ✅ Réduction logs : génération lien (important mais réduit)
    // log.debug supprimé pour éviter spam
    
    return {
      url: shareUrl,
      token,
      expiresAt,
      scope,
      permissions,
      qrCode,
      createdAt
    };
  } catch (error) {
    log.error('[generateSecureShareLink] Erreur génération lien:', error);
    throw error;
  }
}

// ✅ PHASE 12.1 : Data Preparation extrait vers sharing/dataPreparation/dataPreparationService.js

// ✅ PHASE 12.1 : SecureExportService extrait vers sharing/encryption/encryptionService.js

// ✅ PHASE 12.1 : Export Cache Service extrait vers sharing/cache/exportCacheService.js

// ✅ PHASE 12.1 : Export Functions extrait vers sharing/export/exportFunctions.js

// ✅ PHASE 12.1 : Token Validator extrait vers sharing/validator/tokenValidator.js

// ✅ PHASE 12.1 : Import Functions extrait vers sharing/import/importFunctions.js

// ==================== EXPORTS ====================

// ✅ PHASE 12.1 : Re-exporter constantes pour rétrocompatibilité
export {
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS,
  MAX_ACTIVE_SHARE_LINKS,
  MAX_ACCESSES_PER_TOKEN,
  SUSPICIOUS_ACCESS_THRESHOLD,
  BURST_WINDOW_MS,
  BURST_THRESHOLD,
  MIN_ACCESS_INTERVAL_MS
} from './sharing/constants';

// ✅ PHASE 12.1 : Re-exporter RateLimiter et checkShareLinkCreationAllowed pour rétrocompatibilité
export { RateLimiter, checkShareLinkCreationAllowed } from './sharing/rateLimiting';

// ✅ PHASE 12.1 : Importer ImportValidator et VersionMigrator pour export default
import { ImportValidator } from './sharing/validators';
import { VersionMigrator } from './sharing/migration';

// ✅ PHASE 12.1 : Re-exporter ImportValidator et VersionMigrator pour rétrocompatibilité
export { ImportValidator } from './sharing/validators';
export { VersionMigrator } from './sharing/migration';

// ✅ PHASE 12.1 : Re-exporter QR Code pour rétrocompatibilité
export { generateQRCode, cleanupOrphanedQRCache } from './sharing/qrcode';

// ✅ PHASE 12.1 : Re-exporter SecureExportService pour rétrocompatibilité
export { SecureExportService } from './sharing/encryption';

// ✅ PHASE 12.1 : Re-exporter Share Links CRUD pour rétrocompatibilité
export {
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  lockShareLink,
  updateShareLinkAccess,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks
} from './sharing/shareLinks';

// ✅ PHASE 12.1 : Re-exporter Token Generator pour rétrocompatibilité
export { generateSecureToken, parseDuration } from './sharing/token';

// ✅ PHASE 12.1 : Re-exporter CleanupService pour rétrocompatibilité
export { CleanupService } from './sharing/cleanup';

// ✅ PHASE 12.1 : Re-exporter Data Preparation pour rétrocompatibilité
export { prepareNutritionDataForShare } from './sharing/dataPreparation';

// ✅ PHASE 12.1 : Re-exporter Export Cache Service pour rétrocompatibilité
export { ExportCacheService } from './sharing/cache';

// ✅ PHASE 12.1 : Re-exporter Export Functions pour rétrocompatibilité
export { exportNutritionDataForShare, decryptNutritionExport } from './sharing/export';

// ✅ PHASE 12.1 : Re-exporter Token Validator pour rétrocompatibilité
export { validateShareToken } from './sharing/validator';

// ✅ PHASE 12.1 : Re-exporter Import Functions pour rétrocompatibilité
export { validateShareJson, parseShareJson, loadShareDataFromJson } from './sharing/import';

export default {
  generateSecureToken,
  parseDuration,
  generateSecureShareLink,
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  updateShareLinkAccess,
  lockShareLink,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks,
  CleanupService,
  ExportCacheService,
  generateQRCode,
  cleanupOrphanedQRCache,
  prepareNutritionDataForShare,
  exportNutritionDataForShare,
  decryptNutritionExport,
  validateShareToken,
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson,
  ImportValidator,
  VersionMigrator,
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS
};

