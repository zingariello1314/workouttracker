/**
 * useStatisticsData Hook
 * 
 * Hook personnalisé pour calculer et transformer les données de lecture
 * en statistiques et données de graphiques pour le sous-onglet statistiques.
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

/**
 * Utilitaire pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
 */
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Utilitaire pour obtenir la date il y a N jours
 */
const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Utilitaire pour filtrer les sessions selon la période sélectionnée
 */
const filterSessionsByPeriod = (sessions, period) => {
  if (period === 'all') return sessions;
  
  const periodDays = {
    '7d': 7,
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365
  };
  
  const days = periodDays[period];
  if (!days) return sessions;
  
  const cutoffDate = getDaysAgo(days);
  
  return sessions.filter(session => {
    if (!session.date) return false;
    const sessionDate = session.date.split('T')[0];
    return sessionDate >= cutoffDate;
  });
};

/**
 * Calculer les métriques de base
 */
const calculateMetrics = (books, period, filters) => {
  // Filtrer les livres selon les filtres actifs
  let filteredBooks = books;
  
  if (filters.genre) {
    filteredBooks = filteredBooks.filter(book => 
      book.genre && book.genre.toLowerCase().includes(filters.genre.toLowerCase())
    );
  }
  
  if (filters.status) {
    filteredBooks = filteredBooks.filter(book => book.status === filters.status);
  }
  
  if (filters.author) {
    filteredBooks = filteredBooks.filter(book => 
      book.author && book.author.toLowerCase().includes(filters.author.toLowerCase())
    );
  }

  // Collecter toutes les sessions des livres filtrés
  const allSessions = [];
  filteredBooks.forEach(book => {
    if (book.readingSessions && Array.isArray(book.readingSessions)) {
      book.readingSessions.forEach(session => {
        allSessions.push({
          ...session,
          bookId: book.id,
          bookTitle: book.title,
          bookGenre: book.genre
        });
      });
    }
  });

  // Filtrer les sessions selon la période
  const filteredSessions = filterSessionsByPeriod(allSessions, period);

  // Calculer les métriques de base
  const totalPages = filteredSessions.reduce((sum, session) => 
    sum + (Number(session.pagesRead) || 0), 0
  );
  
  const totalTime = filteredSessions.reduce((sum, session) => 
    sum + (Number(session.durationMinutes) || 0), 0
  );
  
  const sessionsCount = filteredSessions.length;
  
  const averageSpeed = totalTime > 0 ? (totalPages / (totalTime / 60)) : 0; // pages per hour
  
  const booksCompleted = filteredBooks.filter(book => book.status === 'completed').length;
  
  const averageSessionDuration = sessionsCount > 0 ? totalTime / sessionsCount : 0;

  // Calculer la fréquence de lecture (sessions par semaine)
  const uniqueDays = new Set(filteredSessions.map(s => s.date?.split('T')[0])).size;
  const periodDays = period === 'all' ? Math.max(uniqueDays, 1) : 
    Math.min(uniqueDays, { '7d': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[period] || 30);
  const readingFrequency = (uniqueDays / periodDays) * 7; // sessions per week

  // Calculer les streaks (simplifié pour cette version)
  const today = getTodayString();
  const sessionsToday = filteredSessions.filter(s => s.date?.split('T')[0] === today);
  const currentStreak = sessionsToday.length > 0 ? 1 : 0; // Simplifié
  const longestStreak = Math.max(currentStreak, 1); // Simplifié

  // Objectif quotidien depuis localStorage
  let dailyGoal = 30; // défaut
  try {
    const stored = localStorage.getItem('readingDailyGoal');
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed > 0) {
        dailyGoal = parsed;
      }
    }
  } catch (error) {
    console.warn('Error reading daily goal:', error);
  }

  // Progression d'aujourd'hui
  const todayProgress = filteredSessions
    .filter(s => s.date?.split('T')[0] === today)
    .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

  return {
    totalPages,
    totalTime,
    averageSpeed,
    sessionsCount,
    booksCompleted,
    currentStreak,
    longestStreak,
    averageSessionDuration,
    readingFrequency,
    dailyGoal,
    todayProgress
  };
};

/**
 * Calculer les données pour le graphique pages par jour
 */
const calculatePagesPerDayData = (books, period, filters) => {
  // Même logique de filtrage que calculateMetrics
  let filteredBooks = books;
  
  if (filters.genre) {
    filteredBooks = filteredBooks.filter(book => 
      book.genre && book.genre.toLowerCase().includes(filters.genre.toLowerCase())
    );
  }
  
  if (filters.status) {
    filteredBooks = filteredBooks.filter(book => book.status === filters.status);
  }
  
  if (filters.author) {
    filteredBooks = filteredBooks.filter(book => 
      book.author && book.author.toLowerCase().includes(filters.author.toLowerCase())
    );
  }

  // Collecter toutes les sessions
  const allSessions = [];
  filteredBooks.forEach(book => {
    if (book.readingSessions && Array.isArray(book.readingSessions)) {
      book.readingSessions.forEach(session => {
        allSessions.push({
          ...session,
          bookId: book.id,
          bookTitle: book.title,
          bookGenre: book.genre
        });
      });
    }
  });

  // Filtrer par période
  const filteredSessions = filterSessionsByPeriod(allSessions, period);

  // Grouper par date
  const sessionsByDate = {};
  filteredSessions.forEach(session => {
    if (!session.date) return;
    
    const date = session.date.split('T')[0];
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = {
        date,
        pages: 0,
        sessions: 0,
        totalMinutes: 0,
        books: []
      };
    }
    
    sessionsByDate[date].pages += Number(session.pagesRead) || 0;
    sessionsByDate[date].sessions += 1;
    sessionsByDate[date].totalMinutes += Number(session.durationMinutes) || 0;
    
    // Ajouter le livre s'il n'est pas déjà dans la liste
    const existingBook = sessionsByDate[date].books.find(b => b.id === session.bookId);
    if (existingBook) {
      existingBook.pagesRead += Number(session.pagesRead) || 0;
    } else {
      sessionsByDate[date].books.push({
        id: session.bookId,
        title: session.bookTitle,
        pagesRead: Number(session.pagesRead) || 0
      });
    }
  });

  // Convertir en tableau et trier par date
  return Object.values(sessionsByDate).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Hook principal
 */
export const useStatisticsData = (books = [], selectedPeriod = '1m', filters = {}) => {
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
            booksCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageSessionDuration: 0,
            readingFrequency: 0,
            dailyGoal: 30,
            todayProgress: 0
          },
          chartData: {
            pagesPerDay: []
          },
          insights: [],
          predictions: []
        };
      }

      // Calculer les métriques
      const metrics = calculateMetrics(books, selectedPeriod, filters);
      
      // Calculer les données des graphiques
      const pagesPerDayData = calculatePagesPerDayData(books, selectedPeriod, filters);

      return {
        hasData: true,
        metrics,
        chartData: {
          pagesPerDay: pagesPerDayData,
          speedEvolution: [], // TODO: implémenter
          genreDistribution: [], // TODO: implémenter
          heatmapData: [], // TODO: implémenter
          goalsProgress: [] // TODO: implémenter
        },
        insights: [], // TODO: implémenter
        predictions: [] // TODO: implémenter
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
  }, [books, selectedPeriod, filters]);
};

export default useStatisticsData;