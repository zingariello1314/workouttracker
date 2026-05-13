/**
 * 🖼️ MODULE D'EXPORT BANNIÈRES
 * 
 * Exporte toutes les bannières depuis IndexedDB avec métadonnées complètes.
 * Utilise la compression pako (comme Garmin) pour réduire la taille.
 * 
 * @module bannerExport
 */

import { compressJSON } from '../components/tabs/GarminTab/utils/jsonCompression';
import logger from './logger';
import {
  HOMEPAGE_IMAGES_DB_NAME,
  HOMEPAGE_IMAGES_DB_VERSION,
  STORE_HOMEPAGE_IMAGES,
} from '../services/homepage/homepageImagesDbGateway.js';

const log = logger.module('bannerExport');

/**
 * Version du format d'export
 */
const EXPORT_VERSION = '3.0';

/**
 * Ouvre IndexedDB et récupère toutes les images de bannières
 * 
 * @returns {Promise<Array>} Tableau d'objets images avec toutes leurs métadonnées
 */
async function loadAllImagesFromIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    // ✅ Phase 7: Utiliser version 3 (cohérent avec useHomepageImages)
    const request = indexedDB.open(HOMEPAGE_IMAGES_DB_NAME, HOMEPAGE_IMAGES_DB_VERSION);

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_HOMEPAGE_IMAGES)) {
        db.close();
        resolve([]);
        return;
      }

      const transaction = db.transaction([STORE_HOMEPAGE_IMAGES], 'readonly');
      const store = transaction.objectStore(STORE_HOMEPAGE_IMAGES);

      // Essayer d'utiliser l'index 'type' si disponible
      let getAllRequest;
      try {
        const index = store.index('type');
        getAllRequest = index.getAll(IDBKeyRange.only('homepage_background'));
      } catch (error) {
        // Fallback : utiliser getAll() et filtrer
        log.warn('Index "type" non disponible, utilisation fallback', error);
        getAllRequest = store.getAll();
      }

      getAllRequest.onsuccess = (e) => {
        let results = e.target.result;

        // Si fallback, filtrer manuellement
        if (!Array.isArray(results) || results.length === 0) {
          db.close();
          resolve([]);
          return;
        }

        // Filtrer si fallback utilisé
        if (getAllRequest === store.getAll()) {
          results = results.filter(item => item.type === 'homepage_background');
        }

        // Trier par timestamp (plus récent en premier)
        results.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0);
          const dateB = new Date(b.timestamp || 0);
          return dateB - dateA;
        });

        db.close();
        log.debug(`✅ ${results.length} images chargées depuis IndexedDB`);
        resolve(results);
      };

      getAllRequest.onerror = (e) => {
        db.close();
        log.error('Erreur chargement IndexedDB', e.target.error);
        reject(e.target.error);
      };
    };

    request.onerror = (event) => {
      log.error('Erreur ouverture IndexedDB', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Calcule le checksum SHA-256 d'un tableau d'images
 * 
 * @param {Array} images - Tableau d'objets images
 * @returns {Promise<string>} Checksum SHA-256 en hexadécimal
 */
async function calculateChecksum(images) {
  try {
    // Créer une chaîne représentative de toutes les images
    const dataString = JSON.stringify(
      images.map(img => ({
        id: img.id,
        timestamp: img.timestamp,
        dataLength: img.data?.length || 0
      }))
    );

    // Calculer SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `sha256:${hashHex}`;
  } catch (error) {
    log.warn('Erreur calcul checksum, utilisation hash simple', error);
    // Fallback : hash simple basé sur longueur et premiers caractères
    const simpleHash = images.length + '_' + 
      images.map(img => img.id?.substring(0, 10) || '').join('_');
    return `simple:${simpleHash}`;
  }
}

/**
 * Exporte toutes les bannières avec métadonnées complètes
 * 
 * @param {Object} options - Options d'export
 * @param {boolean} options.includeMetadata - Inclure toutes les métadonnées (défaut: true)
 * @param {boolean} options.compress - Activer compression pako (défaut: true)
 * @param {number} options.compressionLevel - Niveau compression 0-9 (défaut: 6)
 * @returns {Promise<Object>} Objet export avec structure complète
 */
export async function exportBanners(options = {}) {
  const {
    includeMetadata = true,
    compress = true,
    compressionLevel = 6
  } = options;

  try {
    log.debug('📤 Début export bannières...');

    // Charger toutes les images depuis IndexedDB
    const images = await loadAllImagesFromIndexedDB();

    if (images.length === 0) {
      log.warn('Aucune image à exporter');
      return {
        version: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        imageCount: 0,
        images: [],
        checksum: null,
        metadata: {
          note: 'Aucune image à exporter'
        }
      };
    }

    log.debug(`📦 Préparation export de ${images.length} images...`);

    // Construire structure export avec métadonnées
    const exportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      exportType: 'Homepage Banners',
      appName: 'Workout Tracker - Bannières',
      imageCount: images.length,
      images: images.map(img => {
        const exportedImage = {
          id: img.id,
          type: img.type,
          data: img.data, // Base64 complet (qualité 100%)
          // ✅ Phase 3: Thumbnail optionnel (format v3)
          ...(img.thumbnail ? { thumbnail: img.thumbnail } : {}),
          timestamp: img.timestamp,
          quality: img.quality || 'maximum',
          compressed: img.compressed || false,
          version: img.version || '2.0',
          // ✅ Phase 3: Format optimal et métadonnées (v3)
          ...(img.format ? { format: img.format } : {}),
          // Métadonnées additionnelles si présentes
          ...(includeMetadata && img.metadata ? { metadata: img.metadata } : {})
        };
        
        // ✅ Phase 4: Inclure versions si présentes et demandées
        if (includeMetadata && img.versions && Array.isArray(img.versions) && img.versions.length > 0) {
          const exportedVersions = prepareVersionsForExport(img.versions, {
            includeVersions: true,
            maxVersionsExport: 3 // Exporter seulement 3 dernières versions (limiter taille)
          });
          if (exportedVersions) {
            exportedImage.versions = exportedVersions;
          }
        }
        
        return exportedImage;
      }),
      metadata: {
        totalSize: images.reduce((sum, img) => sum + (img.data?.length || 0), 0),
        averageSize: Math.round(
          images.reduce((sum, img) => sum + (img.data?.length || 0), 0) / images.length
        ),
        oldestImage: images.length > 0 
          ? images[images.length - 1].timestamp 
          : null,
        newestImage: images.length > 0 
          ? images[0].timestamp 
          : null,
        fieldsIncluded: {
          images: ['id', 'type', 'data', 'thumbnail', 'timestamp', 'quality', 'compressed', 'version', 'format', 'metadata', 'versions']
        },
        notes: {
          quality: 'Toutes les images sont en qualité maximale (100%) - aucune compression destructive',
          format: 'Images stockées en Base64 (data:image/jpeg;base64,... ou data:image/webp;base64,...)',
          thumbnail: 'Thumbnails optionnels (format v3) - uniquement pour galerie, pas pour affichage final',
          versions: 'Versions optionnelles (Phase 4) - historique limité à 3 dernières versions par image dans export',
          compatibility: 'Export compatible avec import. Toutes les métadonnées sont préservées. Format v2 (string) et v3 (objet) supportés.'
        }
      }
    };

    // Calculer checksum pour intégrité
    const checksum = await calculateChecksum(images);
    exportData.checksum = checksum;

    log.debug('✅ Structure export construite', {
      imageCount: exportData.imageCount,
      totalSize: exportData.metadata.totalSize,
      checksum: checksum.substring(0, 20) + '...'
    });

    // Compresser si demandé
    if (compress) {
      const compressed = compressJSON(exportData, {
        level: compressionLevel,
        force: false // Compression automatique si > 1KB
      });

      if (compressed.compressed) {
        log.debug('✅ Export compressé', {
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          ratio: ((1 - compressed.compressedSize / compressed.originalSize) * 100).toFixed(2) + '%'
        });

        return {
          version: '1.0',
          format: 'banner-compressed',
          compressed: true,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          compressionRatio: compressed.compressionRatio,
          exportDate: new Date().toISOString(),
          data: compressed.data
        };
      }
    }

    // Retourner non compressé
    return exportData;

  } catch (error) {
    log.error('❌ Erreur export bannières', error);
    throw new Error(`Erreur lors de l'export des bannières: ${error.message}`);
  }
}

/**
 * Télécharge l'export en fichier JSON
 * 
 * @param {Object} exportData - Données d'export (compressées ou non)
 * @param {string} filename - Nom du fichier (optionnel)
 */
export function downloadBannerExport(exportData, filename = null) {
  try {
    const jsonString = exportData.compressed
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData, null, 2);

    const blob = new Blob([jsonString], {
      type: exportData.compressed
        ? 'application/json+gzip'
        : 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    if (!filename) {
      const fileExtension = exportData.compressed ? '.json.gz' : '.json';
      filename = `banners-export-${new Date().toISOString().split('T')[0]}${fileExtension}`;
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    log.debug('✅ Fichier téléchargé', { filename });
  } catch (error) {
    log.error('❌ Erreur téléchargement fichier', error);
    throw new Error(`Erreur lors du téléchargement: ${error.message}`);
  }
}

