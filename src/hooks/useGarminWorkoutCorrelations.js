/**
 * useGarminWorkoutCorrelations.js
 * 
 * Hook React pour analyser les corrélations entre données Garmin et entraînements.
 * 
 * Ce hook identifie les relations entre :
 * - Body Battery et performance d'entraînement
 * - Stress et capacité d'entraînement
 * - Qualité du sommeil et récupération
 * - Fréquence cardiaque et intensité d'entraînement
 * - Activité Garmin et sessions d'entraînement
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs de corrélation optimisés
 * - Gestion gracieuse des données manquantes
 * - Support de différentes périodes d'analyse
 * 
 * @module hooks/useGarminWorkoutCorrelations
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
 * Calcule le coefficient de corrélation de Pearson entre deux séries
 * @param {Array<number>} x - Première série
 * @param {Array<number>} y - Deuxième série
 * @returns {number|null} Coefficient de corrélation (-1 à 1) ou null si impossible
 */
function calculateCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    return null;
  }
  
  const validPairs = x.map((xi, i) => ({ x: xi, y: y[i] }))
    .filter(pair => pair.x !== null && pair.y !== null && !isNaN(pair.x) && !isNaN(pair.y));
  
  if (validPairs.length < 2) {
    return null;
  }
  
  const n = validPairs.length;
  const sumX = validPairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = validPairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = validPairs.reduce((sum, p) => sum + p.y * p.y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) {
    return null;
  }
  
  return numerator / denominator;
}

/**
 * Calcule l'intensité d'une session d'entraînement
 * @param {Object} session - Session d'entraînement
 * @returns {number} Intensité (0-100)
 */
function calculateWorkoutIntensity(session) {
  if (!session) return 0;
  
  // Calculer l'intensité basée sur les répétitions totales
  let totalReps = 0;
  
  if (session.exercises && Array.isArray(session.exercises)) {
    totalReps = session.exercises.reduce((sum, ex) => {
      const reps = ex.reps || 0;
      return sum + (typeof reps === 'number' ? reps : 0);
    }, 0);
  }
  
  // Normaliser (0-100) basé sur une estimation
  // 100 reps = intensité modérée, 200+ = haute intensité
  const intensity = Math.min(100, (totalReps / 200) * 100);
  
  return Math.round(intensity);
}

/**
 * Hook pour analyser les corrélations entre Garmin et entraînements
 * 
 * @param {Object} garminData - Données Garmin { dailyMetrics: {}, activities: {} }
 * @param {Array} workoutHistory - Historique des sessions d'entraînement
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Corrélations analysées ou null si données insuffisantes
 * @returns {Object} returns.bodyBatteryWorkout - Corrélation Body Battery ↔ Performance
 * @returns {Object} returns.stressWorkout - Corrélation Stress ↔ Performance
 * @returns {Object} returns.sleepWorkout - Corrélation Sommeil ↔ Performance
 * @returns {Object} returns.heartRateWorkout - Corrélation FC ↔ Performance
 * @returns {Object} returns.recoveryWorkout - Analyse Récupération ↔ Performance
 * @returns {Array} returns.insights - Insights et recommandations
 * 
 * @example
 * const correlations = useGarminWorkoutCorrelations(garminData, workoutHistory, { period: '30days' });
 * 
 * if (correlations) {
 *   console.log(`Corrélation Body Battery: ${correlations.bodyBatteryWorkout.correlation}`);
 *   console.log(`Insights: ${correlations.insights.length}`);
 * }
 */
