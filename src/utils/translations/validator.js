/**
 * ✅ PHASE 4.1 : Système de Validation des Clés Manquantes
 * 
 * Performance :
 * - Validation uniquement en mode développement
 * - Set pour éviter warnings répétés (une seule fois par clé manquante)
 * - Pas d'impact en production (code mort si NODE_ENV !== 'development')
 * 
 * Architecture :
 * - Vérifie les namespaces chargés ET l'ancien système
 * - Support des clés imbriquées (ex: 'home.title.line1')
 * - Logging intelligent avec contexte
 * 
 * @module translations/validator
 */

import { LANGUAGES } from './constants';
import { getCachedNamespace } from './loader';
import logger from '../logger';

const log = logger.module('translations-validator');

// Set pour éviter warnings répétés (une seule fois par clé manquante)
const MISSING_KEYS = new Set();

// Compteur de clés manquantes pour statistiques
let missingKeysCount = 0;

/**
 * Récupère une valeur depuis un objet en utilisant une clé avec points
 * Exemple: getNestedValue({ title: { line1: 'Hello' } }, 'title.line1') -> 'Hello'
 * @param {Object} obj - Objet à parcourir
 * @param {string} keyPath - Chemin de la clé (ex: 'title.line1')
 * @returns {any|null} Valeur trouvée ou null
 */
const getNestedValue = (obj, keyPath) => {
  if (!obj || !keyPath) return null;
  
  const parts = keyPath.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current !== undefined ? current : null;
};

/**
 * Extrait le namespace et la clé depuis une clé de traduction
 * Exemples :
 * - 'nav.home' -> { namespace: 'nav', key: 'home' }
 * - 'home.title.line1' -> { namespace: 'home', key: 'title.line1' }
 * - 'common.save' -> { namespace: 'common', key: 'save' }
 * @param {string} key - Clé de traduction complète
 * @returns {{namespace: string|null, key: string}} Namespace et clé extraits
 */
const parseKey = (key) => {
  const parts = key.split('.');
  const knownNamespaces = [
    'nav',
    'home',
    'settings',
    'common',
    'justification',
    'calendar',
    'stats',
    'today',
    'general',
    'exercises',
    'dataEntry',
    'program',
    'exercisesTab',
    'endurance',
    'progress',
    'history',
    'charts',
    'nutrition',
    'garmin',
    'bodyTracking',
    'nutritionAnalyses',
    'messages',
    'sessionFeedback',
    'books'
  ];
  
  // Si le premier segment est un namespace connu, l'utiliser
  if (knownNamespaces.includes(parts[0])) {
    return {
      namespace: parts[0],
      key: parts.slice(1).join('.')
    };
  }
  
  // Sinon, pas de namespace (ancien format)
  return {
    namespace: null,
    key: key
  };
};

/**
 * Vérifie si une clé de traduction existe dans les namespaces chargés ou l'ancien système
 * @param {string} key - Clé de traduction à valider
 * @param {string} language - Code de la langue
 * @param {Object} oldTranslations - Ancien système de traductions (rétrocompatibilité)
 * @returns {boolean} true si la clé existe, false sinon
 */
export const validateTranslationKey = (key, language, oldTranslations = {}) => {
  // Ne valider qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return true; // Toujours retourner true en production (pas de validation)
  }
  
  const lang = language || LANGUAGES.FR;
  
  // Parser la clé pour détecter le namespace
  const { namespace, key: namespaceKey } = parseKey(key);
  
  // ✅ Vérifier dans les namespaces chargés
  if (namespace) {
    const namespaceData = getCachedNamespace(lang, namespace);
    if (namespaceData) {
      // Namespace chargé, vérifier la clé
      if (namespaceKey) {
        const translation = getNestedValue(namespaceData, namespaceKey);
        if (translation !== null && translation !== undefined) {
          return true; // Clé trouvée dans le namespace
        }
      }
    } else {
      // Namespace pas encore chargé - ne pas valider (évite faux positifs)
      // Le namespace sera chargé de manière lazy quand la clé sera utilisée
      return true; // Retourner true pour éviter warnings prématurés
    }
  }
  
  // ✅ RÉTROCOMPATIBILITÉ : Vérifier dans l'ancien système
  if (oldTranslations[lang]?.[key] || oldTranslations[LANGUAGES.FR]?.[key]) {
    return true; // Clé trouvée dans l'ancien système
  }
  
  // Clé non trouvée (et namespace chargé)
  return false;
};

/**
 * Valide une clé de traduction et log un warning si elle est manquante
 * @param {string} key - Clé de traduction à valider
 * @param {string} language - Code de la langue
 * @param {Object} oldTranslations - Ancien système de traductions (optionnel)
 * @returns {boolean} true si la clé existe, false sinon
 */
export const validateAndWarn = (key, language, oldTranslations = {}) => {
  // Ne valider qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return true; // Toujours retourner true en production
  }
  
  // Créer une clé unique pour éviter warnings répétés
  const uniqueKey = `${language}:${key}`;
  
  // Si déjà vérifiée et manquante, ne pas re-warn
  if (MISSING_KEYS.has(uniqueKey)) {
    return false;
  }
  
  // Valider la clé
  const exists = validateTranslationKey(key, language, oldTranslations);
  
  if (!exists) {
    // Ajouter au Set pour éviter warnings répétés
    MISSING_KEYS.add(uniqueKey);
    missingKeysCount++;
    
    // Logger un warning avec contexte
    log.warn(
      `[i18n] Clé de traduction manquante: "${key}" pour "${language}"`,
      {
        key,
        language,
        namespace: parseKey(key).namespace,
        totalMissing: missingKeysCount
      }
    );
    
    // En développement, aussi log dans la console pour visibilité
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[i18n] ⚠️ Clé de traduction manquante: "${key}" pour "${language}"`,
        `\n   Namespace: ${parseKey(key).namespace || 'ancien système'}`,
        `\n   Total clés manquantes: ${missingKeysCount}`
      );
    }
  }
  
  return exists;
};

/**
 * Réinitialise le compteur de clés manquantes (utile pour les tests)
 */
export const resetMissingKeys = () => {
  MISSING_KEYS.clear();
  missingKeysCount = 0;
  log.debug('[validator] Reset missing keys counter');
};

/**
 * Récupère les statistiques de validation
 * @returns {{totalMissing: number, missingKeys: string[]}} Statistiques
 */
export const getValidationStats = () => {
  return {
    totalMissing: missingKeysCount,
    missingKeys: Array.from(MISSING_KEYS)
  };
};

