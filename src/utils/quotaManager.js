/**
 * 💾 MODULE DE GESTION DE QUOTA
 * 
 * Gestion proactive du quota de stockage (IndexedDB, localStorage).
 * Utilise l'API StorageManager moderne pour estimation précise.
 * 
 * @module quotaManager
 */

import logger from './logger';

const log = logger.module('quotaManager');

/**
 * Seuils de notification
 */
const QUOTA_THRESHOLDS = {
  WARNING: 80,   // Avertissement à 80%
  CRITICAL: 90   // Critique à 90%
};

/**
 * Overhead Base64 (Base64 = 4 caractères pour 3 bytes = +33%)
 */
const BASE64_OVERHEAD = 1.33;

/**
 * Limite localStorage estimée (varie selon navigateur, ~5-10MB)
 */
const LOCALSTORAGE_ESTIMATED_LIMIT = 5 * 1024 * 1024; // 5MB conservateur

/**
 * Obtient le quota IndexedDB via l'API StorageManager
 * 
 * @returns {Promise<Object>} { quota, usage } en bytes
 */
async function getIndexedDBQuota() {
  try {
    // API moderne StorageManager (supportée Chrome 55+, Firefox 51+, Safari 11.1+)
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      
      // estimate.quota = quota total pour l'origine (IndexedDB + localStorage + Cache API)
      // estimate.usage = usage total pour l'origine
      
      // Note: L'API ne donne pas le quota spécifique à IndexedDB
      // On utilise le quota total comme approximation (IndexedDB est généralement le plus gros)
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    } else {
      // Fallback: Estimation basée sur espace disque disponible
      log.warn('API StorageManager non supportée, utilisation estimation');
      return {
        quota: 50 * 1024 * 1024 * 1024, // 50GB estimation conservatrice
        usage: 0,
        available: 50 * 1024 * 1024 * 1024
      };
    }
  } catch (error) {
    log.error('Erreur récupération quota IndexedDB', error);
    // Fallback: Estimation conservatrice
    return {
      quota: 50 * 1024 * 1024 * 1024, // 50GB
      usage: 0,
      available: 50 * 1024 * 1024 * 1024
    };
  }
}

/**
 * Estime l'utilisation localStorage
 * 
 * @returns {Object} { used, quota, available } en bytes
 */
function getLocalStorageQuota() {
  try {
    let used = 0;
    
    // Calculer taille utilisée (parcourir toutes les clés)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Taille approximative (chaîne UTF-16 = 2 bytes par caractère)
          used += key.length * 2 + value.length * 2;
        }
      }
    }
    
    return {
      quota: LOCALSTORAGE_ESTIMATED_LIMIT,
      used: used,
      available: Math.max(0, LOCALSTORAGE_ESTIMATED_LIMIT - used)
    };
  } catch (error) {
    log.error('Erreur calcul localStorage', error);
    return {
      quota: LOCALSTORAGE_ESTIMATED_LIMIT,
      used: 0,
      available: LOCALSTORAGE_ESTIMATED_LIMIT
    };
  }
}

/**
 * Calcule l'utilisation actuelle des bannières dans IndexedDB
 * 
 * @returns {Promise<number>} Taille utilisée en bytes
 */
async function getCurrentBannerUsage() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(0);
      return;
    }

    // ✅ Phase 7: Utiliser version 3 (cohérent avec useHomepageImages)
    const request = indexedDB.open('HomepageImagesDB', 3);

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('images')) {
        db.close();
        resolve(0);
        return;
      }

      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');

      // Essayer d'utiliser l'index 'type' si disponible
      let getAllRequest;
      try {
        const index = store.index('type');
        getAllRequest = index.getAll(IDBKeyRange.only('homepage_background'));
      } catch (error) {
        getAllRequest = store.getAll();
      }

      getAllRequest.onsuccess = (e) => {
        let images = e.target.result;

        // Filtrer si fallback utilisé
        if (getAllRequest === store.getAll()) {
          images = images.filter(item => item.type === 'homepage_background');
        }

        // Calculer taille totale (approximation)
        const totalSize = images.reduce((sum, img) => {
          // Taille de l'objet stocké (data Base64 + métadonnées)
          const dataSize = img.data ? img.data.length : 0;
          const metadataSize = JSON.stringify({
            id: img.id,
            type: img.type,
            timestamp: img.timestamp,
            quality: img.quality,
            compressed: img.compressed,
            version: img.version
          }).length;
          
          // IndexedDB stocke en UTF-16 (2 bytes par caractère)
          return sum + (dataSize * 2) + (metadataSize * 2);
        }, 0);

        db.close();
        resolve(totalSize);
      };

      getAllRequest.onerror = () => {
        db.close();
        resolve(0);
      };
    };

    request.onerror = () => {
      resolve(0);
    };
  });
}

