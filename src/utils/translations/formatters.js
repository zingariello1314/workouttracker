/**
 * ✅ PHASE 2.2 : Système de Formatage selon la Locale
 * 
 * Intelligence :
 * - Formatage automatique des dates selon la locale
 * - Formatage automatique des nombres selon la locale
 * - Formatage automatique des devises selon la locale
 * - Support de l'API Intl (standard moderne)
 * - Cache des formatters pour performance
 * 
 * Architecture :
 * - Utilise Intl.DateTimeFormat, Intl.NumberFormat
 * - Cache des formatters (évite recréation)
 * - Support SSR (vérification de Intl)
 * - Gestion d'erreurs robuste
 */

import { LANGUAGES } from './constants';
import logger from '../logger';

const log = logger.module('translations-formatters');

// ==================== CONFIGURATION DES LOCALES ====================

/**
 * Mapping des langues vers les locales Intl
 */
const LOCALES = {
  [LANGUAGES.FR]: 'fr-FR',
  [LANGUAGES.EN]: 'en-US'
};

/**
 * Récupère la locale pour une langue donnée
 * @param {string} language - Code de la langue (fr, en)
 * @returns {string} Locale Intl (fr-FR, en-US)
 */
const getLocale = (language) => {
  return LOCALES[language] || LOCALES[LANGUAGES.FR];
};

// ==================== CACHE DES FORMATTERS ====================

/**
 * Cache des formatters de dates (évite recréation)
 * Clé : `${locale}:${JSON.stringify(options)}`
 */
const dateFormatterCache = new Map();

/**
 * Cache des formatters de nombres (évite recréation)
 * Clé : `${locale}:${JSON.stringify(options)}`
 */
const numberFormatterCache = new Map();

/**
 * Cache des formatters de devises (évite recréation)
 * Clé : `${locale}:${currency}`
 */
const currencyFormatterCache = new Map();

/**
 * Génère une clé de cache depuis des options
 * @param {Object} options - Options de formatage
 * @returns {string} Clé de cache
 */
const getCacheKey = (options) => {
  if (!options || Object.keys(options).length === 0) {
    return 'default';
  }
  // Trier les clés pour garantir cohérence
  const sorted = Object.keys(options).sort().map(key => `${key}:${options[key]}`).join('|');
  return sorted;
};

// ==================== FORMATAGE DES DATES ====================

/**
 * Formate une date selon la locale
 * 
 * @param {Date|string|number} date - Date à formater (Date, string ISO, ou timestamp)
 * @param {string} language - Code de la langue (fr, en)
 * @param {Object} options - Options de formatage Intl.DateTimeFormat
 * @param {string} options.year - Format de l'année ('numeric', '2-digit')
 * @param {string} options.month - Format du mois ('numeric', '2-digit', 'long', 'short', 'narrow')
 * @param {string} options.day - Format du jour ('numeric', '2-digit')
 * @param {string} options.weekday - Format du jour de la semaine ('long', 'short', 'narrow')
 * @param {string} options.hour - Format de l'heure ('numeric', '2-digit')
 * @param {string} options.minute - Format des minutes ('numeric', '2-digit')
 * @param {string} options.second - Format des secondes ('numeric', '2-digit')
 * @param {string} options.timeZone - Timezone (défaut: timezone locale)
 * @returns {string} Date formatée selon la locale
 * 
 * @example
 * formatDate(new Date(), 'fr') // → "15 janvier 2025"
 * formatDate(new Date(), 'en') // → "January 15, 2025"
 * formatDate(new Date(), 'fr', { month: 'short' }) // → "15 janv. 2025"
 */
export const formatDate = (date, language, options = {}) => {
  // ✅ Vérifier support Intl (SSR safe)
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
    log.warn('[formatDate] Intl.DateTimeFormat non disponible, fallback vers format simple');
    return date instanceof Date ? date.toLocaleDateString() : String(date);
  }

  try {
    const locale = getLocale(language);
    const dateObj = date instanceof Date 
      ? date 
      : (typeof date === 'string' || typeof date === 'number' 
          ? new Date(date) 
          : null);

    if (!dateObj || isNaN(dateObj.getTime())) {
      log.warn('[formatDate] Date invalide:', date);
      return String(date);
    }

    // Options par défaut (format complet)
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    // ✅ OPTIMISATION : Utiliser le cache des formatters
    const cacheKey = `${locale}:${getCacheKey(defaultOptions)}`;
    let formatter = dateFormatterCache.get(cacheKey);

    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, defaultOptions);
      dateFormatterCache.set(cacheKey, formatter);
      
      // Limiter la taille du cache (éviter fuite mémoire)
      if (dateFormatterCache.size > 50) {
        const firstKey = dateFormatterCache.keys().next().value;
        dateFormatterCache.delete(firstKey);
      }
    }

    return formatter.format(dateObj);
  } catch (error) {
    log.error('[formatDate] Erreur lors du formatage:', error);
    return date instanceof Date ? date.toLocaleDateString() : String(date);
  }
};

/**
 * Formate une date courte (ex: "15/01/2025" ou "01/15/2025")
 * 
 * @param {Date|string|number} date - Date à formater
 * @param {string} language - Code de la langue
 * @returns {string} Date formatée en format court
 */
