/**
 * 🔍 MODULE DÉTECTION CORRUPTION BANNIÈRES
 * 
 * Système de validation d'intégrité pour les bannières :
 * - Validation Base64 (format, taille)
 * - Checksum SHA-256 (optionnel, pour performance)
 * - Test chargement image (vérifier que l'image peut être chargée)
 * - Détection corruption silencieuse
 * - Réparation automatique (fallback vers version précédente ou localStorage)
 * 
 * @module bannerIntegrity
 */

import logger from './logger';

const log = logger.module('bannerIntegrity');

/**
 * Taille minimale d'une image Base64 valide (bytes)
 */
const MIN_IMAGE_SIZE = 100;

/**
 * Taille maximale d'une image Base64 valide (bytes)
 */
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Timeout pour test chargement image (ms)
 */
const IMAGE_LOAD_TIMEOUT = 5000; // 5 secondes

/**
 * Calcule un checksum SHA-256 pour une chaîne Base64
 * 
 * @param {string} data - Données Base64
 * @returns {Promise<string>} Checksum SHA-256 en hexadécimal
 */
async function calculateChecksum(data) {
  if (!data || typeof data !== 'string') {
    throw new Error('Données invalides pour calcul checksum');
  }

  try {
    const encoder = new TextEncoder();
    const hashData = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256:${hashHex}`;
  } catch (error) {
    log.warn('⚠️ Erreur calcul checksum SHA-256, fallback hash simple', error);
    // Fallback : hash simple (non cryptographique)
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `simple:${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Teste si une image peut être chargée
 * 
 * @param {string} imageData - Data URL de l'image
 * @returns {Promise<boolean>} True si l'image peut être chargée
 */
function testImageLoad(imageData) {
  return new Promise((resolve) => {
    if (!imageData || typeof imageData !== 'string') {
      resolve(false);
      return;
    }

    const img = new Image();
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, IMAGE_LOAD_TIMEOUT);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false);
      }
    };

    try {
      img.src = imageData;
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false);
      }
    }
  });
}

/**
 * Valide le format Base64 d'une image
 * 
 * @param {string} imageData - Data URL de l'image
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateBase64Format(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return { valid: false, error: 'Image invalide: pas une chaîne de caractères' };
  }

  if (!imageData.startsWith('data:image/')) {
    return { valid: false, error: 'Image invalide: ne commence pas par data:image/' };
  }

  if (imageData.length < MIN_IMAGE_SIZE) {
    return { valid: false, error: `Image invalide: trop petite (<${MIN_IMAGE_SIZE} bytes)` };
  }

  if (imageData.length > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image invalide: trop volumineuse (>${MAX_IMAGE_SIZE / 1024 / 1024}MB)` };
  }

  // Vérifier format Base64 valide (après data:image/...;base64,)
  const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!base64Match || !base64Match[1]) {
    return { valid: false, error: 'Image invalide: format Base64 invalide' };
  }

  const base64Data = base64Match[1];
  // Vérifier que les caractères Base64 sont valides
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
    return { valid: false, error: 'Image invalide: caractères Base64 invalides' };
  }

  return { valid: true };
}

/**
 * Vérifie l'intégrité complète d'une image
 * 
 * @param {string|Object} imageData - Image à valider (format v2 string ou v3 object)
 * @param {Object} options - Options de validation
 * @param {boolean} options.checkChecksum - Vérifier checksum si présent (défaut: true)
 * @param {boolean} options.testLoad - Tester chargement image (défaut: true)
 * @param {string} options.expectedChecksum - Checksum attendu (optionnel)
 * @returns {Promise<Object>} { valid: boolean, error?: string, checksum?: string, details?: Object }
 */
