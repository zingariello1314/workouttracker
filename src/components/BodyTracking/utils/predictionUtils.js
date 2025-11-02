/**
 * Utilitaires pour les prédictions et projections basées sur régression linéaire
 */

/**
 * Calcule une régression linéaire simple (moindres carrés)
 * @param {Array} dataPoints - Array de { x: number, y: number } ou [{ value, date }, ...]
 * @returns {Object} { slope: number, intercept: number, r2: number, stdError: number }
 */
export const calculateLinearRegression = (dataPoints) => {
  if (!dataPoints || dataPoints.length < 2) {
    return { slope: 0, intercept: 0, r2: 0, stdError: 0, dataPoints: 0 };
  }

  // Normaliser les données : convertir en [{ x, y }]
  const normalized = dataPoints.map((point, index) => {
    if (point.x != null && point.y != null) {
      return { x: point.x, y: point.y };
    } else if (point.value != null) {
      // Si on a value et date, utiliser index comme x
      return { x: index, y: point.value };
    } else {
      return { x: index, y: 0 };
    }
  }).filter(p => p.y != null && !isNaN(p.y) && isFinite(p.y));

  if (normalized.length < 2) {
    return { slope: 0, intercept: 0, r2: 0, stdError: 0, dataPoints: 0 };
  }

  const n = normalized.length;
  const sumX = normalized.reduce((sum, p) => sum + p.x, 0);
  const sumY = normalized.reduce((sum, p) => sum + p.y, 0);
  const sumXY = normalized.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = normalized.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  
  if (Math.abs(denominator) < 1e-10) {
    return { slope: 0, intercept: sumY / n, r2: 0, stdError: 0, dataPoints: n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calcul du coefficient de détermination R²
  const yMean = sumY / n;
  const ssRes = normalized.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);
  const ssTot = normalized.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));

  // Erreur standard de régression
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)), stdError, dataPoints: n };
};

/**
 * Calcule la moyenne mobile simple sur une période
 * @param {Array} values - Array de valeurs numériques
 * @param {number} period - Période de la moyenne mobile
 * @returns {Array} Valeurs de la moyenne mobile
 */
export const calculateMovingAverage = (values, period = 3) => {
  if (!values || values.length < period) {
    return values;
  }

  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null); // Pas assez de données pour cette position
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const sum = slice.reduce((s, v) => s + (v || 0), 0);
      result.push(sum / period);
    }
  }
  return result;
};

/**
 * Calcule la tendance mensuelle moyenne à partir de données historiques
 * @param {Array} entries - Entrées de progression avec { date, value }
 * @returns {number} Tendance mensuelle (changement moyen par mois)
 */
export const calculateMonthlyTrend = (entries) => {
  if (!entries || entries.length < 2) {
    return 0;
  }

  // Trier par date (plus ancien en premier)
  const sorted = [...entries]
    .filter(e => e.date && e.value != null && !isNaN(e.value))
    .map(e => ({
      date: e.date instanceof Date ? e.date : new Date(e.date),
      value: parseFloat(e.value)
    }))
    .sort((a, b) => a.date - b.date);

  if (sorted.length < 2) {
    return 0;
  }

  // Calculer la durée totale en mois
  const firstDate = sorted[0].date;
  const lastDate = sorted[sorted.length - 1].date;
  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  const monthsDiff = daysDiff / 30.44; // Nombre moyen de jours par mois

  if (monthsDiff <= 0) {
    return 0;
  }

  // Changement total
  const valueChange = sorted[sorted.length - 1].value - sorted[0].value;

  // Tendance mensuelle
  return valueChange / monthsDiff;
};

/**
 * Prédit une valeur future basée sur la régression linéaire
 * @param {Object} regression - Résultat de calculateLinearRegression
 * @param {number} stepsForward - Nombre d'étapes à prédire
 * @param {Object} options - { confidenceLevel: 'low'|'medium'|'high', lastX: number }
 * @returns {Object} { predicted: number, confidenceInterval: { lower, upper }, accuracy: number }
 */
