/**
 * nutritionFoodRecognition.js
 * 
 * Service pour la reconnaissance d'aliments via TensorFlow.js MobileNet.
 * 
 * Fonctionnalités :
 * - Chargement lazy du modèle MobileNet (optimisé: v2, alpha 0.5, quantization 8-bit)
 * - Reconnaissance d'aliments depuis photos (1000+ classes)
 * - Traduction noms anglais → français
 * - Recherche automatique données nutritionnelles (favoris + OpenFoodFacts)
 * - Compression d'images avant analyse (performance)
 * - Cache des prédictions (éviter re-analyse)
 * - Estimation portions (basique pour MVP)
 * 
 * Architecture :
 * - Modèle : MobileNet v2 (4-6MB quantifié, chargement lazy)
 * - Performance : Lazy loading, compression images, cache prédictions
 * - Intégration : OpenFoodFacts API + favoris
 * - Fallback : Si modèle non disponible, masquer fonctionnalité
 * 
 * ⚠️ IMPORTANT : Nécessite TensorFlow.js et @tensorflow-models/mobilenet
 * 
 * @module services/nutrition/nutritionFoodRecognition
 * @see ../../../../nouvelongletnutritionplan.md Section 2.2
 */

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { searchFoodWithFallback } from './openFoodFactsService';
import { getFavoriteFoods } from '../../hooks/nutritionDataCRUD';
import logger from '../../utils/logger';

const log = logger.module('nutritionFoodRecognition');

// ✅ OPTIMISATION : Vérifier support WebGL et configurer backend
let backendInitialized = false;

/**
 * Initialise le backend TensorFlow.js (CPU si WebGL non disponible)
 */
const initializeTensorFlowBackend = async () => {
  if (backendInitialized) {
    return;
  }

  try {
    // Vérifier support WebGL
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch (e) {
        return false;
      }
    })();

    if (hasWebGL) {
      // Essayer WebGL d'abord
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        log.debug('[initializeTensorFlowBackend] Backend WebGL activé');
        backendInitialized = true;
        return;
      } catch (webglError) {
        log.debug('[initializeTensorFlowBackend] WebGL non disponible, fallback CPU:', webglError);
      }
    }

    // Fallback CPU
    await tf.setBackend('cpu');
    await tf.ready();
    log.debug('[initializeTensorFlowBackend] Backend CPU activé (WebGL non disponible)');
    backendInitialized = true;
  } catch (error) {
    log.warn('[initializeTensorFlowBackend] Erreur initialisation backend:', error);
    // Essayer quand même avec backend par défaut
    backendInitialized = true;
  }
};

// ==================== CONSTANTES ====================

/**
 * Probabilité minimale pour considérer une prédiction valide
 */
const MIN_CONFIDENCE = 0.3;

/**
 * Nombre de prédictions top à récupérer
 */
const TOP_PREDICTIONS = 5;

/**
 * Largeur maximale pour compression image (performance)
 */
const MAX_IMAGE_WIDTH = 800;

/**
 * Cache des prédictions (éviter re-analyse même image)
 */
const predictionCache = new Map();

/**
 * Mapping classes MobileNet (anglais) → noms français
 * Classes les plus communes pour aliments
 */
const FOOD_CLASS_MAPPING = {
  // Fruits
  'apple': 'Pomme',
  'banana': 'Banane',
  'orange': 'Orange',
  'strawberry': 'Fraise',
  'grapes': 'Raisins',
  'watermelon': 'Pastèque',
  'pineapple': 'Ananas',
  'mango': 'Mangue',
  'pear': 'Poire',
  'peach': 'Pêche',
  
  // Légumes
  'broccoli': 'Brocoli',
  'carrot': 'Carotte',
  'cucumber': 'Concombre',
  'lettuce': 'Laitue',
  'potato': 'Pomme de terre',
  'tomato': 'Tomate',
  'onion': 'Oignon',
  'mushroom': 'Champignon',
  'pepper': 'Poivron',
  'corn': 'Maïs',
  
  // Produits laitiers
  'cheese': 'Fromage',
  'yogurt': 'Yaourt',
  'milk': 'Lait',
  'butter': 'Beurre',
  'ice cream': 'Glace',
  
  // Viandes & Poissons
  'steak': 'Steak',
  'hamburger': 'Hamburger',
  'hot dog': 'Hot-dog',
  'pizza': 'Pizza',
  'sandwich': 'Sandwich',
  'chicken': 'Poulet',
  'fish': 'Poisson',
  'salmon': 'Saumon',
  'tuna': 'Thon',
  'shrimp': 'Crevette',
  
  // Céréales & Pâtes
  'bread': 'Pain',
  'bagel': 'Bagel',
  'croissant': 'Croissant',
  'pasta': 'Pâtes',
  'rice': 'Riz',
  'noodles': 'Nouilles',
  'spaghetti': 'Spaghetti',
  
  // Snacks & Desserts
  'donut': 'Donut',
  'cookie': 'Cookie',
  'cake': 'Gâteau',
  'chocolate': 'Chocolat',
  'candy': 'Bonbon',
  'french fries': 'Frites',
  'popcorn': 'Popcorn',
  
  // Boissons
  'coffee': 'Café',
  'wine': 'Vin',
  'beer': 'Bière',
  'cocktail': 'Cocktail',
  'soda': 'Soda',
  'juice': 'Jus',
  
  // Autres
  'salad': 'Salade',
  'soup': 'Soupe',
  'egg': 'Œuf',
  'omelette': 'Omelette',
  'sushi': 'Sushi',
  'taco': 'Taco',
  'burrito': 'Burrito',
  'pancake': 'Crêpe',
  'waffle': 'Gaufre'
};