/**
 * Estime le quota disponible pour les bannières
 * 
 * @returns {Promise<Object>} Quota détaillé IndexedDB et localStorage
 */
export async function estimateAvailableQuota() {
  try {
    log.debug('📊 Calcul quota disponible...');

    // 1. Quota IndexedDB (via StorageManager)
    const indexedDBQuota = await getIndexedDBQuota();

    // 2. Utilisation actuelle des bannières
    const currentBannerUsage = await getCurrentBannerUsage();

    // 3. Quota localStorage
    const localStorageQuota = getLocalStorageQuota();

    // Calculer pourcentage utilisation IndexedDB
    // Note: On utilise currentBannerUsage comme approximation de l'usage total
    // (en réalité, l'usage total inclut aussi Garmin, BodyTracking, etc.)
    const indexedDBPercentage = indexedDBQuota.quota > 0
      ? (indexedDBQuota.usage / indexedDBQuota.quota) * 100
      : 0;

    const localStoragePercentage = localStorageQuota.quota > 0
      ? (localStorageQuota.used / localStorageQuota.quota) * 100
      : 0;

    const result = {
      indexedDB: {
        total: indexedDBQuota.quota,
        used: indexedDBQuota.usage, // Usage total origine (toutes apps)
        bannerUsage: currentBannerUsage, // Usage spécifique bannières
        available: indexedDBQuota.available,
        percentage: indexedDBPercentage,
        bannerPercentage: indexedDBQuota.quota > 0
          ? (currentBannerUsage / indexedDBQuota.quota) * 100
          : 0
      },
      localStorage: {
        total: localStorageQuota.quota,
        used: localStorageQuota.used,
        available: localStorageQuota.available,
        percentage: localStoragePercentage
      },
      timestamp: new Date().toISOString()
    };

    log.debug('✅ Quota calculé', {
      indexedDB: {
        total: `${(result.indexedDB.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(result.indexedDB.used / 1024 / 1024 / 1024).toFixed(2)} GB`,
        bannerUsage: `${(result.indexedDB.bannerUsage / 1024 / 1024).toFixed(2)} MB`,
        available: `${(result.indexedDB.available / 1024 / 1024 / 1024).toFixed(2)} GB`,
        percentage: `${result.indexedDB.percentage.toFixed(1)}%`
      },
      localStorage: {
        total: `${(result.localStorage.total / 1024 / 1024).toFixed(2)} MB`,
        used: `${(result.localStorage.used / 1024 / 1024).toFixed(2)} MB`,
        available: `${(result.localStorage.available / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${result.localStorage.percentage.toFixed(1)}%`
      }
    });

    return result;

  } catch (error) {
    log.error('❌ Erreur calcul quota', error);
    // Retourner valeurs par défaut en cas d'erreur
    return {
      indexedDB: {
        total: 50 * 1024 * 1024 * 1024,
        used: 0,
        bannerUsage: 0,
        available: 50 * 1024 * 1024 * 1024,
        percentage: 0,
        bannerPercentage: 0
      },
      localStorage: {
        total: LOCALSTORAGE_ESTIMATED_LIMIT,
        used: 0,
        available: LOCALSTORAGE_ESTIMATED_LIMIT,
        percentage: 0
      },
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Calcule la taille requise pour uploader des fichiers (avec overhead Base64)
 * 
 * @param {FileList|Array<File>} files - Fichiers à uploader
 * @returns {number} Taille requise en bytes (avec overhead Base64)
 */
export function calculateRequiredSize(files) {
  if (!files || files.length === 0) {
    return 0;
  }

  const fileArray = Array.from(files);
  const totalFileSize = fileArray.reduce((sum, file) => sum + file.size, 0);
  
  // Taille Base64 = taille fichier × 1.33 (overhead)
  const base64Size = Math.ceil(totalFileSize * BASE64_OVERHEAD);
  
  // Ajouter overhead métadonnées (approximation ~500 bytes par image)
  const metadataOverhead = fileArray.length * 500;
  
  return base64Size + metadataOverhead;
}

/**
 * Vérifie si l'upload est possible avec les fichiers donnés
 * 
 * @param {FileList|Array<File>} files - Fichiers à uploader
 * @returns {Promise<Object>} { canUpload, required, available, warning, critical }
 */
export async function canUploadImages(files) {
  try {
    const required = calculateRequiredSize(files);
    const quota = await estimateAvailableQuota();

    const canUpload = required < quota.indexedDB.available;
    const warning = quota.indexedDB.percentage > QUOTA_THRESHOLDS.WARNING;
    const critical = quota.indexedDB.percentage > QUOTA_THRESHOLDS.CRITICAL;

    return {
      canUpload,
      required,
      available: quota.indexedDB.available,
      warning,
      critical,
      quota: quota.indexedDB,
      message: canUpload
        ? null
        : `Quota insuffisant. Requis: ${formatBytes(required)}, Disponible: ${formatBytes(quota.indexedDB.available)}`
    };
  } catch (error) {
    log.error('❌ Erreur vérification upload', error);
    // En cas d'erreur, autoriser l'upload (ne pas bloquer)
    return {
      canUpload: true,
      required: calculateRequiredSize(files),
      available: 0,
      warning: false,
      critical: false,
      error: error.message
    };
  }
}

/**
 * Vérifie le quota et génère des notifications si nécessaire
 * 
 * @param {Function} onWarning - Callback si warning (quota > 80%)
 * @param {Function} onCritical - Callback si critique (quota > 90%)
 * @returns {Promise<Object>} Quota actuel
 */
export async function checkQuotaAndNotify(onWarning = null, onCritical = null) {
  try {
    const quota = await estimateAvailableQuota();

    if (quota.indexedDB.percentage > QUOTA_THRESHOLDS.CRITICAL) {
      const message = `🚨 Quota IndexedDB critique (${quota.indexedDB.percentage.toFixed(1)}%) - Export recommandé avant problème`;
      log.warn(message);
      
      if (onCritical) {
        onCritical({
          level: 'CRITICAL',
          percentage: quota.indexedDB.percentage,
          message: message,
          suggestion: 'Exportez vos bannières maintenant pour éviter toute perte de données'
        });
      }
    } else if (quota.indexedDB.percentage > QUOTA_THRESHOLDS.WARNING) {
      const message = `⚠️ Quota IndexedDB élevé (${quota.indexedDB.percentage.toFixed(1)}%) - Considérer export`;
      log.warn(message);
      
      if (onWarning) {
        onWarning({
          level: 'WARNING',
          percentage: quota.indexedDB.percentage,
          message: message,
          suggestion: 'Pensez à exporter vos bannières pour libérer de l\'espace'
        });
      }
    }

    return quota;
  } catch (error) {
    log.error('❌ Erreur vérification quota', error);
    throw error;
  }
}

/**
 * Formate des bytes en format lisible
 * 
 * @param {number} bytes - Taille en bytes
 * @returns {string} Format lisible (KB, MB, GB)
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formate un pourcentage avec couleur selon seuil
 * 
 * @param {number} percentage - Pourcentage (0-100)
 * @returns {Object} { value, color, status }
 */
export function formatQuotaPercentage(percentage) {
  if (percentage >= QUOTA_THRESHOLDS.CRITICAL) {
    return {
      value: percentage.toFixed(1),
      color: 'text-red-400',
      status: 'critical',
      label: 'Critique'
    };
  } else if (percentage >= QUOTA_THRESHOLDS.WARNING) {
    return {
      value: percentage.toFixed(1),
      color: 'text-yellow-400',
      status: 'warning',
      label: 'Élevé'
    };
  } else {
    return {
      value: percentage.toFixed(1),
      color: 'text-green-400',
      status: 'ok',
      label: 'Normal'
    };
  }
}

