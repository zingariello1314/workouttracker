/**
 * 🖼️ MODULE DE COMPRESSION D'IMAGES - BODY TRACKING
 * 
 * Compression intelligente et optimisée des photos avant stockage IndexedDB.
 * Utilise Canvas API pour redimensionnement et compression JPEG avec qualité adaptative.
 */

import logger from '../../../utils/logger';

const log = logger.module('ImageCompression');

/**
 * Options de compression par défaut
 */
const DEFAULT_OPTIONS = {
  maxWidth: 1200,           // Largeur maximale en pixels
  maxHeight: 1600,          // Hauteur maximale en pixels
  maxSizeKB: 500,           // Taille maximale cible en KB
  quality: 0.75,            // Qualité JPEG initiale (0-1)
  minQuality: 0.3,          // Qualité minimale pour éviter dégradation excessive
  qualityStep: 0.1,         // Pas de réduction qualité si trop gros
  outputFormat: 'image/jpeg', // Format de sortie (JPEG pour meilleure compression)
  mimeType: 'image/jpeg'     // MIME type pour conversion
};

/**
 * Calcule les dimensions redimensionnées en conservant le ratio
 * @param {number} width - Largeur originale
 * @param {number} height - Hauteur originale
 * @param {number} maxWidth - Largeur maximale
 * @param {number} maxHeight - Hauteur maximale
 * @returns {Object} - { width, height } redimensionnées
 */
const calculateResizedDimensions = (width, height, maxWidth, maxHeight) => {
  // Si déjà dans les limites, pas de redimensionnement
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  // Calculer le ratio de redimensionnement pour respecter les deux contraintes
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
};

/**
 * Convertit un Data URL Base64 en taille en bytes
 * @param {string} dataUrl - Data URL Base64
 * @returns {number} - Taille en bytes
 */
const getBase64Size = (dataUrl) => {
  // Format: "data:image/jpeg;base64,/9j/4AAQ..."
  // Retirer le préfixe pour obtenir seulement Base64
  const base64String = dataUrl.split(',')[1] || '';
  
  // Calculer taille: Base64 utilise 4 caractères pour 3 bytes
  // + 33% overhead pour encoding Base64
  return Math.ceil((base64String.length * 3) / 4);
};

/**
 * Convertit bytes en KB avec 2 décimales
 * @param {number} bytes - Taille en bytes
 * @returns {number} - Taille en KB
 */
const bytesToKB = (bytes) => {
  return Math.round((bytes / 1024) * 100) / 100;
};

/**
 * Compresse une image avec redimensionnement et qualité adaptative
 * @param {File|string} input - Fichier image ou Data URL Base64
 * @param {Object} options - Options de compression
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<Object>} - { compressedDataUrl, originalSize, compressedSize, reduction }
 */
