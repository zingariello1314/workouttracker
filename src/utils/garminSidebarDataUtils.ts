/**
 * Utilitaires pour l'intégration des données Garmin sidebar
 * 
 * Requirements: 1.2, 1.4
 * - Intégrer la transformation des données avec le hook existant (1.2)
 * - Gérer les cas de données manquantes ou incomplètes (1.4)
 */

import { 
  GarminSidebarData, 
  DataTransformOptions,
  GarminDataError 
} from '../types/garminSidebarData';
import { garminSidebarDataTransformer } from '../services/garmin/garminSidebarDataTransformer';
import { garminDataErrorHandler, GarminErrorType, GarminErrorCode } from './garminDataErrorHandler';

/**
 * Transforme les données Garmin brutes en format sidebar avec gestion d'erreurs
 * @param rawData - Données Garmin brutes du hook useRealGarminData
 * @param options - Options de transformation
 * @returns Données formatées pour la sidebar ou données de fallback
 */
export async function transformGarminDataForSidebar(
  rawData: any,
  options: DataTransformOptions = {}
): Promise<{
  data: GarminSidebarData;
  error: GarminDataError | null;
  warnings: string[];
}> {
  const warnings: string[] = [];
  let error: GarminDataError | null = null;

  try {
    // Valider les données d'entrée
    if (!rawData) {
      error = garminDataErrorHandler.handleMissingData(
        ['rawData'],
        options.selectedDate || new Date().toISOString().slice(0, 10),
        'transformGarminDataForSidebar'
      );
      
      const fallbackData = await garminSidebarDataTransformer.transformToSidebarData({}, options);
      return { data: fallbackData, error, warnings };
    }

    // Transformer les données
    const transformedData = await garminSidebarDataTransformer.transformToSidebarData(rawData, options);
    
    // Vérifier la qualité des données transformées
    const qualityCheck = checkDataQuality(transformedData);
    warnings.push(...qualityCheck.warnings);
    
    if (qualityCheck.hasErrors) {
      error = garminDataErrorHandler.createError(
        GarminErrorType.INVALID_FORMAT,
        'Données transformées de qualité insuffisante',
        GarminErrorCode.CORRUPTED_DATA,
        {
          issues: qualityCheck.issues,
          suggestion: 'Resynchronisez vos données Garmin'
        }
      );
    }

    return { data: transformedData, error, warnings };

  } catch (transformError) {
    console.error('[transformGarminDataForSidebar] Erreur de transformation:', transformError);
    
    error = garminDataErrorHandler.handleSyncError(
      'transformation des données',
      transformError as Error,
      'transformGarminDataForSidebar'
    );

    // Créer des données de fallback
    const fallbackData = await garminSidebarDataTransformer.transformToSidebarData({}, options);
    return { data: fallbackData, error, warnings };
  }
}

/**
 * Vérifie la qualité des données transformées
 */
function checkDataQuality(data: GarminSidebarData): {
  hasErrors: boolean;
  warnings: string[];
  issues: string[];
} {
  const warnings: string[] = [];
  const issues: string[] = [];
  let hasErrors = false;

  // Vérifier les métriques de base
  if (!data.todayMetrics) {
    issues.push('Métriques quotidiennes manquantes');
    hasErrors = true;
  } else {
    // Vérifier la fréquence cardiaque
    const hr = data.todayMetrics.heartRate;
    if (!hr.resting && !hr.max && !hr.average) {
      warnings.push('Aucune donnée de fréquence cardiaque disponible');
    }

    // Vérifier les pas
    if (data.todayMetrics.steps === 0) {
      warnings.push('Aucun pas enregistré');
    }

    // Vérifier les calories
    if (data.todayMetrics.calories.total === 0) {
      warnings.push('Aucune calorie enregistrée');
    }
  }

  // Vérifier les données de série temporelle
  if (data.hasTimeSeriesData && data.heartRateTimeSeries.length === 0) {
    warnings.push('Série temporelle FC activée mais aucune donnée disponible');
  }

  // Vérifier les zones FC
  if (data.heartRateZones.length === 0) {
    warnings.push('Aucune zone de fréquence cardiaque générée');
  }

  return { hasErrors, warnings, issues };
}

