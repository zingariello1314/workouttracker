/**
 * ✅ PHASE 1.4 : Module de cache pour décompression des time series Garmin
 * 
 * Ce module implémente un système de cache LRU (Least Recently Used) pour
 * mémoriser les résultats de décompression des time series compressées.
 * 
 * Objectifs :
 * - Éviter les décompressions redondantes (même données décompressées plusieurs fois)
 * - Améliorer les performances d'affichage des graphiques
 * - Limiter la consommation mémoire (cache LRU avec taille max)
 * - Fournir des statistiques pour monitoring
 * 
 * Optimisations :
 * - Cache LRU : Évince les entrées les moins récemment utilisées
 * - Hash rapide : Utilise JSON.stringify + hash simple pour clé
 * - Taille limitée : 50 entrées max (configurable)
 * - Statistiques : Hit/miss ratio pour monitoring
 * 
 * @module garminTimeSeriesCache
 */

import logger from './logger.js';

const log = logger.module('garminTimeSeriesCache');

/**
 * Configuration du cache
 */
const CACHE_CONFIG = {
  MAX_SIZE: 50, // Nombre maximum d'entrées dans le cache
  ENABLE_STATS: true // Activer les statistiques
};

/**
 * Cache LRU pour résultats de décompression
 * Structure : Map avec ordre d'insertion (LRU)
 */
const decompressionCache = new Map();

/**
 * Statistiques du cache
 */
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  totalRequests: 0
};

/**
 * Calcule un hash simple et rapide d'une time series
 * 
 * Utilise JSON.stringify pour créer une clé unique.
 * Pour optimiser, on peut utiliser seulement les premiers et derniers points
 * + nombre de points si la time series est très grande.
 * 
 * @param {Array} timeSeries - Time series à hasher
 * @returns {string} Hash de la time series
 */
const hashTimeSeries = (timeSeries) => {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) {
    return 'empty';
  }
  
  // Pour les grandes time series, utiliser seulement métadonnées + échantillonnage
  if (timeSeries.length > 100) {
    // Utiliser premier point, dernier point, nombre de points, et quelques points intermédiaires
    const sampleSize = Math.min(10, Math.floor(timeSeries.length / 10));
    const step = Math.floor(timeSeries.length / sampleSize);
    const samples = [];
    
    // Premier point
    samples.push(timeSeries[0]);
    
    // Points échantillonnés
    for (let i = step; i < timeSeries.length - step; i += step) {
      samples.push(timeSeries[i]);
    }
    
    // Dernier point
    samples.push(timeSeries[timeSeries.length - 1]);
    
    return JSON.stringify({
      length: timeSeries.length,
      samples: samples,
      first: timeSeries[0],
      last: timeSeries[timeSeries.length - 1]
    });
  }
  
  // Pour petites time series, utiliser JSON complet
  return JSON.stringify(timeSeries);
};

/**
 * Obtient une time series décompressée depuis le cache ou la décompresse
 * 
 * Cette fonction :
 * 1. Calcule le hash de la time series compressée
 * 2. Vérifie si le résultat est en cache
 * 3. Si oui, retourne depuis le cache (hit)
 * 4. Si non, décompresse et met en cache (miss)
 * 5. Gère l'éviction LRU si le cache est plein
 * 
 * @param {Array} compressed - Time series compressée
 * @param {Function} decompressFn - Fonction de décompression
 * @returns {Array} Time series décompressée
 */
