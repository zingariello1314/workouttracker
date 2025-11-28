/**
 * ✅ PHASE 2.3 : Système de Pluralisation Intelligente
 * 
 * Intelligence :
 * - Règles de pluralisation selon les standards CLDR/Unicode
 * - Support de plusieurs formes (one, other, zero, few, many)
 * - Détection automatique de la forme correcte selon le nombre
 * - Interpolation du nombre dans la traduction
 * 
 * Architecture :
 * - Utilise les règles standard Unicode CLDR
 * - Support FR et EN (extensible facilement)
 * - Cache des règles calculées (performance)
 * - Intégration transparente avec useTranslation
 */

import { LANGUAGES } from './constants';
import logger from '../logger';

const log = logger.module('translations-pluralization');

// ==================== RÈGLES DE PLURALISATION ====================

/**
 * Règles de pluralisation selon les standards Unicode CLDR
 * 
 * Formes supportées :
 * - zero : Pour 0 (certaines langues)
 * - one : Pour 1 (singulier)
 * - two : Pour 2 (certaines langues)
 * - few : Pour quelques (2-4, etc.)
 * - many : Pour beaucoup (certaines langues)
 * - other : Pour tous les autres cas (pluriel par défaut)
 * 
 * Référence : https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html
 */

/**
 * Règle de pluralisation pour le français
 * 
 * Règle CLDR : 
 * - one : count is 0 or 1 (0, 1)
 * - other : everything else (2, 3, 4, ...)
 * 
 * Exemples :
 * - 0 jour → "0 jour" (one)
 * - 1 jour → "1 jour" (one)
 * - 2 jours → "2 jours" (other)
 */
const pluralRuleFR = (count) => {
  // En français, 0 et 1 utilisent la forme "one" (singulier)
  if (count === 0 || count === 1) {
    return 'one';
  }
  // Tous les autres nombres utilisent "other" (pluriel)
  return 'other';
};

/**
 * Règle de pluralisation pour l'anglais
 * 
 * Règle CLDR :
 * - one : count is 1 (1)
 * - other : everything else (0, 2, 3, 4, ...)
 * 
 * Exemples :
 * - 0 days → "0 days" (other)
 * - 1 day → "1 day" (one)
 * - 2 days → "2 days" (other)
 */
const pluralRuleEN = (count) => {
  // En anglais, seul 1 utilise la forme "one" (singulier)
  if (count === 1) {
    return 'one';
  }
  // Tous les autres nombres (0, 2, 3, ...) utilisent "other" (pluriel)
  return 'other';
};

/**
 * Mapping des règles de pluralisation par langue
 */
const PLURAL_RULES = {
  [LANGUAGES.FR]: pluralRuleFR,
  [LANGUAGES.EN]: pluralRuleEN
};

// ==================== FONCTIONS DE PLURALISATION ====================

/**
 * Détermine la forme de pluralisation pour un nombre donné
 * 
 * @param {number} count - Nombre à évaluer
 * @param {string} language - Code de la langue (fr, en)
 * @returns {string} Forme de pluralisation ('one', 'other', etc.)
 * 
 * @example
 * getPluralForm(0, 'fr') // → 'one'
 * getPluralForm(1, 'fr') // → 'one'
 * getPluralForm(2, 'fr') // → 'other'
 * getPluralForm(1, 'en') // → 'one'
 * getPluralForm(0, 'en') // → 'other'
 */
export const getPluralForm = (count, language) => {
  const lang = language || LANGUAGES.FR;
  const rule = PLURAL_RULES[lang];
  
  if (!rule) {
    log.warn(`[getPluralForm] Règle de pluralisation non trouvée pour ${lang}, utilisation de FR`);
    return pluralRuleFR(count);
  }
  
  return rule(count);
};

/**
 * Génère la clé de traduction avec la forme de pluralisation
 * 
 * @param {string} key - Clé de traduction de base (ex: 'general.days')
 * @param {number} count - Nombre à évaluer
 * @param {string} language - Code de la langue
 * @returns {string} Clé de traduction avec forme de pluralisation (ex: 'general.days.one' ou 'general.days.other')
 * 
 * @example
 * getPluralKey('general.days', 1, 'fr') // → 'general.days.one'
 * getPluralKey('general.days', 2, 'fr') // → 'general.days.other'
 */
export const getPluralKey = (key, count, language) => {
  const pluralForm = getPluralForm(count, language);
  return `${key}.${pluralForm}`;
};

/**
 * Interpole le nombre dans une traduction avec pluralisation
 * 
 * @param {string} template - Template de traduction (ex: "{{count}} jour" ou "{{count}} jours")
 * @param {number} count - Nombre à interpoler
 * @returns {string} Traduction avec nombre interpolé
 * 
 * @example
 * interpolatePlural("{{count}} jour", 1) // → "1 jour"
 * interpolatePlural("{{count}} jours", 2) // → "2 jours"
 */
const interpolatePlural = (template, count) => {
  if (!template || typeof template !== 'string') {
    return String(count);
  }
  
  // Support de {{count}} et {count}
  return template.replace(/\{\{count\}\}|\{count\}/g, String(count));
};

/**
 * Récupère une traduction avec pluralisation depuis un objet de traductions
 * 
 * @param {Object} translations - Objet de traductions (peut être un namespace ou l'objet complet)
 * @param {string} key - Clé de traduction de base (ex: 'general.days')
 * @param {number} count - Nombre à évaluer
 * @param {string} language - Code de la langue
 * @param {string} fallback - Valeur par défaut si traduction non trouvée
 * @returns {string} Traduction avec nombre interpolé
 * 
 * @example
 * const translations = { 'general.days.one': '{{count}} jour', 'general.days.other': '{{count}} jours' };
 * tPlural(translations, 'general.days', 1, 'fr') // → "1 jour"
 * tPlural(translations, 'general.days', 2, 'fr') // → "2 jours"
 */
