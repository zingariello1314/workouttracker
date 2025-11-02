/**
 * Utilitaires d'analyse d'image pour extraction métriques
 * 
 * Fonctions helpers pour traitement d'image (variance, FFT, Canny, etc.)
 * Utilise Canvas API et algorithmes basés sur OpenCV.js concepts
 * 
 * Référence: suiviphotoapprofondi.md - Section 5
 */

import logger from '../../../utils/logger';

const log = logger.module('ImageAnalysisUtils');

/**
 * Compte pixels non-zéro dans masque binaire
 * @param {Object} mask - {data: Uint8Array, width, height}
 * @returns {number} Nombre de pixels non-zéro
 */
export const countNonZeroPixels = (mask) => {
  if (!mask || !mask.data) return 0;
  
  let count = 0;
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i] > 0) {
      count++;
    }
  }
  return count;
};

/**
 * Calcule variance locale sur fenêtre glissante
 * @param {ImageData|Canvas} imageData - Données image ou canvas
 * @param {number} windowSize - Taille fenêtre (ex: 5 pour 5x5)
 * @param {Object} mask - Masque binaire (optionnel, si null traite toute l'image)
 * @returns {number} Variance moyenne
 */
export const calculateLocalVariance = (imageData, windowSize = 5, mask = null) => {
  try {
    let canvas, ctx, imageDataArray, width, height;
    
    // Si c'est déjà un Canvas, récupérer ImageData
    if (imageData instanceof HTMLCanvasElement) {
      canvas = imageData;
      ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageDataArray = imgData.data;
      width = canvas.width;
      height = canvas.height;
    } else if (imageData && imageData.data) {
      imageDataArray = imageData.data;
      width = imageData.width;
      height = imageData.height;
    } else {
      log.warn('Format image non supporté pour calculateLocalVariance');
      return 0;
    }

    // Convertir en grayscale si RGB
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = imageDataArray[i * 4];
      const g = imageDataArray[i * 4 + 1];
      const b = imageDataArray[i * 4 + 2];
      grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // Formule luminance
    }

    const halfWindow = Math.floor(windowSize / 2);
    let varianceSum = 0;
    let validWindows = 0;

    // Parcourir chaque pixel (avec padding)
    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        const idx = y * width + x;
        
        // Vérifier masque si fourni
        if (mask && mask.data[idx] === 0) continue;

        // Calculer moyenne fenêtre locale
        let sum = 0;
        let count = 0;
        
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const localIdx = (y + dy) * width + (x + dx);
            sum += grayscale[localIdx];
            count++;
          }
        }
        
        const mean = sum / count;

        // Calculer variance fenêtre
        let variance = 0;
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const localIdx = (y + dy) * width + (x + dx);
            const diff = grayscale[localIdx] - mean;
            variance += diff * diff;
          }
        }
        
        varianceSum += variance / count;
        validWindows++;
      }
    }

    return validWindows > 0 ? varianceSum / validWindows : 0;
  } catch (error) {
    log.error('Erreur calculateLocalVariance', error);
    return 0;
  }
};

/**
 * FFT 2D simplifié pour analyse fréquentielle
 * Note: Implémentation simplifiée pour performances
 * @param {Uint8Array} grayscale - Image en niveaux de gris
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @returns {Object} {highFrequency, totalFrequency, ratio}
 */
export const performFFT2D = (grayscale, width, height) => {
  // Implémentation simplifiée: analyse fréquentielle via gradients
  // Alternative plus rapide que vraie FFT 2D complète
  
  let highFreqSum = 0;
  let totalSum = 0;

  // Calculer gradients (Sobel operator simplifié)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Gradient X
      const gx = Math.abs(
        grayscale[idx + 1] - grayscale[idx - 1]
      );
      
      // Gradient Y
      const gy = Math.abs(
        grayscale[(y + 1) * width + x] - grayscale[(y - 1) * width + x]
      );
      
      // Magnitude gradient = fréquence locale
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      totalSum += magnitude;
      
      // Haute fréquence = gradients élevés (détails fins)
      if (magnitude > 30) { // Seuil ajustable
        highFreqSum += magnitude;
      }
    }
  }

  const totalFrequency = totalSum / (width * height);
  const highFrequency = highFreqSum / (width * height);
  const ratio = totalFrequency > 0 ? highFrequency / totalFrequency : 0;

  return {
    highFrequency,
    totalFrequency,
    ratio
  };
};

