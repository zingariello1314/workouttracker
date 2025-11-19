/**
 * openFoodFactsService.js
 * 
 * Service pour l'intégration avec l'API OpenFoodFacts :
 * - Recherche par nom
 * - Recherche par code-barres
 * - Rate limiting intelligent (10 req/min)
 * - Cache multi-layer (Memory → IndexedDB → API)
 * - Formatage et normalisation des données
 * - Gestion d'erreurs robuste
 * 
 * @module services/nutrition/openFoodFactsService
 * @see ../../../../nouvelongletnutritionplan.md Section 3.1
 */

import { openNutritionDB, STORE_API_CACHE } from '../../hooks/nutritionDataUtils';
import { LRUCache } from '../../utils/lruCache';
import { TokenBucket } from '../../utils/tokenBucket';
import logger from '../../utils/logger';
import { NutritionConfig } from '../../config/nutrition.config';
import {
  validateOpenFoodFactsSearchResponse,
  validateOpenFoodFactsBarcodeResponse,
  validateOpenFoodFactsProduct
} from './nutritionSchemas';
import { z } from 'zod';

const log = logger.module('openFoodFactsService');

// ==================== RATE LIMITING ====================

/**
 * Gestionnaire de rate limiting pour OpenFoodFacts
 * Limite : 10 requêtes par minute (usage raisonnable)
 * 
 * ✅ OPTIMISATION : Token Bucket au lieu de sliding window (distribution équitable)
 */
class OpenFoodFactsManager {
  constructor() {
    // ✅ OPTIMISATION : Token Bucket (10 tokens, refill 1/min = 1 token toutes les 6s)
    this.tokenBucket = new TokenBucket(10, 60000);
    
    // Compatibilité : garder propriétés pour code qui pourrait les référencer
    this.maxRequests = 10;
    this.interval = 60000;
  }

  /**
   * Throttle : attendre si limite atteinte
   * 
   * ✅ OPTIMISATION : Utilise Token Bucket (refill progressif au lieu de sliding window)
   */
  async throttle() {
    // ✅ OPTIMISATION : Token Bucket gère automatiquement refill et attente
    await this.tokenBucket.consume();
  }

  /**
   * Effectue une requête avec rate limiting
   * 
   * @param {string} url - URL à requêter
   * @param {Object} options - Options fetch
   * @returns {Promise<Object>} Données JSON
   */
  async request(url, options = {}) {
    await this.throttle();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'WorkoutTracker/1.0 (Nutrition)',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      log.error('Erreur requête OpenFoodFacts:', error);
      throw error; // Propager pour fallback
    }
  }
}

// Instance singleton
const ofManager = new OpenFoodFactsManager();

// ==================== CACHE MULTI-LAYER ====================

/**
 * Cache mémoire (L1) - Instantané
 * ✅ OPTIMISATION : LRU Cache avec limite 100 entrées (évite memory leak)
 */
const memoryCache = new LRUCache(100);

/**
 * Cache IndexedDB (L2) - Rapide (10-50ms)
 */
