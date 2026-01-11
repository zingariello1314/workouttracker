/**
 * Service de Compression pour Finance Storage
 * 
 * ✅ PHASE 3 - Étape 3.5 : Compression données storage
 * 
 * Fonctionnalités :
 * - Compression automatique pour grandes quantités de données
 * - Décompression automatique à la lecture
 * - Détection automatique des données compressées
 * - Seuil de compression configurable
 * 
 * @module services/finance/financeCompression
 */

import pako from 'pako';
import logger from '../../utils/logger';

const log = logger.module('financeCompression');

/**
 * Seuil de taille pour activer la compression (en bytes)
 * Données < 10KB ne sont pas compressées (overhead compression)
 */
const COMPRESSION_THRESHOLD = 10 * 1024; // 10KB

/**
 * Marqueur pour identifier les données compressées
 */
const COMPRESSION_MARKER = '__COMPRESSED__';

/**
 * Compresse des données si elles dépassent le seuil
 * 
 * @param {any} data - Données à compresser
 * @param {Object} options - Options
 * @param {number} options.threshold - Seuil de compression (défaut: 10KB)
 * @returns {string|any} Données compressées (string base64) ou données originales
 */
export function compressFinanceData(data, options = {}) {
  const { threshold = COMPRESSION_THRESHOLD } = options;

  try {
    // Sérialiser en JSON pour mesurer la taille
    const jsonString = JSON.stringify(data);
    const size = new Blob([jsonString]).size;

    // Si taille < seuil, ne pas compresser (overhead compression)
    if (size < threshold) {
      return data;
    }

    // Compresser avec pako (gzip)
    const compressed = pako.deflate(jsonString, { to: 'string' });
    
    // Encoder en base64 pour stockage
    const base64 = btoa(String.fromCharCode(...compressed));
    
    // Ajouter marqueur pour identification
    const compressedData = {
      [COMPRESSION_MARKER]: true,
      data: base64,
      originalSize: size,
      compressedSize: base64.length
    };

    const compressionRatio = ((1 - compressedData.compressedSize / size) * 100).toFixed(1);
    log.debug(`Compressed data: ${(size / 1024).toFixed(1)}KB -> ${(compressedData.compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

    return compressedData;
  } catch (error) {
    log.warn('Error compressing data, storing uncompressed:', error);
    return data; // Retourner données originales en cas d'erreur
  }
}

/**
 * Décompresse des données si elles sont compressées
 * 
 * @param {any} data - Données à décompresser
 * @returns {any} Données décompressées ou données originales
 */
export function decompressFinanceData(data) {
  // Vérifier si données compressées
  if (!data || typeof data !== 'object' || !data[COMPRESSION_MARKER]) {
    return data; // Pas compressé, retourner tel quel
  }

  try {
    // Décoder base64
    const binaryString = atob(data.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Décompresser avec pako
    const decompressed = pako.inflate(bytes, { to: 'string' });
    
    // Parser JSON
    const parsed = JSON.parse(decompressed);
    
    log.debug(`Decompressed data: ${(data.compressedSize / 1024).toFixed(1)}KB -> ${(data.originalSize / 1024).toFixed(1)}KB`);

    return parsed;
  } catch (error) {
    log.error('Error decompressing data:', error);
    throw new Error('Failed to decompress data');
  }
}

/**
 * Vérifie si des données sont compressées
 * 
 * @param {any} data - Données à vérifier
 * @returns {boolean} true si compressées
 */
export function isCompressed(data) {
  return data && typeof data === 'object' && data[COMPRESSION_MARKER] === true;
}

/**
 * Obtient la taille estimée des données (compressées ou non)
 * 
 * @param {any} data - Données
 * @returns {number} Taille en bytes
 */
export function getDataSize(data) {
  if (isCompressed(data)) {
    return data.compressedSize;
  }
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (error) {
    return 0;
  }
}

export default {
  compress: compressFinanceData,
  decompress: decompressFinanceData,
  isCompressed,
  getDataSize
};
