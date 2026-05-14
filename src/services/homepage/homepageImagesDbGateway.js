/**
 * Schéma IndexedDB fonds d’accueil (HomepageImagesDB).
 * Aligné sur `useHomepageImages.js` (v3, store `images`, index type/timestamp).
 *
 * @module services/homepage/homepageImagesDbGateway
 */

export const HOMEPAGE_IMAGES_DB_NAME = 'HomepageImagesDB';
export const HOMEPAGE_IMAGES_DB_VERSION = 3;
export const STORE_HOMEPAGE_IMAGES = 'images';

/**
 * @param {IDBVersionChangeEvent} event
 * @param {{ debug?: (...args: unknown[]) => void, warn?: (...args: unknown[]) => void }} [log]
 */
export function applyHomepageImagesSchemaUpgrade(event, log) {
  const dbg = log?.debug ?? (() => {});
  const wrn = log?.warn ?? (() => {});

  const db = event.target.result;
  const oldVersion = event.oldVersion;

  dbg(`🔄 Mise à jour IndexedDB de v${oldVersion} à v${db.version}...`);

  let imageStore;
  if (!db.objectStoreNames.contains(STORE_HOMEPAGE_IMAGES)) {
    dbg('📦 Création de l\'object store "images"...');
    imageStore = db.createObjectStore(STORE_HOMEPAGE_IMAGES, { keyPath: 'id' });
    imageStore.createIndex('type', 'type', { unique: false });
    imageStore.createIndex('timestamp', 'timestamp', { unique: false });
    dbg('✅ Object store "images" créé avec ses index');
  } else {
    dbg('✅ Object store "images" existe déjà');
    imageStore = event.target.transaction.objectStore(STORE_HOMEPAGE_IMAGES);
    try {
      const indexNames = imageStore.indexNames;
      if (!indexNames.contains('type')) {
        dbg('📦 Création index "type" manquant...');
        imageStore.createIndex('type', 'type', { unique: false });
        dbg('✅ Index "type" créé');
      } else {
        dbg('✅ Index "type" existe déjà');
      }
      if (!indexNames.contains('timestamp')) {
        dbg('📦 Création index "timestamp" manquant...');
        imageStore.createIndex('timestamp', 'timestamp', { unique: false });
        dbg('✅ Index "timestamp" créé');
      } else {
        dbg('✅ Index "timestamp" existe déjà');
      }
    } catch (indexError) {
      wrn('⚠️ Erreur création index (peut être normal):', indexError?.message);
    }
  }

  if (oldVersion < 3) {
    dbg('🔄 Migration v2 → v3: Ajout support thumbnails...');
    dbg('✅ Migration v3: Structure compatible (thumbnail optionnel)');
  }

  dbg('✅ IndexedDB mis à jour pour les images');
}

/**
 * Ouvre la base HomepageImages (schéma aligné `applyHomepageImagesSchemaUpgrade`).
 * À utiliser depuis les composants au lieu de `indexedDB.open` direct.
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openHomepageImagesDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB indisponible'));
      return;
    }
    const request = indexedDB.open(HOMEPAGE_IMAGES_DB_NAME, HOMEPAGE_IMAGES_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => applyHomepageImagesSchemaUpgrade(event);
    request.onsuccess = () => resolve(request.result);
  });
}
