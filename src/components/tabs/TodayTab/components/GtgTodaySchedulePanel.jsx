import React, { useCallback, useMemo, useState } from 'react';
import { Check, Clock, Info } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import { getDateStr } from '../../../../utils/dateUtils';
import {
  buildGtgDayPlan,
  getGtgExerciseLabel,
  normalizeGtgData,
  toggleGtgMiniSet
} from '../../../../services/endurance/gtgService';
import { syncGtgDayToWorkoutData } from '../../../../services/endurance/gtgWorkoutSync';
import { applyWorkoutRepIntegrations } from '../../../../services/endurance/workoutRepIntegrations';
import { computeGtgXpForDayPlan } from '../../../../services/xp/gtgXpService';
import { invalidateSportXpCache } from '../../../../hooks/useSportXP';

const BUILTIN_LABEL_KEYS = {
  pullups: 'endurance.gtg.exercise.pullups',
  dips: 'endurance.gtg.exercise.dips',
  pushups: 'endurance.gtg.exercise.pushups'
};

/**
 * Emploi du temps GTG du jour (Aujourd’hui) — dissocié des exercices programme.
 */
export default function GtgTodaySchedulePanel({ date }) {
  const { data, updateData } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const [saving, setSaving] = useState(false);

  const dateStr = useMemo(() => getDateStr(date), [date]);
  const gtgRaw = data?.enduranceData?.gtg;
  const gtgData = useMemo(() => normalizeGtgData(gtgRaw), [gtgRaw]);
  const selectedCount = gtgData.config?.selectedIds?.length || 0;

  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );

  const dayPlan = useMemo(() => buildGtgDayPlan(gtgData, dateStr, ctx), [gtgData, dateStr, ctx]);
  const todayXp = useMemo(
    () => computeGtgXpForDayPlan(dayPlan, { repsInWorkout: true }),
    [dayPlan]
  );

  const labelFor = useCallback(
    (id) => {
      if (BUILTIN_LABEL_KEYS[id]) return t(BUILTIN_LABEL_KEYS[id]);
      return getGtgExerciseLabel(id, gtgData.config, ctx);
    },
    [gtgData.config, ctx, t]
  );

  const persistGtg = useCallback(
    async (nextGtg) => {
      if (typeof updateData !== 'function') return;
      setSaving(true);
      try {
        const base = {
          ...data,
          enduranceData: { ...(data.enduranceData || {}), gtg: nextGtg }
        };
        const merged = applyWorkoutRepIntegrations(
          syncGtgDayToWorkoutData(base, nextGtg, dateStr, ctx),
          ctx
        );
        await updateData(merged);
        invalidateSportXpCache();
      } finally {
        setSaving(false);
      }
    },
    [data, updateData, dateStr, ctx]
  );

  const onToggleMiniSet = useCallback(
    (slotIndex, exerciseId) => {
      const next = toggleGtgMiniSet(gtgData, dateStr, slotIndex, exerciseId);
      persistGtg(next);
    },
    [gtgData, dateStr, persistGtg]
  );

  if (selectedCount === 0) return null;

  const progressBarPct = Math.min(100, Math.max(0, dayPlan.progressPct));

  return (
    <div className="today-module-card today-gtg-panel rounded-xl border-2 border-violet-500/35 bg-black p-5 shadow-lg">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {t('today.gtg.scheduleTitle', 'Grease the Groove — emploi du temps')}
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 leading-relaxed">
            {t(
              'today.gtg.scheduleHint',
              'Coche chaque mini-série une fois faite (facile, sans forcer). Les reps alimentent le journal du jour et le Récap.'
            )}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div className="font-mono text-violet-200">
            +{todayXp.xp} XP · {todayXp.doneReps} reps
          </div>
          <div className="mt-0.5">
            {dayPlan.doneMiniSets}/{dayPlan.plannedMiniSets}{' '}
            {t('endurance.gtg.miniSetsShort', 'mini-séries')}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[11px] text-slate-500">
          <span>{t('endurance.gtg.dayProgress', 'Avancement du jour')}</span>
          <span>{Math.round(progressBarPct)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressBarPct}%` }}
          />
        </div>
      </div>

      {dayPlan.plannedMiniSets === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Info className="h-4 w-4 shrink-0" />
          {t('today.gtg.noSlots', 'Aucun créneau prévu — configure GTG dans l’onglet Défis.')}
        </p>
      ) : (
        <div className="today-gtg-slots-wrap">
        <div className="today-gtg-slots">
          {dayPlan.slots.map((slot) => (
            <div
              key={slot.index}
              className={`today-gtg-slot rounded-xl border p-4 ${
                slot.isComplete
                  ? 'border-emerald-600/50 bg-emerald-950/20'
                  : 'border-[#0F4C5C]/50 bg-slate-950/40'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-300" />
                  <span className="font-mono text-lg font-semibold text-white">{slot.time}</span>
                  <span className="text-[11px] text-slate-500">
                    {slot.completedCount}/{slot.totalCount}
                  </span>
                </div>
                {slot.isComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/50 px-2 py-0.5 text-[11px] text-emerald-200">
                    <Check className="h-3 w-3" />
                    {t('endurance.gtg.slotDone')}
                  </span>
                )}
              </div>
              <div className="today-gtg-pills">
                {slot.items.map((item) => (
                  <button
                    key={`${item.exerciseId}-${item.slotIndex}`}
                    type="button"
                    disabled={saving}
                    onClick={() => onToggleMiniSet(item.slotIndex, item.exerciseId)}
                    className={`today-gtg-pill ${item.done ? 'is-done' : ''}`}
                  >
                    <span className="today-gtg-pill-name">{labelFor(item.exerciseId)}</span>
                    <b>
                      {item.reps} {t('endurance.gtg.repsShort')}
                    </b>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
