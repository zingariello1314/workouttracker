/**
 * useStatisticsData Hook
 * 
 * Hook personnalisé pour calculer et transformer les données de lecture
 * en statistiques et données de graphiques pour le sous-onglet statistiques.
 * 
 * Utilise les services SessionAggregator, MetricsCalculator et ChartDataTransformer
 * pour fournir des données complètes et optimisées pour les composants de statistiques.
 * 
 * Calcule:
 * - Métriques de base (pages, temps, vitesse, sessions, livres terminés)
 * - Données pour les graphiques (pages par jour, vitesse, heatmap, genres)
 * - Streaks et régularité de lecture
 * - Prédictions et recommandations
 * 
 * @see Requirements 1.1, 2.4, 3.1, 7.1
 */

import { useMemo } from 'react';
import { SessionAggregator, MetricsCalculator, ChartDataTransformer } from '../services/statistics/index.js';



/**
 * Récupérer les objectifs stockés dans localStorage
 */
const getStoredGoals = () => {
  try {
    const dailyGoal = localStorage.getItem('readingDailyGoal');
    const weeklyGoal = localStorage.getItem('readingWeeklyGoal');
    const monthlyGoal = localStorage.getItem('readingMonthlyGoal');
    
    return {
      dailyMinutes: dailyGoal ? Number(dailyGoal) : null,
      weeklyPages: weeklyGoal ? Number(weeklyGoal) : null,
      monthlyBooks: monthlyGoal ? Number(monthlyGoal) : null
    };
  } catch (error) {
    console.warn('[useStatisticsData] Error reading goals from localStorage:', error);
    return {};
  }
};

/**
 * Calculer la progression d'aujourd'hui
 */
const getTodayProgress = (aggregatedData) => {
  const today = new Date().toISOString().split('T')[0];
  const todayData = aggregatedData.byDate[today];
  return todayData ? todayData.totalMinutes : 0;
};

/**
 * Générer des insights basés sur les métriques calculées
 */
const generateInsights = (calculatedMetrics) => {
  const insights = [];
  
  try {
    const { basic, patterns, speedByGenre } = calculatedMetrics;
    
    // Insight sur la vitesse de lecture
    if (basic.averageSpeed > 0) {
      insights.push({
        type: 'speed',
        title: 'Vitesse de lecture',
        message: `Tu lis en moyenne ${basic.averageSpeed} pages par heure`,
        icon: 'trending-up',
        color: 'blue'
      });
    }
    
    // Insight sur la régularité
    if (basic.currentStreak > 0) {
      insights.push({
        type: 'streak',
        title: 'Série de lecture',
        message: `Tu es sur une série de ${basic.currentStreak} jour(s) !`,
        icon: 'calendar',
        color: 'green'
      });
    }
    
    // Insight sur le genre préféré
    if (speedByGenre && Object.keys(speedByGenre).length > 0) {
      const favoriteGenre = Object.values(speedByGenre)
        .sort((a, b) => b.totalPages - a.totalPages)[0];
      
      if (favoriteGenre) {
        insights.push({
          type: 'genre',
          title: 'Genre préféré',
          message: `Tu lis principalement du ${favoriteGenre.genre.toLowerCase()}`,
          icon: 'book-open',
          color: 'purple'
        });
      }
    }
    
    // Insight sur les patterns
    if (patterns.bestDaysOfWeek) {
      const bestDay = Object.values(patterns.bestDaysOfWeek)
        .sort((a, b) => b.averagePagesPerDay - a.averagePagesPerDay)[0];
      
      if (bestDay && bestDay.averagePagesPerDay > 0) {
        insights.push({
          type: 'pattern',
          title: 'Meilleur jour',
          message: `Tu es plus productif le ${bestDay.dayName.toLowerCase()}`,
          icon: 'calendar',
          color: 'orange'
        });
      }
    }
    
  } catch (error) {
    console.warn('[useStatisticsData] Error generating insights:', error);
  }
  
  return insights;
};

/**
 * Hook principal utilisant les nouveaux services
 */
export const useStatisticsData = (books = [], selectedPeriod = '1m', filters = {}, dataVersion = 0) => {
  return useMemo(() => {
    try {
      // Vérifier que books est un tableau valide
      if (!Array.isArray(books)) {
        console.warn('[useStatisticsData] books is not an array:', books);
        return {
          hasData: false,
          metrics: {},
          chartData: {},
          insights: [],
          predictions: []
        };
      }

      // Vérifier s'il y a des données
      const hasAnySession = books.some(book => 
        book.readingSessions && Array.isArray(book.readingSessions) && book.readingSessions.length > 0
      );

      if (!hasAnySession) {
        return {
          hasData: false,
          metrics: {
            totalPages: 0,
            totalTime: 0,
            averageSpeed: 0,
            sessionsCount: 0,
            booksCompleted: books.filter(book => book.status === 'completed').length,
            currentStreak: 0,
            longestStreak: 0,
            averageSessionDuration: 0,
            readingFrequency: 0,
            dailyGoal: 30,
            todayProgress: 0
          },
          chartData: {
            pagesPerDay: [],
            readingSpeed: { evolution: [], byGenre: [] },
            heatmap: [],
            genreDistribution: { pie: [], bar: [] },
            goalsProgress: []
          },
          insights: [],
          predictions: []
        };
      }

      // 1. Agréger les sessions avec SessionAggregator
      const aggregatedData = SessionAggregator.aggregateSessions(books, selectedPeriod, filters);
      
      // 2. Calculer les métriques avec MetricsCalculator
      const goals = getStoredGoals(); // Récupérer les objectifs depuis localStorage
      const calculatedMetrics = MetricsCalculator.calculateAllMetrics(books, aggregatedData, goals);
      
      // 3. Transformer les données pour les graphiques avec ChartDataTransformer
      const chartData = ChartDataTransformer.transformAllChartData(calculatedMetrics);
      
      // 4. Enrichir les métriques de base avec les objectifs
      const enrichedMetrics = {
        ...calculatedMetrics.basic,
        booksCompleted: books.filter(book => book.status === 'completed').length,
        dailyGoal: goals.dailyMinutes || 30,
        todayProgress: getTodayProgress(aggregatedData)
      };

      return {
        hasData: true,
        metrics: enrichedMetrics,
        chartData,
        insights: generateInsights(calculatedMetrics),
        predictions: calculatedMetrics.predictions || [],
        patterns: calculatedMetrics.patterns || {},
        goals: calculatedMetrics.goals || {}
      };
    } catch (error) {
      console.error('[useStatisticsData] Error calculating statistics:', error);
      return {
        hasData: false,
        metrics: {},
        chartData: {},
        insights: [],
        predictions: []
      };
    }
  }, [books, selectedPeriod, filters, dataVersion]);
};

export default useStatisticsData;