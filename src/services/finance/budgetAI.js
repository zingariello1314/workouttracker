/**
 * Service d'Intelligence Artificielle pour le budget personnel
 * Détection de patterns et génération de recommandations
 */

import logger from '../../utils/logger';
import moment from 'moment';

const log = logger.module('budgetAI');

class BudgetAI {
  /**
   * Détecter patterns temporels dans l'historique
   */
  detectTemporalPatterns(historique) {
    if (!historique || historique.length === 0) {
      return {
        weekly: [],
        monthly: [],
        seasonal: [],
        trends: null
      };
    }

    const patterns = {
      weekly: this.analyzeWeeklyPattern(historique),
      monthly: this.analyzeMonthlyPattern(historique),
      seasonal: this.analyzeSeasonalPattern(historique),
      trends: this.calculateTrends(historique)
    };

    return patterns;
  }

  /**
   * Analyser pattern hebdomadaire
   */
  analyzeWeeklyPattern(historique) {
    const weeklyData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    historique.forEach(depense => {
      const day = new Date(depense.date).getDay();
      weeklyData[day].push(depense.montant);
    });

    const averages = Object.entries(weeklyData).map(([day, amounts]) => ({
      day: parseInt(day),
      dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][parseInt(day)],
      average: amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0,
      count: amounts.length,
      total: amounts.reduce((sum, a) => sum + a, 0)
    }));

    // Identifier jours avec dépenses élevées
    const maxDay = averages.reduce((max, day) => 
      day.average > max.average ? day : max
    , averages[0]);

