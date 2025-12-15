/**
 * Service de transformation des données Garmin pour la sidebar
 * 
 * Requirements: 1.2, 1.4
 * - Implémenter la transformation des données pour le graphique sidebar (1.2)
 * - Gérer les cas de données manquantes ou incomplètes (1.4)
 */

/**
 * Service principal de transformation des données Garmin pour la sidebar
 */
export class GarminSidebarDataTransformer {
  static instance = null;
  
  constructor(errorConfig = {}) {
    this.cache = new Map();
    this.errorConfig = {
      useFallbackData: true,
      showErrorMessages: true,
      autoRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...errorConfig
    };
  }

  /**
   * Obtenir l'instance singleton
   */
  static getInstance(errorConfig = {}) {
    if (!GarminSidebarDataTransformer.instance) {
      GarminSidebarDataTransformer.instance = new GarminSidebarDataTransformer(errorConfig);
    }
    return GarminSidebarDataTransformer.instance;
  }

  /**
   * Transforme les données Garmin brutes en format sidebar
   * @param rawData - Données Garmin brutes
   * @param options - Options de transformation
   * @returns Données formatées pour la sidebar
   */
  async transformToSidebarData(rawData = {}, options = {}) {
    const {
      enableTimeSeriesData = false,
      optimizeForSidebar = true,
      selectedDate = new Date().toISOString().slice(0, 10),
      maxTimeSeriesPoints = 200,
      compressionThreshold = 500
    } = options;

    try {
      // Valider les données d'entrée
      const validation = this.validateRawData(rawData);
      if (!validation.isValid && !this.errorConfig.useFallbackData) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }

      // Créer une clé de cache
      const cacheKey = this.generateCacheKey(rawData, options);
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Extraire les métriques du jour sélectionné
      const dayMetrics = this.extractDayMetrics(rawData, selectedDate);
      
      // Transformer les métriques de base
      const todayMetrics = this.transformTodayMetrics(dayMetrics);
      
      // Transformer les données de série temporelle si demandées
      let heartRateTimeSeries = [];
      if (enableTimeSeriesData) {
        heartRateTimeSeries = this.transformHeartRateTimeSeries(
          dayMetrics,
          selectedDate,
          { maxPoints: maxTimeSeriesPoints, compressionThreshold }
        );
      }
      
      // Générer les zones de fréquence cardiaque
      const heartRateZones = this.generateHeartRateZones(dayMetrics, todayMetrics.heartRate);
      
      // Créer l'objet de données final
      const sidebarData = {
        todayMetrics,
        heartRateTimeSeries,
        heartRateZones,
        selectedDate,
        hasTimeSeriesData: heartRateTimeSeries.length > 0,
        lastUpdate: new Date().toISOString(),
        dataSource: 'garmin-sidebar-transformer',
        hasData: validation.isValid && Object.keys(dayMetrics).length > 0,
        dataDate: selectedDate,
        optimizedForSidebar: optimizeForSidebar,
        // Données optionnelles
        maxHeartRate: this.extractNumeric(dayMetrics.heartRate?.max, 190),
        userAge: 30, // À récupérer du profil utilisateur
        sleepObjective: 480 // 8 heures en minutes
      };

      // Ajouter les données optionnelles si disponibles
      if (dayMetrics.sleep) {
        sidebarData.sleepPhases = this.generateSleepPhases(dayMetrics.sleep);
      }
      
      if (dayMetrics.stress) {
        sidebarData.stressLevels = this.generateStressLevels(dayMetrics.stress, selectedDate);
      }

      // Mettre en cache
      this.cache.set(cacheKey, sidebarData);
      
      return sidebarData;
      
    } catch (error) {
      console.error('[GarminSidebarDataTransformer] Erreur de transformation:', error);
      
      if (this.errorConfig.useFallbackData) {
        return this.createFallbackData(selectedDate, options);
      }
      
      throw error;
    }
  }

  /**
   * Valide les données Garmin brutes
   */
  validateRawData(rawData) {
    const errors = [];
    const warnings = [];
    const missingFields = [];

    if (!rawData) {
      errors.push('Aucune donnée fournie');
      return { isValid: false, errors, warnings, missingFields };
    }

    if (typeof rawData !== 'object') {
      errors.push('Les données doivent être un objet');
      return { isValid: false, errors, warnings, missingFields };
    }

    // Vérifier la présence des champs essentiels
    if (!rawData.dailyMetrics && !rawData.todayMetrics) {
      missingFields.push('dailyMetrics ou todayMetrics');
      warnings.push('Aucune métrique quotidienne trouvée');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Extrait les métriques pour un jour spécifique
   */
  extractDayMetrics(rawData, selectedDate) {
    // Essayer d'abord dailyMetrics[selectedDate]
    if (rawData.dailyMetrics && rawData.dailyMetrics[selectedDate]) {
      return rawData.dailyMetrics[selectedDate];
    }
    
    // Fallback sur todayMetrics si c'est aujourd'hui
    const today = new Date().toISOString().slice(0, 10);
    if (selectedDate === today && rawData.todayMetrics) {
      return rawData.todayMetrics;
    }
    
    // Fallback sur la date la plus récente disponible
    if (rawData.dailyMetrics) {
      const availableDates = Object.keys(rawData.dailyMetrics).sort();
      if (availableDates.length > 0) {
        const latestDate = availableDates[availableDates.length - 1];
        return rawData.dailyMetrics[latestDate];
      }
    }
    
    return {};
  }

  /**
   * Transforme les métriques quotidiennes
   */
  transformTodayMetrics(dayMetrics) {
    return {
      calories: this.transformCaloriesData(dayMetrics.calories),
      heartRate: this.transformHeartRateMetrics(dayMetrics.heartRate),
      bodyBattery: this.extractNumeric(dayMetrics.bodyBattery, null),
      steps: this.extractNumeric(dayMetrics.steps, 0),
      sleep: this.transformSleepData(dayMetrics.sleep),
      stress: this.transformStressData(dayMetrics.stress),
      intensityMinutes: this.transformIntensityMinutes(dayMetrics.intensityMinutes)
    };
  }

  /**
   * Transforme les données de calories
   */
  transformCaloriesData(rawCalories) {
    if (!rawCalories) {
      return { active: 0, resting: 0, total: 0 };
    }

    const active = this.extractNumeric(rawCalories.active, 0);
    const resting = this.extractNumeric(rawCalories.resting, 0);
    let total = this.extractNumeric(rawCalories.total, 0);
    
    // Calculer le total si non fourni
    if (total === 0 && (active > 0 || resting > 0)) {
      total = active + resting;
    }

    return { active, resting, total };
  }

  /**
   * Transforme les métriques de fréquence cardiaque
   */
  transformHeartRateMetrics(rawHeartRate) {
    if (!rawHeartRate) {
      return { resting: null, max: null, average: null };
    }

    return {
      resting: this.extractNumeric(rawHeartRate.resting, null),
      max: this.extractNumeric(rawHeartRate.max, null),
      average: this.extractNumeric(rawHeartRate.avg || rawHeartRate.average, null)
    };
  }

  /**
   * Transforme les données de sommeil
   */
  transformSleepData(rawSleep) {
    if (!rawSleep || !rawSleep.duration || rawSleep.duration === 0) {
      return null;
    }

    return {
      duration: this.extractNumeric(rawSleep.duration, 0),
      deep: this.extractNumeric(rawSleep.deep, 0),
      light: this.extractNumeric(rawSleep.light, 0),
      rem: this.extractNumeric(rawSleep.rem, 0),
      awake: this.extractNumeric(rawSleep.awake, 0),
      quality: this.calculateSleepQuality(rawSleep)
    };
  }

  /**
   * Transforme les données de stress
   */
  transformStressData(rawStress) {
    if (!rawStress) {
      return { average: null, max: null };
    }

    return {
      average: this.extractNumeric(rawStress.average, null),
      max: this.extractNumeric(rawStress.max, null)
    };
  }

  /**
   * Transforme les minutes d'intensité
   */
  transformIntensityMinutes(rawIntensity) {
    if (!rawIntensity) {
      return { total: 0, vigorous: 0, moderate: 0 };
    }

    return {
      total: this.extractNumeric(rawIntensity.total, 0),
      vigorous: this.extractNumeric(rawIntensity.vigorous, 0),
      moderate: this.extractNumeric(rawIntensity.moderate, 0)
    };
  }

  /**
   * Transforme les données de série temporelle de fréquence cardiaque
   */
  transformHeartRateTimeSeries(dayMetrics, selectedDate, options) {
    const heartRate = dayMetrics.heartRate || {};
    const timeSeries = heartRate.timeSeries || [];
    
    // Si pas de données de série temporelle, générer des points de base
    if (!timeSeries || timeSeries.length === 0) {
      return this.generateBasicHeartRatePoints(heartRate, selectedDate);
    }
    
    // Traiter les données existantes
    let processedSeries = timeSeries.map((point, index) => {
      const timePoint = this.parseTimeSeriesPoint(point, index, selectedDate);
      return timePoint;
    }).filter((point) => point !== null);
    
    // Filtrer les valeurs aberrantes
    processedSeries = processedSeries.filter(point => 
      point.bpm > 30 && point.bpm < 220
    );
    
    // Optimiser pour la sidebar si nécessaire
    if (processedSeries.length > options.compressionThreshold) {
      processedSeries = this.compressTimeSeries(processedSeries, options.maxPoints);
    }
    
    return processedSeries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Parse un point de série temporelle
   */
  parseTimeSeriesPoint(point, index, selectedDate) {
    let timestamp;
    let bpm;
    
    if (point.timestamp && point.bpm !== undefined) {
      // Format standard
      timestamp = typeof point.timestamp === 'number' ? point.timestamp : new Date(point.timestamp).getTime();
      bpm = this.extractNumeric(point.bpm, 0);
    } else if (point.d_ts !== undefined && point.d_val !== undefined) {
      // Format compressé
      timestamp = point.d_ts;
      bpm = this.extractNumeric(point.d_val, 0);
    } else {
      // Format inconnu, essayer d'extraire ce qu'on peut
      timestamp = Date.now() + (index * 60000); // Fallback: intervalles d'1 minute
      bpm = this.extractNumeric(point, 0);
    }
    
    // Valider le timestamp
    if (isNaN(timestamp) || timestamp <= 0) {
      return null;
    }
    
    // Valider le BPM (doit être dans une plage raisonnable)
    if (bpm <= 30 || bpm >= 220) {
      return null;
    }
    
    return {
      timestamp,
      bpm,
      time: new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isReal: true,
      isActivity: false
    };
  }

  /**
   * Génère des points de fréquence cardiaque de base
   */
  generateBasicHeartRatePoints(heartRate, selectedDate) {
    const restingHR = this.extractNumeric(heartRate.resting, null);
    const maxHR = this.extractNumeric(heartRate.max, null);
    const avgHR = this.extractNumeric(heartRate.avg || heartRate.average, null);
    
    if (!restingHR && !maxHR && !avgHR) {
      return [];
    }
    
    const baseDate = new Date(selectedDate + 'T00:00:00');
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
        isActivity: true
      });
    }
    
    // Point de repos (soir)
    if (restingHR) {
      points.push({
        timestamp: baseDate.getTime() + (22 * 60 * 60 * 1000), // 22:00
        bpm: restingHR + 5,
        time: '22:00',
        isReal: false,
        isActivity: false
      });
    }
    
    return points;
  }

  /**
   * Compresse une série temporelle
   */
  compressTimeSeries(series, targetPoints) {
    if (series.length <= targetPoints) {
      return series;
    }
    
    const step = Math.ceil(series.length / targetPoints);
    return series.filter((_, index) => index % step === 0);
  }

  /**
   * Génère les zones de fréquence cardiaque
   */
  generateHeartRateZones(dayMetrics, heartRateMetrics) {
    // Si aucune donnée de FC, ne pas générer de zones
    if (!heartRateMetrics.max && !heartRateMetrics.resting && !heartRateMetrics.average) {
      return [];
    }
    
    const maxHR = heartRateMetrics.max || 190;
    const restingHR = heartRateMetrics.resting || 65;
    
    const zones = [
      {
        zone: 1,
        name: 'Récupération',
        color: '#4ade80',
        minBpm: restingHR,
        maxBpm: Math.round(maxHR * 0.68),
        timeInZone: this.estimateTimeInZone(1, dayMetrics),
        percentage: 0
      },
      {
        zone: 2,
        name: 'Aérobie léger',
        color: '#22d3ee',
        minBpm: Math.round(maxHR * 0.68),
        maxBpm: Math.round(maxHR * 0.73),
        timeInZone: this.estimateTimeInZone(2, dayMetrics),
        percentage: 0
      },
      {
        zone: 3,
        name: 'Aérobie',
        color: '#fbbf24',
        minBpm: Math.round(maxHR * 0.73),
        maxBpm: Math.round(maxHR * 0.80),
        timeInZone: this.estimateTimeInZone(3, dayMetrics),
        percentage: 0
      },
      {
        zone: 4,
        name: 'Seuil',
        color: '#f97316',
        minBpm: Math.round(maxHR * 0.80),
        maxBpm: Math.round(maxHR * 0.87),
        timeInZone: this.estimateTimeInZone(4, dayMetrics),
        percentage: 0
      },
      {
        zone: 5,
        name: 'Neuromusculaire',
        color: '#ef4444',
        minBpm: Math.round(maxHR * 0.87),
        maxBpm: maxHR,
        timeInZone: this.estimateTimeInZone(5, dayMetrics),
        percentage: 0
      }
    ];

    // Calculer les pourcentages
    const totalTime = zones.reduce((sum, zone) => sum + zone.timeInZone, 0);
    if (totalTime > 0) {
      zones.forEach(zone => {
        zone.percentage = Math.round((zone.timeInZone / totalTime) * 100);
      });
    }

    return zones;
  }

  /**
   * Génère les phases de sommeil
   */
  generateSleepPhases(sleepData) {
    return [
      {
        phase: 'Éveil',
        duration: sleepData.awake,
        quality: this.evaluateSleepPhaseQuality(sleepData.awake, 'awake'),
        color: '#ef4444'
      },
      {
        phase: 'Léger',
        duration: sleepData.light,
        quality: this.evaluateSleepPhaseQuality(sleepData.light, 'light'),
        color: '#22d3ee'
      },
      {
        phase: 'Profond',
        duration: sleepData.deep,
        quality: this.evaluateSleepPhaseQuality(sleepData.deep, 'deep'),
        color: '#4ade80'
      },
      {
        phase: 'REM',
        duration: sleepData.rem,
        quality: this.evaluateSleepPhaseQuality(sleepData.rem, 'rem'),
        color: '#8b5cf6'
      }
    ].filter(phase => phase.duration > 0);
  }

  /**
   * Génère les niveaux de stress
   */
  generateStressLevels(stressData, selectedDate) {
    const avgStress = stressData.average || 35;
    const maxStress = stressData.max || 80;
    
    return [
      { time: '06:00', level: Math.max(10, avgStress - 20), category: this.categorizeStressLevel(Math.max(10, avgStress - 20)) },
      { time: '08:00', level: Math.min(100, avgStress + 10), category: this.categorizeStressLevel(Math.min(100, avgStress + 10)) },
      { time: '10:00', level: avgStress, category: this.categorizeStressLevel(avgStress) },
      { time: '12:00', level: Math.min(100, avgStress + 15), category: this.categorizeStressLevel(Math.min(100, avgStress + 15)) },
      { time: '14:00', level: avgStress, category: this.categorizeStressLevel(avgStress) },
      { time: '16:00', level: Math.min(100, maxStress * 0.8), category: this.categorizeStressLevel(Math.min(100, maxStress * 0.8)) },
      { time: '18:00', level: Math.max(10, avgStress - 10), category: this.categorizeStressLevel(Math.max(10, avgStress - 10)) },
      { time: '20:00', level: Math.max(10, avgStress - 25), category: this.categorizeStressLevel(Math.max(10, avgStress - 25)) }
    ];
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
      if ('resting' in val) return this.extractNumeric(val.resting, defaultVal);
    }
    return defaultVal;
  }

  estimateTimeInZone(zone, dayMetrics) {
    const intensityMinutes = dayMetrics.intensityMinutes || {};
    const totalIntensity = this.extractNumeric(intensityMinutes.total, 0) || 0;
    
    const distributions = {
      1: 0.50, // 50% en récupération
      2: 0.25, // 25% en aérobie léger
      3: 0.15, // 15% en aérobie
      4: 0.08, // 8% au seuil
      5: 0.02  // 2% neuromusculaire
    };
    
    const baseTime = totalIntensity > 0 ? totalIntensity : 60;
    return Math.round(baseTime * (distributions[zone] || 0));
  }

  calculateSleepQuality(rawSleep) {
    if (!rawSleep.duration) return null;
    
    const duration = this.extractNumeric(rawSleep.duration, 0) || 0;
    const deep = this.extractNumeric(rawSleep.deep, 0) || 0;
    const rem = this.extractNumeric(rawSleep.rem, 0) || 0;
    const awake = this.extractNumeric(rawSleep.awake, 0) || 0;
    
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

  evaluateSleepPhaseQuality(duration, phase) {
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

  categorizeStressLevel(level) {
    if (level <= 25) return 'Repos';
    if (level <= 50) return 'Faible';
    if (level <= 75) return 'Modéré';
    return 'Élevé';
  }

  generateCacheKey(rawData, options) {
    const dataHash = JSON.stringify(rawData).slice(0, 100);
    const optionsHash = JSON.stringify(options);
    return `${dataHash}-${optionsHash}`;
  }

  /**
   * Crée des données de fallback en cas d'erreur
   */
  createFallbackData(selectedDate, options) {
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
      heartRateTimeSeries: [],
      heartRateZones: [],
      selectedDate,
      hasTimeSeriesData: false,
      lastUpdate: new Date().toISOString(),
      dataSource: 'fallback',
      hasData: false,
      dataDate: selectedDate,
      optimizedForSidebar: options.optimizeForSidebar !== undefined ? options.optimizeForSidebar : true,
      maxHeartRate: 190,
      userAge: 30,
      sleepObjective: 480
    };
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance par défaut
export const garminSidebarDataTransformer = GarminSidebarDataTransformer.getInstance();