/**
 * ChartsContainer Component
 * 
 * Container principal pour tous les graphiques de statistiques de lecture.
 * Gère la navigation entre les différents types de graphiques et leur affichage.
 * 
 * @see Requirements 2.1, 2.3, 4.1, 5.1
 */

import React, { useState } from 'react';
import { BarChart3, LineChart, Calendar, PieChart, Target } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useTranslation } from '../../../../utils/translations';
import StatisticsErrorBoundary from '../../../statistics/StatisticsErrorBoundary';

// Import des composants de graphiques individuels
import PagesPerDayChart from './charts/PagesPerDayChart';
import ReadingSpeedChart from './charts/ReadingSpeedChart';
import HeatmapCalendar from './charts/HeatmapCalendar';
import GenreDistributionChart from './charts/GenreDistributionChart';
import GoalsProgressChart from './charts/GoalsProgressChart';

/**
 * Configuration des types de graphiques disponibles
 */
const CHART_CONFIGS = {
  'pages-per-day': {
    id: 'pages-per-day',
    title: 'Pages par jour',
    icon: BarChart3,
    component: PagesPerDayChart,
    description: 'Évolution quotidienne des pages lues'
  },
  'reading-speed': {
    id: 'reading-speed',
    title: 'Vitesse de lecture',
    icon: LineChart,
    component: ReadingSpeedChart,
    description: 'Évolution de ta vitesse de lecture dans le temps'
  },
  'heatmap-calendar': {
    id: 'heatmap-calendar',
    title: 'Calendrier d\'activité',
    icon: Calendar,
    component: HeatmapCalendar,
    description: 'Visualisation de ta régularité de lecture'
  },
  'genre-distribution': {
    id: 'genre-distribution',
    title: 'Répartition par genre',
    icon: PieChart,
    component: GenreDistributionChart,
    description: 'Analyse de tes préférences de lecture'
  },
  'goals-progress': {
    id: 'goals-progress',
    title: 'Progression des objectifs',
    icon: Target,
    component: GoalsProgressChart,
    description: 'Suivi de tes objectifs de lecture'
  }
};

const ChartNavButton = ({ config, isActive, onClick }) => {
  const Icon = config.icon;
  
  return (
    <Button
      variant={isActive ? 'books' : 'booksMuted'}
      size="sm"
      onClick={() => onClick(config.id)}
      className="chart-nav-button touch-target normal-case tracking-normal"
    >
      <Icon className="w-4 h-4" />
      <div className="hidden sm:block">
        <div className="text-sm font-medium">{config.title}</div>
        <div className="chart-description text-xs opacity-75">{config.description}</div>
      </div>
      <span className="sm:hidden">{config.title}</span>
    </Button>
  );
};

const ChartsContainer = ({ 
  books, 
  statisticsData, 
  activeChart, 
  onChartChange, 
  selectedPeriod, 
  filters 
}) => {
  const t = useTranslation();
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // Obtenir la configuration du graphique actif
  const activeConfig = CHART_CONFIGS[activeChart] || CHART_CONFIGS['pages-per-day'];
  const ActiveChartComponent = activeConfig.component;

  return (
    <div className="space-y-4">
      {/* Navigation des graphiques */}
      <Card variant="books" className="!p-4 md:!p-5">
        <CardContent className="!p-0">
          <div className="charts-navigation">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#93c5fd]" />
              <span className="font-medium text-[#bfdbfe]">
                {t('books.statistics.charts.title', 'Graphiques')}
              </span>
            </div>
            
            {/* Navigation responsive */}
            <div className="flex-1">
              {/* Version desktop - tous les boutons visibles */}
              <div className="chart-nav-desktop">
                {Object.values(CHART_CONFIGS).map(config => (
                  <ChartNavButton
                    key={config.id}
                    config={config}
                    isActive={activeChart === config.id}
                    onClick={onChartChange}
                  />
                ))}
              </div>
              
              {/* Version mobile - menu déroulant */}
              <div className="chart-nav-mobile">
                <Button
                  variant="booksMuted"
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className="w-full justify-between touch-target normal-case tracking-normal"
                >
                  <span className="flex items-center gap-2">
                    <activeConfig.icon className="w-4 h-4" />
                    {activeConfig.title}
                  </span>
                  <span className="text-xs">
                    {isNavExpanded ? '▲' : '▼'}
                  </span>
                </Button>
                
                {isNavExpanded && (
                  <div className="mt-2 space-y-1">
                    {Object.values(CHART_CONFIGS).map(config => (
                      <ChartNavButton
                        key={config.id}
                        config={config}
                        isActive={activeChart === config.id}
                        onClick={(chartId) => {
                          onChartChange(chartId);
                          setIsNavExpanded(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique actif */}
      <Card variant="books">
        <CardHeader className="border-b border-[#3A86FF]/25">
          <CardTitle tone="books" className="flex items-center gap-2 normal-case tracking-wide">
            <activeConfig.icon className="w-5 h-5 text-[#93c5fd]" />
            {activeConfig.title}
          </CardTitle>
          <p className="text-sm text-[#93c5fd]/80">
            {activeConfig.description}
          </p>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <StatisticsErrorBoundary
              context={{ 
                chartType: activeChart,
                dataSize: books?.length || 0,
                hasData: statisticsData?.hasData || false
              }}
              fallbackType="minimal"
              onRetry={() => {
                // Forcer le re-render du graphique
                if (onChartChange) {
                  onChartChange(activeChart);
                }
              }}
            >
              <ActiveChartComponent
                books={books}
                statisticsData={statisticsData}
                selectedPeriod={selectedPeriod}
                filters={filters}
              />
            </StatisticsErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsContainer;