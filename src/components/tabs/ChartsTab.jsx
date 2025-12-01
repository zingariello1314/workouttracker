import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Activity, Filter, Download, LineChart, BarChart, Zap, Waves, Calendar, Dumbbell, Flame, Clock, Award, TrendingDown, Minus, Heart, Battery, Moon, Wind, Thermometer } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { findExerciseInDatabase } from '../../data/exerciseDatabase';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useGarminData } from '../../hooks/useGarminData';
import { useTranslation } from '../../utils/translations';
import { useAuth } from '../../context/AuthContext';

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

// PHASE 5.1 : Graphiques Garmin à intégrer
import GarminHeartRateChart from './GarminTab/components/charts/GarminHeartRateChart';
import GarminHeartRateTimeSeriesChart from './GarminTab/components/charts/GarminHeartRateTimeSeriesChart';
import GarminBodyBatteryChart from './GarminTab/components/charts/GarminBodyBatteryChart';
import GarminStressChart from './GarminTab/components/charts/GarminStressChart';
import GarminSleepChart from './GarminTab/components/charts/GarminSleepChart';
import GarminRespirationChart from './GarminTab/components/charts/GarminRespirationChart';
import GarminActivityHeatmap from './GarminTab/components/charts/GarminActivityHeatmap';
import GarminCorrelationCharts from './GarminTab/components/charts/GarminCorrelationCharts';
import GarminDailyActivityChart from './GarminTab/components/charts/GarminDailyActivityChart';
import { createGarminChartWrapper, createGarminTimeSeriesChartWrapper, createGarminCorrelationChartsWrapper } from './charts/GarminChartWrapper';