// ==================== CHARGEMENT MODÈLE ====================

/**
 * Instance singleton du modèle MobileNet
 */
let modelInstance = null;
let modelLoadingPromise = null;

/**
 * Vérifie si TensorFlow.js est disponible
 */
export const isTensorFlowSupported = () => {
  return typeof window !== 'undefined' && 
         typeof mobilenet !== 'undefined' &&
         typeof mobilenet.load === 'function';
};

/**
 * Charge le modèle MobileNet (lazy loading, singleton)
 * 
 * @returns {Promise<Object>} Instance du modèle MobileNet
 */
export const loadFoodModel = async () => {
  if (!isTensorFlowSupported()) {
    log.warn('[loadFoodModel] TensorFlow.js non supporté');
    return null;
  }

  // Retourner instance si déjà chargée
  if (modelInstance) {
    return modelInstance;
  }

  // Retourner promise si chargement en cours
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  // Démarrer chargement lazy
  modelLoadingPromise = (async () => {
    try {
      log.debug('[loadFoodModel] Chargement modèle MobileNet...');
      
      // ✅ OPTIMISATION : Initialiser backend avant chargement modèle (éviter warnings WebGL)
      await initializeTensorFlowBackend();
      
      // ✅ OPTIMISATION : Quantization 8-bit + alpha réduit
      // Réduit taille de 16MB → ~4-6MB, -5% accuracy acceptable
      modelInstance = await mobilenet.load({
        version: 2,
        alpha: 0.5, // -50% taille, -5% accuracy (acceptable)
        quantizationBytes: 1 // Quantization 8-bit (-60% taille)
      });

      const backend = tf.getBackend();
      log.info('[loadFoodModel] Modèle MobileNet chargé avec succès', { backend });
      return modelInstance;
    } catch (error) {
      log.error('[loadFoodModel] Erreur chargement modèle:', error);
      modelInstance = null;
      modelLoadingPromise = null;
      throw error;
    }
  })();

  return modelLoadingPromise;
};

/**
 * Décharge le modèle (libérer mémoire si nécessaire)
 */
export const unloadFoodModel = () => {
  if (modelInstance) {
    modelInstance = null;
    modelLoadingPromise = null;
    log.debug('[unloadFoodModel] Modèle déchargé');
  }
};

// ==================== UTILITAIRES IMAGE ====================

/**
 * Charge un fichier image en élément HTMLImageElement
 * 
 * @param {File|string} fileOrDataUrl - Fichier ou Data URL
 * @returns {Promise<HTMLImageElement>} Élément image chargé
 */
export const loadImageFile = async (fileOrDataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      log.error('[loadImageFile] Erreur chargement image:', error);
      reject(new Error('Erreur chargement image'));
    };

    if (fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      img.src = fileOrDataUrl;
    }
  });
};

/**
 * Compresse une image avant analyse (performance)
 * 
 * @param {HTMLImageElement} imageElement - Image source
 * @param {number} maxWidth - Largeur maximale (défaut: 800px)
 * @returns {Promise<HTMLImageElement>} Image compressée
 */
export const compressImageForAnalysis = async (imageElement, maxWidth = MAX_IMAGE_WIDTH) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(maxWidth / imageElement.width, maxWidth / imageElement.height, 1);
    
    canvas.width = imageElement.width * ratio;
    canvas.height = imageElement.height * ratio;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // Créer nouvelle image depuis canvas
    const compressedImg = new Image();
    compressedImg.onload = () => resolve(compressedImg);
    compressedImg.src = canvas.toDataURL('image/jpeg', 0.8);
  });
};

/**
 * Calcule un hash simple de l'image pour cache
 * 
 * @param {HTMLImageElement} imageElement - Image
 * @returns {Promise<string>} Hash de l'image
 */
