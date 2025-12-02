/**
 * Service budgetOptimization - Algorithmes d'optimisation du budget
 * Analyse saisonnière, détection d'anomalies, recommandations IA
 */

import logger from '../../utils/logger';

const log = logger.module('budgetOptimization');

class BudgetOptimizationEngine {
  /**
   * Analyse saisonnière avec détection automatique
   * @param {Array} historique - Historique des dépenses
   * @returns {Array} Patterns saisonniers avec recommandations
   */
  analyzeSeasonality(historique) {
    if (!historique || historique.length === 0) {
      return [];
    }

    const monthlyAverages = {};

    historique.forEach(depense => {
      const date = new Date(depense.date);
      const month = date.getMonth();
      
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = { total: 0, count: 0 };
      }
      monthlyAverages[month].total += depense.montant || 0;
      monthlyAverages[month].count++;
    });

    const patterns = Object.entries(monthlyAverages).map(([month, data]) => ({
      month: parseInt(month),
      average: data.count > 0 ? data.total / data.count : 0,
      monthName: new Date(2000, parseInt(month), 1).toLocaleString('fr-FR', { month: 'long' }),
      count: data.count
    }));

    // Détecter variations significatives
    const globalAverage = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.average, 0) / patterns.length
      : 0;

    return patterns.map(p => ({
      ...p,
      variation: globalAverage > 0 ? ((p.average - globalAverage) / globalAverage) * 100 : 0,
      recommendation: p.average > globalAverage * 1.2
        ? `Augmenter budget ${p.monthName} de ${((p.average - globalAverage) / globalAverage * 100).toFixed(0)}%`
        : null
    }));
  }

  /**
   * Détection d'anomalies avec algorithme statistique
   * @param {Array} depenses - Liste des dépenses
   * @param {Object} categorie - Catégorie à analyser
   * @returns {Array} Anomalies détectées
   */
  detectAnomalies(depenses, categorie) {
    if (!depenses || !categorie) {
      return [];
    }

    const montants = depenses
      .filter(d => d.categorie === categorie.id)
      .map(d => d.montant || 0);

    if (montants.length < 3) {
      return [];
    }

    // Calcul moyenne et écart-type
    const moyenne = montants.reduce((sum, m) => sum + m, 0) / montants.length;
    const variance = montants.reduce((sum, m) => sum + Math.pow(m - moyenne, 2), 0) / montants.length;
    const ecartType = Math.sqrt(variance);

    // Détecter valeurs > 2 écarts-types (anomalies)
    const seuil = moyenne + (2 * ecartType);

    return depenses
      .filter(d => d.categorie === categorie.id && d.montant > seuil)
      .map(d => ({
        ...d,
        type: 'ANOMALIE',
        ecart: d.montant - moyenne,
        suggestion: `Dépense inhabituelle (${((d.montant - moyenne) / moyenne * 100).toFixed(0)}% au-dessus de la moyenne). Vérifier si erreur ou recatégoriser.`
      }));
  }

  /**
   * Recommandations IA avec scoring
   * @param {Object} budget - Budget actuel
   * @param {Array} historique - Historique des dépenses
   * @returns {Array} Recommandations avec priorité
   */
  generateRecommendations(budget, historique) {
    if (!budget || !budget.depenses || !budget.depenses.categories) {
      return [];
    }

    const recommendations = [];

    // Analyser chaque catégorie
    budget.depenses.categories.forEach(categorie => {
      const depenseActuelle = historique
        .filter(d => {
          const depenseDate = new Date(d.date);
          const now = new Date();
          return d.categorie === categorie.id &&
                 depenseDate.getFullYear() === now.getFullYear() &&
                 depenseDate.getMonth() === now.getMonth();
        })
        .reduce((sum, d) => sum + (d.montant || 0), 0);

      const ecart = depenseActuelle - (categorie.budgetMensuel || 0);

      // Si dépassement significatif
      if (ecart > 50) {
        // Trouver catégories avec marge
        const categoriesAvecMarge = budget.depenses.categories
          .filter(c => {
            const depC = historique
              .filter(d => {
                const depenseDate = new Date(d.date);
                const now = new Date();
                return d.categorie === c.id &&
                       depenseDate.getFullYear() === now.getFullYear() &&
                       depenseDate.getMonth() === now.getMonth();
              })
              .reduce((sum, d) => sum + (d.montant || 0), 0);
            return (c.budgetMensuel || 0) - depC > 50;
          })
          .sort((a, b) => {
            const depA = historique
              .filter(d => {
                const depenseDate = new Date(d.date);
                const now = new Date();
                return d.categorie === a.id &&
                       depenseDate.getFullYear() === now.getFullYear() &&
                       depenseDate.getMonth() === now.getMonth();
              })
              .reduce((sum, d) => sum + (d.montant || 0), 0);
            const depB = historique
              .filter(d => {
                const depenseDate = new Date(d.date);
                const now = new Date();
                return d.categorie === b.id &&
                       depenseDate.getFullYear() === now.getFullYear() &&
                       depenseDate.getMonth() === now.getMonth();
              })
              .reduce((sum, d) => sum + (d.montant || 0), 0);
            return ((b.budgetMensuel || 0) - depB) - ((a.budgetMensuel || 0) - depA);
          });

        if (categoriesAvecMarge.length > 0) {
          const source = categoriesAvecMarge[0];
          const depSource = historique
            .filter(d => {
              const depenseDate = new Date(d.date);
              const now = new Date();
              return d.categorie === source.id &&
                     depenseDate.getFullYear() === now.getFullYear() &&
                     depenseDate.getMonth() === now.getMonth();
            })
            .reduce((sum, d) => sum + (d.montant || 0), 0);
          const margeSource = (source.budgetMensuel || 0) - depSource;
          const montantTransfert = Math.min(ecart, margeSource * 0.3);

          recommendations.push({
            type: 'REBALANCE',
            message: `Réduire ${source.nom} de ${this.formatCurrency(montantTransfert)} → Augmenter ${categorie.nom}`,
            action: {
              from: source.id,
              to: categorie.id,
              amount: montantTransfert
            },
            impact: `Équilibre budget`,
            priority: 'high'
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Calcul des économies potentielles
   * @param {Object} budget - Budget actuel
   * @param {Array} historique - Historique des dépenses
   * @param {Date} mois - Mois à analyser
   * @returns {number} Montant des économies
   */
  calculateEconomies(budget, historique, mois) {
    if (!budget || !budget.depenses || !budget.depenses.categories) {
      return 0;
    }

    let economies = 0;

    budget.depenses.categories.forEach(categorie => {
      const depensesMois = historique
        .filter(d => {
          const depenseDate = new Date(d.date);
          return d.categorie === categorie.id &&
                 depenseDate.getFullYear() === mois.getFullYear() &&
                 depenseDate.getMonth() === mois.getMonth();
        })
        .reduce((sum, d) => sum + (d.montant || 0), 0);

      const budgetCat = categorie.budgetMensuel || 0;
      if (depensesMois < budgetCat) {
        economies += budgetCat - depensesMois;
      }
    });

    return economies;
  }

  /**
   * Formatage monétaire
   * @param {number} amount - Montant
   * @returns {string} Montant formaté
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

export const budgetOptimization = new BudgetOptimizationEngine();
export default budgetOptimization;

