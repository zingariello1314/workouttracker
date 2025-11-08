/**
 * ✅ PHASE 1.3 : Module d'utilitaires pour dates dans le contexte Garmin
 * 
 * Ce module centralise toutes les fonctions de manipulation de dates spécifiques à Garmin.
 * Il utilise `dateUtils.js` quand possible et ajoute des fonctions spécifiques.
 * 
 * Objectifs :
 * - Éliminer les duplications de formatage de dates
 * - Centraliser la logique de manipulation de dates
 * - Assurer la cohérence dans tout le système Garmin
 * - Utiliser les fonctions existantes de `dateUtils.js` quand possible
 * 
 * @module garminDateUtils
 */

import { getDateStr, addDays, subtractDays } from '../../../../utils/dateUtils';
import logger from '../../../../utils/logger';

const log = logger.module('garminDateUtils');

/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD
 * 
 * Cette fonction est un wrapper optimisé autour de `getDateStr(new Date())`
 * pour éviter de répéter le pattern partout.
 * 
 * ⚠️ IMPORTANT : Utilise la date locale (pas UTC) pour éviter problèmes de timezone.
 * 
 * @returns {string} Date d'aujourd'hui au format YYYY-MM-DD
 * 
 * @example
 * const today = getTodayDateStr(); // "2025-01-15"
 */
export const getTodayDateStr = () => {
  return getDateStr(new Date());
};

/**
 * Retourne minuit (00:00:00) pour une date donnée
 * 
 * Cette fonction est utile pour calculer le début d'une journée,
 * notamment pour la Phase 5.1 (retry automatique après 00:15).
 * 
 * ⚠️ IMPORTANT : Utilise la date locale (pas UTC).
 * 
 * @param {Date|string} date - Date (objet Date ou string YYYY-MM-DD)
 * @returns {Date} Date à minuit (00:00:00)
 * 
 * @example
 * const midnight = getMidnight(new Date()); // Aujourd'hui à 00:00:00
 * const midnightStr = getMidnight('2025-01-15'); // 2025-01-15 à 00:00:00
 */
export const getMidnight = (date) => {
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    // Parser YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    log.warn('[getMidnight] Invalid date parameter, using today');
    dateObj = new Date();
  }
  
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
};

/**
 * Compare deux dates au format YYYY-MM-DD
 * 
 * Retourne true si date1 est avant ou égale à date2.
 * 
 * @param {string} date1 - Première date (YYYY-MM-DD)
 * @param {string} date2 - Deuxième date (YYYY-MM-DD)
 * @returns {boolean} True si date1 <= date2
 * 
 * @example
 * isDateBeforeOrEqual('2025-01-01', '2025-01-15'); // true
 * isDateBeforeOrEqual('2025-01-15', '2025-01-01'); // false
 * isDateBeforeOrEqual('2025-01-15', '2025-01-15'); // true
 */
export const isDateBeforeOrEqual = (date1, date2) => {
  if (!date1 || !date2) {
    log.warn('[isDateBeforeOrEqual] Invalid dates provided');
    return false;
  }
  
  // Comparaison lexicographique (YYYY-MM-DD est comparable directement)
  return date1 <= date2;
};

/**
 * Valide qu'une string est au format YYYY-MM-DD valide
 * 
 * Vérifie :
 * - Format correct (YYYY-MM-DD)
 * - Date valide (pas de 2025-13-45 par exemple)
 * 
 * @param {string} dateStr - String à valider
 * @returns {boolean} True si format valide
 * 
 * @example
 * isDateValid('2025-01-15'); // true
 * isDateValid('2025-13-45'); // false
 * isDateValid('invalid'); // false
 */
export const isDateValid = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  
  // Vérifier format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  
  // Vérifier que c'est une date valide
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  // Vérifier que la date correspond (évite 2025-13-45)
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
};

/**
 * Parse une string YYYY-MM-DD en objet Date
 * 
 * ⚠️ IMPORTANT : Utilise la date locale (pas UTC).
 * 
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {Date|null} Objet Date ou null si invalide
 * 
 * @example
 * const date = getDateFromStr('2025-01-15'); // Date object
 * const invalid = getDateFromStr('invalid'); // null
 */
