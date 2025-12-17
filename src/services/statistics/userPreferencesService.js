/**
 * User Preferences Service for Statistics
 * 
 * Service pour la gestion de la persistance des préférences utilisateur
 * dans le sous-onglet statistiques de lecture.
 * 
 * Features:
 * - Sauvegarde des filtres actifs
 * - Persistance des préférences d'affichage
 * - Sauvegarde des comparaisons favorites
 * - Synchronisation avec localStorage
 * 
 * @see Requirements 10.5, 9.5
 */

const STORAGE_KEYS = {
  STATISTICS_PREFERENCES: 'reading_statistics_preferences',
  ACTIVE_FILTERS: 'reading_statistics_filters',
  DISPLAY_PREFERENCES: 'reading_statistics_display',
  FAVORITE_COMPARISONS: 'reading_statistics_comparisons',
  CHART_PREFERENCES: 'reading_statistics_charts'
};

/**
 * Structure par défaut des préférences utilisateur
 */
const DEFAULT_PREFERENCES = {
  // Filtres actifs
  filters: {
    selectedPeriod: '1m',
    genre: '',
    status: '',
    author: '',
    lastUpdated: null
  },
  
  // Préférences d'affichage
  display: {
    activeChart: 'pages-per-day',
    comparisonMode: false,
    expandedSections: ['metrics-basic'],
    chartSettings: {
      showTooltips: true,
      showLegend: true,
      animationsEnabled: true,
      colorScheme: 'default'
    },
    mobileLayout: 'auto', // 'auto', 'compact', 'expanded'
    lastUpdated: null
  },
  
  // Comparaisons favorites
  favoriteComparisons: [],
  
  // Préférences de graphiques
  chartPreferences: {
    defaultHeight: 'auto',
    showDataLabels: false,
    gridLines: true,
    responsiveBreakpoints: true
  },
  
  // Métadonnées
  version: '1.0.0',
  lastSaved: null
};

/**
 * Classe principale pour la gestion des préférences
 */
class UserPreferencesService {
  constructor() {
    this.preferences = this.loadPreferences();
    this.listeners = new Set();
  }

  /**
   * Charger les préférences depuis localStorage
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS_PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Fusionner avec les valeurs par défaut pour gérer les nouvelles propriétés
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des préférences:', error);
    }
    
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Fusionner les préférences chargées avec les valeurs par défaut
   */
  mergeWithDefaults(loaded) {
    const merged = { ...DEFAULT_PREFERENCES };
    
    // Fusionner récursivement les objets
    Object.keys(loaded).forEach(key => {
      if (typeof loaded[key] === 'object' && loaded[key] !== null && !Array.isArray(loaded[key])) {
        merged[key] = { ...merged[key], ...loaded[key] };
      } else {
        merged[key] = loaded[key];
      }
    });
    
    return merged;
  }

  /**
   * Sauvegarder les préférences dans localStorage
   */
  savePreferences() {
    try {
      this.preferences.lastSaved = new Date().toISOString();
      localStorage.setItem(
        STORAGE_KEYS.STATISTICS_PREFERENCES, 
        JSON.stringify(this.preferences)
      );
      this.notifyListeners('preferences_saved', this.preferences);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      return false;
    }
  }

  /**
   * Obtenir toutes les préférences
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Obtenir une section spécifique des préférences
   */
  getSection(section) {
    return this.preferences[section] ? { ...this.preferences[section] } : null;
  }

  /**
   * Mettre à jour les filtres actifs
   */
  updateFilters(filters) {
    this.preferences.filters = {
      ...this.preferences.filters,
      ...filters,
      lastUpdated: new Date().toISOString()
    };
    
    this.savePreferences();
    this.notifyListeners('filters_updated', this.preferences.filters);
  }

  /**
   * Obtenir les filtres actifs
   */
  getActiveFilters() {
    return { ...this.preferences.filters };
  }

  /**
   * Mettre à jour les préférences d'affichage
   */
  updateDisplayPreferences(displayPrefs) {
    this.preferences.display = {
      ...this.preferences.display,
      ...displayPrefs,
      lastUpdated: new Date().toISOString()
    };
    
    this.savePreferences();
    this.notifyListeners('display_updated', this.preferences.display);
  }