export function useGarminWorkoutCorrelations(garminData, workoutHistory, options = {}) {
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
    
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
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
    
    // Filtrer les métriques et sessions dans la période
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
    
    const filteredSessions = workoutHistory.filter(session => {
      if (!session?.date) return false;
      try {
        const sessionDate = session.date instanceof Date 
          ? getDateStr(session.date)
          : session.date;
        const dateObj = new Date(sessionDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(dateObj.getTime()) && dateObj >= start && dateObj <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredSessions.length === 0) {
      return null;
    }
    
    // Créer un mapping date → session pour faciliter les corrélations
    const sessionsByDate = {};
    filteredSessions.forEach(session => {
      const sessionDate = session.date instanceof Date 
        ? getDateStr(session.date)
        : session.date;
      if (sessionDate) {
        if (!sessionsByDate[sessionDate]) {
          sessionsByDate[sessionDate] = [];
        }
        sessionsByDate[sessionDate].push(session);
      }
    });
    
    // ==================== CORRÉLATION BODY BATTERY ↔ PERFORMANCE ====================
    const bodyBatteryWorkoutPairs = [];
    Object.keys(filteredMetrics).forEach(date => {
      const metrics = filteredMetrics[date];
      const sessions = sessionsByDate[date] || [];
      
      if (sessions.length > 0) {
        const bodyBattery = extractNumericValue(metrics?.bodyBattery, 'current', null);
        if (bodyBattery !== null) {
          // Calculer l'intensité moyenne des sessions du jour
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          bodyBatteryWorkoutPairs.push({ bodyBattery, intensity: avgIntensity });
        }
      }
    });
    
    const bodyBatteryCorrelation = bodyBatteryWorkoutPairs.length >= 3
      ? calculateCorrelation(
          bodyBatteryWorkoutPairs.map(p => p.bodyBattery),
          bodyBatteryWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION STRESS ↔ PERFORMANCE ====================
    const stressWorkoutPairs = [];
    Object.keys(filteredMetrics).forEach(date => {
      const metrics = filteredMetrics[date];
      const sessions = sessionsByDate[date] || [];
      
      if (sessions.length > 0) {
        const stress = extractNumericValue(metrics?.stress, 'average', null);
        if (stress !== null) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          stressWorkoutPairs.push({ stress, intensity: avgIntensity });
        }
      }
    });
    
    const stressCorrelation = stressWorkoutPairs.length >= 3
      ? calculateCorrelation(
          stressWorkoutPairs.map(p => p.stress),
          stressWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION SOMMEIL ↔ PERFORMANCE ====================
    const sleepWorkoutPairs = [];
    Object.keys(filteredMetrics).forEach(date => {
      const metrics = filteredMetrics[date];
      const sessions = sessionsByDate[date] || [];
      
      if (sessions.length > 0) {
        const sleepDuration = extractNumericValue(metrics?.sleep, 'duration', null);
        if (sleepDuration !== null && sleepDuration > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          sleepWorkoutPairs.push({ sleepDuration, intensity: avgIntensity });
        }
      }
    });
    
    const sleepCorrelation = sleepWorkoutPairs.length >= 3
      ? calculateCorrelation(
          sleepWorkoutPairs.map(p => p.sleepDuration),
          sleepWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION FC REPOS ↔ PERFORMANCE ====================
    const heartRateWorkoutPairs = [];
    Object.keys(filteredMetrics).forEach(date => {
      const metrics = filteredMetrics[date];
      const sessions = sessionsByDate[date] || [];
      
      if (sessions.length > 0) {
        const restingHR = extractNumericValue(metrics?.heartRate, 'resting', null);
        if (restingHR !== null) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          heartRateWorkoutPairs.push({ restingHR, intensity: avgIntensity });
        }
      }
    });
    
    const heartRateCorrelation = heartRateWorkoutPairs.length >= 3
      ? calculateCorrelation(
          heartRateWorkoutPairs.map(p => p.restingHR),
          heartRateWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== ANALYSE RÉCUPÉRATION ↔ PERFORMANCE ====================
    // Analyser les jours avec Body Battery bas (< 50) et leur impact sur la performance
    const lowRecoveryDays = [];
    const normalRecoveryDays = [];
    
    Object.keys(filteredMetrics).forEach(date => {
      const metrics = filteredMetrics[date];
      const sessions = sessionsByDate[date] || [];
      
      if (sessions.length > 0) {
        const bodyBattery = extractNumericValue(metrics?.bodyBattery, 'current', null);
        const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
        
        if (bodyBattery !== null) {
          if (bodyBattery < 50) {
            lowRecoveryDays.push({ date, bodyBattery, intensity: avgIntensity });
          } else {
            normalRecoveryDays.push({ date, bodyBattery, intensity: avgIntensity });
          }
        }
      }
    });
    
    const avgIntensityLowRecovery = lowRecoveryDays.length > 0
      ? lowRecoveryDays.reduce((sum, d) => sum + d.intensity, 0) / lowRecoveryDays.length
      : null;
    
    const avgIntensityNormalRecovery = normalRecoveryDays.length > 0
      ? normalRecoveryDays.reduce((sum, d) => sum + d.intensity, 0) / normalRecoveryDays.length
      : null;
    
    // ==================== GÉNÉRATION D'INSIGHTS ====================
    const insights = [];
    
    // Insight Body Battery
    if (bodyBatteryCorrelation !== null) {
      if (bodyBatteryCorrelation > 0.3) {
        insights.push({
          type: 'positive_body_battery',
          message: 'Corrélation positive entre Body Battery et performance d\'entraînement',
          strength: Math.abs(bodyBatteryCorrelation),
          recommendation: 'Planifier les séances intenses quand Body Battery est élevé (> 70)'
        });
      } else if (bodyBatteryCorrelation < -0.3) {
        insights.push({
          type: 'negative_body_battery',
          message: 'Corrélation négative détectée (entraînement intense même avec Body Battery bas)',
          strength: Math.abs(bodyBatteryCorrelation),
          recommendation: 'Réduire l\'intensité quand Body Battery < 50 pour éviter le surentraînement'
        });
      }
    }
    
    // Insight Stress
    if (stressCorrelation !== null && stressCorrelation < -0.3) {
      insights.push({
        type: 'stress_impact',
        message: 'Stress élevé associé à performance réduite',
        strength: Math.abs(stressCorrelation),
        recommendation: 'Gérer le stress avant les séances importantes (méditation, respiration)'
      });
    }
    
    // Insight Sommeil
    if (sleepCorrelation !== null && sleepCorrelation > 0.3) {
      insights.push({
        type: 'sleep_benefit',
        message: 'Sommeil de qualité associé à meilleure performance',
        strength: sleepCorrelation,
        recommendation: 'Prioriser 7-9h de sommeil pour optimiser les performances'
      });
    }
    
    // Insight Récupération
    if (avgIntensityLowRecovery !== null && avgIntensityNormalRecovery !== null) {
      const intensityDiff = avgIntensityNormalRecovery - avgIntensityLowRecovery;
      if (intensityDiff > 10) {
        insights.push({
          type: 'recovery_impact',
          message: `Performance ${Math.round(intensityDiff)}% supérieure avec récupération normale`,
          strength: intensityDiff / 100,
          recommendation: 'Respecter les jours de récupération quand Body Battery < 50'
        });
      }
    }
    
    return {
      bodyBatteryWorkout: {
        correlation: bodyBatteryCorrelation,
        pairsCount: bodyBatteryWorkoutPairs.length,
        interpretation: bodyBatteryCorrelation !== null
          ? (bodyBatteryCorrelation > 0.3 ? 'positive' : bodyBatteryCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      stressWorkout: {
        correlation: stressCorrelation,
        pairsCount: stressWorkoutPairs.length,
        interpretation: stressCorrelation !== null
          ? (stressCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      sleepWorkout: {
        correlation: sleepCorrelation,
        pairsCount: sleepWorkoutPairs.length,
        interpretation: sleepCorrelation !== null
          ? (sleepCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      heartRateWorkout: {
        correlation: heartRateCorrelation,
        pairsCount: heartRateWorkoutPairs.length,
        interpretation: heartRateCorrelation !== null
          ? (heartRateCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      recoveryWorkout: {
        lowRecoveryDays: lowRecoveryDays.length,
        normalRecoveryDays: normalRecoveryDays.length,
        avgIntensityLowRecovery,
        avgIntensityNormalRecovery,
        intensityDifference: avgIntensityLowRecovery !== null && avgIntensityNormalRecovery !== null
          ? avgIntensityNormalRecovery - avgIntensityLowRecovery
          : null
      },
      insights,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        daysCount: Object.keys(filteredMetrics).length,
        sessionsCount: filteredSessions.length
      }
    };
  }, [garminData, workoutHistory, period, customStartDate, customEndDate]);
}

