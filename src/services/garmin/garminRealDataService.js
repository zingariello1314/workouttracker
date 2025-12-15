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
   * @param {Object} options - Options de traitement
   * @param {boolean} options.enableTimeSeriesData - Inclure les données de série temporelle
   * @param {boolean} options.optimizeForSidebar - Optimiser pour l'affichage sidebar
   * @param {string} options.selectedDate - Date sélectionnée
   * @returns {Object} Données formatées pour la sidebar
   */
  processMetrics(dayMetrics, allMetrics, date, options = {}) {
    const { 
      enableTimeSeriesData = false, 
      optimizeForSidebar = true,
      selectedDate = date
    } = options;
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
    const chartData = this.generateChartData(dayMetrics, date, options);

    // Générer les données de série temporelle si demandées
    let timeSeriesData = {};
    if (enableTimeSeriesData) {
      timeSeriesData = this.generateTimeSeriesData(dayMetrics, date, options);
    }

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
      
      // Données de série temporelle (pour les graphiques avancés)
      ...timeSeriesData,
      
      // Métadonnées
      lastUpdate: new Date().toISOString(),
      dataSource: 'garmin-real-api',
      hasData: Object.keys(dayMetrics).length > 0,
      dataDate: date,
      selectedDate: selectedDate,
      optimizedForSidebar: optimizeForSidebar
    };
  }

  /**
   * Génère les données pour les graphiques de la sidebar
   * @param {Object} dayMetrics - Métriques d'une journée
   * @param {string} date - Date des métriques
   * @param {Object} options - Options de génération
   * @returns {Object} Données pour les graphiques
   */
  generateChartData(dayMetrics, date, options = {}) {
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
   * Génère les données de série temporelle pour les graphiques avancés
   * @param {Object} dayMetrics - Métriques d'une journée
   * @param {string} date - Date des métriques
   * @param {Object} options - Options de génération
   * @returns {Object} Données de série temporelle
   */
  generateTimeSeriesData(dayMetrics, date, options = {}) {
    const { optimizeForSidebar = true } = options;
    
    // Générer les données de série temporelle de fréquence cardiaque
    const heartRateTimeSeries = this.generateHeartRateTimeSeries(dayMetrics, date, optimizeForSidebar);
    
    return {
      heartRateTimeSeries,
      // Autres séries temporelles peuvent être ajoutées ici si nécessaire
      // stressTimeSeries: this.generateStressTimeSeries(dayMetrics, date, optimizeForSidebar),
      // bodyBatteryTimeSeries: this.generateBodyBatteryTimeSeries(dayMetrics, date, optimizeForSidebar)
    };
  }

  /**
   * Génère les données de série temporelle de fréquence cardiaque
   * @param {Object} dayMetrics - Métriques d'une journée
   * @param {string} date - Date des métriques
   * @param {boolean} optimizeForSidebar - Optimiser pour la sidebar
   * @returns {Array} Données de série temporelle FC
   */
  generateHeartRateTimeSeries(dayMetrics, date, optimizeForSidebar = true) {
    const heartRate = dayMetrics.heartRate || {};
    const timeSeries = heartRate.timeSeries || [];
    
    // Si pas de données de série temporelle, générer des points de base
    if (!timeSeries || timeSeries.length === 0) {
      return this.generateBasicHeartRatePoints(heartRate, date);
    }
    
    // Traiter les données existantes
    let processedSeries = timeSeries.map((point, index) => {
      // Gérer les formats de données compressées et non compressées
      let timestamp, bpm;
      
      if (point.timestamp && point.bpm !== undefined) {
        // Format standard
        timestamp = typeof point.timestamp === 'number' ? point.timestamp : new Date(point.timestamp).getTime();
        bpm = this.extractNumeric(point.bpm, 0);
      } else if (point.d_ts !== undefined && point.d_val !== undefined) {
        // Format compressé - nécessite décompression
        // Pour l'instant, on utilise les valeurs directement
        timestamp = point.d_ts;
        bpm = this.extractNumeric(point.d_val, 0);
      } else {
        // Format inconnu, essayer d'extraire ce qu'on peut
        timestamp = Date.now() + (index * 60000); // Fallback: intervalles d'1 minute
        bpm = this.extractNumeric(point, 0);
      }
      
      return {
        timestamp,
        bpm: bpm > 0 ? bpm : null, // Null pour les valeurs invalides
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isReal: true,
        isActivity: false
      };
    }).filter(point => point.bpm !== null && point.bpm > 30 && point.bpm < 220); // Filtrer les valeurs aberrantes
    
    // Optimiser pour la sidebar si demandé
    if (optimizeForSidebar && processedSeries.length > 100) {
      // Réduire le nombre de points pour améliorer les performances
      const step = Math.ceil(processedSeries.length / 100);
      processedSeries = processedSeries.filter((_, index) => index % step === 0);
    }
    
    return processedSeries;
  }

  /**
   * Génère des points de fréquence cardiaque de base à partir des métriques agrégées
   * @param {Object} heartRate - Métriques de fréquence cardiaque
   * @param {string} date - Date des métriques
   * @returns {Array} Points de base
   */
  generateBasicHeartRatePoints(heartRate, date) {
    const restingHR = this.extractNumeric(heartRate.resting, null);
    const maxHR = this.extractNumeric(heartRate.max, null);
    const avgHR = this.extractNumeric(heartRate.avg || heartRate.average, null);
    
    if (!restingHR && !maxHR && !avgHR) {
      return [];
    }
    
    // Créer quelques points de base pour la journée
    const baseDate = new Date(date + 'T00:00:00');
    const points = [];
    
    // Point de repos (matin)
    if (restingHR) {
      points.push({
        timestamp: baseDate.getTime() + (7 * 60 * 60 * 1000), // 07:00
        bpm: restingHR,
        time: '07:00',
        isReal: false,
        isActivity: false
      });
    }
    
    // Point moyen (milieu de journée)
    if (avgHR) {
      points.push({
        timestamp: baseDate.getTime() + (14 * 60 * 60 * 1000), // 14:00
        bpm: avgHR,
        time: '14:00',
        isReal: false,
        isActivity: false
      });
    }
    
    // Point maximum (si différent de la moyenne)
    if (maxHR && maxHR !== avgHR) {
      points.push({
        timestamp: baseDate.getTime() + (16 * 60 * 60 * 1000), // 16:00
        bpm: maxHR,
        time: '16:00',
        isReal: false,
        isActivity: true // Marquer comme activité
      });
    }
    
    // Point de repos (soir)
    if (restingHR) {
      points.push({
        timestamp: baseDate.getTime() + (22 * 60 * 60 * 1000), // 22:00
        bpm: restingHR + 5, // Légèrement plus élevé le soir
        time: '22:00',
        isReal: false,
        isActivity: false
      });
    }
    
    return points.sort((a, b) => a.timestamp - b.timestamp);
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
      heartRateTimeSeries: [], // Nouvelle série temporelle pour les graphiques
      maxHeartRate: 190,
      userAge: 30,
      sleepObjective: 480,
      lastUpdate: new Date().toISOString(),
      dataSource: 'empty',
      hasData: false,
      dataDate: new Date().toISOString().slice(0, 10),
      selectedDate: new Date().toISOString().slice(0, 10),
      optimizedForSidebar: true
    };
  }

  /**
   * Vérifie si les données en cache sont encore valides
   * @param {string} cacheKey - Clé de cache spécifique
   */
  isCacheValid(cacheKey = 'garminData') {
    const cacheEntry = this.cache.get(cacheKey);
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return (Date.now() - cacheEntry.timestamp) < this.updateInterval;
  }

  /**
   * Récupère les données avec cache
   * @param {string} cacheKey - Clé de cache spécifique
   */
  getCachedData(cacheKey = 'garminData') {
    if (this.isCacheValid(cacheKey)) {
      const cacheEntry = this.cache.get(cacheKey);
      return cacheEntry ? cacheEntry.data : null;
    }
    
    return null;
  }

  /**
   * Met à jour les données en cache
   * @param {Object} data - Données à mettre en cache
   * @param {string} cacheKey - Clé de cache spécifique
   */
  updateCache(data, cacheKey = 'garminData') {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Maintenir la compatibilité avec l'ancien système
    if (cacheKey === 'garminData') {
      this.lastUpdate = Date.now();
    }
  }

  /**
   * Vide le cache
   * @param {string} cacheKey - Clé de cache spécifique à vider, ou undefined pour tout vider
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
      this.lastUpdate = null;
    }
  }
}

// Instance singleton
const garminRealDataService = new GarminRealDataService();

export default garminRealDataService;