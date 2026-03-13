/**
 * MetricsCalculator Service
 * 
 * Service pour calculer les métriques de lecture avancées.
 * Fournit des calculs de vitesse, temps, progression et prédictions
 * basés sur les données d'agrégation des sessions.
 * 
 * @see Requirements 3.1, 7.1, 8.1
 */

class MetricsCalculator {
  /**
   * Calculer les métriques de base à partir des données agrégées
   * (sans supposer le nombre de livres terminés – corrigé plus bas)
   */
  static calculateBasicMetrics(aggregatedData) {
    const {
      totalPages,
      totalMinutes,
      totalSessions,
      uniqueDays,
      uniqueBooks,
      streaks
    } = aggregatedData;

    // Vitesse de lecture moyenne (pages par heure)
    const averageSpeed = totalMinutes > 0 ? (totalPages / (totalMinutes / 60)) : 0;
    
    // Durée moyenne par session
    const averageSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    
    // Fréquence de lecture (sessions par semaine)
    // Basé sur le nombre de jours uniques dans la période
    const readingFrequency = uniqueDays > 0 ? (totalSessions / uniqueDays) * 7 : 0;
    
    // Pages moyennes par jour
    const averagePagesPerDay = uniqueDays > 0 ? totalPages / uniqueDays : 0;
    
    // Pages moyennes par session
    const averagePagesPerSession = totalSessions > 0 ? totalPages / totalSessions : 0;

    return {
      totalPages,
      totalTime: totalMinutes,
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      sessionsCount: totalSessions,
      booksCompleted: uniqueBooks, // Valeur provisoire, sera corrigée dans calculateAllMetrics
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
      readingFrequency: Math.round(readingFrequency * 10) / 10,
      averagePagesPerDay: Math.round(averagePagesPerDay * 10) / 10,
      averagePagesPerSession: Math.round(averagePagesPerSession * 10) / 10,
      uniqueDays,
      uniqueBooks
    };
  }

  /**
   * Calculer la vitesse de lecture par genre
   */
  static calculateSpeedByGenre(aggregatedData) {
    const genreMetrics = {};
    
    Object.entries(aggregatedData.byGenre).forEach(([genre, data]) => {
      const speed = data.totalMinutes > 0 ? (data.totalPages / (data.totalMinutes / 60)) : 0;
      
      genreMetrics[genre] = {
        genre,
        totalPages: data.totalPages,
        totalMinutes: data.totalMinutes,
        sessionsCount: data.sessionCount,
        averageSpeed: Math.round(speed * 10) / 10,
        uniqueBooks: data.uniqueBooks,
        averagePagesPerSession: data.sessionCount > 0 ? 
          Math.round((data.totalPages / data.sessionCount) * 10) / 10 : 0
      };
    });
    
    return genreMetrics;
  }

