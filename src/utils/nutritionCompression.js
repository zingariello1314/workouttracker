/**
 * nutritionCompression.js
 * 
 * Utilitaires de compression/décompression JSON pour les données nutrition.
 * 
 * Utilise CompressionStream API (natif navigateur) pour compression gzip asynchrone et rapide.
 * Fallback sur pako (gzip) si CompressionStream non disponible (navigateurs anciens).
 * 
 * Avantages CompressionStream API :
 * - Natif navigateur (pas de bibliothèque externe)
 * - Asynchrone (streams, non-bloquant)
 * - Plus rapide que pako synchrone
 * - Meilleure gestion mémoire (streaming)
 * 
 * Particulièrement utile pour les gros volumes de données nutrition (meals, dailyMeals, etc.).
 * Réduction 70-90% de la taille des exports JSON.
 * 
 * Philosophie :
 * - Détection automatique CompressionStream API
 * - Fallback gracieux sur pako si non disponible
 * - Compression optionnelle (seuil minimum 1KB)
 * - Métadonnées complètes (taille originale, ratio, méthode utilisée)
 * - Compatible avec format existant (décompression automatique)
 * - Performance optimisée (compression asynchrone quand possible)
 * 
 * @module utils/nutritionCompression
 * @see ../../nouvelongletnutritionplan.md Section 7.2
 */

import pako from 'pako';
import logger from './logger';

const log = logger.module('nutritionCompression');

// ==================== CONFIGURATION ====================

/**
 * Configuration de compression
 */
const COMPRESSION_CONFIG = {
  // Niveau de compression (0-9, 6 par défaut = bon compromis vitesse/taille)
  // 0 = pas de compression (rapide), 9 = compression max (lent)
  level: 6,
  
  // Seuil minimum de taille pour activer la compression (bytes)
  // En dessous de ce seuil, la compression n'est pas activée (overhead trop important)
  minSizeForCompression: 1024, // 1 KB
  
  // Format version pour compatibilité future
  formatVersion: '1.0',
  formatIdentifier: 'nutrition-compressed'
};

// ==================== DÉTECTION ====================

/**
 * Vérifie si CompressionStream API est disponible
 * 
 * @returns {boolean} True si CompressionStream API est disponible
 */
export function isCompressionStreamAvailable() {
  return typeof CompressionStream !== 'undefined' && 
         typeof DecompressionStream !== 'undefined';
}

/**
 * Convertit un Blob en base64
 * 
 * @param {Blob} blob - Blob à convertir
 * @returns {Promise<string>} Base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]; // Retirer le préfixe data:...
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Détecte si des données sont compressées
 * 
 * @param {string|Object} data - Données à vérifier
 * @returns {boolean} True si les données sont compressées
 */
export function isCompressed(data) {
  if (!data) return false;
  
  if (typeof data === 'string') {
    // Vérifier si c'est un JSON avec propriété compressed
    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' && parsed.compressed === true;
    } catch {
      // Si ce n'est pas du JSON, vérifier si c'est du base64 gzip (commence par "H4sI")
      return data.startsWith('H4sI') || (data.length > 100 && /^[A-Za-z0-9+/=]+$/.test(data));
    }
  }
  
  if (typeof data === 'object') {
    // Vérifier format compressé avec métadonnées
    return data.compressed === true || 
           (data.format === COMPRESSION_CONFIG.formatIdentifier && data.data);
  }
  
  return false;
}

// ==================== COMPRESSION ====================

/**
 * Compresse des données avec CompressionStream API (natif, asynchrone)
 * 
 * @param {string} data - Données à compresser (JSON string)
 * @returns {Promise<Object>} Objet avec propriétés :
 *   - compressed: boolean (true)
 *   - data: string (base64 compressé)
 *   - originalSize: number (taille originale en bytes)
 *   - compressedSize: number (taille compressée en bytes)
 *   - compressionRatio: number (ratio compression, < 1 = réduction)
 *   - savings: number (pourcentage d'économie, 0-100)
 *   - method: string ('compressionstream')
 */
