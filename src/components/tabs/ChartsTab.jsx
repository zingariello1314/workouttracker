import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Filter, Download, LineChart, BarChart, Zap, Waves, Calendar, Dumbbell, Flame, Clock, Award, TrendingDown, Minus } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { findExerciseInDatabase } from '../../data/exerciseDatabase';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

// Composants modulaires pour les graphiques - NOUVEAUX GRAPHIQUES
import VolumeRepetitionsChart from './charts/VolumeRepetitionsChart';
import ActiviteRegulariteChart from './charts/ActiviteRegulariteChart';
import ObjectifsPerformanceChart from './charts/ObjectifsPerformanceChart';
import EvolutionVolumeChart from './charts/EvolutionVolumeChart';
import RepartitionMusculaireChart from './charts/RepartitionMusculaireChart';
import TopExercicesChart from './charts/TopExercicesChart';
import CalendrierActiviteChart from './charts/CalendrierActiviteChart';
import DistributionTemporelleChart from './charts/DistributionTemporelleChart';
import ProgressionIndividuelleChart from './charts/ProgressionIndividuelleChart';
import BoxeActiviteChart from './charts/BoxeActiviteChart';
import NatationPerformanceChart from './charts/NatationPerformanceChart';
import NatationEvolutionDistanceChart from './charts/NatationEvolutionDistanceChart';
import NatationTempsAllureChart from './charts/NatationTempsAllureChart';
import NatationVolumeRegulariteChart from './charts/NatationVolumeRegulariteChart';
import EtirementsZoneChart from './charts/EtirementsZoneChart';

const ChartsTab = () => {
  const { data, getWorkoutHistory, activeProgram } = useWorkout();
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

  // Données communes pour tous les graphiques - optimisé
  const chartData = useMemo(() => {
    const workoutHistory = getWorkoutHistory();
    const startDate = getStartDate(selectedPeriod);
    
    const filteredHistory = workoutHistory.filter(session => new Date(session.date) >= startDate);
    
    return {
      workoutHistory: filteredHistory,
      startDate,
      selectedPeriod,
      data: data, // Passer les données complètes pour les graphiques qui en ont besoin
      activeProgram: activeProgram // Ajouter le programme actif
    };
  }, [getWorkoutHistory, selectedPeriod, data, activeProgram]);

  // Configuration des graphiques avec votre design exact
  const chartConfigs = [
    // ROW 1 - 3 Cartes KPI
    {
      id: 'volume-repetitions',
      title: 'Volume & Répétitions',
      icon: Dumbbell,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: VolumeRepetitionsChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'activite-regularite',
      title: 'Activité & Régularité',
      icon: Flame,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: ActiviteRegulariteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'objectifs-performance',
      title: 'Objectifs',
      icon: Target,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: ObjectifsPerformanceChart,
      props: { data: chartData, colors: themeColors }
    },
    // ROW 2 - 3 Graphiques
    {
      id: 'evolution-volume',
      title: 'Évolution du Volume',
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: EvolutionVolumeChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'repartition-musculaire',
      title: 'Répartition Musculaire',
      icon: Target,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: RepartitionMusculaireChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'top-exercices',
      title: 'Top Exercices',
      icon: Award,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: TopExercicesChart,
      props: { data: chartData, colors: themeColors }
    },
    // ROW 3 - 3 Graphiques
    {
      id: 'calendrier-activite',
      title: 'Calendrier d\'Activité',
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: CalendrierActiviteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'distribution-temporelle',
      title: 'Distribution',
      icon: Clock,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: DistributionTemporelleChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'progression-individuelle',
      title: 'Progression Individuelle',
      icon: TrendingUp,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: ProgressionIndividuelleChart,
      props: { data: chartData, colors: themeColors }
    },
    // Section Activités Complémentaires
    {
      id: 'boxe-activite',
      title: 'Activité Boxe',
      icon: Zap,
      color: 'red',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      component: BoxeActiviteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-performance',
      title: 'Performance Natation',
      icon: Waves,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: NatationPerformanceChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-evolution-distance',
      title: 'Évolution Distance',
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      component: NatationEvolutionDistanceChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-temps-allure',
      title: 'Temps & Allure',
      icon: Clock,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      component: NatationTempsAllureChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-volume-regularite',
      title: 'Volume & Régularité',
      icon: Calendar,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: NatationVolumeRegulariteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'etirements-zone',
      title: 'Étirements par Zone',
      icon: Activity,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: EtirementsZoneChart,
      props: { data: chartData, colors: themeColors }
    }
  ];

  // Mémorisation des configurations pour éviter les re-rendus
  const memoizedChartConfigs = useMemo(() => chartConfigs, [chartData, themeColors, selectedPeriod]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-6">
      {/* Header avec votre design exact */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Graphiques & Analyses
          </h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de vos performances</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 backdrop-blur-sm rounded-lg p-1 border border-purple-500/20">
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                selectedPeriod === period.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50'
                  : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille 3x3 - Tous les éléments avec votre design exact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {memoizedChartConfigs.map((config) => {
          const IconComponent = config.icon;
          const ChartComponent = config.component;
          
          return (
            <div 
              key={config.id} 
              className={`bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border ${config.bgColor.replace('bg-', 'border-').replace('/20', '/20')} shadow-xl hover:shadow-${config.color}-500/20 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <IconComponent className={config.textColor} size={20} />
                  {config.title}
                </h2>
              </div>
              <ChartComponent {...config.props} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartsTab;