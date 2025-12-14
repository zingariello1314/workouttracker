/**
 * Service d'enrichissement des données Garmin réelles
 * Transforme les données existantes en données pour graphiques
 */

class GarminRealDataEnrichmentService {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
  }

  /**
   * Enrichit les données Garmin réelles avec les données pour graphiques
   * @param {Object} realGarminData - Données réelles de useGarminData
   * @returns {Object} Données enrichies avec graphiques
   */
  enrichRealData(realGarminData) {
    if (!realGarminData || !realGarminData.dailyMetrics) {
      return this.getEmptyEnrichedData();
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayMetrics = realGarminData.dailyMetrics[today] || {};
    
    // Générer les données pour graphiques basées sur les vraies données
    const enrichedData = {
      ...realGarminData,
      
      // Données pour HeartRateZonesChart
      heartRateZones: this.generateHeartRateZones(todayMetrics),
      
      // Données pour SleepPhasesChart  
      sleepPhases: this.generateSleepPhases(todayMetrics),
      
      // Données pour StressLevelChart
      stressLevels: this.generateStressLevels(todayMetrics),
      
      // Métadonnées
      maxHeartRate: this.calculateMaxHeartRate(todayMetrics),
      userAge: 30, // À récupérer du profil utilisateur
      sleepObjective: 480 // 8 heures en minutes
    };

    return enrichedData;
  }

  /**
   * Génère les zones de fréquence cardiaque basées sur les vraies données
   */
  generateHeartRateZones(todayMetrics) {
    const heartRate = todayMetrics.heartRate || {};
    const maxHR = this.extractNumeric(heartRate.max) || 190;
    const restingHR = this.extractNumeric(heartRate.resting) || 65;
    
    // Calculer les zones basées sur la fréquence cardiaque réelle
    const zones = [
      {
        zone: 1,
        name: 'Récupération',
        min: restingHR,
        max: Math.round(maxHR * 0.68),
        time: this.estimateTimeInZone(1, todayMetrics),
        color: '#4ade80'
      },
      {
        zone: 2,
        name: 'Aérobie léger',
        min: Math.round(maxHR * 0.68),
        max: Math.round(maxHR * 0.73),
        time: this.estimateTimeInZone(2, todayMetrics),
        color: '#22d3ee'
      },
      {
        zone: 3,
        name: 'Aérobie',
        min: Math.round(maxHR * 0.73),
        max: Math.round(maxHR * 0.80),
        time: this.estimateTimeInZone(3, todayMetrics),
        color: '#fbbf24'
      },
      {
        zone: 4,
        name: 'Seuil',
        min: Math.round(maxHR * 0.80),
        max: Math.round(maxHR * 0.87),
        time: this.estimateTimeInZone(4, todayMetrics),
        color: '#f97316'
      },
      {
        zone: 5,
        name: 'Neuromusculaire',
        min: Math.round(maxHR * 0.87),
        max: maxHR,
        time: this.estimateTimeInZone(5, todayMetrics),
        color: '#ef4444'
      }
    ];

    return zones;
  }

  /**
   * Génère les phases de sommeil basées sur les vraies données
   */
  generateSleepPhases(todayMetrics) {
    const sleep = todayMetrics.sleep || {};
    
    if (!sleep.duration || sleep.duration === 0) {
      return [];
    }

    const phases = [
      {
        phase: 'Éveil',
        duration: this.extractNumeric(sleep.awake) || 15,
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.awake) || 15, 'awake'),
        color: '#ef4444'
      },
      {
        phase: 'Léger',
        duration: this.extractNumeric(sleep.light) || Math.round(sleep.duration * 0.45),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.light) || Math.round(sleep.duration * 0.45), 'light'),
        color: '#22d3ee'
      },
      {
        phase: 'Profond',
        duration: this.extractNumeric(sleep.deep) || Math.round(sleep.duration * 0.30),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.deep) || Math.round(sleep.duration * 0.30), 'deep'),
        color: '#4ade80'
      },
      {
        phase: 'REM',
        duration: this.extractNumeric(sleep.rem) || Math.round(sleep.duration * 0.25),
        quality: this.evaluateSleepQuality(this.extractNumeric(sleep.rem) || Math.round(sleep.duration * 0.25), 'rem'),
        color: '#8b5cf6'
      }
    ];

    return phases.filter(phase => phase.duration > 0);
  }

  /**
   * Génère les niveaux de stress basés sur les vraies données
   */
  generateStressLevels(todayMetrics) {
    const stress = todayMetrics.stress || {};
    const avgStress = this.extractNumeric(stress.average) || 35;
    const maxStress = this.extractNumeric(stress.max) || 80;
    
    // Générer une courbe de stress réaliste basée sur les données réelles
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
   * Estime le temps passé dans chaque zone cardiaque
   */
  estimateTimeInZone(zone, todayMetrics) {
    const intensityMinutes = todayMetrics.intensityMinutes || {};
    const totalIntensity = this.extractNumeric(intensityMinutes.total) || 0;
    
    // Distribution approximative basée sur l'intensité réelle
    const distributions = {
      1: 0.50, // 50% en récupération
      2: 0.25, // 25% en aérobie léger
      3: 0.15, // 15% en aérobie
      4: 0.08, // 8% au seuil
      5: 0.02  // 2% neuromusculaire
    };
    
    const baseTime = totalIntensity > 0 ? totalIntensity : 60; // Minimum 1h d'activité
    return Math.round(baseTime * distributions[zone]);
  }

  /**
   * Évalue la qualité d'une phase de sommeil
   */
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

  /**
   * Catégorise le niveau de stress
   */
  categorizeStressLevel(level) {
    if (level <= 25) return 'Repos';
    if (level <= 50) return 'Faible';
    if (level <= 75) return 'Modéré';
    return 'Élevé';
  }

  /**
   * Calcule la fréquence cardiaque maximale
   */
  calculateMaxHeartRate(todayMetrics) {
    const heartRate = todayMetrics.heartRate || {};
    return this.extractNumeric(heartRate.max) || 190;
  }

  /**
   * Extrait une valeur numérique d'un objet complexe
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

  /**
   * Retourne des données vides pour les cas d'erreur
   */
  getEmptyEnrichedData() {
    return {
      activities: { swimming: [], jumpRope: [], cardio: [] },
      dailyMetrics: {},
      heartRateZones: [],
      sleepPhases: [],
      stressLevels: [],
      maxHeartRate: 190,
      userAge: 30,
      sleepObjective: 480
    };
  }
}

// Instance singleton
const garminRealDataEnrichmentService = new GarminRealDataEnrichmentService();

export default garminRealDataEnrichmentService;