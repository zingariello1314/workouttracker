/**
 * Service de logique métier pour le portfolio
 * 
 * ✅ PHASE 4 - Étape 4.2 : Extraire logique métier composants
 * - Centralise tous les calculs de portfolio
 * - Fonctions réutilisables et testables
 * - Séparation logique métier / présentation
 * - Optimisations avec cache et validation
 * 
 * @module services/finance/portfolioService
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 22
 */

import logger from '../../utils/logger';
import { calculatePortfolioWeight } from './financeCalculations';

const log = logger.module('portfolioService');

/**
 * Calculer le résumé complet du portfolio
 * 
 * ✅ PHASE 4.2 : Fonction centralisée pour calculs résumé portfolio
 * 
 * @param {Array} portfolio - Tableau de positions
 * @returns {Object} Résumé avec totalInvesti, totalValorise, totalPlusValue, etc.
 */
export function calculatePortfolioSummary(portfolio) {
  if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
    return {
      totalInvesti: 0,
      totalValorise: 0,
      totalPlusValue: 0,
      totalPlusValuePourcent: 0,
      positions: 0,
      averagePlusValuePourcent: 0,
      bestPerformer: null,
      worstPerformer: null
    };
  }

  try {
    // ✅ PHASE 4.2 : Calcul total investi (somme quantite * prixEntree)
    // ✅ PHASE 4 - Étape 4.9 : Utiliser investissementConverti si disponible (pour cohérence multi-devises)
    const totalInvesti = portfolio.reduce((sum, pos) => {
      // Priorité : investissementConverti (déjà en EUR) > investissementTotal > calcul manuel
      const investi = pos.calculs?.investissementConverti 
        || pos.investissementTotal 
        || ((pos.quantite || 0) * (pos.prixEntree || 0));
      return sum + (Number.isFinite(investi) ? investi : 0);
    }, 0);

    // ✅ PHASE 4.2 : Calcul total valorisé (somme valeurPosition)
    const totalValorise = portfolio.reduce((sum, pos) => {
      const valorise = pos.calculs?.valeurPosition || 0;
      return sum + (Number.isFinite(valorise) ? valorise : 0);
    }, 0);

    // ✅ PHASE 4.2 : Calcul total plus-value (somme plusValueEuro)
    const totalPlusValue = portfolio.reduce((sum, pos) => {
      const plusValue = pos.calculs?.plusValueEuro || 0;
      return sum + (Number.isFinite(plusValue) ? plusValue : 0);
    }, 0);

    // ✅ PHASE 4.2 : Calcul plus-value pourcentage
    const totalPlusValuePourcent = totalInvesti > 0
      ? (totalPlusValue / totalInvesti) * 100
      : 0;

    // ✅ PHASE 4.2 : Calcul moyenne plus-value pourcentage (moyenne des positions)
    const positionsWithPlusValue = portfolio.filter(pos => 
      pos.calculs?.plusValuePourcent !== undefined && 
      Number.isFinite(pos.calculs.plusValuePourcent)
    );
    
    const averagePlusValuePourcent = positionsWithPlusValue.length > 0
      ? positionsWithPlusValue.reduce((sum, pos) => 
          sum + (pos.calculs.plusValuePourcent || 0), 0
        ) / positionsWithPlusValue.length
      : 0;

    // ✅ PHASE 4.2 : Identifier meilleure et pire performance
    const bestPerformer = portfolio.reduce((best, pos) => {
      const currentPourcent = pos.calculs?.plusValuePourcent || -Infinity;
      const bestPourcent = best?.calculs?.plusValuePourcent || -Infinity;
      return currentPourcent > bestPourcent ? pos : best;
    }, null);

    const worstPerformer = portfolio.reduce((worst, pos) => {
      const currentPourcent = pos.calculs?.plusValuePourcent || Infinity;
      const worstPourcent = worst?.calculs?.plusValuePourcent || Infinity;
      return currentPourcent < worstPourcent ? pos : worst;
    }, null);

    return {
      totalInvesti: Math.round(totalInvesti * 100) / 100,
      totalValorise: Math.round(totalValorise * 100) / 100,
      totalPlusValue: Math.round(totalPlusValue * 100) / 100,
      totalPlusValuePourcent: Math.round(totalPlusValuePourcent * 100) / 100,
      averagePlusValuePourcent: Math.round(averagePlusValuePourcent * 100) / 100,
      positions: portfolio.length,
      bestPerformer: bestPerformer ? {
        ticker: bestPerformer.ticker,
        plusValuePourcent: bestPerformer.calculs?.plusValuePourcent || 0
      } : null,
      worstPerformer: worstPerformer ? {
        ticker: worstPerformer.ticker,
        plusValuePourcent: worstPerformer.calculs?.plusValuePourcent || 0
      } : null
    };
  } catch (error) {
    log.error('[calculatePortfolioSummary] Erreur calcul résumé:', error);
    return {
      totalInvesti: 0,
      totalValorise: 0,
      totalPlusValue: 0,
      totalPlusValuePourcent: 0,
      positions: 0,
      averagePlusValuePourcent: 0,
      bestPerformer: null,
      worstPerformer: null
    };
  }
}

