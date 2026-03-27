import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Footprints,
  HeartPulse,
  Moon,
  Zap
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTodayExercises } from '../../hooks/useTodayExercises';
import { useGarminData } from '../../hooks/useGarminData';
import { parseDurationToMinutes, isMockEnduranceSession } from '../../utils/calendarUtils';
import { calculateAutoReps } from '../../utils/exerciseCalculations';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const extractNumeric = (val, defaultVal = 0) => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number.parseFloat(val);
    return Number.isFinite(parsed) ? parsed : defaultVal;
  }
  if (typeof val === 'object') {
    const keys = ['current', 'average', 'avg', 'total', 'value', 'resting', 'max', 'min'];
    for (const key of keys) {
      if (key in val) {
        const extracted = extractNumeric(val[key], defaultVal);
        if (Number.isFinite(extracted)) return extracted;
      }
    }
  }
  return defaultVal;
};

const sumActivitiesCount = (activities = {}) =>
  (Array.isArray(activities.swimming) ? activities.swimming.length : 0) +
  (Array.isArray(activities.jumpRope) ? activities.jumpRope.length : 0) +
  (Array.isArray(activities.cardio) ? activities.cardio.length : 0);

const getIntensityMinutes = (metric) => {
  if (!metric?.intensityMinutes) return 0;
  return extractNumeric(metric.intensityMinutes.total, 0);
};

const getDailyActivityCount = (activities = {}, dateKey) => {
  const all = [
    ...(activities.swimming || []),
    ...(activities.jumpRope || []),
    ...(activities.cardio || [])
  ];
  return all.filter((a) => toDateKey(a?.date || a?.startTimeLocal || a?.startTimeGmt) === dateKey).length;
};

const getDailyGarminActivities = (activities = {}, dateKey) => {
  const filterByDate = (list = []) =>
    list.filter((a) => toDateKey(a?.date || a?.startTimeLocal || a?.startTimeGmt) === dateKey);

  return {
    swimming: filterByDate(activities.swimming || []),
    jumpRope: filterByDate(activities.jumpRope || []),
    cardio: filterByDate(activities.cardio || [])
  };
};

const intensityBadge = (level) => {
  if (level >= 3) return { label: 'Haute', cls: 'bg-red-500/25 text-red-300 border-red-500/40' };
  if (level === 2) return { label: 'Moyenne', cls: 'bg-yellow-500/25 text-yellow-300 border-yellow-500/40' };
  if (level === 1) return { label: 'Légère', cls: 'bg-blue-500/25 text-blue-300 border-blue-500/40' };
  return { label: 'Repos', cls: 'bg-slate-600/30 text-slate-400 border-slate-500/30' };
};

const formatDateFr = (dateKey) => {
  if (!dateKey) return '—';
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
};

