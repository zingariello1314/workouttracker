/**
 * Service d'optimisation du budget avec algorithmes intelligents
 */

import logger from '../../utils/logger';

const log = logger.module('budgetOptimization');

class BudgetOptimizationEngine {
  /**
   * Analyse saisonnière avec détection automatique
   */
  analyzeSeasonality(historique, categorieId = null) {
    if (!historique || historique.length === 0) return [];

    const filtered = categorieId
      ? historique.filter(d => d.categorie === categorieId)
      : historique;

    const monthlyAverages = {};

    filtered.forEach(depense => {
      const month = new Date(depense.date).getMonth();
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = { total: 0, count: 0 };
      }
      monthlyAverages[month].total += depense.montant;
      monthlyAverages[month].count++;
    });

    const patterns = Object.entries(monthlyAverages).map(([month, data]) => ({
      month: parseInt(month),
      average: data.total / data.count,
      monthName: new Date(2000, parseInt(month), 1).toLocaleString('fr-FR', { month: 'long' }),
      count: data.count
    }));

    if (patterns.length === 0) return [];

    // Détecter variations significatives
    const globalAverage = patterns.reduce((sum, p) => sum + p.average, 0) / patterns.length;

    return patterns.map(p => ({
      ...p,
      variation: globalAverage > 0 ? ((p.average - globalAverage) / globalAverage) * 100 : 0,
      recommendation: p.average > globalAverage * 1.2
        ? `Augmenter budget ${p.monthName} de ${((p.average - globalAverage) / globalAverage * 100).toFixed(0)}%`
        : null
    }));
  }

  /**
   * Détection anomalies avec algorithme statistique
   */
  detectAnomalies(depenses, categorie) {
    if (!depenses || !categorie) return [];

    const montants = depenses
      .filter(d => d.categorie === categorie.id)
      .map(d => d.montant);

    if (montants.length < 3) return [];

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
        ecartType: ((d.montant - moyenne) / ecartType).toFixed(2),
        suggestion: `Dépense inhabituelle (${((d.montant - moyenne) / moyenne * 100).toFixed(0)}% au-dessus de la moyenne). Vérifier si erreur ou recatégoriser.`
      }));
  }

  /**
   * Recommandations IA avec scoring
   */
  generateRecommendations(budget, historique) {
    if (!budget || !historique) return [];

    const recommendations = [];
    const categories = budget.depenses?.categories || [];

    // Analyser chaque catégorie
    categories.forEach(categorie => {
      const depenseActuelle = historique
        .filter(d => d.categorie === categorie.id)
        .reduce((sum, d) => sum + d.montant, 0);

      const ecart = depenseActuelle - (categorie.budgetMensuel || 0);

      // Si dépassement significatif
      if (ecart > 50) {
        // Trouver catégories avec marge
        const categoriesAvecMarge = categories
          .filter(c => {
            const depC = historique
              .filter(d => d.categorie === c.id)
              .reduce((sum, d) => sum + d.montant, 0);
            return (c.budgetMensuel - depC) > 50;
          })
          .sort((a, b) => {
            const depA = historique.filter(d => d.categorie === a.id).reduce((sum, d) => sum + d.montant, 0);
            const depB = historique.filter(d => d.categorie === b.id).reduce((sum, d) => sum + d.montant, 0);
            return (b.budgetMensuel - depB) - (a.budgetMensuel - depA);
          });

        if (categoriesAvecMarge.length > 0) {
          const source = categoriesAvecMarge[0];
          const depSource = historique
            .filter(d => d.categorie === source.id)
            .reduce((sum, d) => sum + d.montant, 0);
          const montantTransfert = Math.min(ecart, source.budgetMensuel - depSource);

          if (montantTransfert > 0) {
            recommendations.push({
              type: 'REBALANCE',
              message: `Réduire ${source.nom} de ${montantTransfert.toFixed(0)}€ → Augmenter ${categorie.nom}`,
              action: {
                from: source.id,
                to: categorie.id,
                amount: montantTransfert
              },
              impact: `Équilibre budget`,
              priority: 'high',
              score: ecart / categorie.budgetMensuel * 100
            });
          }
        }
      }
    });

    // Trier par priorité et score
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (b.score || 0) - (a.score || 0);
    });
  }

  /**
   * Optimiser budgets basé sur historique
   */
  optimizeBudgets(categories, historique, mois = 3) {
    if (!categories || !historique) return categories;

    const now = new Date();
    const optimized = categories.map(categorie => {
      // Calculer moyenne dépenses sur N mois
      const depensesMois = [];
      for (let i = 0; i < mois; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const depenses = historique.filter(d => {
          const dDate = new Date(d.date);
          const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
          return dMois === moisKey && d.categorie === categorie.id;
        });
        
        const total = depenses.reduce((sum, d) => sum + d.montant, 0);
        if (total > 0) {
          depensesMois.push(total);
        }
      }

      if (depensesMois.length === 0) {
        return categorie; // Pas de données, garder budget actuel
      }

      const moyenne = depensesMois.reduce((sum, m) => sum + m, 0) / depensesMois.length;
      const ecartType = Math.sqrt(
        depensesMois.reduce((sum, m) => sum + Math.pow(m - moyenne, 2), 0) / depensesMois.length
      );

      // Budget optimal = moyenne + 1 écart-type (marge de sécurité)
      const budgetOptimal = moyenne + ecartType;

      return {
        ...categorie,
        budgetMensuel: Math.round(budgetOptimal),
        budgetSuggere: Math.round(budgetOptimal),
        moyenneHistorique: Math.round(moyenne),
        ecartType: Math.round(ecartType)
      };
    });

    return optimized;
  }
}

export const budgetOptimization = new BudgetOptimizationEngine();

