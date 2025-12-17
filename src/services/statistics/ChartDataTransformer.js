/**
 * ChartDataTransformer Service
 * 
 * Service pour transformer les données de lecture en formats compatibles
 * avec les différents types de graphiques (Recharts).
 * Gère les transformations spécifiques pour chaque type de visualisation.
 * 
 * @see Requirements 2.1, 4.1, 5.1
 */

class ChartDataTransformer {
  /**
   * Transformer les données pour le graphique Pages par Jour
   */
  static transformPagesPerDayData(temporalMetrics) {
    return temporalMetrics.map(dayData => ({
      date: dayData.date,
      pages: dayData.pages,
      sessions: dayData.sessions,
      totalMinutes: dayData.minutes,
      books: dayData.books || [],
      speed: dayData.speed,
      // Formatage pour l'affichage
      formattedDate: this.formatDateForDisplay(dayData.date),
      tooltip: {
        pages: dayData.pages,
        sessions: dayData.sessions,
        minutes: dayData.minutes,
        books: dayData.books?.map(book => ({
          title: book.title,
          pagesRead: book.pagesRead
        })) || []
      }
    }));
  }

  /**
   * Transformer les données pour le graphique de Vitesse de Lecture
   */
  static transformReadingSpeedData(temporalMetrics, speedByGenre = {}) {
    const speedEvolution = temporalMetrics.map(dayData => ({
      date: dayData.date,
      speed: dayData.speed,
      pages: dayData.pages,
      minutes: dayData.minutes,
      formattedDate: this.formatDateForDisplay(dayData.date)
    }));

    const genreSpeedData = Object.values(speedByGenre).map(genreData => ({
      genre: genreData.genre,
      speed: genreData.averageSpeed,
      pages: genreData.totalPages,
      sessions: genreData.sessionsCount,
      books: genreData.uniqueBooks
    }));

    return {
      evolution: speedEvolution,
      byGenre: genreSpeedData
    };
  }

  /**
   * Transformer les données pour le calendrier Heatmap
   */
  static transformHeatmapData(temporalMetrics, year = null) {
    const currentYear = year || new Date().getFullYear();
    const heatmapData = [];
    
    // Créer une entrée pour chaque jour de l'année
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    // Créer un map des données existantes pour un accès rapide
    const dataMap = {};
    temporalMetrics.forEach(dayData => {
      const date = new Date(dayData.date);
      if (date.getFullYear() === currentYear) {
        dataMap[dayData.date] = dayData;
      }
    });
    
    // Générer les données pour chaque jour
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dataMap[dateStr];
      
      heatmapData.push({
        date: dateStr,
        pages: dayData ? dayData.pages : 0,
        minutes: dayData ? dayData.minutes : 0,
        sessions: dayData ? dayData.sessions : 0,
        books: dayData ? dayData.books : [],
        intensity: this.calculateIntensity(dayData ? dayData.pages : 0),
        dayOfWeek: date.getDay(),
        weekOfYear: this.getWeekOfYear(date),
        month: date.getMonth(),
        day: date.getDate()
      });
    }
    
    return heatmapData;
  }

  /**
   * Transformer les données pour le graphique de Répartition par Genre
   */
  static transformGenreDistributionData(speedByGenre) {
    const totalPages = Object.values(speedByGenre).reduce((sum, genre) => sum + genre.totalPages, 0);
    const totalMinutes = Object.values(speedByGenre).reduce((sum, genre) => sum + genre.totalMinutes, 0);
    
    const pieData = Object.values(speedByGenre).map(genreData => ({
      genre: genreData.genre,
      pages: genreData.totalPages,
      minutes: genreData.totalMinutes,
      sessions: genreData.sessionsCount,
      books: genreData.uniqueBooks,
      speed: genreData.averageSpeed,
      pagesPercentage: totalPages > 0 ? Math.round((genreData.totalPages / totalPages) * 100) : 0,
      minutesPercentage: totalMinutes > 0 ? Math.round((genreData.totalMinutes / totalMinutes) * 100) : 0
    }));

    const barData = pieData.map(item => ({
      genre: item.genre,
      speed: item.speed,
      pages: item.pages,
      sessions: item.sessions
    }));

    return {
      pie: pieData.sort((a, b) => b.pages - a.pages),
      bar: barData.sort((a, b) => b.speed - a.speed)
    };
  }

  /**
   * Transformer les données pour le graphique de Progression des Objectifs
   */
  static transformGoalsProgressData(goalsProgress, basicMetrics) {
    const progressData = [];
    
    if (goalsProgress.daily) {
      progressData.push({
        type: 'daily',
        label: 'Objectif quotidien',
        target: goalsProgress.daily.target,
        current: goalsProgress.daily.current,
        percentage: goalsProgress.daily.percentage,
        achieved: goalsProgress.daily.achieved,
        unit: 'minutes',
        color: goalsProgress.daily.achieved ? '#10B981' : '#F59E0B'
      });
    }
    
    if (goalsProgress.weekly) {
      progressData.push({
        type: 'weekly',
        label: 'Objectif hebdomadaire',
        target: goalsProgress.weekly.target,
        current: goalsProgress.weekly.current,
        percentage: goalsProgress.weekly.percentage,
        achieved: goalsProgress.weekly.achieved,
        unit: 'pages',
        color: goalsProgress.weekly.achieved ? '#10B981' : '#F59E0B'
      });
    }
    
    if (goalsProgress.monthly) {
      progressData.push({
        type: 'monthly',
        label: 'Objectif mensuel',
        target: goalsProgress.monthly.target,
        current: goalsProgress.monthly.current,
        percentage: goalsProgress.monthly.percentage,
        achieved: goalsProgress.monthly.achieved,
        unit: 'livres',
        color: goalsProgress.monthly.achieved ? '#10B981' : '#F59E0B'
      });
    }
    
    return progressData;
  }

  /**
   * Utilitaires de formatage
   */
  static formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  static formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  static calculateIntensity(pages) {
    // Calculer l'intensité sur une échelle de 0 à 4
    if (pages === 0) return 0;
    if (pages <= 10) return 1;
    if (pages <= 25) return 2;
    if (pages <= 50) return 3;
    return 4;
  }

  static getWeekOfYear(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Méthode principale pour transformer toutes les données
   */
  static transformAllChartData(metrics) {
    try {
      const {
        temporal = [],
        speedByGenre = {},
        goals = {},
        basic = {}
      } = metrics;

      return {
        pagesPerDay: this.transformPagesPerDayData(temporal),
        readingSpeed: this.transformReadingSpeedData(temporal, speedByGenre),
        heatmap: this.transformHeatmapData(temporal),
        genreDistribution: this.transformGenreDistributionData(speedByGenre),
        goalsProgress: this.transformGoalsProgressData(goals, basic)
      };
    } catch (error) {
      console.error('[ChartDataTransformer] Error transforming chart data:', error);
      return {
        pagesPerDay: [],
        readingSpeed: { evolution: [], byGenre: [] },
        heatmap: [],
        genreDistribution: { pie: [], bar: [] },
        goalsProgress: []
      };
    }
  }
}

export default ChartDataTransformer;