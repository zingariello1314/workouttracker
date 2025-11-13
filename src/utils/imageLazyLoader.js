/**
 * 🖼️ MODULE LAZY LOADING INTELLIGENT
 * 
 * Chargement progressif des images : thumbnail → full (si visible).
 * Utilise IntersectionObserver pour détecter visibilité.
 * Cache mémoire intelligent pour éviter rechargements.
 * 
 * @module imageLazyLoader
 */

import logger from './logger';

const log = logger.module('imageLazyLoader');

/**
 * Taille maximale du cache mémoire (nombre d'images)
 */
const MAX_CACHE_SIZE = 5;

/**
 * Marge avant viewport pour préchargement (px)
 */
const PRELOAD_MARGIN = '100px';

/**
 * Cache mémoire global pour images full chargées
 * Structure : Map<imageId, fullImageData>
 */
const imageCache = new Map();

/**
 * Observers actifs (pour cleanup)
 */
const activeObservers = new Set();

/**
 * Charge une image full depuis données (format v3 ou v2)
 * 
 * @param {string|Object} imageData - Image data (string v2 ou objet v3)
 * @returns {Promise<string>} Data URL de l'image full
 */
async function loadFullImage(imageData) {
  // Si déjà en cache, retourner immédiatement
  const cacheKey = typeof imageData === 'string' ? imageData : imageData.full;
  if (imageCache.has(cacheKey)) {
    log.debug('✅ Image full depuis cache');
    return imageCache.get(cacheKey);
  }

  // Format v3 : retourner full directement
  if (typeof imageData === 'object' && imageData !== null && 'full' in imageData) {
    const fullData = imageData.full;
    // Mettre en cache
    addToCache(cacheKey, fullData);
    return fullData;
  }

  // Format v2 : string directe
  if (typeof imageData === 'string') {
    addToCache(cacheKey, imageData);
    return imageData;
  }

  throw new Error('Format image invalide pour lazy loading');
}

/**
 * Ajoute une image au cache (avec gestion taille max)
 * 
 * @param {string} key - Clé cache
 * @param {string} data - Data URL image
 */
function addToCache(key, data) {
  // Si cache plein, supprimer la plus ancienne (FIFO)
  if (imageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
    log.debug(`🗑️ Image supprimée du cache: ${firstKey.substring(0, 20)}...`);
  }

  imageCache.set(key, data);
  log.debug(`💾 Image ajoutée au cache (${imageCache.size}/${MAX_CACHE_SIZE})`);
}

/**
 * Précharge une image full (pour images adjacentes)
 * 
 * @param {string|Object} imageData - Image data
 * @returns {Promise<void>}
 */
export async function preloadImage(imageData) {
  try {
    const fullData = await loadFullImage(imageData);
    
    // Précharger avec Image object (cache navigateur)
    const img = new Image();
    img.src = fullData;
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        log.debug('✅ Image préchargée');
        resolve();
      };
      img.onerror = reject;
    });
  } catch (error) {
    log.warn('⚠️ Erreur préchargement image', error);
  }
}

/**
 * Précharge les images adjacentes (pour rotation automatique fluide)
 * 
 * @param {Array} images - Toutes les images
 * @param {number} currentIndex - Index image actuelle
 * @param {number} preloadCount - Nombre d'images à précharger (défaut: 2)
 */
export async function preloadAdjacentImages(images, currentIndex, preloadCount = 2) {
  if (!images || images.length === 0) return;

  const preloadPromises = [];

  // Précharger images suivantes et précédentes
  for (let i = 1; i <= preloadCount; i++) {
    // Image suivante
    const nextIndex = (currentIndex + i) % images.length;
    if (nextIndex !== currentIndex && images[nextIndex]) {
      preloadPromises.push(preloadImage(images[nextIndex]));
    }

    // Image précédente
    const prevIndex = (currentIndex - i + images.length) % images.length;
    if (prevIndex !== currentIndex && images[prevIndex]) {
      preloadPromises.push(preloadImage(images[prevIndex]));
    }
  }

  // Précharger en parallèle (non-bloquant)
  return Promise.all(preloadPromises).catch(error => {
    log.warn('⚠️ Erreur préchargement images adjacentes', error);
    return []; // Retourner tableau vide en cas d'erreur
  });
}

