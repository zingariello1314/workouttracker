/**
 * 🖼️ MODULE D'IMPORT BANNIÈRES
 * 
 * Importe des bannières depuis un fichier JSON (compressé ou non).
 * Valide l'intégrité, détecte les doublons et fusionne intelligemment.
 * 
 * @module bannerImport
 */

import { decompressJSON } from '../components/tabs/GarminTab/utils/jsonCompression';
import logger from './logger';

const log = logger.module('bannerImport');

/**
 * Version minimale supportée pour l'import
 */
const MIN_SUPPORTED_VERSION = '2.0';

/**
 * Lit un fichier et retourne son contenu
 * 
 * @param {File} file - Fichier à lire
 * @returns {Promise<string>} Contenu du fichier (JSON string)
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        resolve(event.target.result);
      } catch (error) {
        reject(new Error(`Erreur lecture fichier: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Détecte si les données sont compressées
 * 
 * @param {string|Object} data - Données à vérifier
 * @returns {boolean} True si compressé
 */
function isCompressed(data) {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' && parsed.compressed === true;
    } catch {
      return false;
    }
  }
  return data && typeof data === 'object' && data.compressed === true;
}

/**
 * Valide la structure d'un export
 * 
 * @param {Object} data - Données à valider
 * @throws {Error} Si structure invalide
 */
function validateExportFormat(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Format d\'export invalide: données non valides');
  }

  // Vérifier version
  if (!data.version) {
    throw new Error('Format d\'export invalide: version manquante');
  }

  const version = parseFloat(data.version);
  const minVersion = parseFloat(MIN_SUPPORTED_VERSION);
  
  if (version < minVersion) {
    throw new Error(
      `Version d'export trop ancienne: ${data.version} (minimum: ${MIN_SUPPORTED_VERSION})`
    );
  }

  // Vérifier présence images
  if (!data.images || !Array.isArray(data.images)) {
    throw new Error('Format d\'export invalide: images manquantes ou invalides');
  }

  // Valider chaque image
  data.images.forEach((img, index) => {
    if (!img.id || !img.data) {
      throw new Error(
        `Image invalide à l'index ${index}: id ou data manquant`
      );
    }

    if (!img.data.startsWith('data:image/')) {
      throw new Error(
        `Image invalide à l'index ${index}: format Base64 invalide`
      );
    }

    if (img.data.length < 100) {
      throw new Error(
        `Image invalide à l'index ${index}: taille trop petite`
      );
    }

    // ✅ Phase 3: Valider thumbnail si présent (optionnel)
    if (img.thumbnail && !img.thumbnail.startsWith('data:image/')) {
      throw new Error(
        `Image invalide à l'index ${index}: format Base64 thumbnail invalide`
      );
    }

    // ✅ Phase 4: Valider versions si présentes (optionnel)
    if (img.versions && Array.isArray(img.versions)) {
      img.versions.forEach((v, vIndex) => {
        if (!v.data || !v.timestamp || !v.version) {
          log.warn(`⚠️ Version invalide à l'index ${vIndex} pour image ${index}`);
        }
        if (v.data && !v.data.startsWith('data:image/')) {
          log.warn(`⚠️ Version ${vIndex} format Base64 invalide pour image ${index}`);
        }
      });
    }
  });

  log.debug('✅ Structure d\'export validée', {
    version: data.version,
    imageCount: data.images.length
  });
}

/**
 * Vérifie le checksum d'un export
 * 
 * @param {Object} data - Données d'export
 * @returns {Promise<boolean>} True si checksum valide
 */
