/**
 * 🏃 INTÉGRATION ENDURANCE TAB - BODY TRACKING
 * 
 * Module pour intégrer les données d'endurance dans les analyses Body Tracking :
 * - Calcul calories par type d'endurance (MET values)
 * - Ajout aux calories totales quotidiennes
 * - Analyse impact sur composition corporelle
 * - Corrélation endurance vs changements de poids/muscle
 */

import logger from '../../../utils/logger';

const log = logger.module('EnduranceIntegration');

/**
 * Valeurs MET (Metabolic Equivalent of Task) par type d'activité d'endurance
 * Source: Compendium of Physical Activities (2021)
 * 1 MET = dépense énergétique au repos (~3.5 ml O2/kg/min)
 */
const MET_VALUES = {
  boxing: {
    // Boxe: intensité modérée à élevée selon durée et intensité
    light: 6.0,      // Boxe légère (shadowboxing, technique)
    moderate: 8.5,   // Boxe modérée (sacs, combos)
    vigorous: 12.0   // Boxe intensive (sparring, combats)
  },
  pushups: {
    // Pompes: intensité selon vitesse et nombre
    light: 3.5,      // Pompes lentes (< 10/min)
    moderate: 8.0,   // Pompes modérées (10-20/min)
    vigorous: 11.0  // Pompes rapides (> 20/min)
  },
  swimming: {
    // Natation: intensité selon nage et allure
    light: 5.0,      // Natation légère (brasse, crawl lent)
    moderate: 7.0,   // Natation modérée (crawl moyen, dos)
    vigorous: 10.0   // Natation intensive (crawl rapide, papillon)
  },
  jumprope: {
    // Corde à sauter: intensité selon vitesse
    light: 8.8,      // Corde lente (70-100 sauts/min)
    moderate: 11.8,  // Corde modérée (100-120 sauts/min)
    vigorous: 12.3   // Corde rapide (> 120 sauts/min)
  },
  running: {
    // Course: intensité selon vitesse
    light: 6.0,      // Course lente (< 6 km/h)
    moderate: 9.8,   // Course modérée (6-10 km/h)
    vigorous: 11.5   // Course rapide (> 10 km/h)
  }
};

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
 * Détermine l'intensité d'une session selon ses caractéristiques
 * @param {string} activityType - Type d'activité (boxing, pushups, swimming, jumprope, running)
 * @param {Object} session - Données de la session
 * @returns {string} - Intensité ('light', 'moderate', 'vigorous')
 */
const determineIntensity = (activityType, session) => {
  const duration = parseFloat(session.duration) || 0;
  const distance = parseFloat(session.distance) || 0;
  const reps = parseFloat(session.reps || session.count || session.jumps || 0);
  
  switch (activityType) {
    case 'boxing':
      // Boxe: intensité selon durée et notes (si mentionné "intense", "combat")
      if (duration > 30 || session.notes?.toLowerCase().includes('intense') || session.notes?.toLowerCase().includes('combat')) {
        return 'vigorous';
      }
      if (duration > 15) {
        return 'moderate';
      }
      return 'light';
      
    case 'pushups':
      // Pompes: intensité selon nombre et durée
      const pushupsPerMin = duration > 0 ? reps / duration : 0;
      if (pushupsPerMin > 20 || reps > 100) {
        return 'vigorous';
      }
      if (pushupsPerMin > 10 || reps > 50) {
        return 'moderate';
      }
      return 'light';
      
    case 'swimming':
      // Natation: intensité selon distance et durée
      if (duration > 0 && distance > 0) {
        const speedKmh = (distance / 1000) / (duration / 60); // km/h
        if (speedKmh > 2.5 || session.swimType === 'butterfly' || session.swimType === 'freestyle_fast') {
          return 'vigorous';
        }
        if (speedKmh > 1.5) {
          return 'moderate';
        }
      }
      return 'light';
      
    case 'jumprope':
      // Corde: intensité selon sauts et durée
      if (duration > 0 && session.jumps) {
        const jumpsPerMin = (session.jumps / duration) * 60;
        if (jumpsPerMin > 120) {
          return 'vigorous';
        }
        if (jumpsPerMin > 100) {
          return 'moderate';
        }
      }
      return 'light';
      
    case 'running':
      // Course: intensité selon distance et durée
      if (duration > 0 && distance > 0) {
        const speedKmh = (distance / 1000) / (duration / 60); // km/h
        if (speedKmh > 10) {
          return 'vigorous';
        }
        if (speedKmh > 6) {
          return 'moderate';
        }
      }
      return 'light';
      
    default:
      return 'moderate'; // Par défaut: modérée
  }
};

