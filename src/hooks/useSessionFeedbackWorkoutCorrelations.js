/**
 * useSessionFeedbackWorkoutCorrelations.js
 * 
 * Hook React pour analyser les corrélations entre feedbacks de session et entraînements.
 * 
 * Ce hook identifie les relations entre :
 * - Ressenti et performance d'entraînement
 * - Motivation et régularité d'entraînement
 * - Énergie et intensité d'entraînement
 * - Conditions (sommeil, hydratation, nutrition) et performance
 * - Environnement et satisfaction
 * - Objectifs atteints et progression
 * 
 * Optimisations :
 * - Utilisation de useMemo pour éviter recalculs inutiles
 * - Calculs de corrélation optimisés
 * - Gestion gracieuse des données manquantes
 * - Support de différentes périodes d'analyse
 * 
 * @module hooks/useSessionFeedbackWorkoutCorrelations
 */

import { useMemo } from 'react';
import { DateHelper } from '../utils/dateHelper';

/**
 * Calcule le coefficient de corrélation de Pearson entre deux séries
 * @param {Array<number>} x - Première série
 * @param {Array<number>} y - Deuxième série
 * @returns {number|null} Coefficient de corrélation (-1 à 1) ou null si impossible
 */
function calculateCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    return null;
  }
  
  const validPairs = x.map((xi, i) => ({ x: xi, y: y[i] }))
    .filter(pair => pair.x !== null && pair.y !== null && !isNaN(pair.x) && !isNaN(pair.y));
  
  if (validPairs.length < 2) {
    return null;
  }
  
  const n = validPairs.length;
  const sumX = validPairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = validPairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = validPairs.reduce((sum, p) => sum + p.y * p.y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) {
    return null;
  }
  
  return numerator / denominator;
}

/**
 * Calcule l'intensité d'une session d'entraînement
 * @param {Object} session - Session d'entraînement
 * @returns {number} Intensité (0-100)
 */
function calculateWorkoutIntensity(session) {
  if (!session) return 0;
  
  // Calculer l'intensité basée sur les répétitions totales
  let totalReps = 0;
  
  if (session.exercises && Array.isArray(session.exercises)) {
    totalReps = session.exercises.reduce((sum, ex) => {
      const reps = ex.reps || 0;
      return sum + (typeof reps === 'number' ? reps : 0);
    }, 0);
  }
  
  // Normaliser (0-100) basé sur une estimation
  // 100 reps = intensité modérée, 200+ = haute intensité
  const intensity = Math.min(100, (totalReps / 200) * 100);
  
  return Math.round(intensity);
}

/**
 * Normalise une date depuis différents formats
 * @param {string|Date|number} dateInput - Date à normaliser
 * @returns {string|null} Date normalisée YYYY-MM-DD ou null
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    let date;
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return null;
    }
    
    if (isNaN(date.getTime())) return null;
    
    return DateHelper.toYYYYMMDD(date);
  } catch {
    return null;
  }
}

/**
 * Hook pour analyser les corrélations entre Session Feedbacks et entraînements
 * 
 * @param {Object} sessionFeedbacks - Objet des feedbacks par date { "YYYY-MM-DD": feedback }
 * @param {Array} workoutHistory - Historique des sessions d'entraînement
 * @param {Object} options - Options d'analyse
 * @param {string} options.period - Période d'analyse ('7days' | '30days' | '90days' | '1year' | 'all')
 * @param {string} options.startDate - Date de début personnalisée (YYYY-MM-DD, optionnel)
 * @param {string} options.endDate - Date de fin personnalisée (YYYY-MM-DD, optionnel)
 * 
 * @returns {Object|null} Corrélations analysées ou null si données insuffisantes
 * @returns {Object} returns.ressentiWorkout - Corrélation Ressenti ↔ Performance
 * @returns {Object} returns.motivationWorkout - Corrélation Motivation ↔ Régularité
 * @returns {Object} returns.energyWorkout - Corrélation Énergie ↔ Performance
 * @returns {Object} returns.conditionsWorkout - Corrélation Conditions ↔ Performance
 * @returns {Object} returns.environmentWorkout - Analyse Environnement ↔ Satisfaction
 * @returns {Object} returns.objectivesWorkout - Analyse Objectifs ↔ Progression
 * @returns {Array} returns.insights - Insights et recommandations
 * 
 * @example
 * const correlations = useSessionFeedbackWorkoutCorrelations(sessionFeedbacks, workoutHistory, { period: '30days' });
 * 
 * if (correlations) {
 *   console.log(`Corrélation Ressenti: ${correlations.ressentiWorkout.correlation}`);
 *   console.log(`Insights: ${correlations.insights.length}`);
 * }
 */
