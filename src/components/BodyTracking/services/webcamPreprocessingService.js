/**
 * ✅ OPTIMISATION #5: Service de Preprocessing Adaptatif Webcam
 * 
 * Améliore détection pose MediaPipe via preprocessing adaptatif en temps réel:
 * - EdgePreservingDenoiser: Réduction bruit préservant contours (bilateral filter approximation)
 * - UnsharpMaskFilter: Sharpening adaptatif pour améliorer netteté landmarks
 * - FrameQualityAnalyzer: Analyse qualité frame pour décider preprocessing nécessaire
 * 
 * Performance optimisée pour temps réel:
 * - Processing seulement si nécessaire (basé sur analyse qualité)
 * - Kernel sizes adaptatifs selon qualité détectée
 * - Cache pour éviter recalculs inutiles
 * 
 * Référence: analyseclaudedoudongletphoto.md - Section amélioration détection corps webcam
 */

import logger from '../../../utils/logger';

const log = logger.module('WebcamPreprocessing');

/**
 * ✅ OPTIMISATION: Frame Quality Analyzer
 * Analyse qualité frame pour décider preprocessing nécessaire
 */
class FrameQualityAnalyzer {
  /**
   * Analyse qualité frame (bruit, netteté, mouvement)
   * @param {ImageData} imageData - Frame à analyser
   * @returns {Object} Métriques qualité
   */
  analyze(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    let totalLum = 0;
    let totalVariance = 0;
    let edgePixels = 0;
    let motionBlurScore = 0;
    
    const luminances = [];
    
    // ✅ Étape 1: Calculer luminance et variance (indicateur bruit)
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      luminances.push(lum);
      totalLum += lum;
    }
    
    const avgLum = totalLum / (width * height);
    
    // Calculer variance (indicateur bruit)
    for (const lum of luminances) {
      totalVariance += Math.pow(lum - avgLum, 2);
    }
    const variance = totalVariance / (width * height);
    // ✅ Normaliser bruit 0-1 (seuil empirique: 500 variance = bruit élevé)
    const noiseLevel = Math.min(1.0, variance / 500);
    
    // ✅ Étape 2: Détecter bords (Sobel simplifié pour mesure netteté)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const idxL = ((y * width + (x - 1)) * 4);
        const idxR = ((y * width + (x + 1)) * 4);
        const idxU = (((y - 1) * width + x) * 4);
        const idxD = (((y + 1) * width + x) * 4);
        
        const lumC = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const lumL = 0.299 * data[idxL] + 0.587 * data[idxL + 1] + 0.114 * data[idxL + 2];
        const lumR = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
        const lumU = 0.299 * data[idxU] + 0.587 * data[idxU + 1] + 0.114 * data[idxU + 2];
        const lumD = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];
        
        // Gradient Sobel simplifié (Gx, Gy)
        const gx = (lumR - lumL) / 2;
        const gy = (lumD - lumU) / 2;
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // ✅ Bord si magnitude > seuil (empirique: 20)
        if (magnitude > 20) {
          edgePixels++;
          
          // ✅ Mesure motion blur: variance directionnelle bords
          // Si bords directionnels cohérents = mouvement (blur directionnel)
          const direction = Math.atan2(gy, gx);
          motionBlurScore += magnitude * Math.abs(Math.cos(direction));
        }
      }
    }
    
    // ✅ Calculer netteté (ratio pixels bords / total)
    const sharpness = Math.min(1.0, (edgePixels / (width * height)) * 10); // Normaliser 0-1
    
    // ✅ Motion blur normalisé 0-1
    const motionBlur = Math.min(1.0, motionBlurScore / (edgePixels || 1) / 100);
    
    // ✅ Direction mouvement (approximative, pour deblur futur)
    const motionDirection = motionBlur > 0.3 ? 'horizontal' : 'unknown';
    
    return {
      noiseLevel,      // 0-1 (0 = pas de bruit, 1 = bruit élevé)
      sharpness,       // 0-1 (0 = flou, 1 = net)
      motionBlur,      // 0-1 (0 = pas de blur, 1 = blur élevé)
      motionDirection, // 'horizontal' | 'vertical' | 'unknown'
      averageLuminance: avgLum,
      variance
    };
  }
}

/**
 * ✅ OPTIMISATION: Edge-Preserving Denoiser (Bilateral Filter approximation)
 * Réduit bruit tout en préservant contours (crucial pour landmarks MediaPipe)
 */