/**
 * Calcule les calories brûlées pour une session d'endurance
 * @param {string} activityType - Type d'activité
 * @param {Object} session - Données de la session
 * @param {number} weightKg - Poids en kg (optionnel, utilisé pour calcul précis)
 * @returns {number} - Calories brûlées (kcal)
 */
export const calculateEnduranceCalories = (activityType, session, weightKg = null) => {
  if (!activityType || !session) {
    return 0;
  }
  
  // Si calories déjà présentes dans session (ex: natation avec capteur)
  if (session.calories != null && !isNaN(session.calories) && session.calories > 0) {
    return Math.round(session.calories);
  }
  
  // Déterminer intensité
  const intensity = determineIntensity(activityType, session);
  
  // Obtenir valeur MET
  const metConfig = MET_VALUES[activityType];
  if (!metConfig) {
    log.warn(`Type d'activité non reconnu: ${activityType}, utilisation MET par défaut (6.0)`);
    return 0; // Ne pas calculer si type inconnu
  }
  
  const metValue = metConfig[intensity] || metConfig.moderate || 6.0;
  
  // Durée en heures
  const durationMinutes = parseFloat(session.duration) || 0;
  if (durationMinutes <= 0) {
    return 0;
  }
  
  const durationHours = durationMinutes / 60;
  
  // Calcul calories selon formule: MET × poids (kg) × durée (h)
  // Si poids non fourni, utiliser moyenne standard (70 kg pour homme adulte)
  const effectiveWeight = weightKg && weightKg > 0 ? weightKg : 70;
  const calories = metValue * effectiveWeight * durationHours;
  
  return Math.round(calories);
};

/**
 * Calcule les calories totales d'endurance pour une période
 * @param {Object} enduranceData - Données d'endurance (data.enduranceData)
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {number} weightKg - Poids en kg pour calcul précis (optionnel)
 * @returns {Object} - Statistiques calories par type et total
 */
export const calculateEnduranceCaloriesForPeriod = (enduranceData = {}, startDate, endDate, weightKg = null) => {
  if (!enduranceData || !enduranceData.sessions) {
    return {
      total: 0,
      byType: {
        boxing: 0,
        pushups: 0,
        swimming: 0,
        jumprope: 0,
        running: 0
      },
      byDate: {},
      sessionsCount: 0
    };
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return {
      total: 0,
      byType: {
        boxing: 0,
        pushups: 0,
        swimming: 0,
        jumprope: 0,
        running: 0
      },
      byDate: {},
      sessionsCount: 0
    };
  }
  
  const stats = {
    total: 0,
    byType: {
      boxing: 0,
      pushups: 0,
      swimming: 0,
      jumprope: 0,
      running: 0
    },
    byDate: {},
    sessionsCount: 0
  };
  
  // Parcourir tous les types d'activité
  Object.entries(enduranceData.sessions).forEach(([activityType, sessions]) => {
    if (!Array.isArray(sessions)) return;
    
    sessions.forEach(session => {
      const sessionDate = normalizeDate(session.date);
      
      // Vérifier si dans la période
      if (!sessionDate || sessionDate < normalizedStart || sessionDate > normalizedEnd) {
        return;
      }
      
      // Calculer calories pour cette session
      const calories = calculateEnduranceCalories(activityType, session, weightKg);
      
      if (calories > 0) {
        stats.total += calories;
        stats.sessionsCount++;
        
        // Par type
        if (stats.byType[activityType] != null) {
          stats.byType[activityType] += calories;
        }
        
        // Par date
        if (!stats.byDate[sessionDate]) {
          stats.byDate[sessionDate] = {
            total: 0,
            byType: {}
          };
        }
        stats.byDate[sessionDate].total += calories;
        if (!stats.byDate[sessionDate].byType[activityType]) {
          stats.byDate[sessionDate].byType[activityType] = 0;
        }
        stats.byDate[sessionDate].byType[activityType] += calories;
      }
    });
  });
  
  return stats;
};

/**
 * Combine calories Garmin et calories endurance pour total quotidien
 * @param {Object} garminData - Données Garmin (dailyMetrics)
 * @param {Object} enduranceData - Données d'endurance
 * @param {Date|string} date - Date cible
 * @param {number} weightKg - Poids en kg (optionnel)
 * @returns {Object} - Calories combinées (total, garmin, endurance, breakdown)
 */
