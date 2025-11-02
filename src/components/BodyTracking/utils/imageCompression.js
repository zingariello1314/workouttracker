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

