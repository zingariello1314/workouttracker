import React, { useState, useRef } from 'react';
import { useHomepageImages } from '../hooks/useHomepageImages';
import { settingsTheme as S } from './tabs/SettingsTab/settingsThemeClasses';
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
  const [batchUploadProgress, setBatchUploadProgress] = useState(null); // { current, total, fileName }
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
  // silent : pas d’overlay « Sauvegarde… » (uploads multiples en chaîne)
  const saveImagesIndependently = async (images, force = false, { silent = false } = {}) => {
    if (!silent) {
      setIsSaving(true);
      setSaveStatus('saving');
    }

    try {
      cleanupLocalStorage();
      await saveImages(images, { force });
      if (!silent) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      log.error('Erreur lors de la sauvegarde', error);
      if (!silent) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
      throw error;
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
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
    setBatchUploadProgress(null);
    const failedFiles = [];

    try {
      // Une image après l’autre : traitement + sauvegarde (évite pics mémoire / UI bloquée)
      let working = [...backgroundImages];
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBatchUploadProgress({ current: i + 1, total, fileName: file.name });

        try {
          const processed = await processImage(file);
          working = [...working, processed];
          updateImagesRef(working);

          const isLast = i === files.length - 1;
          await saveImagesIndependently(working, true, { silent: !isLast });
        } catch (fileErr) {
          log.error(`Échec pour « ${file.name} »`, fileErr);
          failedFiles.push(file.name);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadImages();

      setQuotaCheck(null);
      setQuotaWarning(null);

      if (failedFiles.length > 0) {
        alert(
          `Certaines images n’ont pas pu être ajoutées :\n\n${failedFiles.join('\n')}\n\n` +
            `Les autres ont bien été enregistrées.`
        );
      }
    } catch (error) {
      log.error('Erreur lors de l\'upload des images:', error);
      alert('Erreur lors de l\'upload des images');
    } finally {
      setIsUploading(false);
      setBatchUploadProgress(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`${S.modalPanel} max-w-4xl`}>
        <div className={`${S.modalHeader} flex-wrap gap-3`}>
          <h2 className="text-2xl font-bold text-red-100">Paramètres de la page d'accueil</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 text-sm text-emerald-400/90`}>
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>Sauvegarde automatique active</span>
            </div>

            <button
              type="button"
              onClick={() => setShowDiagnostic(true)}
              className={S.btnSecondary}
            >
              Diagnostic
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className={`${S.btnPrimary} disabled:opacity-50`}
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>

            {saveStatus === 'success' && (
              <div className="flex items-center text-sm text-emerald-400">
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegardé !
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center text-sm text-red-400">
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Erreur
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${S.muted} hover:bg-red-950/40 hover:text-red-100`}
              aria-label="Fermer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Images de fond uniquement - rotation automatique toutes les 2 minutes */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-red-100">Images de fond</h3>
            <p className={`mb-4 text-sm ${S.muted}`}>
              Ces images seront utilisées comme arrière-plan de la page d&apos;accueil et changeront automatiquement toutes les 2 minutes.
              {' '}
              Vous pouvez en sélectionner plusieurs à la fois (Ctrl/Cmd + clic) : elles sont traitées et enregistrées une par une.
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
                      type="button"
                      onClick={() => setQuotaWarning(null)}
                      className={`ml-auto ${S.muted} hover:text-red-100`}
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
                <div className="mb-4 rounded-lg border border-red-900/45 bg-red-950/25 p-3">
                  <div className={`text-sm ${S.body}`}>
                    <strong className="text-red-200">Taille requise :</strong> {formatBytes(quotaCheck.required)}
                    {quotaCheck.available > 0 && (
                      <span className="ml-2 text-red-300/80">
                        ({((quotaCheck.required / quotaCheck.available) * 100).toFixed(1)} % du quota disponible)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || (quotaCheck && !quotaCheck.canUpload)}
                className={`${S.btnPrimary} w-full disabled:opacity-50`}
              >
                {isUploading && batchUploadProgress
                  ? `Ajout ${batchUploadProgress.current}/${batchUploadProgress.total}…`
                  : isUploading
                    ? 'Traitement…'
                    : quotaCheck && !quotaCheck.canUpload
                      ? 'Quota insuffisant'
                      : 'Ajouter des images (plusieurs fichiers possible, JPG/PNG)'}
              </button>

              {batchUploadProgress && (
                <p className={`text-xs ${S.muted}`}>
                  Fichier en cours : <span className="text-red-200/90 truncate block max-w-full">{batchUploadProgress.fileName}</span>
                </p>
              )}

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
                    <div key={index} className="group relative">
                      <img
                        src={imageSrc}
                        alt={`Fond ${index + 1}`}
                        className="h-32 w-full rounded-lg border border-red-900/40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeBackgroundImage(index)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-red-800/60 bg-red-950/90 text-sm text-red-50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-2 left-2 rounded border border-red-900/50 bg-black/70 px-2 py-1 text-xs text-red-100">
                        Fond {index + 1}
                        {typeof image === 'object' && image?.format && (
                          <span className="ml-1 text-red-300/90">({image.format.toUpperCase()})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Indicateur de santé du système */}
          <div className={S.inset}>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold text-red-100">Santé du système</h4>
              <button
                type="button"
                onClick={checkSystemHealth}
                className={`text-sm ${S.muted} underline-offset-2 hover:text-red-100 hover:underline`}
              >
                Vérifier
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                systemHealth === 'excellent' ? 'bg-emerald-500' :
                systemHealth === 'good' ? 'bg-amber-500' :
                systemHealth === 'poor' ? 'bg-red-500' :
                'bg-zinc-600'
              }`} />
              <span className={`text-sm ${S.body}`}>
                {systemHealth === 'excellent' ? 'Excellent — tous les systèmes fonctionnent' :
                 systemHealth === 'good' ? 'Bon — système de secours actif' :
                 systemHealth === 'poor' ? 'Problème — vérification nécessaire' :
                 'Inconnu — vérification en cours'}
              </span>
            </div>
            <div className={`mt-2 text-xs ${S.muted}`}>
              <p>• Sauvegarde triple niveau (IndexedDB + localStorage + sessionStorage)</p>
              <p>• Récupération automatique en cas de problème</p>
              <p>• Sauvegarde synchrone avant fermeture</p>
            </div>
          </div>

          {/* Système de sauvegarde renforcé */}
          <div className="rounded-lg border border-red-900/45 bg-red-950/20 p-4">
            <h4 className="mb-2 flex items-center font-semibold text-red-200">
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sauvegarde optimisée activée
            </h4>
            <div className={`space-y-2 text-sm ${S.body}`}>
              <p><strong className="text-red-100">Vos images haute qualité sont sauvegardées automatiquement dans :</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• IndexedDB (stockage étendu, qualité maximale)</li>
                <li>• Métadonnées dans localStorage (léger)</li>
                <li>• Sauvegarde automatique toutes les 10 minutes</li>
                <li>• Sauvegarde avant fermeture du navigateur</li>
              </ul>
              <div className="mt-3 rounded border border-red-900/40 bg-black/50 p-3">
                <h5 className="mb-1 font-semibold text-red-300">Qualité maximale</h5>
                <ul className={`space-y-1 text-xs ${S.muted}`}>
                  <li>• Aucune compression (qualité originale)</li>
                  <li>• Aucun redimensionnement (résolution native)</li>
                  <li>• Support 4K et images volumineuses</li>
                  <li>• Stockage IndexedDB</li>
                  <li>• Persistance après redémarrage</li>
                  <li>• Migration automatique depuis l’ancien système</li>
                </ul>
              </div>
              <p className={`mt-2 text-xs ${S.muted}`}>
                <strong className="text-red-200">Garantie :</strong> vos images conservent leur qualité d’origine.
              </p>
            </div>
          </div>
        </div>

        <div className={S.modalFooter}>
          <button type="button" onClick={onClose} className={S.btnSecondary}>
            Fermer
          </button>
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
