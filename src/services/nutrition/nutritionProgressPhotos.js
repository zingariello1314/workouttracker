/**
 * nutritionProgressPhotos.js
 * 
 * Service pour la gestion des photos de progression nutrition (avant/après).
 * 
 * Fonctionnalités :
 * - CRUD photos de progression (ajout, récupération, mise à jour, suppression)
 * - Compression multi-résolution (thumbnail + full) pour optimiser stockage
 * - Format optimal (WebP si supporté, sinon JPEG)
 * - Gestion séquences avant/après (sequenceId pour grouper photos)
 * - Métadonnées (poids, mesures optionnelles, dimensions)
 * - Export JSON pour sauvegarde
 * 
 * Architecture :
 * - Stockage IndexedDB : store `nutrition_progressPhotos`
 * - Format images : v3.0 (full + thumbnail + format + metadata)
 * - Compression : multi-résolution (thumbnail 150x200, full 1200x1600)
 * - Performance : traitement async, non-bloquant pour UI
 * 
 * @module services/nutrition/nutritionProgressPhotos
 * @see ../../../nouvelongletnutritionplan.md Section 6.2
 */

import { openNutritionDB, STORE_PROGRESS_PHOTOS } from '../../hooks/nutritionDataUtils';
import { processImageForStorage } from '../../utils/imageFormatOptimizer';
import { compressImageMultiResolution } from '../../components/BodyTracking/utils/imageCompression';
import logger from '../../utils/logger';

const log = logger.module('nutritionProgressPhotos');

// ==================== TYPES PHOTOS ====================

/**
 * Types de photos de progression
 */
export const PROGRESS_PHOTO_TYPES = {
  BEFORE: 'before', // Photo avant (début)
  AFTER: 'after'    // Photo après (résultat)
};

// ==================== GÉNÉRATION ID ====================

/**
 * Génère un ID unique pour une photo de progression
 * 
 * @param {string} type - Type photo (before/after)
 * @param {string} date - Date photo (YYYY-MM-DD)
 * @returns {string} ID unique
 */
