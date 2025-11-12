import React from 'react';
import { useGarminChartSelectors } from '../../hooks/useGarminChartSelectors';
import { LazyChartWrapper } from '../../hooks/useLazyChart';
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
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '100px' }}>
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
          </LazyChartWrapper>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminHeartRateChart
              colors={colors}
              precomputed={chartData.heartRateTrend}
              selector={selectors?.heartRate ?? null}
            />
          </LazyChartWrapper>
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminBodyBatteryChart
              colors={colors}
              precomputed={chartData.bodyBatteryTrend}
              selector={selectors?.bodyBattery ?? null}
            />
          </LazyChartWrapper>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminStressChart
              colors={colors}
              precomputed={chartData.stressTrend}
              selector={selectors?.stress ?? null}
            />
          </LazyChartWrapper>
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminSleepChart
              colors={colors}
              precomputed={chartData.sleepTrend}
              selector={selectors?.sleep ?? null}
            />
          </LazyChartWrapper>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminRespirationChart
              colors={colors}
              precomputed={chartData.respirationTrend}
              selector={selectors?.respiration ?? null}
            />
          </LazyChartWrapper>
          <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
            <GarminActivityHeatmap
              precomputed={chartData.activityHeatmap}
              selector={selectors?.activity ?? null}
            />
          </LazyChartWrapper>
        </div>
        <LazyChartWrapper fallback={fallback} lazyOptions={{ rootMargin: '50px' }}>
          <GarminCorrelationCharts
            colors={colors}
            precomputed={chartData.correlation}
            selector={selectors ?? null}
          />
        </LazyChartWrapper>
      </React.Suspense>
    </div>
  );
};

export default ChartsSection;
