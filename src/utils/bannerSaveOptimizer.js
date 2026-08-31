/**
 * 💾 MODULE OPTIMISATION SAUVEGARDE BANNIÈRES
 * 
 * Optimise les sauvegardes avec :
 * - Debouncing intelligent (30s après dernier changement)
 * - Batch write (écritures groupées en une transaction)
 * - Sauvegarde conditionnelle (skip si pas de changement)
 * 
 * @module bannerSaveOptimizer
 */

import logger from './logger';
import { createVersion, addVersion, shouldEnableVersioning } from './bannerVersioning';

const log = logger.module('bannerSaveOptimizer');

/**
 * Délai de debounce par défaut (ms)
 */
const DEFAULT_DEBOUNCE_DELAY = 30000; // 30 secondes

/**
 * Délai maximum avant forcer sauvegarde (ms)
 */
const MAX_DEBOUNCE_DELAY = 120000; // 2 minutes

/**
 * État global pour debouncing
 */
let saveTimeout = null;
let pendingImages = null;
let lastSavedHash = null;
let lastSaveTime = null;
let saveInProgress = false;

/**
 * Calcule un hash simple pour détecter changements
 * 
 * @param {Array} images - Tableau d'images (format v2 ou v3)
 * @returns {string} Hash des images
 */
function calculateImagesHash(images) {
  if (!images || images.length === 0) {
    return 'empty';
  }

  // Hash basé sur nombre + premiers caractères de chaque image
  const hashParts = images.map((img, index) => {
    if (typeof img === 'string') {
      // Format v2 : utiliser premiers caractères
      return `${index}_${img.substring(0, 100)}`;
    } else if (typeof img === 'object' && img !== null) {
      // Format v3 : utiliser full + thumbnail si disponible
      const full = img.full || '';
      const thumb = img.thumbnail || '';
      const flags = `${img.liked ? 1 : 0}${img.hidden ? 1 : 0}${img.useOnHome === false ? 0 : 1}${img.useOnLock ? 1 : 0}`;
      return `${index}_${full.substring(0, 50)}_${thumb.substring(0, 50)}_${flags}`;
    }
    return `${index}_unknown`;
  });

  return `${images.length}_${hashParts.join('_')}`.substring(0, 500); // Limiter taille hash
}

/**
 * Sauvegarde batch optimisée dans IndexedDB avec versioning optionnel
 * 
 * @param {IDBDatabase} db - Base de données IndexedDB
 * @param {Array} images - Images à sauvegarder
 * @param {Object} options - Options sauvegarde
 * @param {boolean} options.enableVersioning - Activer versioning (défaut: false)
 * @param {string} options.action - Action effectuée ('upload', 'replace', 'modify', défaut: 'upload')
 * @param {Array} options.existingImages - Images existantes (pour détecter modifications)
 * @returns {Promise<boolean>} Succès
 */
