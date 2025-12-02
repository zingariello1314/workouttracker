/**
 * Helpers pour manipulation de dates dans les statistiques QuietQuest
 */

import { getTodayDateStr, addDays, getDayOfWeekFromDateStr } from '../../../../hooks/useQuietQuestEngine';

/**
 * Formate une date pour l'affichage dans les graphiques
 * @param {string} dateStr - Date au format 'YYYY-MM-DD'
 * @param {string} format - Format souhaité ('short', 'long', 'day')
 * @returns {string} Date formatée
 */
export const formatDateForChart = (dateStr, format = 'short') => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    case 'long':
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    case 'day':
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    default:
      return dateStr;
  }
};

/**
 * Calcule la date de début d'une période
 * @param {string} period - '7d', '30d', '90d', '180d', '365d', 'all'
 * @returns {string} Date de début au format 'YYYY-MM-DD'
 */
export const getPeriodStartDate = (period) => {
  if (period === 'all') return '2000-01-01';
  const today = getTodayDateStr();
  const days = parseInt(period);
  return addDays(today, -days);
};

/**
 * Calcule la date de fin d'une période (généralement aujourd'hui)
 * @param {string} period - Période sélectionnée
 * @returns {string} Date de fin au format 'YYYY-MM-DD'
 */
export const getPeriodEndDate = (period) => {
  return getTodayDateStr();
};

/**
 * Vérifie si une date est dans une période
 * @param {string} date - Date à vérifier
 * @param {string} period - Période
 * @returns {boolean}
 */
export const isDateInPeriod = (date, period) => {
  const startDate = getPeriodStartDate(period);
  return date >= startDate;
};

/**
 * Obtient le nom du jour de la semaine en français
 * @param {number} dayOfWeek - 1 (Lundi) à 7 (Dimanche)
 * @returns {string} Nom du jour
 */
export const getDayName = (dayOfWeek) => {
  const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  return days[dayOfWeek] || '';
};

/**
 * Obtient le nom du jour depuis une date
 * @param {string} dateStr - Date au format 'YYYY-MM-DD'
 * @returns {string} Nom du jour
 */
export const getDayNameFromDate = (dateStr) => {
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  return getDayName(dayOfWeek);
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param {string} startDate - Date de début
 * @param {string} endDate - Date de fin
 * @returns {number} Nombre de jours
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Génère un tableau de dates pour une période
 * @param {string} startDate - Date de début
 * @param {string} endDate - Date de fin
 * @returns {string[]} Tableau de dates
 */
export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  
  return dates;
};

/**
 * Obtient le premier jour de la semaine (Lundi) pour une date
 * @param {string} dateStr - Date
 * @returns {string} Date du lundi au format 'YYYY-MM-DD'
 */
export const getWeekStart = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajuster pour lundi = 1
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
};

/**
 * Obtient le premier jour du mois pour une date
 * @param {string} dateStr - Date
 * @returns {string} Date du premier jour du mois
 */
export const getMonthStart = (dateStr) => {
  const date = new Date(dateStr);
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