/**
 * Calculer le total du portfolio (pour calculs poids)
 * 
 * ✅ PHASE 4.2 : Fonction centralisée pour total portfolio
 * 
 * @param {Array} portfolio - Tableau de positions
 * @returns {number} Total valorisé du portfolio
 */
export function calculateTotalPortfolio(portfolio) {
  if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
    return 0;
  }

  try {
    const total = portfolio.reduce((sum, pos) => {
      const valorise = pos.calculs?.valeurPosition || 0;
      return sum + (Number.isFinite(valorise) ? valorise : 0);
    }, 0);

    return Math.round(total * 100) / 100;
  } catch (error) {
    log.error('[calculateTotalPortfolio] Erreur calcul total:', error);
    return 0;
  }
}

/**
 * Calculer les statistiques par secteur (si disponible)
 * 
 * ✅ PHASE 4.2 : Fonction pour statistiques sectorielles
 * 
 * @param {Array} portfolio - Tableau de positions
 * @returns {Object} Statistiques par secteur
 */
export function calculateSectorStatistics(portfolio) {
  if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
    return {};
  }

  try {
    const sectorMap = new Map();

    portfolio.forEach(pos => {
      const secteur = pos.secteur || 'Non défini';
      const valorise = pos.calculs?.valeurPosition || 0;
      const plusValue = pos.calculs?.plusValueEuro || 0;

      if (!sectorMap.has(secteur)) {
        sectorMap.set(secteur, {
          secteur,
          positions: 0,
          totalValorise: 0,
          totalPlusValue: 0,
          poidsPortfolio: 0
        });
      }

      const stats = sectorMap.get(secteur);
      stats.positions++;
      stats.totalValorise += Number.isFinite(valorise) ? valorise : 0;
      stats.totalPlusValue += Number.isFinite(plusValue) ? plusValue : 0;
    });

    // Calculer poids portfolio par secteur
    const totalPortfolio = calculateTotalPortfolio(portfolio);
    sectorMap.forEach(stats => {
      stats.totalValorise = Math.round(stats.totalValorise * 100) / 100;
      stats.totalPlusValue = Math.round(stats.totalPlusValue * 100) / 100;
      stats.poidsPortfolio = totalPortfolio > 0
        ? Math.round((stats.totalValorise / totalPortfolio) * 100 * 100) / 100
        : 0;
    });

    return Object.fromEntries(sectorMap);
  } catch (error) {
    log.error('[calculateSectorStatistics] Erreur calcul statistiques secteur:', error);
    return {};
  }
}

/**
 * Générer hash du portfolio pour détection changements
 * 
 * ✅ PHASE 4.2 : Fonction utilitaire pour optimisation re-renders
 * 
 * @param {Array} portfolio - Tableau de positions
 * @returns {string} Hash du portfolio
 */
export function getPortfolioHash(portfolio) {
  if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
    return 'empty';
  }

  try {
    // Hash basé sur données critiques (ID, quantite, prixEntree, prixActuel, plusValueEuro)
    return portfolio.map(pos => 
      `${pos.id}_${pos.quantite || 0}_${pos.prixEntree || 0}_${pos.yahooData?.prixActuel || 0}_${pos.calculs?.plusValueEuro || 0}`
    ).join('|');
  } catch (error) {
    log.error('[getPortfolioHash] Erreur génération hash:', error);
    return 'error';
  }
}

/**
 * Formater valeur monétaire
 * 
 * ✅ PHASE 4.2 : Fonction utilitaire pour formatage cohérent
 * 
 * @param {number} value - Valeur à formater
 * @param {string} currency - Devise (défaut: 'EUR')
 * @param {string} locale - Locale (défaut: 'fr-FR')
 * @returns {string} Valeur formatée
 */
export function formatCurrency(value, currency = 'EUR', locale = 'fr-FR') {
  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formater pourcentage
 * 
 * ✅ PHASE 4.2 : Fonction utilitaire pour formatage cohérent
 * 
 * @param {number} value - Valeur à formater
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} Pourcentage formaté
 */
export function formatPercent(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return `+0.${'0'.repeat(decimals)}%`;
  }

  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
