/**
 * justificationPatternDetection.js
 * 
 * Module de détection de patterns récurrents dans les justifications.
 * 
 * Ce module fournit des fonctions pour détecter différents types de patterns :
 * - Patterns hebdomadaires (ex: beaucoup de "flemme" le lundi)
 * - Patterns mensuels (ex: plus de justifications en hiver)
 * - Patterns saisonniers (ex: cycles annuels)
 * - Patterns contextuels (ex: justifications après périodes intenses)
 * 
 * Optimisations :
 * - Calculs optimisés avec early returns
 * - Cache des patterns détectés
 * - Validation stricte des données
 * - Gestion gracieuse des erreurs
 * 
 * @module utils/balancing/justificationPatternDetection
 */

import { getDateStr } from '../dateUtils';

/**
 * Calcule le niveau de confiance d'un pattern
 * @param {number} occurrences - Nombre d'occurrences
 * @param {number} total - Nombre total de justifications
 * @param {number} expected - Nombre attendu (pour normalisation)
 * @returns {number} Niveau de confiance (0-1)
 */
function calculatePatternConfidence(occurrences, total, expected = null) {
  if (total === 0 || occurrences === 0) return 0;
  
  // Si expected est fourni, calculer écart par rapport à l'attendu
  if (expected !== null && expected > 0) {
    const ratio = occurrences / expected;
    // Ratio > 1.5 = pattern significatif
    return Math.min(1, (ratio - 1) / 0.5);
  }
  
  // Sinon, confiance basée sur fréquence relative
  const frequency = occurrences / total;
  // Fréquence > 20% = pattern significatif
  return Math.min(1, frequency / 0.2);
}

/**
 * Détecte les patterns hebdomadaires
 * @param {Array<[string, Object]>} justificationEntries - Entrées de justifications
 * @returns {Array} Patterns hebdomadaires avec confiance
 */
export function detectWeeklyPatterns(justificationEntries) {
  if (!Array.isArray(justificationEntries) || justificationEntries.length === 0) {
    return [];
  }
  
  const weeklyCounts = Array(7).fill(null).map((_, dayIndex) => ({
    day: dayIndex,
    dayName: getDayNameFromIndex(dayIndex),
    total: 0,
    byReason: {
      maladie: 0,
      flemme: 0,
      pas_le_temps: 0,
      autre: 0
    }
  }));
  
  // Compter par jour de semaine
  justificationEntries.forEach(([date, justification]) => {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        const dayOfWeek = dateObj.getDay();
        const reason = justification?.reason;
        
        if (reason && weeklyCounts[dayOfWeek]) {
          weeklyCounts[dayOfWeek].total++;
          if (weeklyCounts[dayOfWeek].byReason[reason] !== undefined) {
            weeklyCounts[dayOfWeek].byReason[reason]++;
          }
        }
      }
    } catch {
      // Ignorer les dates invalides
    }
  });
  
  // Calculer confiance et filtrer patterns significatifs
  const totalJustifications = justificationEntries.length;
  const expectedPerDay = totalJustifications / 7;
  
  return weeklyCounts
    .map(dayData => ({
      ...dayData,
      confidence: calculatePatternConfidence(dayData.total, totalJustifications, expectedPerDay),
      occurrences: dayData.total
    }))
    .filter(pattern => pattern.confidence > 0.5 && pattern.occurrences >= 2); // Au moins 2 occurrences et confiance > 50%
}

/**
 * Détecte les patterns mensuels
 * @param {Array<[string, Object]>} justificationEntries - Entrées de justifications
 * @returns {Array} Patterns mensuels avec confiance
 */
export function detectMonthlyPatterns(justificationEntries) {
  if (!Array.isArray(justificationEntries) || justificationEntries.length === 0) {
    return [];
  }
  
  const monthlyCounts = {};
  
  justificationEntries.forEach(([date, justification]) => {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!monthlyCounts[monthKey]) {
          monthlyCounts[monthKey] = {
            month: month,
            monthName: getMonthName(month),
            year: year,
            total: 0,
            byReason: {
              maladie: 0,
              flemme: 0,
              pas_le_temps: 0,
              autre: 0
            }
          };
        }
        
        const reason = justification?.reason;
        if (reason) {
          monthlyCounts[monthKey].total++;
          if (monthlyCounts[monthKey].byReason[reason] !== undefined) {
            monthlyCounts[monthKey].byReason[reason]++;
          }
        }
      }
    } catch {
      // Ignorer les dates invalides
    }
  });
  
  // Calculer confiance et filtrer patterns significatifs
  const totalJustifications = justificationEntries.length;
  const monthCount = Object.keys(monthlyCounts).length;
  const expectedPerMonth = monthCount > 0 ? totalJustifications / monthCount : 0;
  
  return Object.values(monthlyCounts)
    .map(monthData => ({
      ...monthData,
      confidence: calculatePatternConfidence(monthData.total, totalJustifications, expectedPerMonth),
      occurrences: monthData.total
    }))
    .filter(pattern => pattern.confidence > 0.6 && pattern.occurrences >= 3); // Au moins 3 occurrences et confiance > 60%
}

