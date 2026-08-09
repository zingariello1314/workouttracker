import React, { useMemo } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useTranslation } from '../../../utils/translations';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import {
  buildRecapPeriodCalendarAnalytics,
  buildMonthlyMetricSeries,
  formatRecapCalendarMetricValue
} from '../../../utils/sport/recapCalendarPeriodAnalytics';

const METRIC_LABEL_KEYS = {
  totalReps: 'calendar.stats.monthReps',
  runningKm: 'calendar.stats.monthRunningKm',
  runningMinutes: 'calendar.stats.monthRunningTime',
  otherExerciseMinutes: 'calendar.stats.monthOtherExerciseTime',
  totalMinutes: 'calendar.stats.monthTotalTime',
  totalKg: 'calendar.stats.monthKgLifted',
  longestStreak: 'calendar.stats.monthLongestStreak',
  activeKcal: 'calendar.stats.monthActiveKcal',
  trainingDays: 'calendar.stats.monthTrainingDays'
};

const TREND_METRICS = [
  'totalReps',
  'runningKm',
  'totalMinutes',
  'totalKg',
  'trainingDays',
  'activeKcal'
];

const chartCardClass =
  'rounded-xl border border-[#0F4C5C]/45 bg-gradient-to-b from-slate-950/70 to-black p-3';

export default function RecapCalendarMonthTrendCharts({
  period,
  periodWindow,
  garminData = null,
  chartHeight = 150
}) {
  const t = useTranslation();
  const { getCurrentData, data, getExerciseNameById } = useWorkout();

  const months = useMemo(() => {
    const snap = getCurrentData();
    if (!periodWindow?.start || !periodWindow?.end) return [];
    const model = buildRecapPeriodCalendarAnalytics({
      workoutData: snap,
      garminData,
      periodWindow,
      period,
      getExerciseNameById
    });
    return model?.months || [];
  }, [data, getCurrentData, garminData, period, periodWindow, getExerciseNameById]);

  if (months.length < 2) {
    return (
      <section className={chartCardClass}>
        <p className="text-xs text-slate-500">
          {t(
            'recap.tendances.needTwoMonths',
            'Élargis la période (2 mois calendaires ou plus) pour voir l’évolution mensuelle.'
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-teal-100">
          {t('recap.tendances.calendarMetrics', 'Évolution mensuelle (comme le calendrier)')}
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          {t(
            'recap.tendances.calendarMetricsHint',
            'Une point par mois calendaire sur la plage sélectionnée — mêmes indicateurs que la vue année Sport.'
          )}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {TREND_METRICS.map((metricKey) => {
          const series = buildMonthlyMetricSeries(months, metricKey);
          const hasData = series.some((p) => p.value > 0);
          if (!hasData) return null;
          const title = t(METRIC_LABEL_KEYS[metricKey]);
          return (
            <div key={metricKey} className={chartCardClass}>
              <h3 className="mb-2 text-xs font-medium text-slate-200">{title}</h3>
              <DenseDailyLineChart
                seriesA={series}
                metaA={{ label: title, color: '#14b8a6' }}
                height={chartHeight}
                valueFormatA={(v) => formatRecapCalendarMetricValue(metricKey, v)}
                emptyMessage={t('recap.tendances.noData', 'Pas de données.')}
                xAxisLabel={t('recap.tendances.axisMonth', 'Mois')}
                interactive
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