export const getDecompressed = (compressed, decompressFn) => {
  if (!compressed || !Array.isArray(compressed)) {
    return compressed || [];
  }
  
  // Vérifier si déjà décompressée (pas de d_ts/d_val)
  const isCompressed = compressed.length > 1 && 
                       compressed[1] && 
                       (compressed[1].d_ts !== undefined || compressed[1].d_val !== undefined);
  
  if (!isCompressed) {
    // Déjà décompressée, pas besoin de cache
    return compressed;
  }
  
  // Calculer la clé de cache
  const cacheKey = hashTimeSeries(compressed);
  
  // Mettre à jour les statistiques
  if (CACHE_CONFIG.ENABLE_STATS) {
    cacheStats.totalRequests++;
  }
  
  // Vérifier le cache
  if (decompressionCache.has(cacheKey)) {
    // Cache hit : récupérer et déplacer en fin (LRU)
    const cached = decompressionCache.get(cacheKey);
    decompressionCache.delete(cacheKey);
    decompressionCache.set(cacheKey, cached);
    
    if (CACHE_CONFIG.ENABLE_STATS) {
      cacheStats.hits++;
    }
    
    log.debug(`[getDecompressed] Cache HIT for key: ${cacheKey.substring(0, 50)}...`);
    return cached.decompressed;
  }
  
  // Cache miss : décompresser
  log.debug(`[getDecompressed] Cache MISS for key: ${cacheKey.substring(0, 50)}..., decompressing...`);
  
  const startTime = performance.now();
  const decompressed = decompressFn(compressed);
  const duration = performance.now() - startTime;
  
  if (CACHE_CONFIG.ENABLE_STATS) {
    cacheStats.misses++;
  }
  
  log.debug(`[getDecompressed] Decompressed ${compressed.length} points → ${decompressed.length} points in ${duration.toFixed(2)}ms`);
  
  // Gérer l'éviction LRU si le cache est plein
  if (decompressionCache.size >= CACHE_CONFIG.MAX_SIZE) {
    // Évincer la première entrée (la moins récemment utilisée)
    const firstKey = decompressionCache.keys().next().value;
    decompressionCache.delete(firstKey);
    
    if (CACHE_CONFIG.ENABLE_STATS) {
      cacheStats.evictions++;
    }
    
    log.debug(`[getDecompressed] Cache eviction: removed oldest entry (cache size: ${decompressionCache.size})`);
  }
  
  // Mettre en cache
  decompressionCache.set(cacheKey, {
    decompressed,
    timestamp: Date.now(),
    compressedLength: compressed.length,
    decompressedLength: decompressed.length
  });
  
  return decompressed;
};

/**
 * Vide le cache de décompression
 * 
 * Utile pour libérer la mémoire ou forcer une nouvelle décompression.
 */
export const clearCache = () => {
  const size = decompressionCache.size;
  decompressionCache.clear();
  
  if (CACHE_CONFIG.ENABLE_STATS) {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.evictions = 0;
    cacheStats.totalRequests = 0;
  }
  
  log.info(`[clearCache] Cache cleared (${size} entries removed)`);
};

/**
 * Obtient les statistiques du cache
 * 
 * @returns {Object} Statistiques du cache
 * @returns {number} returns.hits - Nombre de cache hits
 * @returns {number} returns.misses - Nombre de cache misses
 * @returns {number} returns.evictions - Nombre d'évictions
 * @returns {number} returns.totalRequests - Nombre total de requêtes
 * @returns {number} returns.hitRatio - Ratio de hits (0-1)
 * @returns {number} returns.size - Taille actuelle du cache
 * @returns {number} returns.maxSize - Taille max du cache
 */
export const getCacheStats = () => {
  const hitRatio = cacheStats.totalRequests > 0 
    ? cacheStats.hits / cacheStats.totalRequests 
    : 0;
  
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    evictions: cacheStats.evictions,
    totalRequests: cacheStats.totalRequests,
    hitRatio: Math.round(hitRatio * 100) / 100,
    hitRatioPercent: Math.round(hitRatio * 100),
    size: decompressionCache.size,
    maxSize: CACHE_CONFIG.MAX_SIZE
  };
};

/**
 * Obtient les métadonnées d'une time series sans décompression complète
 * 
 * Cette fonction permet de comparer des time series ou prendre des décisions
 * sans avoir à décompresser complètement les données.
 * 
 * @param {Array} timeSeries - Time series (peut être compressée ou non)
 * @returns {Object} Métadonnées de la time series
 * @returns {number} returns.pointCount - Nombre de points
 * @returns {boolean} returns.isCompressed - Si compressée (delta encoding)
 * @returns {number|null} returns.firstTimestamp - Premier timestamp (si disponible)
 * @returns {number|null} returns.lastTimestamp - Dernier timestamp (si disponible)
 * @returns {number|null} returns.firstValue - Première valeur (si disponible)
 * @returns {number|null} returns.lastValue - Dernière valeur (si disponible)
 */
