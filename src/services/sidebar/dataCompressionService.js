/**
 * Service de compression des données de synchronisation pour les modules sidebar historiques
 * Implémente la compression/décompression des données et l'optimisation des payloads
 * 
 * Requirements: 14.2 - Compression des données de synchronisation
 * 
 * @module services/sidebar/dataCompressionService
 */

import { measureSync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';

/**
 * Types de compression supportés
 */
export const COMPRESSION_TYPES = {
  NONE: 'none',
  JSON_MINIFY: 'json_minify',
  DELTA: 'delta',
  GZIP_LIKE: 'gzip_like',
  SMART: 'smart'
};

/**
 * Configuration de compression par type de données
 */
const COMPRESSION_CONFIG = {
  // Métriques vitales - compression légère pour la vitesse
  vital_metrics: {
    type: COMPRESSION_TYPES.JSON_MINIFY,
    threshold: 500,      // Compresser si > 500 bytes
    priority: 'speed'
  },
  
  // Données Garmin - compression delta pour les mises à jour fréquentes
  garmin_data: {
    type: COMPRESSION_TYPES.DELTA,
    threshold: 1000,
    priority: 'efficiency'
  },
  
  // Statistiques de lecture - compression intelligente
  reading_stats: {
    type: COMPRESSION_TYPES.SMART,
    threshold: 2000,
    priority: 'size'
  },
  
  // Données de quêtes - compression delta
  quest_data: {
    type: COMPRESSION_TYPES.DELTA,
    threshold: 800,
    priority: 'efficiency'
  },
  
  // Données financières - compression maximale
  finance_data: {
    type: COMPRESSION_TYPES.GZIP_LIKE,
    threshold: 1500,
    priority: 'size'
  },
  
  // Données de nutrition - compression modérée
  nutrition_data: {
    type: COMPRESSION_TYPES.JSON_MINIFY,
    threshold: 1200,
    priority: 'balanced'
  }
};

/**
 * Utilitaires de compression
 */
class CompressionUtils {
  /**
   * Minifie un objet JSON en supprimant les espaces et propriétés nulles
   * @param {Object} data - Données à minifier
   * @returns {string} JSON minifié
   */
  static minifyJSON(data) {
    return JSON.stringify(data, (key, value) => {
      // Supprimer les valeurs null, undefined et les chaînes vides
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      return value;
    });
  }

  /**
   * Implémentation simple d'un algorithme de compression type LZ77
   * @param {string} input - Chaîne à compresser
   * @returns {string} Chaîne compressée
   */
  static simpleCompress(input) {
    if (input.length < 50) return input; // Pas de compression pour les petites chaînes
    
    const dictionary = new Map();
    const result = [];
    let dictSize = 256;
    
    // Initialiser le dictionnaire avec les caractères ASCII
    for (let i = 0; i < 256; i++) {
      dictionary.set(String.fromCharCode(i), i);
    }
    
    let current = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const combined = current + char;
      
      if (dictionary.has(combined)) {
        current = combined;
      } else {
        result.push(dictionary.get(current));
        dictionary.set(combined, dictSize++);
        current = char;
      }
    }
    
    if (current !== '') {
      result.push(dictionary.get(current));
    }
    
    // Convertir en chaîne compacte
    return result.map(code => String.fromCharCode(code % 65536)).join('');
  }

  /**
   * Décompresse une chaîne compressée avec simpleCompress
   * @param {string} compressed - Chaîne compressée
   * @returns {string} Chaîne décompressée
   */
  static simpleDecompress(compressed) {
    if (compressed.length < 50) return compressed;
    
    const dictionary = [];
    let dictSize = 256;
    
    // Initialiser le dictionnaire
    for (let i = 0; i < 256; i++) {
      dictionary[i] = String.fromCharCode(i);
    }
    
    const codes = compressed.split('').map(char => char.charCodeAt(0));
    let current = String.fromCharCode(codes[0]);
    let result = current;
    
    for (let i = 1; i < codes.length; i++) {
      const code = codes[i];
      let entry;
      
      if (dictionary[code]) {
        entry = dictionary[code];
      } else if (code === dictSize) {
        entry = current + current[0];
      } else {
        throw new Error('Erreur de décompression');
      }
      
      result += entry;
      dictionary[dictSize++] = current + entry[0];
      current = entry;
    }
    
    return result;
  }

  /**
   * Calcule un hash simple pour identifier les changements
   * @param {string} data - Données à hasher
   * @returns {number} Hash
   */
  static simpleHash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit integer
    }
    return hash;
  }

  /**
   * Crée un patch delta entre deux objets
   * @param {Object} oldData - Anciennes données
   * @param {Object} newData - Nouvelles données
   * @returns {Object} Patch delta
   */
  static createDelta(oldData, newData) {
    const delta = {
      _type: 'delta',
      _timestamp: Date.now(),
      changes: {}
    };
    
    // Comparer récursivement les objets
    this.compareObjects(oldData, newData, delta.changes, '');
    
    return delta;
  }

  /**
   * Compare deux objets et génère les changements
   * @param {any} oldObj - Ancien objet
   * @param {any} newObj - Nouvel objet
   * @param {Object} changes - Objet des changements
   * @param {string} path - Chemin actuel
   */
  static compareObjects(oldObj, newObj, changes, path) {
    if (oldObj === newObj) return;
    
    if (typeof oldObj !== 'object' || typeof newObj !== 'object' || 
        oldObj === null || newObj === null) {
      changes[path || 'root'] = newObj;
      return;
    }
    
    // Vérifier les propriétés du nouvel objet
    for (const key in newObj) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in oldObj)) {
        changes[newPath] = { _op: 'add', value: newObj[key] };
      } else if (oldObj[key] !== newObj[key]) {
        if (typeof oldObj[key] === 'object' && typeof newObj[key] === 'object') {
          this.compareObjects(oldObj[key], newObj[key], changes, newPath);
        } else {
          changes[newPath] = { _op: 'update', value: newObj[key] };
        }
      }
    }
    
    // Vérifier les propriétés supprimées
    for (const key in oldObj) {
      if (!(key in newObj)) {
        const newPath = path ? `${path}.${key}` : key;
        changes[newPath] = { _op: 'delete' };
      }
    }
  }

  /**
   * Applique un patch delta à un objet
   * @param {Object} baseData - Données de base
   * @param {Object} delta - Patch delta
   * @returns {Object} Données mises à jour
   */
  static applyDelta(baseData, delta) {
    if (!delta || delta._type !== 'delta') {
      return baseData;
    }
    
    const result = JSON.parse(JSON.stringify(baseData)); // Deep clone
    
    for (const [path, change] of Object.entries(delta.changes)) {
      this.applyChange(result, path, change);
    }
    
    return result;
  }

  /**
   * Applique un changement à un objet selon le chemin
   * @param {Object} obj - Objet à modifier
   * @param {string} path - Chemin de la propriété
   * @param {any} change - Changement à appliquer
   */
  static applyChange(obj, path, change) {
    if (path === 'root') {
      return change;
    }
    
    const parts = path.split('.');
    let current = obj;
    
    // Naviguer jusqu'au parent de la propriété finale
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const finalKey = parts[parts.length - 1];
    
    if (typeof change === 'object' && change._op) {
      switch (change._op) {
        case 'add':
        case 'update':
          current[finalKey] = change.value;
          break;
        case 'delete':
          delete current[finalKey];
          break;
      }
    } else {
      current[finalKey] = change;
    }
  }
}