    return {
      averages,
      maxDay,
      insights: this.generateWeeklyInsights(averages)
    };
  }

  /**
   * Analyser pattern mensuel
   */
  analyzeMonthlyPattern(historique) {
    const monthlyData = {};

    historique.forEach(depense => {
      const date = new Date(depense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(depense.montant);
    });

    const monthlyAverages = Object.entries(monthlyData).map(([month, amounts]) => ({
      month,
      average: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
      total: amounts.reduce((sum, a) => sum + a, 0),
      count: amounts.length
    }));

    return {
      monthlyAverages,
      insights: this.generateMonthlyInsights(monthlyAverages)
    };
  }

  /**
   * Analyser pattern saisonnier
   */
  analyzeSeasonalPattern(historique) {
    const seasonalData = {
      printemps: [],
      ete: [],
      automne: [],
      hiver: []
    };

    historique.forEach(depense => {
      const date = new Date(depense.date);
      const month = date.getMonth() + 1; // 1-12

      if (month >= 3 && month <= 5) {
        seasonalData.printemps.push(depense.montant);
      } else if (month >= 6 && month <= 8) {
        seasonalData.ete.push(depense.montant);
      } else if (month >= 9 && month <= 11) {
        seasonalData.automne.push(depense.montant);
      } else {
        seasonalData.hiver.push(depense.montant);
      }
    });

    const seasonalAverages = Object.entries(seasonalData).map(([season, amounts]) => ({
      season,
      average: amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0,
      total: amounts.reduce((sum, a) => sum + a, 0),
      count: amounts.length
    }));

    return {
      seasonalAverages,
      insights: this.generateSeasonalInsights(seasonalAverages)
    };
  }

  /**
   * Calculer tendances
   */
  calculateTrends(historique) {
    if (!historique || historique.length < 2) {
      return { base: 0, trend: 0, direction: 'stable' };
    }

    const sorted = [...historique].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Régression linéaire simple
    const n = sorted.length;
    const x = sorted.map((_, i) => i);
    const y = sorted.map(d => d.montant);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      base: intercept,
      trend: slope,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(slope) / (sumY / n) // Force relative
    };
  }

  /**
   * Générer insights hebdomadaires
   */
  generateWeeklyInsights(averages) {
    const insights = [];
    const maxDay = averages.reduce((max, day) => day.average > max.average ? day : max);
    const minDay = averages.reduce((min, day) => day.average < min.average ? day : min);

    if (maxDay.average > 0 && minDay.average > 0) {
      const ratio = maxDay.average / minDay.average;
      if (ratio > 1.5) {
        insights.push({
          type: 'weekly_pattern',
          message: `Tu dépenses ${ratio.toFixed(1)}x plus le ${maxDay.dayName} que le ${minDay.dayName}`,
          impact: 'medium',
          suggestion: `Évite les dépenses importantes le ${maxDay.dayName} si possible`
        });
      }
    }

    return insights;
  }

  /**
   * Générer insights mensuels
   */
  generateMonthlyInsights(monthlyAverages) {
    const insights = [];
    
    if (monthlyAverages.length >= 3) {
      const recent = monthlyAverages.slice(-3);
      const avgRecent = recent.reduce((sum, m) => sum + m.average, 0) / recent.length;
      const older = monthlyAverages.slice(0, -3);
      
      if (older.length > 0) {
        const avgOlder = older.reduce((sum, m) => sum + m.average, 0) / older.length;
        const change = ((avgRecent - avgOlder) / avgOlder) * 100;

        if (Math.abs(change) > 10) {
          insights.push({
            type: 'trend',
            message: change > 0 
              ? `Dépenses en hausse de ${change.toFixed(0)}% sur les 3 derniers mois`
              : `Dépenses en baisse de ${Math.abs(change).toFixed(0)}% sur les 3 derniers mois`,
            impact: change > 0 ? 'high' : 'positive',
            suggestion: change > 0 
              ? 'Analyse les catégories qui ont le plus augmenté'
              : 'Continue sur cette lancée !'
          });
        }
      }
    }

    return insights;
  }

  /**
   * Générer insights saisonniers
   */
  generateSeasonalInsights(seasonalAverages) {
    const insights = [];
    const maxSeason = seasonalAverages.reduce((max, s) => s.average > max.average ? s : max);
    const minSeason = seasonalAverages.reduce((min, s) => s.average < min.average ? s : min);

    if (maxSeason.average > 0 && minSeason.average > 0) {
      const ratio = maxSeason.average / minSeason.average;
      if (ratio > 1.3) {
        const seasonNames = {
          printemps: 'Printemps',
          ete: 'Été',
          automne: 'Automne',
          hiver: 'Hiver'
        };
        insights.push({
          type: 'seasonal_pattern',
          message: `Dépenses ${ratio.toFixed(1)}x plus élevées en ${seasonNames[maxSeason.season]}`,
          impact: 'medium',
          suggestion: `Prépare un budget plus élevé pour le ${seasonNames[maxSeason.season]}`
        });
      }
    }

    return insights;
  }

  /**
   * Générer recommandations contextuelles
   */
  generateRecommendations(budget, historique, depensesMoisActuel) {
    const recommendations = [];

    if (!budget || !historique) return recommendations;

    // 1. Micro-ajustements
    const microAdjustments = this.generateMicroAdjustments(budget, depensesMoisActuel);
    recommendations.push(...microAdjustments);

    // 2. Substitutions
    const substitutions = this.generateSubstitutions(historique);
    recommendations.push(...substitutions);

    // 3. Optimisations groupées
    const optimizations = this.generateOptimizations(budget, historique);
    recommendations.push(...optimizations);

    // 4. Objectifs adaptatifs
    const adaptiveGoals = this.generateAdaptiveGoals(budget, historique);
    recommendations.push(...adaptiveGoals);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Générer micro-ajustements
   */
  generateMicroAdjustments(budget, depensesMoisActuel) {
    const recommendations = [];

    if (!budget.depenses?.categories) return recommendations;

    budget.depenses.categories.forEach(categorie => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === categorie.id);
      const depenseMois = depensesCat.reduce((sum, d) => sum + d.montant, 0);
      const budgetCat = categorie.budgetMensuel || 0;

      if (budgetCat > 0) {
        const pourcentUtilise = (depenseMois / budgetCat) * 100;

        // Si proche du budget (85-95%)
        if (pourcentUtilise >= 85 && pourcentUtilise < 95) {
          const restant = budgetCat - depenseMois;
          recommendations.push({
            type: 'micro_adjustment',
            category: categorie.nom,
            priority: 'medium',
            message: `${categorie.nom} : ${restant.toFixed(0)}€ restants (${(100 - pourcentUtilise).toFixed(0)}%)`,
            suggestion: `Reporter un achat de 48h pourrait te faire économiser ${(restant * 0.1).toFixed(0)}€`,
            impact: `+${(restant * 0.1).toFixed(0)}€ épargne potentielle`,
            action: 'DEFER_PURCHASE'
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Générer substitutions
   */
  generateSubstitutions(historique) {
    const recommendations = [];

    // Détecter dépenses récurrentes coûteuses
    const categoryTotals = {};
    historique.forEach(depense => {
      if (!categoryTotals[depense.categorie]) {
        categoryTotals[depense.categorie] = { total: 0, count: 0 };
      }
      categoryTotals[depense.categorie].total += depense.montant;
      categoryTotals[depense.categorie].count += 1;
    });

    // Exemples de substitutions (à adapter selon catégories)
    const substitutions = {
      'Loisirs': {
        expensive: 'Cinéma (12€)',
        cheap: 'Streaming (3€)',
        savings: 9
      },
      'Restaurant': {
        expensive: 'Restaurant (25€)',
        cheap: 'Repas maison (8€)',
        savings: 17
      }
    };

    Object.entries(categoryTotals).forEach(([catId, data]) => {
      if (data.count >= 4 && data.total / data.count > 15) {
        // Dépense moyenne élevée et fréquente
        recommendations.push({
          type: 'substitution',
          category: catId,
          priority: 'low',
          message: `Dépenses moyennes élevées dans cette catégorie`,
          suggestion: `Envisager des alternatives moins coûteuses pourrait économiser ~${(data.total / data.count * 0.3).toFixed(0)}€ par transaction`,
          impact: `~${((data.total / data.count * 0.3) * data.count).toFixed(0)}€/mois potentiels`,
          action: 'SUGGEST_ALTERNATIVES'
        });
      }
    });

    return recommendations;
  }

  /**
   * Générer optimisations groupées
   */
  generateOptimizations(budget, historique) {
    const recommendations = [];

    if (!budget.depenses?.categories) return recommendations;

    // Identifier catégories avec potentiel d'optimisation
    const optimizations = [];
    budget.depenses.categories.forEach(categorie => {
      const depensesCat = historique.filter(d => d.categorie === categorie.id);
      if (depensesCat.length === 0) return;

      const depenseMoyenne = depensesCat.reduce((sum, d) => sum + d.montant, 0) / depensesCat.length;
      const budgetCat = categorie.budgetMensuel || 0;

      if (budgetCat > 0 && depenseMoyenne < budgetCat * 0.7) {
        // Catégorie sous-utilisée
        const potentialSavings = (budgetCat - depenseMoyenne) * 0.2; // 20% d'optimisation possible
        optimizations.push({
          category: categorie.nom,
          savings: potentialSavings
        });
      }
    });

    if (optimizations.length >= 3) {
      const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0);
      recommendations.push({
        type: 'grouped_optimization',
        priority: 'high',
        message: `${optimizations.length} catégories avec potentiel d'optimisation`,
        suggestion: `3 changements simples pourraient économiser ${totalSavings.toFixed(0)}€/mois`,
        impact: `+${totalSavings.toFixed(0)}€/mois`,
        action: 'SHOW_OPTIMIZATION_PLAN',
        categories: optimizations.map(opt => opt.category)
      });
    }

    return recommendations;
  }

  /**
   * Générer objectifs adaptatifs
   */
  generateAdaptiveGoals(budget, historique) {
    const recommendations = [];

    if (!budget.depenses?.categories) return recommendations;

    // Analyser performance vs objectifs
    budget.depenses.categories.forEach(categorie => {
      const depensesCat = historique.filter(d => d.categorie === categorie.id);
      if (depensesCat.length < 3) return; // Pas assez de données

      const depenseMoyenne = depensesCat.reduce((sum, d) => sum + d.montant, 0) / depensesCat.length;
      const budgetCat = categorie.budgetMensuel || 0;

      if (budgetCat > 0) {
        const ratio = depenseMoyenne / budgetCat;

        // Budget trop serré (dépenses moyennes > 95% du budget)
        if (ratio > 0.95 && ratio < 1.05) {
          recommendations.push({
            type: 'adaptive_goal',
            category: categorie.nom,
            priority: 'low',
            message: `${categorie.nom} : Budget très serré`,
            suggestion: `Envisager d'augmenter le budget de ${(budgetCat * 0.1).toFixed(0)}€ pour plus de flexibilité`,
            impact: 'Meilleure gestion',
            action: 'SUGGEST_BUDGET_INCREASE'
          });
        }

        // Budget trop large (dépenses moyennes < 60% du budget)
        if (ratio < 0.6) {
          recommendations.push({
            type: 'adaptive_goal',
            category: categorie.nom,
            priority: 'medium',
            message: `${categorie.nom} : Budget sous-utilisé`,
            suggestion: `Réduire le budget de ${(budgetCat * 0.2).toFixed(0)}€ et réallouer ailleurs`,
            impact: `+${(budgetCat * 0.2).toFixed(0)}€ disponibles`,
            action: 'SUGGEST_BUDGET_REDUCTION'
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Prédire dépenses futures
   */
  predictFutureExpenses(historique, months = 3) {
    if (!historique || historique.length < 2) {
      return [];
    }

    const trends = this.calculateTrends(historique);
    const predictions = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      const predicted = {
        month: futureDate.toISOString().slice(0, 7),
        montant: trends.base + (trends.trend * i),
        confidence: Math.max(0, 100 - (i * 10)), // Confiance décroît avec distance
        direction: trends.direction
      };

      predictions.push(predicted);
    }

    return predictions;
  }
}

export const budgetAI = new BudgetAI();



