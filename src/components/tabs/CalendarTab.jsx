import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Calendar, Activity, Target, Flame, Zap, Clock, Dumbbell, Repeat, Crown } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import { useGarminData } from '../../hooks/useGarminData';
import CalendarHeatmap from '../CalendarHeatmap';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { getDateStr, addCalendarDays } from '../../utils/dateUtils';
import {
  aggregateLiftVolumeKgByDate,
  computeVolumeKgForWorkoutKey
} from '../../utils/exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../../utils/trainingLoadUtils';
import SportCalendarColorFactorsPanel from './SportCalendarColorFactorsPanel';
import {
  isMockEnduranceSession,
  isPushupExerciseName,
  parseDurationToMinutes
} from '../../utils/calendarUtils';
import {
  buildGarminCardioById,
  computeRunningVolumeTotals,
  mergeRunningSessionsWithGarmin
} from '../../utils/sport/runningVolumeTruth';
import { getTotalRepsFromData } from '../../context/WorkoutContext/utils/workoutHistoryUtils';
import {
  JUSTIFICATION_REASONS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_ICONS,
  JUSTIFICATION_TEXT,
} from '../../utils/dayJustificationUtils';
import { useTranslation } from '../../utils/translations';
import { calendarHeatmapCompositeBackground } from '../../utils/calendarHeatmapTint';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import {
  computeCalendarChampionAnalysis,
  formatPctVsAverage
} from '../../utils/calendarDayChampion';
import { calculateLongestTrainingStreakRange } from '../../utils/trainingStreakUtils';

