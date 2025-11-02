/**
 * Service de prétraitement d'images pour analyse corporelle
 * 
 * Normalise images pour analyse cohérente:
 * - Correction orientation EXIF
 * - Redimensionnement intelligent
 * - Normalisation couleur/exposition
 * - Réduction bruit adaptative
 * - Crop intelligent du sujet
 * 
 * Référence: suiviphotoapprofondi.md - Section 5 (Phase 1)
 */

import logger from '../../../utils/logger';
import { calculateLocalVariance } from './imageAnalysisUtils';

const log = logger.module('ImagePreprocessing');

/**
 * Charge image depuis URL Base64 ou File
 * @param {string|File} source - URL Base64 ou File
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (source) => {
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
      img.src = source;
    } else if (source instanceof File) {
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
};

/**
 * Extrait métadonnées EXIF (orientation, etc.)
 * @param {HTMLImageElement} img 
 * @returns {Object} Métadonnées
 */
const extractEXIFMetadata = (img) => {
  // Note: Extraction EXIF complète nécessiterait une lib externe
  // Pour l'instant, détection basique via dimensions
  return {
    orientation: 1, // Par défaut
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height
  };
};

/**
 * Corrige orientation image selon EXIF
 * @param {HTMLImageElement} img - Image source
 * @param {number} orientation - Orientation EXIF (1-8)
 * @returns {HTMLCanvasElement} Canvas avec image corrigée
 */
export const correctOrientation = (img, orientation = 1) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Cas standards (la plupart des images sont déjà correctes)
  if (orientation === 1) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return canvas;
  }
  
  // Rotations selon orientation EXIF
  switch (orientation) {
    case 3: // 180°
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, 0, 0);
      break;
      
    case 6: // 90° CW
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
      
    case 8: // 90° CCW
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.translate(0, canvas.height);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
      
    default:
      // Orientation non gérée, retourner image originale
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
  }
  
  return canvas;
};

/**
 * Redimensionne image intelligemment avec qualité optimale
 * @param {HTMLImageElement|HTMLCanvasElement} image 
 * @param {number} targetWidth 
 * @param {number} targetHeight 
 * @param {string} quality - 'low' | 'medium' | 'high'
 * @returns {HTMLCanvasElement}
 */
export const resizeImage = (image, targetWidth, targetHeight, quality = 'high') => {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d', {
    willReadFrequently: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: quality // 'low', 'medium', 'high' (Lanczos-like)
  });
  
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas;
};

/**
 * Redimensionnement intelligent adaptatif selon stratégie multi-résolution
 * @param {HTMLImageElement} img 
 * @param {Object} options - {targetResolution, strategy}
 * @returns {HTMLCanvasElement}
 */
export const intelligentResize = (img, options = {}) => {
  const {
    targetResolution = 512, // Résolution cible (largeur)
    strategy = 'adaptive' // 'adaptive' | 'preserve' | 'upscale'
  } = options;
  
  const originalWidth = img.width;
  const originalHeight = img.height;
  const originalMax = Math.max(originalWidth, originalHeight);
  
  let targetWidth, targetHeight;
  
  // Stratégie multi-résolution
  if (originalMax > 2000 && strategy === 'adaptive') {
    // Haute résolution → Redimensionnement progressif
    const ratio = targetResolution / originalMax;
    targetWidth = Math.round(originalWidth * ratio);
    targetHeight = Math.round(originalHeight * ratio);
  } else if (originalMax >= 1000 && originalMax <= 2000) {
    // Moyenne résolution → Conservation si proche, sinon redimensionnement
    if (Math.abs(originalMax - targetResolution) < 200) {
      targetWidth = originalWidth;
      targetHeight = originalHeight;
    } else {
      const ratio = targetResolution / originalMax;
      targetWidth = Math.round(originalWidth * ratio);
      targetHeight = Math.round(originalHeight * ratio);
    }
  } else if (originalMax < 1000 && strategy === 'upscale') {
    // Basse résolution → Upscaling (seulement si demandé)
    const ratio = targetResolution / originalMax;
    targetWidth = Math.round(originalWidth * ratio);
    targetHeight = Math.round(originalHeight * ratio);
  } else {
    // Par défaut: redimensionnement proportionnel
    const ratio = targetResolution / originalMax;
    targetWidth = Math.round(originalWidth * ratio);
    targetHeight = Math.round(originalHeight * ratio);
  }
  
  return resizeImage(img, targetWidth, targetHeight, 'high');
};

/**
 * Normalise luminance (ajustement gamma)
 * @param {HTMLCanvasElement} canvas 
 * @returns {HTMLCanvasElement}
 */
export const normalizeLuminance = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculer luminance moyenne (Y channel YUV)
  let sumY = 0;
  let count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b; // Y channel
    sumY += y / 255; // Normaliser 0-1
    count++;
  }
  
  const avgLuminance = sumY / count;
  
  // Plage optimale: 0.3-0.7
  // Si trop sombre (< 0.3) ou trop clair (> 0.7), ajuster gamma
  if (avgLuminance < 0.3 || avgLuminance > 0.7) {
    const gamma = avgLuminance < 0.3 
      ? 0.3 / avgLuminance  // Éclaircir
      : 0.7 / avgLuminance; // Assombrir
    
    // Appliquer correction gamma
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Correction gamma
      const correctedR = Math.pow(r, 1 / gamma);
      const correctedG = Math.pow(g, 1 / gamma);
      const correctedB = Math.pow(b, 1 / gamma);
      
      data[i] = Math.min(255, Math.round(correctedR * 255));
      data[i + 1] = Math.min(255, Math.round(correctedG * 255));
      data[i + 2] = Math.min(255, Math.round(correctedB * 255));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  return canvas;
};