class EdgePreservingDenoiser {
  /**
   * Denoise imageData avec préservation contours
   * @param {ImageData} imageData - Frame à denoiser
   * @param {Object} options - {strength, preserveEdges}
   * @returns {Promise<ImageData>} Frame denoisé
   */
  async denoise(imageData, options = {}) {
    const { strength = 0.5, preserveEdges = true } = options;
    
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // ✅ Optimisation: Bilateral filter simplifié (O(n*k²) au lieu de O(n²))
    // Kernel size adaptatif selon strength: 3-5px (plus petit = plus rapide)
    const kernelSize = Math.floor(3 + strength * 2); // 3-5px selon force
    const halfKernel = Math.floor(kernelSize / 2);
    
    // ✅ Parcourir pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // ✅ Calculer luminance pixel central
        const centerLum = (
          0.299 * data[idx] +
          0.587 * data[idx + 1] +
          0.114 * data[idx + 2]
        );
        
        let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
        
        // ✅ Parcourir voisinage (kernel)
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const pIdx = (py * width + px) * 4;
            
            // ✅ Luminance pixel voisin
            const neighborLum = (
              0.299 * data[pIdx] +
              0.587 * data[pIdx + 1] +
              0.114 * data[pIdx + 2]
            );
            
            // ✅ Pondération spatiale (Gaussienne - distance géométrique)
            const spatialDist = Math.sqrt(kx * kx + ky * ky);
            const sigmaSpatial = kernelSize / 3; // Sigma adaptatif
            const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * sigmaSpatial * sigmaSpatial));
            
            // ✅ Pondération radiométrique (protège bords - différence luminance)
            let rangeWeight = 1.0;
            if (preserveEdges) {
              const lumDiff = Math.abs(centerLum - neighborLum);
              // ✅ Réduire poids si différence luminance élevée (bord détecté)
              // Sigma radiométrique: 25 (seuil empirique)
              const sigmaRange = 25;
              rangeWeight = Math.exp(-(lumDiff * lumDiff) / (2 * sigmaRange * sigmaRange));
            }
            
            // ✅ Poids total = spatial × radiométrique × strength
            const totalWeight = spatialWeight * rangeWeight * strength;
            
            sumR += data[pIdx] * totalWeight;
            sumG += data[pIdx + 1] * totalWeight;
            sumB += data[pIdx + 2] * totalWeight;
            sumWeight += totalWeight;
          }
        }
        
        // ✅ Normaliser et appliquer (mixer avec original selon strength)
        if (sumWeight > 0) {
          const denoisedR = sumR / sumWeight;
          const denoisedG = sumG / sumWeight;
          const denoisedB = sumB / sumWeight;
          
          // ✅ Mixer avec original selon strength (éviter sur-denoising)
          // strength=0.5 = 50% original + 50% denoisé
          output[idx] = Math.round(data[idx] * (1 - strength) + denoisedR * strength);
          output[idx + 1] = Math.round(data[idx + 1] * (1 - strength) + denoisedG * strength);
          output[idx + 2] = Math.round(data[idx + 2] * (1 - strength) + denoisedB * strength);
        } else {
          // ✅ Fallback: garder original si poids total = 0
          output[idx] = data[idx];
          output[idx + 1] = data[idx + 1];
          output[idx + 2] = data[idx + 2];
        }
        output[idx + 3] = data[idx + 3]; // Alpha inchangé
      }
    }
    
    return new ImageData(output, width, height);
  }
}

/**
 * ✅ OPTIMISATION: Unsharp Mask Filter (sharpening)
 * Améliore netteté landmarks pour meilleure détection MediaPipe
 */
class UnsharpMaskFilter {
  /**
   * Sharpen imageData via unsharp mask
   * @param {ImageData} imageData - Frame à sharpen
   * @param {Object} options - {amount, radius, threshold}
   * @returns {ImageData} Frame sharpened
   */
  sharpen(imageData, options = {}) {
    const { amount = 1.0, radius = 1.0, threshold = 0 } = options;
    
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // ✅ Étape 1: Créer version blur (Gaussian blur pour masque)
    const blurred = this.gaussianBlur(imageData, radius);
    
    // ✅ Étape 2: Calculer masque unsharp = original - blur
    for (let i = 0; i < data.length; i += 4) {
      // ✅ Luminance original
      const origLum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // ✅ Luminance blur
      const blurLum = 0.299 * blurred[i] + 0.587 * blurred[i + 1] + 0.114 * blurred[i + 2];
      
      // ✅ Masque unsharp = différence original - blur
      const unsharpMask = origLum - blurLum;
      
      // ✅ Appliquer seulement si différence > threshold (éviter amplification bruit)
      if (Math.abs(unsharpMask) > threshold) {
        // ✅ Ajouter masque au original (amplifié par amount)
        const sharpR = Math.max(0, Math.min(255, data[i] + unsharpMask * amount));
        const sharpG = Math.max(0, Math.min(255, data[i + 1] + unsharpMask * amount));
        const sharpB = Math.max(0, Math.min(255, data[i + 2] + unsharpMask * amount));
        
        output[i] = sharpR;
        output[i + 1] = sharpG;
        output[i + 2] = sharpB;
      } else {
        // ✅ Garder original si masque < threshold
        output[i] = data[i];
        output[i + 1] = data[i + 1];
        output[i + 2] = data[i + 2];
      }
      output[i + 3] = data[i + 3]; // Alpha inchangé
    }
    
    return new ImageData(output, width, height);
  }
  