export const getDateFromStr = (dateStr) => {
  if (!isDateValid(dateStr)) {
    log.warn(`[getDateFromStr] Invalid date string: ${dateStr}`);
    return null;
  }
  
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Ajoute des jours à une date et retourne le résultat en YYYY-MM-DD
 * 
 * Wrapper autour de `addDays` de `dateUtils.js` qui retourne directement YYYY-MM-DD.
 * 
 * @param {Date|string} date - Date de départ
 * @param {number} days - Nombre de jours à ajouter (peut être négatif)
 * @returns {string} Date résultante au format YYYY-MM-DD
 * 
 * @example
 * addDaysToDateStr('2025-01-15', 7); // "2025-01-22"
 * addDaysToDateStr('2025-01-15', -7); // "2025-01-08"
 */
export const addDaysToDateStr = (date, days) => {
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    const parsed = getDateFromStr(date);
    if (!parsed) {
      log.warn(`[addDaysToDateStr] Invalid date string: ${date}`);
      return date; // Retourner original si invalide
    }
    dateObj = parsed;
  } else {
    log.warn('[addDaysToDateStr] Invalid date parameter');
    return getTodayDateStr(); // Fallback sur aujourd'hui
  }
  
  const result = addDays(dateObj, days);
  return getDateStr(result);
};

/**
 * Soustrait des jours à une date et retourne le résultat en YYYY-MM-DD
 * 
 * Wrapper autour de `subtractDays` de `dateUtils.js` qui retourne directement YYYY-MM-DD.
 * 
 * @param {Date|string} date - Date de départ
 * @param {number} days - Nombre de jours à soustraire (peut être négatif)
 * @returns {string} Date résultante au format YYYY-MM-DD
 * 
 * @example
 * subtractDaysFromDateStr('2025-01-15', 7); // "2025-01-08"
 * subtractDaysFromDateStr('2025-01-15', -7); // "2025-01-22"
 */
export const subtractDaysFromDateStr = (date, days) => {
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    const parsed = getDateFromStr(date);
    if (!parsed) {
      log.warn(`[subtractDaysFromDateStr] Invalid date string: ${date}`);
      return date; // Retourner original si invalide
    }
    dateObj = parsed;
  } else {
    log.warn('[subtractDaysFromDateStr] Invalid date parameter');
    return getTodayDateStr(); // Fallback sur aujourd'hui
  }
  
  const result = subtractDays(dateObj, days);
  return getDateStr(result);
};

// ✅ PHASE 1.3 : Réexport utilitaires nécessaires aux modules consumers
export { getDateStr } from '../../../../utils/dateUtils';

/**
 * Calcule le nombre de minutes depuis minuit pour une date donnée
 * 
 * Utile pour la Phase 5.1 (retry automatique après 00:15).
 * 
 * @param {Date} date - Date à analyser
 * @returns {number} Nombre de minutes depuis minuit (0-1439)
 * 
 * @example
 * const now = new Date();
 * const minutes = getMinutesSinceMidnight(now); // 120 si 02:00
 */
export const getMinutesSinceMidnight = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    log.warn('[getMinutesSinceMidnight] Invalid date parameter');
    return 0;
  }
  
  const midnight = getMidnight(date);
  const diffMs = date - midnight;
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Vérifie si une date est aujourd'hui
 * 
 * Wrapper autour de `isToday` de `dateUtils.js` mais accepte aussi string YYYY-MM-DD.
 * 
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} True si c'est aujourd'hui
 * 
 * @example
 * isTodayDate(new Date()); // true
 * isTodayDate(getTodayDateStr()); // true
 * isTodayDate('2025-01-14'); // false (si pas aujourd'hui)
 */
export const isTodayDate = (date) => {
  if (typeof date === 'string') {
    return date === getTodayDateStr();
  }
  
  if (date instanceof Date) {
    return getDateStr(date) === getTodayDateStr();
  }
  
  return false;
};

