/**
 * Service de recommandations IA pour le portfolio
 * Analyse multi-critères : Momentum, Fondamentaux, Technique, Sectoriel
 */

import logger from '../../utils/logger';

const log = logger.module('financeRecommendations');

class RecommendationEngine {
  constructor() {
    this.weights = {
      momentum: 0.25,
      fundamentals: 0.30,
      technical: 0.25,
      sectorial: 0.20
    };
  }

  /**
   * Générer recommandation globale pour une position
   */
  generateRecommendation(position, portfolio, historicalData = []) {
    try {
      const momentum = this.analyzeMomentum(position);
      const fundamentals = this.analyzeFundamentals(position);
      const technical = this.analyzeTechnical(position, historicalData);
      const sectorial = this.analyzeSectorial(position, portfolio);

      // Score global pondéré
      const globalScore =
        momentum.score * this.weights.momentum +
        fundamentals.score * this.weights.fundamentals +
        technical.score * this.weights.technical +
        sectorial.score * this.weights.sectorial;

      // Confiance globale
      const globalConfidence = (
        momentum.confidence * this.weights.momentum +
        fundamentals.confidence * this.weights.fundamentals +
        technical.confidence * this.weights.technical +
        sectorial.confidence * this.weights.sectorial
      );

      // Générer recommandation
      let recommendation = 'CONSERVER';
      let priority = 'normal';
      let reasoning = [];

      // Logique décisionnelle
      if (globalScore >= 75 && (position.calculs?.plusValuePourcent || 0) < 20) {
        recommendation = 'RENFORCER_POSITION';
        priority = 'high';
        reasoning.push('Tous signaux positifs, position sous-exposée');
      } else if ((position.calculs?.plusValuePourcent || 0) > 20 && globalScore < 50) {
        recommendation = 'PRENDRE_PROFITS';
        priority = 'high';
        reasoning.push('Gains importants + signaux baissiers');
      } else if (globalScore < 40) {
        recommendation = 'SURVEILLANCE';
        priority = 'high';
        reasoning.push('Signaux négatifs multiples');
      } else if (globalScore >= 60 && globalScore < 75) {
        recommendation = 'CONSERVER';
        priority = 'normal';
        reasoning.push('Tendance stable, performance correcte');
      } else {
        recommendation = 'REÉVALUER';
        priority = 'normal';
        reasoning.push('Signaux mixtes, nécessite analyse approfondie');
      }

      return {
        recommendation,
        priority,
        globalScore: Math.round(globalScore),
        globalConfidence: Math.round(globalConfidence * 100),
        reasoning,
        details: {
          momentum,
          fundamentals,
          technical,
          sectorial
        }
      };
    } catch (error) {
      log.error('Error generating recommendation:', error);
      return {
        recommendation: 'NEUTRE',
        priority: 'low',
        globalScore: 50,
        globalConfidence: 0,
        reasoning: ['Erreur dans le calcul'],
        details: {}
      };
    }
  }