/**
 * Détection contours avec Canny simplifié
 * @param {Uint8Array} grayscale - Image en niveaux de gris
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @param {Object} options - {threshold1, threshold2}
 * @returns {Object} {edges: Uint8Array, count: number}
 */
export const detectContoursCanny = (grayscale, width, height, options = {}) => {
  const { threshold1 = 50, threshold2 = 150 } = options;
  
  // Étape 1: Calcul gradients (Sobel)
  const gradients = new Float32Array(width * height);
  const directions = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel kernels
      const gx = -grayscale[idx - width - 1] + grayscale[idx - width + 1]
                 - 2 * grayscale[idx - 1] + 2 * grayscale[idx + 1]
                 - grayscale[idx + width - 1] + grayscale[idx + width + 1];
      
      const gy = -grayscale[idx - width - 1] - 2 * grayscale[idx - width] - grayscale[idx - width + 1]
                 + grayscale[idx + width - 1] + 2 * grayscale[idx + width] + grayscale[idx + width + 1];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      gradients[idx] = magnitude;
      directions[idx] = Math.atan2(gy, gx);
    }
  }

  // Étape 2: Suppression non-maximale
  const suppressed = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = gradients[idx];
      const dir = directions[idx];
      
      // Déterminer voisins selon direction
      let neighbor1, neighbor2;
      if (dir >= -Math.PI / 8 && dir < Math.PI / 8) {
        neighbor1 = gradients[idx + 1];
        neighbor2 = gradients[idx - 1];
      } else if (dir >= Math.PI / 8 && dir < 3 * Math.PI / 8) {
        neighbor1 = gradients[idx - width + 1];
        neighbor2 = gradients[idx + width - 1];
      } else if (dir >= 3 * Math.PI / 8 || dir < -3 * Math.PI / 8) {
        neighbor1 = gradients[idx - width];
        neighbor2 = gradients[idx + width];
      } else {
        neighbor1 = gradients[idx - width - 1];
        neighbor2 = gradients[idx + width + 1];
      }
      
      if (mag > neighbor1 && mag > neighbor2) {
        suppressed[idx] = mag > threshold2 ? 255 : (mag > threshold1 ? 128 : 0);
      }
    }
  }

  // Étape 3: Seuillage double (hysteresis)
  const edges = new Uint8Array(width * height);
  const visited = new Set();
  
  const floodFill = (x, y) => {
    const idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx)) return;
    visited.add(idx);
    
    if (suppressed[idx] >= 128) {
      edges[idx] = 255;
      // Vérifier voisins 8-connectés
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          floodFill(x + dx, y + dy);
        }
      }
    }
  };

  // Démarrer flood fill depuis pixels forts (255)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (suppressed[idx] === 255 && !visited.has(idx)) {
        floodFill(x, y);
      }
    }
  }

  // Compter contours
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] === 255) count++;
  }

  return { edges, count };
};

/**
 * Calcule variance Laplacian pour mesure netteté
 * @param {Uint8Array} grayscale - Image en niveaux de gris
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @returns {number} Variance Laplacian
 */
export const calculateLaplacianVariance = (grayscale, width, height) => {
  // Kernel Laplacian: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]]
  const laplacian = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      const value = 4 * grayscale[idx]
                  - grayscale[idx - width]
                  - grayscale[idx + width]
                  - grayscale[idx - 1]
                  - grayscale[idx + 1];
      
      laplacian[idx] = value;
    }
  }

  // Calculer moyenne
  let sum = 0;
  for (let i = 0; i < laplacian.length; i++) {
    sum += laplacian[i];
  }
  const mean = sum / laplacian.length;

  // Calculer variance
  let variance = 0;
  for (let i = 0; i < laplacian.length; i++) {
    const diff = laplacian[i] - mean;
    variance += diff * diff;
  }

  return variance / laplacian.length;
};

/**
 * Égalise histogramme pour améliorer contraste
 * @param {Uint8Array} grayscale - Image en niveaux de gris
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @returns {Uint8Array} Image égalisée
 */
