import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Filter, Download, LineChart, BarChart, Zap, Waves, Calendar } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { findExerciseInDatabase } from '../../data/exerciseDatabase';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

// Composants modulaires pour les graphiques
import EvolutionChart from './charts/EvolutionChart';
import MuscleGroupChart from './charts/MuscleGroupChart';
import TopExercisesChart from './charts/TopExercisesChart';
import MetricsChart from './charts/MetricsChart';
import ObjectivesChart from './charts/ObjectivesChart';
import CorrelationsChart from './charts/CorrelationsChart';
import BoxingChart from './charts/BoxingChart';
import SwimmingChart from './charts/SwimmingChart';
import ProgressChart from './charts/ProgressChart';

const ChartsTab = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // Périodes disponibles
  const periods = [
    { value: '7days', label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: '90days', label: '90 derniers jours' },
    { value: '1year', label: '1 an' }
  ];

  // Calculer la date de début selon la période sélectionnée
  const getStartDate = (period) => {
    const now = new Date();
    switch (period) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  // Données communes pour tous les graphiques
  const chartData = useMemo(() => {
    const workoutHistory = getWorkoutHistory();
    const startDate = getStartDate(selectedPeriod);
    
    const filteredHistory = workoutHistory.filter(session => new Date(session.date) >= startDate);
    
    return {
      workoutHistory: filteredHistory,
      startDate,
      selectedPeriod,
      data: data // Passer les données complètes pour les graphiques qui en ont besoin
    };
  }, [getWorkoutHistory, selectedPeriod, data]);

  // Couleurs élégantes dans le thème du site
  const themeColors = {
    primary: '#3B82F6',      // Bleu principal
    secondary: '#10B981',    // Vert émeraude
    accent: '#F59E0B',       // Orange ambre
    danger: '#EF4444',       // Rouge
    purple: '#8B5CF6',      // Violet
    pink: '#EC4899',         // Rose
    indigo: '#6366F1',      // Indigo
    teal: '#14B8A6',        // Teal
    slate: '#64748B',       // Slate
    zinc: '#71717A'         // Zinc
  };

  // Configuration des graphiques
  const chartConfigs = [
    {
      id: 'evolution',
      title: 'Évolution des Répétitions',
      icon: TrendingUp,
      color: 'blue',
      component: EvolutionChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'muscle-groups',
      title: 'Groupes Musculaires',
      icon: Target,
      color: 'green',
      component: MuscleGroupChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'top-exercises',
      title: 'Top Exercices',
      icon: Activity,
      color: 'purple',
      component: TopExercisesChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'metrics',
      title: 'Évolution des Mesures',
      icon: LineChart,
      color: 'teal',
      component: MetricsChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'objectives',
      title: 'Objectifs vs Réalité',
      icon: BarChart,
      color: 'orange',
      component: ObjectivesChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'correlations',
      title: 'Corrélations Métriques',
      icon: TrendingUp,
      color: 'pink',
      component: CorrelationsChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'boxing',
      title: 'Activité Boxe',
      icon: Zap,
      color: 'red',
      component: BoxingChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'swimming',
      title: 'Activité Natation',
      icon: Waves,
      color: 'cyan',
      component: SwimmingChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'progress',
      title: 'Progression Globale',
      icon: Calendar,
      color: 'indigo',
      component: ProgressChart,
      props: { data: chartData, colors: themeColors }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="mr-3" size={28} />
          📈 Graphiques & Analyses
        </h2>
        
        {/* Contrôles */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
          <Button
            icon={Download}
            className="bg-green-600 hover:bg-green-700"
            onClick={() => console.log('Export des données')}
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {chartConfigs.map((config) => {
          const IconComponent = config.icon;
          const ChartComponent = config.component;
          
          return (
            <Card key={config.id} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-xl">
                  <div className={`p-2 bg-${config.color}-500/20 rounded-lg mr-3`}>
                    <IconComponent className={`text-${config.color}-400`} size={24} />
                  </div>
                  {config.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartComponent {...config.props} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ChartsTab;