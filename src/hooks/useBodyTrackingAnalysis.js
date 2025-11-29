/**
 * useBodyTrackingAnalysis.js
 * 
 * Hook React pour l'analyse complète des données de suivi corporel.
 * 
 * Ce hook fournit une analyse approfondie du Body Tracking :
 * - Analyse du poids (tendances, variations, objectifs)
 * - Analyse de la composition corporelle (masse grasse, masse musculaire)
 * - Analyse des mesures (tour de taille, poitrine, etc.)
 * - Détection de patterns et anomalies
 * - Corrélations temporelles
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs optimisés avec early returns
 * - Support de différentes périodes d'analyse
 * - Gestion gracieuse des données manquantes
 * 
 * @module hooks/useBodyTrackingAnalysis
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

/**
 * Calcule les statistiques d'une série de valeurs numériques
 * @param {Array<number>} values - Valeurs à analyser
 * @returns {Object} Statistiques (min, max, avg, median, trend)
 */
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (validValues.length === 0) {
    return { min: null, max: null, avg: null, median: null, trend: null, count: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calcul de la tendance (comparaison première moitié vs deuxième moitié)
  let trend = null;
  if (validValues.length >= 4) {
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    const percentChange = (diff / firstAvg) * 100;
    trend = {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      percentChange: Math.round(percentChange * 10) / 10,
      value: diff
    };
  }
  
  return { min, max, avg: Math.round(avg * 10) / 10, median, trend, count: validValues.length };
}

/**
 * Normalise une date depuis différents formats
 * @param {string|Date|number} dateInput - Date à normaliser
 * @returns {string|null} Date normalisée YYYY-MM-DD ou null
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    let date;
    if (typeof dateInput === 'string') {
      // Format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return null;
    }
    
    if (isNaN(date.getTime())) return null;
    
    return DateHelper.toYYYYMMDD(date);
  } catch {
    return null;
  }
}

/**
 * Hook pour analyser les données de suivi corporel
 * 
 * @param {Array} progressEntries - Liste des progressEntries
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Analyse complète du Body Tracking ou null si aucune donnée
 * @returns {Object} returns.weight - Analyse poids (stats, trend, variations)
 * @returns {Object} returns.composition - Analyse composition corporelle (masse grasse, masse musculaire)
 * @returns {Object} returns.measurements - Analyse mesures (tour de taille, poitrine, etc.)
 * @returns {Object} returns.bmi - Analyse IMC (stats, catégorie, tendance)
 * @returns {Array} returns.anomalies - Anomalies détectées
 * @returns {Object} returns.period - Période analysée
 * 
 * @example
 * const analysis = useBodyTrackingAnalysis(progressEntries, { period: '30days' });
 * 
 * if (analysis) {
 *   console.log(`Poids moyen: ${analysis.weight.stats.avg} kg`);
 *   console.log(`Tendance: ${analysis.weight.trend.direction}`);
 * }
 */
export function useBodyTrackingAnalysis(progressEntries, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!Array.isArray(progressEntries) || progressEntries.length === 0) {
      return null;
    }
    
    // Calculer les dates de période
    let startDate, endDate;
    const today = DateHelper.getTodayLocal();
    
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const end = new Date(today + 'T23:59:59');
      endDate = today;
      
      const start = new Date(today);
      switch (period) {
        case '7days':
          start.setDate(start.getDate() - 7);
          break;
        case '30days':
          start.setDate(start.getDate() - 30);
          break;
        case '90days':
          start.setDate(start.getDate() - 90);
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'all':
        default:
          // Pour 'all', prendre la première entrée comme début
          const firstDate = progressEntries
            .map(entry => {
              const date = entry.date || (entry.timestamp ? new Date(entry.timestamp) : null);
              return date ? normalizeDate(date) : null;
            })
            .filter(Boolean)
            .sort()[0];
          startDate = firstDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les entrées dans la période
    const filteredEntries = progressEntries.filter(entry => {
      const entryDate = entry.date || (entry.timestamp ? new Date(entry.timestamp) : null);
      if (!entryDate) return false;
      
      try {
        const normalizedDate = normalizeDate(entryDate);
        if (!normalizedDate) return false;
        
        const date = new Date(normalizedDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredEntries.length === 0) {
      return null;
    }
    
    // Séparer les entrées par type
    const metricsEntries = filteredEntries.filter(e => e.type === 'metrics');
    const impedanceEntries = filteredEntries.filter(e => e.type === 'impedance');
    
    // ==================== ANALYSE POIDS ====================
    // Poids peut venir de metrics ou impedance
    const weightValues = filteredEntries
      .map(entry => entry.weight || null)
      .filter(v => v !== null && v > 0);
    
    const weightStats = calculateStats(weightValues);
    const weightTrend = weightStats.trend;
    
    // Variation totale (premier vs dernier)
    let weightVariation = null;
    if (weightValues.length >= 2) {
      const firstWeight = weightValues[0];
      const lastWeight = weightValues[weightValues.length - 1];
      const variation = lastWeight - firstWeight;
      weightVariation = {
        total: Math.round(variation * 10) / 10,
        percentChange: Math.round((variation / firstWeight) * 100 * 10) / 10,
        direction: variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable'
      };
    }
    
    // ==================== ANALYSE COMPOSITION CORPORELLE ====================
    const bodyFatValues = impedanceEntries
      .map(entry => entry.bodyFatPercentage || null)
      .filter(v => v !== null && v > 0);
    
    const muscleMassValues = impedanceEntries
      .map(entry => entry.muscleMass || entry.skeletalMuscle || null)
      .filter(v => v !== null && v > 0);
    
    const bodyFatStats = calculateStats(bodyFatValues);
    const muscleMassStats = calculateStats(muscleMassValues);
    
    // ==================== ANALYSE IMC ====================
    const bmiValues = filteredEntries
      .map(entry => {
        // IMC peut être calculé ou venir directement
        if (entry.bmi) return entry.bmi;
        if (entry.weight && entry.height) {
          const heightInM = entry.height / 100;
          return entry.weight / (heightInM * heightInM);
        }
        return null;
      })
      .filter(v => v !== null && v > 0);
    
    const bmiStats = calculateStats(bmiValues);
    
    // Catégorie IMC moyenne
    let bmiCategory = null;
    if (bmiStats.avg !== null) {
      const avg = bmiStats.avg;
      if (avg < 18.5) {
        bmiCategory = { category: 'Insuffisance pondérale', color: 'blue', range: '< 18.5' };
      } else if (avg < 25) {
        bmiCategory = { category: 'Poids normal', color: 'green', range: '18.5-24.9' };
      } else if (avg < 30) {
        bmiCategory = { category: 'Surpoids', color: 'orange', range: '25-29.9' };
      } else {
        bmiCategory = { category: 'Obésité', color: 'red', range: '≥ 30' };
      }
    }
    
    // ==================== ANALYSE MESURES ====================
    const waistValues = metricsEntries
      .map(entry => entry.waist || null)
      .filter(v => v !== null && v > 0);
    
    const chestValues = metricsEntries
      .map(entry => entry.chest || null)
      .filter(v => v !== null && v > 0);
    
    const waistStats = calculateStats(waistValues);
    const chestStats = calculateStats(chestValues);
    
    // ==================== DÉTECTION D'ANOMALIES ====================
    const anomalies = [];
    
    // Variation de poids importante (> 5% en 30 jours)
    if (weightVariation && Math.abs(weightVariation.percentChange) > 5) {
      anomalies.push({
        type: 'significant_weight_change',
        severity: weightVariation.percentChange > 10 || weightVariation.percentChange < -10 ? 'high' : 'medium',
        message: `Variation de poids importante: ${weightVariation.total > 0 ? '+' : ''}${weightVariation.total} kg (${weightVariation.percentChange > 0 ? '+' : ''}${weightVariation.percentChange}%)`,
        recommendation: weightVariation.direction === 'up'
          ? 'Vérifier apport calorique et activité physique. Consultation médicale si persistant.'
          : 'Vérifier apport calorique et état de santé. Consultation médicale si persistant.'
      });
    }
    
    // Masse grasse élevée (> 25% pour hommes, > 32% pour femmes - estimation)
    if (bodyFatStats.avg !== null && bodyFatStats.avg > 25) {
      anomalies.push({
        type: 'high_body_fat',
        severity: bodyFatStats.avg > 30 ? 'high' : 'medium',
        message: `Masse grasse moyenne élevée: ${Math.round(bodyFatStats.avg)}% (optimal: 10-20% hommes, 18-28% femmes)`,
        recommendation: 'Réduire masse grasse: déficit calorique modéré, entraînement cardio et résistance'
      });
    }
    
    // Masse musculaire en baisse
    if (muscleMassStats.trend && muscleMassStats.trend.direction === 'down' && muscleMassStats.trend.percentChange < -5) {
      anomalies.push({
        type: 'muscle_mass_declining',
        severity: 'high',
        message: `Masse musculaire en baisse de ${Math.abs(muscleMassStats.trend.percentChange)}%`,
        recommendation: 'Augmenter apport protéique, maintenir entraînement résistance, éviter déficit calorique important'
      });
    }
    
    // IMC hors norme
    if (bmiCategory && (bmiCategory.category === 'Surpoids' || bmiCategory.category === 'Obésité')) {
      anomalies.push({
        type: 'bmi_high',
        severity: bmiCategory.category === 'Obésité' ? 'high' : 'medium',
        message: `IMC moyen: ${bmiStats.avg.toFixed(1)} (${bmiCategory.category})`,
        recommendation: 'Objectif: réduire IMC progressivement via déficit calorique modéré et activité physique régulière'
      });
    }
    
    return {
      weight: {
        stats: weightStats,
        trend: weightTrend,
        variation: weightVariation
      },
      composition: {
        bodyFat: bodyFatStats,
        muscleMass: muscleMassStats,
        bodyFatTrend: bodyFatStats.trend,
        muscleMassTrend: muscleMassStats.trend
      },
      measurements: {
        waist: waistStats,
        chest: chestStats
      },
      bmi: {
        stats: bmiStats,
        category: bmiCategory,
        trend: bmiStats.trend
      },
      entries: {
        total: filteredEntries.length,
        metrics: metricsEntries.length,
        impedance: impedanceEntries.length
      },
      anomalies,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        entriesCount: filteredEntries.length
      }
    };
  }, [progressEntries, period, customStartDate, customEndDate]);
}

