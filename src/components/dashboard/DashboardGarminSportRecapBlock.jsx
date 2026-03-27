import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Footprints,
  HeartPulse,
  Moon,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTodayExercises } from '../../hooks/useTodayExercises';
import { useGarminData } from '../../hooks/useGarminData';
import { parseDurationToMinutes, isMockEnduranceSession } from '../../utils/calendarUtils';
import { calculateAutoReps, detectExerciseUnit } from '../../utils/exerciseCalculations';
import CalendarHeatmap from '../CalendarHeatmap';
import { useGarminImport } from '../tabs/GarminTab/hooks/useGarminImport';
import { useGarminSync } from '../tabs/GarminTab/hooks/useGarminSync';
import {
  formatDistance,
  formatDuration,
  formatPacePerKm,
  formatSpeed,
  normalizeGarminDate
} from '../tabs/GarminTab/utils/garminFormatters';

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
    list.filter((a) => {
      const normalized = normalizeGarminDate(a?.date || a?.startTimeLocal || a?.startTimeGmt);
      return normalized === dateKey;
    });

  return {
    swimming: filterByDate(activities.swimming || []),
    jumpRope: filterByDate(activities.jumpRope || []),
    cardio: filterByDate(activities.cardio || [])
  };
};

const getSleepHours = (sleep) => {
  const raw = extractNumeric(sleep?.duration, 0);
  if (raw <= 0) return 0;
  // Certains flux historiques stockent en minutes, les récents en heures.
  return raw > 24 ? raw / 60 : raw;
};

const getBodyBatteryValue = (metric) => {
  const bb = metric?.bodyBattery;
  if (bb == null) return 0;
  if (typeof bb === 'number') return extractNumeric(bb, 0);
  return extractNumeric(bb?.current, 0);
};

const trendSlope = (values = []) => {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const n = values.length;
  const xSum = ((n - 1) * n) / 2;
  const ySum = values.reduce((a, b) => a + b, 0);
  const xySum = values.reduce((sum, y, i) => sum + i * y, 0);
  const x2Sum = values.reduce((sum, _, i) => sum + i * i, 0);
  const denom = n * x2Sum - xSum * xSum;
  if (!denom) return 0;
  return (n * xySum - xSum * ySum) / denom;
};

const trendLabel = (slope) => {
  if (Math.abs(slope) < 0.01) return 'Stable';
  return slope > 0 ? '↗ En hausse' : '↘ En baisse';
};

