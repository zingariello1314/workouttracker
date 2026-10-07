import React, { useMemo } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useExerciseTracking } from '../../tabs/TodayTab/hooks/useExerciseTracking';
import { SPORT_XP_PER_CHECKED_EXERCISE } from '../../../services/xp/xpCalculations';
import { detectExerciseUnit } from '../../../utils/exerciseCalculations';
import { exerciseUsesExternalLoad } from '../../../utils/programUtils';
import { generateSmartExerciseKey } from '../../../utils/exerciseKeyGenerator';
import HomeWidgetShell from '../HomeWidgetShell';

function fieldKind(exercise) {
  const unit = detectExerciseUnit(exercise);
  if (unit?.isTimeBased) return 'duration';
  if (exerciseUsesExternalLoad(exercise)) return 'load';
  const name = String(exercise?.name || exercise?.nom || '').toLowerCase();
  if (exercise?.type === 'stretch' || name.includes('étirement') || name.includes('stretch')) {
    return 'none';
  }
  return 'reps';
}

export default function HomeTodayExercisesWidget({ variant = 'full', accent }) {
  const { currentDate, isGymMode, getTodayWorkout, getCurrentData, updateTempExerciseData } =
    useWorkout();
  const workout = useMemo(
    () => getTodayWorkout?.(currentDate, isGymMode) || { exercices: [] },
    [getTodayWorkout, currentDate, isGymMode]
  );
  const exercises = workout?.exercices || workout?.exercises || [];
  const { toggleExercise, updateReps, getExerciseStatus } = useExerciseTracking({
    date: currentDate,
    isGymMode
  });

  const statuses = exercises.map((ex) => ({
    exercise: ex,
    status: getExerciseStatus(ex)
  }));
  const checkedCount = statuses.filter((s) => s.status.isChecked).length;
  const xpGain = checkedCount * SPORT_XP_PER_CHECKED_EXERCISE;

  const weightKey = (exercise) =>
    generateSmartExerciseKey(currentDate, exercise.id, {
      isGymMode,
      workoutIsGymMode: workout?.isGymMode
    });

  const setWeight = (exercise, value) => {
    const currentData = getCurrentData();
    const key = weightKey(exercise);
    updateTempExerciseData({
      ...currentData,
      exerciseWeights: {
        ...(currentData.exerciseWeights || {}),
        [key]: value
      }
    });
  };

  const readWeight = (exercise) => {
    const currentData = getCurrentData();
    return currentData.exerciseWeights?.[weightKey(exercise)] ?? '';
  };

  return (
    <HomeWidgetShell title="Exercices du jour" accent={accent}>
      {exercises.length === 0 ? (
        <p className="text-xs text-white/55">Aucune séance prévue aujourd’hui.</p>
      ) : (
        <ul className="max-h-[36vh] space-y-1.5 overflow-auto pr-0.5" data-swipe-ignore>
          {statuses.map(({ exercise, status }) => {
            const fields = fieldKind(exercise);
            const name = exercise.name || exercise.nom || 'Exercice';
            return (
              <li
                key={exercise.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(status.isChecked)}
                    onChange={() => toggleExercise(exercise)}
                    className="rounded border-white/25"
                  />
                  <span className="truncate text-xs text-white">{name}</span>
                </label>
                {status.isChecked ? (
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: accent }}>
                    +{SPORT_XP_PER_CHECKED_EXERCISE}
                  </span>
                ) : null}
                {variant === 'full' && fields !== 'none' ? (
                  <div className="flex w-full items-center gap-1.5 sm:w-auto">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={fields === 'duration' ? 's' : 'reps'}
                      value={status.reps ?? ''}
                      onChange={(e) => updateReps(exercise, e.target.value)}
                      className="w-14 rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-[11px] text-white"
                    />
                    {fields === 'load' ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="kg"
                        value={readWeight(exercise)}
                        onChange={(e) => setWeight(exercise, e.target.value)}
                        className="w-12 rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-[11px] text-white"
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/70">
        {checkedCount}/{exercises.length} cochés ·{' '}
        <span style={{ color: accent }}>+{xpGain} XP</span>
      </p>
    </HomeWidgetShell>
  );
}
