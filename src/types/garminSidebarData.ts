/**
 * TypeScript interfaces for GarminSidebarData
 * 
 * Requirements: 1.2, 1.4
 * - Définir les interfaces pour les données FC temporelles (1.2)
 * - Gérer les cas de données manquantes ou incomplètes (1.4)
 */

/**
 * Point de données de fréquence cardiaque dans le temps
 */
export interface HeartRateTimePoint {
  /** Timestamp Unix en millisecondes */
  timestamp: number;
  /** Fréquence cardiaque en battements par minute */
  bpm: number;
  /** Heure formatée (HH:MM) */
  time: string;
  /** Indique si c'est une donnée réelle ou interpolée */
  isReal: boolean;
  /** Indique si c'est pendant une activité physique */
  isActivity?: boolean;
}

/**
 * Zone de fréquence cardiaque
 */
export interface HeartRateZone {
  /** Numéro de la zone (1-5) */
  zone: number;
  /** Nom de la zone */
  name: string;
  /** Couleur associée à la zone */
  color: string;
  /** FC minimum de la zone en bpm */
  minBpm: number;
  /** FC maximum de la zone en bpm */
  maxBpm: number;
  /** Temps passé dans cette zone en secondes */
  timeInZone: number;
  /** Pourcentage du temps total passé dans cette zone */
  percentage: number;
}

/**
 * Métriques de fréquence cardiaque
 */
export interface HeartRateMetrics {
  /** FC de repos en bpm */
  resting: number | null;
  /** FC maximum en bpm */
  max: number | null;
  /** FC moyenne en bpm */
  average: number | null;
}

/**
 * Données de calories
 */
export interface CaloriesData {
  /** Calories actives brûlées */
  active: number;
  /** Calories de repos brûlées */
  resting: number;
  /** Total des calories brûlées */
  total: number;
}

/**
 * Données de sommeil
 */
export interface SleepData {
  /** Durée totale de sommeil en minutes */
  duration: number;
  /** Temps de sommeil profond en minutes */
  deep: number;
  /** Temps de sommeil léger en minutes */
  light: number;
  /** Temps de sommeil REM en minutes */
  rem: number;
  /** Temps d'éveil en minutes */
  awake: number;
  /** Qualité du sommeil (Excellent, Bon, Moyen, Faible) */
  quality: string | null;
}

/**
 * Données de stress
 */
export interface StressData {
  /** Niveau de stress moyen */
  average: number | null;
  /** Niveau de stress maximum */
  max: number | null;
}

/**
 * Minutes d'intensité
 */
export interface IntensityMinutes {
  /** Total des minutes d'intensité */
  total: number;
  /** Minutes d'intensité vigoureuse */
  vigorous: number;
  /** Minutes d'intensité modérée */
  moderate: number;
}

/**
 * Métriques quotidiennes pour la sidebar
 */
export interface TodayMetrics {
  /** Données de calories */
  calories: CaloriesData;
  /** Métriques de fréquence cardiaque */
  heartRate: HeartRateMetrics;
  /** Niveau de Body Battery (0-100) */
  bodyBattery: number | null;
  /** Nombre de pas */
  steps: number;
  /** Données de sommeil */
  sleep: SleepData | null;
  /** Données de stress */
  stress: StressData;
  /** Minutes d'intensité */
  intensityMinutes: IntensityMinutes;
}

/**
 * Interface principale pour les données Garmin de la sidebar
 */
export interface GarminSidebarData {
  /** Métriques rapides existantes */
  todayMetrics: TodayMetrics;
  
  /** Nouvelles données pour le graphique FC temporel */
  heartRateTimeSeries: HeartRateTimePoint[];
  
  /** Zones de fréquence cardiaque */
  heartRateZones: HeartRateZone[];
  
  /** Date sélectionnée (YYYY-MM-DD) */
  selectedDate: string;
  
  /** Indique si des données de série temporelle sont disponibles */
  hasTimeSeriesData: boolean;
  
  /** Métadonnées */
  lastUpdate: string;
  dataSource: string;
  hasData: boolean;
  dataDate: string;
  optimizedForSidebar: boolean;
  
  /** Données optionnelles pour les graphiques */
  sleepPhases?: SleepPhase[];
  stressLevels?: StressLevel[];
  maxHeartRate?: number;
  userAge?: number;
  sleepObjective?: number;
}

/**
 * Phase de sommeil pour les graphiques
 */
export interface SleepPhase {
  /** Nom de la phase */
  phase: string;
  /** Durée en minutes */
  duration: number;
  /** Qualité de la phase */
  quality: string;
  /** Couleur associée */
  color: string;
}

/**
 * Niveau de stress pour les graphiques
 */
export interface StressLevel {
  /** Heure (HH:MM) */
  time: string;
  /** Niveau de stress (0-100) */
  level: number;
  /** Catégorie (Repos, Faible, Modéré, Élevé) */
  category: string;
}

/**
 * Options pour la transformation des données
 */
export interface DataTransformOptions {
  /** Activer les données de série temporelle */
  enableTimeSeriesData?: boolean;
  /** Optimiser pour l'affichage sidebar */
  optimizeForSidebar?: boolean;
  /** Date sélectionnée */
  selectedDate?: string;
  /** Nombre maximum de points pour la série temporelle */
  maxTimeSeriesPoints?: number;
  /** Seuil de compression des données */
  compressionThreshold?: number;
}

/**
 * Résultat de la validation des données
 */
export interface DataValidationResult {
  /** Indique si les données sont valides */
  isValid: boolean;
  /** Messages d'erreur */
  errors: string[];
  /** Messages d'avertissement */
  warnings: string[];
  /** Données manquantes */
  missingFields: string[];
}

/**
 * État d'erreur pour les données Garmin
 */
export interface GarminDataError {
  /** Type d'erreur */
  type: 'missing_data' | 'invalid_format' | 'network_error' | 'sync_error';
  /** Message d'erreur */
  message: string;
  /** Code d'erreur */
  code?: string;
  /** Détails supplémentaires */
  details?: Record<string, any>;
  /** Timestamp de l'erreur */
  timestamp: string;
}

/**
 * Configuration pour la gestion des erreurs
 */
export interface ErrorHandlingConfig {
  /** Utiliser des données de fallback */
  useFallbackData: boolean;
  /** Afficher les messages d'erreur */
  showErrorMessages: boolean;
  /** Retry automatique */
  autoRetry: boolean;
  /** Nombre maximum de tentatives */
  maxRetries: number;
  /** Délai entre les tentatives (ms) */
  retryDelay: number;
}