const ChartsTab = () => {
  const { data, getWorkoutHistory, activeProgram } = useWorkout();
  const { isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const t = useTranslation();
  
  // PHASE 5.1 : Charger données Garmin (uniquement si connecté)
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  
  useEffect(() => {
    // ✅ Ne charger les données Garmin que si l'utilisateur est connecté
    if (!isAuthenticated) {
      setGarminData(null);
      return;
    }
    
    if (dbReady) {
      loadAllData()
        .then(setGarminData)
        .catch(err => {
          console.error('[ChartsTab] Error loading Garmin data:', err);
          setGarminData(null);
        });
    }
  }, [dbReady, loadAllData, isAuthenticated]);

  // Périodes disponibles
  const periods = useMemo(() => [
    { value: '7days', label: t('charts.periods.7days') },
    { value: '30days', label: t('charts.periods.30days') },
    { value: '90days', label: t('charts.periods.90days') },
    { value: '1year', label: t('charts.periods.1year') }
  ], [t]);

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

  // ✅ Si déconnecté, forcer garminData à null pour afficher l'état vide (défini AVANT chartConfigs)
  const effectiveGarminData = isAuthenticated ? garminData : null;

  // PHASE 5.1 : Wrappers pour graphiques Garmin (adaptation selectedPeriod → periodFilter)
  const GarminHeartRateChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminHeartRateChart), []
  );
  const GarminHeartRateTimeSeriesChartWrapped = React.useMemo(() => 
    createGarminTimeSeriesChartWrapper(GarminHeartRateTimeSeriesChart), []
  );
  const GarminBodyBatteryChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminBodyBatteryChart), []
  );
  const GarminStressChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminStressChart), []
  );
  const GarminSleepChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminSleepChart), []
  );
  const GarminRespirationChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminRespirationChart), []
  );
  const GarminActivityHeatmapWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminActivityHeatmap, true), // true = needsActivities
    []
  );
  const GarminCorrelationChartsWrapped = React.useMemo(() => 
    createGarminCorrelationChartsWrapper(GarminCorrelationCharts), []
  );
  const GarminDailyActivityChartWrapped = React.useMemo(() => 
    createGarminChartWrapper(GarminDailyActivityChart), []
  );

  // Configuration des graphiques avec votre design exact
  const chartConfigs = useMemo(() => [
    // ==========================================
    // SECTION GARMIN (au-dessus des graphiques existants)
    // ==========================================
    {
      id: 'garmin-heart-rate',
      title: t('charts.garmin.heartRate'),
      icon: Heart,
      color: 'red',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      component: GarminHeartRateChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-heart-rate-timeseries',
      title: t('charts.garmin.heartRateTimeSeries'),
      icon: Activity,
      color: 'red',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      component: GarminHeartRateTimeSeriesChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-body-battery',
      title: t('charts.garmin.bodyBattery'),
      icon: Battery,
      color: 'green',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      component: GarminBodyBatteryChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-stress',
      title: t('charts.garmin.stress'),
      icon: Thermometer,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: GarminStressChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-sleep',
      title: t('charts.garmin.sleep'),
      icon: Moon,
      color: 'indigo',
      bgColor: 'bg-indigo-500/20',
      textColor: 'text-indigo-400',
      component: GarminSleepChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-respiration',
      title: t('charts.garmin.respiration'),
      icon: Wind,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: GarminRespirationChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    {
      id: 'garmin-activities-heatmap',
      title: t('charts.garmin.activityHeatmap'),
      icon: Calendar,
      color: 'teal',
      bgColor: 'bg-teal-500/20',
      textColor: 'text-teal-400',
      component: GarminActivityHeatmapWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.activities && (effectiveGarminData.activities.swimming?.length > 0 || effectiveGarminData.activities.jumpRope?.length > 0 || effectiveGarminData.activities.cardio?.length > 0)
    },
    {
      id: 'garmin-correlations',
      title: t('charts.garmin.correlations'),
      icon: BarChart3,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: GarminCorrelationChartsWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    },
    
    // ==========================================
    // GRAPHIQUES WORKOUT EXISTANTS
    // ==========================================
    // ROW 1 - 3 Cartes KPI
    {
      id: 'volume-repetitions',
      title: t('charts.workout.volumeRepetitions'),
      icon: Dumbbell,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: VolumeRepetitionsChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'activite-regularite',
      title: t('charts.workout.activityRegularity'),
      icon: Flame,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: ActiviteRegulariteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'objectifs-performance',
      title: t('charts.workout.objectives'),
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
      title: t('charts.workout.volumeEvolution'),
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: EvolutionVolumeChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'repartition-musculaire',
      title: t('charts.workout.muscleDistribution'),
      icon: Target,
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      component: RepartitionMusculaireChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'top-exercices',
      title: t('charts.workout.topExercises'),
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
      title: t('charts.workout.activityCalendar'),
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: CalendrierActiviteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'distribution-temporelle',
      title: t('charts.workout.distribution'),
      icon: Clock,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: DistributionTemporelleChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'progression-individuelle',
      title: t('charts.workout.individualProgression'),
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
      title: t('charts.workout.boxingActivity'),
      icon: Zap,
      color: 'red',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      component: BoxeActiviteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-performance',
      title: t('charts.workout.swimmingPerformance'),
      icon: Waves,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: NatationPerformanceChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-evolution-distance',
      title: t('charts.workout.distanceEvolution'),
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      component: NatationEvolutionDistanceChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-temps-allure',
      title: t('charts.workout.timePace'),
      icon: Clock,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      component: NatationTempsAllureChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'natation-volume-regularite',
      title: t('charts.workout.volumeRegularity'),
      icon: Calendar,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      component: NatationVolumeRegulariteChart,
      props: { data: chartData, colors: themeColors }
    },
    {
      id: 'etirements-zone',
      title: t('charts.workout.stretchesByZone'),
      icon: Activity,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      component: EtirementsZoneChart,
      props: { data: chartData, colors: themeColors }
    }
  ], [t, effectiveGarminData, selectedPeriod, themeColors, chartData, GarminHeartRateChartWrapped, GarminHeartRateTimeSeriesChartWrapped, GarminBodyBatteryChartWrapped, GarminStressChartWrapped, GarminSleepChartWrapped, GarminRespirationChartWrapped, GarminActivityHeatmapWrapped, GarminCorrelationChartsWrapped]);

  // Mémorisation des configurations pour éviter les re-rendus (avec filtrage conditionnel)
  const memoizedChartConfigs = useMemo(() => {
    return chartConfigs.filter(config => {
      // Si condition est définie et false, exclure le graphique
      if (config.condition !== undefined && config.condition === false) {
        return false;
      }
      return true;
    });
  }, [chartData, themeColors, selectedPeriod, effectiveGarminData]);

  // Séparer les graphiques spéciaux (FC 24h en pleine largeur, puis ligne de 3)
  const fc24hConfig = memoizedChartConfigs.find(c => c.id === 'garmin-heart-rate-timeseries');
  const secondRowGarminConfigs = [
    memoizedChartConfigs.find(c => c.id === 'garmin-heart-rate'),
    memoizedChartConfigs.find(c => c.id === 'garmin-body-battery'),
    {
      id: 'garmin-daily-activity',
      title: t('charts.garmin.dailyActivity'),
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      component: GarminDailyActivityChartWrapped,
      props: { garminData: effectiveGarminData, selectedPeriod, colors: themeColors },
      condition: effectiveGarminData?.dailyMetrics && Object.keys(effectiveGarminData.dailyMetrics).length > 0
    }
  ].filter(config => {
    // Filtrer les configs null ET vérifier les conditions
    if (!config) return false;
    if (config.condition !== undefined && config.condition === false) return false;
    return true;
  });
  
  // Autres graphiques (exclure ceux déjà affichés)
  const otherChartConfigs = memoizedChartConfigs.filter(c => 
    c.id !== 'garmin-heart-rate-timeseries' && 
    c.id !== 'garmin-heart-rate' && 
    c.id !== 'garmin-body-battery'
  );

  // ✅ Vérifier si l'historique est vide (état déconnecté ou aucune donnée)
  const workoutHistory = getWorkoutHistory();
  const hasNoData = (!workoutHistory || workoutHistory.length === 0) && 
                    (!effectiveGarminData || !effectiveGarminData.dailyMetrics || Object.keys(effectiveGarminData.dailyMetrics).length === 0);

  if (hasNoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {t('charts.title')}
            </h1>
            <p className="text-slate-400 mt-1">{t('charts.subtitle')}</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <BarChart3 className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('charts.empty.title', 'Aucune donnée disponible')}
              </h3>
              <p className="text-slate-400">
                {t('charts.empty.message', 'Commencez à enregistrer vos entraînements pour voir vos graphiques ici.')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-6">
      {/* Header avec votre design exact */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            {t('charts.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('charts.subtitle')}</p>
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

      {/* Ligne 1 : FC 24h en pleine largeur */}
      {fc24hConfig && (() => {
        const IconComponent = fc24hConfig.icon;
        const ChartComponent = fc24hConfig.component;
        return (
          <div className="mb-20">
            <div className={`bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 pb-12 border ${fc24hConfig.bgColor.replace('bg-', 'border-').replace('/20', '/20')} shadow-xl hover:shadow-${fc24hConfig.color}-500/20 transition-all duration-300 min-h-[1050px]`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <IconComponent className={fc24hConfig.textColor} size={20} />
                  {fc24hConfig.title}
                </h2>
              </div>
              <ChartComponent {...fc24hConfig.props} />
            </div>
          </div>
        );
      })()}

      {/* Ligne 2 : 3 graphiques Garmin (Heart Rate, Body Battery, Daily Activity) */}
      {secondRowGarminConfigs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {secondRowGarminConfigs.map((config) => {
            if (!config) return null;
            const IconComponent = config.icon;
            const ChartComponent = config.component;
            
            return (
              <div 
                key={config.id} 
                className={`bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 pb-8 border ${config.bgColor.replace('bg-', 'border-').replace('/20', '/20')} shadow-xl hover:shadow-${config.color}-500/20 transition-all duration-300 min-h-[600px]`}
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
      )}

      {/* Grille 3x3 - Autres graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {otherChartConfigs.map((config) => {
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