import React from 'react';
import { useGarminChartSelectors } from '../../hooks/useGarminChartSelectors';

const GarminHeartRateTimeSeriesChart = React.lazy(() => import('../charts/GarminHeartRateTimeSeriesChart'));
const GarminHeartRateChart = React.lazy(() => import('../charts/GarminHeartRateChart'));
const GarminBodyBatteryChart = React.lazy(() => import('../charts/GarminBodyBatteryChart'));
const GarminStressChart = React.lazy(() => import('../charts/GarminStressChart'));
const GarminSleepChart = React.lazy(() => import('../charts/GarminSleepChart'));
const GarminRespirationChart = React.lazy(() => import('../charts/GarminRespirationChart'));
const GarminActivityHeatmap = React.lazy(() => import('../charts/GarminActivityHeatmap'));
const GarminCorrelationCharts = React.lazy(() => import('../charts/GarminCorrelationCharts'));

const ChartsSection = ({ fallback = null }) => {
  const {
    dailyMetrics,
    selectedDate,
    selectedDailyMetrics,
    activitiesByType,
    periodFilter,
    customRange,
    colors,
    chartData
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
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminHeartRateChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.heartRateTrend}
          />
          <GarminBodyBatteryChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.bodyBatteryTrend}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminStressChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.stressTrend}
          />
          <GarminSleepChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.sleepTrend}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarminRespirationChart
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.respirationTrend}
          />
          <GarminActivityHeatmap
            activities={activitiesByType}
            dailyMetrics={dailyMetrics}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customRange?.start}
            customEndDate={customRange?.end}
            colors={colors}
            precomputed={chartData.activityHeatmap}
          />
        </div>
        <GarminCorrelationCharts
          dailyMetrics={dailyMetrics}
          selectedDate={selectedDate}
          periodFilter={periodFilter}
          customStartDate={customRange?.start}
          customEndDate={customRange?.end}
          colors={colors}
          precomputed={chartData.correlation}
        />
      </React.Suspense>
    </div>
  );
};

export default ChartsSection;