async function saveBatchToIndexedDB(db, images, options = {}) {
  const {
    enableVersioning = false,
    action = 'upload',
    existingImages = [],
    storageType = 'homepage_background'
  } = options;
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');

      // Vérifier si index existe
      let hasTypeIndex = false;
      try {
        const indexNames = store.indexNames;
        hasTypeIndex = indexNames.contains('type');
      } catch (e) {
        hasTypeIndex = false;
      }

      // ✅ Phase 7: Supprimer anciennes images en batch (une transaction)
      // IMPORTANT: Ne supprimer QUE si on a des images à sauvegarder (éviter écrasement accidentel)
      let deletePromise;
      if (images.length === 0) {
        // ✅ Phase 7: Si tableau vide, ne rien supprimer (permet de garder les images existantes)
        deletePromise = Promise.resolve();
        log.debug('⏭️ Tableau vide, conservation des images existantes');
      } else if (hasTypeIndex) {
        const deleteRequest = store.index('type').openCursor(IDBKeyRange.only(storageType));
        deletePromise = new Promise((res, rej) => {
          deleteRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              store.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              res();
            }
          };
          deleteRequest.onerror = () => rej(deleteRequest.error);
        });
      } else {
        // Fallback : getAll et filtrer
        const allRequest = store.getAll();
        deletePromise = new Promise((res, rej) => {
          allRequest.onsuccess = (event) => {
            const allItems = event.target.result;
            const itemsToDelete = allItems.filter(item => item.type === storageType);
            
            if (itemsToDelete.length === 0) {
              res();
              return;
            }

            // Supprimer en batch (même transaction)
            const deletePromises = itemsToDelete.map(item => {
              return new Promise((r, rj) => {
                const delRequest = store.delete(item.id);
                delRequest.onsuccess = () => r();
                delRequest.onerror = () => rj(delRequest.error);
              });
            });
            
            Promise.all(deletePromises).then(() => res()).catch(rej);
          };
          allRequest.onerror = () => rej(allRequest.error);
        });
      }

      deletePromise.then(() => {
        // ✅ Phase 6: Sauvegarder toutes images en batch (une transaction)
        const timestamp = Date.now();
        let completed = 0;
        let errors = [];

        images.forEach((image, index) => {
          // Détecter format : string (v2) ou objet (v3)
          const isV3Format = typeof image === 'object' && image !== null && 'full' in image;
          
          // ✅ Phase 7: Détecter si image existe déjà (pour versioning)
          // Gérer formats v2 (string) et v3 (objet avec full)
          const existingImage = existingImages.find(existing => {
            // Extraire les données à comparer
            let imageData = null;
            let existingData = null;
            
            // Image à sauvegarder
            if (typeof image === 'string') {
              imageData = image;
            } else if (typeof image === 'object' && image !== null && image.full) {
              imageData = image.full;
            }
            
            // Image existante
            if (typeof existing === 'string') {
              existingData = existing;
            } else if (typeof existing === 'object' && existing !== null) {
              // Format v3 (objet avec full) ou format IndexedDB (objet avec data)
              existingData = existing.full || existing.data;
            }
            
            // Comparer les premiers caractères si les deux sont des strings
            if (imageData && existingData && typeof imageData === 'string' && typeof existingData === 'string') {
              return imageData.substring(0, 100) === existingData.substring(0, 100);
            }
            
            return false;
          });
          
          // ✅ Phase 4: Gérer versioning si activé et image modifiée
          let versions = [];
          if (enableVersioning && existingImage && shouldEnableVersioning(image, action)) {
            try {
              // Charger versions existantes depuis IndexedDB si disponible
              // Pour l'instant, on crée une nouvelle version
              const newVersion = createVersion(image, action, []);
              versions = addVersion([], newVersion);
              log.debug(`✅ Version créée pour image ${index} (action: ${action})`);
            } catch (versionError) {
              log.warn('⚠️ Erreur création version (non bloquant)', versionError);
            }
          }
          
          const imageData = {
            id: `homepage_bg_${timestamp}_${index}`,
            type: storageType,
            data: isV3Format ? image.full : image,
            thumbnail: isV3Format ? (image.thumbnail || null) : null,
            timestamp: new Date().toISOString(),
            quality: 'maximum',
            compressed: false,
            version: isV3Format ? '3.0' : '2.0',
            format: isV3Format ? (image.format || null) : null,
            metadata: isV3Format ? (image.metadata || null) : null,
            imageId: isV3Format ? (image.id || null) : null,
            liked: isV3Format ? Boolean(image.liked) : false,
            hidden: isV3Format ? Boolean(image.hidden) : false,
            useOnHome: isV3Format ? image.useOnHome !== false : true,
            useOnLock: isV3Format ? Boolean(image.useOnLock) : false,
            // ✅ Phase 4: Versions optionnelles (seulement si activé)
            ...(versions.length > 0 ? { versions } : {})
          };

          const request = store.add(imageData);
          
          request.onsuccess = () => {
            completed++;
            if (completed === images.length) {
              if (errors.length > 0) {
                log.warn(`⚠️ ${errors.length} erreurs lors sauvegarde batch`, errors);
              }
              log.debug(`✅ Sauvegarde batch réussie: ${completed}/${images.length} images`);
              resolve(true);
            }
          };

          request.onerror = () => {
            errors.push({ index, error: request.error });
            completed++;
            if (completed === images.length) {
              if (errors.length === images.length) {
                reject(new Error(`Toutes les sauvegardes ont échoué`));
              } else {
                log.warn(`⚠️ ${errors.length} erreurs lors sauvegarde batch`, errors);
                resolve(true); // Partiellement réussi
              }
            }
          };
        });

        // Si aucune image, résoudre immédiatement
        if (images.length === 0) {
          resolve(true);
        }
      }).catch(reject);

    } catch (error) {
      log.error('❌ Erreur sauvegarde batch IndexedDB', error);
      reject(error);
    }
  });
}