  /**
   * Gaussian blur (2 passes séparables pour performance)
   * @param {ImageData} imageData 
   * @param {number} radius 
   * @returns {Uint8ClampedArray} Blurred data
   */
  gaussianBlur(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // ✅ Taille kernel adaptative selon radius
    const kernelSize = Math.ceil(radius * 3) * 2 + 1; // Taille impaire
    const halfKernel = Math.floor(kernelSize / 2);
    const kernel = this.createGaussianKernel(kernelSize, radius);
    
    // ✅ Passe horizontale (plus efficace que 2D)
    const temp = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumA = 0, sumWeight = 0;
        
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const pIdx = (y * width + px) * 4;
          const weight = kernel[kx + halfKernel];
          
          sumR += data[pIdx] * weight;
          sumG += data[pIdx + 1] * weight;
          sumB += data[pIdx + 2] * weight;
          sumA += data[pIdx + 3] * weight;
          sumWeight += weight;
        }
        
        const idx = (y * width + x) * 4;
        temp[idx] = sumR / sumWeight;
        temp[idx + 1] = sumG / sumWeight;
        temp[idx + 2] = sumB / sumWeight;
        temp[idx + 3] = sumA / sumWeight;
      }
    }
    
    // ✅ Passe verticale
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumA = 0, sumWeight = 0;
        
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const pIdx = (py * width + x) * 4;
          const weight = kernel[ky + halfKernel];
          
          sumR += temp[pIdx] * weight;
          sumG += temp[pIdx + 1] * weight;
          sumB += temp[pIdx + 2] * weight;
          sumA += temp[pIdx + 3] * weight;
          sumWeight += weight;
        }
        
        const idx = (y * width + x) * 4;
        output[idx] = sumR / sumWeight;
        output[idx + 1] = sumG / sumWeight;
        output[idx + 2] = sumB / sumWeight;
        output[idx + 3] = sumA / sumWeight;
      }
    }
    
    return output;
  }
  
  /**
   * Crée kernel gaussien 1D
   * @param {number} size 
   * @param {number} sigma 
   * @returns {Array<number>} Kernel normalisé
   */
  createGaussianKernel(size, sigma) {
    const kernel = [];
    const half = Math.floor(size / 2);
    let sum = 0;
    
    for (let i = -half; i <= half; i++) {
      const value = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel[i + half] = value;
      sum += value;
    }
    
    // ✅ Normaliser kernel (somme = 1)
    return kernel.map(v => v / sum);
  }
}

/**
 * ✅ OPTIMISATION: Service Principal - Orchestre preprocessing adaptatif
 */
class WebcamPreprocessingService {
  constructor() {
    this.qualityAnalyzer = new FrameQualityAnalyzer();
    this.denoiser = new EdgePreservingDenoiser();
    this.sharpener = new UnsharpMaskFilter();
    
    // ✅ Cache pour éviter recalculs inutiles
    this.lastQualityCache = null;
    this.lastQualityFrame = null;
    this.cacheTimeout = 100; // ms (frames similaires = même qualité)
  }

