/**
 * Service Wrapper pour Workers Métriques
 * 
 * Utilise Web Workers pour calculs lourds d'extraction métriques
 * Fallback sur code principal si workers indisponibles
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import logger from '../../../utils/logger';
import { getPerformanceMonitor } from './performanceMonitor';

const log = logger.module('MetricsWorkerService');
const perfMonitor = getPerformanceMonitor();
import { getWorkerPool } from '../workers/workerPool';
import {
  countNonZeroPixels,
  calculateLocalVariance,
  detectContoursCanny,
  houghLineTransform,
  performFFT2D,
  calculateLaplacianVariance,
  calculatePerimeter
} from './imageAnalysisUtils';

// Worker script path (Vite compatible)
// Vite peut charger workers depuis src/ avec new Worker()
let workerScript = null;
try {
  // Utiliser chemin relatif depuis import.meta.url
  // Vite transformera automatiquement en chemin correct
  workerScript = new URL('../workers/metricsWorker.js', import.meta.url).href;
} catch (error) {
  log.warn('Workers non disponibles, utilisation fallback synchrone:', error);
}

let workerPool = null;

/**
 * Initialise Worker Pool si disponible
 */
const initializeWorkerPool = () => {
  if (!workerScript) {
    log.warn('Worker script non disponible, fallback synchrone');
    return false;
  }
  
  try {
    if (!workerPool) {
      workerPool = getWorkerPool(workerScript, {
        maxWorkers: Math.min(4, navigator.hardwareConcurrency || 2),
        timeout: 60000 // 60s
      });
      log.info('Worker Pool initialisé pour métriques');
    }
    return true;
  } catch (error) {
    log.error('Erreur initialisation Worker Pool:', error);
    return false;
  }
};

/**
 * Obtient Worker Pool (initialise si nécessaire)
 */
const getPool = () => {
  if (!workerPool) {
    initializeWorkerPool();
  }
  return workerPool;
};

/**
 * Convertit ImageData/Canvas en format transférable pour Worker
 */
const prepareImageDataForWorker = (imageData, width, height) => {
  if (imageData instanceof HTMLCanvasElement) {
    const ctx = imageData.getContext('2d');
    const imgData = ctx.getImageData(0, 0, imageData.width, imageData.height);
    return {
      data: Array.from(imgData.data),
      width: imageData.width,
      height: imageData.height
    };
  } else if (imageData && imageData.data) {
    return {
      data: imageData.data instanceof Uint8Array ? Array.from(imageData.data) : imageData.data,
      width: imageData.width || width,
      height: imageData.height || height
    };
  }
  
  throw new Error('Format imageData non supporté');
};

/**
 * Convertit masque en format transférable
 */
const prepareMaskForWorker = (mask) => {
  if (!mask || !mask.data) return null;
  
  return {
    data: mask.data instanceof Uint8Array ? Array.from(mask.data) : mask.data,
    width: mask.width,
    height: mask.height
  };
};

/**
 * Wrapper async pour countNonZeroPixels avec Worker
 */
export const countNonZeroPixelsAsync = async (mask) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return countNonZeroPixels(mask);
  }
  
  try {
    const maskData = prepareMaskForWorker(mask);
    if (!maskData) return 0;
    
    const startTime = performance.now();
    const result = await pool.execute({
      operation: 'countNonZeroPixels',
      maskData: maskData.data
    });
    const endTime = performance.now();
    
    perfMonitor.recordWorkerTask(`countNonZeroPixels_${Date.now()}`, startTime, endTime);
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker countNonZeroPixels, fallback synchrone:', error);
    return countNonZeroPixels(mask);
  }
};

/**
 * Wrapper async pour calculateLocalVariance avec Worker
 */
export const calculateLocalVarianceAsync = async (imageData, windowSize = 5, mask = null) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return calculateLocalVariance(imageData, windowSize, mask);
  }
  
  try {
    const prepared = prepareImageDataForWorker(imageData);
    const preparedMask = prepareMaskForWorker(mask);
    
    const result = await pool.execute({
      operation: 'calculateLocalVariance',
      imageData: prepared.data,
      width: prepared.width,
      height: prepared.height,
      windowSize,
      mask: preparedMask ? preparedMask.data : null
    });
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker calculateLocalVariance, fallback synchrone:', error);
    return calculateLocalVariance(imageData, windowSize, mask);
  }
};

/**
 * Wrapper async pour detectContoursCanny avec Worker
 */
