/**
 * Utilitaire de Normalisation Structure Photo Entry
 * 
 * ✅ NORMALISATION: Uniformise structure Photo Entry (photo vs url)
 * Problème: Incohérence entre `photo.photo` et `photo.url`
 * Solution: Utiliser uniquement `url` (standard web, plus sémantique)
 * 
 * Référence: ANALYSE_COMPLETE_ET_OPTIMISATIONS.md - Normalisation Structure
 */

import logger from '../../../utils/logger';

const log = logger.module('PhotoNormalizer');

/**
 * Normalise une photo pour utiliser uniquement `url` (supprime `photo` si présent)
 * 
 * @param {Object} photo - Photo à normaliser (peut avoir `photo` ou `url`)
 * @returns {Object} Photo normalisée avec uniquement `url`
 */
export const normalizePhotoEntry = (photo) => {
  if (!photo) {
    return null;
  }

  // Si déjà normalisé (a `url` mais pas `photo`), retourner tel quel
  if (photo.url && !photo.photo) {
    return photo;
  }

  // Normaliser: utiliser `url` depuis `photo` ou `url`
  const normalized = {
    ...photo,
    url: photo.url || photo.photo || null,
    // Supprimer `photo` si présent (garder seulement `url`)
    photo: undefined
  };

  // Nettoyer undefined
  delete normalized.photo;

  return normalized;
};

/**
 * Normalise un tableau de photos
 * 
 * @param {Array<Object>} photos - Tableau de photos à normaliser
 * @returns {Array<Object>} Photos normalisées
 */
export const normalizePhotoEntries = (photos) => {
  if (!photos || !Array.isArray(photos)) {
    return [];
  }

  return photos.map(normalizePhotoEntry).filter(p => p !== null);
};

/**
 * ✅ OPTIMISATION: Obtient l'URL d'une photo avec support multi-résolution
 * 
 * Résolutions supportées:
 * - 'thumbnail': 150x200 (galerie grille)
 * - 'preview': 400x533 (vue détaillée/modal)
 * - 'full': 1200x1600 (analyse IA, zoom complet)
 * 
 * @param {Object} photo - Photo (peut avoir structure classique ou multi-résolution)
 * @param {string} resolution - Résolution désirée: 'thumbnail' | 'preview' | 'full' (défaut: 'preview')
 * @returns {string|null} URL de la photo à la résolution demandée
 */
export const getPhotoUrl = (photo, resolution = 'preview') => {
  if (!photo) {
    return null;
  }

  // ✅ OPTIMISATION: Support multi-résolution (nouvelle structure)
  if (photo.resolutions && typeof photo.resolutions === 'object') {
    // Structure multi-résolution: { resolutions: { thumbnail: {...}, preview: {...}, full: {...} } }
    const res = photo.resolutions[resolution];
    if (res && res.data) {
      return res.data;
    }
    
    // Fallback: Si résolution demandée n'existe pas, essayer preview puis full
    if (resolution !== 'preview' && photo.resolutions.preview?.data) {
      return photo.resolutions.preview.data;
    }
    if (photo.resolutions.full?.data) {
      return photo.resolutions.full.data;
    }
  }
  
  // ✅ Fallback: Structure classique (compatibilité rétroactive)
  // Priorité: `url` > `photo`
  return photo.url || photo.photo || null;
};

/**
 * Vérifie si une photo a une URL valide (vérifie toutes résolutions si multi-résolution)
 * 
 * @param {Object} photo - Photo à vérifier
 * @param {string} resolution - Résolution à vérifier (optionnel, vérifie toutes si omis)
 * @returns {boolean} true si photo a URL valide
 */
export const hasPhotoUrl = (photo, resolution = null) => {
  if (!photo) return false;
  
  // ✅ OPTIMISATION: Support multi-résolution
  if (photo.resolutions && typeof photo.resolutions === 'object') {
    if (resolution) {
      // Vérifier résolution spécifique
      return !!(photo.resolutions[resolution]?.data);
    }
    // Vérifier au moins une résolution disponible
    return Object.values(photo.resolutions).some(r => r && r.data);
  }
  
  // Fallback: Structure classique
  const url = getPhotoUrl(photo, resolution);
  return url !== null && url !== undefined && url !== '';
};