/**
 * Sauvegarde avec debouncing et batch write
 * 
 * @param {Array} images - Images à sauvegarder
 * @param {Function} saveFn - Fonction de sauvegarde (async)
 * @param {Object} options - Options
 * @param {number} options.delay - Délai debounce (ms, défaut: 30000)
 * @param {number} options.maxDelay - Délai max avant forcer (ms, défaut: 120000)
 * @param {boolean} options.force - Forcer sauvegarde immédiate (défaut: false)
 * @returns {Promise<void>}
 */
export async function debouncedBatchSave(images, saveFn, options = {}) {
  const {
    delay = DEFAULT_DEBOUNCE_DELAY,
    maxDelay = MAX_DEBOUNCE_DELAY,
    force = false
  } = options;

  // Calculer hash pour détecter changements
  const currentHash = calculateImagesHash(images);
  
  // ✅ Phase 6: Sauvegarde conditionnelle - skip si identique
  if (!force && currentHash === lastSavedHash) {
    log.debug('🔄 Aucun changement détecté, skip sauvegarde');
    return;
  }

  // Si sauvegarde en cours, annuler et reprogrammer
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  pendingImages = images;

  // Si force, sauvegarder immédiatement
  if (force) {
    log.debug('💾 Sauvegarde forcée immédiatement');
    await executeSave(saveFn);
    return;
  }

  // Vérifier si délai max atteint
  const now = Date.now();
  const timeSinceLastSave = lastSaveTime ? (now - lastSaveTime) : Infinity;
  
  if (timeSinceLastSave >= maxDelay) {
    log.debug('⏰ Délai max atteint, forcer sauvegarde');
    await executeSave(saveFn);
    return;
  }

  // Programmer sauvegarde avec debounce
  saveTimeout = setTimeout(async () => {
    await executeSave(saveFn);
  }, delay);

  log.debug(`⏳ Sauvegarde programmée dans ${delay}ms (${images.length} images)`);
}

/**
 * Exécute la sauvegarde effective
 * 
 * @param {Function} saveFn - Fonction de sauvegarde
 */
async function executeSave(saveFn) {
  if (saveInProgress) {
    log.debug('⏸️ Sauvegarde déjà en cours, skip');
    return;
  }

  if (!pendingImages) {
    log.debug('📭 Aucune image en attente');
    return;
  }

  saveInProgress = true;
  const imagesToSave = pendingImages;
  pendingImages = null;
  saveTimeout = null;

  try {
    log.debug(`💾 Exécution sauvegarde batch de ${imagesToSave.length} images...`);
    const startTime = performance.now();
    
    await saveFn(imagesToSave);
    
    const duration = performance.now() - startTime;
    const hash = calculateImagesHash(imagesToSave);
    lastSavedHash = hash;
    lastSaveTime = Date.now();
    
    log.debug(`✅ Sauvegarde batch réussie en ${duration.toFixed(2)}ms`);
  } catch (error) {
    log.error('❌ Erreur sauvegarde batch', error);
    // Remettre en attente pour retry
    pendingImages = imagesToSave;
  } finally {
    saveInProgress = false;
  }
}

/**
 * Force la sauvegarde immédiate (sans debounce)
 * 
 * @param {Array} images - Images à sauvegarder
 * @param {Function} saveFn - Fonction de sauvegarde
 */
export async function forceSave(images, saveFn) {
  // Annuler debounce en cours
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  pendingImages = images;
  await executeSave(saveFn);
}

/**
 * Nettoie le debounce (pour cleanup)
 */
export function cleanupDebounce() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingImages = null;
  saveInProgress = false;
  log.debug('🧹 Debounce nettoyé');
}

/**
 * Obtient les statistiques du debounce
 * 
 * @returns {Object} { pending, inProgress, lastSaveTime }
 */
export function getDebounceStats() {
  return {
    pending: pendingImages !== null,
    pendingCount: pendingImages ? pendingImages.length : 0,
    inProgress: saveInProgress,
    lastSaveTime,
    lastSavedHash: lastSavedHash ? lastSavedHash.substring(0, 50) + '...' : null
  };
}

/**
 * Export de la fonction batch pour utilisation directe
 */
export { saveBatchToIndexedDB };