const CalendarTab = () => {
  // Récupérer les données directement du contexte pour la réactivité
  const {
    data,
    getCurrentData,
    deleteMockEnduranceSessions,
    getExerciseNameById,
    requestOpenEnduranceSubTab
  } = useWorkout();
  const { currentUser } = useAuth();
  const t = useTranslation();
  const [jumpToCalendarDate, setJumpToCalendarDate] = useState(null);

  const profileAge = useMemo(() => {
    const q = normalizeProfileQuestionnaire(currentUser?.profileQuestionnaire);
    const age = q?.answers?.vitalsSelfReport?.age;
    return Number.isFinite(Number(age)) ? Number(age) : null;
  }, [currentUser?.profileQuestionnaire]);
  
  // Utiliser getCurrentData() pour inclure les données temporaires non sauvegardées
  const currentData = getCurrentData();
  
  // PHASE 5.3 : Charger données Garmin (attendre le chargement pour éviter le flash de couleurs)
  const { loadAllData, dbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  const [garminDataLoaded, setGarminDataLoaded] = useState(false);
  
  useEffect(() => {
    if (!dbReady) {
      setGarminDataLoaded(false);
      return;
    }
    let cancelled = false;
    setGarminDataLoaded(false);
    loadAllData()
      .then((data) => {
        if (cancelled) return;
        setGarminData(data);
        setGarminDataLoaded(true);
      })
      .catch(err => {
        console.error('[CalendarTab] Error loading Garmin data:', err);
        if (!cancelled) {
          setGarminData(null);
          setGarminDataLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
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

    const ENDURANCE_ACTIVITY_KEYS = ['boxing', 'pushups', 'gainage', 'swimming', 'jumprope', 'running'];

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
    collectDedupedCheckedVolumeKeys(currentData).forEach((key) => {
      totalStreetVolumeKg += computeVolumeKgForWorkoutKey(key, currentData);
    });
    stats.totalStreetVolumeKg = totalStreetVolumeKg;

    const garminById = buildGarminCardioById(garminData?.activities?.cardio);
    const mergedRunning = mergeRunningSessionsWithGarmin(sessions.running || [], garminById);
    const runningVolume = computeRunningVolumeTotals(mergedRunning, garminById, { period: 'all' });
    stats.byActivity.running.distance = runningVolume.totalKm;
    stats.byActivity.running.sessions = runningVolume.sessionCount;

    return stats;
  }, [currentData, getExerciseNameById, garminData]);

  const calendarLiftVolumeWindow = useMemo(() => {
    const wd = currentData || {};
    const byDate = aggregateLiftVolumeKgByDate(wd);
    const todayStr = getDateStr(new Date());
    let vol7 = 0;
    for (let i = 0; i < 7; i += 1) {
      const ds = addCalendarDays(todayStr, -i);
      vol7 += byDate.get(ds) || 0;
    }
    let allVol = 0;
    byDate.forEach((v) => {
      allVol += v;
    });
    return { vol7, allVol };
  }, [currentData]);

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
  }, [currentData?.checkedExercises]);

  const championAnalysis = useMemo(
    () =>
      computeCalendarChampionAnalysis({
        workoutData: currentData,
        garminData,
        getExerciseNameById,
        classificationCtx: { age: profileAge }
      }),
    [currentData, garminData, getExerciseNameById, profileAge]
  );

  const longestStreakRange = useMemo(
    () => calculateLongestTrainingStreakRange(currentData),
    [currentData]
  );

  const formatChampionDate = (ymd) => {
    if (!ymd) return '—';
    try {
      return new Date(`${ymd}T12:00:00`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return ymd;
    }
  };

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
      <Card variant="sport" className="shadow-inner shadow-black/25">
        <CardHeader className="border-b border-[#0F4C5C]/40">
          <CardTitle className="flex items-center gap-2 text-teal-50">
            <Activity className="text-teal-400" size={24} />
            {t('calendar.sessionCounter.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(championAnalysis.champion || longestStreakRange.length > 0) && (
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {championAnalysis.champion ? (
                <button
                  type="button"
                  onClick={() => setJumpToCalendarDate(championAnalysis.champion.date)}
                  className="rounded-lg border-2 border-amber-500/55 bg-gradient-to-br from-amber-950/50 to-black p-4 text-left shadow-inner shadow-black/40 transition hover:border-amber-400/70"
                >
                  <div className="mb-2 flex items-center gap-2 text-amber-200">
                    <Crown className="h-5 w-5 text-amber-300" aria-hidden />
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      Meilleur jour
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatChampionDate(championAnalysis.champion.date)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-amber-100/90">
                    <span>
                      Reps {championAnalysis.champion.breakdown.reps}{' '}
                      <span className="text-amber-400">
                        ({formatPctVsAverage(championAnalysis.champion.vsAverage?.reps)})
                      </span>
                    </span>
                    <span>
                      Volume {championAnalysis.champion.breakdown.volumeKg} kg{' '}
                      <span className="text-amber-400">
                        ({formatPctVsAverage(championAnalysis.champion.vsAverage?.volumeKg)})
                      </span>
                    </span>
                    <span>
                      Course {championAnalysis.champion.breakdown.runningKm} km{' '}
                      <span className="text-amber-400">
                        ({formatPctVsAverage(championAnalysis.champion.vsAverage?.runningKm)})
                      </span>
                    </span>
                    <span>
                      Kcal {championAnalysis.champion.breakdown.activeKcal}{' '}
                      <span className="text-amber-400">
                        ({formatPctVsAverage(championAnalysis.champion.vsAverage?.activeKcal)})
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-amber-500/90">
                    Touchez pour ouvrir ce jour sur le calendrier (couronne sur la case).
                  </p>
                </button>
              ) : null}
              {longestStreakRange.length > 0 ? (
                <div className="rounded-lg border-2 border-sky-600/45 bg-black p-4 text-center shadow-inner shadow-black/40">
                  <div className="mb-2 flex items-center justify-center gap-2 text-sky-200">
                    <Flame className="h-5 w-5 text-orange-400" aria-hidden />
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      Meilleure série
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {longestStreakRange.length} j
                  </div>
                  {longestStreakRange.startDate && longestStreakRange.endDate ? (
                    <div className="mt-2 text-sm text-sky-300/90">
                      {formatChampionDate(longestStreakRange.startDate)} →{' '}
                      {formatChampionDate(longestStreakRange.endDate)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {/* Statistiques principales */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Total des séances */}
            <div className="rounded-lg border-2 border-[#0F4C5C]/60 bg-black p-4 text-center shadow-inner shadow-black/40">
              <div className="mb-2 flex items-center justify-center">
                <Calendar className="mr-2 text-teal-400" size={20} />
                <span className="text-sm text-teal-200/95">{t('calendar.sessionCounter.totalSessions')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalSessions}</div>
              <div className="text-xs text-teal-600">{t('calendar.sessionCounter.trainingDays')}</div>
            </div>

            {/* Total des exercices */}
            <div className="rounded-lg border-2 border-[#0F5C45]/50 bg-black p-4 text-center shadow-inner shadow-black/40">
              <div className="mb-2 flex items-center justify-center">
                <Target className="mr-2 text-emerald-400" size={20} />
                <span className="text-sm text-teal-200/95">{t('calendar.sessionCounter.totalExercises')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalExercises}</div>
              <div className="text-xs text-teal-600">{t('calendar.sessionCounter.exercisesCompleted')}</div>
            </div>

            {/* Moyenne par séance */}
            <div className="rounded-lg border-2 border-[#0F4C5C]/60 bg-black p-4 text-center shadow-inner shadow-black/40">
              <div className="mb-2 flex items-center justify-center">
                <Activity className="mr-2 text-yellow-400" size={20} />
                <span className="text-sm text-teal-200/95">{t('calendar.sessionCounter.avgPerSession')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.avgExercisesPerSession}</div>
              <div className="text-xs text-teal-600">{t('calendar.sessionCounter.exercisesPerSession')}</div>
            </div>

            {/* Séances cette semaine */}
            <div className="rounded-lg border-2 border-[#0F5C45]/50 bg-black p-4 text-center shadow-inner shadow-black/40">
              <div className="mb-2 flex items-center justify-center">
                <Flame className="mr-2 text-orange-400" size={20} />
                <span className="text-sm text-teal-200/95">{t('calendar.sessionCounter.thisWeek')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.sessionsThisWeek}</div>
              <div className="text-xs text-teal-600">{t('calendar.sessionCounter.sessionsPer7Days')}</div>
            </div>
          </div>

          {showCumulativeSummaryRow && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-[#0F4C5C]/60 bg-black p-4 text-center shadow-inner shadow-black/40">
                <div className="mb-2 flex items-center justify-center">
                  <Repeat className="mr-2 text-cyan-400" size={18} />
                  <span className="text-sm text-teal-200/95">{t('calendar.cumulativeStats.streetReps')}</span>
                </div>
                <div className="text-2xl font-bold text-white">{enduranceStats.totalStreetReps}</div>
                {enduranceStats.totalStreetVolumeKg > 0 ? (
                  <div className="mt-2 text-sm font-medium text-amber-200/95">
                    {t('calendar.cumulativeStats.volumeLifted', {
                      kg: Math.round(enduranceStats.totalStreetVolumeKg).toLocaleString('fr-FR')
                    })}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-teal-600">{t('calendar.cumulativeStats.volumeLiftedHint')}</div>
                )}
              </div>
              <div className="rounded-lg border-2 border-[#0F5C45]/50 bg-black p-4 text-center shadow-inner shadow-black/40">
                <div className="mb-2 flex items-center justify-center">
                  <Clock className="mr-2 text-amber-400" size={18} />
                  <span className="text-sm text-teal-200/95">{t('calendar.cumulativeStats.enduranceMinutes')}</span>
                </div>
                <div className="text-2xl font-bold text-white">{enduranceStats.totalEnduranceMinutes}</div>
                <div className="mt-1 text-xs text-teal-600">{t('calendar.enduranceChallenges.minutes')}</div>
              </div>
              <div className="rounded-lg border-2 border-[#0F4C5C]/60 bg-black p-4 text-center shadow-inner shadow-black/40">
                <div className="mb-2 flex items-center justify-center">
                  <Flame className="mr-2 text-orange-400" size={18} />
                  <span className="text-sm text-teal-200/95">{t('calendar.cumulativeStats.runningTime')}</span>
                </div>
                <div className="text-xl font-bold tabular-nums text-white">{runningTimeCumulativeLabel}</div>
              </div>
            </div>
          )}

          {/* 🏃 Défis d'Endurance */}
          {showEnduranceChallenges && (
            <div className="mb-6">
              <h4 className="mb-3 flex items-center font-medium text-teal-100">
                <Zap className="mr-2 text-teal-400" size={16} />
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
            <h4 className="mb-3 flex items-center font-medium text-teal-100">
              <Activity className="mr-2 text-teal-400" size={16} />
              {t('calendar.activityChart.title')}
            </h4>
            <div className="rounded-lg border-2 border-[#0F4C5C]/60 bg-black p-4 shadow-inner shadow-black/30">
              {/* Légende des intensités */}
              <div className="mb-4 flex items-center justify-between text-xs text-teal-600">
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
                            count > 0 ? 'border border-[#0F5C45]/50 shadow-md' : 'bg-black ring-1 ring-[#0F4C5C]/40'
                          }`}
                          style={{
                            height: `${height}px`,
                            ...(barTint ? { backgroundColor: barTint } : {})
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded border border-[#0F4C5C]/60 bg-black px-2 py-1 text-xs text-teal-100 opacity-0 transition-opacity group-hover:opacity-100">
                          {dayName}: {count} {t('calendar.activityChart.exercises')}
                        </div>
                      </div>
                      
                      {/* Jour */}
                      <div className="text-xs font-medium text-teal-600">{dayName}</div>
                      
                      {/* Valeur */}
                      <div className={`mt-1 text-xs font-bold ${
                        count > 0 ? 'text-white' : 'text-teal-900'
                      }`}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Statistiques résumées */}
              <div className="mt-4 border-t border-[#0F4C5C]/40 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.reduce((a, b) => a + b, 0)}</div>
                    <div className="text-xs text-teal-600">{t('calendar.activityChart.totalExercises')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.filter(count => count > 0).length}</div>
                    <div className="text-xs text-teal-600">{t('calendar.activityChart.activeDays')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {sessionStats.last7Days.length > 0 ? Math.round(sessionStats.last7Days.reduce((a, b) => a + b, 0) / sessionStats.last7Days.length) : 0}
                    </div>
                    <div className="text-xs text-teal-600">{t('calendar.activityChart.avgPerDay')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier existant */}
      {/* ✅ NOUVEAU : Légende des justifications */}
      <Card variant="sport" className="shadow-inner shadow-black/25">
        <CardHeader className="border-b border-[#0F4C5C]/40">
          <CardTitle className="text-sm text-teal-50">{t('calendar.legend.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(JUSTIFICATION_REASONS).map(([key, reason]) => {
              const label = t(`justification.${reason}`);
              const icon = JUSTIFICATION_ICONS[reason];
              const colorClasses = JUSTIFICATION_COLORS[reason];
              const textClass = JUSTIFICATION_TEXT[reason];
              
              return (
                <div
                  key={reason}
                  className={`flex items-center gap-2 rounded-lg border-2 p-2 ${colorClasses} ${textClass}`}
                >
                  <span className="text-lg" aria-hidden="true">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-sky-600">
            {t('calendar.legend.description')}
          </p>
        </CardContent>
      </Card>

      <SportCalendarColorFactorsPanel
        t={t}
        volume7dKg={calendarLiftVolumeWindow.vol7}
        volumeAllKg={calendarLiftVolumeWindow.allVol}
      />

      <CalendarHeatmap
        workoutHistory={workoutHistory}
        garminData={garminData}
        garminDataLoaded={garminDataLoaded}
        championDayDate={championAnalysis.champion?.date ?? null}
        championDetail={championAnalysis.champion}
        externalSelectDate={jumpToCalendarDate}
        onExternalSelectHandled={() => setJumpToCalendarDate(null)}
      />
      </div>
    </div>
  );
};

export default CalendarTab;