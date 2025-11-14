/**
 * nutritionVoiceInput.js
 * 
 * Service pour la saisie vocale d'aliments via Web Speech API.
 * 
 * Fonctionnalités :
 * - Reconnaissance vocale native (Web Speech API)
 * - Parsing intelligent texte → aliments (quantité, unité, nom)
 * - Recherche automatique aliments (favoris + OpenFoodFacts)
 * - Gestion erreurs et fallback gracieux
 * - Support navigateurs (Chrome, Edge, Safari 14+)
 * 
 * Architecture :
 * - API native : Pas de dépendance externe
 * - Parsing : Regex simple (rapide, offline) - Méthode A du plan
 * - Recherche : Intégration avec OpenFoodFacts + favoris
 * - Performance : Debounce démarrage, gestion état optimisée
 * 
 * ⚠️ IMPORTANT : Nécessite connexion Internet (audio envoyé à serveurs Google)
 * 
 * @module services/nutrition/nutritionVoiceInput
 * @see ../../../../nouvelongletnutritionplan.md Section 2.1
 */

import { searchFoodWithFallback } from './openFoodFactsService';
import { getFavoriteFoods } from '../../hooks/nutritionDataCRUD';
import logger from '../../utils/logger';

const log = logger.module('nutritionVoiceInput');

// ==================== CONSTANTES ====================

/**
 * Support navigateurs Web Speech API
 */
export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
};

/**
 * Langues supportées
 */
export const SUPPORTED_LANGUAGES = {
  'fr-FR': 'Français (France)',
  'fr-CA': 'Français (Canada)',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)'
};

// ==================== CONFIGURATION RECOGNITION ====================

/**
 * Crée une instance SpeechRecognition configurée
 * 
 * @param {Object} options - Options configuration
 * @param {string} options.lang - Langue (défaut: 'fr-FR')
 * @param {boolean} options.continuous - Reconnaissance continue (défaut: false)
 * @param {boolean} options.interimResults - Résultats intermédiaires (défaut: false)
 * @returns {SpeechRecognition|null} Instance configurée ou null si non supporté
 */
export const createSpeechRecognition = (options = {}) => {
  if (!isSpeechSupported()) {
    log.warn('[createSpeechRecognition] Web Speech API non supporté');
    return null;
  }

  const {
    lang = 'fr-FR',
    continuous = false,
    interimResults = false,
    maxAlternatives = 1
  } = options;

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configuration optimale
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    log.debug('[createSpeechRecognition] Instance créée', { lang, continuous, interimResults });

    return recognition;
  } catch (error) {
    log.error('[createSpeechRecognition] Erreur création instance:', error);
    return null;
  }
};

// ==================== PARSING TEXTE → ALIMENTS ====================

/**
 * Normalise le texte pour parsing
 * 
 * @param {string} text - Texte à normaliser
 * @returns {string} Texte normalisé
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    // Normaliser unités
    .replace(/\bgrammes?\b/gi, 'g')
    .replace(/\bgramme\b/gi, 'g')
    .replace(/\bmillilitres?\b/gi, 'ml')
    .replace(/\bmillilitre\b/gi, 'ml')
    .replace(/\bmilligrammes?\b/gi, 'mg')
    .replace(/\bkilogrammes?\b/gi, 'kg')
    // Normaliser prépositions
    .replace(/\bde\s+/gi, ' ')
    .replace(/\bdu\s+/gi, ' ')
    .replace(/\bdes\s+/gi, ' ')
    // Nettoyer espaces multiples
    .replace(/\s+/g, ' ');
};

/**
 * Parse un texte vocal en aliments (quantité, unité, nom)
 * 
 * Utilise Regex simple (Méthode A du plan) pour performance maximale.
 * Pattern : [quantité] [unité] [aliment]
 * 
 * Exemples supportés :
 * - "150 grammes de poulet" → { quantity: 150, unit: 'g', name: 'poulet' }
 * - "200 grammes de riz basmati" → { quantity: 200, unit: 'g', name: 'riz basmati' }
 * - "1 kilogramme de pommes" → { quantity: 1000, unit: 'g', name: 'pommes' }
 * - "500 millilitres de lait" → { quantity: 500, unit: 'ml', name: 'lait' }
 * 
 * @param {string} text - Texte à parser
 * @returns {Array<Object>} Liste d'aliments parsés { quantity, unit, name }
 */