async function compressWithStream(data) {
  try {
    const originalSize = new Blob([data]).size;
    
    // Créer blob avec données
    const blob = new Blob([data], { type: 'application/json' });
    
    // Compresser avec CompressionStream (gzip)
    const compressionStream = blob.stream().pipeThrough(
      new CompressionStream('gzip')
    );
    
    // Convertir stream en blob
    const compressedBlob = await new Response(compressionStream).blob();
    
    // Convertir blob en base64
    const base64 = await blobToBase64(compressedBlob);
    
    const compressedSize = base64.length;
    const compressionRatio = compressedSize / originalSize;
    const savings = ((1 - compressionRatio) * 100);
    
    log.debug('[compressWithStream] Compression réussie avec CompressionStream', {
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio.toFixed(3),
      savings: savings.toFixed(1) + '%',
      method: 'compressionstream'
    });
    
    return {
      compressed: true,
      data: base64,
      originalSize,
      compressedSize,
      compressionRatio,
      savings,
      method: 'compressionstream'
    };
  } catch (error) {
    log.error('[compressWithStream] Erreur lors de la compression avec CompressionStream', error);
    throw new Error(`Erreur de compression avec CompressionStream: ${error.message}`);
  }
}

/**
 * Compresse des données avec pako (gzip) - Fallback
 * 
 * @param {string} data - Données à compresser (JSON string)
 * @param {Object} options - Options de compression
 * @param {number} options.level - Niveau de compression (0-9)
 * @returns {Object} Objet avec propriétés :
 *   - compressed: boolean (true)
 *   - data: string (base64 compressé)
 *   - originalSize: number (taille originale en bytes)
 *   - compressedSize: number (taille compressée en bytes)
 *   - compressionRatio: number (ratio compression, < 1 = réduction)
 *   - savings: number (pourcentage d'économie, 0-100)
 *   - method: string ('pako')
 */
function compressWithPako(data, options = {}) {
  const { level = COMPRESSION_CONFIG.level } = options;
  
  try {
    const originalSize = new Blob([data]).size;
    
    // Convertir en Uint8Array
    const uint8Array = new TextEncoder().encode(data);
    
    // Compresser avec gzip
    const compressed = pako.gzip(uint8Array, { level });
    
    // Convertir en base64
    const base64 = btoa(String.fromCharCode(...compressed));
    
    const compressedSize = base64.length;
    const compressionRatio = compressedSize / originalSize;
    const savings = ((1 - compressionRatio) * 100);
    
    log.debug('[compressWithPako] Compression réussie avec pako', {
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio.toFixed(3),
      savings: savings.toFixed(1) + '%',
      level,
      method: 'pako'
    });
    
    return {
      compressed: true,
      data: base64,
      originalSize,
      compressedSize,
      compressionRatio,
      savings,
      method: 'pako'
    };
  } catch (error) {
    log.error('[compressWithPako] Erreur lors de la compression avec pako', error);
    throw new Error(`Erreur de compression avec pako: ${error.message}`);
  }
}

/**
 * Compresse un objet JSON avec la meilleure méthode disponible
 * 
 * @param {Object} data - Objet à compresser
 * @param {Object} options - Options de compression
 * @param {number} options.level - Niveau de compression (0-9, défaut: 6) - Uniquement pour pako
 * @param {boolean} options.force - Forcer la compression même si petite taille
 * @param {number} options.minSize - Seuil minimum pour compression (défaut: 1024)
 * @param {boolean} options.preferStream - Préférer CompressionStream si disponible (défaut: true)
 * @returns {Promise<Object>} Objet avec propriétés :
 *   - compressed: boolean (true si compressé)
 *   - data: string (JSON string ou base64 compressé)
 *   - originalSize: number (taille originale en bytes)
 *   - compressedSize: number (taille compressée en bytes)
 *   - compressionRatio: number (ratio compression, < 1 = réduction)
 *   - savings: number (pourcentage d'économie, 0-100)
 *   - method: string ('compressionstream' ou 'pako')
 */
export async function compressJSON(data, options = {}) {
  const { 
    level = COMPRESSION_CONFIG.level, 
    force = false,
    minSize = COMPRESSION_CONFIG.minSizeForCompression,
    preferStream = true
  } = options;

  try {
    // Sérialiser en JSON
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    // Vérifier si la compression est nécessaire
    if (!force && originalSize < minSize) {
      log.debug('[compressJSON] Taille trop petite, compression non activée', { 
        originalSize,
        minSize 
      });
      return {
        compressed: false,
        data: jsonString,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1.0,
        savings: 0,
        method: 'none'
      };
    }

    // Choisir méthode de compression
    const useStream = preferStream && isCompressionStreamAvailable();

    let result;
    if (useStream) {
      // Utiliser CompressionStream API (natif, asynchrone, plus rapide)
      result = await compressWithStream(jsonString);
    } else {
      // Utiliser pako (fallback, synchrone, compatible)
      result = compressWithPako(jsonString, { level });
    }

    log.debug('[compressJSON] Compression réussie', {
      originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio.toFixed(3),
      savings: result.savings.toFixed(1) + '%',
      method: result.method
    });

    return result;
  } catch (error) {
    log.error('[compressJSON] Erreur lors de la compression', error);
    throw new Error(`Erreur de compression JSON: ${error.message}`);
  }
}

