/**
 * ✅ PHASE 2.1 : Détection Automatique de la Langue du Navigateur
 * 
 * Intelligence :
 * - Détection automatique de la langue préférée de l'utilisateur
 * - Support de plusieurs sources (navigator.language, navigator.languages)
 * - Gestion des variantes régionales (fr-FR, en-US, etc.)
 * - Fallback intelligent vers français par défaut
 * 
 * Architecture :
 * - Fonction pure (pas de side effects)
 * - Support SSR (vérification de l'existence de navigator)
 * - Performance optimale (pas de calculs inutiles)
 * - Logging pour debugging
 */

import { LANGUAGES } from './constants';
import logger from '../logger';

const log = logger.module('translations-detection');

/**
 * Détecte la langue du navigateur de manière intelligente
 * 
 * Stratégie de détection :
 * 1. Vérifier navigator.languages (tableau des langues préférées, ordre de préférence)
 * 2. Fallback vers navigator.language (langue principale)
 * 3. Fallback vers navigator.userLanguage (IE/anciens navigateurs)
 * 4. Extraire le code de langue (ex: 'fr-FR' -> 'fr')
 * 5. Vérifier si la langue est supportée
 * 6. Fallback vers français par défaut
 * 
 * @returns {string} Code de langue détecté ('fr' ou 'en')
 * 
 * @example
 * const detected = detectBrowserLanguage();
 * // Retourne 'fr' ou 'en' selon la langue du navigateur
 */
export const detectBrowserLanguage = () => {
  // ✅ Vérifier si on est dans un environnement navigateur (SSR safe)
  if (typeof navigator === 'undefined') {
    log.debug('[detectBrowserLanguage] Navigator non disponible (SSR), fallback vers FR');
    return LANGUAGES.FR;
  }

  try {
    // ✅ OPTIMISATION : Utiliser navigator.languages en priorité (plus précis)
    // navigator.languages est un tableau ordonné par préférence
    // Exemple: ['fr-FR', 'fr', 'en-US', 'en']
    const languages = navigator.languages || [];
    
    // Parcourir les langues préférées dans l'ordre
    for (const lang of languages) {
      const detected = extractLanguageCode(lang);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.languages: ${lang} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK : Utiliser navigator.language (langue principale)
    if (navigator.language) {
      const detected = extractLanguageCode(navigator.language);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.language: ${navigator.language} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK : Utiliser navigator.userLanguage (IE/anciens navigateurs)
    if (navigator.userLanguage) {
      const detected = extractLanguageCode(navigator.userLanguage);
      if (detected) {
        log.debug(`[detectBrowserLanguage] Langue détectée depuis navigator.userLanguage: ${navigator.userLanguage} -> ${detected}`);
        return detected;
      }
    }
    
    // ✅ FALLBACK FINAL : Français par défaut
    log.debug('[detectBrowserLanguage] Aucune langue détectée, fallback vers FR');
    return LANGUAGES.FR;
  } catch (error) {
    // ✅ GESTION D'ERREUR : En cas d'erreur, retourner français par défaut
    log.error('[detectBrowserLanguage] Erreur lors de la détection:', error);
    return LANGUAGES.FR;
  }
};

/**
 * Extrait le code de langue depuis une chaîne de locale
 * 
 * Exemples :
 * - 'fr-FR' -> 'fr'
 * - 'en-US' -> 'en'
 * - 'fr' -> 'fr'
 * - 'en' -> 'en'
 * - 'de-DE' -> null (non supporté)
 * 
 * @param {string} locale - Chaîne de locale (ex: 'fr-FR', 'en-US')
 * @returns {string|null} Code de langue supporté ('fr' ou 'en') ou null
 */
const extractLanguageCode = (locale) => {
  if (!locale || typeof locale !== 'string') {
    return null;
  }
  
  // Extraire le code de langue (première partie avant le tiret)
  // Exemple: 'fr-FR' -> 'fr', 'en-US' -> 'en'
  const langCode = locale.split('-')[0].toLowerCase();
  
  // Vérifier si la langue est supportée
  if (langCode === 'fr') {
    return LANGUAGES.FR;
  }
  
  if (langCode === 'en') {
    return LANGUAGES.EN;
  }
  
  // Langue non supportée
  return null;
};

/**
 * Détecte la langue avec priorité au localStorage
 * 
 * Ordre de priorité :
 * 1. localStorage (préférence utilisateur explicite)
 * 2. Détection automatique du navigateur
 * 3. Français par défaut
 * 
 * @param {Function} getStoredLanguage - Fonction pour récupérer la langue depuis localStorage
 * @returns {string} Code de langue final ('fr' ou 'en')
 */
export const detectLanguageWithPriority = (getStoredLanguage) => {
  try {
    // 1. Vérifier localStorage en priorité (préférence utilisateur)
    const stored = getStoredLanguage();
    if (stored && (stored === LANGUAGES.FR || stored === LANGUAGES.EN)) {
      log.debug(`[detectLanguageWithPriority] Langue depuis localStorage: ${stored}`);
      return stored;
    }
    
    // 2. Détecter depuis le navigateur
    const detected = detectBrowserLanguage();
    log.debug(`[detectLanguageWithPriority] Langue détectée: ${detected}`);
    return detected;
  } catch (error) {
    log.error('[detectLanguageWithPriority] Erreur lors de la détection:', error);
    return LANGUAGES.FR;
  }
};