  /**
   * Calculer les métriques temporelles (évolution dans le temps)
   */
  static calculateTemporalMetrics(aggregatedData) {
    const dailyMetrics = [];
    
    Object.entries(aggregatedData.byDate).forEach(([date, data]) => {
      const speed = data.totalMinutes > 0 ? (data.totalPages / (data.totalMinutes / 60)) : 0;
      
      dailyMetrics.push({
        date,
        pages: data.totalPages,
        minutes: data.totalMinutes,
        sessions: data.sessionCount,
        books: data.books,
        uniqueBooks: data.uniqueBooks,
        speed: Math.round(speed * 10) / 10,
        averagePagesPerSession: data.sessionCount > 0 ? 
          Math.round((data.totalPages / data.sessionCount) * 10) / 10 : 0
      });
    });
    
    // Trier par date
    return dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculer les prédictions de temps de lecture
   */
  static calculatePredictions(books, userMetrics) {
    const predictions = [];
    
    books.forEach(book => {
      if (book.status === 'in-progress' && book.pages) {
        const totalPages = Number(book.pages) || 0;
        const readingSessions = book.readingSessions || [];
        
        // Calculer les pages déjà lues
        const pagesRead = readingSessions.reduce((sum, session) => 
          sum + (Number(session.pagesRead) || 0), 0
        );
        
        const remainingPages = Math.max(0, totalPages - pagesRead);
        
        if (remainingPages > 0 && userMetrics.averageSpeed > 0) {
          // Estimation basée sur la vitesse moyenne de l'utilisateur
          const estimatedHours = remainingPages / userMetrics.averageSpeed;
          const estimatedMinutes = Math.round(estimatedHours * 60);
          
          // Estimation basée sur la vitesse spécifique du livre (si disponible)
          const bookMinutes = readingSessions.reduce((sum, session) => 
            sum + (Number(session.durationMinutes) || 0), 0
          );
          
          let bookSpecificEstimate = null;
          if (bookMinutes > 0 && pagesRead > 0) {
            const bookSpeed = pagesRead / (bookMinutes / 60);
            const bookEstimatedHours = remainingPages / bookSpeed;
            bookSpecificEstimate = Math.round(bookEstimatedHours * 60);
          }
          
          predictions.push({
            bookId: book.id,
            bookTitle: book.title,
            totalPages,
            pagesRead,
            remainingPages,
            progressPercent: Math.round((pagesRead / totalPages) * 100),
            estimatedMinutes,
            estimatedHours: Math.round(estimatedHours * 10) / 10,
            bookSpecificEstimate,
            userAverageSpeed: userMetrics.averageSpeed
          });
        }
      }
    });
    
    return predictions.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
  }

  /**
   * Analyser les patterns de lecture (meilleurs créneaux, jours)
   */
  static analyzeReadingPatterns(aggregatedData) {
    const patterns = {
      bestDaysOfWeek: {},
      bestTimeOfDay: {}, // Alimenté à partir des heures de début des sessions (startTime)
      mostProductiveDays: [],
      readingConsistency: 0
    };
    
    // Analyser les jours de la semaine
    Object.entries(aggregatedData.byDate).forEach(([date, data]) => {
      const dayOfWeek = new Date(date).getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const dayName = dayNames[dayOfWeek];
      
      if (!patterns.bestDaysOfWeek[dayName]) {
        patterns.bestDaysOfWeek[dayName] = {
          dayName,
          totalPages: 0,
          totalMinutes: 0,
          sessionCount: 0,
          dayCount: 0
        };
      }
      
      patterns.bestDaysOfWeek[dayName].totalPages += data.totalPages;
      patterns.bestDaysOfWeek[dayName].totalMinutes += data.totalMinutes;
      patterns.bestDaysOfWeek[dayName].sessionCount += data.sessionCount;
      patterns.bestDaysOfWeek[dayName].dayCount += 1;
    });
    
    // Calculer les moyennes par jour de la semaine
    Object.values(patterns.bestDaysOfWeek).forEach(dayData => {
      dayData.averagePagesPerDay = dayData.dayCount > 0 ? 
        Math.round((dayData.totalPages / dayData.dayCount) * 10) / 10 : 0;
      dayData.averageMinutesPerDay = dayData.dayCount > 0 ? 
        Math.round((dayData.totalMinutes / dayData.dayCount) * 10) / 10 : 0;
    });
    
    // Identifier les jours les plus productifs
    patterns.mostProductiveDays = Object.entries(aggregatedData.byDate)
      .map(([date, data]) => ({
        date,
        pages: data.totalPages,
        minutes: data.totalMinutes,
        sessions: data.sessionCount,
        books: data.uniqueBooks
      }))
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 5);
    
    // Calculer la consistance (pourcentage de jours avec lecture dans la période réelle)
    const totalDaysInPeriod =
      typeof aggregatedData.periodDays === 'number'
        ? aggregatedData.periodDays
        : Object.keys(aggregatedData.byDate).length;
    const daysWithReading = Object.values(aggregatedData.byDate).filter(d => d.totalPages > 0).length;
    patterns.readingConsistency =
      totalDaysInPeriod > 0
        ? Math.round((daysWithReading / totalDaysInPeriod) * 100)
        : 0;

    // Analyses des créneaux horaires (si startTime est présent)
    if (Array.isArray(aggregatedData.sessions) && aggregatedData.sessions.length > 0) {
      const buckets = {
        '6h-9h':   { label: 'Matin',       sessionCount: 0, totalPages: 0, totalMinutes: 0 },
        '9h-12h':  { label: 'Matinée',     sessionCount: 0, totalPages: 0, totalMinutes: 0 },
        '12h-14h': { label: 'Midi',        sessionCount: 0, totalPages: 0, totalMinutes: 0 },
        '14h-18h': { label: 'Après-midi',  sessionCount: 0, totalPages: 0, totalMinutes: 0 },
        '18h-22h': { label: 'Soirée',      sessionCount: 0, totalPages: 0, totalMinutes: 0 },
        '22h-6h':  { label: 'Nuit',        sessionCount: 0, totalPages: 0, totalMinutes: 0 },
      };

      const getBucketKey = (startTime) => {
        if (!startTime || typeof startTime !== 'string') return null;
        const m = startTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
        if (!m) return null;
        const hour = parseInt(m[1], 10);
        if (hour >= 6 && hour < 9) return '6h-9h';
        if (hour >= 9 && hour < 12) return '9h-12h';
        if (hour >= 12 && hour < 14) return '12h-14h';
        if (hour >= 14 && hour < 18) return '14h-18h';
        if (hour >= 18 && hour < 22) return '18h-22h';
        return '22h-6h';
      };

      aggregatedData.sessions.forEach((session) => {
        const key = getBucketKey(session.startTime);
        if (!key || !buckets[key]) return;
        const bucket = buckets[key];
        bucket.sessionCount += 1;
        bucket.totalPages += Number(session.pagesRead) || 0;
        bucket.totalMinutes += Number(session.durationMinutes) || 0;
      });

      const totalSessionsInBuckets = Object.values(buckets).reduce(
        (sum, b) => sum + b.sessionCount,
        0
      );

      if (totalSessionsInBuckets > 0) {
        let favoriteKey = null;
        let maxPages = -1;
        Object.entries(buckets).forEach(([key, b]) => {
          if (b.sessionCount > 0 && b.totalPages >= maxPages) {
            maxPages = b.totalPages;
            favoriteKey = key;
          }
        });

        patterns.bestTimeOfDay = {
          buckets,
          favorite: favoriteKey
            ? { key: favoriteKey, ...(buckets[favoriteKey] || {}) }
            : null,
        };
      }
    }
    
    return patterns;
  }