export const predictValue = (regression, stepsForward, options = {}) => {
  const { confidenceLevel = 'medium', lastX = 0 } = options;

  if (regression.dataPoints < 2) {
    return {
      predicted: null,
      confidenceInterval: { lower: null, upper: null },
      accuracy: 0
    };
  }

  // Prédiction basée sur la régression
  const futureX = lastX + stepsForward;
  const predicted = regression.slope * futureX + regression.intercept;

  // Calcul de l'intervalle de confiance basé sur l'erreur standard
  const confidenceMultipliers = {
    low: 0.5,
    medium: 0.3,
    high: 0.15
  };

  const multiplier = confidenceMultipliers[confidenceLevel] || 0.3;
  
  // Marge d'erreur basée sur l'erreur standard et le R²
  // Plus le R² est faible, plus l'incertitude est grande
  const uncertaintyFactor = Math.sqrt(1 - regression.r2);
  const margin = regression.stdError * multiplier * (1 + uncertaintyFactor);

  // Calcul de la précision basée sur R² et nombre de points
  const r2Weight = regression.r2 * 100;
  const dataPointsWeight = Math.min(100, (regression.dataPoints / 10) * 10);
  const accuracy = Math.min(95, Math.max(30, (r2Weight * 0.7 + dataPointsWeight * 0.3)));

  return {
    predicted,
    confidenceInterval: {
      lower: predicted - margin,
      upper: predicted + margin
    },
    accuracy: Math.round(accuracy)
  };
};

/**
 * Évalue la qualité des données pour les prédictions
 * @param {Array} entries - Entrées historiques
 * @param {number} minRequired - Nombre minimum de points requis
 * @returns {Object} { quality: string, score: number, factors: string[] }
 */
export const evaluateDataQuality = (entries, minRequired = 5) => {
  if (!entries || entries.length < minRequired) {
    return {
      quality: 'Insuffisante',
      score: 0,
      factors: [`Moins de ${minRequired} points de données disponibles`]
    };
  }

  const factors = [];
  let score = 0;

  // Nombre de points de données (max 40 points)
  const dataPointScore = Math.min(40, entries.length * 2);
  score += dataPointScore;
  if (entries.length >= 10) {
    factors.push(`${entries.length} points de données disponibles`);
  }

  // Régularité (écart-type des intervalles entre mesures)
  const dates = entries
    .map(e => e.date instanceof Date ? e.date : new Date(e.date))
    .sort((a, b) => a - b);

  if (dates.length >= 2) {
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    
    const meanInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
    const variance = intervals.reduce((sum, d) => sum + Math.pow(d - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const regularity = stdDev / meanInterval; // Coefficient de variation

    const regularityScore = Math.max(0, 30 - (regularity * 30));
    score += regularityScore;
    
    if (regularity < 0.3) {
      factors.push('Mesures régulières');
    } else if (regularity < 0.6) {
      factors.push('Mesures moyennement régulières');
    } else {
      factors.push('Mesures irrégulières');
    }
  }

  // Qualité globale
  let quality;
  if (score >= 60) {
    quality = 'Excellente';
  } else if (score >= 40) {
    quality = 'Bonne';
  } else if (score >= 20) {
    quality = 'Moyenne';
  } else {
    quality = 'Faible';
  }

  return { quality, score: Math.round(score), factors };
};

/**
 * Génère des scénarios de prédiction (optimiste, réaliste, conservateur)
 * @param {number} basePrediction - Prédiction de base
 * @param {number} baseChange - Changement prévu
 * @param {number} volatility - Volatilité des données (écart-type relatif)
 * @returns {Array} Scénarios avec { name, multiplier, probability, predictedValue, change }
 */
export const generateScenarios = (basePrediction, baseChange, volatility = 0) => {
  const scenarios = [
    {
      name: 'Optimiste',
      description: 'Si vous maintenez vos efforts actuels et les optimisez',
      multiplier: 1.0 + (volatility * 0.3), // Amplifie légèrement la tendance
      probability: Math.max(20, 30 - Math.abs(baseChange) * 5), // Plus probable si changement significatif
      color: 'text-green-400',
      bgColor: 'bg-green-600/20'
    },
    {
      name: 'Réaliste',
      description: 'Basé sur votre tendance actuelle',
      multiplier: 1.0,
      probability: Math.max(40, 50 - Math.abs(baseChange) * 2),
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20'
    },
    {
      name: 'Conservateur',
      description: 'Si vous ralentissez légèrement vos efforts',
      multiplier: 1.0 - (volatility * 0.3), // Réduit la tendance
      probability: Math.max(20, 30 - Math.abs(baseChange) * 3),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20'
    }
  ];

  // Normaliser les probabilités pour qu'elles totalisent 100%
  const totalProb = scenarios.reduce((sum, s) => sum + s.probability, 0);
  scenarios.forEach(s => {
    s.probability = Math.round((s.probability / totalProb) * 100);
  });

  return scenarios.map(scenario => ({
    ...scenario,
    predictedValue: basePrediction + (baseChange * (scenario.multiplier - 1)),
    change: baseChange * scenario.multiplier
  }));
};

