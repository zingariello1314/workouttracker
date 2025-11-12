/**
 * Utilitaires de compression/décompression JSON avec pako.
 * 
 * Utilise la compression gzip pour réduire la taille des exports JSON,
 * particulièrement utile pour les gros volumes de données Garmin.
 * 
 * @module jsonCompression
 */

import pako from 'pako';
import logger from '../../../../utils/logger';

const log = logger.module('jsonCompression');

/**
 * Configuration de compression
 */
const COMPRESSION_CONFIG = {
  // Niveau de compression (0-9, 6 par défaut = bon compromis vitesse/taille)
  level: 6,
  
  // Seuil minimum de taille pour activer la compression (bytes)
  // En dessous de ce seuil, la compression n'est pas activée
  minSizeForCompression: 1024, // 1 KB
};

/**
 * Détecte si une chaîne est du JSON compressé (base64 + gzip)
 * 
 * @param {string} data - Données à vérifier
 * @returns {boolean} True si les données semblent compressées
 */
export function isCompressed(data) {
  if (typeof data !== 'string') {
    return false;
  }

  // Les données compressées commencent généralement par "H4sI" (gzip en base64)
  // ou sont un objet avec une propriété `compressed: true`
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' && parsed.compressed === true;
  } catch {
    // Si ce n'est pas du JSON, vérifier si c'est du base64 gzip
    return data.startsWith('H4sI') || data.length > 100 && /^[A-Za-z0-9+/=]+$/.test(data);
  }
}

/**
 * Compresse un objet JSON en base64 gzip
 * 
 * @param {Object} data - Objet à compresser
 * @param {Object} options - Options de compression
 * @param {number} options.level - Niveau de compression (0-9)
 * @param {boolean} options.force - Forcer la compression même si petite taille
 * @returns {Object} Objet avec propriétés `compressed: true`, `data: string` (base64), `originalSize: number`, `compressedSize: number`
 */
export function compressJSON(data, options = {}) {
  const { level = COMPRESSION_CONFIG.level, force = false } = options;

  try {
    // Sérialiser en JSON
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    // Vérifier si la compression est nécessaire
    if (!force && originalSize < COMPRESSION_CONFIG.minSizeForCompression) {
      log.debug('[compressJSON] Taille trop petite, compression non activée', { originalSize });
      return {
        compressed: false,
        data: jsonString,
        originalSize,
        compressedSize: originalSize
      };
    }

    // Convertir en Uint8Array
    const uint8Array = new TextEncoder().encode(jsonString);

    // Compresser avec gzip
    const compressed = pako.gzip(uint8Array, { level });

    // Convertir en base64
    const base64 = btoa(String.fromCharCode(...compressed));

    const compressedSize = base64.length;

    log.debug('[compressJSON] Compression réussie', {
      originalSize,
      compressedSize,
      ratio: ((1 - compressedSize / originalSize) * 100).toFixed(2) + '%'
    });

    return {
      compressed: true,
      data: base64,
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize
    };
  } catch (error) {
    log.error('[compressJSON] Erreur lors de la compression', error);
    throw new Error(`Erreur de compression JSON: ${error.message}`);
  }
}

/**
 * Décompresse un JSON compressé (base64 gzip)
 * 
 * @param {string|Object} compressedData - Données compressées (base64 string ou objet avec `compressed: true` et `data`)
 * @returns {Object} Objet décompressé
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
        if (parsed && typeof parsed === 'object' && parsed.compressed === true) {
          base64Data = parsed.data;
          wasCompressed = true;
        } else {
          // Ce n'est pas compressé, retourner tel quel
          return parsed;
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
    return JSON.parse(jsonString);
  } catch (error) {
    log.error('[decompressJSON] Erreur lors de la décompression', error);
    throw new Error(`Erreur de décompression JSON: ${error.message}`);
  }
}

/**
 * Compresse un export Garmin complet avec métadonnées
 * 
 * @param {Object} exportData - Données d'export (format de `exportAll`)
 * @param {Object} options - Options de compression
 * @returns {Object} Export compressé avec métadonnées
 */
export function compressGarminExport(exportData, options = {}) {
  const compressed = compressJSON(exportData, options);

  return {
    version: '1.0',
    format: 'garmin-compressed',
    compressed: compressed.compressed,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    compressionRatio: compressed.compressionRatio,
    exportDate: new Date().toISOString(),
    data: compressed.data
  };
}

/**
 * Décompresse un export Garmin compressé
 * 
 * @param {Object|string} compressedExport - Export compressé
 * @returns {Object} Données d'export décompressées
 */
export function decompressGarminExport(compressedExport) {
  let dataToDecompress;

  if (typeof compressedExport === 'string') {
    try {
      dataToDecompress = JSON.parse(compressedExport);
    } catch {
      // Traiter comme base64 direct
      dataToDecompress = { compressed: true, data: compressedExport };
    }
  } else {
    dataToDecompress = compressedExport;
  }

  // Si c'est un export avec métadonnées
  if (dataToDecompress.format === 'garmin-compressed' && dataToDecompress.data) {
    return decompressJSON(dataToDecompress.data);
  }

  // Sinon, décompresser directement
  return decompressJSON(dataToDecompress);
}

export default {
  isCompressed,
  compressJSON,
  decompressJSON,
  compressGarminExport,
  decompressGarminExport
};