/**
 * Service de compression des données
 */
class DataCompressionService {
  constructor() {
    this.compressionCache = new Map();
    this.deltaCache = new Map();
    this.stats = {
      totalCompressions: 0,
      totalDecompressions: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      averageCompressionRatio: 0,
      compressionTime: 0,
      decompressionTime: 0
    };
  }

  /**
   * Compresse des données selon leur type
   * @param {any} data - Données à compresser
   * @param {string} dataType - Type de données
   * @param {Object} options - Options de compression
   * @returns {Object} Données compressées avec métadonnées
   */
  compress(data, dataType = 'vital_metrics', options = {}) {
    return measureSync(SIDEBAR_OPERATIONS.EVENT_EMISSION, () => {
      const config = COMPRESSION_CONFIG[dataType] || COMPRESSION_CONFIG.vital_metrics;
      const startTime = Date.now();
      
      // Sérialiser les données
      const serialized = JSON.stringify(data);
      const originalSize = serialized.length;
      
      // Vérifier si la compression est nécessaire
      if (originalSize < config.threshold) {
        return {
          data: serialized,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
          compressionType: COMPRESSION_TYPES.NONE,
          compressionRatio: 1.0,
          timestamp: Date.now()
        };
      }
      
      let compressed;
      let compressionType = config.type;
      
      // Appliquer la compression selon le type
      switch (config.type) {
        case COMPRESSION_TYPES.JSON_MINIFY:
          compressed = CompressionUtils.minifyJSON(data);
          break;
          
        case COMPRESSION_TYPES.DELTA:
          compressed = this.compressDelta(data, dataType, options);
          break;
          
        case COMPRESSION_TYPES.GZIP_LIKE:
          compressed = CompressionUtils.simpleCompress(serialized);
          break;
          
        case COMPRESSION_TYPES.SMART:
          compressed = this.smartCompress(data, dataType, options);
          compressionType = compressed.type;
          compressed = compressed.data;
          break;
          
        default:
          compressed = serialized;
          compressionType = COMPRESSION_TYPES.NONE;
      }
      
      const compressedSize = compressed.length;
      const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1.0;
      const compressionTime = Date.now() - startTime;
      
      // Mettre à jour les statistiques
      this.updateCompressionStats(originalSize, compressedSize, compressionTime);
      
      return {
        data: compressed,
        compressed: true,
        originalSize,
        compressedSize,
        compressionType,
        compressionRatio,
        compressionTime,
        timestamp: Date.now()
      };
    });
  }

