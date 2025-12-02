/**
 * Service de calculs financiers pour le portfolio
 * Optimisé avec memoization et validation
 */

import { z } from 'zod';

// Schémas validation
const positionSchema = z.object({
  quantite: z.number().positive().finite(),
  prixEntree: z.number().positive().max(1000000),
  yahooData: z.object({
    prixActuel: z.number().positive().finite()
  }).optional()
});

// Cache simple pour memoization
const calculationCache = new Map();
const CACHE_MAX_SIZE = 1000;

/**
 * Calculer valorisation position avec validation
 */
export function calculatePositionValue(quantite, prixActuel) {
  if (!Number.isFinite(quantite) || !Number.isFinite(prixActuel)) {
    throw new Error('Invalid input: quantite and prixActuel must be finite numbers');
  }
  
  const cacheKey = `${quantite}_${prixActuel}`;
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }
  
  const result = quantite * prixActuel;
  
  // Vérifier overflow
  if (!Number.isFinite(result)) {
    throw new Error('Calculation overflow');
  }
  
  const rounded = Math.round(result * 100) / 100; // Arrondi 2 décimales
  
  // Gestion taille cache (LRU)
  if (calculationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  calculationCache.set(cacheKey, rounded);
  return rounded;
}

/**
 * Calculer plus-value avec gestion cas limites
 */
export function calculateGainLoss(prixAchat, prixActuel, quantite) {
  try {
    const validated = positionSchema.parse({
      quantite,
      prixEntree: prixAchat,
      yahooData: { prixActuel }
    });
    
    const gainLoss = (validated.yahooData.prixActuel - validated.prixEntree) * validated.quantite;
    return Math.round(gainLoss * 100) / 100;
  } catch (error) {
    // Fallback si validation échoue
    const gainLoss = (prixActuel - prixAchat) * quantite;
    return Math.round(gainLoss * 100) / 100;
  }
}

/**
 * Calculer poids portfolio avec normalisation
 */
export function calculatePortfolioWeight(valeurPosition, totalPortfolio) {
  if (totalPortfolio === 0) return 0;
  
  const weight = (valeurPosition / totalPortfolio) * 100;
  return Math.round(weight * 100) / 100; // 2 décimales
}

/**
 * Calculer moyennes mobiles optimisé (algorithme incrémental)
 */