export const parseMealFromSpeech = (text) => {
  if (!text || typeof text !== 'string') {
    log.warn('[parseMealFromSpeech] Texte invalide:', text);
    return [];
  }

  const normalized = normalizeText(text);
  log.debug('[parseMealFromSpeech] Texte normalisé', { original: text, normalized });

  // Pattern principal : [quantité] [unité optionnelle] [aliment]
  // Supporte : "150g poulet", "150 grammes de poulet", "150g de poulet grillé"
  const patterns = [
    // Pattern 1 : Quantité + unité + aliment (le plus commun)
    /(\d+(?:[,.]\d+)?)\s*(g|ml|mg|kg|grammes?|millilitres?|milligrammes?|kilogrammes?)?\s+([a-zàâäéèêëïîôùûüç\s]+)/gi,
    // Pattern 2 : Sans unité (défaut grammes)
    /(\d+(?:[,.]\d+)?)\s+([a-zàâäéèêëïîôùûüç\s]+)/gi
  ];

  const foods = [];
  const usedRanges = new Set(); // Éviter doublons

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Réinitialiser pour chaque pattern

    while ((match = pattern.exec(normalized)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const rangeKey = `${start}-${end}`;

      // Éviter doublons (si plusieurs patterns matchent le même texte)
      if (usedRanges.has(rangeKey)) {
        continue;
      }
      usedRanges.add(rangeKey);

      const quantityStr = match[1].replace(',', '.');
      let quantity = parseFloat(quantityStr);

      if (isNaN(quantity) || quantity <= 0) {
        log.warn('[parseMealFromSpeech] Quantité invalide:', quantityStr);
        continue;
      }

      // Déterminer unité
      let unit = 'g'; // Défaut : grammes
      if (match[2]) {
        const unitStr = match[2].toLowerCase();
        if (unitStr === 'ml' || unitStr === 'millilitres' || unitStr === 'millilitre') {
          unit = 'ml';
        } else if (unitStr === 'mg' || unitStr === 'milligrammes' || unitStr === 'milligramme') {
          unit = 'mg';
        } else if (unitStr === 'kg' || unitStr === 'kilogrammes' || unitStr === 'kilogramme') {
          // Convertir kg en grammes pour cohérence
          quantity = quantity * 1000;
          unit = 'g';
        } else {
          unit = 'g';
        }
      }

      // Nom aliment (nettoyer espaces et mots vides)
      const name = (match[3] || match[2] || '')
        .trim()
        .replace(/\b(et|avec|plus|ainsi)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!name || name.length < 2) {
        log.warn('[parseMealFromSpeech] Nom aliment invalide:', name);
        continue;
      }

      // Convertir mg en g si > 1000 mg (pour cohérence)
      let finalQuantity = quantity;
      let finalUnit = unit;
      if (unit === 'mg' && quantity >= 1000) {
        finalQuantity = quantity / 1000;
        finalUnit = 'g';
      }

      foods.push({
        quantity: finalQuantity,
        unit: finalUnit,
        name: name
      });

      log.debug('[parseMealFromSpeech] Aliment parsé', {
        original: match[0],
        quantity: finalQuantity,
        unit: finalUnit,
        name
      });
    }
  }

  // Si aucun pattern n'a matché mais qu'on a un texte, essayer extraction simple
  if (foods.length === 0 && normalized.length > 0) {
    // Pattern fallback : chercher quantité + nom même sans structure parfaite
    const fallbackPattern = /(\d+(?:[,.]\d+)?)\s+([a-zàâäéèêëïîôùûüç]+(?:\s+[a-zàâäéèêëïîôùûüç]+)*)/gi;
    const fallbackMatch = fallbackPattern.exec(normalized);
    
    if (fallbackMatch) {
      const quantityStr = fallbackMatch[1].replace(',', '.');
      const quantity = parseFloat(quantityStr);
      const name = fallbackMatch[2].trim();

      if (!isNaN(quantity) && quantity > 0 && name.length >= 2) {
        foods.push({
          quantity,
          unit: 'g',
          name
        });
        
        log.debug('[parseMealFromSpeech] Aliment parsé (fallback)', { quantity, name });
      }
    }
  }

  log.debug('[parseMealFromSpeech] Résultat final', {
    original: text,
    foodsFound: foods.length,
    foods
  });

  return foods;
};

// ==================== RECHERCHE ALIMENTS ====================

/**
 * Recherche un aliment dans les favoris
 * 
 * @param {string} name - Nom aliment à rechercher
 * @returns {Promise<Object|null>} Aliment trouvé ou null
 */
const searchInFavorites = async (name) => {
  try {
    const favorites = await getFavoriteFoods();
    if (!favorites || favorites.length === 0) {
      return null;
    }

    // Recherche exacte d'abord
    const exactMatch = favorites.find(f => 
      f.name && f.name.toLowerCase() === name.toLowerCase()
    );
    if (exactMatch) {
      log.debug('[searchInFavorites] Match exact trouvé', { name, food: exactMatch.name });
      return exactMatch;
    }

    // Recherche partielle (contient le nom)
    const partialMatch = favorites.find(f =>
      f.name && (
        f.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(f.name.toLowerCase())
      )
    );
    if (partialMatch) {
      log.debug('[searchInFavorites] Match partiel trouvé', { name, food: partialMatch.name });
      return partialMatch;
    }

    return null;
  } catch (error) {
    log.error('[searchInFavorites] Erreur recherche favoris:', error);
    return null;
  }
};

/**
 * Recherche aliments depuis liste parsée
 * 
 * Recherche dans favoris d'abord (instantané), puis OpenFoodFacts (API).
 * 
 * @param {Array<Object>} parsedFoods - Liste aliments parsés { quantity, unit, name }
 * @returns {Promise<Array<Object>>} Liste aliments trouvés avec données nutrition
 */
