/**
 * PredictionEngine Service
 * 
 * Moteur de prédictions et recommandations pour les statistiques de lecture.
 * Fournit des estimations de temps de lecture, des recommandations d'objectifs
 * et l'analyse des patterns temporels pour optimiser les habitudes de lecture.
 * 
 * @see Requirements 8.1, 8.2, 8.3
 */

class PredictionEngine {
  /**
   * Calculer le temps estimé pour terminer les livres en cours
   * @param {Array} books - Liste des livres
   * @param {Object} userMetrics - Métriques de l'utilisateur
   * @returns {Array} Prédictions de temps de lecture
   */
  static calculateCompletionTimes(books, userMetrics) {
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
          // Méthode 1: Vitesse moyenne de l'utilisateur
          let globalEstimate = null;
          if (userMetrics.averageSpeed > 0) {
            const estimatedHours = remainingPages / userMetrics.averageSpeed;
            globalEstimate = {
              hours: Math.round(estimatedHours * 10) / 10,
              minutes: Math.round(estimatedHours * 60),
              method: 'global_average'
            };
          }
          
          // Méthode 2: Vitesse spécifique du livre (seulement si assez de données)
          let bookSpecificEstimate = null;
          const bookMinutes = readingSessions.reduce((sum, session) => 
            sum + (Number(session.durationMinutes) || 0), 0
          );
          
          if (bookMinutes >= 30 && pagesRead >= 20) { // Minimum 30 minutes et 20 pages pour être fiable
            const bookSpeed = pagesRead / (bookMinutes / 60);
            const bookEstimatedHours = remainingPages / bookSpeed;
            bookSpecificEstimate = {
              hours: Math.round(bookEstimatedHours * 10) / 10,
              minutes: Math.round(bookEstimatedHours * 60),
              method: 'book_specific',
              bookSpeed: Math.round(bookSpeed * 10) / 10
            };
          }
          
          // Méthode 3: Vitesse par genre (si disponible)
          let genreEstimate = null;
          if (book.genre && userMetrics.speedByGenre && userMetrics.speedByGenre[book.genre]) {
            const genreSpeed = userMetrics.speedByGenre[book.genre].averageSpeed;
            if (genreSpeed > 0) {
              const genreEstimatedHours = remainingPages / genreSpeed;
              genreEstimate = {
                hours: Math.round(genreEstimatedHours * 10) / 10,
                minutes: Math.round(genreEstimatedHours * 60),
                method: 'genre_specific',
                genreSpeed: Math.round(genreSpeed * 10) / 10
              };
            }
          }
          
          // Choisir la meilleure estimation (priorité: livre > genre > global)
          const bestEstimate = bookSpecificEstimate || genreEstimate || globalEstimate;
          
          if (bestEstimate) {
            predictions.push({
              bookId: book.id,
              bookTitle: book.title,
              bookAuthor: book.author,
              bookGenre: book.genre,
              totalPages,
              pagesRead,
              remainingPages,
              progressPercent: Math.round((pagesRead / totalPages) * 100),
              estimate: bestEstimate,
              alternativeEstimates: {
                global: globalEstimate,
                bookSpecific: bookSpecificEstimate,
                genre: genreEstimate
              },
              confidence: this.calculateConfidence(bookSpecificEstimate, genreEstimate, globalEstimate, readingSessions.length)
            });
          }
        }
      }
    });
    
    return predictions.sort((a, b) => a.estimate.minutes - b.estimate.minutes);
  }

  /**
   * Calculer le niveau de confiance d'une prédiction
   */
  static calculateConfidence(bookSpecific, genre, global, sessionCount) {
    let confidence = 'low';
    
    if (bookSpecific && sessionCount >= 5) {
      confidence = 'high';
    } else if (bookSpecific && sessionCount >= 3) {
      confidence = 'medium';
    } else if (bookSpecific && sessionCount >= 1) {
      confidence = 'low';
    } else if (genre) {
      confidence = 'medium';
    } else if (global) {
      confidence = 'low';
    }
    
    return confidence;
  }

  /**
   * Générer des recommandations d'objectifs basées sur l'historique
   * @param {Object} userMetrics - Métriques de l'utilisateur
   * @param {Object} patterns - Patterns de lecture
   * @returns {Object} Recommandations d'objectifs
   */
  static generateGoalRecommendations(userMetrics, patterns) {
    const recommendations = {
      daily: null,
      weekly: null,
      monthly: null,
      reasoning: {}
    };

    // Recommandation quotidienne (en minutes)
    if (userMetrics.averageSessionDuration > 0) {
      const currentAverage = userMetrics.averageSessionDuration;
      const recommendedDaily = Math.max(15, Math.round(currentAverage * 1.1)); // 10% d'amélioration
      
      recommendations.daily = {
        type: 'minutes',
        target: recommendedDaily,
        current: Math.round(currentAverage),
        improvement: Math.round(((recommendedDaily - currentAverage) / currentAverage) * 100)
      };
      
      recommendations.reasoning.daily = this.generateDailyReasoning(currentAverage, recommendedDaily);
    }

    // Recommandation hebdomadaire (en pages)
    if (userMetrics.averagePagesPerDay > 0) {
      const currentWeeklyPages = Math.round(userMetrics.averagePagesPerDay * 7);
      const recommendedWeekly = Math.round(currentWeeklyPages * 1.15); // 15% d'amélioration
      
      recommendations.weekly = {
        type: 'pages',
        target: recommendedWeekly,
        current: currentWeeklyPages,
        improvement: Math.round(((recommendedWeekly - currentWeeklyPages) / currentWeeklyPages) * 100)
      };
      
      recommendations.reasoning.weekly = this.generateWeeklyReasoning(currentWeeklyPages, recommendedWeekly, patterns);
    }

    // Recommandation mensuelle (en livres)
    if (userMetrics.averageSpeed > 0) {
      // Estimer combien de livres peuvent être lus par mois
      const averageBookPages = 250; // Estimation moyenne
      const monthlyReadingHours = (userMetrics.averageSessionDuration / 60) * userMetrics.readingFrequency * 4.33; // 4.33 semaines par mois
      const monthlyPages = monthlyReadingHours * userMetrics.averageSpeed;
      const currentMonthlyBooks = Math.max(1, Math.floor(monthlyPages / averageBookPages));
      const recommendedMonthly = Math.max(1, Math.round(currentMonthlyBooks * 1.2)); // 20% d'amélioration
      
      recommendations.monthly = {
        type: 'books',
        target: recommendedMonthly,
        current: currentMonthlyBooks,
        improvement: currentMonthlyBooks > 0 ? 
          Math.round(((recommendedMonthly - currentMonthlyBooks) / currentMonthlyBooks) * 100) : 100
      };
      
      recommendations.reasoning.monthly = this.generateMonthlyReasoning(currentMonthlyBooks, recommendedMonthly, userMetrics);
    }

    return recommendations;
  }

  /**
   * Générer le raisonnement pour l'objectif quotidien
   */
  static generateDailyReasoning(current, recommended) {
    if (recommended <= current) {
      return "Maintenir votre rythme actuel qui est déjà excellent.";
    }
    
    const diff = recommended - current;
    if (diff <= 5) {
      return `Augmenter légèrement de ${diff} minutes par jour pour progresser en douceur.`;
    } else if (diff <= 15) {
      return `Un objectif modéré de ${diff} minutes supplémentaires pour améliorer votre régularité.`;
    } else {
      return `Un défi ambitieux mais réalisable de ${diff} minutes de plus par jour.`;
    }
  }

  /**
   * Générer le raisonnement pour l'objectif hebdomadaire
   */
  static generateWeeklyReasoning(current, recommended, patterns) {
    const bestDay = patterns.bestDaysOfWeek ? 
      Object.values(patterns.bestDaysOfWeek).sort((a, b) => b.averagePagesPerDay - a.averagePagesPerDay)[0] : null;
    
    let reasoning = `Passer de ${current} à ${recommended} pages par semaine. `;
    
    if (bestDay) {
      reasoning += `Votre meilleur jour est le ${bestDay.dayName} avec ${Math.round(bestDay.averagePagesPerDay)} pages en moyenne.`;
    }
    
    return reasoning;
  }

  /**
   * Générer le raisonnement pour l'objectif mensuel
   */
  static generateMonthlyReasoning(current, recommended, userMetrics) {
    let reasoning = `Objectif de ${recommended} livre(s) par mois basé sur votre vitesse de ${userMetrics.averageSpeed} pages/heure. `;
    
    if (current === 0) {
      reasoning += "Commencer par un livre par mois est un excellent objectif.";
    } else {
      reasoning += `Cela représente une progression de ${recommended - current} livre(s) supplémentaire(s).`;
    }
    
    return reasoning;
  }

  /**
   * Analyser les patterns temporels (meilleurs créneaux, jours optimaux)
   * @param {Object} aggregatedData - Données agrégées des sessions
   * @returns {Object} Analyse des patterns temporels
   */
  static analyzeTemporalPatterns(aggregatedData) {
    const patterns = {
      bestDaysOfWeek: this.analyzeBestDays(aggregatedData),
      readingConsistency: this.analyzeConsistency(aggregatedData),
      productivityTrends: this.analyzeProductivityTrends(aggregatedData),
      recommendations: []
    };

    // Générer des recommandations basées sur les patterns
    patterns.recommendations = this.generatePatternRecommendations(patterns);

    return patterns;
  }

  /**
   * Analyser les meilleurs jours de la semaine
   */
  static analyzeBestDays(aggregatedData) {
    const dayStats = {};
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    // Initialiser les statistiques pour chaque jour
    dayNames.forEach(day => {
      dayStats[day] = {
        dayName: day,
        totalPages: 0,
        totalMinutes: 0,
        sessionCount: 0,
        dayCount: 0,
        averagePagesPerDay: 0,
        averageMinutesPerDay: 0,
        averageSessionsPerDay: 0
      };
    });
    
    // Analyser les données par date
    Object.entries(aggregatedData.byDate).forEach(([date, data]) => {
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      const dayName = dayNames[dayOfWeek];
      
      dayStats[dayName].totalPages += data.totalPages;
      dayStats[dayName].totalMinutes += data.totalMinutes;
      dayStats[dayName].sessionCount += data.sessionCount;
      dayStats[dayName].dayCount += 1;
    });
    
    // Calculer les moyennes
    Object.values(dayStats).forEach(dayData => {
      if (dayData.dayCount > 0) {
        dayData.averagePagesPerDay = Math.round((dayData.totalPages / dayData.dayCount) * 10) / 10;
        dayData.averageMinutesPerDay = Math.round((dayData.totalMinutes / dayData.dayCount) * 10) / 10;
        dayData.averageSessionsPerDay = Math.round((dayData.sessionCount / dayData.dayCount) * 10) / 10;
      }
    });
    
    // Trier par productivité (pages par jour)
    const sortedDays = Object.values(dayStats).sort((a, b) => b.averagePagesPerDay - a.averagePagesPerDay);
    
    return {
      ranking: sortedDays,
      bestDay: sortedDays[0],
      worstDay: sortedDays[sortedDays.length - 1],
      weekendVsWeekday: this.compareWeekendVsWeekday(dayStats)
    };
  }

  /**
   * Comparer les performances weekend vs semaine
   */
  static compareWeekendVsWeekday(dayStats) {
    const weekendDays = ['Samedi', 'Dimanche'];
    const weekdayDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    
    const weekendStats = weekendDays.reduce((acc, day) => {
      acc.pages += dayStats[day].averagePagesPerDay;
      acc.minutes += dayStats[day].averageMinutesPerDay;
      acc.sessions += dayStats[day].averageSessionsPerDay;
      return acc;
    }, { pages: 0, minutes: 0, sessions: 0 });
    
    const weekdayStats = weekdayDays.reduce((acc, day) => {
      acc.pages += dayStats[day].averagePagesPerDay;
      acc.minutes += dayStats[day].averageMinutesPerDay;
      acc.sessions += dayStats[day].averageSessionsPerDay;
      return acc;
    }, { pages: 0, minutes: 0, sessions: 0 });
    
    // Moyennes
    weekendStats.avgPages = weekendStats.pages / 2;
    weekendStats.avgMinutes = weekendStats.minutes / 2;
    weekendStats.avgSessions = weekendStats.sessions / 2;
    
    weekdayStats.avgPages = weekdayStats.pages / 5;
    weekdayStats.avgMinutes = weekdayStats.minutes / 5;
    weekdayStats.avgSessions = weekdayStats.sessions / 5;
    
    return {
      weekend: weekendStats,
      weekday: weekdayStats,
      preference: weekendStats.avgPages > weekdayStats.avgPages ? 'weekend' : 'weekday',
      difference: Math.round((weekendStats.avgPages - weekdayStats.avgPages) * 10) / 10
    };
  }

  /**
   * Analyser la consistance de lecture
   */
  static analyzeConsistency(aggregatedData) {
    const totalDays = Object.keys(aggregatedData.byDate).length;
    const daysWithReading = Object.values(aggregatedData.byDate).filter(d => d.totalPages > 0).length;
    const consistencyRate = totalDays > 0 ? (daysWithReading / totalDays) * 100 : 0;
    
    let consistencyLevel = 'low';
    if (consistencyRate >= 80) consistencyLevel = 'excellent';
    else if (consistencyRate >= 60) consistencyLevel = 'good';
    else if (consistencyRate >= 40) consistencyLevel = 'moderate';
    
    return {
      rate: Math.round(consistencyRate),
      level: consistencyLevel,
      daysWithReading,
      totalDays,
      streak: aggregatedData.streaks
    };
  }

  /**
   * Analyser les tendances de productivité
   */
  static analyzeProductivityTrends(aggregatedData) {
    const dailyData = Object.entries(aggregatedData.byDate)
      .map(([date, data]) => ({
        date,
        pages: data.totalPages,
        minutes: data.totalMinutes,
        sessions: data.sessionCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (dailyData.length < 7) {
      return {
        trend: 'insufficient_data',
        direction: null,
        strength: 0
      };
    }
    
    // Calculer la tendance sur les pages lues (régression linéaire simple)
    const n = dailyData.length;
    const sumX = dailyData.reduce((sum, _, i) => sum + i, 0);
    const sumY = dailyData.reduce((sum, d) => sum + d.pages, 0);
    const sumXY = dailyData.reduce((sum, d, i) => sum + (i * d.pages), 0);
    const sumX2 = dailyData.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    let direction = 'stable';
    let strength = Math.abs(slope);
    
    if (slope > 0.1) direction = 'increasing';
    else if (slope < -0.1) direction = 'decreasing';
    
    return {
      trend: direction,
      slope: Math.round(slope * 100) / 100,
      strength: Math.round(strength * 100) / 100,
      interpretation: this.interpretTrend(direction, strength)
    };
  }

  /**
   * Interpréter la tendance de productivité
   */
  static interpretTrend(direction, strength) {
    if (direction === 'increasing') {
      if (strength > 1) return "Excellente progression ! Vous lisez de plus en plus.";
      else return "Légère amélioration de votre rythme de lecture.";
    } else if (direction === 'decreasing') {
      if (strength > 1) return "Attention, votre rythme de lecture diminue.";
      else return "Légère baisse, mais rien d'inquiétant.";
    } else if (direction === 'stable') {
      return "Rythme de lecture stable et régulier.";
    } else {
      return "Pas assez de données pour analyser la tendance.";
    }
  }

  /**
   * Générer des recommandations basées sur les patterns
   */
  static generatePatternRecommendations(patterns) {
    const recommendations = [];
    
    // Recommandation basée sur le meilleur jour
    if (patterns.bestDaysOfWeek.bestDay.averagePagesPerDay > 0) {
      const bestDay = patterns.bestDaysOfWeek.bestDay;
      recommendations.push({
        type: 'best_day',
        priority: 'high',
        title: `Optimiser le ${bestDay.dayName}`,
        description: `Votre meilleur jour est le ${bestDay.dayName} avec ${bestDay.averagePagesPerDay} pages en moyenne. Planifiez vos sessions importantes ce jour-là.`,
        action: `Bloquer du temps le ${bestDay.dayName} pour la lecture`
      });
    }
    
    // Recommandation basée sur la consistance
    if (patterns.readingConsistency.level === 'low') {
      recommendations.push({
        type: 'consistency',
        priority: 'high',
        title: 'Améliorer la régularité',
        description: `Vous ne lisez que ${patterns.readingConsistency.rate}% des jours. Essayez de lire un peu chaque jour, même 10 minutes.`,
        action: 'Définir un créneau quotidien fixe pour la lecture'
      });
    }
    
    // Recommandation basée sur weekend vs semaine
    const weekendComparison = patterns.bestDaysOfWeek.weekendVsWeekday;
    if (weekendComparison.preference === 'weekend' && weekendComparison.difference > 5) {
      recommendations.push({
        type: 'weekend_focus',
        priority: 'medium',
        title: 'Profiter des weekends',
        description: `Vous lisez ${Math.round(weekendComparison.difference)} pages de plus en moyenne le weekend. Planifiez vos lectures longues pour ces jours.`,
        action: 'Réserver les livres captivants pour le weekend'
      });
    }
    
    // Recommandation basée sur la tendance
    if (patterns.productivityTrends.trend === 'decreasing') {
      recommendations.push({
        type: 'declining_trend',
        priority: 'high',
        title: 'Inverser la tendance',
        description: patterns.productivityTrends.interpretation,
        action: 'Revoir vos objectifs et retrouver la motivation'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Méthode principale pour générer toutes les prédictions et analyses
   */
  static generateAllPredictions(books, userMetrics, aggregatedData) {
    try {
      const completionTimes = this.calculateCompletionTimes(books, userMetrics);
      const goalRecommendations = this.generateGoalRecommendations(userMetrics, aggregatedData);
      const temporalPatterns = this.analyzeTemporalPatterns(aggregatedData);
      
      return {
        completionTimes,
        goalRecommendations,
        temporalPatterns,
        summary: {
          booksInProgress: completionTimes.length,
          totalEstimatedHours: completionTimes.reduce((sum, p) => sum + p.estimate.hours, 0),
          averageConfidence: this.calculateAverageConfidence(completionTimes),
          topRecommendation: temporalPatterns.recommendations[0] || null
        }
      };
    } catch (error) {
      console.error('[PredictionEngine] Error generating predictions:', error);
      return {
        completionTimes: [],
        goalRecommendations: {},
        temporalPatterns: {},
        summary: {}
      };
    }
  }

  /**
   * Calculer la confiance moyenne des prédictions
   */
  static calculateAverageConfidence(predictions) {
    if (predictions.length === 0) return 'none';
    
    const confidenceScores = { high: 3, medium: 2, low: 1 };
    const totalScore = predictions.reduce((sum, p) => sum + confidenceScores[p.confidence], 0);
    const averageScore = totalScore / predictions.length;
    
    if (averageScore >= 2.5) return 'high';
    if (averageScore >= 1.5) return 'medium';
    return 'low';
  }
}

export default PredictionEngine;