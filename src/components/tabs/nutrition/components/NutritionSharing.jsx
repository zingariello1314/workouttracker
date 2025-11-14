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
import { SHARE_SCOPES, PERMISSIONS } from '../../../../services/nutrition/nutritionSharing';
import { Badge } from '../../../ui/Badge';

/**
 * Composant d'affichage QR code avec génération à la volée
 * 
 * ✅ SOLUTION : Utiliser API QR code en ligne (qr-server.com) pour génération rapide
 * Alternative : Installer bibliothèque qrcode.js si nécessaire
 */
const QRCodeDisplay = ({ url, token, size = 200 }) => {
  // ✅ Générer URL QR code via API publique (rapide, sans dépendance)
  // Format : https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url || token)}`;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={qrCodeUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="border border-slate-700 rounded bg-white p-2"
        onError={(e) => {
          // Fallback en cas d'erreur chargement
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      {/* Fallback si image ne charge pas */}
      <div 
        className="hidden flex flex-col items-center gap-2 p-4 bg-slate-800 rounded border border-slate-700"
        style={{ width: size, height: size }}
      >
        <QrCode size={48} className="text-blue-400" />
        <p className="text-slate-400 text-xs text-center font-mono break-all max-w-xs">
          {token || url}
        </p>
        <p className="text-slate-500 text-xs text-center mt-2">
          Utilisez ce token pour accéder aux données
        </p>
      </div>
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
  const [copiedToken, setCopiedToken] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [creating, setCreating] = useState(false);

  // Formulaire création
  const [formData, setFormData] = useState({
    expiresIn: '24h',
    scope: SHARE_SCOPES.all,
    permissions: [PERMISSIONS.read]
  });

  // Charger liens au démarrage
  useEffect(() => {
    if (dbReady) {
      loadShareLinks();
    }
  }, [dbReady, loadShareLinks]);

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
        console.error('[NutritionSharing] Erreur création lien:', err);
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
          console.error('[NutritionSharing] Erreur révocation lien:', err);
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
          console.error('[NutritionSharing] Erreur révocation lien:', err);
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

  // Télécharger export
  const handleDownloadExport = useCallback(async (token, scope) => {
    try {
      await downloadShareExport(token, scope);
    } catch (err) {
      console.error('[NutritionSharing] Erreur téléchargement export:', err);
    }
  }, [downloadShareExport]);

  // Nettoyage liens expirés
  const handleCleanup = useCallback(async () => {
    try {
      const deletedCount = await cleanup();
      if (deletedCount > 0) {
        alert(`${deletedCount} lien(s) expiré(s) supprimé(s)`);
      } else {
        alert('Aucun lien expiré à supprimer');
      }
    } catch (err) {
      console.error('[NutritionSharing] Erreur nettoyage:', err);
    }
  }, [cleanup]);

  if (!dbReady) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && shareLinks.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
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
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 size={24} className="text-blue-400" />
              <CardTitle>Partage avec Coach</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCleanup}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Nettoyer liens expirés
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus size={16} />
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
        <Card className="bg-slate-800/50 border-slate-700">
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
        <Card className="bg-slate-800/50 border-slate-700">
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
            className={`bg-slate-800/50 border-slate-700 ${isExpired ? 'opacity-60' : ''}`}
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
                <Button
                  onClick={() => handleDownloadExport(link.token, link.scope)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Export JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default NutritionSharing;

