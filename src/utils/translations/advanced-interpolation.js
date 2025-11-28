/**
 * ✅ PHASE 5.3 : Support des Traductions Dynamiques Avancées
 * 
 * Performance :
 * - Parsing optimisé avec cache des templates compilés
 * - Évaluation lazy des conditions
 * - Support des formatters Intl intégrés
 * 
 * Architecture :
 * - Interpolation avancée avec conditions (if/then/else)
 * - Formatage de nombres et dates dans les traductions
 * - Support des fonctions de formatage personnalisées
 * - Rétrocompatible avec l'interpolation simple {{variable}}
 * 
 * @module translations/advanced-interpolation
 */

import logger from '../logger';
import { useFormatters } from '../formatters-hook';

const log = logger.module('translations-advanced-interpolation');

/**
 * Cache des templates compilés (évite re-parsing)
 */
const compiledTemplatesCache = new Map();
const CACHE_SIZE_LIMIT = 500;

/**
 * Compile un template de traduction en une fonction d'interpolation
 * @param {string} template - Template avec syntaxe avancée
 * @returns {Function} Fonction d'interpolation
 */
const compileTemplate = (template) => {
  // Vérifier le cache
  if (compiledTemplatesCache.has(template)) {
    return compiledTemplatesCache.get(template);
  }
  
  // Parser le template
  const parts = [];
  let currentIndex = 0;
  
  // Regex pour détecter les patterns avancés
  // {{variable}} - interpolation simple
  // {{variable|format}} - interpolation avec formatage
  // {{if condition then value else other}} - condition
  const advancedPattern = /\{\{([^}]+)\}\}/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = advancedPattern.exec(template)) !== null) {
    // Ajouter le texte avant le pattern
        if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: template.substring(lastIndex, match.index)
      });
    }
    
    // Parser le contenu du pattern
    const content = match[1].trim();
    const part = parsePattern(content);
    parts.push(part);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le texte restant
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      value: template.substring(lastIndex)
    });
  }
  
  // Créer la fonction d'interpolation
  const interpolate = (params, formatters = {}) => {
    return parts.map(part => {
      if (part.type === 'text') {
        return part.value;
      } else if (part.type === 'variable') {
        const value = params[part.name];
        if (value === undefined) {
          return `{{${part.name}}}`;
        }
        
        // Appliquer le formatage si spécifié
        if (part.format && formatters[part.format]) {
          return formatters[part.format](value);
        }
        
        return String(value);
      } else if (part.type === 'condition') {
        const conditionValue = params[part.condition];
        const isTruthy = conditionValue !== undefined && conditionValue !== null && conditionValue !== false && conditionValue !== '';
        
        if (isTruthy) {
          return interpolateSimple(part.then, params, formatters);
        } else {
          return interpolateSimple(part.else || '', params, formatters);
        }
      }
      
      return '';
    }).join('');
  };
  
  // Mettre en cache (avec limite de taille)
  if (compiledTemplatesCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = compiledTemplatesCache.keys().next().value;
    compiledTemplatesCache.delete(firstKey);
  }
  compiledTemplatesCache.set(template, interpolate);
  
  return interpolate;
};

/**
 * Parse un pattern de traduction avancé
 * @param {string} content - Contenu du pattern (ex: "variable|format" ou "if condition then value else other")
 * @returns {Object} Partie parsée
 */
const parsePattern = (content) => {
  // Vérifier si c'est une condition
  const conditionMatch = content.match(/^if\s+(\w+)\s+then\s+(.+?)(?:\s+else\s+(.+))?$/);
  if (conditionMatch) {
    return {
      type: 'condition',
      condition: conditionMatch[1],
      then: conditionMatch[2],
      else: conditionMatch[3] || ''
    };
  }
  
  // Vérifier si c'est une variable avec formatage
  const formatMatch = content.match(/^(\w+)(?:\|(.+))?$/);
  if (formatMatch) {
    return {
      type: 'variable',
      name: formatMatch[1],
      format: formatMatch[2] || null
    };
  }
  
  // Fallback : variable simple
  return {
    type: 'variable',
    name: content,
    format: null
  };
};

/**
 * Interpole un template simple (rétrocompatibilité)
 * @param {string} template - Template simple
 * @param {Object} params - Paramètres
 * @param {Object} formatters - Formatters disponibles
 * @returns {string} Texte interpolé
 */
const interpolateSimple = (template, params, formatters) => {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)(?:\|(.+?))?\}\}/g, (match, name, format) => {
    const value = params[name];
    if (value === undefined) {
      return match;
    }
    
    if (format && formatters[format]) {
      return formatters[format](value);
    }
    
    return String(value);
  });
};

/**
 * Interpole un template de traduction avec support avancé
 * @param {string} template - Template avec syntaxe avancée
 * @param {Object} params - Paramètres à interpoler
 * @param {Object} formatters - Formatters disponibles (optionnel)
 * @returns {string} Texte interpolé
 */
export const interpolateAdvanced = (template, params = {}, formatters = {}) => {
  if (!template || typeof template !== 'string') {
    return template || '';
  }
  
  try {
    // Compiler le template (avec cache)
    const interpolate = compileTemplate(template);
    
    // Interpoler avec les paramètres et formatters
    return interpolate(params, formatters);
  } catch (error) {
    log.error('[interpolateAdvanced] Erreur lors de l\'interpolation:', error);
    // Fallback vers interpolation simple
    return interpolateSimple(template, params, formatters);
  }
};

/**
 * Formatters intégrés pour les traductions
 */
export const builtInFormatters = {
  /**
   * Formate un nombre
   * @param {number} value - Valeur à formater
   * @param {string} locale - Locale (ex: 'fr-FR', 'en-US')
   * @param {Object} options - Options de formatage
   * @returns {string} Nombre formaté
   */
  number: (value, locale = 'fr-FR', options = {}) => {
    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch (error) {
      return String(value);
    }
  },
  
  /**
   * Formate une date
   * @param {Date|string|number} value - Date à formater
   * @param {string} locale - Locale
   * @param {Object} options - Options de formatage
   * @returns {string} Date formatée
   */
  date: (value, locale = 'fr-FR', options = {}) => {
    try {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return String(value);
    }
  },
  
  /**
   * Formate une devise
   * @param {number} value - Montant
   * @param {string} currency - Code devise (ex: 'EUR', 'USD')
   * @param {string} locale - Locale
   * @returns {string} Montant formaté
   */
  currency: (value, currency = 'EUR', locale = 'fr-FR') => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    } catch (error) {
      return String(value);
    }
  },
  
  /**
   * Formate un pourcentage
   * @param {number} value - Valeur (ex: 0.5 pour 50%)
   * @param {string} locale - Locale
   * @returns {string} Pourcentage formaté
   */
  percent: (value, locale = 'fr-FR') => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return String(value);
    }
  },
  
  /**
   * Formate une durée (en secondes)
   * @param {number} seconds - Durée en secondes
   * @returns {string} Durée formatée (ex: "1h 30min")
   */
  duration: (seconds) => {
    if (!seconds || seconds < 0) return '0min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }
};

/**
 * Vide le cache des templates compilés
 */
export const clearTemplateCache = () => {
  compiledTemplatesCache.clear();
  log.debug('[clearTemplateCache] Cache des templates vidé');
};

