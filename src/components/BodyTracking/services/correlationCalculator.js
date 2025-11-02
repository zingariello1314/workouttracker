/**
 * Service de Calcul de Corrélations
 * 
 * Calcule corrélations entre volume d'entraînement et métriques photos
 * - Corrélation Pearson
 * - Régression linéaire multiple
 * - Détection impacts exercices par muscle
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Section Corrélations
 */

import logger from '../../../utils/logger';

const log = logger.module('CorrelationCalculator');

/**
 * Mappage exercices → groupes musculaires
 * Basé sur l'anatomie et la biomécanique
 * Enrichi avec les exercices du workoutProgram réel
 */
const EXERCISE_TO_MUSCLES = {
  // Pectoraux
  'pompes': ['pectoraux', 'deltoides', 'triceps'],
  'pompes_diamant': ['pectoraux', 'triceps'],
  'pompes_serrees': ['pectoraux', 'deltoides'],
  'pompes_serrées': ['pectoraux', 'deltoides'],
  'pompes_diamant_lentes': ['pectoraux', 'triceps'],
  'pompes_lestees': ['pectoraux', 'deltoides', 'triceps'],
  'pompes_lestées': ['pectoraux', 'deltoides', 'triceps'],
  'pompes_inclinees': ['pectoraux', 'deltoides'],
  'pompes_inclinées': ['pectoraux', 'deltoides'],
  'pompes_declinees': ['pectoraux', 'deltoides', 'triceps'],
  'pompes_déclinées': ['pectoraux', 'deltoides', 'triceps'],
  'pompes_pseudo_planche': ['pectoraux', 'deltoides'],
  'pompes_sur_poignees': ['pectoraux', 'triceps'],
  'dips': ['pectoraux', 'triceps', 'deltoides'],
  'dips_paralleles': ['pectoraux', 'triceps', 'deltoides'],
  
  // Dos
  'tractions': ['dorsaux', 'biceps', 'deltoides'],
  'tractions_pronation': ['dorsaux', 'biceps', 'deltoides'],
  'tractions_australiennes': ['dorsaux', 'biceps', 'deltoides'],
  'tractions_prises_serrees': ['dorsaux', 'biceps'],
  'tractions_prises_larges': ['dorsaux', 'deltoides'],
  'rows': ['dorsaux', 'biceps'],
  
  // Épaules
  'pompes_pike': ['deltoides', 'triceps'],
  'developpe_militaire': ['deltoides', 'triceps'],
  'développé_militaire': ['deltoides', 'triceps'],
  'developpe_militaire_unilateral': ['deltoides'],
  'elevations_laterales': ['deltoides'],
  'élévations_latérales': ['deltoides'],
  'oiseaux': ['deltoides'],
  'face_pull': ['deltoides', 'dorsaux'],
  
  // Biceps
  'curl': ['biceps'],
  'curl_alterne': ['biceps'],
  'curl_marteau': ['biceps'],
  'curl_zottman': ['biceps'],
  'chin_ups': ['biceps', 'dorsaux'],
  
  // Triceps
  'extensions_triceps': ['triceps'],
  'extensions_triceps_unilaterales': ['triceps'],
  'kickbacks_triceps': ['triceps'],
  'pompes_diamant': ['triceps', 'pectoraux'],
  
  // Jambes
  'squats': ['quadriceps', 'fessiers'],
  'squats_sauts': ['quadriceps', 'mollets'],
  'lunges': ['quadriceps', 'fessiers'],
  'fentes': ['quadriceps', 'fessiers'],
  'calf_raises': ['mollets'],
  'releves_genoux': ['abdominaux', 'quadriceps'],
  'relevés_de_genoux': ['abdominaux', 'quadriceps'],
  
  // Abdos
  'crunches': ['abdominaux'],
  'crunchs': ['abdominaux'],
  'crunchs_inverses': ['abdominaux'],
  'planche': ['abdominaux', 'deltoides'],
  'planche_bras_tendus': ['abdominaux', 'deltoides'],
  'mountain_climbers': ['abdominaux'],
  'jambes_tendues_retroversees': ['abdominaux'],
  'gainage_lateral': ['abdominaux'],
  'vacuum': ['abdominaux'],
  
  // Mapping par ID numérique du programme (workoutProgram.js)
  // Lundi (101-114)
  '101': ['dorsaux', 'biceps', 'deltoides'], // Tractions pronation
  '102': ['dorsaux', 'biceps', 'deltoides'], // Tractions australiennes
  '103': ['pectoraux', 'triceps', 'deltoides'], // Dips parallèles
  '104': ['pectoraux', 'deltoides'], // Pompes inclinées pieds sur banc
  '105': ['pectoraux', 'deltoides'], // Pompes inclinées mains sur banc
  '106': ['abdominaux', 'quadriceps'], // Relevés de genoux à la barre
  '107': ['abdominaux', 'quadriceps'], // Relevés de genoux aux parallèles
  
  // Mardi (201-207)
  '201': ['pectoraux', 'deltoides', 'triceps'], // Pompes lestées
  '202': ['pectoraux', 'deltoides'], // Pompes inclinées sur support
  '203': ['biceps'], // Curl alterné
  '204': ['biceps'], // Curl marteau
  '205': ['biceps'], // Curl Zottman
  '206': ['pectoraux', 'triceps'], // Pompes serrées diamant
  
  // Mercredi (301-311)
  '301': ['pectoraux', 'deltoides', 'triceps'], // Pompes déclinées
  '302': ['pectoraux', 'deltoides'], // Pompes pseudo-planche
  '303': ['deltoides', 'triceps'], // Développé militaire unilatéral
  '304': ['deltoides'], // Élévations latérales
  '305': ['deltoides'], // Oiseaux
  '306': ['deltoides', 'dorsaux'], // Face pull
  '307': ['triceps'], // Extensions triceps unilatérales
  '308': ['triceps'], // Kickbacks triceps
  '309': ['triceps', 'pectoraux'], // Pompes diamant lentes
  '310': ['pectoraux', 'triceps'], // Pompes sur poignées tempo
  
  // Vendredi (401+)
  '401': ['quadriceps', 'fessiers'], // Squats (si présent)
  '402': ['quadriceps', 'fessiers'], // Lunges (si présent)
  
  // Samedi (501+)
  '501': ['quadriceps', 'mollets'], // Squats sauts (si présent)
};