export const detectContoursCannyAsync = async (imageData, lowThreshold = 50, highThreshold = 150) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return detectContoursCanny(imageData, lowThreshold, highThreshold);
  }
  
  try {
    const prepared = prepareImageDataForWorker(imageData);
    
    const result = await pool.execute({
      operation: 'detectContoursCanny',
      imageData: prepared.data,
      width: prepared.width,
      height: prepared.height,
      lowThreshold,
      highThreshold
    });
    
    // Convertir Array retourné en Uint8Array
    return new Uint8Array(result);
  } catch (error) {
    log.warn('Erreur Worker detectContoursCanny, fallback synchrone:', error);
    return detectContoursCanny(imageData, lowThreshold, highThreshold);
  }
};

/**
 * Wrapper async pour houghLineTransform avec Worker
 */
export const houghLineTransformAsync = async (edges, width, height, threshold = 50) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return houghLineTransform(edges, width, height, threshold);
  }
  
  try {
    const edgesArray = edges instanceof Uint8Array ? Array.from(edges) : edges;
    
    const result = await pool.execute({
      operation: 'houghLineTransform',
      edges: edgesArray,
      width,
      height,
      threshold
    });
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker houghLineTransform, fallback synchrone:', error);
    return houghLineTransform(edges, width, height, threshold);
  }
};

/**
 * Wrapper async pour performFFT2D avec Worker
 */
export const performFFT2DAsync = async (imageData) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return performFFT2D(imageData);
  }
  
  try {
    const prepared = prepareImageDataForWorker(imageData);
    
    const result = await pool.execute({
      operation: 'performFFT2D',
      imageData: prepared.data,
      width: prepared.width,
      height: prepared.height
    });
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker performFFT2D, fallback synchrone:', error);
    return performFFT2D(imageData);
  }
};

/**
 * Wrapper async pour calculateLaplacianVariance avec Worker
 */
export const calculateLaplacianVarianceAsync = async (imageData) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return calculateLaplacianVariance(imageData);
  }
  
  try {
    const prepared = prepareImageDataForWorker(imageData);
    
    const result = await pool.execute({
      operation: 'calculateLaplacianVariance',
      imageData: prepared.data,
      width: prepared.width,
      height: prepared.height
    });
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker calculateLaplacianVariance, fallback synchrone:', error);
    return calculateLaplacianVariance(imageData);
  }
};

/**
 * Wrapper async pour calculatePerimeter avec Worker
 */
export const calculatePerimeterAsync = async (mask, width, height) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    return calculatePerimeter(mask, width, height);
  }
  
  try {
    const maskData = prepareMaskForWorker(mask);
    if (!maskData) return 0;
    
    const result = await pool.execute({
      operation: 'calculatePerimeter',
      mask: maskData.data,
      width: maskData.width,
      height: maskData.height
    });
    
    return result;
  } catch (error) {
    log.warn('Erreur Worker calculatePerimeter, fallback synchrone:', error);
    return calculatePerimeter(mask, width, height);
  }
};

/**
 * Wrapper async pour equalizeHistogram avec Worker
 * ✅ OPTIMISATION: Égalisation histogramme dans worker (calcul pixel-level lourd)
 */
export const equalizeHistogramAsync = async (grayscale, width, height) => {
  const pool = getPool();
  
  if (!pool) {
    // Fallback synchrone
    const { equalizeHistogram } = await import('./imageAnalysisUtils');
    return equalizeHistogram(grayscale, width, height);
  }
  
  try {
    // Convertir Uint8Array en Array pour transfert
    const grayscaleArray = grayscale instanceof Uint8Array 
      ? Array.from(grayscale) 
      : grayscale;
    
    const startTime = performance.now();
    const result = await pool.execute({
      operation: 'equalizeHistogram',
      grayscale: grayscaleArray,
      width,
      height
    });
    const endTime = performance.now();
    
    perfMonitor.recordWorkerTask(`equalizeHistogram_${Date.now()}`, startTime, endTime);
    
    // Convertir Array retourné en Uint8Array
    return new Uint8Array(result);
  } catch (error) {
    log.warn('Erreur Worker equalizeHistogram, fallback synchrone:', error);
    const { equalizeHistogram } = await import('./imageAnalysisUtils');
    return equalizeHistogram(grayscale, width, height);
  }
};

/**
 * Obtient statistiques Worker Pool
 */
export const getWorkerStats = () => {
  const pool = getPool();
  return pool ? pool.getStats() : null;
};

/**
 * Termine Worker Pool (nettoyage)
 */
export const terminateWorkers = () => {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
};

// Initialisation automatique
if (typeof window !== 'undefined') {
  // Initialiser au chargement
  initializeWorkerPool();
  
  // Nettoyer à la fermeture
  window.addEventListener('beforeunload', () => {
    terminateWorkers();
  });
}