export const equalizeHistogram = (grayscale, width, height) => {
  // Calculer histogramme
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayscale.length; i++) {
    histogram[grayscale[i]]++;
  }

  // Calculer CDF (Cumulative Distribution Function)
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Normaliser
  const cdfMin = Math.min(...cdf.filter(h => h > 0));
  const totalPixels = width * height;

  // Appliquer transformation
  const equalized = new Uint8Array(width * height);
  for (let i = 0; i < grayscale.length; i++) {
    const value = grayscale[i];
    equalized[i] = Math.round(((cdf[value] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }

  return equalized;
};

/**
 * Transformée de Hough simplifiée pour détecter lignes (veines)
 * @param {Uint8Array} grayscale - Image en niveaux de gris
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @param {Object} options - {threshold, minLineLength, maxLineGap}
 * @returns {Array} Lignes détectées [{x1, y1, x2, y2, length}]
 */
export const houghLineTransform = (grayscale, width, height, options = {}) => {
  const { threshold = 50, minLineLength = 20, maxLineGap = 10 } = options;
  
  // Détecter contours d'abord (Canny simplifié)
  const { edges } = detectContoursCanny(grayscale, width, height, {
    threshold1: threshold,
    threshold2: threshold * 2
  });

  // Groupement de pixels en lignes (simplifié)
  // Au lieu de vraie Hough transform, on fait groupement de pixels connectés linéaires
  const lines = [];
  const visited = new Set();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (edges[idx] === 255 && !visited.has(idx)) {
        // Chercher ligne connectée
        const linePixels = [];
        const queue = [{ x, y }];
        visited.add(idx);
        linePixels.push({ x, y });

        // BFS pour pixels connectés
        while (queue.length > 0) {
          const current = queue.shift();
          
          // Vérifier voisins 8-connectés
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const nx = current.x + dx;
              const ny = current.y + dy;
              const nIdx = ny * width + nx;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                  edges[nIdx] === 255 && !visited.has(nIdx)) {
                
                // Vérifier distance max entre pixels
                const lastPixel = linePixels[linePixels.length - 1];
                const dist = Math.sqrt((nx - lastPixel.x) ** 2 + (ny - lastPixel.y) ** 2);
                
                if (dist <= maxLineGap) {
                  visited.add(nIdx);
                  queue.push({ x: nx, y: ny });
                  linePixels.push({ x: nx, y: ny });
                }
              }
            }
          }
        }

        // Si ligne assez longue, l'ajouter
        if (linePixels.length >= minLineLength) {
          const first = linePixels[0];
          const last = linePixels[linePixels.length - 1];
          const length = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
          
          lines.push({
            x1: first.x,
            y1: first.y,
            x2: last.x,
            y2: last.y,
            length,
            pixelCount: linePixels.length
          });
        }
      }
    }
  }

  return lines;
};

/**
 * Calcule périmètre d'un masque binaire
 * @param {Object} mask - {data: Uint8Array, width, height}
 * @returns {number} Périmètre en pixels
 */
export const calculatePerimeter = (mask) => {
  if (!mask || !mask.data) return 0;
  
  const { data, width, height } = mask;
  let perimeter = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (data[idx] > 0) {
        // Vérifier si pixel est sur bord (4-connecté)
        const isBoundary = 
          (x === 0 || data[idx - 1] === 0) ||
          (x === width - 1 || data[idx + 1] === 0) ||
          (y === 0 || data[idx - width] === 0) ||
          (y === height - 1 || data[idx + width] === 0);
        
        if (isBoundary) {
          perimeter++;
        }
      }
    }
  }

  return perimeter;
};

/**
 * Extrait région d'image selon masque
 * @param {HTMLImageElement|HTMLCanvasElement} image - Image source
 * @param {Object} mask - Masque binaire
 * @returns {ImageData} ImageData de la région
 */
export const extractRegion = (image, mask) => {
  const canvas = document.createElement('canvas');
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext('2d');
  
  // Dessiner image source
  ctx.drawImage(image, 0, 0, mask.width, mask.height);
  
  // Récupérer ImageData
  const imageData = ctx.getImageData(0, 0, mask.width, mask.height);
  
  // Appliquer masque (mettre pixels masqués à 0)
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i] === 0) {
      const pixelIdx = i * 4;
      imageData.data[pixelIdx] = 0; // R
      imageData.data[pixelIdx + 1] = 0; // G
      imageData.data[pixelIdx + 2] = 0; // B
      imageData.data[pixelIdx + 3] = 0; // A (transparent)
    }
  }
  
  return imageData;
};

/**
 * Convertit ImageData en Uint8Array grayscale
 * @param {ImageData} imageData 
 * @returns {Uint8Array} Grayscale
 */
export const toGrayscale = (imageData) => {
  const grayscale = new Uint8Array(imageData.width * imageData.height);
  
  for (let i = 0; i < grayscale.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  return grayscale;
};

