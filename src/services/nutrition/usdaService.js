/**
 * usdaService.js
 * 
 * Service pour l'intégration avec l'API USDA FoodData Central :
 * - Recherche aliments (350,000+ aliments)
 * - Rotation clés API (pool de 5-10 clés gratuites)
 * - Rate limiting (30 req/min par clé)
 * - Cache multi-layer
 * - Extraction complète nutriments (macros + micronutriments)
 * 
 * @module services/nutrition/usdaService
 * @see ../../../../nouvelongletnutritionplan.md Section 3.2
 */

import { openNutritionDB, STORE_API_CACHE } from '../../hooks/nutritionDataUtils';
import { LRUCache } from '../../utils/lruCache';
import { TokenBucket } from '../../utils/tokenBucket';
import logger from '../../utils/logger';
import { NutritionConfig } from '../../config/nutrition.config';
import {
  validateUSDASearchResponse,
  validateUSDAFoodResponse,
  validateUSDAFood
} from './nutritionSchemas';
import { z } from 'zod';

const log = logger.module('usdaService');

// ==================== CONFIGURATION ====================

/**
 * Pool de clés API USDA (rotation pour éviter blocage)
 * Stockage dans localStorage pour persistance
 */
const USDA_API_KEYS_STORAGE_KEY = 'usda_api_keys';
const USDA_CURRENT_KEY_INDEX_KEY = 'usda_current_key_index';

/**
 * Récupère le pool de clés API
 */
const getApiKeys = () => {
  try {
    const stored = localStorage.getItem(USDA_API_KEYS_STORAGE_KEY);
    if (stored) {
      const keys = JSON.parse(stored);
      return Array.isArray(keys) && keys.length > 0 ? keys : ['DEMO_KEY'];
    }
  } catch (error) {
    log.warn('Erreur lecture clés API USDA:', error);
  }
  return ['DEMO_KEY']; // Clé demo par défaut
};

/**
 * Enregistre le pool de clés API
 */
