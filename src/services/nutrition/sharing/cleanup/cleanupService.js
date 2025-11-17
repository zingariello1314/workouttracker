/**
 * cleanupService.js
 * 
 * ✅ PHASE 12.1 : Service de cleanup unifié avec tracking statistiques
 * 
 * ✅ PHASE 7 : Cleanup automatique amélioré
 * - Nettoie liens expirés
 * - Nettoie liens révoqués anciens (>30 jours)
 * - Nettoie cache QR codes orphelins
 * - Tracking statistiques cleanup
 * - Métadonnées cleanup sauvegardées (localStorage)
 * 
 * @module services/nutrition/sharing/cleanup/cleanupService
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 9
 */

import { cleanupExpiredLinks, cleanupRevokedLinks, getAllShareLinks } from '../shareLinks';
import { cleanupOrphanedQRCache } from '../qrcode';
import logger from '../../../../utils/logger';

const log = logger.module('cleanupService');

/**
 * ✅ PHASE 7 : Service de cleanup unifié avec tracking statistiques
 * 
 * ✅ PHASE 7 : Cleanup automatique amélioré
 * - Nettoie liens expirés
 * - Nettoie liens révoqués anciens (>30 jours)
 * - Nettoie cache QR codes orphelins
 * - Tracking statistiques cleanup
 * - Métadonnées cleanup sauvegardées (localStorage)
 */
export class CleanupService {
  /**
   * ✅ PHASE 7 : Configuration cleanup
   */
  static CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
  static REVOKED_LINKS_AGE_DAYS = 30; // 30 jours après création
  static LAST_CLEANUP_KEY = 'nutrition_share_last_cleanup';
  static CLEANUP_STATS_KEY = 'nutrition_share_cleanup_stats';

  /**
   * ✅ PHASE 7 : Exécute cleanup complet avec tracking
   * 
   * @param {Object} options - Options cleanup
   * @param {boolean} options.force - Forcer cleanup même si récent (défaut: false)
   * @param {Array<string>} options.activeTokens - Tokens actifs pour cleanup QR (optionnel)
   * @returns {Promise<Object>} Statistiques cleanup { expiredLinks, revokedLinks, orphanedQR, total, lastCleanup }
   */
  static async runCleanup(options = {}) {
    const { force = false, activeTokens = null } = options;
    
    try {
      // ✅ PHASE 7 : Vérifier si cleanup récent (sauf si force)
      if (!force) {
        const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
        if (lastCleanup) {
          const lastCleanupTime = parseInt(lastCleanup, 10);
          const timeSinceLastCleanup = Date.now() - lastCleanupTime;
          
          // Si cleanup récent (< 7 jours), skip
          if (timeSinceLastCleanup < this.CLEANUP_INTERVAL_MS) {
            log.debug('[runCleanup] Cleanup récent, ignoré', {
              lastCleanup: new Date(lastCleanupTime).toISOString(),
              daysSince: Math.floor(timeSinceLastCleanup / (24 * 60 * 60 * 1000))
            });
            return this.getLastCleanupStats();
          }
        }
      }

      log.debug('[runCleanup] Démarrage cleanup complet');

      const startTime = Date.now();

      // ✅ PHASE 7 : Nettoyer liens expirés
      const expiredLinksCount = await cleanupExpiredLinks();

      // ✅ PHASE 7 : Nettoyer liens révoqués anciens
      const revokedLinksCount = await cleanupRevokedLinks();

      // ✅ PHASE 7 : Nettoyer cache QR codes orphelins
      let orphanedQRCount = 0;
      try {
        if (activeTokens && Array.isArray(activeTokens) && activeTokens.length > 0) {
          orphanedQRCount = cleanupOrphanedQRCache(activeTokens);
        } else {
          // ✅ PHASE 7 : Récupérer tokens actifs depuis IndexedDB si non fournis
          const allLinks = await getAllShareLinks();
          const activeTokensList = allLinks.map(link => link.token);
          
          if (activeTokensList.length > 0) {
            orphanedQRCount = cleanupOrphanedQRCache(activeTokensList);
          }
        }
      } catch (error) {
        log.warn('[runCleanup] Erreur cleanup QR codes orphelins:', error);
      }

      // ✅ PHASE 7 : Calculer statistiques
      const total = expiredLinksCount + revokedLinksCount;
      const duration = Date.now() - startTime;
      const now = Date.now();

      const stats = {
        lastCleanup: now,
        duration,
        expiredLinks: expiredLinksCount,
        revokedLinks: revokedLinksCount,
        orphanedQR: orphanedQRCount,
        total
      };

      // ✅ PHASE 7 : Sauvegarder métadonnées cleanup
      localStorage.setItem(this.LAST_CLEANUP_KEY, now.toString());
      
      try {
        const statsJson = JSON.stringify(stats);
        localStorage.setItem(this.CLEANUP_STATS_KEY, statsJson);
      } catch (error) {
        log.warn('[runCleanup] Erreur sauvegarde stats cleanup:', error);
      }

      log.debug('[runCleanup] Cleanup terminé', {
        ...stats,
        duration: `${duration}ms`
      });

      return stats;
    } catch (error) {
      log.error('[runCleanup] Erreur cleanup complet:', error);
      
      // ✅ PHASE 7 : Retourner stats partiels en cas d'erreur
      return {
        lastCleanup: null,
        duration: 0,
        expiredLinks: 0,
        revokedLinks: 0,
        orphanedQR: 0,
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * ✅ PHASE 7 : Récupère statistiques dernier cleanup
   * 
   * @returns {Object} Statistiques dernier cleanup
   */
  static getLastCleanupStats() {
    try {
      const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
      const statsJson = localStorage.getItem(this.CLEANUP_STATS_KEY);
      
      if (!lastCleanup) {
        return {
          lastCleanup: null,
          expiredLinks: 0,
          revokedLinks: 0,
          orphanedQR: 0,
          total: 0
        };
      }

      const stats = statsJson ? JSON.parse(statsJson) : {};
      
      return {
        lastCleanup: parseInt(lastCleanup, 10),
        expiredLinks: stats.expiredLinks || 0,
        revokedLinks: stats.revokedLinks || 0,
        orphanedQR: stats.orphanedQR || 0,
        total: stats.total || 0,
        duration: stats.duration || 0
      };
    } catch (error) {
      log.warn('[getLastCleanupStats] Erreur récupération stats:', error);
      return {
        lastCleanup: null,
        expiredLinks: 0,
        revokedLinks: 0,
        orphanedQR: 0,
        total: 0
      };
    }
  }

  /**
   * ✅ PHASE 7 : Formate date dernier cleanup pour affichage
   * 
   * @param {number} timestamp - Timestamp cleanup (ou null)
   * @returns {string} Date formatée ou "Jamais"
   */
  static formatLastCleanup(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') {
      return 'Jamais';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    if (days === 1) {
      return 'Hier';
    }

    if (days < 7) {
      return `Il y a ${days} jours`;
    }

    // Plus de 7 jours : date complète
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * ✅ PHASE 7 : Vérifie si cleanup nécessaire
   * 
   * @returns {boolean} true si cleanup nécessaire
   */
  static isCleanupNeeded() {
    const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
    if (!lastCleanup) {
      return true; // Jamais fait
    }

    const lastCleanupTime = parseInt(lastCleanup, 10);
    const timeSinceLastCleanup = Date.now() - lastCleanupTime;
    
    return timeSinceLastCleanup >= this.CLEANUP_INTERVAL_MS;
  }
}