export const compressImage = async (input, options = {}, onProgress = null) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeKB * 1024;
  
  return new Promise((resolve, reject) => {
    try {
      // Étape 1: Charger l'image (20% progression)
      if (onProgress) onProgress(20);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Étape 2: Créer objet Image (40% progression)
        if (onProgress) onProgress(40);
        
        const img = new Image();
        
        img.onload = () => {
          try {
            // Étape 3: Calculer dimensions redimensionnées (50% progression)
            if (onProgress) onProgress(50);
            
            const originalSize = input instanceof File ? input.size : getBase64Size(e.target.result);
            const { width, height } = calculateResizedDimensions(
              img.width,
              img.height,
              opts.maxWidth,
              opts.maxHeight
            );
            
            // Étape 4: Créer canvas et redimensionner (60% progression)
            if (onProgress) onProgress(60);
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            // Améliorer qualité de rendu
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Dessiner l'image redimensionnée
            ctx.drawImage(img, 0, 0, width, height);
            
            // Étape 5: Compression avec qualité adaptative (70-100% progression)
            if (onProgress) onProgress(70);
            
            let qualityLevel = opts.quality;
            let compressedDataUrl = canvas.toDataURL(opts.outputFormat, qualityLevel);
            let compressedSize = getBase64Size(compressedDataUrl);
            let iterations = 0;
            const maxIterations = 10; // Limite sécurité
            
            // Réduire qualité si toujours trop gros
            while (compressedSize > maxSizeBytes && qualityLevel > opts.minQuality && iterations < maxIterations) {
              qualityLevel = Math.max(opts.minQuality, qualityLevel - opts.qualityStep);
              compressedDataUrl = canvas.toDataURL(opts.outputFormat, qualityLevel);
              compressedSize = getBase64Size(compressedDataUrl);
              iterations++;
              
              // Progression incrémentale (70% + (iterations * 3%))
              if (onProgress) {
                const progress = Math.min(95, 70 + (iterations * 3));
                onProgress(progress);
              }
            }
            
            // Étape 6: Finalisation (100% progression)
            if (onProgress) onProgress(100);
            
            const reduction = originalSize > 0 
              ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
              : 0;
            
            resolve({
              compressedDataUrl,
              originalSize,
              compressedSize,
              originalSizeKB: bytesToKB(originalSize),
              compressedSizeKB: bytesToKB(compressedSize),
              reduction: reduction,
              quality: qualityLevel,
              dimensions: {
                original: { width: img.width, height: img.height },
                compressed: { width, height }
              }
            });
          } catch (error) {
            log.error('Erreur lors de la compression de l\'image', error);
            reject(new Error(`Erreur lors de la compression: ${error.message}`));
          }
        };
        
        img.onerror = () => {
          log.error('Impossible de charger l\'image pour compression', { fileName: input instanceof File ? input.name : 'Data URL' });
          reject(new Error('Impossible de charger l\'image. Vérifiez que le fichier est une image valide.'));
        };
        
        // Charger l'image
        if (input instanceof File) {
          img.src = e.target.result;
        } else {
          img.src = input; // Déjà un Data URL
        }
      };
      
      reader.onerror = () => {
        log.error('Erreur lors de la lecture du fichier image', { fileName: input instanceof File ? input.name : 'Data URL' });
        reject(new Error('Erreur lors de la lecture du fichier image.'));
      };
      
      // Lire le fichier
      if (input instanceof File) {
        reader.readAsDataURL(input);
      } else {
        // Si c'est déjà un Data URL, simuler le onload
        reader.onload({ target: { result: input } });
      }
    } catch (error) {
      log.error('Erreur générale lors de la compression', error);
      reject(new Error(`Erreur lors de la compression: ${error.message}`));
    }
  });
};

/**
 * ✅ OPTIMISATION: Détection support WebP
 * @returns {Promise<boolean>} - true si WebP supporté
 */
export const checkWebPSupport = async () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    // Image WebP test (2x1 pixels)
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * ✅ OPTIMISATION: Convertit blob en base64
 * @param {Blob} blob - Blob à convertir
 * @returns {Promise<string>} - Data URL base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * ✅ PHASE 3.3 : Détecter support Web Worker pour compression
 * @returns {boolean} - true si worker supporté
 */
const supportsWorkerCompression = () => {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap !== 'undefined'
  );
};

/**
 * ✅ PHASE 3.3 : Compression via Web Worker (non-bloquant)
 * @param {File|string} input - Fichier image ou Data URL Base64
 * @param {Object} options - Options de compression
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<Object>} - Résultat compression
 */
