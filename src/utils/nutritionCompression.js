/**
 * nutritionCompression.js
 * 
 * Utilitaires de compression/décompression JSON pour les données nutrition.
 * 
 * Utilise pako (gzip) pour réduire la taille des exports JSON (70-90% réduction).
 * Particulièrement utile pour les gros volumes de données nutrition (meals, dailyMeals, etc.).
 * 
 * Philosophie :
 * - Compression optionnelle (seuil minimum 1KB)
 * - Métadonnées complètes (taille originale, ratio, etc.)
 * - Compatible avec format existant (décompression automatique)
 * - Performance optimisée (niveau 6 = bon compromis vitesse/taille)
 * 
 * @module utils/nutritionCompression
 * @see ../../nouvelongletnutritionplan.md Section 7.0
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
 * Compresse un objet JSON
 * 
 * @param {Object} data - Objet à compresser
 * @param {Object} options - Options de compression
 * @param {number} options.level - Niveau de compression (0-9, défaut: 6)
 * @param {boolean} options.force - Forcer la compression même si petite taille
 * @param {number} options.minSize - Seuil minimum pour compression (défaut: 1024)
 * @returns {Object} Objet avec propriétés :
 *   - compressed: boolean (true si compressé)
 *   - data: string (JSON string ou base64 compressé)
 *   - originalSize: number (taille originale en bytes)
 *   - compressedSize: number (taille compressée en bytes)
 *   - compressionRatio: number (ratio compression, < 1 = réduction)
 *   - savings: number (pourcentage d'économie, 0-100)
 */
export function compressJSON(data, options = {}) {
  const { 
    level = COMPRESSION_CONFIG.level, 
    force = false,
    minSize = COMPRESSION_CONFIG.minSizeForCompression
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
        savings: 0
      };
    }

    // Convertir en Uint8Array
    const uint8Array = new TextEncoder().encode(jsonString);

    // Compresser avec gzip
    const compressed = pako.gzip(uint8Array, { level });

    // Convertir en base64
    const base64 = btoa(String.fromCharCode(...compressed));

    const compressedSize = base64.length;
    const compressionRatio = compressedSize / originalSize;
    const savings = ((1 - compressionRatio) * 100);

    log.debug('[compressJSON] Compression réussie', {
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio.toFixed(3),
      savings: savings.toFixed(1) + '%',
      level
    });

    return {
      compressed: true,
      data: base64,
      originalSize,
      compressedSize,
      compressionRatio,
      savings
    };
  } catch (error) {
    log.error('[compressJSON] Erreur lors de la compression', error);
    throw new Error(`Erreur de compression JSON: ${error.message}`);
  }
}

// ==================== DÉCOMPRESSION ====================

/**
 * Décompresse un JSON compressé
 * 
 * @param {string|Object} compressedData - Données compressées
 *   - string: base64 compressé ou JSON string avec `compressed: true`
 *   - Object: { compressed: true, data: string } ou { format: 'nutrition-compressed', data: string }
 * @returns {Object} Objet décompressé
 * @throws {Error} Si la décompression échoue
 */
export function decompressJSON(compressedData) {
  try {
    let base64Data;
    let wasCompressed = false;

    // Gérer différents formats d'entrée
    if (typeof compressedData === 'string') {
      // Essayer de parser comme JSON d'abord
      try {
        const parsed = JSON.parse(compressedData);
        if (parsed && typeof parsed === 'object') {
          if (parsed.compressed === true && parsed.data) {
            base64Data = parsed.data;
            wasCompressed = true;
          } else if (parsed.format === COMPRESSION_CONFIG.formatIdentifier && parsed.data) {
            base64Data = parsed.data;
            wasCompressed = true;
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
      } else if (compressedData.format === COMPRESSION_CONFIG.formatIdentifier && compressedData.data) {
        base64Data = compressedData.data;
        wasCompressed = true;
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

    // Convertir base64 en Uint8Array
    const binaryString = atob(base64Data);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Décompresser avec gzip
    const decompressed = pako.ungzip(uint8Array);

    // Convertir en string
    const jsonString = new TextDecoder().decode(decompressed);

    // Parser le JSON
    const result = JSON.parse(jsonString);
    
    log.debug('[decompressJSON] Décompression réussie', {
      originalSize: base64Data.length,
      decompressedSize: jsonString.length
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
 * @returns {Object} Export compressé avec métadonnées :
 *   - version: string
 *   - format: 'nutrition-compressed'
 *   - compressed: boolean
 *   - originalSize: number
 *   - compressedSize: number
 *   - compressionRatio: number
 *   - savings: number (pourcentage)
 *   - exportDate: string (ISO)
 *   - data: string (base64 compressé)
 */
export function compressNutritionExport(exportData, options = {}) {
  const compressed = compressJSON(exportData, options);

  return {
    version: COMPRESSION_CONFIG.formatVersion,
    format: COMPRESSION_CONFIG.formatIdentifier,
    compressed: compressed.compressed,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    compressionRatio: compressed.compressionRatio,
    savings: compressed.savings,
    exportDate: new Date().toISOString(),
    data: compressed.data
  };
}

/**
 * Décompresse un export nutrition compressé
 * 
 * @param {Object|string} compressedExport - Export compressé
 * @returns {Object} Données d'export décompressées (format de `useNutritionData.exportAll()`)
 */
export function decompressNutritionExport(compressedExport) {
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
    return decompressJSON(dataToDecompress.data);
  }

  // Sinon, décompresser directement
  return decompressJSON(dataToDecompress);
}

// ==================== EXPORTS ====================

export default {
  isCompressed,
  compressJSON,
  decompressJSON,
  compressNutritionExport,
  decompressNutritionExport,
  COMPRESSION_CONFIG
};