  /**
   * Décompresse des données
   * @param {Object} compressedData - Données compressées avec métadonnées
   * @returns {any} Données décompressées
   */
  decompress(compressedData) {
    return measureSync(SIDEBAR_OPERATIONS.EVENT_EMISSION, () => {
      if (!compressedData.compressed) {
        return JSON.parse(compressedData.data);
      }
      
      const startTime = Date.now();
      let decompressed;
      
      switch (compressedData.compressionType) {
        case COMPRESSION_TYPES.JSON_MINIFY:
          decompressed = JSON.parse(compressedData.data);
          break;
          
        case COMPRESSION_TYPES.DELTA:
          decompressed = this.decompressDelta(compressedData);
          break;
          
        case COMPRESSION_TYPES.GZIP_LIKE:
          const decompressedString = CompressionUtils.simpleDecompress(compressedData.data);
          decompressed = JSON.parse(decompressedString);
          break;
          
        case COMPRESSION_TYPES.SMART:
          decompressed = this.smartDecompress(compressedData);
          break;
          
        default:
          decompressed = JSON.parse(compressedData.data);
      }
      
      const decompressionTime = Date.now() - startTime;
      this.updateDecompressionStats(decompressionTime);
      
      return decompressed;
    });
  }

  /**
   * Compression delta - compare avec la version précédente
   * @param {any} data - Nouvelles données
   * @param {string} dataType - Type de données
   * @param {Object} options - Options
   * @returns {string} Delta compressé
   */
  compressDelta(data, dataType, options) {
    const cacheKey = `${dataType}:${options.moduleId || 'default'}`;
    const previousData = this.deltaCache.get(cacheKey);
    
    if (!previousData) {
      // Première fois - stocker les données complètes
      const serialized = JSON.stringify(data);
      this.deltaCache.set(cacheKey, {
        data: data,
        hash: CompressionUtils.simpleHash(serialized),
        timestamp: Date.now()
      });
      return serialized;
    }
    
    // Créer le delta
    const delta = CompressionUtils.createDelta(previousData.data, data);
    const deltaString = JSON.stringify(delta);
    
    // Mettre à jour le cache
    this.deltaCache.set(cacheKey, {
      data: data,
      hash: CompressionUtils.simpleHash(JSON.stringify(data)),
      timestamp: Date.now()
    });
    
    return deltaString;
  }

  /**
   * Décompression delta
   * @param {Object} compressedData - Données compressées
   * @returns {any} Données décompressées
   */
  decompressDelta(compressedData) {
    const delta = JSON.parse(compressedData.data);
    
    if (delta._type !== 'delta') {
      // Données complètes, pas un delta
      return delta;
    }
    
    // Pour la décompression delta, on aurait besoin de la version de base
    // Dans un vrai système, on la récupérerait du cache ou du serveur
    // Ici, on retourne juste le delta (implémentation simplifiée)
    return delta;
  }

  /**
   * Compression intelligente - choisit la meilleure méthode
   * @param {any} data - Données à compresser
   * @param {string} dataType - Type de données
   * @param {Object} options - Options
   * @returns {Object} Résultat de compression avec type
   */
  smartCompress(data, dataType, options) {
    const serialized = JSON.stringify(data);
    const originalSize = serialized.length;
    
    // Tester différentes méthodes
    const methods = [
      {
        type: COMPRESSION_TYPES.JSON_MINIFY,
        data: CompressionUtils.minifyJSON(data)
      },
      {
        type: COMPRESSION_TYPES.GZIP_LIKE,
        data: CompressionUtils.simpleCompress(serialized)
      }
    ];
    
    // Choisir la méthode avec le meilleur ratio
    let bestMethod = methods[0];
    let bestRatio = bestMethod.data.length / originalSize;
    
    for (const method of methods.slice(1)) {
      const ratio = method.data.length / originalSize;
      if (ratio < bestRatio) {
        bestMethod = method;
        bestRatio = ratio;
      }
    }
    
    return bestMethod;
  }