const hashImage = async (imageElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32; // Petite taille pour hash rapide
  canvas.height = 32;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0, 32, 32);
  
  const imageData = ctx.getImageData(0, 0, 32, 32);
  const data = imageData.data;
  
  // Hash simple (somme des pixels)
  let hash = 0;
  for (let i = 0; i < data.length; i += 4) {
    hash += data[i] + data[i + 1] + data[i + 2];
  }
  
  return `${canvas.width}x${canvas.height}_${hash}`;
};

// ==================== TRADUCTION NOMS ====================

/**
 * Traduit un nom de classe MobileNet (anglais) vers français
 * 
 * @param {string} className - Nom de classe (ex: 'pizza')
 * @returns {string} Nom traduit (ex: 'Pizza') ou nom original si non trouvé
 */
export const translateFoodName = (className) => {
  if (!className || typeof className !== 'string') {
    return className || 'Aliment inconnu';
  }

  const normalized = className.toLowerCase().trim();
  
  // Chercher dans mapping
  if (FOOD_CLASS_MAPPING[normalized]) {
    return FOOD_CLASS_MAPPING[normalized];
  }

  // Si non trouvé, capitaliser première lettre
  return className.charAt(0).toUpperCase() + className.slice(1);
};

/**
 * Vérifie si une classe MobileNet est un aliment
 * (Filtre basique - les 1000 classes incluent aussi objets non-aliments)
 * 
 * @param {string} className - Nom de classe
 * @returns {boolean} True si probablement un aliment
 */
const isFoodClass = (className) => {
  if (!className) return false;
  
  const normalized = className.toLowerCase();
  
  // Classes connues d'aliments
  if (FOOD_CLASS_MAPPING[normalized]) {
    return true;
  }

  // Mots-clés communs pour aliments
  const foodKeywords = [
    'food', 'meal', 'dish', 'snack', 'dessert',
    'fruit', 'vegetable', 'meat', 'fish', 'cheese',
    'bread', 'pasta', 'rice', 'soup', 'salad'
  ];

  return foodKeywords.some(keyword => normalized.includes(keyword));
};

// ==================== ANALYSE IMAGE ====================

/**
 * Analyse une image et détecte les aliments
 * 
 * @param {HTMLImageElement|File|string} imageSource - Image à analyser
 * @param {Object} options - Options
 * @param {number} options.minConfidence - Probabilité minimale (défaut: 0.3)
 * @param {number} options.topK - Nombre de prédictions (défaut: 5)
 * @param {boolean} options.useCache - Utiliser cache (défaut: true)
 * @param {boolean} options.compress - Compresser image (défaut: true)
 * @returns {Promise<Array>} Tableau de détections alimentaires
 */
export const analyzeFoodImage = async (imageSource, options = {}) => {
  const {
    minConfidence = MIN_CONFIDENCE,
    topK = TOP_PREDICTIONS,
    useCache = true,
    compress = true
  } = options;

  try {
    // Charger modèle (lazy)
    const model = await loadFoodModel();
    if (!model) {
      throw new Error('Modèle MobileNet non disponible');
    }

    // Charger image
    let imageElement = await loadImageFile(imageSource);
    
    // Compresser si demandé (performance)
    if (compress) {
      imageElement = await compressImageForAnalysis(imageElement);
    }

    // ✅ OPTIMISATION : Calculer hash UNE SEULE FOIS (éviter double calcul)
    let imageHash = null;
    if (useCache) {
      imageHash = await hashImage(imageElement);
      if (predictionCache.has(imageHash)) {
        log.debug('[analyzeFoodImage] Résultat depuis cache');
        return predictionCache.get(imageHash);
      }
    }

    log.debug('[analyzeFoodImage] Analyse image en cours...');

    // Prédictions top K
    const predictions = await model.classify(imageElement, topK);

    // Filtrer et formater résultats
    const foodItems = predictions
      .filter(p => p.probability >= minConfidence && isFoodClass(p.className))
      .map(p => ({
        className: p.className,
        name: translateFoodName(p.className),
        confidence: p.probability,
        originalClassName: p.className
      }));

    log.debug('[analyzeFoodImage] Aliments détectés', { count: foodItems.length });

    // Mettre en cache si demandé (utiliser hash déjà calculé)
    if (useCache && foodItems.length > 0 && imageHash) {
      predictionCache.set(imageHash, foodItems);
      
      // Limiter taille cache (max 50 entrées)
      if (predictionCache.size > 50) {
        const firstKey = predictionCache.keys().next().value;
        predictionCache.delete(firstKey);
      }
    }

    return foodItems;
  } catch (error) {
    log.error('[analyzeFoodImage] Erreur analyse image:', error);
    throw error;
  }
};