  /**
   * Obtenir les préférences d'affichage
   */
  getDisplayPreferences() {
    return { ...this.preferences.display };
  }

  /**
   * Mettre à jour les paramètres de graphique
   */
  updateChartSettings(chartSettings) {
    this.preferences.display.chartSettings = {
      ...this.preferences.display.chartSettings,
      ...chartSettings
    };
    
    this.savePreferences();
    this.notifyListeners('chart_settings_updated', this.preferences.display.chartSettings);
  }

  /**
   * Ajouter une comparaison aux favoris
   */
  addFavoriteComparison(comparison) {
    const newComparison = {
      id: Date.now().toString(),
      name: comparison.name || `Comparaison ${new Date().toLocaleDateString()}`,
      period1: comparison.period1,
      period2: comparison.period2,
      filters: comparison.filters || {},
      createdAt: new Date().toISOString()
    };
    
    this.preferences.favoriteComparisons.push(newComparison);
    
    // Limiter à 10 comparaisons favorites
    if (this.preferences.favoriteComparisons.length > 10) {
      this.preferences.favoriteComparisons = this.preferences.favoriteComparisons.slice(-10);
    }
    
    this.savePreferences();
    this.notifyListeners('favorite_comparison_added', newComparison);
    
    return newComparison;
  }

  /**
   * Supprimer une comparaison des favoris
   */
  removeFavoriteComparison(comparisonId) {
    const index = this.preferences.favoriteComparisons.findIndex(c => c.id === comparisonId);
    if (index !== -1) {
      const removed = this.preferences.favoriteComparisons.splice(index, 1)[0];
      this.savePreferences();
      this.notifyListeners('favorite_comparison_removed', removed);
      return removed;
    }
    return null;
  }

  /**
   * Obtenir les comparaisons favorites
   */
  getFavoriteComparisons() {
    return [...this.preferences.favoriteComparisons];
  }

  /**
   * Mettre à jour une section expandable
   */
  toggleExpandedSection(sectionId) {
    const expanded = this.preferences.display.expandedSections;
    const index = expanded.indexOf(sectionId);
    
    if (index !== -1) {
      expanded.splice(index, 1);
    } else {
      expanded.push(sectionId);
    }
    
    this.savePreferences();
    this.notifyListeners('section_toggled', { sectionId, expanded: index === -1 });
  }

  /**
   * Vérifier si une section est expandée
   */
  isSectionExpanded(sectionId) {
    return this.preferences.display.expandedSections.includes(sectionId);
  }

  /**
   * Réinitialiser les préférences aux valeurs par défaut
   */
  resetPreferences() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.notifyListeners('preferences_reset', this.preferences);
  }

  /**
   * Exporter les préférences
   */
  exportPreferences() {
    return {
      data: this.preferences,
      exportedAt: new Date().toISOString(),
      version: this.preferences.version
    };
  }

  /**
   * Importer des préférences
   */
  importPreferences(importedData) {
    try {
      if (importedData.data && typeof importedData.data === 'object') {
        this.preferences = this.mergeWithDefaults(importedData.data);
        this.savePreferences();
        this.notifyListeners('preferences_imported', this.preferences);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation des préférences:', error);
    }
    return false;
  }

  /**
   * Ajouter un listener pour les changements de préférences
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Erreur dans le listener de préférences:', error);
      }
    });
  }

  /**
   * Nettoyer les données obsolètes
   */
  cleanup() {
    // Supprimer les comparaisons trop anciennes (plus de 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    this.preferences.favoriteComparisons = this.preferences.favoriteComparisons.filter(
      comparison => new Date(comparison.createdAt) > sixMonthsAgo
    );
    
    this.savePreferences();
  }

  /**
   * Obtenir les statistiques d'utilisation des préférences
   */
  getUsageStats() {
    return {
      totalComparisons: this.preferences.favoriteComparisons.length,
      lastFilterUpdate: this.preferences.filters.lastUpdated,
      lastDisplayUpdate: this.preferences.display.lastUpdated,
      expandedSectionsCount: this.preferences.display.expandedSections.length,
      version: this.preferences.version
    };
  }
}

// Instance singleton
const userPreferencesService = new UserPreferencesService();

// Nettoyer automatiquement au démarrage
userPreferencesService.cleanup();

export default userPreferencesService;

