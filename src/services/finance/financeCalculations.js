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

// Cache simple pour memoization (calculs élémentaires)
const calculationCache = new Map();
const CACHE_MAX_SIZE = 1000;

// ✅ OPTIMISATION Phase 1.2 : Cache par position pour calculs batch
// Structure: Map<positionId, { calculs, hash, timestamp, totalPortfolio }>
const positionCalculationsCache = new Map();
const POSITION_CACHE_MAX_SIZE = 500; // Limite cache positions
const POSITION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL pour cache position

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
 * Générer hash pour détecter changements d'une position
 * Hash basé sur les champs qui affectent les calculs
 */
function generatePositionHash(position) {
  const prixActuel = position.yahooData?.prixActuel || position.prixEntree;
  const ma50 = position.yahooData?.ma50 || null;
  const ma200 = position.yahooData?.ma200 || null;
  
  // Hash basé sur les inputs qui affectent les calculs
  const hashInput = JSON.stringify({
    id: position.id,
    quantite: position.quantite,
    prixEntree: position.prixEntree,
    prixActuel: prixActuel,
    ma50: ma50,
    ma200: ma200
  });
  
  // Hash simple mais efficace (FNV-1a inspired)
  let hash = 2166136261;
  for (let i = 0; i < hashInput.length; i++) {
    hash ^= hashInput.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  return hash >>> 0; // Convertir en unsigned 32-bit
}

/**
 * Calculer métriques pour une seule position
 * Fonction pure, réutilisable et testable
 */
function calculatePositionMetrics(position, totalPortfolio) {
  // Déterminer le prix actuel
  // Priorité: yahooData.prixActuel si disponible et valide (> 0 et différent de prixEntree)
  // Si prixActuel === prixEntree, cela peut indiquer des données non rafraîchies
  let prixActuel;
  
  if (position.yahooData?.prixActuel !== undefined && 
      position.yahooData?.prixActuel !== null && 
      position.yahooData?.prixActuel > 0) {
    prixActuel = position.yahooData.prixActuel;
  } else {
    // Si yahooData n'existe pas ou prixActuel n'est pas valide, utiliser prixEntree
    // Cela donnera une plus-value de 0 temporairement jusqu'à ce que les données soient chargées
    prixActuel = position.prixEntree;
  }
  
  const valeurPosition = calculatePositionValue(position.quantite, prixActuel);
  
  // Calculer plus-value
  const plusValueEuro = calculateGainLoss(position.prixEntree, prixActuel, position.quantite);
  const plusValuePourcent = position.prixEntree > 0 
    ? ((prixActuel - position.prixEntree) / position.prixEntree) * 100
    : 0;
  
  const poidsPortfolio = calculatePortfolioWeight(valeurPosition, totalPortfolio);
  
  // Signal technique (basique pour l'instant)
  const signal = position.yahooData?.ma50 && position.yahooData?.ma200
    ? detectTechnicalSignals(
        prixActuel,
        position.yahooData.ma50,
        position.yahooData.ma200
      )
    : { signal: 'NEUTRE', confidence: 0 };
  
  return {
    valeurPosition,
    plusValueEuro,
    plusValuePourcent: Math.round(plusValuePourcent * 100) / 100,
    poidsPortfolio,
    signal
  };
}

/**
 * Calculer total portfolio de manière optimisée
 * Utilise cache si toutes les positions sont en cache et valides
 */
function calculateTotalPortfolio(positions, useCache = true) {
  if (!positions || positions.length === 0) return 0;
  
  // Si toutes positions en cache et valides, utiliser cache total
  if (useCache) {
    let allCached = true;
    let cachedTotal = 0;
    const now = Date.now();
    
    for (const pos of positions) {
      const cached = positionCalculationsCache.get(pos.id);
      if (!cached || (now - cached.timestamp) > POSITION_CACHE_TTL) {
        allCached = false;
        break;
      }
      cachedTotal += cached.calculs.valeurPosition;
    }
    
    if (allCached) {
      return cachedTotal;
    }
  }
  
  // Calculer total normalement
  return positions.reduce((sum, pos) => {
    const prixActuel = pos.yahooData?.prixActuel || pos.prixEntree;
    return sum + calculatePositionValue(pos.quantite, prixActuel);
  }, 0);
}

/**
 * Calcul batch optimisé avec cache incrémental par position
 * 
 * ✅ OPTIMISATION Phase 1.2 : Calcul incrémental avec cache par position
 * - Ne recalcule que les positions qui ont changé
 * - Cache par position ID avec hash de détection
 * - Réutilisation calculs inchangés
 * - Gestion TTL et taille cache (LRU)
 * 
 * @param {Array} positions - Liste des positions du portfolio
 * @param {Object} options - Options de calcul
 * @param {boolean} options.forceRecalculate - Forcer recalcul même si cache valide (défaut: false)
 * @returns {Array} Positions avec calculs mis à jour
 */
export function calculateBatchMetrics(positions, options = {}) {
  if (!positions || positions.length === 0) {
    return [];
  }

  const { forceRecalculate = false } = options;
  const now = Date.now();
  
  // Calculer total portfolio d'abord (nécessaire pour poidsPortfolio)
  // Utiliser cache si possible pour éviter recalcul complet
  const totalPortfolio = calculateTotalPortfolio(positions, !forceRecalculate);
  
  // Séparer positions à recalculer vs positions en cache valides
  const positionsToRecalculate = [];
  const cachedPositions = [];
  
  for (const pos of positions) {
    if (!pos.id) {
      // Position sans ID (nouvelle), toujours recalculer
      positionsToRecalculate.push(pos);
      continue;
    }
    
    if (forceRecalculate) {
      positionsToRecalculate.push(pos);
      continue;
    }
    
    // Vérifier cache
    const cached = positionCalculationsCache.get(pos.id);
    if (cached) {
      // Vérifier TTL
      const age = now - cached.timestamp;
      if (age < POSITION_CACHE_TTL) {
        // Vérifier hash pour détecter changements
        const currentHash = generatePositionHash(pos);
        if (cached.hash === currentHash && cached.totalPortfolio === totalPortfolio) {
          // Cache valide, réutiliser
          cachedPositions.push({
            ...pos,
            calculs: cached.calculs
          });
          continue;
        }
      }
    }
    
    // Cache invalide ou position changée, recalculer
    positionsToRecalculate.push(pos);
  }
  
  // Recalculer seulement positions qui ont changé
  const recalculated = positionsToRecalculate.map(pos => {
    const calculs = calculatePositionMetrics(pos, totalPortfolio);
    const hash = generatePositionHash(pos);
    
    // Mettre en cache
    if (pos.id) {
      // Gestion taille cache (LRU simple)
      if (positionCalculationsCache.size >= POSITION_CACHE_MAX_SIZE) {
        // Supprimer entrée la plus ancienne
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, value] of positionCalculationsCache.entries()) {
          if (value.timestamp < oldestTime) {
            oldestTime = value.timestamp;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          positionCalculationsCache.delete(oldestKey);
        }
      }
      
      positionCalculationsCache.set(pos.id, {
        calculs,
        hash,
        timestamp: now,
        totalPortfolio
      });
    }
    
    return {
      ...pos,
      calculs
    };
  });
  
  // Combiner positions recalculées et positions en cache
  const result = [...recalculated, ...cachedPositions];
  
  // S'assurer que l'ordre est préservé (important pour UI)
  // Créer map pour lookup rapide
  const resultMap = new Map(result.map(pos => [pos.id || pos.ticker, pos]));
  return positions.map(pos => {
    const id = pos.id || pos.ticker;
    return resultMap.get(id) || pos;
  });
}