function generatePhotoId(type, date) {
  return `progress_photo_${type}_${date}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Génère un sequenceId pour grouper photos avant/après ensemble
 * 
 * @param {string} date - Date référence (YYYY-MM-DD)
 * @returns {string} sequenceId unique
 */
function generateSequenceId(date) {
  return `sequence_${date}_${Date.now()}`;
}

// ==================== TRAITEMENT IMAGES ====================

/**
 * Traite un fichier image pour stockage optimisé
 * 
 * @param {File} file - Fichier image à traiter
 * @param {Object} options - Options de traitement
 * @param {boolean} options.createThumbnail - Créer thumbnail (défaut: true)
 * @param {boolean} options.preserveQuality - Préserver qualité 100% (défaut: true)
 * @param {Function} options.onProgress - Callback progression (0-100)
 * @returns {Promise<Object>} { full, thumbnail, format, metadata }
 */
async function processProgressPhoto(file, options = {}) {
  try {
    const {
      createThumbnail = true,
      preserveQuality = true,
      onProgress = null
    } = options;

    log.debug('[processProgressPhoto] Traitement image', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      createThumbnail,
      preserveQuality
    });

    // Option 1 : Utiliser processImageForStorage (format optimal WebP, qualité 100%)
    // ✅ Recommandé pour photos de progression (qualité maximale importante)
    if (preserveQuality) {
      if (onProgress) onProgress(10, 'Traitement image optimale...');
      
      const result = await processImageForStorage(file, {
        createThumbnail,
        preserveQuality: true // Qualité 100%
      });

      if (onProgress) onProgress(100, 'Traitement terminé');

      log.debug('[processProgressPhoto] Image traitée (format optimal)', {
        format: result.format,
        fullSize: `${(result.metadata.fullSize / 1024 / 1024).toFixed(2)} MB`,
        thumbnailSize: result.metadata.thumbnailSize > 0
          ? `${(result.metadata.thumbnailSize / 1024).toFixed(2)} KB`
          : 'N/A'
      });

      return {
        full: result.full,
        thumbnail: result.thumbnail,
        format: result.format,
        metadata: result.metadata
      };
    }

    // Option 2 : Utiliser compressImageMultiResolution (compression optimisée, taille réduite)
    // ✅ Alternative si besoin de compression plus agressive
    if (onProgress) onProgress(10, 'Compression multi-résolution...');
    
    const compressedResult = await compressImageMultiResolution(
      file,
      {
        resolutions: [
          { name: 'thumbnail', width: 150, height: 200, quality: 0.7 },
          { name: 'full', width: 1200, height: 1600, quality: 0.85 }
        ],
        progressive: true
      },
      onProgress
    );

    if (onProgress) onProgress(100, 'Compression terminée');

    log.debug('[processProgressPhoto] Image compressée (multi-résolution)', {
      thumbnailSize: compressedResult.thumbnail?.size 
        ? `${(compressedResult.thumbnail.size / 1024).toFixed(2)} KB`
        : 'N/A',
      fullSize: compressedResult.full?.size 
        ? `${(compressedResult.full.size / 1024 / 1024).toFixed(2)} MB`
        : 'N/A'
    });

    return {
      full: compressedResult.full?.data || compressedResult.full,
      thumbnail: compressedResult.thumbnail?.data || compressedResult.thumbnail,
      format: compressedResult.full?.format || 'image/jpeg',
      metadata: {
        originalFileName: file.name,
        originalSize: file.size,
        fullSize: compressedResult.full?.size || 0,
        thumbnailSize: compressedResult.thumbnail?.size || 0,
        dimensions: compressedResult.full?.dimensions || null,
        thumbnailDimensions: compressedResult.thumbnail?.dimensions || null,
        quality: 'high', // Compression mais qualité élevée
        thumbnailQuality: 0.7,
        format: compressedResult.full?.format || 'image/jpeg'
      }
    };
  } catch (error) {
    log.error('[processProgressPhoto] Erreur traitement image:', error);
    throw new Error(`Erreur traitement image: ${error.message}`);
  }
}

// ==================== CRUD INDEXEDDB ====================

/**
 * Ajoute une photo de progression
 * 
 * @param {File} file - Fichier image à ajouter
 * @param {Object} photoData - Données photo
 * @param {string} photoData.type - Type photo (before/after)
 * @param {string} photoData.date - Date photo (YYYY-MM-DD)
 * @param {string} [photoData.sequenceId] - ID séquence pour grouper avant/après (généré si absent)
 * @param {number} [photoData.weight] - Poids (kg) optionnel
 * @param {Object} [photoData.measurements] - Mesures optionnelles (taille, tour de taille, etc.)
 * @param {string} [photoData.notes] - Notes optionnelles
 * @param {Object} [options] - Options traitement
 * @param {Function} [options.onProgress] - Callback progression (0-100)
 * @returns {Promise<Object>} Photo sauvegardée avec ID
 */
export async function addProgressPhoto(file, photoData, options = {}) {
  try {
    const {
      type,
      date,
      sequenceId,
      weight = null,
      measurements = null,
      notes = null
    } = photoData;

    // Valider type
    if (!type || !Object.values(PROGRESS_PHOTO_TYPES).includes(type)) {
      throw new Error(`Type photo invalide: ${type} (attendu: ${Object.values(PROGRESS_PHOTO_TYPES).join(' ou ')})`);
    }

    // Valider date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Date invalide: ${date} (attendu: YYYY-MM-DD)`);
    }

    log.debug('[addProgressPhoto] Ajout photo progression', {
      type,
      date,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Traiter image (compression + format optimal)
    const processedImage = await processProgressPhoto(file, {
      createThumbnail: true,
      preserveQuality: true, // Qualité maximale pour photos progression
      onProgress: options.onProgress
    });

    // Générer ID unique
    const id = generatePhotoId(type, date);
    
    // Générer sequenceId si absent (pour grouper avant/après)
    const finalSequenceId = sequenceId || generateSequenceId(date);

    // Préparer données photo
    const photoToSave = {
      id,
      type,
      date,
      sequenceId: finalSequenceId,
      timestamp: new Date().toISOString(),
      
      // Images (format v3.0)
      data: processedImage.full, // Full image (qualité maximale)
      thumbnail: processedImage.thumbnail, // Thumbnail (galerie)
      format: processedImage.format, // Format optimal (webp/jpeg)
      
      // Métadonnées
      metadata: {
        ...processedImage.metadata,
        weight,
        measurements,
        notes,
        version: '3.0'
      },
      
      // Version format
      version: '3.0'
    };

    // Sauvegarder dans IndexedDB
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }

    // Vérifier si store existe
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      log.warn(`Store ${STORE_PROGRESS_PHOTOS} n'existe pas, migration nécessaire`);
      throw new Error(`Store ${STORE_PROGRESS_PHOTOS} non trouvé. Migration nécessaire.`);
    }

    const tx = db.transaction([STORE_PROGRESS_PHOTOS], 'readwrite');
    const store = tx.objectStore(STORE_PROGRESS_PHOTOS);
    
    return new Promise((resolve, reject) => {
      const request = store.add(photoToSave);
      
      request.onsuccess = () => {
        log.debug('[addProgressPhoto] Photo sauvegardée avec succès', {
          id,
          type,
          date,
          sequenceId: finalSequenceId
        });
        resolve(photoToSave);
      };
      
      request.onerror = () => {
        log.error('[addProgressPhoto] Erreur sauvegarde IndexedDB:', request.error);
        reject(new Error(`Erreur sauvegarde photo: ${request.error.message}`));
      };
    });
  } catch (error) {
    log.error('[addProgressPhoto] Erreur ajout photo:', error);
    throw error;
  }
}

