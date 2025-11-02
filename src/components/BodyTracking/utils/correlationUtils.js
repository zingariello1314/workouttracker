/**
 * Utilitaires pour le calcul de corrélations statistiques
 * Implémentation du coefficient de corrélation de Pearson
 */

/**
 * Calcule le coefficient de corrélation de Pearson entre deux séries de données
 * @param {number[]} x - Première série de valeurs
 * @param {number[]} y - Deuxième série de valeurs
 * @returns {Object} { correlation: number, pValue: number, n: number }
 */
export const calculatePearsonCorrelation = (x, y) => {
  if (!x || !y || x.length !== y.length || x.length < 2) {
    return { correlation: null, pValue: null, n: 0 };
  }

  // Filtrer les paires valides (pas de null/undefined/NaN)
  const validPairs = [];
  for (let i = 0; i < x.length; i++) {
    if (
      x[i] != null && 
      !isNaN(x[i]) && 
      y[i] != null && 
      !isNaN(y[i]) &&
      isFinite(x[i]) &&
      isFinite(y[i])
    ) {
      validPairs.push({ x: x[i], y: y[i] });
    }
  }

  const n = validPairs.length;
  if (n < 2) {
    return { correlation: null, pValue: null, n: 0 };
  }

  // Calculer les moyennes
  const meanX = validPairs.reduce((sum, pair) => sum + pair.x, 0) / n;
  const meanY = validPairs.reduce((sum, pair) => sum + pair.y, 0) / n;

  // Calculer les sommes pour la formule de Pearson
  let sumXY = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (const pair of validPairs) {
    const diffX = pair.x - meanX;
    const diffY = pair.y - meanY;
    sumXY += diffX * diffY;
    sumXSquared += diffX * diffX;
    sumYSquared += diffY * diffY;
  }

  // Éviter division par zéro
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  if (denominator === 0) {
    return { correlation: null, pValue: null, n };
  }

  // Coefficient de corrélation de Pearson
  const correlation = sumXY / denominator;

  // Calcul approximatif de la p-value (test de significativité)
  // Utilise la transformation de Fisher pour obtenir une approximation
  const pValue = calculatePValue(correlation, n);

  return {
    correlation: isFinite(correlation) ? correlation : null,
    pValue,
    n
  };
};

/**
 * Calcule une approximation de la p-value pour une corrélation
 * Utilise la transformation de Fisher et une approximation normale
 * @param {number} r - Coefficient de corrélation
 * @param {number} n - Nombre de points de données
 * @returns {number} p-value approximative
 */
const calculatePValue = (r, n) => {
  if (n < 3 || Math.abs(r) >= 1) {
    return null;
  }

  // Transformation de Fisher
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  
  // Erreur standard de la transformation de Fisher
  const se = 1 / Math.sqrt(n - 3);
  
  // Statistique t approximative (sous H0: r = 0)
  const t = Math.abs(z) / se;
  
  // Approximation de la p-value (distribution t avec n-2 degrés de liberté)
  // Pour des échantillons moyens à grands (n > 30), on peut utiliser l'approximation normale
  if (n > 30) {
    // Approximation normale standard
    const pValue = 2 * (1 - normalCDF(Math.abs(t)));
    return Math.max(0.0001, Math.min(0.9999, pValue)); // Limiter entre 0.0001 et 0.9999
  } else {
    // Approximation plus simple pour petits échantillons
    // Utilise une approximation de la distribution t
    const df = n - 2;
    const tApprox = Math.abs(r) * Math.sqrt(df / (1 - r * r));
    const pValue = approximateTPValue(tApprox, df);
    return Math.max(0.0001, Math.min(0.9999, pValue));
  }
};

/**
 * Approximation de la fonction de répartition normale standard (CDF)
 * @param {number} z - Score z
 * @returns {number} Probabilité cumulée
 */
const normalCDF = (z) => {
  // Approximation de la CDF normale avec formule d'Abramowitz et Stegun
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
};

/**
 * Approximation simplifiée de la p-value pour distribution t
 * @param {number} t - Statistique t
 * @param {number} df - Degrés de liberté
 * @returns {number} p-value approximative
 */
const approximateTPValue = (t, df) => {
  // Approximation simple pour distribution t
  // Pour df > 30, approche de la normale
  if (df > 30) {
    return 2 * (1 - normalCDF(t));
  }
  
  // Pour petits df, approximation basique
  // Cette approximation est moins précise mais suffisante pour l'affichage
  const threshold = [2.576, 2.807, 3.291, 3.662, 4.032]; // Pour df = 1, 2, 3, 4, 5
  const idx = Math.min(df - 1, threshold.length - 1);
  
  if (t > threshold[idx]) {
    return 0.01;
  } else if (t > 2) {
    return 0.05;
  } else {
    return 0.10;
  }
};

/**
 * Détermine la force d'une corrélation
 * @param {number} correlation - Coefficient de corrélation
 * @returns {string} 'strong' | 'moderate' | 'weak'
 */
export const getCorrelationStrength = (correlation) => {
  if (correlation == null || isNaN(correlation)) {
    return 'weak';
  }
  const abs = Math.abs(correlation);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.3) return 'moderate';
  return 'weak';
};

/**
 * Génère une description de la corrélation
 * @param {string} var1 - Nom de la première variable
 * @param {string} var2 - Nom de la deuxième variable
 * @param {number} correlation - Coefficient de corrélation
 * @param {string} strength - Force de la corrélation
 * @param {string} direction - Direction ('positive' | 'negative')
 * @returns {string} Description textuelle
 */
export const generateCorrelationDescription = (var1, var2, correlation, strength, direction) => {
  const absCorr = Math.abs(correlation);
  const strengthText = strength === 'strong' ? 'forte' : strength === 'moderate' ? 'modérée' : 'faible';
  const directionText = direction === 'positive' ? 'positive' : 'négative';
  
  return `${strengthText.charAt(0).toUpperCase() + strengthText.slice(1)} corrélation ${directionText} entre ${var1} et ${var2}`;
};

/**
 * Aligne deux séries de données par date
 * Retourne les valeurs alignées pour les dates communes
 * @param {Array} entries1 - Première série avec { date, value }
 * @param {Array} entries2 - Deuxième série avec { date, value }
 * @returns {Object} { x: number[], y: number[], dates: string[] }
 */
export const alignDataByDate = (entries1, entries2) => {
  const dateMap1 = new Map();
  const dateMap2 = new Map();

  // Créer des maps date -> value pour accès O(1)
  entries1.forEach(entry => {
    const dateKey = entry.date instanceof Date 
      ? entry.date.toISOString().split('T')[0]
      : (typeof entry.date === 'string' ? entry.date.split('T')[0] : null);
    if (dateKey && entry.value != null && !isNaN(entry.value)) {
      dateMap1.set(dateKey, entry.value);
    }
  });

  entries2.forEach(entry => {
    const dateKey = entry.date instanceof Date 
      ? entry.date.toISOString().split('T')[0]
      : (typeof entry.date === 'string' ? entry.date.split('T')[0] : null);
    if (dateKey && entry.value != null && !isNaN(entry.value)) {
      dateMap2.set(dateKey, entry.value);
    }
  });

  // Trouver les dates communes
  const commonDates = [];
  const x = [];
  const y = [];

  dateMap1.forEach((value, dateKey) => {
    if (dateMap2.has(dateKey)) {
      commonDates.push(dateKey);
      x.push(value);
      y.push(dateMap2.get(dateKey));
    }
  });

  return { x, y, dates: commonDates };
};