const compressImageMultiResolutionWorker = async (input, options = {}, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer worker
      const worker = new Worker(
        new URL('../workers/imageCompressionWorker.js', import.meta.url),
        { type: 'module' }
      );
      
      // Convertir input en Data URL si File
      let imageData;
      let originalSize = 0;
      
      if (input instanceof File) {
        originalSize = input.size;
        const reader = new FileReader();
        reader.onload = (e) => {
          imageData = e.target.result;
          startCompression();
        };
        reader.onerror = () => reject(new Error('Erreur lecture fichier'));
        reader.readAsDataURL(input);
      } else {
        imageData = input;
        originalSize = getBase64Size(input);
        startCompression();
      }
      
      function startCompression() {
        // Envoyer message au worker
        worker.postMessage({
          type: 'COMPRESS_MULTI_RESOLUTION',
          payload: {
            imageData,
            resolutions: options.resolutions || [
              { name: 'thumbnail', width: 150, height: 200, quality: 0.6 },
              { name: 'preview', width: 400, height: 533, quality: 0.75 },
              { name: 'full', width: 1200, height: 1600, quality: 0.85 }
            ],
            progressive: options.progressive !== false,
            originalSize
          }
        });
      }
      
      // Écouter messages du worker
      worker.onmessage = (e) => {
        const { type, progress, message, result, error } = e.data;
        
        if (type === 'PROGRESS') {
          if (onProgress) {
            onProgress(progress, message);
          }
        } else if (type === 'SUCCESS') {
          worker.terminate();
          resolve(result);
        } else if (type === 'ERROR') {
          worker.terminate();
          reject(new Error(error.message || 'Erreur compression worker'));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(new Error(`Erreur worker: ${error.message}`));
      };
      
      // Timeout sécurité (30 secondes)
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Timeout compression worker (> 30s)'));
      }, 30000);
      
    } catch (error) {
      reject(new Error(`Erreur initialisation worker: ${error.message}`));
    }
  });
};

/**
 * ✅ OPTIMISATION: Compression multi-résolution avec WebP + fallback JPEG
 * ✅ PHASE 3.3 : Utilise Web Worker si disponible, sinon fallback synchrone
 * 
 * Génère 3 résolutions:
 * - thumbnail: 150x200 (galerie grille)
 * - preview: 400x533 (vue détaillée)
 * - full: 1200x1600 (analyse IA)
 * 
 * @param {File|string} input - Fichier image ou Data URL Base64
 * @param {Object} options - Options de compression
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<Object>} - { thumbnail, preview, full } avec format, size, etc.
 */
