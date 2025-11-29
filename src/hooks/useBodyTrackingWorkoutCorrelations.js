/**
 * useBodyTrackingWorkoutCorrelations.js
 * 
 * Hook React pour analyser les corrélations entre données Body Tracking et entraînements.
 * 
 * Ce hook identifie les relations entre :
 * - Variations de poids et performance d'entraînement
 * - Masse musculaire et intensité d'entraînement
 * - Masse grasse et régularité d'entraînement
 * - IMC et capacité d'entraînement
 * - Mesures corporelles et progression
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs de corrélation optimisés
 * - Gestion gracieuse des données manquantes
 * - Support de différentes périodes d'analyse
 * 
 * @module hooks/useBodyTrackingWorkoutCorrelations
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

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
 * Normalise une date depuis différents formats
 * @param {string|Date|number} dateInput - Date à normaliser
 * @returns {string|null} Date normalisée YYYY-MM-DD ou null
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    let date;
    if (typeof dateInput === 'string') {
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
 * Hook pour analyser les corrélations entre Body Tracking et entraînements
 * 
 * @param {Array} progressEntries - Liste des progressEntries
 * @param {Array} workoutHistory - Historique des sessions d'entraînement
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Corrélations analysées ou null si données insuffisantes
 * @returns {Object} returns.weightWorkout - Corrélation Poids ↔ Performance
 * @returns {Object} returns.muscleMassWorkout - Corrélation Masse Musculaire ↔ Performance
 * @returns {Object} returns.bodyFatWorkout - Corrélation Masse Grasse ↔ Performance
 * @returns {Object} returns.bmiWorkout - Corrélation IMC ↔ Performance
 * @returns {Object} returns.progressionAnalysis - Analyse Progression ↔ Entraînement
 * @returns {Array} returns.insights - Insights et recommandations
 * 
 * @example
 * const correlations = useBodyTrackingWorkoutCorrelations(progressEntries, workoutHistory, { period: '30days' });
 * 
 * if (correlations) {
 *   console.log(`Corrélation Poids: ${correlations.weightWorkout.correlation}`);
 *   console.log(`Insights: ${correlations.insights.length}`);
 * }
 */
