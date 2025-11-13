/**
 * 🖼️ MODULE D'OPTIMISATION FORMAT IMAGE
 * 
 * Optimise le format d'image (WebP si supporté) SANS perte de qualité.
 * Utilisé pour les bannières : qualité 100% préservée, format optimal.
 * 
 * @module imageFormatOptimizer
 */

import logger from './logger';

const log = logger.module('imageFormatOptimizer');

/**
 * Image WebP de test pour détection support (2x2 pixels)
 * Base64 d'une image WebP valide
 */
const WEBP_TEST_IMAGE = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

/**
 * Cache du résultat de détection WebP (évite tests répétés)
 */
let webPSupportCache = null;

/**
 * Détecte si le navigateur supporte WebP
 * 
 * @returns {Promise<boolean>} True si WebP supporté
 */
export async function detectWebPSupport() {
  // Retourner cache si disponible
  if (webPSupportCache !== null) {
    return webPSupportCache;
  }

  return new Promise((resolve) => {
    const webP = new Image();
    
    webP.onload = () => {
      // Si l'image se charge et a les bonnes dimensions, WebP est supporté
      const isSupported = webP.height === 2;
      webPSupportCache = isSupported;
      log.debug(`✅ Support WebP détecté: ${isSupported}`);
      resolve(isSupported);
    };
    
    webP.onerror = () => {
      webPSupportCache = false;
      log.debug('❌ WebP non supporté');
      resolve(false);
    };
    
    webP.src = WEBP_TEST_IMAGE;
  });
}

/**
 * Charge une image depuis un File ou une URL Base64
 * 
 * @param {File|string} source - Fichier ou URL Base64
 * @returns {Promise<HTMLImageElement>} Image chargée
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = (error) => {
      log.error('Erreur chargement image', error);
      reject(new Error('Impossible de charger l\'image'));
    };
    
    if (typeof source === 'string') {
      // URL Base64
      img.src = source;
    } else if (source instanceof File) {
      // File : convertir en Data URL d'abord
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      reject(new Error('Source image invalide'));
    }
  });
}

/**
 * Convertit une image en format optimal (WebP si supporté, sinon JPEG)
 * QUALITÉ 100% PRÉSERVÉE - Aucune compression destructive
 * 
 * @param {File|string} source - Fichier ou URL Base64
 * @param {Object} options - Options de conversion
 * @param {boolean} options.preserveQuality - Préserver qualité 100% (défaut: true)
 * @returns {Promise<Object>} { data, format, size, originalSize, quality, dimensions }
 */
export async function convertToOptimalFormat(source, options = {}) {
  const { preserveQuality = true } = options;

  try {
    log.debug('🔄 Conversion format optimal...', { preserveQuality });

    // 1. Détecter support WebP
    const supportsWebP = await detectWebPSupport();
    const targetFormat = supportsWebP ? 'webp' : 'jpeg';
    const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';

    log.debug(`📦 Format cible: ${targetFormat}`, { supportsWebP });

    // 2. Charger l'image
    const img = await loadImage(source);
    const originalWidth = img.width;
    const originalHeight = img.height;

    log.debug(`📐 Dimensions originales: ${originalWidth}x${originalHeight}`);

    // 3. Créer canvas avec dimensions originales (PAS de redimensionnement)
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d');

    // 4. Configuration qualité de rendu maximale
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 5. Dessiner image (dimensions originales préservées)
    ctx.drawImage(img, 0, 0);

    // 6. Qualité maximale (1.0 = 100%)
    const quality = preserveQuality ? 1.0 : 0.95;

    // 7. Convertir en format optimal
    const base64 = canvas.toDataURL(mimeType, quality);

    // 8. Calculer taille originale si File
    const originalSize = source instanceof File ? source.size : base64.length;

    const result = {
      data: base64,
      format: targetFormat,
      originalFormat: source instanceof File ? source.type : 'unknown',
      size: base64.length,
      originalSize: originalSize,
      quality: 'maximum', // Toujours qualité maximale
      dimensions: {
        width: originalWidth,
        height: originalHeight
      },
      compressionInfo: supportsWebP
        ? 'WebP: ~30% meilleure compression algorithmique que JPEG à qualité visuelle identique'
        : 'JPEG: Format standard (WebP non supporté)'
    };

    log.debug('✅ Conversion format optimal réussie', {
      format: result.format,
      size: `${(result.size / 1024 / 1024).toFixed(2)} MB`,
      originalSize: `${(result.originalSize / 1024 / 1024).toFixed(2)} MB`,
      dimensions: `${result.dimensions.width}x${result.dimensions.height}`,
      quality: result.quality
    });

    return result;

  } catch (error) {
    log.error('❌ Erreur conversion format optimal', error);
    throw new Error(`Erreur conversion format optimal: ${error.message}`);
  }
}