export const combineDailyCalories = (garminData = {}, enduranceData = {}, date, weightKg = null) => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return {
      total: 0,
      garmin: 0,
      endurance: 0,
      breakdown: {}
    };
  }
  
  // Calories Garmin (si disponibles)
  let garminCalories = 0;
  if (garminData.dailyMetrics && garminData.dailyMetrics[normalizedDate]) {
    const metrics = garminData.dailyMetrics[normalizedDate];
    garminCalories = metrics.calories?.total || metrics.calories || 0;
  }
  
  // Calories Endurance pour cette date
  let enduranceCalories = 0;
  const enduranceBreakdown = {
    boxing: 0,
    pushups: 0,
    swimming: 0,
    jumprope: 0,
    running: 0
  };
  
  if (enduranceData.sessions) {
    Object.entries(enduranceData.sessions).forEach(([activityType, sessions]) => {
      if (!Array.isArray(sessions)) return;
      
      sessions.forEach(session => {
        const sessionDate = normalizeDate(session.date);
        if (sessionDate === normalizedDate) {
          const calories = calculateEnduranceCalories(activityType, session, weightKg);
          enduranceCalories += calories;
          if (enduranceBreakdown[activityType] != null) {
            enduranceBreakdown[activityType] += calories;
          }
        }
      });
    });
  }
  
  const total = garminCalories + enduranceCalories;
  
  return {
    total: Math.round(total),
    garmin: Math.round(garminCalories),
    endurance: Math.round(enduranceCalories),
    breakdown: enduranceBreakdown
  };
};

/**
 * Analyse l'impact de l'endurance sur la composition corporelle
 * @param {Object} enduranceData - Données d'endurance
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {number} weightKg - Poids moyen pour calculs
 * @returns {Object|null} - Analyse d'impact
 */
export const analyzeEnduranceImpactOnBodyComposition = (
  enduranceData = {},
  progressEntries = [],
  startDate,
  endDate,
  weightKg = null
) => {
  if (!enduranceData || !progressEntries || progressEntries.length < 2) {
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
  
  if (filteredEntries.length < 2) {
    return null;
  }
  
  // Calculer calories endurance pour la période
  const enduranceCalories = calculateEnduranceCaloriesForPeriod(
    enduranceData,
    startDate,
    endDate,
    weightKg
  );
  
  if (enduranceCalories.total === 0 || enduranceCalories.sessionsCount === 0) {
    return null;
  }
  
  // Trier entrées par date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = normalizeDate(a.date || a.timestamp);
    const dateB = normalizeDate(b.date || b.timestamp);
    return dateA.localeCompare(dateB);
  });
  
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  
  // Calculer changements
  const weightChange = (firstEntry.type === 'metrics' && lastEntry.type === 'metrics' && firstEntry.weight && lastEntry.weight)
    ? lastEntry.weight - firstEntry.weight
    : null;
  
  // ✅ CORRIGÉ : Gestion des fallbacks pour compatibilité (muscleMass → skeletalMuscle)
  const firstMuscle = firstEntry.type === 'impedance' 
    ? (firstEntry.muscleMass || firstEntry.skeletalMuscle)
    : null;
  const lastMuscle = lastEntry.type === 'impedance'
    ? (lastEntry.muscleMass || lastEntry.skeletalMuscle)
    : null;
  const muscleChange = (firstMuscle != null && lastMuscle != null)
    ? lastMuscle - firstMuscle
    : null;
  
  const bodyFatChange = (firstEntry.type === 'impedance' && lastEntry.type === 'impedance' && firstEntry.bodyFatPercentage && lastEntry.bodyFatPercentage)
    ? lastEntry.bodyFatPercentage - firstEntry.bodyFatPercentage
    : null;
  
  // Calculer durée période en jours
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const avgDailyEnduranceCalories = enduranceCalories.total / days;
  
  // Analyser impact
  const impact = {
    enduranceCalories: {
      total: enduranceCalories.total,
      average: avgDailyEnduranceCalories,
      sessionsCount: enduranceCalories.sessionsCount,
      byType: enduranceCalories.byType
    },
    bodyChanges: {
      weightChange,
      muscleChange,
      bodyFatChange
    },
    analysis: {
      days,
      avgSessionsPerWeek: (enduranceCalories.sessionsCount / days) * 7,
      caloriesPerSession: enduranceCalories.sessionsCount > 0 
        ? enduranceCalories.total / enduranceCalories.sessionsCount 
        : 0
    },
    insights: [],
    recommendations: []
  };
  
  // Générer insights
  if (weightChange < 0 && avgDailyEnduranceCalories > 200) {
    impact.insights.push({
      type: 'positive',
      message: `Votre activité d'endurance (${Math.round(avgDailyEnduranceCalories)} kcal/jour en moyenne) contribue significativement à votre perte de poids.`
    });
  }
  
  if (muscleChange > 0 && enduranceCalories.byType.boxing + enduranceCalories.byType.pushups > 0) {
    impact.insights.push({
      type: 'positive',
      message: `Vos activités de force (boxe, pompes) combinées à l'endurance favorisent le gain musculaire tout en brûlant des calories.`
    });
  }
  
  if (bodyFatChange < 0 && enduranceCalories.total > 5000) {
    impact.insights.push({
      type: 'positive',
      message: `Votre volume d'endurance élevé (${Math.round(enduranceCalories.total)} kcal sur la période) explique en partie votre réduction de masse graisseuse.`
    });
  }
  
  // Générer recommandations
  if (avgDailyEnduranceCalories < 100 && weightChange == null) {
    impact.recommendations.push({
      priority: 'medium',
      message: `Augmentez votre activité d'endurance pour atteindre au moins 150-200 kcal/jour et optimiser votre composition corporelle.`
    });
  }
  
  if (enduranceCalories.byType.swimming + enduranceCalories.byType.running > enduranceCalories.total * 0.8) {
    impact.recommendations.push({
      priority: 'low',
      message: `Votre endurance est principalement cardio. Ajoutez des activités de force (boxe, pompes) pour mieux développer la masse musculaire.`
    });
  }
  
  return impact;
};

