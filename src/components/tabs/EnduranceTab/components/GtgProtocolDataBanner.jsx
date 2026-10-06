import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Sparkles } from 'lucide-react';
import {
  defaultGtgProtocolGoal,
  estimateGtgMaxFromWorkingReps,
  getGtgExerciseLabel,
  resolveGtgBodyWeightKg,
  resolveGtgMaxReps,
  todayYmd,
  updateGtgConfig,
  updateGtgExerciseConfig,
  updateGtgProtocolExercise
} from '../../../../services/endurance/gtgService';
import { applyGtgDeclaredMaxToData } from '../../../../services/endurance/gtgMaxPerformance';

/**
 * Module protocole (Pratique) — repliable.
 * Demande max / objectif / reps tant que non renseignés ; poids indexé sur
 * impédancemètre / métriques Aujourd’hui dès qu’ils existent.
 */
export default function GtgProtocolDataBanner({
  gtgData,
  ctx,
  data,
  updateData,
  saving = false,
  t
}) {
  const selectedIds = gtgData?.config?.selectedIds || [];
  const bodyW = useMemo(
    () =>
      resolveGtgBodyWeightKg(gtgData, {
        workoutData: data,
        profileQuestionnaire: ctx?.profileQuestionnaire
      }),
    [gtgData, data, ctx?.profileQuestionnaire]
  );

  const rows = useMemo(() => {
    return selectedIds.map((id) => {
      const proto = gtgData.config.protocolByExercise?.[id] || {};
      const workingRepsRaw = gtgData.config.perExercise?.[id]?.repsPerSet;
      const workingReps =
        Number.isFinite(Number(workingRepsRaw)) && Number(workingRepsRaw) > 0
          ? Math.round(Number(workingRepsRaw))
          : null;
      const estimated = workingReps != null ? estimateGtgMaxFromWorkingReps(workingReps) : null;
      const resolved = resolveGtgMaxReps(id, ctx);
      const max =
        proto.currentMax > 0
          ? Math.round(proto.currentMax)
          : estimated != null
            ? estimated
            : resolved > 0
              ? Math.round(resolved)
              : '';
      const goal =
        proto.goal > 0
          ? Math.round(proto.goal)
          : max
            ? defaultGtgProtocolGoal(max)
            : '';
      return {
        id,
        label: getGtgExerciseLabel(id, gtgData.config, ctx),
        max,
        goal,
        reps: workingReps || '',
        hasDeclaredMax: proto.currentMax > 0,
        hasDeclaredGoal: proto.goal > 0,
        hasReps: workingReps != null
      };
    });
  }, [selectedIds, gtgData, ctx]);

  const gaps = useMemo(() => {
    const missingMax = rows.filter((r) => !r.hasDeclaredMax);
    const missingReps = rows.filter((r) => !r.hasReps);
    const needWeight = !bodyW.known;
    return {
      missingMax,
      missingReps,
      needWeight,
      incomplete: missingMax.length > 0 || missingReps.length > 0 || needWeight
    };
  }, [rows, bodyW.known]);

  const [drafts, setDrafts] = useState({});
  const [weightDraft, setWeightDraft] = useState('');
  const [collapsed, setCollapsed] = useState(() => !gaps.incomplete);
  const [userToggled, setUserToggled] = useState(false);

  // Auto : ouvert tant qu’il manque des données ; se replie une fois tout enregistré
  // (sauf si l’utilisateur a forcé l’état manuellement).
  useEffect(() => {
    if (userToggled) return;
    setCollapsed(!gaps.incomplete);
  }, [gaps.incomplete, userToggled]);

  if (selectedIds.length === 0) return null;

  const getDraft = (id, field, fallback) => {
    const key = `${id}:${field}`;
    if (Object.prototype.hasOwnProperty.call(drafts, key)) return drafts[key];
    return fallback === '' || fallback == null ? '' : String(fallback);
  };

  const setDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [`${id}:${field}`]: value }));
  };

  const persist = async (nextGtg, declaredMax = null) => {
    if (typeof updateData !== 'function') return;
    let nextData = {
      ...data,
      enduranceData: {
        ...(data.enduranceData || {}),
        gtg: nextGtg,
        lastUpdated: new Date().toISOString()
      }
    };
    if (declaredMax?.exerciseId && Number(declaredMax.reps) > 0) {
      nextData = applyGtgDeclaredMaxToData(nextData, {
        gtgExerciseId: declaredMax.exerciseId,
        reps: declaredMax.reps,
        config: nextGtg.config,
        dateStr: todayYmd(),
        ctx
      });
    }
    await updateData(nextData);
  };

  const parsePositive = (raw) => {
    const n = Math.round(Number(String(raw ?? '').replace(',', '.')));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const onSaveRow = async (row) => {
    const maxN = parsePositive(getDraft(row.id, 'max', row.max));
    const goalN = parsePositive(getDraft(row.id, 'goal', row.goal));
    const repsN = parsePositive(getDraft(row.id, 'reps', row.reps));
    if (!maxN && !goalN && !repsN) return;

    let next = gtgData;
    if (maxN || goalN) {
      const patch = {};
      if (maxN) patch.currentMax = maxN;
      if (goalN) patch.goal = goalN;
      next = updateGtgProtocolExercise(next, row.id, patch);
    }
    if (repsN) {
      next = updateGtgExerciseConfig(next, row.id, { repsPerSet: repsN });
    }
    await persist(next, maxN ? { exerciseId: row.id, reps: maxN } : null);
    setUserToggled(false);
  };

  const onSaveWeight = async () => {
    const n = Number(String(weightDraft || bodyW.kg || '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    const next = updateGtgConfig(gtgData, { bodyWeightKg: Math.round(n * 10) / 10 });
    await persist(next);
    setUserToggled(false);
  };

  const toggleCollapse = () => {
    setUserToggled(true);
    setCollapsed((v) => !v);
  };

  const sourceLabel =
    bodyW.source === 'impedance'
      ? t('endurance.gtg.protocolData.weightSourceImpedance')
      : bodyW.source === 'metrics'
        ? t('endurance.gtg.protocolData.weightSourceToday')
        : bodyW.source === 'quiz'
          ? t('endurance.gtg.protocolData.weightSourceQuiz')
          : bodyW.source === 'gtg'
            ? t('endurance.gtg.protocolData.weightSourceGtg')
            : null;

  const summaryBits = [];
  if (bodyW.known) summaryBits.push(`${bodyW.kg} kg`);
  const declaredCount = rows.filter((r) => r.hasDeclaredMax).length;
  summaryBits.push(`${declaredCount}/${rows.length} max`);
  if (gaps.incomplete) {
    summaryBits.push(t('endurance.gtg.protocolData.needsData'));
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br from-black via-slate-950 to-amber-950/20 ${
        gaps.incomplete ? 'border-amber-500/45' : 'border-amber-500/25'
      }`}
    >
      <button
        type="button"
        onClick={toggleCollapse}
        className="flex w-full items-start justify-between gap-3 border-b border-amber-500/20 px-5 py-4 text-left hover:bg-amber-950/10"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5">
            <ClipboardList className="h-5 w-5 text-amber-200" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">
              {t('endurance.gtg.protocolData.title')}
            </h4>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {collapsed
                ? summaryBits.join(' · ')
                : t('endurance.gtg.protocolData.hint')}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
          {collapsed
            ? t('endurance.gtg.protocolData.expand')
            : t('endurance.gtg.protocolData.collapse')}
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-slate-700/50 bg-black/40 p-3.5">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm font-medium text-amber-100">
              <span>{t('endurance.gtg.protocolData.weightLabel')}</span>
              {bodyW.known ? (
                <span className="rounded-md border border-emerald-500/35 bg-emerald-950/30 px-2 py-0.5 text-[11px] font-normal text-emerald-200">
                  {bodyW.kg} kg
                  {sourceLabel ? ` · ${sourceLabel}` : ''}
                  {bodyW.dateYmd ? ` · ${bodyW.dateYmd}` : ''}
                </span>
              ) : null}
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {bodyW.known && (bodyW.source === 'impedance' || bodyW.source === 'metrics')
                ? t('endurance.gtg.protocolData.weightIndexedHint')
                : t('endurance.gtg.protocolData.weightHint')}
            </p>
            {(!bodyW.known || bodyW.source === 'gtg' || bodyW.source === 'quiz') && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={30}
                  max={250}
                  step={0.1}
                  inputMode="decimal"
                  placeholder={bodyW.kg ? String(bodyW.kg) : 'ex. 72'}
                  value={weightDraft}
                  onChange={(e) => setWeightDraft(e.target.value)}
                  className="w-28 rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white"
                />
                <span className="text-xs text-slate-500">kg</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSaveWeight}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/45 bg-amber-950/40 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-950/60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('endurance.gtg.protocolData.save')}
                </button>
              </div>
            )}
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className={`rounded-xl border p-3.5 ${
                !row.hasDeclaredMax || !row.hasReps
                  ? 'border-amber-500/35 bg-amber-950/15'
                  : 'border-slate-700/50 bg-black/40'
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-white">{row.label}</div>
                {row.hasDeclaredMax && row.hasReps ? (
                  <span className="text-[10px] text-emerald-300/80">
                    {t('endurance.gtg.protocolData.rowReady')}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-200/80">
                    {t('endurance.gtg.protocolData.rowNeeds')}
                  </span>
                )}
              </div>
              <p className="mb-3 text-[11px] text-slate-500">
                {t('endurance.gtg.protocolData.rowHint')}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                    {t('endurance.gtg.protocolData.maxUnit')}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    inputMode="numeric"
                    placeholder={row.max ? String(row.max) : '—'}
                    value={getDraft(row.id, 'max', row.hasDeclaredMax ? row.max : '')}
                    onChange={(e) => setDraft(row.id, 'max', e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                    {t('endurance.gtg.protocolData.goalLabel')}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    inputMode="numeric"
                    placeholder={row.goal ? String(row.goal) : '—'}
                    value={getDraft(row.id, 'goal', row.hasDeclaredGoal ? row.goal : '')}
                    onChange={(e) => setDraft(row.id, 'goal', e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                    {t('endurance.gtg.protocolData.repsLabel')}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    inputMode="numeric"
                    placeholder={row.reps ? String(row.reps) : '—'}
                    value={getDraft(row.id, 'reps', row.reps)}
                    onChange={(e) => setDraft(row.id, 'reps', e.target.value)}
                    className="w-full rounded-lg border border-violet-500/40 bg-violet-950/20 px-3 py-2 text-sm text-violet-50"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSaveRow(row)}
                  className="rounded-lg border border-violet-500/45 bg-violet-950/40 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-950/60"
                >
                  {t('endurance.gtg.protocolData.save')}
                </button>
                <span className="text-[10px] text-slate-500">
                  {t('endurance.gtg.protocolData.syncNote')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
