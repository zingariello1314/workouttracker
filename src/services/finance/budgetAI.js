/**
 * Service budgetAI - Intelligence Artificielle pour analyse prédictive
 * Détection de patterns temporels, saisonniers, corrélations
 */

import logger from '../../utils/logger';

const log = logger.module('budgetAI');

class BudgetAI {
  /**
   * Détection de patterns temporels
   * @param {Array} historique - Historique des dépenses
   * @returns {Object} Patterns détectés (weekly, monthly, seasonal)
   */
  detectTemporalPatterns(historique) {
    if (!historique || historique.length === 0) {
      return {
        weekly: [],
        monthly: [],
        seasonal: []
      };
    }

    const patterns = {
      weekly: this.analyzeWeeklyPattern(historique),
      monthly: this.analyzeMonthlyPattern(historique),
      seasonal: this.analyzeSeasonalPattern(historique)
    };

    return patterns;
  }

  /**
   * Analyse pattern hebdomadaire
   */
  analyzeWeeklyPattern(historique) {
    const weeklyData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    historique.forEach(depense => {
      const date = new Date(depense.date);
      const day = date.getDay();
      weeklyData[day].push(depense.montant || 0);
    });

    const averages = Object.entries(weeklyData).map(([day, amounts]) => ({
      day: parseInt(day),
      dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][parseInt(day)],
      average: amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0,
      count: amounts.length
    }));

    return averages;
  }

  /**
   * Analyse pattern mensuel
   */
  analyzeMonthlyPattern(historique) {
    const monthlyData = {};

    historique.forEach(depense => {
      const date = new Date(depense.date);
      const month = date.getMonth();
      
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(depense.montant || 0);
    });

    const averages = Object.entries(monthlyData).map(([month, amounts]) => ({
      month: parseInt(month),
      monthName: new Date(2000, parseInt(month), 1).toLocaleString('fr-FR', { month: 'long' }),
      average: amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0,
      count: amounts.length
    }));

    return averages;
  }

  /**
   * Analyse pattern saisonnier
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
      const month = date.getMonth();
      
      if (month >= 2 && month <= 4) {
        seasonalData.printemps.push(depense.montant || 0);
      } else if (month >= 5 && month <= 7) {
        seasonalData.ete.push(depense.montant || 0);
      } else if (month >= 8 && month <= 10) {
        seasonalData.automne.push(depense.montant || 0);
      } else {
        seasonalData.hiver.push(depense.montant || 0);
      }
    });

    return Object.entries(seasonalData).map(([season, amounts]) => ({
      season,
      seasonName: season.charAt(0).toUpperCase() + season.slice(1),
      average: amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0,
      count: amounts.length
    }));
  }

  /**
   * Prédiction dépenses futures
   * @param {Array} historique - Historique des dépenses
   * @param {number} months - Nombre de mois à prédire
   * @returns {Array} Prédictions
   */
  predictFutureExpenses(historique, months = 3) {
    if (!historique || historique.length === 0) {
      return [];
    }

    const trends = this.calculateTrends(historique);
    const predictions = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      const predicted = {
        month: futureDate.toISOString().slice(0, 7),
        monthName: futureDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
        montant: trends.base + (trends.trend * i),
        confidence: Math.max(0, 100 - (i * 10))
      };

      predictions.push(predicted);
    }

    return predictions;
  }

  /**
   * Calcul tendances (régression linéaire simple)
   */
  calculateTrends(historique) {
    const sorted = [...historique]
      .filter(d => d.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length < 2) {
      return { base: 0, trend: 0 };
    }

    const n = sorted.length;
    const x = sorted.map((_, i) => i);
    const y = sorted.map(d => d.montant || 0);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      base: intercept,
      trend: slope
    };
  }

  /**
   * Détection de corrélations
   * @param {Array} historique - Historique des dépenses
   * @param {Array} events - Événements externes (stress, etc.)
   * @returns {Array} Corrélations détectées
   */
  detectCorrelations(historique, events = []) {
    const correlations = [];

    const weeklyPattern = this.analyzeWeeklyPattern(historique);
    if (weeklyPattern.length > 0) {
      const maxDay = weeklyPattern.reduce((max, day) => 
        day.average > max.average ? day : max, weeklyPattern[0]
      );

      if (maxDay && maxDay.average > 0) {
        const avgAll = weeklyPattern.reduce((sum, d) => sum + d.average, 0) / weeklyPattern.length;
        const variation = avgAll > 0 ? ((maxDay.average / avgAll) - 1) * 100 : 0;
        
        correlations.push({
          type: 'TEMPORAL',
          message: `Dépenses plus élevées le ${maxDay.dayName} (+${variation.toFixed(0)}%)`,
          confidence: 70
        });
      }
    }

    return correlations;
  }
}

export const budgetAI = new BudgetAI();
export default budgetAI;
