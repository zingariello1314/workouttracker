/**
 * budgetCompression.js
 * 
 * Utilitaires de compression/décompression pour les données Budget Personnel
 * 
 * ✅ SOLUTION 1.18 : Compression Données IndexedDB
 * 
 * Utilise CompressionStream API (natif navigateur) pour compression gzip asynchrone et rapide.
 * Fallback sur pako (gzip) si CompressionStream non disponible.
 * 
 * Philosophie :
 * - Compression seulement pour données volumineuses (historique, grandes listes)
 * - Détection automatique CompressionStream API
 * - Fallback gracieux sur pako si non disponible
 * - Compression optionnelle (seuil minimum 2KB pour éviter overhead)
 * - Métadonnées complètes (taille originale, ratio, méthode utilisée)
 * - Compatible avec données existantes (décompression automatique)
 * - Performance optimisée (compression asynchrone quand possible)
 * 
 * @module services/finance/budgetCompression
 */

import pako from 'pako';
import logger from '../../utils/logger';

const log = logger.module('budgetCompression');

// ==================== CONFIGURATION ====================

/**
 * Configuration de compression pour Budget
 */
const COMPRESSION_CONFIG = {
  // Niveau de compression (0-9, 6 par défaut = bon compromis vitesse/taille)
  level: 6,
  
  // Seuil minimum de taille pour activer la compression (bytes)
  // En dessous de ce seuil, la compression n'est pas activée (overhead trop important)
  minSizeForCompression: 2048, // 2 KB (plus élevé que nutrition car données Budget moins volumineuses)
  
  // Format version pour compatibilité future
  formatVersion: '1.0',
  formatIdentifier: 'budget-compressed'
};

// ==================== DÉTECTION ====================

/**
 * Vérifie si CompressionStream API est disponible
 * 
 * @returns {boolean} true si disponible
 */
function isCompressionStreamAvailable() {
  return typeof CompressionStream !== 'undefined' && 
         typeof DecompressionStream !== 'undefined';
}

/**
 * Vérifie si des données sont compressées
 * 
 * @param {string|Object} data - Données à vérifier
 * @returns {boolean} true si compressé
 */
export function isCompressed(data) {
  if (!data) return false;
  
  // Si c'est un objet avec propriété compressed
  if (typeof data === 'object' && data.compressed === true) {
    return true;
  }
  
  // Si c'est un objet avec formatIdentifier
  if (typeof data === 'object' && data.format === COMPRESSION_CONFIG.formatIdentifier) {
    return true;
  }
  
  // Si c'est une string, vérifier si c'est du JSON avec compressed: true
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' && 
             (parsed.compressed === true || parsed.format === COMPRESSION_CONFIG.formatIdentifier);
    } catch {
      // Si ce n'est pas du JSON, peut-être du base64 gzip
      // Les données gzip en base64 commencent généralement par "H4sI"
      return data.startsWith('H4sI') || 
             (data.length > 100 && /^[A-Za-z0-9+/=]+$/.test(data));
    }
  }
  
  return false;
}

// ==================== COMPRESSION ====================

/**
 * Compresse des données avec CompressionStream API (natif, asynchrone)
 * 
 * @param {string} data - Données à compresser (JSON string)
 * @returns {Promise<Object>} Objet avec propriétés compressées
 */