  /**
   * Calculer les objectifs et leur progression
   */
  static calculateGoalsProgress(aggregatedData, goals = {}) {
    const progress = {
      daily: null,
      weekly: null,
      monthly: null
    };
    
    // Objectif quotidien (en minutes)
    if (goals.dailyMinutes) {
      const today = new Date().toISOString().split('T')[0];
      const todayData = aggregatedData.byDate[today];
      const todayMinutes = todayData ? todayData.totalMinutes : 0;
      
      progress.daily = {
        target: goals.dailyMinutes,
        current: todayMinutes,
        percentage: Math.round((todayMinutes / goals.dailyMinutes) * 100),
        achieved: todayMinutes >= goals.dailyMinutes
      };
    }
    
    // Objectif hebdomadaire (en pages)
    if (goals.weeklyPages) {
      // Calculer les pages de la semaine actuelle
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      
      const weeklyPages = Object.entries(aggregatedData.byDate)
        .filter(([date]) => date >= startOfWeekStr)
        .reduce((sum, [, data]) => sum + data.totalPages, 0);
      
      progress.weekly = {
        target: goals.weeklyPages,
        current: weeklyPages,
        percentage: Math.round((weeklyPages / goals.weeklyPages) * 100),
        achieved: weeklyPages >= goals.weeklyPages
      };
    }
    
    // Objectif mensuel (en livres)
    if (goals.monthlyBooks) {
      // Calculer les livres du mois actuel (approximation basée sur les livres uniques)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      
      const monthlyBooks = new Set(
        Object.entries(aggregatedData.byDate)
          .filter(([date]) => date >= startOfMonthStr)
          .flatMap(([, data]) => (data.books || []).map(book => book.id))
      ).size;
      
      progress.monthly = {
        target: goals.monthlyBooks,
        current: monthlyBooks,
        percentage: Math.round((monthlyBooks / goals.monthlyBooks) * 100),
        achieved: monthlyBooks >= goals.monthlyBooks
      };
    }
    
    return progress;
  }

  /**
   * Méthode principale pour calculer toutes les métriques
   */
  static calculateAllMetrics(books, aggregatedData, goals = {}) {
    try {
      const basicMetrics = this.calculateBasicMetrics(aggregatedData);

      // Corriger le nombre de livres terminés :
      // - statut explicitement "completed"
      // - ou toutes les pages lues (totalPagesRead >= totalPages déclarées)
      if (Array.isArray(books) && books.length > 0) {
        const completedCount = books.reduce((count, book) => {
          const totalPages = Number(book.pages) || 0;
          const sessions = Array.isArray(book.readingSessions)
            ? book.readingSessions
            : [];
          const totalPagesRead = sessions.reduce(
            (sum, s) => sum + (Number(s.pagesRead) || 0),
            0
          );

          const completedByStatus = book.status === 'completed';
          const completedByPages =
            totalPages > 0 && totalPagesRead >= totalPages;

          return completedByStatus || completedByPages ? count + 1 : count;
        }, 0);

        basicMetrics.booksCompleted = completedCount;
      }
      const speedByGenre = this.calculateSpeedByGenre(aggregatedData);
      const temporalMetrics = this.calculateTemporalMetrics(aggregatedData);
      const predictions = this.calculatePredictions(books, basicMetrics);
      const patterns = this.analyzeReadingPatterns(aggregatedData);
      const goalsProgress = this.calculateGoalsProgress(aggregatedData, goals);
      
      return {
        basic: basicMetrics,
        speedByGenre,
        temporal: temporalMetrics,
        predictions,
        patterns,
        goals: goalsProgress
      };
    } catch (error) {
      console.error('[MetricsCalculator] Error calculating metrics:', error);
      return {
        basic: {},
        speedByGenre: {},
        temporal: [],
        predictions: [],
        patterns: {},
        goals: {}
      };
    }
  }
}

export default MetricsCalculator;