const DashboardGarminSportRecapBlock = () => {
  const { dbReady, loadAllData } = useGarminData();
  const {
    currentDate,
    isGymMode,
    getTodayWorkout,
    data: workoutData,
    getCurrentData,
    updateTempExerciseData,
    saveExerciseChanges
  } = useWorkout();
  const [garminData, setGarminData] = useState({ dailyMetrics: {}, activities: {} });
  const [loadingGarmin, setLoadingGarmin] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date(currentDate));
  const [togglingExerciseId, setTogglingExerciseId] = useState(null);

  const todayDateKey = useMemo(() => currentDate.toISOString().slice(0, 10), [currentDate]);
  const selectedDateKey = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const selectedWorkout = getTodayWorkout(selectedDate, isGymMode);
  const { programExercises, additionalExercises, metadata } = useTodayExercises({ date: selectedDate, isGymMode });

  useEffect(() => {
    setSelectedDate(new Date(currentDate));
  }, [currentDate]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!dbReady) return;
      setLoadingGarmin(true);
      try {
        const loaded = await loadAllData();
        if (isMounted) {
          setGarminData({
            dailyMetrics: loaded?.dailyMetrics || {},
            activities: loaded?.activities || {}
          });
        }
      } catch {
        if (isMounted) {
          setGarminData({ dailyMetrics: {}, activities: {} });
        }
      } finally {
        if (isMounted) setLoadingGarmin(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [dbReady, loadAllData]);

  const derived = useMemo(() => {
    const dailyMetrics = garminData.dailyMetrics || {};
    const activities = garminData.activities || {};
    const metricDates = Object.keys(dailyMetrics).sort();
    const latestDate = metricDates.length ? metricDates[metricDates.length - 1] : null;
    const selectedMetrics = dailyMetrics[selectedDateKey] || null;

    const weekAnchor = new Date(`${selectedDateKey}T00:00:00`);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekAnchor.getTime() - (6 - i) * DAY_MS);
      return d.toISOString().slice(0, 10);
    });

    const weekStats = weekDates.reduce(
      (acc, dateKey) => {
        const m = dailyMetrics[dateKey] || null;
        if (!m) return acc;
        acc.daysWithMetrics += 1;
        acc.steps += extractNumeric(m.steps, 0);
        acc.restingHr += extractNumeric(m.heartRate?.resting, 0);
        acc.bodyBattery += extractNumeric(m.bodyBattery, 0);
        acc.stress += extractNumeric(m.stress?.average, 0);
        acc.sleep += extractNumeric(m.sleep?.duration, 0);
        acc.activeCalories += extractNumeric(m.calories?.active, 0);
        acc.intensityMinutes += getIntensityMinutes(m);
        return acc;
      },
      {
        daysWithMetrics: 0,
        steps: 0,
        restingHr: 0,
        bodyBattery: 0,
        stress: 0,
        sleep: 0,
        activeCalories: 0,
        intensityMinutes: 0
      }
    );

    const denom = Math.max(1, weekStats.daysWithMetrics);
    const weekSummary = {
      avgSteps: Math.round(weekStats.steps / denom),
      avgRestingHr: Math.round(weekStats.restingHr / denom),
      avgBodyBattery: Math.round(weekStats.bodyBattery / denom),
      avgStress: Math.round(weekStats.stress / denom),
      avgSleepHours: Number((weekStats.sleep / 60 / denom).toFixed(1)),
      avgActiveCalories: Math.round(weekStats.activeCalories / denom),
      totalIntensityMinutes: Math.round(weekStats.intensityMinutes),
      daysWithMetrics: weekStats.daysWithMetrics
    };

    const activitiesTotal = sumActivitiesCount(activities);
    const selectedActivities = getDailyGarminActivities(activities, selectedDateKey);

    return {
      latestDate,
      selectedMetrics,
      weekSummary,
      activitiesTotal,
      selectedActivities
    };
  }, [garminData, selectedDateKey]);

  const getExerciseCheckKey = (exerciseId) => {
    const base = `${selectedDateKey}_${exerciseId}`;
    if (isGymMode && selectedWorkout?.isGymMode) {
      const weekSuffix = selectedWorkout.weekVariant === 'A' ? '_semaineA' : '_semaineB';
      return `${base}${weekSuffix}`;
    }
    return base;
  };

  const isExerciseChecked = (exerciseId) => {
    const checked = workoutData?.checkedExercises || {};
    const key = getExerciseCheckKey(exerciseId);
    return Boolean(checked[key]);
  };

  const handleToggleExercise = async (exercise) => {
    if (!exercise || !exercise.id) return;
    const exerciseId = String(exercise.id);
    setTogglingExerciseId(exerciseId);
    try {
      const currentData = getCurrentData();
      const key = getExerciseCheckKey(exercise.id);
      const isCurrentlyChecked = Boolean(currentData?.checkedExercises?.[key]);
      const autoReps = !isCurrentlyChecked && exercise.series ? calculateAutoReps(exercise.series) : null;

      const newData = {
        ...currentData,
        checkedExercises: {
          ...(currentData?.checkedExercises || {}),
          [key]: !isCurrentlyChecked
        },
        reps: {
          ...(currentData?.reps || {}),
          [key]: !isCurrentlyChecked ? (autoReps ? String(autoReps) : (currentData?.reps?.[key] || '')) : undefined
        }
      };

      updateTempExerciseData(newData);
      await saveExerciseChanges();
    } catch {
      // no-op: on garde l'UI stable, les logs sont gérés ailleurs
    } finally {
      setTogglingExerciseId(null);
    }
  };

  const todayProgress = useMemo(() => {
    const completedProgram = programExercises.reduce(
      (count, ex) => (isExerciseChecked(ex.id) ? count + 1 : count),
      0
    );
    const completedAdditional = additionalExercises.filter((ex) => ex.completed).length;

    const planned = programExercises.length;
    const done = completedProgram + completedAdditional;
    const total = planned + additionalExercises.length;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      planned,
      additional: additionalExercises.length,
      done,
      completionPct
    };
  }, [programExercises, additionalExercises, workoutData, selectedDateKey, isGymMode, selectedWorkout]);

  const monthCalendar = useMemo(() => {
    const checked = workoutData?.checkedExercises || {};
    const enduranceSessions = workoutData?.enduranceData?.sessions || {};
    const dailyMetrics = garminData.dailyMetrics || {};
    const activities = garminData.activities || {};

    const now = selectedDate;
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = new Date(todayDateKey);

    const days = [];
    const counters = { done: 0, light: 0, medium: 0, high: 0 };

    for (let d = 1; d <= lastDay; d += 1) {
      const date = new Date(year, month, d);
      const dateKey = date.toISOString().slice(0, 10);
      const isFuture = date > today;

      const checkedCount = Object.entries(checked).reduce((acc, [key, value]) => {
        if (!value) return acc;
        return key.startsWith(`${dateKey}_`) ? acc + 1 : acc;
      }, 0);

      const enduranceCount = Object.values(enduranceSessions).reduce((acc, arr) => {
        if (!Array.isArray(arr)) return acc;
        const valid = arr.filter((s) => {
          if (isMockEnduranceSession(s)) return false;
          return toDateKey(s?.date) === dateKey;
        });
        return acc + valid.length;
      }, 0);

      const garminActivities = getDailyActivityCount(activities, dateKey);
      const intensityMinutes = getIntensityMinutes(dailyMetrics[dateKey]);

      let level = 0;
      if (!isFuture) {
        if (intensityMinutes >= 90 || garminActivities >= 2 || checkedCount >= 8) level = 3;
        else if (intensityMinutes >= 40 || garminActivities >= 1 || checkedCount >= 4) level = 2;
        else if (checkedCount > 0 || enduranceCount > 0 || garminActivities > 0) level = 1;
      }

      if (level > 0 && !isFuture) counters.done += 1;
      if (level === 1) counters.light += 1;
      if (level === 2) counters.medium += 1;
      if (level === 3) counters.high += 1;

      days.push({
        day: d,
        dateKey,
        isFuture,
        intensityLevel: level,
        checkedCount,
        garminActivities,
        intensityMinutes
      });
    }

    return { days, counters };
  }, [selectedDate, workoutData, garminData, todayDateKey]);

  const selectedMetrics = derived.selectedMetrics || {};
  const selectedDayBadge = intensityBadge(
    monthCalendar.days.find((d) => d.dateKey === selectedDateKey)?.intensityLevel || 0
  );

  const canGoNext = selectedDateKey < todayDateKey;
  const goPrevDay = () => setSelectedDate((prev) => new Date(prev.getTime() - DAY_MS));
  const goNextDay = () => {
    if (!canGoNext) return;
    setSelectedDate((prev) => new Date(prev.getTime() + DAY_MS));
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(15,23,42,0.9)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.25), transparent 55%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 0% 100%, rgba(129,140,248,0.22), transparent 55%)',
          mixBlendMode: 'screen'
        }}
      />
      <div className="relative p-6 md:p-7 lg:p-8">

      <div className="relative space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400/20 via-indigo-500/30 to-fuchsia-500/30 p-2.5 border border-cyan-300/40 shadow-[0_0_30px_rgba(56,189,248,0.45)]">
              <Activity className="w-6 h-6 text-cyan-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Récap Sport & Garmin</h3>
              <p className="text-sm text-slate-300">
                Jour affiché: <span className="font-semibold text-white">{formatDateFr(selectedDateKey)}</span>
                {' • '}Dernier Garmin: <span className="font-semibold text-white">{formatDateFr(derived.latestDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrevDay}
              className="h-8 w-8 rounded-lg border border-slate-600/60 bg-slate-800/60 text-slate-200 flex items-center justify-center hover:bg-slate-700/60"
              aria-label="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNextDay}
              disabled={!canGoNext}
              className="h-8 w-8 rounded-lg border border-slate-600/60 bg-slate-800/60 text-slate-200 flex items-center justify-center hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Jour suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className={`px-3 py-1 rounded-lg text-xs border shadow-sm ${selectedDayBadge.cls}`}>
              Intensité jour affiché&nbsp;: {selectedDayBadge.label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs">
                G
              </span>
              <span>Snapshot Garmin ({formatDateFr(selectedDateKey)})</span>
            </h4>
            {loadingGarmin ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400 text-sm">
                Chargement des métriques Garmin...
              </div>
            ) : !derived.latestDate ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400 text-sm">
                Aucune donnée Garmin trouvée. Lance une synchronisation pour alimenter le récap.
              </div>
            ) : !selectedMetrics ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400 text-sm">
                Pas de métriques Garmin pour ce jour. Utilise les flèches pour naviguer sur d&apos;autres dates.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Footprints className="w-3 h-3" /> Pas</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.steps, 0).toLocaleString('fr-FR')}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Calories actives</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.calories?.active, 0)} kcal</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><HeartPulse className="w-3 h-3" /> FC repos</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.heartRate?.resting, 0)} bpm</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Body Battery</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.bodyBattery, 0)}/100</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Stress</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.stress?.average, 0)}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Moon className="w-3 h-3" /> Sommeil</div>
                  <div className="text-lg font-bold text-white">{(extractNumeric(selectedMetrics.sleep?.duration, 0) / 60).toFixed(1)} h</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Intensité</div>
                  <div className="text-lg font-bold text-white">{getIntensityMinutes(selectedMetrics)} min</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Activités Garmin</div>
                  <div className="text-lg font-bold text-white">{derived.activitiesTotal}</div>
                </div>
              </div>
            )}

            {(derived.selectedActivities.swimming.length > 0 ||
              derived.selectedActivities.jumpRope.length > 0 ||
              derived.selectedActivities.cardio.length > 0) && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-sm font-semibold text-slate-200 mb-3">
                  Détail des activités Garmin du jour affiché
                </div>

                {/* Natation */}
                {derived.selectedActivities.swimming.length > 0 && (
                  <div className="mb-3 rounded-xl bg-cyan-900/20 border border-cyan-500/40 p-3">
                    <div className="text-xs font-semibold text-cyan-200 mb-2">
                      🏊 Natation ({derived.selectedActivities.swimming.length})
                    </div>
                    <div className="space-y-2">
                      {derived.selectedActivities.swimming.map((act, idx) => (
                        <div
                          key={`swim-${idx}`}
                          className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[13px] bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2"
                        >
                          <div className="text-slate-300">
                            <span className="text-slate-400">Distance&nbsp;:</span>{' '}
                            <span className="text-white">
                              {act.distance || act.totalDistance || 0}
                              m
                            </span>
                          </div>
                          <div className="text-slate-300">
                            <span className="text-slate-400">Durée&nbsp;:</span>{' '}
                            <span className="text-white">
                              {parseDurationToMinutes(act.duration || act.totalTime || 0)}&nbsp;min
                            </span>
                          </div>
                          {(act.avgHR || act.averageHR) && (
                            <div className="text-slate-300">
                              <span className="text-slate-400">FC moy&nbsp;:</span>{' '}
                              <span className="text-white">{act.avgHR || act.averageHR} bpm</span>
                            </div>
                          )}
                          {act.calories?.active && (
                            <div className="text-slate-300">
                              <span className="text-slate-400">Calories&nbsp;:</span>{' '}
                              <span className="text-white">{act.calories.active} kcal</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corde à sauter */}
                {derived.selectedActivities.jumpRope.length > 0 && (
                  <div className="mb-3 rounded-xl bg-emerald-900/20 border border-emerald-500/40 p-3">
                    <div className="text-xs font-semibold text-emerald-200 mb-2">
                      🪢 Corde à sauter ({derived.selectedActivities.jumpRope.length})
                    </div>
                    <div className="space-y-2">
                      {derived.selectedActivities.jumpRope.map((act, idx) => (
                        <div
                          key={`rope-${idx}`}
                          className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[13px] bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2"
                        >
                          <div className="text-slate-300">
                            <span className="text-slate-400">Sauts&nbsp;:</span>{' '}
                            <span className="text-white">{act.jumps || 0}</span>
                          </div>
                          <div className="text-slate-300">
                            <span className="text-slate-400">Durée&nbsp;:</span>{' '}
                            <span className="text-white">
                              {parseDurationToMinutes(act.duration || act.totalTime || 0)}&nbsp;min
                            </span>
                          </div>
                          {act.speed && (
                            <div className="text-slate-300">
                              <span className="text-slate-400">Vitesse&nbsp;:</span>{' '}
                              <span className="text-white">
                                {act.speed.toFixed(1)}&nbsp;sauts/min
                              </span>
                            </div>
                          )}
                          {act.maxContinuous && (
                            <div className="text-slate-300">
                              <span className="text-slate-400">Max enchaîné&nbsp;:</span>{' '}
                              <span className="text-white">{act.maxContinuous}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cardio (course, vélo, etc.) */}
                {derived.selectedActivities.cardio.length > 0 && (
                  <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-3">
                    <div className="text-xs font-semibold text-red-200 mb-2">
                      ❤️ Cardio ({derived.selectedActivities.cardio.length})
                    </div>
                    <div className="space-y-2">
                      {derived.selectedActivities.cardio.map((act, idx) => {
                        const durationMin = parseDurationToMinutes(
                          act.duration || act.totalTime || 0
                        );
                        const distanceKm =
                          (act.distance || act.totalDistance || 0) / 1000;
                        const avgPaceMinPerKm =
                          distanceKm > 0 && durationMin > 0
                            ? (durationMin / distanceKm).toFixed(1)
                            : null;
                        const avgHr =
                          act.averageHR || act.avgHR || act.avgHr || null;
                        const maxHr = act.maxHR || act.maxHr || null;

                        return (
                          <div
                            key={`cardio-${idx}`}
                            className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[13px] bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2"
                          >
                            <div className="text-slate-300">
                              <span className="text-slate-400">Durée&nbsp;:</span>{' '}
                              <span className="text-white">{durationMin} min</span>
                            </div>
                            {distanceKm > 0 && (
                              <div className="text-slate-300">
                                <span className="text-slate-400">Distance&nbsp;:</span>{' '}
                                <span className="text-white">
                                  {distanceKm.toFixed(2)} km
                                </span>
                              </div>
                            )}
                            {avgPaceMinPerKm && (
                              <div className="text-slate-300">
                                <span className="text-slate-400">Allure moy.&nbsp;:</span>{' '}
                                <span className="text-white">
                                  {avgPaceMinPerKm} min/km
                                </span>
                              </div>
                            )}
                            {avgHr && (
                              <div className="text-slate-300">
                                <span className="text-slate-400">FC moy.&nbsp;:</span>{' '}
                                <span className="text-white">{avgHr} bpm</span>
                              </div>
                            )}
                            {maxHr && (
                              <div className="text-slate-300">
                                <span className="text-slate-400">FC max&nbsp;:</span>{' '}
                                <span className="text-white">{maxHr} bpm</span>
                              </div>
                            )}
                            {act.calories?.active && (
                              <div className="text-slate-300">
                                <span className="text-slate-400">Calories&nbsp;:</span>{' '}
                                <span className="text-white">
                                  {act.calories.active} kcal
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/40">
              <div className="text-sm font-semibold text-slate-200 mb-2">Résumé Garmin 7 jours</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-slate-300">Pas moy/j: <span className="text-white font-semibold">{derived.weekSummary.avgSteps.toLocaleString('fr-FR')}</span></div>
                <div className="text-slate-300">FC repos moy: <span className="text-white font-semibold">{derived.weekSummary.avgRestingHr} bpm</span></div>
                <div className="text-slate-300">Body Battery moy: <span className="text-white font-semibold">{derived.weekSummary.avgBodyBattery}</span></div>
                <div className="text-slate-300">Stress moy: <span className="text-white font-semibold">{derived.weekSummary.avgStress}</span></div>
                <div className="text-slate-300">Sommeil moy: <span className="text-white font-semibold">{derived.weekSummary.avgSleepHours} h</span></div>
                <div className="text-slate-300">Cal. actives moy: <span className="text-white font-semibold">{derived.weekSummary.avgActiveCalories} kcal</span></div>
                <div className="text-slate-300">Intensité totale: <span className="text-white font-semibold">{derived.weekSummary.totalIntensityMinutes} min</span></div>
                <div className="text-slate-300">Jours avec data: <span className="text-white font-semibold">{derived.weekSummary.daysWithMetrics}/7</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-sm font-semibold text-slate-200 mb-2">
                Séance prévue ({formatDateFr(selectedDateKey)})
              </div>
              {selectedWorkout?.exercices?.length ? (
                <>
                  <div className="text-sm text-slate-300 mb-2">
                    <span className="text-white font-semibold">{selectedWorkout.name || 'Séance du jour'}</span>
                    {selectedWorkout.focus ? ` - ${selectedWorkout.focus}` : ''}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-slate-300">Programme: <span className="text-white font-semibold">{todayProgress.planned} exos</span></div>
                    <div className="text-slate-300">Exceptionnels: <span className="text-white font-semibold">{todayProgress.additional}</span></div>
                    <div className="text-slate-300">Réalisés: <span className="text-white font-semibold">{todayProgress.done}</span></div>
                    <div className="text-slate-300">Avancement: <span className="text-emerald-300 font-semibold">{todayProgress.completionPct}%</span></div>
                  </div>
                  {metadata?.variationReason && (
                    <div className="mt-2 text-xs text-slate-400">Variation du jour: {metadata.variationReason}</div>
                  )}
                  <div className="mt-3 max-h-56 overflow-auto space-y-2 pr-1">
                    {programExercises.map((exercise) => {
                      const checked = isExerciseChecked(exercise.id);
                      const disabled = togglingExerciseId === String(exercise.id);
                      return (
                        <label
                          key={exercise.id}
                          className="flex items-start gap-2 p-2 rounded-lg border border-slate-700/40 bg-slate-800/30 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => handleToggleExercise(exercise)}
                            className="mt-1"
                          />
                          <div className="text-sm min-w-0">
                            <div className={`font-medium ${checked ? 'text-emerald-300 line-through' : 'text-slate-100'}`}>
                              {exercise.name || `Exercice ${exercise.id}`}
                            </div>
                            <div className="text-xs text-slate-400">{exercise.series || 'Séries non définies'}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">Aucune séance planifiée ce jour (repos ou programme vide).</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-300" />
                Calendrier mois en cours
              </div>
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {monthCalendar.days.map((d) => {
                  const badge = intensityBadge(d.intensityLevel);
                  return (
                    <button
                      type="button"
                      key={d.dateKey}
                      title={`${d.dateKey} - Intensité ${badge.label}`}
                      onClick={() => !d.isFuture && setSelectedDate(new Date(`${d.dateKey}T00:00:00`))}
                      disabled={d.isFuture}
                      className={`h-7 rounded-md border text-[11px] flex items-center justify-center ${badge.cls} ${
                        d.isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'
                      } ${d.dateKey === selectedDateKey ? 'ring-1 ring-white/80 shadow-[0_0_12px_rgba(148,163,184,0.9)]' : ''}`}
                    >
                      {d.day}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Entraînements effectués: <span className="text-white font-semibold">{monthCalendar.counters.done}</span></div>
                <div>Intensité légère/moyenne/haute: <span className="text-white font-semibold">{monthCalendar.counters.light}/{monthCalendar.counters.medium}/{monthCalendar.counters.high}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGarminSportRecapBlock;