/**
 * Invalider cache pour une position spécifique
 * Utile quand position modifiée manuellement
 */
export function invalidatePositionCache(positionId) {
  if (positionId) {
    positionCalculationsCache.delete(positionId);
  }
}

/**
 * Nettoyer cache positions expirées
 * Utile pour maintenance périodique
 */
export function cleanupExpiredPositionCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [id, cached] of positionCalculationsCache.entries()) {
    if (now - cached.timestamp > POSITION_CACHE_TTL) {
      positionCalculationsCache.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Obtenir statistiques du cache positions
 * Utile pour debugging et monitoring
 */
export function getPositionCacheStats() {
  const now = Date.now();
  let valid = 0;
  let expired = 0;
  
  for (const cached of positionCalculationsCache.values()) {
    if (now - cached.timestamp < POSITION_CACHE_TTL) {
      valid++;
    } else {
      expired++;
    }
  }
  
  return {
    total: positionCalculationsCache.size,
    valid,
    expired,
    maxSize: POSITION_CACHE_MAX_SIZE,
    ttl: POSITION_CACHE_TTL
  };
}

/**
 * Calculer statistiques de prix depuis date achat et sur période
 * 
 * ✅ OPTIMISATION Phase 1.4 : Fonction pour modal détail action
 * - Calcule plus haut/bas depuis date achat
 * - Calcule plus haut/bas sur période (52 semaines par défaut)
 * - Gestion robuste des dates et données manquantes
 * 
 * @param {Array} historicalData - Données historiques [{ date, close, ... }]
 * @param {string|Date} dateAchat - Date d'achat de la position
 * @param {number} periodWeeks - Période en semaines (défaut: 52)
 * @returns {Object|null} { highSincePurchase, lowSincePurchase, high52Weeks, low52Weeks, currentPrice }
 */
export function calculatePriceStats(historicalData, dateAchat, periodWeeks = 52) {
  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  const dateAchatObj = dateAchat instanceof Date ? dateAchat : new Date(dateAchat);
  
  // Filtrer données depuis date achat
  const dataSincePurchase = historicalData.filter(d => {
    const dataDate = new Date(d.date);
    return dataDate >= dateAchatObj;
  });

  // Calculer plus haut/bas depuis achat
  const pricesSincePurchase = dataSincePurchase.map(d => d.close || d.prixActuel || 0).filter(p => p > 0);
  const highSincePurchase = pricesSincePurchase.length > 0 
    ? Math.max(...pricesSincePurchase) 
    : null;
  const lowSincePurchase = pricesSincePurchase.length > 0 
    ? Math.min(...pricesSincePurchase) 
    : null;

  // Calculer période (par défaut 52 semaines)
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - (periodWeeks * 7));

  const dataPeriod = historicalData.filter(d => {
    const dataDate = new Date(d.date);
    return dataDate >= periodStart;
  });

  const pricesPeriod = dataPeriod.map(d => d.close || d.prixActuel || 0).filter(p => p > 0);
  const high52Weeks = pricesPeriod.length > 0 ? Math.max(...pricesPeriod) : null;
  const low52Weeks = pricesPeriod.length > 0 ? Math.min(...pricesPeriod) : null;

  // Prix actuel (dernière donnée disponible)
  const currentPrice = historicalData.length > 0 
    ? (historicalData[historicalData.length - 1].close || historicalData[historicalData.length - 1].prixActuel || null)
    : null;

  return {
    highSincePurchase,
    lowSincePurchase,
    high52Weeks,
    low52Weeks,
    currentPrice
  };
}