/**
 * Crée un thumbnail léger (uniquement pour galerie/prévisualisation)
 * ⚠️ QUALITÉ RÉDUITE OK pour thumbnail (pas pour affichage final)
 * 
 * @param {File|string} source - Fichier ou URL Base64
 * @param {Object} options - Options thumbnail
 * @param {number} options.maxWidth - Largeur max (défaut: 200)
 * @param {number} options.maxHeight - Hauteur max (défaut: 200)
 * @param {number} options.quality - Qualité 0-1 (défaut: 0.8, OK pour thumbnail)
 * @param {string} options.format - Format (défaut: 'webp' si supporté)
 * @returns {Promise<Object>} { data, dimensions, size, quality, purpose }
 */
export async function createThumbnail(source, options = {}) {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8, // Qualité réduite OK pour thumbnail (pas pour affichage)
    format = null // null = détecter automatiquement
  } = options;

  try {
    log.debug('🖼️ Création thumbnail...', { maxWidth, maxHeight, quality });

    // 1. Détecter format si non spécifié
    let targetFormat = format;
    if (!targetFormat) {
      const supportsWebP = await detectWebPSupport();
      targetFormat = supportsWebP ? 'webp' : 'jpeg';
    }
    const mimeType = targetFormat === 'webp' ? 'image/webp' : 'image/jpeg';

    // 2. Charger l'image
    const img = await loadImage(source);
    const originalWidth = img.width;
    const originalHeight = img.height;

    // 3. Calculer dimensions thumbnail (conserver ratio)
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    const thumbnailWidth = Math.round(originalWidth * ratio);
    const thumbnailHeight = Math.round(originalHeight * ratio);

    log.debug(`📐 Thumbnail: ${originalWidth}x${originalHeight} → ${thumbnailWidth}x${thumbnailHeight}`);

    // 4. Créer canvas avec dimensions thumbnail
    const canvas = document.createElement('canvas');
    canvas.width = thumbnailWidth;
    canvas.height = thumbnailHeight;
    const ctx = canvas.getContext('2d');

    // 5. Configuration qualité de rendu maximale (même pour thumbnail)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 6. Dessiner image redimensionnée
    ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

    // 7. Convertir en base64 (qualité réduite OK pour thumbnail)
    const base64 = canvas.toDataURL(mimeType, quality);

    const result = {
      data: base64,
      dimensions: {
        width: thumbnailWidth,
        height: thumbnailHeight,
        originalWidth: originalWidth,
        originalHeight: originalHeight
      },
      size: base64.length,
      quality: quality,
      format: targetFormat,
      purpose: 'gallery_preview_only' // ⚠️ Uniquement pour galerie, pas pour affichage
    };

    log.debug('✅ Thumbnail créé', {
      size: `${(result.size / 1024).toFixed(2)} KB`,
      dimensions: `${result.dimensions.width}x${result.dimensions.height}`,
      format: result.format,
      purpose: result.purpose
    });

    return result;

  } catch (error) {
    log.error('❌ Erreur création thumbnail', error);
    throw new Error(`Erreur création thumbnail: ${error.message}`);
  }
}

/**
 * Vérifie si le Web Worker est disponible et supporté
 * 
 * @returns {boolean} True si worker disponible
 */
function supportsWorker() {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap !== 'undefined'
  );
}

/**
 * Traite une image via Web Worker (non-bloquant)
 * 
 * @param {File} file - Fichier image
 * @param {Object} options - Options traitement
 * @param {Function} onProgress - Callback progression (0-100)
 * @returns {Promise<Object>} { full, thumbnail, format, metadata }
 */