  /**
   * Analyse Momentum
   */
  analyzeMomentum(position) {
    const { prixActuel, ma20, ma50, ma200, volume } = position.yahooData || {};
    const { prixEntree } = position;

    if (!prixActuel) {
      return { score: 50, confidence: 0, signals: [] };
    }

    let score = 50; // Base neutre
    let signals = [];

    // Prix vs MA (40% du score momentum)
    if (ma50 && ma200) {
      if (prixActuel > ma50 && ma50 > ma200) {
        score += 30;
        signals.push('Uptrend');
      } else if (prixActuel < ma50 && ma50 < ma200) {
        score -= 30;
        signals.push('Downtrend');
      }
    }

    // Volume (30% du score momentum) - Simplifié
    if (volume && volume > 0) {
      signals.push('Volume disponible');
      score += 10;
    }

    // Performance vs prix achat (30% du score momentum)
    if (prixEntree) {
      const performance = ((prixActuel - prixEntree) / prixEntree) * 100;
      if (performance > 10) {
        score += 20;
        signals.push('Performance positive');
      } else if (performance < -10) {
        score -= 20;
        signals.push('Performance négative');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: signals.length > 0 ? 0.7 : 0.3
    };
  }

  /**
   * Analyse Fondamentaux
   */
  analyzeFundamentals(position) {
    const { peRatio, dividendYield, capitalisation } = position.yahooData || {};

    let score = 50; // Base neutre
    let signals = [];

    // P/E Ratio (40% du score fondamental) - Simplifié
    if (peRatio) {
      if (peRatio < 15) {
        score += 20;
        signals.push('P/E attractif');
      } else if (peRatio > 30) {
        score -= 20;
        signals.push('P/E élevé');
      }
    }

    // Dividend Yield (30% du score fondamental)
    if (dividendYield && dividendYield > 3) {
      score += 15;
      signals.push('Dividende attractif');
    }

    // Market Cap (30% du score fondamental)
    if (capitalisation && capitalisation > 100000000000) {
      score += 15;
      signals.push('Large cap');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: 0.6
    };
  }

  /**
   * Analyse Technique avec RSI, MACD, Bollinger
   */
  analyzeTechnical(position, historicalData = []) {
    const { prixActuel, ma20, ma50, ma200 } = position.yahooData || {};

    if (!prixActuel) {
      return { score: 50, confidence: 0, signals: [] };
    }

    let score = 50;
    let signals = [];

    // Position vs MA (40% du score technique)
    if (ma50 && ma200) {
      if (prixActuel > ma50 && ma50 > ma200) {
        score += 20;
        signals.push('Positionnement technique positif');
      } else if (prixActuel < ma50 && ma50 < ma200) {
        score -= 20;
        signals.push('Positionnement technique négatif');
      }
    }

    // RSI (30% du score technique)
    if (historicalData && historicalData.length >= 15) {
      const { calculateRSI } = require('./financeCalculations');
      const rsi = calculateRSI(historicalData, 14);
      
      if (rsi < 30) {
        score += 15; // Survente = opportunité
        signals.push('RSI survente');
      } else if (rsi > 70) {
        score -= 15; // Surachat = danger
        signals.push('RSI surachat');
      } else if (rsi >= 40 && rsi <= 60) {
        score += 5; // Zone neutre saine
        signals.push('RSI neutre');
      }
    }

    // MACD (20% du score technique)
    if (historicalData && historicalData.length >= 35) {
      const { calculateMACD } = require('./financeCalculations');
      const macd = calculateMACD(historicalData);
      
      if (macd.histogram > 0 && macd.signal && macd.macd > macd.signal) {
        score += 10;
        signals.push('MACD haussier');
      } else if (macd.histogram < 0 && macd.signal && macd.macd < macd.signal) {
        score -= 10;
        signals.push('MACD baissier');
      }
    }

    // Bollinger Bands (10% du score technique)
    if (historicalData && historicalData.length >= 20) {
      const { calculateBollingerBands } = require('./financeCalculations');
      const bb = calculateBollingerBands(historicalData, 20, 2);
      
      if (bb.lower && prixActuel < bb.lower) {
        score += 5; // Sous bande inférieure = opportunité
        signals.push('Sous Bollinger inférieure');
      } else if (bb.upper && prixActuel > bb.upper) {
        score -= 5; // Au-dessus bande supérieure = danger
        signals.push('Au-dessus Bollinger supérieure');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: historicalData.length > 0 ? 0.85 : 0.5
    };
  }

  /**
   * Analyse Sectorielle
   */
  analyzeSectorial(position, portfolio) {
    // Pour l'instant, analyse simplifiée
    // Plus tard, comparer avec performance secteur moyen

    let score = 50;
    let signals = [];

    // Si position performe bien vs portfolio moyen
    const portfolioAvg = portfolio.reduce((sum, p) => 
      sum + (p.calculs?.plusValuePourcent || 0), 0
    ) / portfolio.length;

    const positionPerformance = position.calculs?.plusValuePourcent || 0;

    if (positionPerformance > portfolioAvg + 5) {
      score += 20;
      signals.push('Surperformance vs portfolio');
    } else if (positionPerformance < portfolioAvg - 5) {
      score -= 20;
      signals.push('Sous-performance vs portfolio');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: 0.5
    };
  }

  /**
   * Calculer RSI (utilise fonction du service calculs)
   */
  calculateRSI(historicalData, period = 14) {
    // Import dynamique pour éviter dépendance circulaire
    const { calculateRSI: calcRSI } = require('./financeCalculations');
    return calcRSI(historicalData, period);
  }
}

export const recommendationEngine = new RecommendationEngine();

