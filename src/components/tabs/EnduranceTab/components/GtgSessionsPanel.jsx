import React, { useCallback, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Info,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import { GTG_BUILTIN_IDS, listGtgBankExercises } from '../../../../services/endurance/gtgExerciseBank';
import {
  addGtgBankExercise,
  buildGtgDayPlan,
  getGtgExerciseLabel,
  getPerExerciseSchedule,
  normalizeGtgData,
  removeGtgExercise,
  todayYmd,
  toggleGtgMiniSet,
  updateGtgConfig,
  updateGtgExerciseConfig
} from '../../../../services/endurance/gtgService';
import { syncGtgDayToWorkoutData } from '../../../../services/endurance/gtgWorkoutSync';
import { applyWorkoutRepIntegrations } from '../../../../services/endurance/workoutRepIntegrations';
import {
  computeGtgXpForDayPlan,
  GTG_BONUS_100_PCT_EXTRA_XP,
  GTG_BONUS_50_PCT_XP,
  GTG_XP_PER_REP
} from '../../../../services/xp/gtgXpService';
import { invalidateSportXpCache } from '../../../../hooks/useSportXP';

const BUILTIN_LABEL_KEYS = {
  pullups: 'endurance.gtg.exercise.pullups',
  dips: 'endurance.gtg.exercise.dips',
  pushups: 'endurance.gtg.exercise.pushups'
};

export default function GtgSessionsPanel() {
  const { data, updateData } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const [showMethod, setShowMethod] = useState(true);
  const [bankSearch, setBankSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  const gtgRaw = data?.enduranceData?.gtg;
  const gtgData = useMemo(() => normalizeGtgData(gtgRaw), [gtgRaw]);
  const today = todayYmd();

  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );

  const dayPlan = useMemo(() => buildGtgDayPlan(gtgData, today, ctx), [gtgData, today, ctx]);
  const todayXp = useMemo(
    () => computeGtgXpForDayPlan(dayPlan, { repsInWorkout: true }),
    [dayPlan]
  );

  const bankExercises = useMemo(() => listGtgBankExercises(), []);
  const filteredBank = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return bankExercises.slice(0, 30);
    return bankExercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.bankKey.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [bankExercises, bankSearch]);

  const labelFor = useCallback(
    (id) => {
      if (BUILTIN_LABEL_KEYS[id]) return t(BUILTIN_LABEL_KEYS[id]);
      return getGtgExerciseLabel(id, gtgData.config, ctx);
    },
    [gtgData.config, ctx, t]
  );

  const persistGtg = useCallback(
    async (nextGtg, syncDate = today) => {
      if (typeof updateData !== 'function') return;
      setSaving(true);
      try {
        const base = {
          ...data,
          enduranceData: { ...(data.enduranceData || {}), gtg: nextGtg }
        };
        const merged = applyWorkoutRepIntegrations(
          syncGtgDayToWorkoutData(base, nextGtg, syncDate, ctx),
          ctx
        );
        await updateData(merged);
        invalidateSportXpCache();
      } finally {
        setSaving(false);
      }
    },
    [data, updateData, today, ctx]
  );

  const onExpandExercise = useCallback((exerciseId) => {
    setExpandedExerciseId((cur) => (cur === exerciseId ? null : exerciseId));
  }, []);

  const onToggleBuiltin = useCallback(
    (exerciseId) => {
      const cur = gtgData.config.selectedIds;
      if (cur.includes(exerciseId)) {
        onExpandExercise(exerciseId);
        return;
      }
      const next = [...cur, exerciseId];
      persistGtg(updateGtgConfig(gtgData, { selectedIds: next }));
      setExpandedExerciseId(exerciseId);
    },
    [gtgData, persistGtg, onExpandExercise]
  );

  const onAddFromBank = useCallback(
    (entry) => {
      if (!entry) return;
      persistGtg(addGtgBankExercise(gtgData, entry));
      setBankSearch('');
      setExpandedExerciseId(entry.id);
    },
    [gtgData, persistGtg]
  );

  const onBankSearchKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const first = filteredBank.find((x) => !gtgData.config.selectedIds.includes(x.id));
      if (first) onAddFromBank(first);
    },
    [filteredBank, gtgData.config.selectedIds, onAddFromBank]
  );

  const onRemoveExercise = useCallback(
    (exerciseId) => {
      persistGtg(removeGtgExercise(gtgData, exerciseId));
    },
    [gtgData, persistGtg]
  );

  const onExerciseScheduleChange = useCallback(
    (exerciseId, patch) => {
      persistGtg(updateGtgExerciseConfig(gtgData, exerciseId, { ...patch, slotMode: 'interval' }));
    },
    [gtgData, persistGtg]
  );

  const onManualMaxChange = useCallback(
    (exerciseId, raw) => {
      const trimmed = String(raw ?? '').trim();
      if (trimmed === '') {
        persistGtg(updateGtgExerciseConfig(gtgData, exerciseId, { manualMax: null }), today);
        return;
      }
      const n = Math.round(Number(trimmed.replace(',', '.')));
      persistGtg(
        updateGtgExerciseConfig(gtgData, exerciseId, {
          manualMax: Number.isFinite(n) && n > 0 ? n : null
        }),
        today
      );
    },
    [gtgData, persistGtg, today]
  );

  const onToggleMiniSet = useCallback(
    (slotIndex, exerciseId) => {
      const next = toggleGtgMiniSet(gtgData, today, slotIndex, exerciseId);
      persistGtg(next, today);
    },
    [gtgData, today, persistGtg]
  );

  const progressBarPct = Math.min(100, Math.max(0, dayPlan.progressPct));

  const exercisePlanById = useMemo(() => {
    const map = new Map();
    (dayPlan.exercisePlans || []).forEach((ep) => map.set(ep.exerciseId, ep));
    return map;
  }, [dayPlan.exercisePlans]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setShowMethod((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-900/60"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <Info className="h-4 w-4 text-sky-300" />
          {t('endurance.gtg.methodTitle')}
        </span>
        {showMethod ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showMethod && (
        <div className="space-y-2 rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 text-xs leading-relaxed text-slate-300">
          <p>{t('endurance.gtg.methodP1')}</p>
          <p>{t('endurance.gtg.methodP2')}</p>
          <p>{t('endurance.gtg.methodP3')}</p>
          <p className="text-slate-400">{t('endurance.gtg.methodOptional')}</p>
        </div>
      )}

      {/* Emploi du temps — en haut, juste après l'explication */}
      <div className="rounded-2xl border border-[#0F4C5C]/50 bg-black p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white">{t('endurance.gtg.scheduleTitle')}</h4>
            <p className="text-xs text-slate-400">{t('endurance.gtg.scheduleHint')}</p>
            <p className="mt-1 text-[10px] text-violet-300/80">{t('endurance.gtg.repsSyncHint')}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-300/90">
              +{todayXp.xp} XP · {dayPlan.doneReps} reps
            </div>
            <div className="mt-1 min-w-[200px]">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>{t('endurance.gtg.progress')}</span>
                <span>
                  {dayPlan.doneMiniSets}/{dayPlan.plannedMiniSets}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-violet-500 transition-all"
                  style={{ width: `${progressBarPct}%` }}
                />
                <div className="absolute inset-y-0 left-1/2 w-px bg-amber-400/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {dayPlan.slots.map((slot) => (
            <div
              key={slot.index}
              className={`rounded-xl border p-4 ${
                slot.isComplete
                  ? 'border-emerald-600/50 bg-emerald-950/20'
                  : 'border-slate-700/50 bg-slate-900/30'
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
              <div className="flex flex-wrap gap-2">
                {slot.items.map((item) => (
                  <button
                    key={item.exerciseId}
                    type="button"
                    disabled={saving}
                    onClick={() => onToggleMiniSet(item.slotIndex, item.exerciseId)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      item.done
                        ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
                        : 'border-slate-600 bg-black text-slate-200 hover:border-violet-400/50'
                    }`}
                  >
                    <div className="font-medium">{labelFor(item.exerciseId)}</div>
                    <div className="text-[11px] opacity-80">
                      {item.reps} {t('endurance.gtg.repsShort')}
                      {item.done ? ` · ${t('endurance.gtg.checked')}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="rounded-2xl border border-[#0F4C5C]/50 bg-black p-6">
        <h4 className="mb-4 text-lg font-semibold text-white">{t('endurance.gtg.configTitle')}</h4>

        <div className="mb-6 rounded-xl border border-violet-500/30 bg-violet-950/15 p-4">
          <div className="mb-2 text-sm font-medium text-violet-100">{t('endurance.gtg.bankAdd')}</div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              list="gtg-bank-datalist"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              onKeyDown={onBankSearchKeyDown}
              placeholder={t('endurance.gtg.bankSearch')}
              className="w-full rounded-lg border border-slate-600 bg-black py-2 pl-9 pr-3 text-sm text-white"
            />
            <datalist id="gtg-bank-datalist">
              {bankExercises.map((e) => (
                <option key={e.id} value={e.name} />
              ))}
            </datalist>
          </div>
          {bankSearch.trim() && filteredBank.length > 0 && (
            <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-700/50 bg-black/60 p-2">
              {filteredBank.map((entry) => {
                const already = gtgData.config.selectedIds.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={already}
                    onClick={() => onAddFromBank(entry)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${
                      already ? 'text-slate-600' : 'text-slate-200 hover:bg-violet-950/50'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      {entry.name}
                      {entry.isFundamental && (
                        <span className="rounded bg-amber-900/50 px-1 text-[9px] text-amber-200">
                          {t('endurance.gtg.fundamental')}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500">{entry.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-2 text-sm text-teal-200/80">{t('endurance.gtg.selectExercises')}</div>
          <p className="mb-2 text-[11px] text-slate-500">{t('endurance.gtg.clickToConfigure')}</p>
          <div className="flex flex-wrap gap-2">
            {GTG_BUILTIN_IDS.map((id) => {
              const selected = gtgData.config.selectedIds.includes(id);
              const plan = dayPlan.exercises.find((e) => e.exerciseId === id);
              const expanded = expandedExerciseId === id;
              if (!selected) {
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onToggleBuiltin(id)}
                    className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-400 transition hover:border-slate-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      {labelFor(id)}
                    </span>
                  </button>
                );
              }
              const sched = getPerExerciseSchedule(gtgData.config, id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onExpandExercise(id)}
                  className={`rounded-xl border px-4 py-2 text-sm transition ${
                    expanded
                      ? 'border-sky-400/70 bg-sky-950/30 text-white ring-1 ring-sky-400/30'
                      : 'border-violet-400/60 bg-violet-950/40 text-white hover:border-violet-300/80'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {labelFor(id)}
                    <span className="text-[11px] text-violet-200/70">
                      ({plan?.repsPerSet}/{plan?.maxReps})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      · {sched.scheduleFrom}–{sched.scheduleTo} / {sched.intervalHours}h
                    </span>
                  </span>
                </button>
              );
            })}
            {gtgData.config.selectedIds
              .filter((id) => !GTG_BUILTIN_IDS.includes(id))
              .map((id) => {
                const plan = dayPlan.exercises.find((e) => e.exerciseId === id);
                const expanded = expandedExerciseId === id;
                const sched = getPerExerciseSchedule(gtgData.config, id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onExpandExercise(id)}
                    className={`rounded-xl border px-4 py-2 text-sm transition ${
                      expanded
                        ? 'border-sky-400/70 bg-sky-950/30 text-white ring-1 ring-sky-400/30'
                        : 'border-violet-400/60 bg-violet-950/40 text-white hover:border-violet-300/80'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Dumbbell className="h-3.5 w-3.5" />
                      {labelFor(id)}
                      <span className="text-[11px] text-violet-200/70">
                        ({plan?.repsPerSet}/{plan?.maxReps})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        · {sched.scheduleFrom}–{sched.scheduleTo} / {sched.intervalHours}h
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          {gtgData.config.selectedIds.map((id) => {
            const ep = exercisePlanById.get(id);
            const plan = dayPlan.exercises.find((e) => e.exerciseId === id);
            const manualVal = gtgData.config.manualMax?.[id];
            const sched = getPerExerciseSchedule(gtgData.config, id);
            const expanded = expandedExerciseId === id;
            return (
              <div
                key={id}
                className={`overflow-hidden rounded-xl border transition ${
                  expanded
                    ? 'border-sky-500/50 bg-slate-900/50'
                    : 'border-slate-700/50 bg-slate-900/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onExpandExercise(id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{labelFor(id)}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {t('endurance.gtg.repsHint', {
                        reps: plan?.repsPerSet ?? '—',
                        low: plan?.rangeLow ?? '—',
                        high: plan?.rangeHigh ?? '—',
                        max: plan?.maxReps ?? '—'
                      })}
                      {' · '}
                      {t('endurance.gtg.exerciseScheduleSummary', {
                        from: sched.scheduleFrom,
                        to: sched.scheduleTo,
                        n: sched.intervalHours,
                        count: sched.slotTimes.length
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ep && (
                      <span className="text-[11px] text-emerald-300/80">
                        {ep.completedCount}/{ep.totalCount}
                      </span>
                    )}
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="space-y-4 border-t border-slate-700/50 px-4 pb-4 pt-3">
                    <label className="block text-[11px] text-slate-400">{t('endurance.gtg.manualMax')}</label>
                    <p className="mb-1 text-[10px] text-violet-300/80">
                      {t('endurance.gtg.performanceMaxHint', {
                        max: plan?.maxReps ?? '—',
                        defaultValue: `Suggestion (Performances / historique) : ${plan?.maxReps ?? '—'} reps max — modifiable, non obligatoire.`
                      })}
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      placeholder={String(plan?.maxReps ?? '')}
                      value={manualVal ?? ''}
                      onChange={(e) => onManualMaxChange(id, e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white"
                    />

                    <div className="rounded-lg border border-slate-700/40 bg-slate-950/40 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-100">
                        <Clock className="h-4 w-4" />
                        {t('endurance.gtg.exerciseScheduleTitle')}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block text-xs text-slate-400">
                          {t('endurance.gtg.scheduleFrom')}
                          <input
                            type="time"
                            value={sched.scheduleFrom}
                            onChange={(e) =>
                              onExerciseScheduleChange(id, { scheduleFrom: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-600 bg-black px-2 py-1.5 text-sm text-white"
                          />
                        </label>
                        <label className="block text-xs text-slate-400">
                          {t('endurance.gtg.scheduleTo')}
                          <input
                            type="time"
                            value={sched.scheduleTo}
                            onChange={(e) => onExerciseScheduleChange(id, { scheduleTo: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-600 bg-black px-2 py-1.5 text-sm text-white"
                          />
                        </label>
                        <label className="block text-xs text-slate-400">
                          {t('endurance.gtg.intervalHours')}
                          <select
                            value={sched.intervalHours}
                            onChange={(e) =>
                              onExerciseScheduleChange(id, { intervalHours: Number(e.target.value) })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-600 bg-black px-2 py-1.5 text-sm text-white"
                          >
                            {[1, 2, 3, 4].map((h) => (
                              <option key={h} value={h}>
                                {t('endurance.gtg.everyNHours', { n: h })}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="mt-3 text-[11px] text-slate-500">
                        {t('endurance.gtg.schedulePreview', {
                          count: sched.slotTimes.length,
                          times: sched.slotTimes.join(', ')
                        })}
                      </p>
                    </div>

                    {ep && ep.slots.length > 0 && (
                      <div>
                        <div className="mb-2 text-[11px] text-slate-400">
                          {t('endurance.gtg.exerciseSlotsToday')}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ep.slots.map((s) => (
                            <button
                              key={s.index}
                              type="button"
                              disabled={saving}
                              onClick={() => onToggleMiniSet(s.index, id)}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-mono transition ${
                                s.done
                                  ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
                                  : 'border-slate-600 text-slate-300 hover:border-violet-400/50'
                              }`}
                            >
                              {s.time} · {s.reps}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onRemoveExercise(id);
                        setExpandedExerciseId(null);
                      }}
                      disabled={gtgData.config.selectedIds.length <= 1}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('endurance.gtg.removeExercise')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-100/90">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p>
          {t('endurance.gtg.xpExplain', {
            perRep: GTG_XP_PER_REP,
            bonus50: GTG_BONUS_50_PCT_XP,
            bonus100: GTG_BONUS_50_PCT_XP + GTG_BONUS_100_PCT_EXTRA_XP
          })}
        </p>
      </div>
    </div>
  );
}
