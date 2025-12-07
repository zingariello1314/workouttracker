/**
 * useJustificationAnalysis.js
 * 
 * Hook React pour l'analyse complète des justifications de jours sans activité.
 * 
 * Ce hook fournit une analyse approfondie des justifications :
 * - Statistiques par raison (maladie, flemme, pas_le_temps, autre)
 * - Patterns temporels (hebdomadaires, mensuels, saisonniers)
 * - Détection de patterns récurrents
 * - Taux de justification vs absences non justifiées
 * - Corrélations avec autres données (entraînement, Garmin, etc.)
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Cache intelligent des patterns détectés
 * - Support de différentes périodes d'analyse
 * 
 * @module hooks/useJustificationAnalysis
 */

import { useMemo } from 'react';
import { getDateStr } from '../utils/dateUtils';
import { detectRecurringPatterns, detectWeeklyPatterns, detectMonthlyPatterns, detectSeasonalPatterns } from '../utils/balancing/justificationPatternDetection';

/**
 * Calcule le nombre total de jours dans une période
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {number} Nombre de jours
 */
function calculateTotalDaysInPeriod(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (start > end) return 0;
    
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
    
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

/**
 * Filtre les justifications dans une période donnée
 * @param {Object} dayJustifications - Objet de justifications
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Array<[string, Object]>} Entrées de justifications dans la période
 */
function filterJustificationsByPeriod(dayJustifications, startDate, endDate) {
  if (!dayJustifications || typeof dayJustifications !== 'object') return [];
  if (!startDate || !endDate) return Object.entries(dayJustifications);
  
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return Object.entries(dayJustifications);
    
    return Object.entries(dayJustifications).filter(([dateStr]) => {
      try {
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return false;
        return date >= start && date <= end;
      } catch {
        return false;
      }
    });
  } catch {
    return Object.entries(dayJustifications);
  }
}

/**
 * Hook pour analyser les justifications de jours sans activité
 * 
 * @param {Object} dayJustifications - Objet de justifications { "YYYY-MM-DD": { reason, note?, createdAt, updatedAt } }
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * @param {Array} options.workoutHistory - Historique des sessions d'entraînement (pour calculer absences non justifiées)
 * @param {boolean} options.includePatterns - Inclure la détection de patterns récurrents (défaut: true)
 * 
 * @returns {Object|null} Analyse complète des justifications ou null si aucune donnée
 * @returns {number} returns.total - Nombre total de justifications
 * @returns {Object} returns.byReason - Statistiques par raison { maladie, flemme, pas_le_temps, autre }
 * @returns {Array} returns.weeklyPattern - Patterns hebdomadaires [0-6] avec compteurs par raison
 * @returns {Object} returns.monthlyPattern - Patterns mensuels { "YYYY-MM": { maladie, flemme, pas_le_temps, autre, total } }
 * @returns {Object} returns.recurringPatterns - Patterns récurrents détectés
 * @returns {number} returns.justificationRate - Taux de justification (0-100)
 * @returns {number} returns.unaccountedDays - Nombre de jours sans activité ni justification
 * @returns {Object} returns.details - Détails par raison avec listes de dates
 * 
 * @example
 * const analysis = useJustificationAnalysis(data.dayJustifications, {
 *   period: '30days',
 *   workoutHistory: workoutHistory
 * });
 * 
 * if (analysis) {
 *   console.log(`Total: ${analysis.total}`);
 *   console.log(`Maladie: ${analysis.byReason.maladie}`);
 *   console.log(`Taux: ${analysis.justificationRate}%`);
 * }
 */