const getCachedProduct = async (key, source = 'openfoodfacts') => {
  try {
    // L1: Memory cache
    const memoryKey = `${source}_${key}`;
    if (memoryCache.has(memoryKey)) {
      const cached = memoryCache.get(memoryKey);
      if (Date.now() - cached.timestamp < cached.ttl * 1000) {
        log.debug(`Cache L1 hit: ${key}`);
        return cached.data;
      }
      memoryCache.delete(memoryKey);
    }

    // L2: IndexedDB cache
    const db = await openNutritionDB();
    if (!db) return null;

    const tx = db.transaction([STORE_API_CACHE], 'readonly');
    const store = tx.objectStore(STORE_API_CACHE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(`${source}_${key}`);
      
      request.onsuccess = () => {
        const cached = request.result;
        
        if (!cached) {
          resolve(null);
          return;
        }

        // Vérifier expiration
        const age = Date.now() - cached.timestamp;
        const ttlMs = (cached.ttl || 86400) * 1000; // 24h par défaut
        
        if (age > ttlMs) {
          log.debug(`Cache expiré: ${key} (âge: ${Math.round(age / 1000 / 60)} min)`);
          resolve(null);
          return;
        }

        // Promouvoir en L1 (memory)
        memoryCache.set(memoryKey, {
          data: cached.data,
          timestamp: cached.timestamp,
          ttl: cached.ttl
        });

        log.debug(`Cache L2 hit: ${key}`);
        resolve(cached.data);
      };
      
      request.onerror = () => {
        log.warn('Erreur lecture cache:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    log.error('Erreur getCachedProduct:', error);
    return null;
  }
};

/**
 * Mettre en cache (L1 + L2)
 */
const cacheProduct = async (key, product, source = 'openfoodfacts', ttl = 86400) => {
  try {
    const memoryKey = `${source}_${key}`;
    const cacheKey = `${source}_${key}`;
    
    // L1: Memory cache
    memoryCache.set(memoryKey, {
      data: product,
      timestamp: Date.now(),
      ttl
    });

    // L2: IndexedDB cache
    const db = await openNutritionDB();
    if (!db) return;

    const tx = db.transaction([STORE_API_CACHE], 'readwrite');
    const store = tx.objectStore(STORE_API_CACHE);
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        key: cacheKey,
        source,
        data: product,
        timestamp: Date.now(),
        ttl
      });
      
      request.onsuccess = () => {
        log.debug(`Produit mis en cache: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        log.warn('Erreur sauvegarde cache:', request.error);
        resolve(); // Ne pas bloquer si cache échoue
      };
    });
  } catch (error) {
    log.error('Erreur cacheProduct:', error);
    // Ne pas bloquer si cache échoue
  }
};

// ==================== FORMATAGE & NORMALISATION ====================

/**
 * Normalise l'énergie (kcal ou kJ)
 */
const normalizeEnergy = (nutriments) => {
  if (!nutriments) return null;
  
  // Priorité 1: energy-kcal_100g
  if (nutriments['energy-kcal_100g']) {
    return nutriments['energy-kcal_100g'];
  }
  
  // Priorité 2: energy-kcal (convertir selon quantité)
  if (nutriments['energy-kcal']) {
    const quantity = nutriments.product_quantity || 100;
    return (nutriments['energy-kcal'] / quantity) * 100;
  }
  
  // Priorité 3: energy_100g (supposer kJ, convertir en kcal)
  if (nutriments['energy_100g']) {
    // 1 kcal = 4.184 kJ
    return nutriments['energy_100g'] / 4.184;
  }
  
  // Priorité 4: energy (convertir selon quantité)
  if (nutriments['energy']) {
    const quantity = nutriments.product_quantity || 100;
    const energyPer100 = (nutriments['energy'] / quantity) * 100;
    // Supposer kJ si > 1000, sinon kcal
    return energyPer100 > 1000 ? energyPer100 / 4.184 : energyPer100;
  }
  
  return null;
};

/**
 * Formate les données produit OpenFoodFacts
 */
const formatProductData = (product) => {
  if (!product || !product.code) {
    return null;
  }

  const nutriments = product.nutriments || {};
  
  return {
    id: product.code,
    name: product.product_name_fr || product.product_name || 'Produit inconnu',
    brand: product.brands || '',
    
    // Nutrition normalisée (par 100g)
    nutritionPer100: {
      calories: normalizeEnergy(nutriments),
      protein: nutriments['proteins_100g'] || nutriments['proteins'] || 0,
      carbs: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0,
      fat: nutriments['fat_100g'] || nutriments['fat'] || 0,
      fiber: nutriments['fiber_100g'] || nutriments['fiber'] || 0,
      sugar: nutriments['sugars_100g'] || nutriments['sugars'] || 0,
      sodium: nutriments['sodium_100g'] || (nutriments['sodium'] ? nutriments['sodium'] * 1000 : 0), // mg → g
    },
    
    // Métadonnées
    nutriScore: product.nutriscore_grade || null, // A|B|C|D|E
    novaGroup: product.nova_group || null, // 1-4 (ultra-transformé)
    ecoScore: product.ecoscore_grade || null, // A-E (impact environnement)
    
    // Sécurité
    allergens: (product.allergens_tags || []).map(tag => tag.replace(/^en:/, '')),
    additives: product.additives_tags || [],
    
    // Images
    imageUrl: product.image_url || product.image_front_url || null,
    
    // Quantité produit
    quantity: product.product_quantity || 100, // grammes
    
    // Source
    source: 'openfoodfacts',
    sourceId: product.code,
    
    // Métadonnées supplémentaires
    categories: product.categories_tags || [],
    labels: product.labels_tags || [],
    packaging: product.packaging_tags || [],
  };
};

// ==================== RECHERCHE PAR NOM ====================

/**
 * Recherche produits par nom
 * 
 * @param {string} query - Terme de recherche
 * @param {Object} options - Options
 * @param {number} options.pageSize - Nombre de résultats (défaut: 20)
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Array>} Tableau de produits formatés
 */
export const searchOpenFoodFacts = async (query, options = {}) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // ✅ PHASE 12.3 : Utiliser configuration centralisée
  const { pageSize = NutritionConfig.api.pageSize, useCache = true } = options;
  const normalizedQuery = query.trim().toLowerCase();

  try {
    // Vérifier cache d'abord
    if (useCache) {
      const cached = await getCachedProduct(`search_${normalizedQuery}`, 'openfoodfacts');
      if (cached) {
        log.debug(`Recherche depuis cache: ${query}`);
        return cached;
      }
    }

    // Requête API
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}`;
    
    const rawData = await ofManager.request(url);
    
    // ✅ PHASE 10.3 : Validation réponse brute API avec Zod
    let validatedData;
    try {
      validatedData = validateOpenFoodFactsSearchResponse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('[searchOpenFoodFacts] Erreur validation réponse API:', error.errors);
        return [];
      }
      throw error;
    }
    
    if (!validatedData.products || !Array.isArray(validatedData.products)) {
      log.warn('Réponse OpenFoodFacts invalide (pas de produits)');
      return [];
    }

    // Formater et valider produits
    const products = validatedData.products
      .map(product => {
        try {
          const formatted = formatProductData(product);
          if (!formatted) return null;
          
          // ✅ PHASE 10.3 : Validation produit formaté avec Zod
          return validateOpenFoodFactsProduct(formatted);
        } catch (error) {
          if (error instanceof z.ZodError) {
            log.warn('[searchOpenFoodFacts] Produit invalide après formatage:', error.errors[0]?.message);
            return null;
          }
          log.warn('[searchOpenFoodFacts] Erreur formatage produit:', error);
          return null;
        }
      })
      .filter(p => p !== null && p.nutritionPer100?.calories !== null && p.nutritionPer100?.calories !== undefined); // Filtrer produits invalides ou sans calories

    // Mettre en cache (TTL plus court pour recherches: 1h)
    if (useCache && products.length > 0) {
      await cacheProduct(`search_${normalizedQuery}`, products, 'openfoodfacts', 3600);
    }

    log.debug(`Recherche OpenFoodFacts: ${products.length} produits trouvés pour "${query}"`);
    return products;
  } catch (error) {
    log.error('Erreur recherche OpenFoodFacts:', error);
    return [];
  }
};

// ==================== RECHERCHE PAR CODE-BARRES ====================

/**
 * Recherche produit par code-barres
 * 
 * @param {string} barcode - Code-barres (EAN-13, EAN-8, UPC, etc.)
 * @param {Object} options - Options
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Object|null>} Produit formaté ou null si non trouvé
 */
export const getProductByBarcode = async (barcode, options = {}) => {
  if (!barcode || !/^\d{8,13}$/.test(barcode)) {
    log.warn(`Code-barres invalide: ${barcode}`);
    return null;
  }

  const { useCache = true } = options;

  try {
    // Vérifier cache d'abord
    if (useCache) {
      const cached = await getCachedProduct(barcode, 'openfoodfacts');
      if (cached) {
        log.debug(`Produit depuis cache: ${barcode}`);
        return cached;
      }
    }

    // Requête API
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    
    const rawData = await ofManager.request(url);
    
    // ✅ PHASE 10.3 : Validation réponse brute API avec Zod
    let validatedData;
    try {
      validatedData = validateOpenFoodFactsBarcodeResponse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('[getProductByBarcode] Erreur validation réponse API:', error.errors);
        return null;
      }
      throw error;
    }
    
    if (validatedData.status === 0 || !validatedData.product) {
      log.debug(`Produit non trouvé: ${barcode}`);
      return null;
    }

    // Formater et valider produit
    try {
      const formatted = formatProductData(validatedData.product);
      
      if (!formatted) {
        log.warn(`Produit non formatable: ${barcode}`);
        return null;
      }
      
      // ✅ PHASE 10.3 : Validation produit formaté avec Zod
      const validatedProduct = validateOpenFoodFactsProduct(formatted);
      
      // Mettre en cache (TTL 24h pour codes-barres)
      if (useCache) {
        await cacheProduct(barcode, validatedProduct, 'openfoodfacts', 86400);
      }

      log.debug(`Produit trouvé: ${barcode} - ${validatedProduct.name}`);
      return validatedProduct;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn(`[getProductByBarcode] Produit invalide après formatage (${barcode}):`, error.errors[0]?.message);
        return null;
      }
      log.warn(`[getProductByBarcode] Erreur formatage produit (${barcode}):`, error);
      return null;
    }
  } catch (error) {
    log.error('Erreur recherche code-barres:', error);
    return null;
  }
};

