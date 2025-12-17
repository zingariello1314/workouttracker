/**
 * Fallback Data Provider
 * 
 * Service pour fournir des données de fallback lorsque les données
 * réelles sont insuffisantes ou corrompues.
 * 
 * Features:
 * - Données d'exemple pour démonstration
 * - Structures de données vides mais valides
 * - Messages d'aide contextuels
 * - Suggestions d'actions utilisateur
 * 
 * @see Requirements 1.5
 */

class FallbackDataProvider {
  constructor() {
    this.demoData = this.generateDemoData();
  }

  /**
   * Obtenir des données de fallback selon le contexte
   */
  getFallbackData(context = 'empty', options = {}) {
    const { 
      showDemo = false, 
      period = '1m',
      includeMessages = true 
    } = options;

    switch (context) {
      case 'empty':
        return this.getEmptyStatistics(includeMessages);
      
      case 'demo':
        return showDemo ? this.getDemoStatistics(period) : this.getEmptyStatistics(includeMessages);
      
      case 'corrupted':
        return this.getCorruptedDataFallback(includeMessages);
      
      case 'insufficient':
        return this.getInsufficientDataFallback(includeMessages);
      
      case 'error':
        return this.getErrorFallback(includeMessages);
      
      default:
        return this.getEmptyStatistics(includeMessages);
    }
  }

