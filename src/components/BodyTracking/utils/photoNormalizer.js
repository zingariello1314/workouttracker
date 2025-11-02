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
 * Obtient l'URL d'une photo (normalisée ou non)
 * Utilise `url` en priorité, sinon `photo`
 * 
 * @param {Object} photo - Photo (peut avoir `photo` ou `url`)
 * @returns {string|null} URL de la photo
 */
export const getPhotoUrl = (photo) => {
  if (!photo) {
    return null;
  }

  // Priorité: `url` > `photo`
  return photo.url || photo.photo || null;
};

/**
 * Vérifie si une photo a une URL valide
 * 
 * @param {Object} photo - Photo à vérifier
 * @returns {boolean} true si photo a URL valide
 */
export const hasPhotoUrl = (photo) => {
  const url = getPhotoUrl(photo);
  return url !== null && url !== undefined && url !== '';
};

/**
 * Valide et normalise données photo avant sauvegarde
 * Garantit présence de `url` et structure cohérente
 * 
 * @param {Object} photoData - Données photo brutes (peut avoir `photo` ou `url`)
 * @returns {Object} Photo normalisée et validée pour sauvegarde
 */
export const validateAndNormalizePhotoData = (photoData) => {
  if (!photoData) {
    throw new Error('Données photo invalides : objet vide');
  }

  // Obtenir URL (priorité: `url` > `photo`)
  const url = photoData.url || photoData.photo;

  if (!url) {
    throw new Error('Données photo invalides : `url` ou `photo` requis');
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

