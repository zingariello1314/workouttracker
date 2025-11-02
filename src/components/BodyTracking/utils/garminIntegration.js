/**
 * 🏃 INTÉGRATION GARMIN - BODY TRACKING
 * 
 * Module pour intégrer les données Garmin dans les analyses Body Tracking :
 * - Calories réelles vs estimations
 * - Fréquence cardiaque et récupération
 * - Body Battery et stress
 * - Sommeil et récupération
 * - Activités (natation, cardio, saut à la corde)
 * - Pas et activité quotidienne
 */

import logger from '../../../utils/logger';

const log = logger.module('GarminIntegration');

/**
 * Structure attendue des données Garmin
 */
const GARMIN_DATA_STRUCTURE = {
  dailyMetrics: {
    calories: 0,           // Calories brûlées
    activeCalories: 0,    // Calories actives
    restingCalories: 0,    // Calories au repos
    steps: 0,             // Pas
    distance: 0,          // Distance en mètres
    heartRate: null,      // Fréquence cardiaque moyenne
    maxHeartRate: null,   // FC max
    minHeartRate: null,   // FC min
    restingHeartRate: null, // FC au repos
    bodyBattery: null,    // Body Battery (0-100)
    stress: null,         // Stress (0-100)
    sleepHours: null,     // Heures de sommeil
    sleepScore: null,     // Score de sommeil (0-100)
    respiration: null,     // Respiration (brpm)
    spo2: null            // O2 saturation
  },
  activities: {
    swimming: [],         // Activités natation
    cardio: [],          // Activités cardio
    jumpRope: []         // Activités saut à la corde
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
 * Ouvre la base de données Garmin IndexedDB directement (utilitaire non-React)
 * @returns {Promise<IDBDatabase|null>} - Instance IndexedDB ou null
 */
const openGarminDB = () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      log.warn('IndexedDB non supporté');
      resolve(null);
      return;
    }
    
    const DB_NAME = 'GarminDataDB';
    const DB_VERSION = 1;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      log.error('Erreur ouverture IndexedDB Garmin');
      resolve(null);
    };
    request.onupgradeneeded = () => {}; // La DB devrait déjà exister
  });
};

/**
 * Charge les données Garmin pour une période donnée (sans hook React)
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Promise<Object>} - Données Garmin formatées
 */