const setApiKeys = (keys) => {
  try {
    localStorage.setItem(USDA_API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    log.error('Erreur sauvegarde clés API USDA:', error);
  }
};

/**
 * Récupère l'index de la clé actuelle
 */
const getCurrentKeyIndex = () => {
  try {
    const stored = localStorage.getItem(USDA_CURRENT_KEY_INDEX_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Passe à la clé suivante (rotation)
 */
const rotateToNextKey = () => {
  const keys = getApiKeys();
  const currentIndex = getCurrentKeyIndex();
  const nextIndex = (currentIndex + 1) % keys.length;
  localStorage.setItem(USDA_CURRENT_KEY_INDEX_KEY, nextIndex.toString());
  log.debug(`Rotation clé API: ${currentIndex} → ${nextIndex}`);
  return nextIndex;
};

/**
 * Récupère la clé API actuelle
 */
const getCurrentApiKey = () => {
  const keys = getApiKeys();
  const currentIndex = getCurrentKeyIndex();
  return keys[currentIndex] || keys[0] || 'DEMO_KEY';
};

// ==================== RATE LIMITING ====================

/**
 * Gestionnaire de rate limiting pour USDA
 * Limite : 30 requêtes par minute par clé
 * 
 * ✅ OPTIMISATION : Token Bucket multi-bucket au lieu de sliding window (distribution équitable)
 */
class USDAManager {
  constructor() {
    // ✅ OPTIMISATION : Token Bucket multi-bucket (1 bucket par clé API)
    // 30 tokens, refill 1/min = 1 token toutes les 2s
    this.tokenBucket = new TokenBucket(30, 60000, { multiBucket: true });
    
    // Compatibilité : garder propriétés pour code qui pourrait les référencer
    this.maxRequests = 30;
    this.interval = 60000;
  }

  /**
   * Throttle pour une clé API spécifique
   * 
   * ✅ OPTIMISATION : Utilise Token Bucket multi-bucket (refill progressif par clé)
   */
  async throttle(apiKey) {
    const key = apiKey || 'default';
    
    // ✅ OPTIMISATION : Token Bucket gère automatiquement refill et attente par clé
    await this.tokenBucket.consume(key);
  }

  /**
   * Effectue une requête avec rate limiting et rotation de clés
   */
  async request(url, options = {}) {
    let apiKey = getCurrentApiKey();
    let retries = getApiKeys().length; // Essayer toutes les clés
    
    while (retries > 0) {
      try {
        await this.throttle(apiKey);
        
        const fullUrl = `${url}${url.includes('?') ? '&' : '?'}api_key=${apiKey}`;
        
        const response = await fetch(fullUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (response.status === 403 || response.status === 429) {
          // Clé bloquée ou rate limit, essayer clé suivante
          log.warn(`Clé API USDA bloquée (${response.status}), rotation...`);
          rotateToNextKey();
          apiKey = getCurrentApiKey();
          retries--;
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        if (retries > 1) {
          log.warn(`Erreur requête USDA, essai clé suivante... (${retries - 1} restants)`);
          rotateToNextKey();
          apiKey = getCurrentApiKey();
          retries--;
          continue;
        }
        
        log.error('Erreur requête USDA:', error);
        throw error;
      }
    }
    
    throw new Error('Toutes les clés API USDA ont échoué');
  }
}

// Instance singleton
const usdaManager = new USDAManager();

// ==================== CACHE ====================

/**
 * Cache mémoire (L1)
 * ✅ OPTIMISATION : LRU Cache avec limite 100 entrées (évite memory leak)
 */
const memoryCache = new LRUCache(100);

/**
 * Récupère depuis cache
 */
const getCachedFood = async (key) => {
  try {
    // L1: Memory
    const memoryKey = `usda_${key}`;
    if (memoryCache.has(memoryKey)) {
      const cached = memoryCache.get(memoryKey);
      if (Date.now() - cached.timestamp < cached.ttl * 1000) {
        return cached.data;
      }
      memoryCache.delete(memoryKey);
    }

    // L2: IndexedDB
    const db = await openNutritionDB();
    if (!db) return null;

    const tx = db.transaction([STORE_API_CACHE], 'readonly');
    const store = tx.objectStore(STORE_API_CACHE);
    
    return new Promise((resolve) => {
      const request = store.get(`usda_${key}`);
      
      request.onsuccess = () => {
        const cached = request.result;
        if (!cached) {
          resolve(null);
          return;
        }

        const age = Date.now() - cached.timestamp;
        const ttlMs = (cached.ttl || 86400) * 1000;
        
        if (age > ttlMs) {
          resolve(null);
          return;
        }

        memoryCache.set(memoryKey, {
          data: cached.data,
          timestamp: cached.timestamp,
          ttl: cached.ttl
        });

        resolve(cached.data);
      };
      
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    log.error('Erreur getCachedFood:', error);
    return null;
  }
};

/**
 * Met en cache
 */
const cacheFood = async (key, food, ttl = 86400) => {
  try {
    const memoryKey = `usda_${key}`;
    const cacheKey = `usda_${key}`;
    
    memoryCache.set(memoryKey, {
      data: food,
      timestamp: Date.now(),
      ttl
    });

    const db = await openNutritionDB();
    if (!db) return;

    const tx = db.transaction([STORE_API_CACHE], 'readwrite');
    const store = tx.objectStore(STORE_API_CACHE);
    
    await new Promise((resolve) => {
      const request = store.put({
        key: cacheKey,
        source: 'usda',
        data: food,
        timestamp: Date.now(),
        ttl
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Ne pas bloquer
    });
  } catch (error) {
    log.error('Erreur cacheFood:', error);
  }
};

// ==================== EXTRACTION NUTRIMENTS ====================

/**
 * Mappe les nutriments USDA vers format standard
 */
const NUTRIENT_MAP = {
  // Énergie
  'energy': { key: 'calories', unit: 'kcal' },
  'energy (kcal)': { key: 'calories', unit: 'kcal' },
  
  // Macros
  'protein': { key: 'protein', unit: 'g' },
  'carbohydrate, by difference': { key: 'carbs', unit: 'g' },
  'total lipid (fat)': { key: 'fat', unit: 'g' },
  'fiber, total dietary': { key: 'fiber', unit: 'g' },
  'sugars, total including nlea': { key: 'sugar', unit: 'g' },
  'sodium, na': { key: 'sodium', unit: 'mg' },
  
  // Micronutriments
  'vitamin c, total ascorbic acid': { key: 'vitaminC', unit: 'mg' },
  'calcium, ca': { key: 'calcium', unit: 'mg' },
  'iron, fe': { key: 'iron', unit: 'mg' },
  'vitamin a, rae': { key: 'vitaminA', unit: 'mcg' },
  'vitamin d (d2 + d3)': { key: 'vitaminD', unit: 'mcg' },
  'vitamin e (alpha-tocopherol)': { key: 'vitaminE', unit: 'mg' },
  'vitamin k (phylloquinone)': { key: 'vitaminK', unit: 'mcg' },
  'thiamin': { key: 'thiamin', unit: 'mg' },
  'riboflavin': { key: 'riboflavin', unit: 'mg' },
  'niacin': { key: 'niacin', unit: 'mg' },
  'vitamin b-6': { key: 'vitaminB6', unit: 'mg' },
  'folate, total': { key: 'folate', unit: 'mcg' },
  'vitamin b-12': { key: 'vitaminB12', unit: 'mcg' },
  'magnesium, mg': { key: 'magnesium', unit: 'mg' },
  'phosphorus, p': { key: 'phosphorus', unit: 'mg' },
  'potassium, k': { key: 'potassium', unit: 'mg' },
  'zinc, zn': { key: 'zinc', unit: 'mg' },
};

/**
 * Extrait et normalise les nutriments USDA
 */
const extractNutrition = (foodNutrients) => {
  if (!foodNutrients || !Array.isArray(foodNutrients)) {
    return {};
  }

  const nutrition = {
    // Macros (par 100g)
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    sugar: null,
    sodium: null,
    
    // Micronutriments
    vitaminC: null,
    calcium: null,
    iron: null,
    vitaminA: null,
    vitaminD: null,
    vitaminE: null,
    vitaminK: null,
    thiamin: null,
    riboflavin: null,
    niacin: null,
    vitaminB6: null,
    folate: null,
    vitaminB12: null,
    magnesium: null,
    phosphorus: null,
    potassium: null,
    zinc: null,
  };

  foodNutrients.forEach(nutrient => {
    const name = (nutrient.nutrientName || '').toLowerCase();
    const value = nutrient.value;
    const unit = (nutrient.unitName || '').toLowerCase();
    
    // Chercher dans le map
    const mapped = NUTRIENT_MAP[name];
    if (mapped && nutrition[mapped.key] !== undefined) {
      nutrition[mapped.key] = value || 0;
    }
  });

  return nutrition;
};

// ==================== RECHERCHE ====================

/**
 * Recherche aliments USDA
 * 
 * @param {string} query - Terme de recherche
 * @param {Object} options - Options
 * @param {number} options.pageSize - Nombre de résultats (défaut: 20)
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Array>} Tableau d'aliments formatés
 */
export const searchUSDA = async (query, options = {}) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // ✅ PHASE 12.3 : Utiliser configuration centralisée
  const { pageSize = NutritionConfig.api.pageSize, useCache = true } = options;
  const normalizedQuery = query.trim().toLowerCase();

  try {
    // Vérifier cache
    if (useCache) {
      const cached = await getCachedFood(`search_${normalizedQuery}`);
      if (cached) {
        log.debug(`Recherche USDA depuis cache: ${query}`);
        return cached;
      }
    }

    // Requête API
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
    
    const rawData = await usdaManager.request(url);
    
    // ✅ PHASE 10.3 : Validation réponse brute API avec Zod
    let validatedData;
    try {
      validatedData = validateUSDASearchResponse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('[searchUSDA] Erreur validation réponse API:', error.errors);
        return [];
      }
      throw error;
    }
    
    if (!validatedData.foods || !Array.isArray(validatedData.foods)) {
      log.warn('Réponse USDA invalide (pas d\'aliments)');
      return [];
    }

    // Formater et valider aliments
    const foods = validatedData.foods
      .map(food => {
        if (!food || !food.fdcId) return null;

        try {
          const formatted = {
            id: `usda_${food.fdcId}`,
            name: food.description || 'Aliment inconnu',
            brand: food.brandOwner || '',
            
            // Nutrition (par 100g)
            nutritionPer100: extractNutrition(food.foodNutrients),
            
            // Catégorie
            category: food.foodCategory?.description || '',
            
            // Source
            source: 'usda',
            sourceId: food.fdcId.toString(),
            
            // Métadonnées supplémentaires
            dataType: food.dataType || null,
            publicationDate: food.publicationDate || null,
          };
          
          // ✅ PHASE 10.3 : Validation aliment formaté avec Zod
          return validateUSDAFood(formatted);
        } catch (error) {
          if (error instanceof z.ZodError) {
            log.warn('[searchUSDA] Aliment invalide après formatage:', error.errors[0]?.message);
            return null;
          }
          log.warn('[searchUSDA] Erreur formatage aliment:', error);
          return null;
        }
      })
      .filter(food => food !== null && food.nutritionPer100?.calories !== null && food.nutritionPer100?.calories !== undefined); // Filtrer aliments invalides ou sans calories

    // Mettre en cache (TTL 1h pour recherches)
    if (useCache && foods.length > 0) {
      await cacheFood(`search_${normalizedQuery}`, foods, 3600);
    }

    log.debug(`Recherche USDA: ${foods.length} aliments trouvés pour "${query}"`);
    return foods;
  } catch (error) {
    log.error('Erreur recherche USDA:', error);
    return [];
  }
};

/**
 * Récupère un aliment par son FDC ID
 * 
 * @param {number} fdcId - FDC ID de l'aliment
 * @param {Object} options - Options
 * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
 * @returns {Promise<Object|null>} Aliment formaté ou null
 */
export const getFoodByFdcId = async (fdcId, options = {}) => {
  if (!fdcId) {
    return null;
  }

  const { useCache = true } = options;

  try {
    // Vérifier cache
    if (useCache) {
      const cached = await getCachedFood(`fdc_${fdcId}`);
      if (cached) {
        return cached;
      }
    }

    // Requête API
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}`;
    
    const rawData = await usdaManager.request(url);
    
    // ✅ PHASE 10.3 : Validation réponse brute API avec Zod
    let validatedData;
    try {
      validatedData = validateUSDAFoodResponse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('[getFoodByFdcId] Erreur validation réponse API:', error.errors);
        return null;
      }
      throw error;
    }
    
    if (!validatedData.fdcId) {
      return null;
    }

    // Formater et valider aliment
    try {
      const formatted = {
        id: `usda_${validatedData.fdcId}`,
        name: validatedData.description || 'Aliment inconnu',
        brand: validatedData.brandOwner || '',
        
        // Nutrition (par 100g)
        nutritionPer100: extractNutrition(validatedData.foodNutrients),
        
        // Catégorie
        category: validatedData.foodCategory?.description || '',
        
        // Source
        source: 'usda',
        sourceId: validatedData.fdcId.toString(),
        
        // Métadonnées
        dataType: validatedData.dataType || null,
        publicationDate: validatedData.publicationDate || null,
      };
      
      // ✅ PHASE 10.3 : Validation aliment formaté avec Zod
      const validatedFood = validateUSDAFood(formatted);
      
      // Mettre en cache (TTL 24h)
      if (useCache) {
        await cacheFood(`fdc_${fdcId}`, validatedFood, 86400);
      }
      
      return validatedFood;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn(`[getFoodByFdcId] Aliment invalide après formatage (FDC ${fdcId}):`, error.errors[0]?.message);
        return null;
      }
      log.warn(`[getFoodByFdcId] Erreur formatage aliment (FDC ${fdcId}):`, error);
      return null;
    }
  } catch (error) {
    log.error('Erreur getFoodByFdcId:', error);
    return null;
  }
};

// ==================== GESTION CLÉS API ====================

/**
 * Ajoute une clé API au pool
 */
export const addApiKey = (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }

  const keys = getApiKeys();
  if (!keys.includes(apiKey)) {
    keys.push(apiKey);
    setApiKeys(keys);
    log.info(`Clé API USDA ajoutée (total: ${keys.length})`);
    return true;
  }
  
  return false;
};

/**
 * Supprime une clé API du pool
 */
export const removeApiKey = (apiKey) => {
  const keys = getApiKeys();
  const filtered = keys.filter(k => k !== apiKey);
  
  if (filtered.length < keys.length) {
    setApiKeys(filtered);
    log.info(`Clé API USDA supprimée (reste: ${filtered.length})`);
    return true;
  }
  
  return false;
};

/**
 * Récupère toutes les clés API (sans les valeurs complètes pour sécurité)
 */
export const getApiKeysInfo = () => {
  const keys = getApiKeys();
  return {
    count: keys.length,
    currentIndex: getCurrentKeyIndex(),
    hasKeys: keys.length > 0 && keys[0] !== 'DEMO_KEY'
  };
};

// Export manager pour tests
export { usdaManager };

