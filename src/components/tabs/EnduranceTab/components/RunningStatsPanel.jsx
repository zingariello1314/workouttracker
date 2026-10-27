import React, { useMemo, useState } from 'react';
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

function StatCard({ label, value, sub }) {
  return (
    <div>
      <span className="lab">{label}</span>
      <b className="num">{value}</b>
      {sub ? <div className="s">{sub}</div> : null}
    </div>
  );
}

function CoverageBanner({ coverage, t }) {
  if (!coverage || coverage.sessions === 0) {
    return (
      <p className="note warn" style={{ marginBottom: 16 }}>
        {t('endurance.running.stats.noDataInPeriod')}
      </p>
    );
  }
  return (
    <p className="note" style={{ marginBottom: 16 }}>
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

function SectionHeader({ title, hint, period, onPeriodChange }) {
  const t = useTranslation();
  return (
    <div className="sec-h">
      <div>
        <h2>{title}</h2>
        {hint ? <p>{hint}</p> : null}
      </div>
      <div>
        <span className="lab">{t('endurance.running.stats.periodLabel')}</span>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <RunningTrainingInsightsPanel
        sessions={sessions}
        garminById={garminById}
        garminRunningKindByGarminId={garminRunningKindByGarminId}
      />
      {/* Bloc 1 — Volume */}
      <section>
        <SectionHeader
          title={t('endurance.running.stats.volumeTitle')}
          period={volumePeriod}
          onPeriodChange={setVolumePeriod}
        />
        <CoverageBanner coverage={volumeCoverage} t={t} />
        <div className="board">
          <StatCard
            label={t('endurance.running.stats.periodKmTotal')}
            value={`${volumeSummary.km} km`}
            sub={t('endurance.running.stats.withDistanceCount', { count: volumeSummary.withDistance })}
          />
          <StatCard
            label={t('endurance.running.stats.periodSessions')}
            value={String(volumeSummary.sessions)}
          />
          <StatCard
            label={t('endurance.running.stats.periodActiveDays')}
            value={String(volumeSummary.activeDays)}
          />
          <StatCard
            label={t('endurance.running.stats.fcMaxEst')}
            value={`${fcMax} bpm`}
            sub={t('endurance.running.stats.fcMaxEstHint')}
          />
        </div>
        <div className="zl" style={{ margin: '18px 0 8px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <span className="lab">{t('endurance.running.stats.hrZonesTitle')}</span>
          </div>
          {hrZonesLegend.map((z) => (
            <div key={z.zone}>
              <b>{t(z.labelKey)}</b>
              <p className="num">
                {z.pctMin}–{z.pctMax} % · {z.bounds?.min}–{z.bounds?.max} bpm
              </p>
            </div>
          ))}
        </div>
        {hasKmChart ? (
          <DenseDailyLineChart
            seriesA={kmDailyChart}
            metaA={{ label: t('endurance.running.stats.axisKm'), color: 'var(--accent)' }}
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
      <section>
        <SectionHeader
          title={t('endurance.running.stats.cardioTitle')}
          hint={t('endurance.running.stats.cardioHint')}
          period={cardioPeriod}
          onPeriodChange={setCardioPeriod}
        />
        <CoverageBanner coverage={cardioCoverage} t={t} />
        <div className="chips" style={{ marginBottom: 16 }}>
          {CARDIO_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={cardioFilter === f.id}
              onClick={() => setCardioFilter(f.id)}
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
              metaA={{ label: t('endurance.running.stats.avgHr'), color: 'var(--accent)' }}
              metaB={{ label: t('endurance.running.stats.maxHr'), color: 'var(--bone-2)' }}
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
      <section>
        <SectionHeader
          title={t('endurance.running.stats.efTitle')}
          hint={t('endurance.running.stats.efSubtitle', {
            min: EF_HR_PCT_MIN,
            max: EF_HR_PCT_MAX,
            fcMax
          })}
          period={efPeriod}
          onPeriodChange={setEfPeriod}
        />
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
              metaA={{ label: t('endurance.running.stats.pace'), color: 'var(--accent)' }}
              valueFormatA={(v) => formatPaceMinPerKm(v)}
              yAxisLabel={t('endurance.running.stats.axisPace')}
              xAxisLabel={t('endurance.running.stats.axisSessionDate')}
              height={210}
              emptyMessage={t('endurance.running.stats.noEfData')}
            />
            <p className="mb-3 mt-2 text-[11px] text-slate-500">
              {t('endurance.running.stats.efPaceChartHint')}
            </p>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>{t('endurance.running.stats.colDate')}</th>
                    <th>{t('endurance.running.stats.colAvgHr')}</th>
                    <th>{t('endurance.running.stats.colHrPct')}</th>
                    <th>{t('endurance.running.stats.colPace')}</th>
                    <th>{t('endurance.running.stats.colDist')}</th>
                  </tr>
                </thead>
                <tbody>
                  {efRows.map((r) => (
                    <tr key={`${r.date}_${r.session?.id || r.pace}`}>
                      <td>{formatDate(r.date)}</td>
                      <td className="num">{r.avgHR} bpm</td>
                      <td className="num">{r.hrPct != null ? `${Math.round(r.hrPct)} %` : '—'}</td>
                      <td className="num">{r.paceStr}</td>
                      <td className="num">{Math.round(r.dist * 10) / 10} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {efRows.length >= 2 && (
              <p className="note" style={{ marginTop: 16, borderStyle: 'solid', borderColor: 'var(--t-cl)', color: 'var(--bone)' }}>
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
      <section>
        <SectionHeader
          title={t('endurance.running.stats.recordsTitle')}
          period={recordsPeriod}
          onPeriodChange={setRecordsPeriod}
        />
        <CoverageBanner coverage={recordsCoverage} t={t} />
        <div className="plq">
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
        <p className="tiny" style={{ marginTop: 14 }}>
          {t('endurance.running.stats.recordsFootnote')}
        </p>
      </section>
    </div>
  );
};

function RecordTile({ label, value, meta }) {
  return (
    <div>
      <div className="l">{label}</div>
      <b className="num">{value}</b>
      <p>{meta}</p>
    </div>
  );
}

export default RunningStatsPanel;
