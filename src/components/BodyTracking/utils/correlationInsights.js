/**
 * Génération d'insights et recommandations basés sur les corrélations
 */

import { calculatePearsonCorrelation } from './correlationUtils';

/**
 * Génère des insights automatiques basés sur une corrélation
 * @param {string} var1 - Nom de la première variable
 * @param {string} var2 - Nom de la deuxième variable
 * @param {number} correlation - Coefficient de corrélation
 * @param {string} strength - Force ('strong' | 'moderate' | 'weak')
 * @param {string} direction - Direction ('positive' | 'negative')
 * @param {number} dataPoints - Nombre de points de données
 * @param {Array} dates - Dates des mesures
 * @returns {Array} Tableau d'insights
 */
export const generateInsights = (var1, var2, correlation, strength, direction, dataPoints, dates) => {
  const insights = [];
  const absCorr = Math.abs(correlation);

  // Insight basé sur la force de la corrélation
  if (strength === 'strong') {
    if (direction === 'positive') {
      insights.push(`Forte relation positive : ${var1} et ${var2} évoluent dans le même sens.`);
    } else {
      insights.push(`Forte relation inverse : ${var1} augmente quand ${var2} diminue.`);
    }
  } else if (strength === 'moderate') {
    insights.push(`Relation modérée observée entre ${var1} et ${var2}.`);
  } else {
    insights.push(`Relation faible entre ${var1} et ${var2}. D'autres facteurs influencent probablement ces variables.`);
  }

  // Insight basé sur le nombre de points de données
  if (dataPoints >= 30) {
    insights.push(`Corrélation basée sur ${dataPoints} points de données, ce qui assure une bonne fiabilité.`);
  } else if (dataPoints >= 10) {
    insights.push(`Corrélation basée sur ${dataPoints} points de données. Ajouter plus de mesures améliorera la précision.`);
  } else {
    insights.push(`Corrélation basée sur ${dataPoints} points de données. Plus de données sont nécessaires pour une analyse fiable.`);
  }

  // Insights spécifiques selon les variables
  const specificInsights = getSpecificInsights(var1, var2, correlation, direction);
  insights.push(...specificInsights);

  return insights;
};

/**
 * Génère des recommandations basées sur une corrélation
 * @param {string} var1 - Nom de la première variable
 * @param {string} var2 - Nom de la deuxième variable
 * @param {number} correlation - Coefficient de corrélation
 * @param {string} strength - Force
 * @param {string} direction - Direction
 * @returns {Array} Tableau de recommandations
 */
export const generateRecommendations = (var1, var2, correlation, strength, direction) => {
  const recommendations = [];
  const absCorr = Math.abs(correlation);

  // Recommandations générales basées sur la force
  if (strength === 'strong' && direction === 'positive') {
    recommendations.push(`Cibler ${var1} pour améliorer simultanément ${var2}.`);
  } else if (strength === 'strong' && direction === 'negative') {
    recommendations.push(`Réduire ${var1} peut aider à améliorer ${var2}.`);
  }

  // Recommandations spécifiques
  const specificRecs = getSpecificRecommendations(var1, var2, correlation, strength, direction);
  recommendations.push(...specificRecs);

  return recommendations.length > 0 ? recommendations : [
    `Surveiller l'évolution de ${var1} et ${var2} pour mieux comprendre leur relation.`
  ];
};

/**
 * Génère des insights spécifiques selon les paires de variables
 */
const getSpecificInsights = (var1, var2, correlation, direction) => {
  const insights = [];
  const var1Lower = var1.toLowerCase();
  const var2Lower = var2.toLowerCase();

  // Poids vs Tour de taille
  if ((var1Lower.includes('poids') || var1Lower.includes('weight')) && 
      (var2Lower.includes('taille') || var2Lower.includes('waist'))) {
    if (correlation > 0.7) {
      insights.push(`Perte de poids et réduction du tour de taille sont fortement liées. Chaque kg perdu correspond approximativement à une réduction du tour de taille.`);
    }
  }

  // Masse musculaire vs Métabolisme
  if ((var1Lower.includes('muscle') || var1Lower.includes('musculaire')) && 
      (var2Lower.includes('métabolisme') || var2Lower.includes('metabolism') || var2Lower.includes('basal'))) {
    if (correlation > 0.7) {
      insights.push(`Augmenter la masse musculaire stimule directement le métabolisme de base.`);
    }
  }

  // Graisse corporelle vs Graisse viscérale
  if ((var1Lower.includes('graisse') || var1Lower.includes('fat')) && 
      (var2Lower.includes('viscérale') || var2Lower.includes('visceral'))) {
    if (correlation > 0.6) {
      insights.push(`Réduction simultanée de la graisse corporelle totale et viscérale observée.`);
    }
  }

  // Eau corporelle vs Masse musculaire
  if ((var1Lower.includes('eau') || var1Lower.includes('water')) && 
      (var2Lower.includes('muscle') || var2Lower.includes('musculaire'))) {
    if (correlation > 0.5) {
      insights.push(`Bonne hydratation favorise le maintien de la masse musculaire.`);
    }
  }

  // IMC vs Mensurations
  if (var1Lower.includes('imc') || var2Lower.includes('imc')) {
    const otherVar = var1Lower.includes('imc') ? var2Lower : var1Lower;
    if (correlation > 0.6 && (otherVar.includes('taille') || otherVar.includes('waist') || otherVar.includes('chest'))) {
      insights.push(`L'IMC est corrélé avec les mensurations, confirmant l'évolution globale de la composition corporelle.`);
    }
  }

  return insights;
};

