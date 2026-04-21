/**
 * NutritionSharing - Composant Gestion Partage avec Coach
 * 
 * Affiche :
 * - Liste liens de partage actifs
 * - Génération nouveaux liens (scope, expiration, permissions)
 * - QR codes pour partage facile
 * - Export JSON avec données anonymisées
 * - Révocation liens expirés
 * 
 * @module components/tabs/nutrition/components/NutritionSharing
 * @see ../../../../../nouvelongletnutritionplan.md Section 6.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { 
  Share2, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  QrCode, 
  Link as LinkIcon,
  Clock,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useNutritionSharing } from '../../../../hooks/useNutritionSharing';
import { 
  SHARE_SCOPES, 
  PERMISSIONS,
  generateQRCode,
  cleanupOrphanedQRCache,
  CleanupService
} from '../../../../services/nutrition/nutritionSharing';
import { Badge } from '../../../ui/Badge';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';

const log = logger.component('NutritionSharing');

/**
 * ✅ PHASE 2 : Composant d'affichage QR code avec génération locale
 * 
 * ✅ PHASE 2 : Migration vers génération locale
 * - Génération locale avec bibliothèque qrcode (100% offline)
 * - Cache localStorage pour éviter régénération
 * - Chargement asynchrone avec état loading
 * - Gestion erreurs avec fallback
 * - Option téléchargement QR code
 */
