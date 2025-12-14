/**
 * Service pour récupérer les vraies données Garmin depuis l'onglet Sport
 * et les formater pour le module Garmin de la sidebar
 */

class GarminRealDataService {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Traite les métriques d'une journée spécifique
   * @param {Object} dayMetrics - Métriques d'une journée
   * @param {Object} allMetrics - Toutes les métriques quotidiennes
   * @param {string} date - Date des métriques
   * @returns {Object} Données formatées pour la sidebar
   */
  processMetrics(dayMetrics, allMetrics, date) {
    // Extraire les valeurs numériques des objets complexes
    const extractNumeric = (val, defaultVal = 0) => {
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? defaultVal : parsed;
      }
      if (typeof val === 'object') {
        if ('value' in val) return extractNumeric(val.value, defaultVal);
        if ('average' in val) return extractNumeric(val.average, defaultVal);
        if ('avg' in val) return extractNumeric(val.avg, defaultVal);
        if ('total' in val) return extractNumeric(val.total, defaultVal);
        if ('max' in val) return extractNumeric(val.max, defaultVal);
        if ('min' in val) return extractNumeric(val.min, defaultVal);
        if ('current' in val) return extractNumeric(val.current, defaultVal);
        if ('resting' in val) return extractNumeric(val.resting, defaultVal);
      }
      return defaultVal;
    };

    // Formater les calories
    const rawCalories = dayMetrics.calories || {};
    const calories = {
      active: extractNumeric(rawCalories.active, 0),
      resting: extractNumeric(rawCalories.resting, 0),
      total: extractNumeric(rawCalories.total, 0)
    };
    
    // Si total n'est pas défini, le calculer
    if (calories.total === 0 && (calories.active > 0 || calories.resting > 0)) {
      calories.total = calories.active + calories.resting;
    }

    // Formater la fréquence cardiaque
    const rawHeartRate = dayMetrics.heartRate || {};
    const heartRate = {
      resting: extractNumeric(rawHeartRate.resting, null),
      max: extractNumeric(rawHeartRate.max, null),
      average: extractNumeric(rawHeartRate.avg || rawHeartRate.average, null)
    };

    // Formater Body Battery
    const bodyBattery = extractNumeric(dayMetrics.bodyBattery, null);

    // Formater les pas
    const steps = extractNumeric(dayMetrics.steps, 0);

    // Formater le sommeil
    const rawSleep = dayMetrics.sleep || {};
    const sleep = rawSleep.duration ? {
      duration: extractNumeric(rawSleep.duration, 0),
      deep: extractNumeric(rawSleep.deep, 0),
      light: extractNumeric(rawSleep.light, 0),
      rem: extractNumeric(rawSleep.rem, 0),
      awake: extractNumeric(rawSleep.awake, 0),
      quality: this.calculateSleepQuality(rawSleep)
    } : null;

    // Formater le stress
    const rawStress = dayMetrics.stress || {};
    const stress = {
      average: extractNumeric(rawStress.average, null),
      max: extractNumeric(rawStress.max, null)
    };

    // Formater les minutes d'intensité
    const rawIntensity = dayMetrics.intensityMinutes || {};
    const intensityMinutes = {
      total: extractNumeric(rawIntensity.total, 0),
      vigorous: extractNumeric(rawIntensity.vigorous, 0),
      moderate: extractNumeric(rawIntensity.moderate, 0)
    };

    // Générer les données pour les graphiques
    const chartData = this.generateChartData(dayMetrics, date);

