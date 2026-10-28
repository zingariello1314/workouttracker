import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Heart, X, ZoomIn, Home, Lock, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useHomepageImages } from '../hooks/useHomepageImages';
import { useAppLock } from '../context/AppLockContext';
import { resolveLockWallpaperUrls } from '../utils/wallpaperTargets';
import { settingsTheme as S } from './tabs/SettingsTab/settingsThemeClasses';
import StorageDiagnostic from './StorageDiagnostic';
import QuotaIndicator from './QuotaIndicator';
import { canUploadImages, formatBytes } from '../utils/quotaManager';
import { processImageForStorage } from '../utils/imageFormatOptimizer';
import {
  getHomepageImageFullSrc,
  getHomepageImageThumbSrc,
  isHomepageVideo,
  normalizeHomepageImage,
  purgeRemovedWelcomeVideos,
} from '../utils/homepageImagePreferences';
import {
  LOCK_WALLPAPER_ROTATION_OPTIONS,
  processLockWallpaperFile,
  resolveLockWallpaperOrder,
  resolveLockWallpaperRotationMs,
  resolveLockWallpaperAdvanceOnClick
} from '../utils/lockWallpaperImage';
import {
  WALLPAPER_ORDER_OPTIONS,
  WALLPAPER_ROTATION_OPTIONS
} from '../utils/wallpaperPlayback';
import { HOME_MEDIA_KINDS_OPTIONS } from '../utils/homepageWallpaperSettings';
import { normalizeLockBackgroundItems } from '../utils/wallpaperTargets';
import { useHomeWallpaperPlayback } from '../hooks/useHomeWallpaperPlayback';
import {
  removeAppStaticBackground,
  upsertAppStaticBackground
} from '../utils/appStaticBackgroundPreference';
import logger from '../utils/logger';

const log = logger.component('HomePageImageSettings');

