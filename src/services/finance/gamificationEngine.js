/**
 * Moteur de gamification pour le budget personnel
 */

import logger from '../../utils/logger';

const log = logger.module('gamificationEngine');

class GamificationEngine {
  /**
   * Calculer score multi-dimensionnel
   */
  calculateScore(budget, historique, mois = null) {
    if (!budget || !historique) {
      return {
        global: 50,
        dimensions: {
          discipline: 50,
          planification: 50,
          optimisation: 50,
          epargne: 50
        },
        breakdown: []
      };
    }

    const moisActuel = mois || new Date().toISOString().slice(0, 7);
    
    const dimensions = {
      discipline: this.calculateDiscipline(budget, historique, moisActuel),
      planification: this.calculatePlanification(historique, moisActuel),
      optimisation: this.calculateOptimisation(budget, historique, moisActuel),
      epargne: this.calculateEpargne(budget, historique, moisActuel)
    };

    // Score global pondéré
    const globalScore = 
      dimensions.discipline * 0.40 +
      dimensions.planification * 0.30 +
      dimensions.optimisation * 0.20 +
      dimensions.epargne * 0.10;

    return {
      global: Math.round(globalScore),
      dimensions,
      breakdown: this.getScoreBreakdown(dimensions)
    };
  }

  /**
   * Calculer score discipline (40% du score global)
   */
  calculateDiscipline(budget, historique, mois) {
    if (!budget.depenses?.categories || budget.depenses.categories.length === 0) {
      return 50;
    }

    let score = 100;
    let totalPenalites = 0;
    let totalBonus = 0;

    budget.depenses.categories.forEach(categorie => {
      const depensesMois = historique.filter(d => {
        const dDate = new Date(d.date);
        const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        return dMois === mois && d.categorie === categorie.id;
      });

      const depenseMois = depensesMois.reduce((sum, d) => sum + d.montant, 0);
      const budgetCategorie = categorie.budgetMensuel || 0;

      if (budgetCategorie > 0) {
        const pourcentUtilise = (depenseMois / budgetCategorie) * 100;

        if (pourcentUtilise > 100) {
          // Pénalité dépassement
          const penalite = (pourcentUtilise - 100) * 2;
          totalPenalites += penalite;
        } else if (pourcentUtilise <= 100 && pourcentUtilise >= 90) {
          // Bonus gestion serrée
          totalBonus += 5;
        } else if (pourcentUtilise < 50 && depenseMois > 0) {
          // Bonus économie significative
          totalBonus += 3;
        }
      }
    });

    score = score - totalPenalites + totalBonus;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculer score planification (30% du score global)
   */
  calculatePlanification(historique, mois) {
    const depensesMois = historique.filter(d => {
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === mois;
    });

    if (depensesMois.length === 0) return 50;

    // Dépenses planifiées vs impulsives
    const depensesPlanifiees = depensesMois.filter(d => 
      d.statut === 'planifie' || 
      d.statut === 'confirme' || 
      d.datePlanifiee
    );
    
    const depensesImpulsives = depensesMois.filter(d => !d.datePlanifiee && !d.statut);

    const ratioPlanifie = depensesPlanifiees.length / depensesMois.length;
    return Math.round(ratioPlanifie * 100);
  }

  /**
   * Calculer score optimisation (20% du score global)
   */
  calculateOptimisation(budget, historique, mois) {
    const economies = this.calculateEconomies(budget, historique, mois);
    const objectifEconomies = budget.objectifs?.economies || 0;

    if (objectifEconomies === 0) return 50; // Neutre si pas d'objectif

    const ratio = economies / objectifEconomies;
    return Math.min(100, Math.round(ratio * 100));
  }

  /**
   * Calculer économies réalisées
   */
  calculateEconomies(budget, historique, mois) {
    if (!budget.depenses?.categories) return 0;

    let totalEconomies = 0;

    budget.depenses.categories.forEach(categorie => {
      const depensesMois = historique.filter(d => {
        const dDate = new Date(d.date);
        const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        return dMois === mois && d.categorie === categorie.id;
      });

      const depenseMois = depensesMois.reduce((sum, d) => sum + d.montant, 0);
      const budgetCategorie = categorie.budgetMensuel || 0;

      if (budgetCategorie > depenseMois) {
        totalEconomies += budgetCategorie - depenseMois;
      }
    });

    return totalEconomies;
  }

  /**
   * Calculer score épargne (10% du score global)
   */
  calculateEpargne(budget, historique, mois) {
    const epargneReelle = budget.epargne?.actuelle || 0;
    const epargneObjectif = budget.epargne?.objectif || 0;

    if (epargneObjectif === 0) return 50;

    const ratio = epargneReelle / epargneObjectif;
    return Math.min(100, Math.round(ratio * 100));
  }

  /**
   * Obtenir breakdown détaillé du score
   */
  getScoreBreakdown(dimensions) {
    return [
      {
        dimension: 'Discipline',
        score: dimensions.discipline,
        poids: 40,
        contribution: (dimensions.discipline * 0.40).toFixed(1),
        description: 'Respect des budgets par catégorie'
      },
      {
        dimension: 'Planification',
        score: dimensions.planification,
        poids: 30,
        contribution: (dimensions.planification * 0.30).toFixed(1),
        description: 'Ratio dépenses planifiées vs impulsives'
      },
      {
        dimension: 'Optimisation',
        score: dimensions.optimisation,
        poids: 20,
        contribution: (dimensions.optimisation * 0.20).toFixed(1),
        description: 'Économies réalisées vs objectifs'
      },
      {
        dimension: 'Épargne',
        score: dimensions.epargne,
        poids: 10,
        contribution: (dimensions.epargne * 0.10).toFixed(1),
        description: 'Épargne actuelle vs objectif'
      }
    ];
  }

  /**
   * Calculer XP gagné ce mois
   */
  calculateXP(budget, historique, mois) {
    const score = this.calculateScore(budget, historique, mois);
    const baseXP = score.global;
    
    // Bonus pour excellents scores
    let bonusXP = 0;
    if (score.global >= 90) bonusXP += 50;
    else if (score.global >= 80) bonusXP += 25;
    else if (score.global >= 70) bonusXP += 10;

    // Bonus pour économies
    const economies = this.calculateEconomies(budget, historique, mois);
    bonusXP += Math.floor(economies / 10); // 1 XP par 10€ économisés

    return baseXP + bonusXP;
  }
}

export const gamificationEngine = new GamificationEngine();

