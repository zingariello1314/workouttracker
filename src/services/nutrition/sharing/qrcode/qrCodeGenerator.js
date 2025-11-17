/**
 * qrCodeGenerator.js
 * 
 * ✅ PHASE 12.1 : Génération QR codes pour partage Nutrition
 * 
 * ✅ PHASE 2 : Génération locale avec bibliothèque qrcode
 * - Génération locale (100% offline, pas d'API externe)
 * - Cache localStorage pour éviter régénération
 * - Options optimisées (taille, marge, correction erreur)
 * - Gestion erreurs robuste avec fallback
 * - Nettoyage cache QR codes orphelins
 * 
 * @module services/nutrition/sharing/qrcode/qrCodeGenerator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 5
 */

import QRCode from 'qrcode';
import logger from '../../../../utils/logger';

const log = logger.module('qrCodeGenerator');

// ==================== CONSTANTES CACHE QR CODE ====================

/**
 * ✅ PHASE 2 : Constantes cache QR codes
 */
export const QR_CACHE_PREFIX = 'qr_share_';
export const QR_CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
export const QR_CACHE_CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // Nettoyage tous les 7 jours

/**
 * ✅ PHASE 2 : Génère clé cache QR code
 * 
 * @param {string} data - Données à encoder (URL ou token)
 * @returns {string} Clé cache
 */
function getQRCacheKey(data) {
  // Hash simple pour réduire taille clé (SHA-256 serait mieux mais plus lourd)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${QR_CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * ✅ PHASE 2 : Récupère QR code depuis cache localStorage
 * 
 * @param {string} data - Données à encoder
 * @returns {string|null} QR code Data URL ou null si non trouvé/expiré
 */
function getQRFromCache(data) {
  try {
    const cacheKey = getQRCacheKey(data);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier expiration
    if (now > parsed.expiresAt) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // ✅ Réduction logs : cache QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return parsed.dataUrl;
  } catch (error) {
    log.warn('[getQRFromCache] Erreur lecture cache QR code:', error);
    return null;
  }
}

/**
 * ✅ PHASE 2 : Sauvegarde QR code dans cache localStorage
 * 
 * @param {string} data - Données encodées
 * @param {string} dataUrl - QR code Data URL
 * @returns {boolean} true si sauvegardé, false si erreur
 */
function saveQRToCache(data, dataUrl) {
  try {
    const cacheKey = getQRCacheKey(data);
    const now = Date.now();
    
    const cacheEntry = {
      dataUrl,
      createdAt: now,
      expiresAt: now + QR_CACHE_EXPIRY_MS,
      dataHash: data.substring(0, 50) // Hash partiel pour validation
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    // ✅ Réduction logs : sauvegarde cache QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return true;
  } catch (error) {
    // Erreur probablement localStorage plein - ignorer silencieusement
    if (error.name === 'QuotaExceededError') {
      log.warn('[saveQRToCache] localStorage plein, nettoyage cache nécessaire');
      cleanupOrphanedQRCache(); // Nettoyage immédiat
    } else {
      log.warn('[saveQRToCache] Erreur sauvegarde cache QR code:', error);
    }
    return false;
  }
}

/**
 * ✅ PHASE 2 : Nettoie cache QR codes orphelins (expirés ou liés à tokens supprimés)
 * 
 * @param {Array<string>} activeTokens - Liste des tokens actifs (optionnel)
 * @returns {number} Nombre d'entrées nettoyées
 */
export function cleanupOrphanedQRCache(activeTokens = null) {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    const keysToRemove = [];
    
    // Parcourir toutes les clés localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (!key || !key.startsWith(QR_CACHE_PREFIX)) {
        continue; // Ignorer clés non-QR
      }
      
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;
        
        const parsed = JSON.parse(cached);
        
        // 1. Vérifier expiration
        if (now > parsed.expiresAt) {
          keysToRemove.push(key);
          cleanedCount++;
          continue;
        }
        
        // 2. Vérifier si token associé existe encore (si activeTokens fourni)
        if (activeTokens && Array.isArray(activeTokens)) {
          // Essayer de matcher avec tokens actifs (heuristique basée sur dataHash)
          const tokenMatch = activeTokens.some(token => {
            // Vérifier si le hash partiel correspond à un token actif
            const tokenPrefix = token.substring(0, 50);
            return parsed.dataHash && parsed.dataHash.includes(tokenPrefix.substring(0, 10));
          });
          
          if (!tokenMatch) {
            // Token probablement supprimé - marquer pour nettoyage
            keysToRemove.push(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Entrée corrompue - supprimer
        keysToRemove.push(key);
        cleanedCount++;
      }
    }
    
    // Supprimer clés marquées
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        log.warn('[cleanupOrphanedQRCache] Erreur suppression clé:', key, error);
      }
    });
    
    if (cleanedCount > 0) {
      log.debug('[cleanupOrphanedQRCache] Cache QR nettoyé', {
        cleanedCount,
        remaining: localStorage.length
      });
    }
    
    return cleanedCount;
  } catch (error) {
    log.error('[cleanupOrphanedQRCache] Erreur nettoyage cache QR code:', error);
    return 0;
  }
}

/**
 * ✅ PHASE 2 : Génère un QR code Data URL pour une URL ou token
 * 
 * ✅ PHASE 2 : Génération locale avec bibliothèque qrcode
 * - Génération locale (100% offline, pas d'API externe)
 * - Cache localStorage pour éviter régénération
 * - Options optimisées (taille, marge, correction erreur)
 * - Gestion erreurs robuste avec fallback
 * 
 * @param {string} data - URL ou token à encoder
 * @param {Object} options - Options génération QR code
 * @param {number} options.size - Taille QR code (défaut: 200)
 * @param {number} options.margin - Marge (défaut: 2)
 * @param {string} options.errorCorrectionLevel - Niveau correction ('L', 'M', 'Q', 'H', défaut: 'M')
 * @param {boolean} options.forceRegenerate - Forcer régénération (ignorer cache, défaut: false)
 * @returns {Promise<string>} QR code en format Data URL (PNG)
 */
export async function generateQRCode(data, options = {}) {
  const {
    size = 200,
    margin = 2,
    errorCorrectionLevel = 'M', // Niveau M = 15% erreurs corrigées (bon compromis)
    forceRegenerate = false
  } = options;
  
  try {
    if (!data || typeof data !== 'string') {
      throw new Error('Données invalides pour QR code');
    }
    
    // ✅ PHASE 2 : Vérifier cache (si pas forceRegenerate)
    if (!forceRegenerate) {
      const cachedQR = getQRFromCache(data);
      if (cachedQR) {
        return cachedQR;
      }
    }
    
    // ✅ PHASE 2 : Générer QR code avec bibliothèque qrcode
    const dataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin,
      errorCorrectionLevel,
      type: 'image/png',
      quality: 1.0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // ✅ PHASE 2 : Sauvegarder dans cache
    saveQRToCache(data, dataUrl);
    
    // ✅ Réduction logs : génération QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return dataUrl;
  } catch (error) {
    // ✅ PHASE 8 : Supprimé code mort placeholder SVG (non utilisé, qrcode library génère toujours un résultat)
    log.error('[generateQRCode] Erreur génération QR code:', error);
    return null;
  }
}


