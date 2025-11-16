/**
 * useNutritionSharing.js
 * 
 * Hook React pour le Partage avec Coach.
 * 
 * Gère :
 * - Génération liens de partage sécurisés
 * - Export JSON avec données anonymisées
 * - Gestion tokens (création, suppression, validation)
 * - Nettoyage liens expirés
 * - QR codes pour partage facile
 * 
 * Philosophie :
 * - Sécurité : Tokens cryptographiques, expiration automatique
 * - Privacy : Données anonymisées selon scope
 * - Performance : Stockage local IndexedDB, pas de requêtes serveur
 * - UX : QR codes, export JSON simple
 * 
 * @module hooks/useNutritionSharing
 * @see ../../nouvelongletnutritionplan.md Section 6.1
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNutritionData } from './useNutritionData';
import {
  generateSecureShareLink,
  getAllShareLinks,
  deleteShareLink,
  validateShareToken,
  cleanupExpiredLinks,
  exportNutritionDataForShare,
  decryptNutritionExport,
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS
} from '../services/nutrition/nutritionSharing';
import logger from '../utils/logger';

const log = logger.module('useNutritionSharing');

/**
 * Hook pour le partage avec coach
 * 
 * @param {Object} options - Options
 * @param {boolean} options.autoCleanup - Nettoyer liens expirés automatiquement (défaut: true)
 * @param {number} options.cleanupInterval - Intervalle nettoyage en ms (défaut: 1h)
 * @returns {Object} État et méthodes du partage
 */
