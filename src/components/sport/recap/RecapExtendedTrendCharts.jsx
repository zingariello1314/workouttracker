import React, { useMemo } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import {
  aggregateGainageSecondsByDate,
  aggregateJumpropeJumpsByDate,
  aggregatePushupRepsByDate
} from '../../../utils/sport/enduranceDailyAggregates';
import { buildDenseDailyPoints } from '../../../utils/sport/dailyDenseTimeSeries';

const chartCardClass =
  'rounded-xl border border-[#0F4C5C]/45 bg-gradient-to-b from-slate-950/70 to-black p-3 shadow-[inset_0_0_24px_rgba(15,76,92,0.12)]';

/**
 * Graphiques additionnels alimentés par le bundle d'enrichissement Récap.
 */
export default function RecapExtendedTrendCharts({ enrichment, chartHeight = 160 }) {
  const { getCurrentData, data } = useWorkout();

  const enduranceCharts = useMemo(() => {
    const snap = getCurrentData();
    const end = enrichment?.window?.end;
    const start = enrichment?.window?.start ?? enrichment?.completionDaily?.[0]?.date ?? end;
    if (!end) return null;

    const pushups = aggregatePushupRepsByDate(snap?.enduranceData?.sessions?.pushups);
    const jumprope = aggregateJumpropeJumpsByDate(snap?.enduranceData?.sessions?.jumprope);
    const gainage = aggregateGainageSecondsByDate(snap?.enduranceData?.sessions?.gainage);

    return {
      pushups: buildDenseDailyPoints(pushups, start, end),
      jumprope: buildDenseDailyPoints(jumprope, start, end),
      gainage: buildDenseDailyPoints(gainage, start, end)
    };
  }, [data, getCurrentData, enrichment?.window]);

  if (!enrichment) return null;

  const {
    completionDaily = [],
    stretchDaily = [],
    weight,
    sleepDaily = [],
    feedbackDifficultyDaily = []
  } = enrichment;

  const hasEndurance =
    enduranceCharts &&
    (enduranceCharts.pushups.some((p) => p.value > 0) ||
      enduranceCharts.jumprope.some((p) => p.value > 0) ||
      enduranceCharts.gainage.some((p) => p.value > 0));

  const charts = [
    {
      key: 'completion',
      title: 'Complétion programme (% / jour)',
      series: completionDaily,
      color: '#2dd4bf',
      label: '%',
      format: (v) => `${Math.round(v)}%`
    },
    {
      key: 'stretch',
      title: 'Étirements cochés / jour',
      series: stretchDaily,
      color: '#a78bfa',
      label: 'étirements'
    },
    weight?.hasData
      ? {
          key: 'weight',
          title: 'Poids (kg)',
          series: weight.series,
          color: '#fbbf24',
          label: 'kg',
          format: (v) => (v > 0 ? v.toFixed(1) : '—')
        }
      : null,
    sleepDaily.length > 0 && sleepDaily.some((p) => p.value > 0)
      ? {
          key: 'sleep',
          title: 'Sommeil Garmin (h)',
          series: sleepDaily,
          color: '#6366f1',
          label: 'h',
          format: (v) => (v > 0 ? v.toFixed(1) : '—')
        }
      : null,
    feedbackDifficultyDaily.some((p) => p.value > 0)
      ? {
          key: 'difficulty',
          title: 'Difficulté ressentie (feedback)',
          series: feedbackDifficultyDaily,
          color: '#fb7185',
          label: '/10'
        }
      : null
  ].filter(Boolean);

  return (
    <section className="space-y-4">
      {charts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {charts.map((c) => (
            <div key={c.key} className={chartCardClass}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">{c.title}</h3>
              <DenseDailyLineChart
                seriesA={c.series.map((p) => ({ date: p.date, value: p.value }))}
                metaA={{ label: c.label, color: c.color }}
                valueFormatA={c.format}
                height={chartHeight}
              />
            </div>
          ))}
        </div>
      ) : null}

      {hasEndurance ? (
        <div className="rounded-xl border border-[#0F4C5C]/70 bg-black p-4 space-y-3">
          <h2 className="text-sm font-semibold text-teal-100">Endurance complémentaire</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={chartCardClass}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-pink-200/90">Pompes / jour</h3>
              <DenseDailyLineChart
                seriesA={enduranceCharts.pushups.map((p) => ({ date: p.date, value: p.value }))}
                metaA={{ label: 'reps', color: '#f472b6' }}
                height={chartHeight}
              />
            </div>
            <div className={chartCardClass}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-200/90">Corde / jour</h3>
              <DenseDailyLineChart
                seriesA={enduranceCharts.jumprope.map((p) => ({ date: p.date, value: p.value }))}
                metaA={{ label: 'sauts', color: '#a78bfa' }}
                height={chartHeight}
              />
            </div>
            <div className={chartCardClass}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Gainage (s / jour)</h3>
              <DenseDailyLineChart
                seriesA={enduranceCharts.gainage.map((p) => ({ date: p.date, value: p.value }))}
                metaA={{ label: 's', color: '#34d399' }}
                height={chartHeight}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