/**
 * Optimise les données pour l'affichage sidebar
 * @param data - Données Garmin sidebar
 * @param maxPoints - Nombre maximum de points pour la série temporelle
 * @returns Données optimisées
 */
export function optimizeForSidebar(
  data: GarminSidebarData,
  maxPoints: number = 100
): GarminSidebarData {
  const optimized = { ...data };

  // Optimiser la série temporelle
  if (optimized.heartRateTimeSeries.length > maxPoints) {
    const step = Math.ceil(optimized.heartRateTimeSeries.length / maxPoints);
    optimized.heartRateTimeSeries = optimized.heartRateTimeSeries.filter(
      (_, index) => index % step === 0
    );
  }

  // Limiter les zones FC aux plus importantes
  if (optimized.heartRateZones.length > 5) {
    optimized.heartRateZones = optimized.heartRateZones
      .sort((a, b) => b.timeInZone - a.timeInZone)
      .slice(0, 5);
  }

  // Limiter les phases de sommeil
  if (optimized.sleepPhases && optimized.sleepPhases.length > 4) {
    optimized.sleepPhases = optimized.sleepPhases
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 4);
  }

  // Limiter les niveaux de stress
  if (optimized.stressLevels && optimized.stressLevels.length > 8) {
    const step = Math.ceil(optimized.stressLevels.length / 8);
    optimized.stressLevels = optimized.stressLevels.filter(
      (_, index) => index % step === 0
    );
  }

  optimized.optimizedForSidebar = true;
  return optimized;
}

/**
 * Vérifie si les données sont suffisantes pour afficher le graphique FC
 * @param data - Données Garmin sidebar
 * @returns True si les données sont suffisantes
 */
export function hasEnoughDataForChart(data: GarminSidebarData): boolean {
  // Vérifier les données de série temporelle
  if (data.hasTimeSeriesData && data.heartRateTimeSeries.length >= 3) {
    return true;
  }

  // Vérifier les métriques de base
  const hr = data.todayMetrics.heartRate;
  if (hr.resting || hr.max || hr.average) {
    return true;
  }

  // Vérifier les zones FC
  if (data.heartRateZones.length > 0) {
    return data.heartRateZones.some(zone => zone.timeInZone > 0);
  }

  return false;
}

/**
 * Génère un message d'état pour l'utilisateur
 * @param data - Données Garmin sidebar
 * @param error - Erreur éventuelle
 * @returns Message d'état
 */
export function generateStatusMessage(
  data: GarminSidebarData,
  error: GarminDataError | null
): {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
} {
  // Erreur critique
  if (error && !data.hasData) {
    return {
      type: 'error',
      message: garminDataErrorHandler.getUserFriendlyErrorMessage(error.type),
      suggestion: garminDataErrorHandler.suggestRecoveryAction(error)
    };
  }

  // Données partielles avec erreur
  if (error && data.hasData) {
    return {
      type: 'warning',
      message: 'Données partielles disponibles',
      suggestion: 'Certaines données sont manquantes. ' + garminDataErrorHandler.suggestRecoveryAction(error)
    };
  }

  // Pas de données FC
  if (!hasEnoughDataForChart(data)) {
    return {
      type: 'info',
      message: 'Aucune donnée de fréquence cardiaque',
      suggestion: 'Portez votre montre Garmin et synchronisez vos données'
    };
  }

  // Données limitées
  if (data.heartRateTimeSeries.length < 10 && data.heartRateTimeSeries.length > 0) {
    return {
      type: 'warning',
      message: 'Données de fréquence cardiaque limitées',
      suggestion: 'Portez votre montre plus régulièrement pour plus de détails'
    };
  }

  // Tout va bien
  return {
    type: 'success',
    message: `Données FC disponibles (${data.heartRateTimeSeries.length} points)`
  };
}

