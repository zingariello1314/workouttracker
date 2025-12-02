/**
 * useSessionFeedbackAnalysis.js
 * 
 * Hook React pour l'analyse complète des feedbacks de session.
 * 
 * Ce hook fournit une analyse approfondie des feedbacks :
 * - Analyse des évaluations (ressenti, difficulté, motivation, douleur)
 * - Analyse de l'énergie (début, fin, variation)
 * - Analyse des conditions (sommeil, hydratation, nutrition)
 * - Analyse de l'environnement (lieu, météo, équipement)
 * - Analyse des objectifs (atteints, non atteints)
 * - Analyse des tags et patterns
 * - Détection de patterns et anomalies
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Support de différentes périodes d'analyse
 * - Gestion gracieuse des données manquantes
 * 
 * @module hooks/useSessionFeedbackAnalysis
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

/**
 * Calcule les statistiques d'une série de valeurs numériques
 * @param {Array<number>} values - Valeurs à analyser
 * @returns {Object} Statistiques (min, max, avg, median, trend)
 */
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v >= 0);
  if (validValues.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calcul de la tendance (comparaison première moitié vs deuxième moitié)
  let trend = null;
  if (validValues.length >= 4) {
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    const percentChange = (diff / firstAvg) * 100;
    trend = {
      direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable',
      percentChange: Math.round(percentChange * 10) / 10,
      value: Math.round(diff * 10) / 10
    };
  }
  
  return { min, max, avg: Math.round(avg * 10) / 10, median, trend, count: validValues.length };
}

/**
 * Normalise une date depuis différents formats
 * @param {string|Date|number} dateInput - Date à normaliser
 * @returns {string|null} Date normalisée YYYY-MM-DD ou null
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    let date;
    if (typeof dateInput === 'string') {
      // Format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return null;
    }
    
    if (isNaN(date.getTime())) return null;
    
    return DateHelper.toYYYYMMDD(date);
  } catch {
    return null;
  }
}

/**
 * Hook pour analyser les feedbacks de session
 * 
 * @param {Object} sessionFeedbacks - Objet des feedbacks par date { "YYYY-MM-DD": feedback }
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Analyse complète des feedbacks ou null si aucune donnée
 * @returns {Object} returns.evaluations - Analyse évaluations (ressenti, difficulté, motivation, douleur)
 * @returns {Object} returns.energy - Analyse énergie (début, fin, variation)
 * @returns {Object} returns.conditions - Analyse conditions (sommeil, hydratation, nutrition)
 * @returns {Object} returns.environment - Analyse environnement (lieu, météo, équipement)
 * @returns {Object} returns.objectives - Analyse objectifs (atteints, non atteints)
 * @returns {Object} returns.tags - Analyse tags (fréquence, patterns)
 * @returns {Array} returns.anomalies - Anomalies détectées
 * @returns {Object} returns.period - Période analysée
 * 
 * @example
 * const analysis = useSessionFeedbackAnalysis(sessionFeedbacks, { period: '30days' });
 * 
 * if (analysis) {
 *   console.log(`Ressenti moyen: ${analysis.evaluations.ressenti.avg}`);
 *   console.log(`Tendance: ${analysis.evaluations.ressenti.trend.direction}`);
 * }
 */