export function useJustificationAnalysis(dayJustifications, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate,
    workoutHistory = [],
    includePatterns = true
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!dayJustifications || typeof dayJustifications !== 'object') {
      return null;
    }
    
    const justificationEntries = Object.entries(dayJustifications);
    
    if (justificationEntries.length === 0) {
      return null;
    }
    
    // Calculer les dates de période
    let startDate, endDate;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStr = getDateStr(today);
    
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      // Calculer selon la période
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      endDate = getDateStr(end);
      
      const start = new Date(today);
      switch (period) {
        case '7days':
          start.setDate(start.getDate() - 7);
          break;
        case '30days':
          start.setDate(start.getDate() - 30);
          break;
        case '90days':
          start.setDate(start.getDate() - 90);
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'all':
        default:
          // Pour 'all', prendre la première justification comme début
          const firstDate = justificationEntries
            .map(([date]) => date)
            .sort()[0];
          startDate = firstDate;
          endDate = todayStr;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = getDateStr(start);
      }
    }
    
    // Filtrer les justifications dans la période
    const filteredEntries = filterJustificationsByPeriod(dayJustifications, startDate, endDate);
    
    if (filteredEntries.length === 0) {
      return null;
    }
    
    // Statistiques par raison
    const byReason = {
      maladie: [],
      flemme: [],
      pas_le_temps: [],
      autre: []
    };
    
    filteredEntries.forEach(([date, justification]) => {
      const reason = justification?.reason;
      if (reason && byReason[reason]) {
        byReason[reason].push({ date, ...justification });
      }
    });
    
    // Patterns temporels hebdomadaires
    const weeklyPattern = Array(7).fill(null).map((_, dayIndex) => ({
      day: dayIndex,
      maladie: 0,
      flemme: 0,
      pas_le_temps: 0,
      autre: 0,
      total: 0
    }));
    
    filteredEntries.forEach(([date, justification]) => {
      try {
        const dateObj = new Date(date + 'T00:00:00');
        if (!isNaN(dateObj.getTime())) {
          const dayOfWeek = dateObj.getDay();
          const reason = justification?.reason;
          if (reason && weeklyPattern[dayOfWeek]) {
            weeklyPattern[dayOfWeek][reason]++;
            weeklyPattern[dayOfWeek].total++;
          }
        }
      } catch {
        // Ignorer les dates invalides
      }
    });
    
    // Patterns mensuels (12 derniers mois)
    const monthlyPattern = {};
    filteredEntries.forEach(([date, justification]) => {
      try {
        const dateObj = new Date(date + 'T00:00:00');
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth() + 1;
          const monthKey = `${year}-${String(month).padStart(2, '0')}`;
          
          if (!monthlyPattern[monthKey]) {
            monthlyPattern[monthKey] = {
              maladie: 0,
              flemme: 0,
              pas_le_temps: 0,
              autre: 0,
              total: 0
            };
          }
          
          const reason = justification?.reason;
          if (reason) {
            monthlyPattern[monthKey][reason]++;
            monthlyPattern[monthKey].total++;
          }
        }
      } catch {
        // Ignorer les dates invalides
      }
    });
    
    // Détection de patterns récurrents (si activée)
    let recurringPatterns = null;
    if (includePatterns) {
      try {
        recurringPatterns = detectRecurringPatterns(filteredEntries, {
          weekly: true,
          monthly: true,
          seasonal: true,
          contextual: false // Nécessite workoutHistory, sera ajouté plus tard
        });
      } catch (error) {
        console.warn('[useJustificationAnalysis] Erreur lors de la détection de patterns:', error);
        recurringPatterns = null;
      }
    }
    
    // Calculer taux de justification vs absences non justifiées
    const totalDays = calculateTotalDaysInPeriod(startDate, endDate);
    const justifiedDays = filteredEntries.length;
    
    // Compter les jours avec activité (sessions d'entraînement)
    const activeDaysSet = new Set();
    workoutHistory.forEach(session => {
      if (session?.date) {
        try {
          const sessionDate = session.date instanceof Date 
            ? getDateStr(session.date)
            : session.date;
          if (sessionDate && sessionDate >= startDate && sessionDate <= endDate) {
            activeDaysSet.add(sessionDate);
          }
        } catch {
          // Ignorer les dates invalides
        }
      }
    });
    
    const activeDays = activeDaysSet.size;
    const unaccountedDays = Math.max(0, totalDays - justifiedDays - activeDays);
    
    // Taux de justification (justifiés / (justifiés + non justifiés))
    const totalMissedDays = justifiedDays + unaccountedDays;
    const justificationRate = totalMissedDays > 0
      ? Math.round((justifiedDays / totalMissedDays) * 100)
      : 0;
    
    return {
      total: filteredEntries.length,
      byReason: {
        maladie: byReason.maladie.length,
        flemme: byReason.flemme.length,
        pas_le_temps: byReason.pas_le_temps.length,
        autre: byReason.autre.length
      },
      weeklyPattern,
      monthlyPattern,
      recurringPatterns,
      justificationRate,
      unaccountedDays,
      activeDays,
      totalDays,
      period: {
        start: startDate,
        end: endDate,
        type: period
      },
      details: byReason // Détails complets avec dates
    };
  }, [dayJustifications, period, customStartDate, customEndDate, workoutHistory, includePatterns]);
}