/**
 * Récupère toutes les photos de progression
 * 
 * @param {Object} [filters] - Filtres optionnels
 * @param {string} [filters.type] - Filtrer par type (before/after)
 * @param {string} [filters.date] - Filtrer par date (YYYY-MM-DD)
 * @param {string} [filters.sequenceId] - Filtrer par séquence
 * @returns {Promise<Array>} Liste photos de progression
 */
export async function getAllProgressPhotos(filters = {}) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('[getAllProgressPhotos] DB non disponible');
      return [];
    }

    // Vérifier si store existe
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      log.debug(`[getAllProgressPhotos] Store ${STORE_PROGRESS_PHOTOS} n'existe pas encore`);
      return [];
    }

    const tx = db.transaction([STORE_PROGRESS_PHOTOS], 'readonly');
    const store = tx.objectStore(STORE_PROGRESS_PHOTOS);
    
    return new Promise((resolve, reject) => {
      // ✅ OPTIMISATION : Utiliser index composé [date+type] si les deux filtres sont présents
      let request;
      let usedCompositeIndex = false; // Flag pour tracker si index composé utilisé
      
      if (filters.date && filters.type) {
        // ✅ OPTIMISATION : Index composé [date+type] pour requête optimisée O(log n)
        try {
          const index = store.index('[date+type]');
          const keyRange = IDBKeyRange.only([filters.date, filters.type]);
          request = index.getAll(keyRange);
          usedCompositeIndex = true; // ✅ Index composé utilisé
          log.debug('[getAllProgressPhotos] Utilisation index composé [date+type]');
        } catch (idxError) {
          // Index composé non disponible (DB ancienne version), fallback sur filtres séparés
          log.debug('[getAllProgressPhotos] Index composé non disponible, fallback filtrage séparé');
          const dateIndex = store.index('date');
          request = dateIndex.getAll(IDBKeyRange.only(filters.date));
          usedCompositeIndex = false; // ✅ Index composé non disponible, filtrage type en mémoire nécessaire
        }
      } else if (filters.date) {
        // Filtrer par date (index)
        const index = store.index('date');
        request = index.getAll(IDBKeyRange.only(filters.date));
        usedCompositeIndex = false;
      } else if (filters.type) {
        // Filtrer par type (index)
        const index = store.index('type');
        request = index.getAll(IDBKeyRange.only(filters.type));
        usedCompositeIndex = false;
      } else if (filters.sequenceId) {
        // Filtrer par séquence (index)
        const index = store.index('sequenceId');
        request = index.getAll(IDBKeyRange.only(filters.sequenceId));
        usedCompositeIndex = false;
      } else {
        // Récupérer toutes les photos
        request = store.getAll();
        usedCompositeIndex = false;
      }
      
      request.onsuccess = () => {
        let photos = request.result || [];
        
        // ✅ OPTIMISATION : Filtrage mémoire seulement si index composé non disponible
        // (Si index composé utilisé, filtrage déjà fait par IndexedDB)
        if (filters.date && filters.type && !usedCompositeIndex) {
          // Fallback : Index composé non disponible (DB v9), filtrer type en mémoire
          photos = photos.filter(p => p.type === filters.type);
          log.debug('[getAllProgressPhotos] Filtrage type en mémoire (fallback DB v9)');
        }
        
        // Appliquer filtres supplémentaires si nécessaire (sequenceId)
        if (filters.sequenceId) {
          photos = photos.filter(p => p.sequenceId === filters.sequenceId);
        }
        
        // Trier par date décroissante (plus récentes en premier)
        photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        log.debug('[getAllProgressPhotos] Photos récupérées', {
          total: photos.length,
          filters,
          indexUsed: usedCompositeIndex ? '[date+type]' : (filters.date ? 'date' : filters.type ? 'type' : filters.sequenceId ? 'sequenceId' : 'primary')
        });
        
        resolve(photos);
      };
      
      request.onerror = () => {
        log.error('[getAllProgressPhotos] Erreur lecture IndexedDB:', request.error);
        reject(new Error(`Erreur récupération photos: ${request.error.message}`));
      };
    });
  } catch (error) {
    log.error('[getAllProgressPhotos] Erreur récupération photos:', error);
    return [];
  }
}

