import React, { useMemo } from 'react';
import { Activity, Gauge, Lightbulb, TrendingDown, TrendingUp, BarChart3, Target } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { buildGtgAnalyticsBundle } from '../../../../services/endurance/gtgAnalyticsService';
import {
  collectGtgMiniSetHistory,
  defaultGtgProtocolGoal,
  getGtgExerciseLabel,
  normalizeGtgData,
  resolveGtgMaxReps
} from '../../../../services/endurance/gtgService';
import { GTG_DAY_FEEL_ORDER } from '../../../../services/endurance/gtgProtocolSignals';
import EnduranceDisciplineStatsPanel from '../../../sport/charts/EnduranceDisciplineStatsPanel.jsx';
import { ZONE_STYLE } from './GtgProtocolPracticeStrip';

const toneClass = {
  positive: 'border-emerald-600/45 bg-emerald-950/25 text-emerald-100',
  tip: 'border-violet-500/40 bg-violet-950/20 text-violet-100',
  warn: 'border-amber-600/45 bg-amber-950/20 text-amber-100'
};

const FEEL_BAR = {
  easy: 'bg-emerald-500/80',
  stable: 'bg-sky-500/80',
  drift: 'bg-amber-500/80',
  hard: 'bg-rose-500/80'
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

  const { rankings, suggestions, programGaps, window, protocol } = analytics;
  const feelCounts = protocol?.feelCounts || { easy: 0, stable: 0, drift: 0, hard: 0 };
  const loggedFeels = protocol?.loggedFeels || 0;

  const goalRows = useMemo(() => {
    const normalized = normalizeGtgData(gtgData);
    return (normalized.config.selectedIds || []).map((id) => {
      const proto = normalized.config.protocolByExercise?.[id] || {};
      const max =
        proto.currentMax > 0
          ? Math.round(proto.currentMax)
          : Math.round(resolveGtgMaxReps(id, ctxWithT) || 0);
      const goal =
        proto.goal > 0 ? Math.round(proto.goal) : max > 0 ? defaultGtgProtocolGoal(max) : 0;
      const pct = max > 0 && goal > 0 ? Math.min(100, Math.round((max / goal) * 100)) : 0;
      return {
        id,
        label: getGtgExerciseLabel(id, normalized.config, ctxWithT),
        max,
        goal,
        pct,
        dose: (protocol?.doses || []).find((d) => d.exerciseId === id)
      };
    });
  }, [gtgData, ctxWithT, protocol?.doses]);

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

      {goalRows.length > 0 && (
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-300" />
            <h3 className="text-sm font-semibold text-white">{t('endurance.gtg.stats.goalTitle')}</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500">{t('endurance.gtg.stats.goalHint')}</p>
          <div className="space-y-3">
            {goalRows.map((row) => (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{row.label}</span>
                  <span className="tabular-nums text-teal-200/90">
                    {row.max || '—'} → {row.goal || '—'}
                    {row.dose ? ` · ${row.dose.repsPerSet}/pass · RIR ${row.dose.rir ?? '—'}` : ''}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-teal-500/80 transition-all"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/45 bg-slate-950/40 px-4 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {t('endurance.gtg.stats.trackMapTitle')}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-slate-400">
          <div>
            <span className="text-emerald-300/90">●</span> {t('endurance.gtg.stats.trackVolume')}
          </div>
          <div>
            <span className="text-emerald-300/90">●</span> {t('endurance.gtg.stats.trackDose')}
          </div>
          <div>
            <span className="text-emerald-300/90">●</span> {t('endurance.gtg.stats.trackFeel')}
          </div>
          <div>
            <span className="text-amber-300/90">○</span> {t('endurance.gtg.stats.trackSoft')}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-black via-slate-950 to-teal-950/20">
        <div className="border-b border-teal-500/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-teal-500/35 bg-teal-950/40 p-2.5">
              <Gauge className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('endurance.gtg.stats.protocolTitle')}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{t('endurance.gtg.stats.protocolHint')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          {(protocol?.doses || []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('endurance.gtg.protocolTrack.noExercises')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2 pr-3">{t('endurance.gtg.stats.colExercise')}</th>
                    <th className="pb-2 pr-3">{t('endurance.gtg.stats.colDose')}</th>
                    <th className="pb-2 pr-3">{t('endurance.gtg.stats.colRir')}</th>
                    <th className="pb-2 pr-3">{t('endurance.gtg.stats.colZone')}</th>
                    <th className="pb-2">{t('endurance.gtg.stats.colSignals')}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {protocol.doses.map((d) => (
                    <tr key={d.exerciseId} className="border-t border-slate-800/80">
                      <td className="py-2.5 pr-3 font-medium">{d.label}</td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {d.repsPerSet}/{d.maxReps || '—'}
                        {d.pctOfMax != null ? ` · ${d.pctOfMax}%` : ''}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{d.rir != null ? d.rir : '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                            ZONE_STYLE[d.zone] || ZONE_STYLE.conservative
                          }`}
                        >
                          {t(`endurance.gtg.protocolTrack.zone.${d.zone}`)}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(d.signals?.priority || []).slice(0, 3).map((sig) => (
                            <span
                              key={sig}
                              className="rounded-full border border-teal-500/25 bg-teal-950/20 px-1.5 py-0.5 text-[10px] text-teal-100/90"
                            >
                              {t(`endurance.gtg.protocolTrack.signal.${sig}`)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border border-slate-700/45 bg-slate-950/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
              <Activity className="h-4 w-4 text-amber-300" />
              {t('endurance.gtg.stats.feelTitle')}
            </div>
            <p className="mb-3 text-[11px] text-slate-500">{t('endurance.gtg.stats.feelHint')}</p>
            {loggedFeels === 0 ? (
              <p className="text-sm text-slate-500">{t('endurance.gtg.stats.feelEmpty')}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                  {GTG_DAY_FEEL_ORDER.map((feel) => {
                    const n = feelCounts[feel] || 0;
                    if (!n) return null;
                    return (
                      <div
                        key={feel}
                        className={`${FEEL_BAR[feel]} transition-all`}
                        style={{ width: `${(n / loggedFeels) * 100}%` }}
                        title={`${t(`endurance.gtg.protocolTrack.feel.${feel}`)}: ${n}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                  {GTG_DAY_FEEL_ORDER.map((feel) => (
                    <span key={feel} className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${FEEL_BAR[feel]}`} />
                      {t(`endurance.gtg.protocolTrack.feel.${feel}`)} · {feelCounts[feel] || 0}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
