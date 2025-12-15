/**
 * Index des composants graphiques intelligibles
 * Remplace les graphiques moches et ininterpretables
 * Phase 6 : Harmonisation visuelle complète
 */

// ===== COMPOSANTS HARMONISÉS (Phase 6) =====
export { default as HarmonizedChartWrapper } from './HarmonizedChartWrapper';
export { 
  SidebarChartWrapper, 
  DashboardChartWrapper, 
  ModalChartWrapper, 
  MiniChartWrapper,
  useChartHarmony,
  useHarmonizedColors,
  useHarmonizedConfig
} from './HarmonizedChartWrapper';

// ===== COMPOSANTS GRAPHIQUES PRINCIPAUX =====
export { default as EnhancedLineChart } from './EnhancedLineChart';
export { default as AnimatedDonutChart } from './AnimatedDonutChart';
export { default as PerformanceRadarChart } from './PerformanceRadarChart';
export { default as ResponsiveBarChart } from './ResponsiveBarChart';

// ===== COMPOSANTS GRAPHIQUES SPÉCIALISÉS =====
export { default as ReadingProgressChart } from './ReadingProgressChart';

// ===== COMPOSANTS GRAPHIQUES GARMIN (Phase 4) =====
export { default as HeartRateZonesChart } from './HeartRateZonesChart';
export { default as SleepPhasesChart } from './SleepPhasesChart';
export { default as StressLevelChart } from './StressLevelChart';

// ===== COMPOSANTS GRAPHIQUES CRÉATIFS (Phase 5) =====
export { default as StackedAreaChart } from './StackedAreaChart';
export { default as CreativeBubbleChart } from './CreativeBubbleChart';
export { default as InteractiveTimeline } from './InteractiveTimeline';
export { default as ThematicProgressBars } from './ThematicProgressBars';

// ===== SERVICES ET UTILITAIRES =====
export { default as chartHarmonyService } from '../../services/charts/chartHarmonyService';
export * from '../../utils/chartFormatters';

// Types de graphiques recommandés par cas d'usage
export const CHART_TYPES = {
  // Évolution temporelle
  TEMPORAL_EVOLUTION: 'EnhancedLineChart',
  TRENDS_STACKED: 'StackedAreaChart',
  
  // Pourcentages et progression
  PERCENTAGE: 'AnimatedDonutChart',
  PROGRESS: 'AnimatedDonutChart',
  THEMATIC_PROGRESS: 'ThematicProgressBars',
  
  // Performance multidimensionnelle
  PERFORMANCE: 'PerformanceRadarChart',
  BALANCE: 'PerformanceRadarChart',
  
  // Comparaisons par catégories
  COMPARISON: 'ResponsiveBarChart',
  CATEGORIES: 'ResponsiveBarChart',
  
  // Créativité et projets
  CREATIVE_PROJECTS: 'CreativeBubbleChart',
  PROJECT_TIMELINE: 'InteractiveTimeline',
  CREATIVE_PROGRESS: 'ThematicProgressBars'
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
  },
  
  CREATIVITY: {
    colors: ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    formatters: {
      progress: 'percentage',
      impact: 'number',
      complexity: 'number'
    },
    themes: {
      creative: 'artistic',
      gaming: 'playful',
      professional: 'clean'
    }
  },
  
  PROJECTS: {
    colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'],
    formatters: {
      completion: 'percentage',
      timeline: 'date',
      priority: 'text'
    },
    milestones: {
      planning: '#3B82F6',
      development: '#F59E0B',
      testing: '#EF4444',
      deployment: '#10B981'
    }
  }
};