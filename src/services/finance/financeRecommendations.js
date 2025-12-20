/**
 * Service de recommandations IA pour le portfolio
 * Analyse multi-critères : Momentum, Fondamentaux, Technique, Sectoriel
 * 
 * ✅ PHASE 4 - Étape 4.5 : Validation données recommandations
 * - Validation robuste des données requises avant calculs
 * - Ajustement scores et confiance selon disponibilité données
 * - Gestion gracieuse des données manquantes
 * 
 * @module services/finance/financeRecommendations
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 25
 */

import logger from '../../utils/logger';
// ✅ PHASE 3 - Étape 3.17 : Imports statiques pour éviter require dynamique
import { 
  calculateRSI as calcRSI, 
  calculateMACD, 
  calculateBollingerBands 
} from './financeCalculations';

const log = logger.module('financeRecommendations');

/**
 * @typedef {Object} AnalysisResult
 * @property {number} score - Score d'analyse (0-100)
 * @property {number} confidence - Niveau de confiance (0-1)
 * @property {Array<string>} signals - Liste des signaux détectés
 * @property {Array<string>} [missingData] - Données manquantes (optionnel)
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Si les données sont valides pour l'analyse
 * @property {Array<string>} missingFields - Champs manquants
 * @property {number} completeness - Pourcentage de complétude (0-1)
 */

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
   * Valider données requises pour analyse momentum
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @returns {ValidationResult} Résultat de validation
   * @private
   */
  validateMomentumData(position) {
    const { prixActuel, ma50, ma200, volume } = position.yahooData || {};
    const { prixEntree } = position;
    
    const requiredFields = ['prixActuel', 'prixEntree'];
    const optionalFields = ['ma50', 'ma200', 'volume'];
    
    const missingRequired = requiredFields.filter(field => {
      if (field === 'prixActuel') return !prixActuel || prixActuel <= 0;
      if (field === 'prixEntree') return !prixEntree || prixEntree <= 0;
      return false;
    });
    
    const missingOptional = optionalFields.filter(field => {
      if (field === 'ma50') return !ma50 || ma50 <= 0;
      if (field === 'ma200') return !ma200 || ma200 <= 0;
      if (field === 'volume') return !volume || volume <= 0;
      return false;
    });
    
    const totalFields = requiredFields.length + optionalFields.length;
    const availableFields = totalFields - missingRequired.length - missingOptional.length;
    const completeness = availableFields / totalFields;
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: [...missingRequired, ...missingOptional],
      missingRequired,
      missingOptional,
      completeness
    };
  }

  /**
   * Valider données requises pour analyse fondamentaux
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @returns {ValidationResult} Résultat de validation
   * @private
   */
  validateFundamentalsData(position) {
    const { peRatio, dividendYield, capitalisation } = position.yahooData || {};
    
    // Tous les champs sont optionnels pour fondamentaux
    const optionalFields = ['peRatio', 'dividendYield', 'capitalisation'];
    
    const missingOptional = optionalFields.filter(field => {
      if (field === 'peRatio') return peRatio === undefined || peRatio === null || peRatio <= 0;
      if (field === 'dividendYield') return dividendYield === undefined || dividendYield === null || dividendYield < 0;
      if (field === 'capitalisation') return capitalisation === undefined || capitalisation === null || capitalisation <= 0;
      return false;
    });
    
    const totalFields = optionalFields.length;
    const availableFields = totalFields - missingOptional.length;
    const completeness = availableFields / totalFields;
    
    return {
      isValid: true, // Toujours valide car tous optionnels
      missingFields: missingOptional,
      missingRequired: [],
      missingOptional,
      completeness
    };
  }

  /**
   * Valider données requises pour analyse technique
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @param {Array} historicalData - Données historiques
   * @returns {ValidationResult} Résultat de validation
   * @private
   */
  validateTechnicalData(position, historicalData = []) {
    const { prixActuel, ma50, ma200 } = position.yahooData || {};
    
    const requiredFields = ['prixActuel'];
    const optionalFields = ['ma50', 'ma200', 'historicalData'];
    
    const missingRequired = requiredFields.filter(field => {
      if (field === 'prixActuel') return !prixActuel || prixActuel <= 0;
      return false;
    });
    
    const missingOptional = optionalFields.filter(field => {
      if (field === 'ma50') return !ma50 || ma50 <= 0;
      if (field === 'ma200') return !ma200 || ma200 <= 0;
      if (field === 'historicalData') return !historicalData || !Array.isArray(historicalData) || historicalData.length < 15;
      return false;
    });
    
    const totalFields = requiredFields.length + optionalFields.length;
    const availableFields = totalFields - missingRequired.length - missingOptional.length;
    const completeness = availableFields / totalFields;
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: [...missingRequired, ...missingOptional],
      missingRequired,
      missingOptional,
      completeness,
      hasHistoricalData: historicalData && Array.isArray(historicalData) && historicalData.length >= 15,
      historicalDataLength: historicalData?.length || 0
    };
  }

  /**
   * Valider données requises pour analyse sectorielle
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @param {Array} portfolio - Portfolio complet
   * @returns {ValidationResult} Résultat de validation
   * @private
   */
  validateSectorialData(position, portfolio = []) {
    const requiredFields = ['portfolio', 'calculs'];
    
    const missingRequired = [];
    
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      missingRequired.push('portfolio');
    }
    
    if (!position.calculs || position.calculs.plusValuePourcent === undefined) {
      missingRequired.push('calculs');
    }
    
    const completeness = missingRequired.length === 0 ? 1 : 0.5;
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: missingRequired,
      missingRequired,
      missingOptional: [],
      completeness,
      portfolioSize: portfolio?.length || 0
    };
  }

  /**
   * Générer recommandation globale pour une position
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @param {Array} portfolio - Portfolio complet
   * @param {Array} [historicalData=[]] - Données historiques pour indicateurs techniques
   * @returns {Object} Recommandation avec score, confiance et raisonnement
   */
  generateRecommendation(position, portfolio, historicalData = []) {
    try {
      // ✅ PHASE 4.5 : Valider données avant calculs
      const momentum = this.analyzeMomentum(position);
      const fundamentals = this.analyzeFundamentals(position);
      const technical = this.analyzeTechnical(position, historicalData);
      const sectorial = this.analyzeSectorial(position, portfolio);

      // ✅ PHASE 4.5 : Ajuster poids selon disponibilité données
      // Si une analyse a une confiance très faible, réduire son poids
      const adjustedWeights = {
        momentum: momentum.confidence > 0.3 ? this.weights.momentum : this.weights.momentum * 0.5,
        fundamentals: fundamentals.confidence > 0.3 ? this.weights.fundamentals : this.weights.fundamentals * 0.5,
        technical: technical.confidence > 0.3 ? this.weights.technical : this.weights.technical * 0.5,
        sectorial: sectorial.confidence > 0.3 ? this.weights.sectorial : this.weights.sectorial * 0.5
      };

      // Normaliser les poids ajustés
      const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
      const normalizedWeights = {
        momentum: adjustedWeights.momentum / totalWeight,
        fundamentals: adjustedWeights.fundamentals / totalWeight,
        technical: adjustedWeights.technical / totalWeight,
        sectorial: adjustedWeights.sectorial / totalWeight
      };

      // Score global pondéré avec poids ajustés
      const globalScore =
        momentum.score * normalizedWeights.momentum +
        fundamentals.score * normalizedWeights.fundamentals +
        technical.score * normalizedWeights.technical +
        sectorial.score * normalizedWeights.sectorial;

      // Confiance globale avec poids ajustés
      const globalConfidence = (
        momentum.confidence * normalizedWeights.momentum +
        fundamentals.confidence * normalizedWeights.fundamentals +
        technical.confidence * normalizedWeights.technical +
        sectorial.confidence * normalizedWeights.sectorial
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

      // ✅ PHASE 4.5 : Ajouter avertissement si données manquantes importantes
      const allMissingData = [
        ...(momentum.missingData || []),
        ...(fundamentals.missingData || []),
        ...(technical.missingData || []),
        ...(sectorial.missingData || [])
      ];
      
      if (allMissingData.length > 0 && globalConfidence < 0.5) {
        reasoning.push(`Données incomplètes (${allMissingData.length} champs manquants) - Confiance réduite`);
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
        },
        // ✅ PHASE 4.5 : Exposer données manquantes pour debugging
        missingData: allMissingData.length > 0 ? [...new Set(allMissingData)] : undefined
      };
    } catch (error) {
      log.error('Error generating recommendation:', error);
      return {
        recommendation: 'NEUTRE',
        priority: 'low',
        globalScore: 50,
        globalConfidence: 0,
        reasoning: ['Erreur dans le calcul'],
        details: {},
        missingData: ['error']
      };
    }
  }

  /**
   * Analyse Momentum
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @returns {AnalysisResult} Résultat de l'analyse momentum
   */
  analyzeMomentum(position) {
    // ✅ PHASE 4.5 : Valider données avant calculs
    const validation = this.validateMomentumData(position);
    
    if (!validation.isValid) {
      log.warn(`[analyzeMomentum] Données insuffisantes pour ${position.ticker}:`, validation.missingRequired);
      return { 
        score: 50, 
        confidence: 0, 
        signals: [],
        missingData: validation.missingRequired
      };
    }

    const { prixActuel, ma50, ma200, volume } = position.yahooData || {};
    const { prixEntree } = position;

    let score = 50; // Base neutre
    let signals = [];
    let dataPointsUsed = 0;
    const maxDataPoints = 3; // MA, Volume, Performance

    // Prix vs MA (40% du score momentum)
    if (ma50 && ma200) {
      dataPointsUsed++;
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
      dataPointsUsed++;
      signals.push('Volume disponible');
      score += 10;
    }

    // Performance vs prix achat (30% du score momentum)
    if (prixEntree) {
      dataPointsUsed++;
      const performance = ((prixActuel - prixEntree) / prixEntree) * 100;
      if (performance > 10) {
        score += 20;
        signals.push('Performance positive');
      } else if (performance < -10) {
        score -= 20;
        signals.push('Performance négative');
      }
    }

    // ✅ PHASE 4.5 : Ajuster confiance selon disponibilité données
    const baseConfidence = 0.7;
    const dataCompletenessFactor = dataPointsUsed / maxDataPoints;
    const confidence = baseConfidence * dataCompletenessFactor * validation.completeness;

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: Math.max(0.1, Math.min(1, confidence)),
      missingData: validation.missingOptional.length > 0 ? validation.missingOptional : undefined
    };
  }

  /**
   * Analyse Fondamentaux
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @returns {AnalysisResult} Résultat de l'analyse fondamentaux
   */
  analyzeFundamentals(position) {
    // ✅ PHASE 4.5 : Valider données avant calculs
    const validation = this.validateFundamentalsData(position);
    
    const { peRatio, dividendYield, capitalisation } = position.yahooData || {};

    let score = 50; // Base neutre
    let signals = [];
    let dataPointsUsed = 0;
    const maxDataPoints = 3; // P/E, Dividend Yield, Market Cap

    // P/E Ratio (40% du score fondamental) - Simplifié
    if (peRatio !== undefined && peRatio !== null && peRatio > 0) {
      dataPointsUsed++;
      if (peRatio < 15) {
        score += 20;
        signals.push('P/E attractif');
      } else if (peRatio > 30) {
        score -= 20;
        signals.push('P/E élevé');
      }
    }

    // Dividend Yield (30% du score fondamental)
    if (dividendYield !== undefined && dividendYield !== null && dividendYield >= 0) {
      dataPointsUsed++;
      if (dividendYield > 3) {
        score += 15;
        signals.push('Dividende attractif');
      }
    }

    // Market Cap (30% du score fondamental)
    if (capitalisation !== undefined && capitalisation !== null && capitalisation > 0) {
      dataPointsUsed++;
      if (capitalisation > 100000000000) {
        score += 15;
        signals.push('Large cap');
      }
    }

    // ✅ PHASE 4.5 : Ajuster confiance selon disponibilité données
    // Si aucune donnée fondamentale disponible, confiance très faible
    const baseConfidence = 0.6;
    const dataCompletenessFactor = dataPointsUsed / maxDataPoints;
    const confidence = dataPointsUsed === 0 
      ? 0.1 // Très faible confiance si aucune donnée
      : baseConfidence * dataCompletenessFactor * validation.completeness;

    // ✅ PHASE 4.5 : Avertir si données manquantes
    if (validation.missingFields.length === maxDataPoints) {
      log.debug(`[analyzeFundamentals] Aucune donnée fondamentale disponible pour ${position.ticker}`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: Math.max(0.1, Math.min(1, confidence)),
      missingData: validation.missingFields.length > 0 ? validation.missingFields : undefined
    };
  }

  /**
   * Analyse Technique avec RSI, MACD, Bollinger
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @param {Array} historicalData - Données historiques
   * @returns {AnalysisResult} Résultat de l'analyse technique
   */
  analyzeTechnical(position, historicalData = []) {
    // ✅ PHASE 4.5 : Valider données avant calculs
    const validation = this.validateTechnicalData(position, historicalData);
    
    if (!validation.isValid) {
      log.warn(`[analyzeTechnical] Données insuffisantes pour ${position.ticker}:`, validation.missingRequired);
      return { 
        score: 50, 
        confidence: 0, 
        signals: [],
        missingData: validation.missingRequired
      };
    }

    const { prixActuel, ma50, ma200 } = position.yahooData || {};

    let score = 50;
    let signals = [];
    let dataPointsUsed = 0;
    const maxDataPoints = 4; // MA, RSI, MACD, Bollinger

    // Position vs MA (40% du score technique)
    if (ma50 && ma200) {
      dataPointsUsed++;
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
      dataPointsUsed++;
      // ✅ PHASE 3 - Étape 3.17 : Import statique remplace require dynamique
      const rsi = calcRSI(historicalData, 14);
      
      if (rsi !== null && rsi !== undefined && Number.isFinite(rsi)) {
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
    }

    // MACD (20% du score technique)
    if (historicalData && historicalData.length >= 35) {
      dataPointsUsed++;
      // ✅ PHASE 3 - Étape 3.17 : Import statique remplace require dynamique
      const macd = calculateMACD(historicalData);
      
      if (macd && macd.histogram !== null && macd.signal !== null && macd.macd !== null) {
        if (macd.histogram > 0 && macd.macd > macd.signal) {
          score += 10;
          signals.push('MACD haussier');
        } else if (macd.histogram < 0 && macd.macd < macd.signal) {
          score -= 10;
          signals.push('MACD baissier');
        }
      }
    }

    // Bollinger Bands (10% du score technique)
    if (historicalData && historicalData.length >= 20) {
      dataPointsUsed++;
      // ✅ PHASE 3 - Étape 3.17 : Import statique remplace require dynamique
      const bb = calculateBollingerBands(historicalData, 20, 2);
      
      if (bb && bb.lower !== null && bb.upper !== null && bb.middle !== null) {
        if (prixActuel < bb.lower) {
          score += 5; // Sous bande inférieure = opportunité
          signals.push('Sous Bollinger inférieure');
        } else if (prixActuel > bb.upper) {
          score -= 5; // Au-dessus bande supérieure = danger
          signals.push('Au-dessus Bollinger supérieure');
        }
      }
    }

    // ✅ PHASE 4.5 : Ajuster confiance selon disponibilité données
    const baseConfidence = 0.85;
    const dataCompletenessFactor = dataPointsUsed / maxDataPoints;
    const historicalDataFactor = validation.hasHistoricalData ? 1 : 0.5;
    const confidence = baseConfidence * dataCompletenessFactor * historicalDataFactor * validation.completeness;

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: Math.max(0.1, Math.min(1, confidence)),
      missingData: validation.missingOptional.length > 0 ? validation.missingOptional : undefined
    };
  }

  /**
   * Analyse Sectorielle
   * 
   * ✅ PHASE 4 - Étape 4.5 : Validation données avant calculs
   * 
   * @param {Object} position - Position à analyser
   * @param {Array} portfolio - Portfolio complet
   * @returns {AnalysisResult} Résultat de l'analyse sectorielle
   */
  analyzeSectorial(position, portfolio = []) {
    // ✅ PHASE 4.5 : Valider données avant calculs
    const validation = this.validateSectorialData(position, portfolio);
    
    if (!validation.isValid) {
      log.warn(`[analyzeSectorial] Données insuffisantes pour ${position.ticker}:`, validation.missingRequired);
      return { 
        score: 50, 
        confidence: 0.1, // Très faible confiance si données manquantes
        signals: [],
        missingData: validation.missingRequired
      };
    }

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

    // ✅ PHASE 4.5 : Ajuster confiance selon taille portfolio
    // Plus le portfolio est grand, plus la comparaison est fiable
    const baseConfidence = 0.5;
    const portfolioSizeFactor = Math.min(1, validation.portfolioSize / 5); // Max confiance à partir de 5 positions
    const confidence = baseConfidence * portfolioSizeFactor * validation.completeness;

    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: Math.max(0.1, Math.min(1, confidence)),
      missingData: validation.missingFields.length > 0 ? validation.missingFields : undefined
    };
  }

  /**
   * Calculer RSI (utilise fonction du service calculs)
   * ✅ PHASE 3 - Étape 3.17 : Import statique remplace require dynamique
   */
  calculateRSI(historicalData, period = 14) {
    return calcRSI(historicalData, period);
  }
}

export const recommendationEngine = new RecommendationEngine();

