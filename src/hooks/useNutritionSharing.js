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

      log.debug('[loadShareLinks] Liens chargés', {
        count: links.length
      });
    } catch (err) {
      log.error('[loadShareLinks] Erreur chargement liens:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dbReady]);

  /**
   * Génère un nouveau lien de partage
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

      // Générer lien
      const shareLink = await generateSecureShareLink({
        expiresIn,
        scope,
        permissions
      });

      // Recharger liens
      await loadShareLinks();

      setCurrentShareLink(shareLink);

      log.debug('[createShareLink] Lien créé', {
        token: shareLink.token.substring(0, 8) + '...',
        scope,
        expiresAt: new Date(shareLink.expiresAt).toISOString()
      });

      return shareLink;
    } catch (err) {
      log.error('[createShareLink] Erreur création lien:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, loadShareLinks]);

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

      log.debug('[revokeShareLink] Lien révoqué', {
        token: token.substring(0, 8) + '...'
      });
    } catch (err) {
      log.error('[revokeShareLink] Erreur révocation lien:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, loadShareLinks, currentShareLink]);

  /**
   * Exporte les données nutrition pour partage
   */
  const exportForShare = useCallback(async (token, scope = SHARE_SCOPES.all) => {
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

      // Préparer données pour partage
      const exportData = await exportNutritionDataForShare(
        nutritionData,
        token,
        scope || shareLink.scope
      );

      log.debug('[exportForShare] Données exportées', {
        token: token.substring(0, 8) + '...',
        scope: exportData.scope,
        hasStats: !!exportData.data.stats,
        hasCharts: !!exportData.data.charts,
        hasProgress: !!exportData.data.progress
      });

      return exportData;
    } catch (err) {
      log.error('[exportForShare] Erreur export données:', err);
      setError(err);
      throw err;
    }
  }, [dbReady, exportNutritionData]);

  /**
   * Télécharge les données exportées en JSON
   */
  const downloadShareExport = useCallback(async (token, scope = SHARE_SCOPES.all) => {
    try {
      const exportData = await exportForShare(token, scope);

      // Créer fichier JSON
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Télécharger fichier
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutrition-share-${token.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libérer URL
      URL.revokeObjectURL(url);

      log.debug('[downloadShareExport] Fichier téléchargé', {
        token: token.substring(0, 8) + '...',
        scope: exportData.scope
      });
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

      log.debug('[cleanup] Liens expirés supprimés', {
        count: deletedCount
      });

      return deletedCount;
    } catch (err) {
      log.error('[cleanup] Erreur nettoyage:', err);
      return 0;
    }
  }, [dbReady, loadShareLinks]);

  /**
   * Copie le token dans le presse-papiers
   */
  const copyTokenToClipboard = useCallback(async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      log.debug('[copyTokenToClipboard] Token copié');
      return true;
    } catch (err) {
      log.error('[copyTokenToClipboard] Erreur copie:', err);
      // Fallback : sélection manuelle
      return false;
    }
  }, []);

  /**
   * Copie l'URL de partage dans le presse-papiers
   */
  const copyShareUrlToClipboard = useCallback(async (shareLink) => {
    try {
      if (!shareLink || !shareLink.url) {
        throw new Error('Lien de partage invalide');
      }

      await navigator.clipboard.writeText(shareLink.url);
      log.debug('[copyShareUrlToClipboard] URL copiée');
      return true;
    } catch (err) {
      log.error('[copyShareUrlToClipboard] Erreur copie:', err);
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