const summarizeSeries = (values = []) => {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return { avg: 0, min: 0, max: 0, total: 0, trend: 0, count: 0 };
  const total = clean.reduce((a, b) => a + b, 0);
  return {
    avg: total / clean.length,
    min: Math.min(...clean),
    max: Math.max(...clean),
    total,
    trend: trendSlope(clean),
    count: clean.length
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
    getCurrentData,
    updateTempExerciseData,
    saveExerciseChanges,
    getWorkoutHistory,
    setActiveTab
  } = useWorkout();
  const [garminData, setGarminData] = useState({ dailyMetrics: {}, activities: {} });
  const [loadingGarmin, setLoadingGarmin] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date(currentDate));
  const [togglingExerciseId, setTogglingExerciseId] = useState(null);
  const { importToEndurance } = useGarminImport();
  const { syncNow, loading: syncingGarmin } = useGarminSync(setGarminData, setSyncStatus, importToEndurance);

  const todayDateKey = useMemo(() => currentDate.toISOString().slice(0, 10), [currentDate]);
  const selectedDateKey = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const selectedWorkout = getTodayWorkout(selectedDate, isGymMode);
  const { programExercises, additionalExercises, metadata } = useTodayExercises({ date: selectedDate, isGymMode });
  const liveWorkoutData = getCurrentData();

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
        if (m) {
          acc.daysWithMetrics += 1;
          acc.steps += extractNumeric(m.steps, 0);
          acc.restingHr += extractNumeric(m.heartRate?.resting, 0);
          acc.bodyBattery += getBodyBatteryValue(m);
          acc.stress += extractNumeric(m.stress?.average, 0);
          acc.sleepHours += getSleepHours(m.sleep);
          acc.activeCalories += extractNumeric(m.calories?.active, 0);
          acc.intensityMinutes += getIntensityMinutes(m);
        }
        acc.weekActivities += getDailyActivityCount(activities, dateKey);
        return acc;
      },
      {
        daysWithMetrics: 0,
        steps: 0,
        restingHr: 0,
        bodyBattery: 0,
        stress: 0,
        sleepHours: 0,
        activeCalories: 0,
        intensityMinutes: 0,
        weekActivities: 0
      }
    );

    const denom = Math.max(1, weekStats.daysWithMetrics);
    const weekSummary = {
      avgSteps: Math.round(weekStats.steps / denom),
      avgRestingHr: Math.round(weekStats.restingHr / denom),
      avgBodyBattery: Math.round(weekStats.bodyBattery / denom),
      avgStress: Math.round(weekStats.stress / denom),
      avgSleepHours: Number((weekStats.sleepHours / denom).toFixed(1)),
      avgActiveCalories: Math.round(weekStats.activeCalories / denom),
      totalIntensityMinutes: Math.round(weekStats.intensityMinutes),
      daysWithMetrics: weekStats.daysWithMetrics,
      totalActivities: weekStats.weekActivities
    };

    const activitiesTotal = sumActivitiesCount(activities);
    const selectedActivities = getDailyGarminActivities(activities, selectedDateKey);
    const selectedActivitiesCount = sumActivitiesCount(selectedActivities);

    return {
      latestDate,
      selectedMetrics,
      weekSummary,
      activitiesTotal,
      selectedActivities,
      selectedActivitiesCount
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
    const checked = liveWorkoutData?.checkedExercises || {};
    const key = getExerciseCheckKey(exerciseId);
    return Boolean(checked[key]);
  };

  const getExerciseReps = (exerciseId) => {
    const reps = liveWorkoutData?.reps || {};
    const key = getExerciseCheckKey(exerciseId);
    return reps[key] || '';
  };

  const updateExerciseReps = (exerciseId, repsValue) => {
    const currentData = getCurrentData();
    const key = getExerciseCheckKey(exerciseId);
    const nextReps = {
      ...(currentData?.reps || {}),
      [key]: repsValue
    };
    updateTempExerciseData({
      ...currentData,
      reps: nextReps
    });
  };

  const handleRepsFocus = (exercise) => {
    if (!exercise?.id) return;
    const currentVal = getExerciseReps(exercise.id);
    if (currentVal) return;
    if (!exercise.series) return;
    const auto = calculateAutoReps(exercise.series);
    if (auto) {
      updateExerciseReps(exercise.id, String(auto));
    }
  };

  const handleRepsBlur = async () => {
    try {
      await saveExerciseChanges();
    } catch {
      // no-op: on garde une UX stable
    }
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
  }, [programExercises, additionalExercises, liveWorkoutData, selectedDateKey, isGymMode, selectedWorkout]);

  const selectedMetrics = derived.selectedMetrics || {};
  const periodStats = useMemo(() => {
    const entries = Object.values(garminData.dailyMetrics || {});
    if (!entries.length) return null;

    const restingHr = summarizeSeries(entries.map((m) => extractNumeric(m?.heartRate?.resting, 0)));
    const avgHr = summarizeSeries(entries.map((m) => extractNumeric(m?.heartRate?.avg, 0)));
    const maxHr = summarizeSeries(entries.map((m) => extractNumeric(m?.heartRate?.max, 0)));
    const steps = summarizeSeries(entries.map((m) => extractNumeric(m?.steps, 0)));
    const distance = summarizeSeries(entries.map((m) => extractNumeric(m?.distance, 0)));
    const caloriesTotal = summarizeSeries(entries.map((m) => extractNumeric(m?.calories?.total, 0)));
    const caloriesActive = summarizeSeries(entries.map((m) => extractNumeric(m?.calories?.active, 0)));
    const bodyBattery = summarizeSeries(entries.map((m) => getBodyBatteryValue(m)));
    const stress = summarizeSeries(entries.map((m) => extractNumeric(m?.stress?.average, 0)));
    const sleep = summarizeSeries(entries.map((m) => getSleepHours(m?.sleep)));

    return {
      days: entries.length,
      heartRate: { resting: restingHr, avg: avgHr, max: maxHr },
      steps,
      distance,
      calories: { total: caloriesTotal, active: caloriesActive },
      bodyBattery,
      stress,
      sleep
    };
  }, [garminData.dailyMetrics]);
  // Approximation d'intensité pour le chip, basée sur les minutes Garmin
  const intensityLevelForChip = (() => {
    const minutes = selectedMetrics ? getIntensityMinutes(selectedMetrics) : 0;
    if (minutes >= 90) return 3;
    if (minutes >= 40) return 2;
    if (minutes > 0) return 1;
    return 0;
  })();
  const selectedDayBadge = intensityBadge(intensityLevelForChip);

  const canGoNext = selectedDateKey < todayDateKey;
  const goPrevDay = () => setSelectedDate((prev) => new Date(prev.getTime() - DAY_MS));
  const goNextDay = () => {
    if (!canGoNext) return;
    setSelectedDate((prev) => new Date(prev.getTime() + DAY_MS));
  };

  const handleDashboardSync = async () => {
    if (syncingGarmin) return;
    try {
      // Même comportement que le bouton "Synchroniser" de l'onglet Garmin
      await syncNow({ forceRefresh: false, skipDelay: true });
    } catch {
      // no-op: le statut de sync est déjà géré par useGarminSync
    }
  };

  const openTodayTab = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
    } catch {
      // no-op
    }
    setActiveTab?.('today');
  };

  const openCalendarTab = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'calendar');
    } catch {
      // no-op
    }
    setActiveTab?.('calendar');
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
      <div className="relative p-6 md:p-7 lg:p-8 space-y-6">
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
              onClick={handleDashboardSync}
              disabled={syncingGarmin}
              className="h-8 px-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs font-medium flex items-center gap-1.5 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Synchroniser Garmin"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGarmin ? 'animate-spin' : ''}`} />
              {syncingGarmin ? 'Synchronisation...' : 'Synchroniser'}
            </button>
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
        {syncStatus?.message && (
          <div className={`text-xs ${syncStatus?.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
            {syncStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Colonne Garmin */}
          <div className="xl:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>{formatDateFr(selectedDateKey)}</span>
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
                  <div className="text-xs text-slate-400">Distance</div>
                  <div className="text-lg font-bold text-white">{formatDistance(extractNumeric(selectedMetrics.distance, 0))}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Calories actives</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.calories?.active, 0)} kcal</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Calories totales</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.calories?.total, 0)} kcal</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><HeartPulse className="w-3 h-3" /> FC repos</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.heartRate?.resting, 0)} bpm</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">FC moyenne</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.heartRate?.avg, 0)} bpm</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">FC max</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.heartRate?.max, 0)} bpm</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Body Battery</div>
                  <div className="text-lg font-bold text-white">{getBodyBatteryValue(selectedMetrics)}/100</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Stress</div>
                  <div className="text-lg font-bold text-white">{extractNumeric(selectedMetrics.stress?.average, 0)}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Moon className="w-3 h-3" /> Sommeil</div>
                  <div className="text-lg font-bold text-white">{getSleepHours(selectedMetrics.sleep).toFixed(1)} h</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Coucher / Lever</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedMetrics.sleep?.bedTime || '—'} / {selectedMetrics.sleep?.wakeTime || '—'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Intensité</div>
                  <div className="text-lg font-bold text-white">{getIntensityMinutes(selectedMetrics)} min</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-sm">
                  <div className="text-xs text-slate-400">Activités du jour</div>
                  <div className="text-lg font-bold text-white">{derived.selectedActivitiesCount}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Total historique: {derived.activitiesTotal}</div>
                </div>
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
                <div className="text-slate-300">Activités sur 7j: <span className="text-white font-semibold">{derived.weekSummary.totalActivities}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/40 space-y-3">
              <div className="text-sm font-semibold text-slate-200">Activités Garmin ({formatDateFr(selectedDateKey)})</div>
              {derived.selectedActivitiesCount === 0 ? (
                <div className="text-sm text-slate-400">Aucune activité enregistrée ce jour.</div>
              ) : (
                <>
                  {derived.selectedActivities.swimming.map((act, idx) => {
                    const swim = act.swimmingMetrics || {};
                    return (
                      <div key={`swim-${idx}`} className="rounded-xl bg-cyan-900/15 border border-cyan-500/35 p-3">
                        <div className="text-cyan-200 text-sm font-semibold mb-2">🏊 Natation</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-200">
                          <div>Durée: <span className="text-white">{formatDuration(act.duration)}</span></div>
                          <div>Distance: <span className="text-white">{formatDistance(extractNumeric(act.distance, 0))}</span></div>
                          <div>FC moy/max: <span className="text-white">{extractNumeric(act.avgHR, 0)} / {extractNumeric(act.maxHR, 0)}</span></div>
                          <div>Calories: <span className="text-white">{extractNumeric(act.calories?.active, 0)}</span></div>
                          <div>Longueurs: <span className="text-white">{extractNumeric(swim.laps || act.laps, 0)}</span></div>
                          <div>SWOLF: <span className="text-white">{extractNumeric(swim.avgSwolf, 0) || '—'}</span></div>
                          <div>Allure moy: <span className="text-white">{extractNumeric(swim.avgPace, 0) ? `${extractNumeric(swim.avgPace, 0)}s/100m` : '—'}</span></div>
                          <div>Vitesse moy: <span className="text-white">{extractNumeric(swim.avgSpeed, 0) ? formatSpeed(extractNumeric(swim.avgSpeed, 0)) : '—'}</span></div>
                        </div>
                      </div>
                    );
                  })}

                  {derived.selectedActivities.jumpRope.map((act, idx) => {
                    const jr = act.jumpRopeMetrics || {};
                    return (
                      <div key={`jump-${idx}`} className="rounded-xl bg-emerald-900/15 border border-emerald-500/35 p-3">
                        <div className="text-emerald-200 text-sm font-semibold mb-2">🪢 Corde à sauter</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-200">
                          <div>Durée: <span className="text-white">{formatDuration(act.duration)}</span></div>
                          <div>Sauts: <span className="text-white">{extractNumeric(jr.jumps || act.jumps, 0)}</span></div>
                          <div>Vitesse: <span className="text-white">{extractNumeric(jr.speed, 0) ? `${extractNumeric(jr.speed, 0).toFixed(1)} sauts/min` : '—'}</span></div>
                          <div>Max continu: <span className="text-white">{extractNumeric(jr.maxContinuousJumps, 0) || '—'}</span></div>
                          <div>Interruptions: <span className="text-white">{jr.interruptions ?? '—'}</span></div>
                          <div>FC moy/max: <span className="text-white">{extractNumeric(act.avgHR, 0)} / {extractNumeric(act.maxHR, 0)}</span></div>
                          <div>Calories: <span className="text-white">{extractNumeric(act.calories?.active, 0)}</span></div>
                          <div>Intensité: <span className="text-white">{extractNumeric(act.intensityMinutes?.total, 0)} min</span></div>
                        </div>
                      </div>
                    );
                  })}

                  {derived.selectedActivities.cardio.map((act, idx) => {
                    const km = extractNumeric(act.distance, 0);
                    const paceSecPerKm = km > 0 && extractNumeric(act.duration, 0) > 0 ? extractNumeric(act.duration, 0) / km : null;
                    return (
                      <div key={`cardio-${idx}`} className="rounded-xl bg-red-900/15 border border-red-500/35 p-3">
                        <div className="text-red-200 text-sm font-semibold mb-2">❤️ {act.activityType === 'running' ? 'Course à pied' : 'Cardio'}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-200">
                          <div>Durée: <span className="text-white">{formatDuration(act.duration)}</span></div>
                          <div>Distance: <span className="text-white">{formatDistance(km)}</span></div>
                          <div>Allure moy: <span className="text-white">{paceSecPerKm ? formatPacePerKm(paceSecPerKm) : '—'}</span></div>
                          <div>Vitesse moy: <span className="text-white">{extractNumeric(act.speed, 0) ? formatSpeed(extractNumeric(act.speed, 0)) : '—'}</span></div>
                          <div>Vitesse max: <span className="text-white">{extractNumeric(act.maxSpeed, 0) ? formatSpeed(extractNumeric(act.maxSpeed, 0)) : '—'}</span></div>
                          <div>FC moy/max: <span className="text-white">{extractNumeric(act.avgHR, 0)} / {extractNumeric(act.maxHR, 0)}</span></div>
                          <div>Calories: <span className="text-white">{extractNumeric(act.calories?.active, 0)}</span></div>
                          <div>Cadence moy: <span className="text-white">{extractNumeric(act.running?.averageCadenceSpm, 0) || '—'}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {periodStats && (
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-200">Métriques Garmin (période)</div>
                  <div className="text-xs text-slate-400">{periodStats.days} jours</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 p-3">
                    <div className="text-rose-200 font-semibold mb-2">❤️ Fréquence Cardiaque</div>
                    <div className="space-y-2 text-xs">
                      <div className="text-slate-300">Repos <span className="text-white font-semibold float-right">{periodStats.heartRate.resting.avg.toFixed(1)} bpm</span></div>
                      <div className="text-slate-500">Min: {periodStats.heartRate.resting.min.toFixed(1)} • Max: {periodStats.heartRate.resting.max.toFixed(1)} • {trendLabel(periodStats.heartRate.resting.trend)}</div>
                      <div className="border-t border-slate-700/70 pt-2 text-slate-300">Moyenne <span className="text-white font-semibold float-right">{periodStats.heartRate.avg.avg.toFixed(1)} bpm</span></div>
                      <div className="text-slate-500">Min: {periodStats.heartRate.avg.min.toFixed(1)} • Max: {periodStats.heartRate.avg.max.toFixed(1)} • {trendLabel(periodStats.heartRate.avg.trend)}</div>
                      <div className="border-t border-slate-700/70 pt-2 text-slate-300">Maximum <span className="text-white font-semibold float-right">{periodStats.heartRate.max.avg.toFixed(1)} bpm</span></div>
                      <div className="text-slate-500">Min: {periodStats.heartRate.max.min.toFixed(1)} • Max: {periodStats.heartRate.max.max.toFixed(1)} • {trendLabel(periodStats.heartRate.max.trend)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-700/40 bg-indigo-900/10 p-3">
                    <div className="text-indigo-200 font-semibold mb-2">👣 Pas</div>
                    <div className="text-xs text-slate-300">Moyenne <span className="text-white font-semibold float-right">{Math.round(periodStats.steps.avg).toLocaleString('fr-FR')}</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {Math.round(periodStats.steps.min).toLocaleString('fr-FR')} • Max: {Math.round(periodStats.steps.max).toLocaleString('fr-FR')} • {trendLabel(periodStats.steps.trend)}</div>
                    <div className="border-t border-slate-700/70 pt-2 mt-2 text-xs text-slate-300">Total période <span className="text-white font-semibold float-right">{Math.round(periodStats.steps.total).toLocaleString('fr-FR')}</span></div>
                  </div>

                  <div className="rounded-xl border border-pink-700/40 bg-pink-900/10 p-3">
                    <div className="text-pink-200 font-semibold mb-2">📍 Distance</div>
                    <div className="text-xs text-slate-300">Quotidienne <span className="text-white font-semibold float-right">{periodStats.distance.avg.toFixed(1)} km</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.distance.min.toFixed(1)} • Max: {periodStats.distance.max.toFixed(1)} • {trendLabel(periodStats.distance.trend)}</div>
                    <div className="border-t border-slate-700/70 pt-2 mt-2 text-xs text-slate-300">Total période <span className="text-white font-semibold float-right">{periodStats.distance.total.toFixed(2)} km</span></div>
                  </div>

                  <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-3">
                    <div className="text-amber-200 font-semibold mb-2">🔥 Calories</div>
                    <div className="text-xs text-slate-300">Total <span className="text-white font-semibold float-right">{periodStats.calories.total.avg.toFixed(1)} kcal</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.calories.total.min.toFixed(1)} • Max: {periodStats.calories.total.max.toFixed(1)} • {trendLabel(periodStats.calories.total.trend)}</div>
                    <div className="border-t border-slate-700/70 pt-2 mt-2 text-xs text-slate-300">Active <span className="text-white font-semibold float-right">{periodStats.calories.active.avg.toFixed(1)} kcal</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.calories.active.min.toFixed(1)} • Max: {periodStats.calories.active.max.toFixed(1)} • {trendLabel(periodStats.calories.active.trend)}</div>
                    <div className="border-t border-slate-700/70 pt-2 mt-2 text-xs text-slate-300">Total période <span className="text-white font-semibold float-right">{Math.round(periodStats.calories.total.total).toLocaleString('fr-FR')} kcal</span></div>
                  </div>

                  <div className="rounded-xl border border-lime-700/40 bg-lime-900/10 p-3">
                    <div className="text-lime-200 font-semibold mb-2">🔋 Body Battery</div>
                    <div className="text-xs text-slate-300">Niveau <span className="text-white font-semibold float-right">{periodStats.bodyBattery.avg.toFixed(1)}/100</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.bodyBattery.min.toFixed(1)}/100 • Max: {periodStats.bodyBattery.max.toFixed(1)}/100 • {trendLabel(periodStats.bodyBattery.trend)}</div>
                  </div>

                  <div className="rounded-xl border border-fuchsia-700/40 bg-fuchsia-900/10 p-3">
                    <div className="text-fuchsia-200 font-semibold mb-2">🤯 Stress</div>
                    <div className="text-xs text-slate-300">Niveau <span className="text-white font-semibold float-right">{periodStats.stress.avg.toFixed(1)}/100</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.stress.min.toFixed(1)}/100 • Max: {periodStats.stress.max.toFixed(1)}/100 • {trendLabel(periodStats.stress.trend)}</div>
                  </div>

                  <div className="rounded-xl border border-sky-700/40 bg-sky-900/10 p-3 md:col-span-2 xl:col-span-1">
                    <div className="text-sky-200 font-semibold mb-2">😴 Sommeil</div>
                    <div className="text-xs text-slate-300">Durée <span className="text-white font-semibold float-right">{periodStats.sleep.avg.toFixed(1)} h</span></div>
                    <div className="text-xs text-slate-500 mt-1">Min: {periodStats.sleep.min.toFixed(1)} h • Max: {periodStats.sleep.max.toFixed(1)} h • {trendLabel(periodStats.sleep.trend)}</div>
                    <div className="border-t border-slate-700/70 pt-2 mt-2 text-xs text-slate-300">Total période <span className="text-white font-semibold float-right">{periodStats.sleep.total.toFixed(1)} h</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne Séance + Calendrier */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-slate-200">
                  Séance prévue ({formatDateFr(selectedDateKey)})
                </div>
                <button
                  type="button"
                  onClick={openTodayTab}
                  className="h-7 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-[11px] font-medium hover:bg-emerald-500/20"
                >
                  Accéder à aujourd&apos;hui
                </button>
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
                  <div className="mt-3 max-h-56 overflow-auto space-y-2 pr-1">
                    {programExercises.map((exercise) => {
                      const checked = isExerciseChecked(exercise.id);
                      const disabled = togglingExerciseId === String(exercise.id);
                      const repsValue = getExerciseReps(exercise.id);
                      const unitMeta = detectExerciseUnit(exercise);
                      const inputPlaceholder =
                        unitMeta?.unit === 'sec' ? 'Sec'
                          : unitMeta?.unit === 'min' ? 'Min'
                            : 'Reps';
                      const inputUnitLabel =
                        unitMeta?.unit === 'sec' ? 'sec'
                          : unitMeta?.unit === 'min' ? 'min'
                            : 'reps';
                      return (
                        <div
                          key={exercise.id}
                          className="flex items-start gap-2 p-2 rounded-lg border border-slate-700/40 bg-slate-800/30"
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
                          <div className="ml-auto flex items-center gap-1">
                            <input
                              type="number"
                              value={repsValue}
                              placeholder={inputPlaceholder}
                              onChange={(e) => updateExerciseReps(exercise.id, e.target.value)}
                              onFocus={() => handleRepsFocus(exercise)}
                              onBlur={handleRepsBlur}
                              className={`w-20 rounded-md px-2 py-1 text-xs text-center border ${
                                checked
                                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                                  : 'bg-slate-900/80 border-slate-600/70 text-white'
                              }`}
                            />
                            <span className="text-[11px] text-slate-400 min-w-[26px]">{inputUnitLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">Aucune séance planifiée ce jour (repos ou programme vide).</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-sm font-semibold text-slate-200">
                  Vue calendrier (mois courant)
                </div>
                <button
                  type="button"
                  onClick={openCalendarTab}
                  className="h-7 px-2.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 text-[11px] font-medium hover:bg-indigo-500/20"
                >
                  Accéder au calendrier
                </button>
              </div>
              <CalendarHeatmap
                workoutHistory={getWorkoutHistory()}
                garminData={garminData}
                initialViewMode="month"
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGarminSportRecapBlock;