/**
 * Normalise nom muscle (gérer variations)
 */
const normalizeMuscleName = (muscle) => {
  const mapping = {
    'pecs': 'pectoraux',
    'chest': 'pectoraux',
    'quads': 'quadriceps',
    'calves': 'mollets',
    'shoulders': 'deltoides',
    'lats': 'dorsaux',
    'back': 'dorsaux'
  };
  return mapping[muscle.toLowerCase()] || muscle.toLowerCase();
};

/**
 * Obtient muscles ciblés par exercice
 */
const getMusclesForExercise = (exerciseName, exerciseId = null) => {
  // Essayer par nom
  const nameKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  if (EXERCISE_TO_MUSCLES[nameKey]) {
    return EXERCISE_TO_MUSCLES[nameKey];
  }
  
  // Essayer par ID
  if (exerciseId && EXERCISE_TO_MUSCLES[exerciseId]) {
    return EXERCISE_TO_MUSCLES[exerciseId];
  }
  
  // Recherche partielle
  for (const [key, muscles] of Object.entries(EXERCISE_TO_MUSCLES)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return muscles;
    }
  }
  
  log.warn(`Muscles non trouvés pour exercice: ${exerciseName} (ID: ${exerciseId})`);
  return []; // Pas de mapping trouvé
};

/**
 * Calcule corrélation Pearson entre deux séries
 * @param {Array<number>} x - Série X
 * @param {Array<number>} y - Série Y
 * @returns {Object} {correlation, pValue, significance}
 */
const calculatePearsonCorrelation = (x, y) => {
  if (!x || !y || x.length !== y.length || x.length < 3) {
    return { correlation: 0, pValue: 1, significance: 'insufficient_data' };
  }

  const n = x.length;
  
  // Moyennes
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculs
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  
  if (denominator === 0) {
    return { correlation: 0, pValue: 1, significance: 'no_variance' };
  }

  const correlation = numerator / denominator;

  // Test de significativité (approximation t-test)
  const tStat = Math.abs(correlation) * Math.sqrt((n - 2) / (1 - correlation * correlation));
  const degreesOfFreedom = n - 2;
  
  // P-value approximative (pour df > 2)
  let pValue = 1;
  if (degreesOfFreedom > 0 && Math.abs(correlation) > 0.01) {
    // Approximation: t > 2 ≈ p < 0.05 (pour df > 10)
    if (tStat > 2.0) {
      pValue = 0.05;
    } else if (tStat > 1.96) {
      pValue = 0.10;
    } else {
      pValue = 0.50;
    }
  }

  const significance = pValue < 0.05 ? 'significant' : 
                      pValue < 0.10 ? 'marginally_significant' : 
                      'not_significant';

  return {
    correlation: Math.max(-1, Math.min(1, correlation)), // Clamp [-1, 1]
    pValue,
    significance,
    n: n
  };
};

