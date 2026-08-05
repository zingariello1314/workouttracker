import React, { useMemo } from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useTranslation } from '../../../utils/translations';
import {
  computeRecapMuscleState,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
} from '../../../utils/sport/recapMuscleLoadEngine';
import { getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';

function formatExerciseLabel(row, t) {
  const raw = row.name || row.exerciseId || '';
  if (raw === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID) {
    return t('anatomy.endurancePushupsLabel', 'Pompes (onglet Endurance)');
  }
  if (String(raw).startsWith('__recap_')) {
    return t('anatomy.syntheticExercise', 'Volume agrégé');
  }
  return raw;
}

export default function AnatomyMuscleProgramBridge({ muscleId }) {
  const t = useTranslation();
  const { getCurrentData, getExerciseNameById, setActiveTab } = useWorkout();
  const muscle = getAnatomyMuscle(muscleId);
  const groupId = muscle?.visualGroupId;

  const insight = useMemo(() => {
    if (!groupId) return null;
    const data = getCurrentData?.();
    if (!data) return null;
    const state = computeRecapMuscleState(data, '7d', getExerciseNameById, new Date());
    const share = Math.round(state.repShareByGroup?.[groupId] ?? 0);
    const top = (state.topExercisesByGroup?.[groupId] || []).slice(0, 4);
    const maxShare = Math.max(1, ...top.map((r) => r.repsShare || 0));
    return { share, top, maxShare, window: state.window };
  }, [groupId, getCurrentData, getExerciseNameById]);

  if (!insight || !groupId) return null;

  return (
    <section className="rounded-2xl border border-slate-600/30 bg-slate-900/40 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-stretch divide-y sm:divide-y-0 sm:divide-x divide-slate-700/40">
        <div className="sm:w-[38%] p-5 flex flex-col justify-center gap-2 bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">
            <BarChart3 className="h-3.5 w-3.5 text-cyan-500/80" />
            {t('anatomy.momentumLink', 'Ton entraînement · 7 jours')}
          </div>
          <div className="text-3xl font-bold text-white tabular-nums">{insight.share}</div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {t('anatomy.momentumShareShort', 'Reps force (zone Récap) · {{start}} → {{end}}', {
              start: insight.window?.start || '—',
              end: insight.window?.end || '—'
            })}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('recap')}
            className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 hover:text-cyan-300 w-fit"
          >
            {t('anatomy.openRecap', 'Récap corps')}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 p-5 min-w-0">
          {insight.top.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {insight.top.map((row) => {
                const label = formatExerciseLabel(row, t);
                const pct = Math.round(((row.repsShare || 0) / insight.maxShare) * 100);
                return (
                  <div
                    key={row.exerciseId ?? label}
                    className="rounded-xl border border-slate-700/35 bg-black/25 px-3 py-2.5"
                  >
                    <div className="text-xs text-slate-200 truncate mb-1.5" title={label}>
                      {label}
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                      {Math.round(row.repsShare || 0)} {t('anatomy.repsShare', 'parts de reps')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('anatomy.noRecentVolume', 'Peu ou pas de volume récent sur cette zone.')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