/**
 * Récupère une photo de progression par ID
 * 
 * @param {string} id - ID photo
 * @returns {Promise<Object|null>} Photo ou null si non trouvée
 */
export async function getProgressPhoto(id) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('[getProgressPhoto] DB non disponible');
      return null;
    }

    // Vérifier si store existe
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      log.debug(`[getProgressPhoto] Store ${STORE_PROGRESS_PHOTOS} n'existe pas encore`);
      return null;
    }

    const tx = db.transaction([STORE_PROGRESS_PHOTOS], 'readonly');
    const store = tx.objectStore(STORE_PROGRESS_PHOTOS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const photo = request.result || null;
        log.debug('[getProgressPhoto] Photo récupérée', {
          id,
          found: !!photo
        });
        resolve(photo);
      };
      
      request.onerror = () => {
        log.error('[getProgressPhoto] Erreur lecture IndexedDB:', request.error);
        reject(new Error(`Erreur récupération photo: ${request.error.message}`));
      };
    });
  } catch (error) {
    log.error('[getProgressPhoto] Erreur récupération photo:', error);
    return null;
  }
}

/**
 * Récupère les séquences de photos avant/après
 * 
 * @returns {Promise<Array>} Liste séquences { sequenceId, before, after, date }
 */
export async function getProgressPhotoSequences() {
  try {
    // Récupérer toutes les photos
    const allPhotos = await getAllProgressPhotos();
    
    // Grouper par sequenceId
    const sequencesMap = new Map();
    
    allPhotos.forEach(photo => {
      const { sequenceId, type, date } = photo;
      
      if (!sequencesMap.has(sequenceId)) {
        sequencesMap.set(sequenceId, {
          sequenceId,
          date,
          before: null,
          after: null,
          photos: []
        });
      }
      
      const sequence = sequencesMap.get(sequenceId);
      sequence.photos.push(photo);
      
      if (type === PROGRESS_PHOTO_TYPES.BEFORE) {
        sequence.before = photo;
      } else if (type === PROGRESS_PHOTO_TYPES.AFTER) {
        sequence.after = photo;
      }
      
      // Mettre à jour date (plus récente)
      if (new Date(photo.timestamp) > new Date(sequence.date || 0)) {
        sequence.date = photo.date;
      }
    });
    
    // Convertir en tableau et trier par date décroissante
    const sequences = Array.from(sequencesMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    log.debug('[getProgressPhotoSequences] Séquences récupérées', {
      total: sequences.length
    });
    
    return sequences;
  } catch (error) {
    log.error('[getProgressPhotoSequences] Erreur récupération séquences:', error);
    return [];
  }
}

/**
 * Met à jour une photo de progression
 * 
 * @param {string} id - ID photo à mettre à jour
 * @param {Object} updates - Champs à mettre à jour
 * @param {number} [updates.weight] - Nouveau poids
 * @param {Object} [updates.measurements] - Nouvelles mesures
 * @param {string} [updates.notes] - Nouvelles notes
 * @returns {Promise<Object>} Photo mise à jour
 */
export async function updateProgressPhoto(id, updates) {
  try {
    // Récupérer photo existante
    const existingPhoto = await getProgressPhoto(id);
    if (!existingPhoto) {
      throw new Error(`Photo non trouvée: ${id}`);
    }

    // Mettre à jour champs autorisés
    const updatedPhoto = {
      ...existingPhoto,
      ...updates,
      // Ne pas permettre mise à jour id, type, date, sequenceId, images directement
      // (il faut utiliser updateProgressPhotoImage pour changer l'image)
      id: existingPhoto.id, // Toujours garder ID original
      type: existingPhoto.type,
      date: existingPhoto.date,
      sequenceId: existingPhoto.sequenceId,
      data: existingPhoto.data, // Garder images originales
      thumbnail: existingPhoto.thumbnail,
      format: existingPhoto.format,
      // Mettre à jour métadonnées
      metadata: {
        ...existingPhoto.metadata,
        weight: updates.weight !== undefined ? updates.weight : existingPhoto.metadata?.weight,
        measurements: updates.measurements !== undefined ? updates.measurements : existingPhoto.metadata?.measurements,
        notes: updates.notes !== undefined ? updates.notes : existingPhoto.metadata?.notes,
        updatedAt: new Date().toISOString()
      }
    };

    // Sauvegarder dans IndexedDB
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }

    // Vérifier si store existe
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      throw new Error(`Store ${STORE_PROGRESS_PHOTOS} non trouvé`);
    }

    const tx = db.transaction([STORE_PROGRESS_PHOTOS], 'readwrite');
    const store = tx.objectStore(STORE_PROGRESS_PHOTOS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(updatedPhoto);
      
      request.onsuccess = () => {
        log.debug('[updateProgressPhoto] Photo mise à jour avec succès', { id });
        resolve(updatedPhoto);
      };
      
      request.onerror = () => {
        log.error('[updateProgressPhoto] Erreur mise à jour IndexedDB:', request.error);
        reject(new Error(`Erreur mise à jour photo: ${request.error.message}`));
      };
    });
  } catch (error) {
    log.error('[updateProgressPhoto] Erreur mise à jour photo:', error);
    throw error;
  }
}

