import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, Target, Award, Activity } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import {
  JUSTIFICATION_REASONS,
  JUSTIFICATION_LABELS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_ICONS
} from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';

const StatsTab = () => {
  const {
    statsPeriod,
    setStatsPeriod,
    getWorkoutHistory,
    setShowAdvancedStats,
    data
  } = useWorkout();
  const t = useTranslation();

  // PHASE 5.2 : Charger données Garmin
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  
  useEffect(() => {
    if (dbReady) {
      loadAllData()
        .then(setGarminData)
        .catch(err => {
          console.error('[StatsTab] Error loading Garmin data:', err);
          setGarminData(null);
        });
    }
  }, [dbReady, loadAllData]);

  // Utiliser les vraies données de l'historique des entraînements
  const workoutHistory = getWorkoutHistory();
  
  // ✅ NOUVEAU : Utiliser useWorkoutStats pour cohérence (intègre les justifications)
  const { getCurrentStreak, getLongestStreak, getJustificationStats } = useWorkoutStats();
  
  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // isMockSession remplacé par isMockEnduranceSession (importée)

  // Fonction pour calculer les statistiques d'endurance (FILTRER LES MOCK)
  const calculateEnduranceStats = (filteredHistory, period) => {
    // Récupérer les données d'endurance depuis le contexte
    const enduranceData = data?.enduranceData || {};
    const sessions = enduranceData.sessions || {};
    
    let totalEnduranceSessions = 0;
    let totalEnduranceReps = 0;
    let totalEnduranceDuration = 0;
    let totalEnduranceDistance = 0;
    let totalEnduranceJumps = 0;
    
    // Parcourir toutes les activités d'endurance (EXCLURE LES MOCK)
    Object.entries(sessions).forEach(([activityType, activitySessions]) => {
      if (Array.isArray(activitySessions)) {
        activitySessions.forEach(session => {
          // ✅ PHASE 1 : Exclure les sessions mock (fonction centralisée)
          if (isMockEnduranceSession(session)) {
            return; // Ignorer cette session
          }
          
          const sessionDate = new Date(session.date);
          const startDate = new Date();
          
          // Déterminer la période de début
          switch (period) {
            case 'week':
              startDate.setDate(startDate.getDate() - 7);
              break;
            case 'month':
              startDate.setDate(startDate.getDate() - 30);
              break;
            case 'year':
              startDate.setDate(startDate.getDate() - 365);
              break;
            default:
              startDate.setDate(startDate.getDate() - 7);
          }
          
          // Vérifier si la session est dans la période
          if (sessionDate >= startDate && sessionDate <= new Date()) {
            totalEnduranceSessions++;
            
            // ✅ CORRECTION : Ajouter les répétitions (pompes, boxe) - EXCLURE jumprope
            // Pour pushups/boxing, utiliser count (priorité) ou reps (fallback)
            // Exclure jumprope du calcul des reps (les sauts sont comptés séparément)
            if (activityType !== 'jumprope') {
              // Priorité : count > reps (cohérence avec CalendarHeatmap, CalendarTab, EnduranceTab)
              const sessionReps = session.count !== undefined && session.count !== null
                ? parseInt(session.count) || 0
                : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
              if (sessionReps > 0) {
                totalEnduranceReps += sessionReps;
              }
            }
            
            if (session.duration) totalEnduranceDuration += parseInt(session.duration) || 0;
            
            // Ajouter la distance (natation, course)
            if (session.distance) totalEnduranceDistance += parseFloat(session.distance) || 0;
            if (session.laps && Array.isArray(session.laps)) {
              session.laps.forEach(lap => {
                totalEnduranceDistance += parseFloat(lap.distance) || 0;
              });
            }
            
            // ✅ CORRECTION : Pour jumprope, utiliser jumps OU reps (qui représente les sauts)
            if (activityType === 'jumprope') {
              const sessionJumps = session.jumps !== undefined && session.jumps !== null
                ? parseInt(session.jumps) || 0
                : (session.reps !== undefined && session.reps !== null ? parseInt(session.reps) || 0 : 0);
              if (sessionJumps > 0) {
                totalEnduranceJumps += sessionJumps;
              }
            } else if (session.jumps) {
              // Pour les autres activités, utiliser jumps si présent
              totalEnduranceJumps += parseInt(session.jumps) || 0;
            }
          }
        });
      }
    });
    
    return {
      sessions: totalEnduranceSessions,
      reps: totalEnduranceReps,
      duration: totalEnduranceDuration,
      distance: totalEnduranceDistance,
      jumps: totalEnduranceJumps
    };
  };

  // Calculer les statistiques à partir des vraies données
  const calculateStats = (period) => {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const filteredHistory = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= now;
    });
    
    const totalWorkouts = filteredHistory.length;
    // CORRECTION CRITIQUE: Exclure les jumps de corde à sauter des calculs de reps
    const totalReps = filteredHistory.reduce((sum, session) => {
      if (!session.exercises) return sum;
      const sessionReps = session.exercises.reduce((reps, ex) => {
        // Exclure les exercices d'endurance jumprope
        const isJumprope = (ex.exerciseId || ex.id || '').toString().includes('endurance_jumprope') ||
                           ex.activityType === 'jumprope';
        if (isJumprope) return reps; // Ne pas compter les jumps comme reps
        return reps + (parseInt(ex.reps) || 0);
      }, 0);
      return sum + sessionReps;
    }, 0);
    const totalStretches = filteredHistory.reduce((sum, session) => 
      sum + (session.completedStretches || 0), 0
    );
    const activeDays = new Set(filteredHistory.map(session => session.date)).size;
    
    // Calculer les statistiques des activités complémentaires
    const complementaryStats = filteredHistory.reduce((stats, session) => {
      const complementaryExercises = session.exercises?.filter(ex => ex.isComplementary) || [];
      complementaryExercises.forEach(ex => {
        if (ex.name === 'Boxe') {
          stats.boxeSessions++;
          stats.boxeDuration += parseInt(ex.duration) || 0;
        } else if (ex.name === 'Natation') {
          stats.natationSessions++;
          stats.natationDuration += parseInt(ex.duration) || 0;
        }
      });
      return stats;
    }, {
      boxeSessions: 0,
      boxeDuration: 0,
      natationSessions: 0,
      natationDuration: 0
    });
    
    // Calculer les statistiques d'endurance
    const enduranceStats = calculateEnduranceStats(filteredHistory, period);
    
    return {
      totalWorkouts,
      totalReps,
      totalStretches,
      activeDays,
      complementaryStats,
      enduranceStats
    };
  };

  // ✅ NOUVEAU : Utiliser les fonctions de useWorkoutStats (intègrent les justifications)
  // Les fonctions calculateCurrentStreak et calculateLongestStreak sont remplacées
  // par getCurrentStreak et getLongestStreak de useWorkoutStats pour cohérence

  // PHASE 5.2 : Calculer les statistiques Garmin
  const calculateGarminStats = (period) => {
    if (!garminData || !garminData.dailyMetrics || Object.keys(garminData.dailyMetrics).length === 0) {
      return null;
    }

    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Filtrer dailyMetrics par période
    const filteredMetrics = Object.entries(garminData.dailyMetrics)
      .filter(([date]) => {
        const dateObj = new Date(date);
        return dateObj >= startDate && dateObj <= now;
      })
      .map(([, metrics]) => metrics);

    if (filteredMetrics.length === 0) return null;

    // Calculer agrégations
    const stats = {
      // Pas
      totalSteps: filteredMetrics.reduce((sum, m) => sum + (m.steps || 0), 0),
      avgSteps: Math.round(filteredMetrics.reduce((sum, m) => sum + (m.steps || 0), 0) / filteredMetrics.length),
      maxSteps: Math.max(...filteredMetrics.map(m => m.steps || 0)),
      
      // Distance
      totalDistance: filteredMetrics.reduce((sum, m) => sum + (m.distance || 0), 0),
      avgDistance: filteredMetrics.reduce((sum, m) => sum + (m.distance || 0), 0) / filteredMetrics.length,
      
      // Calories
      totalCalories: filteredMetrics.reduce((sum, m) => {
        const cal = m.calories || {};
        return sum + (cal.total || cal.active || 0);
      }, 0),
      avgCalories: filteredMetrics.reduce((sum, m) => {
        const cal = m.calories || {};
        return sum + (cal.total || cal.active || 0);
      }, 0) / filteredMetrics.length,
      
      // FC
      avgRestingHR: (() => {
        const hrMetrics = filteredMetrics.filter(m => m.heartRate?.resting);
        if (hrMetrics.length === 0) return 0;
        return Math.round(hrMetrics.reduce((sum, m) => sum + (m.heartRate?.resting || 0), 0) / hrMetrics.length);
      })(),
      maxHR: Math.max(...filteredMetrics.map(m => {
        const hr = m.heartRate || {};
        return hr.max || 0;
      })),
      
      // Body Battery
      avgBodyBattery: (() => {
        const bbMetrics = filteredMetrics.filter(m => {
          const bb = m.bodyBattery;
          // 🔴 FIX: Vérifier que bb n'est pas null avant d'accéder à ses propriétés
          return (bb !== null && typeof bb === 'object' && bb.current !== undefined) || typeof bb === 'number';
        });
        if (bbMetrics.length === 0) return 0;
        return Math.round(bbMetrics.reduce((sum, m) => {
          const bb = m.bodyBattery;
          // 🔴 FIX: Vérifier que bb n'est pas null avant d'accéder à ses propriétés
          const value = (bb !== null && typeof bb === 'object' && bb.current !== undefined) 
            ? bb.current 
            : (typeof bb === 'number' ? bb : 0);
          return sum + value;
        }, 0) / bbMetrics.length);
      })(),
      
      // Sommeil
      avgSleepDuration: (() => {
        const sleepMetrics = filteredMetrics.filter(m => m.sleep?.duration);
        if (sleepMetrics.length === 0) return 0;
        return sleepMetrics.reduce((sum, m) => sum + (m.sleep?.duration || 0), 0) / sleepMetrics.length;
      })(),
      avgSleepQuality: (() => {
        const sleepMetrics = filteredMetrics.filter(m => m.sleep?.quality);
        if (sleepMetrics.length === 0) return 0;
        return Math.round(sleepMetrics.reduce((sum, m) => sum + (m.sleep?.quality || 0), 0) / sleepMetrics.length);
      })(),
      
      // Minutes intensives
      totalIntensityMinutes: filteredMetrics.reduce((sum, m) => {
        const intensity = m.intensityMinutes || {};
        return sum + (intensity.total || 0);
      }, 0),
      
      // Activités
      totalActivities: (garminData.activities?.swimming?.length || 0) +
                       (garminData.activities?.jumpRope?.length || 0) +
                       (garminData.activities?.cardio?.length || 0),
      
      // Jours avec données
      activeDays: filteredMetrics.length
    };

    return stats;
  };

  const stats = calculateStats(statsPeriod);
  // ✅ NOUVEAU : Utiliser les fonctions de useWorkoutStats (intègrent les justifications)
  const currentStreak = useMemo(() => getCurrentStreak(), [getCurrentStreak]);
  const longestStreak = useMemo(() => getLongestStreak(), [getLongestStreak]);
  // ✅ NOUVEAU : Statistiques de justifications
  const justificationStats = useMemo(() => getJustificationStats(statsPeriod), [getJustificationStats, statsPeriod]);
  const garminStats = calculateGarminStats(statsPeriod);

  const periods = [
    { key: 'week', label: t('stats.periods.week') },
    { key: 'month', label: t('stats.periods.month') },
    { key: 'year', label: t('stats.periods.year') }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Sélecteur de période */}
      <div className="flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          {periods.map(period => (
            <Button
              key={period.key}
              variant={statsPeriod === period.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatsPeriod(period.key)}
              className={`px-4 py-2 ${
                statsPeriod === period.key 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.totalWorkouts}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mainStats.sessions')}</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalReps}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mainStats.reps')}</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentStreak}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mainStats.currentStreak')}</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {longestStreak}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mainStats.longestStreak')}</div>
          </Card.Content>
        </Card>

        <Card className="text-center">
          <Card.Content className="pt-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.totalStretches}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mainStats.stretches')}</div>
          </Card.Content>
        </Card>
      </div>

      {/* PHASE 5.2 : Métriques Garmin Connect */}
      {garminStats && (
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-white">
              <Activity className="text-green-400" size={24} />
              {t('stats.garmin.title')}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pas */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.totalSteps')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.totalSteps.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.avgStepsPerDay', 'Moy: {{avg}}/jour', { avg: garminStats.avgSteps })}</div>
              </div>
              
              {/* Distance */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.totalDistance')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.totalDistance.toFixed(1)} km</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.avgDistancePerDay', 'Moy: {{avg}} km/jour', { avg: garminStats.avgDistance.toFixed(1) })}</div>
              </div>
              
              {/* Calories */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.totalCalories')}</div>
                <div className="text-2xl font-bold text-white">{Math.round(garminStats.totalCalories).toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.avgCaloriesPerDay', 'Moy: {{avg}}/jour', { avg: Math.round(garminStats.avgCalories) })}</div>
              </div>
              
              {/* FC Repos */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.avgRestingHR')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.avgRestingHR} bpm</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.maxHR', 'FC Max: {{max}} bpm', { max: garminStats.maxHR })}</div>
              </div>
              
              {/* Body Battery */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.avgBodyBattery')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.avgBodyBattery}/100</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.avgOverPeriod')}</div>
              </div>
              
              {/* Sommeil */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.avgSleep')}</div>
                <div className="text-2xl font-bold text-white">
                  {garminStats.avgSleepDuration > 0 
                    ? `${Math.floor(garminStats.avgSleepDuration)}h${Math.round((garminStats.avgSleepDuration % 1) * 60)}m`
                    : '—'
                  }
                </div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.sleepQuality', 'Qualité: {{quality}}/100', { quality: garminStats.avgSleepQuality })}</div>
              </div>
              
              {/* Minutes Intensives */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.intensityMinutes')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.totalIntensityMinutes} min</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.totalOverPeriod')}</div>
              </div>
              
              {/* Activités */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t('stats.garmin.garminActivities')}</div>
                <div className="text-2xl font-bold text-white">{garminStats.totalActivities}</div>
                <div className="text-xs text-slate-500 mt-1">{t('stats.garmin.activeDays', 'Jours actifs: {{days}}', { days: garminStats.activeDays })}</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Statistiques d'endurance */}
      {stats.enduranceStats.sessions > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-200 mb-4 flex items-center">
            <Activity className="mr-2" size={20} />
            {t('stats.endurance.title')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-orange-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-200">{stats.enduranceStats.sessions}</div>
              <div className="text-orange-300 text-sm">{t('stats.endurance.sessions')}</div>
            </div>
            <div className="bg-blue-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-200">{stats.enduranceStats.reps}</div>
              <div className="text-blue-300 text-sm">{t('stats.endurance.reps')}</div>
            </div>
            <div className="bg-green-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-200">{stats.enduranceStats.distance}m</div>
              <div className="text-green-300 text-sm">{t('stats.endurance.distance')}</div>
            </div>
            <div className="bg-purple-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-200">{stats.enduranceStats.jumps}</div>
              <div className="text-purple-300 text-sm">{t('stats.endurance.jumps')}</div>
            </div>
            <div className="bg-red-700/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-200">{stats.enduranceStats.duration}min</div>
              <div className="text-red-300 text-sm">{t('stats.endurance.duration')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Statistiques de justifications */}
      {justificationStats.total > 0 && (
        <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-white">
              <Calendar className="text-slate-400" size={24} />
              {t('stats.justifications.title')}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="mb-4">
              <div className="text-3xl font-bold text-white mb-1">{justificationStats.total}</div>
              <div className="text-sm text-slate-400">{t('stats.justifications.justifiedDays')} ({statsPeriod === 'week' ? t('stats.justifications.thisWeek') : statsPeriod === 'month' ? t('stats.justifications.thisMonth') : statsPeriod === 'year' ? t('stats.justifications.thisYear') : t('stats.justifications.total')})</div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(JUSTIFICATION_REASONS).map(([key, reason]) => {
                const count = justificationStats.byReason[reason] || 0;
                if (count === 0) return null;
                
                const label = JUSTIFICATION_LABELS[reason];
                const icon = JUSTIFICATION_ICONS[reason];
                const colorClasses = JUSTIFICATION_COLORS[reason];
                
                return (
                  <div
                    key={reason}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 ${colorClasses}`}
                  >
                    <span className="text-xl" aria-hidden="true">{icon}</span>
                    <div className="flex flex-col">
                      <span className="text-white text-lg font-bold">{count}</span>
                      <span className="text-white/80 text-xs">{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              {t('stats.performance.title')}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stats.performance.avgPerSession')}</span>
                <span className="font-semibold">
                  {stats.totalWorkouts > 0 ? Math.round(stats.totalReps / stats.totalWorkouts) : 0} {t('stats.performance.reps')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stats.performance.activeDays')}</span>
                <span className="font-semibold">{stats.activeDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stats.performance.regularityRate')}</span>
                <span className="font-semibold">
                  {stats.activeDays > 0 ? Math.round((stats.activeDays / 30) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stats.performance.totalStretches')}</span>
                <span className="font-semibold">{stats.totalStretches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stats.performance.avgStretchesPerSession')}</span>
                <span className="font-semibold">
                  {stats.totalWorkouts > 0 ? Math.round(stats.totalStretches / stats.totalWorkouts) : 0}
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              {t('stats.achievements.title')}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('stats.achievements.currentStreak')}</span>
                <span className="font-semibold">{currentStreak} {t('stats.achievements.days')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('stats.achievements.longestStreak')}</span>
                <span className="font-semibold">{longestStreak} {t('stats.achievements.days')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('stats.achievements.totalReps')}</span>
                <span className="font-semibold">{stats.totalReps}</span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Statistiques des activités complémentaires */}
      {(stats.complementaryStats.boxeSessions > 0 || stats.complementaryStats.natationSessions > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.complementaryStats.boxeSessions > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  {t('stats.complementary.boxing')}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.sessions')}</span>
                    <span className="font-semibold">{stats.complementaryStats.boxeSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.totalDuration')}</span>
                    <span className="font-semibold">{stats.complementaryStats.boxeDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.avgPerSession')}</span>
                    <span className="font-semibold">
                      {stats.complementaryStats.boxeSessions > 0 
                        ? Math.round(stats.complementaryStats.boxeDuration / stats.complementaryStats.boxeSessions) 
                        : 0} {t('stats.complementary.minutes')}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {stats.complementaryStats.natationSessions > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  {t('stats.complementary.swimming')}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.sessions')}</span>
                    <span className="font-semibold">{stats.complementaryStats.natationSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.totalDuration')}</span>
                    <span className="font-semibold">{stats.complementaryStats.natationDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('stats.complementary.avgPerSession')}</span>
                    <span className="font-semibold">
                      {stats.complementaryStats.natationSessions > 0 
                        ? Math.round(stats.complementaryStats.natationDuration / stats.complementaryStats.natationSessions) 
                        : 0} {t('stats.complementary.minutes')}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      )}

      {/* Bouton statistiques avancées */}
      <div className="text-center">
        <Button
          onClick={() => setShowAdvancedStats(true)}
          icon={Target}
          size="lg"
        >
          Voir les statistiques avancées
        </Button>
      </div>
    </div>
  );
};

export default StatsTab;