export const compressImageMultiResolution = async (input, options = {}, onProgress = null) => {
  // ✅ PHASE 3.3 : Utiliser worker si supporté, sinon fallback synchrone
  if (supportsWorkerCompression() && options.useWorker !== false) {
    try {
      log.debug('Utilisation Web Worker pour compression (non-bloquant)');
      return await compressImageMultiResolutionWorker(input, options, onProgress);
    } catch (workerError) {
      log.warn('Erreur compression worker, fallback synchrone', workerError);
      // Continuer avec version synchrone
    }
  }
  
  // ✅ Fallback : Version synchrone (code existant)
  log.debug('Utilisation compression synchrone (fallback)');
  const opts = {
    resolutions: options.resolutions || [
      { name: 'thumbnail', width: 150, height: 200, quality: 0.6 },
      { name: 'preview', width: 400, height: 533, quality: 0.75 },
      { name: 'full', width: 1200, height: 1600, quality: 0.85 }
    ],
    progressive: options.progressive !== false, // JPEG progressif par défaut
    ...options
  };
  
  return new Promise((resolve, reject) => {
    try {
        // ✅ PHASE 4.2 : Étape 1: Détection support WebP (10% progression)
        if (onProgress) onProgress(10, 'Détection format optimal...');
      
      checkWebPSupport().then(supportsWebP => {
        const format = supportsWebP ? 'webp' : 'jpeg';
        log.debug(`Format détecté: ${format}`);
        
          // ✅ PHASE 4.2 : Étape 2: Charger l'image (20% progression)
          const originalSize = input instanceof File ? input.size : getBase64Size(input);
          const originalSizeKB = bytesToKB(originalSize);
          if (onProgress) onProgress(20, `Chargement image (${originalSizeKB} KB)...`);
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          // ✅ PHASE 4.2 : Étape 3: Créer objet Image (30% progression)
          if (onProgress) onProgress(30, 'Préparation compression...');
          
          const img = new Image();
          
          img.onload = async () => {
            try {
              const originalSize = input instanceof File ? input.size : getBase64Size(e.target.result);
              const results = {};
              
              // ✅ PHASE 4.2 : Étape 4: Générer toutes résolutions en parallèle (40-90% progression)
              if (onProgress) onProgress(40, `Préparation compression (${img.width}x${img.height})...`);
              const resolutionPromises = opts.resolutions.map(async (res, index) => {
                const progressStart = 40 + (index * (50 / opts.resolutions.length));
                const progressEnd = 40 + ((index + 1) * (50 / opts.resolutions.length));
                
                // ✅ PHASE 4.2 : Message enrichi avec nom résolution
                const resolutionLabels = {
                  thumbnail: 'Miniature',
                  preview: 'Aperçu',
                  full: 'Pleine résolution'
                };
                if (onProgress) {
                  onProgress(progressStart, `Compression ${res.name} (${resolutionLabels[res.name] || res.name})...`);
                }
                
                // Calculer dimensions redimensionnées
                const { width, height } = calculateResizedDimensions(
                  img.width,
                  img.height,
                  res.width,
                  res.height
                );
                
                // Créer canvas pour cette résolution
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d', { 
                  alpha: false, // Pas besoin alpha pour JPEG/WebP
                  desynchronized: true // Optimisation navigateur
                });
                
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // ✅ Générer blob avec format optimal (WebP ou JPEG)
                let blob;
                try {
                  if (format === 'webp') {
                    blob = await new Promise((resolveBlob, rejectBlob) => {
                      canvas.toBlob(
                        (result) => {
                          if (result) {
                            resolveBlob(result);
                          } else {
                            // ✅ Fallback JPEG si WebP échoue
                            canvas.toBlob(
                              (jpegResult) => resolveBlob(jpegResult || new Blob()),
                              'image/jpeg',
                              res.quality
                            );
                          }
                        },
                        'image/webp',
                        res.quality
                      );
                    });
                    
                    // Si blob est vide ou échec, fallback JPEG
                    if (!blob || blob.size === 0) {
                      blob = await new Promise(resolveBlob => {
                        canvas.toBlob(resolveBlob, 'image/jpeg', res.quality);
                      });
                    }
                  } else {
                    // Format JPEG standard
                    blob = await new Promise(resolveBlob => {
                      canvas.toBlob(
                        resolveBlob,
                        'image/jpeg',
                        res.quality,
                        opts.progressive ? { progressive: true } : undefined
                      );
                    });
                  }
                } catch (blobError) {
                  log.warn(`Erreur génération blob ${res.name}, fallback JPEG`, blobError);
                  // Fallback JPEG si erreur
                  blob = await new Promise(resolveBlob => {
                    canvas.toBlob(resolveBlob, 'image/jpeg', res.quality);
                  });
                }
                
                // Convertir blob en base64
                const base64 = await blobToBase64(blob);
                
                // ✅ PHASE 4.2 : Message enrichi avec taille compressée
                const sizeKB = bytesToKB(blob.size);
                if (onProgress) {
                  onProgress(progressEnd, `${res.name} compressé (${sizeKB} KB)`);
                }
                
                return {
                  name: res.name,
                  data: base64,
                  width,
                  height,
                  size: blob.size,
                  format: blob.type === 'image/webp' ? 'webp' : 'jpeg',
                  quality: res.quality
                };
              });
              
              // ✅ PHASE 4.2 : Attendre toutes résolutions en parallèle
              const resolved = await Promise.all(resolutionPromises);
              
              // ✅ PHASE 4.2 : Message finalisation
              if (onProgress) onProgress(90, 'Finalisation...');
              
              resolved.forEach(res => {
                results[res.name] = res;
              });
              
              // ✅ PHASE 4.2 : Étape 5: Finalisation (100% progression)
              if (onProgress) onProgress(100, 'Compression terminée !');
              
              const totalSize = Object.values(results).reduce((sum, r) => sum + r.size, 0);
              const reduction = originalSize > 0 
                ? Math.round(((originalSize - totalSize) / originalSize) * 100)
                : 0;
              
              log.debug(`Compression multi-résolution: ${originalSize} → ${totalSize} bytes (-${reduction}%)`);
              
              resolve({
                ...results,
                originalSize,
                totalSize,
                originalSizeKB: bytesToKB(originalSize),
                totalSizeKB: bytesToKB(totalSize),
                reduction,
                format: format,
                dimensions: {
                  original: { width: img.width, height: img.height }
                }
              });
              
            } catch (error) {
              log.error('Erreur compression multi-résolution', error);
              reject(new Error(`Erreur compression multi-résolution: ${error.message}`));
            }
          };
          
          img.onerror = () => {
            log.error('Impossible de charger l\'image pour compression multi-résolution', { fileName: input instanceof File ? input.name : 'Data URL' });
            reject(new Error('Impossible de charger l\'image. Vérifiez que le fichier est une image valide.'));
          };
          
          // Charger l'image
          if (input instanceof File) {
            img.src = e.target.result;
          } else {
            img.src = input; // Déjà un Data URL
          }
        };
        
        reader.onerror = () => {
          log.error('Erreur lecture fichier pour compression multi-résolution', { fileName: input instanceof File ? input.name : 'Data URL' });
          reject(new Error('Erreur lors de la lecture du fichier image.'));
        };
        
        // Lire le fichier
        if (input instanceof File) {
          reader.readAsDataURL(input);
        } else {
          // Si c'est déjà un Data URL, simuler le onload
          reader.onload({ target: { result: input } });
        }
      }).catch(error => {
        log.error('Erreur détection WebP, utilisation JPEG', error);
        // En cas d'erreur détection, continuer avec JPEG
        // Relancer la fonction avec format forcé JPEG
        compressImageMultiResolution(input, { ...opts, format: 'jpeg' }, onProgress)
          .then(resolve)
          .catch(reject);
      });
    } catch (error) {
      log.error('Erreur générale compression multi-résolution', error);
      reject(new Error(`Erreur compression multi-résolution: ${error.message}`));
    }
  });
};

