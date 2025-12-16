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

// Import des composants de graphiques individuels (à créer)
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
      variant={isActive ? 'primary' : 'ghost'}
      size="sm"
      onClick={() => onClick(config.id)}
      className="flex items-center gap-2 text-left justify-start"
    >
      <Icon className="w-4 h-4" />
      <div className="hidden sm:block">
        <div className="text-sm font-medium">{config.title}</div>
        <div className="text-xs opacity-75">{config.description}</div>
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
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-300" />
              <span className="font-medium text-slate-200">
                {t('books.statistics.charts.title', 'Graphiques')}
              </span>
            </div>
            
            {/* Navigation responsive */}
            <div className="flex-1">
              {/* Version desktop - tous les boutons visibles */}
              <div className="hidden lg:flex gap-2 flex-wrap">
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
              <div className="lg:hidden">
                <Button
                  variant="glass"
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className="w-full justify-between"
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
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <activeConfig.icon className="w-5 h-5 text-purple-300" />
            {activeConfig.title}
          </CardTitle>
          <p className="text-sm text-slate-400">
            {activeConfig.description}
          </p>
        </CardHeader>
        <CardContent>
          <ActiveChartComponent
            books={books}
            statisticsData={statisticsData}
            selectedPeriod={selectedPeriod}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsContainer;