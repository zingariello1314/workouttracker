/**
 * nutritionComplianceStrategies.js
 * 
 * ✅ PHASE 15.8 : Pattern Strategy pour calculs de conformité
 * 
 * Implémente le Pattern Strategy pour permettre différents modes de calcul de conformité :
 * - Standard : Seuils équilibrés (80%-120%)
 * - Strict : Seuils stricts (90%-110%)
 * - Flexible : Seuils larges (70%-130%)
 * 
 * Architecture :
 * - Interface commune pour toutes les stratégies
 * - Configuration centralisée dans nutrition.config.js
 * - Extensible : facile d'ajouter de nouvelles stratégies
 * 
 * @module services/nutrition/nutritionComplianceStrategies
 * @see ../../../../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 3.1
 */

import logger from '../../utils/logger';
import { safeDivision } from './nutritionCalculationHelpers';
import { NutritionConfig } from '../../config/nutrition.config';

const log = logger.module('nutritionComplianceStrategies');

// ==================== CONSTANTES ====================

/**
 * Types de stratégies disponibles
 */
export const COMPLIANCE_STRATEGY_TYPES = {
  STANDARD: 'standard',
  STRICT: 'strict',
  FLEXIBLE: 'flexible'
};

// ==================== INTERFACE STRATÉGIE ====================

/**
 * Interface de base pour une stratégie de calcul de conformité
 * 
 * @typedef {Object} ComplianceStrategy
 * @property {string} name - Nom de la stratégie
 * @property {string} type - Type de stratégie (standard, strict, flexible)
 * @property {number} threshold - Seuil minimum pour score 100 (ratio)
 * @property {number} penaltyThreshold - Seuil maximum avant pénalité (ratio)
 * @property {Function} calculateScore - Fonction de calcul du score pour un macro
 */

/**
 * Calcule le score de conformité pour un macro donné selon la stratégie
 * 
 * @param {number} ratio - Ratio actual/target
 * @param {Object} strategy - Stratégie à utiliser
 * @returns {number} Score de 0 à 100
 */
function calculateMacroScore(ratio, strategy) {
  const { threshold, penaltyThreshold } = strategy;
  
  // Validation ratio
  if (!isFinite(ratio) || ratio < 0) {
    return 0;
  }
  
  // Score parfait si dans la zone acceptable
  if (ratio >= threshold && ratio <= penaltyThreshold) {
    return 100;
  }
  
  // Pénalité si en dessous du seuil
  if (ratio < threshold) {
    return safeDivision(100 * ratio, threshold, {
      operation: `calculateMacroScore.penaltyLow.${strategy.type}`,
      defaultValue: 0
    });
  }
  
  // Pénalité si au-dessus du seuil de pénalité
  if (ratio > penaltyThreshold) {
    return safeDivision(100 * penaltyThreshold, ratio, {
      operation: `calculateMacroScore.penaltyHigh.${strategy.type}`,
      defaultValue: 0
    });
  }
  
  return 0;
}

// ==================== STRATÉGIES CONCRÈTES ====================

/**
 * Stratégie Standard : Seuils équilibrés
 * - Threshold : 80% (score 100 si >= 80%)
 * - Penalty Threshold : 120% (score 100 si <= 120%)
 * 
 * Idéal pour la plupart des utilisateurs
 */
export const StandardComplianceStrategy = {
  name: 'Standard',
  type: COMPLIANCE_STRATEGY_TYPES.STANDARD,
  threshold: 0.8,      // 80%
  penaltyThreshold: 1.2, // 120%
  description: 'Seuils équilibrés pour la plupart des utilisateurs (80%-120%)',
  calculateScore: (ratio) => calculateMacroScore(ratio, StandardComplianceStrategy)
};

/**
 * Stratégie Strict : Seuils stricts
 * - Threshold : 90% (score 100 si >= 90%)
 * - Penalty Threshold : 110% (score 100 si <= 110%)
 * 
 * Idéal pour utilisateurs avancés ou compétitions
 */
export const StrictComplianceStrategy = {
  name: 'Strict',
  type: COMPLIANCE_STRATEGY_TYPES.STRICT,
  threshold: 0.9,      // 90%
  penaltyThreshold: 1.1, // 110%
  description: 'Seuils stricts pour utilisateurs avancés (90%-110%)',
  calculateScore: (ratio) => calculateMacroScore(ratio, StrictComplianceStrategy)
};

/**
 * Stratégie Flexible : Seuils larges
 * - Threshold : 70% (score 100 si >= 70%)
 * - Penalty Threshold : 130% (score 100 si <= 130%)
 * 
 * Idéal pour débutants ou période de transition
 */
export const FlexibleComplianceStrategy = {
  name: 'Flexible',
  type: COMPLIANCE_STRATEGY_TYPES.FLEXIBLE,
  threshold: 0.7,      // 70%
  penaltyThreshold: 1.3, // 130%
  description: 'Seuils larges pour débutants ou période de transition (70%-130%)',
  calculateScore: (ratio) => calculateMacroScore(ratio, FlexibleComplianceStrategy)
};

// ==================== REGISTRY DES STRATÉGIES ====================

/**
 * Registry de toutes les stratégies disponibles
 */
const STRATEGY_REGISTRY = {
  [COMPLIANCE_STRATEGY_TYPES.STANDARD]: StandardComplianceStrategy,
  [COMPLIANCE_STRATEGY_TYPES.STRICT]: StrictComplianceStrategy,
  [COMPLIANCE_STRATEGY_TYPES.FLEXIBLE]: FlexibleComplianceStrategy
};

// ==================== FONCTIONS PUBLIQUES ====================

/**
 * Obtient la stratégie de conformité active depuis la configuration
 * 
 * @returns {ComplianceStrategy} Stratégie active
 */
export function getActiveComplianceStrategy() {
  const strategyType = NutritionConfig.compliance?.strategy || COMPLIANCE_STRATEGY_TYPES.STANDARD;
  const strategy = STRATEGY_REGISTRY[strategyType];
  
  if (!strategy) {
    log.warn(`[getActiveComplianceStrategy] Stratégie ${strategyType} non trouvée, utilisation Standard`);
    return StandardComplianceStrategy;
  }
  
  return strategy;
}

/**
 * Obtient une stratégie par son type
 * 
 * @param {string} strategyType - Type de stratégie (standard, strict, flexible)
 * @returns {ComplianceStrategy} Stratégie correspondante
 */
export function getComplianceStrategy(strategyType) {
  const strategy = STRATEGY_REGISTRY[strategyType];
  
  if (!strategy) {
    log.warn(`[getComplianceStrategy] Stratégie ${strategyType} non trouvée, utilisation Standard`);
    return StandardComplianceStrategy;
  }
  
  return strategy;
}

/**
 * Liste toutes les stratégies disponibles
 * 
 * @returns {Array<ComplianceStrategy>} Liste des stratégies
 */
export function getAllComplianceStrategies() {
  return Object.values(STRATEGY_REGISTRY);
}

/**
 * Vérifie si un type de stratégie est valide
 * 
 * @param {string} strategyType - Type de stratégie à vérifier
 * @returns {boolean} True si valide
 */
export function isValidStrategyType(strategyType) {
  return Object.values(COMPLIANCE_STRATEGY_TYPES).includes(strategyType);
}

export default {
  getActiveComplianceStrategy,
  getComplianceStrategy,
  getAllComplianceStrategies,
  isValidStrategyType,
  COMPLIANCE_STRATEGY_TYPES,
  StandardComplianceStrategy,
  StrictComplianceStrategy,
  FlexibleComplianceStrategy
};