/**
 * Supprime une photo de progression
 * 
 * @param {string} id - ID photo à supprimer
 * @returns {Promise<boolean>} true si succès
 */
export async function deleteProgressPhoto(id) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }

    // Vérifier si store existe
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      log.warn(`[deleteProgressPhoto] Store ${STORE_PROGRESS_PHOTOS} n'existe pas encore`);
      return false;
    }

    const tx = db.transaction([STORE_PROGRESS_PHOTOS], 'readwrite');
    const store = tx.objectStore(STORE_PROGRESS_PHOTOS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        log.debug('[deleteProgressPhoto] Photo supprimée avec succès', { id });
        resolve(true);
      };
      
      request.onerror = () => {
        log.error('[deleteProgressPhoto] Erreur suppression IndexedDB:', request.error);
        reject(new Error(`Erreur suppression photo: ${request.error.message}`));
      };
    });
  } catch (error) {
    log.error('[deleteProgressPhoto] Erreur suppression photo:', error);
    throw error;
  }
}

/**
 * Supprime toutes les photos d'une séquence
 * 
 * @param {string} sequenceId - ID séquence à supprimer
 * @returns {Promise<number>} Nombre de photos supprimées
 */
export async function deleteProgressPhotoSequence(sequenceId) {
  try {
    // Récupérer toutes les photos de la séquence
    const photos = await getAllProgressPhotos({ sequenceId });
    
    if (photos.length === 0) {
      log.debug('[deleteProgressPhotoSequence] Aucune photo à supprimer', { sequenceId });
      return 0;
    }

    // Supprimer toutes les photos
    const deletePromises = photos.map(photo => deleteProgressPhoto(photo.id));
    await Promise.all(deletePromises);

    log.debug('[deleteProgressPhotoSequence] Séquence supprimée', {
      sequenceId,
      photosDeleted: photos.length
    });

    return photos.length;
  } catch (error) {
    log.error('[deleteProgressPhotoSequence] Erreur suppression séquence:', error);
    throw error;
  }
}

// ==================== EXPORT JSON ====================

/**
 * Exporte toutes les photos de progression pour sauvegarde JSON
 * 
 * @returns {Promise<Object>} Données exportables
 */
export async function exportProgressPhotos() {
  try {
    const allPhotos = await getAllProgressPhotos();
    
    // Exporter photos avec métadonnées (sans images pour réduire taille)
    // ✅ OPTIMISATION : Exporter seulement métadonnées + thumbnails (images full trop lourdes)
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalPhotos: allPhotos.length,
      photos: allPhotos.map(photo => ({
        id: photo.id,
        type: photo.type,
        date: photo.date,
        sequenceId: photo.sequenceId,
        timestamp: photo.timestamp,
        // ✅ Exporter thumbnail (léger) mais pas full (trop lourd pour JSON)
        thumbnail: photo.thumbnail, // Thumbnail OK pour export (<100KB)
        format: photo.format,
        metadata: {
          ...photo.metadata,
          // ✅ Note : image full non exportée (trop lourd, utiliser backup IndexedDB)
          hasFullImage: !!photo.data,
          fullImageSize: photo.data ? photo.data.length : 0
        }
      }))
    };

    log.debug('[exportProgressPhotos] Photos exportées', {
      totalPhotos: allPhotos.length,
      exportSize: `${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB`
    });

    return exportData;
  } catch (error) {
    log.error('[exportProgressPhotos] Erreur export photos:', error);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  PROGRESS_PHOTO_TYPES,
  addProgressPhoto,
  getAllProgressPhotos,
  getProgressPhoto,
  getProgressPhotoSequences,
  updateProgressPhoto,
  deleteProgressPhoto,
  deleteProgressPhotoSequence,
  exportProgressPhotos
};