    return {
      // Données de base pour l'affichage
      todayMetrics: {
        calories,
        heartRate,
        bodyBattery,
        steps,
        sleep,
        stress,
        intensityMinutes
      },
      
      // Données pour les graphiques
      ...chartData,
      
      // Métadonnées
      lastUpdate: new Date().toISOString(),
      dataSource: 'garmin-real-api',
      hasData: Object.keys(dayMetrics).length > 0,
      dataDate: date
    };
  }

  /**
   * Génère les données pour les graphiques de la sidebar
   * @param {Object} dayMetrics - Métriques d'une journée
   * @param {string} date - Date des métriques
   * @returns {Object} Données pour les graphiques
   */
  generateChartData(dayMetrics, date) {
    // Générer les zones de fréquence cardiaque
    const heartRateZones = this.generateHeartRateZones(dayMetrics);
    
    // Générer les phases de sommeil
    const sleepPhases = this.generateSleepPhases(dayMetrics);
    
    // Générer les niveaux de stress
    const stressLevels = this.generateStressLevels(dayMetrics);

    return {
      heartRateZones,
      sleepPhases,
      stressLevels,
      maxHeartRate: this.extractNumeric(dayMetrics.heartRate?.max, 190),
      userAge: 30, // À récupérer du profil utilisateur
      sleepObjective: 480 // 8 heures en minutes
    };
  }

  /**
   * Génère les zones de fréquence cardiaque
   */
  generateHeartRateZones(dayMetrics) {
    const heartRate = dayMetrics.heartRate || {};
    const maxHR = this.extractNumeric(heartRate.max, 190);
    const restingHR = this.extractNumeric(heartRate.resting, 65);
    
    const zones = [
      {
        zone: 1,
        name: 'Récupération',
        min: restingHR,
        max: Math.round(maxHR * 0.68),
        time: this.estimateTimeInZone(1, dayMetrics),
        color: '#4ade80'
      },
      {
        zone: 2,
        name: 'Aérobie léger',
        min: Math.round(maxHR * 0.68),
        max: Math.round(maxHR * 0.73),
        time: this.estimateTimeInZone(2, dayMetrics),
        color: '#22d3ee'
      },
      {
        zone: 3,
        name: 'Aérobie',
        min: Math.round(maxHR * 0.73),
        max: Math.round(maxHR * 0.80),
        time: this.estimateTimeInZone(3, dayMetrics),
        color: '#fbbf24'
      },
      {
        zone: 4,
        name: 'Seuil',
        min: Math.round(maxHR * 0.80),
        max: Math.round(maxHR * 0.87),
        time: this.estimateTimeInZone(4, dayMetrics),
        color: '#f97316'
      },
      {
        zone: 5,
        name: 'Neuromusculaire',
        min: Math.round(maxHR * 0.87),
        max: maxHR,
        time: this.estimateTimeInZone(5, dayMetrics),
        color: '#ef4444'
      }
    ];

    return zones;
  }

  /**
   * Génère les phases de sommeil
   */
  generateSleepPhases(dayMetrics) {
    const sleep = dayMetrics.sleep || {};
    
    if (!sleep.duration || sleep.duration === 0) {
      return [];
    }

    const phases = [
      {
        phase: 'Éveil',
        duration: this.extractNumeric(sleep.awake, 15),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.awake, 15), 'awake'),
        color: '#ef4444'
      },
      {
        phase: 'Léger',
        duration: this.extractNumeric(sleep.light, Math.round(sleep.duration * 0.45)),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.light, Math.round(sleep.duration * 0.45)), 'light'),
        color: '#22d3ee'
      },
      {
        phase: 'Profond',
        duration: this.extractNumeric(sleep.deep, Math.round(sleep.duration * 0.30)),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.deep, Math.round(sleep.duration * 0.30)), 'deep'),
        color: '#4ade80'
      },
      {
        phase: 'REM',
        duration: this.extractNumeric(sleep.rem, Math.round(sleep.duration * 0.25)),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.rem, Math.round(sleep.duration * 0.25)), 'rem'),
        color: '#8b5cf6'
      }
    ];

    return phases.filter(phase => phase.duration > 0);
  }

  /**
   * Génère les niveaux de stress
   */
  generateStressLevels(dayMetrics) {
    const stress = dayMetrics.stress || {};
    const avgStress = this.extractNumeric(stress.average, 35);
    const maxStress = this.extractNumeric(stress.max, 80);
    
    const basePoints = [
      { time: '06:00', level: Math.max(10, avgStress - 20) },
      { time: '08:00', level: Math.min(100, avgStress + 10) },
      { time: '10:00', level: avgStress },
      { time: '12:00', level: Math.min(100, avgStress + 15) },
      { time: '14:00', level: avgStress },
      { time: '16:00', level: Math.min(100, maxStress * 0.8) },
      { time: '18:00', level: Math.max(10, avgStress - 10) },
      { time: '20:00', level: Math.max(10, avgStress - 25) }
    ];

    return basePoints.map(point => ({
      ...point,
      category: this.categorizeStressLevel(point.level)
    }));
  }

  /**
   * Utilitaires
   */
  extractNumeric(val, defaultVal = 0) {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    }
    if (typeof val === 'object') {
      if ('value' in val) return this.extractNumeric(val.value, defaultVal);
      if ('average' in val) return this.extractNumeric(val.average, defaultVal);
      if ('avg' in val) return this.extractNumeric(val.avg, defaultVal);
      if ('total' in val) return this.extractNumeric(val.total, defaultVal);
      if ('max' in val) return this.extractNumeric(val.max, defaultVal);
      if ('min' in val) return this.extractNumeric(val.min, defaultVal);
      if ('current' in val) return this.extractNumeric(val.current, defaultVal);
    }
    return defaultVal;
  }

  estimateTimeInZone(zone, dayMetrics) {
    const intensityMinutes = dayMetrics.intensityMinutes || {};
    const totalIntensity = this.extractNumeric(intensityMinutes.total, 0);
    
    const distributions = {
      1: 0.50, // 50% en récupération
      2: 0.25, // 25% en aérobie léger
      3: 0.15, // 15% en aérobie
      4: 0.08, // 8% au seuil
      5: 0.02  // 2% neuromusculaire
    };
    
    const baseTime = totalIntensity > 0 ? totalIntensity : 60;
    return Math.round(baseTime * distributions[zone]);
  }

  evaluateSleepQuality(duration, phase) {
    const targets = {
      awake: { good: 15, excellent: 10 },
      light: { good: 180, excellent: 200 },
      deep: { good: 90, excellent: 120 },
      rem: { good: 90, excellent: 110 }
    };
    
    const target = targets[phase];
    if (!target) return 'normal';
    
    if (phase === 'awake') {
      return duration <= target.excellent ? 'excellent' : duration <= target.good ? 'good' : 'normal';
    } else {
      return duration >= target.excellent ? 'excellent' : duration >= target.good ? 'good' : 'normal';
    }
  }

  calculateSleepQuality(rawSleep) {
    if (!rawSleep.duration) return null;
    
    const duration = this.extractNumeric(rawSleep.duration, 0);
    const deep = this.extractNumeric(rawSleep.deep, 0);
    const rem = this.extractNumeric(rawSleep.rem, 0);
    const awake = this.extractNumeric(rawSleep.awake, 0);
    
    // Calculer un score de qualité basé sur les phases
    let score = 0;
    
    // Durée totale (0-40 points)
    if (duration >= 420 && duration <= 540) score += 40; // 7-9h optimal
    else if (duration >= 360 && duration <= 600) score += 30; // 6-10h acceptable
    else score += 20;
    
    // Sommeil profond (0-30 points)
    const deepPercentage = (deep / duration) * 100;
    if (deepPercentage >= 15 && deepPercentage <= 25) score += 30;
    else if (deepPercentage >= 10 && deepPercentage <= 30) score += 20;
    else score += 10;
    
    // Sommeil REM (0-20 points)
    const remPercentage = (rem / duration) * 100;
    if (remPercentage >= 20 && remPercentage <= 25) score += 20;
    else if (remPercentage >= 15 && remPercentage <= 30) score += 15;
    else score += 10;
    
    // Éveils (0-10 points)
    const awakePercentage = (awake / duration) * 100;
    if (awakePercentage <= 5) score += 10;
    else if (awakePercentage <= 10) score += 5;
    else score += 0;
    
    // Convertir en qualité
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Faible';
  }

  categorizeStressLevel(level) {
    if (level <= 25) return 'Repos';
    if (level <= 50) return 'Faible';
    if (level <= 75) return 'Modéré';
    return 'Élevé';
  }

  getEmptyData() {
    return {
      todayMetrics: {
        calories: { active: 0, resting: 0, total: 0 },
        heartRate: { resting: null, max: null, average: null },
        bodyBattery: null,
        steps: 0,
        sleep: null,
        stress: { average: null, max: null },
        intensityMinutes: { total: 0, vigorous: 0, moderate: 0 }
      },
      heartRateZones: [],
      sleepPhases: [],
      stressLevels: [],
      maxHeartRate: 190,
      userAge: 30,
      sleepObjective: 480,
      lastUpdate: new Date().toISOString(),
      dataSource: 'empty',
      hasData: false
    };
  }

  /**
   * Vérifie si les données en cache sont encore valides
   */
  isCacheValid() {
    if (!this.lastUpdate) return false;
    return (Date.now() - this.lastUpdate) < this.updateInterval;
  }

  /**
   * Récupère les données avec cache
   */
  getCachedData() {
    if (this.isCacheValid() && this.cache.has('garminData')) {
      return this.cache.get('garminData');
    }
    
    return null;
  }

  /**
   * Met à jour les données en cache
   */
  updateCache(data) {
    this.cache.set('garminData', data);
    this.lastUpdate = Date.now();
  }
}

// Instance singleton
const garminRealDataService = new GarminRealDataService();

export default garminRealDataService;