export const formatDateShort = (date, language) => {
  return formatDate(date, language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formate une date avec heure (ex: "15 janvier 2025 à 14:30")
 * 
 * @param {Date|string|number} date - Date à formater
 * @param {string} language - Code de la langue
 * @param {Object} options - Options supplémentaires
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date, language, options = {}) => {
  return formatDate(date, language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options
  });
};

// ==================== FORMATAGE DES NOMBRES ====================

/**
 * Formate un nombre selon la locale
 * 
 * @param {number} number - Nombre à formater
 * @param {string} language - Code de la langue (fr, en)
 * @param {Object} options - Options de formatage Intl.NumberFormat
 * @param {number} options.minimumFractionDigits - Décimales minimales (défaut: 0)
 * @param {number} options.maximumFractionDigits - Décimales maximales (défaut: 2)
 * @param {boolean} options.useGrouping - Utiliser séparateurs de milliers (défaut: true)
 * @returns {string} Nombre formaté selon la locale
 * 
 * @example
 * formatNumber(1234.56, 'fr') // → "1 234,56"
 * formatNumber(1234.56, 'en') // → "1,234.56"
 * formatNumber(1234, 'fr', { maximumFractionDigits: 0 }) // → "1 234"
 */
export const formatNumber = (number, language, options = {}) => {
  // ✅ Vérifier support Intl (SSR safe)
  if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
    log.warn('[formatNumber] Intl.NumberFormat non disponible, fallback vers format simple');
    return String(number);
  }

  try {
    if (typeof number !== 'number' || isNaN(number)) {
      log.warn('[formatNumber] Nombre invalide:', number);
      return String(number);
    }

    const locale = getLocale(language);

    // Options par défaut
    const defaultOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
      ...options
    };

    // ✅ OPTIMISATION : Utiliser le cache des formatters
    const cacheKey = `${locale}:${getCacheKey(defaultOptions)}`;
    let formatter = numberFormatterCache.get(cacheKey);

    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, defaultOptions);
      numberFormatterCache.set(cacheKey, formatter);
      
      // Limiter la taille du cache
      if (numberFormatterCache.size > 50) {
        const firstKey = numberFormatterCache.keys().next().value;
        numberFormatterCache.delete(firstKey);
      }
    }

    return formatter.format(number);
  } catch (error) {
    log.error('[formatNumber] Erreur lors du formatage:', error);
    return String(number);
  }
};

/**
 * Formate un nombre entier (sans décimales)
 * 
 * @param {number} number - Nombre à formater
 * @param {string} language - Code de la langue
 * @returns {string} Nombre entier formaté
 */
export const formatInteger = (number, language) => {
  return formatNumber(number, language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// ==================== FORMATAGE DES DEVISES ====================

/**
 * Formate un montant en devise selon la locale
 * 
 * @param {number} amount - Montant à formater
 * @param {string} language - Code de la langue (fr, en)
 * @param {string} currency - Code de la devise (EUR, USD, etc.) - défaut: EUR
 * @param {Object} options - Options supplémentaires de formatage
 * @returns {string} Montant formaté avec devise
 * 
 * @example
 * formatCurrency(1234.56, 'fr', 'EUR') // → "1 234,56 €"
 * formatCurrency(1234.56, 'en', 'USD') // → "$1,234.56"
 */
export const formatCurrency = (amount, language, currency = 'EUR', options = {}) => {
  // ✅ Vérifier support Intl (SSR safe)
  if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
    log.warn('[formatCurrency] Intl.NumberFormat non disponible, fallback vers format simple');
    return `${amount} ${currency}`;
  }

  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      log.warn('[formatCurrency] Montant invalide:', amount);
      return `${amount} ${currency}`;
    }

    const locale = getLocale(language);

    // Options par défaut pour devise
    const defaultOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };

    // ✅ OPTIMISATION : Utiliser le cache des formatters
    const cacheKey = `${locale}:${currency}:${getCacheKey(defaultOptions)}`;
    let formatter = currencyFormatterCache.get(cacheKey);

    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, defaultOptions);
      currencyFormatterCache.set(cacheKey, formatter);
      
      // Limiter la taille du cache
      if (currencyFormatterCache.size > 50) {
        const firstKey = currencyFormatterCache.keys().next().value;
        currencyFormatterCache.delete(firstKey);
      }
    }

    return formatter.format(amount);
  } catch (error) {
    log.error('[formatCurrency] Erreur lors du formatage:', error);
    return `${amount} ${currency}`;
  }
};

// ==================== NETTOYAGE DU CACHE ====================

// ==================== HOOK REACT ====================

/**
 * Hook React pour utiliser les formatters avec la langue actuelle
 * 
 * ⚠️ NOTE : Ce hook doit être importé depuis un fichier séparé pour éviter dépendance circulaire
 * Utiliser : import { useFormatters } from './utils/translations/formatters-hook';
 * 
 * @returns {Object} Objet avec les fonctions de formatage
 * 
 * @example
 * const { formatDate, formatNumber, formatCurrency } = useFormatters();
 * const date = new Date();
 * formatDate(date) // → "15 janvier 2025" (selon langue actuelle)
 * formatNumber(1234.56) // → "1 234,56" ou "1,234.56" (selon langue)
 */

// ==================== NETTOYAGE DU CACHE ====================

/**
 * Vide les caches des formatters (utile pour les tests ou libération mémoire)
 */
export const clearFormatterCache = () => {
  dateFormatterCache.clear();
  numberFormatterCache.clear();
  currencyFormatterCache.clear();
  log.debug('[clearFormatterCache] Caches des formatters vidés');
};