/**
 * ✅ OPTIMISATION: Obtient les métadonnées d'une résolution spécifique
 * 
 * @param {Object} photo - Photo avec structure multi-résolution
 * @param {string} resolution - Résolution: 'thumbnail' | 'preview' | 'full'
 * @returns {Object|null} Métadonnées résolution (width, height, size, format, quality) ou null
 */
export const getResolutionMetadata = (photo, resolution = 'preview') => {
  if (!photo?.resolutions?.[resolution]) {
    return null;
  }
  
  const res = photo.resolutions[resolution];
  return {
    width: res.width,
    height: res.height,
    size: res.size,
    format: res.format,
    quality: res.quality
  };
};

/**
 * ✅ OPTIMISATION: Valide et normalise données photo avec support multi-résolution
 * Garantit présence d'au moins une URL (classique ou multi-résolution)
 * 
 * @param {Object} photoData - Données photo brutes (peut avoir structure classique ou multi-résolution)
 * @returns {Object} Photo normalisée et validée pour sauvegarde
 */
export const validateAndNormalizePhotoData = (photoData) => {
  if (!photoData) {
    throw new Error('Données photo invalides : objet vide');
  }

  // ✅ OPTIMISATION: Support structure multi-résolution
  if (photoData.resolutions && typeof photoData.resolutions === 'object') {
    // Vérifier au moins une résolution valide
    const hasValidResolution = Object.values(photoData.resolutions).some(
      r => r && r.data && typeof r.data === 'string'
    );
    
    if (!hasValidResolution) {
      throw new Error('Données photo invalides : au moins une résolution avec `data` requis');
    }
    
    // Normaliser structure multi-résolution
    const normalized = {
      ...photoData,
      resolutions: photoData.resolutions // Garder structure multi-résolution
    };
    
    // Validation structure minimale
    if (!normalized.id) {
      normalized.id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (!normalized.date) {
      normalized.date = new Date().toISOString();
    }
    
    return normalized;
  }

  // ✅ Fallback: Structure classique (compatibilité rétroactive)
  // Obtenir URL (priorité: `url` > `photo`)
  const url = photoData.url || photoData.photo;

  if (!url) {
    throw new Error('Données photo invalides : `url` ou `photo` requis (ou structure multi-résolution)');
  }

  // Normaliser: toujours utiliser `url`, jamais `photo`
  const normalized = {
    ...photoData,
    url, // Toujours utiliser `url`
    // Ne PAS inclure `photo` (éviter duplication)
    photo: undefined
  };

  // Nettoyer undefined
  delete normalized.photo;

  // Validation structure minimale
  if (!normalized.id) {
    normalized.id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  if (!normalized.date) {
    normalized.date = new Date().toISOString();
  }

  return normalized;
};

/**
 * Migre photos existantes pour normaliser structure
 * Convertit toutes photos avec `photo` en `url`
 * 
 * @param {Array<Object>} photos - Photos à migrer
 * @returns {Array<Object>} Photos migrées (normalisées)
 */
export const migratePhotoEntries = (photos) => {
  if (!photos || !Array.isArray(photos)) {
    return [];
  }

  let migratedCount = 0;

  const migrated = photos.map(photo => {
    // Si photo a `photo` mais pas `url`, migrer
    if (photo.photo && !photo.url) {
      migratedCount++;
      return {
        ...photo,
        url: photo.photo,
        photo: undefined
      };
    }

    // Si photo a les deux, garder `url` et supprimer `photo`
    if (photo.photo && photo.url) {
      migratedCount++;
      return {
        ...photo,
        photo: undefined
      };
    }

    // Déjà normalisé, retourner tel quel
    return photo;
  });

  if (migratedCount > 0) {
    log.info(`Migration: ${migratedCount}/${photos.length} photos normalisées (photo → url)`);
  }

  return migrated;
};

export default {
  normalizePhotoEntry,
  normalizePhotoEntries,
  getPhotoUrl,
  hasPhotoUrl,
  validateAndNormalizePhotoData,
  migratePhotoEntries
};

