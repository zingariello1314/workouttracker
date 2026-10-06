import React, { useMemo, useState } from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import {
  estimateGtgMaxFromWorkingReps,
  getGtgExerciseLabel,
  resolveGtgBodyWeightKg,
  resolveGtgMaxReps,
  todayYmd,
  updateGtgConfig,
  updateGtgProtocolExercise
} from '../../../../services/endurance/gtgService';
import { applyGtgDeclaredMaxToData } from '../../../../services/endurance/gtgMaxPerformance';

/**
 * Bandeau optionnel : max par exo + poids pour personnaliser le protocole
 * (exemples de volume, % de lest, RIR) — souple, pas d’obligation.
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
    () => resolveGtgBodyWeightKg(gtgData, { workoutData: data, profileQuestionnaire: ctx?.profileQuestionnaire }),
    [gtgData, data, ctx?.profileQuestionnaire]
  );

  const gaps = useMemo(() => {
    const missingMax = [];
    selectedIds.forEach((id) => {
      const proto = gtgData.config.protocolByExercise?.[id] || {};
      const workingRepsRaw = gtgData.config.perExercise?.[id]?.repsPerSet;
      const workingReps =
        Number.isFinite(Number(workingRepsRaw)) && Number(workingRepsRaw) > 0
          ? Math.round(Number(workingRepsRaw))
          : null;
      const estimated = workingReps != null ? estimateGtgMaxFromWorkingReps(workingReps) : null;
      const resolved = resolveGtgMaxReps(id, ctx);
      const hasDeclared = proto.currentMax > 0;
      if (!hasDeclared) {
        missingMax.push({
          id,
          label: getGtgExerciseLabel(id, gtgData.config, ctx),
          draft: estimated || resolved || ''
        });
      }
    });
    return {
      missingMax,
      needWeight: !bodyW.known,
      weightDraft: bodyW.kg || ''
    };
  }, [selectedIds, gtgData, ctx, bodyW]);

  const [maxDrafts, setMaxDrafts] = useState({});
  const [weightDraft, setWeightDraft] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const show = !dismissed && selectedIds.length > 0 && (gaps.missingMax.length > 0 || gaps.needWeight);
  if (!show) return null;

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

  const onSaveMax = async (id) => {
    const raw = maxDrafts[id] ?? gaps.missingMax.find((g) => g.id === id)?.draft;
    const n = Math.round(Number(String(raw).replace(',', '.')));
    if (!Number.isFinite(n) || n <= 0) return;
    const next = updateGtgProtocolExercise(gtgData, id, { currentMax: n });
    await persist(next, { exerciseId: id, reps: n });
  };

  const onSaveWeight = async () => {
    const n = Number(String(weightDraft || gaps.weightDraft).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    const next = updateGtgConfig(gtgData, { bodyWeightKg: Math.round(n * 10) / 10 });
    await persist(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-black via-slate-950 to-amber-950/20">
      <div className="flex flex-col gap-3 border-b border-amber-500/20 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5">
            <ClipboardList className="h-5 w-5 text-amber-200" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">
              {t('endurance.gtg.protocolData.title')}
            </h4>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {t('endurance.gtg.protocolData.hint')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-[11px] text-slate-500 hover:text-slate-300"
        >
          {t('endurance.gtg.protocolData.later')}
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        {gaps.needWeight && (
          <div className="rounded-xl border border-slate-700/50 bg-black/40 p-3.5">
            <div className="mb-1 text-sm font-medium text-amber-100">
              {t('endurance.gtg.protocolData.weightLabel')}
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {t('endurance.gtg.protocolData.weightHint')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={30}
                max={250}
                step={0.1}
                inputMode="decimal"
                placeholder="ex. 72"
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
          </div>
        )}

        {gaps.missingMax.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-slate-700/50 bg-black/40 p-3.5"
          >
            <div className="mb-1 text-sm font-medium text-white">{row.label}</div>
            <p className="mb-2 text-[11px] text-slate-500">
              {t('endurance.gtg.protocolData.maxHint')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                placeholder={String(row.draft || '')}
                value={maxDrafts[row.id] ?? ''}
                onChange={(e) =>
                  setMaxDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
                className="w-28 rounded-lg border border-slate-600 bg-black px-3 py-2 text-sm text-white"
              />
              <span className="text-xs text-slate-500">
                {t('endurance.gtg.protocolData.maxUnit')}
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSaveMax(row.id)}
                className="rounded-lg border border-violet-500/45 bg-violet-950/40 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-950/60"
              >
                {t('endurance.gtg.protocolData.save')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
