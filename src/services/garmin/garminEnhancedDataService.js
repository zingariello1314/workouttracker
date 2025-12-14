/**
 * Service de données Garmin enrichies
 * Fournit les données nécessaires pour les graphiques avancés
 */

class GarminEnhancedDataService {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
  }

  // Données de base (existantes)
  getBasicMetrics() {
    return {
      calories: { active: 450, resting: 1200, total: 1650 },
      bodyBattery: 75,
      steps: 8500,
      heartRate: { resting: 65, average: 85, max: 145 },
      sleep: { duration: 405, quality: 'good' }
    };
  }

  // Zones de fréquence cardiaque
  getHeartRateZones() {
    return [
      { zone: 1, name: 'Récupération', min: 0, max: 130, time: 120, color: '#4ade80' },
      { zone: 2, name: 'Aérobie léger', min: 130, max: 140, time: 45, color: '#22d3ee' },
      { zone: 3, name: 'Aérobie', min: 140, max: 150, time: 30, color: '#fbbf24' },
      { zone: 4, name: 'Seuil', min: 150, max: 165, time: 15, color: '#f97316' },
      { zone: 5, name: 'Neuromusculaire', min: 165, max: 190, time: 5, color: '#ef4444' }
    ];
  }

  // Phases de sommeil
  getSleepPhases() {
    return [
      { phase: 'Éveil', duration: 15, quality: 'normal', color: '#ef4444' },
      { phase: 'Léger', duration: 180, quality: 'good', color: '#22d3ee' },
      { phase: 'Profond', duration: 120, quality: 'excellent', color: '#4ade80' },
      { phase: 'REM', duration: 90, quality: 'good', color: '#8b5cf6' }
    ];
  }

  // Niveaux de stress
  getStressLevels() {
    return [
      { time: '06:00', level: 25, category: 'Repos' },
      { time: '08:00', level: 45, category: 'Faible' },
      { time: '10:00', level: 65, category: 'Modéré' },
      { time: '12:00', level: 80, category: 'Élevé' },
      { time: '14:00', level: 55, category: 'Modéré' },
      { time: '16:00', level: 70, category: 'Élevé' },
      { time: '18:00', level: 35, category: 'Faible' },
      { time: '20:00', level: 20, category: 'Repos' }
    ];
  }

  // Métadonnées
  getMetadata() {
    return {
      maxHeartRate: 190,
      userAge: 30,
      sleepObjective: 480
    };
  }

  // Données complètes enrichies
  getEnhancedData() {
    const cacheKey = 'enhanced-data';
    const now = Date.now();
    
    // Cache de 5 minutes
    if (this.cache.has(cacheKey) && this.lastUpdate && (now - this.lastUpdate) < 300000) {
      return this.cache.get(cacheKey);
    }

    const basic = this.getBasicMetrics();
    const metadata = this.getMetadata();
    
    const enhancedData = {
      // Structure existante
      sport: {
        todayMetrics: basic
      },
      garmin: basic,
      
      // NOUVELLES DONNÉES pour les graphiques
      heartRateZones: this.getHeartRateZones(),
      sleepPhases: this.getSleepPhases(),
      stressLevels: this.getStressLevels(),
      
      // Métadonnées
      ...metadata
    };

    this.cache.set(cacheKey, enhancedData);
    this.lastUpdate = now;
    
    return enhancedData;
  }

  // Simulation de données variables (pour tests)
  getRandomizedData() {
    const base = this.getEnhancedData();
    
    // Varier légèrement les données pour simulation
    return {
      ...base,
      sport: {
        todayMetrics: {
          ...base.sport.todayMetrics,
          steps: Math.floor(Math.random() * 2000) + 7000,
          bodyBattery: Math.floor(Math.random() * 30) + 60
        }
      }
    };
  }
}

// Instance singleton
const garminEnhancedDataService = new GarminEnhancedDataService();

export default garminEnhancedDataService;