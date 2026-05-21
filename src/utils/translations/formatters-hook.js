/**
 * ✅ PHASE 2.2 : Hook React pour les formatters
 * 
 * Fichier séparé pour éviter dépendance circulaire avec LanguageContext
 */

import { useLanguage } from '../../context/LanguageContext';
import { 
  formatDate as formatDateUtil,
  formatDateShort as formatDateShortUtil,
  formatDateTime as formatDateTimeUtil,
  formatNumber as formatNumberUtil,
  formatInteger as formatIntegerUtil,
  formatCurrency as formatCurrencyUtil
} from './formatters';
import {
  formatEnduranceSessionDateLabel as formatEnduranceSessionDateLabelUtil,
  formatEnduranceSessionDateOnly as formatEnduranceSessionDateOnlyUtil,
  formatEnduranceTimeLabel as formatEnduranceTimeLabelUtil
} from '../enduranceSessionDateFormat.js';

/**
 * Hook React pour utiliser les formatters avec la langue actuelle
 * 
 * @returns {Object} Objet avec les fonctions de formatage
 * 
 * @example
 * const { formatDate, formatNumber, formatCurrency } = useFormatters();
 * const date = new Date();
 * formatDate(date) // → "15 janvier 2025" (selon langue actuelle)
 * formatNumber(1234.56) // → "1 234,56" ou "1,234.56" (selon langue)
 */
export const useFormatters = () => {
  const { language } = useLanguage();

  return {
    /**
     * Formate une date selon la langue actuelle
     * @param {Date|string|number} date - Date à formater
     * @param {Object} options - Options de formatage
     * @returns {string} Date formatée
     */
    formatDate: (date, options) => formatDateUtil(date, language, options),
    
    /**
     * Formate une date courte selon la langue actuelle
     * @param {Date|string|number} date - Date à formater
     * @returns {string} Date formatée en format court
     */
    formatDateShort: (date) => formatDateShortUtil(date, language),
    
    /**
     * Formate une date avec heure selon la langue actuelle
     * @param {Date|string|number} date - Date à formater
     * @param {Object} options - Options supplémentaires
     * @returns {string} Date et heure formatées
     */
    formatDateTime: (date, options) => formatDateTimeUtil(date, language, options),
    
    /**
     * Formate un nombre selon la langue actuelle
     * @param {number} number - Nombre à formater
     * @param {Object} options - Options de formatage
     * @returns {string} Nombre formaté
     */
    formatNumber: (number, options) => formatNumberUtil(number, language, options),
    
    /**
     * Formate un nombre entier selon la langue actuelle
     * @param {number} number - Nombre à formater
     * @returns {string} Nombre entier formaté
     */
    formatInteger: (number) => formatIntegerUtil(number, language),
    
    /**
     * Formate un montant en devise selon la langue actuelle
     * @param {number} amount - Montant à formater
     * @param {string} currency - Code de la devise (défaut: EUR)
     * @param {Object} options - Options supplémentaires
     * @returns {string} Montant formaté avec devise
     */
    formatCurrency: (amount, currency = 'EUR', options) => formatCurrencyUtil(amount, language, currency, options),

    /** Défis : « 20 mai 2026 · 07:05 » */
    formatEnduranceSessionDate: (dateStr, timeStr) =>
      formatEnduranceSessionDateLabelUtil(dateStr, timeStr, language),

    /** Défis : « 20 mai 2026 » (colonne date) */
    formatEnduranceSessionDateOnly: (dateStr) =>
      formatEnduranceSessionDateOnlyUtil(dateStr, language),

    formatEnduranceTime: (timeStr) => formatEnduranceTimeLabelUtil(timeStr)
  };
};