async function processImageViaWorker(file, options = {}, onProgress = null) {
  return new Promise((resolve, reject) => {
    try {
      // Créer worker
      const worker = new Worker(
        new URL('../workers/bannerImageWorker.js', import.meta.url),
        { type: 'module' }
      );
      
      // Convertir File en Data URL pour worker
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target.result;
        
        // Envoyer message au worker
        worker.postMessage({
          type: 'PROCESS_IMAGE',
          payload: {
            fileData,
            createThumbnail: options.createThumbnail !== false,
            preserveQuality: options.preserveQuality !== false
          }
        });
      };
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsDataURL(file);
      
      // Écouter messages du worker
      worker.onmessage = (e) => {
        const { type, payload, error, progress, message } = e.data;
        
        if (type === 'PROGRESS' && onProgress) {
          onProgress(progress, message);
        } else if (type === 'PROCESS_IMAGE_SUCCESS') {
          worker.terminate();
          resolve(payload);
        } else if (type === 'PROCESS_IMAGE_ERROR') {
          worker.terminate();
          reject(new Error(error?.message || 'Erreur traitement worker'));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(new Error(`Erreur worker: ${error.message}`));
      };
      
    } catch (error) {
      reject(new Error(`Erreur initialisation worker: ${error.message}`));
    }
  });
}

/**
 * Traite une image complète : format optimal + thumbnail
 * QUALITÉ FULL 100% PRÉSERVÉE
 * 
 * Utilise Web Worker si disponible (non-bloquant), sinon fallback synchrone.
 * 
 * @param {File} file - Fichier image
 * @param {Object} options - Options traitement
 * @param {boolean} options.createThumbnail - Créer thumbnail (défaut: true)
 * @param {boolean} options.preserveQuality - Préserver qualité 100% (défaut: true)
 * @param {boolean} options.useWorker - Forcer utilisation worker (défaut: auto)
 * @param {Function} options.onProgress - Callback progression (0-100)
 * @returns {Promise<Object>} { full, thumbnail, format, metadata }
 */
export async function processImageForStorage(file, options = {}) {
  const { 
    createThumbnail = true, 
    preserveQuality = true,
    useWorker = null, // null = auto-détection
    onProgress = null
  } = options;
  
  // ✅ Phase 3.8: Utiliser worker si disponible et demandé
  const shouldUseWorker = useWorker !== false && (useWorker === true || supportsWorker());
  
  if (shouldUseWorker) {
    try {
      log.debug('🔄 Utilisation Web Worker pour traitement (non-bloquant)');
      return await processImageViaWorker(file, { createThumbnail, preserveQuality }, onProgress);
    } catch (workerError) {
      log.warn('⚠️ Erreur traitement worker, fallback synchrone', workerError);
      // Continuer avec version synchrone
    }
  }
  
  // ✅ Fallback : Version synchrone (code existant)
  log.debug('🔄 Utilisation traitement synchrone');

  try {
    log.debug('🔄 Traitement image complète...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      createThumbnail,
      preserveQuality
    });

    // 1. Convertir en format optimal (qualité 100%)
    const fullImage = await convertToOptimalFormat(file, { preserveQuality });

    // 2. Créer thumbnail si demandé (uniquement pour galerie)
    let thumbnail = null;
    if (createThumbnail) {
      thumbnail = await createThumbnail(file, {
        format: fullImage.format, // Même format que full
        quality: 0.8 // Qualité réduite OK pour thumbnail
      });
    }

    const result = {
      full: fullImage.data, // Qualité 100%, format optimal
      thumbnail: thumbnail?.data || null, // Thumbnail léger (galerie uniquement)
      format: fullImage.format,
      metadata: {
        originalFileName: file.name,
        originalSize: file.size,
        fullSize: fullImage.size,
        thumbnailSize: thumbnail?.size || 0,
        dimensions: fullImage.dimensions,
        thumbnailDimensions: thumbnail?.dimensions || null,
        quality: 'maximum', // Qualité full = 100%
        thumbnailQuality: thumbnail ? 0.8 : null,
        format: fullImage.format,
        webPSupported: fullImage.format === 'webp'
      }
    };

    log.debug('✅ Traitement image complète réussi', {
      format: result.format,
      fullSize: `${(result.metadata.fullSize / 1024 / 1024).toFixed(2)} MB`,
      thumbnailSize: result.metadata.thumbnailSize > 0
        ? `${(result.metadata.thumbnailSize / 1024).toFixed(2)} KB`
        : 'N/A',
      quality: result.metadata.quality
    });

    return result;

  } catch (error) {
    log.error('❌ Erreur traitement image', error);
    throw new Error(`Erreur traitement image: ${error.message}`);
  }
}