// ==================== RECHERCHE AVEC FALLBACK ====================

/**
 * Recherche avec fallback (favoris → cache → OpenFoodFacts → USDA)
 * 
 * @param {string} query - Terme de recherche
 * @param {Object} options - Options
 * @returns {Promise<Array>} Tableau de produits
 */
export const searchFoodWithFallback = async (query, options = {}) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { searchInFavorites, searchUSDA } = options;

  try {
    // 1. Rechercher dans favoris d'abord (instantané, 0 requête API)
    if (searchInFavorites && typeof searchInFavorites === 'function') {
      const favorites = await searchInFavorites(query);
      if (favorites && favorites.length > 0) {
        log.debug(`Favoris trouvés: ${favorites.length} pour "${query}"`);
        return favorites;
      }
    }

    // 2. Vérifier cache API (IndexedDB)
    const cached = await getCachedProduct(`search_${query.trim().toLowerCase()}`, 'openfoodfacts');
    if (cached) {
      log.debug(`Cache hit pour: "${query}"`);
      return cached;
    }

    // 3. OpenFoodFacts (avec rate limiting)
    try {
      const products = await searchOpenFoodFacts(query, { useCache: true });
      if (products && products.length > 0) {
        return products;
      }
    } catch (error) {
      log.warn('Erreur OpenFoodFacts, tentative fallback USDA:', error);
    }

    // 4. Fallback USDA (si disponible)
    if (searchUSDA && typeof searchUSDA === 'function') {
      try {
        const usdaResults = await searchUSDA(query);
        if (usdaResults && usdaResults.length > 0) {
          log.debug(`Fallback USDA: ${usdaResults.length} résultats pour "${query}"`);
          return usdaResults;
        }
      } catch (error) {
        log.warn('Erreur USDA fallback:', error);
      }
    }

    // 5. Retourner résultats vides
    return [];
  } catch (error) {
    log.error('Erreur searchFoodWithFallback:', error);
    return [];
  }
};

// ==================== NETTOYAGE CACHE ====================

/**
 * Nettoie le cache expiré
 * 
 * @param {number} maxAge - Âge maximum en ms (défaut: 7 jours)
 */
export const cleanupExpiredCache = async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const db = await openNutritionDB();
    if (!db) return;

    const tx = db.transaction([STORE_API_CACHE], 'readwrite');
    const store = tx.objectStore(STORE_API_CACHE);
    const index = store.index('source');
    
    // Récupérer tous les caches OpenFoodFacts
    const request = index.getAll('openfoodfacts');
    
    request.onsuccess = () => {
      const entries = request.result || [];
      const now = Date.now();
      let deletedCount = 0;

      entries.forEach(entry => {
        const age = now - entry.timestamp;
        const ttlMs = (entry.ttl || 86400) * 1000;
        
        // Supprimer si expiré ou trop ancien
        if (age > ttlMs || age > maxAge) {
          store.delete(entry.key);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        log.info(`Cache nettoyé: ${deletedCount} entrées expirées supprimées`);
      }
    };
  } catch (error) {
    log.error('Erreur nettoyage cache:', error);
  }
};

// Export manager pour tests
export { ofManager };

