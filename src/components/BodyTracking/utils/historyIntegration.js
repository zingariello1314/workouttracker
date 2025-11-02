/**
 * 📊 INTÉGRATION HISTORY TAB - BODY TRACKING
 * 
 * Module pour intégrer les données d'historique d'entraînement dans les analyses Body Tracking :
 * - Volume hebdomadaire/mensuel d'entraînement
 * - Corrélation volume vs changements corporels (poids, masse musculaire)
 * - Identification fréquence optimale
 * - Analyse régularité et progression
 */

import logger from '../../../utils/logger';

const log = logger.module('HistoryIntegration');

/**
 * Normalise une date pour correspondance (YYYY-MM-DD)
 * @param {Date|string|number} date - Date à normaliser
 * @returns {string|null} - Date normalisée ou null
 */
const normalizeDate = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    log.error('Erreur lors de la normalisation de date', error);
    return null;
  }
};

/**
 * Calcule le volume hebdomadaire d'entraînement
 * @param {Array} workoutHistory - Historique des séances d'entraînement
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object} - Statistiques hebdomadaires
 */
export const calculateWeeklyVolume = (workoutHistory = [], startDate, endDate) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return {
      weeks: [],
      averageWeeklyVolume: 0,
      averageWeeklySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return {
      weeks: [],
      averageWeeklyVolume: 0,
      averageWeeklySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  // Filtrer sessions dans la période
  const filteredSessions = workoutHistory.filter(session => {
    const sessionDate = normalizeDate(session.date);
    return sessionDate && sessionDate >= normalizedStart && sessionDate <= normalizedEnd;
  });
  
  if (filteredSessions.length === 0) {
    return {
      weeks: [],
      averageWeeklyVolume: 0,
      averageWeeklySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  // Grouper par semaine (ISO week)
  const weeksMap = new Map();
  
  filteredSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (isNaN(sessionDate.getTime())) return;
    
    // Calculer année et semaine ISO
    const year = sessionDate.getFullYear();
    const weekNumber = getISOWeek(sessionDate);
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    
    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, {
        weekKey,
        year,
        weekNumber,
        startDate: getStartOfWeek(sessionDate),
        endDate: getEndOfWeek(sessionDate),
        sessions: [],
        totalReps: 0,
        totalExercises: 0,
        totalStretches: 0
      });
    }
    
    const weekData = weeksMap.get(weekKey);
    weekData.sessions.push(session);
    weekData.totalReps += session.totalReps || 0;
    weekData.totalExercises += session.totalExercises || 0;
    weekData.totalStretches += session.totalStretches || 0;
  });
  
  const weeks = Array.from(weeksMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  
  const totalVolume = weeks.reduce((sum, week) => sum + week.totalReps, 0);
  const totalSessions = filteredSessions.length;
  const numberOfWeeks = weeks.length;
  
  return {
    weeks,
    averageWeeklyVolume: numberOfWeeks > 0 ? totalVolume / numberOfWeeks : 0,
    averageWeeklySessions: numberOfWeeks > 0 ? totalSessions / numberOfWeeks : 0,
    totalVolume,
    totalSessions,
    numberOfWeeks
  };
};

/**
 * Calcule le numéro de semaine ISO
 * @param {Date} date - Date
 * @returns {number} - Numéro de semaine ISO (1-53)
 */
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Obtient le début de la semaine (lundi) pour une date
 * @param {Date} date - Date
 * @returns {Date} - Début de semaine (lundi)
 */
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi = 1
  return new Date(d.setDate(diff));
};

/**
 * Obtient la fin de la semaine (dimanche) pour une date
 * @param {Date} date - Date
 * @returns {Date} - Fin de semaine (dimanche)
 */
const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
};

/**
 * Calcule le volume mensuel d'entraînement
 * @param {Array} workoutHistory - Historique des séances
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object} - Statistiques mensuelles
 */