/**
 * Corrèle calories endurance avec changements de poids
 * @param {Object} enduranceData - Données d'endurance
 * @param {Array} progressEntries - Entrées de progression
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {number} weightKg - Poids moyen (optionnel)
 * @returns {Object|null} - Analyse de corrélation
 */
export const analyzeEnduranceWeightCorrelation = (
  enduranceData = {},
  progressEntries = [],
  startDate,
  endDate,
  weightKg = null
) => {
  if (!enduranceData || !progressEntries || progressEntries.length < 2) {
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
  
  // Calculer variations de poids et calories endurance correspondantes
  const correlations = [];
  
  for (let i = 1; i < weightEntries.length; i++) {
    const current = weightEntries[i];
    const previous = weightEntries[i - 1];
    
    // Vérifier si dans la période
    if (normalizedStart && current.date < normalizedStart) continue;
    if (normalizedEnd && current.date > normalizedEnd) continue;
    
    const weightChange = current.weight - previous.weight; // Positif = gain, négatif = perte
    
    // Calculer calories endurance entre les deux dates
    const enduranceCalories = calculateEnduranceCaloriesForPeriod(
      enduranceData,
      previous.date,
      current.date,
      weightKg
    );
    
    const daysBetween = (new Date(current.date) - new Date(previous.date)) / (1000 * 60 * 60 * 24);
    const avgDailyEnduranceCalories = daysBetween > 0 ? enduranceCalories.total / daysBetween : 0;
    
    if (daysBetween > 0 && daysBetween <= 60) { // Limiter à 2 mois max entre mesures
      correlations.push({
        date: current.date,
        weightChange,
        enduranceCalories: enduranceCalories.total,
        avgDailyEnduranceCalories,
        sessionsCount: enduranceCalories.sessionsCount,
        daysBetween
      });
    }
  }
  
  if (correlations.length < 2) {
    return null;
  }
  
  // Calculer corrélation de Pearson
  const weightChanges = correlations.map(c => c.weightChange);
  const enduranceCaloriesList = correlations.map(c => c.avgDailyEnduranceCalories);
  
  const correlation = calculatePearsonCorrelation(weightChanges, enduranceCaloriesList);
  
  return {
    correlation,
    strength: Math.abs(correlation) > 0.7 ? 'forte' : Math.abs(correlation) > 0.4 ? 'modérée' : 'faible',
    sampleSize: correlations.length,
    dataPoints: correlations,
    interpretation: correlation < -0.4
      ? 'Corrélation négative: plus d\'endurance = perte de poids'
      : correlation > 0.4
      ? 'Corrélation positive: endurance peut contribuer au gain (si accompagnée de nutrition)'
      : 'Peu de corrélation détectée entre endurance et poids'
  };
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