/**
 * Calcule les statistiques de qualité des données
 * @param data - Données Garmin sidebar
 * @returns Statistiques de qualité
 */
export function calculateDataQualityScore(data: GarminSidebarData): {
  score: number; // 0-100
  breakdown: {
    heartRate: number;
    timeSeries: number;
    zones: number;
    completeness: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  let heartRateScore = 0;
  let timeSeriesScore = 0;
  let zonesScore = 0;
  let completenessScore = 0;

  // Score fréquence cardiaque (0-25 points)
  const hr = data.todayMetrics.heartRate;
  if (hr.resting) heartRateScore += 8;
  if (hr.max) heartRateScore += 8;
  if (hr.average) heartRateScore += 9;

  // Score série temporelle (0-35 points)
  if (data.hasTimeSeriesData) {
    const pointsCount = data.heartRateTimeSeries.length;
    if (pointsCount >= 100) timeSeriesScore = 35;
    else if (pointsCount >= 50) timeSeriesScore = 25;
    else if (pointsCount >= 20) timeSeriesScore = 15;
    else if (pointsCount >= 5) timeSeriesScore = 10;
    else if (pointsCount > 0) timeSeriesScore = 5;
  }

  // Score zones FC (0-20 points)
  const activeZones = data.heartRateZones.filter(zone => zone.timeInZone > 0);
  zonesScore = Math.min(20, activeZones.length * 4);

  // Score complétude (0-20 points)
  let completenessFactors = 0;
  if (data.todayMetrics.steps > 0) completenessFactors += 4;
  if (data.todayMetrics.calories.total > 0) completenessFactors += 4;
  if (data.todayMetrics.bodyBattery !== null) completenessFactors += 4;
  if (data.todayMetrics.sleep) completenessFactors += 4;
  if (data.todayMetrics.stress.average !== null) completenessFactors += 4;
  completenessScore = completenessFactors;

  const totalScore = heartRateScore + timeSeriesScore + zonesScore + completenessScore;

  // Déterminer la note
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 85) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';
  else grade = 'F';

  return {
    score: totalScore,
    breakdown: {
      heartRate: heartRateScore,
      timeSeries: timeSeriesScore,
      zones: zonesScore,
      completeness: completenessScore
    },
    grade
  };
}

/**
 * Formate une durée en texte lisible
 * @param seconds - Durée en secondes
 * @returns Texte formaté
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`;
  }
}

/**
 * Formate un pourcentage
 * @param value - Valeur à formater
 * @param total - Total pour le calcul du pourcentage
 * @returns Pourcentage formaté
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = Math.round((value / total) * 100);
  return `${percentage}%`;
}

/**
 * Détermine la couleur d'une zone FC basée sur l'intensité
 * @param zone - Numéro de zone (1-5)
 * @returns Couleur hexadécimale
 */
export function getHeartRateZoneColor(zone: number): string {
  const colors = {
    1: '#4ade80', // Vert - Récupération
    2: '#22d3ee', // Cyan - Aérobie léger
    3: '#fbbf24', // Jaune - Aérobie
    4: '#f97316', // Orange - Seuil
    5: '#ef4444'  // Rouge - Neuromusculaire
  };
  
  return colors[zone as keyof typeof colors] || '#6b7280';
}

/**
 * Détermine si une date est aujourd'hui
 * @param dateString - Date au format YYYY-MM-DD
 * @returns True si c'est aujourd'hui
 */
export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateString === today;
}

/**
 * Formate une date pour l'affichage
 * @param dateString - Date au format YYYY-MM-DD
 * @returns Date formatée
 */
export function formatDisplayDate(dateString: string): string {
  if (isToday(dateString)) {
    return "Aujourd'hui";
  }
  
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === yesterday.toISOString().slice(0, 10)) {
    return 'Hier';
  }
  
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}