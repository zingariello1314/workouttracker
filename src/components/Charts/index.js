/**
 * Index des composants graphiques intelligibles
 * Remplace les graphiques moches et ininterpretables
 */

// Composants graphiques principaux
export { default as EnhancedLineChart } from './EnhancedLineChart';
export { default as AnimatedDonutChart } from './AnimatedDonutChart';
export { default as PerformanceRadarChart } from './PerformanceRadarChart';
export { default as ResponsiveBarChart } from './ResponsiveBarChart';

// Composants graphiques spécialisés
export { default as ReadingProgressChart } from './ReadingProgressChart';

// Composants graphiques Garmin (Phase 4)
export { default as HeartRateZonesChart } from './HeartRateZonesChart';
export { default as SleepPhasesChart } from './SleepPhasesChart';
export { default as StressLevelChart } from './StressLevelChart';

// Utilitaires de formatage
export * from '../../utils/chartFormatters';

// Types de graphiques recommandés par cas d'usage
export const CHART_TYPES = {
  // Évolution temporelle
  TEMPORAL_EVOLUTION: 'EnhancedLineChart',
  
  // Pourcentages et progression
  PERCENTAGE: 'AnimatedDonutChart',
  PROGRESS: 'AnimatedDonutChart',
  
  // Performance multidimensionnelle
  PERFORMANCE: 'PerformanceRadarChart',
  BALANCE: 'PerformanceRadarChart',
  
  // Comparaisons par catégories
  COMPARISON: 'ResponsiveBarChart',
  CATEGORIES: 'ResponsiveBarChart'
};

// Configurations recommandées par domaine
export const DOMAIN_CONFIGS = {
  FINANCE: {
    colors: ['#10B981', '#EF4444', '#F59E0B'],
    formatters: {
      value: 'currency',
      percentage: 'percentage'
    }
  },
  
  READING: {
    colors: ['#3B82F6', '#8B5CF6', '#06B6D4'],
    formatters: {
      pages: 'pages',
      books: 'books',
      duration: 'duration'
    }
  },
  
  HEALTH: {
    colors: ['#10B981', '#F59E0B', '#EF4444'],
    formatters: {
      heartRate: 'heartrate',
      steps: 'steps',
      calories: 'calories',
      weight: 'weight'
    }
  },
  
  PERFORMANCE: {
    colors: ['#8B5CF6', '#3B82F6', '#10B981'],
    formatters: {
      percentage: 'percentage',
      score: 'number'
    }
  }
};