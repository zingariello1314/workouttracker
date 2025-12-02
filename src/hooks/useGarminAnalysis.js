/**
 * useGarminAnalysis.js
 * 
 * Hook React pour l'analyse complète des données Garmin.
 * 
 * Ce hook fournit une analyse approfondie des métriques Garmin :
 * - Tendances Body Battery (niveaux, récupération, patterns)
 * - Analyse du Stress (moyennes, pics, corrélations)
 * - Qualité du Sommeil (durée, phases, régularité)
 * - Fréquence Cardiaque (repos, variabilité, tendances)
 * - Activité physique (pas, calories, distance)
 * - Détection de patterns et anomalies
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Support de différentes périodes d'analyse
 * - Gestion gracieuse des données manquantes
 * 
 * @module hooks/useGarminAnalysis
 */

import { useMemo } from 'react';
import { getDateStr } from '../utils/dateUtils';

/**
 * Extrait une valeur numérique d'un objet Garmin (gère différents formats)
 * @param {any} value - Valeur à extraire
 * @param {string} key - Clé à chercher (ex: 'current', 'average', 'avg')
 * @param {number} defaultValue - Valeur par défaut
 * @returns {number} Valeur numérique
 */
function extractNumericValue(value, key = null, defaultValue = null) {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? defaultValue : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  if (typeof value === 'object') {
    if (key && key in value) {
      return extractNumericValue(value[key], null, defaultValue);
    }
    // Essayer les clés communes
    for (const k of ['current', 'average', 'avg', 'value', 'total', 'max', 'min']) {
      if (k in value) {
        return extractNumericValue(value[k], null, defaultValue);
      }
    }
  }
  
  return defaultValue;
}

/**
 * Calcule les statistiques d'une série de valeurs numériques
 * @param {Array<number>} values - Valeurs à analyser
 * @returns {Object} Statistiques (min, max, avg, median, trend)
 */
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
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
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      percentChange: Math.round(percentChange * 10) / 10,
      value: diff
    };
  }
  
  return { min, max, avg: Math.round(avg * 10) / 10, median, trend, count: validValues.length };
}

/**
 * Hook pour analyser les données Garmin
 * 
 * @param {Object} garminData - Données Garmin { dailyMetrics: {}, activities: {} }
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Analyse complète des données Garmin ou null si aucune donnée
 * @returns {Object} returns.bodyBattery - Analyse Body Battery (stats, trends, recovery)
 * @returns {Object} returns.stress - Analyse Stress (stats, peaks, patterns)
 * @returns {Object} returns.sleep - Analyse Sommeil (duration, quality, phases, regularity)
 * @returns {Object} returns.heartRate - Analyse FC (resting, variability, trends)
 * @returns {Object} returns.activity - Analyse Activité (steps, calories, distance)
 * @returns {Array} returns.anomalies - Anomalies détectées
 * @returns {Object} returns.period - Période analysée
 * 
 * @example
 * const analysis = useGarminAnalysis(garminData, { period: '30days' });
 * 
 * if (analysis) {
 *   console.log(`Body Battery moyen: ${analysis.bodyBattery.stats.avg}`);
 *   console.log(`Tendance: ${analysis.bodyBattery.trend.direction}`);
 * }
 */