export const tPlural = (translations, key, count, language, fallback = '') => {
  if (!translations || typeof translations !== 'object') {
    log.warn('[tPlural] Objet de traductions invalide');
    return fallback || String(count);
  }

  const lang = language || LANGUAGES.FR;
  
  // Générer la clé avec forme de pluralisation
  const pluralKey = getPluralKey(key, count, language);
  
  // Essayer de récupérer la traduction avec la forme de pluralisation
  let translation = translations[pluralKey];
  
  // Si non trouvé, essayer la clé de base (fallback)
  if (!translation) {
    translation = translations[key];
  }
  
  // Si toujours non trouvé, utiliser le fallback
  if (!translation) {
    log.debug(`[tPlural] Traduction non trouvée pour ${pluralKey} ou ${key}, utilisation du fallback`);
    return fallback || String(count);
  }
  
  // Interpoler le nombre dans la traduction
  return interpolatePlural(translation, count);
};

/**
 * Récupère une valeur depuis un objet en utilisant une clé avec points
 * Exemple: getNestedValue({ days: { one: '1 jour' } }, 'days.one') -> '1 jour'
 */
const getNestedValueFromObject = (obj, keyPath) => {
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
  
  return typeof current === 'string' ? current : null;
};

/**
 * Récupère une traduction avec pluralisation depuis les namespaces chargés
 * 
 * Cette fonction est utilisée par useTranslation pour supporter la pluralisation
 * avec les namespaces lazy-loaded.
 * 
 * Supporte deux formats :
 * 1. Format avec points : "days.one", "days.other" (clés séparées)
 * 2. Format avec objets : { days: { one: "...", other: "..." } } (objet imbriqué)
 * 
 * @param {string} key - Clé de traduction (ex: 'general.days')
 * @param {number} count - Nombre à évaluer
 * @param {string} language - Code de la langue
 * @param {Function} getTranslation - Fonction pour récupérer une traduction depuis les namespaces
 * @param {string} fallback - Valeur par défaut
 * @returns {string} Traduction avec nombre interpolé
 */
export const tPluralFromNamespaces = (key, count, language, getTranslation, fallback = '') => {
  const lang = language || LANGUAGES.FR;
  
  // Générer la clé avec forme de pluralisation
  const pluralForm = getPluralForm(count, language);
  const pluralKey = `${key}.${pluralForm}`;
  
  // Essayer de récupérer la traduction avec la forme de pluralisation (format avec points)
  let translation = getTranslation(pluralKey, null);
  
  // Si non trouvé, essayer le format objet imbriqué (ex: general.days -> { days: { one: "...", other: "..." } })
  if (!translation || translation === pluralKey) {
    // Parser la clé pour extraire le namespace et la clé de base
    const parts = key.split('.');
    if (parts.length >= 2) {
      const baseKey = parts[parts.length - 1]; // Dernière partie (ex: "days")
      const namespaceKey = parts.slice(0, -1).join('.'); // Tout sauf la dernière (ex: "general")
      
      // Essayer de récupérer l'objet parent
      const parentObj = getTranslation(namespaceKey, null);
      
      // Si c'est un objet, essayer d'accéder à baseKey.pluralForm
      if (parentObj && typeof parentObj === 'object' && !Array.isArray(parentObj)) {
        const nestedValue = getNestedValueFromObject(parentObj, `${baseKey}.${pluralForm}`);
        if (nestedValue) {
          translation = nestedValue;
        } else {
          // Essayer aussi baseKey directement (pour compatibilité)
          const directValue = getNestedValueFromObject(parentObj, baseKey);
          if (directValue && typeof directValue === 'object') {
            translation = directValue[pluralForm] || directValue.other || directValue.one || null;
          }
        }
      }
    }
  }
  
  // Si toujours non trouvé, essayer la clé de base (fallback)
  if (!translation || translation === pluralKey) {
    translation = getTranslation(key, null);
    
    // Si la traduction est un objet (format imbriqué), extraire la forme correcte
    if (translation && typeof translation === 'object' && !Array.isArray(translation)) {
      translation = translation[pluralForm] || translation.other || translation.one || null;
    }
  }
  
  // Si toujours non trouvé, utiliser le fallback
  if (!translation || translation === pluralKey || translation === key) {
    log.debug(`[tPluralFromNamespaces] Traduction non trouvée pour ${pluralKey} ou ${key}`);
    return fallback || String(count);
  }
  
  // Interpoler le nombre dans la traduction
  return interpolatePlural(translation, count);
};

// ==================== UTILITAIRES ====================

/**
 * Vérifie si une clé de traduction supporte la pluralisation
 * (vérifie si les formes .one et .other existent)
 * 
 * @param {Object} translations - Objet de traductions
 * @param {string} key - Clé de traduction de base
 * @param {string} language - Code de la langue
 * @returns {boolean} True si la clé supporte la pluralisation
 */
export const hasPluralSupport = (translations, key, language) => {
  if (!translations || typeof translations !== 'object') {
    return false;
  }
  
  const oneKey = `${key}.one`;
  const otherKey = `${key}.other`;
  
  return !!(translations[oneKey] || translations[otherKey]);
};

