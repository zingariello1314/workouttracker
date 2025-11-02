/**
 * Web Worker pour Calculs Métriques Image
 * 
 * Exécute calculs lourds d'extraction métriques dans thread séparé:
 * - FFT 2D
 * - Canny Edge Detection
 * - Hough Line Transform
 * - Variance locale
 * - Calculs pixel-level
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

/**
 * Compte pixels non-zéro dans masque binaire
 */
const countNonZeroPixels = (data) => {
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0) {
      count++;
    }
  }
  return count;
};

/**
 * Calcule variance locale sur fenêtre glissante
 */
const calculateLocalVariance = (imageData, width, height, windowSize = 5, mask = null) => {
  const halfWindow = Math.floor(windowSize / 2);
  let varianceSum = 0;
  let validPixels = 0;
  
  for (let y = halfWindow; y < height - halfWindow; y++) {
    for (let x = halfWindow; x < width - halfWindow; x++) {
      // Vérifier masque si fourni
      if (mask) {
        const maskIdx = y * width + x;
        if (mask[maskIdx] === 0) continue;
      }
      
      // Calculer moyenne fenêtre
      let sum = 0;
      let count = 0;
      
      for (let dy = -halfWindow; dy <= halfWindow; dy++) {
        for (let dx = -halfWindow; dx <= halfWindow; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
          sum += gray;
          count++;
        }
      }
      
      const mean = sum / count;
      
      // Calculer variance
      let variance = 0;
      for (let dy = -halfWindow; dy <= halfWindow; dy++) {
        for (let dx = -halfWindow; dx <= halfWindow; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
          variance += Math.pow(gray - mean, 2);
        }
      }
      
      varianceSum += variance / count;
      validPixels++;
    }
  }
  
  return validPixels > 0 ? varianceSum / validPixels : 0;
};

/**
 * Détection contours Canny (version simplifiée)
 */
const detectContoursCanny = (imageData, width, height, lowThreshold = 50, highThreshold = 150) => {
  // Conversion grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < imageData.length; i += 4) {
    const idx = i / 4;
    gray[idx] = imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
  }
  
  // Gradient Sobel (simplifié)
  const edges = new Uint8Array(width * height);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx));
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > highThreshold ? 255 : (magnitude > lowThreshold ? 128 : 0);
    }
  }
  
  return edges;
};

/**
 * Transformée Hough simplifiée pour détection lignes (veines)
 */
const houghLineTransform = (edges, width, height, threshold = 50) => {
  const maxRho = Math.sqrt(width * width + height * height);
  const rhoStep = 2;
  const thetaStep = Math.PI / 180;
  
  const accumulator = new Map();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] < 128) continue;
      
      for (let thetaIdx = 0; thetaIdx < 180; thetaIdx++) {
        const theta = thetaIdx * thetaStep;
        const rho = x * Math.cos(theta) + y * Math.sin(theta);
        const rhoIdx = Math.round(rho / rhoStep);
        
        const key = `${rhoIdx}_${thetaIdx}`;
        accumulator.set(key, (accumulator.get(key) || 0) + 1);
      }
    }
  }
  
  // Compter lignes significatives
  let lineCount = 0;
  accumulator.forEach(count => {
    if (count >= threshold) lineCount++;
  });
  
  return lineCount;
};

/**
 * FFT 2D simplifiée (calcul énergie haute fréquence)
 */
const performFFT2D = (imageData, width, height) => {
  // Version simplifiée: calcul variance haute fréquence via filtrage passe-haut
  let highFreqEnergy = 0;
  const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1]; // Laplacien simplifié
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let filtered = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          filtered += gray * kernel[kernelIdx];
        }
      }
      
      highFreqEnergy += Math.abs(filtered);
    }
  }
  
  return highFreqEnergy / (width * height);
};

/**
 * Égalisation histogramme (amélioration contraste)
 * ✅ OPTIMISATION: Ajouté au worker pour parallélisation
 */
const equalizeHistogram = (grayscale, width, height) => {
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
 * Variance Laplacienne (mesure netteté)
 */
const calculateLaplacianVariance = (imageData, width, height) => {
  const laplacian = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  let variance = 0;
  let mean = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let filtered = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          filtered += gray * laplacian[kernelIdx];
        }
      }
      
      mean += filtered;
      count++;
    }
  }
  
  mean /= count;
  
  // Calcul variance
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let filtered = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          filtered += gray * laplacian[kernelIdx];
        }
      }
      
      variance += Math.pow(filtered - mean, 2);
    }
  }
  
  return variance / count;
};

/**
 * Calcul périmètre région
 */
const calculatePerimeter = (mask, width, height) => {
  let perimeter = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (mask[idx] === 0) continue;
      
      // Compter voisins différents (bord)
      const neighbors = [
        mask[(y - 1) * width + x],     // haut
        mask[(y + 1) * width + x],     // bas
        mask[y * width + (x - 1)],     // gauche
        mask[y * width + (x + 1)]      // droite
      ];
      
      const borderCount = neighbors.filter(n => n === 0).length;
      perimeter += borderCount;
    }
  }
  
  return perimeter;
};

/**
 * Gestionnaire messages Worker
 */
self.onmessage = async (event) => {
  const { taskId, operation, ...params } = event.data;
  
  try {
    let result;
    
    switch (operation) {
      case 'countNonZeroPixels':
        result = countNonZeroPixels(params.maskData);
        break;
        
      case 'calculateLocalVariance':
        result = calculateLocalVariance(
          params.imageData,
          params.width,
          params.height,
          params.windowSize || 5,
          params.mask || null
        );
        break;
        
      case 'detectContoursCanny':
        result = detectContoursCanny(
          params.imageData,
          params.width,
          params.height,
          params.lowThreshold || 50,
          params.highThreshold || 150
        );
        // Convertir Uint8Array en Array pour transfert
        result = Array.from(result);
        break;
        
      case 'houghLineTransform':
        result = houghLineTransform(
          params.edges,
          params.width,
          params.height,
          params.threshold || 50
        );
        break;
        
      case 'performFFT2D':
        result = performFFT2D(
          params.imageData,
          params.width,
          params.height
        );
        break;
        
      case 'calculateLaplacianVariance':
        result = calculateLaplacianVariance(
          params.imageData,
          params.width,
          params.height
        );
        break;
        
      case 'calculatePerimeter':
        result = calculatePerimeter(
          params.mask,
          params.width,
          params.height
        );
        break;
        
      case 'equalizeHistogram':
        // ✅ OPTIMISATION: Égalisation histogramme dans worker
        // Paramètres: grayscale (Uint8Array), width, height
        const grayscaleArray = params.grayscale instanceof Uint8Array 
          ? params.grayscale 
          : new Uint8Array(params.grayscale);
        result = equalizeHistogram(
          grayscaleArray,
          params.width,
          params.height
        );
        // Convertir Uint8Array en Array pour transfert
        result = Array.from(result);
        break;
        
      default:
        throw new Error(`Opération inconnue: ${operation}`);
    }
    
    // Envoyer résultat
    self.postMessage({
      taskId,
      success: true,
      data: result
    });
    
  } catch (error) {
    // Envoyer erreur
    self.postMessage({
      taskId,
      success: false,
      error: error.message || 'Erreur Worker'
    });
  }
};