export const calculateMonthlyVolume = (workoutHistory = [], startDate, endDate) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return {
      months: [],
      averageMonthlyVolume: 0,
      averageMonthlySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return {
      months: [],
      averageMonthlyVolume: 0,
      averageMonthlySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  // Filtrer sessions dans la période
  const filteredSessions = workoutHistory.filter(session => {
    const sessionDate = normalizeDate(session.date);
    return sessionDate && sessionDate >= normalizedStart && sessionDate <= normalizedEnd;
  });
  
  if (filteredSessions.length === 0) {
    return {
      months: [],
      averageMonthlyVolume: 0,
      averageMonthlySessions: 0,
      totalVolume: 0,
      totalSessions: 0
    };
  }
  
  // Grouper par mois
  const monthsMap = new Map();
  
  filteredSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (isNaN(sessionDate.getTime())) return;
    
    const year = sessionDate.getFullYear();
    const month = sessionDate.getMonth() + 1; // 1-12
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        monthKey,
        year,
        month,
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0),
        sessions: [],
        totalReps: 0,
        totalExercises: 0,
        totalStretches: 0
      });
    }
    
    const monthData = monthsMap.get(monthKey);
    monthData.sessions.push(session);
    monthData.totalReps += session.totalReps || 0;
    monthData.totalExercises += session.totalExercises || 0;
    monthData.totalStretches += session.totalStretches || 0;
  });
  
  const months = Array.from(monthsMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  
  const totalVolume = months.reduce((sum, month) => sum + month.totalReps, 0);
  const totalSessions = filteredSessions.length;
  const numberOfMonths = months.length;
  
  return {
    months,
    averageMonthlyVolume: numberOfMonths > 0 ? totalVolume / numberOfMonths : 0,
    averageMonthlySessions: numberOfMonths > 0 ? totalSessions / numberOfMonths : 0,
    totalVolume,
    totalSessions,
    numberOfMonths
  };
};

/**
 * Analyse la corrélation entre volume d'entraînement et changement de poids
 * @param {Array} workoutHistory - Historique des séances
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object|null} - Analyse de corrélation
 */
