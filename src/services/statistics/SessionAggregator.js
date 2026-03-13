/**
 * SessionAggregator Service
 * 
 * Service pour l'agrégation et le traitement des sessions de lecture.
 * Fournit des méthodes pour filtrer, grouper et transformer les sessions
 * selon différents critères (période, genre, auteur, etc.).
 * 
 * @see Requirements 2.4, 3.1, 7.1
 */

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
 * Utilitaire pour normaliser une date au format YYYY-MM-DD
 */
const normalizeDate = (dateString) => {
  if (!dateString) return null;
  try {
    const str = typeof dateString === 'string' ? dateString : new Date(dateString).toISOString().split('T')[0];
    const part = str.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : null;
  } catch (error) {
    console.warn('[SessionAggregator] Invalid date format:', dateString);
    return null;
  }
};

class SessionAggregator {
  /**
   * Extraire toutes les sessions des livres avec métadonnées enrichies
   */
  static extractAllSessions(books = []) {
    const allSessions = [];
    
    books.forEach(book => {
      if (book.readingSessions && Array.isArray(book.readingSessions)) {
        book.readingSessions.forEach(session => {
          const normalizedDate = normalizeDate(session.date);
          if (normalizedDate) {
            allSessions.push({
              ...session,
              bookId: book.id,
              bookTitle: book.title || 'Livre sans titre',
              bookAuthor: book.author || 'Auteur inconnu',
              bookGenre: book.genre || 'Genre non spécifié',
              bookPages: Number(book.pages) || 0,
              normalizedDate,
              pagesRead: Number(session.pagesRead) || 0,
              durationMinutes: Number(session.durationMinutes) || 0
            });
          }
        });
      }
    });
    
    return allSessions.sort((a, b) => a.normalizedDate.localeCompare(b.normalizedDate));
  }

  /**
   * Vérifier si la période est une année (ex: '2026', '2025')
   */
  static isYearPeriod(period) {
    return typeof period === 'string' && /^\d{4}$/.test(period);
  }

  /**
   * Obtenir les bornes de date pour une période année
   * @returns {{ start: string, end: string, periodDays: number }}
   */
  static getYearBounds(yearStr) {
    const year = parseInt(yearStr, 10);
    const today = getTodayString();
    const currentYear = new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = year === currentYear ? today : `${year}-12-31`;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const periodDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    return { start, end, periodDays };
  }

  /**
   * Filtrer les sessions selon une période temporelle
   * Période peut être: '7d', '1m', '3m', '6m', '1y', 'all', ou une année '2026', '2025', etc.
   */
  static filterByPeriod(sessions, period) {
    if (period === 'all') return sessions;

    if (this.isYearPeriod(period)) {
      const { start, end } = this.getYearBounds(period);
      return sessions.filter(session => session.normalizedDate >= start && session.normalizedDate <= end);
    }
    
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
    
    return sessions.filter(session => session.normalizedDate >= cutoffDate);
  }

  /**
   * Filtrer les sessions selon des critères spécifiques
   */
  static filterByCriteria(sessions, filters = {}) {
    let filteredSessions = [...sessions];
    
    if (filters.genre) {
      const genreQuery = filters.genre.toLowerCase();
      filteredSessions = filteredSessions.filter(session => 
        session.bookGenre && session.bookGenre.toLowerCase().includes(genreQuery)
      );
    }
    
    if (filters.author) {
      const authorQuery = filters.author.toLowerCase();
      filteredSessions = filteredSessions.filter(session => 
        session.bookAuthor && session.bookAuthor.toLowerCase().includes(authorQuery)
      );
    }
    
    if (filters.bookId) {
      filteredSessions = filteredSessions.filter(session => 
        session.bookId === filters.bookId
      );
    }
    
    return filteredSessions;
  }

  /**
   * Grouper les sessions par date
   */
  static groupByDate(sessions) {
    const sessionsByDate = {};
    
    sessions.forEach(session => {
      const date = session.normalizedDate;
      
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = {
          date,
          sessions: [],
          totalPages: 0,
          totalMinutes: 0,
          booksRead: new Set(),
          sessionCount: 0
        };
      }
      
      const dayData = sessionsByDate[date];
      dayData.sessions.push(session);
      dayData.totalPages += session.pagesRead;
      dayData.totalMinutes += session.durationMinutes;
      dayData.booksRead.add(session.bookId);
      dayData.sessionCount += 1;
    });
    
    // Convertir les Sets en arrays et ajouter les détails des livres
    Object.values(sessionsByDate).forEach(dayData => {
      dayData.uniqueBooks = dayData.booksRead.size;
      dayData.books = [];
      
      // Grouper les pages par livre pour ce jour
      const bookPages = {};
      dayData.sessions.forEach(session => {
        if (!bookPages[session.bookId]) {
          bookPages[session.bookId] = {
            id: session.bookId,
            title: session.bookTitle,
            author: session.bookAuthor,
            genre: session.bookGenre,
            pagesRead: 0
          };
        }
        bookPages[session.bookId].pagesRead += session.pagesRead;
      });
      
      dayData.books = Object.values(bookPages);
      delete dayData.booksRead; // Nettoyer le Set
    });
    