// ==================== DÉCOMPRESSION ====================

/**
 * Décompresse des données avec DecompressionStream API (natif, asynchrone)
 * 
 * @param {string} base64Data - Données compressées (base64)
 * @returns {Promise<string>} Données décompressées (JSON string)
 */
async function decompressWithStream(base64Data) {
  try {
    // Convertir base64 en Uint8Array
    const binaryString = atob(base64Data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    // Créer blob avec données compressées
    const blob = new Blob([uint8Array], { type: 'application/gzip' });
    
    // Décompresser avec DecompressionStream (gzip)
    const decompressionStream = blob.stream().pipeThrough(
      new DecompressionStream('gzip')
    );
    
    // Convertir stream en blob
    const decompressedBlob = await new Response(decompressionStream).blob();
    
    // Convertir blob en string
    const text = await decompressedBlob.text();
    
    log.debug('[decompressWithStream] Décompression réussie avec DecompressionStream', {
      originalSize: base64Data.length,
      decompressedSize: text.length,
      method: 'decompressionstream'
    });
    
    return text;
  } catch (error) {
    log.error('[decompressWithStream] Erreur lors de la décompression avec DecompressionStream', error);
    throw new Error(`Erreur de décompression avec DecompressionStream: ${error.message}`);
  }
}

/**
 * Décompresse des données avec pako (gzip) - Fallback
 * 
 * @param {string} base64Data - Données compressées (base64)
 * @returns {string} Données décompressées (JSON string)
 */
function decompressWithPako(base64Data) {
  try {
    // Convertir base64 en Uint8Array
    const binaryString = atob(base64Data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    // Décompresser avec gzip
    const decompressed = pako.ungzip(uint8Array);
    
    // Convertir en string
    const text = new TextDecoder().decode(decompressed);
    
    log.debug('[decompressWithPako] Décompression réussie avec pako', {
      originalSize: base64Data.length,
      decompressedSize: text.length,
      method: 'pako'
    });
    
    return text;
  } catch (error) {
    log.error('[decompressWithPako] Erreur lors de la décompression avec pako', error);
    throw new Error(`Erreur de décompression avec pako: ${error.message}`);
  }
}

/**
 * Décompresse un JSON compressé avec la meilleure méthode disponible
 * 
 * @param {string|Object} compressedData - Données compressées
 *   - string: base64 compressé ou JSON string avec `compressed: true`
 *   - Object: { compressed: true, data: string } ou { format: 'nutrition-compressed', data: string }
 * @param {Object} options - Options de décompression
 * @param {string} options.method - Méthode de compression ('compressionstream' ou 'pako')
 * @param {boolean} options.preferStream - Préférer DecompressionStream si disponible (défaut: true)
 * @returns {Promise<Object>} Objet décompressé
 * @throws {Error} Si la décompression échoue
 */
export async function decompressJSON(compressedData, options = {}) {
  const {
    method = null,
    preferStream = true
  } = options;

  try {
    let base64Data;
    let wasCompressed = false;
    let detectedMethod = method;

    // Gérer différents formats d'entrée
    if (typeof compressedData === 'string') {
      // Essayer de parser comme JSON d'abord
      try {
        const parsed = JSON.parse(compressedData);
        if (parsed && typeof parsed === 'object') {
          if (parsed.compressed === true && parsed.data) {
            base64Data = parsed.data;
            wasCompressed = true;
            detectedMethod = parsed.method || method;
          } else if (parsed.format === COMPRESSION_CONFIG.formatIdentifier && parsed.data) {
            base64Data = parsed.data;
            wasCompressed = true;
            detectedMethod = parsed.method || method;
          } else {
            // Ce n'est pas compressé, retourner tel quel
            return parsed;
          }
        } else {
          // Ce n'est pas un objet, traiter comme base64 direct
          base64Data = compressedData;
          wasCompressed = true;
        }
      } catch {
        // Ce n'est pas du JSON, traiter comme base64 direct
        base64Data = compressedData;
        wasCompressed = true;
      }
    } else if (compressedData && typeof compressedData === 'object') {
      if (compressedData.compressed === true && compressedData.data) {
        base64Data = compressedData.data;
        wasCompressed = true;
        detectedMethod = compressedData.method || method;
      } else if (compressedData.format === COMPRESSION_CONFIG.formatIdentifier && compressedData.data) {
        base64Data = compressedData.data;
        wasCompressed = true;
        detectedMethod = compressedData.method || method;
      } else {
        // Objet non compressé, retourner tel quel
        return compressedData;
      }
    } else {
      throw new Error('Format de données invalide pour décompression');
    }

    if (!wasCompressed) {
      return compressedData;
    }

    // Choisir méthode de décompression
    const useStream = preferStream && 
                      detectedMethod !== 'pako' && // Si méthode pako explicitement, utiliser pako
                      isCompressionStreamAvailable();

    let jsonString;
    if (useStream && detectedMethod !== 'pako') {
      // Utiliser DecompressionStream API (natif, asynchrone, plus rapide)
      jsonString = await decompressWithStream(base64Data);
    } else {
      // Utiliser pako (fallback, synchrone, compatible)
      jsonString = decompressWithPako(base64Data);
    }

    // Parser le JSON
    const result = JSON.parse(jsonString);
    
    log.debug('[decompressJSON] Décompression réussie', {
      originalSize: base64Data.length,
      decompressedSize: jsonString.length,
      method: useStream && detectedMethod !== 'pako' ? 'decompressionstream' : 'pako'
    });

    return result;
  } catch (error) {
    log.error('[decompressJSON] Erreur lors de la décompression', error);
    throw new Error(`Erreur de décompression JSON: ${error.message}`);
  }
}

// ==================== EXPORT NUTRITION ====================

/**
 * Compresse un export nutrition complet avec métadonnées
 * 
 * @param {Object} exportData - Données d'export (format de `useNutritionData.exportAll()`)
 * @param {Object} options - Options de compression
 * @returns {Promise<Object>} Export compressé avec métadonnées :
 *   - version: string
 *   - format: 'nutrition-compressed'
 *   - compressed: boolean
 *   - originalSize: number
 *   - compressedSize: number
 *   - compressionRatio: number
 *   - savings: number (pourcentage)
 *   - method: string ('compressionstream' ou 'pako')
 *   - exportDate: string (ISO)
 *   - data: string (base64 compressé)
 */
export async function compressNutritionExport(exportData, options = {}) {
  const compressed = await compressJSON(exportData, options);

  return {
    version: COMPRESSION_CONFIG.formatVersion,
    format: COMPRESSION_CONFIG.formatIdentifier,
    compressed: compressed.compressed,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    compressionRatio: compressed.compressionRatio,
    savings: compressed.savings,
    method: compressed.method || 'pako',
    exportDate: new Date().toISOString(),
    data: compressed.data
  };
}

/**
 * Décompresse un export nutrition compressé
 * 
 * @param {Object|string} compressedExport - Export compressé
 * @returns {Promise<Object>} Données d'export décompressées (format de `useNutritionData.exportAll()`)
 */
export async function decompressNutritionExport(compressedExport) {
  let dataToDecompress;

  if (typeof compressedExport === 'string') {
    try {
      dataToDecompress = JSON.parse(compressedExport);
    } catch {
      // Traiter comme base64 direct (format legacy)
      dataToDecompress = { compressed: true, data: compressedExport };
    }
  } else {
    dataToDecompress = compressedExport;
  }

  // Si c'est un export avec métadonnées
  if (dataToDecompress.format === COMPRESSION_CONFIG.formatIdentifier && dataToDecompress.data) {
    return await decompressJSON(dataToDecompress.data, {
      method: dataToDecompress.method
    });
  }

  // Sinon, décompresser directement (détection automatique)
  return await decompressJSON(dataToDecompress);
}

// ==================== EXPORTS ====================

export default {
  isCompressionStreamAvailable,
  isCompressed,
  compressJSON,
  decompressJSON,
  compressNutritionExport,
  decompressNutritionExport,
  COMPRESSION_CONFIG
};