async function verifyChecksum(data) {
  if (!data.checksum) {
    log.warn('⚠️ Aucun checksum présent dans l\'export');
    return true; // Accepter si pas de checksum (compatibilité)
  }

  try {
    // Recalculer checksum des images
    const images = data.images || [];
    const dataString = JSON.stringify(
      images.map(img => ({
        id: img.id,
        timestamp: img.timestamp,
        dataLength: img.data?.length || 0
      }))
    );

    const encoder = new TextEncoder();
    const hashData = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedChecksum = `sha256:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;

    const isValid = calculatedChecksum === data.checksum;

    if (!isValid) {
      log.error('❌ Checksum invalide', {
        expected: data.checksum.substring(0, 20) + '...',
        calculated: calculatedChecksum.substring(0, 20) + '...'
      });
    } else {
      log.debug('✅ Checksum valide');
    }

    return isValid;
  } catch (error) {
    log.warn('⚠️ Erreur vérification checksum, acceptation par défaut', error);
    return true; // Accepter en cas d'erreur (compatibilité)
  }
}

/**
 * Charge toutes les images existantes depuis IndexedDB
 * 
 * @returns {Promise<Array>} Tableau d'objets images existantes
 */
async function loadExistingImages() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    // ✅ Phase 3: Utiliser version 3 pour support thumbnails
    const request = indexedDB.open('HomepageImagesDB', 3);

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('images')) {
        db.close();
        resolve([]);
        return;
      }

      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');

      let getAllRequest;
      try {
        const index = store.index('type');
        getAllRequest = index.getAll(IDBKeyRange.only('homepage_background'));
      } catch (error) {
        getAllRequest = store.getAll();
      }

      getAllRequest.onsuccess = (e) => {
        let results = e.target.result;

        if (getAllRequest === store.getAll()) {
          results = results.filter(item => item.type === 'homepage_background');
        }

        db.close();
        resolve(results);
      };

      getAllRequest.onerror = (e) => {
        db.close();
        reject(e.target.error);
      };
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Fusionne intelligemment les images existantes et nouvelles
 * 
 * @param {Array} existingImages - Images existantes
 * @param {Array} newImages - Images à importer
 * @param {boolean} skipDuplicates - Ignorer les doublons (défaut: true)
 * @returns {Array} Images fusionnées
 */
function mergeImages(existingImages, newImages, skipDuplicates = true) {
  const existingIds = new Set(existingImages.map(img => img.id));
  const existingDataHashes = new Set(
    existingImages.map(img => {
      // Hash simple basé sur les premiers caractères de data
      return img.data?.substring(0, 100) || '';
    })
  );

  const merged = [...existingImages];
  let skipped = 0;
  let added = 0;

  newImages.forEach(newImg => {
    // Vérifier doublon par ID
    if (skipDuplicates && existingIds.has(newImg.id)) {
      skipped++;
      log.debug(`⏭️ Image ${newImg.id} déjà présente (ID), ignorée`);
      return;
    }

    // Vérifier doublon par contenu (hash simple)
    const newDataHash = newImg.data?.substring(0, 100) || '';
    if (skipDuplicates && existingDataHashes.has(newDataHash)) {
      skipped++;
      log.debug(`⏭️ Image ${newImg.id} déjà présente (contenu), ignorée`);
      return;
    }

    // Ajouter nouvelle image
    merged.push(newImg);
    existingIds.add(newImg.id);
    existingDataHashes.add(newDataHash);
    added++;
  });

  log.debug('✅ Fusion images', {
    existing: existingImages.length,
    new: newImages.length,
    added,
    skipped,
    total: merged.length
  });

  return merged;
}

/**
 * Sauvegarde les images dans IndexedDB
 * 
 * @param {Array} images - Images à sauvegarder
 * @returns {Promise<void>}
 */
async function saveImagesToIndexedDB(images) {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    // ✅ Phase 3: Utiliser version 3 pour support thumbnails
    const request = indexedDB.open('HomepageImagesDB', 3);

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('images')) {
        db.close();
        reject(new Error('Object store "images" manquant'));
        return;
      }

      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');

      // Supprimer toutes les images existantes de type homepage_background
      let deletePromise;
      try {
        const index = store.index('type');
        const deleteRequest = index.openCursor(IDBKeyRange.only('homepage_background'));
        deletePromise = new Promise((res, rej) => {
          deleteRequest.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              store.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              res();
            }
          };
          deleteRequest.onerror = () => rej(deleteRequest.error);
        });
      } catch (error) {
        // Fallback : getAll et filtrer
        const getAllRequest = store.getAll();
        deletePromise = new Promise((res, rej) => {
          getAllRequest.onsuccess = (e) => {
            const allItems = e.target.result;
            const itemsToDelete = allItems.filter(item => item.type === 'homepage_background');
            
            if (itemsToDelete.length === 0) {
              res();
              return;
            }

            const deletePromises = itemsToDelete.map(item => {
              return new Promise((r, rj) => {
                const delRequest = store.delete(item.id);
                delRequest.onsuccess = () => r();
                delRequest.onerror = () => rj(delRequest.error);
              });
            });
            
            Promise.all(deletePromises).then(() => res()).catch(rej);
          };
          getAllRequest.onerror = () => rej(getAllRequest.error);
        });
      }

      deletePromise.then(() => {
        // Ajouter toutes les nouvelles images
        // ✅ Phase 7: Convertir en format IndexedDB (v3 avec thumbnail ou v2 string)
        const addPromises = images.map((img, index) => {
          // Détecter format : string (v2), objet v3 (full), ou objet IndexedDB (data)
          const isV3Format = typeof img === 'object' && img !== null && 'full' in img;
          const isIndexedDBFormat = typeof img === 'object' && img !== null && 'data' in img && !('full' in img);
          
          const imageData = {
            id: img.id || `homepage_bg_${Date.now()}_${index}`,
            type: img.type || 'homepage_background',
            // Format v3 : full → data, Format IndexedDB : data, Format v2 : string → data
            data: isV3Format ? img.full : (isIndexedDBFormat ? img.data : (typeof img === 'string' ? img : img.data || img)),
            // ✅ Phase 7: Thumbnail optionnel (v3 uniquement)
            thumbnail: isV3Format ? (img.thumbnail || null) : (isIndexedDBFormat ? (img.thumbnail || null) : null),
            timestamp: img.timestamp || new Date().toISOString(),
            quality: img.quality || 'maximum',
            compressed: img.compressed || false,
            version: isV3Format ? '3.0' : (isIndexedDBFormat ? (img.version || '2.0') : '2.0'),
            // ✅ Phase 7: Format optimal et métadonnées (v3)
            format: isV3Format ? (img.format || null) : (isIndexedDBFormat ? (img.format || null) : null),
            metadata: isV3Format ? (img.metadata || null) : (isIndexedDBFormat ? (img.metadata || null) : null)
          };
          
          return new Promise((res, rej) => {
            const addRequest = store.add(imageData);
            addRequest.onsuccess = () => res();
            addRequest.onerror = () => rej(addRequest.error);
          });
        });

        Promise.all(addPromises)
          .then(() => {
            db.close();
            log.debug(`✅ ${images.length} images sauvegardées dans IndexedDB`);
            resolve();
          })
          .catch(reject);
      }).catch(reject);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Importe des bannières depuis un fichier
 * 
 * @param {File} file - Fichier JSON à importer
 * @param {Object} options - Options d'import
 * @param {boolean} options.merge - Fusionner avec images existantes (défaut: true)
 * @param {boolean} options.skipDuplicates - Ignorer doublons (défaut: true)
 * @param {boolean} options.verifyChecksum - Vérifier checksum (défaut: true)
 * @returns {Promise<Object>} Résultat import avec statistiques
 */
export async function importBanners(file, options = {}) {
  const {
    merge = true,
    skipDuplicates = true,
    verifyChecksum: shouldVerifyChecksum = true
  } = options;

  try {
    log.debug('📥 Début import bannières...', { filename: file.name });

    // 1. Lire le fichier
    const content = await readFile(file);
    log.debug('✅ Fichier lu', { size: content.length });

    // 2. Décompresser si nécessaire
    let data;
    if (isCompressed(content)) {
      log.debug('📦 Décompression...');
      const decompressed = decompressJSON(content);
      data = decompressed;
    } else {
      data = JSON.parse(content);
    }

    // 3. Valider structure
    validateExportFormat(data);

    // 4. Vérifier checksum si demandé
    if (shouldVerifyChecksum) {
      const checksumValid = await verifyChecksum(data);
      if (!checksumValid) {
        throw new Error('Checksum invalide - fichier corrompu ou modifié');
      }
    }

    // 5. Charger images existantes si merge
    let existingImages = [];
    if (merge) {
      try {
        existingImages = await loadExistingImages();
        log.debug(`📦 ${existingImages.length} images existantes trouvées`);
      } catch (error) {
        log.warn('⚠️ Erreur chargement images existantes, import sans fusion', error);
      }
    }

  // 6. Fusionner intelligemment
  // ✅ Phase 7: Convertir images importées en format v3 si nécessaire
  // Note: data.images contient des objets IndexedDB avec { id, data, thumbnail, ... }
  // On doit les convertir en format utilisable par saveImagesToIndexedDB
  const imagesToImport = merge
    ? mergeImages(existingImages, data.images, skipDuplicates)
    : data.images;
  
  // ✅ Phase 7: Convertir en format v3 (pour compatibilité avec saveImagesToIndexedDB)
  // IMPORTANT: saveImagesToIndexedDB attend format v3 { full, thumbnail, format, metadata }
  // ou format v2 (string). On convertit tout en v3 pour cohérence.
  const formattedImages = imagesToImport.map(img => {
    // Si déjà format v3 (objet avec full), retourner tel quel
    if (typeof img === 'object' && img !== null && 'full' in img) {
      return img;
    }
    // Si format IndexedDB (objet avec data), convertir en format v3
    if (typeof img === 'object' && img !== null && 'data' in img) {
      return {
        full: img.data,
        thumbnail: img.thumbnail || null,
        format: img.format || null,
        metadata: img.metadata || null
      };
    }
    // Format v2 (string) : convertir en v3 pour cohérence
    if (typeof img === 'string') {
      return {
        full: img,
        thumbnail: null,
        format: null,
        metadata: null
      };
    }
    // Format inconnu : ignorer
    log.warn('⚠️ Format image inconnu ignoré', img);
    return null;
  }).filter(img => img !== null); // Filtrer les nulls

    // 7. Sauvegarder dans IndexedDB
    await saveImagesToIndexedDB(formattedImages);

    const result = {
      imported: merge 
        ? formattedImages.length - existingImages.length 
        : formattedImages.length,
      skipped: merge && skipDuplicates
        ? data.images.length - (formattedImages.length - existingImages.length)
        : 0,
      total: formattedImages.length,
      existing: existingImages.length,
      fromFile: data.images.length
    };

    log.debug('✅ Import terminé', result);

    return result;

  } catch (error) {
    log.error('❌ Erreur import bannières', error);
    throw new Error(`Erreur lors de l'import: ${error.message}`);
  }
}

