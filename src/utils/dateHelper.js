/**
 * dateHelper.js
 * 
 * Utilitaires de gestion de dates pour le module Nutrition.
 * Garantit la cohérence timezone locale (évite bugs timezone).
 * 
 * ⚠️ IMPORTANT : Toutes les dates nutrition sont en timezone LOCALE (pas UTC)
 * - Format standard : "YYYY-MM-DD" (ex: "2025-01-15")
 * - Utiliser ces helpers partout pour éviter incohérences
 * 
 * Architecture :
 * - Méthodes statiques pour opérations courantes
 * - Validation stricte des formats
 * - Garantie timezone locale pour toutes les opérations
 * - Pas de dépendances externes (pur JavaScript)
 * 
 * @module utils/dateHelper
 * @see ../docs/nutrition/ANALYSE_OPTIMISATIONS_CODE_REEL.md Section 7
 */

import logger from './logger';

const log = logger.module('dateHelper');

// ==================== CONSTANTES ====================

/**
 * Regex pour validation format YYYY-MM-DD
 */
const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regex pour validation format ISO datetime
 */
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

// ==================== VALIDATION ====================

/**
 * Valide une string date au format YYYY-MM-DD
 * 
 * @param {string} dateStr - Date à valider
 * @returns {boolean} true si format valide
 */
const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  if (!DATE_STRING_REGEX.test(dateStr)) return false;
  
  // Vérifier que la date est valide (ex: 2025-13-45 invalide)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// ==================== CLASSE DATE HELPER ====================

/**
 * Classe helper pour gestion dates (timezone locale garantie)
 */
export class DateHelper {
  /**
   * Obtient la date du jour en format YYYY-MM-DD (timezone locale)
   * 
   * ✅ GARANTIE : Timezone locale (pas UTC)
   * Toujours utiliser pour obtenir "aujourd'hui" en nutrition
   * 
   * @returns {string} Date au format "YYYY-MM-DD"
   * 
   * @example
   * DateHelper.getTodayLocal() // → "2025-01-15" (timezone utilisateur)
   */
  static getTodayLocal() {
    const now = new Date();
    return this.toYYYYMMDD(now);
  }