// ==================== RECHERCHE NUTRITIONNELLE ====================

/**
 * Recherche les données nutritionnelles pour des aliments détectés
 * 
 * @param {Array} detectedFoods - Aliments détectés depuis analyse
 * @returns {Promise<Array>} Aliments enrichis avec données nutritionnelles
 */
export const enrichFoodsWithNutrition = async (detectedFoods) => {
  if (!Array.isArray(detectedFoods) || detectedFoods.length === 0) {
    return [];
  }

  log.debug('[enrichFoodsWithNutrition] Enrichissement', { count: detectedFoods.length });

  // ✅ OPTIMISATION : Charger favoris UNE SEULE FOIS (éviter N appels IndexedDB)
  const favorites = await getFavoriteFoods();
  
  const enrichedFoods = [];
  let idCounter = 0; // Compteur pour IDs uniques

  for (const food of detectedFoods) {
    try {
      // 1. Chercher dans favoris (déjà chargés)
      let found = favorites.find(f => 
        f.name?.toLowerCase().includes(food.name.toLowerCase()) ||
        f.name?.toLowerCase().includes(food.className.toLowerCase())
      );

      // 2. Si pas trouvé, rechercher dans OpenFoodFacts
      if (!found) {
        log.debug('[enrichFoodsWithNutrition] Recherche OpenFoodFacts', { name: food.name });
        
        const searchResults = await searchFoodWithFallback(food.name, {
          searchInFavorites: async () => [] // Déjà cherché
        });
        
        // Prendre premier résultat si disponible
        if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
          found = searchResults[0];
        }
      }

      // 3. Enrichir avec données nutritionnelles
      // ✅ OPTIMISATION : Factoriser code commun (found/not found)
      const nutritionPer100 = found 
        ? (found.nutritionPer100 || found.nutrition || {})
        : {};
      
      enrichedFoods.push({
        // ✅ OPTIMISATION : ID unique avec compteur (éviter collisions)
        id: `detected_${Date.now()}_${idCounter++}_${Math.random().toString(36).substr(2, 9)}`,
        name: food.name,
        className: food.className,
        confidence: food.confidence,
        
        // Données nutritionnelles (par 100g)
        caloriesPer100: nutritionPer100.calories || 0,
        proteinPer100: nutritionPer100.protein || 0,
        carbsPer100: nutritionPer100.carbs || nutritionPer100.carbohydrates || 0,
        fatPer100: nutritionPer100.fat || 0,
        
        // Quantité par défaut (100g)
        quantity: 100,
        unit: 'g',
        
        // Métadonnées
        source: found ? (found.source || 'detection') : 'detection',
        sourceId: found ? (found.sourceId || found.id) : null,
        imageUrl: found ? (found.imageUrl || null) : null,
        
        // Estimation portion (basique pour MVP)
        estimatedPortion: 100, // grammes
        estimatedCalories: nutritionPer100.calories || 0
      });
      
      if (!found) {
        log.debug('[enrichFoodsWithNutrition] Aliment non trouvé dans DB', { name: food.name });
      }
    } catch (error) {
      log.error('[enrichFoodsWithNutrition] Erreur enrichissement aliment', { food, error });
      // Continuer avec autres aliments même si erreur
    }
  }

  log.debug('[enrichFoodsWithNutrition] Enrichissement terminé', { 
    count: enrichedFoods.length,
    withNutrition: enrichedFoods.filter(f => f.caloriesPer100 > 0).length
  });

  return enrichedFoods;
};

/**
 * Analyse complète : Image → Détection → Enrichissement
 * 
 * @param {HTMLImageElement|File|string} imageSource - Image à analyser
 * @param {Object} options - Options
 * @returns {Promise<Array>} Aliments détectés et enrichis avec données nutritionnelles
 */
export const analyzeFoodImageComplete = async (imageSource, options = {}) => {
  try {
    // 1. Analyser image
    const detectedFoods = await analyzeFoodImage(imageSource, options);
    
    if (detectedFoods.length === 0) {
      return [];
    }

    // 2. Enrichir avec données nutritionnelles
    const enrichedFoods = await enrichFoodsWithNutrition(detectedFoods);
    
    return enrichedFoods;
  } catch (error) {
    log.error('[analyzeFoodImageComplete] Erreur analyse complète:', error);
    throw error;
  }
};

// ==================== NETTOYAGE CACHE ====================

/**
 * Nettoie le cache des prédictions
 */
export const clearPredictionCache = () => {
  predictionCache.clear();
  log.debug('[clearPredictionCache] Cache nettoyé');
};

/**
 * Obtient des statistiques sur le cache
 */
export const getCacheStats = () => {
  return {
    size: predictionCache.size,
    maxSize: 50
  };
};

