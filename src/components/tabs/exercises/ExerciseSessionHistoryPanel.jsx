import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  formatScoringUnitLabel,
  summarizeUserSessionHistory
} from '../../../utils/exerciseScoringResolver';
import { formatCalendarExerciseRecordedValue } from '../../../utils/exerciseCalculations';

const PAGE_SIZE = 25;

/**
 * Historique séances utilisateur (volume + ressenti) — n'influence pas le référentiel officiel.
 */
export default function ExerciseSessionHistoryPanel({
  exercise,
  sessions,
  scoringUnit = 'reps'
}) {
  const t = useTranslation();
  const summary = summarizeUserSessionHistory(sessions);
  const unitLabel = formatScoringUnitLabel(scoringUnit);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleSessions = useMemo(
    () => (sessions || []).slice(0, visibleCount),
    [sessions, visibleCount]
  );
  const hasMore = (sessions?.length || 0) > visibleCount;

  if (!sessions?.length) {
    return (
      <div className="rounded-lg border border-[#0F4C5C]/45 bg-black/60 p-3 text-xs text-slate-500">
        {t(
          'exercisesTab.detail.historyEmpty',
          'Aucune séance enregistrée pour cet exercice. Coche-le dans Aujourd’hui pour commencer l’historique.'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-md border border-[#0F4C5C]/40 bg-black/50 px-2 py-2">
          <div className="text-lg font-bold tabular-nums text-teal-100">{summary.count}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Séances</div>
        </div>
        <div className="rounded-md border border-[#0F4C5C]/40 bg-black/50 px-2 py-2">
          <div className="text-lg font-bold tabular-nums text-teal-100">
            {summary.totalVolume.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
            Vol. cumulé ({unitLabel})
          </div>
        </div>
        <div className="rounded-md border border-[#0F4C5C]/40 bg-black/50 px-2 py-2">
          <div className="text-lg font-bold tabular-nums text-amber-200">
            {summary.avgUserStars != null ? `${summary.avgUserStars}/5` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Ressenti moy.</div>
        </div>
        <div className="rounded-md border border-[#0F4C5C]/40 bg-black/50 px-2 py-2">
          <div className="text-lg font-bold tabular-nums text-emerald-200">
            {summary.avgPleasureStars != null ? `${summary.avgPleasureStars}/5` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Plaisir moy.</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-snug">
        {t(
          'exercisesTab.detail.historyDisclaimer',
          'Le ressenti enregistré ici est indicatif : il ne modifie ni les étoiles du référentiel ni l’XP.'
        )}
      </p>

      <div className="overflow-x-auto rounded-lg border border-[#0F4C5C]/40">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-[#0F4C5C]/35 text-slate-500 uppercase tracking-wide text-[10px]">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Volume</th>
              <th className="px-3 py-2 font-medium">Charge</th>
              <th className="px-3 py-2 font-medium">Ressenti</th>
            </tr>
          </thead>
          <tbody>
            {visibleSessions.map((row) => {
              const display = formatCalendarExerciseRecordedValue(
                { ...exercise, series: exercise?.series || '' },
                row.reps
              );
              return (
                <tr
                  key={row.key}
                  className="border-b border-[#0F4C5C]/20 last:border-0 hover:bg-[#0F4C5C]/10"
                >
                  <td className="px-3 py-2 tabular-nums text-slate-300">{row.dateStr}</td>
                  <td className="px-3 py-2 tabular-nums text-white">
                    {display.displayText || `${row.reps} ${unitLabel}`}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-400">
                    {row.weightKg != null && row.weightKg > 0
                      ? `${Math.round(row.weightKg * 10) / 10} kg`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-amber-200/90">
                    {row.stars != null ? `${row.stars}/5` : '—'}
                    {row.pleasureStars != null ? (
                      <span className="text-emerald-400/80 ml-1">· {row.pleasureStars}♥</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          className="w-full rounded-md border border-[#0F4C5C]/45 bg-black/40 px-3 py-2 text-xs text-teal-300/90 hover:bg-[#0F4C5C]/20 transition-colors"
        >
          {t('exercisesTab.detail.historyLoadMore', 'Voir plus')} (
          {sessions.length - visibleCount} restantes)
        </button>
      ) : null}
    </div>
  );
}