  /**
   * Statistiques vides mais structurellement valides
   */
  getEmptyStatistics(includeMessages = true) {
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
        pagesPerDay: [],
        readingSpeed: { evolution: [], byGenre: [] },
        heatmap: [],
        genreDistribution: { pie: [], bar: [] },
        goalsProgress: []
      },
      insights: includeMessages ? [{
        type: 'welcome',
        title: 'Bienvenue dans tes statistiques !',
        message: 'Commence à enregistrer des sessions de lecture pour voir tes données apparaître ici.',
        icon: 'book-open',
        color: 'blue',
        actions: [
          { label: 'Ajouter un livre', action: 'add_book' },
          { label: 'Voir le guide', action: 'show_guide' }
        ]
      }] : [],
      predictions: [],
      patterns: {},
      goals: {},
      fallbackContext: 'empty',
      suggestions: includeMessages ? this.getEmptySuggestions() : []
    };
  }

  /**
   * Données de démonstration
   */
  getDemoStatistics(period = '1m') {
    const now = new Date();
    const daysInPeriod = this.getDaysInPeriod(period);
    
    return {
      hasData: true,
      isDemo: true,
      metrics: {
        totalPages: 450,
        totalTime: 1200, // 20 heures
        averageSpeed: 22.5,
        sessionsCount: 28,
        booksCompleted: 3,
        currentStreak: 5,
        longestStreak: 12,
        averageSessionDuration: 43,
        readingFrequency: 4.2,
        dailyGoal: 30,
        todayProgress: 25
      },
      chartData: {
        pagesPerDay: this.generateDemoPagesPerDay(daysInPeriod),
        readingSpeed: {
          evolution: this.generateDemoSpeedEvolution(daysInPeriod),
          byGenre: this.generateDemoSpeedByGenre()
        },
        heatmap: this.generateDemoHeatmap(),
        genreDistribution: {
          pie: this.generateDemoGenreDistribution(),
          bar: this.generateDemoGenreComparison()
        },
        goalsProgress: this.generateDemoGoalsProgress()
      },
      insights: [
        {
          type: 'demo',
          title: 'Données de démonstration',
          message: 'Ces statistiques sont des exemples. Ajoutez vos propres livres pour voir vos vraies données.',
          icon: 'info',
          color: 'blue'
        },
        {
          type: 'speed',
          title: 'Vitesse de lecture',
          message: 'Vous lisez en moyenne 22.5 pages par heure',
          icon: 'trending-up',
          color: 'green'
        }
      ],
      predictions: [
        {
          type: 'completion',
          title: 'Temps estimé',
          message: 'À ce rythme, vous terminerez votre livre actuel dans 8 jours',
          confidence: 'medium'
        }
      ],
      patterns: {
        bestDaysOfWeek: {
          sunday: { dayName: 'Dimanche', averagePagesPerDay: 35 },
          saturday: { dayName: 'Samedi', averagePagesPerDay: 28 }
        }
      },
      goals: {
        daily: { target: 30, current: 25, percentage: 83 },
        weekly: { target: 200, current: 180, percentage: 90 }
      },
      fallbackContext: 'demo'
    };
  }

  /**
   * Fallback pour données corrompues
   */
  getCorruptedDataFallback(includeMessages = true) {
    const emptyStats = this.getEmptyStatistics(false);
    
    return {
      ...emptyStats,
      insights: includeMessages ? [{
        type: 'error',
        title: 'Données corrompues détectées',
        message: 'Certaines de vos données de lecture sont corrompues. Nous avons nettoyé ce qui était possible.',
        icon: 'alert-triangle',
        color: 'yellow',
        actions: [
          { label: 'Voir les détails', action: 'show_validation_report' },
          { label: 'Nettoyer les données', action: 'clean_data' }
        ]
      }] : [],
      fallbackContext: 'corrupted',
      suggestions: includeMessages ? this.getCorruptedDataSuggestions() : []
    };
  }

  /**
   * Fallback pour données insuffisantes
   */
  getInsufficientDataFallback(includeMessages = true) {
    const emptyStats = this.getEmptyStatistics(false);
    
    return {
      ...emptyStats,
      insights: includeMessages ? [{
        type: 'info',
        title: 'Pas assez de données',
        message: 'Vous avez besoin de plus de sessions de lecture pour générer des statistiques significatives.',
        icon: 'bar-chart',
        color: 'blue',
        actions: [
          { label: 'Ajouter une session', action: 'add_session' },
          { label: 'Importer des données', action: 'import_data' }
        ]
      }] : [],
      fallbackContext: 'insufficient',
      suggestions: includeMessages ? this.getInsufficientDataSuggestions() : []
    };
  }

  /**
   * Fallback pour erreurs générales
   */
  getErrorFallback(includeMessages = true) {
    const emptyStats = this.getEmptyStatistics(false);
    
    return {
      ...emptyStats,
      insights: includeMessages ? [{
        type: 'error',
        title: 'Erreur de calcul',
        message: 'Une erreur s\'est produite lors du calcul de vos statistiques. Veuillez réessayer.',
        icon: 'alert-circle',
        color: 'red',
        actions: [
          { label: 'Réessayer', action: 'retry' },
          { label: 'Signaler le problème', action: 'report_issue' }
        ]
      }] : [],
      fallbackContext: 'error',
      suggestions: includeMessages ? this.getErrorSuggestions() : []
    };
  }

  /**
   * Générer des données de démonstration
   */
  generateDemoData() {
    // Générer des livres et sessions d'exemple
    return {
      books: [
        {
          id: 'demo_1',
          title: 'Le Petit Prince',
          author: 'Antoine de Saint-Exupéry',
          genre: 'Fiction',
          pages: 96,
          status: 'completed',
          readingSessions: this.generateDemoSessions('demo_1', 8)
        },
        {
          id: 'demo_2',
          title: '1984',
          author: 'George Orwell',
          genre: 'Science-Fiction',
          pages: 328,
          status: 'in-progress',
          readingSessions: this.generateDemoSessions('demo_2', 15)
        }
      ]
    };
  }

  generateDemoSessions(bookId, count) {
    const sessions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (count - i));
      
      sessions.push({
        id: `session_${bookId}_${i}`,
        date: date.toISOString().split('T')[0],
        durationMinutes: 20 + Math.random() * 40,
        pagesRead: 8 + Math.random() * 25,
        note: i % 3 === 0 ? 'Session intéressante' : ''
      });
    }
    
    return sessions;
  }

  generateDemoPagesPerDay(days) {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        pages: Math.random() > 0.3 ? Math.floor(Math.random() * 30) + 5 : 0,
        sessions: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
      });
    }
    
    return data;
  }

  generateDemoSpeedEvolution(days) {
    const data = [];
    const baseSpeed = 20;
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        speed: baseSpeed + Math.sin(i / 5) * 5 + Math.random() * 3
      });
    }
    
    return data;
  }

  generateDemoSpeedByGenre() {
    return [
      { genre: 'Fiction', speed: 25, sessions: 15 },
      { genre: 'Science-Fiction', speed: 22, sessions: 8 },
      { genre: 'Biographie', speed: 18, sessions: 5 }
    ];
  }

  generateDemoHeatmap() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0
      });
    }
    
    return data;
  }

  generateDemoGenreDistribution() {
    return [
      { genre: 'Fiction', pages: 180, percentage: 40 },
      { genre: 'Science-Fiction', pages: 135, percentage: 30 },
      { genre: 'Biographie', pages: 90, percentage: 20 },
      { genre: 'Essai', pages: 45, percentage: 10 }
    ];
  }

  generateDemoGenreComparison() {
    return [
      { genre: 'Fiction', currentPeriod: 180, previousPeriod: 150 },
      { genre: 'Science-Fiction', currentPeriod: 135, previousPeriod: 120 },
      { genre: 'Biographie', currentPeriod: 90, previousPeriod: 110 }
    ];
  }

  generateDemoGoalsProgress() {
    return [
      { type: 'daily', target: 30, current: 25, percentage: 83 },
      { type: 'weekly', target: 200, current: 180, percentage: 90 },
      { type: 'monthly', target: 800, current: 650, percentage: 81 }
    ];
  }

  /**
   * Suggestions selon le contexte
   */
  getEmptySuggestions() {
    return [
      {
        title: 'Ajoutez votre premier livre',
        description: 'Commencez par ajouter un livre à votre bibliothèque',
        action: 'add_book',
        priority: 'high'
      },
      {
        title: 'Enregistrez une session',
        description: 'Ajoutez une session de lecture pour commencer à voir vos statistiques',
        action: 'add_session',
        priority: 'high'
      },
      {
        title: 'Définissez vos objectifs',
        description: 'Fixez-vous des objectifs de lecture quotidiens ou hebdomadaires',
        action: 'set_goals',
        priority: 'medium'
      }
    ];
  }

  getCorruptedDataSuggestions() {
    return [
      {
        title: 'Nettoyez vos données',
        description: 'Utilisez l\'outil de nettoyage pour corriger les données corrompues',
        action: 'clean_data',
        priority: 'high'
      },
      {
        title: 'Sauvegardez vos données',
        description: 'Exportez vos données pour éviter de futures pertes',
        action: 'export_data',
        priority: 'medium'
      }
    ];
  }

  getInsufficientDataSuggestions() {
    return [
      {
        title: 'Ajoutez plus de sessions',
        description: 'Enregistrez au moins 5 sessions pour des statistiques significatives',
        action: 'add_sessions',
        priority: 'high'
      },
      {
        title: 'Importez des données existantes',
        description: 'Si vous avez des données ailleurs, importez-les',
        action: 'import_data',
        priority: 'medium'
      }
    ];
  }

  getErrorSuggestions() {
    return [
      {
        title: 'Rechargez la page',
        description: 'Un simple rechargement peut résoudre le problème',
        action: 'reload',
        priority: 'high'
      },
      {
        title: 'Vérifiez votre connexion',
        description: 'Assurez-vous d\'avoir une connexion internet stable',
        action: 'check_connection',
        priority: 'medium'
      }
    ];
  }

  /**
   * Utilitaires
   */
  getDaysInPeriod(period) {
    const periodMap = {
      '7d': 7,
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      'all': 365
    };
    
    return periodMap[period] || 30;
  }
}

// Instance singleton
const fallbackDataProvider = new FallbackDataProvider();

export default fallbackDataProvider;