export async function validateImageIntegrity(imageData, options = {}) {
  const {
    checkChecksum = true,
    testLoad = true,
    expectedChecksum = null
  } = options;

  try {
    // Extraire données selon format
    let dataToValidate;
    let metadata = {};

    if (typeof imageData === 'string') {
      // Format v2 : string directe
      dataToValidate = imageData;
      metadata = { format: 'v2' };
    } else if (typeof imageData === 'object' && imageData !== null) {
      // Format v3 : objet avec full + thumbnail
      dataToValidate = imageData.full || imageData.data || imageData;
      metadata = {
        format: 'v3',
        hasThumbnail: !!imageData.thumbnail,
        hasMetadata: !!imageData.metadata
      };
    } else {
      return {
        valid: false,
        error: 'Format image invalide pour validation intégrité'
      };
    }

    // 1. Validation format Base64
    const formatValidation = validateBase64Format(dataToValidate);
    if (!formatValidation.valid) {
      return {
        valid: false,
        error: formatValidation.error,
        details: { step: 'format_validation', metadata }
      };
    }

    // 2. Vérification checksum (optionnel, pour performance)
    let calculatedChecksum = null;
    if (checkChecksum) {
      try {
        calculatedChecksum = await calculateChecksum(dataToValidate);
        
        // Si checksum attendu fourni, comparer
        if (expectedChecksum) {
          if (calculatedChecksum !== expectedChecksum) {
            return {
              valid: false,
              error: 'Checksum invalide - corruption détectée',
              checksum: calculatedChecksum,
              expectedChecksum,
              details: { step: 'checksum_validation', metadata }
            };
          }
        }
      } catch (checksumError) {
        log.warn('⚠️ Erreur calcul checksum (non bloquant)', checksumError);
        // Continuer même si checksum échoue (non bloquant)
      }
    }

    // 3. Test chargement image (optionnel, pour performance)
    if (testLoad) {
      const canLoad = await testImageLoad(dataToValidate);
      if (!canLoad) {
        return {
          valid: false,
          error: 'Image non chargeable - corruption détectée',
          checksum: calculatedChecksum,
          details: { step: 'load_test', metadata }
        };
      }
    }

    // Toutes les validations passées
    return {
      valid: true,
      checksum: calculatedChecksum,
      details: {
        step: 'all_validations_passed',
        metadata,
        size: dataToValidate.length,
        format: dataToValidate.substring(5, dataToValidate.indexOf(';'))
      }
    };

  } catch (error) {
    log.error('❌ Erreur validation intégrité', error);
    return {
      valid: false,
      error: `Erreur validation: ${error.message}`,
      details: { step: 'exception', error: error.message }
    };
  }
}

/**
 * Valide un tableau d'images et retourne les résultats
 * 
 * @param {Array} images - Tableau d'images à valider
 * @param {Object} options - Options de validation
 * @returns {Promise<Object>} { valid: Array, invalid: Array, stats: Object }
 */
export async function validateImagesBatch(images, options = {}) {
  if (!images || !Array.isArray(images)) {
    return {
      valid: [],
      invalid: [],
      stats: { total: 0, valid: 0, invalid: 0 }
    };
  }

  const results = await Promise.all(
    images.map(async (img, index) => {
      const validation = await validateImageIntegrity(img, options);
      return { index, image: img, validation };
    })
  );

  const valid = results.filter(r => r.validation.valid).map(r => r.image);
  const invalid = results.filter(r => !r.validation.valid);

  log.debug(`✅ Validation batch: ${valid.length}/${images.length} images valides`);

  return {
    valid,
    invalid,
    stats: {
      total: images.length,
      valid: valid.length,
      invalid: invalid.length,
      invalidDetails: invalid.map(r => ({
        index: r.index,
        error: r.validation.error,
        details: r.validation.details
      }))
    }
  };
}

/**
 * Détecte et répare les images corrompues
 * 
 * @param {Array} images - Tableau d'images à vérifier
 * @param {Object} options - Options de réparation
 * @param {Function} options.getFallback - Fonction pour obtenir fallback (version précédente, localStorage, etc.)
 * @returns {Promise<Object>} { repaired: Array, failed: Array, stats: Object }
 */
export async function detectAndRepairCorruption(images, options = {}) {
  const { getFallback = null } = options;

  if (!images || !Array.isArray(images)) {
    return {
      repaired: [],
      failed: [],
      stats: { total: 0, repaired: 0, failed: 0 }
    };
  }

  // Valider toutes les images
  const validation = await validateImagesBatch(images, {
    checkChecksum: true,
    testLoad: true
  });

  const repaired = [];
  const failed = [];

  // Tenter réparation pour images invalides
  for (const invalidItem of validation.invalid) {
    let repairedImage = null;

    // Essayer fallback si disponible
    if (getFallback && typeof getFallback === 'function') {
      try {
        repairedImage = await getFallback(invalidItem.index, invalidItem.image);
        if (repairedImage) {
          // Re-valider l'image réparée
          const revalidation = await validateImageIntegrity(repairedImage, {
            checkChecksum: false, // Skip checksum pour performance
            testLoad: true
          });
          
          if (revalidation.valid) {
            repaired.push({
              originalIndex: invalidItem.index,
              original: invalidItem.image,
              repaired: repairedImage,
              error: invalidItem.validation.error
            });
            log.debug(`✅ Image ${invalidItem.index} réparée via fallback`);
            continue;
          }
        }
      } catch (fallbackError) {
        log.warn(`⚠️ Erreur fallback pour image ${invalidItem.index}`, fallbackError);
      }
    }

    // Si réparation échouée, marquer comme failed
    failed.push({
      index: invalidItem.index,
      image: invalidItem.image,
      error: invalidItem.validation.error,
      details: invalidItem.validation.details
    });
  }

  log.debug(`🔧 Réparation: ${repaired.length} réparées, ${failed.length} échouées`);

  return {
    repaired,
    failed,
    stats: {
      total: images.length,
      valid: validation.valid.length,
      invalid: validation.invalid.length,
      repaired: repaired.length,
      failed: failed.length
    }
  };
}