export function useSessionFeedbackAnalysis(sessionFeedbacks, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!sessionFeedbacks || typeof sessionFeedbacks !== 'object') {
      return null;
    }
    
    const feedbackEntries = Object.entries(sessionFeedbacks);
    if (feedbackEntries.length === 0) {
      return null;
    }
    
    // Calculer les dates de période
    let startDate, endDate;
    const today = DateHelper.getTodayLocal();
    
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const end = new Date(today + 'T23:59:59');
      endDate = today;
      
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
          // Pour 'all', prendre la première date comme début
          const firstDate = feedbackEntries
            .map(([date]) => normalizeDate(date))
            .filter(Boolean)
            .sort()[0];
          startDate = firstDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les feedbacks dans la période
    const filteredFeedbacks = feedbackEntries
      .map(([date, feedback]) => {
        const normalizedDate = normalizeDate(date);
        if (!normalizedDate) return null;
        
        try {
          const dateObj = new Date(normalizedDate + 'T00:00:00');
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          if (!isNaN(dateObj.getTime()) && dateObj >= start && dateObj <= end) {
            return { date: normalizedDate, feedback };
          }
        } catch {
          return null;
        }
        return null;
      })
      .filter(Boolean);
    
    if (filteredFeedbacks.length === 0) {
      return null;
    }
    
    // ==================== ANALYSE ÉVALUATIONS ====================
    const ressentiValues = filteredFeedbacks
      .map(({ feedback }) => feedback.ressenti || null)
      .filter(v => v !== null && v > 0);
    
    const difficulteValues = filteredFeedbacks
      .map(({ feedback }) => feedback.difficulte || null)
      .filter(v => v !== null && v > 0);
    
    const motivationValues = filteredFeedbacks
      .map(({ feedback }) => feedback.motivation || null)
      .filter(v => v !== null && v > 0);
    
    const douleurValues = filteredFeedbacks
      .map(({ feedback }) => feedback.douleur || null)
      .filter(v => v !== null && v >= 0);
    
    const ressentiStats = calculateStats(ressentiValues);
    const difficulteStats = calculateStats(difficulteValues);
    const motivationStats = calculateStats(motivationValues);
    const douleurStats = calculateStats(douleurValues);
    
    // ==================== ANALYSE ÉNERGIE ====================
    const energieDebutValues = filteredFeedbacks
      .map(({ feedback }) => feedback.energieDebut || null)
      .filter(v => v !== null && v > 0);
    
    const energieFinValues = filteredFeedbacks
      .map(({ feedback }) => feedback.energieFin || null)
      .filter(v => v !== null && v > 0);
    
    const energieDebutStats = calculateStats(energieDebutValues);
    const energieFinStats = calculateStats(energieFinValues);
    
    // Variation d'énergie (fin - début)
    const energieVariations = filteredFeedbacks
      .map(({ feedback }) => {
        const debut = feedback.energieDebut;
        const fin = feedback.energieFin;
        if (debut !== null && fin !== null && debut > 0 && fin > 0) {
          return fin - debut;
        }
        return null;
      })
      .filter(v => v !== null);
    
    const energieVariationStats = calculateStats(energieVariations);
    
    // ==================== ANALYSE CONDITIONS ====================
    const sommeilValues = filteredFeedbacks
      .map(({ feedback }) => feedback.sommeil || null)
      .filter(v => v !== null && v > 0);
    
    const hydratationValues = filteredFeedbacks
      .map(({ feedback }) => feedback.hydratation || null)
      .filter(v => v !== null && v > 0);
    
    const nutritionValues = filteredFeedbacks
      .map(({ feedback }) => feedback.nutrition || null)
      .filter(v => v !== null && v > 0);
    
    const sommeilStats = calculateStats(sommeilValues);
    const hydratationStats = calculateStats(hydratationValues);
    const nutritionStats = calculateStats(nutritionValues);
    
    // ==================== ANALYSE ENVIRONNEMENT ====================
    const environmentCounts = {};
    const meteoCounts = {};
    const equipmentCounts = {};
    let withPartnerCount = 0;
    
    filteredFeedbacks.forEach(({ feedback }) => {
      if (feedback.environnement) {
        environmentCounts[feedback.environnement] = (environmentCounts[feedback.environnement] || 0) + 1;
      }
      
      if (feedback.meteo) {
        meteoCounts[feedback.meteo] = (meteoCounts[feedback.meteo] || 0) + 1;
      }
      
      if (feedback.partenaire) {
        withPartnerCount++;
      }
      
      if (Array.isArray(feedback.equipementUtilise)) {
        feedback.equipementUtilise.forEach(equipment => {
          equipmentCounts[equipment] = (equipmentCounts[equipment] || 0) + 1;
        });
      }
    });
    
    const mostCommonEnvironment = Object.entries(environmentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
    
    const mostCommonWeather = Object.entries(meteoCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
    
    const mostCommonEquipment = Object.entries(equipmentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([equipment]) => equipment);
    
    // ==================== ANALYSE OBJECTIFS ====================
    let objectivesReached = 0;
    let objectivesNotReached = 0;
    let objectivesNotSet = 0;
    
    filteredFeedbacks.forEach(({ feedback }) => {
      if (feedback.objectifAtteint === true) {
        objectivesReached++;
      } else if (feedback.objectifAtteint === false) {
        objectivesNotReached++;
      } else {
        objectivesNotSet++;
      }
    });
    
    const totalWithObjectives = objectivesReached + objectivesNotReached;
    const objectivesRate = totalWithObjectives > 0
      ? Math.round((objectivesReached / totalWithObjectives) * 100)
      : null;
    
    // ==================== ANALYSE TAGS ====================
    const tagCounts = {};
    filteredFeedbacks.forEach(({ feedback }) => {
      if (Array.isArray(feedback.tags)) {
        feedback.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const mostCommonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    // ==================== DÉTECTION D'ANOMALIES ====================
    const anomalies = [];
    
    // Ressenti faible
    if (ressentiStats.avg !== null && ressentiStats.avg < 5) {
      anomalies.push({
        type: 'low_feeling',
        severity: 'medium',
        message: `Ressenti moyen faible: ${ressentiStats.avg}/10`,
        recommendation: 'Analyser les raisons (fatigue, stress, environnement) et ajuster le planning'
      });
    }
    
    // Motivation faible
    if (motivationStats.avg !== null && motivationStats.avg < 5) {
      anomalies.push({
        type: 'low_motivation',
        severity: 'medium',
        message: `Motivation moyenne faible: ${motivationStats.avg}/10`,
        recommendation: 'Varier les entraînements, ajuster les objectifs, améliorer l\'environnement'
      });
    }
    
    // Douleur élevée
    if (douleurStats.avg !== null && douleurStats.avg > 5) {
      anomalies.push({
        type: 'high_pain',
        severity: 'high',
        message: `Douleur moyenne élevée: ${douleurStats.avg}/10`,
        recommendation: 'Consulter un professionnel de santé, réduire l\'intensité, augmenter le repos'
      });
    }
    
    // Sommeil faible
    if (sommeilStats.avg !== null && sommeilStats.avg < 5) {
      anomalies.push({
        type: 'poor_sleep',
        severity: 'medium',
        message: `Qualité de sommeil moyenne faible: ${sommeilStats.avg}/10`,
        recommendation: 'Améliorer l\'hygiène du sommeil, ajuster les horaires d\'entraînement'
      });
    }
    
    // Objectifs rarement atteints
    if (objectivesRate !== null && objectivesRate < 50) {
      anomalies.push({
        type: 'low_objectives_rate',
        severity: 'low',
        message: `Objectifs atteints seulement ${objectivesRate}% du temps`,
        recommendation: 'Ajuster les objectifs pour qu\'ils soient plus réalistes et atteignables'
      });
    }
    
    // Énergie en baisse constante
    if (energieVariationStats.trend && energieVariationStats.trend.direction === 'down' && energieVariationStats.trend.percentChange < -20) {
      anomalies.push({
        type: 'energy_declining',
        severity: 'medium',
        message: `Énergie en baisse constante (${energieVariationStats.trend.percentChange}%)`,
        recommendation: 'Augmenter le repos, améliorer la nutrition et l\'hydratation, réduire l\'intensité'
      });
    }
    
    return {
      evaluations: {
        ressenti: ressentiStats,
        difficulte: difficulteStats,
        motivation: motivationStats,
        douleur: douleurStats
      },
      energy: {
        debut: energieDebutStats,
        fin: energieFinStats,
        variation: energieVariationStats
      },
      conditions: {
        sommeil: sommeilStats,
        hydratation: hydratationStats,
        nutrition: nutritionStats
      },
      environment: {
        mostCommon: mostCommonEnvironment,
        distribution: environmentCounts,
        weather: {
          mostCommon: mostCommonWeather,
          distribution: meteoCounts
        },
        withPartner: {
          count: withPartnerCount,
          rate: filteredFeedbacks.length > 0
            ? Math.round((withPartnerCount / filteredFeedbacks.length) * 100)
            : 0
        },
        equipment: {
          mostCommon: mostCommonEquipment,
          distribution: equipmentCounts
        }
      },
      objectives: {
        reached: objectivesReached,
        notReached: objectivesNotReached,
        notSet: objectivesNotSet,
        rate: objectivesRate
      },
      tags: {
        mostCommon: mostCommonTags,
        distribution: tagCounts
      },
      anomalies,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        feedbacksCount: filteredFeedbacks.length
      }
    };
  }, [sessionFeedbacks, period, customStartDate, customEndDate]);
}