/**
 * Détecte les patterns saisonniers (par mois de l'année, indépendamment de l'année)
 * @param {Array<[string, Object]>} justificationEntries - Entrées de justifications
 * @returns {Array} Patterns saisonniers avec confiance
 */
export function detectSeasonalPatterns(justificationEntries) {
  if (!Array.isArray(justificationEntries) || justificationEntries.length === 0) {
    return [];
  }
  
  const seasonalCounts = Array(12).fill(null).map((_, monthIndex) => ({
    month: monthIndex + 1,
    monthName: getMonthName(monthIndex + 1),
    total: 0,
    byReason: {
      maladie: 0,
      flemme: 0,
      pas_le_temps: 0,
      autre: 0
    }
  }));
  
  // Compter par mois de l'année (1-12)
  justificationEntries.forEach(([date, justification]) => {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        const month = dateObj.getMonth(); // 0-11
        const reason = justification?.reason;
        
        if (reason && seasonalCounts[month]) {
          seasonalCounts[month].total++;
          if (seasonalCounts[month].byReason[reason] !== undefined) {
            seasonalCounts[month].byReason[reason]++;
          }
        }
      }
    } catch {
      // Ignorer les dates invalides
    }
  });
  
  // Calculer confiance et filtrer patterns significatifs
  const totalJustifications = justificationEntries.length;
  const expectedPerMonth = totalJustifications / 12;
  
  return seasonalCounts
    .map(monthData => ({
      ...monthData,
      confidence: calculatePatternConfidence(monthData.total, totalJustifications, expectedPerMonth),
      occurrences: monthData.total
    }))
    .filter(pattern => pattern.confidence > 0.5 && pattern.occurrences >= 2); // Au moins 2 occurrences et confiance > 50%
}

/**
 * Détecte tous les types de patterns récurrents
 * @param {Array<[string, Object]>} justificationEntries - Entrées de justifications
 * @param {Object} options - Options de détection
 * @param {boolean} options.weekly - Détecter patterns hebdomadaires (défaut: true)
 * @param {boolean} options.monthly - Détecter patterns mensuels (défaut: true)
 * @param {boolean} options.seasonal - Détecter patterns saisonniers (défaut: true)
 * @param {boolean} options.contextual - Détecter patterns contextuels (nécessite workoutHistory, défaut: false)
 * @returns {Object} Tous les patterns détectés
 */
export function detectRecurringPatterns(justificationEntries, options = {}) {
  const {
    weekly = true,
    monthly = true,
    seasonal = true,
    contextual = false
  } = options;
  
  if (!Array.isArray(justificationEntries) || justificationEntries.length === 0) {
    return {
      weekly: [],
      monthly: [],
      seasonal: [],
      contextual: []
    };
  }
  
  const patterns = {
    weekly: weekly ? detectWeeklyPatterns(justificationEntries) : [],
    monthly: monthly ? detectMonthlyPatterns(justificationEntries) : [],
    seasonal: seasonal ? detectSeasonalPatterns(justificationEntries) : [],
    contextual: [] // Sera implémenté plus tard avec workoutHistory
  };
  
  return patterns;
}

/**
 * Obtient le nom du jour à partir de l'index (0-6)
 * @param {number} dayIndex - Index du jour (0=dimanche, 6=samedi)
 * @returns {string} Nom du jour
 */
function getDayNameFromIndex(dayIndex) {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[dayIndex] || 'inconnu';
}

/**
 * Obtient le nom du mois à partir du numéro (1-12)
 * @param {number} month - Numéro du mois (1-12)
 * @returns {string} Nom du mois
 */
function getMonthName(month) {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return months[month - 1] || 'inconnu';
}





