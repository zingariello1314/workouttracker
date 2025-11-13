import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import { useHomepageImages } from '../hooks/useHomepageImages';
import StorageDiagnostic from './StorageDiagnostic';
import QuotaIndicator from './QuotaIndicator';
import { canUploadImages, formatBytes } from '../utils/quotaManager';
import { processImageForStorage } from '../utils/imageFormatOptimizer';
import logger from '../utils/logger';

const log = logger.component('HomePageImageSettings');

const HomePageImageSettings = ({ onClose }) => {
  const { backgroundImages, saveImages, loadImages, updateImagesRef, isLoading, systemHealth, checkSystemHealth } = useHomepageImages();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [quotaCheck, setQuotaCheck] = useState(null); // Résultat vérification quota
  const [quotaWarning, setQuotaWarning] = useState(null); // Warning/Critical
  const fileInputRef = useRef(null);

  // Fonction pour nettoyer le localStorage
  const cleanupLocalStorage = () => {
    try {
      const keysToClean = [
        'homepage_backgroundImages_backup',
        'homepage_bannerImages_backup',
        'homepage_images_backup_old',
        'workoutData_backup'
      ];
      
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`⚠️ Impossible de nettoyer ${key}:`, error);
        }
      });
      
      console.log('🧹 Nettoyage localStorage effectué');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage:', error);
    }
  };

  // Système de stockage simplifié et ultra-fiable
  // ✅ Phase 6: Sauvegarde avec option force pour uploads/suppressions
  const saveImagesIndependently = async (images, force = false) => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Nettoyer avant sauvegarde
      cleanupLocalStorage();
      
      // ✅ Phase 6: Utiliser force pour uploads/suppressions (sauvegarde immédiate)
      await saveImages(images, { force });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      log.error('Erreur lors de la sauvegarde', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Phase 3: Traitement image optimisé (format optimal + thumbnail)
  // QUALITÉ FULL 100% PRÉSERVÉE
  const processImage = async (file) => {
    try {
      log.debug(`📸 Traitement image optimisé: ${file.name} (${Math.round(file.size / 1024 / 1024 * 100) / 100} MB)`);
      
      // Traiter image : format optimal (WebP si supporté) + thumbnail
      const processed = await processImageForStorage(file, {
        createThumbnail: true,
        preserveQuality: true // Qualité 100% pour full
      });
      
      log.debug('✅ Image traitée', {
        format: processed.format,
        fullSize: `${(processed.metadata.fullSize / 1024 / 1024).toFixed(2)} MB`,
        thumbnailSize: processed.thumbnail 
          ? `${(processed.metadata.thumbnailSize / 1024).toFixed(2)} KB`
          : 'N/A',
        quality: processed.metadata.quality
      });
      
      // Retourner objet v3 : { full, thumbnail, format, metadata }
      return {
        full: processed.full,
        thumbnail: processed.thumbnail,
        format: processed.format,
        metadata: processed.metadata
      };
    } catch (error) {
      log.error('❌ Erreur traitement image', error);
      throw error;
    }
  };

  // Gérer l'upload des images de fond avec vérification quota
  const handleBackgroundImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // ✅ Phase 2 : Vérifier quota AVANT traitement
    try {
      log.debug('📊 Vérification quota avant upload...', { fileCount: files.length });
      
      const uploadCheck = await canUploadImages(files);
      setQuotaCheck(uploadCheck);

      if (!uploadCheck.canUpload) {
        // Quota insuffisant - bloquer upload
        alert(
          `❌ Quota insuffisant pour uploader ces images.\n\n` +
          `Taille requise: ${formatBytes(uploadCheck.required)}\n` +
          `Quota disponible: ${formatBytes(uploadCheck.available)}\n\n` +
          `Veuillez exporter certaines bannières ou libérer de l'espace.`
        );
        
        // Réinitialiser l'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Avertissement si quota élevé
      if (uploadCheck.warning || uploadCheck.critical) {
        const level = uploadCheck.critical ? 'critique' : 'élevé';
        const message = uploadCheck.critical
          ? `🚨 Quota ${level} (${uploadCheck.quota.percentage.toFixed(1)}%) - Export recommandé avant upload`
          : `⚠️ Quota ${level} (${uploadCheck.quota.percentage.toFixed(1)}%) - Considérer export`;
        
        log.warn(message);
        
        // Afficher warning mais permettre upload
        setQuotaWarning({
          level: uploadCheck.critical ? 'CRITICAL' : 'WARNING',
          message: message,
          suggestion: 'Pensez à exporter vos bannières pour libérer de l\'espace'
        });
      }

    } catch (error) {
      log.error('❌ Erreur vérification quota', error);
      // En cas d'erreur, permettre upload (ne pas bloquer)
      setQuotaCheck({ canUpload: true, error: error.message });
    }

    setIsUploading(true);
    try {
      // ✅ Phase 3: Traiter images avec format optimal + thumbnails
      const newImages = await Promise.all(
        files.map(file => processImage(file))
      );
      
      // Ajouter les nouvelles images aux existantes
      // Note: backgroundImages peut contenir strings (v2) ou objets (v3)
      const updatedImages = [...backgroundImages, ...newImages];
      
             // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT pour éviter race condition
             updateImagesRef(updatedImages);
             
             // ✅ Phase 6: Sauvegarde immédiate après upload (force: true)
             await saveImagesIndependently(updatedImages, true);
             
             // ✅ Phase 7: Attendre un peu pour que la sauvegarde soit complète, puis recharger
             await new Promise(resolve => setTimeout(resolve, 100));
             await loadImages();
             
             // Réinitialiser quota check après upload réussi
             setQuotaCheck(null);
             setQuotaWarning(null);
      
    } catch (error) {
      log.error('Erreur lors de l\'upload des images:', error);
      alert('Erreur lors de l\'upload des images');
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // Supprimer une image de fond avec sauvegarde indépendante
  const removeBackgroundImage = async (index) => {
    try {
      // Supprimer l'image du tableau local
      const updatedImages = backgroundImages.filter((_, i) => i !== index);
      
      // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT pour éviter race condition
      updateImagesRef(updatedImages);
      
      // ✅ Phase 7: Sauvegarde immédiate après suppression (force: true)
      await saveImagesIndependently(updatedImages, true);
      
      // ✅ Phase 7: Attendre un peu pour que la sauvegarde soit complète, puis recharger
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadImages();
      
    } catch (error) {
      log.error('Erreur lors de la suppression de l\'image', error);
      alert('Erreur lors de la suppression de l\'image');
    }
  };


  // Bouton de sauvegarde manuelle simplifié
  const handleManualSave = async () => {
    await saveImagesIndependently(backgroundImages);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Paramètres de la Page d'Accueil</h2>
          <div className="flex items-center space-x-4">
            {/* Indicateur de sauvegarde automatique */}
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sauvegarde automatique active</span>
            </div>
            
            {/* Bouton de diagnostic */}
            <Button
              onClick={() => setShowDiagnostic(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              🔍 Diagnostic
            </Button>
            
            {/* Bouton de sauvegarde manuelle */}
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </Button>
            
            {/* Indicateur de statut */}
            {saveStatus === 'success' && (
              <div className="text-green-400 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegardé !
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="text-red-400 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Erreur
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Images de fond uniquement - rotation automatique toutes les 2 minutes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Images de Fond</h3>
            <p className="text-slate-300 text-sm mb-4">
              Ces images seront utilisées comme arrière-plan de la page d'accueil et changeront automatiquement toutes les 2 minutes.
            </p>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
              
              {/* Indicateur Quota */}
              <div className="mb-4">
                <QuotaIndicator
                  onWarning={(warning) => {
                    setQuotaWarning(warning);
                    log.warn('⚠️ Quota warning', warning);
                  }}
                  onCritical={(critical) => {
                    setQuotaWarning(critical);
                    log.warn('🚨 Quota critical', critical);
                  }}
                  showDetails={true}
                  autoRefresh={true}
                />
              </div>

              {/* Avertissement quota si présent */}
              {quotaWarning && (
                <div className={`mb-4 rounded-lg p-3 ${
                  quotaWarning.level === 'CRITICAL'
                    ? 'bg-red-900/20 border border-red-600/30'
                    : 'bg-yellow-900/20 border border-yellow-600/30'
                }`}>
                  <div className={`flex items-start text-sm ${
                    quotaWarning.level === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong>{quotaWarning.message}</strong>
                      {quotaWarning.suggestion && (
                        <div className="mt-1 text-xs opacity-90">
                          💡 {quotaWarning.suggestion}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setQuotaWarning(null)}
                      className="ml-auto text-slate-400 hover:text-slate-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Info taille upload si fichiers sélectionnés */}
              {quotaCheck && quotaCheck.required > 0 && (
                <div className="mb-4 bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                  <div className="text-blue-400 text-sm">
                    <strong>Taille requise:</strong> {formatBytes(quotaCheck.required)}
                    {quotaCheck.available > 0 && (
                      <span className="text-blue-300 ml-2">
                        ({((quotaCheck.required / quotaCheck.available) * 100).toFixed(1)}% du quota disponible)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || (quotaCheck && !quotaCheck.canUpload)}
                className="w-full"
              >
                {isUploading 
                  ? 'Upload haute qualité...' 
                  : quotaCheck && !quotaCheck.canUpload
                    ? '❌ Quota insuffisant'
                    : '📸 Ajouter des Images Haute Qualité (JPG/PNG)'
                }
              </Button>

              {/* Galerie des images de fond */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {backgroundImages.map((image, index) => {
                  // ✅ Phase 3: Utiliser thumbnail si disponible (format v3), sinon full (v2 ou v3 sans thumbnail)
                  const imageSrc = typeof image === 'object' && image?.thumbnail
                    ? image.thumbnail // Thumbnail pour galerie (léger)
                    : typeof image === 'object' && image?.full
                      ? image.full // Full si pas de thumbnail
                      : image; // Format v2 (string)
                  
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={imageSrc}
                        alt={`Fond ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeBackgroundImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Fond {index + 1}
                        {typeof image === 'object' && image?.format && (
                          <span className="ml-1 text-blue-300">({image.format.toUpperCase()})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Indicateur de santé du système */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-semibold">🏥 Santé du Système</h4>
              <button
                onClick={checkSystemHealth}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Vérifier
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth === 'excellent' ? 'bg-green-500' :
                systemHealth === 'good' ? 'bg-yellow-500' :
                systemHealth === 'poor' ? 'bg-red-500' :
                'bg-gray-500'
              }`}></div>
              <span className="text-slate-300 text-sm">
                {systemHealth === 'excellent' ? '✅ Excellent - Tous les systèmes fonctionnent' :
                 systemHealth === 'good' ? '⚠️ Bon - Système de fallback actif' :
                 systemHealth === 'poor' ? '❌ Problème - Vérification nécessaire' :
                 '❓ Inconnu - Vérification en cours'}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              <p>• Sauvegarde triple niveau (IndexedDB + localStorage + sessionStorage)</p>
              <p>• Récupération automatique en cas de problème</p>
              <p>• Sauvegarde synchrone avant fermeture</p>
            </div>
          </div>

          {/* Système de sauvegarde renforcé */}
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sauvegarde Optimisée Activée
            </h4>
            <div className="text-green-200 text-sm space-y-2">
              <p><strong>Vos images haute qualité sont sauvegardées automatiquement dans :</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• 💾 IndexedDB (stockage illimité, qualité maximale)</li>
                <li>• 🔄 Métadonnées dans localStorage (léger)</li>
                <li>• ⚡ Sauvegarde automatique toutes les 10 minutes</li>
                <li>• 🛡️ Sauvegarde avant fermeture du navigateur</li>
              </ul>
              <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3 mt-3">
                <h5 className="text-blue-400 font-semibold mb-1">🚀 QUALITÉ MAXIMALE GARANTIE :</h5>
                <ul className="text-blue-200 text-xs space-y-1">
                  <li>• ✅ AUCUNE compression (qualité originale 100%)</li>
                  <li>• ✅ AUCUN redimensionnement (résolution native)</li>
                  <li>• ✅ Support 4K+ et images très volumineuses</li>
                  <li>• ✅ Stockage IndexedDB (pas de limite localStorage)</li>
                  <li>• ✅ Persistance garantie après redémarrage</li>
                  <li>• ✅ Migration automatique depuis ancien système</li>
                </ul>
              </div>
              <p className="text-xs text-green-300 mt-2">
                <strong>Garantie :</strong> Vos images haute qualité ne peuvent pas être perdues et conservent leur qualité originale.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Modal de diagnostic */}
      {showDiagnostic && (
        <StorageDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
    </div>
  );
};

export default HomePageImageSettings;