/**
 * Calcule régression linéaire simple
 * @param {Array<number>} x - Variable indépendante
 * @param {Array<number>} y - Variable dépendante
 * @returns {Object} {slope, intercept, r2, equation}
 */
const calculateLinearRegression = (x, y) => {
  if (!x || !y || x.length !== y.length || x.length < 3) {
    return {
      slope: 0,
      intercept: 0,
      r2: 0,
      equation: 'y = 0',
      error: 'insufficient_data'
    };
  }

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominator += diffX * diffX;
    sumSqY += diffY * diffY;
  }

  if (denominator === 0) {
    return {
      slope: 0,
      intercept: meanY,
      r2: 0,
      equation: `y = ${meanY.toFixed(2)}`,
      error: 'no_variance_x'
    };
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calcul R²
  let ssRes = 0; // Sum of squares of residuals
  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssRes += Math.pow(y[i] - predicted, 2);
  }
  const r2 = sumSqY > 0 ? 1 - (ssRes / sumSqY) : 0;

  return {
    slope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)), // Clamp [0, 1]
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(2)}`,
    n
  };
};

/**
 * Aligne données temporelles (photos et entraînement)
 * @param {Array} photos - Photos analysées avec dates
 * @param {Array} workoutHistory - Historique entraînement
 * @returns {Array} Données alignées par période
 */
const alignTemporalData = (photos, workoutHistory) => {
  const aligned = [];

  photos.forEach(photo => {
    const photoDate = photo.date instanceof Date ? photo.date : new Date(photo.date);
    
    // Trouver période d'entraînement correspondante (7 jours avant photo)
    const periodStart = new Date(photoDate);
    periodStart.setDate(periodStart.getDate() - 7);
    
    // Agréger volume entraînement sur cette période
    const periodWorkouts = workoutHistory.filter(session => {
      const sessionDate = session.date instanceof Date ? session.date : new Date(session.date);
      return sessionDate >= periodStart && sessionDate <= photoDate;
    });

    // Calculer volume par exercice
    const exerciseVolumes = {};
    let totalVolume = 0;

    periodWorkouts.forEach(session => {
      (session.exercises || []).forEach(exercise => {
        const key = exercise.id || exercise.name;
        if (!exerciseVolumes[key]) {
          exerciseVolumes[key] = {
            name: exercise.name,
            id: exercise.id,
            totalReps: 0,
            sessions: 0
          };
        }
        exerciseVolumes[key].totalReps += exercise.reps || 0;
        exerciseVolumes[key].sessions += 1;
        totalVolume += exercise.reps || 0;
      });
    });

    aligned.push({
      photoDate: photoDate.toISOString(),
      photoMetrics: photo.metrics || {},
      photoSummary: photo.summary || {},
      exerciseVolumes,
      totalVolume,
      workoutsCount: periodWorkouts.length
    });
  });

  return aligned;
};

/**
 * Calcule corrélations pour un muscle spécifique
 * @param {Array} alignedData - Données alignées temporellement
 * @param {string} muscle - Nom muscle
 * @param {string} metric - Métrique ('volume', 'definition', etc.)
 * @returns {Object} Corrélations par exercice
 */
const calculateMuscleCorrelations = (alignedData, muscle, metric = 'volume') => {
  if (!alignedData || alignedData.length < 3) {
    return {
      error: 'insufficient_data',
      message: 'Minimum 3 photos nécessaires pour corrélations'
    };
  }

  const normalizedMuscle = normalizeMuscleName(muscle);
  const correlations = {};

  // Extraire métriques muscle
  const muscleMetrics = alignedData
    .map(item => {
      const metrics = item.photoMetrics[normalizedMuscle];
      if (!metrics || !metrics.success || !metrics.metrics) return null;
      return metrics.metrics[metric]?.score || 0;
    })
    .filter(val => val !== null && val !== undefined);

  if (muscleMetrics.length < 3) {
    return {
      error: 'insufficient_photos',
      message: `Pas assez de photos avec métrique ${metric} pour ${normalizedMuscle}`
    };
  }

  // Pour chaque exercice, calculer corrélation
  const allExercises = new Set();
  alignedData.forEach(item => {
    Object.keys(item.exerciseVolumes).forEach(exKey => {
      allExercises.add(exKey);
    });
  });

  allExercises.forEach(exKey => {
    const exerciseData = alignedData[0].exerciseVolumes[exKey];
    if (!exerciseData) return;

    const muscles = getMusclesForExercise(exerciseData.name, exerciseData.id);
    
    // Vérifier si exercice cible ce muscle
    if (!muscles.includes(normalizedMuscle)) {
      return; // Ignorer si pas de lien direct
    }

    // Extraire volumes exercice (alignés avec dates photos)
    const exerciseVolumes = alignedData.map(item => {
      const exData = item.exerciseVolumes[exKey];
      return exData ? exData.totalReps : 0;
    });

    // Calculer corrélation
    const correlation = calculatePearsonCorrelation(exerciseVolumes, muscleMetrics);
    const regression = calculateLinearRegression(exerciseVolumes, muscleMetrics);

    correlations[exKey] = {
      exerciseName: exerciseData.name,
      exerciseId: exerciseData.id,
      correlation: correlation.correlation,
      pValue: correlation.pValue,
      significance: correlation.significance,
      regression: {
        slope: regression.slope,
        r2: regression.r2,
        equation: regression.equation
      },
      impact: Math.abs(correlation.correlation) * (correlation.significance === 'significant' ? 1.5 : 1.0),
      dataPoints: correlation.n,
      avgVolume: exerciseVolumes.reduce((sum, v) => sum + v, 0) / exerciseVolumes.length
    };
  });

  // Trier par impact
  const sortedCorrelations = Object.entries(correlations)
    .sort((a, b) => b[1].impact - a[1].impact)
    .map(([key, value]) => ({ exerciseKey: key, ...value }));

  return {
    muscle: normalizedMuscle,
    metric,
    correlations: sortedCorrelations,
    totalExercises: sortedCorrelations.length,
    significantCount: sortedCorrelations.filter(c => c.significance === 'significant').length
  };
};

/**
 * Calcule corrélations globales pour tous muscles
 * @param {Array} photos - Photos analysées
 * @param {Array} workoutHistory - Historique entraînement
 * @returns {Object} Corrélations complètes
 */
export const calculateGlobalCorrelations = (photos, workoutHistory) => {
  try {
    if (!photos || photos.length < 3) {
      return {
        error: 'insufficient_photos',
        message: 'Minimum 3 photos analysées nécessaires'
      };
    }

    if (!workoutHistory || workoutHistory.length === 0) {
      return {
        error: 'no_workout_data',
        message: 'Aucune donnée d\'entraînement disponible'
      };
    }

    // Aligner données temporelles
    const alignedData = alignTemporalData(photos, workoutHistory);

    if (alignedData.length < 3) {
      return {
        error: 'insufficient_aligned_data',
        message: 'Pas assez de données alignées temporellement'
      };
    }

    // Extraire tous muscles disponibles
    const allMuscles = new Set();
    alignedData.forEach(item => {
      Object.keys(item.photoMetrics || {}).forEach(muscle => {
        if (item.photoMetrics[muscle]?.success) {
          allMuscles.add(normalizeMuscleName(muscle));
        }
      });
    });

    // Calculer corrélations par muscle
    const muscleCorrelations = {};
    const metrics = ['volume', 'definition', 'symmetry'];

    Array.from(allMuscles).forEach(muscle => {
      muscleCorrelations[muscle] = {};
      
      metrics.forEach(metric => {
        const result = calculateMuscleCorrelations(alignedData, muscle, metric);
        if (!result.error) {
          muscleCorrelations[muscle][metric] = result;
        }
      });
    });

    return {
      success: true,
      muscleCorrelations,
      totalPhotos: photos.length,
      totalWorkouts: workoutHistory.length,
      alignedDataPoints: alignedData.length,
      musclesAnalyzed: Array.from(allMuscles)
    };
  } catch (error) {
    log.error('Erreur calcul corrélations globales', error);
    return {
      error: 'calculation_error',
      message: error.message
    };
  }
};

/**
 * Calcule corrélation pour un muscle et métrique spécifiques
 * @param {Array} photos - Photos analysées
 * @param {Array} workoutHistory - Historique entraînement
 * @param {string} muscle - Nom muscle
 * @param {string} metric - Métrique
 * @returns {Object} Résultat corrélations
 */
export const calculateMuscleMetricCorrelations = (photos, workoutHistory, muscle, metric) => {
  try {
    const alignedData = alignTemporalData(photos, workoutHistory);
    return calculateMuscleCorrelations(alignedData, muscle, metric);
  } catch (error) {
    log.error('Erreur calcul corrélations muscle/métrique', error);
    return {
      error: 'calculation_error',
      message: error.message
    };
  }
};

// Export fonctions utilitaires pour tests
export {
  calculatePearsonCorrelation,
  calculateLinearRegression,
  alignTemporalData,
  getMusclesForExercise,
  normalizeMuscleName
};