export const getTimeSeriesMetadata = (timeSeries) => {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) {
    return {
      pointCount: 0,
      isCompressed: false,
      firstTimestamp: null,
      lastTimestamp: null,
      firstValue: null,
      lastValue: null
    };
  }
  
  // Vérifier si compressée
  const isCompressed = timeSeries.length > 1 && 
                       timeSeries[1] && 
                       (timeSeries[1].d_ts !== undefined || timeSeries[1].d_val !== undefined);
  
  const first = timeSeries[0];
  const last = timeSeries[timeSeries.length - 1];
  
  // Déterminer les clés pour value et timestamp
  const valueKey = first.bpm !== undefined ? 'bpm' : 
                   first.value !== undefined ? 'value' : 
                   first.level !== undefined ? 'level' : 'value';
  const timestampKey = 'timestamp';
  
  // Extraire premier timestamp et valeur
  let firstTimestamp = first[timestampKey];
  if (typeof firstTimestamp === 'string') {
    firstTimestamp = new Date(firstTimestamp).getTime();
  } else if (typeof firstTimestamp !== 'number') {
    firstTimestamp = null;
  }
  
  const firstValue = first[valueKey] || null;
  
  // Pour les time series compressées, estimer le dernier timestamp
  // en utilisant le premier timestamp + nombre de points * interval moyen
  let lastTimestamp = null;
  let lastValue = null;
  
  if (isCompressed && timeSeries.length > 1) {
    // Pour compressée, estimer le dernier timestamp
    // On peut utiliser une estimation basée sur le nombre de points
    // et un interval moyen (par exemple 60s pour FC)
    const estimatedInterval = 60 * 1000; // 60 secondes en ms
    lastTimestamp = firstTimestamp ? firstTimestamp + (timeSeries.length - 1) * estimatedInterval : null;
    
    // Pour la dernière valeur, on ne peut pas la connaître sans décompression
    // mais on peut estimer qu'elle est proche de la première (ou utiliser une valeur par défaut)
    lastValue = firstValue; // Estimation
  } else {
    // Pour non compressée, extraire directement
    let ts = last[timestampKey];
    if (typeof ts === 'string') {
      ts = new Date(ts).getTime();
    } else if (typeof ts !== 'number') {
      ts = null;
    }
    lastTimestamp = ts;
    lastValue = last[valueKey] || null;
  }
  
  return {
    pointCount: timeSeries.length,
    isCompressed,
    firstTimestamp,
    lastTimestamp,
    firstValue,
    lastValue
  };
};

/**
 * Configure le cache (taille max, activation stats)
 * 
 * @param {Object} config - Configuration
 * @param {number} config.maxSize - Taille max du cache (défaut: 50)
 * @param {boolean} config.enableStats - Activer statistiques (défaut: true)
 */
export const configureCache = (config) => {
  if (config.maxSize !== undefined && config.maxSize > 0) {
    CACHE_CONFIG.MAX_SIZE = config.maxSize;
    log.info(`[configureCache] Max size set to ${config.maxSize}`);
    
    // Évincer les entrées en trop si nécessaire
    while (decompressionCache.size > CACHE_CONFIG.MAX_SIZE) {
      const firstKey = decompressionCache.keys().next().value;
      decompressionCache.delete(firstKey);
      if (CACHE_CONFIG.ENABLE_STATS) {
        cacheStats.evictions++;
      }
    }
  }
  
  if (config.enableStats !== undefined) {
    CACHE_CONFIG.ENABLE_STATS = config.enableStats;
    log.info(`[configureCache] Stats ${config.enableStats ? 'enabled' : 'disabled'}`);
  }
};

