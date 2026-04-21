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

  // Couleurs graphiques (axes / secondaires) — charte Sport pour l’UI, couleurs « utiles » conservées pour les séries
  const themeColors = {
    primary: '#0F4C5C',
    secondary: '#0F5C45',
    accent: '#38bdf8',
    danger: '#EF4444',
    purple: '#38bdf8',
    pink: '#22d3ee',
    indigo: '#0ea5e9',
    teal: '#14b8a6',
    slate: '#5eead4',
    zinc: '#94a3b8'
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
      <div className="relative mx-auto max-w-7xl px-4 py-6 pb-20 text-teal-50">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {t('charts.title')}
            </h1>
            <p className="mt-1 text-sm text-teal-700">{t('charts.subtitle')}</p>
          </div>
        </div>
        <Card variant="sport" className="p-12 text-center">
          <div className="space-y-4">
            <BarChart3 className="mx-auto h-16 w-16 text-teal-600" />
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {t('charts.empty.title', 'Aucune donnée disponible')}
              </h3>
              <p className="text-teal-700">
                {t('charts.empty.message', 'Commencez à enregistrer vos entraînements pour voir vos graphiques ici.')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const chartShell =
    'rounded-2xl border-2 border-[#0F4C5C]/75 bg-black p-6 shadow-lg shadow-black/40 transition-shadow duration-300';

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 pb-20">
      <div className="relative z-10 text-teal-50">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {t('charts.title')}
            </h1>
            <p className="mt-1 text-sm text-teal-700">{t('charts.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-xl border-2 border-[#0F4C5C]/60 bg-black p-1 shadow-md shadow-black/30">
            {periods.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setSelectedPeriod(period.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  selectedPeriod === period.value
                    ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white shadow-md shadow-black/40'
                    : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-[#0F5C45]/55'
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
            <div className={`${chartShell} min-h-[1050px] pb-12`}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
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
              <div key={config.id} className={`${chartShell} min-h-[600px] pb-8`}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
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
            <div key={config.id} className={chartShell}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
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
    </div>
  );
};

export default ChartsTab;