export function useSessionFeedbackWorkoutCorrelations(sessionFeedbacks, workoutHistory, options = {}) {
  const {
    period = '30days',
    startDate: customStartDate,
    endDate: customEndDate
  } = options;
  
  return useMemo(() => {
    // Validation des données
    if (!sessionFeedbacks || typeof sessionFeedbacks !== 'object') {
      return null;
    }
    
    const feedbackEntries = Object.entries(sessionFeedbacks);
    if (feedbackEntries.length === 0) {
      return null;
    }
    
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
      return null;
    }
    
    // Calculer les dates de période
    let startDate, endDate;
    const today = DateHelper.getTodayLocal();
    
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const end = new Date(today + 'T23:59:59');
      endDate = today;
      
      const start = new Date(today);
      switch (period) {
        case '7days':
          start.setDate(start.getDate() - 7);
          break;
        case '30days':
          start.setDate(start.getDate() - 30);
          break;
        case '90days':
          start.setDate(start.getDate() - 90);
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'all':
        default:
          const firstFeedbackDate = feedbackEntries
            .map(([date]) => normalizeDate(date))
            .filter(Boolean)
            .sort()[0];
          startDate = firstFeedbackDate || today;
          endDate = today;
          break;
      }
      
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
        startDate = DateHelper.toYYYYMMDD(start) || today;
      }
    }
    
    // Filtrer les feedbacks et sessions dans la période
    const filteredFeedbacks = feedbackEntries
      .map(([date, feedback]) => {
        const normalizedDate = normalizeDate(date);
        if (!normalizedDate) return null;
        
        try {
          const dateObj = new Date(normalizedDate + 'T00:00:00');
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T23:59:59');
          if (!isNaN(dateObj.getTime()) && dateObj >= start && dateObj <= end) {
            return { date: normalizedDate, feedback };
          }
        } catch {
          return null;
        }
        return null;
      })
      .filter(Boolean);
    
    const filteredSessions = workoutHistory.filter(session => {
      if (!session?.date) return false;
      try {
        const sessionDate = session.date instanceof Date 
          ? DateHelper.toYYYYMMDD(session.date)
          : session.date;
        const date = new Date(sessionDate + 'T00:00:00');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return !isNaN(date.getTime()) && date >= start && date <= end;
      } catch {
        return false;
      }
    });
    
    if (filteredSessions.length === 0) {
      return null;
    }
    
    // Créer un mapping date → feedback et date → sessions
    const feedbacksByDate = {};
    filteredFeedbacks.forEach(({ date, feedback }) => {
      if (date) {
        feedbacksByDate[date] = feedback;
      }
    });
    
    const sessionsByDate = {};
    filteredSessions.forEach(session => {
      const sessionDate = session.date instanceof Date 
        ? DateHelper.toYYYYMMDD(session.date)
        : session.date;
      if (sessionDate) {
        if (!sessionsByDate[sessionDate]) {
          sessionsByDate[sessionDate] = [];
        }
        sessionsByDate[sessionDate].push(session);
      }
    });
    
    // ==================== CORRÉLATION RESSENTI ↔ PERFORMANCE ====================
    const ressentiWorkoutPairs = [];
    Object.keys(sessionsByDate).forEach(date => {
      const feedback = feedbacksByDate[date];
      const sessions = sessionsByDate[date] || [];
      
      if (feedback && sessions.length > 0 && feedback.ressenti !== null && feedback.ressenti > 0) {
        const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
        ressentiWorkoutPairs.push({ ressenti: feedback.ressenti, intensity: avgIntensity });
      }
    });
    
    const ressentiCorrelation = ressentiWorkoutPairs.length >= 3
      ? calculateCorrelation(
          ressentiWorkoutPairs.map(p => p.ressenti),
          ressentiWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION MOTIVATION ↔ RÉGULARITÉ ====================
    // Analyser si la motivation est associée à plus de sessions
    const motivationRegularityPairs = [];
    const datesWithFeedback = Object.keys(feedbacksByDate);
    const datesWithSessions = Object.keys(sessionsByDate);
    
    // Pour chaque semaine, calculer motivation moyenne et nombre de sessions
    const weeklyData = {};
    datesWithFeedback.forEach(date => {
      const feedback = feedbacksByDate[date];
      if (feedback && feedback.motivation !== null && feedback.motivation > 0) {
        const dateObj = new Date(date + 'T00:00:00');
        const weekKey = `${dateObj.getFullYear()}-W${Math.ceil((dateObj.getDate() + dateObj.getDay()) / 7)}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { motivations: [], sessions: 0 };
        }
        weeklyData[weekKey].motivations.push(feedback.motivation);
      }
    });
    
    datesWithSessions.forEach(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const weekKey = `${dateObj.getFullYear()}-W${Math.ceil((dateObj.getDate() + dateObj.getDay()) / 7)}`;
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].sessions += sessionsByDate[date].length;
      }
    });
    
    Object.entries(weeklyData).forEach(([week, data]) => {
      if (data.motivations.length > 0 && data.sessions > 0) {
        const avgMotivation = data.motivations.reduce((sum, m) => sum + m, 0) / data.motivations.length;
        motivationRegularityPairs.push({ motivation: avgMotivation, sessions: data.sessions });
      }
    });
    
    const motivationCorrelation = motivationRegularityPairs.length >= 3
      ? calculateCorrelation(
          motivationRegularityPairs.map(p => p.motivation),
          motivationRegularityPairs.map(p => p.sessions)
        )
      : null;
    
    // ==================== CORRÉLATION ÉNERGIE ↔ PERFORMANCE ====================
    const energyWorkoutPairs = [];
    Object.keys(sessionsByDate).forEach(date => {
      const feedback = feedbacksByDate[date];
      const sessions = sessionsByDate[date] || [];
      
      if (feedback && sessions.length > 0) {
        const energieDebut = feedback.energieDebut || null;
        const energieFin = feedback.energieFin || null;
        const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
        
        if (energieDebut !== null && energieDebut > 0) {
          energyWorkoutPairs.push({ energy: energieDebut, intensity: avgIntensity, type: 'debut' });
        }
        if (energieFin !== null && energieFin > 0) {
          energyWorkoutPairs.push({ energy: energieFin, intensity: avgIntensity, type: 'fin' });
        }
      }
    });
    
    const energyCorrelation = energyWorkoutPairs.length >= 3
      ? calculateCorrelation(
          energyWorkoutPairs.map(p => p.energy),
          energyWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== CORRÉLATION CONDITIONS ↔ PERFORMANCE ====================
    const conditionsWorkoutPairs = [];
    Object.keys(sessionsByDate).forEach(date => {
      const feedback = feedbacksByDate[date];
      const sessions = sessionsByDate[date] || [];
      
      if (feedback && sessions.length > 0) {
        const sommeil = feedback.sommeil || null;
        const hydratation = feedback.hydratation || null;
        const nutrition = feedback.nutrition || null;
        const avgIntensity = sessions.reduce((sum, s) => sum + calculateWorkoutIntensity(s), 0) / sessions.length;
        
        const conditionsScore = [
          sommeil, hydratation, nutrition
        ].filter(v => v !== null && v > 0).reduce((sum, v) => sum + v, 0) / 3;
        
        if (!isNaN(conditionsScore) && conditionsScore > 0) {
          conditionsWorkoutPairs.push({ conditions: conditionsScore, intensity: avgIntensity });
        }
      }
    });
    
    const conditionsCorrelation = conditionsWorkoutPairs.length >= 3
      ? calculateCorrelation(
          conditionsWorkoutPairs.map(p => p.conditions),
          conditionsWorkoutPairs.map(p => p.intensity)
        )
      : null;
    
    // ==================== ANALYSE ENVIRONNEMENT ↔ SATISFACTION ====================
    const environmentSatisfaction = {};
    Object.keys(sessionsByDate).forEach(date => {
      const feedback = feedbacksByDate[date];
      if (feedback && feedback.environnement && feedback.ressenti !== null && feedback.ressenti > 0) {
        if (!environmentSatisfaction[feedback.environnement]) {
          environmentSatisfaction[feedback.environnement] = { ressentis: [], count: 0 };
        }
        environmentSatisfaction[feedback.environnement].ressentis.push(feedback.ressenti);
        environmentSatisfaction[feedback.environnement].count++;
      }
    });
    
    const environmentStats = Object.entries(environmentSatisfaction).map(([env, data]) => ({
      environment: env,
      avgRessenti: data.ressentis.reduce((sum, r) => sum + r, 0) / data.ressentis.length,
      count: data.count
    }));
    
    // ==================== ANALYSE OBJECTIFS ↔ PROGRESSION ====================
    let objectivesAnalysis = null;
    const objectivesWithSessions = filteredFeedbacks.filter(({ date, feedback }) => {
      return feedback.objectifAtteint !== null && sessionsByDate[date] && sessionsByDate[date].length > 0;
    });
    
    if (objectivesWithSessions.length > 0) {
      const reachedWithSessions = objectivesWithSessions.filter(({ feedback }) => feedback.objectifAtteint === true);
      const notReachedWithSessions = objectivesWithSessions.filter(({ feedback }) => feedback.objectifAtteint === false);
      
      const avgIntensityReached = reachedWithSessions.length > 0
        ? reachedWithSessions.reduce((sum, { date }) => {
            const sessions = sessionsByDate[date] || [];
            return sum + sessions.reduce((s, session) => s + calculateWorkoutIntensity(session), 0) / sessions.length;
          }, 0) / reachedWithSessions.length
        : null;
      
      const avgIntensityNotReached = notReachedWithSessions.length > 0
        ? notReachedWithSessions.reduce((sum, { date }) => {
            const sessions = sessionsByDate[date] || [];
            return sum + sessions.reduce((s, session) => s + calculateWorkoutIntensity(session), 0) / sessions.length;
          }, 0) / notReachedWithSessions.length
        : null;
      
      objectivesAnalysis = {
        reached: reachedWithSessions.length,
        notReached: notReachedWithSessions.length,
        avgIntensityReached,
        avgIntensityNotReached,
        intensityDifference: avgIntensityReached !== null && avgIntensityNotReached !== null
          ? avgIntensityReached - avgIntensityNotReached
          : null
      };
    }
    
    // ==================== GÉNÉRATION D'INSIGHTS ====================
    const insights = [];
    
    // Insight Ressenti
    if (ressentiCorrelation !== null && ressentiCorrelation > 0.3) {
      insights.push({
        type: 'positive_feeling',
        message: 'Corrélation positive entre ressenti et performance d\'entraînement',
        strength: ressentiCorrelation,
        recommendation: 'Maintenir conditions optimales (sommeil, nutrition, hydratation) pour meilleur ressenti et performance'
      });
    }
    
    // Insight Motivation
    if (motivationCorrelation !== null && motivationCorrelation > 0.3) {
      insights.push({
        type: 'positive_motivation',
        message: 'Motivation associée à régularité d\'entraînement',
        strength: motivationCorrelation,
        recommendation: 'Maintenir motivation élevée via variété d\'entraînements, objectifs atteignables, environnement optimal'
      });
    }
    
    // Insight Énergie
    if (energyCorrelation !== null && energyCorrelation > 0.3) {
      insights.push({
        type: 'positive_energy',
        message: 'Énergie associée à meilleure performance',
        strength: energyCorrelation,
        recommendation: 'Optimiser énergie avant entraînement: sommeil, nutrition, hydratation, timing'
      });
    }
    
    // Insight Conditions
    if (conditionsCorrelation !== null && conditionsCorrelation > 0.3) {
      insights.push({
        type: 'positive_conditions',
        message: 'Conditions optimales (sommeil, hydratation, nutrition) associées à meilleure performance',
        strength: conditionsCorrelation,
        recommendation: 'Maintenir conditions optimales pour performance maximale'
      });
    }
    
    // Insight Environnement
    if (environmentStats.length > 0) {
      const bestEnvironment = environmentStats.sort((a, b) => b.avgRessenti - a.avgRessenti)[0];
      if (bestEnvironment.avgRessenti > 7) {
        insights.push({
          type: 'optimal_environment',
          message: `Environnement "${bestEnvironment.environment}" associé à meilleur ressenti (${bestEnvironment.avgRessenti.toFixed(1)}/10)`,
          strength: bestEnvironment.avgRessenti / 10,
          recommendation: `Privilégier l'environnement "${bestEnvironment.environment}" pour meilleure expérience d'entraînement`
        });
      }
    }
    
    // Insight Objectifs
    if (objectivesAnalysis && objectivesAnalysis.intensityDifference !== null && objectivesAnalysis.intensityDifference > 10) {
      insights.push({
        type: 'objectives_impact',
        message: `Performance ${Math.round(objectivesAnalysis.intensityDifference)}% supérieure quand objectifs atteints`,
        strength: objectivesAnalysis.intensityDifference / 100,
        recommendation: 'Fixer objectifs réalistes et atteignables pour maintenir motivation et performance'
      });
    }
    
    return {
      ressentiWorkout: {
        correlation: ressentiCorrelation,
        pairsCount: ressentiWorkoutPairs.length,
        interpretation: ressentiCorrelation !== null
          ? (ressentiCorrelation > 0.3 ? 'positive' : ressentiCorrelation < -0.3 ? 'negative' : 'weak')
          : null
      },
      motivationWorkout: {
        correlation: motivationCorrelation,
        pairsCount: motivationRegularityPairs.length,
        interpretation: motivationCorrelation !== null
          ? (motivationCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      energyWorkout: {
        correlation: energyCorrelation,
        pairsCount: energyWorkoutPairs.length,
        interpretation: energyCorrelation !== null
          ? (energyCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      conditionsWorkout: {
        correlation: conditionsCorrelation,
        pairsCount: conditionsWorkoutPairs.length,
        interpretation: conditionsCorrelation !== null
          ? (conditionsCorrelation > 0.3 ? 'positive' : 'weak')
          : null
      },
      environmentWorkout: {
        stats: environmentStats,
        bestEnvironment: environmentStats.length > 0
          ? environmentStats.sort((a, b) => b.avgRessenti - a.avgRessenti)[0]
          : null
      },
      objectivesWorkout: objectivesAnalysis,
      insights,
      period: {
        start: startDate,
        end: endDate,
        type: period,
        feedbacksCount: filteredFeedbacks.length,
        sessionsCount: filteredSessions.length
      }
    };
  }, [sessionFeedbacks, workoutHistory, period, customStartDate, customEndDate]);
}