/**
 * Crée un lazy loader avec IntersectionObserver
 * 
 * @param {HTMLElement} container - Container des images
 * @param {Array} images - Tableau d'images (format v2 ou v3)
 * @param {Object} options - Options lazy loading
 * @param {string} options.rootMargin - Marge avant viewport (défaut: '100px')
 * @param {number} options.threshold - Seuil visibilité 0-1 (défaut: 0.01)
 * @param {Function} options.onImageLoad - Callback quand image chargée
 * @returns {Object} { observer, cache, cleanup }
 */
export function createLazyImageLoader(container, images, options = {}) {
  const {
    rootMargin = PRELOAD_MARGIN,
    threshold = 0.01,
    onImageLoad = null
  } = options;

  if (!container) {
    log.warn('⚠️ Container invalide pour lazy loader');
    return null;
  }

  log.debug('🔄 Création lazy loader', {
    imageCount: images.length,
    rootMargin,
    threshold
  });

  // Observer pour détecter visibilité
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const imgElement = entry.target;
        const imageId = imgElement.dataset.imageId;
        const imageIndex = parseInt(imgElement.dataset.imageIndex || '0', 10);
        
        // Trouver données image
        const imageData = images[imageIndex] || images.find(img => 
          typeof img === 'object' && img.id === imageId
        );

        if (!imageData) {
          log.warn(`⚠️ Image non trouvée: ${imageId}`);
          return;
        }

        // Vérifier si déjà chargée
        const cacheKey = typeof imageData === 'string' ? imageData : imageData.full;
        if (imageCache.has(cacheKey)) {
          // Déjà en cache, utiliser directement
          imgElement.src = imageCache.get(cacheKey);
          imgElement.classList.add('loaded');
          log.debug('✅ Image full depuis cache');
          return;
        }

        // Charger image full (qualité 100%)
        loadFullImage(imageData)
          .then(fullData => {
            // Mettre à jour src seulement si élément toujours visible
            if (imgElement && imgElement.dataset.imageId === imageId) {
              imgElement.src = fullData;
              imgElement.classList.add('loaded');
              
              log.debug('✅ Image full chargée', {
                imageId: imageId.substring(0, 20) + '...',
                size: `${(fullData.length / 1024 / 1024).toFixed(2)} MB`
              });

              // Callback si fourni
              if (onImageLoad) {
                onImageLoad({
                  imageId,
                  imageIndex,
                  fullData,
                  cached: false
                });
              }

              // Précharger images adjacentes (pour rotation fluide)
              preloadAdjacentImages(images, imageIndex, 1);
            }
          })
          .catch(error => {
            log.error('❌ Erreur chargement image full', error);
            // En cas d'erreur, garder thumbnail si disponible
            if (typeof imageData === 'object' && imageData.thumbnail) {
              imgElement.src = imageData.thumbnail;
            }
          });
      }
    });
  }, {
    root: null,
    rootMargin: rootMargin,
    threshold: threshold
  });

  // Observer toutes les images avec attribut data-lazy-image
  const lazyImages = container.querySelectorAll('[data-lazy-image]');
  lazyImages.forEach(img => {
    observer.observe(img);
  });

  log.debug(`✅ ${lazyImages.length} images observées pour lazy loading`);

  // Stocker observer pour cleanup
  activeObservers.add(observer);

  return {
    observer,
    cache: imageCache,
    cleanup: () => {
      observer.disconnect();
      activeObservers.delete(observer);
      log.debug('🧹 Lazy loader nettoyé');
    }
  };
}

/**
 * Nettoie tous les observers actifs
 */
export function cleanupAllObservers() {
  activeObservers.forEach(observer => {
    observer.disconnect();
  });
  activeObservers.clear();
  imageCache.clear();
  log.debug('🧹 Tous les lazy loaders nettoyés');
}

/**
 * Obtient les statistiques du cache
 * 
 * @returns {Object} { size, maxSize, keys }
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(imageCache.keys()).map(k => k.substring(0, 20) + '...')
  };
}

/**
 * Vide le cache mémoire
 */
export function clearCache() {
  const size = imageCache.size;
  imageCache.clear();
  log.debug(`🗑️ Cache vidé (${size} images supprimées)`);
}