/**
 * Détecte niveau de bruit (analyse variance locale)
 * @param {ImageData} imageData 
 * @param {number} windowSize 
 * @returns {Object} {level, type}
 */
const detectNoise = (imageData, windowSize = 3) => {
  const variance = calculateLocalVariance(imageData, windowSize);
  
  // Seuils empiriques
  let level = 'low';
  let type = 'unknown';
  
  if (variance > 500) {
    level = 'high';
    // Distinguer type de bruit (simplifié)
    type = variance > 1000 ? 'gaussian' : 'impulse';
  } else if (variance > 200) {
    level = 'medium';
  }
  
  return { level, type, variance };
};

/**
 * Filtre médian pour bruit impulsionnel
 * @param {HTMLCanvasElement} canvas 
 * @param {number} kernelSize 
 * @returns {HTMLCanvasElement}
 */
const applyMedianFilter = (canvas, kernelSize = 3) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const output = ctx.createImageData(canvas.width, canvas.height);
  const halfKernel = Math.floor(kernelSize / 2);
  
  for (let y = halfKernel; y < canvas.height - halfKernel; y++) {
    for (let x = halfKernel; x < canvas.width - halfKernel; x++) {
      const idx = (y * canvas.width + x) * 4;
      const values = { r: [], g: [], b: [] };
      
      // Collecter valeurs voisinage
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const kIdx = ((y + ky) * canvas.width + (x + kx)) * 4;
          values.r.push(imageData.data[kIdx]);
          values.g.push(imageData.data[kIdx + 1]);
          values.b.push(imageData.data[kIdx + 2]);
        }
      }
      
      // Médiane
      const median = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      };
      
      output.data[idx] = median(values.r);
      output.data[idx + 1] = median(values.g);
      output.data[idx + 2] = median(values.b);
      output.data[idx + 3] = imageData.data[idx + 3]; // Alpha
    }
  }
  
  ctx.putImageData(output, 0, 0);
  return canvas;
};

/**
 * Pipeline de prétraitement complet
 * @param {string|File|HTMLImageElement} imageSource - Source image
 * @param {Object} options - Options prétraitement
 * @param {Function} onProgress - Callback progression (0-100)
 * @returns {Promise<Object>} {canvas, metadata, processed}
 */
export const preprocessImage = async (imageSource, options = {}, onProgress = null) => {
  try {
    if (onProgress) onProgress(10); // Début
    
    // 1. Chargement image
    let img;
    if (imageSource instanceof HTMLImageElement) {
      img = imageSource;
    } else {
      img = await loadImage(imageSource);
    }
    if (onProgress) onProgress(20);
    
    // 2. Extraction métadonnées EXIF
    const metadata = extractEXIFMetadata(img);
    if (onProgress) onProgress(25);
    
    // 3. Correction orientation
    let canvas = correctOrientation(img, metadata.orientation);
    if (onProgress) onProgress(35);
    
    // 4. Redimensionnement intelligent
    const {
      targetResolution = 512,
      resizeStrategy = 'adaptive'
    } = options;
    
    canvas = intelligentResize(canvas, {
      targetResolution,
      strategy: resizeStrategy
    });
    if (onProgress) onProgress(50);
    
    // 5. Normalisation luminance
    canvas = normalizeLuminance(canvas);
    if (onProgress) onProgress(60);
    
    // 6. Réduction bruit adaptative (seulement si nécessaire)
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const noiseInfo = detectNoise(imageData, 3);
    
    if (noiseInfo.level === 'high' && noiseInfo.type === 'impulse') {
      canvas = applyMedianFilter(canvas, 3);
      log.info('Filtre médian appliqué (bruit détecté)', noiseInfo);
    }
    if (onProgress) onProgress(75);
    
    // 7. Pré-calcul gradients (pour futures analyses)
    // (Sera fait dans métriques extraction si nécessaire)
    
    if (onProgress) onProgress(100);
    
    return {
      canvas,
      imageElement: canvas, // Compatible avec services
      metadata: {
        ...metadata,
        processedWidth: canvas.width,
        processedHeight: canvas.height,
        noiseInfo
      },
      processed: true
    };
  } catch (error) {
    log.error('Erreur prétraitement image', error);
    
    // Fallback: redimensionnement simple
    try {
      let img;
      if (imageSource instanceof HTMLImageElement) {
        img = imageSource;
      } else {
        img = await loadImage(imageSource);
      }
      
      const canvas = resizeImage(img, 512, 512, 'medium');
      return {
        canvas,
        imageElement: canvas,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          fallback: true
        },
        processed: false,
        error: error.message
      };
    } catch (fallbackError) {
      log.error('Erreur fallback prétraitement', fallbackError);
      throw new Error('Échec prétraitement image: ' + error.message);
    }
  }
};