/**
 * Génère des recommandations spécifiques selon les paires de variables
 */
const getSpecificRecommendations = (var1, var2, correlation, strength, direction) => {
  const recommendations = [];
  const var1Lower = var1.toLowerCase();
  const var2Lower = var2.toLowerCase();

  // Poids vs Tour de taille (forte corrélation positive)
  if ((var1Lower.includes('poids') || var1Lower.includes('weight')) && 
      (var2Lower.includes('taille') || var2Lower.includes('waist'))) {
    if (strength === 'strong' && direction === 'positive') {
      recommendations.push(`Continuer les efforts de perte de poids pour réduire le tour de taille.`);
      recommendations.push(`Intégrer des exercices ciblés pour la zone abdominale.`);
    }
  }

  // Masse musculaire vs Métabolisme
  if ((var1Lower.includes('muscle') || var1Lower.includes('musculaire')) && 
      (var2Lower.includes('métabolisme') || var2Lower.includes('metabolism') || var2Lower.includes('basal'))) {
    if (strength === 'strong') {
      recommendations.push(`Maintenir ou augmenter la masse musculaire pour optimiser le métabolisme.`);
      recommendations.push(`Privilégier les exercices de résistance.`);
    }
  }

  // Graisse corporelle vs Graisse viscérale
  if ((var1Lower.includes('graisse') || var1Lower.includes('fat')) && 
      (var2Lower.includes('viscérale') || var2Lower.includes('visceral'))) {
    if (strength === 'strong' && direction === 'positive') {
      recommendations.push(`Continuer le programme actuel de réduction de graisse.`);
      recommendations.push(`Maintenir l'activité cardio régulière.`);
    }
  }

  // Eau corporelle vs Masse musculaire
  if ((var1Lower.includes('eau') || var1Lower.includes('water')) && 
      (var2Lower.includes('muscle') || var2Lower.includes('musculaire'))) {
    if (strength === 'moderate' || strength === 'strong') {
      recommendations.push(`Maintenir une hydratation optimale (2-3L/jour).`);
      recommendations.push(`Surveiller l'hydratation les jours d'entraînement.`);
    }
  }

  return recommendations;
};

/**
 * Détermine la tendance d'une corrélation basée sur l'évolution récente
 * @param {Array} dates - Dates des mesures (triées)
 * @param {Array} x - Valeurs de la première variable
 * @param {Array} y - Valeurs de la deuxième variable
 * @param {number} correlation - Coefficient de corrélation global
 * @returns {string} 'increasing' | 'decreasing' | 'stable' | 'improving'
 */
export const determineTrend = (dates, x, y, correlation) => {
  if (!dates || dates.length < 3 || !x || !y || x.length < 3) {
    return 'stable';
  }

  // Prendre les 30% derniers points pour analyser la tendance récente
  const recentCount = Math.max(3, Math.floor(dates.length * 0.3));
  const recentX = x.slice(-recentCount);
  const recentY = y.slice(-recentCount);

  // Calculer la corrélation récente
  const recentCorr = calculatePearsonCorrelation(recentX, recentY);

  if (recentCorr.correlation == null) {
    return 'stable';
  }

  const diff = Math.abs(recentCorr.correlation) - Math.abs(correlation);

  if (diff > 0.1) {
    return correlation > 0 ? 'increasing' : 'improving';
  } else if (diff < -0.1) {
    return 'decreasing';
  } else {
    return 'stable';
  }
};