export const loadGarminDataForPeriod = async (startDate, endDate) => {
  try {
    // Normaliser les dates de période
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    
    if (!normalizedStart || !normalizedEnd) {
      log.error('Dates de période invalides', { startDate, endDate });
      return {
        dailyMetrics: {},
        activities: {
          swimming: [],
          cardio: [],
          jumpRope: []
        }
      };
    }
    
    const db = await openGarminDB();
    if (!db) {
      log.warn('Impossible d\'ouvrir IndexedDB Garmin, données vides retournées');
      return {
        dailyMetrics: {},
        activities: {
          swimming: [],
          cardio: [],
          jumpRope: []
        }
      };
    }
    
    const filteredDailyMetrics = {};
    const filteredActivities = {
      swimming: [],
      cardio: [],
      jumpRope: []
    };
    
    // Charger dailyMetrics avec range query
    try {
      const metricsTx = db.transaction(['dailyMetrics'], 'readonly');
      const metricsStore = metricsTx.objectStore('dailyMetrics');
      
      let dateIndex;
      try {
        dateIndex = metricsStore.index('date');
      } catch (e) {
        log.warn('Index "date" non trouvé, chargement complet');
        dateIndex = null;
      }
      
      const metricsRequest = dateIndex 
        ? dateIndex.getAll(IDBKeyRange.bound(normalizedStart, normalizedEnd))
        : metricsStore.getAll();
      
      const allMetrics = await new Promise((resolve, reject) => {
        metricsRequest.onsuccess = () => resolve(metricsRequest.result || []);
        metricsRequest.onerror = () => reject(metricsRequest.error);
      });
      
      allMetrics.forEach(metric => {
        if (metric && metric.date && metric.date >= normalizedStart && metric.date <= normalizedEnd) {
          const { date, ...rest } = metric;
          filteredDailyMetrics[date] = rest;
        }
      });
    } catch (error) {
      log.error('Erreur chargement dailyMetrics', error);
    }
    
    // Charger activités avec filtrage par date
    try {
      const activitiesTx = db.transaction(['activities'], 'readonly');
      const activitiesStore = activitiesTx.objectStore('activities');
      
      const allActivities = await new Promise((resolve, reject) => {
        const request = activitiesStore.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      
      allActivities.forEach(activity => {
        if (!activity || !activity.type) return;
        
        const activityDate = normalizeDate(activity.startTime || activity.date);
        if (activityDate && activityDate >= normalizedStart && activityDate <= normalizedEnd) {
          if (activity.type === 'swimming') {
            filteredActivities.swimming.push(activity);
          } else if (activity.type === 'cardio') {
            filteredActivities.cardio.push(activity);
          } else if (activity.type === 'jumpRope') {
            filteredActivities.jumpRope.push(activity);
          }
        }
      });
    } catch (error) {
      log.error('Erreur chargement activités', error);
    }
    
    db.close();
    
    log.debug('Données Garmin chargées pour période', {
      startDate: normalizedStart,
      endDate: normalizedEnd,
      dailyMetrics: Object.keys(filteredDailyMetrics).length,
      activities: {
        swimming: filteredActivities.swimming.length,
        cardio: filteredActivities.cardio.length,
        jumpRope: filteredActivities.jumpRope.length
      }
    });
    
    return {
      dailyMetrics: filteredDailyMetrics,
      activities: filteredActivities
    };
  } catch (error) {
    log.error('Erreur lors du chargement des données Garmin', error);
    return {
      dailyMetrics: {},
      activities: {
        swimming: [],
        cardio: [],
        jumpRope: []
      }
    };
  }
};

/**
 * Obtient les métriques Garmin pour une date spécifique (sans hook React)
 * @param {Date|string} date - Date cible
 * @returns {Promise<Object|null>} - Métriques du jour ou null
 */
export const getGarminMetricsForDate = async (date) => {
  try {
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return null;
    
    const db = await openGarminDB();
    if (!db) {
      return null;
    }
    
    try {
      const metricsTx = db.transaction(['dailyMetrics'], 'readonly');
      const metricsStore = metricsTx.objectStore('dailyMetrics');
      
      const metricsRequest = metricsStore.get(normalizedDate);
      
      const metric = await new Promise((resolve, reject) => {
        metricsRequest.onsuccess = () => resolve(metricsRequest.result);
        metricsRequest.onerror = () => reject(metricsRequest.error);
      });
      
      db.close();
      
      if (!metric) {
        log.debug(`Aucune métrique Garmin pour la date ${normalizedDate}`);
        return null;
      }
      
      const { date: _, ...rest } = metric;
      return rest;
    } catch (error) {
      db.close();
      log.error('Erreur lors de la récupération des métriques Garmin pour date', error, { date });
      return null;
    }
  } catch (error) {
    log.error('Erreur lors de la récupération des métriques Garmin pour date', error, { date });
    return null;
  }
};

/**
 * Calcule les calories totales brûlées sur une période
 * @param {Object} garminData - Données Garmin (dailyMetrics)
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object} - Statistiques de calories
 */
export const calculateCaloriesForPeriod = (garminData, startDate, endDate) => {
  if (!garminData || !garminData.dailyMetrics) {
    return {
      total: 0,
      active: 0,
      resting: 0,
      average: 0,
      days: 0
    };
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return {
      total: 0,
      active: 0,
      resting: 0,
      average: 0,
      days: 0
    };
  }
  
  let total = 0;
  let active = 0;
  let resting = 0;
  let days = 0;
  
  Object.keys(garminData.dailyMetrics).forEach(dateStr => {
    if (dateStr >= normalizedStart && dateStr <= normalizedEnd) {
      const metrics = garminData.dailyMetrics[dateStr];
      
      if (metrics.calories != null) {
        total += metrics.calories;
        days++;
      }
      
      if (metrics.activeCalories != null) {
        active += metrics.activeCalories;
      }
      
      if (metrics.restingCalories != null) {
        resting += metrics.restingCalories;
      }
    }
  });
  
  return {
    total,
    active,
    resting,
    average: days > 0 ? total / days : 0,
    days
  };
};

/**
 * Calcule le déficit calorique sur une période
 * @param {number} caloriesBurned - Calories brûlées (Garmin)
 * @param {number} caloriesConsumed - Calories consommées (estimation)
 * @returns {number} - Déficit calorique (positif = déficit, négatif = surplus)
 */
export const calculateCalorieDeficit = (caloriesBurned, caloriesConsumed) => {
  if (caloriesBurned == null || caloriesConsumed == null) {
    return null;
  }
  
  return caloriesBurned - caloriesConsumed;
};

/**
 * Estime les calories consommées selon le poids et l'activité
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @param {number} age - Âge en années
 * @param {string} gender - 'male' ou 'female'
 * @param {number} activityLevel - Niveau d'activité (1.2 = sédentaire, 1.5 = actif, 1.7 = très actif)
 * @returns {number} - Métabolisme de base estimé (kcal/jour)
 */
export const estimateBasalMetabolism = (weight, height, age, gender = 'male', activityLevel = 1.5) => {
  if (!weight || !height || !age) {
    return null;
  }
  
  // Formule de Mifflin-St Jeor
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Appliquer niveau d'activité
  return Math.round(bmr * activityLevel);
};

/**
 * Analyse la corrélation entre calories Garmin et changement de poids
 * @param {Object} garminData - Données Garmin
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object} - Analyse de corrélation
 */
export const analyzeCalorieWeightCorrelation = (garminData, progressEntries, startDate, endDate) => {
  if (!garminData || !progressEntries || progressEntries.length < 2) {
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
  
  // Calculer variations de poids et calories moyennes entre mesures
  const correlations = [];
  
  for (let i = 1; i < weightEntries.length; i++) {
    const current = weightEntries[i];
    const previous = weightEntries[i - 1];
    
    // Vérifier si dans la période
    if (normalizedStart && current.date < normalizedStart) continue;
    if (normalizedEnd && current.date > normalizedEnd) continue;
    
    const weightChange = current.weight - previous.weight; // Positif = gain, négatif = perte
    
    // Calculer calories moyennes entre les deux dates
    let totalCalories = 0;
    let daysWithData = 0;
    
    if (garminData.dailyMetrics) {
      Object.keys(garminData.dailyMetrics).forEach(dateStr => {
        if (dateStr >= previous.date && dateStr < current.date) {
          const metrics = garminData.dailyMetrics[dateStr];
          if (metrics.calories != null) {
            totalCalories += metrics.calories;
            daysWithData++;
          }
        }
      });
    }
    
    const avgCalories = daysWithData > 0 ? totalCalories / daysWithData : null;
    
    if (avgCalories != null) {
      correlations.push({
        date: current.date,
        weightChange,
        avgCalories,
        daysBetween: daysWithData
      });
    }
  }
  
  if (correlations.length < 2) {
    return null;
  }
  
  // Calculer corrélation de Pearson
  const weightChanges = correlations.map(c => c.weightChange);
  const calories = correlations.map(c => c.avgCalories);
  
  const correlation = calculatePearsonCorrelation(weightChanges, calories);
  
  return {
    correlation,
    strength: Math.abs(correlation) > 0.7 ? 'forte' : Math.abs(correlation) > 0.4 ? 'modérée' : 'faible',
    sampleSize: correlations.length,
    dataPoints: correlations,
    interpretation: correlation < -0.4
      ? 'Corrélation négative: plus de calories brûlées = perte de poids'
      : correlation > 0.4
      ? 'Corrélation positive: plus de calories = gain de poids'
      : 'Peu de corrélation détectée'
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

/**
 * Analyse la récupération basée sur Body Battery, Stress et Sommeil
 * @param {Object} garminData - Données Garmin
 * @param {Date|string} date - Date cible
 * @returns {Object|null} - Score de récupération (0-100)
 */
export const analyzeRecovery = (garminData, date) => {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate || !garminData || !garminData.dailyMetrics) {
    return null;
  }
  
  const metrics = garminData.dailyMetrics[normalizedDate];
  if (!metrics) {
    return null;
  }
  
  // Analyser récupération basée sur plusieurs facteurs
  let recoveryScore = 0;
  let factors = [];
  let totalWeight = 0;
  
  // Body Battery (40% du score)
  if (metrics.bodyBattery != null) {
    const bodyBatteryScore = metrics.bodyBattery;
    recoveryScore += bodyBatteryScore * 0.4;
    totalWeight += 0.4;
    factors.push({
      name: 'Body Battery',
      value: bodyBatteryScore,
      weight: 0.4,
      status: bodyBatteryScore >= 70 ? 'excellent' : bodyBatteryScore >= 50 ? 'bon' : 'faible'
    });
  }
  
  // Stress (30% du score, inverse)
  if (metrics.stress != null) {
    const stressScore = 100 - metrics.stress; // Inverser (faible stress = bonne récupération)
    recoveryScore += stressScore * 0.3;
    totalWeight += 0.3;
    factors.push({
      name: 'Stress',
      value: metrics.stress,
      weight: 0.3,
      status: metrics.stress <= 30 ? 'excellent' : metrics.stress <= 50 ? 'bon' : 'élevé'
    });
  }
  
  // Sommeil (30% du score)
  if (metrics.sleepHours != null && metrics.sleepScore != null) {
    // Combiner heures et score de sommeil
    const sleepQuality = (metrics.sleepHours >= 7 ? 1 : metrics.sleepHours >= 6 ? 0.8 : 0.6) * (metrics.sleepScore / 100);
    const sleepScore = sleepQuality * 100;
    recoveryScore += sleepScore * 0.3;
    totalWeight += 0.3;
    factors.push({
      name: 'Sommeil',
      value: metrics.sleepHours,
      score: metrics.sleepScore,
      weight: 0.3,
      status: sleepQuality >= 0.8 ? 'excellent' : sleepQuality >= 0.6 ? 'bon' : 'insuffisant'
    });
  }
  
  // Normaliser le score (0-100)
  const normalizedScore = totalWeight > 0 ? recoveryScore / totalWeight : null;
  
  if (normalizedScore == null) {
    return null;
  }
  
  return {
    score: Math.round(normalizedScore),
    level: normalizedScore >= 80 ? 'excellent' : normalizedScore >= 60 ? 'bon' : normalizedScore >= 40 ? 'moyen' : 'faible',
    factors,
    date: normalizedDate
  };
};

/**
 * Obtient le volume d'activité Garmin pour une période
 * @param {Object} garminData - Données Garmin
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {Object} - Statistiques d'activité
 */
export const getActivityVolume = (garminData, startDate, endDate) => {
  if (!garminData || !garminData.activities) {
    return {
      totalActivities: 0,
      totalDuration: 0,
      totalCalories: 0,
      byType: {
        swimming: { count: 0, duration: 0, calories: 0 },
        cardio: { count: 0, duration: 0, calories: 0 },
        jumpRope: { count: 0, duration: 0, calories: 0 }
      }
    };
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return {
      totalActivities: 0,
      totalDuration: 0,
      totalCalories: 0,
      byType: {
        swimming: { count: 0, duration: 0, calories: 0 },
        cardio: { count: 0, duration: 0, calories: 0 },
        jumpRope: { count: 0, duration: 0, calories: 0 }
      }
    };
  }
  
  const stats = {
    totalActivities: 0,
    totalDuration: 0,
    totalCalories: 0,
    byType: {
      swimming: { count: 0, duration: 0, calories: 0 },
      cardio: { count: 0, duration: 0, calories: 0 },
      jumpRope: { count: 0, duration: 0, calories: 0 }
    }
  };
  
  const processActivities = (activities, type) => {
    activities.forEach(activity => {
      const activityDate = normalizeDate(activity.startTime || activity.date);
      if (activityDate && activityDate >= normalizedStart && activityDate <= normalizedEnd) {
        stats.totalActivities++;
        stats.byType[type].count++;
        
        if (activity.duration) {
          const durationMinutes = typeof activity.duration === 'number' 
            ? activity.duration 
            : parseFloat(activity.duration) || 0;
          stats.totalDuration += durationMinutes;
          stats.byType[type].duration += durationMinutes;
        }
        
        if (activity.calories) {
          const calories = typeof activity.calories === 'number' 
            ? activity.calories 
            : parseFloat(activity.calories) || 0;
          stats.totalCalories += calories;
          stats.byType[type].calories += calories;
        }
      }
    });
  };
  
  if (garminData.activities.swimming) {
    processActivities(garminData.activities.swimming, 'swimming');
  }
  
  if (garminData.activities.cardio) {
    processActivities(garminData.activities.cardio, 'cardio');
  }
  
  if (garminData.activities.jumpRope) {
    processActivities(garminData.activities.jumpRope, 'jumpRope');
  }
  
  return stats;
};

