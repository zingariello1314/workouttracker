/**
 * 📚 MODULE VERSIONING BANNIÈRES
 * 
 * Système de versioning intelligent pour les bannières :
 * - Historique limité (5 dernières versions par image)
 * - Versions optionnelles (activées seulement si nécessaire)
 * - Compression versions anciennes (si taille > seuil)
 * - Rollback vers version précédente
 * - Nettoyage automatique
 * 
 * @module bannerVersioning
 */

import logger from './logger';

const log = logger.module('bannerVersioning');

/**
 * Nombre maximum de versions à garder par image
 */
const MAX_VERSIONS = 5;

/**
 * Seuil de compression pour versions anciennes (bytes)
 * Si version > seuil, compresser
 */
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB

/**
 * Crée une nouvelle version d'une image
 * 
 * @param {string|Object} imageData - Image actuelle (format v2 ou v3)
 * @param {string} action - Action effectuée ('upload', 'replace', 'modify')
 * @param {Array} existingVersions - Versions existantes (optionnel)
 * @returns {Object} Nouvelle version
 */
export function createVersion(imageData, action = 'modify', existingVersions = []) {
  try {
    // Extraire données selon format
    let versionData;
    let metadata = {};
    
    if (typeof imageData === 'string') {
      // Format v2 : string directe
      versionData = imageData;
      metadata = {
        format: 'v2',
        size: imageData.length
      };
    } else if (typeof imageData === 'object' && imageData !== null) {
      // Format v3 : objet avec full + thumbnail
      versionData = imageData.full || imageData.data;
      metadata = {
        format: 'v3',
        hasThumbnail: !!imageData.thumbnail,
        fullSize: imageData.full?.length || 0,
        thumbnailSize: imageData.thumbnail?.length || 0,
        format: imageData.format,
        ...(imageData.metadata || {})
      };
    } else {
      throw new Error('Format image invalide pour versioning');
    }

    const newVersion = {
      version: existingVersions.length + 1,
      data: versionData,
      timestamp: new Date().toISOString(),
      action: action,
      metadata: metadata
    };

    // Si format v3, inclure thumbnail dans version
    if (typeof imageData === 'object' && imageData.thumbnail) {
      newVersion.thumbnail = imageData.thumbnail;
    }

    log.debug('✅ Version créée', {
      version: newVersion.version,
      action,
      size: `${(versionData.length / 1024 / 1024).toFixed(2)} MB`
    });

    return newVersion;
  } catch (error) {
    log.error('❌ Erreur création version', error);
    throw error;
  }
}

/**
 * Ajoute une version à l'historique d'une image
 * Nettoie automatiquement les versions > MAX_VERSIONS
 * 
 * @param {Array} versions - Historique actuel
 * @param {Object} newVersion - Nouvelle version à ajouter
 * @returns {Array} Historique mis à jour (max MAX_VERSIONS)
 */
export function addVersion(versions = [], newVersion) {
  if (!newVersion || !newVersion.data) {
    log.warn('⚠️ Version invalide, ignorée');
    return versions;
  }

  // Ajouter nouvelle version
  const updatedVersions = [...versions, newVersion];

  // Trier par version (croissant)
  updatedVersions.sort((a, b) => a.version - b.version);

  // ✅ Nettoyage automatique : garder seulement MAX_VERSIONS dernières
  if (updatedVersions.length > MAX_VERSIONS) {
    const toRemove = updatedVersions.length - MAX_VERSIONS;
    const removed = updatedVersions.splice(0, toRemove);
    log.debug(`🗑️ ${removed.length} anciennes versions supprimées (limite ${MAX_VERSIONS})`);
  }

  log.debug(`✅ Version ajoutée (${updatedVersions.length}/${MAX_VERSIONS} versions)`);

  return updatedVersions;
}

/**
 * Restaure une version précédente
 * 
 * @param {Array} versions - Historique complet
 * @param {number} targetVersion - Version à restaurer (optionnel, défaut: version - 1)
 * @returns {Object|null} Image restaurée (format v2 ou v3) ou null si impossible
 */