export function useBodyTrackingWorkoutCorrelations(progressEntries, workoutHistory, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!Array.isArray(progressEntries) || progressEntries.length === 0) {
      return null;
    }
    
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
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
          const firstEntryDate = progressEntries
            .map(entry => {
              const date = entry.date || (entry.timestamp ? new Date(entry.timestamp) : null);
              return date ? normalizeDate(date) : null;
            })
            .filter(Boolean)
            .sort()[0];
          startDate = firstEntryDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les entrées et sessions dans la période
    const filteredEntries = progressEntries.filter(entry => {
      const entryDate = entry.date || (entry.timestamp ? new Date(entry.timestamp) : null);
      if (!entryDate) return false;
      
      try {
        const normalizedDate = normalizeDate(entryDate);
        if (!normalizedDate) return false;
        
        const date = new Date(normalizedDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    const filteredSessions = workoutHistory.filter(session => {
      if (!session?.date) return false;
      try {
        const sessionDate = session.date instanceof Date 
          ? DateHelper.toYYYYMMDD(session.date)
          : session.date;
        const date = new Date(sessionDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredSessions.length === 0) {
      return null;
    }
    
    // Créer un mapping date → entry et date → sessions
    const entriesByDate = {};
    filteredEntries.forEach(entry => {
      const entryDate = entry.date || (entry.timestamp ? new Date(entry.timestamp) : null);
      if (entryDate) {
        const normalizedDate = normalizeDate(entryDate);
        if (normalizedDate) {
          if (!entriesByDate[normalizedDate]) {
            entriesByDate[normalizedDate] = [];
          }
          entriesByDate[normalizedDate].push(entry);
        }
      }
    });
    
    const sessionsByDate = {};
    filteredSessions.forEach(session => {
      const sessionDate = session.date instanceof Date 
        ? DateHelper.toYYYYMMDD(session.date)
        : session.date;
      if (sessionDate) {
        if (!sessionsByDate[sessionDate]) {
          sessionsByDate[sessionDate] = [];
        }
        sessionsByDate[sessionDate].push(session);
      }
    });
    
    // ==================== CORRÉLATION POIDS ↔ PERFORMANCE ====================
    // Analyser les variations de poids et leur impact sur la performance
    const weightWorkoutPairs = [];
    const sortedDates = Object.keys(entriesByDate).sort();
    
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const date1 = sortedDates[i];
      const date2 = sortedDates[i + 1];
      
      const entry1 = entriesByDate[date1].find(e => e.weight) || entriesByDate[date1][0];
      const entry2 = entriesByDate[date2].find(e => e.weight) || entriesByDate[date2][0];
      
      if (entry1?.weight && entry2?.weight) {
        const weightChange = entry2.weight - entry1.weight;
        
        // Trouver sessions entre les deux dates
        const sessionsBetween = Object.keys(sessionsByDate)
          .filter(d => d > date1 && d <= date2)
          .flatMap(d => sessionsByDate[d]);
        
        if (sessionsBetween.length > 0) {
          const avgIntensity = sessionsBetween.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessionsBetween.length;
          weightWorkoutPairs.push({ weightChange, intensity: avgIntensity, weight: entry2.weight });
        }
      }
    }
    
    const weightCorrelation = weightWorkoutPairs.length >= 3
      ? calculateCorrelation(
          weightWorkoutPairs.map(p => p.weightChange),
          weightWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION MASSE MUSCULAIRE ↔ PERFORMANCE ====================
    const muscleMassWorkoutPairs = [];
    Object.keys(entriesByDate).forEach(date => {
      const impedanceEntry = entriesByDate[date].find(e => e.type === 'impedance');
      const sessions = sessionsByDate[date] || [];
      
      if (impedanceEntry && sessions.length > 0) {
        const muscleMass = impedanceEntry.muscleMass || impedanceEntry.skeletalMuscle || null;
        if (muscleMass !== null && muscleMass > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          muscleMassWorkoutPairs.push({ muscleMass, intensity: avgIntensity });
        }
      }
    });
    
    const muscleMassCorrelation = muscleMassWorkoutPairs.length >= 3
      ? calculateCorrelation(
          muscleMassWorkoutPairs.map(p => p.muscleMass),
          muscleMassWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION MASSE GRASSE ↔ PERFORMANCE ====================
    const bodyFatWorkoutPairs = [];
    Object.keys(entriesByDate).forEach(date => {
      const impedanceEntry = entriesByDate[date].find(e => e.type === 'impedance');
      const sessions = sessionsByDate[date] || [];
      
      if (impedanceEntry && sessions.length > 0) {
        const bodyFat = impedanceEntry.bodyFatPercentage || null;
        if (bodyFat !== null && bodyFat > 0) {
          const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
          bodyFatWorkoutPairs.push({ bodyFat, intensity: avgIntensity });
        }
      }
    });
    
    const bodyFatCorrelation = bodyFatWorkoutPairs.length >= 3
      ? calculateCorrelation(
          bodyFatWorkoutPairs.map(p => p.bodyFat),
          bodyFatWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== ANALYSE PROGRESSION ↔ ENTRAÎNEMENT ====================
    // Analyser si les gains de masse musculaire / perte de masse grasse sont associés à plus d'entraînement
    let progressionAnalysis = null;
    
    if (sortedDates.length >= 2) {
      const firstEntry = entriesByDate[sortedDates[0]].find(e => e.type === 'impedance') || entriesByDate[sortedDates[0]][0];
      const lastEntry = entriesByDate[sortedDates[sortedDates.length - 1]].find(e => e.type === 'impedance') || entriesByDate[sortedDates[sortedDates.length - 1]][0];
      
      if (firstEntry && lastEntry) {
        const firstMuscleMass = firstEntry.muscleMass || firstEntry.skeletalMuscle || null;
        const lastMuscleMass = lastEntry.muscleMass || lastEntry.skeletalMuscle || null;
        const firstBodyFat = firstEntry.bodyFatPercentage || null;
        const lastBodyFat = lastEntry.bodyFatPercentage || null;
        
        const muscleMassChange = firstMuscleMass && lastMuscleMass ? lastMuscleMass - firstMuscleMass : null;
        const bodyFatChange = firstBodyFat && lastBodyFat ? lastBodyFat - firstBodyFat : null;
        
        // Compter sessions totales dans la période
        const totalSessions = filteredSessions.length;
        const totalIntensity = filteredSessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0);
        const avgIntensity = totalSessions > 0 ? totalIntensity / totalSessions : null;
        
        progressionAnalysis = {
          muscleMassChange,
          bodyFatChange,
          totalSessions,
          avgIntensity,
          sessionsPerWeek: totalSessions / ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7))
        };
      }
    }
    
    // ==================== GÉNÉRATION D'INSIGHTS ====================
    const insights = [];
    
    // Insight Masse Musculaire
    if (muscleMassCorrelation !== null && muscleMassCorrelation > 0.3) {
      insights.push({
        type: 'positive_muscle_mass',
        message: 'Corrélation positive entre masse musculaire et performance d\'entraînement',
        strength: muscleMassCorrelation,
        recommendation: 'Maintenir ou augmenter masse musculaire pour optimiser performance via entraînement résistance et apport protéique'
      });
    }
    
    // Insight Masse Grasse
    if (bodyFatCorrelation !== null && bodyFatCorrelation < -0.3) {
      insights.push({
        type: 'negative_body_fat',
        message: 'Masse grasse élevée associée à performance réduite',
        strength: Math.abs(bodyFatCorrelation),
        recommendation: 'Réduire masse grasse pour améliorer performance via déficit calorique modéré et cardio'
      });
    }
    
    // Insight Progression
    if (progressionAnalysis) {
      if (progressionAnalysis.muscleMassChange !== null && progressionAnalysis.muscleMassChange > 0) {
        insights.push({
          type: 'muscle_gain',
          message: `Gain de masse musculaire: +${Math.round(progressionAnalysis.muscleMassChange * 10) / 10} kg`,
          strength: progressionAnalysis.muscleMassChange / 5, // Normaliser
          recommendation: `Continuer avec ${Math.round(progressionAnalysis.sessionsPerWeek * 10) / 10} séances/semaine pour maintenir progression`
        });
      }
      
      if (progressionAnalysis.bodyFatChange !== null && progressionAnalysis.bodyFatChange < 0) {
        insights.push({
          type: 'fat_loss',
          message: `Perte de masse grasse: ${Math.round(progressionAnalysis.bodyFatChange * 10) / 10}%`,
          strength: Math.abs(progressionAnalysis.bodyFatChange) / 5,
          recommendation: 'Maintenir déficit calorique modéré et activité physique pour continuer perte de graisse'
        });
      }
    }
    
    return {
      weightWorkout: {
        correlation: weightCorrelation,
        pairsCount: weightWorkoutPairs.length,
        interpretation: weightCorrelation !== null
          ? (weightCorrelation > 0.3 ? 'positive' : weightCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      muscleMassWorkout: {
        correlation: muscleMassCorrelation,
        pairsCount: muscleMassWorkoutPairs.length,
        interpretation: muscleMassCorrelation !== null
          ? (muscleMassCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      bodyFatWorkout: {
        correlation: bodyFatCorrelation,
        pairsCount: bodyFatWorkoutPairs.length,
        interpretation: bodyFatCorrelation !== null
          ? (bodyFatCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      progressionWorkout: progressionAnalysis,
      insights,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        entriesCount: filteredEntries.length,
        sessionsCount: filteredSessions.length
      }
    };
  }, [progressEntries, workoutHistory, period, customStartDate, customEndDate]);
}

