/**
 * Séance prévue (sidebar) : même logique que le bloc dashboard sport (sans calendrier).
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useTodayExercises } from '../../../hooks/useTodayExercises';
import { calculateAutoReps, detectExerciseUnit } from '../../../utils/exerciseCalculations';

const formatDateFr = (dateKey) => {
  if (!dateKey) return '—';
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
};

const SidebarSportPlanningModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const {
    currentDate,
    isGymMode,
    getTodayWorkout,
    getCurrentData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    saveStretchChanges
  } = useWorkout();

  const [selectedDate, setSelectedDate] = useState(() => new Date(currentDate));
  const [togglingExerciseId, setTogglingExerciseId] = useState(null);
  const [togglingStretchMoment, setTogglingStretchMoment] = useState(null);

  useEffect(() => {
    setSelectedDate(new Date(currentDate));
  }, [currentDate]);

  const selectedDateKey = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const selectedWorkout = getTodayWorkout(selectedDate, isGymMode);
  const { programExercises, additionalExercises } = useTodayExercises({ date: selectedDate, isGymMode });
  const liveWorkoutData = getCurrentData();

  const getExerciseCheckKey = useCallback(
    (exerciseId) => {
      const base = `${selectedDateKey}_${exerciseId}`;
      if (isGymMode && selectedWorkout?.isGymMode) {
        const weekSuffix = selectedWorkout.weekVariant === 'A' ? '_semaineA' : '_semaineB';
        return `${base}${weekSuffix}`;
      }
      return base;
    },
    [selectedDateKey, isGymMode, selectedWorkout]
  );

  const stretchEntries = useMemo(() => {
    const out = [];
    const added = new Set();
    const stretchMoments = ['matin', 'midi', 'soir'];

    const descriptionFromValue = (val) => {
      if (typeof val === 'string') return val.trim();
      // Nouveau format : tableau d'items { id, stretchKey, duration, name? }
      if (Array.isArray(val) && val.length) {
        const names = val
          .map((item) => item?.name || item?.stretchKey || '')
          .map((s) => String(s).replace(/_/g, ' ').trim())
          .filter(Boolean);
        if (names.length) return names.join(' · ');
      }
      if (!val || typeof val !== 'object') return '';
      if (typeof val.instructions === 'string') return val.instructions.trim();
      if (Array.isArray(val.exercises) && val.exercises.length) {
        const names = val.exercises
          .map((ex) => ex?.name || ex?.nom || '')
          .map((s) => String(s).trim())
          .filter(Boolean);
        if (names.length) return names.join(' · ');
      }
      return '';
    };

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      Object.entries(node).forEach(([key, value]) => {
        const k = String(key || '').toLowerCase().trim();
        if (stretchMoments.includes(k)) {
          const desc = descriptionFromValue(value);
          if (desc && !added.has(k)) {
            out.push({ moment: k, description: desc });
            added.add(k);
          }
          return;
        }
        if (value && typeof value === 'object') walk(value);
      });
    };

    walk(selectedWorkout?.etirements || null);
    return out;
  }, [selectedWorkout]);

  const isStretchChecked = useCallback(
    (moment) => {
      const checked = liveWorkoutData?.checkedStretches || {};
      const key = `${selectedDateKey}_${moment}`;
      return Boolean(checked[key]);
    },
    [liveWorkoutData?.checkedStretches, selectedDateKey]
  );

  const handleToggleStretch = async (moment) => {
    if (!moment) return;
    setTogglingStretchMoment(moment);
    try {
      const currentData = getCurrentData();
      const key = `${selectedDateKey}_${moment}`;
      const next = {
        ...currentData,
        checkedStretches: {
          ...(currentData?.checkedStretches || {}),
          [key]: !Boolean(currentData?.checkedStretches?.[key])
        }
      };
      updateTempStretchData(next);
      await saveStretchChanges();
    } catch {
      /* ignore */
    } finally {
      setTogglingStretchMoment(null);
    }
  };

  const isExerciseChecked = useCallback(
    (exerciseId) => {
      const checked = liveWorkoutData?.checkedExercises || {};
      const key = getExerciseCheckKey(exerciseId);
      return Boolean(checked[key]);
    },
    [liveWorkoutData?.checkedExercises, getExerciseCheckKey]
  );

  const getExerciseReps = useCallback(
    (exerciseId) => {
      const reps = liveWorkoutData?.reps || {};
      const key = getExerciseCheckKey(exerciseId);
      return reps[key] || '';
    },
    [liveWorkoutData?.reps, getExerciseCheckKey]
  );

  const updateExerciseReps = useCallback(
    (exerciseId, repsValue) => {
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
    },
    [getCurrentData, getExerciseCheckKey, updateTempExerciseData]
  );

  const handleRepsFocus = useCallback(
    (exercise) => {
      if (!exercise?.id) return;
      const currentVal = getExerciseReps(exercise.id);
      if (currentVal) return;
      if (!exercise.series) return;
      const auto = calculateAutoReps(exercise.series);
      if (auto) {
        updateExerciseReps(exercise.id, String(auto));
      }
    },
    [getExerciseReps, updateExerciseReps]
  );

  const handleRepsBlur = async () => {
    try {
      await saveExerciseChanges();
    } catch {
      /* ignore */
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
      /* ignore */
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
  }, [programExercises, additionalExercises, isExerciseChecked, liveWorkoutData, selectedDateKey, selectedWorkout]);

  const openTodayTab = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
    } catch {
      /* ignore */
    }
    setActiveTab?.('today');
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section séance prévue sport"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            📋
          </span>
          Sport · séance prévue
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-3 px-1 py-2">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
              <div className="text-[11px] font-semibold text-slate-200">
                Séance prévue ({formatDateFr(selectedDateKey)})
              </div>
              <button
                type="button"
                onClick={openTodayTab}
                className="h-7 shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-200 hover:bg-emerald-500/20"
              >
                Accéder à aujourd&apos;hui
              </button>
            </div>
            {selectedWorkout?.exercices?.length ? (
              <>
                <div className="mb-2 text-[11px] text-slate-300">
                  <span className="font-semibold text-white">{selectedWorkout.name || 'Séance du jour'}</span>
                  {selectedWorkout.focus ? ` - ${selectedWorkout.focus}` : ''}
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-300">
                  <div>
                    Programme:{' '}
                    <span className="font-semibold text-white">{todayProgress.planned} exos</span>
                  </div>
                  <div>
                    Exceptionnels:{' '}
                    <span className="font-semibold text-white">{todayProgress.additional}</span>
                  </div>
                  <div>
                    Réalisés: <span className="font-semibold text-white">{todayProgress.done}</span>
                  </div>
                  <div>
                    Avancement:{' '}
                    <span className="font-semibold text-emerald-300">{todayProgress.completionPct}%</span>
                  </div>
                </div>
                <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
                  {programExercises.map((exercise) => {
                    const checked = isExerciseChecked(exercise.id);
                    const disabled = togglingExerciseId === String(exercise.id);
                    const repsValue = getExerciseReps(exercise.id);
                    const unitMeta = detectExerciseUnit(exercise);
                    const inputPlaceholder =
                      unitMeta?.unit === 'sec' ? 'Sec' : unitMeta?.unit === 'min' ? 'Min' : 'Reps';
                    const inputUnitLabel =
                      unitMeta?.unit === 'sec' ? 'sec' : unitMeta?.unit === 'min' ? 'min' : 'reps';
                    return (
                      <div
                        key={exercise.id}
                        className="flex items-start gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/30 p-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => handleToggleExercise(exercise)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 text-[10px]">
                          <div
                            className={`font-medium ${checked ? 'text-emerald-300 line-through' : 'text-slate-100'}`}
                          >
                            {exercise.name || `Exercice ${exercise.id}`}
                          </div>
                          <div className="text-[9px] text-slate-400">{exercise.series || 'Séries non définies'}</div>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-0.5">
                          <input
                            type="number"
                            value={repsValue}
                            placeholder={inputPlaceholder}
                            onChange={(e) => updateExerciseReps(exercise.id, e.target.value)}
                            onFocus={() => handleRepsFocus(exercise)}
                            onBlur={handleRepsBlur}
                            className={`w-14 rounded-md border px-1 py-0.5 text-center text-[9px] ${
                              checked
                                ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-600/70 bg-slate-900/80 text-white'
                            }`}
                          />
                          <span className="w-6 text-[8px] text-slate-400">{inputUnitLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-slate-700/60 pt-2">
                  <div className="mb-1 text-[10px] font-semibold text-slate-300">Étirements du jour</div>
                  {stretchEntries.length ? (
                    <div className="max-h-40 space-y-1.5 overflow-y-auto">
                      {stretchEntries.map(({ moment, description }) => {
                        const checked = isStretchChecked(moment);
                        const disabled = togglingStretchMoment === moment;
                        const label =
                          moment === 'matin' ? 'Matin' : moment === 'midi' ? 'Midi' : moment === 'soir' ? 'Soir' : moment;
                        return (
                          <div
                            key={`sb-stretch-${selectedDateKey}-${moment}`}
                            className="flex items-start gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/30 p-1.5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => handleToggleStretch(moment)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-[10px] font-medium ${checked ? 'text-emerald-300 line-through' : 'text-slate-100'}`}
                              >
                                {label}
                              </div>
                              <div className="text-[9px] text-slate-400">{description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500">Aucun étirement défini pour cette séance.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-[10px] text-slate-400">Aucune séance planifiée ce jour (repos ou programme vide).</div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarSportPlanningModule.displayName = 'SidebarSportPlanningModule';

export default SidebarSportPlanningModule;