const HomePageImageSettings = ({ onClose }) => {
  const {
    record: appLockRecord,
    addLockOnlyBackground,
    removeLockOnlyBackgroundAt,
    patchLockOnlyBackgroundAt,
    setLockBackgroundUrls,
    updateSettings
  } = useAppLock();
  const { playback: homePlayback, updatePlayback: updateHomePlayback } = useHomeWallpaperPlayback();
  const {
    backgroundImages,
    saveImages,
    loadImages,
    updateImagesRef,
    setBackgroundImages,
    isLoading,
    systemHealth,
    checkSystemHealth
  } = useHomepageImages();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [quotaCheck, setQuotaCheck] = useState(null);
  const [quotaWarning, setQuotaWarning] = useState(null);
  const [batchUploadProgress, setBatchUploadProgress] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const fileInputRef = useRef(null);
  const lockOnlyInputRef = useRef(null);
  const lockOnlyItems = normalizeLockBackgroundItems(appLockRecord);
  const lockOnlyUrls = lockOnlyItems.map((item) => item.dataUrl);
  const effectiveLockCount = resolveLockWallpaperUrls(backgroundImages, appLockRecord).length;
  const [lockBatchProgress, setLockBatchProgress] = useState(null);
  const lockRotationMs = resolveLockWallpaperRotationMs(appLockRecord);
  const lockAdvanceOnClick = resolveLockWallpaperAdvanceOnClick(appLockRecord);
  const lockOrder = resolveLockWallpaperOrder(appLockRecord);
  const [bankImages, setBankImages] = useState([]);
  const [bankThemes, setBankThemes] = useState([]);
  const [bankQuery, setBankQuery] = useState('');
  const [bankTheme, setBankTheme] = useState('all');
  const [bankPreviewId, setBankPreviewId] = useState(null);
  const [bankAddingTheme, setBankAddingTheme] = useState(false);
  const [bankVideos, setBankVideos] = useState([]);

  // Purge hous n fire / streetlife (et autres retirés) de la collection utilisateur
  useEffect(() => {
    if (!backgroundImages?.length) return;
    const cleaned = purgeRemovedWelcomeVideos(
      backgroundImages.map((img, i) => normalizeHomepageImage(img, i))
    );
    if (cleaned.length === backgroundImages.length) return;
    persistCollection(cleaned).catch((error) => {
      log.error('Erreur purge vidéos retirées', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois quand la collection contient un fichier mort
  }, [backgroundImages.length]);

  useEffect(() => {
    let cancelled = false;
    fetch('/wallpaper-bank/manifest.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const images = Array.isArray(data?.images) ? data.images : [];
        setBankImages(images);
        const themes = Array.isArray(data?.themes) && data.themes.length
          ? data.themes
          : [...new Set(images.map((img) => img.theme).filter(Boolean))].sort((a, b) =>
              a.localeCompare(b, 'fr')
            );
        setBankThemes(themes);
      })
      .catch(() => {
        if (!cancelled) {
          setBankImages([]);
          setBankThemes([]);
        }
      });
    fetch('/welcome-videos/manifest.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.videos)) setBankVideos(data.videos);
      })
      .catch(() => {
        if (!cancelled) setBankVideos([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBankImages = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    return bankImages.filter((item) => {
      if (bankTheme !== 'all' && (item.theme || 'Scènes') !== bankTheme) return false;
      if (!q) return true;
      return `${item.name || ''} ${item.id} ${item.theme || ''}`.toLowerCase().includes(q);
    });
  }, [bankImages, bankQuery, bankTheme]);

  const bankPreviewItem = useMemo(
    () => bankImages.find((item) => item.id === bankPreviewId) || null,
    [bankImages, bankPreviewId]
  );

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

  const imagesLiveRef = useRef(backgroundImages);
  const seenImagesRef = useRef(backgroundImages);
  const saveQueueRef = useRef(Promise.resolve());
  if (backgroundImages !== seenImagesRef.current) {
    seenImagesRef.current = backgroundImages;
    if (backgroundImages !== imagesLiveRef.current) {
      imagesLiveRef.current = backgroundImages;
    }
  }

  const commitImages = (updated) => {
    imagesLiveRef.current = updated;
    seenImagesRef.current = updated;
    setBackgroundImages(updated);
    updateImagesRef(updated);
    const snapshot = updated;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (imagesLiveRef.current !== snapshot) return;
        try {
          cleanupLocalStorage();
          await saveImages(snapshot, { force: true });
          if (imagesLiveRef.current !== snapshot) {
            setBackgroundImages(imagesLiveRef.current);
            updateImagesRef(imagesLiveRef.current);
          }
        } catch (error) {
          log.error('Erreur sauvegarde préférences image', error);
        }
      });
  };

  const patchImage = (index, recipe) => {
    const current = imagesLiveRef.current.map((img, i) => normalizeHomepageImage(img, i));
    const norm = current[index];
    if (!norm) return;
    const patch = typeof recipe === 'function' ? recipe(norm) : recipe;
    current[index] = { ...norm, ...patch };
    commitImages(current);
  };

  const toggleLike = (index) => {
    patchImage(index, (norm) => ({ liked: !norm.liked }));
  };

  const toggleUseOnHome = (index) => {
    patchImage(index, (norm) => ({ useOnHome: !norm.useOnHome }));
  };

  const toggleUseOnLock = (index) => {
    patchImage(index, (norm) => ({ useOnLock: !norm.useOnLock }));
  };

  const toggleHidden = (index) => {
    patchImage(index, (norm) => ({ hidden: !norm.hidden }));
  };

  const persistCollection = async (updated) => {
    setBackgroundImages(updated);
    updateImagesRef(updated);
    cleanupLocalStorage();
    await saveImages(updated, { force: true });
  };

  const addBankImage = async (item, { persist = true } = {}) => {
    const id = `bank:${item.id}`;
    const already = backgroundImages.some((img, i) => normalizeHomepageImage(img, i).id === id);
    if (already) return null;
    const entry = {
      id,
      full: item.src,
      thumbnail: item.thumb || item.src,
      liked: false,
      hidden: false,
      useOnHome: false,
      useOnLock: false,
      bankId: item.id,
      theme: item.theme || null,
    };
    const updated = [
      ...backgroundImages.map((img, i) => normalizeHomepageImage(img, i)),
      entry,
    ];
    if (!persist) return updated;
    try {
      await persistCollection(updated);
      return updated;
    } catch (error) {
      log.error('Erreur ajout banque de fonds', error);
      return null;
    }
  };

  const encodeWelcomeVideoSrc = (rawSrc) => {
    const src = String(rawSrc || '');
    if (!src.startsWith('/welcome-videos/')) return src;
    return `/welcome-videos/${src
      .slice('/welcome-videos/'.length)
      .split('/')
      .map((part) => {
        try {
          return encodeURIComponent(decodeURIComponent(part));
        } catch {
          return encodeURIComponent(part);
        }
      })
      .join('/')}`;
  };

  const findBankVideoIndex = (item) => {
    const id = `video:${item.id}`;
    const safeSrc = encodeWelcomeVideoSrc(item.src);
    return backgroundImages.findIndex((img, i) => {
      const norm = normalizeHomepageImage(img, i);
      if (norm.id === id) return true;
      const full = String(norm.full || '');
      return full === safeSrc || full === item.src;
    });
  };

  const addBankVideo = async (item) => {
    if (findBankVideoIndex(item) >= 0) return;
    const safeSrc = encodeWelcomeVideoSrc(item.src);
    const updated = [
      ...backgroundImages.map((img, i) => normalizeHomepageImage(img, i)),
      {
        id: `video:${item.id}`,
        full: safeSrc,
        thumbnail: item.poster || safeSrc,
        liked: false,
        hidden: false,
        useOnHome: true,
        useOnLock: false,
        mediaType: 'video',
        loop: false,
        allowSound: false,
        muted: true,
        videoId: item.id,
        name: item.name || item.id,
      },
    ];
    try {
      await persistCollection(updated);
    } catch (error) {
      log.error('Erreur ajout vidéo banque', error);
    }
  };

  const removeBankVideo = async (item) => {
    const index = findBankVideoIndex(item);
    if (index < 0) return;
    try {
      await removeBackgroundImage(index);
    } catch (error) {
      log.error('Erreur retrait vidéo banque', error);
    }
  };

  const addBankThemeToCollection = async (themeName) => {
    if (!themeName || themeName === 'all') return;
    const toAdd = bankImages.filter((item) => (item.theme || 'Scènes') === themeName);
    if (!toAdd.length) return;
    setBankAddingTheme(true);
    try {
      const existingIds = new Set(
        backgroundImages.map((img, i) => normalizeHomepageImage(img, i).id)
      );
      const additions = [];
      for (const item of toAdd) {
        const id = `bank:${item.id}`;
        if (existingIds.has(id)) continue;
        existingIds.add(id);
        additions.push({
          id,
          full: item.src,
          thumbnail: item.thumb || item.src,
          liked: false,
          hidden: false,
          useOnHome: false,
          useOnLock: false,
          bankId: item.id,
          theme: item.theme || null,
        });
      }
      if (!additions.length) return;
      const updated = [
        ...backgroundImages.map((img, i) => normalizeHomepageImage(img, i)),
        ...additions,
      ];
      await persistCollection(updated);
    } catch (error) {
      log.error('Erreur ajout thème banque', error);
    } finally {
      setBankAddingTheme(false);
    }
  };

  const setImagePlacement = (index, placement) => {
    const useOnHome = placement === 'home' || placement === 'both';
    const useOnLock = placement === 'lock' || placement === 'both';
    patchImage(index, { useOnHome, useOnLock, hidden: false });
  };

  const placementOf = (norm) => {
    if (norm.useOnHome && norm.useOnLock) return 'both';
    if (norm.useOnLock) return 'lock';
    if (norm.useOnHome) return 'home';
    return 'none';
  };

  const toggleUseAsAppStatic = (index) => {
    const norm = normalizeHomepageImage(backgroundImages[index], index);
    if (isHomepageVideo(norm)) return;
    const next = !norm.useAsAppStatic;
    patchImage(index, { useAsAppStatic: next });
    const src = getHomepageImageFullSrc(norm);
    const thumb = getHomepageImageThumbSrc(norm);
    if (next && src) {
      upsertAppStaticBackground({
        id: norm.id,
        name: norm.name || `Fond ${index + 1}`,
        src,
        thumb,
      });
    } else {
      removeAppStaticBackground(norm.id);
    }
  };

  const moveImage = async (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= backgroundImages.length) return;
    const updated = backgroundImages.map((img, i) => normalizeHomepageImage(img, i));
    const [item] = updated.splice(index, 1);
    updated.splice(next, 0, item);
    try {
      await persistCollection(updated);
    } catch (error) {
      log.error('Erreur réordonnancement fond', error);
    }
  };

  const handleLockOnlyUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setIsUploading(true);
    setLockBatchProgress(null);
    const failedFiles = [];
    try {
      const total = files.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLockBatchProgress({ current: i + 1, total, fileName: file.name });
        try {
          if (!file.type.startsWith('image/')) {
            failedFiles.push(`${file.name} (format non supporté)`);
            continue;
          }
          const dataUrl = await processLockWallpaperFile(file);
          await addLockOnlyBackground(dataUrl);
        } catch (fileErr) {
          log.error(`Échec verrou « ${file.name} »`, fileErr);
          failedFiles.push(`${file.name} (${fileErr.message || 'erreur'})`);
        }
      }
      if (failedFiles.length > 0) {
        alert(
          `Certaines images n’ont pas pu être ajoutées :\n\n${failedFiles.join('\n')}\n\n` +
            `Les autres ont bien été enregistrées.`
        );
      }
    } catch (e) {
      log.error('Upload fond verrou', e);
      alert('Impossible d’ajouter les images au verrouillage.');
    } finally {
      setIsUploading(false);
      setLockBatchProgress(null);
    }
  };

  const handleLockRotationChange = async (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    try {
      await updateSettings({ lockWallpaperRotationMs: value });
    } catch (e) {
      log.error('Rotation verrou', e);
    }
  };

  const handleLockAdvanceOnClickChange = async (event) => {
    try {
      await updateSettings({ lockWallpaperAdvanceOnClick: event.target.checked });
    } catch (e) {
      log.error('Clic fond verrou', e);
    }
  };

  const handleLockOrderChange = async (event) => {
    try {
      await updateSettings({ lockWallpaperOrder: event.target.value });
    } catch (e) {
      log.error('Ordre verrou', e);
    }
  };

  const handleHomeRotationChange = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    updateHomePlayback({ rotationMs: value });
  };

  const handleHomeOrderChange = (event) => {
    updateHomePlayback({ order: event.target.value });
  };

  const handleHomeMediaKindsChange = (event) => {
    updateHomePlayback({ mediaKinds: event.target.value });
  };

  const handleHomeAdvanceOnClickChange = (event) => {
    updateHomePlayback({ advanceOnClick: event.target.checked });
  };

  const toggleLockOnlyLike = async (index) => {
    const item = lockOnlyItems[index];
    if (!item) return;
    await patchLockOnlyBackgroundAt(index, { liked: !item.liked });
  };

  const toggleLockOnlyHidden = async (index) => {
    const item = lockOnlyItems[index];
    if (!item) return;
    await patchLockOnlyBackgroundAt(index, { hidden: !item.hidden });
  };

  const clearAllLockOnly = async () => {
    if (!lockOnlyUrls.length) return;
    if (!window.confirm('Retirer toutes les images réservées au verrouillage ?')) return;
    await setLockBackgroundUrls([]);
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
        metadata: processed.metadata,
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        liked: false,
        hidden: false,
        useOnHome: true,
        useOnLock: false
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
          <h2 className="text-2xl font-bold text-red-100">Fonds d&apos;écran — accueil &amp; verrouillage</h2>
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
          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-100">Banque de fonds d&apos;écran</h3>
            <p className={`mb-4 text-sm ${S.muted}`}>
              {bankImages.length} images disponibles pour tout le monde, classées par thèmes.
              Cliquez une miniature pour l&apos;agrandir avant de l&apos;ajouter. Les images ajoutées
              ne sont ni sur l&apos;accueil ni sur le verrouillage tant que vous ne les activez pas.
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={bankQuery}
                onChange={(event) => setBankQuery(event.target.value)}
                placeholder="Filtrer la banque…"
                className={`w-full max-w-md ${S.input}`}
                aria-label="Filtrer la banque de fonds"
              />
              {bankTheme !== 'all' ? (
                <button
                  type="button"
                  disabled={bankAddingTheme}
                  onClick={() => addBankThemeToCollection(bankTheme)}
                  className={`${S.btnPrimary} disabled:opacity-50`}
                >
                  {bankAddingTheme
                    ? 'Ajout…'
                    : `Ajouter tout le thème « ${bankTheme} »`}
                </button>
              ) : null}
            </div>
            <div
              className="mb-4 flex flex-wrap gap-1.5"
              role="tablist"
              aria-label="Thèmes de la banque"
            >
              <button
                type="button"
                role="tab"
                aria-selected={bankTheme === 'all'}
                onClick={() => setBankTheme('all')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  bankTheme === 'all' ? S.btnSm : S.btnSecondary
                }`}
              >
                Tous ({bankImages.length})
              </button>
              {bankThemes.map((theme) => {
                const count = bankImages.filter((img) => (img.theme || 'Scènes') === theme).length;
                return (
                  <button
                    key={theme}
                    type="button"
                    role="tab"
                    aria-selected={bankTheme === theme}
                    onClick={() => setBankTheme(theme)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      bankTheme === theme ? S.btnSm : S.btnSecondary
                    }`}
                  >
                    {theme} ({count})
                  </button>
                );
              })}
            </div>
            <div className="grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto pr-1 md:grid-cols-5">
              {filteredBankImages.map((item) => {
                const id = `bank:${item.id}`;
                const added = backgroundImages.some(
                  (img, i) => normalizeHomepageImage(img, i).id === id
                );
                return (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-red-900/40">
                    <button
                      type="button"
                      onClick={() => setBankPreviewId(item.id)}
                      className="group relative block w-full cursor-zoom-in text-left"
                      aria-label={`Agrandir ${item.name || item.id}`}
                    >
                      <img
                        src={item.thumb || item.src}
                        alt={item.name || item.id}
                        loading="lazy"
                        decoding="async"
                        className="h-24 w-full object-cover transition group-hover:brightness-110"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                        <ZoomIn className="h-6 w-6 text-white/90 drop-shadow" />
                      </span>
                      {item.theme ? (
                        <span className="absolute left-1 top-1 rounded border border-black/40 bg-black/70 px-1 py-0.5 text-[9px] text-red-100/90">
                          {item.theme}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => addBankImage(item)}
                      className={`w-full px-1 py-1.5 text-[11px] font-medium ${
                        added ? 'cursor-default text-zinc-500' : S.btnPrimary
                      }`}
                    >
                      {added ? 'Dans ma collection' : 'Ajouter'}
                    </button>
                  </div>
                );
              })}
            </div>
            {filteredBankImages.length === 0 ? (
              <p className={`mt-3 text-sm ${S.muted}`}>Aucune image pour ce filtre.</p>
            ) : null}
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-100">Banque de vidéos d&apos;accueil</h3>
            <p className={`mb-4 text-sm ${S.muted}`}>
              Déposez des fichiers dans <code className="text-red-200/90">public/welcome-videos</code> puis
              lancez <code className="text-red-200/90">node scripts/build-welcome-videos.mjs</code>.
              Ajoutez ensuite chaque vidéo à votre rotation ; boucle et son se règlent par média
              dans la bibliothèque ci-dessous.
            </p>
            {bankVideos.length === 0 ? (
              <p className={`text-sm ${S.muted}`}>
                Aucune vidéo pour le moment — le dossier est prêt à recevoir vos fichiers.
              </p>
            ) : (
              <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-4">
                {bankVideos.map((item) => {
                  const added = findBankVideoIndex(item) >= 0;
                  return (
                    <div key={item.id} className="overflow-hidden rounded-lg border border-red-900/40">
                      <div className="flex h-20 items-center justify-center bg-black/60 px-1 text-center text-xs text-red-100/80">
                        {item.name || item.id}
                      </div>
                      {added ? (
                        <button
                          type="button"
                          onClick={() => removeBankVideo(item)}
                          className="w-full bg-red-950/80 px-1 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-900/90"
                        >
                          Retirer de ma collection
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addBankVideo(item)}
                          className={`w-full px-1 py-1.5 text-[11px] font-medium ${S.btnPrimary}`}
                        >
                          Ajouter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Images / vidéos de fond — rotation */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-100">Bibliothèque d&apos;images &amp; vidéos</h3>
            <p className={`mb-4 text-sm ${S.muted}`}>
              Photos et vidéos : même outils. Cœur = favori · Œil = masquer · ✕ = retirer.
              Pour chaque <strong className="text-red-200/90">vidéo</strong>, « Son » autorise le volume
              (indépendamment, vidéo par vidéo) et affiche le bouton haut-parleur sur l&apos;accueil.
              Emplacement Accueil / Verrou comme pour les images.
              {effectiveLockCount > 0 ? (
                <span className="mt-1 block text-emerald-300/90">
                  {effectiveLockCount} image{effectiveLockCount > 1 ? 's' : ''} active{effectiveLockCount > 1 ? 's' : ''} sur le verrouillage.
                </span>
              ) : null}
            </p>
            <div className={`mb-4 rounded-lg border border-sky-900/40 bg-sky-950/15 p-3 ${S.inset}`}>
              <h4 className="mb-2 text-sm font-medium text-sky-100">Lecture — page d&apos;accueil</h4>
              <label htmlFor="home-rotation-interval" className="mb-1 block text-sm font-medium text-red-100">
                Vitesse de défilement
              </label>
              <select
                id="home-rotation-interval"
                value={homePlayback.rotationMs}
                onChange={handleHomeRotationChange}
                className={`mb-3 w-full max-w-md ${S.input}`}
              >
                {WALLPAPER_ROTATION_OPTIONS.map((opt) => (
                  <option key={`home-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label htmlFor="home-rotation-order" className="mb-1 block text-sm font-medium text-red-100">
                Ordre
              </label>
              <select
                id="home-rotation-order"
                value={homePlayback.order}
                onChange={handleHomeOrderChange}
                className={`mb-3 w-full max-w-md ${S.input}`}
              >
                {WALLPAPER_ORDER_OPTIONS.map((opt) => (
                  <option key={`home-order-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label htmlFor="home-media-kinds" className="mb-1 block text-sm font-medium text-red-100">
                Afficher sur l&apos;accueil
              </label>
              <select
                id="home-media-kinds"
                value={homePlayback.mediaKinds || 'all'}
                onChange={handleHomeMediaKindsChange}
                className={`mb-1 w-full max-w-md ${S.input}`}
              >
                {HOME_MEDIA_KINDS_OPTIONS.map((opt) => (
                  <option key={`home-kinds-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className={`mb-3 max-w-md text-xs ${S.muted}`}>
                Filtre uniquement la rotation. Ta sélection (photos et vidéos) reste intacte —
                masquer des médias (œil) ne les retire pas de la bibliothèque.
              </p>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={homePlayback.advanceOnClick}
                  onChange={handleHomeAdvanceOnClickChange}
                  className="mt-1 h-4 w-4 rounded border-sky-600 bg-slate-900 text-sky-500 focus:ring-sky-400"
                />
                <span>
                  <span className="block text-sm font-medium text-sky-100">Changer le fond au clic</span>
                  <span className={`mt-1 block text-xs ${S.muted}`}>
                    Un clic sur la page d&apos;accueil passe au média suivant (en plus de la
                    rotation automatique).
                  </span>
                </span>
              </label>
            </div>
            
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
                  const norm = normalizeHomepageImage(image, index);
                  const imageSrc = getHomepageImageThumbSrc(norm);
                  const isVideo = isHomepageVideo(norm);

                  return (
                    <div
                      key={norm.id || index}
                      className={`group relative overflow-hidden rounded-lg border ${
                        norm.hidden
                          ? 'border-zinc-600/60 opacity-55'
                          : norm.liked
                            ? 'border-rose-400/70 ring-1 ring-rose-500/30'
                            : 'border-red-900/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        className="block w-full cursor-zoom-in text-left"
                        aria-label={`Agrandir Fond ${index + 1}`}
                      >
                        {isVideo ? (
                          <div
                            className={`flex h-32 w-full items-center justify-center bg-zinc-950 text-xs text-red-100/80 ${
                              norm.hidden ? 'grayscale' : ''
                            }`}
                          >
                            Vidéo · {norm.name || norm.id || `#${index + 1}`}
                          </div>
                        ) : (
                          <img
                            src={imageSrc}
                            alt={`Fond ${index + 1}`}
                            className={`h-32 w-full object-cover transition group-hover:brightness-110 ${
                              norm.hidden ? 'grayscale' : ''
                            }`}
                          />
                        )}
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                          <ZoomIn className="h-8 w-8 text-white/90 drop-shadow" />
                        </span>
                      </button>
                      <div className="absolute left-2 top-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleLike(index)}
                          title={norm.liked ? 'Retirer des favoris' : 'Favori (plus souvent en aléatoire)'}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition ${
                            norm.liked
                              ? 'border-rose-400/70 bg-rose-950/90 text-rose-300'
                              : 'border-red-900/50 bg-black/70 text-red-100/80 hover:text-rose-300'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${norm.liked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleHidden(index)}
                          title={norm.hidden ? 'Réafficher dans la rotation' : 'Masquer (hors rotation accueil et verrou)'}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition ${
                            norm.hidden
                              ? 'border-amber-500/60 bg-amber-950/90 text-amber-200'
                              : 'border-red-900/50 bg-black/70 text-red-100/80 hover:text-amber-200'
                          }`}
                        >
                          {norm.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBackgroundImage(index)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-red-800/60 bg-red-950/90 text-red-50 opacity-100 transition-opacity"
                        title="Retirer de la collection"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {isVideo ? (
                        <div className="absolute right-2 top-11 flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => patchImage(index, (n) => ({ loop: !n.loop }))}
                            className={`rounded border px-1.5 py-0.5 text-[10px] backdrop-blur-sm ${
                              norm.loop
                                ? 'border-emerald-400/60 bg-emerald-950/90 text-emerald-200'
                                : 'border-red-900/50 bg-black/70 text-red-100/70'
                            }`}
                            title="Lire en boucle"
                          >
                            Boucle
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchImage(index, (n) => ({
                                allowSound: !n.allowSound,
                                muted: n.allowSound,
                              }))
                            }
                            className={`flex items-center justify-center gap-1 rounded border px-1.5 py-0.5 text-[10px] backdrop-blur-sm ${
                              norm.allowSound
                                ? 'border-amber-400/60 bg-amber-950/90 text-amber-200'
                                : 'border-red-900/50 bg-black/70 text-red-100/70'
                            }`}
                            title={
                              norm.allowSound
                                ? 'Son autorisé — bouton volume sur l’accueil'
                                : 'Activer le son pour cette vidéo'
                            }
                          >
                            {norm.allowSound ? (
                              <Volume2 className="h-3 w-3" />
                            ) : (
                              <VolumeX className="h-3 w-3" />
                            )}
                            Son
                          </button>
                        </div>
                      ) : null}

                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1">
                        <label className="sr-only" htmlFor={`placement-${index}`}>
                          Emplacement Fond {index + 1}
                        </label>
                        <select
                          id={`placement-${index}`}
                          value={placementOf(norm)}
                          onChange={(event) => setImagePlacement(index, event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          title="Où afficher cette bannière"
                          className="max-w-full rounded border border-red-900/50 bg-black/80 px-1.5 py-0.5 text-[10px] text-red-100 backdrop-blur-sm"
                        >
                          <option value="none">Inactif</option>
                          <option value="home">Accueil</option>
                          <option value="lock">Verrouillage</option>
                          <option value="both">Les deux</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleUseOnHome(index)}
                          title={norm.useOnHome ? 'Retirer de l\'accueil' : 'Afficher sur l\'accueil'}
                          className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm transition ${
                            norm.useOnHome
                              ? 'border-sky-400/60 bg-sky-950/90 text-sky-200'
                              : 'border-red-900/50 bg-black/70 text-red-100/60 hover:text-sky-200'
                          }`}
                        >
                          <Home className="h-3 w-3" />
                          Accueil
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUseOnLock(index)}
                          title={norm.useOnLock ? 'Retirer du verrouillage' : 'Afficher au verrouillage'}
                          className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm transition ${
                            norm.useOnLock
                              ? 'border-violet-400/60 bg-violet-950/90 text-violet-200'
                              : 'border-red-900/50 bg-black/70 text-red-100/60 hover:text-violet-200'
                          }`}
                        >
                          <Lock className="h-3 w-3" />
                          Verrou
                        </button>
                        {!isVideo ? (
                          <button
                            type="button"
                            onClick={() => toggleUseAsAppStatic(index)}
                            title={
                              norm.useAsAppStatic
                                ? 'Retirer des fonds statiques de l’app'
                                : 'Utiliser comme fond statique dans Apparence'
                            }
                            className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm transition ${
                              norm.useAsAppStatic
                                ? 'border-emerald-400/60 bg-emerald-950/90 text-emerald-200'
                                : 'border-red-900/50 bg-black/70 text-red-100/60 hover:text-emerald-200'
                            }`}
                          >
                            Fond app
                          </button>
                        ) : null}
                      </div>

                      <div className="absolute bottom-10 left-2 flex items-center gap-1">
                        <span className="rounded border border-red-900/50 bg-black/70 px-2 py-0.5 text-[10px] text-red-100">
                          #{index + 1}
                          {norm.liked ? <span className="ml-1 text-rose-300">♥</span> : null}
                          {norm.hidden ? <span className="ml-1 text-amber-300/90">masqué</span> : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          title="Plus tôt dans l’ordre"
                          className="flex h-6 w-6 items-center justify-center rounded border border-red-900/50 bg-black/70 text-red-100 disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === backgroundImages.length - 1}
                          title="Plus tard dans l’ordre"
                          className="flex h-6 w-6 items-center justify-center rounded border border-red-900/50 bg-black/70 text-red-100 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-100">Images réservées au verrouillage</h3>
            <p className={`mb-4 text-sm ${S.muted}`}>
              Images affichées uniquement sur l&apos;écran de verrouillage et l&apos;écran d&apos;intro,
              sans passer par la bibliothèque accueil. Les fichiers lourds sont optimisés automatiquement
              (comme pour l&apos;accueil, sans modifier la bibliothèque).
            </p>
            <div className={`mb-4 rounded-lg border border-violet-900/40 bg-violet-950/20 p-3 ${S.inset}`}>
              <label htmlFor="lock-rotation-interval" className="mb-1 block text-sm font-medium text-violet-100">
                Rotation des fonds verrouillage
              </label>
              <p className={`mb-2 text-xs ${S.muted}`}>
                S&apos;applique à toutes les images du verrou (bibliothèque + verrou seul). Transition identique
                à l&apos;accueil (fondu 0,8 s).
              </p>
              <select
                id="lock-rotation-interval"
                value={lockRotationMs}
                onChange={handleLockRotationChange}
                className={`mb-3 w-full max-w-md ${S.input}`}
              >
                {LOCK_WALLPAPER_ROTATION_OPTIONS.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label htmlFor="lock-rotation-order" className="mb-1 block text-sm font-medium text-violet-100">
                Ordre
              </label>
              <select
                id="lock-rotation-order"
                value={lockOrder}
                onChange={handleLockOrderChange}
                className={`w-full max-w-md ${S.input}`}
              >
                {WALLPAPER_ORDER_OPTIONS.map((opt) => (
                  <option key={`lock-order-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`mb-4 rounded-lg border border-violet-900/40 bg-violet-950/20 p-3 ${S.inset}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={lockAdvanceOnClick}
                  onChange={handleLockAdvanceOnClickChange}
                  className="mt-1 h-4 w-4 rounded border-violet-600 bg-slate-900 text-violet-500 focus:ring-violet-400"
                />
                <span>
                  <span className="block text-sm font-medium text-violet-100">
                    Changer le fond au clic
                  </span>
                  <span className={`mt-1 block text-xs ${S.muted}`}>
                    Sur l&apos;écran d&apos;intro et le PIN : cliquez le fond autour de la carte pour
                    passer à l&apos;image suivante. La rotation automatique continue en parallèle.
                    {effectiveLockCount < 2 ? (
                      <span className="mt-1 block text-amber-300/90">
                        Il faut au moins 2 images actives sur le verrou (badge Verrou ou « verrou seul »)
                        pour que le clic et la rotation changent le fond.
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            </div>
            <input
              ref={lockOnlyInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              multiple
              onChange={handleLockOnlyUpload}
              className="hidden"
            />
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => lockOnlyInputRef.current?.click()}
                disabled={isUploading}
                className={`${S.btnSecondary} disabled:opacity-50`}
              >
                {isUploading && lockBatchProgress
                  ? `Optimisation ${lockBatchProgress.current}/${lockBatchProgress.total}…`
                  : isUploading
                    ? 'Optimisation…'
                    : 'Ajouter au verrouillage (plusieurs fichiers, JPG/PNG/WebP)'}
              </button>
              {lockBatchProgress && (
                <p className={`text-xs ${S.muted}`}>
                  Fichier en cours :{' '}
                  <span className="text-violet-200/90 truncate block max-w-full">{lockBatchProgress.fileName}</span>
                </p>
              )}
              {lockOnlyUrls.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllLockOnly}
                  disabled={isUploading}
                  className="rounded-lg border border-red-800/60 bg-black px-4 py-2 text-sm text-red-100/90 hover:bg-red-950/30 disabled:opacity-50"
                >
                  Tout retirer ({lockOnlyUrls.length})
                </button>
              )}
            </div>
            {lockOnlyItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {lockOnlyItems.map((item, i) => (
                  <div
                    key={`lock-only-${i}`}
                    className={`group relative overflow-hidden rounded-lg border ${
                      item.hidden
                        ? 'border-zinc-600/60 opacity-55'
                        : item.liked
                          ? 'border-rose-400/70 ring-1 ring-rose-500/30'
                          : 'border-violet-900/50'
                    }`}
                  >
                    <img
                      src={item.dataUrl}
                      alt={`Verrou ${i + 1}`}
                      className={`h-32 w-full object-cover ${item.hidden ? 'grayscale' : ''}`}
                    />
                    <div className="absolute left-2 top-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleLockOnlyLike(i)}
                        title={item.liked ? 'Retirer des favoris' : 'Favori (plus souvent en aléatoire)'}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition ${
                          item.liked
                            ? 'border-rose-400/70 bg-rose-950/90 text-rose-300'
                            : 'border-violet-900/50 bg-black/70 text-violet-100/80 hover:text-rose-300'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${item.liked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLockOnlyHidden(i)}
                        title={item.hidden ? 'Réafficher au verrouillage' : 'Masquer du verrouillage'}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition ${
                          item.hidden
                            ? 'border-amber-500/60 bg-amber-950/90 text-amber-200'
                            : 'border-violet-900/50 bg-black/70 text-violet-100/80 hover:text-amber-200'
                        }`}
                      >
                        {item.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="absolute left-2 bottom-2 rounded border border-violet-500/50 bg-black/70 px-2 py-0.5 text-[10px] text-violet-200">
                      Verrou seul
                      {item.liked ? <span className="ml-1 text-rose-300">♥</span> : null}
                      {item.hidden ? <span className="ml-1 text-amber-300/90">masqué</span> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLockOnlyBackgroundAt(i)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-red-800/60 bg-red-950/90 text-red-50 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${S.muted}`}>Aucune image verrou seule — utilisez les badges « Verrou » sur la bibliothèque ci-dessus.</p>
            )}
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

      {/* Aperçu agrandi — collection */}
      {previewIndex != null && backgroundImages[previewIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu image de fond"
        >
          <div
            className="relative max-h-[90vh] max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getHomepageImageFullSrc(backgroundImages[previewIndex])}
              alt={`Aperçu Fond ${previewIndex + 1}`}
              className="max-h-[85vh] w-full rounded-xl border border-red-900/50 object-contain shadow-2xl"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-red-100/90">
                Fond {previewIndex + 1}
                {normalizeHomepageImage(backgroundImages[previewIndex], previewIndex).liked
                  ? ' · Favori (rotation renforcée)'
                  : ''}
                {normalizeHomepageImage(backgroundImages[previewIndex], previewIndex).hidden
                  ? ' · Masquée'
                  : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleLike(previewIndex)}
                  className={`${S.btnSecondary} inline-flex items-center gap-1.5 text-xs`}
                >
                  <Heart className="h-3.5 w-3.5" />
                  {normalizeHomepageImage(backgroundImages[previewIndex], previewIndex).liked
                    ? 'Retirer favori'
                    : 'Mettre en favori'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleHidden(previewIndex)}
                  className={`${S.btnSecondary} inline-flex items-center gap-1.5 text-xs`}
                >
                  {normalizeHomepageImage(backgroundImages[previewIndex], previewIndex).hidden ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  {normalizeHomepageImage(backgroundImages[previewIndex], previewIndex).hidden
                    ? 'Réafficher'
                    : 'Masquer'}
                </button>
                <button type="button" onClick={() => setPreviewIndex(null)} className={S.btnPrimary}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aperçu agrandi — banque (avant sélection) */}
      {bankPreviewItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setBankPreviewId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu bannière banque"
        >
          <div
            className="relative max-h-[90vh] max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={bankPreviewItem.src}
              alt={bankPreviewItem.name || bankPreviewItem.id}
              className="max-h-[85vh] w-full rounded-xl border border-red-900/50 object-contain shadow-2xl"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-red-100/90">{bankPreviewItem.name || bankPreviewItem.id}</p>
                {bankPreviewItem.theme ? (
                  <p className={`text-xs ${S.muted}`}>Thème · {bankPreviewItem.theme}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={backgroundImages.some(
                    (img, i) =>
                      normalizeHomepageImage(img, i).id === `bank:${bankPreviewItem.id}`
                  )}
                  onClick={async () => {
                    await addBankImage(bankPreviewItem);
                    setBankPreviewId(null);
                  }}
                  className={`${S.btnPrimary} disabled:opacity-50`}
                >
                  {backgroundImages.some(
                    (img, i) =>
                      normalizeHomepageImage(img, i).id === `bank:${bankPreviewItem.id}`
                  )
                    ? 'Déjà dans la collection'
                    : 'Ajouter à ma collection'}
                </button>
                <button
                  type="button"
                  onClick={() => setBankPreviewId(null)}
                  className={S.btnSecondary}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de diagnostic */}
      {showDiagnostic && (
        <StorageDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
    </div>
  );
};

export default HomePageImageSettings;