  /**
   * Décompression intelligente
   * @param {Object} compressedData - Données compressées
   * @returns {any} Données décompressées
   */
  smartDecompress(compressedData) {
    // La méthode de décompression dépend du type stocké dans les métadonnées
    const tempData = { ...compressedData };
    
    // Utiliser la méthode de décompression appropriée
    switch (compressedData.compressionType) {
      case COMPRESSION_TYPES.JSON_MINIFY:
        return JSON.parse(compressedData.data);
      case COMPRESSION_TYPES.GZIP_LIKE:
        const decompressedString = CompressionUtils.simpleDecompress(compressedData.data);
        return JSON.parse(decompressedString);
      default:
        return JSON.parse(compressedData.data);
    }
  }

  /**
   * Met à jour les statistiques de compression
   * @param {number} originalSize - Taille originale
   * @param {number} compressedSize - Taille compressée
   * @param {number} compressionTime - Temps de compression
   */
  updateCompressionStats(originalSize, compressedSize, compressionTime) {
    this.stats.totalCompressions++;
    this.stats.bytesOriginal += originalSize;
    this.stats.bytesCompressed += compressedSize;
    this.stats.compressionTime += compressionTime;
    
    // Calculer le ratio moyen
    this.stats.averageCompressionRatio = 
      this.stats.bytesOriginal > 0 ? this.stats.bytesCompressed / this.stats.bytesOriginal : 1.0;
  }

  /**
   * Met à jour les statistiques de décompression
   * @param {number} decompressionTime - Temps de décompression
   */
  updateDecompressionStats(decompressionTime) {
    this.stats.totalDecompressions++;
    this.stats.decompressionTime += decompressionTime;
  }

  /**
   * Optimise automatiquement la configuration de compression
   * @param {string} dataType - Type de données
   * @param {Object} performanceData - Données de performance
   */
  optimizeCompressionConfig(dataType, performanceData) {
    const config = COMPRESSION_CONFIG[dataType];
    if (!config) return;
    
    // Ajuster le seuil basé sur les performances
    if (performanceData.averageCompressionTime > 100) { // > 100ms
      config.threshold *= 1.5; // Augmenter le seuil pour compresser moins souvent
    } else if (performanceData.averageCompressionTime < 10) { // < 10ms
      config.threshold *= 0.8; // Diminuer le seuil pour compresser plus souvent
    }
    
    // Ajuster le type de compression basé sur le ratio
    if (performanceData.averageCompressionRatio > 0.9) { // Compression peu efficace
      if (config.type === COMPRESSION_TYPES.JSON_MINIFY) {
        config.type = COMPRESSION_TYPES.GZIP_LIKE;
      }
    }
  }

  /**
   * Nettoie le cache delta des entrées anciennes
   */
  cleanupDeltaCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, entry] of this.deltaCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.deltaCache.delete(key);
      }
    }
  }

  /**
   * Obtient les statistiques de compression
   * @returns {Object} Statistiques détaillées
   */
  getStats() {
    const totalTime = this.stats.compressionTime + this.stats.decompressionTime;
    const totalOperations = this.stats.totalCompressions + this.stats.totalDecompressions;
    
    return {
      ...this.stats,
      averageCompressionTime: this.stats.totalCompressions > 0 
        ? this.stats.compressionTime / this.stats.totalCompressions 
        : 0,
      averageDecompressionTime: this.stats.totalDecompressions > 0 
        ? this.stats.decompressionTime / this.stats.totalDecompressions 
        : 0,
      totalOperations,
      averageOperationTime: totalOperations > 0 ? totalTime / totalOperations : 0,
      spaceSaved: this.stats.bytesOriginal - this.stats.bytesCompressed,
      spaceSavedPercentage: this.stats.bytesOriginal > 0 
        ? ((this.stats.bytesOriginal - this.stats.bytesCompressed) / this.stats.bytesOriginal * 100).toFixed(2) + '%'
        : '0%',
      deltaCacheSize: this.deltaCache.size
    };
  }

  /**
   * Reset les statistiques
   */
  resetStats() {
    this.stats = {
      totalCompressions: 0,
      totalDecompressions: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      averageCompressionRatio: 0,
      compressionTime: 0,
      decompressionTime: 0
    };
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    this.compressionCache.clear();
    this.deltaCache.clear();
    this.resetStats();
  }
}

// Instance singleton
export const dataCompressionService = new DataCompressionService();

export default dataCompressionService;