async function compressWithStream(data) {
  try {
    const originalSize = new Blob([data]).size;
    
    // Convertir en blob
    const blob = new Blob([data], { type: 'application/json' });
    
    // Compresser avec CompressionStream (gzip)
    const compressionStream = blob.stream().pipeThrough(
      new CompressionStream('gzip')
    );
    
    // Convertir stream en blob
    const compressedBlob = await new Response(compressionStream).blob();
    
    // Convertir blob en ArrayBuffer puis base64
    const arrayBuffer = await compressedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
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
      format: COMPRESSION_CONFIG.formatIdentifier,
      formatVersion: COMPRESSION_CONFIG.formatVersion,
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
 * @returns {Object} Objet avec propriétés compressées
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
      format: COMPRESSION_CONFIG.formatIdentifier,
      formatVersion: COMPRESSION_CONFIG.formatVersion,
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
 * @param {number} options.minSize - Seuil minimum pour compression (défaut: 2048)
 * @param {boolean} options.preferStream - Préférer CompressionStream si disponible (défaut: true)
 * @returns {Promise<Object>} Objet avec propriétés :
 *   - compressed: boolean (true si compressé)
 *   - data: string (JSON string ou base64 compressé)
 *   - originalSize: number (taille originale en bytes)
 *   - compressedSize: number (taille compressée en bytes)
 *   - compressionRatio: number (ratio compression, < 1 = réduction)
 *   - savings: number (pourcentage d'économie, 0-100)
 *   - method: string ('compressionstream', 'pako', ou 'none')
 */
export async function compressBudgetData(data, options = {}) {
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
      log.debug('[compressBudgetData] Taille trop petite, compression non activée', { 
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

    log.debug('[compressBudgetData] Compression réussie', {
      originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio.toFixed(3),
      savings: result.savings.toFixed(1) + '%',
      method: result.method
    });

    return result;
  } catch (error) {
    log.error('[compressBudgetData] Erreur lors de la compression', error);
    // En cas d'erreur de compression, retourner données non-compressées
    log.warn('[compressBudgetData] Fallback sur données non-compressées');
    const jsonString = JSON.stringify(data);
    return {
      compressed: false,
      data: jsonString,
      originalSize: new Blob([jsonString]).size,
      compressedSize: new Blob([jsonString]).size,
      compressionRatio: 1.0,
      savings: 0,
      method: 'none',
      error: error.message
    };
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
 *   - Object: { compressed: true, data: string } ou { format: 'budget-compressed', data: string }
 * @param {Object} options - Options de décompression
 * @param {string} options.method - Méthode de compression ('compressionstream' ou 'pako')
 * @param {boolean} options.preferStream - Préférer DecompressionStream si disponible (défaut: true)
 * @returns {Promise<Object>} Objet décompressé
 * @throws {Error} Si la décompression échoue
 */
export async function decompressBudgetData(compressedData, options = {}) {
  const { 
    method,
    preferStream = true 
  } = options;

  try {
    // Extraire les données et métadonnées
    let base64Data;
    let compressionMethod;
    
    if (typeof compressedData === 'string') {
      // String : peut être JSON avec métadonnées ou base64 brut
      try {
        const parsed = JSON.parse(compressedData);
        if (parsed && typeof parsed === 'object' && parsed.compressed) {
          base64Data = parsed.data;
          compressionMethod = parsed.method;
        } else {
          // Pas compressé, retourner tel quel
          return parsed;
        }
      } catch {
        // Pas du JSON, peut-être du base64 brut
        base64Data = compressedData;
        compressionMethod = method;
      }
    } else if (compressedData && typeof compressedData === 'object') {
      // Objet avec métadonnées
      if (compressedData.compressed || compressedData.format === COMPRESSION_CONFIG.formatIdentifier) {
        base64Data = compressedData.data;
        compressionMethod = compressedData.method || method;
      } else {
        // Pas compressé, retourner tel quel
        return compressedData;
      }
    } else {
      // Données invalides
      throw new Error('Données compressées invalides');
    }

    // Choisir méthode de décompression
    const useStream = preferStream && 
                      isCompressionStreamAvailable() && 
                      (compressionMethod === 'compressionstream' || !compressionMethod);

    let jsonString;
    if (useStream) {
      jsonString = await decompressWithStream(base64Data);
    } else {
      jsonString = decompressWithPako(base64Data);
    }

    // Parser JSON
    const data = JSON.parse(jsonString);
    
    log.debug('[decompressBudgetData] Décompression réussie', {
      method: useStream ? 'decompressionstream' : 'pako',
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataSize: Array.isArray(data) ? data.length : 'object'
    });

    return data;
  } catch (error) {
    log.error('[decompressBudgetData] Erreur lors de la décompression', error);
    throw new Error(`Erreur de décompression Budget: ${error.message}`);
  }
}

/**
 * Compresse ou décompresse automatiquement selon le type de données
 * 
 * Utile pour wrapper les données avant sauvegarde/après chargement
 * 
 * @param {*} data - Données à traiter
 * @param {boolean} compress - true pour compresser, false pour décompresser
 * @param {Object} options - Options de compression/décompression
 * @returns {Promise<*>} Données traitées
 */
export async function processBudgetData(data, compress = true, options = {}) {
  if (compress) {
    return compressBudgetData(data, options);
  } else {
    return decompressBudgetData(data, options);
  }
}