/**
 * Compresse plusieurs images en parallèle avec limite
 * @param {Array<File>} files - Tableau de fichiers images
 * @param {Object} options - Options de compression
 * @param {Function} onProgress - Callback (fileIndex, progress, fileProgress)
 * @returns {Promise<Array>} - Tableau de résultats de compression
 */
export const compressMultipleImages = async (files, options = {}, onProgress = null) => {
  const results = [];
  const maxConcurrent = 2; // Limiter parallélisme pour éviter surcharge
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await compressImage(
        file,
        options,
        (progress) => {
          if (onProgress) {
            onProgress(i, (i / files.length) * 100, progress);
          }
        }
      );
      
      results.push({ success: true, file, ...result });
    } catch (error) {
      log.error(`Erreur lors de la compression de l'image ${i + 1}/${files.length}`, error, { fileName: file.name });
      results.push({ success: false, file, error: error.message });
    }
  }
  
  return results;
};

/**
 * Vérifie si une image a besoin de compression
 * @param {File} file - Fichier image
 * @param {Object} options - Options de compression
 * @returns {Promise<boolean>} - true si compression nécessaire
 */
export const needsCompression = async (file, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeKB * 1024;
  
  // Vérifier taille fichier
  if (file.size > maxSizeBytes) {
    return true;
  }
  
  // Vérifier dimensions (nécessite lecture image)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const needsResize = img.width > opts.maxWidth || img.height > opts.maxHeight;
      resolve(needsResize);
    };
    img.onerror = () => resolve(false); // Si erreur, on assume pas besoin
    img.src = URL.createObjectURL(file);
  });
};