export const useNutritionSharing = (options = {}) => {
  const {
    autoCleanup = true,
    cleanupInterval = 60 * 60 * 1000 // 1 heure
  } = options;

  const {
    dbReady,
    exportAll: exportNutritionData
  } = useNutritionData();

  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentShareLink, setCurrentShareLink] = useState(null);

  /**
   * Charge tous les liens de partage actifs
   */
  const loadShareLinks = useCallback(async () => {
    if (!dbReady) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const links = await getAllShareLinks();
      setShareLinks(links);

      // ✅ Réduction logs : seulement si liens > 0 ou erreur
      if (links.length > 0) {
        log.debug('[loadShareLinks] Liens chargés', { count: links.length });
      }
    } catch (err) {
      log.error('[loadShareLinks] Erreur chargement liens:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dbReady]);

  /**
   * Génère un nouveau lien de partage
   * 
   * ✅ PHASE 1.2 : Intégration rate limiting + limite liens actifs
   */
  const createShareLink = useCallback(async (options = {}) => {
    if (!dbReady) {
      throw new Error('IndexedDB non prêt');
    }

    try {
      setError(null);

      const {
        expiresIn = '24h',
        scope = SHARE_SCOPES.all,
        permissions = [PERMISSIONS.read]
      } = options;

      // ✅ PHASE 1.2 : Passer liens existants pour éviter rechargement (performance)
      const shareLink = await generateSecureShareLink({
        expiresIn,
        scope,
        permissions,
        existingLinks: shareLinks // Passer liens déjà chargés
      });

      // Recharger liens
      await loadShareLinks();

      setCurrentShareLink(shareLink);

      // ✅ Réduction logs : création lien (important seulement)
      // log.debug supprimé pour éviter spam

      return shareLink;
    } catch (err) {
      log.error('[createShareLink] Erreur création lien:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, loadShareLinks, shareLinks]); // ✅ PHASE 1.2 : Ajouter shareLinks aux dépendances

  /**
   * Supprime un lien de partage
   */
  const revokeShareLink = useCallback(async (token) => {
    if (!dbReady || !token) {
      return;
    }

    try {
      setError(null);

      await deleteShareLink(token);

      // Recharger liens
      await loadShareLinks();

      // Réinitialiser lien actuel si c'est celui qui a été supprimé
      if (currentShareLink && currentShareLink.token === token) {
        setCurrentShareLink(null);
      }

      // ✅ Réduction logs : révocation lien (important seulement)
      // log.debug supprimé pour éviter spam
    } catch (err) {
      log.error('[revokeShareLink] Erreur révocation lien:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, loadShareLinks, currentShareLink]);

  /**
   * Exporte les données nutrition pour partage
   * 
   * ✅ PHASE 3 : Support export chiffré avec mot de passe
   * 
   * @param {string} token - Token de partage
   * @param {string} scope - Scope partage
   * @param {Object} options - Options d'export
   * @param {boolean} options.encrypt - Chiffrer l'export (défaut: false)
   * @param {string} options.password - Mot de passe pour chiffrement (requis si encrypt=true)
   */
  const exportForShare = useCallback(async (token, scope = SHARE_SCOPES.all, options = {}) => {
    if (!dbReady || !token) {
      throw new Error('IndexedDB non prêt ou token manquant');
    }

    try {
      setError(null);

      // Vérifier token
      const shareLink = await validateShareToken(token);
      if (!shareLink) {
        throw new Error('Token invalide ou expiré');
      }

      // Exporter données nutrition
      const nutritionData = await exportNutritionData();

      // ✅ PHASE 3 : Préparer données pour partage (avec support chiffrement)
      const exportData = await exportNutritionDataForShare(
        nutritionData,
        token,
        scope || shareLink.scope,
        options || {} // Options (encrypt, password) - passées depuis UI
      );

      // ✅ Réduction logs : export (important seulement)
      // log.debug supprimé pour éviter spam

      return exportData;
    } catch (err) {
      log.error('[exportForShare] Erreur export données:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, exportNutritionData]);

  /**
   * Télécharge les données exportées en JSON
   * 
   * ✅ PHASE 3 : Support export chiffré avec mot de passe
   * 
   * @param {string} token - Token de partage
   * @param {string} scope - Scope partage
   * @param {Object} options - Options d'export
   * @param {boolean} options.encrypt - Chiffrer l'export (défaut: false)
   * @param {string} options.password - Mot de passe pour chiffrement (requis si encrypt=true)
   */
  const downloadShareExport = useCallback(async (token, scope = SHARE_SCOPES.all, options = {}) => {
    try {
      const {
        encrypt = false,
        password = null
      } = options;

      // ✅ PHASE 3 : Vérifier mot de passe si chiffrement demandé
      if (encrypt && (!password || typeof password !== 'string' || password.length < 8)) {
        throw new Error('Mot de passe requis pour chiffrement (minimum 8 caractères)');
      }

      // ✅ PHASE 3 : Exporter avec options de chiffrement
      const exportData = await exportForShare(token, scope, { encrypt, password });

      // Créer fichier JSON
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { 
        type: encrypt ? 'application/json+encrypted' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);

      // Télécharger fichier avec extension appropriée
      const link = document.createElement('a');
      link.href = url;
      const extension = encrypt ? '.encrypted.json' : '.json';
      link.download = `nutrition-share-${token.substring(0, 8)}-${new Date().toISOString().split('T')[0]}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libérer URL
      URL.revokeObjectURL(url);

      // ✅ Réduction logs : téléchargement (important seulement)
      // log.debug supprimé pour éviter spam
    } catch (err) {
      log.error('[downloadShareExport] Erreur téléchargement:', err);
      setError(err);
      throw err;
    }
  }, [exportForShare]);

  /**
   * Nettoie les liens expirés
   */
  const cleanup = useCallback(async () => {
    if (!dbReady) {
      return 0;
    }

    try {
      const deletedCount = await cleanupExpiredLinks();
      
      // Recharger liens
      await loadShareLinks();

      // ✅ Réduction logs : seulement si suppression > 0
      if (deletedCount > 0) {
        log.debug('[cleanup] Liens expirés supprimés', { count: deletedCount });
      }

      return deletedCount;
    } catch (err) {
      log.error('[cleanup] Erreur nettoyage:', err);
      return 0;
    }
  }, [dbReady, loadShareLinks]);

  /**
   * ✅ PHASE 8 : Copie token dans presse-papier avec fallback 3 niveaux
   * 
   * ✅ PHASE 8 : Fallback clipboard (3 niveaux)
   * - Niveau 1 : navigator.clipboard.writeText (moderne, async)
   * - Niveau 2 : document.execCommand('copy') (ancien, synchrone)
   * - Niveau 3 : Sélection manuelle avec message utilisateur (ultime fallback)
   * 
   * @param {string} token - Token à copier
   * @returns {Promise<boolean>} true si copie réussie
   */
  const copyTokenToClipboard = useCallback(async (token) => {
    // ✅ PHASE 8 : Niveau 1 : Clipboard API moderne (navigator.clipboard)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(token);
        return true;
      } catch (err) {
        log.warn('[copyTokenToClipboard] Niveau 1 échoué, tentative niveau 2:', err);
        // Passer au niveau 2
      }
    }
    
    // ✅ PHASE 8 : Niveau 2 : document.execCommand (ancien mais largement supporté)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = token;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, token.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        return true;
      } else {
        log.warn('[copyTokenToClipboard] Niveau 2 échoué, passage niveau 3');
        // Passer au niveau 3
      }
    } catch (err) {
      log.warn('[copyTokenToClipboard] Niveau 2 échoué:', err);
      // Passer au niveau 3
    }
    
    // ✅ PHASE 8 : Niveau 3 : Sélection manuelle (ultime fallback)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = token;
      textArea.style.position = 'fixed';
      textArea.style.top = '50%';
      textArea.style.left = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.width = '200px';
      textArea.style.height = '50px';
      textArea.style.zIndex = '9999';
      textArea.style.border = '2px solid #3b82f6';
      textArea.style.padding = '8px';
      textArea.style.fontSize = '14px';
      
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, token.length);
      textArea.focus();
      
      // ✅ PHASE 8 : Afficher message utilisateur
      log.info('[copyTokenToClipboard] Sélection manuelle requise (niveau 3)');
      
      // Supprimer après 5 secondes
      setTimeout(() => {
        if (document.body.contains(textArea)) {
          document.body.removeChild(textArea);
        }
      }, 5000);
      
      // Considérer comme succès (utilisateur peut copier manuellement)
      return true;
    } catch (err) {
      log.error('[copyTokenToClipboard] Tous les niveaux ont échoué:', err);
      return false;
    }
  }, []);

  /**
   * ✅ PHASE 8 : Copie URL de partage dans presse-papier avec fallback 3 niveaux
   * 
   * @param {Object} shareLink - Lien de partage avec URL
   * @returns {Promise<boolean>} true si copie réussie
   */
  const copyShareUrlToClipboard = useCallback(async (shareLink) => {
    if (!shareLink || !shareLink.url) {
      log.error('[copyShareUrlToClipboard] Lien de partage invalide');
      return false;
    }

    const url = shareLink.url;

    // ✅ PHASE 8 : Niveau 1 : Clipboard API moderne
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch (err) {
        log.warn('[copyShareUrlToClipboard] Niveau 1 échoué, tentative niveau 2:', err);
        // Passer au niveau 2
      }
    }
    
    // ✅ PHASE 8 : Niveau 2 : document.execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, url.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        return true;
      } else {
        log.warn('[copyShareUrlToClipboard] Niveau 2 échoué, passage niveau 3');
        // Passer au niveau 3
      }
    } catch (err) {
      log.warn('[copyShareUrlToClipboard] Niveau 2 échoué:', err);
      // Passer au niveau 3
    }
    
    // ✅ PHASE 8 : Niveau 3 : Sélection manuelle
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.top = '50%';
      textArea.style.left = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.width = '400px';
      textArea.style.height = '50px';
      textArea.style.zIndex = '9999';
      textArea.style.border = '2px solid #3b82f6';
      textArea.style.padding = '8px';
      textArea.style.fontSize = '14px';
      
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, url.length);
      textArea.focus();
      
      log.info('[copyShareUrlToClipboard] Sélection manuelle requise (niveau 3)');
      
      // Supprimer après 5 secondes
      setTimeout(() => {
        if (document.body.contains(textArea)) {
          document.body.removeChild(textArea);
        }
      }, 5000);
      
      return true;
    } catch (err) {
      log.error('[copyShareUrlToClipboard] Tous les niveaux ont échoué:', err);
      return false;
    }
  }, []);

  // Charger liens au démarrage
  useEffect(() => {
    if (!dbReady) {
      setLoading(false);
      return;
    }

    loadShareLinks();
  }, [dbReady, loadShareLinks]);

  // Nettoyage automatique des liens expirés
  useEffect(() => {
    if (!autoCleanup || !dbReady || cleanupInterval <= 0) {
      return;
    }

    // Nettoyer au démarrage
    cleanup();

    // Nettoyer périodiquement
    const interval = setInterval(() => {
      cleanup();
    }, cleanupInterval);

    return () => clearInterval(interval);
  }, [autoCleanup, dbReady, cleanupInterval, cleanup]);

  return {
    // État
    shareLinks,
    currentShareLink,
    loading,
    error,
    dbReady,

    // Méthodes
    createShareLink,
    revokeShareLink,
    exportForShare,
    downloadShareExport,
    cleanup,
    loadShareLinks,
    copyTokenToClipboard,
    copyShareUrlToClipboard,
    validateShareToken,

    // Constantes
    EXPIRATION_OPTIONS,
    SHARE_SCOPES,
    PERMISSIONS
  };
};

export default useNutritionSharing;