export function rollbackToVersion(versions = [], targetVersion = null) {
  if (!versions || versions.length === 0) {
    log.warn('⚠️ Aucune version disponible pour rollback');
    return null;
  }

  // Trier par version (décroissant : plus récent d'abord)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  // Si targetVersion non spécifié, restaurer version précédente (version - 1)
  if (targetVersion === null) {
    if (sortedVersions.length < 2) {
      log.warn('⚠️ Impossible rollback : moins de 2 versions disponibles');
      return null;
    }
    targetVersion = sortedVersions[1].version; // Version précédente
  }

  // Trouver version cible
  const targetVersionData = sortedVersions.find(v => v.version === targetVersion);
  
  if (!targetVersionData) {
    log.warn(`⚠️ Version ${targetVersion} non trouvée`);
    return null;
  }

  // Reconstruire image selon format
  let restoredImage;
  
  if (targetVersionData.metadata?.format === 'v3' || targetVersionData.thumbnail) {
    // Format v3 : objet avec full + thumbnail
    restoredImage = {
      full: targetVersionData.data,
      thumbnail: targetVersionData.thumbnail || null,
      format: targetVersionData.metadata?.format || null,
      metadata: {
        ...targetVersionData.metadata,
        restoredFrom: targetVersion,
        restoredAt: new Date().toISOString()
      }
    };
  } else {
    // Format v2 : string directe
    restoredImage = targetVersionData.data;
  }

  log.debug(`✅ Version ${targetVersion} restaurée`);

  return restoredImage;
}

/**
 * Obtient l'historique des versions d'une image
 * 
 * @param {Array} versions - Historique complet
 * @returns {Array} Historique formaté (version, timestamp, action, size)
 */
export function getVersionHistory(versions = []) {
  if (!versions || versions.length === 0) {
    return [];
  }

  return versions
    .sort((a, b) => b.version - a.version) // Plus récent d'abord
    .map(v => ({
      version: v.version,
      timestamp: v.timestamp,
      action: v.action,
      size: v.data?.length || 0,
      hasThumbnail: !!v.thumbnail,
      metadata: v.metadata || {}
    }));
}

/**
 * Nettoie les versions anciennes (garder seulement N dernières)
 * 
 * @param {Array} versions - Historique complet
 * @param {number} keepCount - Nombre de versions à garder (défaut: MAX_VERSIONS)
 * @returns {Array} Historique nettoyé
 */
export function cleanOldVersions(versions = [], keepCount = MAX_VERSIONS) {
  if (!versions || versions.length <= keepCount) {
    return versions;
  }

  // Trier par version (croissant)
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  // Garder seulement N dernières
  const cleaned = sorted.slice(-keepCount);
  const removed = sorted.length - cleaned.length;

  if (removed > 0) {
    log.debug(`🗑️ ${removed} anciennes versions nettoyées (gardé ${keepCount} dernières)`);
  }

  return cleaned;
}

/**
 * Calcule la taille totale de l'historique des versions
 * 
 * @param {Array} versions - Historique complet
 * @returns {number} Taille totale en bytes
 */
export function calculateVersionsSize(versions = []) {
  if (!versions || versions.length === 0) {
    return 0;
  }

  return versions.reduce((total, v) => {
    const dataSize = v.data?.length || 0;
    const thumbSize = v.thumbnail?.length || 0;
    return total + dataSize + thumbSize;
  }, 0);
}

/**
 * Vérifie si le versioning doit être activé pour une image
 * 
 * @param {string|Object} imageData - Image à vérifier
 * @param {string} action - Action effectuée
 * @returns {boolean} True si versioning activé
 */
export function shouldEnableVersioning(imageData, action) {
  // ✅ Versioning activé seulement pour :
  // - Modifications (replace, modify)
  // - Pas pour uploads initiaux (pour économiser espace)
  
  const versioningActions = ['replace', 'modify', 'rollback'];
  return versioningActions.includes(action);
}

/**
 * Prépare les versions pour export JSON
 * 
 * @param {Array} versions - Historique complet
 * @param {Object} options - Options export
 * @param {boolean} options.includeVersions - Inclure versions (défaut: false)
 * @param {number} options.maxVersionsExport - Max versions à exporter (défaut: 3)
 * @returns {Array|null} Versions formatées pour export ou null
 */
export function prepareVersionsForExport(versions = [], options = {}) {
  const {
    includeVersions = false,
    maxVersionsExport = 3
  } = options;

  if (!includeVersions || !versions || versions.length === 0) {
    return null;
  }

  // Trier par version (décroissant : plus récent d'abord)
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  // Exporter seulement N dernières versions (pour limiter taille export)
  const toExport = sorted.slice(0, maxVersionsExport);

  return toExport.map(v => ({
    version: v.version,
    data: v.data,
    thumbnail: v.thumbnail || null,
    timestamp: v.timestamp,
    action: v.action,
    metadata: v.metadata || {}
  }));
}