export function useGarminAnalysis(garminData, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!garminData || !garminData.dailyMetrics || typeof garminData.dailyMetrics !== 'object') {
      return null;
    }
    
    const dailyMetrics = garminData.dailyMetrics;
    const dateKeys = Object.keys(dailyMetrics).sort();
    
    if (dateKeys.length === 0) {
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
          startDate = dateKeys[0];
          endDate = todayStr;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = getDateStr(start);
      }
    }
    
    // Filtrer les métriques dans la période
    const filteredMetrics = {};
    dateKeys.forEach(date => {
      try {
        const dateObj = new Date(date + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        
        if (!isNaN(dateObj.getTime()) && dateObj >= start && dateObj <= end) {
          filteredMetrics[date] = dailyMetrics[date];
        }
      } catch {
        // Ignorer les dates invalides
      }
    });
    
    const filteredDates = Object.keys(filteredMetrics).sort();
    if (filteredDates.length === 0) {
      return null;
    }
    
    // ==================== ANALYSE BODY BATTERY ====================
    const bodyBatteryValues = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.bodyBattery, 'current', null);
    }).filter(v => v !== null);
    
    const bodyBatteryStats = calculateStats(bodyBatteryValues);
    const bodyBatteryTrend = bodyBatteryStats.trend;
    
    // Détection de récupération insuffisante (Body Battery < 50 plusieurs jours)
    const lowBodyBatteryDays = filteredDates.filter(date => {
      const bb = extractNumericValue(filteredMetrics[date]?.bodyBattery, 'current', null);
      return bb !== null && bb < 50;
    }).length;
    
    // ==================== ANALYSE STRESS ====================
    const stressValues = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.stress, 'average', null);
    }).filter(v => v !== null);
    
    const stressStats = calculateStats(stressValues);
    const stressTrend = stressStats.trend;
    
    // Détection de pics de stress (stress > 50)
    const highStressDays = filteredDates.filter(date => {
      const stress = extractNumericValue(filteredMetrics[date]?.stress, 'average', null);
      return stress !== null && stress > 50;
    }).length;
    
    // ==================== ANALYSE SOMMEIL ====================
    const sleepDurations = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.sleep, 'duration', null);
    }).filter(v => v !== null && v > 0);
    
    const sleepStats = calculateStats(sleepDurations);
    
    // Qualité du sommeil (basée sur duration et deepSleep)
    const sleepQualityScores = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      const duration = extractNumericValue(metrics?.sleep, 'duration', null);
      const deepSleep = extractNumericValue(metrics?.sleep, 'deepSleep', null);
      const quality = extractNumericValue(metrics?.sleep, 'quality', null);
      
      if (duration === null || duration === 0) return null;
      
      // Score composite (0-100)
      let score = 0;
      if (duration >= 7 && duration <= 9) score += 40; // Durée optimale
      else if (duration >= 6 && duration <= 10) score += 30;
      else if (duration >= 5 && duration <= 11) score += 20;
      else score += 10;
      
      if (deepSleep !== null) {
        const deepSleepPercent = (deepSleep / duration) * 100;
        if (deepSleepPercent >= 15 && deepSleepPercent <= 25) score += 40; // Deep sleep optimal
        else if (deepSleepPercent >= 10 && deepSleepPercent <= 30) score += 30;
        else score += 20;
      }
      
      if (quality !== null) {
        score += quality * 0.2; // Qualité Garmin (0-100)
      }
      
      return Math.min(100, score);
    }).filter(v => v !== null);
    
    const sleepQualityStats = calculateStats(sleepQualityScores);
    
    // Régularité (écart-type de la durée)
    const sleepRegularity = sleepDurations.length > 1
      ? (() => {
          const avg = sleepStats.avg;
          const variance = sleepDurations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / sleepDurations.length;
          const stdDev = Math.sqrt(variance);
          return {
            stdDev: Math.round(stdDev * 10) / 10,
            consistency: stdDev < 1 ? 'excellent' : stdDev < 1.5 ? 'good' : stdDev < 2 ? 'fair' : 'poor'
          };
        })()
      : null;
    
    // ==================== ANALYSE FRÉQUENCE CARDIAQUE ====================
    const restingHRValues = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.heartRate, 'resting', null);
    }).filter(v => v !== null);
    
    const restingHRStats = calculateStats(restingHRValues);
    const restingHRTrend = restingHRStats.trend;
    
    // ==================== ANALYSE ACTIVITÉ ====================
    const stepsValues = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.steps, null, null);
    }).filter(v => v !== null);
    
    const stepsStats = calculateStats(stepsValues);
    
    const caloriesValues = filteredDates.map(date => {
      const metrics = filteredMetrics[date];
      return extractNumericValue(metrics?.calories, 'total', null);
    }).filter(v => v !== null);
    
    const caloriesStats = calculateStats(caloriesValues);
    
    // ==================== DÉTECTION D'ANOMALIES ====================
    const anomalies = [];
    
    // Body Battery très bas plusieurs jours
    if (lowBodyBatteryDays > filteredDates.length * 0.3) {
      anomalies.push({
        type: 'low_body_battery',
        severity: 'medium',
        message: `${lowBodyBatteryDays} jours avec Body Battery < 50 sur ${filteredDates.length} jours`,
        recommendation: 'Considère plus de repos et une meilleure gestion du stress'
      });
    }
    
    // Stress élevé fréquent
    if (highStressDays > filteredDates.length * 0.3) {
      anomalies.push({
        type: 'high_stress',
        severity: 'high',
        message: `${highStressDays} jours avec stress > 50 sur ${filteredDates.length} jours`,
        recommendation: 'Techniques de relaxation, méditation, ou consultation médicale si persistant'
      });
    }
    
    // Sommeil insuffisant
    if (sleepStats.avg !== null && sleepStats.avg < 6) {
      anomalies.push({
        type: 'insufficient_sleep',
        severity: 'high',
        message: `Durée moyenne de sommeil: ${sleepStats.avg.toFixed(1)}h (recommandé: 7-9h)`,
        recommendation: 'Améliorer l\'hygiène du sommeil, horaires réguliers, environnement optimal'
      });
    }
    
    // FC repos élevée ou en hausse
    if (restingHRStats.avg !== null && restingHRStats.avg > 70) {
      anomalies.push({
        type: 'high_resting_hr',
        severity: 'medium',
        message: `FC repos moyenne: ${restingHRStats.avg} bpm (optimal: < 60 bpm)`,
        recommendation: 'Cardio régulier, gestion du stress, vérification médicale si persistant'
      });
    } else if (restingHRTrend && restingHRTrend.direction === 'up' && restingHRTrend.percentChange > 10) {
      anomalies.push({
        type: 'increasing_resting_hr',
        severity: 'medium',
        message: `FC repos en hausse de ${restingHRTrend.percentChange}%`,
        recommendation: 'Surveiller la récupération, réduire l\'intensité si nécessaire'
      });
    }
    
    return {
      bodyBattery: {
        stats: bodyBatteryStats,
        trend: bodyBatteryTrend,
        lowDays: lowBodyBatteryDays,
        lowDaysPercent: filteredDates.length > 0 ? Math.round((lowBodyBatteryDays / filteredDates.length) * 100) : 0
      },
      stress: {
        stats: stressStats,
        trend: stressTrend,
        highDays: highStressDays,
        highDaysPercent: filteredDates.length > 0 ? Math.round((highStressDays / filteredDates.length) * 100) : 0
      },
      sleep: {
        duration: sleepStats,
        quality: sleepQualityStats,
        regularity: sleepRegularity,
        avgDuration: sleepStats.avg,
        avgQuality: sleepQualityStats.avg
      },
      heartRate: {
        resting: restingHRStats,
        trend: restingHRTrend
      },
      activity: {
        steps: stepsStats,
        calories: caloriesStats
      },
      anomalies,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        daysCount: filteredDates.length
      }
    };
  }, [garminData, period, customStartDate, customEndDate]);
}




