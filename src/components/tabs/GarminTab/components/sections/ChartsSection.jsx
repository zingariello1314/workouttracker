import React from 'react';
import { useGarminChartSelectors } from '../../hooks/useGarminChartSelectors';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

const GarminHeartRateTimeSeriesChart = React.lazy(() => import('../charts/GarminHeartRateTimeSeriesChart'));
const GarminHeartRateChart = React.lazy(() => import('../charts/GarminHeartRateChart'));
const GarminBodyBatteryChart = React.lazy(() => import('../charts/GarminBodyBatteryChart'));
const GarminStressChart = React.lazy(() => import('../charts/GarminStressChart'));
const GarminSleepChart = React.lazy(() => import('../charts/GarminSleepChart'));
const GarminRespirationChart = React.lazy(() => import('../charts/GarminRespirationChart'));
const GarminActivityHeatmap = React.lazy(() => import('../charts/GarminActivityHeatmap'));
const GarminCorrelationCharts = React.lazy(() => import('../charts/GarminCorrelationCharts'));

const ChartsSection = ({ fallback = null }) => {
  useUIMetricsTelemetry('ChartsSection');

  const {
    dailyMetrics,
    selectedDate,
    selectedDailyMetrics,
    activitiesByType,
    periodFilter,
    customRange,
    colors,
    chartData,
    selectors
  } = useGarminChartSelectors();

  const hasSelectedMetrics = Boolean(selectedDate && selectedDailyMetrics);

  return (
    <div role="tabpanel" id="garmin-charts-panel" aria-labelledby="charts-tab" className="space-y-6">
      <React.Suspense fallback={fallback}>
        {hasSelectedMetrics && (
          <GarminHeartRateTimeSeriesChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            activities={activitiesByType}
            precomputed={chartData.heartRateTimeSeries}
            selector={selectors?.heartRate?.timeSeries ? selectors.heartRate : null}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminHeartRateChart
            colors={colors}
            precomputed={chartData.heartRateTrend}
            selector={selectors?.heartRate ?? null}
          />
          <GarminBodyBatteryChart
            colors={colors}
            precomputed={chartData.bodyBatteryTrend}
            selector={selectors?.bodyBattery ?? null}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminStressChart
            colors={colors}
            precomputed={chartData.stressTrend}
            selector={selectors?.stress ?? null}
          />
          <GarminSleepChart
            colors={colors}
            precomputed={chartData.sleepTrend}
            selector={selectors?.sleep ?? null}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminRespirationChart
            colors={colors}
            precomputed={chartData.respirationTrend}
            selector={selectors?.respiration ?? null}
          />
          <GarminActivityHeatmap
            precomputed={chartData.activityHeatmap}
            selector={selectors?.activity ?? null}
          />
        </div>
        <GarminCorrelationCharts
          colors={colors}
          precomputed={chartData.correlation}
          selector={selectors ?? null}
        />
      </React.Suspense>
    </div>
  );
};

export default ChartsSection;