const QRCodeDisplay = ({ url, token, size = 200 }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ PHASE 2 : Générer QR code localement (avec cache automatique)
        const dataUrl = await generateQRCode(url || token, {
          size,
          margin: 2,
          errorCorrectionLevel: 'M'
        });

        if (mounted) {
          if (dataUrl) {
            setQrDataUrl(dataUrl);
          } else {
            setError('Impossible de générer le QR code');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Erreur génération QR code');
          log.error('[QRCodeDisplay] Erreur génération QR code', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    generateQR();
    return () => { mounted = false; };
  }, [url, token, size]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center border border-slate-700 rounded bg-slate-800"
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error || !qrDataUrl) {
    return (
      <div 
        className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-700 rounded bg-slate-800"
        style={{ width: size, height: size }}
      >
        <QrCode size={48} className="text-blue-400" />
        <p className="text-slate-400 text-xs text-center font-mono break-all max-w-xs">
          {token || url}
        </p>
        <p className="text-slate-500 text-xs text-center mt-2">
          {error || 'Utilisez ce token pour accéder aux données'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={qrDataUrl}
        alt="QR Code de partage"
        width={size}
        height={size}
        className="border border-slate-700 rounded bg-white p-2"
      />
      {/* ✅ PHASE 2 : Option téléchargement QR code */}
      <button
        onClick={() => {
          try {
            const a = document.createElement('a');
            a.href = qrDataUrl;
            a.download = `qrcode_${token || 'share'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (err) {
            log.error('[QRCodeDisplay] Erreur téléchargement QR code', err);
          }
        }}
        className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
      >
        <Download size={14} />
        Télécharger QR code
      </button>
    </div>
  );
};

/**
 * Formate la date d'expiration
 */
const formatExpirationDate = (expiresAt) => {
  if (!expiresAt) return 'Jamais';
  
  const date = new Date(expiresAt);
  const now = new Date();
  const diff = date - now;
  
  if (diff < 0) return 'Expiré';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `Dans ${days}j ${hours}h`;
  if (hours > 0) return `Dans ${hours}h`;
  return 'Expire bientôt';
};

/**
 * Formate le scope pour affichage
 */
const formatScope = (scope) => {
  switch (scope) {
    case SHARE_SCOPES.all:
      return 'Toutes les données';
    case SHARE_SCOPES.stats:
      return 'Statistiques uniquement';
    case SHARE_SCOPES.charts:
      return 'Graphiques uniquement';
    case SHARE_SCOPES.progress:
      return 'Progression uniquement';
    default:
      return scope;
  }
};

/**
 * Formate les permissions pour affichage
 */
const formatPermissions = (permissions) => {
  if (!permissions || permissions.length === 0) return 'Aucune';
  
  return permissions.map(p => {
    switch (p) {
      case PERMISSIONS.read:
        return 'Lecture seule';
      default:
        return p;
    }
  }).join(', ');
};

const NutritionSharing = () => {
  const { showSuccess, showInfo, showError } = useToast();
  const {
    shareLinks,
    currentShareLink,
    loading,
    error,
    dbReady,
    createShareLink,
    revokeShareLink,
    downloadShareExport,
    copyTokenToClipboard,
    copyShareUrlToClipboard,
    cleanup,
    loadShareLinks,
    EXPIRATION_OPTIONS,
    SHARE_SCOPES: shareScopes,
    PERMISSIONS: permissionsConst
  } = useNutritionSharing({ autoCleanup: true, cleanupInterval: 60 * 60 * 1000 });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(null);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [creating, setCreating] = useState(false);
  
  // ✅ PHASE 3 : État pour export chiffré
  const [showPasswordModal, setShowPasswordModal] = useState(null); // Token du lien à exporter
  const [exportPassword, setExportPassword] = useState('');
  const [exportEncrypt, setExportEncrypt] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Formulaire création
  const [formData, setFormData] = useState({
    expiresIn: '24h',
    scope: SHARE_SCOPES.all,
    permissions: [PERMISSIONS.read]
  });

  // Charger liens au démarrage
  useEffect(() => {
    if (!dbReady) return;

    loadShareLinks();
  }, [dbReady, loadShareLinks]);

  // ✅ PHASE 7 : Cleanup automatique amélioré avec CleanupService
  useEffect(() => {
    if (!dbReady) return;

    // ✅ PHASE 7 : Vérifier si cleanup nécessaire
    if (CleanupService.isCleanupNeeded()) {
      // Récupérer tokens actifs pour nettoyage intelligent QR
      const activeTokens = shareLinks
        .filter(link => {
          const expiresAt = typeof link.expiresAt === 'number' 
            ? link.expiresAt 
            : (link.expiresAt ? new Date(link.expiresAt).getTime() : null);
          const now = Date.now();
          return expiresAt === null || expiresAt > now;
        })
        .map(link => link.token);
      
      // ✅ PHASE 7 : Exécuter cleanup complet en arrière-plan
      CleanupService.runCleanup({ 
        force: false,
        activeTokens 
      }).then(stats => {
        // ✅ PHASE 7 : Mettre à jour stats affichées après cleanup
        setCleanupStats(stats);
      }).catch(error => {
        log.warn('[NutritionSharing] Erreur cleanup automatique:', error);
        // Ne pas bloquer UI en cas d'erreur
      });
    }
  }, [dbReady, shareLinks]); // ✅ Déclenché si shareLinks change ou dbReady

  // Gérer création lien
  const handleCreateLink = useCallback(async (e) => {
    // ✅ SOLUTION 4 : Optimisation handler clic - Délayer traitement lourd
    // Prévenir comportement par défaut immédiatement
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Feedback visuel immédiat (UI responsive)
    setCreating(true);
    
    // Délayer traitement lourd hors du handler synchrone
    // Cela évite les violations performance (>1000ms)
    setTimeout(async () => {
      try {
        const shareLink = await createShareLink(formData);
        
        setShowCreateForm(false);
        setFormData({
          expiresIn: '24h',
          scope: SHARE_SCOPES.all,
          permissions: [PERMISSIONS.read]
        });

        // Afficher QR code pour nouveau lien
        if (shareLink) {
          setShowQRCode(shareLink.token);
        }
      } catch (err) {
        log.error('Erreur création lien', err);
        
        // ✅ PHASE 1.2 : Gérer erreurs rate limiting / limite liens actifs
        if (err.code === 'rate_limit') {
          const waitMin = err.waitTime ? Math.ceil(err.waitTime / 60000) : 1;
          showError(
            'Limite de création atteinte',
            `Vous avez créé trop de liens récemment. Attendez ${waitMin} minute${waitMin > 1 ? 's' : ''} avant de créer un nouveau lien.`
          );
        } else if (err.code === 'max_active_links') {
          showError(
            'Limite de liens actifs atteinte',
            `Vous avez atteint la limite de ${err.maxActive || 10} liens actifs. Révoquez des liens expirés ou inutilisés avant d'en créer un nouveau.`
          );
        } else {
          showError('Erreur création lien', err.message || 'Impossible de créer le lien. Veuillez réessayer.');
        }
      } finally {
        setCreating(false);
      }
    }, 0); // Délai 0ms = prochaine frame (non-bloquant)
  }, [createShareLink, formData]);

  // Gérer révocation lien
  const handleRevokeLink = useCallback(async (token, e) => {
    // ✅ SOLUTION 4 : Optimisation handler clic - Prévenir bloquage UI
    // Prévenir comportement par défaut immédiatement
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!confirm('Êtes-vous sûr de vouloir révoquer ce lien ? Il ne sera plus accessible.')) {
      return;
    }

    // ✅ OPTIMISATION : Délayer traitement pour éviter violation performance
    // La révocation est rapide mais on évite tout risque de blocage
    if (window.requestIdleCallback) {
      requestIdleCallback(async () => {
        try {
          await revokeShareLink(token);
          if (showQRCode === token) {
            setShowQRCode(null);
          }
        } catch (err) {
          log.error('Erreur révocation lien', err);
        }
      }, { timeout: 100 });
    } else {
      setTimeout(async () => {
        try {
          await revokeShareLink(token);
          if (showQRCode === token) {
            setShowQRCode(null);
          }
        } catch (err) {
          log.error('Erreur révocation lien', err);
        }
      }, 0);
    }
  }, [revokeShareLink, showQRCode]);

  // Copier token
  const handleCopyToken = useCallback(async (token) => {
    const success = await copyTokenToClipboard(token);
    if (success) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  }, [copyTokenToClipboard]);

  // Copier URL
  const handleCopyUrl = useCallback(async (shareLink) => {
    const success = await copyShareUrlToClipboard(shareLink);
    if (success) {
      setCopiedUrl(shareLink.token);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  }, [copyShareUrlToClipboard]);

  // ✅ PHASE 3 : Télécharger export (avec support chiffrement)
  const handleDownloadExport = useCallback(async (token, scope, encrypt = false) => {
    try {
      if (encrypt) {
        // ✅ PHASE 3 : Demander mot de passe si chiffrement demandé
        setShowPasswordModal(token);
        setExportEncrypt(true);
        return; // Ne télécharger que si mot de passe fourni
      }

      // Export non chiffré (comportement par défaut)
      await downloadShareExport(token, scope, { encrypt: false });
      showSuccess('Export téléchargé', 'L\'export a été téléchargé avec succès.');
    } catch (err) {
      log.error('Erreur téléchargement export', err);
      showError('Erreur export', err.message || 'Impossible de télécharger l\'export. Veuillez réessayer.');
    }
  }, [downloadShareExport, showError, showSuccess]);

  // ✅ PHASE 3 : Confirmer export chiffré avec mot de passe
  const handleConfirmEncryptedExport = useCallback(async () => {
    if (!showPasswordModal || !exportPassword || exportPassword.length < 8) {
      showError('Mot de passe invalide', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setExporting(true);
      
      // Trouver le lien pour obtenir le scope
      const link = shareLinks.find(l => l.token === showPasswordModal);
      const scope = link?.scope || SHARE_SCOPES.all;

      // ✅ PHASE 3 : Télécharger export chiffré avec mot de passe
      await downloadShareExport(showPasswordModal, scope, {
        encrypt: true,
        password: exportPassword
      });

      // Réinitialiser état
      setShowPasswordModal(null);
      setExportPassword('');
      setExportEncrypt(false);
      
      showSuccess('Export chiffré téléchargé', 'L\'export chiffré a été téléchargé avec succès. N\'oubliez pas votre mot de passe pour le déchiffrer.');
    } catch (err) {
      log.error('Erreur export chiffré', err);
      showError('Erreur export chiffré', err.message || 'Impossible de créer l\'export chiffré. Veuillez réessayer.');
    } finally {
      setExporting(false);
    }
  }, [showPasswordModal, exportPassword, shareLinks, downloadShareExport, showSuccess, showError]);

  // ✅ PHASE 3 : Annuler export chiffré
  const handleCancelEncryptedExport = useCallback(() => {
    setShowPasswordModal(null);
    setExportPassword('');
    setExportEncrypt(false);
  }, []);

  // ✅ PHASE 7 : Récupérer stats cleanup au chargement
  useEffect(() => {
    const stats = CleanupService.getLastCleanupStats();
    setCleanupStats(stats);
  }, []); // Une seule fois au montage

  // ✅ PHASE 7 : Nettoyage liens avec CleanupService amélioré
  const handleCleanup = useCallback(async () => {
    try {
      // Récupérer tokens actifs pour nettoyage intelligent QR
      const activeTokens = shareLinks
        .filter(link => {
          const expiresAt = typeof link.expiresAt === 'number' 
            ? link.expiresAt 
            : (link.expiresAt ? new Date(link.expiresAt).getTime() : null);
          const now = Date.now();
          return expiresAt === null || expiresAt > now;
        })
        .map(link => link.token);

      // ✅ PHASE 7 : Exécuter cleanup complet avec CleanupService
      const stats = await CleanupService.runCleanup({ 
        force: true, // Forcer même si récent
        activeTokens 
      });

      // Mettre à jour stats affichées
      setCleanupStats(stats);

      if (stats.total > 0) {
        const details = [];
        if (stats.expiredLinks > 0) details.push(`${stats.expiredLinks} expiré(s)`);
        if (stats.revokedLinks > 0) details.push(`${stats.revokedLinks} révoqué(s)`);
        if (stats.orphanedQR > 0) details.push(`${stats.orphanedQR} QR orphelin(s)`);
        
        showSuccess(
          'Nettoyage terminé', 
          `${stats.total} élément(s) supprimé(s)${details.length > 0 ? ` (${details.join(', ')})` : ''}`
        );
      } else {
        showInfo('Aucun élément à nettoyer', 'Tous les éléments sont à jour');
      }

      // ✅ PHASE 7 : Recharger liens après cleanup
      await loadShareLinks();
    } catch (err) {
      log.error('Erreur nettoyage', err);
      showError('Erreur nettoyage', 'Impossible de nettoyer les éléments. Veuillez réessayer.');
    }
  }, [shareLinks, loadShareLinks, showSuccess, showInfo, showError]);

  if (!dbReady) {
    return (
      <Card variant="sport">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && shareLinks.length === 0) {
    return (
      <Card variant="sport">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement des liens de partage...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card variant="sport">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 size={24} className="text-blue-400" />
              <CardTitle>Partage avec Coach</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ PHASE 7 : Indicateur dernier cleanup */}
              {cleanupStats && cleanupStats.lastCleanup && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={14} aria-hidden="true" />
                  <span>
                    Dernier nettoyage : {CleanupService.formatLastCleanup(cleanupStats.lastCleanup)}
                  </span>
                  {cleanupStats.total > 0 && (
                    <span className="text-slate-500">
                      ({cleanupStats.total} élément{cleanupStats.total > 1 ? 's' : ''} supprimé{cleanupStats.total > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              )}
              <Button
                onClick={handleCleanup}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                aria-label="Nettoyer les liens expirés et révoqués anciens"
              >
                <Trash2 size={16} aria-hidden="true" />
                Nettoyage automatique
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus size={16} aria-hidden="true" />
                Créer un lien
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            Générez des liens de partage sécurisés pour permettre à votre coach d'accéder à vos données nutritionnelles.
            Les liens sont protégés par des tokens cryptographiques et expirent automatiquement.
          </p>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <p>{error.message || 'Erreur lors du chargement'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire création */}
      {showCreateForm && (
        <Card variant="sport">
          <CardHeader>
            <CardTitle>Créer un nouveau lien de partage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Expiration
              </label>
              <select
                value={formData.expiresIn}
                onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200"
              >
                {Object.entries(EXPIRATION_OPTIONS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key} ({Math.round(value / (60 * 60 * 1000))}h)
                  </option>
                ))}
              </select>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Données à partager
              </label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200"
              >
                {Object.entries(shareScopes).map(([key, value]) => (
                  <option key={key} value={value}>
                    {formatScope(value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(PERMISSIONS.read)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          permissions: [PERMISSIONS.read]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          permissions: []
                        });
                      }
                    }}
                    className="rounded bg-slate-700 border-slate-600"
                  />
                  <span>{formatPermissions([PERMISSIONS.read])}</span>
                </label>
                <p className="text-slate-400 text-xs">
                  Actuellement, seule la lecture est disponible pour le partage avec coach.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleCreateLink}
                variant="primary"
                disabled={creating || formData.permissions.length === 0}
                className="flex items-center gap-2"
              >
                {creating ? 'Création...' : 'Créer le lien'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste liens */}
      {shareLinks.length === 0 && !showCreateForm && (
        <Card variant="sport">
          <CardContent className="text-center py-8">
            <Share2 size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-2">Aucun lien de partage</p>
            <p className="text-slate-400 text-sm mb-4">
              Créez un lien pour partager vos données nutritionnelles avec votre coach.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Créer un lien
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liens actifs */}
      {shareLinks.map((link) => {
        const isExpired = new Date(link.expiresAt) < new Date();
        const isTokenCopied = copiedToken === link.token;
        const isUrlCopied = copiedUrl === link.token;
        const showQR = showQRCode === link.token;

        return (
          <Card
            key={link.token}
            variant="sport"
            className={isExpired ? 'opacity-60' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon size={20} className="text-blue-400" />
                  <CardTitle className="text-sm font-mono">
                    {link.token.substring(0, 16)}...
                  </CardTitle>
                  {isExpired && (
                    <Badge variant="danger" className="text-xs">
                      Expiré
                    </Badge>
                  )}
                  {!isExpired && (
                    <Badge variant="success" className="text-xs">
                      Actif
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={(e) => handleRevokeLink(link.token, e)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                  Révoquer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Infos */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Expiration</p>
                  <p className="text-slate-200 flex items-center gap-2">
                    <Clock size={16} />
                    {formatExpirationDate(link.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Scope</p>
                  <p className="text-slate-200 flex items-center gap-2">
                    <Shield size={16} />
                    {formatScope(link.scope)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Permissions</p>
                  <p className="text-slate-200 flex items-center gap-2">
                    <Eye size={16} />
                    {formatPermissions(link.permissions)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Créé le</p>
                  <p className="text-slate-200">
                    {new Date(link.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              {showQR && (
                <div className="flex flex-col items-center gap-4 p-4 bg-slate-900/50 rounded border border-slate-700">
                  <div className="flex items-center gap-2 text-blue-400">
                    <QrCode size={24} />
                    <span className="text-sm font-medium">QR Code</span>
                  </div>
                  <div className="flex justify-center">
                    {/* ✅ Générer QR code via API publique (vrai QR code scannable) */}
                    <QRCodeDisplay 
                      url={link.url || `${window.location.origin}/nutrition/share/${link.token}`} 
                      token={link.token} 
                      size={200}
                    />
                  </div>
                  <p className="text-slate-400 text-xs text-center max-w-xs">
                    Scannez ce QR code pour accéder aux données partagées ou copiez le token ci-dessous
                  </p>
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <code className="text-xs text-slate-500 font-mono break-all flex-1 bg-slate-800 px-2 py-1 rounded">
                      {link.token}
                    </code>
                    <Button
                      onClick={() => handleCopyToken(link.token)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {isTokenCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setShowQRCode(showQR ? null : link.token)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <QrCode size={16} />
                  {showQR ? 'Masquer QR' : 'Afficher QR'}
                </Button>
                <Button
                  onClick={() => handleCopyToken(link.token)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isTokenCopied ? (
                    <>
                      <CheckCircle size={16} />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copier token
                    </>
                  )}
                </Button>
                {link.url && (
                  <Button
                    onClick={() => handleCopyUrl(link)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isUrlCopied ? (
                      <>
                        <CheckCircle size={16} />
                        URL copiée
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copier URL
                      </>
                    )}
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDownloadExport(link.token, link.scope, false)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export JSON
                  </Button>
                  {/* ✅ PHASE 3 : Bouton export chiffré */}
                  <Button
                    onClick={() => handleDownloadExport(link.token, link.scope, true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 border-green-700"
                    title="Export chiffré avec mot de passe"
                  >
                    <Shield size={16} />
                    Export Chiffré
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ✅ PHASE 3 : Modal saisie mot de passe pour export chiffré */}
      {showPasswordModal && (
        <Card className="bg-slate-800/95 border-slate-600 fixed inset-0 z-50 flex items-center justify-center">
          <CardContent className="max-w-md w-full mx-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield size={24} className="text-green-400" />
                  Export Chiffré
                </CardTitle>
                <Button
                  onClick={handleCancelEncryptedExport}
                  variant="ghost"
                  size="sm"
                  disabled={exporting}
                >
                  <XCircle size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mot de passe (minimum 8 caractères)
                  </label>
                  <Input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Entrez un mot de passe sécurisé"
                    disabled={exporting}
                    className="w-full"
                    minLength={8}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Ce mot de passe sera nécessaire pour déchiffrer l'export. Ne le perdez pas !
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded border border-slate-600">
                  <Shield size={16} className="text-green-400" />
                  <p className="text-xs text-slate-300">
                    <strong>Chiffrement :</strong> AES-256-CBC avec PBKDF2 (10000 itérations)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleConfirmEncryptedExport}
                    variant="primary"
                    disabled={!exportPassword || exportPassword.length < 8 || exporting}
                    className="flex-1"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Chiffrement en cours...
                      </>
                    ) : (
                      <>
                        <Shield size={16} className="mr-2" />
                        Télécharger Export Chiffré
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEncryptedExport}
                    variant="outline"
                    disabled={exporting}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NutritionSharing;