export function calculateMovingAverages(historicalData, periods) {
  if (!historicalData || historicalData.length < periods) {
    return { ma: null, data: [] };
  }
  
  // Trier par date (plus ancien → plus récent)
  const sorted = [...historicalData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  const maValues = [];
  
  // Calcul initial (première fenêtre)
  let sum = sorted.slice(0, periods).reduce((acc, d) => acc + (d.close || d.prixActuel || 0), 0);
  maValues.push({
    date: sorted[periods - 1].date,
    value: sum / periods
  });
  
  // Calcul incrémental (O(n) au lieu de O(n²))
  for (let i = periods; i < sorted.length; i++) {
    sum = sum - (sorted[i - periods].close || sorted[i - periods].prixActuel || 0) + (sorted[i].close || sorted[i].prixActuel || 0);
    maValues.push({
      date: sorted[i].date,
      value: sum / periods
    });
  }
  
  return {
    ma: maValues[maValues.length - 1]?.value || null,
    data: maValues
  };
}

/**
 * Calculer RSI (Relative Strength Index)
 */
export function calculateRSI(historicalData, period = 14) {
  if (!historicalData || historicalData.length < period + 1) {
    return 50; // Neutre si pas assez de données
  }
  
  const sorted = [...historicalData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  let gains = 0;
  let losses = 0;
  
  // Calculer gains et pertes sur la période
  for (let i = sorted.length - period; i < sorted.length; i++) {
    const current = sorted[i].close || sorted[i].prixActuel || 0;
    const previous = sorted[i - 1]?.close || sorted[i - 1]?.prixActuel || current;
    const change = current - previous;
    
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100; // Tous gains
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculer MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(historicalData) {
  if (!historicalData || historicalData.length < 26) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const sorted = [...historicalData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  const closes = sorted.map(d => d.close || d.prixActuel || 0);
  
  // EMA 12
  const ema12 = calculateEMA(closes, 12);
  
  // EMA 26
  const ema26 = calculateEMA(closes, 26);
  
  if (ema12.length === 0 || ema26.length === 0) {
    return { macd: null, signal: null, histogram: null };
  }
  
  // MACD line = EMA12 - EMA26
  const macdLine = [];
  const startIndex = Math.max(ema12.length - ema26.length, 0);
  
  for (let i = 0; i < ema26.length; i++) {
    const ema12Index = startIndex + i;
    if (ema12Index < ema12.length) {
      macdLine.push(ema12[ema12Index] - ema26[i]);
    }
  }
  
  if (macdLine.length < 9) {
    return { macd: macdLine[macdLine.length - 1] || null, signal: null, histogram: null };
  }
  
  // Signal line = EMA 9 de la ligne MACD
  const signalLine = calculateEMA(macdLine, 9);
  const signal = signalLine[signalLine.length - 1] || null;
  const macd = macdLine[macdLine.length - 1] || null;
  
  // Histogram = MACD - Signal
  const histogram = macd !== null && signal !== null ? macd - signal : null;
  
  return { macd, signal, histogram };
}

/**
 * Calculer EMA (Exponential Moving Average)
 */
function calculateEMA(data, period) {
  if (data.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema = [];
  
  // Premier EMA = SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // EMA suivants
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

/**
 * Calculer Bollinger Bands
 */
export function calculateBollingerBands(historicalData, period = 20, stdDev = 2) {
  if (!historicalData || historicalData.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const sorted = [...historicalData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  const recent = sorted.slice(-period);
  const closes = recent.map(d => d.close || d.prixActuel || 0);
  
  // SMA (middle band)
  const sma = closes.reduce((sum, c) => sum + c, 0) / period;
  
  // Écart-type
  const variance = closes.reduce((sum, c) => sum + Math.pow(c - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * standardDeviation),
    middle: sma,
    lower: sma - (stdDev * standardDeviation)
  };
}

/**
 * Détecter signaux techniques avec confiance
 */
export function detectTechnicalSignals(prix, ma50, ma200, previousPrix = null) {
  if (!ma50 || !ma200) {
    return { signal: 'NEUTRE', confidence: 0, reason: 'Données insuffisantes' };
  }
  
  const signals = [];
  let confidence = 0;
  
  // Signal Achat : Prix > MA50 > MA200
  if (prix > ma50 && ma50 > ma200) {
    signals.push('ACHAT');
    confidence += 40;
    
    // Bonus confiance si momentum positif
    if (previousPrix && prix > previousPrix) {
      confidence += 20;
    }
  }
  
  // Signal Vente : Prix < MA50 < MA200
  if (prix < ma50 && ma50 < ma200) {
    signals.push('VENTE');
    confidence += 40;
    
    // Bonus confiance si momentum négatif
    if (previousPrix && prix < previousPrix) {
      confidence += 20;
    }
  }
  
  if (signals.length === 0) {
    return { signal: 'NEUTRE', confidence: 50, reason: 'Prix entre les MA' };
  }
  
  return {
    signal: signals[0],
    confidence: Math.min(confidence, 100),
    reason: signals.join(' + ')
  };
}

/**
 * Calcul batch optimisé
 */
export function calculateBatchMetrics(positions) {
  // Calculer total portfolio d'abord
  const totalPortfolio = positions.reduce((sum, pos) => {
    const prixActuel = pos.yahooData?.prixActuel || pos.prixEntree;
    return sum + calculatePositionValue(pos.quantite, prixActuel);
  }, 0);
  
  return positions.map(pos => {
    const prixActuel = pos.yahooData?.prixActuel || pos.prixEntree;
    const valeurPosition = calculatePositionValue(pos.quantite, prixActuel);
    
    const plusValueEuro = calculateGainLoss(pos.prixEntree, prixActuel, pos.quantite);
    const plusValuePourcent = pos.prixEntree > 0 
      ? ((prixActuel - pos.prixEntree) / pos.prixEntree) * 100
      : 0;
    
    const poidsPortfolio = calculatePortfolioWeight(valeurPosition, totalPortfolio);
    
    // Signal technique (basique pour l'instant)
    const signal = pos.yahooData?.ma50 && pos.yahooData?.ma200
      ? detectTechnicalSignals(
          prixActuel,
          pos.yahooData.ma50,
          pos.yahooData.ma200
        )
      : { signal: 'NEUTRE', confidence: 0 };
    
    return {
      ...pos,
      calculs: {
        valeurPosition,
        plusValueEuro,
        plusValuePourcent: Math.round(plusValuePourcent * 100) / 100,
        poidsPortfolio,
        signal
      }
    };
  });
}