export const analyzeVolumeWeightCorrelation = (workoutHistory = [], progressEntries = [], startDate, endDate) => {
  if (!workoutHistory || workoutHistory.length === 0 || !progressEntries || progressEntries.length < 2) {
    return null;
  }
  
  // Obtenir volume hebdomadaire
  const weeklyVolume = calculateWeeklyVolume(workoutHistory, startDate, endDate);
  
  if (weeklyVolume.weeks.length < 2) {
    return null;
  }
  
  // Filtrer entrées de poids dans la période
  const weightEntries = progressEntries
    .filter(entry => entry.type === 'metrics' && entry.weight != null)
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      weight: entry.weight
    }))
    .filter(entry => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  if (weightEntries.length < 2) {
    return null;
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  // Calculer variations de poids et volumes correspondants
  const correlations = [];
  
  for (let i = 1; i < weightEntries.length; i++) {
    const current = weightEntries[i];
    const previous = weightEntries[i - 1];
    
    // Vérifier si dans la période
    if (normalizedStart && current.date < normalizedStart) continue;
    if (normalizedEnd && current.date > normalizedEnd) continue;
    
    const weightChange = current.weight - previous.weight; // Positif = gain, négatif = perte
    
    // Trouver volume d'entraînement entre les deux dates
    const sessions = workoutHistory.filter(session => {
      const sessionDate = normalizeDate(session.date);
      return sessionDate && sessionDate >= previous.date && sessionDate < current.date;
    });
    
    const volume = sessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
    const daysBetween = (new Date(current.date) - new Date(previous.date)) / (1000 * 60 * 60 * 24);
    const weeklyVolumeAverage = daysBetween > 0 ? (volume / daysBetween) * 7 : 0; // Volume hebdomadaire équivalent
    
    if (daysBetween > 0 && daysBetween <= 60) { // Limiter à 2 mois max entre mesures
      correlations.push({
        date: current.date,
        weightChange,
        volume,
        weeklyVolumeAverage,
        sessionsCount: sessions.length,
        daysBetween
      });
    }
  }
  
  if (correlations.length < 2) {
    return null;
  }
  
  // Calculer corrélation de Pearson
  const weightChanges = correlations.map(c => c.weightChange);
  const volumes = correlations.map(c => c.weeklyVolumeAverage);
  
  const correlation = calculatePearsonCorrelation(weightChanges, volumes);
  
  return {
    correlation,
    strength: Math.abs(correlation) > 0.7 ? 'forte' : Math.abs(correlation) > 0.4 ? 'modérée' : 'faible',
    sampleSize: correlations.length,
    dataPoints: correlations,
    interpretation: correlation < -0.4
      ? 'Corrélation négative: plus de volume = perte de poids'
      : correlation > 0.4
      ? 'Corrélation positive: plus de volume = gain de poids (possible gain muscle)'
      : 'Peu de corrélation détectée entre volume et poids'
  };
};

/**
 * Analyse la corrélation entre volume d'entraînement et gain de masse musculaire
 * @param {Array} workoutHistory - Historique des séances
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object|null} - Analyse de corrélation
 */
export const analyzeVolumeMuscleCorrelation = (workoutHistory = [], progressEntries = [], startDate, endDate) => {
  if (!workoutHistory || workoutHistory.length === 0 || !progressEntries || progressEntries.length < 2) {
    return null;
  }
  
  // Filtrer entrées d'impédance avec masse musculaire
  const muscleEntries = progressEntries
    .filter(entry => entry.type === 'impedance' && entry.skeletalMuscle != null)
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      muscleMass: entry.skeletalMuscle
    }))
    .filter(entry => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  if (muscleEntries.length < 2) {
    return null;
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  // Calculer variations de masse musculaire et volumes correspondants
  const correlations = [];
  
  for (let i = 1; i < muscleEntries.length; i++) {
    const current = muscleEntries[i];
    const previous = muscleEntries[i - 1];
    
    // Vérifier si dans la période
    if (normalizedStart && current.date < normalizedStart) continue;
    if (normalizedEnd && current.date > normalizedEnd) continue;
    
    const muscleChange = current.muscleMass - previous.muscleMass; // Positif = gain
    
    // Trouver volume d'entraînement entre les deux dates
    const sessions = workoutHistory.filter(session => {
      const sessionDate = normalizeDate(session.date);
      return sessionDate && sessionDate >= previous.date && sessionDate < current.date;
    });
    
    const volume = sessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
    const daysBetween = (new Date(current.date) - new Date(previous.date)) / (1000 * 60 * 60 * 24);
    const weeklyVolumeAverage = daysBetween > 0 ? (volume / daysBetween) * 7 : 0;
    
    if (daysBetween > 0 && daysBetween <= 90) { // Limiter à 3 mois max entre mesures
      correlations.push({
        date: current.date,
        muscleChange,
        volume,
        weeklyVolumeAverage,
        sessionsCount: sessions.length,
        daysBetween
      });
    }
  }
  
  if (correlations.length < 2) {
    return null;
  }
  
  // Calculer corrélation de Pearson
  const muscleChanges = correlations.map(c => c.muscleChange);
  const volumes = correlations.map(c => c.weeklyVolumeAverage);
  
  const correlation = calculatePearsonCorrelation(muscleChanges, volumes);
  
  return {
    correlation,
    strength: Math.abs(correlation) > 0.7 ? 'forte' : Math.abs(correlation) > 0.4 ? 'modérée' : 'faible',
    sampleSize: correlations.length,
    dataPoints: correlations,
    interpretation: correlation > 0.4
      ? 'Corrélation positive: plus de volume = gain de masse musculaire'
      : correlation < -0.4
      ? 'Corrélation négative: volume excessif peut limiter croissance musculaire'
      : 'Peu de corrélation détectée entre volume et masse musculaire'
  };
};

/**
 * Identifie la fréquence optimale d'entraînement basée sur les résultats
 * @param {Array} workoutHistory - Historique des séances
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object|null} - Analyse de fréquence optimale
 */
export const identifyOptimalFrequency = (workoutHistory = [], progressEntries = [], startDate, endDate) => {
  if (!workoutHistory || workoutHistory.length === 0 || !progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const weeklyVolume = calculateWeeklyVolume(workoutHistory, startDate, endDate);
  
  if (weeklyVolume.weeks.length < 3) {
    return null;
  }
  
  // Filtrer entrées de progression dans la période
  const filteredEntries = progressEntries.filter(entry => {
    const entryDate = normalizeDate(entry.date || entry.timestamp);
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    return entryDate && 
           (!normalizedStart || entryDate >= normalizedStart) && 
           (!normalizedEnd || entryDate <= normalizedEnd);
  });
  
  // Analyser résultats par semaine
  const weeklyResults = [];
  
  weeklyVolume.weeks.forEach(week => {
    // Trouver mesures de progression dans cette semaine
    const weekEntries = filteredEntries.filter(entry => {
      const entryDate = normalizeDate(entry.date || entry.timestamp);
      if (!entryDate) return false;
      const entryDateObj = new Date(entryDate);
      return entryDateObj >= week.startDate && entryDateObj <= week.endDate;
    });
    
    if (weekEntries.length > 0) {
      // Calculer changements (si plusieurs entrées dans la semaine)
      const metricsEntries = weekEntries.filter(e => e.type === 'metrics');
      const impedanceEntries = weekEntries.filter(e => e.type === 'impedance');
      
      let weightChange = 0;
      let muscleChange = 0;
      
      if (metricsEntries.length >= 2) {
        const sorted = metricsEntries.sort((a, b) => 
          new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp)
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        if (first.weight && last.weight) {
          weightChange = last.weight - first.weight; // Négatif = perte (bien pour perte de poids)
        }
      }
      
      if (impedanceEntries.length >= 2) {
        const sorted = impedanceEntries.sort((a, b) => 
          new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp)
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        if (first.skeletalMuscle && last.skeletalMuscle) {
          muscleChange = last.skeletalMuscle - first.skeletalMuscle; // Positif = gain
        }
      }
      
      weeklyResults.push({
        weekKey: week.weekKey,
        sessionsCount: week.sessions.length,
        weeklyVolume: week.totalReps,
        weightChange,
        muscleChange,
        score: calculateWeekScore(week.sessions.length, week.totalReps, weightChange, muscleChange)
      });
    }
  });
  
  if (weeklyResults.length < 3) {
    return null;
  }
  
  // Identifier meilleures semaines (top 30%)
  const sortedByScore = [...weeklyResults].sort((a, b) => b.score - a.score);
  const topCount = Math.max(1, Math.floor(weeklyResults.length * 0.3));
  const topWeeks = sortedByScore.slice(0, topCount);
  
  const optimalSessions = topWeeks.reduce((sum, w) => sum + w.sessionsCount, 0) / topWeeks.length;
  const optimalVolume = topWeeks.reduce((sum, w) => sum + w.weeklyVolume, 0) / topWeeks.length;
  
  return {
    optimalSessionsPerWeek: Math.round(optimalSessions * 10) / 10,
    optimalWeeklyVolume: Math.round(optimalVolume),
    topWeeks,
    allWeeks: weeklyResults,
    recommendation: generateFrequencyRecommendation(optimalSessions, optimalVolume, weeklyResults)
  };
};

/**
 * Calcule un score pour une semaine basé sur volume et résultats
 * @param {number} sessionsCount - Nombre de séances
 * @param {number} volume - Volume total (répétitions)
 * @param {number} weightChange - Changement de poids (négatif = perte = bien si objectif)
 * @param {number} muscleChange - Changement de masse musculaire (positif = gain = bien)
 * @returns {number} - Score (0-100)
 */
const calculateWeekScore = (sessionsCount, volume, weightChange, muscleChange) => {
  let score = 0;
  
  // Score basé sur régularité (30%)
  if (sessionsCount >= 3) {
    score += 30;
  } else if (sessionsCount === 2) {
    score += 20;
  } else if (sessionsCount === 1) {
    score += 10;
  }
  
  // Score basé sur volume (30%)
  if (volume >= 500) {
    score += 30;
  } else if (volume >= 300) {
    score += 20;
  } else if (volume >= 150) {
    score += 10;
  }
  
  // Score basé sur résultats (40%)
  // Pour poids: perte (négatif) = bien, gain = moins bien (si objectif perte)
  // Pour muscle: gain (positif) = bien
  if (muscleChange > 0.1) {
    score += 20; // Gain musculaire significatif
  } else if (muscleChange > 0) {
    score += 10;
  }
  
  if (weightChange < -0.2) {
    score += 20; // Perte de poids significative (si objectif perte)
  } else if (weightChange < 0) {
    score += 10;
  } else if (weightChange === 0 && muscleChange > 0) {
    score += 15; // Stable poids + gain muscle = recomposition
  }
  
  return Math.min(100, score);
};

/**
 * Génère une recommandation de fréquence basée sur l'analyse
 * @param {number} optimalSessions - Sessions optimales par semaine
 * @param {number} optimalVolume - Volume optimal par semaine
 * @param {Array} weeklyResults - Résultats par semaine
 * @returns {string} - Recommandation textuelle
 */
const generateFrequencyRecommendation = (optimalSessions, optimalVolume, weeklyResults) => {
  const avgSessions = weeklyResults.reduce((sum, w) => sum + w.sessionsCount, 0) / weeklyResults.length;
  const avgVolume = weeklyResults.reduce((sum, w) => sum + w.weeklyVolume, 0) / weeklyResults.length;
  
  if (optimalSessions > avgSessions * 1.2) {
    return `Vos meilleures semaines ont en moyenne ${optimalSessions.toFixed(1)} séances/semaine. Augmentez votre fréquence actuelle (${avgSessions.toFixed(1)} séances/semaine) pour de meilleurs résultats.`;
  } else if (optimalSessions < avgSessions * 0.8) {
    return `Vos meilleures semaines ont en moyenne ${optimalSessions.toFixed(1)} séances/semaine. Réduisez légèrement votre fréquence actuelle (${avgSessions.toFixed(1)} séances/semaine) pour optimiser la récupération.`;
  } else {
    return `Votre fréquence actuelle (${avgSessions.toFixed(1)} séances/semaine) est proche de l'optimal (${optimalSessions.toFixed(1)} séances/semaine). Maintenez cette régularité !`;
  }
};

/**
 * Calcule le coefficient de corrélation de Pearson
 * @param {Array<number>} x - Première série de données
 * @param {Array<number>} y - Deuxième série de données
 * @returns {number} - Coefficient de corrélation (-1 à 1)
 */
const calculatePearsonCorrelation = (x, y) => {
  if (x.length !== y.length || x.length < 2) {
    return 0;
  }
  
  const n = x.length;
  
  // Calculer moyennes
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculer variances et covariance
  let varianceX = 0;
  let varianceY = 0;
  let covariance = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    varianceX += diffX * diffX;
    varianceY += diffY * diffY;
    covariance += diffX * diffY;
  }
  
  varianceX /= n;
  varianceY /= n;
  covariance /= n;
  
  // Calculer corrélation
  const denominator = Math.sqrt(varianceX * varianceY);
  if (denominator === 0) {
    return 0;
  }
  
  return covariance / denominator;
};