  /**
   * Convertit une Date en format YYYY-MM-DD (timezone locale)
   * 
   * ✅ GARANTIE : Timezone locale (utilise getFullYear, getMonth, getDate)
   * Évite problèmes timezone avec toISOString()
   * 
   * @param {Date|string|number} date - Date à convertir (Date, ISO string, timestamp)
   * @returns {string} Date au format "YYYY-MM-DD" ou null si invalide
   * 
   * @example
   * DateHelper.toYYYYMMDD(new Date(2025, 0, 15)) // → "2025-01-15"
   * DateHelper.toYYYYMMDD("2025-01-15") // → "2025-01-15"
   * DateHelper.toYYYYMMDD("2025-01-15T12:30:00") // → "2025-01-15" (extrait date locale)
   */
  static toYYYYMMDD(date) {
    if (!date) {
      log.warn('[toYYYYMMDD] Date vide');
      return null;
    }

    // Si déjà string YYYY-MM-DD, retourner tel quel
    if (typeof date === 'string' && isValidDateString(date)) {
      return date;
    }

    // Convertir en Date object si nécessaire
    let dateObj;
    try {
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // Si ISO datetime, extraire partie date
        if (ISO_DATETIME_REGEX.test(date)) {
          const datePart = date.split('T')[0];
          if (isValidDateString(datePart)) {
            return datePart; // Retourner tel quel (déjà YYYY-MM-DD)
          }
        }
        // Parser comme date locale (minuit)
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match.map(Number);
          dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else {
          dateObj = new Date(date);
        }
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        log.warn('[toYYYYMMDD] Type date invalide:', typeof date);
        return null;
      }

      // Valider date
      if (isNaN(dateObj.getTime())) {
        log.warn('[toYYYYMMDD] Date invalide:', date);
        return null;
      }

      // ✅ Utiliser méthodes locales (pas UTC) pour garantir timezone locale
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      log.warn('[toYYYYMMDD] Erreur conversion:', error);
      return null;
    }
  }

  /**
   * Parse une string YYYY-MM-DD en Date object (minuit locale)
   * 
   * ✅ GARANTIE : Date créée en timezone locale (minuit)
   * Garantit comparaisons cohérentes
   * 
   * @param {string} dateStr - Date au format "YYYY-MM-DD"
   * @returns {Date} Date object (minuit locale) ou null si invalide
   * 
   * @example
   * DateHelper.fromYYYYMMDD("2025-01-15") // → Date(2025, 0, 15, 0, 0, 0, 0)
   */
  static fromYYYYMMDD(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      log.warn('[fromYYYYMMDD] Date string vide ou invalide:', dateStr);
      return null;
    }

    if (!isValidDateString(dateStr)) {
      log.warn('[fromYYYYMMDD] Format date invalide:', dateStr);
      return null;
    }

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      // ✅ Créer date en timezone locale (minuit) pour éviter problèmes timezone
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    } catch (error) {
      log.warn('[fromYYYYMMDD] Erreur parsing:', error);
      return null;
    }
  }

  /**
   * Obtient timestamp minuit locale pour une date (pour comparaisons)
   * 
   * @param {string} dateStr - Date au format "YYYY-MM-DD"
   * @returns {number} Timestamp (ms) ou null si invalide
   * 
   * @example
   * DateHelper.getMidnightTimestamp("2025-01-15") // → 1736899200000 (minuit locale)
   */
  static getMidnightTimestamp(dateStr) {
    const date = this.fromYYYYMMDD(dateStr);
    return date ? date.getTime() : null;
  }

  /**
   * Vérifie si date1 < date2 (ignore heure, timezone locale)
   * 
   * @param {string} date1Str - Date 1 au format "YYYY-MM-DD"
   * @param {string} date2Str - Date 2 au format "YYYY-MM-DD"
   * @returns {boolean} true si date1 < date2, ou null si invalide
   */
  static isBefore(date1Str, date2Str) {
    const ts1 = this.getMidnightTimestamp(date1Str);
    const ts2 = this.getMidnightTimestamp(date2Str);
    
    if (ts1 === null || ts2 === null) {
      return null;
    }
    
    return ts1 < ts2;
  }

  /**
   * Vérifie si date1 <= date2 (ignore heure, timezone locale)
   * 
   * @param {string} date1Str - Date 1 au format "YYYY-MM-DD"
   * @param {string} date2Str - Date 2 au format "YYYY-MM-DD"
   * @returns {boolean} true si date1 <= date2, ou null si invalide
   */
  static isBeforeOrEqual(date1Str, date2Str) {
    const ts1 = this.getMidnightTimestamp(date1Str);
    const ts2 = this.getMidnightTimestamp(date2Str);
    
    if (ts1 === null || ts2 === null) {
      return null;
    }
    
    return ts1 <= ts2;
  }

  /**
   * Vérifie si date1 > date2 (ignore heure, timezone locale)
   * 
   * @param {string} date1Str - Date 1 au format "YYYY-MM-DD"
   * @param {string} date2Str - Date 2 au format "YYYY-MM-DD"
   * @returns {boolean} true si date1 > date2, ou null si invalide
   */
  static isAfter(date1Str, date2Str) {
    return this.isBefore(date2Str, date1Str);
  }

  /**
   * Vérifie si date1 >= date2 (ignore heure, timezone locale)
   * 
   * @param {string} date1Str - Date 1 au format "YYYY-MM-DD"
   * @param {string} date2Str - Date 2 au format "YYYY-MM-DD"
   * @returns {boolean} true si date1 >= date2, ou null si invalide
   */
  static isAfterOrEqual(date1Str, date2Str) {
    return this.isBeforeOrEqual(date2Str, date1Str);
  }

  /**
   * Vérifie si deux dates sont égales (ignore heure, timezone locale)
   * 
   * @param {string} date1Str - Date 1 au format "YYYY-MM-DD"
   * @param {string} date2Str - Date 2 au format "YYYY-MM-DD"
   * @returns {boolean} true si dates égales, ou null si invalide
   */
  static isEqual(date1Str, date2Str) {
    return date1Str === date2Str && isValidDateString(date1Str);
  }

  /**
   * Obtient la date N jours avant aujourd'hui (timezone locale)
   * 
   * @param {number} daysAgo - Nombre de jours (défaut: 0)
   * @returns {string} Date au format "YYYY-MM-DD"
   * 
   * @example
   * DateHelper.getDaysAgoLocal(7) // → "2025-01-08" (si aujourd'hui = 2025-01-15)
   */
  static getDaysAgoLocal(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return this.toYYYYMMDD(date);
  }

  /**
   * Obtient la date N jours après une date donnée (timezone locale)
   * 
   * @param {string} dateStr - Date de base au format "YYYY-MM-DD"
   * @param {number} days - Nombre de jours à ajouter (peut être négatif)
   * @returns {string} Date au format "YYYY-MM-DD" ou null si invalide
   * 
   * @example
   * DateHelper.addDays("2025-01-15", 7) // → "2025-01-22"
   * DateHelper.addDays("2025-01-15", -7) // → "2025-01-08"
   */
  static addDays(dateStr, days) {
    const date = this.fromYYYYMMDD(dateStr);
    if (!date) return null;

    date.setDate(date.getDate() + days);
    return this.toYYYYMMDD(date);
  }

  /**
   * Calcule le nombre de jours entre deux dates
   * 
   * @param {string} startDateStr - Date début au format "YYYY-MM-DD"
   * @param {string} endDateStr - Date fin au format "YYYY-MM-DD"
   * @returns {number} Nombre de jours (peut être négatif) ou null si invalide
   * 
   * @example
   * DateHelper.daysBetween("2025-01-08", "2025-01-15") // → 7
   */
  static daysBetween(startDateStr, endDateStr) {
    const ts1 = this.getMidnightTimestamp(startDateStr);
    const ts2 = this.getMidnightTimestamp(endDateStr);
    
    if (ts1 === null || ts2 === null) {
      return null;
    }
    
    return Math.floor((ts2 - ts1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Génère un range de dates (inclusif) entre startDate et endDate
   * 
   * @param {string} startDateStr - Date début au format "YYYY-MM-DD"
   * @param {string} endDateStr - Date fin au format "YYYY-MM-DD"
   * @returns {Array<string>} Tableau de dates au format "YYYY-MM-DD"
   * 
   * @example
   * DateHelper.getDateRange("2025-01-15", "2025-01-17")
   * // → ["2025-01-15", "2025-01-16", "2025-01-17"]
   */
  static getDateRange(startDateStr, endDateStr) {
    if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
      log.warn('[getDateRange] Dates invalides:', { startDateStr, endDateStr });
      return [];
    }

    const dates = [];
    let current = this.fromYYYYMMDD(startDateStr);
    const end = this.fromYYYYMMDD(endDateStr);

    if (!current || !end) {
      return [];
    }

    while (current <= end) {
      dates.push(this.toYYYYMMDD(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Valide une string date au format YYYY-MM-DD
   * 
   * @param {string} dateStr - Date à valider
   * @returns {boolean} true si format valide
   */
  static isValid(dateStr) {
    return isValidDateString(dateStr);
  }

  /**
   * Formate une date pour affichage (locale française)
   * 
   * @param {string} dateStr - Date au format "YYYY-MM-DD"
   * @param {Object} options - Options de formatage
   * @param {boolean} options.short - Format court (défaut: false)
   * @returns {string} Date formatée ou null si invalide
   * 
   * @example
   * DateHelper.formatForDisplay("2025-01-15") // → "15 janvier 2025"
   * DateHelper.formatForDisplay("2025-01-15", { short: true }) // → "15 jan."
   */
  static formatForDisplay(dateStr, options = {}) {
    const { short = false } = options;
    const date = this.fromYYYYMMDD(dateStr);
    
    if (!date) return null;

    try {
      if (short) {
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        });
      }
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      log.warn('[formatForDisplay] Erreur formatage:', error);
      return dateStr;
    }
  }
}

// ==================== EXPORTS ====================

export default DateHelper;

