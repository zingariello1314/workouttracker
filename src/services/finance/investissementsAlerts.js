/**
 * Service d'alertes cross-assets pour le module Investissements Divers
 * Détecte les opportunités et risques à travers tous les types d'actifs
 */

import logger from '../../utils/logger';

const log = logger.module('investissementsAlerts');

class InvestissementsAlerts {
  constructor() {
    this.seuils = {
      rebalancing: 5, // % de dérive pour déclencher alerte rebalancing
      cashExcedent: 0.20, // 20% de cash = excédent
      orSurperformance: 0.15, // +15% = surperformance
      bourseDecote: -0.10 // -10% = décote
    };
  }

  /**
   * Analyse complète et génère toutes les alertes
   * @param {Object} data - Données complètes (or, liquidites, bourseCrypto, allocation)
   * @returns {Array} Liste d'alertes
   */
  analyze(data) {
    const alerts = [];

    // 1. Rebalancing
    const rebalancingAlerts = this.checkRebalancing(data);
    alerts.push(...rebalancingAlerts);

    // 2. Opportunités croisées
    const crossOpportunities = this.checkCrossOpportunities(data);
    alerts.push(...crossOpportunities);

    // 3. Cash excédentaire
    const cashAlerts = this.checkCashExcedent(data);
    alerts.push(...cashAlerts);

    // 4. Liquidité optimale
    const liquidityAlerts = this.checkLiquidityOptimal(data);
    alerts.push(...liquidityAlerts);

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Vérifie les besoins de rebalancing
   */
  checkRebalancing(data) {
    const alerts = [];
    const { allocation } = data;

    if (!allocation) return alerts;

    const cibles = {
      or: 30,
      liquidites: 15,
      bourseCrypto: 55
    };

    const ecarts = {
      or: allocation.or - cibles.or,
      liquidites: allocation.liquidites - cibles.liquidites,
      bourseCrypto: allocation.bourseCrypto - cibles.bourseCrypto
    };

    // Vérifier chaque actif
    Object.entries(ecarts).forEach(([actif, ecart]) => {
      if (Math.abs(ecart) > this.seuils.rebalancing) {
        const action = ecart > 0 ? 'Réduire' : 'Augmenter';
        const montant = Math.abs((ecart / 100) * allocation.total);
        
        alerts.push({
          type: 'rebalancing',
          priority: Math.abs(ecart) > 10 ? 'high' : 'medium',
          actif,
          message: `${action} allocation ${actif} de ${Math.abs(ecart).toFixed(1)}%`,
          suggestion: `Ajuster de ~${this.formatCurrency(montant)} pour revenir à ${cibles[actif]}%`,
          ecart: ecart.toFixed(1)
        });
      }
    });

    return alerts;
  }

  /**
   * Détecte les opportunités croisées (vendre surperformant, acheter décoté)
   */
  checkCrossOpportunities(data) {
    const alerts = [];
    const { or, bourseCrypto } = data;

    // TODO: Calculer performance réelle avec historique
    // Pour l'instant, on simule avec des données de base

    // Opportunité: Or surperformant → Réduire et réinvestir en bourse décotée
    if (or && bourseCrypto) {
      const valorisationOr = (or.stockActuel || 0) * 65; // Prix approximatif
      const valorisationBourse = bourseCrypto.positions?.reduce((sum, pos) => 
        sum + (pos.montant || 0), 0) || 0;

      // Si or > 35% du patrimoine et bourse < 50%, opportunité
      const total = valorisationOr + valorisationBourse;
      if (total > 0) {
        const pourcentOr = (valorisationOr / total) * 100;
        const pourcentBourse = (valorisationBourse / total) * 100;

        if (pourcentOr > 35 && pourcentBourse < 50) {
          alerts.push({
            type: 'cross_opportunity',
            priority: 'medium',
            message: 'Or surpondéré, bourse sous-pondérée',
            suggestion: `Envisager réduction or de ~${this.formatCurrency(valorisationOr * 0.1)} → Réinvestir en bourse`,
            actif: 'or'
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Vérifie si cash excédentaire
   */
  checkCashExcedent(data) {
    const alerts = [];
    const { liquidites, allocation } = data;

    if (!liquidites || !allocation) return alerts;

    const pourcentCash = allocation.liquidites || 0;
    const cibleCash = 15;

    if (pourcentCash > cibleCash + (cibleCash * this.seuils.cashExcedent)) {
      const montantExcedent = ((pourcentCash - cibleCash) / 100) * allocation.total;
      
      alerts.push({
        type: 'cash_excedent',
        priority: 'medium',
        message: `Cash excédentaire : ${pourcentCash.toFixed(1)}% (cible: ${cibleCash}%)`,
        suggestion: `Déployer ~${this.formatCurrency(montantExcedent)} vers Or ou Bourse selon opportunités`,
        montant: montantExcedent
      });
    }

    return alerts;
  }

  /**
   * Vérifie liquidité optimale
   */
  checkLiquidityOptimal(data) {
    const alerts = [];
    const { liquidites } = data;

    if (!liquidites) return alerts;

    const stockTotal = liquidites.stockTotal || 0;
    const objectifMensuel = liquidites.objectifMensuel || 200;

    // Seuils escalade
    if (stockTotal >= 10000) {
      alerts.push({
        type: 'liquidity_optimal',
        priority: 'low',
        message: 'Stock liquidités élevé (10k€+)',
        suggestion: 'Envisager répartition selon stratégie sécurité renforcée',
        niveau: 'eleve'
      });
    } else if (stockTotal >= 5000) {
      alerts.push({
        type: 'liquidity_optimal',
        priority: 'low',
        message: 'Stock liquidités moyen (5k€+)',
        suggestion: 'Répartition obligatoire recommandée',
        niveau: 'moyen'
      });
    }

    return alerts;
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}

export const investissementsAlerts = new InvestissementsAlerts();