export const searchFoodsFromVoice = async (parsedFoods) => {
  if (!Array.isArray(parsedFoods) || parsedFoods.length === 0) {
    log.warn('[searchFoodsFromVoice] Liste aliments vide');
    return [];
  }

  log.debug('[searchFoodsFromVoice] Recherche aliments', { count: parsedFoods.length });

  const results = [];

  for (const food of parsedFoods) {
    try {
      // 1. Rechercher dans favoris d'abord (instantané, pas d'API)
      let found = await searchInFavorites(food.name);

      // 2. Si pas trouvé, rechercher dans OpenFoodFacts
      if (!found) {
        log.debug('[searchFoodsFromVoice] Recherche OpenFoodFacts', { name: food.name });
        
        // searchFoodWithFallback retourne toujours un tableau
        const searchResults = await searchFoodWithFallback(food.name, {
          searchInFavorites: async (q) => {
            // Déjà cherché dans favoris, retourner vide pour éviter double recherche
            return [];
          }
        });
        
        // Prendre premier résultat si disponible
        if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
          found = searchResults[0];
        } else {
          found = null;
        }
      }

      if (found) {
        // Normaliser format aliment
        const normalizedFood = {
          id: found.id || `voice_${Date.now()}_${Math.random()}`,
          name: found.name || food.name,
          source: found.source || 'voice',
          sourceId: found.sourceId || found.id,
          
          // Nutrition (par 100g)
          caloriesPer100: found.nutritionPer100?.calories || found.caloriesPer100 || 0,
          proteinPer100: found.nutritionPer100?.protein || found.proteinPer100 || 0,
          carbsPer100: found.nutritionPer100?.carbs || found.carbsPer100 || 0,
          fatPer100: found.nutritionPer100?.fat || found.fatPer100 || 0,
          
          // Quantité de la voix (conserver)
          quantity: food.quantity,
          unit: food.unit,
          
          // Métadonnées
          nutriScore: found.nutriScore || null,
          imageUrl: found.imageUrl || null
        };

        results.push(normalizedFood);
        
        log.debug('[searchFoodsFromVoice] Aliment trouvé', {
          originalName: food.name,
          foundName: normalizedFood.name,
          quantity: food.quantity,
          unit: food.unit,
          source: normalizedFood.source
        });
      } else {
        // Aliment non trouvé - créer entrée basique avec nom
        log.warn('[searchFoodsFromVoice] Aliment non trouvé', { name: food.name });
        
        results.push({
          id: `voice_notfound_${Date.now()}_${Math.random()}`,
          name: food.name,
          source: 'voice',
          
          // Nutrition vide (utilisateur devra remplir manuellement)
          caloriesPer100: 0,
          proteinPer100: 0,
          carbsPer100: 0,
          fatPer100: 0,
          
          // Quantité de la voix
          quantity: food.quantity,
          unit: food.unit,
          
          // Flag : besoin recherche manuelle
          needsManualInput: true
        });
      }
    } catch (error) {
      log.error('[searchFoodsFromVoice] Erreur recherche aliment', {
        food,
        error: error.message
      });

      // En cas d'erreur, ajouter quand même l'aliment (utilisateur pourra corriger)
      results.push({
        id: `voice_error_${Date.now()}_${Math.random()}`,
        name: food.name,
        source: 'voice',
        caloriesPer100: 0,
        proteinPer100: 0,
        carbsPer100: 0,
        fatPer100: 0,
        quantity: food.quantity,
        unit: food.unit,
        needsManualInput: true,
        error: error.message
      });
    }
  }

  log.debug('[searchFoodsFromVoice] Résultat final', {
    searched: parsedFoods.length,
    found: results.filter(r => !r.needsManualInput).length,
    notFound: results.filter(r => r.needsManualInput).length,
    results
  });

  return results;
};

// ==================== GESTION ERREURS ====================

/**
 * Convertit un code d'erreur SpeechRecognition en message utilisateur
 * 
 * @param {string} errorCode - Code d'erreur (no-speech, audio-capture, not-allowed, etc.)
 * @returns {string} Message d'erreur lisible
 */
export const getSpeechErrorMessage = (errorCode) => {
  const errorMessages = {
    'no-speech': 'Aucune parole détectée. Veuillez réessayer.',
    'audio-capture': 'Impossible d\'accéder au micro. Vérifiez vos permissions.',
    'not-allowed': 'Permission micro refusée. Veuillez autoriser l\'accès au micro.',
    'network': 'Erreur réseau. Vérifiez votre connexion Internet.',
    'aborted': 'Reconnaissance vocale annulée.',
    'service-not-allowed': 'Service de reconnaissance vocale non disponible.',
    'bad-grammar': 'Erreur de grammaire (peut être ignoré).',
    'language-not-supported': 'Langue non supportée.'
  };

  return errorMessages[errorCode] || `Erreur reconnaissance vocale: ${errorCode}`;
};

// ==================== EXPORTS ====================

export default {
  isSpeechSupported,
  createSpeechRecognition,
  parseMealFromSpeech,
  searchFoodsFromVoice,
  getSpeechErrorMessage,
  SUPPORTED_LANGUAGES
};

