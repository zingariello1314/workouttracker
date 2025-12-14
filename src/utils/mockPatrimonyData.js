/**
 * Données de test pour le graphique patrimoine
 * Permet de tester le nouveau graphique intelligent
 */

export const generateMockPatrimonyData = (days = 30) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let basePatrimony = 45000; // Patrimoine de base
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulation d'évolution réaliste du patrimoine
    const dailyVariation = (Math.random() - 0.5) * 200; // Variation de -100€ à +100€
    const weeklyTrend = Math.sin(i / 7) * 150; // Tendance hebdomadaire
    const monthlyGrowth = i * 15; // Croissance mensuelle progressive
    
    basePatrimony += dailyVariation + weeklyTrend / 7 + monthlyGrowth / 30;
    
    data.push({
      date: date.toISOString().split('T')[0],
      netWorth: Math.round(basePatrimony),
      savings: Math.round(500 + Math.random() * 200), // Épargne mensuelle
      investments: Math.round(basePatrimony * 0.6), // 60% en investissements
      objectivesReached: Math.random() > 0.7 ? 1 : 0 // 30% de chance d'atteindre un objectif
    });
  }
  
  return data;
};

export const mockPatrimonyModule = {
  finances: {
    patrimony: {
      history: generateMockPatrimonyData(90) // 3 mois de données
    }
  }
};