    return sessionsByDate;
  }

  /**
   * Grouper les sessions par genre
   */
  static groupByGenre(sessions) {
    const sessionsByGenre = {};
    
    sessions.forEach(session => {
      const genre = session.bookGenre || 'Non spécifié';
      
      if (!sessionsByGenre[genre]) {
        sessionsByGenre[genre] = {
          genre,
          sessions: [],
          totalPages: 0,
          totalMinutes: 0,
          booksRead: new Set(),
          sessionCount: 0
        };
      }
      
      const genreData = sessionsByGenre[genre];
      genreData.sessions.push(session);
      genreData.totalPages += session.pagesRead;
      genreData.totalMinutes += session.durationMinutes;
      genreData.booksRead.add(session.bookId);
      genreData.sessionCount += 1;
    });
    
    // Convertir les Sets en nombres
    Object.values(sessionsByGenre).forEach(genreData => {
      genreData.uniqueBooks = genreData.booksRead.size;
      delete genreData.booksRead;
    });
    
    return sessionsByGenre;
  }

  /**
   * Grouper les sessions par auteur
   */
  static groupByAuthor(sessions) {
    const sessionsByAuthor = {};
    
    sessions.forEach(session => {
      const author = session.bookAuthor || 'Auteur inconnu';
      
      if (!sessionsByAuthor[author]) {
        sessionsByAuthor[author] = {
          author,
          sessions: [],
          totalPages: 0,
          totalMinutes: 0,
          booksRead: new Set(),
          sessionCount: 0
        };
      }
      
      const authorData = sessionsByAuthor[author];
      authorData.sessions.push(session);
      authorData.totalPages += session.pagesRead;
      authorData.totalMinutes += session.durationMinutes;
      authorData.booksRead.add(session.bookId);
      authorData.sessionCount += 1;
    });
    
    // Convertir les Sets en nombres
    Object.values(sessionsByAuthor).forEach(authorData => {
      authorData.uniqueBooks = authorData.booksRead.size;
      delete authorData.booksRead;
    });
    
    return sessionsByAuthor;
  }

  /**
   * Calculer les streaks de lecture
   */
  static calculateStreaks(sessions) {
    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: []
      };
    }
    
    // Obtenir les dates uniques avec sessions
    const uniqueDates = [...new Set(sessions.map(s => s.normalizedDate))].sort();
    
    if (uniqueDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: []
      };
    }
    
    const today = getTodayString();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    // Calculer le streak actuel (en partant d'aujourd'hui vers le passé)
    const todayIndex = uniqueDates.indexOf(today);
    if (todayIndex !== -1) {
      currentStreak = 1;
      
      // Vérifier les jours précédents consécutifs
      for (let i = todayIndex - 1; i >= 0; i--) {
        const currentDate = new Date(uniqueDates[i + 1]);
        const previousDate = new Date(uniqueDates[i]);
        const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculer le streak le plus long
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const previousDate = new Date(uniqueDates[i - 1]);
      const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    
    return {
      currentStreak,
      longestStreak,
      streakDates: uniqueDates
    };
  }

  /**
   * Retourner les années pour lesquelles il existe au moins une session (tri décroissant)
   * @param {Array} books - Liste des livres
   * @returns {string[]} Ex: ['2026', '2025', '2024']
   */
  static getAvailableYears(books = []) {
    const allSessions = this.extractAllSessions(books);
    const years = new Set();
    allSessions.forEach(session => {
      if (session.normalizedDate) {
        years.add(session.normalizedDate.slice(0, 4));
      }
    });
    const currentYear = new Date().getFullYear().toString();
    if (!years.has(currentYear)) {
      years.add(currentYear); // Toujours proposer l'année en cours
    }
    return Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }

  /**
   * Méthode principale pour agréger les sessions selon les critères
   */
  static aggregateSessions(books, period = '1m', filters = {}) {
    try {
      const periodDaysConfig = {
        '7d': 7,
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365,
      };

      // 1. Extraire toutes les sessions
      const allSessions = this.extractAllSessions(books);
      
      // 2. Filtrer par période
      const periodSessions = this.filterByPeriod(allSessions, period);
      
      // 3. Filtrer par critères
      const filteredSessions = this.filterByCriteria(periodSessions, filters);
      
      // 4. Créer les agrégations
      const byDate = this.groupByDate(filteredSessions);
      const byGenre = this.groupByGenre(filteredSessions);
      const byAuthor = this.groupByAuthor(filteredSessions);
      const streaks = this.calculateStreaks(filteredSessions);
      
      // Calculer le nombre de jours de la période pour la consistance
      let periodDays = null;
      if (this.isYearPeriod(period)) {
        const bounds = this.getYearBounds(period);
        periodDays = bounds.periodDays;
      } else if (period !== 'all' && periodDaysConfig[period]) {
        periodDays = periodDaysConfig[period];
      } else if (filteredSessions.length > 0) {
        const dates = filteredSessions.map((s) => s.normalizedDate).sort();
        const first = new Date(dates[0]);
        const last = new Date(dates[dates.length - 1]);
        const diffMs = last.getTime() - first.getTime();
        periodDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      } else {
        periodDays = 0;
      }
      
      return {
        sessions: filteredSessions,
        byDate,
        byGenre,
        byAuthor,
        streaks,
        period,
        periodDays,
        totalSessions: filteredSessions.length,
        totalPages: filteredSessions.reduce((sum, s) => sum + s.pagesRead, 0),
        totalMinutes: filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
        uniqueDays: Object.keys(byDate).length,
        uniqueBooks: new Set(filteredSessions.map(s => s.bookId)).size
      };
    } catch (error) {
      console.error('[SessionAggregator] Error aggregating sessions:', error);
      return {
        sessions: [],
        byDate: {},
        byGenre: {},
        byAuthor: {},
        streaks: { currentStreak: 0, longestStreak: 0, streakDates: [] },
        totalSessions: 0,
        totalPages: 0,
        totalMinutes: 0,
        uniqueDays: 0,
        uniqueBooks: 0
      };
    }
  }
}

export default SessionAggregator;