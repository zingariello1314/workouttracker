import React, { useMemo } from 'react';
import { Lightbulb, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { buildGtgAnalyticsBundle } from '../../../../services/endurance/gtgAnalyticsService';
import {
  collectGtgMiniSetHistory,
  getGtgExerciseLabel,
  normalizeGtgData
} from '../../../../services/endurance/gtgService';
import EnduranceDisciplineStatsPanel from '../../../sport/charts/EnduranceDisciplineStatsPanel.jsx';

const toneClass = {
  positive: 'border-emerald-600/45 bg-emerald-950/25 text-emerald-100',
  tip: 'border-violet-500/40 bg-violet-950/20 text-violet-100',
  warn: 'border-amber-600/45 bg-amber-950/20 text-amber-100'
};

function RankingList({ title, items, valueKey, suffix = '', icon = null }) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
          {icon}
          {title}
        </h4>
        <p className="text-xs text-slate-500">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
      <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-white">
        {icon}
        {title}
      </h4>
      <ol className="space-y-2">
        {items.map((item, idx) => (
          <li key={item.exerciseId} className="flex items-center justify-between text-sm">
            <span className="text-slate-200">
              <span className="mr-2 text-violet-300/80">{idx + 1}.</span>
              {item.label}
            </span>
            <span className="tabular-nums text-teal-200/90">
              {item[valueKey]}
              {suffix}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function GtgStatsPanel({ gtgData, ctx, activeProgram }) {
  const t = useTranslation();
  const ctxWithT = useMemo(() => ({ ...ctx, t }), [ctx, t]);

  const analytics = useMemo(
    () => buildGtgAnalyticsBundle({ gtgData, ctx: ctxWithT, activeProgram }),
    [gtgData, ctxWithT, activeProgram]
  );

  const recentSeries = useMemo(() => {
    const normalized = normalizeGtgData(gtgData);
    const rows = collectGtgMiniSetHistory(normalized, analytics.start28, analytics.endYmd, ctxWithT);
    return rows.slice(-40).reverse();
  }, [gtgData, analytics.start28, analytics.endYmd, ctxWithT]);

  const { rankings, suggestions, programGaps, window } = analytics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('endurance.gtg.stats.miniSets28'), value: rankings.totalMiniSets },
          { label: t('endurance.gtg.stats.reps28'), value: rankings.totalReps },
          { label: t('endurance.gtg.stats.activeDays28'), value: window.daysWithAny },
          { label: t('endurance.gtg.stats.fullDays28'), value: window.daysAt100 }
        ].map((chip) => (
          <div
            key={chip.label}
            className="rounded-xl border border-violet-500/35 bg-violet-950/20 px-3 py-3 text-center"
          >
            <div className="text-[10px] uppercase tracking-wide text-violet-200/70">{chip.label}</div>
            <div className="text-2xl font-bold tabular-nums text-white">{chip.value}</div>
          </div>
        ))}
      </div>

      <EnduranceDisciplineStatsPanel
        kind="gtg"
        gtgPayload={{ gtgData, ctx: ctxWithT }}
      />

      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-300" />
          <h3 className="text-lg font-semibold text-white">{t('endurance.gtg.stats.coachTitle')}</h3>
        </div>
        <p className="mb-4 text-xs text-slate-400">{t('endurance.gtg.stats.coachHint')}</p>
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-500">{t('endurance.gtg.stats.noSuggestions')}</p>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${toneClass[s.tone] || toneClass.tip}`}
              >
                {t(`endurance.gtg.stats.suggestion.${s.templateKey}`, s.payload)}
              </div>
            ))
          )}
        </div>
      </div>

      {programGaps.length > 0 && (
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-300" />
            <h3 className="text-sm font-semibold text-white">{t('endurance.gtg.stats.programTitle')}</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500">{t('endurance.gtg.stats.programHint')}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2 pr-3">{t('endurance.gtg.stats.colExercise')}</th>
                  <th className="pb-2 pr-3">{t('endurance.gtg.stats.colPlanned')}</th>
                  <th className="pb-2 pr-3">{t('endurance.gtg.stats.colActual')}</th>
                  <th className="pb-2">{t('endurance.gtg.stats.colRatio')}</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {programGaps.slice(0, 8).map((g) => (
                  <tr key={g.exerciseId} className="border-t border-slate-800/80">
                    <td className="py-2 pr-3 font-medium">{g.name}</td>
                    <td className="py-2 pr-3 tabular-nums">{g.plannedReps28}</td>
                    <td className="py-2 pr-3 tabular-nums">{g.actualReps28}</td>
                    <td className="py-2 tabular-nums">
                      <span className={g.ratio < 0.55 ? 'text-amber-300' : 'text-emerald-300'}>
                        {Math.round(g.ratio * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          title={t('endurance.gtg.stats.mostDone')}
          items={rankings.mostDone}
          valueKey="miniSetsDone"
          suffix={` ${t('endurance.gtg.stats.miniSetsShort')}`}
        />
        <RankingList
          icon={<TrendingDown className="h-4 w-4 text-slate-400" />}
          title={t('endurance.gtg.stats.leastDone')}
          items={rankings.leastDone}
          valueKey="miniSetsDone"
          suffix={` ${t('endurance.gtg.stats.miniSetsShort')}`}
        />
        <RankingList
          title={t('endurance.gtg.stats.mostRegular')}
          items={rankings.mostRegular}
          valueKey="daysActive"
          suffix={` ${t('endurance.gtg.stats.daysShort')}`}
        />
        <RankingList
          title={t('endurance.gtg.stats.leastRegular')}
          items={rankings.leastRegular}
          valueKey="daysActive"
          suffix={` ${t('endurance.gtg.stats.daysShort')}`}
        />
      </div>

      <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">{t('endurance.gtg.stats.recentSeries')}</h3>
        {recentSeries.length === 0 ? (
          <p className="text-sm text-slate-500">{t('endurance.gtg.stats.noSeries')}</p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {recentSeries.map((row) => (
              <div
                key={`${row.dateStr}-${row.slotIndex}-${row.exerciseId}`}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-xs"
              >
                <span className="text-slate-300">
                  {row.dateStr} · {row.time}
                </span>
                <span className="text-white">
                  {getGtgExerciseLabel(row.exerciseId, normalizeGtgData(gtgData).config, ctxWithT)} — {row.reps}{' '}
                  {t('endurance.gtg.repsShort')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
