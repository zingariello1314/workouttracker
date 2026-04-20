import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Calendar, Activity, Target, Flame, Zap, Clock, Dumbbell, Repeat } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import { useGarminData } from '../../hooks/useGarminData';
import CalendarHeatmap from '../CalendarHeatmap';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { getDateStr } from '../../utils/dateUtils';
import {
  isMockEnduranceSession,
  isPushupExerciseName,
  parseDurationToMinutes
} from '../../utils/calendarUtils';
import { getTotalRepsFromData } from '../../context/WorkoutContext/utils/workoutHistoryUtils';
import {
  JUSTIFICATION_REASONS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_ICONS
} from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';
import { calendarHeatmapCompositeBackground } from '../../utils/calendarHeatmapTint';

const CalendarTab = () => {
  // Récupérer les données directement du contexte pour la réactivité
  const {
    data,
    getCurrentData,
    deleteMockEnduranceSessions,
    getExerciseNameById,
    requestOpenEnduranceSubTab
  } = useWorkout();
  const t = useTranslation();
  
  // Utiliser getCurrentData() pour inclure les données temporaires non sauvegardées
  const currentData = getCurrentData();
  
  // PHASE 5.3 : Charger données Garmin
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  
  useEffect(() => {
    if (dbReady) {
      loadAllData()
        .then(setGarminData)
        .catch(err => {
          console.error('[CalendarTab] Error loading Garmin data:', err);
          setGarminData(null);
        });
    }
  }, [dbReady, loadAllData]);
  
  // Créer une instance du hook avec les données actuelles
  const { getWorkoutHistory } = useWorkoutStats();
  
  // Utiliser useMemo pour recalculer l'historique quand les données changent
  const workoutHistory = useMemo(() => {
    const history = getWorkoutHistory();
    return history;
  }, [currentData.reps, currentData.checkedExercises, getWorkoutHistory]);

  // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
  // Plus besoin de useCallback car la fonction est stable (importée)

  // 🏃 Calculer les statistiques d'endurance (FILTRER LES MOCK)
  const enduranceStats = useMemo(() => {
    const enduranceData = currentData?.enduranceData || {};
    const sessions = enduranceData.sessions || {};

    const ENDURANCE_ACTIVITY_KEYS = ['boxing', 'pushups', 'swimming', 'jumprope', 'running'];

    const stats = {
      totalSessions: 0,
      totalReps: 0,
      totalJumps: 0,
      totalEnduranceMinutes: 0,
      totalRunningMinutes: 0,
      totalStreetReps: getTotalRepsFromData(currentData || {}),
      totalStreetVolumeKg: 0,
      byActivity: {
        boxing: { sessions: 0, reps: 0, duration: 0, distance: 0, jumps: 0 },
        pushups: { sessions: 0, reps: 0, duration: 0, distance: 0, jumps: 0 },
        swimming: { sessions: 0, distance: 0, duration: 0, jumps: 0 },
        jumprope: { sessions: 0, jumps: 0, duration: 0, distance: 0 },
        running: { sessions: 0, distance: 0, duration: 0, jumps: 0 }
      }
    };

    const runningDistanceKm = (session) => {
      const dm = parseFloat(session.distanceMeters);
      if (Number.isFinite(dm) && dm > 0) return dm / 1000;
      const km = parseFloat(session.distance);
      return Number.isFinite(km) ? km : 0;
    };

    const swimmingDistanceM = (session) => {
      const td = parseFloat(session.totalDistance);
      if (Number.isFinite(td) && td > 0) return td;
      const d = parseFloat(session.distance);
      return Number.isFinite(d) ? d : 0;
    };

    // Calculer les statistiques pour chaque activité (EXCLURE LES MOCK)
    Object.entries(sessions).forEach(([activityType, activitySessions]) => {
      if (!ENDURANCE_ACTIVITY_KEYS.includes(activityType) || !Array.isArray(activitySessions)) return;
      const bucket = stats.byActivity[activityType];
      if (!bucket) return;

      const validSessions = activitySessions.filter((session) => !isMockEnduranceSession(session));

      bucket.sessions = validSessions.length;
      stats.totalSessions += validSessions.length;

      validSessions.forEach((session) => {
        const durationMin = parseDurationToMinutes(session.duration, '');
        stats.totalEnduranceMinutes += durationMin;
        bucket.duration += durationMin;

        if (activityType === 'running') {
          stats.totalRunningMinutes += durationMin;
        }

        if (activityType !== 'jumprope') {
          const sessionReps =
            session.count !== undefined && session.count !== null
              ? parseInt(session.count, 10) || 0
              : session.reps !== undefined && session.reps !== null
                ? parseInt(session.reps, 10) || 0
                : 0;
          if (sessionReps > 0) {
            bucket.reps += sessionReps;
            stats.totalReps += sessionReps;
          }
        }

        if (activityType === 'running') {
          const km = runningDistanceKm(session);
          if (km > 0) {
            bucket.distance += km;
          }
        } else if (activityType === 'swimming') {
          const m = swimmingDistanceM(session);
          if (m > 0) {
            bucket.distance += m;
          }
        } else if (session.distance != null && session.distance !== '') {
          const d = parseFloat(session.distance);
          if (Number.isFinite(d) && d > 0) {
            bucket.distance = (bucket.distance || 0) + d;
          }
        }

        if (activityType === 'jumprope') {
          const sessionJumps =
            session.jumps !== undefined && session.jumps !== null
              ? parseInt(session.jumps, 10) || 0
              : session.reps !== undefined && session.reps !== null
                ? parseInt(session.reps, 10) || 0
                : 0;
          if (sessionJumps > 0) {
            bucket.jumps += sessionJumps;
            stats.totalJumps += sessionJumps;
          }
        } else if (session.jumps != null && session.jumps !== '' && !Number.isNaN(Number(session.jumps))) {
          bucket.jumps = (bucket.jumps || 0) + parseInt(session.jumps, 10);
          stats.totalJumps += parseInt(session.jumps, 10);
        }
      });
    });

    let streetPushupReps = 0;
    const repsMap = currentData?.reps || {};
    const checked = currentData?.checkedExercises || {};
    Object.entries(repsMap).forEach(([key, val]) => {
      if (!checked[key]) return;
      const underscore = key.lastIndexOf('_');
      if (underscore <= 0) return;
      const exerciseId = key.slice(underscore + 1);
      if (!/^\d+$/.test(exerciseId)) return;
      const name = getExerciseNameById(parseInt(exerciseId, 10));
      if (!isPushupExerciseName(name)) return;
      streetPushupReps += parseInt(val, 10) || 0;
    });

    stats.byActivity.pushups.reps += streetPushupReps;
    stats.totalReps += streetPushupReps;

    let totalStreetVolumeKg = 0;
    Object.entries(repsMap).forEach(([key, val]) => {
      if (!checked[key]) return;
      const r = parseInt(val, 10) || 0;
      if (r <= 0) return;
      const wRaw = currentData?.exerciseWeights?.[key];
      const kg = parseFloat(String(wRaw ?? '').replace(/\s/g, '').replace(',', '.'));
      if (!Number.isFinite(kg) || kg <= 0) return;
      totalStreetVolumeKg += kg * r;
    });
    stats.totalStreetVolumeKg = totalStreetVolumeKg;

    return stats;
  }, [currentData, getExerciseNameById]);

  const runningTimeCumulativeLabel = useMemo(() => {
    const m = Math.max(0, Math.round(enduranceStats.totalRunningMinutes));
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h <= 0) {
      return t('calendar.cumulativeStats.runningTimeMinutesOnly', { m: rem });
    }
    return t('calendar.cumulativeStats.runningTimeHoursMinutes', { h, m: rem });
  }, [enduranceStats.totalRunningMinutes, t]);

  const runningDistanceChallengeLabel = useMemo(() => {
    const km = enduranceStats.byActivity.running.distance;
    const n = Number(km);
    if (!Number.isFinite(n) || n <= 0) {
      return `0${t('calendar.enduranceChallenges.kilometers')}`;
    }
    const s = n >= 100 ? n.toFixed(1) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
    return `${parseFloat(s)}${t('calendar.enduranceChallenges.kilometers')}`;
  }, [enduranceStats.byActivity.running.distance, t]);

  const showEnduranceChallenges =
    enduranceStats.totalSessions > 0 || enduranceStats.byActivity.pushups.reps > 0;

  const showCumulativeSummaryRow =
    enduranceStats.totalSessions > 0 || enduranceStats.totalStreetReps > 0;

  // Fonction pour compter les séances par jour
  const getSessionsCount = useMemo(() => {
    if (!currentData?.checkedExercises) return {};
    
    const sessionsCount = {};
    
    // Parcourir tous les exercices cochés
    Object.keys(currentData.checkedExercises).forEach(key => {
      if (currentData.checkedExercises[key]) {
        // Extraire la date de la clé (format: YYYY-MM-DD_exerciseId)
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          sessionsCount[dateStr] = (sessionsCount[dateStr] || 0) + 1;
        }
      }
    });
    
    return sessionsCount;
  }, [currentData.checkedExercises]);

  // Calculer les statistiques des séances
  const sessionStats = useMemo(() => {
    const sessions = Object.values(getSessionsCount);
    const totalSessions = sessions.length;
    const totalExercises = sessions.reduce((sum, count) => sum + count, 0);
    const avgExercisesPerSession = totalSessions > 0 ? Math.round(totalExercises / totalSessions) : 0;
    
    // Séances des 7 derniers jours
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateStr(date);
      last7Days.push(getSessionsCount[dateStr] || 0);
    }
    const sessionsThisWeek = last7Days.filter(count => count > 0).length;
    
    return {
      totalSessions,
      totalExercises,
      avgExercisesPerSession,
      sessionsThisWeek,
      last7Days
    };
  }, [getSessionsCount]);

  // ✅ FIX : Ref pour éviter le nettoyage multiple (boucle infinie)
  const hasCleanedMockSessionsRef = useRef(false);

  // ✅ NOUVEAU : Supprimer les sessions mock UNE SEULE FOIS au chargement
  useEffect(() => {
    // Ne nettoyer qu'une seule fois au montage du composant
    if (hasCleanedMockSessionsRef.current) {
      return;
    }
    
    const cleanupMockSessions = async () => {
      try {
        // Marquer comme nettoyé avant l'appel pour éviter les appels multiples
        hasCleanedMockSessionsRef.current = true;
        
        const result = await deleteMockEnduranceSessions();
        if (result.deleted > 0) {
          console.log(`[CalendarTab] ✅ ${result.deleted} sessions mock supprimées:`, result.details);
        }
      } catch (error) {
        console.error('[CalendarTab] ❌ Erreur lors du nettoyage des sessions mock:', error);
        // Réinitialiser le flag en cas d'erreur pour permettre un nouvel essai
        hasCleanedMockSessionsRef.current = false;
      }
    };
    
    // Nettoyer les sessions mock au chargement (une seule fois)
    if (currentData?.enduranceData?.sessions) {
      cleanupMockSessions();
    }
  }, [deleteMockEnduranceSessions]); // ✅ FIX : Supprimer currentData?.enduranceData?.sessions des dépendances

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Module Compteur de Séances */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="text-purple-400" size={24} />
            {t('calendar.sessionCounter.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total des séances */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-blue-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">{t('calendar.sessionCounter.totalSessions')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalSessions}</div>
              <div className="text-xs text-slate-400">{t('calendar.sessionCounter.trainingDays')}</div>
            </div>

            {/* Total des exercices */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="text-green-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">{t('calendar.sessionCounter.totalExercises')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalExercises}</div>
              <div className="text-xs text-slate-400">{t('calendar.sessionCounter.exercisesCompleted')}</div>
            </div>

            {/* Moyenne par séance */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="text-yellow-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">{t('calendar.sessionCounter.avgPerSession')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.avgExercisesPerSession}</div>
              <div className="text-xs text-slate-400">{t('calendar.sessionCounter.exercisesPerSession')}</div>
            </div>

            {/* Séances cette semaine */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="text-orange-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">{t('calendar.sessionCounter.thisWeek')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.sessionsThisWeek}</div>
              <div className="text-xs text-slate-400">{t('calendar.sessionCounter.sessionsPer7Days')}</div>
            </div>
          </div>

          {showCumulativeSummaryRow && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-600/30">
                <div className="flex items-center justify-center mb-2">
                  <Repeat className="text-cyan-400 mr-2" size={18} />
                  <span className="text-slate-300 text-sm">{t('calendar.cumulativeStats.streetReps')}</span>
                </div>
                <div className="text-2xl font-bold text-white">{enduranceStats.totalStreetReps}</div>
                {enduranceStats.totalStreetVolumeKg > 0 ? (
                  <div className="text-sm text-amber-200/95 mt-2 font-medium">
                    {t('calendar.cumulativeStats.volumeLifted', {
                      kg: Math.round(enduranceStats.totalStreetVolumeKg).toLocaleString()
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-2">{t('calendar.cumulativeStats.volumeLiftedHint')}</div>
                )}
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-600/30">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="text-amber-400 mr-2" size={18} />
                  <span className="text-slate-300 text-sm">{t('calendar.cumulativeStats.enduranceMinutes')}</span>
                </div>
                <div className="text-2xl font-bold text-white">{enduranceStats.totalEnduranceMinutes}</div>
                <div className="text-xs text-slate-400 mt-1">{t('calendar.enduranceChallenges.minutes')}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-600/30">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="text-orange-400 mr-2" size={18} />
                  <span className="text-slate-300 text-sm">{t('calendar.cumulativeStats.runningTime')}</span>
                </div>
                <div className="text-xl font-bold text-white tabular-nums">{runningTimeCumulativeLabel}</div>
              </div>
            </div>
          )}

          {/* 🏃 Défis d'Endurance */}
          {showEnduranceChallenges && (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Zap className="mr-2 text-purple-400" size={16} />
                {t('calendar.enduranceChallenges.title')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Boxe */}
                {enduranceStats.byActivity.boxing.sessions > 0 && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Dumbbell className="text-red-400 mr-1" size={16} />
                      <span className="text-red-300 text-xs font-medium">{t('calendar.enduranceChallenges.boxing')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.boxing.sessions}</div>
                    <div className="text-xs text-red-400">{enduranceStats.byActivity.boxing.reps} {t('calendar.enduranceChallenges.reps')}</div>
                  </div>
                )}

                {/* Pompes */}
                {(enduranceStats.byActivity.pushups.sessions > 0 ||
                  enduranceStats.byActivity.pushups.reps > 0) && (
                  <button
                    type="button"
                    onClick={() => requestOpenEnduranceSubTab('pushups')}
                    className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-center w-full cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  >
                    <div className="flex items-center justify-center mb-1">
                      <Activity className="text-blue-400 mr-1" size={16} />
                      <span className="text-blue-300 text-xs font-medium">{t('calendar.enduranceChallenges.pushups')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.pushups.sessions}</div>
                    <div className="text-xs text-blue-400">{enduranceStats.byActivity.pushups.reps} {t('calendar.enduranceChallenges.reps')}</div>
                  </button>
                )}

                {/* Natation */}
                {enduranceStats.byActivity.swimming.sessions > 0 && (
                  <button
                    type="button"
                    onClick={() => requestOpenEnduranceSubTab('swimming')}
                    className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-3 text-center w-full cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                  >
                    <div className="flex items-center justify-center mb-1">
                      <Target className="text-cyan-400 mr-1" size={16} />
                      <span className="text-cyan-300 text-xs font-medium">{t('calendar.enduranceChallenges.swimming')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.swimming.sessions}</div>
                    <div className="text-xs text-cyan-400">
                      {Math.round(enduranceStats.byActivity.swimming.distance)}
                      {t('calendar.enduranceChallenges.meters')}
                    </div>
                  </button>
                )}

                {/* Corde à sauter */}
                {enduranceStats.byActivity.jumprope.sessions > 0 && (
                  <button
                    type="button"
                    onClick={() => requestOpenEnduranceSubTab('jumprope')}
                    className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-center w-full cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  >
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="text-green-400 mr-1" size={16} />
                      <span className="text-green-300 text-xs font-medium">{t('calendar.enduranceChallenges.jumpropeShort')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.jumprope.sessions}</div>
                    <div className="text-xs text-green-400">{enduranceStats.byActivity.jumprope.jumps} {t('calendar.enduranceChallenges.jumps')}</div>
                  </button>
                )}

                {/* Course */}
                {enduranceStats.byActivity.running.sessions > 0 && (
                  <button
                    type="button"
                    onClick={() => requestOpenEnduranceSubTab('running')}
                    className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3 text-center w-full cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
                  >
                    <div className="flex items-center justify-center mb-1">
                      <Flame className="text-orange-400 mr-1" size={16} />
                      <span className="text-orange-300 text-xs font-medium">{t('calendar.enduranceChallenges.running')}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.running.sessions}</div>
                    <div className="text-xs text-orange-400">{runningDistanceChallengeLabel}</div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 📊 Graphique des 7 derniers jours - Amélioré */}
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <Activity className="mr-2" size={16} />
              {t('calendar.activityChart.title')}
            </h4>
            <div className="bg-slate-800/30 rounded-lg p-4">
              {/* Légende des intensités */}
              <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                <span>{t('calendar.activityChart.lowActivity')}</span>
                <span>{t('calendar.activityChart.highActivity')}</span>
              </div>
              
              {/* Graphique en barres */}
              <div className="flex items-end justify-between h-24">
                {sessionStats.last7Days.map((count, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - index));
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                  const maxHeight = Math.max(...sessionStats.last7Days, 1);
                  const height = count > 0 ? Math.max((count / maxHeight) * 80, 8) : 0;
                  const barTint =
                    count > 0
                      ? calendarHeatmapCompositeBackground(0.08 + (count / maxHeight) * 0.9)
                      : undefined;

                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                      {/* Barre */}
                      <div className="relative w-8 mb-2">
                        <div 
                          className={`w-full rounded-t transition-all duration-300 ${
                            count > 0 ? 'shadow-md border border-white/10' : 'bg-slate-600'
                          }`}
                          style={{
                            height: `${height}px`,
                            ...(barTint ? { backgroundColor: barTint } : {})
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {dayName}: {count} {t('calendar.activityChart.exercises')}
                        </div>
                      </div>
                      
                      {/* Jour */}
                      <div className="text-xs text-slate-400 font-medium">{dayName}</div>
                      
                      {/* Valeur */}
                      <div className={`text-xs font-bold mt-1 ${
                        count > 0 ? 'text-white' : 'text-slate-500'
                      }`}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Statistiques résumées */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.reduce((a, b) => a + b, 0)}</div>
                    <div className="text-xs text-slate-400">{t('calendar.activityChart.totalExercises')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.filter(count => count > 0).length}</div>
                    <div className="text-xs text-slate-400">{t('calendar.activityChart.activeDays')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {sessionStats.last7Days.length > 0 ? Math.round(sessionStats.last7Days.reduce((a, b) => a + b, 0) / sessionStats.last7Days.length) : 0}
                    </div>
                    <div className="text-xs text-slate-400">{t('calendar.activityChart.avgPerDay')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier existant */}
      {/* ✅ NOUVEAU : Légende des justifications */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">{t('calendar.legend.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(JUSTIFICATION_REASONS).map(([key, reason]) => {
              const label = t(`justification.${reason}`);
              const icon = JUSTIFICATION_ICONS[reason];
              const colorClasses = JUSTIFICATION_COLORS[reason];
              
              return (
                <div
                  key={reason}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 ${colorClasses}`}
                >
                  <span className="text-lg" aria-hidden="true">{icon}</span>
                  <span className="text-white text-sm font-medium">{label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {t('calendar.legend.description')}
          </p>
        </CardContent>
      </Card>

      <CalendarHeatmap workoutHistory={workoutHistory} garminData={garminData} />
      </div>
    </div>
  );
};

export default CalendarTab;