  /**
   * Preprocess frame vidéo adaptatif selon qualité détectée
   * @param {HTMLVideoElement|HTMLCanvasElement} videoFrame - Frame webcam
   * @param {Object} options - Options preprocessing
   * @returns {Promise<HTMLCanvasElement>} Canvas avec frame traité
   */
  async preprocessFrame(videoFrame, options = {}) {
    const {
      denoise = true,
      sharpen = true,
      adaptiveBrightness = false,
      motionDeblur = false
    } = options;

    try {
      // ✅ Extraire ImageData depuis frame
      const canvas = document.createElement('canvas');
      canvas.width = videoFrame.videoWidth || videoFrame.width || 640;
      canvas.height = videoFrame.videoHeight || videoFrame.height || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoFrame, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // ✅ ÉTAPE 1: Analyse qualité frame (avec cache pour performance)
      // Vérifier cache qualité (éviter recalcul si frame similaire)
      const now = Date.now();
      let quality;
      
      if (this.lastQualityCache && (now - this.lastQualityCache.timestamp) < this.cacheTimeout) {
        // ✅ Utiliser cache si récent (< 100ms)
        quality = this.lastQualityCache.quality;
        log.debug('Qualité frame depuis cache (économise CPU)');
      } else {
        // ✅ Analyser qualité frame
        quality = this.qualityAnalyzer.analyze(imageData);
        
        // ✅ Mettre en cache
        this.lastQualityCache = {
          quality,
          timestamp: now
        };
      }
      
      // ✅ ÉTAPE 1.5: Vérifier si preprocessing nécessaire (optimisation performance)
      const needsDenoise = denoise && quality.noiseLevel > 0.15;
      const needsSharpen = sharpen && quality.sharpness < 0.6;
      const needsBrightness = adaptiveBrightness && (quality.averageLuminance < 100 || quality.averageLuminance > 180);
      
      // ✅ Si aucune amélioration nécessaire, retourner frame original (économie CPU)
      if (!needsDenoise && !needsSharpen && !needsBrightness && !motionDeblur) {
        log.debug('Frame qualité suffisante, preprocessing skip (économie CPU)');
        return canvas; // Retourner canvas original (déjà créé)
      }
      
      // ✅ ÉTAPE 2: Denoising si nécessaire (bruit > seuil)
      if (needsDenoise) {
        imageData = await this.denoiser.denoise(
          imageData,
          {
            strength: Math.min(1.0, quality.noiseLevel * 2), // ✅ Force adaptative selon bruit
            preserveEdges: true // ✅ Crucial pour landmarks MediaPipe
          }
        );
      }
      
      // ✅ ÉTAPE 3: Sharpening si flou détecté
      if (needsSharpen) {
        imageData = this.sharpener.sharpen(
          imageData,
          {
            amount: 1.5 - quality.sharpness, // ✅ Plus flou = plus sharpening
            radius: 1.0,
            threshold: 0
          }
        );
      }
      
      // ✅ ÉTAPE 4: Correction luminosité adaptative (optionnel)
      if (needsBrightness) {
        const brightness = quality.averageLuminance;
        
        if (brightness < 100) {
          // ✅ Sous-exposé : éclaircir
          imageData = this.adjustBrightness(imageData, +30);
        } else if (brightness > 180) {
          // ✅ Surexposé : assombrir
          imageData = this.adjustBrightness(imageData, -20);
        }
      }
      
      // ✅ Retourner canvas avec imageData traité
      ctx.putImageData(imageData, 0, 0);
      return canvas;
      
    } catch (error) {
      log.warn('Erreur preprocessing frame, retour frame original', error);
      // ✅ Fallback: retourner frame original si erreur
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = videoFrame.videoWidth || 640;
      fallbackCanvas.height = videoFrame.videoHeight || 480;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      fallbackCtx.drawImage(videoFrame, 0, 0);
      return fallbackCanvas;
    }
  }

  /**
   * Ajuste luminosité ImageData
   * @param {ImageData} imageData 
   * @param {number} delta - Delta luminosité (-255 à +255)
   * @returns {ImageData}
   */
  adjustBrightness(imageData, delta) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      output[i] = Math.max(0, Math.min(255, data[i] + delta));
      output[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta));
      output[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta));
      output[i + 3] = data[i + 3]; // Alpha inchangé
    }
    
    return new ImageData(output, imageData.width, imageData.height);
  }
}

// ✅ Singleton pattern (une seule instance)
let webcamPreprocessingInstance = null;

/**
 * Obtenir instance singleton du service
 * @returns {WebcamPreprocessingService}
 */
export const getWebcamPreprocessingService = () => {
  if (!webcamPreprocessingInstance) {
    webcamPreprocessingInstance = new WebcamPreprocessingService();
    log.info('WebcamPreprocessingService initialisé');
  }
  return webcamPreprocessingInstance;
};

// ✅ Export classes individuelles pour tests
export { FrameQualityAnalyzer, EdgePreservingDenoiser, UnsharpMaskFilter };

export default getWebcamPreprocessingService;

