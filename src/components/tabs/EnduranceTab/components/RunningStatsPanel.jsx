import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Heart,
  Trophy,
  TrendingUp,
  Info
} from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import DenseDailyLineChart from '../../../sport/charts/DenseDailyLineChart';
import SessionSeriesLineChart from '../../../sport/charts/SessionSeriesLineChart';
import RunningStatsPeriodPicker from './RunningStatsPeriodPicker';
import {
  buildRunningSessionRows,
  buildCardioSessionSeries,
  buildEfProgressionRows,
  buildKmDailyChartFromRows,
  computeRunningStatsRecords,
  computeEfEfficiencyBonus,
  computePeriodVolumeSummary,
  computeRunningDataCoverage,
  estimateMaxHeartRate,
  formatPaceMinPerKm,
  EF_HR_PCT_MIN,
  EF_HR_PCT_MAX
} from '../../../../utils/sport/runningCardioStatsAnalytics';
import {
  RUNNING_HR_ZONES,
  heartRateZoneBoundsBpm
} from '../../../../utils/runningHeartRateModel';
import RunningTrainingInsightsPanel from './RunningTrainingInsightsPanel';
import { formatChartDateDayMonth } from '../../../../utils/sport/dailyDenseTimeSeries';

const CARDIO_FILTERS = [
  { id: 'all', labelKey: 'endurance.running.stats.filterAll' },
  { id: 'endurance', labelKey: 'endurance.running.stats.filterEndurance' },
  { id: 'interval', labelKey: 'endurance.running.stats.filterInterval' },
  { id: 'competition', labelKey: 'endurance.running.stats.filterCompetition' }
];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#0F4C5C]/50 bg-black/80 p-4">
      <div className="mb-1 flex items-center gap-2 text-teal-600">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      {sub ? <p className="mt-1 text-[11px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

function CoverageBanner({ coverage, t }) {
  if (!coverage || coverage.sessions === 0) {
    return (
      <p className="mb-4 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-100/85">
        {t('endurance.running.stats.noDataInPeriod')}
      </p>
    );
  }
  return (
    <p className="mb-4 rounded-lg border border-[#0F4C5C]/40 bg-slate-900/40 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
      {t('endurance.running.stats.coverageBanner', {
        sessions: coverage.sessions,
        withDistance: coverage.withDistance,
        withPace: coverage.withPace,
        withAvgHr: coverage.withAvgHr,
        withGarmin: coverage.withGarmin
      })}
    </p>
  );
}

function SectionHeader({ icon: Icon, iconClass, title, hint, period, onPeriodChange }) {
  const t = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconClass}`} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
      </div>
      <div className="shrink-0">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-teal-700">{t('endurance.running.stats.periodLabel')}</p>
        <RunningStatsPeriodPicker value={period} onChange={onPeriodChange} />
      </div>
    </div>
  );
}

const RunningStatsPanel = ({
  sessions = [],
  garminById = null,
  garminRunningKindByGarminId = null,
  classificationCtx = null
}) => {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [cardioFilter, setCardioFilter] = useState('all');
  const [volumePeriod, setVolumePeriod] = useState('30');
  const [cardioPeriod, setCardioPeriod] = useState('90');
  const [efPeriod, setEfPeriod] = useState('365');
  const [recordsPeriod, setRecordsPeriod] = useState('all');

  const rows = useMemo(
    () =>
      buildRunningSessionRows(
        sessions,
        garminById,
        classificationCtx || {},
        garminRunningKindByGarminId
      ),
    [sessions, garminById, garminRunningKindByGarminId, classificationCtx]
  );

  const fcMax = useMemo(
    () =>
      estimateMaxHeartRate(sessions, garminById, {
        ageYears: classificationCtx?.age ?? null,
        garminCardioActivities: garminById instanceof Map ? [...garminById.values()] : null
      }),
    [sessions, garminById, classificationCtx]
  );

  const hrZonesLegend = useMemo(() => {
    return RUNNING_HR_ZONES.map((z) => {
      const bounds = heartRateZoneBoundsBpm(fcMax, z.zone);
      return { ...z, bounds };
    });
  }, [fcMax]);

  const volumeSummary = useMemo(
    () => computePeriodVolumeSummary(rows, volumePeriod),
    [rows, volumePeriod]
  );

  const volumeCoverage = useMemo(
    () => computeRunningDataCoverage(rows, volumePeriod),
    [rows, volumePeriod]
  );

  const kmDailyChart = useMemo(
    () => buildKmDailyChartFromRows(rows, volumePeriod),
    [rows, volumePeriod]
  );

  const cardioSeries = useMemo(
    () => buildCardioSessionSeries(rows, cardioFilter, cardioPeriod),
    [rows, cardioFilter, cardioPeriod]
  );

  const cardioCoverage = useMemo(
    () => computeRunningDataCoverage(rows, cardioPeriod),
    [rows, cardioPeriod]
  );

  const efRows = useMemo(() => buildEfProgressionRows(rows, efPeriod), [rows, efPeriod]);
  const efBonus = useMemo(() => computeEfEfficiencyBonus(efRows), [efRows]);
  const efCoverage = useMemo(
    () => computeRunningDataCoverage(rows, efPeriod),
    [rows, efPeriod]
  );

  const records = useMemo(
    () => computeRunningStatsRecords(rows, recordsPeriod),
    [rows, recordsPeriod]
  );

  const recordsCoverage = useMemo(
    () => computeRunningDataCoverage(rows, recordsPeriod),
    [rows, recordsPeriod]
  );

  const hasKmChart = kmDailyChart.some((p) => p.value > 0);
  const sectionClass = 'rounded-2xl border border-[#0F4C5C]/55 bg-black p-5';

  return (
    <div className="space-y-6">
      <RunningTrainingInsightsPanel
        sessions={sessions}
        garminById={garminById}
        garminRunningKindByGarminId={garminRunningKindByGarminId}
      />
      {/* Bloc 1 — Volume */}
      <section className={sectionClass}>
        <SectionHeader
          icon={BarChart3}
          iconClass="text-sky-400"
          title={t('endurance.running.stats.volumeTitle')}
          period={volumePeriod}
          onPeriodChange={setVolumePeriod}
        />
        <CoverageBanner coverage={volumeCoverage} t={t} />
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Activity}
            label={t('endurance.running.stats.periodKmTotal')}
            value={`${volumeSummary.km} km`}
            sub={t('endurance.running.stats.withDistanceCount', { count: volumeSummary.withDistance })}
          />
          <StatCard
            icon={BarChart3}
            label={t('endurance.running.stats.periodSessions')}
            value={String(volumeSummary.sessions)}
          />
          <StatCard
            icon={Activity}
            label={t('endurance.running.stats.periodActiveDays')}
            value={String(volumeSummary.activeDays)}
          />
          <StatCard
            icon={Heart}
            label={t('endurance.running.stats.fcMaxEst')}
            value={`${fcMax} bpm`}
            sub={t('endurance.running.stats.fcMaxEstHint')}
          />
        </div>
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-rose-300/90">
            {t('endurance.running.stats.hrZonesTitle')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {hrZonesLegend.map((z) => (
              <div
                key={z.zone}
                className="rounded-lg border border-[#0F4C5C]/40 bg-black/50 px-3 py-2 text-[11px]"
              >
                <div className="font-semibold text-white">{t(z.labelKey)}</div>
                <div className="mt-0.5 tabular-nums text-slate-400">
                  {z.pctMin}–{z.pctMax} % · {z.bounds?.min}–{z.bounds?.max} bpm
                </div>
              </div>
            ))}
          </div>
        </div>
        {hasKmChart ? (
          <DenseDailyLineChart
            seriesA={kmDailyChart}
            metaA={{ label: t('endurance.running.stats.axisKm'), color: '#38bdf8' }}
            valueFormatA={(v) => (Math.round(v * 100) / 100).toFixed(2)}
            yAxisLabel={t('endurance.running.stats.axisKm')}
            xAxisLabel={t('endurance.running.stats.axisDate')}
            height={180}
            emptyMessage={t('endurance.running.stats.noKmData')}
          />
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">{t('endurance.running.stats.noKmData')}</p>
        )}
      </section>

      {/* Bloc 2 — Cardio */}
      <section className={sectionClass}>
        <SectionHeader
          icon={Heart}
          iconClass="text-rose-400"
          title={t('endurance.running.stats.cardioTitle')}
          hint={t('endurance.running.stats.cardioHint')}
          period={cardioPeriod}
          onPeriodChange={setCardioPeriod}
        />
        <CoverageBanner coverage={cardioCoverage} t={t} />
        <div className="mb-4 flex flex-wrap gap-2">
          {CARDIO_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCardioFilter(f.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                cardioFilter === f.id
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100'
                  : 'border-[#0F4C5C]/50 bg-black text-teal-200/80 hover:border-teal-600/50'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        {cardioSeries.length > 0 ? (
          <>
            <SessionSeriesLineChart
              seriesA={cardioSeries.map((s) => ({
                date: s.date,
                value: s.avgHR || 0,
                label: s.label
              }))}
              seriesB={cardioSeries.map((s) => ({
                date: s.date,
                value: s.maxHR || 0
              }))}
              metaA={{ label: t('endurance.running.stats.avgHr'), color: '#f472b6' }}
              metaB={{ label: t('endurance.running.stats.maxHr'), color: '#fb7185' }}
              valueFormatA={(v) => `${Math.round(v)} bpm`}
              valueFormatB={(v) => `${Math.round(v)} bpm`}
              yAxisLabel={t('endurance.running.stats.axisBpm')}
              xAxisLabel={t('endurance.running.stats.axisSessionDate')}
              emptyMessage={t('endurance.running.stats.noHrData')}
              height={190}
            />
            <p className="mt-2 text-[11px] text-slate-500">
              {t('endurance.running.stats.cardioSeriesHint', {
                count: cardioSeries.length,
                withAvgHr: cardioCoverage.withAvgHr
              })}
            </p>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">{t('endurance.running.stats.noHrData')}</p>
        )}
      </section>

      {/* Bloc 3 — Progression EF */}
      <section className={`${sectionClass} border-emerald-500/35 ring-1 ring-emerald-500/15`}>
        <SectionHeader
          icon={TrendingUp}
          iconClass="text-emerald-400"
          title={t('endurance.running.stats.efTitle')}
          period={efPeriod}
          onPeriodChange={setEfPeriod}
        />
        <p className="mb-3 text-xs text-teal-600/90 leading-relaxed">
          {t('endurance.running.stats.efSubtitle', {
            min: EF_HR_PCT_MIN,
            max: EF_HR_PCT_MAX,
            fcMax
          })}
        </p>
        <p className="mb-4 text-[11px] text-slate-500">
          {t('endurance.running.stats.efCoverageHint', {
            efCount: efCoverage.efEligible,
            total: efCoverage.sessions,
            min: EF_HR_PCT_MIN,
            max: EF_HR_PCT_MAX
          })}
        </p>

        {efRows.length > 0 ? (
          <>
            <SessionSeriesLineChart
              seriesA={efRows.map((r) => ({
                date: r.date,
                value: r.pace,
                label: formatChartDateDayMonth(r.date)
              }))}
              metaA={{ label: t('endurance.running.stats.pace'), color: '#34d399' }}
              valueFormatA={(v) => formatPaceMinPerKm(v)}
              yAxisLabel={t('endurance.running.stats.axisPace')}
              xAxisLabel={t('endurance.running.stats.axisSessionDate')}
              height={210}
              emptyMessage={t('endurance.running.stats.noEfData')}
            />
            <p className="mb-3 mt-2 text-[11px] text-slate-500">
              {t('endurance.running.stats.efPaceChartHint')}
            </p>
            <div className="overflow-x-auto rounded-xl border border-[#0F4C5C]/40">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#0F4C5C]/40 text-xs uppercase tracking-wide text-teal-700">
                    <th className="px-4 py-2 font-medium">{t('endurance.running.stats.colDate')}</th>
                    <th className="px-4 py-2 font-medium">{t('endurance.running.stats.colAvgHr')}</th>
                    <th className="px-4 py-2 font-medium">{t('endurance.running.stats.colHrPct')}</th>
                    <th className="px-4 py-2 font-medium">{t('endurance.running.stats.colPace')}</th>
                    <th className="px-4 py-2 font-medium">{t('endurance.running.stats.colDist')}</th>
                  </tr>
                </thead>
                <tbody>
                  {efRows.map((r) => (
                    <tr key={`${r.date}_${r.session?.id || r.pace}`} className="border-b border-[#0F4C5C]/25 text-teal-100/90">
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.avgHR} bpm</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-400">
                        {r.hrPct != null ? `${Math.round(r.hrPct)} %` : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-200 tabular-nums">{r.paceStr}</td>
                      <td className="px-4 py-2.5 tabular-nums">{Math.round(r.dist * 10) / 10} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {efRows.length >= 2 && (
              <p className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
                {t('endurance.running.stats.efInsight', {
                  firstPace: efRows[0].paceStr,
                  firstHr: efRows[0].avgHR,
                  lastPace: efRows[efRows.length - 1].paceStr,
                  lastHr: efRows[efRows.length - 1].avgHR
                })}
              </p>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">{t('endurance.running.stats.noEfData')}</p>
        )}

        {efBonus && (
          <details className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/30 px-4 py-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-400">
              {t('endurance.running.stats.efficiencyBonusTitle')}
            </summary>
            <p className="mt-2 text-[11px] text-slate-500">{t('endurance.running.stats.efficiencyBonusHint')}</p>
            <p className="mt-2 text-sm text-slate-300 tabular-nums">
              {t('endurance.running.stats.efficiencyBonusValues', {
                first: efBonus.first,
                last: efBonus.last,
                delta: efBonus.delta >= 0 ? `+${efBonus.delta}` : String(efBonus.delta)
              })}
            </p>
          </details>
        )}
      </section>

      {/* Bloc 4 — Records */}
      <section className={sectionClass}>
        <SectionHeader
          icon={Trophy}
          iconClass="text-amber-400"
          title={t('endurance.running.stats.recordsTitle')}
          period={recordsPeriod}
          onPeriodChange={setRecordsPeriod}
        />
        <CoverageBanner coverage={recordsCoverage} t={t} />
        <div className="grid gap-4 sm:grid-cols-2">
          <RecordTile
            label={t('endurance.running.stats.record5k')}
            value={records.best5k ? formatPaceMinPerKm(records.best5k.pace) : '—'}
            meta={records.best5k ? formatDate(records.best5k.date) : t('endurance.running.stats.noRecord')}
          />
          <RecordTile
            label={t('endurance.running.stats.record10k')}
            value={records.best10k ? formatPaceMinPerKm(records.best10k.pace) : '—'}
            meta={records.best10k ? formatDate(records.best10k.date) : t('endurance.running.stats.noRecord')}
          />
          <RecordTile
            label={t('endurance.running.stats.recordLongest')}
            value={records.longest ? `${Math.round(records.longest.dist * 10) / 10} km` : '—'}
            meta={
              records.longest
                ? `${formatDate(records.longest.date)} · ${formatPaceMinPerKm(records.longest.pace)}`
                : t('endurance.running.stats.noRecord')
            }
          />
          <RecordTile
            label={t('endurance.running.stats.recordBestWeek')}
            value={records.bestWeek ? `${records.bestWeek.km} km` : '—'}
            meta={records.bestWeek ? records.bestWeek.week : t('endurance.running.stats.noRecord')}
          />
        </div>
        <p className="mt-4 flex items-start gap-2 text-[11px] text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('endurance.running.stats.recordsFootnote')}
        </p>
      </section>
    </div>
  );
};

function RecordTile({ label, value, meta }) {
  return (
    <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
      <div className="text-xs font-medium text-teal-700">{label}</div>
      <div className="mt-1 text-xl font-bold text-white tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{meta}</div>
    </div>
  );
}

export default RunningStatsPanel;
